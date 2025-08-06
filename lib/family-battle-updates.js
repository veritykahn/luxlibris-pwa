// lib/family-battle-updates.js
// Fixes for parent reading tracking and adds XP rewards for students

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// PARENT READING SESSION FIX
// ============================================================================

/**
 * Debug function to check parent reading sessions
 */
export const debugParentReadingSessions = async (parentUid) => {
  try {
    console.log('🔍 Debugging parent reading sessions for:', parentUid);
    
    // Check if parent document exists
    const parentRef = doc(db, 'parents', parentUid);
    const parentDoc = await getDoc(parentRef);
    
    if (!parentDoc.exists()) {
      console.error('❌ Parent document not found:', parentUid);
      return;
    }
    
    console.log('✅ Parent document found:', parentDoc.data());
    
    // Check all reading sessions
    const sessionsRef = collection(db, `parents/${parentUid}/readingSessions`);
    const allSessions = await getDocs(sessionsRef);
    
    console.log('📚 Total reading sessions:', allSessions.size);
    
    allSessions.forEach(doc => {
      const session = doc.data();
      console.log('📖 Session:', {
        id: doc.id,
        date: session.date,
        duration: session.duration,
        bookTitle: session.bookTitle,
        completed: session.completed
      });
    });
    
    // Check this week's sessions
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday
    const weekStr = weekStart.toISOString().split('T')[0];
    
    console.log('📅 Checking sessions from:', weekStr);
    
    const weekQuery = query(sessionsRef, where('date', '>=', weekStr));
    const weekSessions = await getDocs(weekQuery);
    
    let totalMinutes = 0;
    weekSessions.forEach(doc => {
      const session = doc.data();
      totalMinutes += session.duration || 0;
      console.log('📊 This week session:', session.date, session.duration, 'minutes');
    });
    
    console.log('🏆 Total minutes this week:', totalMinutes);
    
  } catch (error) {
    console.error('❌ Error debugging parent sessions:', error);
  }
};

/**
 * Fix parent reading session tracking in family battle
 */
export const fixParentReadingTracking = async (familyId) => {
  try {
    console.log('🔧 Fixing parent reading tracking for family:', familyId);
    
    // Get family document
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      throw new Error('Family document not found');
    }
    
    const familyData = familyDoc.data();
    
    // Find parent UID from multiple possible fields
    let parentUid = null;
    
    // Check all possible parent UID locations
    if (familyData.linkedParents && familyData.linkedParents.length > 0) {
      parentUid = familyData.linkedParents[0];
    } else if (familyData.createdBy) {
      parentUid = familyData.createdBy;
    } else if (familyData.parentUid) {
      parentUid = familyData.parentUid;
    }
    
    if (!parentUid) {
      // Try to find parent from parents collection
      const parentsQuery = query(
        collection(db, 'parents'),
        where('familyId', '==', familyId)
      );
      const parentsSnapshot = await getDocs(parentsQuery);
      
      if (!parentsSnapshot.empty) {
        parentUid = parentsSnapshot.docs[0].id;
        
        // Update family document with parent UID
        await updateDoc(familyRef, {
          linkedParents: [parentUid],
          'familyBattleSettings.parentUid': parentUid
        });
        
        console.log('✅ Found and linked parent:', parentUid);
      }
    }
    
    if (parentUid) {
      console.log('✅ Parent UID found:', parentUid);
      
      // Ensure parent is properly linked in family document
      const updates = {};
      
      if (!familyData.linkedParents || !familyData.linkedParents.includes(parentUid)) {
        updates.linkedParents = [...(familyData.linkedParents || []), parentUid];
      }
      
      // Store parent UID in battle settings for easier access
      updates['familyBattleSettings.parentUid'] = parentUid;
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(familyRef, updates);
        console.log('✅ Updated family document with parent linkage');
      }
      
      // Debug parent reading sessions
      await debugParentReadingSessions(parentUid);
      
      return parentUid;
    } else {
      throw new Error('No parent linked to family');
    }
    
  } catch (error) {
    console.error('❌ Error fixing parent reading tracking:', error);
    throw error;
  }
};

// ============================================================================
// STUDENT XP REWARDS SYSTEM
// ============================================================================

/**
 * Award XP to winning students in family battle
 */
export const awardFamilyBattleXP = async (familyId, weekNumber) => {
  try {
    console.log('🎮 Awarding XP for family battle week:', weekNumber);
    
    // Get family document
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      throw new Error('Family document not found');
    }
    
    const familyData = familyDoc.data();
    const currentWeek = familyData.familyBattleSettings?.currentWeek;
    
    if (!currentWeek || currentWeek.winner !== 'children') {
      console.log('❌ Children did not win this week, no XP awarded');
      return;
    }
    
    // Get all linked students
    const linkedStudents = familyData.linkedStudents || [];
    const studentBreakdown = currentWeek.studentBreakdown || {};
    
    // Award XP to each student based on their contribution
    const xpAwards = [];
    
    for (const studentId of linkedStudents) {
      try {
        // Find student document (we need to search across entities/schools)
        const entitiesSnapshot = await getDocs(collection(db, 'entities'));
        
        for (const entityDoc of entitiesSnapshot.docs) {
          const entityId = entityDoc.id;
          const schoolsSnapshot = await getDocs(
            collection(db, `entities/${entityId}/schools`)
          );
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            const schoolId = schoolDoc.id;
            const studentRef = doc(
              db, 
              `entities/${entityId}/schools/${schoolId}/students/${studentId}`
            );
            const studentDoc = await getDoc(studentRef);
            
            if (studentDoc.exists()) {
  const studentData = studentDoc.data();
  const contribution = studentBreakdown[studentId]?.minutes || 0;
  
  // Calculate XP based on contribution and victory
  let xpToAward = 0;
  
  // Base XP for participating in winning team
  const BASE_VICTORY_XP = 25; // Changed from 50
  
  // Bonus XP based on reading minutes
  const MINUTES_XP_RATE = 0; // Changed from 2 - no per-minute bonus
  const contributionXP = Math.floor(contribution * MINUTES_XP_RATE); // This will be 0
  
  // MVP check - ADD THIS LINE
  const isMVP = contribution > 0 && 
    contribution === Math.max(...Object.values(studentBreakdown).map(s => s.minutes || 0));
  
  // MVP bonus
  const MVP_BONUS = isMVP ? 25 : 0; // Changed from 100
  
  // Total XP
  xpToAward = BASE_VICTORY_XP + contributionXP + MVP_BONUS;
  
  // Update student XP
  const currentXP = studentData.weeklyXP || 0;
  const totalXP = studentData.totalXP || 0;
              
              await updateDoc(studentRef, {
                weeklyXP: currentXP + xpToAward,
                totalXP: totalXP + xpToAward,
                'familyBattleHistory.lastVictoryWeek': weekNumber,
                'familyBattleHistory.lastVictoryXP': xpToAward,
                'familyBattleHistory.totalVictories': (studentData.familyBattleHistory?.totalVictories || 0) + 1,
                lastUpdated: serverTimestamp()
              });
              
              xpAwards.push({
                studentId,
                studentName: studentData.firstName || 'Student',
                xpAwarded: xpToAward,
                contribution,
                isMVP,
                breakdown: {
                  base: BASE_VICTORY_XP,
                  minutes: contributionXP,
                  mvpBonus: MVP_BONUS
                }
              });
              
              console.log(`✅ Awarded ${xpToAward} XP to ${studentData.firstName}`);
              break; // Found the student, move to next
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error awarding XP to student ${studentId}:`, error);
      }
    }
    
    // Update family document with XP award history
    await updateDoc(familyRef, {
      [`familyBattleHistory.week${weekNumber}XPAwards`]: xpAwards,
      'familyBattleHistory.lastXPAwardDate': serverTimestamp()
    });
    
    console.log('🏆 Family Battle XP Awards Complete:', xpAwards);
    return xpAwards;
    
  } catch (error) {
    console.error('❌ Error awarding family battle XP:', error);
    throw error;
  }
};

// ============================================================================
// WEEKLY BATTLE COMPLETION WITH XP
// ============================================================================

/**
 * Complete weekly battle with XP awards (called on Sunday night)
 */
export const completeWeeklyBattleWithRewards = async (familyId) => {
  try {
    console.log('🏁 Completing weekly battle with rewards for family:', familyId);
    
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) return;
    
    const familyData = familyDoc.data();
    const currentWeek = familyData.familyBattleSettings?.currentWeek;
    
    if (!currentWeek) return;
    
    // Award XP if children won
    if (currentWeek.winner === 'children') {
      await awardFamilyBattleXP(familyId, currentWeek.weekNumber);
    }
    
    // Update championship history
    const history = familyData.championshipHistory || {};
    const newHistory = {
      totalBattles: (history.totalBattles || 0) + 1,
      childrenWins: history.childrenWins || 0,
      parentWins: history.parentWins || 0,
      ties: history.ties || 0,
      recentResults: [...(history.recentResults || [])],
      currentStreak: history.currentStreak || { team: null, weeks: 0 }
    };
    
    // Update win counts
    if (currentWeek.winner === 'children') {
      newHistory.childrenWins += 1;
    } else if (currentWeek.winner === 'parents') {
      newHistory.parentWins += 1;
    } else {
      newHistory.ties += 1;
    }
    
    // Update streak
    if (currentWeek.winner === 'tie') {
      newHistory.currentStreak = { team: null, weeks: 0 };
    } else if (newHistory.currentStreak.team === currentWeek.winner) {
      newHistory.currentStreak.weeks += 1;
    } else {
      newHistory.currentStreak = { team: currentWeek.winner, weeks: 1 };
    }
    
    // Add to recent results
    newHistory.recentResults.unshift({
      week: currentWeek.weekNumber,
      winner: currentWeek.winner,
      childrenMinutes: currentWeek.children,
      parentMinutes: currentWeek.parents,
      margin: currentWeek.margin,
      xpAwarded: currentWeek.winner === 'children' // Track if XP was awarded
    });
    newHistory.recentResults = newHistory.recentResults.slice(0, 10); // Keep last 10
    
    // Update family document
    await updateDoc(familyRef, {
      championshipHistory: newHistory,
      'familyBattleSettings.lastCompletedWeek': currentWeek.weekNumber,
      'familyBattleSettings.lastCompletedDate': serverTimestamp()
    });
    
    console.log('✅ Weekly battle completed with rewards');
    
  } catch (error) {
    console.error('❌ Error completing weekly battle:', error);
    throw error;
  }
};

// ============================================================================
// PARENT VICTORY HISTORY
// ============================================================================

/**
 * Get all parent victories for bragging rights modal
 */
export const getParentVictories = async (familyId) => {
  try {
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) return [];
    
    const familyData = familyDoc.data();
    const recentResults = familyData.championshipHistory?.recentResults || [];
    
    // Get all parent victories with details
    const parentVictories = recentResults
      .filter(result => result.winner === 'parents')
      .map(result => ({
        week: result.week,
        winner: result.winner,
        parentMinutes: result.parentMinutes,
        childrenMinutes: result.childrenMinutes,
        margin: result.margin
      }));
    
    return parentVictories;
    
  } catch (error) {
    console.error('❌ Error getting parent victories:', error);
    return [];
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Fixes
  fixParentReadingTracking,
  debugParentReadingSessions,
  
  // XP System
  awardFamilyBattleXP,
  completeWeeklyBattleWithRewards,
  
  // Victory History
  getParentVictories
};