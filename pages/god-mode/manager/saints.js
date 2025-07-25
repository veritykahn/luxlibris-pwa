// pages/god-mode/manager/saints.js - Saints Management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import saintsManager from '../../../enhanced-saints-manager'

export default function SaintsManager() {
  // AUTHENTICATION STATE - Same for all managers
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // SAINTS MANAGER-SPECIFIC STATE
  const [activeTab, setActiveTab] = useState('saints-bulk')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Statistics state
  const [saintsStats, setSaintsStats] = useState(null)
  
  // Form state
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

  // Session timeout logic - Same for all managers
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // AUTHENTICATION LOGIC - Uses saintsManagerSession
  useEffect(() => {
    const savedMainSession = localStorage.getItem('adminDashboardSession')
    const savedManagerSession = localStorage.getItem('saintsManagerSession')
    
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
        localStorage.removeItem('saintsManagerSession')
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
      localStorage.setItem('saintsManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('saintsManagerSession')
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
      localStorage.setItem('saintsManagerSession', JSON.stringify({
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
      localStorage.setItem('saintsManagerSession', JSON.stringify({
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
    localStorage.removeItem('saintsManagerSession')
    setLastActivity(Date.now())
  }

  const loadStats = async () => {
    try {
      const stats = await saintsManager.getSaintsStats()
      setSaintsStats(stats)
    } catch (error) {
      console.error('Error loading saints stats:', error)
    }
  }

  // LOGIN SCREEN - Customized for Saints Manager
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Saints Manager - Authentication Required</title>
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
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              👼
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Saints Manager
            </h1>
            <p style={{
              color: '#c4b5fd',
              marginBottom: '2rem'
            }}>
              Manager Access Required - Saints collection, series, and Luxlings management
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
              👼 ENTER SAINTS MANAGER
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

  const handleSaintFormChange = (field, value) => {
    setNewSaintForm(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'saints-bulk', name: 'Bulk Setup', icon: '🏗️' },
    { id: 'saints-addNew', name: 'Add New Saints', icon: '➕' },
    { id: 'saints-addSingle', name: 'Add Single Saint', icon: '👤' }
  ]

  const seriesOptions = [
    'Halo Hatchlings', 'Contemplative Cuties', 'Founder Flames', 'Pocket Patrons',
    'Super Sancti', 'Sacred Circle', 'Learning Legends', 'Culture Carriers',
    'Regal Royals', 'Heavenly Helpers', 'Desert Disciples', 'Virtue Vignettes',
    'Apostolic All-Stars', 'Mini Marians', 'Faithful Families', 'Cherub Chibis'
  ]

  const rarityOptions = ['common', 'uncommon', 'rare', 'legendary']

  // MAIN MANAGER INTERFACE - Customized for Saints Manager
  return (
    <>
      <Head>
        <title>Saints Manager - Lux Libris God Mode</title>
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
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                👼
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
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 1rem',
              fontFamily: 'Georgia, serif'
            }}>
              👼 Saints Management
            </h1>
            <p style={{
              color: '#c4b5fd',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Saints collection, series, and Luxlings management
            </p>
            
            {/* Quick Stats */}
            {saintsStats && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  background: 'rgba(124, 58, 237, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(124, 58, 237, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Total Saints</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{saintsStats.total}</span>
                </div>
                <div style={{
                  background: 'rgba(124, 58, 237, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(124, 58, 237, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Common</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{saintsStats.byRarity?.common || 0}</span>
                </div>
                <div style={{
                  background: 'rgba(124, 58, 237, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(124, 58, 237, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Rare</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{saintsStats.byRarity?.rare || 0}</span>
                </div>
                <div style={{
                  background: 'rgba(124, 58, 237, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(124, 58, 237, 0.3)'
                }}>
                  <span style={{ color: '#a78bfa', fontSize: '0.875rem', display: 'block' }}>Legendary</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{saintsStats.byRarity?.legendary || 0}</span>
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
            border: '1px solid rgba(124, 58, 237, 0.3)'
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
                      ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
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
            border: '1px solid rgba(124, 58, 237, 0.3)',
            marginBottom: '2rem'
          }}>
            
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
                      Feast Day
                    </label>
                    <input
                      type="text"
                      value={newSaintForm.feast_day}
                      onChange={(e) => handleSaintFormChange('feast_day', e.target.value)}
                      placeholder="January 1"
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
                      Rarity
                    </label>
                    <select
                      value={newSaintForm.rarity}
                      onChange={(e) => handleSaintFormChange('rarity', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white'
                      }}
                    >
                      {rarityOptions.map(rarity => (
                        <option key={rarity} value={rarity}>{rarity}</option>
                      ))}
                    </select>
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
                  
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: '#c4b5fd', display: 'block', marginBottom: '0.5rem' }}>
                      Short Blurb
                    </label>
                    <textarea
                      value={newSaintForm.short_blurb}
                      onChange={(e) => handleSaintFormChange('short_blurb', e.target.value)}
                      placeholder="A brief description of this saint..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        resize: 'vertical'
                      }}
                    />
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
                    cursor: (isRunning || !newSaintForm.name || !newSaintForm.patronage) ? 'not-allowed' : 'pointer',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isRunning ? '⏳ Adding...' : '👤 Add Single Saint'}
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
              border: '1px solid rgba(124, 58, 237, 0.3)',
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