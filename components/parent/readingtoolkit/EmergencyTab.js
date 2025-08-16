// components/parent/readingtoolkit/EmergencyTab.js
export default function EmergencyTab({ 
  parentDnaType, 
  expandedSections, 
  toggleSection, 
  starredStrategies, 
  triedStrategies, 
  dismissedStrategies, 
  toggleStar, 
  toggleTried, 
  dismissStrategy, 
  theme, 
  strategyRefs 
}) {
  
  if (!parentDnaType.problemsToolkit) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚨</div>
        <p>Emergency toolkit not available for your DNA type.</p>
      </div>
    );
  }

  // Get ALL available scenarios from Firebase data
  const emergencyScenarios = [
    { id: 'reluctantReader', title: 'Child Refuses to Read', emoji: '😤' },
    { id: 'powerStruggles', title: 'Reading Power Struggles', emoji: '⚔️' },
    { id: 'achievementPressure', title: 'Too Much Pressure', emoji: '📊' },
    { id: 'bookChoiceStruggles', title: 'Book Choice Struggles', emoji: '📖' },
    { id: 'differentLearningSpeeds', title: 'Different Learning Speeds', emoji: '🐌' },
    { id: 'readingHabitBuilding', title: 'Reading Habit Building', emoji: '🏗️' }
  ];

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {emergencyScenarios.map((scenarioMeta) => {
        const scenario = parentDnaType.problemsToolkit[scenarioMeta.id];
        if (!scenario) return null;

        const sectionId = `emergency-${scenarioMeta.id}`;
        const isExpanded = expandedSections[sectionId];
        
        return (
          <div
            key={scenarioMeta.id}
            style={{
              backgroundColor: theme.surface,
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #DC143C30',
              overflow: 'hidden'
            }}
          >
            <button
              onClick={() => toggleSection(sectionId)}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#FFE4E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {scenarioMeta.emoji}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {scenarioMeta.title}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary
                }}>
                  {scenario.yourInstinct?.substring(0, 60) || 'Crisis management strategies'}...
                </div>
              </div>
              
              <div style={{
                fontSize: '20px',
                color: theme.textSecondary,
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▶
              </div>
            </button>
            
            {isExpanded && (
              <div style={{
                padding: '0 20px 20px',
                borderTop: '1px solid #DC143C30'
              }}>
                <ScenarioDetails 
                  scenario={scenario} 
                  scenarioId={scenarioMeta.id}
                  starredStrategies={starredStrategies}
                  triedStrategies={triedStrategies}
                  dismissedStrategies={dismissedStrategies}
                  toggleStar={toggleStar}
                  toggleTried={toggleTried}
                  dismissStrategy={dismissStrategy}
                  theme={theme}
                  strategyRefs={strategyRefs}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Sub-component for Scenario Details
function ScenarioDetails({ 
  scenario, 
  scenarioId, 
  starredStrategies, 
  triedStrategies, 
  dismissedStrategies, 
  toggleStar, 
  toggleTried, 
  dismissStrategy, 
  theme, 
  strategyRefs 
}) {
  return (
    <div style={{ marginTop: '20px' }}>
      {/* Your Instinct */}
      {scenario.yourInstinct && (
        <div style={{
          backgroundColor: `${theme.accent}20`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.primary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🎯</span> Your Instinct
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5'
          }}>
            {scenario.yourInstinct}
          </div>
        </div>
      )}

      {/* Your Approach */}
      {scenario.yourApproach && (
        <div style={{
          backgroundColor: `${theme.accent}20`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.primary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🎯</span> Your Approach
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5'
          }}>
            {scenario.yourApproach}
          </div>
        </div>
      )}

      {/* Your Philosophy */}
      {scenario.yourPhilosophy && (
        <div style={{
          backgroundColor: `${theme.accent}20`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.primary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>💭</span> Your Philosophy
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5'
          }}>
            {scenario.yourPhilosophy}
          </div>
        </div>
      )}

      {/* Prevention */}
      {scenario.prevention && (
        <div 
          ref={el => strategyRefs.current[`${scenarioId}-prevention`] = el}
          style={{
            backgroundColor: '#FFF3CD',
            border: '2px solid #FFE69C',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'start',
            gap: '12px'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flexShrink: 0
          }}>
            <button
              onClick={() => toggleStar(`${scenarioId}-prevention`)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: starredStrategies.has(`${scenarioId}-prevention`) ? '#FFD700' : '#664D03',
                padding: '2px'
              }}
            >
              {starredStrategies.has(`${scenarioId}-prevention`) ? '★' : '☆'}
            </button>
            <button
              onClick={() => toggleTried(`${scenarioId}-prevention`)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                color: triedStrategies.has(`${scenarioId}-prevention`) ? '#FF9800' : '#664D03',
                padding: '2px'
              }}
            >
              {triedStrategies.has(`${scenarioId}-prevention`) ? '✓' : '○'}
            </button>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#664D03',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>🛡️</span> Prevention
            </div>
            <div style={{
              fontSize: '14px',
              color: '#664D03',
              lineHeight: '1.5'
            }}>
              {scenario.prevention}
            </div>
          </div>
          
          {!dismissedStrategies.has(`${scenarioId}-prevention`) && (
            <button
              onClick={() => dismissStrategy(`${scenarioId}-prevention`)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                color: '#664D03',
                padding: '2px',
                flexShrink: 0
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Scripts Section - Larger and better paired */}
      {scenario.scripts && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💬</span> What to Say vs. What NOT to Say
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '12px'
          }}>
            {/* Do Say - Larger */}
            {scenario.scripts.doSay && (
              <div style={{
                backgroundColor: '#E8F5E8',
                borderRadius: '16px',
                padding: '20px',
                border: '3px solid #4CAF50'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#2E7D32',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>✅</span> DO Say
                </div>
                {scenario.scripts.doSay.map((script, index) => (
                  <div
                    key={index}
                    ref={el => strategyRefs.current[`${scenarioId}-doSay-${index}`] = el}
                    style={{
                      fontSize: '15px',
                      color: '#2E7D32',
                      marginBottom: '12px',
                      paddingLeft: '20px',
                      position: 'relative',
                      lineHeight: '1.5',
                      fontStyle: 'italic',
                      fontWeight: '500'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: '#4CAF50',
                      fontSize: '16px'
                    }}>•</span>
                    &quot;{script}&quot;
                  </div>
                ))}
              </div>
            )}

            {/* Don't Say - Larger */}
            {scenario.scripts.dontSay && (
              <div style={{
                backgroundColor: '#FFE4E1',
                borderRadius: '16px',
                padding: '20px',
                border: '3px solid #F44336'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#C62828',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>❌</span> DON&apos;T Say
                </div>
                {scenario.scripts.dontSay.map((script, index) => (
                  <div
                    key={index}
                    ref={el => strategyRefs.current[`${scenarioId}-dontSay-${index}`] = el}
                    style={{
                      fontSize: '15px',
                      color: '#C62828',
                      marginBottom: '12px',
                      paddingLeft: '20px',
                      position: 'relative',
                      lineHeight: '1.5',
                      fontStyle: 'italic',
                      fontWeight: '500'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: '#F44336',
                      fontSize: '16px'
                    }}>•</span>
                    &quot;{script}&quot;
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gentle Approaches */}
      {scenario.gentleApproaches && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🌟</span> Gentle Approaches
          </h4>
          
          {scenario.gentleApproaches.map((approach, index) => {
            const approachId = `${scenarioId}-approach-${index}`;
            const isStarred = starredStrategies.has(approachId);
            const isTried = triedStrategies.has(approachId);
            const isDismissed = dismissedStrategies.has(approachId);
            
            if (isDismissed) return null;
            
            return (
              <div
                key={index}
                ref={el => strategyRefs.current[approachId] = el}
                style={{
                  backgroundColor: `${theme.primary}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: theme.textPrimary,
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}
              >
                {/* Left side - Star/Try buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => toggleStar(approachId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: isStarred ? '#FFD700' : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isStarred ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => toggleTried(approachId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: isTried ? theme.primary : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isTried ? '✓' : '○'}
                  </button>
                </div>
                
                <span style={{ flex: 1 }}>{approach}</span>
                
                <button
                  onClick={() => dismissStrategy(approachId)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: theme.textSecondary,
                    padding: '2px',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Practical Tips */}
      {scenario.practicalTips && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💡</span> Practical Tips
          </h4>
          
          {scenario.practicalTips.map((tip, index) => {
            const tipId = `${scenarioId}-tip-${index}`;
            const isStarred = starredStrategies.has(tipId);
            const isTried = triedStrategies.has(tipId);
            const isDismissed = dismissedStrategies.has(tipId);
            
            if (isDismissed) return null;
            
            return (
              <div
                key={index}
                ref={el => strategyRefs.current[tipId] = el}
                style={{
                  backgroundColor: `${theme.primary}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: theme.textPrimary,
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => toggleStar(tipId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: isStarred ? '#FFD700' : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isStarred ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => toggleTried(tipId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: isTried ? theme.primary : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isTried ? '✓' : '○'}
                  </button>
                </div>
                
                <span style={{ flex: 1 }}>{tip}</span>
                
                <button
                  onClick={() => dismissStrategy(tipId)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: theme.textSecondary,
                    padding: '2px',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Practical Strategies (for reading habit building) */}
      {scenario.practicalStrategies && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🎯</span> Practical Strategies
          </h4>
          
          {scenario.practicalStrategies.map((strategy, index) => {
            const strategyId = `${scenarioId}-strategy-${index}`;
            const isStarred = starredStrategies.has(strategyId);
            const isTried = triedStrategies.has(strategyId);
            const isDismissed = dismissedStrategies.has(strategyId);
            
            if (isDismissed) return null;
            
            return (
              <div
                key={index}
                ref={el => strategyRefs.current[strategyId] = el}
                style={{
                  backgroundColor: `${theme.primary}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: theme.textPrimary,
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => toggleStar(strategyId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: isStarred ? '#FFD700' : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isStarred ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => toggleTried(strategyId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: isTried ? theme.primary : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isTried ? '✓' : '○'}
                  </button>
                </div>
                
                <span style={{ flex: 1 }}>{strategy}</span>
                
                <button
                  onClick={() => dismissStrategy(strategyId)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: theme.textSecondary,
                    padding: '2px',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Approaches (for different learning speeds) */}
      {scenario.approaches && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🎯</span> Approaches
          </h4>
          
          {scenario.approaches.map((approach, index) => {
            const approachId = `${scenarioId}-approaches-${index}`;
            const isStarred = starredStrategies.has(approachId);
            const isTried = triedStrategies.has(approachId);
            const isDismissed = dismissedStrategies.has(approachId);
            
            if (isDismissed) return null;
            
            return (
              <div
                key={index}
                ref={el => strategyRefs.current[approachId] = el}
                style={{
                  backgroundColor: `${theme.primary}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: theme.textPrimary,
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => toggleStar(approachId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: isStarred ? '#FFD700' : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isStarred ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => toggleTried(approachId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: isTried ? theme.primary : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isTried ? '✓' : '○'}
                  </button>
                </div>
                
                <span style={{ flex: 1 }}>{approach}</span>
                
                <button
                  onClick={() => dismissStrategy(approachId)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: theme.textSecondary,
                    padding: '2px',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* When They Happen (for power struggles) */}
      {scenario.whenTheyHappen && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚡</span> When They Happen
          </h4>
          
          {scenario.whenTheyHappen.map((item, index) => {
            const itemId = `${scenarioId}-whenTheyHappen-${index}`;
            const isStarred = starredStrategies.has(itemId);
            const isTried = triedStrategies.has(itemId);
            const isDismissed = dismissedStrategies.has(itemId);
            
            if (isDismissed) return null;
            
            return (
              <div
                key={index}
                ref={el => strategyRefs.current[itemId] = el}
                style={{
                  backgroundColor: `${theme.primary}10`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  fontSize: '14px',
                  color: theme.textPrimary,
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => toggleStar(itemId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '16px',
                      cursor: 'pointer',
                      color: isStarred ? '#FFD700' : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isStarred ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => toggleTried(itemId)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: isTried ? theme.primary : theme.textSecondary,
                      padding: '2px'
                    }}
                  >
                    {isTried ? '✓' : '○'}
                  </button>
                </div>
                
                <span style={{ flex: 1 }}>{item}</span>
                
                <button
                  onClick={() => dismissStrategy(itemId)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: theme.textSecondary,
                    padding: '2px',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Why This Works */}
      {scenario.whyThisWorks && (
        <div style={{
          backgroundColor: `${theme.secondary}20`,
          borderRadius: '12px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: theme.primary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>💡</span> Why This Works
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.textPrimary,
            lineHeight: '1.5'
          }}>
            {scenario.whyThisWorks}
          </div>
        </div>
      )}

      {/* When to Worry */}
      {scenario.whenToWorry && (
        <div style={{
          backgroundColor: '#FFE4E1',
          border: '2px solid #F44336',
          borderRadius: '12px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#C62828',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>⚠️</span> When to Seek Additional Support
          </div>
          <div style={{
            fontSize: '14px',
            color: '#C62828',
            lineHeight: '1.5'
          }}>
            {scenario.whenToWorry}
          </div>
        </div>
      )}
    </div>
  );
}