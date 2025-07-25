// pages/god-mode/manager/programs.js - Programs Management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import programsSetup from '../../../setup-programs'

export default function ProgramsManager() {
  // AUTHENTICATION STATE - Same for all managers
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // PROGRAMS MANAGER-SPECIFIC STATE
  const [activeTab, setActiveTab] = useState('programs-setup')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Statistics state
  const [programsStats, setProgramsStats] = useState(null)

  // Session timeout logic - Same for all managers
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // AUTHENTICATION LOGIC - Uses programsManagerSession
  useEffect(() => {
    const savedMainSession = localStorage.getItem('adminDashboardSession')
    const savedManagerSession = localStorage.getItem('programsManagerSession')
    
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
        localStorage.removeItem('programsManagerSession')
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
      localStorage.setItem('programsManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('programsManagerSession')
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
      localStorage.setItem('programsManagerSession', JSON.stringify({
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
      localStorage.setItem('programsManagerSession', JSON.stringify({
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
    localStorage.removeItem('programsManagerSession')
    setLastActivity(Date.now())
  }

  const loadStats = async () => {
    try {
      // You might want to add a getProgramsStats method to your programsSetup
      // For now, we'll just set some placeholder stats
      setProgramsStats({
        total: 2,
        luxLibris: true,
        laudatoLiterary: true
      })
    } catch (error) {
      console.error('Error loading programs stats:', error)
    }
  }

  // LOGIN SCREEN - Customized for Programs Manager
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Programs Manager - Authentication Required</title>
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
            border: '1px solid rgba(220, 38, 38, 0.3)',
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
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              ⚙️
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Programs Manager
            </h1>
            <p style={{
              color: '#fca5a5',
              marginBottom: '2rem'
            }}>
              Manager Access Required - Lux Libris and Laudato Literary program setup
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
                  border: '1px solid rgba(220, 38, 38, 0.3)',
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
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ⚙️ ENTER PROGRAMS MANAGER
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

  const tabs = [
    { id: 'programs-setup', name: 'Setup Programs', icon: '🚀' },
    { id: 'programs-manage', name: 'Manage Programs', icon: '⚙️' }
  ]

  // MAIN MANAGER INTERFACE - Customized for Programs Manager
  return (
    <>
      <Head>
        <title>Programs Manager - Lux Libris God Mode</title>
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
            border: '1px solid rgba(220, 38, 38, 0.3)',
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
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                ⚙️
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
                    : 'rgba(220, 38, 38, 0.2)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: sessionTimeRemaining <= 10 ? '#fca5a5' : '#fca5a5',
                  border: sessionTimeRemaining <= 10 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : '1px solid rgba(220, 38, 38, 0.3)',
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
              ⚙️ Programs Management
            </h1>
            <p style={{
              color: '#fca5a5',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Lux Libris and Laudato Literary program setup
            </p>
            
            {/* Quick Stats */}
            {programsStats && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  background: 'rgba(220, 38, 38, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(220, 38, 38, 0.3)'
                }}>
                  <span style={{ color: '#fca5a5', fontSize: '0.875rem', display: 'block' }}>Total Programs</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{programsStats.total}</span>
                </div>
                <div style={{
                  background: 'rgba(220, 38, 38, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(220, 38, 38, 0.3)'
                }}>
                  <span style={{ color: '#fca5a5', fontSize: '0.875rem', display: 'block' }}>Lux Libris</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{programsStats.luxLibris ? '✅' : '❌'}</span>
                </div>
                <div style={{
                  background: 'rgba(220, 38, 38, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(220, 38, 38, 0.3)'
                }}>
                  <span style={{ color: '#fca5a5', fontSize: '0.875rem', display: 'block' }}>Laudato Literary</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{programsStats.laudatoLiterary ? '✅' : '❌'}</span>
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
            border: '1px solid rgba(220, 38, 38, 0.3)'
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
                      ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
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
            border: '1px solid rgba(220, 38, 38, 0.3)',
            marginBottom: '2rem'
          }}>
            
            {activeTab === 'programs-setup' && (
              <div>
                <h3 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  🚀 Enhanced Programs Setup
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Set up the enhanced flexible program system with Lux Libris & Laudato Literary.
                  This creates the foundation for school program management.
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
                    <li><strong>Academic Year Tracking:</strong> Program data organized by school year</li>
                    <li><strong>Feature Flags:</strong> Enable/disable features per program</li>
                  </ul>
                </div>
                
                <div style={{
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.25rem' }}>
                    🏗️ Program Features Include:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    <div>
                      <h5 style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>Lux Libris Features</h5>
                      <ul style={{ color: '#fca5a5', fontSize: '0.875rem', margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Book Nominee Selection</li>
                        <li>Saints Collection & Luxlings</li>
                        <li>Reading Progress Tracking</li>
                        <li>Quiz System Integration</li>
                        <li>Leaderboards & Competitions</li>
                      </ul>
                    </div>
                    <div>
                      <h5 style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>Laudato Literary Features</h5>
                      <ul style={{ color: '#fca5a5', fontSize: '0.875rem', margin: 0, paddingLeft: '1.5rem' }}>
                        <li>Advanced Book Analysis</li>
                        <li>Essay & Discussion Prompts</li>
                        <li>Teacher Dashboard Enhanced</li>
                        <li>Parent Communication Tools</li>
                        <li>College Prep Integration</li>
                      </ul>
                    </div>
                  </div>
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

            {activeTab === 'programs-manage' && (
              <div>
                <h3 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  ⚙️ Manage Programs
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  View and manage existing programs. Monitor program health and performance.
                </p>
                
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ color: '#3b82f6', marginBottom: '1rem', fontSize: '1.25rem' }}>
                    📊 Program Overview
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      <h5 style={{ color: '#93c5fd', marginBottom: '0.5rem', fontSize: '1rem' }}>📚 Lux Libris</h5>
                      <p style={{ color: '#ddd6fe', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
                        Elementary & Middle School Program (Grades 4-8)
                      </p>
                      <div style={{ color: '#a78bfa', fontSize: '0.75rem' }}>
                        Status: {programsStats?.luxLibris ? '🟢 Active' : '🔴 Inactive'}
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      <h5 style={{ color: '#93c5fd', marginBottom: '0.5rem', fontSize: '1rem' }}>🎓 Laudato Literary</h5>
                      <p style={{ color: '#ddd6fe', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
                        High School Program (Grades 9-12)
                      </p>
                      <div style={{ color: '#a78bfa', fontSize: '0.75rem' }}>
                        Status: {programsStats?.laudatoLiterary ? '🟢 Active' : '🔴 Inactive'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#f59e0b' }}>🚧 Coming Soon:</strong>
                  <span style={{ color: '#fbbf24' }}> Advanced program management features including tier adjustments, feature toggles, and usage analytics.</span>
                </div>
                
                <button
                  onClick={loadStats}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  🔄 Refresh Program Status
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
              border: '1px solid rgba(220, 38, 38, 0.3)',
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
                    {result.stats.programs_created && `Programs Created: ${result.stats.programs_created}`}
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