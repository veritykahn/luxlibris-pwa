// lib/family-battle-sync.js - COMPLETE VERSION with Sunday fixes

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
import { awardFamilyBattleXP } from './xp-management';

// ============================================================================
// SIMPLIFIED XP AWARDING FUNCTION
// ============================================================================

export const awardFamilyBattleXP = async (studentData, weekNumber, isStudentMVP = false) => {
  try {
    // Use the new transactional XP system
    const result = await awardFamilyBattleXP(
  studentData, 
  weekNumber, 
  isStudentMVP, 
  'family-battle-sync'
);
    
    console.log(`✅ Family Battle XP Result:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ Error awarding family battle XP:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// REAL-TIME DATA SYNCHRONIZATION
// ============================================================================

/**
 * FIXED: Sunday shows last week's completed results, not current week
 * Ensure parent and student views show identical data
 */
export const syncFamilyBattleData = async (familyId, linkedStudents) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for sync');
    }
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isSunday = dayOfWeek === 0;
    
    // SUNDAY FIX: Calculate correct week period
    let weekStart, weekEnd, weekNumber;
    
    if (isSunday) {
      // Sunday Day of Rest - show LAST week's completed results
      weekEnd = new Date(today);
      weekEnd.setHours(23, 59, 59, 999);
      
      weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7); // Go back to last Sunday
      weekStart.setHours(0, 0, 0, 0);
      
      // Week number is for the week that just finished
      weekNumber = getProgramWeekNumber(weekStart);
      
      console.log('🙏 SUNDAY DAY OF REST - Showing Week', weekNumber, 'results');
    } else {
      // Monday-Saturday: Show current week progress
      weekStart = getProgramWeekStart(today);
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Saturday
      weekEnd.setHours(23, 59, 59, 999);
      
      weekNumber = getProgramWeekNumber(today);
      
      console.log('⚔️ Battle Week', weekNumber, 'in progress');
    }
    
    const weekStr = getLocalDateString(weekStart);
    const weekEndStr = getLocalDateString(weekEnd);
    
    console.log('🔄 SYNCING battle data for family:', familyId);
    console.log('📅 Period:', weekStr, 'to', weekEndStr);
    console.log('📅 Is Sunday (Day of Rest):', isSunday);
    
    // Get the family document first
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    
    if (!familyDoc.exists()) {
      throw new Error('Family document not found');
    }
    
    const familyData = familyDoc.data();
    
    // Get ALL parent UIDs from family document
    let parentUids = [];
    
    if (familyData.linkedParents && Array.isArray(familyData.linkedParents)) {
      parentUids = [...familyData.linkedParents];
      console.log('📋 Found linkedParents:', parentUids);
    } 
    
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
        // Get parent's name first
        let parentName = `Parent ${parentUids.indexOf(parentUid) + 1}`;
        try {
          const parentDocRef = doc(db, 'parents', parentUid);
          const parentDoc = await getDoc(parentDocRef);
          if (parentDoc.exists()) {
            const parentData = parentDoc.data();
            if (parentData.firstName || parentData.lastName) {
              parentName = `${parentData.firstName || ''} ${parentData.lastName || ''}`.trim();
            }
          }
        } catch (nameError) {
          console.warn(`Could not load parent name for ${parentUid}:`, nameError);
        }
        
        // Get reading sessions for the week period
        const parentSessionsRef = collection(db, `parents/${parentUid}/readingSessions`);
        const parentWeekQuery = query(
          parentSessionsRef, 
          where('date', '>=', weekStr),
          where('date', '<=', weekEndStr)
        );
        const parentWeekSnapshot = await getDocs(parentWeekQuery);
        
        let parentTotal = 0;
        parentWeekSnapshot.forEach(docSnap => {
          const session = docSnap.data();
          // Count ALL sessions with duration (both completed and banked)
          if (session.duration && session.duration > 0) {
            parentTotal += session.duration;
            console.log(`  📖 ${parentName} session ${session.date}: ${session.duration} min (${session.completed ? 'completed' : 'banked'})`);
          }
        });
        
        if (parentTotal > 0) {
          parentReadingSummary[parentUid] = {
            name: parentName,
            minutes: parentTotal
          };
          console.log(`👤 ${parentName}: ${parentTotal} minutes`);
        } else {
          parentReadingSummary[parentUid] = {
            name: parentName,
            minutes: 0
          };
        }
        
        parentMinutes += parentTotal;
      } catch (error) {
        console.warn(`⚠️ Could not load sessions for parent ${parentUid}:`, error.message);
      }
    }
    
    console.log('👨‍👩 Total parent minutes:', parentMinutes);
    
    // STEP 2: Calculate children reading minutes
    let childrenMinutes = 0;
    const studentBreakdown = {};
    
    for (const student of linkedStudents) {
      try {
        const studentSessionsRef = collection(
          db, 
          `entities/${student.entityId}/schools/${student.schoolId}/students/${student.id}/readingSessions`
        );
        const studentWeekQuery = query(
          studentSessionsRef, 
          where('date', '>=', weekStr),
          where('date', '<=', weekEndStr)
        );
        const studentWeekSnapshot = await getDocs(studentWeekQuery);
        
        let studentTotal = 0;
        studentWeekSnapshot.forEach(docSnap => {
          const session = docSnap.data();
          // Count ALL sessions with duration (both completed and banked)
          if (session.duration && session.duration > 0) {
            studentTotal += session.duration;
            console.log(`  📖 Student session ${session.date}: ${session.duration} min (${session.completed ? 'completed' : 'banked'})`);
          }
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
    let battleStatus = '';
    
    if (isSunday) {
      // Sunday Day of Rest - Show final results
      if (childrenMinutes > parentMinutes) {
        winner = 'children';
        margin = childrenMinutes - parentMinutes;
        battleStatus = `🏆 KIDS WIN! Victory by ${margin} minutes! Enjoy your day of rest, champions!`;
        
      } else if (parentMinutes > childrenMinutes) {
        winner = 'parents';
        margin = parentMinutes - childrenMinutes;
        battleStatus = `👑 PARENTS WIN! Victory by ${margin} minutes! Rest well, champions!`;
      } else if (parentMinutes > 0 || childrenMinutes > 0) {
        battleStatus = '🤝 EPIC TIE! Both teams fought valiantly! Rest and prepare for next week!';
      } else {
        battleStatus = '🙏 No reading this week. Use this day of rest to prepare for next week\'s battle!';
      }
    } else {
      // During the week - show progress
      if (childrenMinutes > parentMinutes) {
        winner = 'children'; // For UI coloring, but not final
        margin = childrenMinutes - parentMinutes;
        battleStatus = `Kids leading by ${margin} minutes! Keep pushing to victory!`;
      } else if (parentMinutes > childrenMinutes) {
        winner = 'parents';
        margin = parentMinutes - childrenMinutes;
        battleStatus = `Parents ahead by ${margin} minutes! Kids, time to catch up!`;
      } else if (parentMinutes > 0 || childrenMinutes > 0) {
        battleStatus = 'Tied up! Every minute counts in this epic battle!';
      } else {
        battleStatus = 'The battle begins! Start reading to take the lead!';
      }
    }
    
    // STEP 4: Create synchronized battle data object
    const syncedBattleData = {
      weekStart: weekStr,
      weekEnd: weekEndStr,
      weekNumber: weekNumber,
      parentMinutes,
      childrenMinutes,
      totalMinutes: parentMinutes + childrenMinutes,
      winner: isSunday ? winner : 'ongoing', // Only set winner on Sunday
      margin,
      battleStatus,
      studentBreakdown,
      parentBreakdown: parentReadingSummary,
      isResultsDay: isSunday,
      dayOfWeek,
      lastSynced: new Date().toISOString(),
      syncedBy: 'family-battle-sync',
      parentUidsChecked: parentUids
    };
    
    // STEP 5: Update family document with synced data
    if (isSunday) {
      // Sunday: Save as completed week data
      await updateDoc(familyRef, {
        'familyBattleSettings.lastCompletedWeek': syncedBattleData,
        'familyBattleSettings.lastCompletedWeekNumber': weekNumber,
        'familyBattleSettings.lastResultsViewedAt': serverTimestamp()
      });
      
      console.log('🙏 Sunday results saved as completed week');
    } else {
      // Monday-Saturday: Update current week
      await updateDoc(familyRef, {
        'familyBattleSettings.currentWeek': {
          weekStart: weekStr,
          weekNumber: weekNumber,
          children: childrenMinutes,
          parents: parentMinutes,
          winner: 'ongoing',
          margin: margin,
          battleStatus: battleStatus,
          studentBreakdown: studentBreakdown,
          parentBreakdown: parentReadingSummary,
          isResultsDay: false,
          dayOfWeek: dayOfWeek,
          lastUpdated: serverTimestamp(),
          lastSynced: serverTimestamp(),
          parentUidsChecked: parentUids
        },
        'familyBattleSettings.lastSync': serverTimestamp()
      });
    }
    
    console.log('✅ SYNCED battle data updated');
    console.log('📊 Final result:', {
      weekNumber,
      winner: isSunday ? winner : 'ongoing',
      margin,
      parentMinutes,
      childrenMinutes,
      battleStatus,
      isResultsDay: isSunday
    });
    
    return syncedBattleData;
    
  } catch (error) {
    console.error('❌ Error syncing family battle data:', error);
    throw error;
  }
};

/**
 * Get battle data from family document (for student view)
 * FIXED: Returns lastCompletedWeek data on Sunday
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
    const today = new Date();
    const isSunday = today.getDay() === 0;
    
    // SUNDAY FIX: Use lastCompletedWeek data on Sunday
    let battleData;
    
    if (isSunday && familyData.familyBattleSettings?.lastCompletedWeek) {
      console.log('🙏 Using Sunday completed week data');
      battleData = familyData.familyBattleSettings.lastCompletedWeek;
    } else if (!isSunday && familyData.familyBattleSettings?.currentWeek) {
      console.log('⚔️ Using current week battle data');
      battleData = familyData.familyBattleSettings.currentWeek;
    } else {
      console.log('❌ No battle data found for', isSunday ? 'Sunday' : 'current week');
      return null;
    }
    
    // Return unified data structure
    return {
      weekStart: battleData.weekStart,
      weekNumber: battleData.weekNumber,
      parentMinutes: battleData.parentMinutes || battleData.parents || 0,
      childrenMinutes: battleData.childrenMinutes || battleData.children || 0,
      totalMinutes: (battleData.parentMinutes || battleData.parents || 0) + 
                   (battleData.childrenMinutes || battleData.children || 0),
      winner: battleData.winner,
      margin: battleData.margin,
      battleStatus: battleData.battleStatus || 'Battle in progress!',
      studentBreakdown: battleData.studentBreakdown || {},
      parentBreakdown: battleData.parentBreakdown || {},
      isResultsDay: isSunday,
      dayOfWeek: today.getDay(),
      lastUpdated: battleData.lastUpdated,
      lastSynced: battleData.lastSynced
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
        const today = new Date();
        const isSunday = today.getDay() === 0;
        
        // Use appropriate data based on day
        let currentWeek;
        if (isSunday && familyData.familyBattleSettings?.lastCompletedWeek) {
          currentWeek = familyData.familyBattleSettings.lastCompletedWeek;
        } else {
          currentWeek = familyData.familyBattleSettings?.currentWeek;
        }
        
        if (currentWeek) {
          const battleData = {
            weekStart: currentWeek.weekStart,
            weekNumber: currentWeek.weekNumber,
            parentMinutes: currentWeek.parentMinutes || currentWeek.parents || 0,
            childrenMinutes: currentWeek.childrenMinutes || currentWeek.children || 0,
            totalMinutes: (currentWeek.parentMinutes || currentWeek.parents || 0) + 
                         (currentWeek.childrenMinutes || currentWeek.children || 0),
            winner: currentWeek.winner,
            margin: currentWeek.margin,
            battleStatus: currentWeek.battleStatus || 'Battle in progress!',
            studentBreakdown: currentWeek.studentBreakdown || {},
            parentBreakdown: currentWeek.parentBreakdown || {},
            isResultsDay: isSunday,
            dayOfWeek: today.getDay(),
            lastUpdated: currentWeek.lastUpdated,
            lastSynced: currentWeek.lastSynced
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

/**
 * Get student's individual contribution to the battle
 * FIXED: Handles Sunday week calculation
 */
export const getStudentBattleContribution = async (studentData, weekStr = null) => {
  try {
    if (!weekStr) {
      const today = new Date();
      const isSunday = today.getDay() === 0;
      
      let weekStart;
      if (isSunday) {
        // Sunday: Get last week's contribution
        weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
      } else {
        // Monday-Saturday: Current week
        weekStart = getProgramWeekStart(today);
      }
      
      weekStr = getLocalDateString(weekStart);
    }
    
    // Get the end date for the week
    const weekStartDate = new Date(weekStr);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEndStr = getLocalDateString(weekEndDate);
    
    const sessionRef = collection(
      db, 
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`
    );
    const weekQuery = query(
      sessionRef, 
      where('date', '>=', weekStr),
      where('date', '<=', weekEndStr)
    );
    const weekSnapshot = await getDocs(weekQuery);
    
    let studentMinutes = 0;
    weekSnapshot.forEach(docSnap => {
      const session = docSnap.data();
      // Count ALL sessions with duration
      if (session.duration && session.duration > 0) {
        studentMinutes += session.duration;
      }
    });
    
    console.log(`📊 Student ${studentData.id} contribution:`, studentMinutes, 'minutes for week starting', weekStr);
    return studentMinutes;
    
  } catch (error) {
    console.error('❌ Error getting student battle contribution:', error);
    return 0;
  }
};

/**
 * Check if student's family has battle enabled and get current battle data
 * FIXED: Properly loads Sunday data
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
    
    // Get current battle data (will handle Sunday automatically)
    const battleData = await getFamilyBattleDataForStudent(familyId);
    
    // Get student's individual contribution
    const today = new Date();
    const isSunday = today.getDay() === 0;
    let weekStr;
    
    if (isSunday && battleData) {
      // Use the week from battle data on Sunday
      weekStr = battleData.weekStart;
    } else {
      // Use current week
      const weekStart = getProgramWeekStart(today);
      weekStr = getLocalDateString(weekStart);
    }
    
    const studentContribution = await getStudentBattleContribution(studentData, weekStr);
    
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

/**
 * Get Jane Austen mode based on day of week
 */
export const getJaneAustenModeByDay = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Sunday (0): Results day - Victorious or Encouraging
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
  awardFamilyBattleXP,
};