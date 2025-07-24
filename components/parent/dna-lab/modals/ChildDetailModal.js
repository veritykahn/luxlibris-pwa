// components/parent/dna-lab/modals/ChildDetailModal.js - WITH EXPANDABLE SECTIONS
import { useState, useCallback } from 'react'
import { luxTheme } from '../../../../utils/theme'
import { getCompatibilityInsights, getParentGuidanceForChild } from '../../../../utils/compatibilityInsights'
import { formatDNACode } from '../../../../utils/dnaCalculations'

export default function ChildDetailModal({ student, parentDNA, onClose }) {
  const [expandedSections, setExpandedSections] = useState({
    corePersonality: false,
    learningTraits: false,
    whatThisMeans: false,
    perfectBooks: false,
    readingJourney: false
  })

  const toggleSection = useCallback((sectionKey) => {
    console.log('Toggling section:', sectionKey)
    setExpandedSections(prev => {
      const newState = {
        ...prev,
        [sectionKey]: !prev[sectionKey]
      }
      console.log('New expanded state:', newState)
      return newState
    })
  }, [])

  // Expandable Section Component
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
      console.log('Button clicked for section:', id)
      toggleSection(id)
    }, [id])

    return (
      <div style={{
        backgroundColor: `${borderColor}15`,
        borderRadius: '12px',
        marginBottom: '16px',
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
                maxWidth: '180px',
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

  if (!student || !student.readingDNA || !parentDNA) return null

  const parentGuidance = getParentGuidanceForChild(student.readingDNA)
  if (!parentGuidance) return null

  // Child type colors (matching student experience)
  const dnaTypeColors = {
    creative_explorer: '#FF6B9D',
    curious_investigator: '#4ECDC4', 
    social_connector: '#95E1D3',
    challenge_seeker: '#D4A574',
    freedom_reader: '#AED6F1',
    reflective_thinker: '#4A5568'
  }

  const childTypeColor = dnaTypeColors[student.readingDNA.type] || luxTheme.primary

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
        maxWidth: '450px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            fontSize: '16px',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          ✕
        </button>

        {/* Enhanced Header with Child's DNA Theme */}
        <div style={{
          background: `linear-gradient(135deg, #4ECDC4, #44B8B5)`,
          borderRadius: '24px 24px 0 0',
          padding: '28px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
            backgroundSize: '100px 100px'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '12px'
            }}>
              🧬
            </div>
            
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '22px',
              fontWeight: '600',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              {student.firstName}&apos;s Reading DNA
            </h3>
            
            <div style={{
              backgroundColor: childTypeColor,
              color: 'white',
              borderRadius: '16px',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'inline-block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              marginBottom: '8px'
            }}>
              {parentGuidance.childType}
            </div>
            
            <div style={{
              fontSize: '11px',
              opacity: 0.9,
              fontFamily: 'monospace',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '4px 8px',
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              DNA-{formatDNACode(student.readingDNA)}
            </div>
          </div>
        </div>

        <div style={{ padding: '28px' }}>
          {/* Child's Core Reading Personality - Always Visible */}
          <div style={{
            backgroundColor: `${childTypeColor}15`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            border: `1px solid ${childTypeColor}30`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px'
            }}>
              {student.readingDNA?.details?.emoji || '📚'}
            </div>
            
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 12px 0'
            }}>
              Who {student.firstName} Is as a Reader:
            </h4>
            
            <p style={{
              fontSize: '14px',
              color: luxTheme.textPrimary,
              lineHeight: '1.5',
              margin: 0
            }}>
              {parentGuidance.quickSummary}
            </p>
          </div>

          {/* Learning Style Traits - Expandable with Darker Color */}
          {parentGuidance.hasModifiers && (
            <ExpandableSection
              id="learningTraits"
              title={`${student.firstName}'s Learning Style Traits`}
              icon="🌟"
              isExpanded={expandedSections.learningTraits}
              borderColor="#4A5568"
              headerColor="#2D3748"
              preview={`${parentGuidance.modifierExplanations.length} special traits that shape how they learn...`}
            >
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {parentGuidance.modifierExplanations.map((modifier, idx) => (
                  <div key={idx} style={{
                    backgroundColor: luxTheme.surface,
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid #4A556840`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        backgroundColor: `#4A556820`,
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#2D3748'
                      }}>
                        {modifier.code}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2D3748'
                      }}>
                        {modifier.name}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary,
                      lineHeight: '1.4'
                    }}>
                      {modifier.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}

          {/* What This Means for Child - Expandable */}
          <ExpandableSection
            id="whatThisMeans"
            title={`What This Means for ${student.firstName}`}
            icon="💡"
            isExpanded={expandedSections.whatThisMeans}
            borderColor={childTypeColor}
            headerColor={childTypeColor}
            preview="Key strategies that work best for their reading style..."
          >
            <div style={{
              display: 'grid',
              gap: '10px'
            }}>
              {(parentGuidance.keyStrategies || []).slice(0, 3).map((strategy, index) => (
                <div key={index} style={{
                  fontSize: '12px',
                  color: luxTheme.textPrimary,
                  padding: '12px 14px',
                  backgroundColor: luxTheme.surface,
                  borderRadius: '10px',
                  borderLeft: `4px solid ${childTypeColor}`,
                  lineHeight: '1.4',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ 
                    fontSize: '14px',
                    flexShrink: 0,
                    marginTop: '1px'
                  }}>
                    •
                  </span>
                  <span>{strategy}</span>
                </div>
              ))}
            </div>
          </ExpandableSection>

          {/* Perfect Books for This Reader - Expandable */}
          {parentGuidance.bookRecommendations && (
            <ExpandableSection
              id="perfectBooks"
              title={`Perfect Books for ${student.firstName}`}
              icon="📚"
              isExpanded={expandedSections.perfectBooks}
              borderColor={luxTheme.accent}
              headerColor={luxTheme.accent}
              preview={`${parentGuidance.bookRecommendations.length} book recommendations tailored to their style...`}
            >
              <div style={{
                display: 'grid',
                gap: '8px'
              }}>
                {parentGuidance.bookRecommendations.slice(0, 4).map((rec, idx) => (
                  <div key={idx} style={{
                    fontSize: '12px',
                    color: luxTheme.textPrimary,
                    padding: '10px 12px',
                    backgroundColor: luxTheme.surface,
                    borderRadius: '8px',
                    lineHeight: '1.3',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <span style={{ 
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      📖
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
                
                {parentGuidance.bookRecommendations.length > 4 && (
                  <div style={{
                    fontSize: '11px',
                    color: luxTheme.textSecondary,
                    textAlign: 'center',
                    fontStyle: 'italic',
                    marginTop: '8px'
                  }}>
                    + more recommendations based on their reading personality
                  </div>
                )}
              </div>
            </ExpandableSection>
          )}

          {/* Understanding Their Reading Journey - Always Visible */}
          <div style={{
            backgroundColor: `${luxTheme.primary}10`,
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            border: `1px solid ${luxTheme.primary}30`
          }}>
            <div style={{
              fontSize: '24px',
              marginBottom: '12px'
            }}>
              🌟
            </div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 8px 0'
            }}>
              Remember About {student.firstName}:
            </h4>
            <p style={{
              fontSize: '12px',
              color: luxTheme.textSecondary,
              margin: 0,
              lineHeight: '1.4'
            }}>
              Every reader is unique! Understanding {student.firstName}&apos;s natural {parentGuidance.childType} style 
              helps you support their reading journey in ways that feel natural and exciting to them.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}