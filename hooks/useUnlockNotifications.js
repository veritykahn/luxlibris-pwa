// hooks/useUnlockNotifications.js - Real-time unlock request notifications for parents
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../lib/firebase'
import { collection, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore'

export const useUnlockNotifications = () => {
  const { user, userProfile } = useAuth()
  const [notifications, setNotifications] = useState({
    unlockRequests: [],
    totalCount: 0,
    newCount: 0,
    loading: true
  })
  
  // Track seen notifications to prevent duplicates
  const seenRequestsRef = useRef(new Set())
  const [toastQueue, setToastQueue] = useState([])

  // Helper function to extract unlock requests from student data
  const extractUnlockRequests = (studentData, studentId, studentInfo) => {
    const requests = []
    
    // Check for leaderboard unlock request
    if (studentData.leaderboardUnlockRequested && !studentData.leaderboardUnlocked) {
      const requestId = `${studentId}-leaderboard`
      requests.push({
        id: requestId,
        type: 'leaderboard',
        studentId: studentId,
        studentName: `${studentData.firstName} ${studentData.lastInitial || ''}`,
        studentInfo: studentInfo,
        requestedAt: studentData.leaderboardRequestedAt || studentData.requestedAt || new Date(),
        isNew: !seenRequestsRef.current.has(requestId)
      })
    }
    
    // Check bookshelf for quiz unlock requests
    if (studentData.bookshelf && Array.isArray(studentData.bookshelf)) {
      studentData.bookshelf.forEach(book => {
        if (book.status === 'pending_parent_quiz_unlock') {
          const requestId = `${studentId}-quiz-${book.bookId}`
          requests.push({
            id: requestId,
            type: 'quiz',
            studentId: studentId,
            studentName: `${studentData.firstName} ${studentData.lastInitial || ''}`,
            studentInfo: studentInfo,
            bookId: book.bookId,
            bookTitle: book.bookTitle || 'Unknown Book',
            requestedAt: book.requestedAt || new Date(),
            isNew: !seenRequestsRef.current.has(requestId)
          })
        }
      })
    }
    
    return requests
  }

  // Add new notifications to toast queue
  const addToastNotification = (request) => {
    const toast = {
      id: `toast-${request.id}`,
      type: request.type,
      studentName: request.studentName,
      bookTitle: request.bookTitle,
      message: request.type === 'leaderboard' 
        ? `${request.studentName} requested leaderboard access`
        : `${request.studentName} requested quiz unlock for "${request.bookTitle}"`,
      timestamp: new Date()
    }
    
    setToastQueue(prev => [...prev, toast])
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToastQueue(prev => prev.filter(t => t.id !== toast.id))
    }, 5000)
  }

  // Load linked students and set up real-time listeners
  useEffect(() => {
    if (!user?.uid || userProfile?.accountType !== 'parent') {
      setNotifications(prev => ({ ...prev, loading: false }))
      return
    }

    const setupNotificationListeners = async () => {
      try {
        console.log('🔔 Setting up unlock notification listeners...')
        
        // Get parent profile to find linked students
        const parentRef = doc(db, 'parents', user.uid)
        const parentDoc = await getDoc(parentRef)
        
        if (!parentDoc.exists()) {
          setNotifications(prev => ({ ...prev, loading: false }))
          return
        }

        const parentData = parentDoc.data()
        const linkedStudentIds = parentData.linkedStudents || []
        
        if (linkedStudentIds.length === 0) {
          setNotifications(prev => ({ ...prev, loading: false }))
          return
        }

        console.log(`👨‍👩‍👧‍👦 Setting up listeners for ${linkedStudentIds.length} linked students`)

        // Set up listeners for each linked student
        const unsubscribeFunctions = []
        const studentInfoMap = new Map()

        // Search for students across all entities/schools
        const entitiesRef = collection(db, 'entities')
        const entitiesSnapshot = await getDocs(entitiesRef)
        
        for (const entityDoc of entitiesSnapshot.docs) {
          const entityId = entityDoc.id
          const schoolsRef = collection(db, `entities/${entityId}/schools`)
          const schoolsSnapshot = await getDocs(schoolsRef)
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            const schoolId = schoolDoc.id
            const schoolData = schoolDoc.data()
            const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`)
            
            // Set up real-time listener for this school's students
            const unsubscribe = onSnapshot(studentsRef, (snapshot) => {
              const allRequests = []
              
              snapshot.docs.forEach(doc => {
                const studentData = doc.data()
                const studentId = doc.id
                
                // Only process linked students
                if (linkedStudentIds.includes(studentId)) {
                  // Store student info for later use
                  const studentInfo = {
                    entityId: entityId,
                    schoolId: schoolId,
                    schoolName: schoolData.name,
                    grade: studentData.grade
                  }
                  studentInfoMap.set(studentId, studentInfo)
                  
                  // Extract unlock requests for this student
                  const requests = extractUnlockRequests(studentData, studentId, studentInfo)
                  allRequests.push(...requests)
                }
              })
              
              // Update notifications state
              const newRequests = allRequests.filter(req => req.isNew)
              const totalCount = allRequests.length
              const newCount = newRequests.length
              
              setNotifications(prev => ({
                unlockRequests: allRequests,
                totalCount: totalCount,
                newCount: newCount,
                loading: false
              }))
              
              // Add toast notifications for new requests
              newRequests.forEach(request => {
                addToastNotification(request)
                seenRequestsRef.current.add(request.id)
              })
              
              if (newRequests.length > 0) {
                console.log(`🔔 ${newRequests.length} new unlock requests detected`)
              }
            }, (error) => {
              console.error(`❌ Error in notification listener for school ${schoolId}:`, error)
            })
            
            unsubscribeFunctions.push(unsubscribe)
          }
        }

        // Cleanup function
        return () => {
          console.log('🧹 Cleaning up notification listeners')
          unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
        }

      } catch (error) {
        console.error('❌ Error setting up notification listeners:', error)
        setNotifications(prev => ({ ...prev, loading: false }))
      }
    }

    const cleanup = setupNotificationListeners()
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn())
      }
    }
  }, [user?.uid, userProfile?.accountType, userProfile?.linkedStudents])

  // Mark notifications as seen (reduce new count)
  const markNotificationsAsSeen = () => {
    notifications.unlockRequests.forEach(request => {
      seenRequestsRef.current.add(request.id)
    })
    
    setNotifications(prev => ({
      ...prev,
      newCount: 0
    }))
  }

  // Remove a toast notification
  const removeToast = (toastId) => {
    setToastQueue(prev => prev.filter(toast => toast.id !== toastId))
  }

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.unlockRequests.filter(req => req.type === type)
  }

  // Get notifications by student
  const getNotificationsByStudent = (studentId) => {
    return notifications.unlockRequests.filter(req => req.studentId === studentId)
  }

  return {
    notifications,
    toastQueue,
    markNotificationsAsSeen,
    removeToast,
    getNotificationsByType,
    getNotificationsByStudent,
    
    // Quick access properties
    hasNotifications: notifications.totalCount > 0,
    hasNewNotifications: notifications.newCount > 0,
    totalCount: notifications.totalCount,
    newCount: notifications.newCount,
    loading: notifications.loading
  }
}

export default useUnlockNotifications