// lib/firebase.js - Updated with Personal Password Validation and Academic Year System
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
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

// ===== FIXED: TEACHER VERIFICATION FUNCTION =====

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
    
    return {
      uid: user.uid,
      email: authData.email,
      displayUsername: authData.displayUsername,
      firstName,
      lastInitial,
      grade,
      accountType: 'student'
    };
  } catch (error) {
    console.error('❌ Error creating student Firebase Auth account:', error);
    throw error;
  }
};

// UPDATED: Enhanced sign in with personal password validation
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
    
    // Step 2: NEW - Validate personal password
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

// NEW: Update student personal password
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

// Get student data from entities structure
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

// Add book to bookshelf in entities structure
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

// ===== AUTHENTICATION HELPER FUNCTIONS =====
export const authHelpers = {
  // Create student account with teacher code system
  createStudentAccountWithTeacherCode: createStudentAccountWithTeacherCode,

  // UPDATED: Enhanced sign in with personal password
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

// ===== DATABASE HELPER FUNCTIONS =====
export const dbHelpers = {
  // FIXED: Teacher verification function
  verifyTeacherAccess: verifyTeacherAccess,
  
  // Teacher code system functions
  findTeacherByStudentCode: findTeacherByStudentCode,
  findStudentByUsernameAndTeacherCode: findStudentByUsernameAndTeacherCode,
  generateUsernameWithTeacherCode: generateUsernameWithTeacherCode,
  
  // NEW: Personal password management
  updateStudentPersonalPassword: updateStudentPersonalPassword,
  
  // Academic year system functions
  getCurrentAcademicYear: getCurrentAcademicYear,
  getAcademicYearDates: getAcademicYearDates,
  initializeSystemConfig: initializeSystemConfig,
  getSystemConfig: getSystemConfig,
  updateProgramPhase: updateProgramPhase,
  
  // Core data access functions
  getStudentDataEntities: getStudentDataEntities,
  getSchoolNomineesEntities: getSchoolNomineesEntities,
  updateStudentDataEntities: updateStudentDataEntities,
  addBookToBookshelfEntities: addBookToBookshelfEntities,
  removeBookFromBookshelfEntities: removeBookFromBookshelfEntities,
  getStudentTeacherDataEntities: getStudentTeacherDataEntities
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

export default app