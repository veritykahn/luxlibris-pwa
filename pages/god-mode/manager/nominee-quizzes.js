// pages/god-mode/manager/nominee-quizzes.js - Nominee Quizzes Management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import nomineeQuizzesManager from '../../../nominee-quizzes-manager'

export default function NomineeQuizzesManager() {
  // AUTHENTICATION STATE - Same for all managers
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // NOMINEE QUIZZES MANAGER-SPECIFIC STATE
  const [activeTab, setActiveTab] = useState('nominee-quizzes-current-year')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Statistics state
  const [nomineeQuizzesStats, setNomineeQuizzesStats] = useState(null)
  
  // Form state
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

  // Session timeout logic - Same for all managers
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // AUTHENTICATION LOGIC - Uses nomineeQuizzesManagerSession
  useEffect(() => {
    const savedMainSession = localStorage.getItem('adminDashboardSession')
    const savedManagerSession = localStorage.getItem('nomineeQuizzesManagerSession')
    
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
        localStorage.removeItem('nomineeQuizzesManagerSession')
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
      localStorage.setItem('nomineeQuizzesManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('nomineeQuizzesManagerSession')
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
      localStorage.setItem('nomineeQuizzesManagerSession', JSON.stringify({
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
      localStorage.setItem('nomineeQuizzesManagerSession', JSON.stringify({
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
    localStorage.removeItem('nomineeQuizzesManagerSession')
    setLastActivity(Date.now())
  }

  const loadStats = async () => {
    try {
      const stats = await nomineeQuizzesManager.getNomineeQuizzesStats()
      setNomineeQuizzesStats(stats)
    } catch (error) {
      console.error('Error loading nominee quizzes stats:', error)
    }
  }

  // LOGIN SCREEN - Customized for Nominee Quizzes Manager
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Nominee Quizzes Manager - Authentication Required</title>
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
            border: '1px solid rgba(249, 115, 22, 0.3)',
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
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              🏆
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Nominee Quizzes Manager
            </h1>
            <p style={{
              color: '#fed7aa',
              marginBottom: '2rem'
            }}>
              Manager Access Required - Personality and preference quizzes for book matching
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
                  border: '1px solid rgba(249, 115, 22, 0.3)',
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
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🏆 ENTER NOMINEE QUIZZES MANAGER
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

  const handleNomineeQuizFormChange = (field, value) => {
    setNewNomineeQuizForm(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'nominee-quizzes-current-year', name: 'Current Year (2025-26)', icon: '📅' },
    { id: 'nominee-quizzes-setup', name: 'Setup Nominee Quizzes', icon: '🏆' },
    { id: 'nominee-quizzes-archive', name: 'Archive Previous Year', icon: '📦' },
    { id: 'nominee-quizzes-add-single', name: 'Add Single Quiz', icon: '➕' }
  ]

  const quizTypeOptions = ['personality', 'knowledge', 'preference', 'assessment']

  // MAIN MANAGER INTERFACE - Customized for Nominee Quizzes Manager
  return (
    <>
      <Head>
        <title>Nominee Quizzes Manager - Lux Libris God Mode</title>
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
            border: '1px solid rgba(249, 115, 22, 0.3)',
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
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                🏆
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
                    : 'rgba(249, 115, 22, 0.2)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: sessionTimeRemaining <= 10 ? '#fca5a5' : '#fed7aa',
                  border: sessionTimeRemaining <= 10 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : '1px solid rgba(249, 115, 22, 0.3)',
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
              🏆 Nominee Quizzes Management
            </h1>
            <p style={{
              color: '#fed7aa',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Personality and preference quizzes for book matching
            </p>
            
            {/* Quick Stats */}
            {nomineeQuizzesStats && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  background: 'rgba(249, 115, 22, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(249, 115, 22, 0.3)'
                }}>
                  <span style={{ color: '#fb923c', fontSize: '0.875rem', display: 'block' }}>Current Year (2025-26)</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{nomineeQuizzesStats.currentYear}</span>
                </div>
                <div style={{
                  background: 'rgba(249, 115, 22, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(249, 115, 22, 0.3)'
                }}>
                  <span style={{ color: '#fb923c', fontSize: '0.875rem', display: 'block' }}>Total Quizzes</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{nomineeQuizzesStats.total}</span>
                </div>
                <div style={{
                  background: 'rgba(249, 115, 22, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(249, 115, 22, 0.3)'
                }}>
                  <span style={{ color: '#fb923c', fontSize: '0.875rem', display: 'block' }}>Active Quizzes</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{nomineeQuizzesStats.active}</span>
                </div>
                <div style={{
                  background: 'rgba(249, 115, 22, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(249, 115, 22, 0.3)'
                }}>
                  <span style={{ color: '#fb923c', fontSize: '0.875rem', display: 'block' }}>Archived Quizzes</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{nomineeQuizzesStats.archived}</span>
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
            border: '1px solid rgba(249, 115, 22, 0.3)'
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
                      ? 'linear-gradient(135deg, #f97316, #ea580c)'
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
            border: '1px solid rgba(249, 115, 22, 0.3)',
            marginBottom: '2rem'
          }}>
            
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
                  onClick={loadStats}
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
          </div>

          {/* Live Logs */}
          {logs.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgba(249, 115, 22, 0.3)',
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