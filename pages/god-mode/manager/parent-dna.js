// pages/god-mode/manager/parent-dna.js - Parent DNA Management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import parentDnaManager from '../../../complete-parent-dna-firebase-manager'

export default function ParentDnaManager() {
  // Authentication State - Following your exact pattern
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // Dashboard State
  const [activeTab, setActiveTab] = useState('parent-dna-overview')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Statistics state
  const [parentDnaStats, setParentDnaStats] = useState(null)
  const [validationResult, setValidationResult] = useState(null)

  // Session timeout logic - Same as your books manager
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  useEffect(() => {
    const savedMainSession = localStorage.getItem('adminDashboardSession')
    const savedManagerSession = localStorage.getItem('parentDnaManagerSession')
    
    if (savedManagerSession) {
      const sessionData = JSON.parse(savedManagerSession)
      const now = Date.now()
      const timePassed = now - sessionData.lastActivity
      
      if (timePassed < SESSION_TIMEOUT) {
        setIsAuthenticated(true)
        setLastActivity(sessionData.lastActivity)
        loadStats()
        return
      } else {
        localStorage.removeItem('parentDnaManagerSession')
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
        loadStats()
        return
      } else {
        localStorage.removeItem('adminDashboardSession')
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('parentDnaManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('parentDnaManagerSession')
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
      localStorage.setItem('parentDnaManagerSession', JSON.stringify({
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
    if (password === 'LUXLIBRISPARENT') {
      const now = Date.now()
      setIsAuthenticated(true)
      setLastActivity(now)
      localStorage.setItem('parentDnaManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: now
      }))
      loadStats()
    } else {
      alert('Invalid Parent DNA Manager password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('parentDnaManagerSession')
    setLastActivity(Date.now())
  }

  const loadStats = async () => {
    try {
      const stats = await parentDnaManager.getCompleteParentDnaStats()
      setParentDnaStats(stats)
      
      const validation = await parentDnaManager.validateParentDnaSetup()
      setValidationResult(validation)
    } catch (error) {
      console.error('Error loading parent DNA stats:', error)
    }
  }

  // Login screen - Following your exact pattern
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Parent DNA Manager - Authentication Required</title>
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
              Parent DNA Manager
            </h1>
            <p style={{
              color: '#c4b5fd',
              marginBottom: '2rem'
            }}>
              Manager Access Required - Parent Assessment System
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Enter Parent DNA Manager Password"
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
              🧬 ENTER PARENT DNA MANAGER
            </button>
          </div>
        </div>
      </>
    )
  }

  // Enhanced console logging system - Same as yours
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
        case 'parent-dna-setup-complete':
          console.log('🚀 Setting up Complete Parent DNA System...')
          setupResult = await parentDnaManager.setupCompleteParentDnaSystem()
          break
          
        case 'parent-dna-validate':
          console.log('🔍 Validating Parent DNA System...')
          setupResult = await parentDnaManager.validateParentDnaSetup()
          break
          
        case 'parent-dna-get-assessment':
          console.log('📝 Loading Parent DNA Assessment...')
          const assessment = await parentDnaManager.getParentDnaAssessment()
          setupResult = { 
            success: true, 
            message: `Assessment loaded with ${assessment.questions.length} questions`,
            stats: { questions: assessment.questions.length, operation: 'assessment_load' }
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

  const tabs = [
    { id: 'parent-dna-overview', name: 'System Overview', icon: '📊' },
    { id: 'parent-dna-setup', name: 'Complete Setup', icon: '🚀' },
    { id: 'parent-dna-validate', name: 'Validate System', icon: '🔍' },
    { id: 'parent-dna-test', name: 'Test Assessment', icon: '📝' }
  ]

  return (
    <>
      <Head>
        <title>Parent DNA Manager - Lux Libris God Mode</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #581c87 75%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
          
          {/* Header - Following your exact pattern */}
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
              🧬 Parent DNA Management
            </h1>
            <p style={{
              color: '#c4b5fd',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Parent Assessment System & Compatibility Matrix
            </p>
            
            {/* Quick Stats */}
            {parentDnaStats && (
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
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Total Documents</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{parentDnaStats.total_documents}</span>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Questions</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{parentDnaStats.questions}</span>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Parent Types</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{parentDnaStats.parent_types}</span>
                </div>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Compatibility Pairs</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{parentDnaStats.compatibility_pairs}</span>
                </div>
                <div style={{
                  background: validationResult?.isValid 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: `1px solid ${validationResult?.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  <span style={{ 
                    color: validationResult?.isValid ? '#6ee7b7' : '#fca5a5', 
                    fontSize: '0.875rem', 
                    display: 'block' 
                  }}>System Status</span>
                  <span style={{ 
                    color: '#fff', 
                    fontWeight: 'bold', 
                    fontSize: '1.25rem' 
                  }}>
                    {validationResult?.isValid ? '✅ Valid' : '❌ Invalid'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs - Following your exact pattern */}
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
            
            {activeTab === 'parent-dna-overview' && (
              <div>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  📊 Parent DNA System Overview
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Complete overview of the Parent DNA Assessment System including psychology profiles, 
                  comprehensive toolkits, and parent-child compatibility matrix.
                </p>
                
                {parentDnaStats && (
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    <h4 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.25rem' }}>
                      🧬 System Statistics
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>Total Documents</span>
                        <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '1.5rem' }}>{parentDnaStats.total_documents}</span>
                      </div>
                      <div>
                        <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>Assessment Questions</span>
                        <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '1.5rem' }}>{parentDnaStats.questions}</span>
                      </div>
                      <div>
                        <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>Parent Types</span>
                        <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '1.5rem' }}>{parentDnaStats.parent_types}</span>
                      </div>
                      <div>
                        <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>Compatibility Pairs</span>
                        <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '1.5rem' }}>{parentDnaStats.compatibility_pairs}</span>
                      </div>
                      <div>
                        <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>Guidance Items</span>
                        <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '1.5rem' }}>{parentDnaStats.guidance_items}</span>
                      </div>
                      <div>
                        <span style={{ color: '#c4b5fd', display: 'block', fontSize: '0.875rem' }}>System Version</span>
                        <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '1.5rem' }}>{parentDnaStats.version || 'Not Set'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {validationResult && (
                  <div style={{
                    background: validationResult.isValid 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${validationResult.isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    <h4 style={{ 
                      color: validationResult.isValid ? '#10b981' : '#ef4444', 
                      marginBottom: '1rem', 
                      fontSize: '1.25rem' 
                    }}>
                      {validationResult.isValid ? '✅ System Validation' : '❌ System Issues'}
                    </h4>
                    <p style={{ 
                      color: validationResult.isValid ? '#6ee7b7' : '#fca5a5',
                      marginBottom: '1rem'
                    }}>
                      {validationResult.summary}
                    </p>
                    
                    {validationResult.issues && validationResult.issues.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <strong style={{ color: '#ef4444' }}>Issues Found:</strong>
                        <ul style={{ color: '#fca5a5', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                          {validationResult.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {validationResult.recommendations && validationResult.recommendations.length > 0 && (
                      <div>
                        <strong style={{ color: '#3b82f6' }}>Recommendations:</strong>
                        <ul style={{ color: '#93c5fd', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                          {validationResult.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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

            {activeTab === 'parent-dna-setup' && (
              <div>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  🚀 Complete Parent DNA System Setup
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Import the complete Parent DNA system including assessment questions, integrated parent types 
                  (psychology + toolkit), parent-child compatibility matrix, and guidance content.
                </p>
                
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <h4 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1.25rem' }}>
                    🧬 What This Setup Includes:
                  </h4>
                  <ul style={{ color: '#6ee7b7', lineHeight: '1.6', margin: 0, paddingLeft: '1.5rem' }}>
                    <li><strong>9 Assessment Questions:</strong> Psychology-based parent assessment</li>
                    <li><strong>6 Integrated Parent Types:</strong> Complete psychology profiles + comprehensive toolkits</li>
                    <li><strong>36+ Compatibility Pairs:</strong> Realistic parent-child compatibility insights</li>
                    <li><strong>6 Child Type Guidance:</strong> How parents can support each child DNA type</li>
                    <li><strong>8 Modifier Guidance:</strong> Support strategies for child modifiers</li>
                    <li><strong>Configuration:</strong> System settings and metadata</li>
                  </ul>
                </div>

                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#3b82f6' }}>ℹ️ Integration Features:</strong>
                  <span style={{ color: '#93c5fd' }}> Each parent type includes both psychological insights AND comprehensive practical toolkits</span>
                </div>
                
                <button
                  onClick={() => runOperation('parent-dna-setup-complete')}
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
                  {isRunning ? '⏳ Setting up...' : '🚀 Setup Complete Parent DNA System'}
                </button>
              </div>
            )}

            {activeTab === 'parent-dna-validate' && (
              <div>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  🔍 Validate Parent DNA System
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Validate the Parent DNA system setup and check for any issues or missing components.
                </p>
                
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#3b82f6' }}>🔍 Validation Checks:</strong>
                  <span style={{ color: '#93c5fd' }}> Document counts, data integrity, version info, and system completeness</span>
                </div>
                
                <button
                  onClick={() => runOperation('parent-dna-validate')}
                  disabled={isRunning}
                  style={{
                    background: isRunning 
                      ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                      : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isRunning ? '⏳ Validating...' : '🔍 Validate System'}
                </button>
              </div>
            )}

            {activeTab === 'parent-dna-test' && (
              <div>
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1.5rem' }}>
                  📝 Test Parent DNA Assessment
                </h3>
                <p style={{ color: '#c4b5fd', marginBottom: '2rem' }}>
                  Test loading the Parent DNA assessment questions to verify the system is working correctly.
                </p>
                
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '2rem'
                }}>
                  <strong style={{ color: '#10b981' }}>✅ Test Process:</strong>
                  <span style={{ color: '#6ee7b7' }}> Loads assessment questions and verifies data structure</span>
                </div>
                
                <button
                  onClick={() => runOperation('parent-dna-get-assessment')}
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
                  {isRunning ? '⏳ Testing...' : '📝 Test Assessment Loading'}
                </button>
              </div>
            )}
          </div>

          {/* Live Logs - Same pattern as your books manager */}
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

          {/* Results - Same pattern as your books manager */}
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
                color: result.success ? '#6ee7b7' : '#fca5a5',
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
                  <div style={{ color: '#6ee7b7', fontSize: '0.875rem' }}>
                    {result.stats.operation === 'complete_parent_system_setup' && (
                      <>
                        Total documents: {result.stats.total_documents}<br/>
                        Questions: {result.stats.questions}<br/>
                        Parent types: {result.stats.parent_types}<br/>
                        Compatibility pairs: {result.stats.compatibility_pairs}<br/>
                        Integration complete: {result.stats.integration_complete ? '✅' : '❌'}<br/>
                        Version: {result.stats.version}
                      </>
                    )}
                    {result.stats.operation === 'assessment_load' && `Questions loaded: ${result.stats.questions}`}
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