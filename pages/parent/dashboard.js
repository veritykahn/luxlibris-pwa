// pages/parent/dashboard.js - Enhanced with daily rotations, persistent colors, time-based background, and Weekly Reading Wisdom
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePhaseAccess } from '../../hooks/usePhaseAccess'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore'
import { db, getSchoolNomineesEntities, getCurrentAcademicYear } from '../../lib/firebase'
import useUnlockNotifications from '../../hooks/useUnlockNotifications'
import { NotificationToastContainer } from '../../components/NotificationToast'
import { getCurrentWeekContent, categoryColors, bottomLineMessages } from '../../lib/weekly-tips-facts'

export default function ParentDashboard() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  const { phaseData, hasAccess, getPhaseMessage, getPhaseInfo } = usePhaseAccess(userProfile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [familyData, setFamilyData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [nominees, setNominees] = useState([])
  const [pendingQuizApprovals, setPendingQuizApprovals] = useState([])
  const [pendingLeaderboardApprovals, setPendingLeaderboardApprovals] = useState([])
  const [recentAchievements, setRecentAchievements] = useState([])
  const [showComingSoon, setShowComingSoon] = useState('')
  const [familyParents, setFamilyParents] = useState([])
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState([])
  const [daysUntilEnd, setDaysUntilEnd] = useState(0)
  const [studentVotes, setStudentVotes] = useState({})
  const [dailySuggestions, setDailySuggestions] = useState({})
  const [dailyAdvice, setDailyAdvice] = useState({})
  const [showAllAchievements, setShowAllAchievements] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 768)
  
  // Navigation menu state
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [expandedStudent, setExpandedStudent] = useState(null)
  
  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)

  // Weekly Reading Wisdom states
  const [expandedTip, setExpandedTip] = useState(null)
  const [showBottomLine, setShowBottomLine] = useState(false)

  // Real-time unlock notifications
  const {
    notifications,
    toastQueue,
    markNotificationsAsSeen,
    removeToast,
    hasNotifications,
    hasNewNotifications,
    totalCount,
    newCount,
    loading: notificationsLoading
  } = useUnlockNotifications()

  // Get current week's content
  const weeklyContent = useMemo(() => {
    const content = getCurrentWeekContent();
    const randomBottomLine = bottomLineMessages[Math.floor(Math.random() * bottomLineMessages.length)];
    return { ...content, bottomLine: randomBottomLine };
  }, []);

  // Track window width for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get time-based theme with smoother transitions
  const timeTheme = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        name: 'morning',
        gradient: 'linear-gradient(135deg, #F5C99B, #F0B88A, #EBAD7A)',
        backgroundGradient: 'linear-gradient(to bottom, #FDF4E7, #FAE8D4, #F5DCC1)',
        overlay: 'rgba(245, 201, 155, 0.1)',
        glow: '#F5C99B'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        name: 'afternoon',
        gradient: 'linear-gradient(135deg, #6BB6E3, #7AC5EA, #89D0EE)',
        backgroundGradient: 'linear-gradient(to bottom, #E8F4FD, #D1E9FB, #B8DDF8)',
        overlay: 'rgba(107, 182, 227, 0.1)',
        glow: '#6BB6E3'
      };
    } else if (hour >= 17 && hour < 20) {
      return {
        name: 'evening',
        gradient: 'linear-gradient(135deg, #FFB347, #FF8C42, #FF6B35)',
        backgroundGradient: 'linear-gradient(to bottom, #FFF0E6, #FFE4D1, #FFD7BC)',
        overlay: 'rgba(255, 140, 66, 0.1)',
        glow: '#FF8C42'
      };
    } else {
      return {
        name: 'night',
        gradient: 'linear-gradient(135deg, #4B0082, #6A0DAD, #7B68EE)',
        backgroundGradient: 'linear-gradient(to bottom, #2D1B4E, #3D2B5E, #4D3B6E)',
        overlay: 'rgba(75, 0, 130, 0.1)',
        glow: '#7B68EE'
      };
    }
  }, [Math.floor(new Date().getHours() / 6)]);

  // Lux Libris Classic Theme - adapted for time-based backgrounds
  const luxTheme = useMemo(() => {
    const isNight = timeTheme.name === 'night';
    return {
      primary: '#ADD4EA',
      secondary: '#C3E0DE',
      accent: '#A1E5DB',
      background: timeTheme.backgroundGradient,
      surface: isNight ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
      textPrimary: isNight ? '#1F2937' : '#223848',
      textSecondary: isNight ? '#374151' : '#556B7A',
      timeOverlay: timeTheme.overlay,
      timeGlow: timeTheme.glow
    }
  }, [timeTheme]);

  // Generate consistent color for each child - 8 beautiful distinct colors (matches child-progress page)
const getChildColor = (childName, childId) => {
  const colors = [
    '#14B8A6', // Teal
    '#6366F1', // Indigo  
    '#A855F7', // Violet
    '#EC4899', // Pink
    '#F59E0B', // Yellow
    '#FF6B35', // Orange
    '#10B981', // Green
    '#1E3A8A'  // Navy Blue
  ]
    
    const str = (childName + childId).toLowerCase()
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂', current: true },
    { 
      name: 'Child Progress', 
      path: '/parent/child-progress', 
      icon: '◐',
      badge: totalCount > 0 ? totalCount : null,
      badgeColor: newCount > 0 ? '#F59E0B' : '#6B7280'
    },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️' },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [totalCount, newCount])

  // Bottom navigation items
  const bottomNavItems = useMemo(() => {
    const isMobile = windowWidth < 400;
    
    return [
      { name: isMobile ? 'Home' : 'Dashboard', path: '/parent/dashboard', icon: '⌂', current: true },
      { 
        name: 'Progress', 
        path: '/parent/child-progress', 
        icon: '◐',
        badge: totalCount > 0 ? totalCount : null,
        badgeColor: newCount > 0 ? '#F59E0B' : '#6B7280'
      },
      { name: 'Books', path: '/parent/nominees', icon: '□' },
      { name: 'Habits', path: '/parent/healthy-habits', icon: '◉' },
      { name: 'Battle', path: '/parent/family-battle', icon: '⚔️' },
      { name: 'DNA', path: '/parent/dna-lab', icon: '⬢' }
    ];
  }, [totalCount, newCount, windowWidth])

  // Reading advice for active readers
  const readingAdviceList = [
    "Ask your child what their favorite character would do in a real-life situation",
    "Create voices for different characters when discussing the book",
    "Ask 'What do you think will happen next?' before they continue reading",
    "Connect the story to your child's own experiences",
    "Discuss how the character felt and why they made certain choices",
    "Ask your child to draw their favorite scene from today's reading",
    "Have them explain the story to a sibling or friend",
    "Ask what they would change about the story if they were the author",
    "Discuss new vocabulary words they encountered",
    "Create a family book club and read the same book together",
    "Ask them to act out their favorite part of the story",
    "Have them write a letter to their favorite character",
    "Discuss the setting - would they want to visit that place?",
    "Ask what lesson the main character learned",
    "Create a bookmark together with quotes from the book"
  ]

  // Helper functions
  const hasStudentStartedReading = (student) => {
    const bookshelf = student.bookshelf || []
    return bookshelf.length > 0
  }

  const getAvailableBooksForStudent = (student, bookNominees) => {
    const bookshelf = student.bookshelf || []
    const bookshelfIds = bookshelf.map(b => b.bookId)
    return bookNominees.filter(nominee => !bookshelfIds.includes(nominee.id))
  }

  // Get daily suggestions/advice based on date (changes daily, not every 10 seconds)
  const getDailySuggestions = (linkedStudents, bookNominees) => {
    const today = new Date().toDateString()
    const suggestions = {}
    const advice = {}
    
    console.log('🎯 Getting daily suggestions for', linkedStudents.length, 'students with', bookNominees.length, 'nominees')
    
    linkedStudents.forEach(student => {
      // Use date + student ID as seed for consistent daily rotation
      const seed = today + student.id
      let hash = 0
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash + seed.charCodeAt(i)) & 0xffffffff
      }
      
      const studentHasStarted = hasStudentStartedReading(student)
      console.log(`📚 Student ${student.firstName} has started reading:`, studentHasStarted)
      
      if (!studentHasStarted) {
        const availableBooks = getAvailableBooksForStudent(student, bookNominees)
        console.log(`📖 Available books for ${student.firstName}:`, availableBooks.length)
        
        if (availableBooks.length > 0) {
          const bookIndex = Math.abs(hash) % availableBooks.length
          suggestions[student.id] = availableBooks[bookIndex]
          console.log(`💡 Suggested book for ${student.firstName}:`, availableBooks[bookIndex].title)
        }
      } else {
        const adviceIndex = Math.abs(hash) % readingAdviceList.length
        advice[student.id] = readingAdviceList[adviceIndex]
      }
    })
    
    console.log('📋 Final suggestions:', suggestions)
    console.log('💬 Final advice:', advice)
    
    return { suggestions, advice }
  }

  // Check notification permission on load
  useEffect(() => {
    if ('Notification' in window) {
      const permission = Notification.permission
      setNotificationsEnabled(permission === 'granted')
      
      // Check if we should show prompt (once per session if not accepted)
      const hasAcceptedBefore = localStorage.getItem('luxlibris_notifications_accepted') === 'true'
      const shownThisSession = sessionStorage.getItem('luxlibris_notification_prompt_shown') === 'true'
      
      if (permission === 'default' && !hasAcceptedBefore && !shownThisSession) {
        // Show prompt after 30 seconds
        setTimeout(() => {
          setShowNotificationPrompt(true)
          sessionStorage.setItem('luxlibris_notification_prompt_shown', 'true')
        }, 30000)
      }
    }
  }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadFamilyDashboardData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile])

  // Calculate days until program end
  useEffect(() => {
    if (phaseData && !phaseData.loading) {
      const calculateDaysUntilEnd = () => {
        const now = new Date()
        let endDate
        
        switch (phaseData.currentPhase) {
          case 'ACTIVE':
            const currentYear = getCurrentAcademicYear()
            const yearInt = parseInt(currentYear.split('-')[0])
            endDate = new Date(yearInt + 1, 2, 31) // March 31st
            break
          case 'VOTING':
            const votingYear = getCurrentAcademicYear()
            const votingYearInt = parseInt(votingYear.split('-')[0])
            endDate = new Date(votingYearInt + 1, 3, 14) // April 14th
            break
          default:
            endDate = now
        }
        
        const timeDiff = endDate.getTime() - now.getTime()
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
        setDaysUntilEnd(Math.max(0, daysDiff))
      }
      
      calculateDaysUntilEnd()
    }
  }, [phaseData])

  // Close nav menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (showNavMenu) setShowNavMenu(false)
        if (showBottomLine) setShowBottomLine(false)
        if (showNotificationPrompt) setShowNotificationPrompt(false)
      }
    }

    if (showNavMenu || showBottomLine || showNotificationPrompt) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNavMenu, showBottomLine, showNotificationPrompt])

  // Request notification permission
  const requestNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications')
        return false
      }

      const permission = await Notification.requestPermission()
      const enabled = permission === 'granted'
      setNotificationsEnabled(enabled)
      
      if (enabled) {
        // Mark as accepted in localStorage (permanent)
        localStorage.setItem('luxlibris_notifications_accepted', 'true')
        
        new Notification('🎉 Notifications Enabled!', {
          body: 'You\'ll be notified when your children need quiz approvals or unlock the leaderboard!',
          icon: '/images/lux_libris_logo.png'
        })
      }
      
      return enabled
    } catch (error) {
      console.error('Notification permission error:', error)
      return false
    }
  }

  const loadFamilyDashboardData = async () => {
    try {
      console.log('🏠 Loading family dashboard data...')
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentData = parentDoc.data()
      console.log('✅ Parent data loaded:', parentData.firstName)

      // Load family profile
      let familyDoc = null
      let familyId = parentData.familyId || user.uid
      
      if (parentData.familyId) {
        const familyRef = doc(db, 'families', parentData.familyId)
        familyDoc = await getDoc(familyRef)
      }
      
      if (!familyDoc || !familyDoc.exists()) {
        const familyRef = doc(db, 'families', user.uid)
        familyDoc = await getDoc(familyRef)
        familyId = user.uid
      }
      
      if (familyDoc.exists()) {
        const familyData = familyDoc.data()
        setFamilyData(familyData)
        console.log('✅ Family data loaded:', familyData.familyName)
        
        await loadFamilyParents(familyData, familyId)
      }

      // Load linked students
      const students = await loadLinkedStudentsData(parentData.linkedStudents || [])
      
      if (students.length > 0) {
        // Load nominees
        const firstStudent = students[0]
        const allNominees = await getSchoolNomineesEntities(
          firstStudent.entityId,
          firstStudent.schoolId
        )
        
        const currentYear = getCurrentAcademicYear()
        const currentYearNominees = allNominees.filter(book => 
          book.academicYear === currentYear || !book.academicYear
        )
        
        setNominees(currentYearNominees)
        
        // Get daily suggestions/advice
        const { suggestions, advice } = getDailySuggestions(students, currentYearNominees)
        setDailySuggestions(suggestions)
        setDailyAdvice(advice)
        
        // Process student data
        const readingBooks = []
        const votes = {}
        const quizApprovals = []
        const leaderboardApprovals = []
        
        students.forEach(student => {
          // Currently reading books
          const studentReadingBooks = (student.bookshelf || []).filter(book => 
            !book.completed && book.currentProgress > 0
          )
          
          studentReadingBooks.forEach(book => {
            const nominee = currentYearNominees.find(n => n.id === book.bookId)
            if (nominee) {
              readingBooks.push({
                ...book,
                studentName: student.firstName,
                studentId: student.id,
                bookDetails: nominee,
                progressPercent: Math.round((book.currentProgress / (book.format === 'audiobook' ? nominee.totalMinutes : nominee.pages)) * 100)
              })
            }
          })
          
          // Pending approvals
          const bookshelf = student.bookshelf || []
          bookshelf.forEach(book => {
            if (book.status === 'pending_parent_quiz_unlock') {
              const nominee = currentYearNominees.find(n => n.id === book.bookId)
              quizApprovals.push({
                studentId: student.id,
                studentName: student.firstName,
                bookTitle: nominee?.title || book.bookTitle || 'Unknown Book',
                bookId: book.bookId,
                requestedAt: book.requestedAt || new Date()
              })
            }
          })
          
          // Leaderboard approvals
          if (student.leaderboardUnlockRequested && !student.leaderboardUnlocked) {
            leaderboardApprovals.push({
              studentId: student.id,
              studentName: student.firstName,
              requestedAt: student.leaderboardRequestedAt || new Date()
            })
          }
          
          // Student votes
          if (student.votes && student.votes.length > 0) {
            const currentYearVotes = student.votes.filter(vote => vote.academicYear === currentYear)
            if (currentYearVotes.length > 0) {
              votes[student.id] = {
                studentName: student.firstName,
                vote: currentYearVotes[0],
                bookTitle: currentYearNominees.find(n => n.id === currentYearVotes[0].bookId)?.title || 'Unknown Book'
              }
            }
          }
        })
        
        setCurrentlyReadingBooks(readingBooks)
        setStudentVotes(votes)
        setPendingQuizApprovals(quizApprovals)
        setPendingLeaderboardApprovals(leaderboardApprovals)
      }
      
      // Load recent achievements
      await loadRecentAchievements(parentData.linkedStudents || [], students)

    } catch (error) {
      console.error('❌ Error loading family dashboard:', error)
      setError('Failed to load family data. Please try again.')
    }
    
    setLoading(false)
  }

  const loadFamilyParents = async (familyData, familyId) => {
    try {
      const parents = []
      const parentIds = familyData.parents || [familyId]
      
      for (const parentId of parentIds) {
        const parentRef = doc(db, 'parents', parentId)
        const parentDoc = await getDoc(parentRef)
        
        if (parentDoc.exists()) {
          const parentData = parentDoc.data()
          parents.push({
            id: parentId,
            ...parentData,
            isCurrentUser: parentId === user.uid
          })
        }
      }
      
      setFamilyParents(parents)
      console.log('✅ Family parents loaded:', parents.length)
      
    } catch (error) {
      console.error('❌ Error loading family parents:', error)
    }
  }

  const loadLinkedStudentsData = async (linkedStudentIds) => {
    try {
      const students = []
      
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
          const studentsSnapshot = await getDocs(studentsRef)
          
          for (const studentDoc of studentsSnapshot.docs) {
            if (linkedStudentIds.includes(studentDoc.id)) {
              const studentData = {
                id: studentDoc.id,
                entityId,
                schoolId,
                schoolName: schoolData.name,
                ...studentDoc.data()
              }
              students.push(studentData)
            }
          }
        }
      }
      
      setLinkedStudents(students)
      console.log('✅ Linked students loaded:', students.length)
      return students
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error)
      return []
    }
  }

  const loadRecentAchievements = async (linkedStudentIds, students) => {
    try {
      const achievements = []
      
      students.forEach(student => {
        // Check for recent saint unlocks
        const timestamps = student.newlyUnlockedSaintsWithTimestamp || {}
        Object.keys(timestamps).forEach(saintId => {
          const unlockTime = new Date(timestamps[saintId].timestamp)
          const hoursSince = (new Date() - unlockTime) / (1000 * 60 * 60)
          
          if (hoursSince < 48) {
            achievements.push({
              type: 'saint_unlock',
              studentName: student.firstName,
              studentId: student.id,
              saintName: timestamps[saintId].name || saintId,
              unlockedAt: unlockTime,
              icon: '⚔️'
            })
          }
        })
        
        // Check for recent book completions
        const bookshelf = student.bookshelf || []
        bookshelf.forEach(book => {
          if (book.completed && book.completedAt) {
            const completedTime = book.completedAt?.toDate ? book.completedAt.toDate() : new Date(book.completedAt)
            const hoursSince = (new Date() - completedTime) / (1000 * 60 * 60)
            
            if (hoursSince < 48) {
              const nominee = nominees.find(n => n.id === book.bookId)
              achievements.push({
                type: 'book_completion',
                studentName: student.firstName,
                studentId: student.id,
                bookTitle: nominee?.title || book.bookTitle || 'Unknown Book',
                completedAt: completedTime,
                icon: '📚'
              })
            }
          }
        })
      })
      
      // Sort by most recent first
      achievements.sort((a, b) => {
        const timeA = a.unlockedAt || a.completedAt
        const timeB = b.unlockedAt || b.completedAt
        return timeB - timeA
      })
      
      setRecentAchievements(achievements)
      
    } catch (error) {
      console.error('❌ Error loading recent achievements:', error)
    }
  }

  const getStudentReadingBooks = (student) => {
    const bookshelf = student.bookshelf || []
    return bookshelf.filter(book => !book.completed && book.currentProgress > 0)
      .map(book => {
        const nominee = nominees.find(n => n.id === book.bookId)
        return {
          ...book,
          bookDetails: nominee,
          progressPercent: nominee ? 
            Math.round((book.currentProgress / (book.format === 'audiobook' ? nominee.totalMinutes : nominee.pages)) * 100) : 
            0
        }
      })
  }

  const handleApproveQuiz = async (approval) => {
    try {
      console.log('✅ Approving quiz for:', approval.bookTitle)
      
      const student = linkedStudents.find(s => s.id === approval.studentId)
      if (student) {
        const studentRef = doc(db, `entities/${student.entityId}/schools/${student.schoolId}/students`, student.id)
        const studentDoc = await getDoc(studentRef)
        const studentData = studentDoc.data()
        const bookshelf = studentData.bookshelf || []
        
        const updatedBookshelf = bookshelf.map(book => {
          if (book.bookId === approval.bookId && book.status === 'pending_parent_quiz_unlock') {
            return {
              ...book,
              status: 'quiz_unlocked',
              parentUnlockedAt: new Date(),
              parentUnlockedBy: user.uid
            }
          }
          return book
        })
        
        await updateDoc(studentRef, {
          bookshelf: updatedBookshelf,
          lastModified: new Date()
        })
        
        setPendingQuizApprovals(prev => prev.filter(p => p.bookId !== approval.bookId))
        
        setShowComingSoon(`✅ Quiz approved for "${approval.bookTitle}"!`)
        setTimeout(() => setShowComingSoon(''), 3000)
      }
      
    } catch (error) {
      console.error('❌ Error approving quiz:', error)
      setShowComingSoon('❌ Failed to approve quiz. Please try again.')
      setTimeout(() => setShowComingSoon(''), 3000)
    }
  }

  const handleApproveLeaderboard = async (approval) => {
    try {
      console.log('✅ Approving leaderboard for:', approval.studentName)
      
      const student = linkedStudents.find(s => s.id === approval.studentId)
      if (student) {
        const studentRef = doc(db, `entities/${student.entityId}/schools/${student.schoolId}/students`, student.id)
        
        await updateDoc(studentRef, {
          leaderboardUnlocked: true,
          leaderboardUnlockRequested: false,
          leaderboardUnlockedAt: new Date(),
          leaderboardUnlockedBy: user.uid,
          lastModified: new Date()
        })
        
        setPendingLeaderboardApprovals(prev => prev.filter(p => p.studentId !== approval.studentId))
        
        setShowComingSoon(`✅ Leaderboard access approved for ${approval.studentName}!`)
        setTimeout(() => setShowComingSoon(''), 3000)
      }
      
    } catch (error) {
      console.error('❌ Error approving leaderboard:', error)
      setShowComingSoon('❌ Failed to approve leaderboard. Please try again.')
      setTimeout(() => setShowComingSoon(''), 3000)
    }
  }

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.current) return
    
    setShowNavMenu(false)
    
    if (item.path === '/parent/child-progress' && hasNewNotifications) {
      markNotificationsAsSeen()
    }
    
    setTimeout(() => {
      router.push(item.path)
    }, 100)
  }

  const handleNavigateToUnlocks = () => {
    markNotificationsAsSeen()
    router.push('/parent/child-progress')
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    const familyName = familyData?.familyName || 'Family'
    
    if (hour < 12) return `Good morning!`
    if (hour < 17) return `Good afternoon!`
    if (hour < 21) return `Good evening!`
    return `Good evening!`
  }

  // Get unique achievements (1 per child) and rest
  const getFilteredAchievements = () => {
    const studentAchievements = {}
    const otherAchievements = []
    
    recentAchievements.forEach(achievement => {
      const studentId = achievement.studentId
      if (!studentAchievements[studentId]) {
        studentAchievements[studentId] = achievement
      } else {
        otherAchievements.push(achievement)
      }
    })
    
    return {
      displayed: Object.values(studentAchievements),
      hidden: otherAchievements
    }
  }

  // Show loading
  if (authLoading || loading || !userProfile) {
    return (
      <div style={{
        background: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${luxTheme.primary}30`,
            borderTop: `3px solid ${luxTheme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: luxTheme.textPrimary }}>Loading your family dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
          <h2 style={{ color: luxTheme.textPrimary, marginBottom: '1rem' }}>Oops!</h2>
          <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const { displayed: displayedAchievements, hidden: hiddenAchievements } = getFilteredAchievements()
  const isMobile = windowWidth <= 480

  return (
    <>
      <Head>
        <title>Family Dashboard - Lux Libris</title>
        <meta name="description" content="Track your family's reading progress, approve quiz codes, and celebrate achievements together" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        background: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '80px',
        position: 'relative'
      }}>
        {/* Time-based overlay */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: luxTheme.timeOverlay,
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* Header */}
        <div style={{
          background: timeTheme.gradient,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: '400',
            color: luxTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center'
          }}>
            Family Dashboard
          </h1>

          {/* Hamburger Menu */}
          <div className="nav-menu-container" style={{ position: 'absolute', right: '20px' }}>
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                color: luxTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ☰
            </button>

            {/* Dropdown Menu */}
            {showNavMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: luxTheme.surface,
                borderRadius: '12px',
                minWidth: '200px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${luxTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999,
                animation: 'slideInDown 0.3s ease-out'
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleNavigation(item)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${luxTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${luxTheme.primary}40` : 'none',
                      cursor: item.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      position: 'relative',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = `${luxTheme.primary}20`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.name}</span>
                    
                    {/* Notification badge */}
                    {item.badge && (
                      <div style={{
                        backgroundColor: item.badgeColor,
                        color: 'white',
                        borderRadius: '10px',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {item.badge}
                      </div>
                    )}
                    
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: luxTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
                
                {/* Notification Settings */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: `1px solid ${luxTheme.primary}40`,
                  backgroundColor: `${luxTheme.primary}10`
                }}>
                  <button
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      await requestNotificationPermission()
                      setShowNavMenu(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: notificationsEnabled ? `${luxTheme.primary}30` : luxTheme.surface,
                      border: `2px solid ${notificationsEnabled ? luxTheme.primary : luxTheme.textSecondary}60`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: luxTheme.textPrimary,
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <span>{notificationsEnabled ? '🔔' : '🔕'}</span>
                    <span>{notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '20px', position: 'relative', zIndex: 10 }}>
          {/* Welcome Section */}
          <div style={{
            background: timeTheme.gradient,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: `0 8px 24px rgba(0,0,0,0.15), 0 0 40px ${luxTheme.timeGlow}30`,
            marginBottom: '16px',
            color: 'white',
            position: 'relative',
            animation: 'slideInDown 0.8s ease-out'
          }}>
            <h2 style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              margin: '0 0 8px 0'
            }}>
              {getTimeBasedGreeting()}
            </h2>

            {/* Phase Status */}
            {phaseData && !phaseData.loading && (
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: phaseData.currentPhase === 'ACTIVE' || phaseData.currentPhase === 'VOTING' ? 'slideInUp 0.6s ease-out 0.3s both' : 'none'
              }}>
                <span style={{ 
                  fontSize: '20px',
                  animation: phaseData.currentPhase === 'ACTIVE' ? 'bounce 2s infinite' : 'none'
                }}>
                  {phaseData.currentPhase === 'ACTIVE' ? '🏆' : getPhaseInfo().icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 'clamp(12px, 3.5vw, 14px)', 
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {phaseData.currentPhase === 'ACTIVE' && daysUntilEnd > 0 
                      ? `Lux Libris Award ends in ${daysUntilEnd} days!`
                      : phaseData.currentPhase === 'VOTING' && daysUntilEnd > 0
                      ? `Voting ends in ${daysUntilEnd} days!`
                      : getPhaseInfo().name
                    }
                  </div>
                  {phaseData.currentPhase === 'ACTIVE' && daysUntilEnd > 0 && (
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      opacity: 0.9
                    }}>
                      March 31st • Then voting begins for the Luminous Champion!
                    </div>
                  )}
                  {phaseData.currentPhase === 'VOTING' && daysUntilEnd > 0 && (
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      opacity: 0.9
                    }}>
                      April 14th • Help your children choose their favorites!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pending Unlock Requests */}
          {(pendingQuizApprovals.length > 0 || pendingLeaderboardApprovals.length > 0) && (
            <div style={{
              backgroundColor: '#FEF3CD',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              border: '2px solid #F59E0B60',
              animation: 'pulseGlow 2s ease-in-out infinite'
            }}>
              <h3 style={{
                fontSize: 'clamp(16px, 4vw, 18px)',
                fontWeight: '600',
                color: '#92400E',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔓 Unlock Requests Pending
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Quiz Approvals */}
                {pendingQuizApprovals.map((approval, index) => (
                  <div 
                    key={`quiz-${approval.bookId}-${approval.studentId}`}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: '1px solid #F59E0B40',
                      animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {approval.studentName.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        fontWeight: '600',
                        color: '#92400E',
                        marginBottom: '4px'
                      }}>
                        {approval.studentName} wants to take a quiz
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        color: '#A16207',
                        wordBreak: 'break-word'
                      }}>
                        &quot;{approval.bookTitle}&quot;
                      </div>
                    </div>
                    <button
                      onClick={() => handleApproveQuiz(approval)}
                      style={{
                        backgroundColor: '#F59E0B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: '44px',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#DC2626'
                        e.target.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#F59E0B'
                        e.target.style.transform = 'scale(1)'
                      }}
                    >
                      Approve
                    </button>
                  </div>
                ))}
                
                {/* Leaderboard Approvals */}
                {pendingLeaderboardApprovals.map((approval, index) => (
                  <div 
                    key={`leaderboard-${approval.studentId}`}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: '1px solid #F59E0B40',
                      animation: `slideInLeft 0.5s ease-out ${(pendingQuizApprovals.length + index) * 0.1}s both`,
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {approval.studentName.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        fontWeight: '600',
                        color: '#92400E',
                        marginBottom: '4px'
                      }}>
                        {approval.studentName} wants leaderboard access
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        color: '#A16207'
                      }}>
                        See class rankings and compete with friends
                      </div>
                    </div>
                    <button
                      onClick={() => handleApproveLeaderboard(approval)}
                      style={{
                        backgroundColor: '#F59E0B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: '44px',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#DC2626'
                        e.target.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#F59E0B'
                        e.target.style.transform = 'scale(1)'
                      }}
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Family Members Section - REDESIGNED */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '0',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${luxTheme.primary}30`,
            animation: 'slideInUp 0.8s ease-out 0.4s both',
            overflow: 'hidden'
          }}>
            {/* Family Header */}
            <div style={{
              background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.accent})`,
              padding: '16px 20px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <h3 style={{
                fontSize: 'clamp(18px, 4.5vw, 20px)',
                fontWeight: 'bold',
                color: 'white',
                margin: '0',
                fontFamily: 'Didot, serif',
                letterSpacing: '1px',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {familyData?.familyName || 'Your Family'}
              </h3>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '20px'
              }}>
                👨‍👩‍👧‍👦
              </div>
            </div>
            
            <div style={{ padding: '20px', display: 'grid', gap: '16px' }}>
              {/* Combined family members display */}
              <div style={{
                textAlign: 'center',
                padding: '12px',
                backgroundColor: `${luxTheme.primary}10`,
                borderRadius: '12px',
                marginBottom: '8px'
              }}>
                <p style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: luxTheme.textPrimary,
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  Your family is made up of {familyParents.find(p => p.isCurrentUser) ? 'you' : 'parents'}
                  {familyParents.length > 1 && `, ${familyParents.filter(p => !p.isCurrentUser).map(p => p.firstName).join(' & ')}`}
                  {linkedStudents.length > 0 && ` and ${linkedStudents.map(s => s.firstName).join(linkedStudents.length === 2 ? ' and ' : ', ')}`}
                </p>
              </div>
              
              {/* Parents Grid */}
              {familyParents.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: familyParents.length > 1 && windowWidth > 400 ? 'repeat(2, 1fr)' : '1fr',
                  gap: '12px'
                }}>
                  {familyParents.map((parent) => (
                    <div 
                      key={parent.id}
                      style={{
                        backgroundColor: `${luxTheme.secondary}15`,
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        border: parent.isCurrentUser 
                          ? `2px solid ${luxTheme.secondary}` 
                          : `1px solid ${luxTheme.secondary}40`,
                        transition: 'all 0.3s ease',
                        animation: 'fadeIn 0.5s ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${luxTheme.secondary}, ${luxTheme.primary})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}>
                        {parent.firstName?.charAt(0) || 'P'}
                      </div>
                      <div style={{
                        fontSize: 'clamp(14px, 4vw, 16px)',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        marginBottom: '4px'
                      }}>
                        {parent.firstName} {parent.lastName}
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        color: luxTheme.textSecondary
                      }}>
                        {parent.isCurrentUser ? 'You' : 'Parent'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Children - Responsive Grid */}
              {linkedStudents.length > 0 && (
                <div style={{
                  backgroundColor: `${luxTheme.primary}05`,
                  borderRadius: '12px',
                  padding: '16px',
                  border: `1px solid ${luxTheme.primary}20`
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: linkedStudents.length > 1 && !isMobile ? 'repeat(2, 1fr)' : '1fr',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    {linkedStudents.map((student, index) => {
                      const childColor = getChildColor(student.firstName, student.id)
                      const readingBooks = getStudentReadingBooks(student)
                      const hasStarted = hasStudentStartedReading(student)
                      const suggestion = dailySuggestions[student.id]
                      const adviceText = dailyAdvice[student.id]
                      
                      return (
                        <div
                          key={student.id}
                          style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '16px',
                            border: `2px solid ${childColor}40`,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`,
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onClick={() => router.push('/parent/child-progress')}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.boxShadow = `0 8px 20px ${childColor}30`
                            e.currentTarget.style.borderColor = childColor
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.borderColor = `${childColor}40`
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '60px',
                            height: '60px',
                            background: `linear-gradient(135deg, ${childColor}20, transparent)`,
                            borderRadius: '0 12px 0 100%'
                          }} />
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${childColor}, ${childColor}CC)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                              fontWeight: 'bold',
                              color: '#FFFFFF',
                              flexShrink: 0,
                              boxShadow: `0 4px 12px ${childColor}50`
                            }}>
                              {student.firstName?.charAt(0) || '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: 'clamp(14px, 4vw, 16px)',
                                fontWeight: '600',
                                color: luxTheme.textPrimary,
                                marginBottom: '2px'
                              }}>
                                {student.firstName} {student.lastInitial}.
                              </div>
                              <div style={{
                                fontSize: 'clamp(10px, 3vw, 12px)',
                                color: luxTheme.textSecondary
                              }}>
                                Grade {student.grade}
                              </div>
                            </div>
                          </div>
                          
                          <div style={{
                            fontSize: 'clamp(11px, 3vw, 13px)',
                            color: luxTheme.textPrimary,
                            textAlign: 'center',
                            padding: '10px',
                            backgroundColor: `${childColor}10`,
                            borderRadius: '8px',
                            marginBottom: '8px',
                            minHeight: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{ width: '100%' }}>
                              {hasStarted ? (
                                readingBooks.length > 0 ? (
                                  <div>
                                    📖 <strong>{readingBooks.length}</strong> book{readingBooks.length > 1 ? 's' : ''} in progress
                                    {adviceText && (
                                      <div style={{
                                        marginTop: '6px',
                                        fontSize: 'clamp(9px, 2.5vw, 11px)',
                                        fontStyle: 'italic',
                                        color: childColor,
                                        opacity: 0.9,
                                        lineHeight: '1.4'
                                      }}>
                                        💡 {adviceText}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    ✅ <strong>{student.booksSubmittedThisYear || 0}</strong> books completed
                                  </div>
                                )
                              ) : (
                                <div>
                                  📚 Ready to start reading!
                                  {suggestion && (
                                    <div style={{
                                      marginTop: '8px',
                                      fontSize: 'clamp(10px, 2.8vw, 12px)',
                                      fontStyle: 'italic',
                                      color: childColor,
                                      wordWrap: 'break-word'
                                    }}>
                                      Try: &quot;{suggestion.title}&quot;
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 'clamp(9px, 2.5vw, 11px)',
                            color: luxTheme.textSecondary
                          }}>
                            <span>📚 {student.booksSubmittedThisYear || 0} read</span>
                            <span>🎯 {student.personalGoal || 20} goal</span>
                          </div>
                          
                          {/* Sparkle decoration for new readers */}
                          {!hasStarted && (
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              fontSize: '16px',
                              animation: 'sparkle 1.5s ease-in-out infinite'
                            }}>
                              ✨
                            </div>
                          )}
                          
                          {/* Achievement star for active readers */}
                          {hasStarted && (student.booksSubmittedThisYear || 0) > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              fontSize: '16px',
                              animation: 'pulseGlow 2s ease-in-out infinite'
                            }}>
                              ⭐
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Shared Book Recommendation */}
                  {(() => {
                    // Find books neither child has read
                    const allReadBookIds = linkedStudents.flatMap(s => 
                      (s.bookshelf || []).map(b => b.bookId)
                    )
                    const uniqueReadBookIds = [...new Set(allReadBookIds)]
                    const unreadByAll = nominees.filter(n => !uniqueReadBookIds.includes(n.id))
                    
                    if (unreadByAll.length > 0) {
                      // Get today's recommendation based on date
                      const today = new Date().toDateString()
                      let hash = 0
                      for (let i = 0; i < today.length; i++) {
                        hash = ((hash << 5) - hash + today.charCodeAt(i)) & 0xffffffff
                      }
                      const recommendedBook = unreadByAll[Math.abs(hash) % unreadByAll.length]
                      
                      return (
                        <div style={{
                          background: 'linear-gradient(135deg, #FFF9E6, #FFE4B5)',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '2px solid #F59E0B',
                          position: 'relative',
                          overflow: 'hidden',
                          animation: 'slideInUp 0.8s ease-out 0.8s both',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                        }}>
                          {/* Animated background pattern */}
                          <div style={{
                            position: 'absolute',
                            top: '-50%',
                            right: '-50%',
                            width: '200%',
                            height: '200%',
                            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(245, 158, 11, 0.05) 10px, rgba(245, 158, 11, 0.05) 20px)',
                            animation: 'slideBackground 20s linear infinite',
                            pointerEvents: 'none'
                          }} />
                          
                          <div style={{
                            fontSize: 'clamp(12px, 3.5vw, 14px)',
                            fontWeight: '600',
                            color: '#92400E',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            position: 'relative'
                          }}>
                            <span style={{ animation: 'bounce 2s infinite' }}>✨</span>
                            Perfect Lux Book for {linkedStudents.length > 1 ? 'Both Kids' : 'Your Child'}!
                            <span style={{ animation: 'bounce 2s infinite 0.5s' }}>✨</span>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            position: 'relative'
                          }}>
                            {recommendedBook.coverImageUrl && (
                              <div style={{
                                position: 'relative',
                                animation: 'floatBook 3s ease-in-out infinite'
                              }}>
                                <img 
                                  src={recommendedBook.coverImageUrl}
                                  alt={recommendedBook.title}
                                  style={{
                                    width: '60px',
                                    height: '90px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                                  }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  top: '-8px',
                                  right: '-8px',
                                  backgroundColor: '#DC2626',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.5)',
                                  animation: 'pulseGlow 2s ease-in-out infinite'
                                }}>
                                  NEW
                                </div>
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: 'clamp(13px, 3.8vw, 15px)',
                                fontWeight: '600',
                                color: '#92400E',
                                marginBottom: '4px'
                              }}>
                                &quot;{recommendedBook.title}&quot;
                              </div>
                              <div style={{
                                fontSize: 'clamp(10px, 3vw, 12px)',
                                color: '#A16207',
                                fontStyle: 'italic',
                                marginBottom: '8px'
                              }}>
                                by {recommendedBook.authors}
                              </div>
                              {recommendedBook.themes && recommendedBook.themes[0] && (
                                <div style={{
                                  fontSize: 'clamp(10px, 2.8vw, 12px)',
                                  color: '#92400E',
                                  backgroundColor: '#FEF3CD',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  border: '1px solid #F59E0B'
                                }}>
                                  📌 Theme: {recommendedBook.themes[0]}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {recommendedBook.discussionQuestions && recommendedBook.discussionQuestions[0] && (
                            <div style={{
                              marginTop: '12px',
                              padding: '8px',
                              backgroundColor: '#FFFFFF',
                              borderRadius: '8px',
                              fontSize: 'clamp(10px, 2.8vw, 12px)',
                              color: '#7C2D12',
                              fontStyle: 'italic',
                              border: '1px dashed #F59E0B',
                              position: 'relative'
                            }}>
                              <span style={{
                                position: 'absolute',
                                top: '-10px',
                                left: '10px',
                                backgroundColor: '#FFF9E6',
                                padding: '0 4px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                color: '#92400E'
                              }}>
                                ASK YOUR KIDS
                              </span>
                              💬 &quot;{recommendedBook.discussionQuestions[0]}&quot;
                            </div>
                          )}
                          
                          <button
                            onClick={() => router.push('/parent/nominees')}
                            style={{
                              marginTop: '12px',
                              width: '100%',
                              backgroundColor: '#F59E0B',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '10px',
                              fontSize: 'clamp(11px, 3vw, 13px)',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#DC2626'
                              e.target.style.transform = 'scale(1.02)'
                              e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#F59E0B'
                              e.target.style.transform = 'scale(1)'
                              e.target.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.4)'
                            }}
                          >
                            See All Lux Book Options →
                          </button>
                        </div>
                      )
                    }
                    
                    return null
                  })()}
                  
                  {/* Parent Tip for Getting Started */}
                  {linkedStudents.some(s => !hasStudentStartedReading(s)) && (
                    <div style={{
                      marginTop: '12px',
                      backgroundColor: '#E8F5E9',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '2px solid #4CAF5040'
                    }}>
                      <div style={{
                        fontSize: 'clamp(12px, 3.5vw, 14px)',
                        fontWeight: '600',
                        color: '#2E7D32',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        💚 Parent Tip: Starting Your Lux Journey
                      </div>
                      <div style={{
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        color: '#388E3C',
                        lineHeight: '1.5'
                      }}>
                        Visit the library together and look for books from the Lux Libris list. Let your child browse all 20 nominees 
                        and pick the one that excites them most!
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Weekly Tips & Facts Section - MOVED FROM DNA LAB */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${luxTheme.primary}20`,
            animation: 'slideInUp 0.8s ease-out 0.6s both'
          }}>
            <h3 style={{
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 20px 0',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span>✨</span> This Week&apos;s Reading Wisdom <span>✨</span>
            </h3>

            {/* Weekly Strategy Card */}
            <div 
              style={{
                backgroundColor: expandedTip === 'strategy' ? `${categoryColors[weeklyContent.strategy.category]}10` : `${luxTheme.primary}05`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                border: `1px solid ${expandedTip === 'strategy' ? categoryColors[weeklyContent.strategy.category] : luxTheme.primary}30`,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setExpandedTip(expandedTip === 'strategy' ? null : 'strategy')}
              onMouseOver={(e) => {
                if (expandedTip !== 'strategy') {
                  e.currentTarget.style.backgroundColor = `${categoryColors[weeklyContent.strategy.category]}10`;
                  e.currentTarget.style.borderColor = `${categoryColors[weeklyContent.strategy.category]}60`;
                }
              }}
              onMouseOut={(e) => {
                if (expandedTip !== 'strategy') {
                  e.currentTarget.style.backgroundColor = `${luxTheme.primary}05`;
                  e.currentTarget.style.borderColor = `${luxTheme.primary}30`;
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  💡
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Weekly Strategy
                    </div>
                    <div style={{
                      backgroundColor: categoryColors[weeklyContent.strategy.category],
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      whiteSpace: 'nowrap'
                    }}>
                      {weeklyContent.strategy.category}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: expandedTip === 'strategy' ? '12px' : '0'
                  }}>
                    {weeklyContent.strategy.title}
                  </div>
                  {expandedTip === 'strategy' && (
                    <div style={{
                      fontSize: '14px',
                      color: luxTheme.textSecondary,
                      lineHeight: '1.6',
                      animation: 'fadeIn 0.3s ease-out'
                    }}>
                      {weeklyContent.strategy.content}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: luxTheme.textSecondary,
                  transform: expandedTip === 'strategy' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▼
                </div>
              </div>
            </div>

            {/* Weekly Fact Card */}
            <div 
              style={{
                backgroundColor: expandedTip === 'fact' ? `${categoryColors[weeklyContent.fact.category]}10` : `${luxTheme.secondary}05`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                border: `1px solid ${expandedTip === 'fact' ? categoryColors[weeklyContent.fact.category] : luxTheme.secondary}30`,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setExpandedTip(expandedTip === 'fact' ? null : 'fact')}
              onMouseOver={(e) => {
                if (expandedTip !== 'fact') {
                  e.currentTarget.style.backgroundColor = `${categoryColors[weeklyContent.fact.category]}10`;
                  e.currentTarget.style.borderColor = `${categoryColors[weeklyContent.fact.category]}60`;
                }
              }}
              onMouseOut={(e) => {
                if (expandedTip !== 'fact') {
                  e.currentTarget.style.backgroundColor = `${luxTheme.secondary}05`;
                  e.currentTarget.style.borderColor = `${luxTheme.secondary}30`;
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: '12px'
              }}>
                <div style={{
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  🤯
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Mind-Blowing Fact
                    </div>
                    <div style={{
                      backgroundColor: categoryColors[weeklyContent.fact.category],
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      whiteSpace: 'nowrap'
                    }}>
                      {weeklyContent.fact.category}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: expandedTip === 'fact' ? '12px' : '0'
                  }}>
                    {weeklyContent.fact.title}
                  </div>
                  {expandedTip === 'fact' && (
                    <div style={{
                      fontSize: '14px',
                      color: luxTheme.textSecondary,
                      lineHeight: '1.6',
                      animation: 'fadeIn 0.3s ease-out'
                    }}>
                      {weeklyContent.fact.fact}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: luxTheme.textSecondary,
                  transform: expandedTip === 'fact' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▼
                </div>
              </div>
            </div>

            {/* Bottom Line Button */}
            <div style={{
              textAlign: 'center',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setShowBottomLine(true)}
                style={{
                  backgroundColor: luxTheme.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transform: 'translateY(0)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
              >
                <span>🌟</span>
                <span>Why Reading Matters</span>
              </button>
            </div>
          </div>

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '100px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${luxTheme.primary}30`,
              animation: 'slideInUp 0.8s ease-out 0.8s both'
            }}>
              <h3 style={{
                fontSize: 'clamp(16px, 4vw, 18px)',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎉 Recent Achievements
              </h3>
              
              {/* Display only 1 achievement per child */}
              {displayedAchievements.map((achievement, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: `${luxTheme.primary}10`,
                    borderRadius: '8px',
                    marginBottom: index < displayedAchievements.length - 1 ? '8px' : '0',
                    animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: luxTheme.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                    animation: 'pulseGlow 2s ease-in-out infinite'
                  }}>
                    {achievement.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '2px'
                    }}>
                      {achievement.type === 'saint_unlock' ? 
                        `${achievement.studentName} unlocked ${achievement.saintName}!` :
                        `${achievement.studentName} completed "${achievement.bookTitle}"!`
                      }
                    </div>
                    <div style={{
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      color: luxTheme.textSecondary
                    }}>
                      {achievement.type === 'saint_unlock' ? 
                        new Date(achievement.unlockedAt).toLocaleDateString() :
                        new Date(achievement.completedAt).toLocaleDateString()
                      }
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Show more button if there are hidden achievements */}
              {hiddenAchievements.length > 0 && (
                <>
                  <button
                    onClick={() => setShowAllAchievements(!showAllAchievements)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginTop: '12px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${luxTheme.primary}40`,
                      borderRadius: '8px',
                      color: luxTheme.primary,
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${luxTheme.primary}10`
                      e.currentTarget.style.borderColor = luxTheme.primary
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = `${luxTheme.primary}40`
                    }}
                  >
                    <span>{showAllAchievements ? 'Show Less' : `Show ${hiddenAchievements.length} More`}</span>
                    <span style={{
                      transform: showAllAchievements ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '14px'
                    }}>
                      ▼
                    </span>
                  </button>
                  
                  {/* Hidden achievements */}
                  {showAllAchievements && (
                    <div style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: `1px solid ${luxTheme.primary}20`
                    }}>
                      {hiddenAchievements.map((achievement, index) => (
                        <div 
                          key={`hidden-${index}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            backgroundColor: `${luxTheme.primary}05`,
                            borderRadius: '8px',
                            marginBottom: index < hiddenAchievements.length - 1 ? '8px' : '0',
                            animation: `slideInLeft 0.3s ease-out ${index * 0.05}s both`
                          }}
                        >
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: `${luxTheme.primary}80`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            flexShrink: 0
                          }}>
                            {achievement.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 'clamp(12px, 3.5vw, 14px)',
                              fontWeight: '600',
                              color: luxTheme.textPrimary,
                              marginBottom: '2px'
                            }}>
                              {achievement.type === 'saint_unlock' ? 
                                `${achievement.studentName} unlocked ${achievement.saintName}!` :
                                `${achievement.studentName} completed "${achievement.bookTitle}"!`
                              }
                            </div>
                            <div style={{
                              fontSize: 'clamp(10px, 3vw, 12px)',
                              color: luxTheme.textSecondary
                            }}>
                              {achievement.type === 'saint_unlock' ? 
                                new Date(achievement.unlockedAt).toLocaleDateString() :
                                new Date(achievement.completedAt).toLocaleDateString()
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Line Modal */}
        {showBottomLine && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              maxWidth: '400px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px',
                animation: 'bounce 1s ease-out'
              }}>
                🌟
              </div>
              
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                margin: '0 0 16px 0',
                fontFamily: 'Didot, serif'
              }}>
                Why Reading Matters
              </h3>
              
              <p style={{
                fontSize: '16px',
                color: luxTheme.textSecondary,
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>
                {weeklyContent.bottomLine}
              </p>
              
              <button
                onClick={() => setShowBottomLine(false)}
                style={{
                  backgroundColor: luxTheme.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                Let&apos;s Build Readers! 📚
              </button>
            </div>
          </div>
        )}

        {/* Notification Prompt Modal */}
        {showNotificationPrompt && !notificationsEnabled && (
          <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '20px',
            right: '20px',
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            border: `2px solid ${luxTheme.primary}`,
            zIndex: 1000,
            maxWidth: '400px',
            margin: '0 auto',
            animation: 'slideInUp 0.5s ease-out'
          }}>
            <button
              onClick={() => setShowNotificationPrompt(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: luxTheme.textSecondary
              }}
            >
              ×
            </button>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '12px',
                animation: 'bounce 2s infinite'
              }}>🔔</div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px'
              }}>
                Enable Notifications?
              </h3>
              <p style={{
                fontSize: '14px',
                color: luxTheme.textSecondary,
                marginBottom: '16px',
                lineHeight: '1.4'
              }}>
                Get notified when your children need quiz approvals or unlock achievements!
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowNotificationPrompt(false)}
                  style={{
                    flex: 1,
                    backgroundColor: luxTheme.background,
                    color: luxTheme.textSecondary,
                    border: `1px solid ${luxTheme.primary}40`,
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = luxTheme.surface}
                  onMouseLeave={(e) => e.target.style.backgroundColor = luxTheme.background}
                >
                  Not Now
                </button>
                <button
                  onClick={async () => {
                    await requestNotificationPermission()
                    setShowNotificationPrompt(false)
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = luxTheme.accent
                    e.target.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = luxTheme.primary
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  Enable
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Real-time notification toasts */}
        <NotificationToastContainer
          toasts={toastQueue}
          onRemoveToast={removeToast}
          onNavigateToUnlocks={handleNavigateToUnlocks}
          theme={luxTheme}
        />

        {/* Bottom Navigation Bar */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: luxTheme.surface,
          borderTop: `1px solid ${luxTheme.primary}30`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          zIndex: 999
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '8px 0',
            maxWidth: '100%',
            margin: '0 auto'
          }}>
            {bottomNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  if (!item.current) {
                    if (item.path === '/parent/child-progress' && hasNewNotifications) {
                      markNotificationsAsSeen()
                    }
                    router.push(item.path)
                  }
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '8px',
                  minWidth: '60px',
                  flex: '1 0 auto',
                  cursor: item.current ? 'default' : 'pointer',
                  color: item.current ? luxTheme.primary : luxTheme.textSecondary,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (!item.current) {
                    e.currentTarget.style.color = luxTheme.primary
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.current) {
                    e.currentTarget.style.color = luxTheme.textSecondary
                  }
                }}
              >
                <div style={{ position: 'relative' }}>
                  <span style={{
                    fontSize: '18px',
                    transform: item.current ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                    display: 'block'
                  }}>
                    {item.icon}
                  </span>
                  
                  {/* Notification badge */}
                  {item.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: item.badgeColor,
                      color: 'white',
                      borderRadius: '10px',
                      minWidth: '14px',
                      height: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: 'bold',
                      border: '1.5px solid white',
                      animation: 'pulseGlow 2s ease-in-out infinite'
                    }}>
                      {item.badge}
                    </div>
                  )}
                </div>
                
                <span style={{
                  fontSize: '9px',
                  fontWeight: item.current ? '600' : '500',
                  whiteSpace: 'nowrap'
                }}>
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Coming Soon Message */}
        {showComingSoon && (
          <div style={{
            position: 'fixed',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: luxTheme.primary,
            color: luxTheme.textPrimary,
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1001,
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            fontWeight: '600',
            maxWidth: '90vw',
            textAlign: 'center',
            animation: 'slideInUp 0.3s ease-out'
          }}>
            {showComingSoon}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes slideInUp {
            from { 
              opacity: 0; 
              transform: translateY(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes slideInDown {
            from { 
              opacity: 0; 
              transform: translateY(-30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes slideInLeft {
            from { 
              opacity: 0; 
              transform: translateX(-30px); 
            }
            to { 
              opacity: 1; 
              transform: translateX(0); 
            }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-8px);
            }
            60% {
              transform: translateY(-4px);
            }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes pulseGlow {
            0%, 100% {
              opacity: 1;
              filter: brightness(1);
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              filter: brightness(1.2);
              transform: scale(1.05);
            }
          }
          
          @keyframes sparkle {
            0%, 100% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
            25% {
              opacity: 0.7;
              transform: scale(1.2) rotate(90deg);
            }
            50% {
              opacity: 0.4;
              transform: scale(0.8) rotate(180deg);
            }
            75% {
              opacity: 0.7;
              transform: scale(1.1) rotate(270deg);
            }
          }
          
          @keyframes floatBook {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          @keyframes slideBackground {
            from {
              transform: translate(0, 0);
            }
            to {
              transform: translate(-50px, -50px);
            }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            touch-action: manipulation;
          }
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          @media (max-width: 768px) {
            .nav-menu-container > div {
              right: 10px !important;
              minWidth: 180px !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}