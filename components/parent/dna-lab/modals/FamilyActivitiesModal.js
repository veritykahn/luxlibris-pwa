// components/parent/dna-lab/modals/FamilyActivitiesModal.js - TRANSFORMED VERSION
import { useState } from 'react'
import { luxTheme } from '../../../../utils/theme'

export default function FamilyActivitiesModal({ familyRecommendations, parentDNA, onClose }) {
  const [expandedCategory, setExpandedCategory] = useState(0)
  const [completedActivities, setCompletedActivities] = useState(new Set())

  if (!familyRecommendations || familyRecommendations.length === 0) return null

  const toggleActivityComplete = (categoryIndex, itemIndex) => {
    const activityId = `${categoryIndex}-${itemIndex}`
    const newCompleted = new Set(completedActivities)
    if (newCompleted.has(activityId)) {
      newCompleted.delete(activityId)
    } else {
      newCompleted.add(activityId)
    }
    setCompletedActivities(newCompleted)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: luxTheme.surface,
        borderRadius: '24px',
        maxWidth: '420px',
        width: '100%',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Enhanced Header with Parent Type Integration */}
        <div style={{
          background: `linear-gradient(135deg, ${parentDNA?.details?.color || luxTheme.primary}, ${parentDNA?.details?.color || luxTheme.primary}E0)`,
          padding: '24px',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
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
              width: '32px',
              height: '32px',
              fontSize: '16px',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            ✕
          </button>

          <div style={{
            fontSize: '48px',
            marginBottom: '12px'
          }}>
            🎯
          </div>
          
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Your Family Reading Toolkit
          </h3>
          
          <p style={{
            margin: 0,
            fontSize: '14px',
            opacity: 0.9
          }}>
            Personalized for your {parentDNA?.details?.name || 'parenting'} style
          </p>
        </div>

        {/* Scrollable Content */}
        <div style={{
          padding: '20px',
          maxHeight: 'calc(85vh - 140px)',
          overflowY: 'auto'
        }}>
          {/* Progress Indicator */}
          <div style={{
            backgroundColor: `${luxTheme.primary}15`,
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '12px',
              color: luxTheme.textSecondary,
              marginBottom: '4px'
            }}>
              Activities Completed This Week
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: luxTheme.textPrimary
            }}>
              {completedActivities.size} / {familyRecommendations.reduce((total, cat) => total + cat.items.length, 0)}
            </div>
          </div>

          {/* Enhanced Categories */}
          {familyRecommendations.map((category, categoryIndex) => (
            <div key={categoryIndex} style={{
              backgroundColor: categoryIndex === expandedCategory ? `${luxTheme.primary}10` : luxTheme.surface,
              borderRadius: '16px',
              marginBottom: '12px',
              border: categoryIndex === expandedCategory ? `2px solid ${luxTheme.primary}40` : '1px solid #E0E0E0',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              {/* Category Header - Clickable */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === categoryIndex ? -1 : categoryIndex)}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ 
                    fontSize: '24px',
                    filter: expandedCategory === categoryIndex ? 'none' : 'grayscale(0.5)'
                  }}>
                    {category.icon}
                  </span>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '2px'
                    }}>
                      {category.category}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary
                    }}>
                      {category.items.length} activities • {category.items.filter((_, i) => completedActivities.has(`${categoryIndex}-${i}`)).length} completed
                    </div>
                  </div>
                </div>
                
                <div style={{
                  fontSize: '16px',
                  color: luxTheme.textSecondary,
                  transform: expandedCategory === categoryIndex ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  ▶
                </div>
              </button>

              {/* Expanded Content */}
              {expandedCategory === categoryIndex && (
                <div style={{
                  padding: '0 16px 16px',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  {category.items.map((item, itemIndex) => {
                    const activityId = `${categoryIndex}-${itemIndex}`
                    const isCompleted = completedActivities.has(activityId)
                    
                    return (
                      <div key={itemIndex} style={{
                        backgroundColor: isCompleted ? `${luxTheme.secondary}20` : 'white',
                        borderRadius: '12px',
                        padding: '12px',
                        marginBottom: '8px',
                        borderLeft: `4px solid ${isCompleted ? luxTheme.secondary : luxTheme.primary}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        transition: 'all 0.3s ease',
                        opacity: isCompleted ? 0.8 : 1
                      }}>
                        <button
                          onClick={() => toggleActivityComplete(categoryIndex, itemIndex)}
                          style={{
                            backgroundColor: isCompleted ? luxTheme.secondary : 'transparent',
                            border: `2px solid ${isCompleted ? luxTheme.secondary : luxTheme.primary}`,
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '10px',
                            color: isCompleted ? 'white' : luxTheme.primary,
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {isCompleted ? '✓' : ''}
                        </button>
                        
                        <p style={{
                          fontSize: '13px',
                          color: luxTheme.textPrimary,
                          margin: 0,
                          lineHeight: '1.4',
                          textDecoration: isCompleted ? 'line-through' : 'none'
                        }}>
                          {item}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Motivational Footer */}
          <div style={{
            backgroundColor: `${parentDNA?.details?.color || luxTheme.primary}15`,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <div style={{
              fontSize: '24px',
              marginBottom: '8px'
            }}>
              {parentDNA?.details?.emoji || '📖'}
            </div>
            <div style={{
              fontSize: '12px',
              color: luxTheme.textPrimary,
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              Perfect for your {parentDNA?.details?.name || 'parenting'} style!
            </div>
            <div style={{
              fontSize: '11px',
              color: luxTheme.textSecondary
            }}>
              Every small action builds your family's reading culture
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}