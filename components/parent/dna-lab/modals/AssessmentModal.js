// components/parent/dna-lab/modals/AssessmentModal.js - TRANSFORMED VERSION
import { useState, useEffect } from 'react'
import { luxTheme } from '../../../../utils/theme'
import { parentDNAQuestions } from '../../../../utils/dnaTypes'

export default function AssessmentModal({
  showAssessment,
  currentQuestion,
  answers,
  onAnswerSelect,
  onClose
}) {
  const [showWelcome, setShowWelcome] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isProgressing, setIsProgressing] = useState(false)

  const question = parentDNAQuestions[currentQuestion]
  if (!showAssessment) return null

  // Welcome screen for first question
  if (showWelcome && currentQuestion === 0) {
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
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
          {/* Animated DNA Helix */}
          <div style={{
            fontSize: '64px',
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}>
            🧬
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: luxTheme.textPrimary,
            marginBottom: '12px',
            fontFamily: 'Didot, "Times New Roman", serif'
          }}>
            Discover Your Reading Parent DNA!
          </h2>

          <div style={{
            backgroundColor: `${luxTheme.primary}20`,
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>🔬</span>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: luxTheme.textPrimary
            }}>
              Research-Inspired Parent Assessment
            </span>
          </div>

          <p style={{
            fontSize: '16px',
            color: luxTheme.textSecondary,
            lineHeight: '1.5',
            marginBottom: '24px'
          }}>
            Discover your natural parenting style and unlock personalized strategies for supporting your family&apos;s reading journey!
          </p>

          <div style={{
            backgroundColor: '#FEF9E7',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#92400E',
              marginBottom: '8px'
            }}>
              ✨ What makes this scientific?
            </div>
            <div style={{
              fontSize: '12px',
              color: '#92400E',
              lineHeight: '1.4'
            }}>
              Based on decades of research about what helps families create lifelong readers. This fun assessment reveals your unique strengths as a reading parent!
            </div>
          </div>

          <button
            onClick={() => setShowWelcome(false)}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              borderRadius: '16px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            🚀 Start Discovery
          </button>

          <div style={{
            fontSize: '11px',
            color: luxTheme.textSecondary,
            fontStyle: 'italic'
          }}>
            Takes 3-4 minutes • {parentDNAQuestions.length} insightful questions
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: luxTheme.textSecondary,
              border: 'none',
              padding: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    )
  }

  if (!question) return null

  const handleAnswerClick = (optionId) => {
    setSelectedAnswer(optionId)
    setIsProgressing(true)
    
    // Add brief delay for visual feedback
    setTimeout(() => {
      onAnswerSelect(optionId)
      setSelectedAnswer(null)
      setIsProgressing(false)
    }, 300)
  }

  const progressPercentage = ((currentQuestion + 1) / parentDNAQuestions.length) * 100

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
        maxWidth: '480px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <button
          onClick={onClose}
          disabled={isProgressing}
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
            cursor: isProgressing ? 'wait' : 'pointer',
            zIndex: 10,
            opacity: isProgressing ? 0.5 : 1
          }}
        >
          ✕
        </button>

        {/* Enhanced Header */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
          borderRadius: '24px 24px 0 0',
          padding: '24px',
          textAlign: 'center',
          color: luxTheme.textPrimary
        }}>
          <div style={{
            fontSize: '32px',
            marginBottom: '12px'
          }}>
            🧬
          </div>
          
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            fontFamily: 'Didot, "Times New Roman", serif'
          }}>
            Reading Parent DNA Discovery
          </h3>
          
          <div style={{
            fontSize: '12px',
            opacity: 0.9
          }}>
            Question {currentQuestion + 1} of {parentDNAQuestions.length}
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div style={{ padding: '0 24px' }}>
          <div style={{
            backgroundColor: '#E0E0E0',
            borderRadius: '6px',
            height: '8px',
            marginTop: '-4px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: `linear-gradient(90deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
              height: '100%',
              width: `${progressPercentage}%`,
              borderRadius: '6px',
              transition: 'width 0.4s ease',
              position: 'relative'
            }}>
              {/* Animated shine effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: progressPercentage > 0 ? 'shimmer 2s infinite' : 'none'
              }} />
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            fontSize: '11px',
            color: luxTheme.textSecondary,
            marginTop: '8px'
          }}>
            {Math.round(progressPercentage)}% Complete • {parentDNAQuestions.length - currentQuestion - 1} questions remaining
          </div>
        </div>

        {/* Question Content */}
        <div style={{ padding: '24px' }}>
          {/* Research Badge */}
          <div style={{
            backgroundColor: `${luxTheme.secondary}20`,
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '12px' }}>🔬</span>
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              color: luxTheme.textSecondary
            }}>
              Research-Based Question
            </span>
          </div>

          <h4 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: luxTheme.textPrimary,
            marginBottom: '20px',
            lineHeight: '1.4',
            textAlign: 'center'
          }}>
            {question.question}
          </h4>

          {/* Answer Options */}
          <div style={{ display: 'grid', gap: '12px' }}>
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option.id
              const isDisabled = isProgressing && !isSelected
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerClick(option.id)}
                  disabled={isProgressing}
                  style={{
                    backgroundColor: isSelected ? `${luxTheme.primary}30` : luxTheme.surface,
                    border: `2px solid ${isSelected ? luxTheme.primary : `${luxTheme.primary}40`}`,
                    borderRadius: '14px',
                    padding: '16px',
                    fontSize: '14px',
                    color: luxTheme.textPrimary,
                    cursor: isProgressing ? 'wait' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                    lineHeight: '1.4',
                    minHeight: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: isDisabled ? 0.6 : 1,
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isProgressing && !isSelected) {
                      e.target.style.backgroundColor = `${luxTheme.primary}20`
                      e.target.style.borderColor = `${luxTheme.primary}60`
                      e.target.style.transform = 'scale(1.01)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProgressing && !isSelected) {
                      e.target.style.backgroundColor = luxTheme.surface
                      e.target.style.borderColor = `${luxTheme.primary}40`
                      e.target.style.transform = 'scale(1)'
                    }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {option.text}
                  </div>
                  {isSelected && (
                    <div style={{
                      marginLeft: '12px',
                      fontSize: '16px',
                      color: luxTheme.primary
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Encouragement Messages */}
          {currentQuestion === Math.floor(parentDNAQuestions.length / 2) && (
            <div style={{
              backgroundColor: `${luxTheme.accent}15`,
              borderRadius: '12px',
              padding: '12px',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '16px',
                marginBottom: '4px'
              }}>
                🌟
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: luxTheme.textPrimary
              }}>
                You&apos;re halfway there! Your parenting DNA is taking shape...
              </div>
            </div>
          )}

          {currentQuestion === parentDNAQuestions.length - 1 && (
            <div style={{
              backgroundColor: `${luxTheme.primary}15`,
              borderRadius: '12px',
              padding: '12px',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '16px',
                marginBottom: '4px'
              }}>
                🎉
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: luxTheme.textPrimary
              }}>
                Final question! Your reading parent type is about to be revealed...
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {isProgressing && (
            <div style={{
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '12px',
              color: luxTheme.textSecondary
            }}>
              <div style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: `2px solid ${luxTheme.primary}40`,
                borderTop: `2px solid ${luxTheme.primary}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }} />
              Processing your response...
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}