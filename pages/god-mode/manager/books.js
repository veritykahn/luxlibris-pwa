// pages/god-mode/manager/books.js - Books Management (FIXED)
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import booksManager from '../../../enhanced-books-manager'

export default function BooksManager() {
  // Authentication State - FIXED: Independent authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // Dashboard State
  const [activeTab, setActiveTab] = useState('books-current-year')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  
  // Statistics state
  const [booksStats, setBooksStats] = useState(null)
  
  // Form state
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

  // Session timeout logic
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // FIXED: Check for both main session AND individual manager authentication
  useEffect(() => {
    const savedMainSession = localStorage.getItem('adminDashboardSession')
    const savedManagerSession = localStorage.getItem('booksManagerSession')
    
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
        localStorage.removeItem('booksManagerSession')
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
      localStorage.setItem('booksManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('booksManagerSession')
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
      localStorage.setItem('booksManagerSession', JSON.stringify({
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

  // FIXED: Independent login for Books Manager
  const handleLogin = () => {
    if (password === 'LUXLIBRISSAINT') {
      const now = Date.now()
      setIsAuthenticated(true)
      setLastActivity(now)
      localStorage.setItem('booksManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: now
      }))
      loadStats()
    } else {
      alert('Invalid Books Manager password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('booksManagerSession')
    setLastActivity(Date.now())
  }

  const loadStats = async () => {
    try {
      const stats = await booksManager.getBooksStats()
      setBooksStats(stats)
    } catch (error) {
      console.error('Error loading books stats:', error)
    }
  }

  // FIXED: Show login screen instead of redirect
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Books Manager - Authentication Required</title>
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
            border: '1px solid rgba(245, 158, 11, 0.3)',
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
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              📚
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Books Manager
            </h1>
            <p style={{
              color: '#fcd34d',
              marginBottom: '2rem'
            }}>
              Manager Access Required - Book Management System
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Enter Books Manager Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
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
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📚 ENTER BOOKS MANAGER
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

  const handleBookFormChange = (field, value) => {
    setNewBookForm(prev => ({ ...prev, [field]: value }))
  }

  const tabs = [
    { id: 'books-current-year', name: 'Current Year (2025-26)', icon: '📅' },
    { id: 'books-add-nominees', name: 'Add Current Year Nominees', icon: '➕' },
    { id: 'books-archive', name: 'Archive Previous Year', icon: '📦' },
    { id: 'books-add-single', name: 'Add Single Book', icon: '📖' },
    { id: 'books-setup', name: 'Setup Status Field', icon: '🚀' }
  ]

  return (
    <>
      <Head>
        <title>Books Manager - Lux Libris God Mode</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #581c87 75%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(245, 158, 11, 0.3)',
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
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                📚
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
                    : 'rgba(245, 158, 11, 0.2)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: sessionTimeRemaining <= 10 ? '#fca5a5' : '#fcd34d',
                  border: sessionTimeRemaining <= 10 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : '1px solid rgba(245, 158, 11, 0.3)',
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
              📚 Books Management
            </h1>
            <p style={{
              color: '#fcd34d',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Manage book nominees, academic years, and archiving
            </p>
            
            {/* Quick Stats */}
            {booksStats && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <span style={{ color: '#fbbf24', fontSize: '0.875rem', display: 'block' }}>Current Year (2025-26)</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{booksStats.currentYear}</span>
                </div>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <span style={{ color: '#fbbf24', fontSize: '0.875rem', display: 'block' }}>Total Books</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{booksStats.total}</span>
                </div>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <span style={{ color: '#fbbf24', fontSize: '0.875rem', display: 'block' }}>Active Books</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{booksStats.active}</span>
                </div>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <span style={{ color: '#fbbf24', fontSize: '0.875rem', display: 'block' }}>Archived Books</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.25rem' }}>{booksStats.archived}</span>
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
            border: '1px solid rgba(245, 158, 11, 0.3)'
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
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
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

          {/* Main Content Area - Rest of the component remains the same... */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '2rem'
          }}>
            
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
                  onClick={loadStats}
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
                  <span style={{ color: '#a7f3d0' }}> Books will be added with academicYear: &quot;2025-26&quot; and status: &quot;active&quot;</span>
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
                  This marks them as &quot;archived&quot; status but keeps them in the database.
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
                    <li><strong>Adds Status Field:</strong> Sets all existing books to &quot;active&quot;</li>
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
          </div>

          {/* Live Logs */}
          {logs.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgba(245, 158, 11, 0.3)',
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