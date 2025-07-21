// pages/admin/dashboard.js - Enhanced with Books, Nominee Quizzes Management & Academic Year System - COMPLETE
import { useState, useEffect } from 'react'
import Head from 'next/head'
import saintsManager from '../../enhanced-saints-manager'
import quizzesManager from '../../enhanced-quizzes-manager'
import programsSetup from '../../setup-programs'
import booksManager from '../../enhanced-books-manager'
import bookQuizzesManager from '../../book-quizzes-manager'
import nomineeQuizzesManager from '../../nominee-quizzes-manager' // NEW IMPORT

export default function EnhancedAdminDashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // Dashboard State
  const [activeSection, setActiveSection] = useState('books')
  const [activeTab, setActiveTab] = useState('books-current-year')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Statistics state
  const [saintsStats, setSaintsStats] = useState(null)
  const [quizzesStats, setQuizzesStats] = useState(null)
  const [programsStats, setProgramsStats] = useState(null)
  const [booksStats, setBooksStats] = useState(null)
  const [bookQuizzesStats, setBookQuizzesStats] = useState(null)
  const [nomineeQuizzesStats, setNomineeQuizzesStats] = useState(null) // NEW STATE
  
  // Form states
  const [newSaintForm, setNewSaintForm] = useState({
    name: '',
    patronage: '',
    feast_day: '',
    short_blurb: '',
    extra_fact: '',
    rarity: 'common',
    unlockCondition: 'streak_7_days',
    luxlings_series: 'Super Sancti'
  })
  
  const [newBookForm, setNewBookForm] = useState({
    title: '',
    author: '',
    coverImage: '',
    totalPages: '',
    isAudiobook: false,
    totalMinutes: '',
    platforms: '',
    academicYear: '2025-26',
    status: 'active'
  })
  
  const [newSaintsQuizForm, setNewSaintsQuizForm] = useState({
    quiz_id: '',
    title: '',
    description: '',
    series: 'Halo Hatchlings',
    target_grades: [4, 5, 6, 7, 8],
    questions: [],
    results: {}
  })
  
  const [newLuxDnaQuizForm, setNewLuxDnaQuizForm] = useState({
    quiz_id: '',
    title: '',
    description: '',
    target_grades: [4, 5, 6, 7, 8],
    questions: [],
    results: {}
  })

  const [newBookQuizForm, setNewBookQuizForm] = useState({
    book_id: '',
    title: '',
    description: '',
    target_grades: [4, 5, 6, 7, 8],
    questions: [],
    results: {}
  })

  // NEW FORM STATE FOR NOMINEE QUIZZES
  const [newNomineeQuizForm, setNewNomineeQuizForm] = useState({
    id: '',
    title: '',
    description: '',
    academic_year: '2025-26',
    quiz_type: 'personality',
    target_grades: [4, 5, 6, 7, 8],
    status: 'active',
    questions: [],
    results: []
  })

  // Session timeout and authentication logic
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  useEffect(() => {
    const savedSession = localStorage.getItem('adminDashboardSession')
    if (savedSession) {
      const sessionData = JSON.parse(savedSession)
      const now = Date.now()
      const timePassed = now - sessionData.lastActivity
      
      if (timePassed < SESSION_TIMEOUT) {
        setIsAuthenticated(true)
        setLastActivity(sessionData.lastActivity)
        loadAllStats()
      } else {
        localStorage.removeItem('adminDashboardSession')
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('adminDashboardSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('adminDashboardSession')
    }
  }, [isAuthenticated, lastActivity])

  useEffect(() => {
    if (!isAuthenticated) return

    const checkSession = () => {
      const now = Date.now()
      const timeRemaining = SESSION_TIMEOUT - (now - lastActivity)
      const minutesRemaining = Math.max(0, Math.round(timeRemaining / 60000))
      
      setSessionTimeRemaining(minutesRemaining)
      
      if (timeRemaining <= 0) {
        alert('Session expired after 2 hours. Please sign in again.')
        handleLogout()
        return
      }
    }

    const interval = setInterval(checkSession, 60000)
    checkSession()
    
    return () => clearInterval(interval)
  }, [isAuthenticated, lastActivity])

  useEffect(() => {
    if (!isAuthenticated) return

    const updateActivity = () => {
      const newActivity = Date.now()
      setLastActivity(newActivity)
      localStorage.setItem('adminDashboardSession', JSON.stringify({
        authenticated: true,
        lastActivity: newActivity
      }))
    }
    
    const events = ['click', 'keypress', 'scroll', 'mousemove']
    events.forEach(event => 
      document.addEventListener(event, updateActivity, true)
    )

    return () => {
      events.forEach(event => 
        document.removeEventListener(event, updateActivity, true)
      )
    }
  }, [isAuthenticated])

  const handleLogin = () => {
    if (password === 'LUXLIBRIS-GOD-2025') {
      const now = Date.now()
      setIsAuthenticated(true)
      setLastActivity(now)
      localStorage.setItem('adminDashboardSession', JSON.stringify({
        authenticated: true,
        lastActivity: now
      }))
      loadAllStats()
    } else {
      alert('Invalid admin password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('adminDashboardSession')
    setLastActivity(Date.now())
    setSaintsStats(null)
    setQuizzesStats(null)
    setProgramsStats(null)
    setBooksStats(null)
    setBookQuizzesStats(null)
    setNomineeQuizzesStats(null) // RESET NOMINEE QUIZZES STATS
    setLogs([])
    setResult(null)
  }

  // UPDATED: Load all stats including nominee quizzes
  const loadAllStats = async () => {
    try {
      const [saints, saintsQuizzes, luxDnaQuizzes, books, bookQuizzes, nomineeQuizzes] = await Promise.all([
        saintsManager.getSaintsStats(),
        quizzesManager.getQuizzesStats('saints'),
        quizzesManager.getQuizzesStats('books'),
        booksManager.getBooksStats(),
        bookQuizzesManager.getBookQuizzesStats(),
        nomineeQuizzesManager.getNomineeQuizzesStats() // NEW STATS CALL
      ])
      
      setSaintsStats(saints)
      setQuizzesStats({ saints: saintsQuizzes, luxDna: luxDnaQuizzes })
      setBooksStats(books)
      setBookQuizzesStats(bookQuizzes)
      setNomineeQuizzesStats(nomineeQuizzes) // SET NOMINEE QUIZZES STATS
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Lux Libris Admin - Authentication Required</title>
        </Head>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #581c87 75%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            textAlign: 'center',
            minWidth: '400px'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #7c3aed, #059669, #dc2626, #0891b2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              🎛️
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Lux Libris Admin Dashboard
            </h1>
            <p style={{
              color: '#c4b5fd',
              marginBottom: '2rem'
            }}>
              Administrator Access Required - Books, Saints, Quizzes & Programs Management
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Enter Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🚀 ACCESS ADMIN DASHBOARD
            </button>
          </div>
        </div>
      </>
    )
  }

  // Enhanced console logging system
  const originalLog = console.log
  const originalError = console.error

  const runOperation = async (operation, params = {}) => {
    setIsRunning(true)
    setResult(null)
    setLogs([])

    const capturedLogs = []
    console.log = (...args) => {
      capturedLogs.push({ type: 'log', message: args.join(' '), time: new Date().toLocaleTimeString() })
      setLogs([...capturedLogs])
      originalLog(...args)
    }
    
    console.error = (...args) => {
      capturedLogs.push({ type: 'error', message: args.join(' '), time: new Date().toLocaleTimeString() })
      setLogs([...capturedLogs])
      originalError(...args)
    }

    try {
      let setupResult
      
      switch (operation) {
        // NOMINEE QUIZZES OPERATIONS (NEW)
        case 'nominee-quizzes-setup':
          console.log('🎯 Starting nominee quizzes bulk setup...')
          setupResult = await nomineeQuizzesManager.setupAllNomineeQuizzes()
          break
          
        case 'nominee-quizzes-archive':
          console.log('📦 Archiving previous year nominee quizzes...')
          const previousNomineeYear = prompt('Enter previous academic year to archive (e.g., "2024-25"):')
          if (previousNomineeYear) {
            setupResult = await nomineeQuizzesManager.archivePreviousYearQuizzes(previousNomineeYear)
          } else {
            setupResult = { success: false, message: 'Archive cancelled - no year specified' }
          }
          break
          
        case 'nominee-quizzes-add-single':
          console.log('➕ Adding single nominee quiz...')
          const nextNomineeId = await nomineeQuizzesManager.getNextNomineeQuizId()
          const nomineeQuizData = { ...newNomineeQuizForm, id: nextNomineeId }
          setupResult = await nomineeQuizzesManager.addSingleNomineeQuiz(nomineeQuizData)
          if (setupResult.success) {
            setNewNomineeQuizForm({
              id: '',
              title: '',
              description: '',
              academic_year: '2025-26',
              quiz_type: 'personality',
              target_grades: [4, 5, 6, 7, 8],
              status: 'active',
              questions: [],
              results: []
            })
          }
          break

        // BOOK QUIZZES OPERATIONS
        case 'book-quizzes-setup':
          console.log('🎯 Starting book quizzes bulk setup...')
          setupResult = await bookQuizzesManager.setupAllBookQuizzes()
          break
          
        case 'book-quizzes-archive':
          console.log('📦 Archiving previous year book quizzes...')
          const previousQuizYear = prompt('Enter previous academic year to archive (e.g., "2024-25"):')
          if (previousQuizYear) {
            setupResult = await bookQuizzesManager.archivePreviousYearQuizzes(previousQuizYear)
          } else {
            setupResult = { success: false, message: 'Archive cancelled - no year specified' }
          }
          break
          
        case 'book-quizzes-add-single':
          console.log('➕ Adding single book quiz...')
          const bookQuizData = { ...newBookQuizForm }
          setupResult = await bookQuizzesManager.addSingleBookQuiz(bookQuizData)
          if (setupResult.success) {
            setNewBookQuizForm({
              book_id: '',
              title: '',
              description: '',
              target_grades: [4, 5, 6, 7, 8],
              questions: [],
              results: {}
            })
          }
          break

        // BOOKS OPERATIONS
        case 'books-setup-academic-year':
          console.log('🚀 Setting up status field for existing books...')
          setupResult = await booksManager.setupAcademicYearSystem()
          break
          
        case 'books-add-current-year':
          console.log('📚 Adding nominees for current academic year (2025-26)...')
          setupResult = await booksManager.addCurrentYearNominees()
          break
          
        case 'books-archive-previous':
          console.log('📦 Archiving previous year nominees...')
          const previousYear = prompt('Enter previous academic year to archive (e.g., "2024-25"):')
          if (previousYear) {
            setupResult = await booksManager.archivePreviousYear(previousYear)
          } else {
            setupResult = { success: false, message: 'Archive cancelled - no year specified' }
          }
          break
          
        case 'books-add-single':
          console.log('➕ Adding single book nominee...')
          const nextBookId = await booksManager.getNextBookIdForYear('2025-26')
          const bookData = { ...newBookForm, id: nextBookId }
          setupResult = await booksManager.addSingleBook(bookData)
          if (setupResult.success) {
            setNewBookForm({
              title: '',
              author: '',
              coverImage: '',
              totalPages: '',
              isAudiobook: false,
              totalMinutes: '',
              platforms: '',
              academicYear: '2025-26',
              status: 'active'
            })
          }
          break

        // SAINTS OPERATIONS
        case 'saints-bulk':
          console.log('🚀 Starting saints bulk setup...')
          setupResult = await saintsManager.setupAllSaints()
          break
          
        case 'saints-addNew':
          console.log('➕ Adding new saints only...')
          setupResult = await saintsManager.addNewSaintsOnly()
          break
          
        case 'saints-addSingle':
          console.log('➕ Adding single saint...')
          const nextSaintId = await saintsManager.getNextSaintId()
          const saintData = { ...newSaintForm, id: nextSaintId }
          setupResult = await saintsManager.addSingleSaint(saintData)
          if (setupResult.success) {
            setNewSaintForm({
              name: '',
              patronage: '',
              feast_day: '',
              short_blurb: '',
              extra_fact: '',
              rarity: 'common',
              unlockCondition: 'streak_7_days',
              luxlings_series: 'Super Sancti'
            })
          }
          break

        // QUIZZES OPERATIONS
        case 'quizzes-saints-bulk':
          console.log('🚀 Starting saints quizzes bulk setup...')
          setupResult = await quizzesManager.setupAllSaintsQuizzes()
          break
          
        case 'quizzes-saints-addNew':
          console.log('➕ Adding new saints quizzes only...')
          setupResult = await quizzesManager.addNewSaintsQuizzesOnly()
          break
          
        case 'quizzes-saints-addSingle':
          console.log('➕ Adding single saints quiz...')
          const nextSaintsQuizId = await quizzesManager.getNextQuizId('saints', newSaintsQuizForm.series?.toLowerCase().replace(/\s+/g, '_'))
          const saintsQuizData = { ...newSaintsQuizForm, quiz_id: nextSaintsQuizId }
          setupResult = await quizzesManager.addSingleSaintsQuiz(saintsQuizData)
          if (setupResult.success) {
            setNewSaintsQuizForm({
              quiz_id: '',
              title: '',
              description: '',
              series: 'Halo Hatchlings',
              target_grades: [4, 5, 6, 7, 8],
              questions: [],
              results: {}
            })
          }
          break

        case 'quizzes-luxdna-bulk':
          console.log('🚀 Starting Lux DNA quizzes bulk setup...')
          setupResult = await quizzesManager.setupAllBookQuizzes()
          break
          
        case 'quizzes-luxdna-addSingle':
          console.log('➕ Adding single Lux DNA quiz...')
          const nextLuxDnaQuizId = await quizzesManager.getNextQuizId('books')
          const luxDnaQuizData = { ...newLuxDnaQuizForm, quiz_id: nextLuxDnaQuizId }
          setupResult = await quizzesManager.addSingleBookQuiz(luxDnaQuizData)
          if (setupResult.success) {
            setNewLuxDnaQuizForm({
              quiz_id: '',
              title: '',
              description: '',
              target_grades: [4, 5, 6, 7, 8],
              questions: [],
              results: {}
            })
          }
          break

        // PROGRAMS OPERATIONS
        case 'programs-setup':
          console.log('🚀 Starting enhanced programs setup...')
          setupResult = await programsSetup.setupProgramsCollection()
          break
          
        default:
          throw new Error('Unknown operation: ' + operation)
      }
      
      setResult(setupResult)
      
      if (setupResult.success) {
        console.log('✅ Operation completed successfully!')
        await loadAllStats()
      } else {
        console.error('❌ Operation failed:', setupResult.message)
      }
    } catch (error) {
      console.error('❌ Error during operation:', error.message)
      setResult({ success: false, message: error.message })
    }

    console.log = originalLog
    console.error = originalError
    setIsRunning(false)
  }

  // Form handlers
  const handleSaintFormChange = (field, value) => {
    setNewSaintForm(prev => ({ ...prev, [field]: value }))
  }

  const handleBookFormChange = (field, value) => {
    setNewBookForm(prev => ({ ...prev, [field]: value }))
  }

  const handleBookQuizFormChange = (field, value) => {
    setNewBookQuizForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSaintsQuizFormChange = (field, value) => {
    setNewSaintsQuizForm(prev => ({ ...prev, [field]: value }))
  }

  const handleLuxDnaQuizFormChange = (field, value) => {
    setNewLuxDnaQuizForm(prev => ({ ...prev, [field]: value }))
  }

  // NEW FORM HANDLER FOR NOMINEE QUIZZES
  const handleNomineeQuizFormChange = (field, value) => {
    setNewNomineeQuizForm(prev => ({ ...prev, [field]: value }))
  }

  // Navigation sections - UPDATED to include nominee quizzes
  const sections = [
    { id: 'books', name: 'Books Management', icon: '📚', color: '#f59e0b' },
    { id: 'nominee-quizzes', name: 'Nominee Quizzes', icon: '🏆', color: '#f97316' }, // NEW SECTION
    { id: 'book-quizzes', name: 'Book Quizzes', icon: '🎯', color: '#8b5cf6' },
    { id: 'saints', name: 'Saints Management', icon: '👼', color: '#7c3aed' },
    { id: 'quizzes', name: 'Lux DNA Quizzes', icon: '🧩', color: '#059669' },
    { id: 'programs', name: 'Programs Management', icon: '⚙️', color: '#dc2626' },
    { id: 'analytics', name: 'Analytics & Stats', icon: '📊', color: '#0891b2' }
  ]

  // Tabs for sections - UPDATED to include nominee quiz tabs
  const getTabsForSection = (section) => {
    switch (section) {
      case 'books':
        return [
          { id: 'books-current-year', name: 'Current Year (2025-26)', icon: '📅' },
          { id: 'books-add-nominees', name: 'Add Current Year Nominees', icon: '➕' },
          { id: 'books-archive', name: 'Archive Previous Year', icon: '📦' },
          { id: 'books-add-single', name: 'Add Single Book', icon: '📖' },
          { id: 'books-setup', name: 'Setup Status Field', icon: '🚀' }
        ]
      case 'nominee-quizzes': // NEW TABS
        return [
          { id: 'nominee-quizzes-current-year', name: 'Current Year (2025-26)', icon: '📅' },
          { id: 'nominee-quizzes-setup', name: 'Setup Nominee Quizzes', icon: '🏆' },
          { id: 'nominee-quizzes-archive', name: 'Archive Previous Year', icon: '📦' },
          { id: 'nominee-quizzes-add-single', name: 'Add Single Quiz', icon: '➕' }
        ]
      case 'book-quizzes':
        return [
          { id: 'book-quizzes-current-year', name: 'Current Year (2025-26)', icon: '📅' },
          { id: 'book-quizzes-setup', name: 'Setup Book Quizzes', icon: '🎯' },
          { id: 'book-quizzes-archive', name: 'Archive Previous Year', icon: '📦' },
          { id: 'book-quizzes-add-single', name: 'Add Single Quiz', icon: '➕' }
        ]
      case 'saints':
        return [
          { id: 'saints-bulk', name: 'Bulk Setup', icon: '🏗️' },
          { id: 'saints-addNew', name: 'Add New Saints', icon: '➕' },
          { id: 'saints-addSingle', name: 'Add Single Saint', icon: '👤' }
        ]
      case 'quizzes':
        return [
          { id: 'quizzes-saints-bulk', name: 'Saints Quizzes Bulk', icon: '📿' },
          { id: 'quizzes-saints-addNew', name: 'Add New Saints Quizzes', icon: '➕' },
          { id: 'quizzes-saints-addSingle', name: 'Add Single Saints Quiz', icon: '👤' },
          { id: 'quizzes-luxdna-bulk', name: 'Lux DNA Quizzes Bulk', icon: '🧬' },
          { id: 'quizzes-luxdna-addSingle', name: 'Add Single Lux DNA Quiz', icon: '🔬' }
        ]
      case 'programs':
        return [
          { id: 'programs-setup', name: 'Setup Programs', icon: '🚀' },
          { id: 'programs-manage', name: 'Manage Programs', icon: '⚙️' }
        ]
      case 'analytics':
        return [
          { id: 'analytics-overview', name: 'Overview', icon: '📈' },
          { id: 'analytics-health', name: 'Data Health', icon: '🩺' }
        ]
      default:
        return []
    }
  }

  const handleSectionChange = (newSection) => {
    setActiveSection(newSection)
    const tabs = getTabsForSection(newSection)
    if (tabs.length > 0) {
      setActiveTab(tabs[0].id)
    }
  }

  const currentTabs = getTabsForSection(activeSection)
  const currentSectionData = sections.find(s => s.id === activeSection)

  const seriesOptions = [
    'Halo Hatchlings', 'Contemplative Cuties', 'Founder Flames', 'Pocket Patrons',
    'Super Sancti', 'Sacred Circle', 'Learning Legends', 'Culture Carriers',
    'Regal Royals', 'Heavenly Helpers', 'Desert Disciples', 'Virtue Vignettes',
    'Apostolic All-Stars', 'Mini Marians', 'Faithful Families', 'Cherub Chibis'
  ]

  // Quiz type options for nominee quizzes
  const quizTypeOptions = ['personality', 'knowledge', 'preference', 'assessment']

  return (
    <>
      <Head>
        <title>Lux Libris Enhanced Admin Dashboard</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #581c87 75%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
          
          {/* Header with Session Info */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{ flex: 1 }}></div>
              <div style={{
                width: '5rem',
                height: '5rem',
                background: 'linear-gradient(135deg, #f59e0b, #f97316, #7c3aed, #059669, #dc2626, #0891b2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem'
              }}>
                🎛️
              </div>
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: sessionTimeRemaining <= 10 
                    ? 'rgba(239, 68, 68, 0.2)' 
                    : 'rgba(124, 58, 237, 0.2)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: sessionTimeRemaining <= 10 ? '#fca5a5' : '#c4b5fd',
                  border: sessionTimeRemaining <= 10 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : '1px solid rgba(124, 58, 237, 0.3)',
                  fontWeight: '600'
                }}>
                  ⏰ {sessionTimeRemaining} min
                </div>
                
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #f87171, #ef4444)',
                    color: 'white',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
            
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 1rem',
              fontFamily: 'Georgia, serif'
            }}>
              Lux Libris Enhanced Admin Dashboard
            </h1>
            <p style={{
              color: '#c4b5fd',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Complete management for Books, Nominee Quizzes, Saints, Quizzes, Programs & Analytics
            </p>
            
            {/* Quick Stats - UPDATED to include nominee quizzes */}
            {(booksStats || saintsStats || quizzesStats || bookQuizzesStats || nomineeQuizzesStats) && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                {booksStats && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <span style={{ color: '#fbbf24', fontSize: '0.875rem', display: 'block' }}>Books (2025-26)</span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{booksStats.currentYear}</span>
                  </div>
                )}
                {nomineeQuizzesStats && (
                  <div style={{
                    background: 'rgba(249, 115, 22, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(249, 115, 22, 0.3)'
                  }}>
                    <span style={{ color: '#fb923c', fontSize: '0.875rem', display: 'block' }}>Nominee Quizzes</span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{nomineeQuizzesStats.currentYear}</span>
                  </div>
                )}
                {bookQuizzesStats && (
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}>
                    <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Book Quizzes</span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{bookQuizzesStats.currentYear}</span>
                  </div>
                )}
                {saintsStats && (
                  <div style={{
                    background: 'rgba(124, 58, 237, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(124, 58, 237, 0.3)'
                  }}>
                    <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Saints</span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{saintsStats.total}</span>
                  </div>
                )}
                {quizzesStats?.saints && (
                  <div style={{
                    background: 'rgba(5, 150, 105, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(5, 150, 105, 0.3)'
                  }}>
                    <span style={{ color: '#6ee7b7', fontSize: '0.875rem', display: 'block' }}>Saints Quizzes</span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{quizzesStats.saints.total}</span>
                  </div>
                )}
                {quizzesStats?.luxDna && (
                  <div style={{
                    background: 'rgba(220, 38, 38, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(220, 38, 38, 0.3)'
                  }}>
                    <span style={{ color: '#fca5a5', fontSize: '0.875rem', display: 'block' }}>Lux DNA Quizzes</span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{quizzesStats.luxDna.total}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section Navigation */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '2rem',
            border: '1px solid rgba(124, 58, 237, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  style={{
                    background: activeSection === section.id 
                      ? `linear-gradient(135deg, ${section.color}, ${section.color}dd)`
                      : 'rgba(75, 85, 99, 0.3)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {section.icon} {section.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-tabs for active section */}
          {currentTabs.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '1rem',
              padding: '1rem',
              marginBottom: '2rem',
              border: `1px solid ${currentSectionData?.color}40`
            }}>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {currentTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: activeTab === tab.id 
                        ? `linear-gradient(135deg, ${currentSectionData?.color}, ${currentSectionData?.color}dd)`
                        : 'rgba(75, 85, 99, 0.2)',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    {tab.icon} {tab.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '1rem',
            padding: '2rem',
            border: `1px solid ${currentSectionData?.color}40`,
            marginBottom: '2rem'
          }}>
            
            {/* BOOKS MANAGEMENT CONTENT */}
            {activeSection === 'books' && (
              <>
                {activeTab === 'books-current-year' && (
                  <div>
                    <h3 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📅 Current Academic Year: 2025-26
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      View and manage book nominees for the current academic year.
                      This shows all active nominees that schools can select from.
                    </p>
                    
                    {booksStats && (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                      }}>
                        <h4 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.25rem' }}>
                          📊 Academic Year Statistics
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div>
                            <span style={{ color: '#fcd34d', display: 'block', fontSize: '0.875rem' }}>Current Year (2025-26)</span>
                            <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.5rem' }}>{booksStats.currentYear}</span>
                          </div>
                          <div>
                            <span style={{ color: '#fcd34d', display: 'block', fontSize: '0.875rem' }}>Total Books</span>
                            <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.5rem' }}>{booksStats.total}</span>
                          </div>
                          <div>
                            <span style={{ color: '#fcd34d', display: 'block', fontSize: '0.875rem' }}>Active Books</span>
                            <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.5rem' }}>{booksStats.active}</span>
                          </div>
                          <div>
                            <span style={{ color: '#fcd34d', display: 'block', fontSize: '0.875rem' }}>Archived Books</span>
                            <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '1.5rem' }}>{booksStats.archived}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={loadAllStats}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}
                    >
                      🔄 Refresh Statistics
                    </button>
                  </div>
                )}

                {activeTab === 'books-add-nominees' && (
                  <div>
                    <h3 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      ➕ Add Current Year Nominees (2025-26)
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add new book nominees for the current academic year. 
                      Each book will be assigned the next available ID for 2025-26.
                    </p>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#10b981' }}>✅ Academic Year System:</strong>
                      <span style={{ color: '#a7f3d0' }}> Books will be added with academicYear: "2025-26" and status: "active"</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('books-add-current-year')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Adding...' : '➕ Add Current Year Nominees'}
                    </button>
                  </div>
                )}

                {activeTab === 'books-archive' && (
                  <div>
                    <h3 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📦 Archive Previous Year
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Archive nominees from a previous academic year. 
                      This marks them as "archived" status but keeps them in the database.
                    </p>
                    
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#3b82f6' }}>ℹ️ Archive Process:</strong>
                      <span style={{ color: '#93c5fd' }}> Books will be marked as archived but remain in database for historical reference.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('books-archive-previous')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #6b7280, #4b5563)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Archiving...' : '📦 Archive Previous Year'}
                    </button>
                  </div>
                )}

                {activeTab === 'books-add-single' && (
                  <div>
                    <h3 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📖 Add Single Book Nominee
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add one book nominee manually for the current academic year (2025-26).
                    </p>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Book Title *
                        </label>
                        <input
                          type="text"
                          value={newBookForm.title}
                          onChange={(e) => handleBookFormChange('title', e.target.value)}
                          placeholder="The Amazing Book Title"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Author *
                        </label>
                        <input
                          type="text"
                          value={newBookForm.author}
                          onChange={(e) => handleBookFormChange('author', e.target.value)}
                          placeholder="Jane Doe"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Total Pages
                        </label>
                        <input
                          type="number"
                          value={newBookForm.totalPages}
                          onChange={(e) => handleBookFormChange('totalPages', e.target.value)}
                          placeholder="250"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Audiobook Available
                        </label>
                        <select
                          value={newBookForm.isAudiobook}
                          onChange={(e) => handleBookFormChange('isAudiobook', e.target.value === 'true')}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        >
                          <option value={false}>No</option>
                          <option value={true}>Yes</option>
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => runOperation('books-add-single')}
                      disabled={isRunning || !newBookForm.title || !newBookForm.author}
                      style={{
                        background: (isRunning || !newBookForm.title || !newBookForm.author)
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: (isRunning || !newBookForm.title || !newBookForm.author) ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Adding...' : '📖 Add Single Book'}
                    </button>
                  </div>
                )}

                {activeTab === 'books-setup' && (
                  <div>
                    <h3 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      🚀 Setup Status Field
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add status field to existing books for archiving capability. 
                      (Academic year field already added manually)
                    </p>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      marginBottom: '2rem'
                    }}>
                      <h4 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.25rem' }}>
                        📚 What This Setup Does:
                      </h4>
                      <ul style={{ color: '#a7f3d0', lineHeight: '1.6', margin: 0, paddingLeft: '1.5rem' }}>
                        <li><strong>Adds Status Field:</strong> Sets all existing books to "active"</li>
                        <li><strong>Enables Archiving:</strong> Allows books to be archived in future years</li>
                        <li><strong>Preserves Existing Data:</strong> No existing fields are modified</li>
                        <li><strong>Academic Year Already Set:</strong> Skips books that already have status</li>
                      </ul>
                    </div>
                    
                    <button
                      onClick={() => runOperation('books-setup-academic-year')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Setting up...' : '🚀 Setup Status Field'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* NOMINEE QUIZZES MANAGEMENT CONTENT (NEW SECTION) */}
            {activeSection === 'nominee-quizzes' && (
              <>
                {activeTab === 'nominee-quizzes-current-year' && (
                  <div>
                    <h3 style={{ color: '#f97316', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📅 Current Nominee Quizzes: 2025-26
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      View and manage nominee quizzes for the current academic year.
                      These quizzes help match readers with books based on their preferences and personality.
                    </p>
                    
                    {nomineeQuizzesStats && (
                      <div style={{
                        background: 'rgba(249, 115, 22, 0.1)',
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                      }}>
                        <h4 style={{ color: '#fb923c', marginBottom: '1rem', fontSize: '1.25rem' }}>
                          📊 Nominee Quiz Statistics
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div>
                            <span style={{ color: '#fed7aa', display: 'block', fontSize: '0.875rem' }}>Current Year (2025-26)</span>
                            <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '1.5rem' }}>{nomineeQuizzesStats.currentYear}</span>
                          </div>
                          <div>
                            <span style={{ color: '#fed7aa', display: 'block', fontSize: '0.875rem' }}>Total Quizzes</span>
                            <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '1.5rem' }}>{nomineeQuizzesStats.total}</span>
                          </div>
                          <div>
                            <span style={{ color: '#fed7aa', display: 'block', fontSize: '0.875rem' }}>Active Quizzes</span>
                            <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '1.5rem' }}>{nomineeQuizzesStats.active}</span>
                          </div>
                          <div>
                            <span style={{ color: '#fed7aa', display: 'block', fontSize: '0.875rem' }}>Archived Quizzes</span>
                            <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '1.5rem' }}>{nomineeQuizzesStats.archived}</span>
                          </div>
                        </div>
                        
                        {nomineeQuizzesStats.byQuizType && Object.keys(nomineeQuizzesStats.byQuizType).length > 0 && (
                          <div style={{ marginTop: '1rem' }}>
                            <h5 style={{ color: '#fb923c', marginBottom: '0.5rem' }}>By Quiz Type</h5>
                            {Object.entries(nomineeQuizzesStats.byQuizType).map(([type, count]) => (
                              <div key={type} style={{ color: '#fed7aa', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {type}: {count}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={loadAllStats}
                      style={{
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}
                    >
                      🔄 Refresh Statistics
                    </button>
                  </div>
                )}

                {activeTab === 'nominee-quizzes-setup' && (
                  <div>
                    <h3 style={{ color: '#f97316', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      🏆 Setup Nominee Quizzes (Overwrites)
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Set up nominee quizzes for the current academic year. 
                      This OVERWRITES existing quizzes for 2025-26 with new ones from the data file.
                    </p>
                    
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#ef4444' }}>⚠️ Warning:</strong>
                      <span style={{ color: '#fca5a5' }}> This deletes all existing 2025-26 nominee quizzes and replaces them.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('nominee-quizzes-setup')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #f97316, #ea580c)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Processing...' : '🏆 Setup Nominee Quizzes'}
                    </button>
                  </div>
                )}

                {activeTab === 'nominee-quizzes-archive' && (
                  <div>
                    <h3 style={{ color: '#f97316', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📦 Archive Previous Year Nominee Quizzes
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Archive nominee quizzes from a previous academic year. 
                      This marks them as "archived" but keeps them in the database for historical reference.
                    </p>
                    
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#3b82f6' }}>ℹ️ Archive Process:</strong>
                      <span style={{ color: '#93c5fd' }}> Quizzes will be marked as archived but remain for historical reference.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('nominee-quizzes-archive')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #6b7280, #4b5563)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Archiving...' : '📦 Archive Previous Year'}
                    </button>
                  </div>
                )}

                {activeTab === 'nominee-quizzes-add-single' && (
                  <div>
                    <h3 style={{ color: '#f97316', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      ➕ Add Single Nominee Quiz
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add a single nominee quiz manually. Perfect for quick additions or custom quizzes.
                    </p>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Quiz Title *
                        </label>
                        <input
                          type="text"
                          value={newNomineeQuizForm.title}
                          onChange={(e) => handleNomineeQuizFormChange('title', e.target.value)}
                          placeholder="Which Book Matches Your Personality?"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(249, 115, 22, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Description
                        </label>
                        <input
                          type="text"
                          value={newNomineeQuizForm.description}
                          onChange={(e) => handleNomineeQuizFormChange('description', e.target.value)}
                          placeholder="Discover your perfect book match..."
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(249, 115, 22, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Quiz Type
                        </label>
                        <select
                          value={newNomineeQuizForm.quiz_type}
                          onChange={(e) => handleNomineeQuizFormChange('quiz_type', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(249, 115, 22, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        >
                          {quizTypeOptions.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Academic Year
                        </label>
                        <input
                          type="text"
                          value={newNomineeQuizForm.academic_year}
                          onChange={(e) => handleNomineeQuizFormChange('academic_year', e.target.value)}
                          placeholder="2025-26"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(249, 115, 22, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#3b82f6' }}>📝 Note:</strong>
                      <span style={{ color: '#93c5fd' }}> You'll need to add the quiz questions and results manually in Firebase after creation.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('nominee-quizzes-add-single')}
                      disabled={isRunning || !newNomineeQuizForm.title}
                      style={{
                        background: (isRunning || !newNomineeQuizForm.title)
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #f97316, #ea580c)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: (isRunning || !newNomineeQuizForm.title) ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Adding...' : '➕ Add Nominee Quiz'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* BOOK QUIZZES MANAGEMENT CONTENT */}
            {activeSection === 'book-quizzes' && (
              <>
                {activeTab === 'book-quizzes-current-year' && (
                  <div>
                    <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📅 Current Book Quizzes: 2025-26
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      View and manage book quizzes for the current academic year.
                      These quizzes are tied to specific books by book ID.
                    </p>
                    
                    {bookQuizzesStats && (
                      <div style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                      }}>
                        <h4 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.25rem' }}>
                          📊 Book Quiz Statistics
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                          <div>
                            <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>Current Year (2025-26)</span>
                            <span style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1.5rem' }}>{bookQuizzesStats.currentYear}</span>
                          </div>
                          <div>
                            <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>Total Quizzes</span>
                            <span style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1.5rem' }}>{bookQuizzesStats.total}</span>
                          </div>
                          <div>
                            <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>Active Quizzes</span>
                            <span style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1.5rem' }}>{bookQuizzesStats.active}</span>
                          </div>
                          <div>
                            <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>Archived Quizzes</span>
                            <span style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1.5rem' }}>{bookQuizzesStats.archived}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={loadAllStats}
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}
                    >
                      🔄 Refresh Statistics
                    </button>
                  </div>
                )}

                {activeTab === 'book-quizzes-setup' && (
                  <div>
                    <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      🎯 Setup Book Quizzes (Overwrites)
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Set up book quizzes for the current academic year. 
                      This OVERWRITES existing quizzes for 2025-26 with new ones.
                    </p>
                    
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#ef4444' }}>⚠️ Warning:</strong>
                      <span style={{ color: '#fca5a5' }}> This deletes all existing 2025-26 book quizzes and replaces them.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('book-quizzes-setup')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Processing...' : '🎯 Setup Book Quizzes'}
                    </button>
                  </div>
                )}

                {activeTab === 'book-quizzes-archive' && (
                  <div>
                    <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📦 Archive Previous Year Book Quizzes
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Archive book quizzes from a previous academic year. 
                      This marks them as "archived" but keeps them in the database.
                    </p>
                    
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#3b82f6' }}>ℹ️ Archive Process:</strong>
                      <span style={{ color: '#93c5fd' }}> Quizzes will be marked as archived but remain for historical reference.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('book-quizzes-archive')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #6b7280, #4b5563)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Archiving...' : '📦 Archive Previous Year'}
                    </button>
                  </div>
                )}

                {activeTab === 'book-quizzes-add-single' && (
                  <div>
                    <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      ➕ Add Single Book Quiz
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add a quiz for a specific book using the book's ID.
                    </p>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Book ID *
                        </label>
                        <input
                          type="text"
                          value={newBookQuizForm.book_id}
                          onChange={(e) => handleBookQuizFormChange('book_id', e.target.value)}
                          placeholder="001"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#3b82f6' }}>📝 Note:</strong>
                      <span style={{ color: '#93c5fd' }}> You'll need to add the quiz questions manually in Firebase after creation.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('book-quizzes-add-single')}
                      disabled={isRunning || !newBookQuizForm.book_id}
                      style={{
                        background: (isRunning || !newBookQuizForm.book_id)
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: (isRunning || !newBookQuizForm.book_id) ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Adding...' : '➕ Add Book Quiz'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* SAINTS MANAGEMENT CONTENT */}
            {activeSection === 'saints' && (
              <>
                {activeTab === 'saints-bulk' && (
                  <div>
                    <h3 style={{ color: '#7c3aed', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      🏗️ Saints Bulk Setup
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Replace entire saints collection with complete catalog (existing + new saints).
                      Use this for major updates or initial setup.
                    </p>
                    
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#ef4444' }}>⚠️ Warning:</strong>
                      <span style={{ color: '#fca5a5' }}> This overwrites your entire saints collection.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('saints-bulk')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Processing...' : '🚀 Run Bulk Saints Setup'}
                    </button>
                  </div>
                )}

                {activeTab === 'saints-addNew' && (
                  <div>
                    <h3 style={{ color: '#7c3aed', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      ➕ Add New Saints Only
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add only new saints from the NEW_SAINTS_TO_ADD array. 
                      Skips saints that already exist. Perfect for updates!
                    </p>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#10b981' }}>✅ Safe:</strong>
                      <span style={{ color: '#a7f3d0' }}> Only adds new saints, existing saints unchanged.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('saints-addNew')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Adding...' : '➕ Add New Saints'}
                    </button>
                  </div>
                )}

                {activeTab === 'saints-addSingle' && (
                  <div>
                    <h3 style={{ color: '#7c3aed', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      👤 Add Single Saint
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add one saint manually with custom data. Perfect for quick additions!
                    </p>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Saint Name *
                        </label>
                        <input
                          type="text"
                          value={newSaintForm.name}
                          onChange={(e) => handleSaintFormChange('name', e.target.value)}
                          placeholder="St. Example Saint"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Patronage *
                        </label>
                        <input
                          type="text"
                          value={newSaintForm.patronage}
                          onChange={(e) => handleSaintFormChange('patronage', e.target.value)}
                          placeholder="Travelers, Students"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Luxlings Series
                        </label>
                        <select
                          value={newSaintForm.luxlings_series}
                          onChange={(e) => handleSaintFormChange('luxlings_series', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        >
                          {seriesOptions.map(series => (
                            <option key={series} value={series}>{series}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => runOperation('saints-addSingle')}
                      disabled={isRunning || !newSaintForm.name || !newSaintForm.patronage}
                      style={{
                        background: (isRunning || !newSaintForm.name || !newSaintForm.patronage)
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: (isRunning || !newSaintForm.name) ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Adding...' : '👤 Add Single Saint'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* QUIZZES MANAGEMENT CONTENT */}
            {activeSection === 'quizzes' && (
              <>
                {activeTab === 'quizzes-saints-bulk' && (
                  <div>
                    <h3 style={{ color: '#059669', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📿 Saints Quizzes Bulk Setup
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Import all saints quizzes to saints-quizzes collection.
                      This includes all series: Halo Hatchlings, Contemplative Cuties, Super Sancti, and more.
                    </p>
                    
                    <button
                      onClick={() => runOperation('quizzes-saints-bulk')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #059669, #047857)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Processing...' : '📿 Import Saints Quizzes'}
                    </button>
                  </div>
                )}

                {activeTab === 'quizzes-saints-addNew' && (
                  <div>
                    <h3 style={{ color: '#059669', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      ➕ Add New Saints Quizzes Only
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add only new saints quizzes from the NEW_QUIZZES_TO_ADD array. 
                      Skips quizzes that already exist.
                    </p>
                    
                    <button
                      onClick={() => runOperation('quizzes-saints-addNew')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Adding...' : '➕ Add New Saints Quizzes'}
                    </button>
                  </div>
                )}

                {activeTab === 'quizzes-saints-addSingle' && (
                  <div>
                    <h3 style={{ color: '#059669', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      👤 Add Single Saints Quiz
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add one saints quiz manually.
                    </p>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Quiz Title *
                        </label>
                        <input
                          type="text"
                          value={newSaintsQuizForm.title}
                          onChange={(e) => handleSaintsQuizFormChange('title', e.target.value)}
                          placeholder="Saints Knowledge Quiz"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(5, 150, 105, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Series
                        </label>
                        <select
                          value={newSaintsQuizForm.series}
                          onChange={(e) => handleSaintsQuizFormChange('series', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(5, 150, 105, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        >
                          {seriesOptions.map(series => (
                            <option key={series} value={series}>{series}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => runOperation('quizzes-saints-addSingle')}
                      disabled={isRunning || !newSaintsQuizForm.title}
                      style={{
                        background: (isRunning || !newSaintsQuizForm.title)
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #059669, #047857)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: (isRunning || !newSaintsQuizForm.title) ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Adding...' : '👤 Add Saints Quiz'}
                    </button>
                  </div>
                )}

                {activeTab === 'quizzes-luxdna-bulk' && (
                  <div>
                    <h3 style={{ color: '#059669', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      🧬 Lux DNA Quizzes Bulk Setup
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Import all Lux DNA quizzes to book-quizzes collection.
                    </p>
                    
                    <button
                      onClick={() => runOperation('quizzes-luxdna-bulk')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Processing...' : '🧬 Import Lux DNA Quizzes'}
                    </button>
                  </div>
                )}

                {activeTab === 'quizzes-luxdna-addSingle' && (
                  <div>
                    <h3 style={{ color: '#059669', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      🔬 Add Single Lux DNA Quiz
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Add one Lux DNA quiz manually.
                    </p>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <div>
                        <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                          Quiz Title *
                        </label>
                        <input
                          type="text"
                          value={newLuxDnaQuizForm.title}
                          onChange={(e) => handleLuxDnaQuizFormChange('title', e.target.value)}
                          placeholder="Book Knowledge Quiz"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(5, 150, 105, 0.3)',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white'
                          }}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => runOperation('quizzes-luxdna-addSingle')}
                      disabled={isRunning || !newLuxDnaQuizForm.title}
                      style={{
                        background: (isRunning || !newLuxDnaQuizForm.title)
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: (isRunning || !newLuxDnaQuizForm.title) ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Adding...' : '🔬 Add Lux DNA Quiz'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* PROGRAMS MANAGEMENT CONTENT */}
            {activeSection === 'programs' && (
              <>
                {activeTab === 'programs-setup' && (
                  <div>
                    <h3 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      🚀 Enhanced Programs Setup
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Set up the enhanced flexible program system with Lux Libris & Laudato Literary.
                    </p>
                    
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      marginBottom: '2rem'
                    }}>
                      <h4 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.25rem' }}>
                        📚 What This Setup Creates:
                      </h4>
                      <ul style={{ color: '#a7f3d0', lineHeight: '1.6', margin: 0, paddingLeft: '1.5rem' }}>
                        <li><strong>Lux Libris Program:</strong> Elementary/Middle School (grades 4-8)</li>
                        <li><strong>Laudato Literary List:</strong> High School (grades 9-12) with advanced features</li>
                        <li><strong>Flexible Tier System:</strong> Choose programs based on tier limits</li>
                        <li><strong>GOD MODE Overrides:</strong> Custom program counts with pricing</li>
                      </ul>
                    </div>
                    
                    <button
                      onClick={() => runOperation('programs-setup')}
                      disabled={isRunning}
                      style={{
                        background: isRunning 
                          ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                          : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '1.125rem',
                        fontWeight: '600'
                      }}
                    >
                      {isRunning ? '⏳ Setting up...' : '🚀 Run Enhanced Programs Setup'}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ANALYTICS CONTENT - UPDATED to include nominee quizzes stats */}
            {activeSection === 'analytics' && (
              <>
                {activeTab === 'analytics-overview' && (
                  <div>
                    <h3 style={{ color: '#0891b2', marginBottom: '2rem', fontSize: '1.5rem' }}>
                      📈 Collections Overview
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                      
                      {/* Books Stats */}
                      {booksStats && (
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '0.75rem',
                          padding: '1.5rem'
                        }}>
                          <h4 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.25rem' }}>
                            📚 Books Collection ({booksStats.total} total)
                          </h4>
                          
                          <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{ color: '#fcd34d', marginBottom: '0.5rem' }}>By Status</h5>
                            <div style={{ color: '#fbbf24', marginBottom: '0.25rem' }}>
                              Active: {booksStats.active}
                            </div>
                            <div style={{ color: '#fbbf24', marginBottom: '0.25rem' }}>
                              Archived: {booksStats.archived}
                            </div>
                          </div>
                          
                          <div>
                            <h5 style={{ color: '#fcd34d', marginBottom: '0.5rem' }}>By Academic Year</h5>
                            <div style={{ color: '#fbbf24', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                              2025-26: {booksStats.currentYear}
                            </div>
                            {booksStats.byYear && Object.entries(booksStats.byYear).map(([year, count]) => (
                              <div key={year} style={{ color: '#fbbf24', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {year}: {count}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Nominee Quizzes Stats (NEW) */}
                      {nomineeQuizzesStats && (
                        <div style={{
                          background: 'rgba(249, 115, 22, 0.1)',
                          border: '1px solid rgba(249, 115, 22, 0.3)',
                          borderRadius: '0.75rem',
                          padding: '1.5rem'
                        }}>
                          <h4 style={{ color: '#fb923c', marginBottom: '1rem', fontSize: '1.25rem' }}>
                            🏆 Nominee Quizzes ({nomineeQuizzesStats.total} total)
                          </h4>
                          
                          <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{ color: '#fed7aa', marginBottom: '0.5rem' }}>By Status</h5>
                            <div style={{ color: '#fb923c', marginBottom: '0.25rem' }}>
                              Active: {nomineeQuizzesStats.active}
                            </div>
                            <div style={{ color: '#fb923c', marginBottom: '0.25rem' }}>
                              Archived: {nomineeQuizzesStats.archived}
                            </div>
                          </div>
                          
                          <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{ color: '#fed7aa', marginBottom: '0.5rem' }}>By Academic Year</h5>
                            <div style={{ color: '#fb923c', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                              2025-26: {nomineeQuizzesStats.currentYear}
                            </div>
                            {nomineeQuizzesStats.byYear && Object.entries(nomineeQuizzesStats.byYear).map(([year, count]) => (
                              <div key={year} style={{ color: '#fb923c', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {year}: {count}
                              </div>
                            ))}
                          </div>

                          <div>
                            <h5 style={{ color: '#fed7aa', marginBottom: '0.5rem' }}>By Quiz Type</h5>
                            {nomineeQuizzesStats.byQuizType && Object.entries(nomineeQuizzesStats.byQuizType).map(([type, count]) => (
                              <div key={type} style={{ color: '#fb923c', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {type}: {count}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Book Quizzes Stats */}
                      {bookQuizzesStats && (
                        <div style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          borderRadius: '0.75rem',
                          padding: '1.5rem'
                        }}>
                          <h4 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.25rem' }}>
                            🎯 Book Quizzes ({bookQuizzesStats.total} total)
                          </h4>
                          
                          <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{ color: '#c4b5fd', marginBottom: '0.5rem' }}>By Status</h5>
                            <div style={{ color: '#a78bfa', marginBottom: '0.25rem' }}>
                              Active: {bookQuizzesStats.active}
                            </div>
                            <div style={{ color: '#a78bfa', marginBottom: '0.25rem' }}>
                              Archived: {bookQuizzesStats.archived}
                            </div>
                          </div>
                          
                          <div>
                            <h5 style={{ color: '#c4b5fd', marginBottom: '0.5rem' }}>By Academic Year</h5>
                            <div style={{ color: '#a78bfa', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                              2025-26: {bookQuizzesStats.currentYear}
                            </div>
                            {bookQuizzesStats.byYear && Object.entries(bookQuizzesStats.byYear).map(([year, count]) => (
                              <div key={year} style={{ color: '#a78bfa', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {year}: {count}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Saints Stats */}
                      {saintsStats && (
                        <div style={{
                          background: 'rgba(124, 58, 237, 0.1)',
                          border: '1px solid rgba(124, 58, 237, 0.3)',
                          borderRadius: '0.75rem',
                          padding: '1.5rem'
                        }}>
                          <h4 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.25rem' }}>
                            👼 Saints Collection ({saintsStats.total} total)
                          </h4>
                          
                          <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{ color: '#c4b5fd', marginBottom: '0.5rem' }}>By Rarity</h5>
                            {Object.entries(saintsStats.byRarity).map(([rarity, count]) => (
                              <div key={rarity} style={{ color: '#a78bfa', marginBottom: '0.25rem' }}>
                                {rarity}: {count}
                              </div>
                            ))}
                          </div>
                          
                          <div>
                            <h5 style={{ color: '#c4b5fd', marginBottom: '0.5rem' }}>By Series</h5>
                            {Object.entries(saintsStats.bySeries).map(([series, count]) => (
                              <div key={series} style={{ color: '#a78bfa', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {series}: {count}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Quizzes Stats */}
                      {quizzesStats && (
                        <div style={{
                          background: 'rgba(5, 150, 105, 0.1)',
                          border: '1px solid rgba(5, 150, 105, 0.3)',
                          borderRadius: '0.75rem',
                          padding: '1.5rem'
                        }}>
                          <h4 style={{ color: '#6ee7b7', marginBottom: '1rem', fontSize: '1.25rem' }}>
                            🧩 Lux DNA Quizzes Collection
                          </h4>
                          
                          <div style={{ marginBottom: '1rem' }}>
                            <h5 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Saints Quizzes ({quizzesStats.saints.total})</h5>
                            {Object.entries(quizzesStats.saints.bySeries).map(([series, count]) => (
                              <div key={series} style={{ color: '#a7f3d0', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                {series}: {count}
                              </div>
                            ))}
                          </div>
                          
                          <div>
                            <h5 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Lux DNA Quizzes ({quizzesStats.luxDna?.total || 0})</h5>
                            {quizzesStats.luxDna && quizzesStats.luxDna.total === 0 ? (
                              <div style={{ color: '#6ee7b7', fontSize: '0.875rem' }}>No Lux DNA quizzes yet</div>
                            ) : quizzesStats.luxDna ? (
                              Object.entries(quizzesStats.luxDna.bySeries || {}).map(([category, count]) => (
                                <div key={category} style={{ color: '#a7f3d0', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                  {category}: {count}
                                </div>
                              ))
                            ) : (
                              <div style={{ color: '#6ee7b7', fontSize: '0.875rem' }}>Loading...</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={loadAllStats}
                      style={{
                        background: 'linear-gradient(135deg, #0891b2, #0e7490)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '500',
                        marginTop: '2rem'
                      }}
                    >
                      🔄 Refresh All Statistics
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Live Logs */}
          {logs.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: `1px solid ${currentSectionData?.color}40`,
              marginBottom: '2rem'
            }}>
              <h3 style={{
                color: 'white',
                marginBottom: '1rem',
                fontSize: '1.25rem'
              }}>
                📊 Operation Progress
              </h3>
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '0.5rem',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    style={{
                      color: log.type === 'error' ? '#ef4444' : 
                             log.message.includes('✅') ? '#10b981' :
                             log.message.includes('➕') ? '#3b82f6' :
                             log.message.includes('⏭️') ? '#fbbf24' : '#c4b5fd',
                      marginBottom: '0.5rem',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    <span style={{ color: '#a78bfa' }}>[{log.time}]</span> {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{
              background: result.success 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '0.75rem',
              padding: '2rem'
            }}>
              <h3 style={{
                color: result.success ? '#10b981' : '#ef4444',
                marginBottom: '1rem',
                fontSize: '1.5rem'
              }}>
                {result.success ? '🎉 Operation Successful!' : '❌ Operation Failed'}
              </h3>
              
              <p style={{
                color: result.success ? '#a7f3d0' : '#fca5a5',
                fontSize: '1.125rem',
                marginBottom: result.success ? '1rem' : '0'
              }}>
                {result.message}
              </p>

              {result.success && result.stats && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <h4 style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                    Operation Details:
                  </h4>
                  <div style={{ color: '#a7f3d0', fontSize: '0.875rem' }}>
                    {result.stats.operation === 'yearly_overwrite' && `Total items processed: ${result.stats.total}`}
                    {result.stats.operation === 'archive' && `Archived: ${result.stats.archived} from ${result.stats.academic_year}`}
                    {result.stats.operation === 'single_add' && `Successfully added 1 item`}
                    {result.stats.operation === 'bulk' && `Total items processed: ${result.stats.total}`}
                    {result.stats.operation === 'add_new' && `Added: ${result.stats.added}, Skipped: ${result.stats.skipped}`}
                    {result.stats.academic_year && ` • Academic Year: ${result.stats.academic_year}`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}