// components/FamilyBattleDisplay.js
// Shared component for displaying family battle data - used by both parents and students
// COMPLETE VERSION with all features

import { useState, useEffect } from 'react';

export default function FamilyBattleDisplay({ 
  battleData, 
  isStudent = false,
  theme,
  onRefresh,
  onShowResults,
  onShowVictoryArchive,
  studentName = null, // For highlighting student's contribution
  refreshing = false
}) {
  const [animateValues, setAnimateValues] = useState(false);

  useEffect(() => {
    setAnimateValues(true);
  }, [battleData]);

  if (!battleData || !battleData.enabled) {
    return (
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '8px'
        }}>
          Family Battle Not Available
        </h3>
        <p style={{
          fontSize: '14px',
          color: theme.textSecondary
        }}>
          {isStudent ? 
            'Ask your parent to enable Family Battle!' :
            'Enable Family Battle in settings to start competing!'
          }
        </p>
      </div>
    );
  }

  if (battleData.noDataAvailable) {
    return (
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🙏</div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '8px'
        }}>
          Sunday Day of Rest
        </h3>
        <p style={{
          fontSize: '14px',
          color: theme.textSecondary
        }}>
          No battle data this week. The new battle begins tomorrow!
        </p>
      </div>
    );
  }

  const { 
    children = { total: 0, breakdown: {} }, 
    parents = { total: 0, breakdown: {} },
    leader = 'tie',
    margin = 0,
    status = '',
    winner,
    isResultsDay = false,
    number: weekNumber = 1,
    history = {},
    finalStatus
  } = battleData;

  const childrenWinning = leader === 'children' || winner === 'children';
  const parentsWinning = leader === 'parents' || winner === 'parents';
  const isTie = leader === 'tie' || winner === 'tie';

  // Calculate win rates  
  const totalBattles = history.totalBattles || 0;
  const childrenWinRate = totalBattles > 0 ? 
    Math.round(((history.childrenWins || 0) / totalBattles) * 100) : 0;
  const parentWinRate = totalBattles > 0 ? 
    Math.round(((history.parentWins || 0) / totalBattles) * 100) : 0;

  // Get student's contribution if they're a student
  const studentContribution = isStudent && studentName && children.breakdown ? 
    Object.values(children.breakdown).find(s => s.name === studentName)?.minutes || 0 : 0;

  return (
    <div style={{ position: 'relative' }}>
      {/* Results Day Banner */}
      {isResultsDay && winner && winner !== 'tie' && (
        <div 
          onClick={onShowResults}
          style={{
            backgroundColor: '#FFD700',
            borderRadius: '16px',
            padding: '12px',
            marginBottom: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
            animation: 'pulse 2s infinite',
            border: '2px solid #FFC700'
          }}
        >
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#000'
          }}>
            🏆 Week {weekNumber} Results Available! Tap to View 🏆
          </div>
        </div>
      )}

      {/* Main Battle Arena */}
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${theme.primary}10, transparent)`,
          borderRadius: '50%'
        }} />

        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>⚔️</div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: theme.textPrimary,
            margin: '0 0 4px 0',
            fontFamily: 'Didot, "Times New Roman", serif'
          }}>
            Family Reading Showdown
          </h2>
          <p style={{
            fontSize: '14px',
            color: theme.textSecondary,
            margin: 0
          }}>
            Week {weekNumber} • {isResultsDay ? '🙏 Sunday Results' : 'Battle in Progress'}
          </p>
        </div>

        {/* Battle Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Kids Team */}
          <div style={{
            backgroundColor: childrenWinning ? '#4ECDC420' : `${theme.primary}10`,
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            border: childrenWinning ? '2px solid #4ECDC4' : `1px solid ${theme.primary}40`,
            position: 'relative',
            transform: childrenWinning && animateValues ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}>
            {childrenWinning && margin > 0 && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '28px',
                animation: 'bounce 2s infinite'
              }}>
                👑
              </div>
            )}
            
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👧👦</div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme.textPrimary,
              marginBottom: '8px'
            }}>
              Kids Squad
            </h3>
            
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#4ECDC4',
              marginBottom: '4px'
            }}>
              {animateValues ? children.total : 0}
            </div>
            <div style={{
              fontSize: '11px',
              color: theme.textSecondary,
              marginBottom: '12px'
            }}>
              minutes this week
            </div>
            
            {/* Student Contribution Badge (for students only) */}
            {isStudent && studentContribution > 0 && (
              <div style={{
                backgroundColor: '#4ECDC4',
                color: 'white',
                borderRadius: '12px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                You: {studentContribution} min
              </div>
            )}
            
            {/* Breakdown */}
            {Object.keys(children.breakdown).length > 0 && (
              <div style={{
                backgroundColor: theme.surface,
                borderRadius: '8px',
                padding: '8px',
                fontSize: '10px',
                color: theme.textSecondary,
                maxHeight: '80px',
                overflowY: 'auto'
              }}>
                {Object.entries(children.breakdown).map(([id, data]) => (
                  <div key={id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '2px 0',
                    fontWeight: isStudent && data.name === studentName ? '600' : '400',
                    color: isStudent && data.name === studentName ? theme.primary : theme.textSecondary
                  }}>
                    <span>{isStudent && data.name === studentName ? '➤ You' : data.name}:</span>
                    <span style={{ fontWeight: '600' }}>{data.minutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Parents Team */}
          <div style={{
            backgroundColor: parentsWinning ? '#FF6B6B20' : `${theme.secondary}10`,
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            border: parentsWinning ? '2px solid #FF6B6B' : `1px solid ${theme.secondary}40`,
            position: 'relative',
            transform: parentsWinning && animateValues ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}>
            {parentsWinning && margin > 0 && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '28px',
                animation: 'bounce 2s infinite'
              }}>
                👑
              </div>
            )}
            
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👨‍👩</div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme.textPrimary,
              marginBottom: '8px'
            }}>
              Parent Power
            </h3>
            
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#FF6B6B',
              marginBottom: '4px'
            }}>
              {animateValues ? parents.total : 0}
            </div>
            <div style={{
              fontSize: '11px',
              color: theme.textSecondary,
              marginBottom: '12px'
            }}>
              minutes this week
            </div>
            
            {/* Breakdown */}
            {Object.keys(parents.breakdown).length > 0 && (
              <div style={{
                backgroundColor: theme.surface,
                borderRadius: '8px',
                padding: '8px',
                fontSize: '10px',
                color: theme.textSecondary,
                maxHeight: '80px',
                overflowY: 'auto'
              }}>
                {Object.entries(parents.breakdown).map(([id, data]) => (
                  <div key={id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '2px 0'
                  }}>
                    <span>{data.name}:</span>
                    <span style={{ fontWeight: '600' }}>{data.minutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Battle Status */}
        <div style={{
          backgroundColor: isResultsDay && winner ? 
                        (winner === 'children' ? '#4ECDC420' : 
                         winner === 'parents' ? '#FF6B6B20' : '#FFD70020') :
                        childrenWinning ? '#4ECDC420' : 
                        parentsWinning ? '#FF6B6B20' : 
                        `${theme.primary}20`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          border: isResultsDay && winner ? 
                  (winner === 'children' ? '2px solid #4ECDC4' :
                   winner === 'parents' ? '2px solid #FF6B6B' : '2px solid #FFD700') :
                  childrenWinning ? '2px solid #4ECDC4' : 
                  parentsWinning ? '2px solid #FF6B6B' : 
                  `2px solid ${theme.primary}60`
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: theme.textPrimary,
            marginBottom: isResultsDay ? 0 : '4px'
          }}>
            {finalStatus || status}
          </div>
          {!isResultsDay && (
            <div style={{
              fontSize: '12px',
              color: theme.textSecondary
            }}>
              Keep reading! {isStudent ? 'Every minute helps your team!' : 'Show them who\'s boss!'}
            </div>
          )}
        </div>
      </div>

      {/* Championship Stats */}
      {totalBattles > 0 && (
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🏆 Championship History
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: `${theme.primary}20`,
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: theme.textPrimary
              }}>
                {totalBattles}
              </div>
              <div style={{
                fontSize: '10px',
                color: theme.textSecondary
              }}>
                Total Battles
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#4ECDC420',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              border: history.childrenWins > 0 ? '1px solid #4ECDC4' : 'none'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#4ECDC4'
              }}>
                {childrenWinRate}%
              </div>
              <div style={{
                fontSize: '10px',
                color: theme.textSecondary
              }}>
                Kids Win Rate
              </div>
              {history.childrenWins > 0 && (
                <div style={{
                  fontSize: '9px',
                  marginTop: '2px',
                  color: '#4ECDC4'
                }}>
                  {history.childrenWins} win{history.childrenWins !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <div style={{
              backgroundColor: '#FF6B6B20',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              border: history.parentWins > 0 ? '1px solid #FF6B6B' : 'none'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#FF6B6B'
              }}>
                {parentWinRate}%
              </div>
              <div style={{
                fontSize: '10px',
                color: theme.textSecondary
              }}>
                Parent Win Rate
              </div>
              {history.parentWins > 0 && (
                <div style={{
                  fontSize: '9px',
                  marginTop: '2px',
                  color: '#FF6B6B'
                }}>
                  {history.parentWins} win{history.parentWins !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Current Streak */}
          {history.currentStreak?.team && history.currentStreak?.count > 0 && (
            <div style={{
              backgroundColor: `${theme.accent}20`,
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: theme.textPrimary
              }}>
                🔥 {history.currentStreak.team === 'children' ? 'Kids' : 'Parents'} on {history.currentStreak.count}-Week Winning Streak!
              </div>
            </div>
          )}

          {/* Victory Archive Button (Parents Only) */}
          {!isStudent && history.parentWins > 0 && (
            <button
              onClick={onShowVictoryArchive}
              style={{
                backgroundColor: '#FFD700',
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px',
                transition: 'all 0.2s ease',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🏆 View Victory Archive
              <span style={{
                backgroundColor: '#000',
                color: '#FFD700',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {history.parentWins}
              </span>
            </button>
          )}

          {/* Refresh Button - Parents Only */}
          {!isStudent && onRefresh && (
            <>
              <button
                onClick={onRefresh}
                disabled={refreshing}
                style={{
                  backgroundColor: refreshing ? theme.secondary : theme.primary,
                  color: theme.textPrimary,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  width: '100%',
                  transition: 'all 0.2s ease',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: refreshing ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!refreshing) {
                    e.currentTarget.style.backgroundColor = theme.secondary;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!refreshing) {
                    e.currentTarget.style.backgroundColor = theme.primary;
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!refreshing) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!refreshing) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
              >
                {refreshing ? '⏳ Refreshing...' : '🔄 Refresh Battle Data'}
              </button>
              <div style={{
                fontSize: '11px',
                color: theme.textSecondary,
                textAlign: 'center',
                marginTop: '8px',
                fontStyle: 'italic'
              }}>
                Auto-refreshes every 30 seconds
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }
      `}</style>
    </div>
  );
}