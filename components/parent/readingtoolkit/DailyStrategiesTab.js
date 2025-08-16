// components/parent/readingtoolkit/DailyStrategiesTab.js
export default function DailyStrategiesTab({ 
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
  
  if (!parentDnaType.dailyStrategies) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: theme.textSecondary }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
        <p>Daily strategies not available for your DNA type.</p>
      </div>
    );
  }

  const categoryColors = {
    engagement: '#4CAF50',
    conflict: '#FF9800',
    celebration: '#9C27B0'
  };

  const categoryEmojis = {
    engagement: '💫',
    conflict: '⚡',
    celebration: '🎉'
  };

  const categoryTitles = {
    engagement: 'Daily Engagement',
    conflict: 'Navigating Conflicts',
    celebration: 'Celebration Moments'
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {Object.entries(parentDnaType.dailyStrategies).map(([category, strategies]) => {
        const sectionId = `daily-${category}`;
        const isExpanded = expandedSections[sectionId];
        
        return (
          <div
            key={category}
            style={{
              backgroundColor: theme.surface,
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${categoryColors[category]}30`,
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
                backgroundColor: `${categoryColors[category]}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {categoryEmojis[category]}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '4px'
                }}>
                  {categoryTitles[category]}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.textSecondary
                }}>
                  {strategies.length} strategies available
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
                borderTop: `1px solid ${categoryColors[category]}30`
              }}>
                <div style={{ 
                  display: 'grid', 
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  {strategies.map((strategy, index) => {
                    const strategyId = `${category}-${index}`;
                    const isStarred = starredStrategies.has(strategyId);
                    const isTried = triedStrategies.has(strategyId);
                    const isDismissed = dismissedStrategies.has(strategyId);
                    
                    if (isDismissed) return null;
                    
                    return (
                      <div
                        key={index}
                        ref={el => strategyRefs.current[strategyId] = el}
                        style={{
                          backgroundColor: `${categoryColors[category]}15`,
                          borderRadius: '12px',
                          padding: '16px',
                          fontSize: '14px',
                          color: theme.textPrimary,
                          lineHeight: '1.5',
                          border: `1px solid ${categoryColors[category]}30`,
                          display: 'flex',
                          alignItems: 'start',
                          gap: '12px'
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
                              color: isTried ? categoryColors[category] : theme.textSecondary,
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}