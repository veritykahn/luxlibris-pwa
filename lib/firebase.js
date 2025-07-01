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
  // Create student account with consistent auth system
  createStudentAccount: async (firstName, lastInitial, schoolJoinCode) => {
    try {
      // Create a consistent email format for students
      const studentEmail = `${firstName.toLowerCase()}${lastInitial.toLowerCase()}_${Date.now()}@student.luxlibris.app`
      
      // Use a consistent password system (school code + birthdate simulation)
      // In real app, you'd collect birth month/day during onboarding for password
      const studentPassword = `${schoolJoinCode.toLowerCase()}2024` // Simple for now, enhance later
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, studentPassword)
      const user = userCredential.user
      
      console.log('✅ Student Firebase Auth account created:', user.uid)
      
      return {
        uid: user.uid,
        email: studentEmail,
        password: studentPassword, // Store temporarily for sign-in helper
        firstName,
        lastInitial,
        schoolJoinCode,
        accountType: 'student'
      }
    } catch (error) {
      console.error('Error creating student Firebase Auth account:', error)
      throw error
    }
  },

  // Sign in student using their display username
  signInStudent: async (studentData) => {
    try {
      // Students sign in using their stored auth credentials
      // In production, you'd implement a more sophisticated system
      // For now, we'll construct the expected credentials from their data
      
      const studentEmail = studentData.email || `${studentData.firstName.toLowerCase()}${studentData.lastInitial.toLowerCase()}_student@luxlibris.app`
      const studentPassword = `${studentData.schoolJoinCode || 'student'}2024`
      
      const userCredential = await signInWithEmailAndPassword(auth, studentEmail, studentPassword)
      console.log('✅ Student signed in successfully:', userCredential.user.uid)
      
      return userCredential.user
    } catch (error) {
      console.error('Error signing in student:', error)
      // If direct sign-in fails, try to find their actual auth data
      throw new Error('Could not sign in. Please check your username or ask your teacher for help.')
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
  // Find student by display username across all schools
  findStudentByUsername: async (displayUsername) => {
    try {
      console.log('🔍 Searching for student with username:', displayUsername)
      
      // Search across all schools' students subcollections
      const schoolsSnapshot = await getDocs(collection(db, 'schools'))
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id
        const studentsCollection = collection(db, 'schools', schoolId, 'students')
        const studentsSnapshot = await getDocs(studentsCollection)
        
        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data()
          if (studentData.displayUsername === displayUsername) {
            console.log('✅ Found student:', studentData.firstName, studentData.lastInitial)
            return {
              id: studentDoc.id,
              schoolId: schoolId,
              ...studentData
            }
          }
        }
      }
      
      console.log('❌ Student not found with username:', displayUsername)
      return null
    } catch (error) {
      console.error('Error finding student by username:', error)
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