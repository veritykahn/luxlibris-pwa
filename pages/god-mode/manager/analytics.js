// pages/god-mode/manager/analytics.js - Analytics & Stats Management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import saintsManager from '../../../enhanced-saints-manager'
import quizzesManager from '../../../enhanced-quizzes-manager'
import booksManager from '../../../enhanced-books-manager'
import bookQuizzesManager from '../../../book-quizzes-manager'
import nomineeQuizzesManager from '../../../nominee-quizzes-manager'
import readingDnaManager from '../../../reading-dna-manager'

export default function AnalyticsManager() {
  // AUTHENTICATION STATE - Same for all managers
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // ANALYTICS MANAGER-SPECIFIC STATE
  const [activeTab, setActiveTab] = useState('analytics-overview')
  const [isLoading, setIsLoading] = useState(false)
  
  // Statistics state
  const [saintsStats, setSaintsStats] = useState(null)
  const [saintsQuizzesStats, setSaintsQuizzesStats] = useState(null)
  const [booksStats, setBooksStats] = useState(null)
  const [bookQuizzesStats, setBookQuizzesStats] = useState(null)
  const [nomineeQuizzesStats, setNomineeQuizzesStats] = useState(null)
  const [readingDnaStats, setReadingDnaStats] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  // Session timeout logic - Same for all managers
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000

  // AUTHENTICATION LOGIC - Uses analyticsManagerSession
  useEffect(() => {
    const savedMainSession = localStorage.getItem('adminDashboardSession')
    const savedManagerSession = localStorage.getItem('analyticsManagerSession')
    
    if (savedManagerSession) {
      const sessionData = JSON.parse(savedManagerSession)
      const now = Date.now()
      const timePassed = now - sessionData.lastActivity
      
      if (timePassed < SESSION_TIMEOUT) {
        setIsAuthenticated(true)
        setLastActivity(sessionData.lastActivity)
        loadAllStats() // Call init function
        return
      } else {
        localStorage.removeItem('analyticsManagerSession')
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
        loadAllStats() // Call init function
        return
      } else {
        localStorage.removeItem('adminDashboardSession')
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('analyticsManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: lastActivity
      }))
    } else {
      localStorage.removeItem('analyticsManagerSession')
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
      localStorage.setItem('analyticsManagerSession', JSON.stringify({
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
      localStorage.setItem('analyticsManagerSession', JSON.stringify({
        authenticated: true,
        lastActivity: now
      }))
      loadAllStats() // Call init function
    } else {
      alert('Invalid Manager password')
    }
  }

  // LOGOUT HANDLER - Same for all managers
  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('analyticsManagerSession')
    setLastActivity(Date.now())
  }

  const loadAllStats = async () => {
    setIsLoading(true)
    try {
      const [saints, saintsQuizzes, books, bookQuizzes, nomineeQuizzes, readingDna] = await Promise.all([
        saintsManager.getSaintsStats(),
        quizzesManager.getQuizzesStats('saints'),
        booksManager.getBooksStats(),
        bookQuizzesManager.getBookQuizzesStats(),
        nomineeQuizzesManager.getNomineeQuizzesStats(),
        readingDnaManager.getReadingDnaStats()
      ])
      
      setSaintsStats(saints)
      setSaintsQuizzesStats(saintsQuizzes)
      setBooksStats(books)
      setBookQuizzesStats(bookQuizzes)
      setNomineeQuizzesStats(nomineeQuizzes)
      setReadingDnaStats(readingDna)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // LOGIN SCREEN - Customized for Analytics Manager
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Analytics Manager - Authentication Required</title>
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
            border: '1px solid rgba(8, 145, 178, 0.3)',
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
              background: 'linear-gradient(135deg, #0891b2, #0e7490)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              📊
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Analytics Manager
            </h1>
            <p style={{
              color: '#67e8f9',
              marginBottom: '2rem'
            }}>
              Manager Access Required - Overview of all collections and data health monitoring
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
                  border: '1px solid rgba(8, 145, 178, 0.3)',
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
                background: 'linear-gradient(135deg, #0891b2, #0e7490)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📊 ENTER ANALYTICS MANAGER
            </button>
          </div>
        </div>
      </>
    )
  }

  const tabs = [
    { id: 'analytics-overview', name: 'Overview', icon: '📈' },
    { id: 'analytics-health', name: 'Data Health', icon: '🩺' }
  ]

  const getDataHealthScore = () => {
    let score = 0
    let maxScore = 0
    
    // Books health
    if (booksStats) {
      maxScore += 20
      if (booksStats.currentYear > 0) score += 12
      if (booksStats.active > 0) score += 8
    }
    
    // Saints health
    if (saintsStats) {
      maxScore += 20
      if (saintsStats.total > 50) score += 12
      if (Object.keys(saintsStats.bySeries || {}).length > 5) score += 8
    }
    
    // Saints Quizzes health
    if (saintsQuizzesStats) {
      maxScore += 15
      if (saintsQuizzesStats.total > 0) score += 15
    }
    
    // Book Quizzes health
    if (bookQuizzesStats) {
      maxScore += 15
      if (bookQuizzesStats.currentYear > 0) score += 8
      if (bookQuizzesStats.active > 0) score += 7
    }
    
    // Nominee Quizzes health
    if (nomineeQuizzesStats) {
      maxScore += 15
      if (nomineeQuizzesStats.currentYear > 0) score += 8
      if (nomineeQuizzesStats.active > 0) score += 7
    }
    
    // Reading DNA health
    if (readingDnaStats) {
      maxScore += 15
      if (readingDnaStats.questions > 0) score += 5
      if (readingDnaStats.types > 0) score += 5
      if (readingDnaStats.config?.exists) score += 5
    }
    
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  }

  const healthScore = getDataHealthScore()
  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  // MAIN MANAGER INTERFACE - Customized for Analytics Manager
  return (
    <>
      <Head>
        <title>Analytics Manager - Lux Libris God Mode</title>
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
            border: '1px solid rgba(8, 145, 178, 0.3)',
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
                background: 'linear-gradient(135deg, #0891b2, #0e7490)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                📊
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
                    : 'rgba(8, 145, 178, 0.2)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: sessionTimeRemaining <= 10 ? '#fca5a5' : '#67e8f9',
                  border: sessionTimeRemaining <= 10 
                    ? '1px solid rgba(239, 68, 68, 0.3)' 
                    : '1px solid rgba(8, 145, 178, 0.3)',
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
              📊 Analytics & Statistics
            </h1>
            <p style={{
              color: '#67e8f9',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Overview of all collections and data health monitoring
            </p>
            
            {/* Quick Stats */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '1.5rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div style={{
                background: 'rgba(8, 145, 178, 0.2)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                border: '1px solid rgba(8, 145, 178, 0.3)'
              }}>
                <span style={{ color: '#67e8f9', fontSize: '0.875rem', display: 'block' }}>Data Health</span>
                <span style={{ color: getHealthColor(healthScore), fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {healthScore}%
                </span>
              </div>
              
              {lastRefresh && (
                <div style={{
                  background: 'rgba(8, 145, 178, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(8, 145, 178, 0.3)'
                }}>
                  <span style={{ color: '#67e8f9', fontSize: '0.875rem', display: 'block' }}>Last Refresh</span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                    {lastRefresh.toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              <button
                onClick={loadAllStats}
                disabled={isLoading}
                style={{
                  background: isLoading 
                    ? 'linear-gradient(135deg, #6b7280, #4b5563)' 
                    : 'linear-gradient(135deg, #0891b2, #0e7490)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                {isLoading ? '⏳ Refreshing...' : '🔄 Refresh All Stats'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '2rem',
            border: '1px solid rgba(8, 145, 178, 0.3)'
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
                      ? 'linear-gradient(135deg, #0891b2, #0e7490)'
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
            border: '1px solid rgba(8, 145, 178, 0.3)',
            marginBottom: '2rem'
          }}>
            
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

                  {/* Nominee Quizzes Stats */}
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
                        {Object.entries(saintsStats.bySeries).slice(0, 5).map(([series, count]) => (
                          <div key={series} style={{ color: '#a78bfa', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                            {series}: {count}
                          </div>
                        ))}
                        {Object.keys(saintsStats.bySeries).length > 5 && (
                          <div style={{ color: '#c4b5fd', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            ...and {Object.keys(saintsStats.bySeries).length - 5} more series
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Saints Quizzes Stats */}
                  {saintsQuizzesStats && (
                    <div style={{
                      background: 'rgba(5, 150, 105, 0.1)',
                      border: '1px solid rgba(5, 150, 105, 0.3)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem'
                    }}>
                      <h4 style={{ color: '#6ee7b7', marginBottom: '1rem', fontSize: '1.25rem' }}>
                        📿 Saints Quizzes ({saintsQuizzesStats.total || 0} total)
                      </h4>
                      
                      <div>
                        <h5 style={{ color: '#10b981', marginBottom: '0.5rem' }}>By Series</h5>
                        {saintsQuizzesStats.bySeries && Object.entries(saintsQuizzesStats.bySeries).slice(0, 5).map(([series, count]) => (
                          <div key={series} style={{ color: '#a7f3d0', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                            {series}: {count}
                          </div>
                        ))}
                        {saintsQuizzesStats.bySeries && Object.keys(saintsQuizzesStats.bySeries).length > 5 && (
                          <div style={{ color: '#6ee7b7', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            ...and {Object.keys(saintsQuizzesStats.bySeries).length - 5} more series
                          </div>
                        )}
                        {(!saintsQuizzesStats.bySeries || Object.keys(saintsQuizzesStats.bySeries).length === 0) && (
                          <div style={{ color: '#6ee7b7', fontSize: '0.875rem' }}>No saints quizzes yet</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reading DNA Stats */}
                  {readingDnaStats && (
                    <div style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem'
                    }}>
                      <h4 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.25rem' }}>
                        🧬 Reading DNA Assessment ({readingDnaStats.total_documents || 0} documents)
                      </h4>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <h5 style={{ color: '#c4b5fd', marginBottom: '0.5rem' }}>Assessment Components</h5>
                        <div style={{ color: '#a78bfa', marginBottom: '0.25rem' }}>
                          Questions: {readingDnaStats.questions || 0}
                        </div>
                        <div style={{ color: '#a78bfa', marginBottom: '0.25rem' }}>
                          DNA Types: {readingDnaStats.types || 0}
                        </div>
                        <div style={{ color: '#a78bfa', marginBottom: '0.25rem' }}>
                          Modifiers: {readingDnaStats.modifiers || 0}
                        </div>
                      </div>
                      
                      <div>
                        <h5 style={{ color: '#c4b5fd', marginBottom: '0.5rem' }}>System Status</h5>
                        <div style={{ color: readingDnaStats.config?.exists ? '#10b981' : '#ef4444', fontSize: '0.875rem' }}>
                          Configuration: {readingDnaStats.config?.exists ? '✅ Active' : '❌ Missing'}
                        </div>
                        {readingDnaStats.config?.version && (
                          <div style={{ color: '#a78bfa', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            Version: {readingDnaStats.config.version} ({readingDnaStats.config.academic_year})
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics-health' && (
              <div>
                <h3 style={{ color: '#0891b2', marginBottom: '2rem', fontSize: '1.5rem' }}>
                  🩺 Data Health Analysis
                </h3>
                
                <div style={{
                  background: `rgba(${healthScore >= 80 ? '16, 185, 129' : healthScore >= 60 ? '245, 158, 11' : '239, 68, 68'}, 0.1)`,
                  border: `1px solid rgba(${healthScore >= 80 ? '16, 185, 129' : healthScore >= 60 ? '245, 158, 11' : '239, 68, 68'}, 0.3)`,
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '1rem'
                  }}>
                    {healthScore >= 80 ? '🟢' : healthScore >= 60 ? '🟡' : '🔴'}
                  </div>
                  <h4 style={{ 
                    color: getHealthColor(healthScore), 
                    marginBottom: '0.5rem', 
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}>
                    {healthScore}%
                  </h4>
                  <p style={{ 
                    color: getHealthColor(healthScore), 
                    fontSize: '1.25rem',
                    margin: 0
                  }}>
                    {healthScore >= 80 ? 'Excellent Data Health' : 
                     healthScore >= 60 ? 'Good Data Health' : 
                     'Needs Attention'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Books Health */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <h5 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1.125rem' }}>📚 Books Health</h5>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#fcd34d' }}>Current Year Books: </span>
                      <span style={{ color: booksStats?.currentYear > 0 ? '#10b981' : '#ef4444' }}>
                        {booksStats?.currentYear > 0 ? '✅' : '❌'} {booksStats?.currentYear || 0}
                      </span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#fcd34d' }}>Active Books: </span>
                      <span style={{ color: booksStats?.active > 0 ? '#10b981' : '#ef4444' }}>
                        {booksStats?.active > 0 ? '✅' : '❌'} {booksStats?.active || 0}
                      </span>
                    </div>
                  </div>

                  {/* Saints Health */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(124, 58, 237, 0.3)'
                  }}>
                    <h5 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.125rem' }}>👼 Saints Health</h5>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#c4b5fd' }}>Total Saints: </span>
                      <span style={{ color: saintsStats?.total > 50 ? '#10b981' : '#ef4444' }}>
                        {saintsStats?.total > 50 ? '✅' : '❌'} {saintsStats?.total || 0}
                      </span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#c4b5fd' }}>Series Count: </span>
                      <span style={{ color: Object.keys(saintsStats?.bySeries || {}).length > 5 ? '#10b981' : '#ef4444' }}>
                        {Object.keys(saintsStats?.bySeries || {}).length > 5 ? '✅' : '❌'} {Object.keys(saintsStats?.bySeries || {}).length}
                      </span>
                    </div>
                  </div>

                  {/* Saints Quizzes Health */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(5, 150, 105, 0.3)'
                  }}>
                    <h5 style={{ color: '#6ee7b7', marginBottom: '1rem', fontSize: '1.125rem' }}>📿 Saints Quizzes Health</h5>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#a7f3d0' }}>Total Quizzes: </span>
                      <span style={{ color: saintsQuizzesStats?.total > 0 ? '#10b981' : '#ef4444' }}>
                        {saintsQuizzesStats?.total > 0 ? '✅' : '❌'} {saintsQuizzesStats?.total || 0}
                      </span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#a7f3d0' }}>Series Coverage: </span>
                      <span style={{ color: Object.keys(saintsQuizzesStats?.bySeries || {}).length > 3 ? '#10b981' : '#ef4444' }}>
                        {Object.keys(saintsQuizzesStats?.bySeries || {}).length > 3 ? '✅' : '❌'} {Object.keys(saintsQuizzesStats?.bySeries || {}).length}
                      </span>
                    </div>
                  </div>

                  {/* Reading DNA Health */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}>
                    <h5 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.125rem' }}>🧬 Reading DNA Health</h5>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#c4b5fd' }}>Assessment Questions: </span>
                      <span style={{ color: readingDnaStats?.questions > 0 ? '#10b981' : '#ef4444' }}>
                        {readingDnaStats?.questions > 0 ? '✅' : '❌'} {readingDnaStats?.questions || 0}
                      </span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#c4b5fd' }}>DNA Types: </span>
                      <span style={{ color: readingDnaStats?.types > 0 ? '#10b981' : '#ef4444' }}>
                        {readingDnaStats?.types > 0 ? '✅' : '❌'} {readingDnaStats?.types || 0}
                      </span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#c4b5fd' }}>Configuration: </span>
                      <span style={{ color: readingDnaStats?.config?.exists ? '#10b981' : '#ef4444' }}>
                        {readingDnaStats?.config?.exists ? '✅' : '❌'} {readingDnaStats?.config?.exists ? 'Active' : 'Missing'}
                      </span>
                    </div>
                  </div>

                  {/* Nominee Quizzes Health */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(249, 115, 22, 0.3)'
                  }}>
                    <h5 style={{ color: '#fb923c', marginBottom: '1rem', fontSize: '1.125rem' }}>🏆 Nominee Quizzes Health</h5>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#fed7aa' }}>Current Year: </span>
                      <span style={{ color: nomineeQuizzesStats?.currentYear > 0 ? '#10b981' : '#ef4444' }}>
                        {nomineeQuizzesStats?.currentYear > 0 ? '✅' : '❌'} {nomineeQuizzesStats?.currentYear || 0}
                      </span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#fed7aa' }}>Active Quizzes: </span>
                      <span style={{ color: nomineeQuizzesStats?.active > 0 ? '#10b981' : '#ef4444' }}>
                        {nomineeQuizzesStats?.active > 0 ? '✅' : '❌'} {nomineeQuizzesStats?.active || 0}
                      </span>
                    </div>
                  </div>

                  {/* Book Quizzes Health */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}>
                    <h5 style={{ color: '#a78bfa', marginBottom: '1rem', fontSize: '1.125rem' }}>🎯 Book Quizzes Health</h5>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#c4b5fd' }}>Current Year: </span>
                      <span style={{ color: bookQuizzesStats?.currentYear > 0 ? '#10b981' : '#ef4444' }}>
                        {bookQuizzesStats?.currentYear > 0 ? '✅' : '❌'} {bookQuizzesStats?.currentYear || 0}
                      </span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ color: '#c4b5fd' }}>Active Quizzes: </span>
                      <span style={{ color: bookQuizzesStats?.active > 0 ? '#10b981' : '#ef4444' }}>
                        {bookQuizzesStats?.active > 0 ? '✅' : '❌'} {bookQuizzesStats?.active || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginTop: '2rem'
                }}>
                  <h4 style={{ color: '#3b82f6', marginBottom: '1rem', fontSize: '1.25rem' }}>
                    💡 Health Recommendations
                  </h4>
                  <ul style={{ color: '#93c5fd', lineHeight: '1.6', margin: 0, paddingLeft: '1.5rem' }}>
                    {booksStats?.currentYear === 0 && (
                      <li>Add book nominees for the current academic year (2025-26)</li>
                    )}
                    {saintsStats?.total < 50 && (
                      <li>Consider adding more saints to reach a healthy collection size</li>
                    )}
                    {nomineeQuizzesStats?.currentYear === 0 && (
                      <li>Set up nominee quizzes for book matching functionality</li>
                    )}
                    {saintsQuizzesStats?.total === 0 && (
                      <li>Import saints quizzes to enable quiz functionality</li>
                    )}
                    {readingDnaStats?.questions === 0 && (
                      <li>Set up Reading DNA Assessment for student personality profiling</li>
                    )}
                    {readingDnaStats?.config && !readingDnaStats.config.exists && (
                      <li>Configure Reading DNA Assessment system settings</li>
                    )}
                    {healthScore >= 80 && (
                      <li style={{ color: '#10b981' }}>🎉 Excellent! Your data health is optimal for production use.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid rgba(8, 145, 178, 0.3)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '1rem'
              }}>
                ⏳
              </div>
              <h3 style={{
                color: 'white',
                marginBottom: '0.5rem',
                fontSize: '1.25rem'
              }}>
                Loading Analytics Data...
              </h3>
              <p style={{
                color: '#67e8f9',
                margin: 0
              }}>
                Gathering statistics from all collections
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}