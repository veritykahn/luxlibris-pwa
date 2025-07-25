// pages/god-mode/manager/book-quizzes.js - Book Quizzes Management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import bookQuizzesManager from '../../../book-quizzes-manager'

export default function BookQuizzesManager() {
  // AUTHENTICATION STATE - Same for all managers
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // BOOK QUIZZES MANAGER-SPECIFIC STATE
  const [activeTab, setActiveTab] = useState('book-quizzes-current-year')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Statistics state
  const [bookQuizzesStats, setBookQuizzesStats] = useState(null)
  
  // Form state
  const [newBookQuizForm, setNewBookQuizForm] = useState({
    book_id: '',
    title: '',
    description: '',
    target_grades: [4, 5, 6, 7, 8],
    questions: [],
    results: {}
  })

  // Session timeout logic - Same for all managers
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // AUTHENTICATION LOGIC - Uses bookQuizzesManagerSession
  useEffect(() => {
    const savedMainSession = localStorage.getItem('adminDashboardSession')
    const savedManagerSession = localStorage.getItem('bookQuizzesManagerSession')
    
    if (savedManagerSession) {
      const sessionData = JSON.parse(savedManagerSession)
      const now = Date.now()
      const timePassed = now - sessionData.lastActivity
      
      if (timePassed < SESSION_TIMEOUT) {
        setIsAuthenticated(true)
        setLastActivity(sessionData.lastActivity)
        loadStats() // Call init function
        return
      } else {
        localStorage.removeItem('bookQuizzesManagerSession')
      }
    }
    
    // Check main session as backup
    if (savedMainSession) {
      const sessionData = JSON.parse(savedMainSession)
      const now = Date.now()
      const timePassed = now - sessionData.lastActivity
      
      if (timePassed < SESSION_TIMEOUT) {
        setIsAuthenticated(true)
        setLastActivity(sessionData.lastActivity)
        loadStats() // Call init function
        return
      } else {
        localStorage.removeItem('adminDashboardSession')
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('bookQuizzesManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('bookQuizzesManagerSession')
    }
  }, [isAuthenticated, lastActivity])

  // Session timeout check - Same for all managers
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

  // Activity tracking - Same for all managers
  useEffect(() => {
    if (!isAuthenticated) return

    const updateActivity = () => {
      const newActivity = Date.now()
      setLastActivity(newActivity)
      localStorage.setItem('bookQuizzesManagerSession', JSON.stringify({
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

  // LOGIN HANDLER - Use LUXLIBRISSAINT for all managers
  const handleLogin = () => {
    if (password === 'LUXLIBRISSAINT') {
      const now = Date.now()
      setIsAuthenticated(true)
      setLastActivity(now)
      localStorage.setItem('bookQuizzesManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: now
      }))
      loadStats() // Call init function
    } else {
      alert('Invalid Manager password')
    }
  }

  // LOGOUT HANDLER - Same for all managers
  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('bookQuizzesManagerSession')
    setLastActivity(Date.now())
  }

  const loadStats = async () => {
    try {
      const stats = await bookQuizzesManager.getBookQuizzesStats()
      setBookQuizzesStats(stats)
    } catch (error) {
      console.error('Error loading book quizzes stats:', error)
    }
  }

  // LOGIN SCREEN - Customized for Book Quizzes Manager
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Book Quizzes Manager - Authentication Required</title>
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
            border: '1px solid rgba(139, 92, 246, 0.3)',
            textAlign: 'center',
            minWidth: '400px'
          }}>
            <Link href="/god-mode/manager" style={{
              position: 'absolute',
              top: '2rem',
              left: '2rem',
              background: 'linear-gradient(135deg, #6b7280, #4b5563)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              ← Back to God Mode
            </Link>
            
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              🎯
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Book Quizzes Manager
            </h1>
            <p style={{
              color: '#c4b5fd',
              marginBottom: '2rem'
            }}>
              Manager Access Required - Quizzes tied to specific books by ID
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Enter Manager Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
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
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🎯 ENTER BOOK QUIZZES MANAGER
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
          
        default:
          throw new Error('Unknown operation: ' + operation)
      }
      
      setResult(setupResult)
      
      if (setupResult.success) {
        console.log('✅ Operation completed successfully!')
        await loadStats()
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

  const handleBookQuizFormChange = (field, value) => {
    setNewBookQuizForm(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'book-quizzes-current-year', name: 'Current Year (2025-26)', icon: '📅' },
    { id: 'book-quizzes-setup', name: 'Setup Book Quizzes', icon: '🎯' },
    { id: 'book-quizzes-archive', name: 'Archive Previous Year', icon: '📦' },
    { id: 'book-quizzes-add-single', name: 'Add Single Quiz', icon: '➕' }
  ]

  // MAIN MANAGER INTERFACE - Customized for Book Quizzes Manager
  return (
    <>
      <Head>
        <title>Book Quizzes Manager - Lux Libris God Mode</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #581c87 75%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
          
          {/* Header with Back Button and Session Time */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <Link href="/god-mode/manager" style={{
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                ← Back to God Mode
              </Link>
              
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                🎯
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: sessionTimeRemaining <= 10 
                    ? 'rgba(239, 68, 68, 0.2)' 
                    : 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: sessionTimeRemaining <= 10 ? '#fca5a5' : '#c4b5fd',
                  border: sessionTimeRemaining <= 10 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : '1px solid rgba(139, 92, 246, 0.3)',
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
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 1rem',
              fontFamily: 'Georgia, serif'
            }}>
              🎯 Book Quizzes Management
            </h1>
            <p style={{
              color: '#c4b5fd',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Quizzes tied to specific books by ID
            </p>
            
            {/* Quick Stats */}
            {bookQuizzesStats && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Current Year (2025-26)</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{bookQuizzesStats.currentYear}</span>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Total Quizzes</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{bookQuizzesStats.total}</span>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Active Quizzes</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{bookQuizzesStats.active}</span>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Archived Quizzes</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{bookQuizzesStats.archived}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '2rem',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id 
                      ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
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

          {/* Main Content Area */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            marginBottom: '2rem'
          }}>
            
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
                  onClick={loadStats}
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
                  This marks them as &quot;archived&quot; but keeps them in the database.
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
                  Add a quiz for a specific book using the book&apos;s ID.
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
                  
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      value={newBookQuizForm.title}
                      onChange={(e) => handleBookQuizFormChange('title', e.target.value)}
                      placeholder="Book Knowledge Quiz"
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
                  
                  <div>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={newBookQuizForm.description}
                      onChange={(e) => handleBookQuizFormChange('description', e.target.value)}
                      placeholder="Test your knowledge of this book..."
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
                  <span style={{ color: '#93c5fd' }}> You&apos;ll need to add the quiz questions manually in Firebase after creation.</span>
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
          </div>

          {/* Live Logs */}
          {logs.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgba(139, 92, 246, 0.3)',
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