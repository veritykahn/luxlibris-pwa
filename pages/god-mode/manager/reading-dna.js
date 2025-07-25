// pages/god-mode/manager/reading-dna.js - Reading DNA Assessment Manager
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import readingDnaManager from '../../../reading-dna-manager'

export default function ReadingDnaManager() {
  // AUTHENTICATION STATE - Same for all managers
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // READING DNA MANAGER-SPECIFIC STATE
  const [activeTab, setActiveTab] = useState('reading-dna-bulk')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Statistics state
  const [readingDnaStats, setReadingDnaStats] = useState(null)
  
  // Form states for adding new questions/types (future functionality)
  const [newQuestionForm, setNewQuestionForm] = useState({
    id: '',
    question: '',
    researchBase: '',
    options: []
  })

  // Session timeout logic - Same for all managers
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // AUTHENTICATION LOGIC - Uses readingDnaManagerSession
  useEffect(() => {
    const savedMainSession = localStorage.getItem('adminDashboardSession')
    const savedManagerSession = localStorage.getItem('readingDnaManagerSession')
    
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
        localStorage.removeItem('readingDnaManagerSession')
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
      localStorage.setItem('readingDnaManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('readingDnaManagerSession')
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
      localStorage.setItem('readingDnaManagerSession', JSON.stringify({
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
      localStorage.setItem('readingDnaManagerSession', JSON.stringify({
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
    localStorage.removeItem('readingDnaManagerSession')
    setLastActivity(Date.now())
  }

  const loadStats = async () => {
    try {
      const stats = await readingDnaManager.getReadingDnaStats()
      setReadingDnaStats(stats)
    } catch (error) {
      console.error('Error loading Reading DNA stats:', error)
    }
  }

  // LOGIN SCREEN - Customized for Reading DNA Manager
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Reading DNA Manager - Authentication Required</title>
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
              🧬
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Reading DNA Manager
            </h1>
            <p style={{
              color: '#c4b5fd',
              marginBottom: '2rem'
            }}>
              Manager Access Required - Student Reading Assessment System
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
              🧬 ENTER READING DNA MANAGER
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
        case 'reading-dna-bulk':
          console.log('🚀 Starting Reading DNA Assessment setup...')
          setupResult = await readingDnaManager.setupReadingDnaAssessment()
          break
          
        case 'reading-dna-addQuestion':
          console.log('➕ Adding new Reading DNA question...')
          setupResult = await readingDnaManager.addReadingDnaQuestion(newQuestionForm)
          if (setupResult.success) {
            setNewQuestionForm({
              id: '',
              question: '',
              researchBase: '',
              options: []
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

  const handleQuestionFormChange = (field, value) => {
    setNewQuestionForm(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'reading-dna-bulk', name: 'Full Assessment Setup', icon: '🧬' },
    { id: 'reading-dna-stats', name: 'Assessment Statistics', icon: '📊' },
    { id: 'reading-dna-preview', name: 'Preview Assessment', icon: '👁️' }
  ]

  // MAIN MANAGER INTERFACE - Customized for Reading DNA Manager
  return (
    <>
      <Head>
        <title>Reading DNA Manager - Lux Libris God Mode</title>
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
                🧬
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
              🧬 Reading DNA Assessment
            </h1>
            <p style={{
              color: '#c4b5fd',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Research-based student reading personality assessment system
            </p>
            
            {/* Quick Stats */}
            {readingDnaStats && (
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
                  <span style={{ color: '#c4b5fd', fontSize: '0.875rem', display: 'block' }}>Questions</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{readingDnaStats.questions || 0}</span>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#c4b5fd', fontSize: '0.875rem', display: 'block' }}>DNA Types</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{readingDnaStats.types || 0}</span>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#c4b5fd', fontSize: '0.875rem', display: 'block' }}>Modifiers</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{readingDnaStats.modifiers || 0}</span>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#c4b5fd', fontSize: '0.875rem', display: 'block' }}>Total Active</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{readingDnaStats.active || 0}</span>
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
            
            {activeTab === 'reading-dna-bulk' && (
              <div>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  🧬 Reading DNA Assessment Setup
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Import the complete Reading DNA Assessment system including questions, personality types, and modifier strategies.
                  This is a research-based system to help students understand their reading preferences.
                </p>
                
                <div style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ color: '#a855f7', marginBottom: '1rem', fontSize: '1.25rem' }}>
                    🧬 What This Setup Includes:
                  </h4>
                  <ul style={{ color: '#c4b5fd', lineHeight: '1.6', margin: 0, paddingLeft: '1.5rem' }}>
                    <li><strong>Assessment Questions:</strong> Research-based questions about reading motivation</li>
                    <li><strong>DNA Types:</strong> 6 reading personality types (Creative Explorer, Curious Investigator, etc.)</li>
                    <li><strong>Student Modifiers:</strong> Additional traits that affect how students learn</li>
                    <li><strong>Educator Strategies:</strong> Research-backed support strategies for each type</li>
                    <li><strong>Assessment Config:</strong> System configuration and metadata</li>
                  </ul>
                </div>
                
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#f59e0b' }}>⚠️ Important:</strong>
                  <span style={{ color: '#fcd34d' }}> This will overwrite any existing Reading DNA assessment data.</span>
                </div>
                
                <button
                  onClick={() => runOperation('reading-dna-bulk')}
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
                  {isRunning ? '⏳ Setting up...' : '🧬 Setup Reading DNA Assessment'}
                </button>
              </div>
            )}

            {activeTab === 'reading-dna-stats' && (
              <div>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  📊 Assessment Statistics
                </h3>
                
                {readingDnaStats ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                      <h4 style={{ color: '#a855f7', marginBottom: '1rem' }}>Total Documents</h4>
                      <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{readingDnaStats.total_documents}</p>
                    </div>
                    
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                      <h4 style={{ color: '#a855f7', marginBottom: '1rem' }}>Questions</h4>
                      <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{readingDnaStats.questions}</p>
                    </div>
                    
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                      <h4 style={{ color: '#a855f7', marginBottom: '1rem' }}>DNA Types</h4>
                      <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{readingDnaStats.types}</p>
                    </div>
                    
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                      <h4 style={{ color: '#a855f7', marginBottom: '1rem' }}>Modifiers</h4>
                      <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{readingDnaStats.modifiers}</p>
                      <div style={{ fontSize: '0.875rem', color: '#c4b5fd', marginTop: '0.5rem' }}>
                        Educator: {readingDnaStats.by_type?.educator_modifiers || 0} | Student: {readingDnaStats.by_type?.student_modifiers || 0}
                      </div>
                    </div>
                    
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                      <h4 style={{ color: '#a855f7', marginBottom: '1rem' }}>Configuration</h4>
                      <p style={{ color: readingDnaStats.config?.exists ? '#10b981' : '#ef4444', fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                        {readingDnaStats.config?.exists ? '✅ Active' : '❌ Missing'}
                      </p>
                      {readingDnaStats.config?.version && (
                        <div style={{ fontSize: '0.875rem', color: '#c4b5fd', marginTop: '0.5rem' }}>
                          Version: {readingDnaStats.config.version} | Year: {readingDnaStats.config.academic_year}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#c4b5fd' }}>Loading statistics...</p>
                )}
              </div>
            )}

            {activeTab === 'reading-dna-preview' && (
              <div>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  👁️ Assessment Preview
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Preview of the Reading DNA personality types and what students will discover.
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {[
                    { name: 'Creative Explorer', emoji: '🎨', color: '#FF6B9D' },
                    { name: 'Curious Investigator', emoji: '🔬', color: '#4ECDC4' },
                    { name: 'Social Connector', emoji: '🦋', color: '#95E1D3' },
                    { name: 'Challenge Seeker', emoji: '🏔️', color: '#D4A574' },
                    { name: 'Freedom Reader', emoji: '🕊️', color: '#AED6F1' },
                    { name: 'Reflective Thinker', emoji: '🌙', color: '#4A5568' }
                  ].map(type => (
                    <div key={type.name} style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{type.emoji}</div>
                      <h4 style={{ color: type.color, margin: '0 0 0.5rem', fontSize: '1.125rem' }}>{type.name}</h4>
                      <p style={{ color: '#c4b5fd', fontSize: '0.875rem', margin: 0, lineHeight: '1.4' }}>
                        Research-based reading personality with personalized strategies
                      </p>
                    </div>
                  ))}
                </div>
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
                    Total items processed: {result.stats.total} | Questions: {result.stats.questions} | Types: {result.stats.types} | Modifiers: {result.stats.modifiers}
                    {result.stats.version && ` | Version: ${result.stats.version}`}
                    {result.stats.academic_year && ` | Academic Year: ${result.stats.academic_year}`}
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