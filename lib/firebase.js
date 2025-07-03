// lib/firebase.js - COMPLETE VERSION with Enhanced Bookshelf Functions
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc, collectionGroup, updateDoc, arrayUnion } from 'firebase/firestore'
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

// Authentication helper functions
export const authHelpers = {
  // Create student account with simple school code password - FIXED VERSION
  createStudentAccount: async (firstName, lastInitial, grade, schoolData) => {
    try {
      console.log('🔐 Creating student account...');
      console.log('📚 Student:', firstName, lastInitial, grade);
      console.log('🏫 School:', schoolData.name);
      console.log('🔑 Student Access Code:', schoolData.studentAccessCode);
      
      // Generate username: EmmaK4, EmmaK42, etc.
      const gradeNum = grade.toString().charAt(0); // Extract number from grade
      const baseUsername = `${firstName}${lastInitial}${gradeNum}`;
      
      // Check for duplicates in this school's students
      const studentsCollection = collection(db, `dioceses/${schoolData.dioceseId}/schools/${schoolData.id}/students`);
      const existingStudents = await getDocs(studentsCollection);
      
      const existingUsernames = [];
      existingStudents.forEach(doc => {
        const data = doc.data();
        if (data.displayUsername) {
          existingUsernames.push(data.displayUsername);
        }
      });
      
      // Generate unique username
      let finalUsername = baseUsername;
      let counter = 2;
      while (existingUsernames.includes(finalUsername)) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }
      
      // Create email format: emmak4@demo-student-2025.luxlibris.app
      const studentEmail = `${finalUsername.toLowerCase()}@${schoolData.studentAccessCode.toLowerCase()}.luxlibris.app`;
      
      // Password is the student access code (simple for students)
      const studentPassword = schoolData.studentAccessCode;
      
      console.log('📧 Creating Firebase Auth with email:', studentEmail);
      console.log('🔑 Using password (student access code):', studentPassword);
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
      const user = userCredential.user;
      
      console.log('✅ Firebase Auth account created with UID:', user.uid);
      
      return {
        uid: user.uid,
        email: studentEmail,
        password: studentPassword,
        displayUsername: finalUsername,
        firstName,
        lastInitial,
        grade,
        schoolData,
        accountType: 'student'
      };
    } catch (error) {
      console.error('❌ Error creating student Firebase Auth account:', error);
      throw error;
    }
  },

  // Sign in student using display username + school code
  signInStudent: async (displayUsername, schoolCode) => {
    try {
      console.log('🔐 Student sign-in attempt...');
      console.log('👤 Username:', displayUsername);
      console.log('🏫 School Code:', schoolCode);
      
      // Find the school first
      const school = await dbHelpers.findSchoolByStudentAccessCode(schoolCode);
      if (!school) {
        throw new Error('School not found with that code');
      }
      
      console.log('✅ Found school:', school.name);
      
      // Find the student in that school
      const student = await dbHelpers.findStudentInSchool(displayUsername, school.dioceseId, school.id);
      if (!student) {
        throw new Error('Username not found in that school');
      }
      
      console.log('✅ Found student:', student.firstName);
      
      // Use the stored email and school code as password
      const studentEmail = student.authEmail || `${displayUsername.toLowerCase()}@${schoolCode.toLowerCase()}.luxlibris.app`;
      const studentPassword = schoolCode; // School code IS the password
      
      console.log('🔑 Signing in with email:', studentEmail);
      
      const userCredential = await signInWithEmailAndPassword(auth, studentEmail, studentPassword);
      console.log('✅ Student signed in successfully!');
      
      return userCredential.user;
    } catch (error) {
      console.error('❌ Student sign-in error:', error);
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        throw new Error('Username or school code is incorrect');
      }
      throw new Error('Sign-in failed: ' + error.message);
    }
  },

  // Create admin account - connects to God Mode created schools
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

// Database helper functions - UPDATED for diocese structure
export const dbHelpers = {
  // Find school by student access code (searches diocese structure)
  findSchoolByStudentAccessCode: async (studentAccessCode) => {
    try {
      console.log('🔍 Searching for school with student access code:', studentAccessCode);
      
      // Search all dioceses for schools with this student access code
      const diocesesRef = collection(db, 'dioceses');
      const diocesesSnapshot = await getDocs(diocesesRef);
      
      for (const dioceseDoc of diocesesSnapshot.docs) {
        const dioceseId = dioceseDoc.id;
        const schoolsRef = collection(db, `dioceses/${dioceseId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolData = schoolDoc.data();
          if (schoolData.studentAccessCode === studentAccessCode) {
            console.log('✅ Found school:', schoolData.name);
            return {
              id: schoolDoc.id,
              dioceseId: dioceseId,
              ...schoolData
            };
          }
        }
      }
      
      console.log('❌ No school found with student access code:', studentAccessCode);
      return null;
    } catch (error) {
      console.error('❌ Error finding school by student access code:', error);
      return null;
    }
  },

  // Find student in specific school
  findStudentInSchool: async (displayUsername, dioceseId, schoolId) => {
    try {
      console.log('🔍 Searching for student:', displayUsername, 'in school:', schoolId);
      
      const studentsRef = collection(db, `dioceses/${dioceseId}/schools/${schoolId}/students`);
      const studentsSnapshot = await getDocs(studentsRef);
      
      for (const studentDoc of studentsSnapshot.docs) {
        const studentData = studentDoc.data();
        if (studentData.displayUsername === displayUsername) {
          console.log('✅ Found student:', studentData.firstName);
          return {
            id: studentDoc.id,
            dioceseId,
            schoolId,
            ...studentData
          };
        }
      }
      
      console.log('❌ Student not found:', displayUsername);
      return null;
    } catch (error) {
      console.error('❌ Error finding student in school:', error);
      return null;
    }
  },

  // Verify admin access - checks diocese structure
  verifyAdminAccess: async (email, schoolCode) => {
    try {
      console.log('🔐 Verifying admin access for:', email, 'with school code:', schoolCode);
      
      // Find school by any code (student access or admin email)
      const school = await dbHelpers.findSchoolByStudentAccessCode(schoolCode);
      if (!school) {
        return { valid: false, error: 'School not found' };
      }
      
      // Check if this email is the admin for this school
      if (school.adminEmail === email) {
        console.log('✅ Admin access verified');
        return { valid: true, school };
      }
      
      console.log('❌ Admin email does not match school admin');
      return { valid: false, error: 'Not authorized for this school' };
    } catch (error) {
      console.error('❌ Error verifying admin access:', error);
      return { valid: false, error: 'Verification failed' };
    }
  },

  // Get user profile by UID - searches both old and new structures
  getUserProfile: async (uid) => {
    try {
      console.log('🔍 Looking for user profile with UID:', uid);
      
      // First check global users collection (for backward compatibility)
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('uid', '==', uid));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        console.log('✅ Found user in global users collection');
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      // Search in diocese/school/students structure
      const diocesesRef = collection(db, 'dioceses');
      const diocesesSnapshot = await getDocs(diocesesRef);
      
      for (const dioceseDoc of diocesesSnapshot.docs) {
        const dioceseId = dioceseDoc.id;
        const schoolsRef = collection(db, `dioceses/${dioceseId}/schools`);
        const schoolsSnapshot = await getDocs(schoolsRef);
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id;
          const studentsRef = collection(db, `dioceses/${dioceseId}/schools/${schoolId}/students`);
          const studentsSnapshot = await getDocs(studentsRef);
          
          for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data();
            if (studentData.uid === uid) {
              console.log('✅ Found student in diocese structure');
              return {
                id: studentDoc.id,
                dioceseId,
                schoolId,
                ...studentData
              };
            }
          }
        }
      }
      
      console.log('❌ User profile not found');
      return null;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return null;
    }
  },

  // LEGACY FUNCTIONS (for backward compatibility) - DEPRECATED
  verifySchoolJoinCode: async (schoolJoinCode) => {
    console.warn('⚠️ verifySchoolJoinCode is deprecated - use findSchoolByStudentAccessCode instead');
    const school = await dbHelpers.findSchoolByStudentAccessCode(schoolJoinCode);
    return school ? { valid: true, school } : { valid: false, error: 'Invalid school code' };
  },

  findStudentByUsernameAndSchool: async (displayUsername, schoolCode) => {
    console.warn('⚠️ findStudentByUsernameAndSchool is deprecated - use findStudentInSchool instead');
    const school = await dbHelpers.findSchoolByStudentAccessCode(schoolCode);
    if (!school) return null;
    
    return await dbHelpers.findStudentInSchool(displayUsername, school.dioceseId, school.id);
  }
}

export default app

// STUDENT DATA FUNCTIONS

// Get student data from diocese structure (replaces localStorage)
export const getStudentData = async (uid) => {
  try {
    console.log('🔍 Looking for student with UID:', uid);
    
    // Search diocese structure for student
    const diocesesRef = collection(db, 'dioceses');
    const diocesesSnapshot = await getDocs(diocesesRef);
    
    for (const dioceseDoc of diocesesSnapshot.docs) {
      const dioceseId = dioceseDoc.id;
      const schoolsRef = collection(db, `dioceses/${dioceseId}/schools`);
      const schoolsSnapshot = await getDocs(schoolsRef);
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const studentsRef = collection(db, `dioceses/${dioceseId}/schools/${schoolId}/students`);
        const studentsSnapshot = await getDocs(studentsRef);
        
        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data();
          if (studentData.uid === uid) {
            console.log('✅ Found student:', studentData.firstName);
            return {
              id: studentDoc.id,
              dioceseId,
              schoolId,
              ...studentData
            };
          }
        }
      }
    }
    
    console.log('❌ Student not found with UID:', uid);
    return null;
  } catch (error) {
    console.error('❌ Error getting student data:', error);
    return null;
  }
};

// Get school's selected nominees (for trading cards)
export const getSchoolNominees = async (dioceseId, schoolId) => {
  try {
    console.log('📚 Getting nominees for school:', schoolId);
    
    // Get school data with selectedNominees array
    const schoolDoc = await getDoc(doc(db, `dioceses/${dioceseId}/schools`, schoolId));
    if (!schoolDoc.exists()) {
      throw new Error('School not found');
    }
    
    const schoolData = schoolDoc.data();
    const selectedNominees = schoolData.selectedNominees || [];
    
    console.log('📋 Selected nominee IDs:', selectedNominees);
    
    // Get full book data for each nominee ID
    const nominees = [];
    const masterNomineesRef = collection(db, 'masterNominees');
    const masterNomineesSnapshot = await getDocs(masterNomineesRef);
    
    masterNomineesSnapshot.forEach(doc => {
      if (selectedNominees.includes(doc.id)) {
        nominees.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    
    console.log('✅ Retrieved', nominees.length, 'nominee books');
    return nominees;
    
  } catch (error) {
    console.error('❌ Error getting school nominees:', error);
    throw error;
  }
};

// ENHANCED BOOKSHELF FUNCTIONS WITH DUPLICATE PREVENTION

// Add book to student's bookshelf with duplicate prevention
export const addBookToBookshelf = async (studentId, dioceseId, schoolId, bookId, format = 'book') => {
  try {
    console.log('📖 Adding book to bookshelf:', { bookId, format, studentId });
    
    // First, get current student data to check for duplicates
    const studentRef = doc(db, `dioceses/${dioceseId}/schools/${schoolId}/students`, studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const studentData = studentDoc.data();
    const currentBookshelf = studentData.bookshelf || [];
    
    // Check if this book+format combination already exists
    const existingBook = currentBookshelf.find(book => 
      book.bookId === bookId && book.format === format
    );
    
    if (existingBook) {
      console.log('⚠️ Book already exists in bookshelf:', { bookId, format });
      throw new Error(`This ${format === 'audiobook' ? 'audiobook' : 'book'} is already in your bookshelf`);
    }
    
    // Get book details from masterNominees to populate metadata
    const masterNomineeDoc = await getDoc(doc(db, 'masterNominees', bookId));
    let totalPages = 0;
    let totalMinutes = 0;
    
    if (masterNomineeDoc.exists()) {
      const bookData = masterNomineeDoc.data();
      totalPages = bookData.pages || bookData.pageCount || 0;
      totalMinutes = bookData.totalMinutes || 0;
    }
    
    // Create new book progress entry
    const bookProgress = {
      bookId,
      format, // 'book' or 'audiobook'
      currentProgress: 0, // pages read or minutes listened
      totalPages,
      totalMinutes,
      dateAdded: new Date().toISOString(), // Use ISO string for consistency
      completed: false,
      rating: 0,
      notes: '',
      readingSessions: []
    };
    
    // Add to bookshelf array
    const updatedBookshelf = [...currentBookshelf, bookProgress];
    
    // Update student document with new bookshelf
    await updateDoc(studentRef, {
      bookshelf: updatedBookshelf
    });
    
    console.log('✅ Book successfully added to bookshelf:', bookId, format);
    return bookProgress;
    
  } catch (error) {
    console.error('❌ Error adding book to bookshelf:', error);
    throw error;
  }
};

// Helper function to check if book is already in bookshelf
export const isBookInBookshelf = async (studentId, dioceseId, schoolId, bookId, format) => {
  try {
    const studentRef = doc(db, `dioceses/${dioceseId}/schools/${schoolId}/students`, studentId);
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

// Update student data in diocese structure with duplicate prevention
export const updateStudentData = async (studentId, dioceseId, schoolId, updates) => {
  try {
    const studentRef = doc(db, `dioceses/${dioceseId}/schools/${schoolId}/students`, studentId);
    
    // If updating bookshelf, make sure we're not creating duplicates
    if (updates.bookshelf) {
      // Remove duplicates based on bookId + format combination
      const uniqueBookshelf = [];
      const seen = new Set();
      
      updates.bookshelf.forEach(book => {
        const key = `${book.bookId}-${book.format}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueBookshelf.push(book);
        }
      });
      
      updates.bookshelf = uniqueBookshelf;
    }
    
    await updateDoc(studentRef, updates);
    console.log('✅ Student data updated:', Object.keys(updates));
  } catch (error) {
    console.error('❌ Error updating student data:', error);
    throw error;
  }
};

// Improved function to remove book from bookshelf
export const removeBookFromBookshelf = async (studentId, dioceseId, schoolId, bookId, format) => {
  try {
    const studentRef = doc(db, `dioceses/${dioceseId}/schools/${schoolId}/students`, studentId);
    const studentDoc = await getDoc(studentRef);
    
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }
    
    const studentData = studentDoc.data();
    const currentBookshelf = studentData.bookshelf || [];
    
    // Filter out the book with matching bookId and format
    const updatedBookshelf = currentBookshelf.filter(book => 
      !(book.bookId === bookId && book.format === format)
    );
    
    await updateDoc(studentRef, {
      bookshelf: updatedBookshelf
    });
    
    console.log('✅ Book removed from bookshelf:', bookId, format);
    return true;
  } catch (error) {
    console.error('❌ Error removing book from bookshelf:', error);
    throw error;
  }
};

// Enhanced function to get full bookshelf with book details
export const getStudentBookshelfWithDetails = async (studentId, dioceseId, schoolId) => {
  try {
    const studentDoc = await getDoc(doc(db, `dioceses/${dioceseId}/schools/${schoolId}/students`, studentId));
    
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
export const updateReadingProgress = async (studentId, dioceseId, schoolId, bookId, progress) => {
  try {
    // This would need to update the specific book in the bookshelf array
    // For now, we'll need to get the student, update the array, and save back
    const studentDoc = await getDoc(doc(db, `dioceses/${dioceseId}/schools/${schoolId}/students`, studentId));
    const studentData = studentDoc.data();
    
    const bookshelf = studentData.bookshelf || [];
    const bookIndex = bookshelf.findIndex(book => book.bookId === bookId);
    
    if (bookIndex !== -1) {
      bookshelf[bookIndex] = { ...bookshelf[bookIndex], ...progress };
      
      await updateDoc(doc(db, `dioceses/${dioceseId}/schools/${schoolId}/students`, studentId), {
        bookshelf: bookshelf
      });
    }
    
    console.log('✅ Reading progress updated for book:', bookId);
  } catch (error) {
    console.error('❌ Error updating reading progress:', error);
    throw error;
  }
};