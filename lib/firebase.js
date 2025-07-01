// lib/firebase.js - Updated with Student Username Authentication
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc, collectionGroup } from 'firebase/firestore'
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
  // Create student account with simple school code password
  createStudentAccount: async (firstName, lastInitial, schoolJoinCode) => {
    try {
      // Clean the names - remove spaces and special characters for email
      const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLastInitial = lastInitial.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Create a valid email format (no spaces or special characters)
      const studentEmail = `${cleanFirstName}${cleanLastInitial}_${Date.now()}@student.luxlibris.app`
      
      // SIMPLE PASSWORD: Just use the school join code!
      const studentPassword = schoolJoinCode // HFCS2025
      
      console.log('🔐 Creating Firebase Auth account...');
      console.log('📧 Email:', studentEmail);
      console.log('🔑 Password:', studentPassword);
      
      // Validate email format before creating account
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(studentEmail)) {
        throw new Error(`Invalid email format: ${studentEmail}`);
      }
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword)
      const user = userCredential.user
      
      console.log('✅ Student Firebase Auth account created:', user.uid)
      
      // Return the actual email and password we used
      return {
        uid: user.uid,
        email: studentEmail,
        password: studentPassword, // Return the school code password
        firstName,
        lastInitial,
        schoolJoinCode,
        accountType: 'student'
      }
    } catch (error) {
      console.error('❌ Error creating student Firebase Auth account:', error)
      throw error
    }
  },

  // Sign in student using school code as password
  signInStudentWithSchoolCode: async (studentData, schoolCode) => {
    try {
      console.log('🔐 Signing in student with school code as password...');
      console.log('📧 Student email:', studentData.authEmail);
      console.log('🔑 School code password:', schoolCode);
      
      // Use the stored email and the school code as password
      const authEmail = studentData.authEmail;
      const authPassword = schoolCode; // School code IS the password
      
      if (!authEmail) {
        throw new Error('Student email not found. Please contact your teacher.');
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, authEmail, authPassword);
      console.log('✅ Student signed in successfully:', userCredential.user.uid);
      
      return userCredential.user;
    } catch (error) {
      console.error('❌ Error signing in student:', error);
      console.error('❌ Error code:', error.code);
      
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Incorrect username or school code. Please try again.');
      }
      throw new Error('Could not sign in. Please check your username and school code.');
    }
  },

  // Create parent account with real email
  createParentAccount: async (email, name, studentVerificationCode) => {
    try {
      const tempPassword = `parent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword)
      const user = userCredential.user
      
      return {
        uid: user.uid,
        email,
        name,
        studentVerificationCode,
        accountType: 'parent'
      }
    } catch (error) {
      console.error('Error creating parent account:', error)
      throw error
    }
  },

  // Create admin account with admin access code
  createAdminAccount: async (email, schoolId, adminAccessCode) => {
    try {
      const tempPassword = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword)
      const user = userCredential.user
      
      return {
        uid: user.uid,
        email,
        schoolId,
        adminAccessCode,
        accountType: 'admin'
      }
    } catch (error) {
      console.error('Error creating admin account:', error)
      throw error
    }
  },

  // Sign in user (admin/parent with email + password)
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback)
  }
}

// Database helper functions for account system
export const dbHelpers = {
  // Find student by display username + school code (more secure)
  findStudentByUsernameAndSchool: async (displayUsername, schoolCode) => {
    try {
      console.log('🔍 Searching for student:', displayUsername, 'at school:', schoolCode)
      
      // First find the school by join code
      const schoolsRef = collection(db, 'schools')
      const schoolQuery = query(schoolsRef, where('currentJoinCode', '==', schoolCode))
      const schoolSnapshot = await getDocs(schoolQuery)
      
      if (schoolSnapshot.empty) {
        console.log('❌ School not found with code:', schoolCode)
        return null
      }
      
      const schoolDoc = schoolSnapshot.docs[0]
      const schoolId = schoolDoc.id
      console.log('✅ Found school:', schoolDoc.data().name)
      
      // Now search for student in that specific school
      const studentsCollection = collection(db, 'schools', schoolId, 'students')
      const studentsSnapshot = await getDocs(studentsCollection)
      
      for (const studentDoc of studentsSnapshot.docs) {
        const studentData = studentDoc.data()
        if (studentData.displayUsername === displayUsername) {
          console.log('✅ Found student:', studentData.firstName, studentData.lastInitial)
          return {
            id: studentDoc.id,
            schoolId: schoolId,
            schoolCode: schoolCode,
            ...studentData
          }
        }
      }
      
      console.log('❌ Student not found with username:', displayUsername, 'in school:', schoolCode)
      return null
    } catch (error) {
      console.error('Error finding student by username and school:', error)
      return null
    }
  },

  // Verify school join code exists and is valid
  verifySchoolJoinCode: async (schoolJoinCode) => {
    try {
      const schoolsRef = collection(db, 'schools')
      const q = query(schoolsRef, where('currentJoinCode', '==', schoolJoinCode))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return { valid: false, error: 'Invalid school join code' }
      }
      
      const schoolDoc = querySnapshot.docs[0]
      const schoolData = schoolDoc.data()
      
      // Check if license is expired
      if (schoolData.licenseExpires && new Date(schoolData.licenseExpires.toDate()) < new Date()) {
        return { valid: false, error: 'School license has expired' }
      }
      
      return { 
        valid: true, 
        school: { 
          id: schoolDoc.id, 
          ...schoolData 
        }
      }
    } catch (error) {
      console.error('Error verifying school join code:', error)
      return { valid: false, error: 'Database error' }
    }
  },

  // Verify admin access code
  verifyAdminAccessCode: async (adminAccessCode) => {
    try {
      const schoolsRef = collection(db, 'schools')
      const q = query(schoolsRef, where('adminAccessCode', '==', adminAccessCode))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return { valid: false, error: 'Invalid admin access code' }
      }
      
      const schoolDoc = querySnapshot.docs[0]
      return { 
        valid: true, 
        school: { 
          id: schoolDoc.id, 
          ...schoolDoc.data() 
        }
      }
    } catch (error) {
      console.error('Error verifying admin access code:', error)
      return { valid: false, error: 'Database error' }
    }
  },

  // Create student profile in database (DEPRECATED - use school subcollections instead)
  createStudentProfile: async (uid, studentData, schoolData) => {
    try {
      const studentProfile = {
        uid,
        firstName: studentData.firstName,
        lastInitial: studentData.lastInitial,
        schoolId: schoolData.id,
        schoolName: schoolData.name,
        accountCreated: new Date(),
        personalGoal: 15, // Default goal
        thisYearBooks: 0,
        lifetimeBooks: 0,
        saintUnlocks: [],
        selectedTheme: 'classic_lux',
        readingStreaks: { current: 0, longest: 0 },
        onboardingCompleted: false,
        accountType: 'student'
      }
      
      await addDoc(collection(db, 'users'), studentProfile)
      return studentProfile
    } catch (error) {
      console.error('Error creating student profile:', error)
      throw error
    }
  },

  // Create parent profile in database
  createParentProfile: async (uid, parentData) => {
    try {
      const parentProfile = {
        uid,
        email: parentData.email,
        name: parentData.name,
        linkedStudents: [], // Will be populated when student links
        premiumSubscription: false,
        schoolIds: [],
        accountCreated: new Date(),
        accountType: 'parent'
      }
      
      await addDoc(collection(db, 'users'), parentProfile)
      return parentProfile
    } catch (error) {
      console.error('Error creating parent profile:', error)
      throw error
    }
  },

  // Create admin profile in database
  createAdminProfile: async (uid, adminData, schoolData) => {
    try {
      const adminProfile = {
        uid,
        email: adminData.email,
        schoolId: schoolData.id,
        schoolName: schoolData.name,
        permissions: ['manage_students', 'approve_submissions', 'view_reports'],
        accountCreated: new Date(),
        accountType: 'admin'
      }
      
      await addDoc(collection(db, 'users'), adminProfile)
      return adminProfile
    } catch (error) {
      console.error('Error creating admin profile:', error)
      throw error
    }
  },

  // Get user profile by UID (looks in global users collection)
  getUserProfile: async (uid) => {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('uid', '==', uid))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        // If not found in global users, search in school students subcollections
        const schoolsSnapshot = await getDocs(collection(db, 'schools'))
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id
          const studentsCollection = collection(db, 'schools', schoolId, 'students')
          const studentsSnapshot = await getDocs(studentsCollection)
          
          for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data()
            if (studentData.uid === uid) {
              return {
                id: studentDoc.id,
                schoolId: schoolId,
                ...studentData
              }
            }
          }
        }
        
        return null
      }
      
      const userDoc = querySnapshot.docs[0]
      return { id: userDoc.id, ...userDoc.data() }
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }
}

export default app