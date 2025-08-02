// lib/family-battle-sync.js - FIXED: Uses familyId correctly

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
// REAL-TIME DATA SYNCHRONIZATION
// ============================================================================

/**
 * FIXED: Now uses familyId instead of parentUid
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
    
    // Get parent UID from family document
    // Note: In the current structure, linkedParents might be an array of parent UIDs
    let parentUid = null;
    if (familyData.linkedParents && familyData.linkedParents.length > 0) {
      parentUid = familyData.linkedParents[0];
    } else if (familyData.createdBy) {
      parentUid = familyData.createdBy;
    } else if (familyData.parentUid) {
      // Some documents might store parentUid directly
      parentUid = familyData.parentUid;
    }
    
    // STEP 1: Calculate parent reading minutes
    let parentMinutes = 0;
    if (parentUid) {
      try {
        const parentSessionsRef = collection(db, `parents/${parentUid}/readingSessions`);
        const parentWeekQuery = query(parentSessionsRef, where('date', '>=', weekStr));
        const parentWeekSnapshot = await getDocs(parentWeekQuery);
        
        parentWeekSnapshot.forEach(docSnap => {
          const session = docSnap.data();
          parentMinutes += session.duration || 0;
        });
      } catch (error) {
        console.warn('⚠️ Could not load parent sessions, using 0:', error.message);
      }
    }
    
    console.log('👨‍👩 Parent total:', parentMinutes, 'minutes');
    
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
      isResultsDay,
      dayOfWeek,
      lastSynced: new Date().toISOString(),
      syncedBy: 'family-battle-sync'
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
        isResultsDay: isResultsDay,
        dayOfWeek: dayOfWeek,
        lastUpdated: serverTimestamp(),
        lastSynced: serverTimestamp()
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
      isResultsDay
    });
    
    return syncedBattleData;
    
  } catch (error) {
    console.error('❌ Error syncing family battle data:', error);
    throw error;
  }
};

/**
 * Get battle data from family document (for student view)
 * FIXED: Now uses familyId instead of assuming parentUid is familyId
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
      isResultsDay: currentWeek.isResultsDay || false,
      dayOfWeek: currentWeek.dayOfWeek,
      lastUpdated: currentWeek.lastUpdated,
      lastSynced: currentWeek.lastSynced
    };
    
  } catch (error) {
    console.error('❌ Error getting family battle data for student:', error);
    return null;
  }
};

/**
 * Real-time listener for family battle updates
 * FIXED: Now uses familyId
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
            isResultsDay: currentWeek.isResultsDay || false,
            dayOfWeek: currentWeek.dayOfWeek,
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
 * FIXED: Now uses familyId
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
 * FIXED: Now properly gets familyId from student data
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
  getJaneAustenModeByDay
};