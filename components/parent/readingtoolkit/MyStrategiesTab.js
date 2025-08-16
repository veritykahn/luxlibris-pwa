// components/parent/readingtoolkit/MyStrategiesTab.js
import { useCallback } from 'react';

export default function MyStrategiesTab({ 
  parentDnaType, 
  starredStrategies, 
  triedStrategies, 
  dismissedStrategies,
  toggleStar,
  toggleTried,
  restoreStrategy,
  theme 
}) {
  
  // Helper function to get strategy details from ID
  const getStrategyDetails = useCallback((strategyId) => {
    if (!parentDnaType || !strategyId) return null;
    
    const parts = strategyId.split('-');
    
    // Daily strategies: category-index (e.g., "engagement-0")
    if (parts.length === 2 && ['engagement', 'conflict', 'celebration'].includes(parts[0])) {
      const category = parts[0];
      const index = parseInt(parts[1]);
      
      if (parentDnaType.dailyStrategies?.[category]?.[index]) {
        return {
          content: parentDnaType.dailyStrategies[category][index],
          type: 'daily',
          category: category,
          label: `Daily ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          emoji: category === 'engagement' ? '💫' : category === 'conflict' ? '⚡' : '🎉',
          color: category === 'engagement' ? '#4CAF50' : category === 'conflict' ? '#FF9800' : '#9C27B0'
        };
      }
    }
    
    // Seasonal strategies: season-index (e.g., "summer-0")
    const seasonNames = ['backToSchool', 'summer', 'holidays', 'spring', 'winter'];
    if (parts.length === 2 && seasonNames.includes(parts[0])) {
      const season = parts[0];
      const index = parseInt(parts[1]);
      
      if (parentDnaType.seasonalSupport?.[season]?.strategies?.[index]) {
        const seasonEmojis = {
          backToSchool: '🎒',
          summer: '☀️',
          holidays: '🎄',
          spring: '🌸',
          winter: '❄️'
        };
        const seasonTitles = {
          backToSchool: 'Back to School',
          summer: 'Summer Reading',
          holidays: 'Holiday Season',
          spring: 'Spring Renewal',
          winter: 'Winter Challenges'
        };
        
        return {
          content: parentDnaType.seasonalSupport[season].strategies[index],
          type: 'seasonal',
          season: season,
          label: seasonTitles[season] || season,
          emoji: seasonEmojis[season] || '📅',
          color: '#FFD93D'
        };
      }
    }
    
    // Emergency strategies: scenarioId-type-index
    if (parts.length >= 3) {
      const scenarioId = parts[0];
      const strategyType = parts[1];
      
      const formatScenarioName = (id) => {
        const scenarioTitles = {
          reluctantReader: 'Child Refuses to Read',
          powerStruggles: 'Reading Power Struggles',
          achievementPressure: 'Too Much Pressure',
          bookChoiceStruggles: 'Book Choice Struggles',
          differentLearningSpeeds: 'Different Learning Speeds',
          readingHabitBuilding: 'Reading Habit Building'
        };
        return scenarioTitles[id] || id.replace(/([A-Z])/g, ' $1').trim();
      };
      
      if (strategyType === 'prevention') {
        if (parentDnaType.problemsToolkit?.[scenarioId]?.prevention) {
          return {
            content: parentDnaType.problemsToolkit[scenarioId].prevention,
            type: 'emergency',
            scenario: scenarioId,
            label: `${formatScenarioName(scenarioId)} - Prevention`,
            emoji: '🛡️',
            color: '#DC143C'
          };
        }
      } else if (strategyType === 'doSay' || strategyType === 'dontSay') {
        const index = parseInt(parts[2]);
        const scripts = parentDnaType.problemsToolkit?.[scenarioId]?.scripts;
        
        if (scripts?.[strategyType]?.[index]) {
          return {
            content: `"${scripts[strategyType][index]}"`,
            type: 'emergency',
            scenario: scenarioId,
            label: `${formatScenarioName(scenarioId)} - ${strategyType === 'doSay' ? 'DO Say' : "DON'T Say"}`,
            emoji: strategyType === 'doSay' ? '✅' : '❌',
            color: '#DC143C'
          };
        }
      } else if (strategyType === 'approach') {
        const index = parseInt(parts[2]);
        const approach = parentDnaType.problemsToolkit?.[scenarioId]?.gentleApproaches?.[index];
        
        if (approach) {
          return {
            content: approach,
            type: 'emergency',
            scenario: scenarioId,
            label: `${formatScenarioName(scenarioId)} - Gentle Approach`,
            emoji: '🌟',
            color: '#DC143C'
          };
        }
      } else if (strategyType === 'tip') {
        const index = parseInt(parts[2]);
        const tip = parentDnaType.problemsToolkit?.[scenarioId]?.practicalTips?.[index];
        
        if (tip) {
          return {
            content: tip,
            type: 'emergency',
            scenario: scenarioId,
            label: `${formatScenarioName(scenarioId)} - Practical Tip`,
            emoji: '💡',
            color: '#DC143C'
          };
        }
      }
    }
    
    // Fallback
    return null;
  }, [parentDnaType]);

  const starredItems = Array.from(starredStrategies);
  const triedItems = Array.from(triedStrategies);
  const dismissedItems = Array.from(dismissedStrategies);

  // Component to display a single strategy item
  const StrategyItem = ({ strategyId, onRemove, showTried = false }) => {
    const details = getStrategyDetails(strategyId);
    
    if (!details) {
      return (
        <div style={{
          backgroundColor: '#F5F5F5',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: 0.7
        }}>
          <span style={{ fontSize: '16px' }}>📝</span>
          <span style={{ flex: 1, fontSize: '14px', fontStyle: 'italic', color: theme.textSecondary }}>
            Strategy not found: {strategyId}
          </span>
          {onRemove && (
            <button
              onClick={() => onRemove(strategyId)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                color: theme.textSecondary,
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div style={{
        backgroundColor: `${details.color}10`,
        border: `2px solid ${details.color}40`,
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Header with emoji, label, and actions */}
        <div style={{
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>{details.emoji}</span>
          
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: details.color,
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {details.label}
            </div>
            
            <div style={{
              fontSize: '14px',
              color: theme.textPrimary,
              lineHeight: '1.5'
            }}>
              {details.content}
            </div>
          </div>
          
          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '6px',
            flexShrink: 0
          }}>
            {showTried && (
              <button
                onClick={() => toggleTried(strategyId)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: '#4CAF50',
                  padding: '2px'
                }}
                title="Marked as tried"
              >
                ✓
              </button>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(strategyId)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: theme.textSecondary,
                  padding: '2px'
                }}
                title="Remove"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'grid', 
      gap: '20px'
    }}>
      {/* Starred Strategies */}
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⭐</span> 
          Starred Strategies ({starredItems.length})
        </h3>
        
        {starredItems.length === 0 ? (
          <p style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
            No starred strategies yet. Star your favorites from Daily, Seasonal, or Emergency sections!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {starredItems.map((strategyId) => (
              <StrategyItem 
                key={strategyId}
                strategyId={strategyId}
                onRemove={toggleStar}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tried Strategies */}
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✓</span> 
          Tried Strategies ({triedItems.length})
        </h3>
        
        {triedItems.length === 0 ? (
          <p style={{ color: theme.textSecondary, fontStyle: 'italic' }}>
            No tried strategies yet. Mark strategies you&apos;ve tested!
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {triedItems.map((strategyId) => (
              <StrategyItem 
                key={strategyId}
                strategyId={strategyId}
                showTried={true}
                onRemove={toggleTried}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dismissed Strategies */}
      {dismissedItems.length > 0 && (
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📦</span> 
            Dismissed Strategies ({dismissedItems.length})
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            {dismissedItems.map((strategyId) => {
              const details = getStrategyDetails(strategyId);
              
              return (
                <div
                  key={strategyId}
                  style={{
                    backgroundColor: '#F5F5F5',
                    border: '1px solid #CCC',
                    borderRadius: '12px',
                    padding: '16px',
                    opacity: 0.7
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'start',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>
                      {details?.emoji || '📦'}
                    </span>
                    
                    <div style={{ flex: 1 }}>
                      {details ? (
                        <>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: theme.textSecondary,
                            marginBottom: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {details.label}
                          </div>
                          
                          <div style={{
                            fontSize: '14px',
                            color: theme.textPrimary,
                            lineHeight: '1.5'
                          }}>
                            {details.content}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          fontSize: '14px',
                          color: theme.textSecondary,
                          fontStyle: 'italic'
                        }}>
                          Strategy: {strategyId}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => restoreStrategy(strategyId)}
                      style={{
                        backgroundColor: theme.primary,
                        color: theme.textPrimary,
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        flexShrink: 0
                      }}
                    >
                      Restore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}