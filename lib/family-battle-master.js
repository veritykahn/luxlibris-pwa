// lib/family-battle-master.js
// MASTER FAMILY BATTLE SYSTEM - Single source of truth for all battle operations
// FIXED VERSION with correct history tracking

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  runTransaction,
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// CONSTANTS
// ============================================================================

const XP_VALUES = {
  BASE_WIN: 25,
  MVP_BONUS: 25
};

// ============================================================================
// DATE & WEEK UTILITIES
// ============================================================================

/**
 * Format date as YYYY-MM-DD string
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get program week number (June 1 - May 31)
 */
const getProgramWeekNumber = (date = new Date()) => {
  const currentYear = date.getFullYear();
  const june1 = new Date(currentYear, 5, 1); // June 1
  
  // If before June, we're in the previous program year
  const programStart = date >= june1 ? june1 : new Date(currentYear - 1, 5, 1);
  
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksDiff = Math.floor((date - programStart) / msPerWeek);
  
  return Math.max(1, Math.min(52, weeksDiff + 1));
};

/**
 * Get current battle week details (Monday-Saturday competition)
 */
export const getCurrentBattleWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Sunday (0): Show last week's results
  if (dayOfWeek === 0) {
    const saturday = new Date(today);
    saturday.setDate(saturday.getDate() - 1);
    saturday.setHours(23, 59, 59, 999);
    
    const monday = new Date(saturday);
    monday.setDate(monday.getDate() - 5);
    monday.setHours(0, 0, 0, 0);
    
    return {
      number: getProgramWeekNumber(monday),
      startDate: formatDate(monday),
      endDate: formatDate(saturday),
      isSunday: true,
      isNewWeek: false
    };
  }
  
  // Monday-Saturday: Current competition week
  const monday = new Date(today);
  const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(monday.getDate() + daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  
  const saturday = new Date(monday);
  saturday.setDate(saturday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);
  
  return {
    number: getProgramWeekNumber(monday),
    startDate: formatDate(monday),
    endDate: formatDate(saturday),
    isSunday: false,
    isNewWeek: dayOfWeek === 1
  };
};

// ============================================================================
// READING DATA COLLECTORS
// ============================================================================

/**
 * Get student's reading minutes for the week
 */
const getStudentMinutes = async (student, week) => {
  try {
    const sessionsRef = collection(
      db,
      `entities/${student.entityId}/schools/${student.schoolId}/students/${student.studentId || student.id}/readingSessions`
    );
    
    const weekQuery = query(
      sessionsRef,
      where('date', '>=', week.startDate),
      where('date', '<=', week.endDate)
    );
    
    const snapshot = await getDocs(weekQuery);
    let total = 0;
    
    snapshot.forEach(doc => {
      const session = doc.data();
      if (session.duration > 0) {
        total += session.duration;
      }
    });
    
    return total;
  } catch (error) {
    console.error(`Error getting minutes for student:`, error);
    return 0;
  }
};

/**
 * Get parent's reading minutes for the week
 */
const getParentMinutes = async (parentId, week) => {
  try {
    const sessionsRef = collection(db, `parents/${parentId}/readingSessions`);
    
    const weekQuery = query(
      sessionsRef,
      where('date', '>=', week.startDate),
      where('date', '<=', week.endDate)
    );
    
    const snapshot = await getDocs(weekQuery);
    let total = 0;
    
    snapshot.forEach(doc => {
      const session = doc.data();
      if (session.duration > 0) {
        total += session.duration;
      }
    });
    
    return total;
  } catch (error) {
    console.error(`Error getting minutes for parent ${parentId}:`, error);
    return 0;
  }
};

/**
 * Calculate week totals for both teams
 */
const calculateWeekTotals = async (familyData, week) => {
  // Get children's minutes
  const linkedStudents = familyData.linkedStudents || [];
  const studentBreakdown = {};
  let childrenTotal = 0;
  
  for (const student of linkedStudents) {
    const minutes = await getStudentMinutes(student, week);
    studentBreakdown[student.studentId || student.id] = {
      name: student.studentName || student.firstName || 'Student',
      minutes,
      entityId: student.entityId,
      schoolId: student.schoolId
    };
    childrenTotal += minutes;
  }
  
  // Get parents' minutes
  const linkedParents = familyData.linkedParents || [];
  const parentBreakdown = {};
  let parentsTotal = 0;
  
  for (const parentId of linkedParents) {
    const minutes = await getParentMinutes(parentId, week);
    
    // Get parent's name
    let parentName = 'Parent';
    try {
      const parentDoc = await getDoc(doc(db, 'parents', parentId));
      if (parentDoc.exists()) {
        const data = parentDoc.data();
        parentName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Parent';
      }
    } catch (e) {
      console.error('Error getting parent name:', e);
    }
    
    parentBreakdown[parentId] = {
      name: parentName,
      minutes
    };
    parentsTotal += minutes;
  }
  
  return {
    children: {
      total: childrenTotal,
      breakdown: studentBreakdown
    },
    parents: {
      total: parentsTotal,
      breakdown: parentBreakdown
    }
  };
};

// ============================================================================
// ARCHIVE & HISTORY MANAGEMENT - FIXED VERSION
// ============================================================================

/**
 * Update winning streak
 */
const updateStreak = (currentStreak, winner) => {
  if (winner === 'tie') {
    return { team: null, count: 0 };
  }
  
  if (!currentStreak || currentStreak.team !== winner) {
    return { team: winner, count: 1 };
  }
  
  return { team: winner, count: currentStreak.count + 1 };
};

/**
 * Archive completed week and update history - FIXED VERSION
 */
const archiveCompletedWeek = async (transaction, familyRef, familyData, weekData, existingHistory = {}) => {
  console.log('📦 Archiving completed week', weekData.number);
  
  // VALIDATION: Ensure we have valid totals
  const childrenTotal = weekData.children?.total || 0;
  const parentsTotal = weekData.parents?.total || 0;
  
  // Determine winner based on ACTUAL TOTALS from weekData
  let winner;
  let margin = Math.abs(childrenTotal - parentsTotal);
  
  if (childrenTotal > parentsTotal) {
    winner = 'children';
  } else if (parentsTotal > childrenTotal) {
    winner = 'parents';
  } else {
    winner = 'tie';
    margin = 0;
  }
  
  // Update history statistics with CORRECT winner
  const history = {
    totalBattles: (existingHistory.totalBattles || 0) + 1,
    childrenWins: (existingHistory.childrenWins || 0) + (winner === 'children' ? 1 : 0),
    parentWins: (existingHistory.parentWins || 0) + (winner === 'parents' ? 1 : 0),
    ties: (existingHistory.ties || 0) + (winner === 'tie' ? 1 : 0),
    currentStreak: updateStreak(existingHistory.currentStreak, winner),
    recentBattles: [
      {
        weekNumber: weekData.number,
        winner: winner, // Use the CORRECTLY determined winner
        margin: margin,
        childrenTotal: childrenTotal, // Use actual totals
        parentsTotal: parentsTotal,   // Use actual totals
        startDate: weekData.startDate,
        endDate: weekData.endDate,
        timestamp: new Date().toISOString()
      },
      ...(existingHistory.recentBattles || [])
    ].slice(0, 10), // Keep last 10 battles
    xpAwarded: existingHistory.xpAwarded || {}
  };
  
  // Award XP if children won
  if (winner === 'children' && childrenTotal > 0) {
    const xpResults = await awardXPToChildren(transaction, weekData, familyData);
    history.xpAwarded[`week${weekData.number}`] = xpResults;
  }
  
  // Create completed week data with winner
  const completedWeek = {
    ...weekData,
    winner,
    finalStatus: winner === 'children' ? 
      `🏆 Kids won by ${margin} minutes!` :
      winner === 'parents' ? 
      `👑 Parents won by ${margin} minutes!` :
      '🤝 It was a tie!'
  };
  
  // Update family document
  transaction.update(familyRef, {
    'familyBattle.completedWeek': completedWeek,
    'familyBattle.history': history
  });
  
  console.log('✅ Week archived successfully with winner:', winner);
};

// ============================================================================
// XP MANAGEMENT
// ============================================================================

/**
 * Award XP to children when they win
 */
const awardXPToChildren = async (transaction, weekData, familyData) => {
  console.log('🎮 Awarding XP to winning children');
  
  const xpResults = {};
  
  // Find MVP (child with most minutes)
  let mvpId = null;
  let maxMinutes = 0;
  
  Object.entries(weekData.children.breakdown).forEach(([id, data]) => {
    if (data.minutes > maxMinutes) {
      maxMinutes = data.minutes;
      mvpId = id;
    }
  });
  
  // Award XP to each child
  for (const [studentId, data] of Object.entries(weekData.children.breakdown)) {
    const isMVP = studentId === mvpId;
    const xpAmount = XP_VALUES.BASE_WIN + (isMVP ? XP_VALUES.MVP_BONUS : 0);
    
    xpResults[studentId] = {
      name: data.name,
      amount: xpAmount,
      isMVP,
      awarded: false
    };
    
    // Update student document
    try {
      const studentRef = doc(
        db,
        `entities/${data.entityId}/schools/${data.schoolId}/students/${studentId}`
      );
      
      const studentDoc = await transaction.get(studentRef);
      if (studentDoc.exists()) {
        const currentData = studentDoc.data();
        
        // Check if already awarded for this week
        if (!currentData[`familyBattleWeek${weekData.number}XPAwarded`]) {
          transaction.update(studentRef, {
            totalXP: (currentData.totalXP || 0) + xpAmount,
            [`familyBattleWeek${weekData.number}XPAwarded`]: true,
            [`familyBattleWeek${weekData.number}MVP`]: isMVP,
            lastFamilyBattleXP: xpAmount,
            lastFamilyBattleWeek: weekData.number
          });
          
          // Add to XP history
          await addDoc(collection(db, `entities/${data.entityId}/schools/${data.schoolId}/students/${studentId}/xpHistory`), {
            timestamp: serverTimestamp(),
            type: 'family_battle',
            amount: xpAmount,
            details: {
              weekNumber: weekData.number,
              isMVP,
              source: 'family-battle-master'
            },
            previousTotal: currentData.totalXP || 0,
            newTotal: (currentData.totalXP || 0) + xpAmount
          });
          
          xpResults[studentId].awarded = true;
          console.log(`✅ Awarded ${xpAmount} XP to ${data.name} (MVP: ${isMVP})`);
        }
      }
    } catch (error) {
      console.error(`Error awarding XP to ${studentId}:`, error);
      xpResults[studentId].error = error.message;
    }
  }
  
  return xpResults;
};

// ============================================================================
// MASTER SYNC FUNCTION - THE HEART OF THE SYSTEM (FIXED)
// ============================================================================

/**
 * Sync family battle data - call this from both parent and student views
 * FIXED VERSION with proper winner validation
 */
export const syncFamilyBattle = async (familyId) => {
  try {
    console.log('🔄 Master Sync Starting for family:', familyId);
    
    const week = getCurrentBattleWeek();
    const familyRef = doc(db, 'families', familyId);
    
    return await runTransaction(db, async (transaction) => {
      const familyDoc = await transaction.get(familyRef);
      
      if (!familyDoc.exists()) {
        throw new Error('Family document not found');
      }
      
      const familyData = familyDoc.data();
const battle = familyData.familyBattle || {};

// Guard clause - Prevent processing if not enabled
if (!battle.enabled) {
  console.log('⚠️ Battle sync blocked - family battles not enabled for:', familyId);
  return { 
    enabled: false, 
    reason: 'Family battle not enabled by parents',
    history: battle.history || {}
  };
}

// SUNDAY: Return completed week results (day of rest)
if (week.isSunday) {
        console.log('🙏 Sunday - Returning completed week results');
        
        const completedWeek = battle.lastCompletedWeek || battle.currentWeek || null;
        
        if (!completedWeek) {
  return {
    enabled: battle.enabled || false,
    isResultsDay: true,
    noDataAvailable: true,
    message: 'No battle data for this week. New battle starts tomorrow!',
    history: battle.history || {}
  };
}

// Check if there's actual battle data in either format
const hasNestedData = (completedWeek.children?.total || 0) > 0 || (completedWeek.parents?.total || 0) > 0;
const hasFlatData = (completedWeek.childrenMinutes || 0) > 0 || (completedWeek.parentMinutes || 0) > 0;

if (!hasNestedData && !hasFlatData) {
  return {
    enabled: battle.enabled || false,
    isResultsDay: true,
    noDataAvailable: true,
    message: 'No battle data for this week. New battle starts tomorrow!',
    history: battle.history || {}
  };
}
        
        return {
          enabled: true,
          ...completedWeek,
          isResultsDay: true,
          history: battle.history || {}
        };
      }
      
      // MONDAY: Check if we need to start a new week
      if (week.isNewWeek) {
        const currentWeekNumber = battle.currentWeek?.number;
        
        if (currentWeekNumber !== week.number) {
          console.log('📅 Monday - Starting new week', week.number);
          
          // Archive last week if it exists and has data
if (battle.currentWeek && (
  (battle.currentWeek.children?.total || 0) > 0 || 
  (battle.currentWeek.parents?.total || 0) > 0 ||
  (battle.currentWeek.childrenMinutes || 0) > 0 || 
  (battle.currentWeek.parentMinutes || 0) > 0
)) {            // Ensure we have the latest data before archiving
            const latestTotals = await calculateWeekTotals(familyData, {
              startDate: battle.currentWeek.startDate,
              endDate: battle.currentWeek.endDate
            });
            
            // Use the latest totals for archiving
            const weekToArchive = {
              ...battle.currentWeek,
              children: latestTotals.children,
              parents: latestTotals.parents
            };
            
            await archiveCompletedWeek(transaction, familyRef, familyData, weekToArchive, battle.history);
          }
          
          // Initialize new week
          const newWeek = {
            number: week.number,
            startDate: week.startDate,
            endDate: week.endDate,
            children: { total: 0, breakdown: {} },
            parents: { total: 0, breakdown: {} },
            leader: 'tie',
            margin: 0,
            status: 'New week! The battle begins!',
            lastSync: serverTimestamp()
          };
          
          transaction.update(familyRef, {
            'familyBattle.currentWeek': newWeek,
            'familyBattle.completedWeek': battle.currentWeek || null
          });
          
          return {
            enabled: true,
            ...newWeek,
            isResultsDay: false,
            history: battle.history || {}
          };
        }
      }
      
      // TUESDAY-SATURDAY: Normal sync - calculate current totals
      console.log('⚔️ Battle week in progress - syncing data');
      
      const totals = await calculateWeekTotals(familyData, week);
      
      // Determine leader and margin with validation
      const leader = totals.children.total > totals.parents.total ? 'children' :
                    totals.parents.total > totals.children.total ? 'parents' : 'tie';
      const margin = Math.abs(totals.children.total - totals.parents.total);
      
      // Create battle status message
      let status = '';
      if (totals.children.total === 0 && totals.parents.total === 0) {
        status = 'The battle begins! Start reading to take the lead!';
      } else if (leader === 'tie') {
        status = '⚖️ Tied up! Every minute counts!';
      } else if (leader === 'children') {
        status = `🔥 Kids leading by ${margin} minute${margin !== 1 ? 's' : ''}!`;
      } else {
        status = `💪 Parents ahead by ${margin} minute${margin !== 1 ? 's' : ''}!`;
      }
      
      // Update current week
      const updatedWeek = {
        number: week.number,
        startDate: week.startDate,
        endDate: week.endDate,
        children: totals.children,
        parents: totals.parents,
        leader,
        margin,
        status,
        lastSync: serverTimestamp()
      };
      
      transaction.update(familyRef, {
        'familyBattle.currentWeek': updatedWeek
      });
      
      return {
        enabled: true,
        ...updatedWeek,
        isResultsDay: false,
        history: battle.history || {}
      };
    });
    
  } catch (error) {
    console.error('❌ Master Sync Error:', error);
    throw error;
  }
};

// ============================================================================
// GET BATTLE DATA - UNIFIED FOR ALL USERS
// ============================================================================

/**
 * Get current battle data - same function for parents and students
 */
export const getBattleData = async (familyId) => {
  try {
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    
    if (!familyDoc.exists()) {
      return { enabled: false, error: 'Family not found' };
    }
    
    const familyData = familyDoc.data();
    const battle = familyData.familyBattle;
    
    if (!battle?.enabled) {
      return { enabled: false };
    }
    
    const week = getCurrentBattleWeek();
    
  // Sunday: Return completed week
if (week.isSunday) {
  const completedWeek = battle.lastCompletedWeek || battle.completedWeek || battle.currentWeek;
  
  if (!completedWeek) {
    return {
      enabled: true,
      isResultsDay: true,
      noDataAvailable: true,
      history: battle.history || {}
    };
  }

  // Check if this is a properly completed battle (regardless of minutes)
  const isCompletedBattle = completedWeek.completed === true || 
                           completedWeek.winner !== undefined ||
                           completedWeek.number !== undefined;

  if (!isCompletedBattle) {
    return {
      enabled: true,
      isResultsDay: true,
      noDataAvailable: true,
      history: battle.history || {}
    };
  }
  
  // Return the completed battle data (including 0-0 ties!)
  return {
    enabled: true,
    ...completedWeek,
    isResultsDay: true,
    history: battle.history || {}
  };
}
    
    // Weekday: Return current week
    return {
      enabled: true,
      ...battle.currentWeek || {},
      isResultsDay: false,
      history: battle.history || {}
    };
    
  } catch (error) {
    console.error('Error getting battle data:', error);
    return { enabled: false, error: error.message };
  }
};

// ============================================================================
// INITIALIZATION & SETUP
// ============================================================================

/**
 * Initialize family battle for a family
 */
export const initializeFamilyBattle = async (familyId, parentId) => {
  try {
    const familyRef = doc(db, 'families', familyId);
    const week = getCurrentBattleWeek();
    
    // Initialize battle structure
    const battleInit = {
      enabled: true,
      currentWeek: {
        number: week.number,
        startDate: week.startDate,
        endDate: week.endDate,
        children: { total: 0, breakdown: {} },
        parents: { total: 0, breakdown: {} },
        leader: 'tie',
        margin: 0,
        status: 'Battle arena opened! Let the games begin!',
        lastSync: serverTimestamp()
      },
      completedWeek: null,
      history: {
        totalBattles: 0,
        childrenWins: 0,
        parentWins: 0,
        ties: 0,
        currentStreak: { team: null, count: 0 },
        recentBattles: [],
        xpAwarded: {}
      },
      createdAt: serverTimestamp(),
      createdBy: parentId
    };
    
    await updateDoc(familyRef, {
      familyBattle: battleInit
    });
    
    console.log('✅ Family battle initialized');
    return battleInit;
    
  } catch (error) {
    console.error('Error initializing family battle:', error);
    throw error;
  }
};

/**
 * Enable family battle for students
 */
export const enableFamilyBattleForStudents = async (familyId, students) => {
  try {
    const batch = writeBatch(db);
    
    for (const student of students) {
      const studentRef = doc(
        db,
        `entities/${student.entityId}/schools/${student.schoolId}/students/${student.id}`
      );
      
      batch.update(studentRef, {
        'familyBattleSettings.enabled': true,
        'familyBattleSettings.familyId': familyId,
        'familyBattleSettings.enabledAt': serverTimestamp()
      });
    }
    
    await batch.commit();
    console.log(`✅ Enabled family battle for ${students.length} students`);
    
  } catch (error) {
    console.error('Error enabling family battle for students:', error);
    throw error;
  }
};

// ============================================================================
// STUDENT-SPECIFIC HELPERS
// ============================================================================

/**
 * Check if student has family battle enabled and get the family ID
 */
export const getStudentFamilyBattleStatus = async (studentData) => {
  try {
    // First try to get familyId from multiple possible locations
    const familyId = studentData.familyBattleSettings?.familyId ||
                    studentData.familyBattleSettings?.parentFamilyId ||
                    studentData.familyId;
    
    if (!familyId) {
      return { enabled: false, reason: 'No family linked' };
    }
    
    // Verify family exists and has battle enabled
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    
    if (!familyDoc.exists()) {
      return { enabled: false, reason: 'Family not found' };
    }
    
    const familyData = familyDoc.data();
    
    if (!familyData.familyBattle?.enabled) {
      return { enabled: false, reason: 'Family battle not enabled' };
    }
    
    return {
      enabled: true,
      familyId
    };
    
  } catch (error) {
    console.error('Error checking student battle status:', error);
    return { enabled: false, reason: 'Error checking status' };
  }
};

/**
 * Get parent victories for bragging rights modal
 */
export const getParentVictories = async (familyId) => {
  try {
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    
    if (!familyDoc.exists()) {
      return [];
    }
    
    const battle = familyDoc.data().familyBattle;
    if (!battle?.history) {
      return [];
    }
    
    // Get parent victories from recent battles
    const parentVictories = battle.history.recentBattles
      .filter(b => b.winner === 'parents')
      .map((battle, index, arr) => ({
        ...battle,
        week: battle.weekNumber,
        parentMinutes: battle.parentsTotal,
        childrenMinutes: battle.childrenTotal,
        victoryNumber: arr.length - index // Count from total down
      }));
    
    return parentVictories;
  } catch (error) {
    console.error('Error getting parent victories:', error);
    return [];
  }
};

// ============================================================================
// EXPORT EVERYTHING
// ============================================================================

export default {
  // Core functions
  getCurrentBattleWeek,
  syncFamilyBattle,
  getBattleData,
  
  // Setup functions
  initializeFamilyBattle,
  enableFamilyBattleForStudents,
  
  // Student helpers
  getStudentFamilyBattleStatus,
  getParentVictories,
  
  // Constants
  XP_VALUES
};