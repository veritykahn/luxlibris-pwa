// lib/firebase.js - Updated with Authentication
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore'
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
  // Create student account with school join code
  createStudentAccount: async (firstName, lastInitial, schoolJoinCode) => {
    try {
      // Generate temporary email for student (they don't need real email)
      const tempEmail = `${firstName.toLowerCase()}_${Date.now()}@luxlibris.temp`
      const tempPassword = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, tempPassword)
      const user = userCredential.user
      
      return {
        uid: user.uid,
        tempEmail,
        firstName,
        lastInitial,
        schoolJoinCode,
        accountType: 'student'
      }
    } catch (error) {
      console.error('Error creating student account:', error)
      throw error
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

  // Sign in user
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

  // Create student profile in database
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

  // Get user profile by UID
  getUserProfile: async (uid) => {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('uid', '==', uid))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
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