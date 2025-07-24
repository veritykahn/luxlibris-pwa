// components/parent/dna-lab/DNALabHeader.js - UPDATED WITH PREMIUM INTEGRATION
import { useState } from 'react'
import { luxTheme } from '../../../utils/theme'
import NavigationMenu from './NavigationMenu'

// UPDATED - Added isPilotPhase parameter
export default function DNALabHeader({ onBack, isPilotPhase = false }) {
  const [showNavMenu, setShowNavMenu] = useState(false)
  
  return (
    <div style={{
      background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
      backdropFilter: 'blur(20px)',
      padding: '30px 20px 12px',
      position: 'relative',
      borderRadius: '0 0 25px 25px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          left: '20px',
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
        ←
      </button>

      {/* Centered Title - UPDATED with premium badge */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <h1 style={{
          fontSize: 'clamp(20px, 5vw, 24px)',
          fontWeight: '400',
          color: luxTheme.textPrimary,
          margin: '0',
          letterSpacing: '1px',
          fontFamily: 'Didot, "Times New Roman", serif'
        }}>
          Family DNA Lab
        </h1>
        {/* Premium Badge */}
        {isPilotPhase && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-16px',
            backgroundColor: '#10B981',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: '600'
          }}>
            PILOT
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <NavigationMenu
        showMenu={showNavMenu}
        setShowMenu={setShowNavMenu}
      />
    </div>
  )
}