// components/parent/readingtoolkit/SeasonalStrategiesTab.js
export default function SeasonalStrategiesTab({ 
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
  
  if (!parentDnaType.seasonalSupport) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗓️</div>
        <p>Seasonal support not available for your DNA type.</p>
      </div>
    );
  }

  const seasonColors = {
    backToSchool: '#FF6B6B',
    summer: '#FFD93D',
    holidays: '#6BCF7F',
    spring: '#FF69B4',
    winter: '#4ECDC4'
  };

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

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {Object.entries(parentDnaType.seasonalSupport).map(([season, support]) => {
        const sectionId = `seasonal-${season}`;
        const isExpanded = expandedSections[sectionId];
        const seasonColor = seasonColors[season] || theme.primary;
        
        return (
          <div
            key={season}
            style={{
              backgroundColor: theme.surface,
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${seasonColor}30`,
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
                backgroundColor: `${seasonColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {seasonEmojis[season] || '📅'}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {seasonTitles[season] || season}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary
                }}>
                  {support.strategies?.length || 0} strategies available
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
                borderTop: `1px solid ${seasonColor}30`
              }}>
                {support.challenge && (
                  <div style={{
                    backgroundColor: `${seasonColor}15`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '16px',
                    marginBottom: '16px',
                    border: `1px solid ${seasonColor}30`
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: seasonColor,
                      marginBottom: '8px'
                    }}>
                      🎯 Challenge
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.textPrimary,
                      lineHeight: '1.5'
                    }}>
                      {support.challenge}
                    </div>
                  </div>
                )}

                {support.strategies && (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {support.strategies.map((strategy, index) => {
                      const strategyId = `${season}-${index}`;
                      const isStarred = starredStrategies.has(strategyId);
                      const isTried = triedStrategies.has(strategyId);
                      const isDismissed = dismissedStrategies.has(strategyId);
                      
                      if (isDismissed) return null;
                      
                      return (
                        <div
                          key={index}
                          ref={el => strategyRefs.current[strategyId] = el}
                          style={{
                            backgroundColor: `${seasonColor}10`,
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '14px',
                            color: theme.textPrimary,
                            lineHeight: '1.5',
                            display: 'flex',
                            alignItems: 'start',
                            gap: '8px',
                            border: `1px solid ${seasonColor}20`
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
                              onClick={() => toggleStar(strategyId)}
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                fontSize: '16px',
                                cursor: 'pointer',
                                color: isStarred ? '#FFD700' : theme.textSecondary,
                                padding: '2px'
                              }}
                              title="Star this strategy"
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
                                color: isTried ? seasonColor : theme.textSecondary,
                                padding: '2px'
                              }}
                              title="Mark as tried"
                            >
                              {isTried ? '✓' : '○'}
                            </button>
                          </div>
                          
                          {/* Strategy content */}
                          <span style={{ flex: 1 }}>{strategy}</span>
                          
                          {/* Right side - Dismiss button */}
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
                            title="Dismiss this strategy"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}