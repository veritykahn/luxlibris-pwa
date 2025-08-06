// lib/family-battle-sync.js - FIXED: Checks ALL parents for reading sessions

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  getProgramWeekStart, 
  getLocalDateString, 
  getProgramWeekNumber 
} from './family-battle-system';

// ============================================================================
// INLINE XP AWARDING (to avoid circular dependency)
// ============================================================================

const awardXPToStudents = async (familyId, weekNumber, studentBreakdown, linkedStudents) => {
  try {
    console.log('🎮 Awarding XP for family battle victory...');
    
    // Find MVP
    let mvpId = null;
    let maxMinutes = 0;
    Object.entries(studentBreakdown).forEach(([id, data]) => {
      if ((data.minutes || 0) > maxMinutes) {
        maxMinutes = data.minutes || 0;
        mvpId = id;
      }
    });
    
    // Award XP to each student
    for (const student of linkedStudents) {
      try {
        const isMVP = student.id === mvpId;
        const xpToAward = 25 + (isMVP ? 25 : 0); // 25 base + 25 MVP bonus
        
        console.log(`📝 Awarding ${xpToAward} XP to ${student.firstName || student.name} ${isMVP ? '(MVP)' : ''}`);
        
        // Update student document with XP
        const studentRef = doc(
          db, 
          `entities/${student.entityId}/schools/${student.schoolId}/students/${student.id}`
        );
        
        const studentDoc = await getDoc(studentRef);
        if (studentDoc.exists()) {
          const currentData = studentDoc.data();
          await updateDoc(studentRef, {
            weeklyXP: (currentData.weeklyXP || 0) + xpToAward,
            totalXP: (currentData.totalXP || 0) + xpToAward,
            'familyBattleHistory.lastVictoryWeek': weekNumber,
            'familyBattleHistory.lastVictoryXP': xpToAward,
            'familyBattleHistory.totalVictories': (currentData.familyBattleHistory?.totalVictories || 0) + 1,
            lastUpdated: serverTimestamp()
          });
          console.log(`✅ ${xpToAward} XP awarded to ${student.firstName || student.name}`);
        }
      } catch (error) {
        console.error(`❌ Error awarding XP to student ${student.id}:`, error);
      }
    }
    
    // Store XP awards in family document
    const familyRef = doc(db, 'families', familyId);
    await updateDoc(familyRef, {
      [`familyBattleHistory.week${weekNumber}XPAwarded`]: true,
      [`familyBattleHistory.week${weekNumber}MVP`]: mvpId,
      'familyBattleHistory.lastXPAwardDate': serverTimestamp()
    });
    
    console.log('✅ All XP awards complete');
  } catch (error) {
    console.error('❌ Error in XP award process:', error);
  }
};

// ============================================================================
// REAL-TIME DATA SYNCHRONIZATION
// ============================================================================

/**
 * FIXED: Now checks ALL parents in linkedParents array for reading sessions
 * Ensure parent and student views show identical data
 */
export const syncFamilyBattleData = async (familyId, linkedStudents) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for sync');
    }
    
    const today = new Date();
    const weekStart = getProgramWeekStart(today);
    const weekStr = getLocalDateString(weekStart);
    
    console.log('🔄 SYNCING battle data for family:', familyId, 'week:', weekStr);
    
    // Get the family document first
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      throw new Error('Family document not found');
    }
    
    const familyData = familyDoc.data();
    
    // FIXED: Get ALL parent UIDs from family document
    let parentUids = [];
    
    // Collect all possible parent UIDs
    if (familyData.linkedParents && Array.isArray(familyData.linkedParents)) {
      parentUids = [...familyData.linkedParents];
      console.log('📋 Found linkedParents:', parentUids);
    } 
    
    // Also check other fields for backward compatibility
    if (familyData.createdBy && !parentUids.includes(familyData.createdBy)) {
      parentUids.push(familyData.createdBy);
    }
    
    if (familyData.parentUid && !parentUids.includes(familyData.parentUid)) {
      parentUids.push(familyData.parentUid);
    }
    
    console.log('👨‍👩‍👧‍👦 Checking reading sessions for parents:', parentUids);
    
    // STEP 1: Calculate parent reading minutes from ALL parents
    let parentMinutes = 0;
    let parentReadingSummary = {};
    
    for (const parentUid of parentUids) {
      try {
        const parentSessionsRef = collection(db, `parents/${parentUid}/readingSessions`);
        const parentWeekQuery = query(parentSessionsRef, where('date', '>=', weekStr));
        const parentWeekSnapshot = await getDocs(parentWeekQuery);
        
        let parentTotal = 0;
        parentWeekSnapshot.forEach(docSnap => {
          const session = docSnap.data();
          parentTotal += session.duration || 0;
        });
        
        if (parentTotal > 0) {
          parentReadingSummary[parentUid] = parentTotal;
          console.log(`👤 Parent ${parentUid}: ${parentTotal} minutes`);
        }
        
        parentMinutes += parentTotal;
      } catch (error) {
        console.warn(`⚠️ Could not load sessions for parent ${parentUid}:`, error.message);
      }
    }
    
    console.log('👨‍👩 Total parent minutes from all parents:', parentMinutes);
    console.log('📊 Parent breakdown:', parentReadingSummary);
    
    // STEP 2: Calculate children reading minutes
    let childrenMinutes = 0;
    const studentBreakdown = {};
    
    for (const student of linkedStudents) {
      try {
        const studentSessionsRef = collection(
          db, 
          `entities/${student.entityId}/schools/${student.schoolId}/students/${student.id}/readingSessions`
        );
        const studentWeekQuery = query(studentSessionsRef, where('date', '>=', weekStr));
        const studentWeekSnapshot = await getDocs(studentWeekQuery);
        
        let studentTotal = 0;
        studentWeekSnapshot.forEach(docSnap => {
          const session = docSnap.data();
          studentTotal += session.duration || 0;
        });
        
        studentBreakdown[student.id] = {
          name: student.firstName || student.name || 'Student',
          minutes: studentTotal
        };
        
        childrenMinutes += studentTotal;
        console.log(`👦👧 ${student.firstName}: ${studentTotal} minutes`);
        
      } catch (error) {
        console.warn(`⚠️ Could not load sessions for ${student.id}:`, error.message);
        studentBreakdown[student.id] = {
          name: student.firstName || student.name || 'Student',
          minutes: 0
        };
      }
    }
    
    console.log('👧👦 Children total:', childrenMinutes, 'minutes');
    
    // STEP 3: Determine winner and create battle status
    let winner = 'tie';
    let margin = 0;
    let battleStatus = 'The battle begins!';
    
    // Check if it's Sunday (results day)
    const dayOfWeek = today.getDay();
    const isResultsDay = dayOfWeek === 0; // Sunday
    
    if (isResultsDay) {
      // Only declare winners on Sunday
      if (childrenMinutes > parentMinutes) {
        winner = 'children';
        margin = childrenMinutes - parentMinutes;
        battleStatus = `🏆 KIDS DOMINATED! Won by ${margin} minutes!`;
        
        // Award XP to kids for winning!
        console.log('🏆 Kids won! Awarding XP...');
        await awardXPToStudents(familyId, getProgramWeekNumber(today), studentBreakdown, linkedStudents);
        
      } else if (parentMinutes > childrenMinutes) {
        winner = 'parents';
        margin = parentMinutes - childrenMinutes;
        battleStatus = `👑 PARENTS DOMINATED! Won by ${margin} minutes!`;
      } else if (parentMinutes > 0 || childrenMinutes > 0) {
        battleStatus = '🤝 EPIC TIE BATTLE! Both teams fought hard!';
      }
    } else {
      // During the week, just show who's ahead without declaring victory
      if (childrenMinutes > parentMinutes) {
        winner = 'children'; // For UI coloring, but not final
        margin = childrenMinutes - parentMinutes;
        battleStatus = `Kids leading by ${margin} minutes! Keep reading!`;
      } else if (parentMinutes > childrenMinutes) {
        winner = 'parents';
        margin = parentMinutes - childrenMinutes;
        battleStatus = `Parents leading by ${margin} minutes! Battle continues!`;
      } else if (parentMinutes > 0 || childrenMinutes > 0) {
        battleStatus = 'Tied up! Every minute counts!';
      } else {
        battleStatus = 'The battle begins! Start reading to take the lead!';
      }
    }
    
    // STEP 4: Create synchronized battle data object
    const syncedBattleData = {
      weekStart: weekStr,
      weekNumber: getProgramWeekNumber(today),
      parentMinutes,
      childrenMinutes,
      totalMinutes: parentMinutes + childrenMinutes,
      winner: isResultsDay ? winner : 'ongoing', // Only set winner on Sunday
      margin,
      battleStatus,
      studentBreakdown,
      parentBreakdown: parentReadingSummary, // Include parent breakdown for debugging
      isResultsDay,
      dayOfWeek,
      lastSynced: new Date().toISOString(),
      syncedBy: 'family-battle-sync',
      parentUidsChecked: parentUids // Store which parents were checked
    };
    
   // STEP 5: Update family document with synced data
    await updateDoc(familyRef, {
      'familyBattleSettings.currentWeek': {
        weekStart: weekStr,
        weekNumber: getProgramWeekNumber(today),
        children: childrenMinutes,
        parents: parentMinutes,
        winner: isResultsDay ? winner : 'ongoing',
        margin: margin,
        battleStatus: battleStatus,
        studentBreakdown: studentBreakdown,
        parentBreakdown: parentReadingSummary,
        isResultsDay: isResultsDay,
        dayOfWeek: dayOfWeek,
        lastUpdated: serverTimestamp(),
        lastSynced: serverTimestamp(),
        parentUidsChecked: parentUids,
        xpAwarded: isResultsDay && winner === 'children' // Track if XP was awarded
      },
      'familyBattleSettings.lastSync': serverTimestamp()
    });
    
    console.log('✅ SYNCED battle data updated in family document:', familyId);
    console.log('📊 Final result:', {
      winner: isResultsDay ? winner : 'ongoing',
      margin,
      parentMinutes,
      childrenMinutes,
      battleStatus,
      isResultsDay,
      parentUidsChecked: parentUids
    });
    
    return syncedBattleData;
    
  } catch (error) {
    console.error('❌ Error syncing family battle data:', error);
    throw error;
  }
};

/**
 * Get battle data from family document (for student view)
 */
export const getFamilyBattleDataForStudent = async (familyId) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided');
    }
    
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      console.log('❌ Family document not found:', familyId);
      return null;
    }
    
    const familyData = familyDoc.data();
    const currentWeek = familyData.familyBattleSettings?.currentWeek;
    
    if (!currentWeek) {
      console.log('❌ No current week battle data found');
      return null;
    }
    
    // Return the exact same data structure used by parent view
    return {
      weekStart: currentWeek.weekStart,
      weekNumber: currentWeek.weekNumber,
      parentMinutes: currentWeek.parents,
      childrenMinutes: currentWeek.children,
      totalMinutes: (currentWeek.parents || 0) + (currentWeek.children || 0),
      winner: currentWeek.winner,
      margin: currentWeek.margin,
      battleStatus: currentWeek.battleStatus || 'Battle in progress!',
      studentBreakdown: currentWeek.studentBreakdown || {},
      parentBreakdown: currentWeek.parentBreakdown || {},
      isResultsDay: currentWeek.isResultsDay || false,
      dayOfWeek: currentWeek.dayOfWeek,
      lastUpdated: currentWeek.lastUpdated,
      lastSynced: currentWeek.lastSynced,
      parentUidsChecked: currentWeek.parentUidsChecked || []
    };
    
  } catch (error) {
    console.error('❌ Error getting family battle data for student:', error);
    return null;
  }
};

/**
 * Real-time listener for family battle updates
 */
export const subscribeToFamilyBattleUpdates = (familyId, onUpdate, onError) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for subscription');
    }
    
    const familyRef = doc(db, 'families', familyId);
    
    const unsubscribe = onSnapshot(familyRef, (doc) => {
      if (doc.exists()) {
        const familyData = doc.data();
        const currentWeek = familyData.familyBattleSettings?.currentWeek;
        
        if (currentWeek) {
          const battleData = {
            weekStart: currentWeek.weekStart,
            weekNumber: currentWeek.weekNumber,
            parentMinutes: currentWeek.parents,
            childrenMinutes: currentWeek.children,
            totalMinutes: (currentWeek.parents || 0) + (currentWeek.children || 0),
            winner: currentWeek.winner,
            margin: currentWeek.margin,
            battleStatus: currentWeek.battleStatus || 'Battle in progress!',
            studentBreakdown: currentWeek.studentBreakdown || {},
            parentBreakdown: currentWeek.parentBreakdown || {},
            isResultsDay: currentWeek.isResultsDay || false,
            dayOfWeek: currentWeek.dayOfWeek,
            lastUpdated: currentWeek.lastUpdated,
            lastSynced: currentWeek.lastSynced,
            parentUidsChecked: currentWeek.parentUidsChecked || []
          };
          
          onUpdate({
            battleData,
            familyStats: familyData.championshipHistory || {}
          });
        }
      }
    }, (error) => {
      console.error('❌ Family battle subscription error:', error);
      if (onError) onError(error);
    });
    
    return unsubscribe;
    
  } catch (error) {
    console.error('❌ Error setting up family battle subscription:', error);
    if (onError) onError(error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Force refresh battle data for both parent and student views
 */
export const forceBattleDataRefresh = async (familyId, linkedStudents) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for refresh');
    }
    
    console.log('🔄 FORCE REFRESH: Syncing battle data for family:', familyId);
    
    // Trigger a complete data sync
    const syncedData = await syncFamilyBattleData(familyId, linkedStudents);
    
    // Wait a moment for database to update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return fresh data from database
    const freshData = await getFamilyBattleDataForStudent(familyId);
    
    console.log('✅ FORCE REFRESH: Complete');
    return freshData || syncedData;
    
  } catch (error) {
    console.error('❌ Error force refreshing battle data:', error);
    throw error;
  }
};

// ============================================================================
// STUDENT-SPECIFIC HELPER FUNCTIONS
// ============================================================================

/**
 * Get student's individual contribution to the battle
 */
export const getStudentBattleContribution = async (studentData, weekStr = null) => {
  try {
    if (!weekStr) {
      const today = new Date();
      const weekStart = getProgramWeekStart(today);
      weekStr = getLocalDateString(weekStart);
    }
    
    const sessionRef = collection(
      db, 
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`
    );
    const weekQuery = query(sessionRef, where('date', '>=', weekStr));
    const weekSnapshot = await getDocs(weekQuery);
    
    let studentMinutes = 0;
    weekSnapshot.forEach(docSnap => {
      const session = docSnap.data();
      studentMinutes += session.duration || 0;
    });
    
    console.log(`📊 Student ${studentData.id} contribution:`, studentMinutes, 'minutes');
    return studentMinutes;
    
  } catch (error) {
    console.error('❌ Error getting student battle contribution:', error);
    return 0;
  }
};

/**
 * Check if student's family has battle enabled and get current battle data
 */
export const getStudentFamilyBattleStatus = async (studentData) => {
  try {
    // First check if student has family battle enabled
    if (!studentData.familyBattleSettings?.enabled) {
      return {
        enabled: false,
        reason: 'Family battle not enabled for student'
      };
    }
    
    // Get the familyId from student's family battle settings
    const familyId = studentData.familyBattleSettings?.parentFamilyId;
    
    if (!familyId) {
      return {
        enabled: false,
        reason: 'No family ID linked to student'
      };
    }
    
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      return {
        enabled: false,
        reason: 'Family document not found'
      };
    }
    
    const familyData = familyDoc.data();
    
    if (!familyData.familyBattleSettings?.enabled) {
      return {
        enabled: false,
        reason: 'Family battle not enabled by parent'
      };
    }
    
    // Get current battle data
    const battleData = await getFamilyBattleDataForStudent(familyId);
    
    // Get student's individual contribution
    const studentContribution = await getStudentBattleContribution(studentData);
    
    return {
      enabled: true,
      familyId,
      battleData,
      studentContribution,
      familyStats: familyData.championshipHistory || {}
    };
    
  } catch (error) {
    console.error('❌ Error getting student family battle status:', error);
    return {
      enabled: false,
      reason: 'Error loading family battle data'
    };
  }
};

// ============================================================================
// JANE AUSTEN MODE HELPER
// ============================================================================

/**
 * Get Jane Austen mode based on day of week
 */
export const getJaneAustenModeByDay = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Sunday (0): Results day - Victorious
  if (dayOfWeek === 0) {
    return 'victorious';
  }
  
  // Monday-Wednesday (1-3): Encouraging
  if (dayOfWeek >= 1 && dayOfWeek <= 3) {
    return 'encouraging';
  }
  
  // Thursday-Saturday (4-6): Battle Ready
  if (dayOfWeek >= 4 && dayOfWeek <= 6) {
    return 'battleReady';
  }
  
  return 'encouraging'; // Default
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  syncFamilyBattleData,
  getFamilyBattleDataForStudent,
  subscribeToFamilyBattleUpdates,
  forceBattleDataRefresh,
  getStudentBattleContribution,
  getStudentFamilyBattleStatus,
  getJaneAustenModeByDay,
};