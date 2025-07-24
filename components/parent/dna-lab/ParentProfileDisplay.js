// components/parent/dna-lab/ParentProfileDisplay.js - TRANSFORMED VERSION
import { useState } from 'react'
import { luxTheme } from '../../../utils/theme' 
import { getQuickTips } from '../../../utils/dnaCalculations'
import ParentDetailModal from './modals/ParentDetailModal'

export default function ParentProfileDisplay({ parentDNA, onStartAssessment, linkedStudentCount = 0 }) {
  const [showQuickTips, setShowQuickTips] = useState(false)
  const [showDetailedParentModal, setShowDetailedParentModal] = useState(false)
  const [completedTips, setCompletedTips] = useState(new Set())

  if (!parentDNA || !parentDNA.details) return null

  const toggleTipComplete = (tipIndex) => {
    const newCompleted = new Set(completedTips)
    if (newCompleted.has(tipIndex)) {
      newCompleted.delete(tipIndex)
    } else {
      newCompleted.add(tipIndex)
    }
    setCompletedTips(newCompleted)
  }

  const dailyTips = getQuickTips(parentDNA.type)?.daily || []
  const weeklyTips = getQuickTips(parentDNA.type)?.weekly || []

  return (
    <>
      {/* Enhanced Parent DNA Profile Card */}
      <div style={{
        backgroundColor: luxTheme.surface,
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
        textAlign: 'center',
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
          background: `linear-gradient(45deg, ${parentDNA.details.color}08 25%, transparent 25%), linear-gradient(-45deg, ${parentDNA.details.color}08 25%, transparent 25%)`,
          backgroundSize: '30px 30px',
          opacity: 0.5
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Enhanced Big Circle with Animation */}
          <div style={{
            width: '140px',
            height: '140px',
            backgroundColor: parentDNA.details.color,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '72px',
            boxShadow: `0 12px 32px ${parentDNA.details.color}50`,
            position: 'relative',
            transition: 'transform 0.3s ease'
          }}>
            {parentDNA.details.emoji}
            
            {/* Floating research badge */}
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: luxTheme.surface,
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              🔬
            </div>
          </div>

          <h3 style={{
            fontSize: '26px',
            fontWeight: '600',
            color: luxTheme.textPrimary,
            margin: '0 0 8px 0',
            fontFamily: 'Didot, "Times New Roman", serif'
          }}>
            You are a {parentDNA.details.name}!
          </h3>

          {/* Research-based badge */}
          <div style={{
            backgroundColor: `${parentDNA.details.color}20`,
            borderRadius: '12px',
            padding: '6px 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '12px' }}>🧬</span>
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              color: luxTheme.textPrimary
            }}>
              Research-Inspired Parent Type
            </span>
          </div>

          <p style={{
            fontSize: '16px',
            color: luxTheme.textPrimary,
            lineHeight: '1.5',
            marginBottom: '24px',
            maxWidth: '400px',
            margin: '0 auto 24px'
          }}>
            {parentDNA.details.description}
          </p>

          {/* Action buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            maxWidth: '300px',
            margin: '0 auto 16px'
          }}>
            <button
              onClick={() => setShowDetailedParentModal(true)}
              style={{
                backgroundColor: parentDNA.details.color,
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              📖 Learn More
            </button>
            
            <button
              onClick={onStartAssessment}
              style={{
                backgroundColor: 'transparent',
                color: parentDNA.details.color,
                border: `2px solid ${parentDNA.details.color}60`,
                borderRadius: '16px',
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔄 Retake
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '20px'
          }}>
            <div style={{
              backgroundColor: `${luxTheme.primary}15`,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: luxTheme.textPrimary
              }}>
                {completedTips.size}
              </div>
              <div style={{
                fontSize: '11px',
                color: luxTheme.textSecondary
              }}>
                Tips Tried Today
              </div>
            </div>
            
            <div style={{
              backgroundColor: `${luxTheme.secondary}15`,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: luxTheme.textPrimary
              }}>
                {linkedStudentCount}
              </div>
              <div style={{
                fontSize: '11px',
                color: luxTheme.textSecondary
              }}>
                Children Connected
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Daily Tips */}
      <div style={{
        backgroundColor: luxTheme.surface,
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 4px 0'
            }}>
              ⚡ Your Daily Toolkit
            </h3>
            <div style={{
              fontSize: '12px',
              color: luxTheme.textSecondary
            }}>
              Personalized for your {parentDNA.details.name} style
            </div>
          </div>
          
          <button
            onClick={() => setShowQuickTips(!showQuickTips)}
            style={{
              backgroundColor: showQuickTips ? luxTheme.textSecondary : parentDNA.details.color,
              border: 'none',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {showQuickTips ? '✕ Close' : '✨ Show Tips'}
          </button>
        </div>

        {showQuickTips && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Daily Tips Section */}
            <div style={{
              backgroundColor: `${luxTheme.primary}10`,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>💡</span>
                Daily Strategies ({completedTips.size}/{dailyTips.length} tried)
              </div>
              
              {dailyTips.map((tip, index) => {
                const isCompleted = completedTips.has(index)
                
                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '12px',
                    padding: '12px',
                    backgroundColor: isCompleted ? `${luxTheme.secondary}20` : 'white',
                    borderRadius: '12px',
                    borderLeft: `4px solid ${isCompleted ? luxTheme.secondary : parentDNA.details.color}`,
                    transition: 'all 0.3s ease'
                  }}>
                    <button
                      onClick={() => toggleTipComplete(index)}
                      style={{
                        backgroundColor: isCompleted ? luxTheme.secondary : 'transparent',
                        border: `2px solid ${isCompleted ? luxTheme.secondary : parentDNA.details.color}`,
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '10px',
                        color: isCompleted ? 'white' : parentDNA.details.color,
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {isCompleted ? '✓' : ''}
                    </button>
                    
                    <span style={{
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      lineHeight: '1.4',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      opacity: isCompleted ? 0.7 : 1
                    }}>
                      {tip}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Weekly Tips Preview */}
            <div style={{
              backgroundColor: `${luxTheme.accent}10`,
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📅</span>
                Weekly Strategies
              </div>
              
              {weeklyTips.slice(0, 2).map((tip, index) => (
                <div key={index} style={{
                  fontSize: '13px',
                  color: luxTheme.textPrimary,
                  padding: '8px 12px',
                  backgroundColor: `${luxTheme.accent}20`,
                  borderRadius: '8px',
                  marginBottom: '8px',
                  borderLeft: `3px solid ${luxTheme.accent}`
                }}>
                  • {tip}
                </div>
              ))}
              
              {weeklyTips.length > 2 && (
                <div style={{
                  fontSize: '11px',
                  color: luxTheme.textSecondary,
                  textAlign: 'center',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  + {weeklyTips.length - 2} more weekly strategies in full profile
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Parent Detail Modal */}
      {showDetailedParentModal && (
        <ParentDetailModal
          parentDNA={parentDNA}
          onClose={() => setShowDetailedParentModal(false)}
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
}