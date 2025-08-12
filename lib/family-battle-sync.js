// lib/family-battle-sync.js - COMPLETE VERSION with Sunday fixes and AUTO XP AWARDS

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
import { awardFamilyBattleXP as awardFamilyBattleXPTransaction } from './xp-management';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the Monday-Saturday battle week for a given date
 * @param {Date} date - The date to calculate from
 * @returns {Object} - { weekStart: Date, weekEnd: Date, weekStartStr: string, weekEndStr: string }
 */
const getBattleWeek = (date = new Date()) => {
  const today = new Date(date);
  const dayOfWeek = today.getDay();
  const isSunday = dayOfWeek === 0;
  
  let weekStart, weekEnd;
  
  if (isSunday) {
    // Sunday: Return last week's Monday-Saturday
    weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - 1); // Saturday
    weekEnd.setHours(23, 59, 59, 999);
    
    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 5); // Monday (6 days total)
    weekStart.setHours(0, 0, 0, 0);
  } else {
    // Monday-Saturday: Current week
    weekStart = new Date(today);
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 5); // Saturday
    weekEnd.setHours(23, 59, 59, 999);
  }
  
  return {
    weekStart,
    weekEnd,
    weekStartStr: getLocalDateString(weekStart),
    weekEndStr: getLocalDateString(weekEnd),
    isSunday
  };
};

// ============================================================================
// AUTOMATIC XP AWARDING ON SUNDAY
// ============================================================================

/**
 * Award XP to all winning team members on Sunday
 * This happens automatically during sync, not on modal display
 */
const awardXPToWinningTeam = async (syncedBattleData, linkedStudents) => {
  try {
    const { winner, weekNumber, studentBreakdown } = syncedBattleData;
    
    // Only award on Sunday when there's a clear winner (children)
    if (!syncedBattleData.isResultsDay || winner !== 'children' || !weekNumber) {
      console.log('📊 No XP to award - either not Sunday, parents won, or tie');
      return { awarded: false, reason: 'No XP conditions met' };
    }
    
    // Find MVP (student with most minutes)
    let mvpStudentId = null;
    let maxMinutes = 0;
    
    Object.entries(studentBreakdown || {}).forEach(([studentId, data]) => {
      if (data.minutes > maxMinutes) {
        maxMinutes = data.minutes;
        mvpStudentId = studentId;
      }
    });
    
    console.log('🏆 Awarding XP for Week', weekNumber, 'victory!');
    console.log('👑 MVP:', mvpStudentId, 'with', maxMinutes, 'minutes');
    
    // Award XP to each student on winning team
    const xpResults = [];
    
    for (const student of linkedStudents) {
      try {
        // Check if this student already received XP for this week
        const studentRef = doc(
          db, 
          `entities/${student.entityId}/schools/${student.schoolId}/students/${student.id}`
        );
        const studentDoc = await getDoc(studentRef);
        
        if (!studentDoc.exists()) {
          console.warn(`Student document not found: ${student.id}`);
          continue;
        }
        
        const studentData = studentDoc.data();
        
        // Skip if already awarded for this week
        if (studentData[`familyBattleWeek${weekNumber}XPAwarded`]) {
          console.log(`✅ Student ${student.firstName} already has XP for week ${weekNumber}`);
          xpResults.push({
            studentId: student.id,
            name: student.firstName,
            status: 'already_awarded',
            xp: 0
          });
          continue;
        }
        
        // Award XP using the transaction-safe function
        const isStudentMVP = student.id === mvpStudentId;
        const fullStudentData = {
          ...student,
          ...studentData,
          id: student.id
        };
        
        const result = await awardFamilyBattleXPTransaction(
          fullStudentData,
          weekNumber,
          isStudentMVP,
          'family-battle-sync-auto'
        );
        
        if (result.success) {
          xpResults.push({
            studentId: student.id,
            name: student.firstName,
            status: 'awarded',
            xp: result.xpAwarded,
            isMVP: isStudentMVP,
            newTotal: result.newTotal
          });
          
          console.log(`✅ Awarded ${result.xpAwarded} XP to ${student.firstName} (MVP: ${isStudentMVP})`);
        } else {
          xpResults.push({
            studentId: student.id,
            name: student.firstName,
            status: 'failed',
            error: result.error || result.reason
          });
          
          console.warn(`❌ Failed to award XP to ${student.firstName}:`, result.error || result.reason);
        }
        
      } catch (studentError) {
        console.error(`Error processing student ${student.id}:`, studentError);
        xpResults.push({
          studentId: student.id,
          name: student.firstName || 'Unknown',
          status: 'error',
          error: studentError.message
        });
      }
    }
    
    console.log('🎮 XP Award Summary:', xpResults);
    
    return {
      awarded: true,
      weekNumber,
      results: xpResults,
      totalStudentsAwarded: xpResults.filter(r => r.status === 'awarded').length
    };
    
  } catch (error) {
    console.error('❌ Error awarding XP to winning team:', error);
    return {
      awarded: false,
      error: error.message
    };
  }
};

// ============================================================================
// SIMPLIFIED XP AWARDING FUNCTION (for backward compatibility)
// ============================================================================

export const awardFamilyBattleXP = async (studentData, weekNumber, isStudentMVP = false) => {
  try {
    // Use the new transactional XP system
    const result = await awardFamilyBattleXPTransaction(
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
// REAL-TIME DATA SYNCHRONIZATION - UPDATED WITH AUTO XP
// ============================================================================

/**
 * FIXED: Sunday shows last week's completed results AND awards XP automatically
 * Ensure parent and student views show identical data
 */
export const syncFamilyBattleData = async (familyId, linkedStudents) => {
  try {
    if (!familyId) {
      throw new Error('No familyId provided for sync');
    }
    
    const today = new Date();
    const { weekStart, weekEnd, weekStartStr, weekEndStr, isSunday } = getBattleWeek(today);
    const weekNumber = getProgramWeekNumber(weekStart);
    
    console.log('🔄 SYNCING battle data for family:', familyId);
    console.log('📅 Week Start:', weekStartStr, '(', weekStart.toDateString(), ')');
    console.log('📅 Week End:', weekEndStr, '(', weekEnd.toDateString(), ')');
    console.log('📅 Is Sunday (Day of Rest):', isSunday);
    console.log('📅 Week Number:', weekNumber);
    
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
          where('date', '>=', weekStartStr),
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
          where('date', '>=', weekStartStr),
          where('date', '<=', weekEndStr)
        );
        const studentWeekSnapshot = await getDocs(studentWeekQuery);
        
        let studentTotal = 0;
        studentWeekSnapshot.forEach(docSnap => {
          const session = docSnap.data();
          // Count ALL sessions with duration (both completed and banked)
          if (session.duration && session.duration > 0) {
            studentTotal += session.duration;
            console.log(`  📖 Student ${student.firstName} session ${session.date}: ${session.duration} min (${session.completed ? 'completed' : 'banked'})`);
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
      weekStart: weekStartStr,
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
      dayOfWeek: today.getDay(),
      lastSynced: new Date().toISOString(),
      syncedBy: 'family-battle-sync',
      parentUidsChecked: parentUids
    };
    
    // STEP 5: AUTOMATIC XP AWARDING ON SUNDAY
    let xpAwardResults = null;
    if (isSunday && winner === 'children' && linkedStudents.length > 0) {
      console.log('🎮 SUNDAY VICTORY - Awarding XP automatically...');
      xpAwardResults = await awardXPToWinningTeam(syncedBattleData, linkedStudents);
      
      if (xpAwardResults.awarded) {
        console.log(`✅ XP awarded to ${xpAwardResults.totalStudentsAwarded} students for Week ${weekNumber} victory!`);
      }
    }
    
    // STEP 6: Update family document with synced data
    if (isSunday) {
      // Sunday: Save as completed week data
      const updateData = {
        'familyBattleSettings.lastCompletedWeek': syncedBattleData,
        'familyBattleSettings.lastCompletedWeekNumber': weekNumber,
        'familyBattleSettings.lastResultsViewedAt': serverTimestamp()
      };
      
      // Add XP award results if available
      if (xpAwardResults && xpAwardResults.awarded) {
        updateData[`familyBattleSettings.week${weekNumber}XPAwarded`] = true;
        updateData[`familyBattleSettings.week${weekNumber}XPAwardResults`] = xpAwardResults.results;
      }
      
      await updateDoc(familyRef, updateData);
      
      console.log('🙏 Sunday results saved as completed week with XP awards');
    } else {
      // Monday-Saturday: Update current week
      await updateDoc(familyRef, {
        'familyBattleSettings.currentWeek': {
          weekStart: weekStartStr,
          weekNumber: weekNumber,
          children: childrenMinutes,
          parents: parentMinutes,
          winner: 'ongoing',
          margin: margin,
          battleStatus: battleStatus,
          studentBreakdown: studentBreakdown,
          parentBreakdown: parentReadingSummary,
          isResultsDay: false,
          dayOfWeek: today.getDay(),
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
      isResultsDay: isSunday,
      xpAwarded: xpAwardResults?.awarded || false
    });
    
    return {
      ...syncedBattleData,
      xpAwardResults
    };
    
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
 * FIXED: Handles Monday-Saturday week calculation
 */
export const getStudentBattleContribution = async (studentData, weekStr = null) => {
  try {
    const today = new Date();
    
    if (!weekStr) {
      const { weekStartStr } = getBattleWeek(today);
      weekStr = weekStartStr;
    }
    
    // Get the end date for the week (Saturday, 5 days from Monday)
    const weekStartDate = new Date(weekStr);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 5); // 6-day week (Mon-Sat)
    const weekEndStr = getLocalDateString(weekEndDate);
    
    console.log(`📊 Getting student contribution for week: ${weekStr} to ${weekEndStr}`);
    
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
      // Count ALL sessions with duration (not just completed ones for battle)
      if (session.duration && session.duration > 0) {
        studentMinutes += session.duration;
        console.log(`  📖 Found session on ${session.date}: ${session.duration} min`);
      }
    });
    
    console.log(`📊 Student ${studentData.id} total contribution: ${studentMinutes} minutes`);
    return studentMinutes;
    
  } catch (error) {
    console.error('❌ Error getting student battle contribution:', error);
    return 0;
  }
};

/**
 * Check if student's family has battle enabled and get current battle data
 * FIXED: Properly loads Monday-Saturday data
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
    
    // Get student's individual contribution using consistent week calculation
    const today = new Date();
    const { weekStartStr } = getBattleWeek(today);
    
    console.log('📊 Getting student contribution for week starting:', weekStartStr);
    const studentContribution = await getStudentBattleContribution(studentData, weekStartStr);
    
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
 * Updated schedule:
 * Sunday: Prayerful (Day of Rest with Bible verses)
 * Monday-Tuesday: Encouraging
 * Wednesday-Thursday: Battle Ready
 * Friday-Saturday: Victorious
 */
export const getJaneAustenModeByDay = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  switch (dayOfWeek) {
    case 0: // Sunday - Prayerful Day of Rest
      return 'prayerful';
    case 1: // Monday - Encouraging
    case 2: // Tuesday - Encouraging
      return 'encouraging';
    case 3: // Wednesday - Battle Ready
    case 4: // Thursday - Battle Ready
      return 'battleReady';
    case 5: // Friday - Victorious
    case 6: // Saturday - Victorious
      return 'victorious';
    default:
      return 'encouraging';
  }
};

/**
 * Debug function to check battle sessions
 */
export const debugBattleSessions = async (studentData) => {
  try {
    console.log('🔍 DEBUG: Checking battle sessions for student');
    
    const today = new Date();
    const { weekStart, weekEnd, weekStartStr, weekEndStr, isSunday } = getBattleWeek(today);
    
    console.log('📅 Today:', today.toDateString(), `(${today.getDay() === 0 ? 'Sunday' : ['Mon','Tue','Wed','Thu','Fri','Sat'][today.getDay() - 1]})`);
    console.log('📅 Battle Week Start:', weekStartStr, '(', weekStart.toDateString(), ')');
    console.log('📅 Battle Week End:', weekEndStr, '(', weekEnd.toDateString(), ')');
    console.log('📅 Is Sunday Results Day:', isSunday);
    
    // Get ALL sessions for this student in the current week
    const sessionRef = collection(
      db, 
      `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`
    );
    
    // Query for this week's sessions
    const weekQuery = query(
      sessionRef, 
      where('date', '>=', weekStartStr),
      where('date', '<=', weekEndStr)
    );
    
    const weekSnapshot = await getDocs(weekQuery);
    
    console.log(`📚 Found ${weekSnapshot.size} sessions this week`);
    
    let totalMinutes = 0;
    const sessions = [];
    
    weekSnapshot.forEach(doc => {
      const session = doc.data();
      sessions.push(session);
      if (session.duration > 0) {
        totalMinutes += session.duration;
        console.log(`  📖 Session on ${session.date}:`, {
          duration: session.duration,
          completed: session.completed,
          bookId: session.bookId || 'no book',
          time: session.startTime
        });
      }
    });
    
    console.log(`📊 TOTAL MINUTES THIS WEEK: ${totalMinutes}`);
    
    // Also check today's sessions specifically
    const todayStr = getLocalDateString(today);
    const todayQuery = query(sessionRef, where('date', '==', todayStr));
    const todaySnapshot = await getDocs(todayQuery);
    
    let todayMinutes = 0;
    todaySnapshot.forEach(doc => {
      const session = doc.data();
      todayMinutes += session.duration || 0;
    });
    
    console.log(`📊 TODAY'S MINUTES (${todayStr}): ${todayMinutes}`);
    
    // Check if dates are being saved correctly
    if (sessions.length > 0) {
      console.log('🔍 Sample session date format:', sessions[0].date);
      console.log('🔍 Expected date format:', weekStartStr);
    }
    
    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      totalMinutes,
      todayMinutes,
      sessionCount: weekSnapshot.size
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return null;
  }
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
  debugBattleSessions
};