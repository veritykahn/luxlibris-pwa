// components/god-mode/GodModeHeader.js
import Link from 'next/link'

export default function GodModeHeader({ 
  title, 
  icon = '👑', 
  sessionTimeRemaining, 
  onLogout,
  showDashboardButton = true,
  showManagerButton = true 
}) {
  return (
    <header style={{
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
      padding: '1rem 0'
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            {icon}
          </div>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              fontFamily: 'Georgia, serif'
            }}>
              {title}
            </h1>
            <p style={{
              color: '#c084fc',
              fontSize: '0.875rem',
              margin: 0
            }}>
              God Mode System Control
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Navigation Buttons */}
          {showDashboardButton && (
            <Link href="/god-mode" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                🏠 Dashboard
              </button>
            </Link>
          )}
          
          {showManagerButton && (
            <Link href="/god-mode/manager" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ⚡ Manager Tools
              </button>
            </Link>
          )}
          
          {/* Session Timer */}
          <div style={{
            padding: '0.5rem 1rem',
            background: sessionTimeRemaining <= 10 
              ? 'rgba(239, 68, 68, 0.2)' 
              : 'rgba(168, 85, 247, 0.2)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: sessionTimeRemaining <= 10 ? '#fca5a5' : '#c084fc',
            border: sessionTimeRemaining <= 10 
              ? '1px solid rgba(239, 68, 68, 0.3)' 
              : '1px solid rgba(168, 85, 247, 0.3)',
            fontWeight: '600'
          }}>
            ⏰ Session: {sessionTimeRemaining} minutes
          </div>
          
          <button
            onClick={onLogout}
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
    </header>
  )
}