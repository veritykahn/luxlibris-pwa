// components/parent/dna-lab/modals/CompatibilityModal.js - IMPROVED WITH MERGED STRATEGIES TAB
import { useState, useCallback } from 'react'
import { luxTheme } from '../../../../utils/theme'
import { getCompatibilityInsights, getParentGuidanceForChild, enhancedCompatibilityMatrix } from '../../../../utils/compatibilityInsights'

export default function CompatibilityModal({ student, parentDNA, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState({
    // All sections start collapsed by default
    strengths: false,
    childUnderstanding: false,
    strategiesOverview: false,
    growthDetails: false,
    // Modifier sections
    A: false,
    E: false,
    S: false,
    F: false,
    I: false,
    P: false,
    G: false,
    R: false
  })

  const toggleSection = useCallback((sectionKey) => {
    console.log('Toggling section:', sectionKey) // Debug log
    setExpandedSections(prev => {
      const newState = {
        ...prev,
        [sectionKey]: !prev[sectionKey]
      }
      console.log('New expanded state:', newState) // Debug log
      return newState
    })
  }, [])

  // Expandable Section Component - fixed with proper event handling
  const ExpandableSection = useCallback(({ 
    id, 
    title, 
    icon, 
    children, 
    isExpanded, 
    backgroundColor = luxTheme.surface,
    borderColor = luxTheme.primary,
    headerColor = luxTheme.textPrimary,
    preview = null
  }) => {
    const handleClick = useCallback((e) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('Button clicked for section:', id) // Debug log
      toggleSection(id)
    }, [id])

    return (
      <div style={{
        backgroundColor: `${borderColor}15`,
        borderRadius: '12px',
        marginBottom: '12px',
        border: `1px solid ${borderColor}40`,
        overflow: 'hidden',
        transition: 'all 0.2s ease'
      }}>
        <button
          type="button"
          onClick={handleClick}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left',
            outline: 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = `${borderColor}10`
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none'
          }}>
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: headerColor
            }}>
              {title}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none'
          }}>
            {preview && !isExpanded && (
              <span style={{
                fontSize: '11px',
                color: luxTheme.textSecondary,
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {preview}
              </span>
            )}
            <span style={{
              fontSize: '18px',
              color: luxTheme.textSecondary,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'inline-block'
            }}>
              ▶
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div style={{
            padding: '0 16px 16px 16px',
            borderTop: `1px solid ${borderColor}20`,
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {children}
          </div>
        )}
      </div>
    )
  }, [toggleSection])

  if (!student || !parentDNA) return null

  const compatibility = getCompatibilityInsights(
    parentDNA.type,
    student.readingDNA?.type,
    student.readingDNA?.modifiers || []
  )
  const parentData = compatibility.parentData
  const enhancedCompat = enhancedCompatibilityMatrix[parentDNA.type]?.[student.readingDNA?.type]
  const parentGuidance = getParentGuidanceForChild(student.readingDNA)

  const compatibilityColors = {
    'Excellent Match': '#10B981',
    'Strong Match': '#059669', 
    'Good Match': '#F59E0B',
    'Growing Together': '#6B7280'
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
        >
          ✕
        </button>

        {/* Enhanced Header */}
        <div style={{
          background: `linear-gradient(135deg, #FF6B9D, #FF8FA3)`,
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
            background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
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
              🤝
            </div>

            <h2 style={{
              fontSize: '22px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Your Partnership with {student.firstName}
            </h2>
            
            <div style={{
              backgroundColor: compatibilityColors[compatibility.level] || '#6B7280',
              color: 'white',
              borderRadius: '16px',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '16px' }}>
                {compatibility.level === 'Excellent Match' ? '🌟' :
                 compatibility.level === 'Strong Match' ? '✨' :
                 compatibility.level === 'Good Match' ? '👍' : '🌱'}
              </span>
              {compatibility.level}
            </div>
            
            <div style={{
              fontSize: '13px',
              opacity: 0.9
            }}>
              How your {parentData?.name || parentDNA.details.name} style works with their {parentGuidance?.childType} personality
            </div>

            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '4px',
              backdropFilter: 'blur(10px)',
              marginTop: '20px'
            }}>
              {[
                { id: 'overview', label: 'Overview', icon: '🎯' },
                { id: 'dynamics', label: 'Dynamics', icon: '⚡' },
                { id: 'strategies', label: 'Strategies', icon: '🧰' },
                { id: 'growth', label: 'Growth', icon: '🌱' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : 'transparent',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    minWidth: '70px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT SECTIONS */}
        <div style={{ padding: '28px' }}>
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              {/* Partnership Reality Check - Always visible */}
              <div style={{
                backgroundColor: `#FF6B9D15`,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #FF6B9D30',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💫</div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 12px 0'
                }}>
                  Your Reading Partnership Reality
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: luxTheme.textPrimary,
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {enhancedCompat?.realityCheck?.howToNavigate || compatibility.quickTip}
                </p>
              </div>

              {/* Expandable Strengths Section */}
              <ExpandableSection
                id="strengths"
                title={`Your Natural Strengths with ${student.firstName}`}
                icon="💪"
                isExpanded={expandedSections.strengths}
                borderColor={luxTheme.secondary}
                preview={compatibility.strengths?.[0]?.substring(0, 50) + "..."}
              >
                <div style={{ display: 'grid', gap: '8px' }}>
                  {compatibility.strengths?.map((strength, index) => (
                    <div key={index} style={{
                      backgroundColor: luxTheme.surface,
                      borderRadius: '10px',
                      padding: '12px',
                      borderLeft: `3px solid ${luxTheme.secondary}`,
                      fontSize: '13px',
                      color: luxTheme.textPrimary,
                      lineHeight: '1.4'
                    }}>
                      {strength}
                    </div>
                  ))}
                </div>
              </ExpandableSection>

              {/* Expandable Child Understanding Section */}
              <ExpandableSection
                id="childUnderstanding"
                title={`Understanding ${student.firstName}'s Reading Style`}
                icon="🎯"
                isExpanded={expandedSections.childUnderstanding}
                borderColor={luxTheme.accent}
                preview="Learn about their unique reading personality..."
              >
                <p style={{
                  fontSize: '13px',
                  color: luxTheme.textPrimary,
                  lineHeight: '1.5',
                  margin: '0 0 16px 0'
                }}>
                  {parentGuidance?.combinedDescription || `Your child has a unique reading personality that thrives with understanding and support.`}
                </p>
                
                <div style={{ display: 'grid', gap: '6px' }}>
                  {parentGuidance?.keyStrategies?.slice(0, 3).map((strategy, index) => (
                    <div key={index} style={{
                      fontSize: '12px',
                      color: luxTheme.textPrimary,
                      padding: '8px 12px',
                      backgroundColor: `${luxTheme.accent}20`,
                      borderRadius: '8px',
                      borderLeft: `3px solid ${luxTheme.accent}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '14px', flexShrink: 0 }}>•</span>
                      <span>{strategy}</span>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            </div>
          )}

          {/* DYNAMICS TAB */}
          {activeTab === 'dynamics' && (
            <div>
              {enhancedCompat ? (
                <>
                  {/* The Honeymoon Phase - Always visible */}
                  <div style={{
                    backgroundColor: `${luxTheme.secondary}15`,
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '16px',
                    border: `1px solid ${luxTheme.secondary}30`
                  }}>
                    <h4 style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: '0 0 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>🍯</span>
                      The Honeymoon Phase
                    </h4>
                    <p style={{
                      fontSize: '13px',
                      color: luxTheme.textPrimary,
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {enhancedCompat.realityCheck.honeymoonPhase}
                    </p>
                  </div>

                  {/* Where Tension Arises */}
                  <div style={{
                    backgroundColor: `${luxTheme.accent}15`,
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '16px',
                    border: `1px solid ${luxTheme.accent}30`
                  }}>
                    <h4 style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: '0 0 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>⚡</span>
                      Where Tension Often Arises
                    </h4>
                    <p style={{
                      fontSize: '13px',
                      color: luxTheme.textPrimary,
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {enhancedCompat.realityCheck.whereTensionArises}
                    </p>
                  </div>

                  {/* The Clash */}
                  <div style={{
                    backgroundColor: '#FEF3C7',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '16px',
                    border: '1px solid #FCD34D'
                  }}>
                    <h4 style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#92400E',
                      margin: '0 0 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>💥</span>
                      What The Clash Sounds Like
                    </h4>
                    <div style={{
                      fontSize: '13px',
                      color: '#92400E',
                      lineHeight: '1.5',
                      margin: 0,
                      fontStyle: 'italic',
                      padding: '12px',
                      backgroundColor: 'rgba(251, 191, 36, 0.2)',
                      borderRadius: '8px',
                      borderLeft: '4px solid #F59E0B'
                    }}>
                      "{enhancedCompat.realityCheck.theClash}"
                    </div>
                  </div>

                  {/* How to Navigate */}
                  <div style={{
                    backgroundColor: `${luxTheme.primary}15`,
                    borderRadius: '16px',
                    padding: '20px',
                    border: `1px solid ${luxTheme.primary}30`
                  }}>
                    <h4 style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: '0 0 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '20px' }}>🌉</span>
                      How To Navigate This Together
                    </h4>
                    <p style={{
                      fontSize: '13px',
                      color: luxTheme.textPrimary,
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {enhancedCompat.realityCheck.howToNavigate}
                    </p>
                  </div>
                </>
              ) : (
                /* Fallback for basic compatibility */
                <div style={{
                  backgroundColor: `${luxTheme.primary}15`,
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤝</div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 16px 0'
                  }}>
                    Your Unique Partnership
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    Every parent-child reading combination is unique and wonderful. Your {parentData?.name || parentDNA.details.name} approach brings special gifts to supporting {student.firstName}'s reading journey.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STRATEGIES TAB */}
          {activeTab === 'strategies' && (
            <div>
              <div style={{
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0'
                }}>
                  🧰 Complete Strategy Guide for {student.firstName}
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: luxTheme.textSecondary
                }}>
                  How your {parentData?.name || parentDNA.details.name} approach works with their specific traits
                </p>
              </div>

              {/* Child's Reading DNA Code - Always visible */}
              <div style={{
                backgroundColor: `#FF6B9D15`,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid #FF6B9D30',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧬</div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0'
                }}>
                  {student.firstName}'s Reading DNA: {parentGuidance?.fullCode || 'Unique Reader'}
                </h4>
                <p style={{
                  fontSize: '13px',
                  color: luxTheme.textPrimary,
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {parentGuidance?.combinedDescription || `${student.firstName} has a unique combination of reading traits that shape how they learn best.`}
                </p>
              </div>

              {/* Partnership Strategies - Always visible */}
              <ExpandableSection
                id="strategiesOverview"
                title="Your Core Partnership Strategies"
                icon="🎯"
                isExpanded={expandedSections.strategiesOverview}
                borderColor="#FF6B9D"
                preview="Key strategies for your unique combination..."
              >
                <div style={{ display: 'grid', gap: '12px' }}>
                  {(enhancedCompat?.specificStrategies || parentData?.dailyStrategies?.conflict || compatibility.tips || []).map((strategy, index) => (
                    <div key={index} style={{
                      fontSize: '13px',
                      color: luxTheme.textPrimary,
                      padding: '14px 16px',
                      backgroundColor: luxTheme.surface,
                      borderRadius: '12px',
                      borderLeft: `4px solid #FF6B9D`,
                      lineHeight: '1.4',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}>
                      <span style={{ 
                        fontSize: '16px', 
                        flexShrink: 0,
                        marginTop: '1px'
                      }}>
                        💡
                      </span>
                      <span>{strategy}</span>
                    </div>
                  ))}
                </div>
              </ExpandableSection>

              {/* Child's Specific Modifiers - Expandable */}
              {student.readingDNA?.modifiers?.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 16px 0',
                    textAlign: 'center'
                  }}>
                    🌟 Strategies for {student.firstName}'s Special Traits
                  </h4>
                  
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {student.readingDNA.modifiers.map((modifier, index) => {
                      const modifierInfo = {
                        'A': { 
                          name: 'Achieving (High Standards)', 
                          icon: '🎯', 
                          color: '#EF4444',
                          meaning: `${student.firstName} has high personal standards and may get frustrated when reading feels "messy" or unclear.`,
                          yourApproach: parentDNA.type === 'autonomy_supporter' ? 
                            "Your respectful approach helps them feel safe to struggle without judgment. Emphasize that confusion means their brain is growing." :
                            parentDNA.type === 'competence_builder' ? 
                            "Your skill-building focus is perfect for them - they want to feel genuinely capable, not just praised." :
                            parentDNA.type === 'connection_creator' ?
                            "Balance your enthusiasm with patience when they're frustrated. They need connection AND space to work through challenges." :
                            parentDNA.type === 'meaning_maker' ?
                            "Help them see that wrestling with complex ideas is exactly what deep thinkers do." :
                            parentDNA.type === 'growth_facilitator' ?
                            "Your developmental approach is ideal - they need appropriately challenging books that build genuine competence." :
                            "Your authentic modeling shows them that even experienced readers encounter difficult parts.",
                          strategies: [
                            "Say 'I notice you're working really hard to understand that part' instead of 'Don't worry about it'",
                            "Emphasize effort and thinking strategies over getting things right",
                            "Choose books that are challenging but not overwhelming for their current skill level"
                          ]
                        },
                        'E': { 
                          name: 'Emerging (Building Confidence)', 
                          icon: '🌱', 
                          color: '#10B981',
                          meaning: `${student.firstName} is building their reading confidence and feels proudest when they complete books successfully.`,
                          yourApproach: parentDNA.type === 'autonomy_supporter' ? 
                            "Your trust in their choices builds confidence naturally. Let them choose books they can succeed with." :
                            parentDNA.type === 'competence_builder' ? 
                            "Perfect match! Your focus on building genuine skills is exactly what they need to feel capable." :
                            parentDNA.type === 'connection_creator' ?
                            "Your celebration of their victories builds confidence. Share in their reading joy enthusiastically." :
                            parentDNA.type === 'meaning_maker' ?
                            "Help them find meaning in books they can access successfully - depth can happen at any level." :
                            parentDNA.type === 'growth_facilitator' ?
                            "Your patient approach prevents anxiety. Give them time to build solid foundations." :
                            "Your authentic reading joy shows them that reading can be genuinely enjoyable.",
                          strategies: [
                            "Celebrate ALL reading victories, big and small",
                            "Choose high-interest books at a comfortable reading level",
                            "Say 'Look how much you've grown as a reader!' to highlight progress"
                          ]
                        },
                        'S': { 
                          name: 'Supported (Thrives with Community)', 
                          icon: '👥', 
                          color: '#3B82F6',
                          meaning: `${student.firstName} reads best when they have people to share the experience with.`,
                          yourApproach: parentDNA.type === 'autonomy_supporter' ? 
                            "They want to share their reading with you! Your respect for their choices + engagement with their interests = perfect." :
                            parentDNA.type === 'competence_builder' ? 
                            "Use their social motivation to build skills through discussion and shared reading rather than isolated practice." :
                            parentDNA.type === 'connection_creator' ?
                            "This is your sweet spot! They want exactly what you naturally provide - rich sharing around books." :
                            parentDNA.type === 'meaning_maker' ?
                            "They're perfect partners for exploring deeper meanings together. Their social insights are meaningful too." :
                            parentDNA.type === 'growth_facilitator' ?
                            "Support their development through social interaction - they learn better with company." :
                            "Include them in your reading life. They want to see and share authentic reading experiences.",
                          strategies: [
                            "Read the same books they're reading so you can discuss them",
                            "Create family reading time where everyone reads together",
                            "Ask 'Tell me about your favorite character' and really listen"
                          ]
                        },
                        'F': { 
                          name: 'Focus-Needs (Minimal Distractions)', 
                          icon: '🧘', 
                          color: '#06B6D4',
                          meaning: `${student.firstName}'s brain works best in calm, quiet environments.`,
                          yourApproach: parentDNA.type === 'autonomy_supporter' ? 
                            "Trust their need for quiet focus. Let them choose reading environments that feel calm to them." :
                            parentDNA.type === 'competence_builder' ? 
                            "Create distraction-free learning environments for skill-building. Their focus needs support their learning." :
                            parentDNA.type === 'connection_creator' ?
                            "Balance your desire for connection with their need for quiet. Maybe read silently together sometimes." :
                            parentDNA.type === 'meaning_maker' ?
                            "Give them quiet time to process books before discussing meaning. Deep thinking needs calm space." :
                            parentDNA.type === 'growth_facilitator' ?
                            "Your patient approach works well - they need unhurried, calm learning environments." :
                            "Model quiet, focused reading. They'll absorb this calm approach naturally.",
                          strategies: [
                            "Create a dedicated, quiet reading space in your home",
                            "Use shorter reading sessions to match their attention span",
                            "Say 'Let's find a quiet spot for your reading time' and mean it"
                          ]
                        },
                        'I': { 
                          name: 'Independent (Self-Directed)', 
                          icon: '🗺️', 
                          color: '#8B5CF6',
                          meaning: `${student.firstName} reads best when they have autonomy and control over their reading journey.`,
                          yourApproach: parentDNA.type === 'autonomy_supporter' ? 
                            "Perfect natural match! Your instincts align completely with what they need." :
                            parentDNA.type === 'competence_builder' ? 
                            "Frame skill-building as tools for greater independence, not requirements. Let them choose which skills to work on." :
                            parentDNA.type === 'connection_creator' ?
                            "Make connection optional, not expected. They'll share when and how they want to." :
                            parentDNA.type === 'meaning_maker' ?
                            "Let them discover meaning themselves. Ask open questions but don't push for specific insights." :
                            parentDNA.type === 'growth_facilitator' ?
                            "Let them set their own developmental pace. Provide support as options, not requirements." :
                            "Your authentic approach resonates with them - they want to see genuine choice-making in action.",
                          strategies: [
                            "Provide many options but let them choose freely",
                            "Say 'What kind of book are you in the mood for?' and trust their answer",
                            "Avoid micromanaging their reading process or pace"
                          ]
                        },
                        'P': { 
                          name: 'Practical (Purpose-Driven)', 
                          icon: '🎯', 
                          color: '#F59E0B',
                          meaning: `${student.firstName} is motivated by reading that connects to their interests and has clear value.`,
                          yourApproach: parentDNA.type === 'autonomy_supporter' ? 
                            "Honor their practical nature by connecting reading to their genuine interests and goals." :
                            parentDNA.type === 'competence_builder' ? 
                            "Show them how reading skills apply to things they care about. Make the purpose clear." :
                            parentDNA.type === 'connection_creator' ?
                            "Connect with them around their interests. Share books that relate to things they're passionate about." :
                            parentDNA.type === 'meaning_maker' ?
                            "Perfect match! Help them see how books connect to their life, interests, and goals." :
                            parentDNA.type === 'growth_facilitator' ?
                            "Support their development through their interests. Let their passions drive their reading growth." :
                            "Model how you use reading for practical purposes in your own life.",
                          strategies: [
                            "Connect ALL reading to their current interests and hobbies",
                            "Say 'How does this book connect to [their interest]?' and explore it together",
                            "Choose books that help them with things they actually want to do"
                          ]
                        },
                        'G': { 
                          name: 'Growth-Oriented (Embraces Challenge)', 
                          icon: '🌟', 
                          color: '#10B981',
                          meaning: `${student.firstName} sees confusion and difficulty as signs their brain is growing.`,
                          yourApproach: parentDNA.type === 'autonomy_supporter' ? 
                            "They want challenging books! Trust their readiness to tackle difficult material." :
                            parentDNA.type === 'competence_builder' ? 
                            "Dream pairing! They want exactly what you provide - strategic support for tackling challenges." :
                            parentDNA.type === 'connection_creator' ?
                            "Celebrate their growth mindset and be their cheerleader when they tackle difficult books." :
                            parentDNA.type === 'meaning_maker' ?
                            "They're ready for complex, meaningful books. Challenge and depth go hand in hand." :
                            parentDNA.type === 'growth_facilitator' ?
                            "They might be ready for bigger leaps than you naturally provide. Trust their appetite for challenge." :
                            "Show them your own struggles with challenging books. They want to see authentic effort.",
                          strategies: [
                            "Provide appropriately challenging books that stretch their skills",
                            "Say 'Your brain is really working hard right now!' when they encounter difficulty",
                            "Celebrate struggle as growth: 'You haven't mastered this YET, but you're learning'"
                          ]
                        },
                        'R': { 
                          name: 'Routine-Loving (Thrives with Structure)', 
                          icon: '📅', 
                          color: '#6366F1',
                          meaning: `${student.firstName} reads best when they have predictable routines and know what to expect.`,
                          yourApproach: parentDNA.type === 'autonomy_supporter' ? 
                            "They need more structure than you naturally provide. Create predictable reading routines within their choices." :
                            parentDNA.type === 'competence_builder' ? 
                            "Your systematic approach is perfect for them. They love predictable skill-building routines." :
                            parentDNA.type === 'connection_creator' ?
                            "Create regular reading traditions and rituals they can count on." :
                            parentDNA.type === 'meaning_maker' ?
                            "Establish regular times for reflection and discussion so they know when to expect deeper conversations." :
                            parentDNA.type === 'growth_facilitator' ?
                            "Perfect match! Your developmental approach provides exactly the kind of predictable structure they crave." :
                            "Model consistent reading routines. They want to see how reading fits into a structured life.",
                          strategies: [
                            "Establish consistent daily reading time and place",
                            "Create predictable reading rituals they can count on",
                            "Say 'It's time for our daily reading hour' and stick to the routine"
                          ]
                        }
                      }

                      const info = modifierInfo[modifier]
                      if (!info) return null

                      return (
                        <ExpandableSection
                          key={modifier}
                          id={modifier}
                          title={info.name}
                          icon={info.icon}
                          isExpanded={expandedSections[modifier]}
                          borderColor={info.color}
                          headerColor={info.color}
                          preview={info.meaning.substring(0, 50) + "..."}
                        >
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{
                              fontSize: '12px',
                              color: luxTheme.textPrimary,
                              lineHeight: '1.4',
                              marginBottom: '8px'
                            }}>
                              <strong>What this means:</strong> {info.meaning}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: luxTheme.textPrimary,
                              lineHeight: '1.4',
                              padding: '10px',
                              backgroundColor: `${info.color}10`,
                              borderRadius: '8px',
                              borderLeft: `3px solid ${info.color}`
                            }}>
                              <strong>Your {parentData?.name || parentDNA.details.name} approach:</strong> {info.yourApproach}
                            </div>
                          </div>

                          <div>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: luxTheme.textPrimary,
                              marginBottom: '8px'
                            }}>
                              Specific strategies for {student.firstName}:
                            </div>
                            <div style={{ display: 'grid', gap: '6px' }}>
                              {info.strategies.map((strategy, idx) => (
                                <div key={idx} style={{
                                  fontSize: '11px',
                                  color: luxTheme.textPrimary,
                                  padding: '8px 10px',
                                  backgroundColor: luxTheme.surface,
                                  borderRadius: '6px',
                                  borderLeft: `3px solid ${info.color}`,
                                  lineHeight: '1.3'
                                }}>
                                  • {strategy}
                                </div>
                              ))}
                            </div>
                          </div>
                        </ExpandableSection>
                      )
                    })}
                  </div>
                </div>
              )}



              {/* If no modifiers, show base type support */}
              {(!student.readingDNA?.modifiers || student.readingDNA.modifiers.length === 0) && (
                <div style={{
                  backgroundColor: `${luxTheme.primary}15`,
                  borderRadius: '16px',
                  padding: '20px',
                  marginTop: '20px',
                  border: `1px solid ${luxTheme.primary}40`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>⭐</div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 12px 0'
                  }}>
                    Supporting {student.firstName}'s Core Reading Style
                  </h4>
                  <p style={{
                    fontSize: '13px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {student.firstName} is a {parentGuidance?.childType || 'unique reader'} who thrives with understanding and support tailored to their individual personality.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* GROWTH TAB */}
          {activeTab === 'growth' && (
            <div>
              {enhancedCompat?.realityCheck?.growthOpportunity ? (
                <>
                  {/* Growth Opportunity - Always visible */}
                  <div style={{
                    backgroundColor: '#10B98115',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid #10B98130',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌟</div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#047857',
                      margin: '0 0 16px 0'
                    }}>
                      Your Growth Opportunity Together
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#047857',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {enhancedCompat.realityCheck.growthOpportunity}
                    </p>
                  </div>

                  {/* Expandable Growth Details */}
                  <ExpandableSection
                    id="growthDetails"
                    title="What You're Learning From Each Other"
                    icon="🔄"
                    isExpanded={expandedSections.growthDetails}
                    borderColor={luxTheme.accent}
                    preview="Discover how you both grow through this partnership..."
                  >
                    <div style={{
                      display: 'grid',
                      gap: '12px'
                    }}>
                      <div style={{
                        backgroundColor: luxTheme.surface,
                        borderRadius: '10px',
                        padding: '14px',
                        borderLeft: `4px solid ${luxTheme.accent}`
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: luxTheme.textPrimary, marginBottom: '6px' }}>
                          What {student.firstName} teaches you:
                        </div>
                        <div style={{ fontSize: '12px', color: luxTheme.textPrimary, lineHeight: '1.4' }}>
                          How to stay curious, embrace their natural learning style, and remember that reading joy is the ultimate goal.
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: luxTheme.surface,
                        borderRadius: '10px',
                        padding: '14px',
                        borderLeft: `4px solid ${luxTheme.accent}`
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: luxTheme.textPrimary, marginBottom: '6px' }}>
                          What you teach {student.firstName}:
                        </div>
                        <div style={{ fontSize: '12px', color: luxTheme.textPrimary, lineHeight: '1.4' }}>
                          The tools, strategies, and support they need to become a confident, capable reader who loves books.
                        </div>
                      </div>
                    </div>
                  </ExpandableSection>
                </>
              ) : (
                /* Fallback growth content */
                <div style={{
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 16px 0'
                  }}>
                    Growing Together
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    lineHeight: '1.5',
                    margin: '0 0 20px 0'
                  }}>
                    Every parent-child reading partnership is a journey of mutual growth and discovery.
                  </p>
                  
                  <div style={{
                    backgroundColor: `${luxTheme.primary}15`,
                    borderRadius: '16px',
                    padding: '20px',
                    border: `1px solid ${luxTheme.primary}40`
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: '0 0 12px 0'
                    }}>
                      🎯 Focus on Connection
                    </h4>
                    <p style={{
                      fontSize: '13px',
                      color: luxTheme.textPrimary,
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      The most important thing you can do is maintain a positive, connected relationship around reading. When children feel supported and understood, they naturally develop stronger reading skills and motivation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}