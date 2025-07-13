// pages/admin/dashboard.js - Protected Unified Lux Libris Admin Dashboard
import { useState, useEffect } from 'react'
import Head from 'next/head'
import saintsManager from '../../enhanced-saints-manager'
import quizzesManager from '../../enhanced-quizzes-manager'
import programsSetup from '../../setup-programs'

export default function UnifiedAdminDashboard() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120) // minutes
  
  // Existing Dashboard State
  const [activeSection, setActiveSection] = useState('saints')
  const [activeTab, setActiveTab] = useState('saints-bulk')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Statistics state
  const [saintsStats, setSaintsStats] = useState(null)
  const [quizzesStats, setQuizzesStats] = useState(null)
  const [programsStats, setProgramsStats] = useState(null)
  
  // Form states for different managers
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
  
  const [newSaintsQuizForm, setNewSaintsQuizForm] = useState({
    quiz_id: '',
    title: '',
    description: '',
    series: 'Halo Hatchlings',
    target_grades: [4, 5, 6, 7, 8],
    questions: [],
    results: {}
  })
  
  const [newBookQuizForm, setNewBookQuizForm] = useState({
    quiz_id: '',
    title: '',
    description: '',
    target_grades: [4, 5, 6, 7, 8],
    questions: [],
    results: {}
  })

  // Session timeout (2 hours = 7200000 ms)
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // Initialize session from localStorage on component mount
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

  // Save session to localStorage whenever authentication changes
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

  // Check session timeout
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

    // Check every minute
    const interval = setInterval(checkSession, 60000)
    checkSession() // Initial check
    
    return () => clearInterval(interval)
  }, [isAuthenticated, lastActivity])

  // Update activity on user interactions
  useEffect(() => {
    if (!isAuthenticated) return

    const updateActivity = () => {
      const newActivity = Date.now()
      setLastActivity(newActivity)
      // Update localStorage immediately
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

  // Password Protection
  const handleLogin = () => {
    if (password === 'LUXLIBRIS-GOD-2025') {
      const now = Date.now()
      setIsAuthenticated(true)
      setLastActivity(now)
      localStorage.setItem('adminDashboardSession', JSON.stringify({
        authenticated: true,
        lastActivity: now
      }))
      loadAllStats() // Load data after successful login
    } else {
      alert('Invalid admin password')
    }
  }

  // Logout function
  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('adminDashboardSession')
    setLastActivity(Date.now())
    // Clear all data
    setSaintsStats(null)
    setQuizzesStats(null)
    setProgramsStats(null)
    setLogs([])
    setResult(null)
  }

  // Load all stats on authentication
  const loadAllStats = async () => {
    try {
      const [saints, saintsQuizzes, bookQuizzes] = await Promise.all([
        saintsManager.getSaintsStats(),
        quizzesManager.getQuizzesStats('saints'),
        quizzesManager.getQuizzesStats('books')
      ])
      
      setSaintsStats(saints)
      setQuizzesStats({ saints: saintsQuizzes, books: bookQuizzes })
      // Programs stats would go here when available
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
              Administrator Access Required - Saints, Quizzes & Programs Management
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

  // Unified console logging system
  const originalLog = console.log
  const originalError = console.error

  const runOperation = async (operation, params = {}) => {
    setIsRunning(true)
    setResult(null)
    setLogs([])

    // Capture logs
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

        case 'quizzes-books-bulk':
          console.log('🚀 Starting book quizzes bulk setup...')
          setupResult = await quizzesManager.setupAllBookQuizzes()
          break
          
        case 'quizzes-books-addSingle':
          console.log('➕ Adding single book quiz...')
          const nextBookQuizId = await quizzesManager.getNextQuizId('books')
          const bookQuizData = { ...newBookQuizForm, quiz_id: nextBookQuizId }
          setupResult = await quizzesManager.addSingleBookQuiz(bookQuizData)
          if (setupResult.success) {
            setNewBookQuizForm({
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
        await loadAllStats() // Refresh all stats
      } else {
        console.error('❌ Operation failed:', setupResult.message)
      }
    } catch (error) {
      console.error('❌ Error during operation:', error.message)
      setResult({ success: false, message: error.message })
    }

    // Restore original console methods
    console.log = originalLog
    console.error = originalError
    setIsRunning(false)
  }

  // Form handlers
  const handleSaintFormChange = (field, value) => {
    setNewSaintForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSaintsQuizFormChange = (field, value) => {
    setNewSaintsQuizForm(prev => ({ ...prev, [field]: value }))
  }

  const handleBookQuizFormChange = (field, value) => {
    setNewBookQuizForm(prev => ({ ...prev, [field]: value }))
  }

  // Navigation sections
  const sections = [
    { id: 'saints', name: 'Saints Management', icon: '👼', color: '#7c3aed' },
    { id: 'quizzes', name: 'Quizzes Management', icon: '🧩', color: '#059669' },
    { id: 'programs', name: 'Programs Management', icon: '⚙️', color: '#dc2626' },
    { id: 'analytics', name: 'Analytics & Stats', icon: '📊', color: '#0891b2' }
  ]

  // Dynamic tabs based on active section
  const getTabsForSection = (section) => {
    switch (section) {
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
          { id: 'quizzes-books-bulk', name: 'Book Quizzes Bulk', icon: '📚' },
          { id: 'quizzes-books-addSingle', name: 'Add Single Book Quiz', icon: '📖' }
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

  // Change section handler
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

  return (
    <>
      <Head>
        <title>Lux Libris Admin Dashboard</title>
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
                background: 'linear-gradient(135deg, #7c3aed, #059669, #dc2626, #0891b2)',
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
                {/* Session Timer */}
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
                
                {/* Logout Button */}
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
              Lux Libris Admin Dashboard
            </h1>
            <p style={{
              color: '#c4b5fd',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Unified management for Saints, Quizzes, Programs & Analytics
            </p>
            
            {/* Quick Stats */}
            {(saintsStats || quizzesStats) && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
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
                {quizzesStats?.books && (
                  <div style={{
                    background: 'rgba(220, 38, 38, 0.2)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(220, 38, 38, 0.3)'
                  }}>
                    <span style={{ color: '#fca5a5', fontSize: '0.875rem', display: 'block' }}>Book Quizzes</span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{quizzesStats.books.total}</span>
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

                {activeTab === 'quizzes-books-bulk' && (
                  <div>
                    <h3 style={{ color: '#059669', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📚 Book Quizzes Bulk Setup
                    </h3>
                    <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                      Import all book quizzes to book-quizzes collection.
                      This feature will be enabled when book quizzes are created.
                    </p>
                    
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '2rem'
                    }}>
                      <strong style={{ color: '#3b82f6' }}>ℹ️ Coming Soon:</strong>
                      <span style={{ color: '#93c5fd' }}> Book quizzes are not created yet. This will be enabled in the future.</span>
                    </div>
                    
                    <button
                      onClick={() => runOperation('quizzes-books-bulk')}
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
                      {isRunning ? '⏳ Processing...' : '📚 Import Book Quizzes'}
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

            {/* ANALYTICS CONTENT */}
            {activeSection === 'analytics' && (
              <>
                {activeTab === 'analytics-overview' && (
                  <div>
                    <h3 style={{ color: '#0891b2', marginBottom: '2rem', fontSize: '1.5rem' }}>
                      📈 Collections Overview
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                      
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
                            🧩 Quizzes Collection
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
                            <h5 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Book Quizzes ({quizzesStats.books.total})</h5>
                            {quizzesStats.books.total === 0 ? (
                              <div style={{ color: '#6ee7b7', fontSize: '0.875rem' }}>No book quizzes yet</div>
                            ) : (
                              Object.entries(quizzesStats.books.bySeries).map(([category, count]) => (
                                <div key={category} style={{ color: '#a7f3d0', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                                  {category}: {count}
                                </div>
                              ))
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
                    {result.stats.operation === 'bulk' && `Total items processed: ${result.stats.total}`}
                    {result.stats.operation === 'add_new' && `Added: ${result.stats.added}, Skipped: ${result.stats.skipped}`}
                    {result.stats.operation === 'single_add' && `Successfully added 1 item`}
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

// NO SERVER-SIDE FUNCTIONS - This is purely client-side