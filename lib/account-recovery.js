// lib/accountRecovery.js - Core Account Recovery Functions

import { 
  sendPasswordResetEmail, 
  confirmPasswordReset, 
  verifyPasswordResetCode 
} from 'firebase/auth'
import { 
  collection, 
  doc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { auth, db } from './firebase'

// ===== PARENT PASSWORD RESET =====
export const parentPasswordReset = {
  // Send password reset email to parent
  sendResetEmail: async (email) => {
    try {
      console.log('📧 Sending password reset to parent:', email)
      
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/sign-in`,
        handleCodeInApp: false
      })
      
      console.log('✅ Password reset email sent successfully')
      return { success: true }
      
    } catch (error) {
      console.error('❌ Error sending password reset:', error)
      
      let errorMessage = 'Failed to send password reset email.'
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait before trying again.'
      }
      
      return { success: false, error: errorMessage }
    }
  }
}

// ===== TEACHER PASSWORD RESET =====
export const teacherPasswordReset = {
  // Send password reset email to teacher
  sendResetEmail: async (email) => {
    try {
      console.log('📧 Sending password reset to teacher:', email)
      
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/sign-in`,
        handleCodeInApp: false
      })
      
      console.log('✅ Teacher password reset email sent successfully')
      return { success: true }
      
    } catch (error) {
      console.error('❌ Error sending teacher password reset:', error)
      
      let errorMessage = 'Failed to send password reset email.'
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No teacher account found with this email address.'
      }
      
      return { success: false, error: errorMessage }
    }
  }
}

console.log('✅ Account recovery library loaded')