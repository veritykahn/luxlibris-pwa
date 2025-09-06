// lib/firebase.js - Complete Updated Version with Phase Management, Enhanced Manual Student Clearing, and Fixed Parent Account Deletion
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, deleteUser } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAHpHH9n7C6gnEeyGToRy7znPp7jcfVbqI",
  authDomain: "lux-libris-saas.firebaseapp.com",
  projectId: "lux-libris-saas",
  storageBucket: "lux-libris-saas.firebasestorage.app",
  messagingSenderId: "850562238552",
  appId: "1:850562238552:web:d5c35c2cce0b7fca60e22d",
  measurementId: "G-501Y9M4Y59"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// ===== ACADEMIC YEAR SYSTEM =====
// Get current academic year (June to March cycle)
export const getCurrentAcademicYear = () => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // If it's January-May, we're in the second half of the academic year
  if (currentMonth <= 4) { // Jan-May
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  } else { // June-December
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  }
};

// Get academic year start and end dates
export const getAcademicYearDates = (academicYear) => {
  const [startYear] = academicYear.split('-');
  const startDate = new Date(parseInt(startYear), 5, 1); // June 1st
  const endDate = new Date(parseInt(startYear) + 1, 2, 31); // March 31st
  
  return { startDate, endDate };
};

// Initialize system configuration
export const initializeSystemConfig = async () => {
  try {
    const currentYear = getCurrentAcademicYear();
    const { startDate, endDate } = getAcademicYearDates(currentYear);
    
    const systemConfig = {
      currentAcademicYear: currentYear,
      programPhase: 'SETUP', // SETUP, ACTIVE, VOTING, RESULTS, CLOSED
      phaseStartDate: startDate,
      phaseEndDate: endDate,
      votingStartDate: new Date(parseInt(currentYear.split('-')[0]) + 1, 3, 1), // April 1st
      votingEndDate: new Date(parseInt(currentYear.split('-')[0]) + 1, 3, 14), // April 14th
      createdAt: new Date(),
      lastModified: new Date()
    };
    
    await setDoc(doc(db, 'systemConfig', 'current'), systemConfig);
    console.log('✅ System config initialized for', currentYear);
    return systemConfig;
  } catch (error) {
    console.error('❌ Error initializing system config:', error);
    throw error;
  }
};

// Get current system configuration
export const getSystemConfig = async () => {
  try {
    const configDoc = await getDoc(doc(db, 'systemConfig', 'current'));
    if (configDoc.exists()) {
      return configDoc.data();
    } else {
      // If no config exists, initialize it
      return await initializeSystemConfig();
    }
  } catch (error) {
    console.error('❌ Error getting system config:', error);
    return null;
  }
};

// Update program phase
export const updateProgramPhase = async (newPhase) => {
  try {
    await updateDoc(doc(db, 'systemConfig', 'current'), {
      programPhase: newPhase,
      lastModified: new Date()
    });
    console.log('✅ Program phase updated to:', newPhase);
  } catch (error) {
    console.error('❌ Error updating program phase:', error);
    throw error;
  }
};

// ===== PHASE TRANSITION LOGGING =====
// Log phase transitions for admin tracking
export const logPhaseTransition = async (fromPhase, toPhase, triggerType, timestamp) => {
  try {
    const logEntry = {
      fromPhase,
      toPhase,
      triggerType, // 'automatic' or 'manual'
      timestamp,
      academicYear: getCurrentAcademicYear(),
      createdAt: new Date()
    };

    await addDoc(collection(db, 'phaseTransitionLogs'), logEntry);
    console.log('📝 Phase transition logged:', logEntry);
  } catch (error) {
    console.error('❌ Error logging phase transition:', error);
    // Don't throw - logging failure shouldn't break phase transitions
  }
};

// ===== ACCOUNT DELETION FUNCTIONS =====

// Delete student account and all associated data
export const deleteStudentAccount = async (uid, studentId, entityId, schoolId) => {
  try {
    console.log('🗑️ Starting student account deletion process...');
    console.log('Student ID:', studentId, 'UID:', uid);
    
    const batch = writeBatch(db);
    
    // Step 1: Delete student document from entities structure
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
    batch.delete(studentRef);
    
    // Step 2: Remove student from any family connections
    try {
      // Search for families that have this student linked
      const familiesRef = collection(db, 'families');
      const familiesSnapshot = await getDocs(familiesRef);
      
      for (const familyDoc of familiesSnapshot.docs) {
        const familyData = familyDoc.data();
        if (familyData.linkedStudents && familyData.linkedStudents.includes(studentId)) {
          // Remove student from family's linked students array
          const updatedLinkedStudents = familyData.linkedStudents.filter(id => id !== studentId);
          batch.update(familyDoc.ref, { linkedStudents: updatedLinkedStudents });
          console.log('✅ Removed student from family:', familyDoc.id);
        }
      }
    } catch (familyError) {
      console.warn('⚠️ Could not update family connections:', familyError);
      // Don't fail the whole deletion for this
    }
    
    // Step 3: Commit all Firestore deletions
    await batch.commit();
    console.log('✅ Student data deleted from Firestore');
    
    // Step 4: Delete Firebase Auth account (this must be done by the user themselves)
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      await deleteUser(currentUser);
      console.log('✅ Firebase Auth account deleted');
    } else {
      console.warn('⚠️ Could not delete auth account - user must be signed in');
    }
    
    console.log('✅ Student account deletion completed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error deleting student account:', error);
    throw new Error(`Failed to delete account: ${error.message}`);
  }
};

// FIXED: Check parent's family status correctly
export const checkParentFamilyStatus = async (parentUid) => {
  try {
    console.log('🔍 Checking family status for parent:', parentUid);
    
    // Get parent document to find their familyId
    const parentDoc = await getDoc(doc(db, 'parents', parentUid));
    if (!parentDoc.exists()) {
      return {
        hasFamily: false,
        isOnlyParent: true,
        parentCount: 0,
        otherParents: [],
        familyId: null
      };
    }
    
    const parentData = parentDoc.data();
    const familyId = parentData.familyId;
    
    if (!familyId) {
      return {
        hasFamily: false,
        isOnlyParent: true,
        parentCount: 0,
        otherParents: [],
        familyId: null
      };
    }
    
    // Get the actual family document
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    if (!familyDoc.exists()) {
      return {
        hasFamily: false,
        isOnlyParent: true,
        parentCount: 0,
        otherParents: [],
        familyId: null
      };
    }
    
    const familyData = familyDoc.data();
    
    // Check BOTH arrays for compatibility (linkedParents is the correct one)
    const linkedParents = familyData.linkedParents || [];
    const legacyParents = familyData.parents || [];
    
    // Use linkedParents if available, fall back to parents for legacy families
    const allParents = linkedParents.length > 0 ? linkedParents : legacyParents;
    const otherParents = allParents.filter(pid => pid !== parentUid);
    
    console.log('📊 Family analysis:', {
      familyId,
      familyName: familyData.familyName,
      linkedParents,
      legacyParents: legacyParents,
      allParents,
      otherParents,
      isOnlyParent: allParents.length <= 1
    });
    
    return {
      hasFamily: true,
      isOnlyParent: allParents.length <= 1,
      parentCount: allParents.length,
      otherParents: otherParents,
      familyId: familyId,
      familyName: familyData.familyName || 'Your Family',
      familyData: familyData
    };
    
  } catch (error) {
    console.error('❌ Error checking parent family status:', error);
    return {
      hasFamily: false,
      isOnlyParent: true,
      parentCount: 0,
      otherParents: [],
      familyId: null
    };
  }
};

// FIXED: Core parent deletion function
const deleteParentAccountFixed = async (parentUid, familyStatus) => {
  try {
    console.log('🗑️ Executing parent account deletion with family status:', familyStatus);
    
    const batch = writeBatch(db);
    
    // Step 1: Delete parent document
    const parentRef = doc(db, 'parents', parentUid);
    batch.delete(parentRef);
    console.log('📝 Scheduled parent document deletion');
    
    let familyDeleted = false;
    let familyBattleDeactivated = false;
    
    // Step 2: Handle family document based on parent count
    if (familyStatus.hasFamily) {
      const familyRef = doc(db, 'families', familyStatus.familyId);
      
      if (familyStatus.isOnlyParent) {
        // Last parent - delete entire family
        batch.delete(familyRef);
        familyDeleted = true;
        familyBattleDeactivated = true; // Family deletion inherently deactivates battles
        console.log('🏠 Scheduled family document deletion (last parent)');
      } else {
        // Multi-parent family - remove this parent from arrays
        const updatedLinkedParents = familyStatus.otherParents;
        const updatedLegacyParents = (familyStatus.familyData.parents || []).filter(pid => pid !== parentUid);
        
        batch.update(familyRef, {
          linkedParents: updatedLinkedParents,
          parents: updatedLegacyParents, // Keep both for compatibility
          lastUpdated: new Date()
        });
        
        // DON'T deactivate family battle - other parents can continue
        // Just clean up this parent's data from current battle if needed
        if (familyStatus.familyData.familyBattle?.enabled) {
          console.log('⚔️ Family battle remains active for remaining parents');
          // Optionally: Remove this parent's data from current week breakdown
          // This would require additional logic to recalculate parent totals
        }
        
        console.log('👨‍👩‍👧‍👦 Scheduled removal from family arrays');
      }
    }
    
    // Step 3: Remove parent from children's linkedParents arrays
    if (familyStatus.familyData?.linkedStudents?.length > 0) {
      console.log('👶 Updating children\'s parent connections...');
      
      for (const studentEntry of familyStatus.familyData.linkedStudents) {
        try {
          const studentId = typeof studentEntry === 'string' ? studentEntry : studentEntry.studentId;
          const entityId = studentEntry.entityId;
          const schoolId = studentEntry.schoolId;
          
          if (studentId && entityId && schoolId) {
            const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
            
            if (familyStatus.isOnlyParent) {
              // Last parent - clear all parent connections and family battle
              batch.update(studentRef, {
                linkedParents: [],
                familyId: null,
                parentLinkingEnabled: false,
                'familyBattleSettings.enabled': false,
                'familyBattleSettings.deactivatedAt': new Date(),
                'familyBattleSettings.deactivatedReason': 'Family deletion',
                lastModified: new Date()
              });
              console.log(`✅ Scheduled complete parent disconnection for student: ${studentId}`);
            } else {
              // Multi-parent - just remove this parent from linkedParents
              // Note: We can't easily do array operations in batch, so we'll handle this separately
              console.log(`📝 Will remove parent ${parentUid} from student ${studentId} linkedParents`);
            }
          }
        } catch (studentError) {
          console.warn(`⚠️ Could not update student connections:`, studentError);
        }
      }
    }
    
    // Step 4: Commit batch operations
    await batch.commit();
    console.log('✅ Batch operations committed');
    
    // Step 5: Handle individual student linkedParents updates (can't batch array operations easily)
    if (familyStatus.hasFamily && !familyStatus.isOnlyParent && familyStatus.familyData?.linkedStudents?.length > 0) {
      console.log('🔄 Removing parent from individual student linkedParents arrays...');
      
      for (const studentEntry of familyStatus.familyData.linkedStudents) {
        try {
          const studentId = typeof studentEntry === 'string' ? studentEntry : studentEntry.studentId;
          const entityId = studentEntry.entityId;
          const schoolId = studentEntry.schoolId;
          
          if (studentId && entityId && schoolId) {
            const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
            const studentDoc = await getDoc(studentRef);
            
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              const currentLinkedParents = studentData.linkedParents || [];
              const updatedLinkedParents = currentLinkedParents.filter(pid => pid !== parentUid);
              
              await updateDoc(studentRef, {
                linkedParents: updatedLinkedParents,
                lastModified: new Date()
              });
              
              console.log(`✅ Removed parent ${parentUid} from student ${studentId} linkedParents`);
            }
          }
        } catch (studentError) {
          console.warn(`⚠️ Could not update student ${studentEntry.studentId}:`, studentError);
        }
      }
    }
    
    // Step 6: Delete Firebase Auth account (must be done by user themselves)
const currentUser = auth.currentUser;
if (currentUser && currentUser.uid === parentUid) {
  // Signal to AuthContext to ignore the upcoming auth change
  if (typeof window !== 'undefined') {
    window.luxlibris_deleting_account = true;
  }
  
  await deleteUser(currentUser);
  console.log('✅ Firebase Auth account deleted');
} else {
  console.warn('⚠️ Could not delete auth account - user must be signed in');
}
    
    console.log('✅ Parent account deletion completed successfully');
    
    return {
      success: true,
      wasOnlyParent: familyStatus.isOnlyParent,
      familyDeleted: familyDeleted,
      familyBattleDeactivated: familyBattleDeactivated,
      remainingParents: familyStatus.otherParents,
      affectedChildren: familyStatus.familyData?.linkedStudents?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Error in core parent deletion:', error);
    throw error;
  }
};

// Delete teacher account and all associated data
export const deleteTeacherAccount = async (uid, teacherId, entityId, schoolId) => {
  try {
    console.log('🗑️ Starting teacher account deletion process...');
    console.log('Teacher ID:', teacherId, 'UID:', uid);
    
    const batch = writeBatch(db);
    
    // Step 1: Get teacher data to understand scope of deletion
    const teacherRef = doc(db, `entities/${entityId}/schools/${schoolId}/teachers`, teacherId);
    const teacherDoc = await getDoc(teacherRef);
    
    if (!teacherDoc.exists()) {
      throw new Error('Teacher not found');
    }
    
    const teacherData = teacherDoc.data();
    
    // Step 2: Handle manual students (delete all manual students for this teacher)
    try {
      const manualStudentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers/${teacherId}/manualStudents`);
      const manualStudentsSnapshot = await getDocs(manualStudentsRef);
      
      manualStudentsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      console.log(`✅ Scheduled deletion of ${manualStudentsSnapshot.size} manual students`);
    } catch (manualError) {
      console.warn('⚠️ Could not delete manual students:', manualError);
    }
    
    // Step 3: Remove teacher connection from app students
    try {
      const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      
      studentsSnapshot.forEach(doc => {
        const studentData = doc.data();
        if (studentData.currentTeacherId === teacherId || studentData.teacherId === teacherId) {
          batch.update(doc.ref, { 
            currentTeacherId: null,
            teacherId: null,
            teacherName: null
          });
        }
      });
      
      console.log('✅ Scheduled removal of teacher connections from app students');
    } catch (studentError) {
      console.warn('⚠️ Could not update student connections:', studentError);
    }
    
    // Step 4: Delete teacher document
    batch.delete(teacherRef);
    
    // Step 5: Commit all Firestore deletions
    await batch.commit();
    console.log('✅ Teacher data deleted from Firestore');
    
    // Step 6: Delete Firebase Auth account (must be done by user themselves)
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      await deleteUser(currentUser);
      console.log('✅ Firebase Auth account deleted');
    } else {
      console.warn('⚠️ Could not delete auth account - user must be signed in');
    }
    
    console.log('✅ Teacher account deletion completed successfully');
    return { 
      success: true,
      manualStudentsDeleted: manualStudentsSnapshot?.size || 0
    };
    
  } catch (error) {
    console.error('❌ Error deleting teacher account:', error);
    throw new Error(`Failed to delete teacher account: ${error.message}`);
  }
};

// Delete admin account and all associated data
export const deleteAdminAccount = async (uid, adminId, entityId, schoolId) => {
  try {
    console.log('🗑️ Starting admin account deletion process...');
    console.log('Admin ID:', adminId, 'UID:', uid);
    
    const batch = writeBatch(db);
    
    // Step 1: Delete admin document
    const adminRef = doc(db, `entities/${entityId}/schools/${schoolId}/admins`, adminId);
    batch.delete(adminRef);
    
    // Step 2: Commit Firestore deletions
    await batch.commit();
    console.log('✅ Admin data deleted from Firestore');
    
    // Step 3: Delete Firebase Auth account
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid === uid) {
      await deleteUser(currentUser);
      console.log('✅ Firebase Auth account deleted');
    } else {
      console.warn('⚠️ Could not delete auth account - user must be signed in');
    }
    
    console.log('✅ Admin account deletion completed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error deleting admin account:', error);
    throw new Error(`Failed to delete admin account: ${error.message}`);
  }
};

// ===== DATA EXPORT BEFORE DELETION =====

// Export student data before deletion (GDPR compliance)
export const exportStudentData = async (studentId, entityId, schoolId) => {
  try {
    console.log('📦 Exporting student data...');
    
    // Get student data
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const studentData = studentDoc.data();
    
    // Create export package
    const exportData = {
      exportDate: new Date().toISOString(),
      accountType: 'student',
      personalInfo: {
        firstName: studentData.firstName,
        lastInitial: studentData.lastInitial,
        grade: studentData.grade,
        displayUsername: studentData.displayUsername,
        schoolName: studentData.schoolName,
        joinedDate: studentData.createdAt?.toDate?.()?.toISOString() || 'Unknown'
      },
      readingData: {
        bookshelf: studentData.bookshelf || [],
        booksSubmittedThisYear: studentData.booksSubmittedThisYear || 0,
        personalGoal: studentData.personalGoal || 0,
        votes: studentData.votes || [],
        readingSettings: studentData.readingSettings || {}
      },
      achievements: {
        badges: studentData.badges || [],
        unlockedSaints: studentData.unlockedSaints || [],
        totalXP: studentData.totalXP || 0,
        lifetimeBooksSubmitted: studentData.lifetimeBooksSubmitted || 0
      },
      preferences: {
        selectedTheme: studentData.selectedTheme || 'classic_lux',
        notificationSettings: studentData.notificationSettings || {}
      }
    };
    
    // Convert to JSON string for download
    const exportJson = JSON.stringify(exportData, null, 2);
    
    console.log('✅ Student data export prepared');
    return {
      success: true,
      data: exportJson,
      filename: `lux-libris-student-${studentData.firstName}-${studentData.lastInitial}-${new Date().toISOString().split('T')[0]}.json`
    };
    
  } catch (error) {
    console.error('❌ Error exporting student data:', error);
    throw new Error(`Failed to export student data: ${error.message}`);
  }
};

// Export parent data before deletion
export const exportParentData = async (parentUid) => {
  try {
    console.log('📦 Exporting parent data...');
    
    // Get parent data
    const parentRef = doc(db, 'parents', parentUid);
    const parentDoc = await getDoc(parentRef);
    
    if (!parentDoc.exists()) {
      throw new Error('Parent not found');
    }
    
    const parentData = parentDoc.data();
    
    // Get family data
    const familyRef = doc(db, 'families', parentUid);
    const familyDoc = await getDoc(familyRef);
    const familyData = familyDoc.exists() ? familyDoc.data() : {};
    
    // Create export package
    const exportData = {
      exportDate: new Date().toISOString(),
      accountType: 'parent',
      personalInfo: {
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        email: parentData.email,
        joinedDate: parentData.createdAt?.toDate?.()?.toISOString() || 'Unknown'
      },
      familyInfo: {
        familyName: familyData.familyName || '',
        linkedStudents: parentData.linkedStudents || [],
        linkedStudentCount: (parentData.linkedStudents || []).length
      },
      teacherCodes: {
        savedQuizCodes: parentData.savedQuizCodes || [],
        quizApprovalsGiven: parentData.quizApprovalsGiven || 0
      }
    };
    
    // Convert to JSON string for download
    const exportJson = JSON.stringify(exportData, null, 2);
    
    console.log('✅ Parent data export prepared');
    return {
      success: true,
      data: exportJson,
      filename: `lux-libris-parent-${parentData.firstName}-${parentData.lastName}-${new Date().toISOString().split('T')[0]}.json`
    };
    
  } catch (error) {
    console.error('❌ Error exporting parent data:', error);
    throw new Error(`Failed to export parent data: ${error.message}`);
  }
};

// ===== AUDIT LOGGING FOR DELETIONS =====

// Log account deletion for audit purposes
export const logAccountDeletion = async (accountType, accountId, userEmail, reason = 'User requested') => {
  try {
    const logEntry = {
      timestamp: new Date(),
      accountType: accountType, // 'student', 'parent', 'teacher', 'admin'
      accountId: accountId,
      userEmail: userEmail,
      reason: reason,
      deletedBy: 'self', // or admin ID if deleted by admin
      academicYear: getCurrentAcademicYear(),
      ipAddress: 'not-tracked', // Could be added if needed
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    };
    
    await addDoc(collection(db, 'accountDeletionLogs'), logEntry);
    console.log('📝 Account deletion logged for audit purposes');
    
  } catch (error) {
    console.error('❌ Error logging account deletion:', error);
    // Don't throw - logging failure shouldn't prevent deletion
  }
};

// ===== ENHANCED STUDENT DELETION WITH EXPORT =====

// Enhanced student deletion with data export option
export const deleteStudentAccountWithExport = async (uid, studentId, entityId, schoolId, exportData = true) => {
  try {
    let exportResult = null;
    
    // Step 1: Export data if requested
    if (exportData) {
      exportResult = await exportStudentData(studentId, entityId, schoolId);
    }
    
    // Step 2: Get student email for logging
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
    const studentDoc = await getDoc(studentRef);
    const studentData = studentDoc.data();
    
    // Step 3: Log the deletion
    await logAccountDeletion('student', studentId, studentData.authEmail || 'unknown');
    
    // Step 4: Perform the deletion
    const deletionResult = await deleteStudentAccount(uid, studentId, entityId, schoolId);
    
    return {
      success: true,
      export: exportResult,
      deletion: deletionResult
    };
    
  } catch (error) {
    console.error('❌ Error in enhanced student deletion:', error);
    throw error;
  }
};

// FIXED: Delete parent account with proper multi-parent support
export const deleteParentAccountWithExport = async (parentUid, linkedStudents = [], exportData = true) => {
  try {
    console.log('🗑️ Starting enhanced parent account deletion...');
    console.log('Parent UID:', parentUid);
    console.log('Linked students:', linkedStudents);
    
    let exportResult = null;
    
    // Step 1: Export data if requested
    if (exportData) {
      exportResult = await exportParentData(parentUid);
    }
    
    // Step 2: Get parent's family status
    const familyStatus = await checkParentFamilyStatus(parentUid);
    console.log('📋 Family status:', familyStatus);
    
    // Step 3: Get parent data for logging
    const parentDoc = await getDoc(doc(db, 'parents', parentUid));
    const parentData = parentDoc.data();
    
    // Step 4: Log the deletion
    await logAccountDeletion('parent', parentUid, parentData.email || 'unknown');
    
    // Step 5: Perform the deletion with proper family handling
    const deletionResult = await deleteParentAccountFixed(parentUid, familyStatus);
    
    return {
      success: true,
      export: exportResult,
      deletion: deletionResult,
      wasOnlyParent: deletionResult.wasOnlyParent,
      familyDeleted: deletionResult.familyDeleted,
      familyBattleDeactivated: deletionResult.familyBattleDeactivated
    };
    
  } catch (error) {
    console.error('❌ Error in enhanced parent deletion:', error);
    throw error;
  }
};

// ===== ACCOUNT RECOVERY FUNCTIONS =====

// Create account recovery backup (before deletion)
export const createAccountRecoveryBackup = async (accountType, accountId, entityId = null, schoolId = null) => {
  try {
    console.log('💾 Creating account recovery backup...');
    
    let accountData = null;
    let backupRef = null;
    
    if (accountType === 'student') {
      const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, accountId);
      const studentDoc = await getDoc(studentRef);
      accountData = studentDoc.exists() ? studentDoc.data() : null;
      backupRef = `recovery/students/${accountId}`;
    } else if (accountType === 'parent') {
      const parentRef = doc(db, 'parents', accountId);
      const parentDoc = await getDoc(parentRef);
      accountData = parentDoc.exists() ? parentDoc.data() : null;
      backupRef = `recovery/parents/${accountId}`;
    } else if (accountType === 'teacher') {
      const teacherRef = doc(db, `entities/${entityId}/schools/${schoolId}/teachers`, accountId);
      const teacherDoc = await getDoc(teacherRef);
      accountData = teacherDoc.exists() ? teacherDoc.data() : null;
      backupRef = `recovery/teachers/${accountId}`;
    }
    
    if (!accountData) {
      throw new Error('Account not found for backup');
    }
    
    // Create backup with metadata
    const backupData = {
      originalData: accountData,
      deletionDate: new Date(),
      accountType: accountType,
      entityId: entityId,
      schoolId: schoolId,
      recoveryExpires: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
      canRecover: true
    };
    
    // Store backup (this would typically go to a separate backup collection)
    await setDoc(doc(db, 'accountRecoveryBackups', accountId), backupData);
    
    console.log('✅ Account recovery backup created');
    return { success: true, backupId: accountId };
    
  } catch (error) {
    console.error('❌ Error creating recovery backup:', error);
    throw error;
  }
};

// ===== ADMIN FUNCTIONS FOR BULK DELETION =====

// Admin function to delete multiple accounts (for GDPR requests)
export const adminBulkDeleteAccounts = async (adminUid, deletionRequests) => {
  try {
    console.log('👨‍💼 Admin bulk deletion initiated by:', adminUid);
    console.log('📋 Deletion requests:', deletionRequests.length);
    
    const results = [];
    
    for (const request of deletionRequests) {
      try {
        let result = null;
        
        if (request.accountType === 'student') {
          result = await deleteStudentAccountWithExport(
            request.uid, 
            request.accountId, 
            request.entityId, 
            request.schoolId,
            request.exportData || true
          );
        } else if (request.accountType === 'parent') {
          result = await deleteParentAccountWithExport(
            request.uid,
            request.linkedStudents || [],
            request.exportData || true
          );
        }
        
        results.push({
          ...request,
          status: 'success',
          result: result
        });
        
        // Log admin action
        await logAccountDeletion(
          request.accountType, 
          request.accountId, 
          request.email || 'unknown',
          `Admin bulk deletion by ${adminUid}`
        );
        
      } catch (error) {
        console.error(`❌ Failed to delete account ${request.accountId}:`, error);
        results.push({
          ...request,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log('✅ Admin bulk deletion completed');
    return {
      success: true,
      processedRequests: results.length,
      successfulDeletions: results.filter(r => r.status === 'success').length,
      failedDeletions: results.filter(r => r.status === 'error').length,
      results: results
    };
    
  } catch (error) {
    console.error('❌ Error in admin bulk deletion:', error);
    throw error;
  }
};

// ===== PARENT AND FAMILY DETAIL FUNCTIONS =====

// Get parent details for linked parents
export const getLinkedParentDetails = async (parentIds = []) => {
  try {
    if (!parentIds || parentIds.length === 0) {
      return [];
    }
    
    const parentDetails = [];
    
    for (const parentId of parentIds) {
      try {
        const parentDoc = await getDoc(doc(db, 'parents', parentId));
        if (parentDoc.exists()) {
          const parentData = parentDoc.data();
          parentDetails.push({
            id: parentId,
            firstName: parentData.firstName,
            lastName: parentData.lastName,
            email: parentData.email
          });
        }
      } catch (error) {
        console.error('Error fetching parent:', parentId, error);
      }
    }
    
    return parentDetails;
  } catch (error) {
    console.error('Error getting linked parent details:', error);
    return [];
  }
};

// Get family details
export const getFamilyDetails = async (familyId) => {
  try {
    if (!familyId) return null;
    
    const familyDoc = await getDoc(doc(db, 'families', familyId));
    if (familyDoc.exists()) {
      return familyDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting family details:', error);
    return null;
  }
};

// ===== STUDENT DATA CLEARING FOR NEW ACADEMIC YEAR =====

// Clear all student data for new academic year while preserving permanent achievements
export const clearAllStudentDataForNewYear = async () => {
  try {
    console.log('🗑️ Starting student data clearing for new academic year...');
    
    let totalStudentsCleared = 0;
    const currentYear = getCurrentAcademicYear();
    
    // Clear students in entities collection (dioceses/ISDs)
    const entitiesRef = collection(db, 'entities');
    const entitiesSnapshot = await getDocs(entitiesRef);
    
    for (const entityDoc of entitiesSnapshot.docs) {
      const entityId = entityDoc.id;
      
      try {
        const schoolsRef = collection(db, `entities/${entityId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id;
          
          try {
            const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
            const studentsSnapshot = await getDocs(studentsRef);
            
            for (const studentDoc of studentsSnapshot.docs) {
              const studentData = studentDoc.data();
              
              // Clear this student's data
              await clearIndividualStudentData(studentDoc.ref, studentData, currentYear);
              totalStudentsCleared++;
            }
          } catch (error) {
            console.log(`No students in school ${schoolId}:`, error);
          }
        }
      } catch (error) {
        console.log(`No schools in entity ${entityId}:`, error);
      }
    }
    
    // Also clear students in direct schools collection (single schools)
    const directSchoolsRef = collection(db, 'schools');
    const directSchoolsSnapshot = await getDocs(directSchoolsRef);
    
    for (const schoolDoc of directSchoolsSnapshot.docs) {
      const schoolData = schoolDoc.data();
      
      if (schoolData.type === 'single_school') {
        try {
          const studentsRef = collection(db, `schools/${schoolDoc.id}/students`);
          const studentsSnapshot = await getDocs(studentsRef);
          
          for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data();
            
            // Clear this student's data
            await clearIndividualStudentData(studentDoc.ref, studentData, currentYear);
            totalStudentsCleared++;
          }
        } catch (error) {
          console.log(`No students in single school ${schoolDoc.id}:`, error);
        }
      }
    }
    
    console.log(`✅ Student data cleared for ${totalStudentsCleared} students`);
    return { 
      success: true, 
      studentsCleared: totalStudentsCleared,
      academicYear: currentYear
    };
    
  } catch (error) {
    console.error('❌ Error clearing student data:', error);
    throw error;
  }
};

// Clear individual student data while preserving permanent achievements
export const clearIndividualStudentData = async (studentRef, studentData, newAcademicYear) => {
  try {
    const updateData = {
      // CLEAR: Reading progress data
      bookshelf: [],
      booksSubmittedThisYear: 0,
      votes: [],
      
      // CLEAR: Badge achievements (except permanent ones)
      badges: [],
      
      // CLEAR: Year-specific stats
      currentYearGoal: 10, // Reset to default
      personalGoal: 10,    // Reset to default
      
      // PRESERVE: Permanent achievements (saints, streaks, lifetime stats)
      // unlockedSaints: [existing] - keep as is
      // readingStreaks: [existing] - keep as is  
      // totalXP: existing - keep as is
      // lifetimeBooksSubmitted: existing - keep as is
      
      // UPDATE: Academic year tracking
      academicYear: newAcademicYear,
      
      // RESET: Voting flags
      hasVotedThisYear: false,
      
      // METADATA
      lastDataClearing: new Date(),
      lastModified: new Date()
    };
    
    // Only update the fields we want to change, preserve the rest
    await updateDoc(studentRef, updateData);
    
    console.log(`✅ Cleared data for student: ${studentData.firstName || 'Unknown'}`);
    
  } catch (error) {
    console.error('❌ Error clearing individual student data:', error);
    throw error;
  }
};

// ===== ENHANCED MANUAL STUDENT CLEARING FUNCTIONS =====

// ENHANCED: Clear individual manual student data while preserving student record
export const clearIndividualManualStudentData = async (manualStudentRef, studentData, newAcademicYear) => {
  try {
    const updateData = {
      // CLEAR: Book completion data
      booksSubmitted: [],
      totalBooksThisYear: 0,
      
      // CLEAR: Voting data
      vote: null,
      hasVotedThisYear: false,
      
      // UPDATE: Academic year tracking
      academicYear: newAcademicYear,
      
      // METADATA
      lastDataClearing: new Date(),
      lastModified: new Date()
    };
    
    await updateDoc(manualStudentRef, updateData);
    console.log(`✅ Cleared manual student data for: ${studentData.firstName || 'Unknown'}`);
    
  } catch (error) {
    console.error('❌ Error clearing individual manual student data:', error);
    throw error;
  }
};

// ENHANCED: Clear all manual students across all teachers
export const clearAllManualStudentsForNewYear = async () => {
  try {
    console.log('🗑️ Starting manual student data clearing for new academic year...');
    
    let totalManualStudentsCleared = 0;
    const currentYear = getCurrentAcademicYear();
    
    // Clear manual students in entities collection
    const entitiesRef = collection(db, 'entities');
    const entitiesSnapshot = await getDocs(entitiesRef);
    
    for (const entityDoc of entitiesSnapshot.docs) {
      const entityId = entityDoc.id;
      
      try {
        const schoolsRef = collection(db, `entities/${entityId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id;
          
          try {
            const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
            const teachersSnapshot = await getDocs(teachersRef);
            
            for (const teacherDoc of teachersSnapshot.docs) {
              const teacherId = teacherDoc.id;
              
              try {
                const manualStudentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers/${teacherId}/manualStudents`);
                const manualStudentsSnapshot = await getDocs(manualStudentsRef);
                
                for (const studentDoc of manualStudentsSnapshot.docs) {
                  const studentData = studentDoc.data();
                  await clearIndividualManualStudentData(studentDoc.ref, studentData, currentYear);
                  totalManualStudentsCleared++;
                }
              } catch (error) {
                console.log(`No manual students for teacher ${teacherId}`);
              }
            }
          } catch (error) {
            console.log(`No teachers in school ${schoolId}`);
          }
        }
      } catch (error) {
        console.log(`No schools in entity ${entityId}`);
      }
    }
    
    console.log(`✅ Manual student data cleared for ${totalManualStudentsCleared} students`);
    return { 
      success: true, 
      manualStudentsCleared: totalManualStudentsCleared,
      academicYear: currentYear
    };
    
  } catch (error) {
    console.error('❌ Error clearing manual student data:', error);
    throw error;
  }
};

// ENHANCED: Complete year transition with both app and manual student clearing
export const transitionToTeacherSelectionWithCompleteClearing = async () => {
  try {
    console.log('🔄 Starting RESULTS → TEACHER_SELECTION transition with complete data clearing...');
    
    // Step 1: Clear all app student data first
    console.log('📱 Step 1: Clearing app student data...');
    const appClearingResult = await clearAllStudentDataForNewYear();
    
    // Step 2: Clear all manual student data
    console.log('📝 Step 2: Clearing manual student data...');
    const manualClearingResult = await clearAllManualStudentsForNewYear();
    
    // Step 3: Update phase to TEACHER_SELECTION
    console.log('👩‍🏫 Step 3: Updating phase to TEACHER_SELECTION...');
    await updateProgramPhase('TEACHER_SELECTION');
    
    // Step 4: Log the transition
    await logPhaseTransition('RESULTS', 'TEACHER_SELECTION', 'automatic', new Date());
    
    console.log('✅ RESULTS → TEACHER_SELECTION transition completed with complete data clearing');
    
    return {
      success: true,
      newPhase: 'TEACHER_SELECTION',
      appStudentsCleared: appClearingResult.studentsCleared,
      manualStudentsCleared: manualClearingResult.manualStudentsCleared,
      message: `Successfully transitioned to TEACHER_SELECTION and cleared data for ${appClearingResult.studentsCleared} app students and ${manualClearingResult.manualStudentsCleared} manual students`
    };
    
  } catch (error) {
    console.error('❌ Error in RESULTS → TEACHER_SELECTION transition:', error);
    throw error;
  }
};

// ===== ENHANCED PHASE TRANSITION WITH STUDENT DATA CLEARING =====

// Enhanced function to handle RESULTS → TEACHER_SELECTION with data clearing
export const transitionToTeacherSelectionWithClearing = async () => {
  try {
    console.log('🔄 Starting RESULTS → TEACHER_SELECTION transition with data clearing...');
    
    // Step 1: Clear all student data first
    console.log('🗑️ Step 1: Clearing student data...');
    const clearingResult = await clearAllStudentDataForNewYear();
    
    // Step 2: Update phase to TEACHER_SELECTION
    console.log('👩‍🏫 Step 2: Updating phase to TEACHER_SELECTION...');
    await updateProgramPhase('TEACHER_SELECTION');
    
    // Step 3: Log the transition
    await logPhaseTransition('RESULTS', 'TEACHER_SELECTION', 'manual', new Date());
    
    console.log('✅ RESULTS → TEACHER_SELECTION transition completed with data clearing');
    
    return {
      success: true,
      newPhase: 'TEACHER_SELECTION',
      studentsCleared: clearingResult.studentsCleared,
      message: `Successfully transitioned to TEACHER_SELECTION and cleared data for ${clearingResult.studentsCleared} students`
    };
    
  } catch (error) {
    console.error('❌ Error in RESULTS → TEACHER_SELECTION transition:', error);
    throw error;
  }
};

// ===== ENHANCED AUTOMATIC PHASE CHECKING WITH COMPLETE STUDENT CLEARING =====

// Enhanced version with complete clearing (both app and manual students)
export const checkAndUpdatePhasesWithCompleteClearing = async () => {
  try {
    const config = await getSystemConfig();
    const now = new Date();
    const currentPhase = config.programPhase;
    
    console.log('🔍 Checking automatic phase transitions with complete clearing...', {
      currentPhase,
      currentTime: now.toISOString()
    });

    let newPhase = currentPhase;
    let shouldUpdate = false;
    let shouldClearStudents = false;

    // March 31st: ACTIVE → VOTING (automatic)
    if (currentPhase === 'ACTIVE' && 
        config.votingStartDate && 
        now >= config.votingStartDate.toDate()) {
      newPhase = 'VOTING';
      shouldUpdate = true;
      console.log('🗳️ Auto-transition: ACTIVE → VOTING (March 31st)');
    }

    // April 14th: VOTING → RESULTS (automatic)
    else if (currentPhase === 'VOTING' && 
             config.votingEndDate && 
             now >= config.votingEndDate.toDate()) {
      newPhase = 'RESULTS';
      shouldUpdate = true;
      console.log('🏆 Auto-transition: VOTING → RESULTS (April 14th)');
    }

    // May 24th: RESULTS → TEACHER_SELECTION (automatic with COMPLETE student clearing)
    else if (currentPhase === 'RESULTS') {
      // Check if it's May 24th or later (teacher selection period)
      const currentYearInt = parseInt(getCurrentAcademicYear().split('-')[0]);
      const teacherSelectionDate = new Date(currentYearInt + 1, 4, 24); // May 24th
      
      if (now >= teacherSelectionDate) {
        newPhase = 'TEACHER_SELECTION';
        shouldUpdate = true;
        shouldClearStudents = true; // CLEAR BOTH APP AND MANUAL STUDENT DATA
        console.log('🗑️ Auto-transition: RESULTS → TEACHER_SELECTION (May 24th) with complete student clearing');
      }
    }

    // June 1st: TEACHER_SELECTION → ACTIVE (automatic - new academic year starts)
    else if (currentPhase === 'TEACHER_SELECTION') {
      const currentYearInt = parseInt(getCurrentAcademicYear().split('-')[0]);
      const activeDate = new Date(currentYearInt + 1, 5, 1); // June 1st
      
      if (now >= activeDate) {
        newPhase = 'ACTIVE';
        shouldUpdate = true;
        console.log('📚 Auto-transition: TEACHER_SELECTION → ACTIVE (June 1st - New academic year)');
      }
    }

    // Update phase if needed
    if (shouldUpdate) {
      if (shouldClearStudents) {
        // Use the enhanced complete clearing function
        const result = await transitionToTeacherSelectionWithCompleteClearing();
        
        console.log(`✅ Phase automatically updated with complete student clearing: ${currentPhase} → ${newPhase}`);
        console.log(`🗑️ Cleared data for ${result.appStudentsCleared} app students and ${result.manualStudentsCleared} manual students`);
        
        return { 
          updated: true, 
          oldPhase: currentPhase, 
          newPhase,
          appStudentsCleared: result.appStudentsCleared,
          manualStudentsCleared: result.manualStudentsCleared,
          clearedData: true
        };
      } else {
        // Normal phase transition without clearing
        await updateProgramPhase(newPhase);
        await logPhaseTransition(currentPhase, newPhase, 'automatic', now);
        
        console.log(`✅ Phase automatically updated: ${currentPhase} → ${newPhase}`);
        return { updated: true, oldPhase: currentPhase, newPhase };
      }
    }

    return { updated: false, currentPhase };

  } catch (error) {
    console.error('❌ Error in automatic phase checking with complete clearing:', error);
    return { updated: false, error: error.message };
  }
};

// Update the existing checkAndUpdatePhasesWithClearing function to use enhanced version
export const checkAndUpdatePhasesWithClearing = checkAndUpdatePhasesWithCompleteClearing;

// ===== MANUAL STUDENT RESET FUNCTIONS =====
// Clear manual student data for new academic year
export const resetManualStudentsForNewYear = async (entityId, schoolId, teacherId) => {
  try {
    console.log('🔄 Resetting manual students for new academic year...');
    
    const manualStudentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers/${teacherId}/manualStudents`);
    const manualStudentsSnapshot = await getDocs(manualStudentsRef);
    
    const resetPromises = [];
    
    manualStudentsSnapshot.forEach(doc => {
      const resetData = {
        booksSubmitted: [], // Clear all book submissions
        totalBooksThisYear: 0, // Reset counter to 0
        lastModified: new Date()
        // Keep all other student info (name, grade, etc.)
      };
      
      resetPromises.push(updateDoc(doc.ref, resetData));
    });
    
    await Promise.all(resetPromises);
    
    console.log(`✅ Reset ${manualStudentsSnapshot.size} manual students for new academic year`);
    return { 
      success: true, 
      studentsReset: manualStudentsSnapshot.size 
    };
    
  } catch (error) {
    console.error('❌ Error resetting manual students:', error);
    throw error;
  }
};

// Reset ALL teachers' manual students (system-wide)
export const resetAllManualStudentsForNewYear = async () => {
  try {
    console.log('🌍 Resetting ALL manual students across all schools...');
    
    let totalReset = 0;
    
    // Get all entities
    const entitiesRef = collection(db, 'entities');
    const entitiesSnapshot = await getDocs(entitiesRef);
    
    for (const entityDoc of entitiesSnapshot.docs) {
      const entityId = entityDoc.id;
      
      try {
        // Get all schools in this entity
        const schoolsRef = collection(db, `entities/${entityId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id;
          
          try {
            // Get all teachers in this school
            const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
            const teachersSnapshot = await getDocs(teachersRef);
            
            for (const teacherDoc of teachersSnapshot.docs) {
              const teacherId = teacherDoc.id;
              
              try {
                const result = await resetManualStudentsForNewYear(entityId, schoolId, teacherId);
                totalReset += result.studentsReset;
              } catch (error) {
                console.log(`No manual students for teacher ${teacherId}`);
              }
            }
          } catch (error) {
            console.log(`No teachers in school ${schoolId}`);
          }
        }
      } catch (error) {
        console.log(`No schools in entity ${entityId}`);
      }
    }
    
    console.log(`✅ Reset ${totalReset} manual students across all schools`);
    return { success: true, totalStudentsReset: totalReset };
    
  } catch (error) {
    console.error('❌ Error resetting all manual students:', error);
    throw error;
  }
};

// ===== ENHANCED PHASE CHECKING WITH AUTOMATIC STUDENT RESET =====
// Check and automatically update phases with student reset during SETUP
export const checkAndUpdatePhases = async () => {
  try {
    const config = await getSystemConfig();
    const now = new Date();
    const currentPhase = config.programPhase;
    
    console.log('🔍 Checking automatic phase transitions...', {
      currentPhase,
      currentTime: now.toISOString(),
      votingStart: config.votingStartDate?.toDate?.()?.toISOString(),
      votingEnd: config.votingEndDate?.toDate?.()?.toISOString()
    });

    let newPhase = currentPhase;
    let shouldUpdate = false;

    // March 31st: ACTIVE → VOTING (automatic)
    if (currentPhase === 'ACTIVE' && 
        config.votingStartDate && 
        now >= config.votingStartDate.toDate()) {
      newPhase = 'VOTING';
      shouldUpdate = true;
      console.log('🗳️ Auto-transition: ACTIVE → VOTING (March 31st)');
    }

    // April 14th: VOTING → RESULTS (automatic)
    else if (currentPhase === 'VOTING' && 
             config.votingEndDate && 
             now >= config.votingEndDate.toDate()) {
      newPhase = 'RESULTS';
      shouldUpdate = true;
      console.log('🏆 Auto-transition: VOTING → RESULTS (April 14th)');
    }

    // June 1st: TEACHER_SELECTION → ACTIVE (automatic - new academic year starts)
    else if (currentPhase === 'TEACHER_SELECTION') {
      const currentYear = getCurrentAcademicYear();
      const { startDate } = getAcademicYearDates(currentYear);
      
      if (now >= startDate) {
        newPhase = 'ACTIVE';
        shouldUpdate = true;
        console.log('📚 Auto-transition: TEACHER_SELECTION → ACTIVE (June 1st - New academic year)');
      }
    }

    // Update phase if needed
    if (shouldUpdate) {
      await updateProgramPhase(newPhase);
      
      // Log the transition
      await logPhaseTransition(currentPhase, newPhase, 'automatic', now);
      
      console.log(`✅ Phase automatically updated: ${currentPhase} → ${newPhase}`);
      return { updated: true, oldPhase: currentPhase, newPhase };
    }

    return { updated: false, currentPhase };

  } catch (error) {
    console.error('❌ Error in automatic phase checking:', error);
    return { updated: false, error: error.message };
  }
};

// ===== ENHANCED YEAR-OVER-YEAR FUNCTIONS =====
// Manual trigger for GOD MODE with student reset during SETUP
export const releaseNewYearToTeachersWithReset = async () => {
  try {
    const config = await getSystemConfig();
    
    if (config.programPhase !== 'RESULTS') {
      throw new Error(`Cannot release to teachers from phase: ${config.programPhase}. Must be in RESULTS phase.`);
    }

    console.log('🚀 Starting new year release process...');
    
    // Step 1: Transition to SETUP phase first
    console.log('⚙️ Step 1: Switching to SETUP phase...');
    await updateProgramPhase('SETUP');
    
    // Step 2: Reset all manual student data during SETUP
    console.log('📚 Step 2: Clearing manual student book data during SETUP...');
    const resetResult = await resetAllManualStudentsForNewYear();
    
    // Step 3: Transition to TEACHER_SELECTION phase  
    console.log('👩‍🏫 Step 3: Switching to TEACHER_SELECTION phase...');
    await updateProgramPhase('TEACHER_SELECTION');
    
    // Step 4: Log the final transition
    await logPhaseTransition('RESULTS', 'TEACHER_SELECTION', 'manual', new Date());
    
    console.log('✅ New year release completed successfully');
    
    return { 
      success: true, 
      newPhase: 'TEACHER_SELECTION',
      studentsReset: resetResult.totalStudentsReset
    };

  } catch (error) {
    console.error('❌ Error releasing new year to teachers:', error);
    throw error;
  }
};

// FIXED: Check if teacher needs to complete year-over-year setup
export const checkTeacherYearOverYearStatus = async (entityId, schoolId, teacherUid) => {
  try {
    const config = await getSystemConfig();
    const currentYear = getCurrentAcademicYear();
    
    // Get teacher data
    const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
    const teacherQuery = query(teachersRef, where('uid', '==', teacherUid));
    const teacherSnapshot = await getDocs(teacherQuery);
    
    if (teacherSnapshot.empty) {
      throw new Error('Teacher not found');
    }
    const teacherData = teacherSnapshot.docs[0].data();
    
    // Check various conditions
    const isTeacherSelectionPhase = config.programPhase === 'TEACHER_SELECTION';
    
    // ENHANCED: Check if teacher has completed setup for current year
    const hasCompletedThisYear = teacherData.lastYearOverYearSelection === currentYear || 
                               (teacherData.onboardingAcademicYear === currentYear && teacherData.onboardingCompleted);
    
    // ENHANCED: Check if teacher is new (onboarded this year)
    const isNewTeacher = teacherData.onboardingAcademicYear === currentYear;
    
    // ENHANCED: Better logic for determining if setup is needed
    const needsYearOverYearSetup = isTeacherSelectionPhase && 
                                  !hasCompletedThisYear && 
                                  !isNewTeacher;
    
    console.log('🔍 Teacher year-over-year status check:', {
      teacherUid,
      currentYear,
      currentPhase: config.programPhase,
      lastYearOverYearSelection: teacherData.lastYearOverYearSelection,
      onboardingAcademicYear: teacherData.onboardingAcademicYear,
      onboardingCompleted: teacherData.onboardingCompleted,
      hasCompletedThisYear,
      isNewTeacher,
      needsYearOverYearSetup
    });
    
    return {
      currentPhase: config.programPhase,
      currentYear,
      isTeacherSelectionPhase,
      hasCompletedThisYear,
      isNewTeacher,
      needsYearOverYearSetup,
      teacherData: {
        id: teacherSnapshot.docs[0].id,
        ...teacherData
      }
    };
    
  } catch (error) {
    console.error('❌ Error checking teacher year-over-year status:', error);
    throw error;
  }
};

// Save teacher's year-over-year selections
export const saveTeacherYearOverYearSelection = async (entityId, schoolId, teacherUid, selections) => {
  try {
    const status = await checkTeacherYearOverYearStatus(entityId, schoolId, teacherUid);
    
    if (!status.needsYearOverYearSetup) {
      throw new Error('Teacher does not need year-over-year setup');
    }

    // Get teacher's original book limit
    const originalBookCount = status.teacherData.selectedNominees?.length || 0;
    
    // Validate selection count doesn't exceed original limit
    if (selections.selectedNominees.length > originalBookCount) {
      throw new Error(`Cannot select ${selections.selectedNominees.length} books. Your program limit is ${originalBookCount} books.`);
    }

    const currentYear = getCurrentAcademicYear();
    const teacherDoc = doc(db, `entities/${entityId}/schools/${schoolId}/teachers`, status.teacherData.id);

    // Update teacher document with new year selections
    await updateDoc(teacherDoc, {
      selectedNominees: selections.selectedNominees,
      achievementTiers: selections.achievementTiers,
      submissionOptions: selections.submissionOptions,
      
      // Year tracking
      lastYearOverYearSelection: currentYear,
      academicYear: currentYear, // Update to current year
      
      // Reset release status for new year
      releasedToStudents: false,
      releaseAcademicYear: null,
      
      // Metadata
      lastModified: new Date(),
      yearOverYearCompletedAt: new Date()
    });

    console.log(`✅ Teacher year-over-year selection saved for ${currentYear}:`, {
      books: selections.selectedNominees.length,
      maxAllowed: originalBookCount
    });

    return { 
      success: true, 
      selectedCount: selections.selectedNominees.length,
      maxBooks: originalBookCount,
      academicYear: currentYear
    };

  } catch (error) {
    console.error('❌ Error saving teacher year-over-year selection:', error);
    throw error;
  }
};

// Get nominees available for teacher selection (current year + active status)
export const getAvailableNomineesForYear = async (academicYear = null) => {
  try {
    const currentYear = academicYear || getCurrentAcademicYear();
    
    const nomineesRef = collection(db, 'masterNominees');
    const nomineesSnapshot = await getDocs(nomineesRef);
    
    const availableNominees = [];
    nomineesSnapshot.forEach(doc => {
      const book = doc.data();
      
      // Filter: Current academic year + active status
      if ((book.academicYear === currentYear || !book.academicYear) && 
          book.status === 'active') {
        availableNominees.push({
          id: doc.id,
          ...book
        });
      }
    });

    console.log(`✅ Found ${availableNominees.length} available nominees for ${currentYear}`);
    return availableNominees;

  } catch (error) {
    console.error('❌ Error getting available nominees:', error);
    throw error;
  }
};

// ===== RELEASE TO STUDENTS FUNCTIONALITY =====
// Mark teacher as ready and release books to their students
export const releaseTeacherBooksToStudents = async (entityId, schoolId, teacherUid) => {
  try {
    console.log('🚀 Releasing teacher books to students...');
    
    const currentYear = getCurrentAcademicYear();
    
    // Get teacher data
    const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
    const teacherQuery = query(teachersRef, where('uid', '==', teacherUid));
    const teacherSnapshot = await getDocs(teacherQuery);
    
    if (teacherSnapshot.empty) {
      throw new Error('Teacher not found');
    }
    const teacherDoc = teacherSnapshot.docs[0];
    const teacherData = teacherDoc.data();
    
    // Validate teacher has completed configuration
    if (!teacherData.selectedNominees || teacherData.selectedNominees.length === 0) {
      throw new Error('Please select books before releasing to students');
    }
    
    if (teacherData.lastYearOverYearSelection !== currentYear) {
      throw new Error('Please complete year-over-year setup before releasing to students');
    }
    
    // Update teacher document to mark as released
    await updateDoc(teacherDoc.ref, {
      releasedToStudents: true,
      releaseAcademicYear: currentYear,
      releasedAt: new Date(),
      lastModified: new Date()
    });
    
    console.log(`✅ Teacher books released to students for ${currentYear}`);
    
    return {
      success: true,
      academicYear: currentYear,
      booksReleased: teacherData.selectedNominees.length,
      teacherName: `${teacherData.firstName} ${teacherData.lastName}`
    };
    
  } catch (error) {
    console.error('❌ Error releasing books to students:', error);
    throw error;
  }
};

// Check if teacher has released books to students for current year
export const checkTeacherReleaseStatus = async (entityId, schoolId, teacherUid) => {
  try {
    const currentYear = getCurrentAcademicYear();
    
    // Get teacher data
    const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
    const teacherQuery = query(teachersRef, where('uid', '==', teacherUid));
    const teacherSnapshot = await getDocs(teacherQuery);
    
    if (teacherSnapshot.empty) {
      return { hasReleased: false, reason: 'Teacher not found' };
    }
    const teacherData = teacherSnapshot.docs[0].data();
    
    // Check if teacher has released for current year
    const hasReleased = teacherData.releasedToStudents === true && 
                       teacherData.releaseAcademicYear === currentYear;
    
    const hasCompletedSetup = teacherData.lastYearOverYearSelection === currentYear;
    const hasSelectedBooks = teacherData.selectedNominees && teacherData.selectedNominees.length > 0;
    
    return {
      hasReleased,
      hasCompletedSetup,
      hasSelectedBooks,
      canRelease: hasCompletedSetup && hasSelectedBooks && !hasReleased,
      releaseDate: teacherData.releasedAt,
      booksCount: teacherData.selectedNominees?.length || 0,
      academicYear: currentYear
    };
    
  } catch (error) {
    console.error('❌ Error checking release status:', error);
    return { hasReleased: false, reason: 'Error checking status' };
  }
};

// ===== GRADE PROGRESSION FUNCTIONS =====

// Check if student needs grade progression
export const checkGradeProgression = async (studentData) => {
  try {
    const currentYear = getCurrentAcademicYear();
    console.log('🔍 Checking grade progression for:', studentData.firstName, 'Current year:', currentYear);
    
    // If student was created in the current academic year, no progression needed
    if (studentData.academicYear === currentYear) {
      console.log('✅ Student joined this academic year - no progression needed');
      return {
        needsUpdate: false,
        lastRecordedYear: currentYear,
        currentYear: currentYear,
        currentGrade: studentData.grade,
        reason: 'Student joined current academic year'
      };
    }
    
    // If student has no academicYear field, they're from old system - need update
    if (!studentData.academicYear) {
      console.log('📈 Student has no academicYear field (legacy) - needs update');
      return {
        needsUpdate: true,
        lastRecordedYear: 'none',
        currentYear: currentYear,
        currentGrade: studentData.grade,
        suggestedGrade: studentData.grade < 8 ? studentData.grade + 1 : 8,
        shouldBeAlumni: studentData.grade >= 8,
        reason: 'Legacy student without academic year tracking'
      };
    }
    
    // Check grade history for most recent entry
    const gradeHistory = studentData.gradeHistory || [];
    let lastRecordedYear = studentData.academicYear; // Fallback to profile academic year
    
    if (gradeHistory.length > 0) {
      const lastEntry = gradeHistory[gradeHistory.length - 1];
      lastRecordedYear = lastEntry.academicYear || studentData.academicYear;
    }
    
    // Only need update if last recorded year is different from current year
    const needsUpdate = lastRecordedYear !== currentYear;
    
    if (needsUpdate) {
      console.log('📈 Student needs grade progression:', {
        student: studentData.firstName,
        lastYear: lastRecordedYear,
        currentYear: currentYear,
        currentGrade: studentData.grade
      });
      
      return {
        needsUpdate: true,
        lastRecordedYear,
        currentYear,
        currentGrade: studentData.grade,
        suggestedGrade: studentData.grade < 8 ? studentData.grade + 1 : 8,
        shouldBeAlumni: studentData.grade >= 8,
        reason: `Student from ${lastRecordedYear}, now in ${currentYear}`
      };
    } else {
      console.log('✅ Student already up to date for current academic year');
      return {
        needsUpdate: false,
        lastRecordedYear,
        currentYear,
        currentGrade: studentData.grade,
        reason: 'Already current for this academic year'
      };
    }
    
  } catch (error) {
    console.error('Error checking grade progression:', error);
    return { needsUpdate: false, reason: 'Error during check' };
  }
};

// Update student grade for new academic year
export const updateStudentGrade = async (studentId, entityId, schoolId, newGrade, academicYear = null) => {
  try {
    const currentYear = academicYear || getCurrentAcademicYear();
    console.log('📈 Updating student grade:', { studentId, newGrade, academicYear: currentYear });
    
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const studentData = studentDoc.data();
    const gradeHistory = studentData.gradeHistory || [];
    
    // Check if they should become alumni (grade 8 and moving to new year)
    const shouldBeAlumni = newGrade > 8 || (studentData.grade === 8 && newGrade === 8);
    const newStatus = shouldBeAlumni ? 'alumni' : 'active';
    
    // Add new entry to grade history
    const newGradeEntry = {
      academicYear: currentYear,
      grade: Math.min(newGrade, 8), // Cap at grade 8
      updatedAt: new Date()
    };
    
    const updatedGradeHistory = [...gradeHistory, newGradeEntry];
    
    // Update student record
    await updateDoc(studentRef, {
      grade: Math.min(newGrade, 8), // Current grade (capped at 8)
      gradeHistory: updatedGradeHistory,
      academicYear: currentYear,
      accountStatus: newStatus,
      ...(shouldBeAlumni && { graduatedYear: currentYear }), // Add graduation year if alumni
      lastModified: new Date()
    });
    
    console.log('✅ Student grade updated:', {
      newGrade: Math.min(newGrade, 8),
      status: newStatus,
      isAlumni: shouldBeAlumni
    });
    
    return {
      success: true,
      newGrade: Math.min(newGrade, 8),
      accountStatus: newStatus,
      isAlumni: shouldBeAlumni
    };
    
  } catch (error) {
    console.error('Error updating student grade:', error);
    throw error;
  }
};

// ===== TEACHER VERIFICATION FUNCTION =====

// Verify teacher access with email and teacher join code - OPTIMIZED VERSION
export const verifyTeacherAccess = async (email, teacherJoinCode) => {
  console.log('🔍 Verifying teacher access...');
  console.log('📧 Email:', email);
  console.log('🏫 Teacher Join Code:', teacherJoinCode);
  
  // Add timeout wrapper to prevent hanging
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Verification timeout after 15 seconds')), 15000)
  );
  
  const verificationPromise = async () => {
    try {
      console.log('📁 Loading entities...');
      const entitiesRef = collection(db, 'entities');
      const entitiesSnapshot = await getDocs(entitiesRef);
      console.log(`📁 Found ${entitiesSnapshot.docs.length} entities to search`);
      
      // Search through entities more efficiently
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id;
        console.log(`🔍 Searching entity: ${entityId}`);
        
        try {
          const schoolsRef = collection(db, `entities/${entityId}/schools`);
          const schoolsSnapshot = await getDocs(schoolsRef);
          console.log(`🏫 Found ${schoolsSnapshot.docs.length} schools in entity ${entityId}`);
          
          // Search through schools in this entity
          for (const schoolDoc of schoolsSnapshot.docs) {
            const schoolId = schoolDoc.id;
            const schoolData = schoolDoc.data();
            
            console.log(`🔍 Checking school: ${schoolData.name || schoolId}`);
            console.log(`🔑 School teacher join code: ${schoolData.teacherJoinCode}`);
            
            // Check if this school has the matching teacher join code
            if (schoolData.teacherJoinCode === teacherJoinCode) {
              console.log('✅ Found matching teacher join code in school:', schoolData.name);
              
              // Now search for teacher with this email in this specific school
              try {
                const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
                const teacherQuery = query(teachersRef, where('email', '==', email));
                console.log('👨‍🏫 Searching for teacher with email in this school...');
                const teacherSnapshot = await getDocs(teacherQuery);
                
                if (!teacherSnapshot.empty) {
                  const teacherDoc = teacherSnapshot.docs[0];
                  const teacherData = teacherDoc.data();
                  
                  console.log('✅ Found teacher:', teacherData.firstName, teacherData.lastName);
                  
                  return {
                    valid: true,
                    teacher: {
                      id: teacherDoc.id,
                      ...teacherData
                    },
                    school: {
                      id: schoolId,
                      entityId: entityId,
                      ...schoolData
                    }
                  };
                } else {
                  console.log('❌ Teacher email not found in school with matching join code');
                  return {
                    valid: false,
                    error: 'Your email is not registered as a teacher for this school. Please contact your school administrator.'
                  };
                }
              } catch (teacherError) {
                console.error('❌ Error searching teachers:', teacherError);
                // Continue to next school rather than failing completely
                continue;
              }
            } else {
              console.log(`❌ Teacher join code mismatch. Expected: ${teacherJoinCode}, Got: ${schoolData.teacherJoinCode}`);
            }
          }
        } catch (schoolError) {
          console.log(`❌ Error accessing schools in entity ${entityId}:`, schoolError);
          // Continue to next entity rather than failing
          continue;
        }
      }
      
      console.log('❌ No matching school found with teacher join code:', teacherJoinCode);
      return {
        valid: false,
        error: 'Invalid teacher join code. Please check with your school administrator.'
      };
      
    } catch (error) {
      console.error('❌ Database error during verification:', error);
      return {
        valid: false,
        error: 'Error verifying credentials. Please try again.'
      };
    }
  };
  
  try {
    // Race between verification and timeout
    const result = await Promise.race([verificationPromise(), timeoutPromise]);
    console.log('✅ Verification completed:', result.valid ? 'SUCCESS' : 'FAILED');
    return result;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    
    if (error.message.includes('timeout')) {
      return {
        valid: false,
        error: 'Verification is taking too long. Please check your connection and try again.'
      };
    }
    
    return {
      valid: false,
      error: 'Error verifying credentials. Please try again.'
    };
  }
};

// ===== ENHANCED STUDENT AUTHENTICATION FUNCTIONS WITH PERSONAL PASSWORD =====

// Create student account with teacher code system
export const createStudentAccountWithTeacherCode = async (firstName, lastInitial, grade, authData) => {
  try {
    console.log('🔐 Creating student account with teacher code system...');
    console.log('📚 Student:', firstName, lastInitial, grade);
    console.log('📧 Email:', authData.email);
    console.log('🔑 Password (teacher code):', authData.password);
    
    // Create Firebase Auth account with teacher code as password
    const userCredential = await createUserWithEmailAndPassword(auth, authData.email, authData.password);
    const user = userCredential.user;
    
    console.log('✅ Firebase Auth account created with UID:', user.uid);
    
    const currentYear = getCurrentAcademicYear();
    return {
      uid: user.uid,
      email: authData.email,
      displayUsername: authData.displayUsername,
      firstName,
      lastInitial,
      grade, // Current grade
      originalGrade: grade, // Never changes - their starting grade
      academicYear: currentYear, // Year they joined
      gradeHistory: [
        { 
          academicYear: currentYear, 
          grade: grade, 
          joinedAt: new Date() 
        }
      ],
      accountStatus: 'active', // active, alumni, inactive
      accountType: 'student'
    };
  } catch (error) {
    console.error('❌ Error creating student Firebase Auth account:', error);
    throw error;
  }
};

// Enhanced sign in with personal password validation
export const signInStudentWithTeacherCode = async (displayUsername, teacherCode, personalPassword) => {
  try {
    console.log('🔐 Student sign-in attempt with enhanced authentication...');
    console.log('👤 Username:', displayUsername);
    console.log('🏫 Teacher Code:', teacherCode);
    console.log('🔒 Personal Password: [REDACTED]');
    
    // Step 1: Find the student by username and teacher code
    const student = await findStudentByUsernameAndTeacherCode(displayUsername, teacherCode);
    if (!student) {
      throw new Error('Username or teacher code is incorrect');
    }
    
    console.log('✅ Found student:', student.firstName);
    
    // Step 2: Validate personal password
    if (!student.personalPassword) {
      throw new Error('Personal password not set. Please contact your teacher.');
    }
    
    if (student.personalPassword !== personalPassword.toLowerCase()) {
      console.log('❌ Personal password validation failed');
      throw new Error('Personal password is incorrect');
    }
    
    console.log('✅ Personal password validated');
    
    // Step 3: Use the stored email and teacher code as password for Firebase
    const studentEmail = student.authEmail;
    const studentPassword = teacherCode; // Teacher code IS the Firebase password
    
    console.log('🔑 Signing in with Firebase Auth...');
    
    const userCredential = await signInWithEmailAndPassword(auth, studentEmail, studentPassword);
    console.log('✅ Student signed in successfully!');
    
    return userCredential.user;
  } catch (error) {
    console.error('❌ Student sign-in error:', error);
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
      throw new Error('Username or teacher code is incorrect');
    }
    throw new Error('Sign-in failed: ' + error.message);
  }
};

// Find teacher by studentJoinCode across all entities/schools
export const findTeacherByStudentCode = async (studentJoinCode) => {
  try {
    console.log('🔍 Searching for teacher with student code:', studentJoinCode);
    
    // Search all entities
    const entitiesRef = collection(db, 'entities');
    const entitiesSnapshot = await getDocs(entitiesRef);
    
    for (const entityDoc of entitiesSnapshot.docs) {
      const entityId = entityDoc.id;
      
      try {
        // Search all schools in this entity
        const schoolsRef = collection(db, `entities/${entityId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id;
          const schoolData = schoolDoc.data();
          
          try {
            // Search all teachers in this school
            const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
            const teachersSnapshot = await getDocs(teachersRef);
            
            for (const teacherDoc of teachersSnapshot.docs) {
              const teacherData = teacherDoc.data();
              
              if (teacherData.studentJoinCode === studentJoinCode) {
                console.log('✅ Found teacher:', teacherData.firstName, teacherData.lastName);
                return {
                  teacher: {
                    id: teacherDoc.id,
                    ...teacherData
                  },
                  school: {
                    id: schoolId,
                    entityId: entityId,
                    ...schoolData
                  }
                };
              }
            }
          } catch (teacherError) {
            console.log('No teachers found in school:', schoolId);
          }
        }
      } catch (schoolError) {
        console.log('No schools found in entity:', entityId);
      }
    }
    
    console.log('❌ No teacher found with student code:', studentJoinCode);
    return null;
  } catch (error) {
    console.error('❌ Error searching for teacher:', error);
    return null;
  }
};

// Find student by username and teacher code for sign-in
export const findStudentByUsernameAndTeacherCode = async (displayUsername, teacherCode) => {
  try {
    console.log('🔍 Searching for student:', displayUsername, 'with teacher code:', teacherCode);
    
    // Search all entities for the student
    const entitiesRef = collection(db, 'entities');
    const entitiesSnapshot = await getDocs(entitiesRef);
    
    for (const entityDoc of entitiesSnapshot.docs) {
      const entityId = entityDoc.id;
      
      try {
        const schoolsRef = collection(db, `entities/${entityId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id;
          
          try {
            const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
            const studentsSnapshot = await getDocs(studentsRef);
            
            for (const studentDoc of studentsSnapshot.docs) {
              const studentData = studentDoc.data();
              
              if (studentData.displayUsername === displayUsername && studentData.signInCode === teacherCode) {
                console.log('✅ Found student:', studentData.firstName);
                return {
                  id: studentDoc.id,
                  entityId,
                  schoolId,
                  ...studentData
                };
              }
            }
          } catch (studentError) {
            console.log('No students found in school:', schoolId);
          }
        }
      } catch (schoolError) {
        console.log('No schools found in entity:', entityId);
      }
    }
    
    console.log('❌ Student not found:', displayUsername);
    return null;
  } catch (error) {
    console.error('❌ Error finding student:', error);
    return null;
  }
};

// Generate username with teacher code logic and duplicate handling
export const generateUsernameWithTeacherCode = async (firstName, lastInitial, grade, teacherData, entityId, schoolId) => {
  try {
    console.log('🔄 Generating username for:', firstName, lastInitial, grade);
    console.log('👩‍🏫 Teacher info:', teacherData);
    
    // Extract teacher's last name for username generation
    const teacherFullName = teacherData.teacherName || '';
    const teacherLastName = teacherFullName.split(' ').pop() || 'TCHR';
    
    // Get first 4 letters of teacher's last name (uppercase)
    const teacherCode = teacherLastName.toUpperCase().substring(0, 4).padEnd(4, 'X');
    
    // Create base username: EmmaK4SMIT
    const baseUsername = `${firstName}${lastInitial}${grade}${teacherCode}`;
    
    console.log('🎯 Base username:', baseUsername);
    
    // Check for existing usernames in this school's students subcollection
    const studentsCollection = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
    const querySnapshot = await getDocs(studentsCollection);
    
    // Get all existing usernames for this school
    const existingUsernames = [];
    querySnapshot.forEach((doc) => {
      const studentData = doc.data();
      if (studentData.displayUsername) {
        existingUsernames.push(studentData.displayUsername);
      }
    });
    
    console.log('📋 Existing usernames in school:', existingUsernames);
    
    // Check if base username exists, if so add number (2, 3, 4, etc.)
    let finalUsername = baseUsername; // EmmaK4SMIT
    let counter = 2; // Start with 2 for first duplicate (EmmaK4SMIT2)
    
    while (existingUsernames.includes(finalUsername)) {
      finalUsername = `${baseUsername}${counter}`; // EmmaK4SMIT2, EmmaK4SMIT3, etc.
      counter++;
    }
    
    console.log('✅ Generated unique username:', finalUsername);
    return finalUsername;
  } catch (error) {
    console.error('❌ Error generating username:', error);
    throw error;
  }
};

// Update student personal password
export const updateStudentPersonalPassword = async (studentId, entityId, schoolId, newPassword) => {
  try {
    console.log('🔐 Updating student personal password...');
    
    // Validate password
    if (!newPassword || newPassword.length < 5 || !/^[a-z]+$/.test(newPassword)) {
      throw new Error('Personal password must be at least 5 lowercase letters');
    }
    
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
    await updateDoc(studentRef, {
      personalPassword: newPassword.toLowerCase(),
      lastModified: new Date()
    });
    
    console.log('✅ Personal password updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating personal password:', error);
    throw error;
  }
};

// ===== STUDENT DATA FUNCTIONS =====

// Get student data from entities structure (original function for backward compatibility)
export const getStudentDataEntities = async (uid) => {
  try {
    console.log('🔍 Searching for student with UID in entities:', uid)
    
    // Search through all entities
    const entitiesRef = collection(db, 'entities')
    const entitiesSnapshot = await getDocs(entitiesRef)
    
    for (const entityDoc of entitiesSnapshot.docs) {
      try {
        // Search through all schools in this entity
        const schoolsRef = collection(db, `entities/${entityDoc.id}/schools`)
        const schoolsSnapshot = await getDocs(schoolsRef)
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          try {
            // Search for student in this school
            const studentsRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/students`)
            const studentQuery = query(studentsRef, where('uid', '==', uid))
            const studentSnapshot = await getDocs(studentQuery)
            
            if (!studentSnapshot.empty) {
              const studentDoc = studentSnapshot.docs[0]
              const studentData = studentDoc.data()
              
              console.log('✅ Found student:', studentData.firstName)
              
              // Get additional school data
              const schoolData = schoolDoc.data()
              
              // Get teacher data if student has currentTeacherId
              let teacherData = null
              if (studentData.currentTeacherId) {
                try {
                  const teacherDoc = await getDoc(doc(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/teachers`, studentData.currentTeacherId))
                  if (teacherDoc.exists()) {
                    teacherData = teacherDoc.data()
                  }
                } catch (teacherError) {
                  console.log('Could not load teacher data:', teacherError)
                }
              }
              
              // Return student data with all necessary references
              return {
                id: studentDoc.id,
                entityId: entityDoc.id,
                schoolId: schoolDoc.id,
                ...studentData,
                // Add school-level data access
                schoolSubmissionOptions: teacherData?.submissionOptions || schoolData.submissionOptions || {},
                schoolNominees: schoolData.selectedNominees || [],
                // Add teacher-level data access if available
                parentQuizCode: teacherData?.parentQuizCode || schoolData.parentQuizCode || '',
                achievementTiers: teacherData?.achievementTiers || schoolData.achievementTiers || [],
                teacherSubmissionOptions: teacherData?.submissionOptions || {},
                teacherNominees: teacherData?.selectedNominees || [],
                teacherName: teacherData ? `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim() : '',
                teacherId: studentData.currentTeacherId,
                // For backwards compatibility
                schoolAccessCode: studentData.joinedWithCode
              }
            }
          } catch (studentError) {
            console.log('No students found in school:', schoolDoc.id)
          }
        }
      } catch (schoolError) {
        console.log('No schools found in entity:', entityDoc.id)
      }
    }
    
    console.log('❌ Student not found with UID:', uid)
    return null
  } catch (error) {
    console.error('Error finding student:', error)
    return null
  }
}

// Academic year aware student data function
export const getStudentDataEntitiesWithYear = async (uid, academicYear = null) => {
  try {
    const currentYear = academicYear || getCurrentAcademicYear();
    console.log('🔍 Looking for student with UID in entities:', uid, 'for year:', currentYear);
    
    // Search through all entities (your existing logic stays the same)
    const entitiesRef = collection(db, 'entities');
    const entitiesSnapshot = await getDocs(entitiesRef);
    
    for (const entityDoc of entitiesSnapshot.docs) {
      try {
        const schoolsRef = collection(db, `entities/${entityDoc.id}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          try {
            const studentsRef = collection(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/students`);
            const studentQuery = query(studentsRef, where('uid', '==', uid));
            const studentSnapshot = await getDocs(studentQuery);
            
            if (!studentSnapshot.empty) {
              const studentDoc = studentSnapshot.docs[0];
              const studentData = studentDoc.data();
              
              console.log('✅ Found student:', studentData.firstName);
              
              // Get additional school data
              const schoolData = schoolDoc.data();
              
              // Get teacher data if student has currentTeacherId
              let teacherData = null;
              if (studentData.currentTeacherId) {
                try {
                  const teacherDoc = await getDoc(doc(db, `entities/${entityDoc.id}/schools/${schoolDoc.id}/teachers`, studentData.currentTeacherId));
                  if (teacherDoc.exists()) {
                    teacherData = teacherDoc.data();
                  }
                } catch (teacherError) {
                  console.log('Could not load teacher data:', teacherError);
                }
              }
              
              // Filter bookshelf by academic year
              const allBookshelf = studentData.bookshelf || [];
              const currentYearBookshelf = allBookshelf.filter(book => 
                book.academicYear === currentYear || !book.academicYear // Include books without year for backward compatibility
              );
              
              // Return student data with academic year scoping
              return {
                id: studentDoc.id,
                entityId: entityDoc.id,
                schoolId: schoolDoc.id,
                academicYear: currentYear, // Always include current academic year
                ...studentData,
                bookshelf: currentYearBookshelf, // Only current year books
                allBookshelf: allBookshelf, // Keep all books for archive access
                
                // School-level data access (unchanged)
                schoolSubmissionOptions: teacherData?.submissionOptions || schoolData.submissionOptions || {},
                schoolNominees: schoolData.selectedNominees || [],
                parentQuizCode: teacherData?.parentQuizCode || schoolData.parentQuizCode || '',
                achievementTiers: teacherData?.achievementTiers || schoolData.achievementTiers || [],
                teacherSubmissionOptions: teacherData?.submissionOptions || {},
                teacherNominees: teacherData?.selectedNominees || [],
                teacherName: teacherData ? `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim() : '',
                teacherId: studentData.currentTeacherId,
                schoolAccessCode: studentData.joinedWithCode
              };
            }
          } catch (studentError) {
            console.log('No students found in school:', schoolDoc.id);
          }
        }
      } catch (schoolError) {
        console.log('No schools found in entity:', entityDoc.id);
      }
    }
    
    console.log('❌ Student not found with UID:', uid);
    return null;
  } catch (error) {
    console.error('Error finding student:', error);
    return null;
  }
};

// Get school nominees from entities structure 
export const getSchoolNomineesEntities = async (entityId, schoolId) => {
  try {
    console.log('📚 Loading school nominees from teachers:', entityId, schoolId);
    
    // Get all teachers in this school to collect their selected nominees
    const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
    const teachersSnapshot = await getDocs(teachersRef);
    
    let allSelectedNominees = new Set();
    
    // Collect nominees from all active teachers
    teachersSnapshot.forEach(doc => {
      const teacherData = doc.data();
      if (teacherData.selectedNominees && Array.isArray(teacherData.selectedNominees)) {
        teacherData.selectedNominees.forEach(nomineeId => {
          allSelectedNominees.add(nomineeId);
        });
      }
    });
    
    const selectedNominees = Array.from(allSelectedNominees);
    console.log('📋 Aggregated nominee IDs from all teachers:', selectedNominees);
    
    // Get full book data for each nominee ID
    const masterNomineesRef = collection(db, 'masterNominees');
    const masterNomineesSnapshot = await getDocs(masterNomineesRef);
    
    const nominees = [];
    masterNomineesSnapshot.forEach(doc => {
      const bookData = doc.data();
      if (selectedNominees.includes(bookData.id)) {  // Use internal book ID
        nominees.push({
          id: bookData.id,
          ...bookData
        });
      }
    });
    
    console.log('✅ Retrieved nominees from entities structure:', nominees.length);
    return nominees;
  } catch (error) {
    console.error('❌ Error loading school nominees:', error);
    return [];
  }
}

// Update student data in entities structure
export const updateStudentDataEntities = async (studentId, entityId, schoolId, updates) => {
  try {
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId)
    await updateDoc(studentRef, {
      ...updates,
      lastModified: new Date()
    })
    console.log('✅ Student data updated')
    return true
  } catch (error) {
    console.error('Error updating student data:', error)
    throw error
  }
}

// Add book to bookshelf in entities structure (original function for backward compatibility)
export const addBookToBookshelfEntities = async (studentId, entityId, schoolId, bookId, format) => {
  try {
    console.log('📖 Adding book to bookshelf:', bookId, format)
    
    // Get current student data
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId)
    const studentDoc = await getDoc(studentRef)
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found')
    }
    
    const studentData = studentDoc.data()
    const currentBookshelf = studentData.bookshelf || []
    
    // Check if book already exists in any format
    const existingBook = currentBookshelf.find(book => book.bookId === bookId)
    if (existingBook) {
      throw new Error(`Book already in your bookshelf as ${existingBook.format}`)
    }
    
    // Create new book progress entry
    const newBookProgress = {
      bookId: bookId,
      format: format,
      currentProgress: 0,
      rating: 0,
      notes: '',
      completed: false,
      addedAt: new Date(),
      status: 'in_progress'
    }
    
    // Update bookshelf
    const updatedBookshelf = [...currentBookshelf, newBookProgress]
    
    await updateDoc(studentRef, {
      bookshelf: updatedBookshelf,
      lastModified: new Date()
    })
    
    console.log('✅ Book added to bookshelf')
    return newBookProgress
  } catch (error) {
    console.error('Error adding book to bookshelf:', error)
    throw error
  }
}

// Academic year aware book adding function
export const addBookToBookshelfEntitiesWithYear = async (studentId, entityId, schoolId, bookId, format) => {
  try {
    const currentYear = getCurrentAcademicYear();
    console.log('📖 Adding book to bookshelf for year:', currentYear, 'Book:', bookId, 'Format:', format);
    
    // Get current student data
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const studentData = studentDoc.data();
    const currentBookshelf = studentData.bookshelf || [];
    
    // Check if book already exists in current academic year
    const existingBook = currentBookshelf.find(book => 
      book.bookId === bookId && 
      book.format === format &&
      (book.academicYear === currentYear || !book.academicYear) // Handle legacy books
    );
    
    if (existingBook) {
      throw new Error(`Book already in your bookshelf for ${currentYear} as ${existingBook.format}`);
    }
    
    // Create new book progress entry with academic year
    const newBookProgress = {
      bookId: bookId,
      format: format,
      academicYear: currentYear, // Include academic year
      currentProgress: 0,
      rating: 0,
      notes: '',
      completed: false,
      addedAt: new Date(),
      status: 'in_progress'
    };
    
    // Update bookshelf
    const updatedBookshelf = [...currentBookshelf, newBookProgress];
    
    await updateDoc(studentRef, {
      bookshelf: updatedBookshelf,
      lastModified: new Date()
    });
    
    console.log('✅ Book added to bookshelf for academic year:', currentYear);
    return newBookProgress;
  } catch (error) {
    console.error('Error adding book to bookshelf:', error);
    throw error;
  }
};

// Remove book from bookshelf in entities structure
export const removeBookFromBookshelfEntities = async (studentId, entityId, schoolId, bookId, format) => {
  try {
    console.log('🗑️ Removing book from bookshelf:', bookId, format)
    
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId)
    const studentDoc = await getDoc(studentRef)
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found')
    }
    
    const studentData = studentDoc.data()
    const currentBookshelf = studentData.bookshelf || []
    
    // Remove the specific book/format combination
    const updatedBookshelf = currentBookshelf.filter(book => 
      !(book.bookId === bookId && book.format === format)
    )
    
    await updateDoc(studentRef, {
      bookshelf: updatedBookshelf,
      lastModified: new Date()
    })
    
    console.log('✅ Book removed from bookshelf')
    return true
  } catch (error) {
    console.error('Error removing book from bookshelf:', error)
    throw error
  }
}

// Get teacher data for a student
export const getStudentTeacherDataEntities = async (entityId, schoolId, teacherId) => {
  try {
    if (!teacherId) return null
    
    const teacherDoc = await getDoc(doc(db, `entities/${entityId}/schools/${schoolId}/teachers`, teacherId))
    if (teacherDoc.exists()) {
      return {
        id: teacherDoc.id,
        ...teacherDoc.data()
      }
    }
    return null
  } catch (error) {
    console.error('Error getting teacher data:', error)
    return null
  }
}

// ===== ENHANCED BOOKSHELF FUNCTIONS =====

// Helper function to check if book is already in bookshelf
export const isBookInBookshelfEntities = async (studentId, entityId, schoolId, bookId, format) => {
  try {
    const studentRef = doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      return false;
    }
    
    const studentData = studentDoc.data();
    const bookshelf = studentData.bookshelf || [];
    
    return bookshelf.some(book => book.bookId === bookId && book.format === format);
  } catch (error) {
    console.error('❌ Error checking if book is in bookshelf:', error);
    return false;
  }
};

// Enhanced function to get full bookshelf with book details
export const getStudentBookshelfWithDetailsEntities = async (studentId, entityId, schoolId) => {
  try {
    const studentDoc = await getDoc(doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId));
    
    if (!studentDoc.exists()) {
      return [];
    }
    
    const studentData = studentDoc.data();
    const bookshelf = studentData.bookshelf || [];
    
    // Get full book details for each book in bookshelf
    const bookshelfWithDetails = await Promise.all(
      bookshelf.map(async (bookEntry) => {
        try {
          const bookDoc = await getDoc(doc(db, 'masterNominees', bookEntry.bookId));
          if (bookDoc.exists()) {
            return {
              ...bookEntry,
              bookDetails: { id: bookDoc.id, ...bookDoc.data() }
            };
          }
          return bookEntry; // Return without details if book not found
        } catch (error) {
          console.error('Error fetching book details for:', bookEntry.bookId);
          return bookEntry;
        }
      })
    );
    
    return bookshelfWithDetails;
  } catch (error) {
    console.error('❌ Error getting student bookshelf with details:', error);
    return [];
  }
};

// Update reading progress
export const updateReadingProgressEntities = async (studentId, entityId, schoolId, bookId, progress) => {
  try {
    // Get the student, update the specific book in the bookshelf array, and save back
    const studentDoc = await getDoc(doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId));
    const studentData = studentDoc.data();
    
    const bookshelf = studentData.bookshelf || [];
    const bookIndex = bookshelf.findIndex(book => book.bookId === bookId);
    
    if (bookIndex !== -1) {
      bookshelf[bookIndex] = { ...bookshelf[bookIndex], ...progress };
      
      await updateDoc(doc(db, `entities/${entityId}/schools/${schoolId}/students`, studentId), {
        bookshelf: bookshelf
      });
    }
    
    console.log('✅ Reading progress updated for book:', bookId);
  } catch (error) {
    console.error('❌ Error updating reading progress:', error);
    throw error;
  }
};

// ===== AUTHENTICATION HELPER FUNCTIONS =====
export const authHelpers = {
  // Create student account with teacher code system
  createStudentAccountWithTeacherCode: createStudentAccountWithTeacherCode,

  // Enhanced sign in with personal password
  signInStudentWithTeacherCode: signInStudentWithTeacherCode,

  // Create admin account
  createAdminAccount: async (email, password, schoolData) => {
    try {
      console.log('🔐 Creating admin account...');
      console.log('📧 Email:', email);
      console.log('🏫 School:', schoolData.name);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Admin Firebase Auth account created:', user.uid);
      
      return {
        uid: user.uid,
        email,
        schoolData,
        accountType: 'admin'
      };
    } catch (error) {
      console.error('❌ Error creating admin account:', error);
      throw error;
    }
  },

  // Sign in admin/parent with email + password
  signIn: async (email, password) => {
    try {
      console.log('🔐 Email/password sign-in attempt for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ User signed in successfully');
      
      return userCredential.user;
    } catch (error) {
      console.error('❌ Email/password sign-in error:', error);
      
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Email or password is incorrect');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with that email');
      }
      throw new Error('Sign-in failed: ' + error.message);
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      await signOut(auth);
      console.log('✅ User signed out');
    } catch (error) {
      console.error('❌ Sign-out error:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
}

// ===== COMPLETE DATABASE HELPER FUNCTIONS =====
export const dbHelpers = {
  // Account deletion functions (basic and enhanced)
  deleteStudentAccount: deleteStudentAccount,
  deleteParentAccountFixed: deleteParentAccountFixed, // Add the new fixed function
  deleteTeacherAccount: deleteTeacherAccount,
  deleteAdminAccount: deleteAdminAccount,
  
  // Data export functions
  exportStudentData: exportStudentData,
  exportParentData: exportParentData,
  
  // Enhanced deletion with export
  deleteStudentAccountWithExport: deleteStudentAccountWithExport,
  deleteParentAccountWithExport: deleteParentAccountWithExport,
  
  // Audit and recovery functions
  logAccountDeletion: logAccountDeletion,
  createAccountRecoveryBackup: createAccountRecoveryBackup,
  
  // Admin functions
  adminBulkDeleteAccounts: adminBulkDeleteAccounts,

  // Teacher verification function
  verifyTeacherAccess: verifyTeacherAccess,
  
  // Teacher code system functions
  findTeacherByStudentCode: findTeacherByStudentCode,
  findStudentByUsernameAndTeacherCode: findStudentByUsernameAndTeacherCode,
  generateUsernameWithTeacherCode: generateUsernameWithTeacherCode,
  
  // Personal password management
  updateStudentPersonalPassword: updateStudentPersonalPassword,
  
  // Academic year system functions
  getCurrentAcademicYear: getCurrentAcademicYear,
  getAcademicYearDates: getAcademicYearDates,
  initializeSystemConfig: initializeSystemConfig,
  getSystemConfig: getSystemConfig,
  updateProgramPhase: updateProgramPhase,
  
  // Grade progression functions
  checkGradeProgression: checkGradeProgression,
  updateStudentGrade: updateStudentGrade,
  
  // Student data clearing functions
  clearAllStudentDataForNewYear: clearAllStudentDataForNewYear,
  clearIndividualStudentData: clearIndividualStudentData,
  transitionToTeacherSelectionWithClearing: transitionToTeacherSelectionWithClearing,
  
  // Enhanced manual student clearing functions
  clearIndividualManualStudentData: clearIndividualManualStudentData,
  clearAllManualStudentsForNewYear: clearAllManualStudentsForNewYear,
  transitionToTeacherSelectionWithCompleteClearing: transitionToTeacherSelectionWithCompleteClearing,
  
  // Phase management functions (enhanced with clearing)
  checkAndUpdatePhasesWithClearing: checkAndUpdatePhasesWithClearing,
  checkAndUpdatePhasesWithCompleteClearing: checkAndUpdatePhasesWithCompleteClearing,
  checkAndUpdatePhases: checkAndUpdatePhases, // Keep original for backwards compatibility
  logPhaseTransition: logPhaseTransition,
  releaseNewYearToTeachersWithReset: releaseNewYearToTeachersWithReset,
  checkTeacherYearOverYearStatus: checkTeacherYearOverYearStatus,
  saveTeacherYearOverYearSelection: saveTeacherYearOverYearSelection,
  getAvailableNomineesForYear: getAvailableNomineesForYear,
  
  // Manual student reset functions
  resetManualStudentsForNewYear: resetManualStudentsForNewYear,
  resetAllManualStudentsForNewYear: resetAllManualStudentsForNewYear,
  
  // Release to students functions
  releaseTeacherBooksToStudents: releaseTeacherBooksToStudents,
  checkTeacherReleaseStatus: checkTeacherReleaseStatus,
  
  // Academic year aware data functions
  getStudentDataEntitiesWithYear: getStudentDataEntitiesWithYear,
  addBookToBookshelfEntitiesWithYear: addBookToBookshelfEntitiesWithYear,
  
  // Keep existing functions for backward compatibility
  getStudentDataEntities: getStudentDataEntities,
  addBookToBookshelfEntities: addBookToBookshelfEntities,
  
  // Core data access functions
  getSchoolNomineesEntities: getSchoolNomineesEntities,
  updateStudentDataEntities: updateStudentDataEntities,
  removeBookFromBookshelfEntities: removeBookFromBookshelfEntities,
  getStudentTeacherDataEntities: getStudentTeacherDataEntities,
  
  // Enhanced bookshelf functions
  isBookInBookshelfEntities: isBookInBookshelfEntities,
  getStudentBookshelfWithDetailsEntities: getStudentBookshelfWithDetailsEntities,
  updateReadingProgressEntities: updateReadingProgressEntities,
  
  // Parent and family detail functions
  getLinkedParentDetails: getLinkedParentDetails,
  getFamilyDetails: getFamilyDetails,
  checkParentFamilyStatus: checkParentFamilyStatus  // Updated with FIXED version
}

export default app