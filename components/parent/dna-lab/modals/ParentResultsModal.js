// components/parent/dna-lab/modals/ParentResultsModal.js - NEW CELEBRATION MODAL
import { useState } from 'react'
import { luxTheme } from '../../../../utils/theme'

export default function ParentResultsModal({ parentDNA, show, onClose, onViewDetails }) {
  const [showDetails, setShowDetails] = useState(false)
  
  if (!show || !parentDNA || !parentDNA.details) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
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

        {/* LARGE PARENT TYPE VISUAL */}
        <div style={{
          width: '280px',
          height: '320px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '40px',
          position: 'relative'
        }}>
          {/* Animated Background Glow */}
          <div style={{
            position: 'absolute',
            inset: '20px',
            background: `radial-gradient(circle, ${parentDNA.details.color}30 0%, ${parentDNA.details.color}15 40%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(20px)',
            animation: 'pulse 3s infinite',
            zIndex: 0
          }} />
          
          {/* Main Icon Container */}
          <div style={{
            width: '200px',
            height: '200px',
            backgroundColor: parentDNA.details.color,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '96px',
            boxShadow: `0 20px 40px ${parentDNA.details.color}40`,
            position: 'relative',
            zIndex: 1,
            animation: 'bounceIn 1s ease-out'
          }}>
            {parentDNA.details.emoji}
          </div>

          {/* Floating Research Icons */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '40px',
            fontSize: '24px',
            animation: 'float 3s ease-in-out infinite',
            animationDelay: '0s'
          }}>
            🔬
          </div>
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '30px',
            fontSize: '20px',
            animation: 'float 3s ease-in-out infinite',
            animationDelay: '1s'
          }}>
            📚
          </div>
          <div style={{
            position: 'absolute',
            top: '40px',
            left: '20px',
            fontSize: '18px',
            animation: 'float 3s ease-in-out infinite',
            animationDelay: '2s'
          }}>
            ✨
          </div>
        </div>

        {/* RESULTS CARD */}
        <div style={{
          backgroundColor: luxTheme.surface,
          borderRadius: '20px',
          padding: '28px',
          width: '90%',
          maxWidth: '360px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
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
            background: `linear-gradient(45deg, ${parentDNA.details.color}05 25%, transparent 25%), linear-gradient(-45deg, ${parentDNA.details.color}05 25%, transparent 25%)`,
            backgroundSize: '20px 20px',
            opacity: 0.3
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header */}
            <div style={{
              fontSize: '20px',
              marginBottom: '12px'
            }}>
              🎉✨🎉
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 12px 0',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              You are a {parentDNA.details.name}!
            </h2>

            {/* Research Badge */}
            <div style={{
              backgroundColor: `${parentDNA.details.color}20`,
              borderRadius: '12px',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '14px' }}>🔬</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: luxTheme.textPrimary
              }}>
                Research-Based Parent Type
              </span>
            </div>

            {/* Core Description */}
            <p style={{
              fontSize: '15px',
              color: luxTheme.textPrimary,
              lineHeight: '1.5',
              marginBottom: '20px'
            }}>
              {parentDNA.details.description}
            </p>

            {/* Research Note */}
            <div style={{
              backgroundColor: `${luxTheme.secondary}15`,
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '4px'
              }}>
                🧬 What the science says:
              </div>
              <div style={{
                fontSize: '11px',
                color: luxTheme.textSecondary,
                fontStyle: 'italic',
                lineHeight: '1.4'
              }}>
                {parentDNA.details.researchBase}
              </div>
            </div>

            {/* Quick Preview of Strengths */}
            <div style={{
              backgroundColor: `${parentDNA.details.color}10`,
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                💪 Your Natural Strengths:
              </div>
              {parentDNA.details.strengths.slice(0, 3).map((strength, index) => (
                <div key={index} style={{
                  fontSize: '11px',
                  color: luxTheme.textPrimary,
                  marginBottom: '4px',
                  paddingLeft: '8px'
                }}>
                  • {strength}
                </div>
              ))}
              {parentDNA.details.strengths.length > 3 && (
                <div style={{
                  fontSize: '10px',
                  color: luxTheme.textSecondary,
                  textAlign: 'center',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  + {parentDNA.details.strengths.length - 3} more strengths to discover
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '12px'
            }}>
              <button
                onClick={() => {
                  onViewDetails()
                  onClose()
                }}
                style={{
                  backgroundColor: parentDNA.details.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📖 Learn More
              </button>
              
              <button
                onClick={onClose}
                style={{
                  backgroundColor: `${parentDNA.details.color}20`,
                  color: parentDNA.details.color,
                  border: `1px solid ${parentDNA.details.color}40`,
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✨ Amazing!
              </button>
            </div>

            {/* DNA Code */}
            <div style={{
              fontSize: '10px',
              color: luxTheme.textSecondary,
              fontFamily: 'monospace',
              backgroundColor: '#F5F5F5',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'inline-block'
            }}>
              DNA-{parentDNA.type.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          color: 'white',
          fontSize: '12px',
          opacity: 0.9,
          maxWidth: '300px'
        }}>
          <div style={{ marginBottom: '4px' }}>🌟</div>
          Every parent has a unique way of nurturing readers. Your personalized strategies are ready!
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  )
}