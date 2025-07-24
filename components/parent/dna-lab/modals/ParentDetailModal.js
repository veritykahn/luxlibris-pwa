// components/parent/dna-lab/modals/ParentDetailModal.js - COMPLETE ENHANCED VERSION
import { useState, useMemo, useCallback } from 'react'
import { luxTheme } from '../../../../utils/theme'
import { enhancedParentTypes } from '../../../../utils/enhancedParentTypes'

export default function ParentDetailModal({ parentDNA, onClose }) {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY EARLY RETURNS
  const [activeTab, setActiveTab] = useState('core')
  const [expandedSections, setExpandedSections] = useState({})
  const [starredStrategies, setStarredStrategies] = useState(new Set())
  const [personalNotes, setPersonalNotes] = useState({})
  const [triedStrategies, setTriedStrategies] = useState(new Set())
  const [dismissedStrategies, setDismissedStrategies] = useState(new Set())
  const [showDismissed, setShowDismissed] = useState(false)
  const [hoveredButton, setHoveredButton] = useState(null)

  // Get enhancedType early for hooks
  const enhancedType = enhancedParentTypes[parentDNA?.type]

  // Memoized helper functions
  const getDailyBehaviors = useMemo(() => {
    if (!enhancedType) return []
    return enhancedType.psychologicalCore?.dailyBehaviors || 
           enhancedType.psychologyDeepDive?.howThisShowsDaily || 
           []
  }, [enhancedType])

  const getStrengths = useMemo(() => {
    if (!parentDNA?.details?.strengths) return []
    return parentDNA.details.strengths.slice(0, 3)
  }, [parentDNA?.details?.strengths])

  // Toggle expandable sections
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }, [])

  // Interactive functions with improved state management
  const toggleStar = useCallback((strategyId) => {
    console.log('⭐ Star clicked for:', strategyId)
    setStarredStrategies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(strategyId)) {
        newSet.delete(strategyId)
        console.log('Removed star from:', strategyId)
      } else {
        newSet.add(strategyId)
        console.log('Added star to:', strategyId)
        // Remove from dismissed when starring
        setDismissedStrategies(dismissed => {
          const newDismissed = new Set(dismissed)
          newDismissed.delete(strategyId)
          return newDismissed
        })
      }
      return newSet
    })
  }, [])

  const toggleTried = useCallback((strategyId) => {
    console.log('✅ Try clicked for:', strategyId)
    setTriedStrategies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(strategyId)) {
        newSet.delete(strategyId)
        console.log('Removed tried from:', strategyId)
      } else {
        newSet.add(strategyId)
        console.log('Added tried to:', strategyId)
      }
      return newSet
    })
  }, [])

  const toggleDismiss = useCallback((strategyId) => {
    console.log('❌ Dismiss clicked for:', strategyId)
    setDismissedStrategies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(strategyId)) {
        newSet.delete(strategyId)
        console.log('Restored:', strategyId)
      } else {
        newSet.add(strategyId)
        console.log('Dismissed:', strategyId)
        // Clean up related state when dismissing
        setStarredStrategies(starred => {
          const newStarred = new Set(starred)
          newStarred.delete(strategyId)
          return newStarred
        })
        setPersonalNotes(prev => {
          const newNotes = { ...prev }
          delete newNotes[strategyId]
          return newNotes
        })
      }
      return newSet
    })
  }, [])

  const updateNote = useCallback((strategyId, note) => {
    setPersonalNotes(prev => ({
      ...prev,
      [strategyId]: note
    }))
  }, [])

  // Hover handlers
  const handleMouseEnter = useCallback((buttonId) => {
    setHoveredButton(buttonId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredButton(null)
  }, [])

  // Strategy Card Component - moved to regular function (not useCallback)
  const StrategyCard = ({ strategy, strategyId, category, isDismissed = false }) => {
    const isStarred = starredStrategies.has(strategyId)
    const isTried = triedStrategies.has(strategyId)
    const hasNote = personalNotes[strategyId]?.trim()

    // Memoized styles to avoid recreation on each render
    const cardStyle = {
      backgroundColor: isStarred ? `${luxTheme.accent}20` : luxTheme.surface,
      borderRadius: '12px',
      padding: '16px',
      border: isStarred ? `2px solid ${luxTheme.accent}` : `1px solid ${luxTheme.primary}30`,
      position: 'relative',
      opacity: isDismissed ? 0.6 : 1,
      marginBottom: '12px',
      transition: 'all 0.2s ease'
    }

    const getButtonStyle = (buttonType, isActive) => {
      const baseStyle = {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: isDismissed ? 'not-allowed' : 'pointer',
        padding: '2px',
        userSelect: 'none',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
        opacity: isDismissed ? 0.5 : 1,
        fontSize: buttonType === 'star' ? '16px' : '14px'
      }

      if (hoveredButton === `${strategyId}-${buttonType}` && !isDismissed) {
        baseStyle.backgroundColor = buttonType === 'star' ? 'rgba(255, 215, 0, 0.1)' :
                                   buttonType === 'tried' ? 'rgba(16, 185, 129, 0.1)' :
                                   'rgba(239, 68, 68, 0.1)'
      }

      if (buttonType === 'star') {
        baseStyle.color = isActive ? '#FFD700' : '#DDD'
      } else if (buttonType === 'tried') {
        baseStyle.color = isActive ? '#10B981' : '#DDD'
      } else if (buttonType === 'dismiss') {
        baseStyle.color = isDismissed ? '#10B981' : '#ef4444'
        baseStyle.fontSize = '16px'
        baseStyle.width = '20px'
        baseStyle.height = '20px'
        baseStyle.display = 'flex'
        baseStyle.alignItems = 'center'
        baseStyle.justifyContent = 'center'
        baseStyle.flexShrink = 0
      }

      return baseStyle
    }

    return (
      <div style={cardStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: hasNote || isStarred ? '12px' : '0'
        }}>
          
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => !isDismissed && toggleStar(strategyId)}
              onMouseEnter={() => handleMouseEnter(`${strategyId}-star`)}
              onMouseLeave={handleMouseLeave}
              style={getButtonStyle('star', isStarred)}
              title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
              disabled={isDismissed}
              aria-label={isStarred ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isStarred ? '⭐' : '☆'}
            </button>
            
            <button
              onClick={() => !isDismissed && toggleTried(strategyId)}
              onMouseEnter={() => handleMouseEnter(`${strategyId}-tried`)}
              onMouseLeave={handleMouseLeave}
              style={getButtonStyle('tried', isTried)}
              title={isTried ? 'Mark as not tried (click to untoggle)' : 'Mark as tried'}
              disabled={isDismissed}
              aria-label={isTried ? 'Mark as not tried' : 'Mark as tried'}
            >
              {isTried ? '✅' : '⭕'}
            </button>
          </div>

          <span style={{
            fontSize: '13px',
            color: isDismissed ? '#6b7280' : luxTheme.textPrimary,
            lineHeight: '1.4',
            flex: 1,
            textDecoration: isDismissed ? 'line-through' : 'none'
          }}>
            {strategy}
          </span>

          <button
            onClick={() => toggleDismiss(strategyId)}
            onMouseEnter={() => handleMouseEnter(`${strategyId}-dismiss`)}
            onMouseLeave={handleMouseLeave}
            style={getButtonStyle('dismiss', isDismissed)}
            title={isDismissed ? 'Restore strategy' : 'Dismiss strategy'}
            aria-label={isDismissed ? 'Restore strategy' : 'Dismiss strategy'}
          >
            {isDismissed ? '↩' : '✕'}
          </button>
        </div>

        {isStarred && !isDismissed && (
          <div style={{
            paddingTop: '12px',
            borderTop: `1px solid ${luxTheme.accent}40`
          }}>
            <textarea
              placeholder="Add your personal notes about this strategy..."
              value={personalNotes[strategyId] || ''}
              onChange={(e) => updateNote(strategyId, e.target.value)}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '8px',
                border: `1px solid ${luxTheme.accent}40`,
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: luxTheme.background,
                outline: 'none'
              }}
              aria-label="Personal notes for this strategy"
            />
          </div>
        )}
      </div>
    )
  }

  // NOW WE CAN DO EARLY RETURNS AFTER ALL HOOKS ARE CALLED
  if (!parentDNA?.details) {
    console.warn('ParentDetailModal: parentDNA or parentDNA.details is missing')
    return null
  }

  if (!enhancedType) {
    console.warn(`ParentDetailModal: enhancedType not found for type: ${parentDNA.type}`)
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: luxTheme.surface,
        borderRadius: '24px',
        maxWidth: '520px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '18px',
            cursor: 'pointer',
            zIndex: 10
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* ENHANCED HEADER */}
        <div style={{
          background: `linear-gradient(135deg, ${parentDNA.details.color}, ${parentDNA.details.color}E0)`,
          borderRadius: '24px 24px 0 0',
          padding: '40px 32px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)
            `,
            backgroundSize: '200px 200px, 150px 150px'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '100px',
              height: '100px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '48px',
              backdropFilter: 'blur(10px)',
              border: '3px solid rgba(255,255,255,0.3)'
            }}>
              {parentDNA.details.emoji}
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              The {parentDNA.details.name}
            </h2>

            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'inline-block',
              marginBottom: '16px',
              backdropFilter: 'blur(10px)'
            }}>
              Your Personal Support Library
            </div>

            {/* Tab Navigation - Mobile Responsive */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '4px',
              backdropFilter: 'blur(10px)',
              flexWrap: 'wrap'
            }} role="tablist">
              {[
                { id: 'core', label: 'Core DNA', icon: '🧬' },
                { id: 'awareness', label: 'Self-Awareness', icon: '🪞' },
                { id: 'toolkit', label: 'Your Toolkit', icon: '🧰' },
                { id: 'scenarios', label: 'Scenarios', icon: '📚' },
                { id: 'confidence', label: 'Confidence', icon: '💪' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    fontSize: '9px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    minWidth: '52px',
                    flex: '1'
                  }}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-label={`Switch to ${tab.label} tab`}
                >
                  <span style={{ fontSize: '12px' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT SECTIONS */}
        <div style={{ 
          padding: '28px',
          '@media (max-width: 480px)': {
            padding: '20px'
          }
        }}>
          
          {/* CORE DNA TAB */}
          {activeTab === 'core' && (
            <div role="tabpanel" aria-labelledby="core-tab">
              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#F0F9FF',
                borderRadius: '12px',
                border: '1px solid #BAE6FD'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>💙</div>
                <p style={{
                  fontSize: '13px',
                  color: '#075985',
                  lineHeight: '1.4',
                  margin: 0
                }}>
                  This is your parenting foundation - the core of who you are. Everything else builds from here. No need to memorize this - just let it remind you of your natural strengths.
                </p>
              </div>
            
              <div>
                <div style={{
                  backgroundColor: `${parentDNA.details.color}15`,
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: `2px solid ${parentDNA.details.color}40`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 12px 0'
                  }}>
                    Your Parenting Superpower
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {enhancedType.corePhilosophy?.yourSuperpower || "Creating positive reading relationships through your natural approach"}
                  </p>
                </div>

                <div style={{
                  backgroundColor: `${luxTheme.secondary}15`,
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: `1px solid ${luxTheme.secondary}40`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌱</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 12px 0'
                  }}>
                    Your Growth Edge
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {enhancedType.corePhilosophy?.yourGrowthEdge || "Every parent has areas where they can continue growing and developing"}
                  </p>
                </div>

                <div style={{
                  backgroundColor: `${luxTheme.accent}15`,
                  borderRadius: '16px',
                  padding: '20px',
                  border: `1px solid ${luxTheme.accent}40`
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px', textAlign: 'center' }}>🧠</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 12px 0',
                    textAlign: 'center'
                  }}>
                    What Drives You Unconsciously
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {enhancedType.psychologicalCore?.unconsciousDrive || enhancedType.psychologyDeepDive?.whatDrivesYou || parentDNA.details.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SELF-AWARENESS TAB */}
          {activeTab === 'awareness' && (
            <div role="tabpanel" aria-labelledby="awareness-tab">
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#FEF7FF',
                borderRadius: '12px',
                border: '1px solid #F3E8FF'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>🪞</div>
                <p style={{
                  fontSize: '13px',
                  color: '#7C3AED',
                  lineHeight: '1.4',
                  margin: 0
                }}>
                  Self-awareness is a superpower. Click what you&apos;re curious about - there&apos;s no pressure to explore everything. This is your personal mirror to dip into when you need insight.
                </p>
              </div>
            
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={() => toggleSection('dailyBehaviors')}
                    style={{
                      width: '100%',
                      backgroundColor: `${luxTheme.primary}15`,
                      border: `1px solid ${luxTheme.primary}40`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    aria-expanded={expandedSections.dailyBehaviors}
                    aria-controls="daily-behaviors-content"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>📱</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: luxTheme.textPrimary }}>
                          How This Shows Up in Daily Life
                        </div>
                        <div style={{ fontSize: '11px', color: luxTheme.textSecondary }}>
                          Recognizing your patterns
                        </div>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '16px', 
                      transform: expandedSections.dailyBehaviors ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </span>
                  </button>

                  {expandedSections.dailyBehaviors && (
                    <div id="daily-behaviors-content" style={{
                      marginTop: '12px',
                      backgroundColor: luxTheme.surface,
                      borderRadius: '12px',
                      padding: '16px',
                      border: `1px solid ${luxTheme.primary}30`
                    }}>
                      {getDailyBehaviors.map((behavior, idx) => (
                        <div key={idx} style={{
                          fontSize: '12px',
                          color: luxTheme.textPrimary,
                          padding: '8px 0',
                          borderBottom: idx < getDailyBehaviors.length - 1 ? `1px solid ${luxTheme.primary}20` : 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '14px', flexShrink: 0 }}>•</span>
                          <span>{behavior}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={() => toggleSection('stressResponse')}
                    style={{
                      width: '100%',
                      backgroundColor: `${luxTheme.accent}15`,
                      border: `1px solid ${luxTheme.accent}40`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    aria-expanded={expandedSections.stressResponse}
                    aria-controls="stress-response-content"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>😰</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: luxTheme.textPrimary }}>
                          When You&apos;re Under Pressure
                        </div>
                        <div style={{ fontSize: '11px', color: luxTheme.textSecondary }}>
                          Understanding your stress patterns
                        </div>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '16px', 
                      transform: expandedSections.stressResponse ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </span>
                  </button>

                  {expandedSections.stressResponse && (
                    <div id="stress-response-content" style={{
                      marginTop: '12px',
                      backgroundColor: luxTheme.surface,
                      borderRadius: '12px',
                      padding: '16px',
                      border: `1px solid ${luxTheme.accent}30`
                    }}>
                      <p style={{
                        fontSize: '13px',
                        color: luxTheme.textPrimary,
                        lineHeight: '1.5',
                        margin: 0,
                        fontStyle: 'italic'
                      }}>
                        {enhancedType.psychologicalCore?.stressResponse || enhancedType.psychologyDeepDive?.underStress ||                         'Understanding how you respond under pressure helps you recognize when to step back and recalibrate.'}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <button
                    onClick={() => toggleSection('naturalStrengths')}
                    style={{
                      width: '100%',
                      backgroundColor: `${luxTheme.secondary}15`,
                      border: `1px solid ${luxTheme.secondary}40`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    aria-expanded={expandedSections.naturalStrengths}
                    aria-controls="natural-strengths-content"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>💪</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: luxTheme.textPrimary }}>
                          Your Natural Strengths
                        </div>
                        <div style={{ fontSize: '11px', color: luxTheme.textSecondary }}>
                          Click to see what you&apos;re naturally good at
                        </div>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '16px', 
                      transform: expandedSections.naturalStrengths ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </span>
                  </button>

                  {expandedSections.naturalStrengths && (
                    <div id="natural-strengths-content" style={{
                      marginTop: '12px',
                      backgroundColor: luxTheme.surface,
                      borderRadius: '12px',
                      padding: '16px',
                      border: `1px solid ${luxTheme.secondary}30`
                    }}>
                      {getStrengths.map((strength, index) => (
                        <div key={index} style={{
                          backgroundColor: `${luxTheme.secondary}10`,
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '8px',
                          borderLeft: `3px solid ${luxTheme.secondary}`,
                          fontSize: '12px',
                          color: luxTheme.textPrimary,
                          lineHeight: '1.4'
                        }}>
                          {strength}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TOOLKIT TAB */}
          {activeTab === 'toolkit' && (
            <div role="tabpanel" aria-labelledby="toolkit-tab">
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#F0FDF4',
                borderRadius: '12px',
                border: '1px solid #BBF7D0'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>🧰</div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0'
                }}>
                  Your Personal Toolkit
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: '#15803D',
                  marginBottom: '4px'
                }}>
                  Interactive strategies you can try, save, and personalize. Use what works, dismiss what doesn&apos;t.
                </p>
                <p style={{
                  fontSize: '11px',
                  color: '#10B981',
                  fontStyle: 'italic'
                }}>
                  ⭐ Star what resonates • ✅ Track what you&apos;ve tried • ✖️ Dismiss what doesn&apos;t fit
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  backgroundColor: `${luxTheme.accent}15`,
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '16px' }}>⭐</div>
                  <div style={{ fontSize: '10px', color: luxTheme.textSecondary }}>
                    {starredStrategies.size} starred
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#10B98115',
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '16px' }}>✅</div>
                  <div style={{ fontSize: '10px', color: luxTheme.textSecondary }}>
                    {triedStrategies.size} tried
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#ef444415',
                  borderRadius: '8px',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '16px' }}>✖️</div>
                  <div style={{ fontSize: '10px', color: luxTheme.textSecondary }}>
                    {dismissedStrategies.size} dismissed
                  </div>
                </div>
              </div>

              {enhancedType.dailyStrategies && Object.entries(enhancedType.dailyStrategies).map(([category, strategies]) => {
                const activeStrategies = strategies.filter((_, index) => 
                  !dismissedStrategies.has(`${category}-${index}`)
                )
                
                const totalStrategies = strategies.length
                const dismissedCount = totalStrategies - activeStrategies.length

                return (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <button
                      onClick={() => toggleSection(`toolkit-${category}`)}
                      style={{
                        width: '100%',
                        backgroundColor: `${luxTheme.primary}15`,
                        border: `1px solid ${luxTheme.primary}40`,
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      aria-expanded={expandedSections[`toolkit-${category}`]}
                      aria-controls={`toolkit-${category}-content`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>
                          {category === 'engagement' ? '💬' : 
                           category === 'conflict' ? '⚡' : 
                           category === 'celebration' ? '🎉' : '💡'}
                        </span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: luxTheme.textPrimary }}>
                            {category === 'engagement' ? 'Engagement Approaches' : 
                             category === 'conflict' ? 'When Challenges Arise' :  
                             category === 'celebration' ? 'Celebrating Success' : 
                             category.charAt(0).toUpperCase() + category.slice(1)}
                          </div>
                          <div style={{ fontSize: '11px', color: luxTheme.textSecondary }}>
                            {activeStrategies.length} strategies{dismissedCount > 0 ? ` (${dismissedCount} dismissed)` : ''}
                          </div>
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '16px', 
                        transform: expandedSections[`toolkit-${category}`] ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}>
                        ▶
                      </span>
                    </button>

                    {expandedSections[`toolkit-${category}`] && (
                      <div id={`toolkit-${category}-content`} style={{
                        marginTop: '12px',
                        backgroundColor: luxTheme.surface,
                        borderRadius: '12px',
                        padding: '16px',
                        border: `1px solid ${luxTheme.primary}30`
                      }}>
                        {activeStrategies.length > 0 ? (
                          <div style={{ display: 'grid', gap: '12px' }}>
                            {strategies.map((strategy, index) => {
                              const strategyId = `${category}-${index}`
                              if (dismissedStrategies.has(strategyId)) return null
                              
                              return (
                                <StrategyCard 
                                  key={strategyId}
                                  strategy={strategy}
                                  strategyId={strategyId}
                                  category={category}
                                />
                              )
                            })}
                          </div>
                        ) : (
                          <div style={{
                            textAlign: 'center',
                            padding: '20px',
                            color: luxTheme.textSecondary,
                            fontSize: '12px',
                            fontStyle: 'italic'
                          }}>
                            All strategies in this category have been dismissed. 
                            <br />Check the dismissed section below to restore any.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {dismissedStrategies.size > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <button
                    onClick={() => setShowDismissed(!showDismissed)}
                    style={{
                      width: '100%',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: showDismissed ? '16px' : '0'
                    }}
                    aria-expanded={showDismissed}
                    aria-controls="dismissed-strategies"
                  >
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '600'
                    }}>
                      📦 Dismissed Strategies ({dismissedStrategies.size})
                    </div>
                    <span style={{
                      fontSize: '14px',
                      transform: showDismissed ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </span>
                  </button>

                  {showDismissed && (
                    <div id="dismissed-strategies" style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {enhancedType.dailyStrategies && Object.entries(enhancedType.dailyStrategies).map(([category, strategies]) =>
                          strategies.map((strategy, index) => {
                            const strategyId = `${category}-${index}`
                            if (!dismissedStrategies.has(strategyId)) return null
                            
                            return (
                              <StrategyCard 
                                key={strategyId}
                                strategy={strategy}
                                strategyId={strategyId}
                                category={category}
                                isDismissed={true}
                              />
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SCENARIOS TAB */}
          {activeTab === 'scenarios' && (
            <div role="tabpanel" aria-labelledby="scenarios-tab">
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#FFFBEB',
                borderRadius: '12px',
                border: '1px solid #FED7AA'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>📚</div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0'
                }}>
                  Real-Life Reading Scenarios
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: '#EA580C',
                  marginBottom: '4px'
                }}>
                  Your personal support library - dip in when you need it. No need to read everything, just explore what&apos;s relevant right now.
                </p>
                <p style={{
                  fontSize: '11px',
                  color: '#F59E0B',
                  fontStyle: 'italic'
                }}>
                  💡 Think of this as your emergency toolkit for tricky parenting moments
                </p>
              </div>

              {/* Reluctant Reader Scenario */}
              {enhancedType.scenarios?.reluctantReader && (
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => toggleSection('reluctantReader')}
                    style={{
                      width: '100%',
                      backgroundColor: `${luxTheme.primary}15`,
                      border: `1px solid ${luxTheme.primary}40`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    aria-expanded={expandedSections.reluctantReader}
                    aria-controls="reluctant-reader-content"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>📖</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: luxTheme.textPrimary }}>
                          When Your Child Avoids Reading
                        </div>
                        <div style={{ fontSize: '11px', color: luxTheme.textSecondary }}>
                          Your natural approach + helpful scripts
                        </div>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '16px', 
                      transform: expandedSections.reluctantReader ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </span>
                  </button>

                  {expandedSections.reluctantReader && (
                    <div id="reluctant-reader-content" style={{
                      marginTop: '12px',
                      backgroundColor: luxTheme.surface,
                      borderRadius: '12px',
                      padding: '20px',
                      border: `1px solid ${luxTheme.primary}30`
                    }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          marginBottom: '8px'
                        }}>
                          Your Natural Instinct:
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: luxTheme.textPrimary,
                          lineHeight: '1.4',
                          padding: '12px',
                          backgroundColor: `${luxTheme.primary}10`,
                          borderRadius: '8px',
                          fontStyle: 'italic',
                          borderLeft: `3px solid ${luxTheme.primary}`
                        }}>
                          {enhancedType.scenarios.reluctantReader.yourInstinct}
                        </div>
                      </div>

                      {enhancedType.scenarios.reluctantReader.scripts && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : '1fr 1fr',
                          gap: '12px',
                          marginBottom: '16px'
                        }}>
                          {enhancedType.scenarios.reluctantReader.scripts.doSay && (
                            <div>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#10B981',
                                marginBottom: '8px'
                              }}>
                                ✅ DO Say:
                              </div>
                              {enhancedType.scenarios.reluctantReader.scripts.doSay.map((phrase, index) => (
                                <div key={index} style={{
                                  fontSize: '11px',
                                  color: '#10B981',
                                  padding: '8px 10px',
                                  backgroundColor: '#10B98115',
                                  borderRadius: '8px',
                                  marginBottom: '6px',
                                  lineHeight: '1.3',
                                  borderLeft: '3px solid #10B981'
                                }}>
                                  &quot;{phrase}&quot;
                                </div>
                              ))}
                            </div>
                          )}
                          {enhancedType.scenarios.reluctantReader.scripts.dontSay && (
                            <div>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#EF4444',
                                marginBottom: '8px'
                              }}>
                                ❌ AVOID:
                              </div>
                              {enhancedType.scenarios.reluctantReader.scripts.dontSay.map((phrase, index) => (
                                <div key={index} style={{
                                  fontSize: '11px',
                                  color: '#EF4444',
                                  padding: '8px 10px',
                                  backgroundColor: '#EF444415',
                                  borderRadius: '8px',
                                  marginBottom: '6px',
                                  lineHeight: '1.3',
                                  borderLeft: '3px solid #EF4444'
                                }}>
                                  &quot;{phrase}&quot;
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {enhancedType.scenarios.reluctantReader.gentleApproaches && (
                        <div>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: luxTheme.textPrimary,
                            marginBottom: '8px'
                          }}>
                            Gentle Approaches to Try:
                          </div>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {enhancedType.scenarios.reluctantReader.gentleApproaches.map((approach, index) => (
                              <div key={index} style={{
                                fontSize: '12px',
                                color: luxTheme.textPrimary,
                                padding: '10px 12px',
                                backgroundColor: `${luxTheme.primary}20`,
                                borderRadius: '8px',
                                borderLeft: `3px solid ${luxTheme.primary}`,
                                lineHeight: '1.4'
                              }}>
                                • {approach}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Achievement Pressure Scenario */}
              {enhancedType.scenarios?.achievementPressure && (
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => toggleSection('achievementPressure')}
                    style={{
                      width: '100%',
                      backgroundColor: `${luxTheme.secondary}15`,
                      border: `1px solid ${luxTheme.secondary}40`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    aria-expanded={expandedSections.achievementPressure}
                    aria-controls="achievement-pressure-content"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>📈</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: luxTheme.textPrimary }}>
                          Managing Achievement Pressure
                        </div>
                        <div style={{ fontSize: '11px', color: luxTheme.textSecondary }}>
                          Balancing expectations with joy
                        </div>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '16px', 
                      transform: expandedSections.achievementPressure ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </span>
                  </button>

                  {expandedSections.achievementPressure && (
                    <div id="achievement-pressure-content" style={{
                      marginTop: '12px',
                      backgroundColor: luxTheme.surface,
                      borderRadius: '12px',
                      padding: '20px',
                      border: `1px solid ${luxTheme.secondary}30`
                    }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          marginBottom: '8px'
                        }}>
                          Your Approach:
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: luxTheme.textPrimary,
                          lineHeight: '1.4',
                          padding: '12px',
                          backgroundColor: `${luxTheme.secondary}10`,
                          borderRadius: '8px',
                          borderLeft: `3px solid ${luxTheme.secondary}`
                        }}>
                          {enhancedType.scenarios.achievementPressure.yourApproach}
                        </div>
                      </div>

                      {enhancedType.scenarios.achievementPressure.scripts && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : '1fr 1fr',
                          gap: '12px'
                        }}>
                          {enhancedType.scenarios.achievementPressure.scripts.doSay && (
                            <div>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#10B981',
                                marginBottom: '8px'
                              }}>
                                ✅ DO Say:
                              </div>
                              {enhancedType.scenarios.achievementPressure.scripts.doSay.map((phrase, index) => (
                                <div key={index} style={{
                                  fontSize: '11px',
                                  color: '#10B981',
                                  padding: '8px 10px',
                                  backgroundColor: '#10B98115',
                                  borderRadius: '8px',
                                  marginBottom: '6px',
                                  lineHeight: '1.3',
                                  borderLeft: '3px solid #10B981'
                                }}>
                                  &quot;{phrase}&quot;
                                </div>
                              ))}
                            </div>
                          )}
                          {enhancedType.scenarios.achievementPressure.scripts.dontSay && (
                            <div>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#EF4444',
                                marginBottom: '8px'
                              }}>
                                ❌ AVOID:
                              </div>
                              {enhancedType.scenarios.achievementPressure.scripts.dontSay.map((phrase, index) => (
                                <div key={index} style={{
                                  fontSize: '11px',
                                  color: '#EF4444',
                                  padding: '8px 10px',
                                  backgroundColor: '#EF444415',
                                  borderRadius: '8px',
                                  marginBottom: '6px',
                                  lineHeight: '1.3',
                                  borderLeft: '3px solid #EF4444'
                                }}>
                                  &quot;{phrase}&quot;
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Book Choice Struggles */}
              {enhancedType.scenarios?.bookChoiceStruggles && (
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => toggleSection('bookChoiceStruggles')}
                    style={{
                      width: '100%',
                      backgroundColor: `${luxTheme.accent}15`,
                      border: `1px solid ${luxTheme.accent}40`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    aria-expanded={expandedSections.bookChoiceStruggles}
                    aria-controls="book-choice-content"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>📚</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: luxTheme.textPrimary }}>
                          Book Choice Struggles
                        </div>
                        <div style={{ fontSize: '11px', color: luxTheme.textSecondary }}>
                          When they can&apos;t decide what to read
                        </div>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '16px', 
                      transform: expandedSections.bookChoiceStruggles ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </span>
                  </button>

                  {expandedSections.bookChoiceStruggles && (
                    <div id="book-choice-content" style={{
                      marginTop: '12px',
                      backgroundColor: luxTheme.surface,
                      borderRadius: '12px',
                      padding: '20px',
                      border: `1px solid ${luxTheme.accent}30`
                    }}>
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          marginBottom: '8px'
                        }}>
                          Your Philosophy:
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: luxTheme.textPrimary,
                          lineHeight: '1.4',
                          padding: '12px',
                          backgroundColor: `${luxTheme.accent}10`,
                          borderRadius: '8px',
                          borderLeft: `3px solid ${luxTheme.accent}`
                        }}>
                          {enhancedType.scenarios.bookChoiceStruggles.yourPhilosophy}
                        </div>
                      </div>

                      {enhancedType.scenarios.bookChoiceStruggles.practicalTips && (
                        <div>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: luxTheme.textPrimary,
                            marginBottom: '8px'
                          }}>
                            Practical Tips:
                          </div>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {enhancedType.scenarios.bookChoiceStruggles.practicalTips.map((tip, index) => (
                              <div key={index} style={{
                                fontSize: '12px',
                                color: luxTheme.textPrimary,
                                padding: '10px 12px',
                                backgroundColor: `${luxTheme.accent}20`,
                                borderRadius: '8px',
                                borderLeft: `3px solid ${luxTheme.accent}`,
                                lineHeight: '1.4'
                              }}>
                                • {tip}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Seasonal Support - Vertical Expandable Sections */}
              {enhancedType.seasonalSupport && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '16px',
                    padding: '12px',
                    backgroundColor: '#F3F4F615',
                    borderRadius: '12px',
                    border: '1px solid #D1D5DB40'
                  }}>
                    <span style={{ fontSize: '20px', marginRight: '8px' }}>🗓️</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: luxTheme.textPrimary }}>
                      Seasonal Reading Support
                    </span>
                    <div style={{ fontSize: '11px', color: luxTheme.textSecondary, marginTop: '4px' }}>
                      Click the season you need help with right now
                    </div>
                  </div>

                  {Object.entries(enhancedType.seasonalSupport).map(([season, seasonData]) => (
                    <div key={season} style={{ marginBottom: '12px' }}>
                      <button
                        onClick={() => toggleSection(`season-${season}`)}
                        style={{
                          width: '100%',
                          backgroundColor: `${luxTheme.primary}15`,
                          border: `1px solid ${luxTheme.primary}40`,
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        aria-expanded={expandedSections[`season-${season}`]}
                        aria-controls={`season-${season}-content`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '24px' }}>
                            {season === 'backToSchool' ? '🎒' :
                             season === 'holidays' ? '🎄' :
                             season === 'spring' ? '🌸' :
                             season === 'summer' ? '☀️' : '📅'}
                          </span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: luxTheme.textPrimary }}>
                              {season === 'backToSchool' ? 'Back to School Reading' :
                               season === 'holidays' ? 'Holiday Reading Challenges' :
                               season === 'spring' ? 'Spring Reading Refresh' :
                               season === 'summer' ? 'Summer Reading Approach' :
                               season.charAt(0).toUpperCase() + season.slice(1)}
                            </div>
                            <div style={{ fontSize: '11px', color: luxTheme.textSecondary }}>
                              {season === 'backToSchool' ? 'Routine transitions & new expectations' :
                               season === 'holidays' ? 'Balancing festivities with reading habits' :
                               season === 'spring' ? 'Renewed energy & outdoor distractions' :
                               season === 'summer' ? 'Maintaining momentum during break' :
                               'Seasonal reading strategies'}
                            </div>
                          </div>
                        </div>
                        <span style={{ 
                          fontSize: '16px', 
                          transform: expandedSections[`season-${season}`] ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}>
                          ▶
                        </span>
                      </button>

                      {expandedSections[`season-${season}`] && (
                        <div id={`season-${season}-content`} style={{
                          marginTop: '12px',
                          backgroundColor: luxTheme.surface,
                          borderRadius: '12px',
                          padding: '20px',
                          border: `1px solid ${luxTheme.primary}30`
                        }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: luxTheme.textPrimary,
                            marginBottom: '8px'
                          }}>
                            The Challenge:
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: luxTheme.textPrimary,
                            lineHeight: '1.4',
                            padding: '12px',
                            backgroundColor: `${luxTheme.primary}10`,
                            borderRadius: '8px',
                            borderLeft: `3px solid ${luxTheme.primary}`,
                            marginBottom: '16px'
                          }}>
                            {seasonData.challenge}
                          </div>
                          
                          {seasonData.strategies && (
                            <div>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: luxTheme.textPrimary,
                                marginBottom: '8px'
                              }}>
                                Your Seasonal Strategies:
                              </div>
                              <div style={{ display: 'grid', gap: '8px' }}>
                                {seasonData.strategies.map((strategy, index) => (
                                  <div key={index} style={{
                                    fontSize: '12px',
                                    color: luxTheme.textPrimary,
                                    padding: '10px 12px',
                                    backgroundColor: `${luxTheme.primary}20`,
                                    borderRadius: '8px',
                                    borderLeft: `3px solid ${luxTheme.primary}`,
                                    lineHeight: '1.4'
                                  }}>
                                    • {strategy}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONFIDENCE TAB */}
          {activeTab === 'confidence' && (
            <div role="tabpanel" aria-labelledby="confidence-tab">
              <div style={{
                textAlign: 'center',
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#F0FDF4',
                borderRadius: '12px',
                border: '1px solid #BBF7D0'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌟</div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0'
                }}>
                  You&apos;re Doing Better Than You Think
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: '#15803D',
                  marginBottom: '4px'
                }}>
                  Research-backed reminders of your positive impact. Come here whenever you need a confidence boost.
                </p>
                <p style={{
                  fontSize: '11px',
                  color: '#10B981',
                  fontStyle: 'italic'
                }}>
                  💚 Save this tab for those moments when doubt creeps in
                </p>
              </div>

              {enhancedType.confidenceBuilders && (
                <div style={{
                  backgroundColor: '#10B98115',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  border: '2px solid #10B98140'
                }}>
                  <div style={{
                    display: 'grid',
                    gap: '12px'
                  }}>
                    {enhancedType.confidenceBuilders.map((builder, index) => (
                      <div key={index} style={{
                        backgroundColor: 'white',
                        borderRadius: '10px',
                        padding: '14px',
                        border: '1px solid #10B98160',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                      }}>
                        <div style={{
                          backgroundColor: '#10B981',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: 'white',
                          flexShrink: 0,
                          marginTop: '1px'
                        }}>
                          ✓
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#047857',
                          lineHeight: '1.4'
                        }}>
                          {builder}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {enhancedType.researchInsight && (
                <div style={{
                  backgroundColor: `${luxTheme.accent}15`,
                  borderRadius: '16px',
                  padding: '20px',
                  border: `1px solid ${luxTheme.accent}40`
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 12px 0',
                    textAlign: 'center'
                  }}>
                    🔬 The Science Behind Your Style
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.5',
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    {enhancedType.researchInsight.core}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}