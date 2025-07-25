// pages/god-mode/manager/index.js - Main God Mode Navigation (UPDATED with Reading DNA)
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function GodModeIndex() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(120)
  
  // Session timeout logic
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
    } else {
      alert('Invalid admin password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
    localStorage.removeItem('adminDashboardSession')
    setLastActivity(Date.now())
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Lux Libris God Mode - Authentication Required</title>
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
              ⚡
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Lux Libris God Mode
            </h1>
            <p style={{
              color: '#c4b5fd',
              marginBottom: '2rem'
            }}>
              Administrator Access Required - Ultimate System Control
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Enter God Mode Password"
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
              ⚡ ENTER GOD MODE
            </button>
          </div>
        </div>
      </>
    )
  }

  // Manager pages available - UPDATED with Reading DNA
  const managers = [
    { 
      id: 'books', 
      name: 'Books', 
      icon: '📚', 
      color: '#f59e0b',
      description: 'Book nominees & archiving',
      href: '/god-mode/manager/books'
    },
    { 
      id: 'nominee-quizzes', 
      name: 'Nominee Quizzes', 
      icon: '🏆', 
      color: '#f97316',
      description: 'Personality quizzes',
      href: '/god-mode/manager/nominee-quizzes'
    },
    { 
      id: 'book-quizzes', 
      name: 'Book Quizzes', 
      icon: '🎯', 
      color: '#8b5cf6',
      description: 'Book-specific quizzes',
      href: '/god-mode/manager/book-quizzes'
    },
    { 
      id: 'saints', 
      name: 'Saints', 
      icon: '👼', 
      color: '#7c3aed',
      description: 'Saints & Luxlings',
      href: '/god-mode/manager/saints'
    },
    { 
      id: 'quizzes', 
      name: 'Lux DNA', 
      icon: '🧩', 
      color: '#059669',
      description: 'DNA quiz system',
      href: '/god-mode/manager/quizzes'
    },
    { 
      id: 'reading-dna', 
      name: 'Reading DNA', 
      icon: '🧬', 
      color: '#8b5cf6',
      description: 'Student reading assessment',
      href: '/god-mode/manager/reading-dna'
    },
    { 
    id: 'parent-dna', 
    name: 'Parent DNA', 
    icon: '👨‍👩‍👧‍👦', 
    color: '#8b5cf6',
    description: 'Parent assessment & compatibility',
    href: '/god-mode/manager/parent-dna'
  },
    { 
      id: 'programs', 
      name: 'Programs', 
      icon: '⚙️', 
      color: '#dc2626',
      description: 'Program setup',
      href: '/god-mode/manager/programs'
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: '📊', 
      color: '#0891b2',
      description: 'Stats & health',
      href: '/god-mode/manager/analytics'
    }
  ]

  return (
    <>
      <Head>
        <title>Lux Libris God Mode - Manager Selection</title>
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
            marginBottom: '3rem',
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
                ⚡
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
              fontSize: '3.5rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 1rem',
              fontFamily: 'Georgia, serif'
            }}>
              ⚡ Lux Libris God Mode ⚡
            </h1>
            <p style={{
              color: '#c4b5fd',
              fontSize: '1.25rem',
              marginBottom: '0'
            }}>
              Ultimate System Control - Choose Your Manager
            </p>
          </div>

          {/* UPDATED: Manager Grid Layout with Reading DNA */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            {managers.map(manager => (
              <Link key={manager.id} href={manager.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: `1px solid ${manager.color}40`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: '160px',
                  height: '170px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 10px 30px ${manager.color}30`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                >
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: `linear-gradient(135deg, ${manager.color}, ${manager.color}dd)`,
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}>
                    {manager.icon}
                  </div>
                  
                  <h3 style={{
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    margin: '0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    {manager.name}
                  </h3>
                  
                  <p style={{
                    color: '#c4b5fd',
                    fontSize: '0.7rem',
                    lineHeight: '1.1',
                    margin: '0',
                    textAlign: 'center'
                  }}>
                    {manager.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: manager.color,
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    <span>Launch</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Info */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: '1rem',
            padding: '2rem',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: '#c4b5fd',
              fontSize: '1.25rem',
              margin: '0 0 1rem',
              fontWeight: '600'
            }}>
              ⚡ God Mode Active
            </h3>
            <p style={{
              color: '#a78bfa',
              fontSize: '1rem',
              margin: '0',
              lineHeight: '1.6'
            }}>
              You have administrator access to all Lux Libris systems. 
              Each manager provides specialized tools for different aspects of the platform.
              Session expires in {sessionTimeRemaining} minutes.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}