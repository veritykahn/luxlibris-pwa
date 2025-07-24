// components/parent/dna-lab/ChildDNACard.js - FIXED VERSION
import { useState } from 'react'
import { luxTheme } from '../../../utils/theme'
import { getCompatibilityInsights, getParentGuidanceForChild } from '../../../utils/compatibilityInsights'
import { formatDNACode } from '../../../utils/dnaCalculations'
import CompatibilityModal from './modals/CompatibilityModal'
import ChildDetailModal from './modals/ChildDetailModal'

export default function ChildDNACard({ student, parentDNA, onUnlockDNA }) {
  const [expandedChild, setExpandedChild] = useState(null)
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false)
  const [showDetailedChildModal, setShowDetailedChildModal] = useState(false)
  const [starredStrategies, setStarredStrategies] = useState(new Set())
  
  const hasCompletedDNA = student.readingDNA && student.readingDNA.type
  const hasUnlockedDNA = student.dnaUnlocked === true
  const parentGuidance = hasCompletedDNA ? getParentGuidanceForChild(student.readingDNA) : null
  const isExpanded = expandedChild === student.id

  const toggleStarStrategy = (strategyIndex) => {
    const newStarred = new Set(starredStrategies)
    const key = `${student.id}-${strategyIndex}`
    if (newStarred.has(key)) {
      newStarred.delete(key)
    } else {
      newStarred.add(key)
    }
    setStarredStrategies(newStarred)
  }

  // Reading DNA type colors (matching student experience)
  const dnaTypeColors = {
    creative_explorer: '#FF6B9D',
    curious_investigator: '#4ECDC4', 
    social_connector: '#95E1D3',
    challenge_seeker: '#D4A574',
    freedom_reader: '#AED6F1',
    reflective_thinker: '#4A5568'
  }

  const childTypeColor = hasCompletedDNA ? 
    dnaTypeColors[student.readingDNA.type] || luxTheme.primary : luxTheme.textSecondary
  
  if (hasCompletedDNA) {
    const compatibility = getCompatibilityInsights(
      parentDNA.type, 
      student.readingDNA?.type, 
      student.readingDNA?.modifiers || []
    )

    const compatibilityColors = {
      'Excellent Match': '#10B981',
      'Strong Match': '#059669', 
      'Good Match': '#F59E0B',
      'Growing Together': '#6B7280'
    }

    return (
      <>
        <div style={{
          backgroundColor: luxTheme.surface,
          borderRadius: '20px',
          padding: '24px',
          border: `2px solid ${childTypeColor}30`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,  
            bottom: 0,
            background: `linear-gradient(45deg, ${childTypeColor}08 25%, transparent 25%), linear-gradient(-45deg, ${childTypeColor}08 25%, transparent 25%)`,
            backgroundSize: '20px 20px',
            opacity: 0.5
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Enhanced Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {/* Enhanced Child Avatar */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: childTypeColor,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: `0 4px 12px ${childTypeColor}40`,
                  position: 'relative'
                }}>
                  {student.readingDNA?.details?.emoji || '🧬'}
                  
                  {/* DNA badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    backgroundColor: luxTheme.surface,
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    🧬
                  </div>
                </div>
                
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: '4px'
                  }}>
                    {student.firstName}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: luxTheme.textSecondary,
                    marginBottom: '4px'
                  }}>
                    Grade {student.grade} • {parentGuidance?.childType || 'Reading DNA Complete'}
                  </div>
                  {/* Enhanced DNA Code Display */}
                  <div style={{
                    fontSize: '10px',
                    color: childTypeColor,
                    fontWeight: '600',
                    backgroundColor: `${childTypeColor}20`,
                    padding: '3px 8px',
                    borderRadius: '8px',
                    display: 'inline-block',
                    fontFamily: 'monospace'
                  }}>
                    DNA-{formatDNACode(student.readingDNA)}
                  </div>
                </div>
              </div>
              
              {/* Enhanced Compatibility Badge */}
              <div style={{
                backgroundColor: compatibilityColors[compatibility.level] || '#6B7280',
                color: 'white',
                borderRadius: '16px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '100px'
              }}>
                <div style={{ fontSize: '16px', marginBottom: '2px' }}>
                  {compatibility.level === 'Excellent Match' ? '🌟' :
                   compatibility.level === 'Strong Match' ? '✨' :
                   compatibility.level === 'Good Match' ? '👍' : '🌱'}
                </div>
                <div style={{ fontSize: '10px' }}>
                  {compatibility.level}
                </div>
              </div>
            </div>

            {/* Enhanced Reading Type Summary */}
            <div style={{
              backgroundColor: `${childTypeColor}15`,
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px',
              border: `1px solid ${childTypeColor}30`
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>
                  {student.readingDNA?.details?.emoji || '📚'}
                </span>
                {parentGuidance?.childType}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: luxTheme.textPrimary,
                lineHeight: '1.4',
                marginBottom: '12px'
              }}>
                {parentGuidance?.quickSummary}
              </div>
              
              {/* Enhanced Modifier Display */}
              {parentGuidance?.hasModifiers && (
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: '8px'
                  }}>
                    🌟 Learning Style Traits:
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {parentGuidance.modifierExplanations.map((modifier, idx) => (
                      <span key={idx} style={{
                        backgroundColor: `${luxTheme.secondary}20`,
                        color: luxTheme.textPrimary,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        border: `1px solid ${luxTheme.secondary}40`
                      }}>
                        {modifier.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Quick Compatibility Insight */}
            <div style={{
              backgroundColor: `${compatibilityColors[compatibility.level]}15`,
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px',
              border: `1px solid ${compatibilityColors[compatibility.level]}30`
            }}>
              <div style={{
                fontSize: '13px',
                color: luxTheme.textPrimary,
                lineHeight: '1.4',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '16px', marginRight: '8px' }}>🎯</span>
                <strong>This Week&apos;s Focus:</strong> {(parentGuidance?.keyStrategies || compatibility.tips || [])[0] || 'Try reading together and notice what excites them most!'}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: isExpanded ? '16px' : '0'
            }}>
              <button
                onClick={() => setExpandedChild(isExpanded ? null : student.id)}
                style={{
                  backgroundColor: 'transparent',
                  border: `2px solid ${childTypeColor}60`,
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: childTypeColor,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {isExpanded ? '➖ Less' : '➕ Strategies'}
              </button>
              
              <button
                onClick={() => setShowCompatibilityModal(true)}
                style={{
                  backgroundColor: '#FF6B9D',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                🤝 Parent Match
              </button>

              <button
                onClick={() => setShowDetailedChildModal(true)}
                style={{
                  backgroundColor: '#4ECDC4',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                🧬 Child&apos;s DNA
              </button>
            </div>

            {/* Enhanced Expanded Section */}
            {isExpanded && (
              <div style={{
                backgroundColor: `${luxTheme.primary}10`,
                borderRadius: '16px',
                padding: '20px',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  ✨ Personalized Strategies for {student.firstName}
                </div>
                
                <div style={{
                  display: 'grid',
                  gap: '10px',
                  marginBottom: '16px'
                }}>
                  {(parentGuidance?.keyStrategies || []).map((strategy, idx) => {
                    const strategyKey = `${student.id}-${idx}`
                    const isStarred = starredStrategies.has(strategyKey)
                    
                    return (
                      <div key={idx} style={{
                        fontSize: '12px',
                        color: luxTheme.textPrimary,
                        padding: '12px 16px',
                        backgroundColor: luxTheme.surface,
                        borderRadius: '12px',
                        borderLeft: `4px solid ${childTypeColor}`,
                        lineHeight: '1.4',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        position: 'relative'
                      }}>
                        <span style={{ 
                          fontSize: '14px', 
                          color: childTypeColor,
                          flexShrink: 0
                        }}>
                          💡
                        </span>
                        <span style={{ flex: 1 }}>
                          {strategy}
                        </span>
                        <button
                          onClick={() => toggleStarStrategy(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '2px',
                            borderRadius: '4px',
                            transition: 'transform 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          {isStarred ? '⭐' : '☆'}
                        </button>
                      </div>
                    )
                  })}
                </div>
                
                {/* Enhanced Book Recommendations - Show all to avoid errors */}
                {parentGuidance?.bookRecommendations && (
                  <div style={{
                    backgroundColor: `${luxTheme.secondary}15`,
                    borderRadius: '12px',
                    padding: '16px',
                    border: `1px solid ${luxTheme.secondary}30`
                  }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '16px' }}>📚</span>
                      Perfect Books for {student.firstName}:
                    </div>
                    <div style={{
                      display: 'grid',
                      gap: '6px'
                    }}>
                      {parentGuidance.bookRecommendations.map((rec, idx) => (
                        <div key={idx} style={{
                          fontSize: '11px',
                          color: luxTheme.textPrimary,
                          padding: '8px 12px',
                          backgroundColor: `${luxTheme.secondary}20`,
                          borderRadius: '8px',
                          lineHeight: '1.3'
                        }}>
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showCompatibilityModal && (
          <CompatibilityModal
            student={student}
            parentDNA={parentDNA}
            onClose={() => setShowCompatibilityModal(false)}
          />
        )}

        {showDetailedChildModal && (
          <ChildDetailModal
            student={student}
            parentDNA={parentDNA}
            onClose={() => setShowDetailedChildModal(false)}
          />
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </>
    )
  } else {
    // Enhanced unlock UI for children who haven't completed DNA
    return (
      <div style={{
        backgroundColor: hasUnlockedDNA ? '#FEF3C7' : '#F9FAFB',
        borderRadius: '20px',
        padding: '24px',
        border: hasUnlockedDNA ? '2px dashed #F59E0B' : '2px dashed #D1D5DB',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background pattern for unlocked state */}
        {hasUnlockedDNA && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, #F59E0B08 25%, transparent 25%), linear-gradient(-45deg, #F59E0B08 25%, transparent 25%)',
            backgroundSize: '20px 20px',
            opacity: 0.5
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Child info header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: hasUnlockedDNA ? '#F59E0B' : '#9CA3AF',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {hasUnlockedDNA ? '⏳' : '🔒'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary
                }}>
                  {student.firstName}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: luxTheme.textSecondary
                }}>
                  Grade {student.grade}
                </div>
              </div>
            </div>
            
            <div style={{
              backgroundColor: hasUnlockedDNA ? '#F59E0B' : '#6B7280',
              color: 'white',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {hasUnlockedDNA ? '⏳ Unlocked' : '🔒 Locked'}
            </div>
          </div>

          {hasUnlockedDNA ? (
            <div>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                animation: 'pulse 2s infinite'
              }}>
                🎯
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px'
              }}>
                Assessment Unlocked!
              </div>
              <div style={{
                fontSize: '13px',
                color: luxTheme.textSecondary,
                lineHeight: '1.4',
                maxWidth: '280px',
                margin: '0 auto'
              }}>
                {student.firstName} can now discover their Reading DNA! They&apos;ll find the assessment in their student dashboard under &quot;Lux DNA Lab.&quot;
              </div>
            </div>
          ) : (
            <div>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                opacity: 0.6
              }}>
                🧬
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px'
              }}>
                Reading DNA Locked
              </div>
              <div style={{
                fontSize: '13px',
                color: luxTheme.textSecondary,
                marginBottom: '20px',
                lineHeight: '1.4',
                maxWidth: '280px',
                margin: '0 auto 20px'
              }}>
                {student.firstName} needs your permission to discover their reading personality and unlock personalized strategies!
              </div>
              
              <button
                onClick={onUnlockDNA}
                style={{
                  backgroundColor: luxTheme.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                🔓 Unlock Reading DNA
              </button>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    )
  }
}