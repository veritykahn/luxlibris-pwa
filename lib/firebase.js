// lib/firebase.js - CLEAN VERSION with ONLY verifyTeacherAccess added
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc } from 'firebase/firestore'
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

// ===== NEW: TEACHER VERIFICATION FUNCTION =====

// Verify teacher access with email and teacher join code
export const verifyTeacherAccess = async (email, teacherJoinCode) => {
  try {
    console.log('🔍 Verifying teacher access...');
    console.log('📧 Email:', email);
    console.log('🏫 Teacher Join Code:', teacherJoinCode);
    
    // Search all entities to find school with this teacher join code
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
          
          // Check if this school has the teacher join code
          if (schoolData.teacherJoinCode === teacherJoinCode) {
            console.log('✅ Found school with teacher join code:', schoolData.name);
            
            // Check if teacher with this email exists in this school
            const teachersRef = collection(db, `entities/${entityId}/schools/${schoolId}/teachers`);
            const teacherQuery = query(teachersRef, where('email', '==', email));
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
              console.log('❌ Teacher email not found in school with teacher join code');
              return {
                valid: false,
                error: 'Your email is not registered as a teacher for this school. Please contact your school administrator.'
              };
            }
          }
        }
      } catch (schoolError) {
        console.log('No schools found in entity:', entityId);
      }
    }
    
    console.log('❌ No school found with teacher join code:', teacherJoinCode);
    return {
      valid: false,
      error: 'Invalid teacher join code. Please check with your school administrator.'
    };
    
  } catch (error) {
    console.error('❌ Error verifying teacher access:', error);
    return {
      valid: false,
      error: 'Error verifying credentials. Please try again.'
    };
  }
};

// ===== TEACHER CODE SYSTEM FUNCTIONS =====

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

// Sign in student using display username + teacher code
export const signInStudentWithTeacherCode = async (displayUsername, teacherCode) => {
  try {
    console.log('🔐 Student sign-in attempt with teacher code...');
    console.log('👤 Username:', displayUsername);
    console.log('🏫 Teacher Code:', teacherCode);
    
    // Find the student by username and teacher code
    const student = await findStudentByUsernameAndTeacherCode(displayUsername, teacherCode);
    if (!student) {
      throw new Error('Username or teacher code is incorrect');
    }
    
    console.log('✅ Found student:', student.firstName);
    
    // Use the stored email and teacher code as password
    const studentEmail = student.authEmail;
    const studentPassword = teacherCode; // Teacher code IS the password
    
    console.log('🔑 Signing in with email:', studentEmail);
    
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
                schoolSubmissionOptions: schoolData.submissionOptions || {},
                schoolNominees: schoolData.selectedNominees || [],
                // Add teacher-level data access if available
                parentQuizCode: teacherData?.parentTestCode || schoolData.parentQuizCode || '',
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

  // Sign in student using display username + teacher code
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
  // NEW: Teacher verification function
  verifyTeacherAccess: verifyTeacherAccess,
  
  // Teacher code system functions
  findTeacherByStudentCode: findTeacherByStudentCode,
  findStudentByUsernameAndTeacherCode: findStudentByUsernameAndTeacherCode,
  generateUsernameWithTeacherCode: generateUsernameWithTeacherCode,
  
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