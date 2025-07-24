// components/parent/dna-lab/NavigationMenu.js
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { luxTheme } from '../../../utils/theme'

export default function NavigationMenu({ showMenu, setShowMenu }) {
  const router = useRouter()

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family DNA Lab', path: '/parent/dna-lab', icon: '⬢', current: true },
    { name: 'Quiz Unlock Center', path: '/parent/quiz-unlock', icon: '▦' },
    { name: 'Family Celebrations', path: '/parent/celebrations', icon: '♔' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [])

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.current) return
    
    setShowMenu(false)
    
    setTimeout(() => {
      router.push(item.path)
    }, 100)
  }

  // Close nav menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.nav-menu-container')) {
        setShowMenu(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showMenu) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showMenu, setShowMenu])

  return (
    <div className="nav-menu-container" style={{ position: 'absolute', right: '20px' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          backgroundColor: 'rgba(255,255,255,0.3)',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          cursor: 'pointer',
          color: luxTheme.textPrimary,
          backdropFilter: 'blur(10px)',
          flexShrink: 0,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        ☰
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '0',
          backgroundColor: luxTheme.surface,
          borderRadius: '12px',
          minWidth: '200px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${luxTheme.primary}60`,
          overflow: 'hidden',
          zIndex: 9999
        }}>
          {navMenuItems.map((item, index) => (
            <button
              key={item.path}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleNavigation(item)
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: item.current ? `${luxTheme.primary}30` : 'transparent',
                border: 'none',
                borderBottom: index < navMenuItems.length - 1 ? `1px solid ${luxTheme.primary}40` : 'none',
                cursor: item.current ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: luxTheme.textPrimary,
                fontWeight: item.current ? '600' : '500',
                textAlign: 'left',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!item.current) {
                  e.target.style.backgroundColor = `${luxTheme.primary}20`
                }
              }}
              onMouseLeave={(e) => {
                if (!item.current) {
                  e.target.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.name}</span>
              {item.current && (
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: luxTheme.primary }}>●</span>
              )}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .nav-menu-container > div {
            right: 10px !important;
            minWidth: 180px !important;
          }
        }

        @media (max-width: 480px) {
          .nav-menu-container > div {
            right: 5px !important;
            minWidth: 160px !important;
          }
        }
      `}</style>
    </div>
  )
}