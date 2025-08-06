import React, { useState, useEffect } from 'react';

// Championship Belt styles based on winner
const CHAMPIONSHIP_COLORS = {
  children: {
    primary: '#4ECDC4',
    secondary: '#45B7B8',
    accent: '#7FFFD4',
    glow: 'rgba(78, 205, 196, 0.4)'
  },
  parents: {
    primary: '#FF6B6B',
    secondary: '#FF5252',
    accent: '#FFB3BA',
    glow: 'rgba(255, 107, 107, 0.4)'
  },
  tie: {
    primary: '#FFD700',
    secondary: '#FFC700',
    accent: '#FFF3B8',
    glow: 'rgba(255, 215, 0, 0.4)'
  }
};

// Victory messages based on margin
const getVictoryMessage = (winner, margin) => {
  if (winner === 'tie') {
    return {
      title: "⚖️ EPIC TIE!",
      subtitle: "Both teams fought valiantly!",
      message: "The battle was so close, we couldn't crown a champion this week!"
    };
  }
  
  const team = winner === 'children' ? 'KIDS' : 'PARENTS';
  
  if (margin >= 100) {
    return {
      title: `💥 ${team} OBLITERATED!`,
      subtitle: `Won by ${margin} minutes!`,
      message: "TOTAL DOMINATION! That was a legendary beatdown!"
    };
  } else if (margin >= 50) {
    return {
      title: `🔥 ${team} DOMINATED!`,
      subtitle: `Won by ${margin} minutes!`,
      message: "A commanding victory! The other team never stood a chance!"
    };
  } else if (margin >= 25) {
    return {
      title: `🏆 ${team} VICTORIOUS!`,
      subtitle: `Won by ${margin} minutes!`,
      message: "A solid victory! Great teamwork and dedication!"
    };
  } else if (margin >= 10) {
    return {
      title: `✨ ${team} WIN!`,
      subtitle: `Won by ${margin} minutes!`,
      message: "A well-earned victory! Every minute counted!"
    };
  } else {
    return {
      title: `🎯 ${team} EDGE IT!`,
      subtitle: `Won by just ${margin} minutes!`,
      message: "What a nail-biter! Victory by the slimmest of margins!"
    };
  }
};

// Animation styles
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInUp {
    from { 
      opacity: 0;
      transform: translateY(50px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-20px); }
    60% { transform: translateY(-10px); }
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes fall {
    to {
      transform: translateY(100vh) rotate(360deg);
    }
  }
`;

// Confetti component
function Confetti({ colors }) {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {pieces.map(piece => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${piece.left}%`,
            width: '10px',
            height: '10px',
            backgroundColor: piece.color,
            borderRadius: '2px',
            animation: `fall ${piece.duration}s linear ${piece.delay}s infinite`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
    </div>
  );
}

export default function FamilyBattleResultsModal({ 
  show, 
  onClose, 
  battleData,
  isStudent = true,
  currentUserId = null,
  theme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }
}) {
  const [stage, setStage] = useState('intro');
  const [isVisible, setIsVisible] = useState(false);
  
  // FIXED: Properly handle visibility based on show prop
  useEffect(() => {
    if (show && battleData) {
      setIsVisible(true);
      setStage('intro');
    } else {
      setIsVisible(false);
    }
  }, [show, battleData]);
  
  // Create mock battle data if it's missing required fields (for testing)
  const mockBattleData = battleData ? {
    winner: battleData.winner || 'children',
    margin: battleData.margin || 15,
    childrenMinutes: battleData.childrenMinutes || battleData.children || 35,
    parentMinutes: battleData.parentMinutes || battleData.parents || 20,
    studentBreakdown: battleData.studentBreakdown || { 
      'student1': { name: 'Jesse', minutes: 20 },
      'student2': { name: 'Ariel', minutes: 15 }
    },
    parentBreakdown: battleData.parentBreakdown || {},
    weekNumber: battleData.weekNumber || 32,
    isResultsDay: battleData.isResultsDay || false
  } : null;
  
  // Calculate MVP from winning team
  const calculateMVP = () => {
    if (!mockBattleData) return null;
    
    const { winner, studentBreakdown, parentBreakdown, parentMinutes } = mockBattleData;
    
    if (winner === 'children') {
      const students = Object.entries(studentBreakdown);
      if (students.length === 0) return null;
      
      const mvp = students.reduce((max, [id, data]) => {
        const minutes = data.minutes || 0;
        return minutes > (max.minutes || 0) ? { id, ...data, minutes } : max;
      }, {});
      
      const BASE_XP = 25;
      const MVP_BONUS = 25;
      mvp.xpEarned = BASE_XP + MVP_BONUS;
      mvp.isStudentMVP = true;
      
      return mvp.name ? mvp : null;
    } else if (winner === 'parents') {
      const parents = Object.entries(parentBreakdown || {});
      
      if (parents.length > 1) {
        const mvpParent = parents.reduce((max, [uid, minutes]) => {
          return minutes > max.minutes ? { uid, minutes } : max;
        }, { uid: null, minutes: 0 });
        
        return {
          name: isStudent ? "Parent Champion" : (currentUserId === mvpParent.uid ? "You" : "Your Partner"),
          minutes: mvpParent.minutes,
          isParent: true,
          isCurrentUser: !isStudent && currentUserId === mvpParent.uid,
          multipleParents: true
        };
      } else {
        return {
          name: isStudent ? "Your Parents" : "You",
          minutes: parentMinutes,
          isParent: true,
          isCurrentUser: !isStudent,
          multipleParents: false
        };
      }
    }
    return null;
  };
  
  // Calculate XP for all students (if children won)
  const calculateStudentXP = () => {
    if (!mockBattleData || mockBattleData.winner !== 'children') return {};
    
    const BASE_XP = 25;
    const MVP_BONUS = 25;
    const xpRewards = {};
    const mvp = calculateMVP();
    
    Object.entries(mockBattleData.studentBreakdown).forEach(([id, data]) => {
      const isMVP = mvp && mvp.id === id;
      xpRewards[id] = {
        ...data,
        xp: BASE_XP + (isMVP ? MVP_BONUS : 0),
        isMVP
      };
    });
    
    return xpRewards;
  };
  
  // Stage progression
  useEffect(() => {
    if (isVisible && stage === 'intro') {
      const timer = setTimeout(() => setStage('winner'), 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, stage]);
  
  const handleNextStage = () => {
    if (!mockBattleData) return;
    
    if (stage === 'winner') {
      setStage('mvp');
    } else if (stage === 'mvp') {
      if (mockBattleData.winner === 'children') {
        setStage('rewards');
      } else if (mockBattleData.winner === 'parents') {
        setStage('bragging');
      } else {
        setStage('summary');
      }
    } else if (stage === 'rewards' || stage === 'bragging') {
      setStage('summary');
    } else if (stage === 'summary') {
      setIsVisible(false);
      if (onClose) onClose();
    }
  };
  
  // Don't render if not visible or no data
  if (!isVisible || !mockBattleData) return null;
  
  const { 
    winner, 
    margin, 
    childrenMinutes, 
    parentMinutes, 
    studentBreakdown,
    parentBreakdown,
    weekNumber 
  } = mockBattleData;
  
  const colors = CHAMPIONSHIP_COLORS[winner] || CHAMPIONSHIP_COLORS.tie;
  const victoryMsg = getVictoryMessage(winner, margin);
  const mvp = calculateMVP();
  const studentXP = calculateStudentXP();
  
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.5s ease-out'
      }}
      onClick={handleNextStage}>
        {winner !== 'tie' && stage !== 'intro' && (
          <Confetti colors={[colors.primary, colors.secondary, colors.accent, '#FFD700']} />
        )}
        
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: `0 20px 60px ${colors.glow}, 0 0 100px ${colors.glow}`,
          border: `4px solid ${colors.primary}`,
          animation: stage === 'intro' ? 'pulse 1s infinite' : 'slideInUp 0.6s ease-out',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}>
          
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: `radial-gradient(circle, ${colors.primary}20, transparent)`,
            borderRadius: '50%'
          }} />
          
          {stage === 'intro' && (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'bounce 1s infinite' }}>
                📊
              </div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: theme.textPrimary,
                marginBottom: '12px',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                Week {weekNumber} Results
              </h2>
              <p style={{
                fontSize: '16px',
                color: theme.textSecondary
              }}>
                The final scores are in...
              </p>
            </div>
          )}
          
          {stage === 'winner' && (
            <div style={{ animation: 'zoomIn 0.5s ease-out' }}>
              <div style={{ 
                fontSize: '80px', 
                marginBottom: '20px',
                animation: 'pulse 1s infinite',
                filter: `drop-shadow(0 0 20px ${colors.glow})`
              }}>
                {winner === 'children' ? '👧👦' : winner === 'parents' ? '👨‍👩' : '🤝'}
              </div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '12px',
                fontFamily: 'Impact, sans-serif',
                letterSpacing: '2px'
              }}>
                {victoryMsg.title}
              </h2>
              <p style={{
                fontSize: '20px',
                fontWeight: '600',
                color: colors.primary,
                marginBottom: '8px'
              }}>
                {victoryMsg.subtitle}
              </p>
              <p style={{
                fontSize: '14px',
                color: theme.textSecondary,
                fontStyle: 'italic'
              }}>
                {victoryMsg.message}
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '40px',
                marginTop: '24px',
                padding: '16px',
                backgroundColor: `${colors.primary}10`,
                borderRadius: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ECDC4' }}>
                    {childrenMinutes}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary }}>Kids</div>
                </div>
                <div style={{ fontSize: '24px', color: theme.textSecondary }}>vs</div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6B6B' }}>
                    {parentMinutes}
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary }}>Parents</div>
                </div>
              </div>
              
              <button
                onClick={handleNextStage}
                style={{
                  marginTop: '20px',
                  backgroundColor: colors.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  animation: 'pulse 2s infinite'
                }}
              >
                {winner !== 'tie' ? 'See MVP →' : 'Continue →'}
              </button>
            </div>
          )}
          
          {stage === 'mvp' && mvp && winner !== 'tie' && (
            <div style={{ animation: 'slideInRight 0.5s ease-out' }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '20px',
                animation: 'rotate 2s linear infinite'
              }}>
                ⭐
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: theme.textPrimary,
                marginBottom: '20px',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                MVP of the Week!
              </h2>
              
              <div style={{
                backgroundColor: '#FFD700',
                color: '#000',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
                border: '3px solid #FFC700'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                  {mvp.isParent ? '👨‍👩' : '🌟'}
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  {mvp.name}
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold'
                }}>
                  {mvp.minutes} minutes!
                </div>
                <div style={{
                  fontSize: '12px',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                  {mvp.isStudentMVP ? 
                    "Led the kids to victory and earned bonus XP!" : 
                    mvp.multipleParents ? 
                      "Outread everyone - even their partner!" :
                      "Carried the parent team to glory!"}
                </div>
              </div>
              
              <button
                onClick={handleNextStage}
                style={{
                  backgroundColor: '#FFD700',
                  color: '#000',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {winner === 'children' ? 'See XP Rewards →' : 'Continue →'}
              </button>
            </div>
          )}
          
          {stage === 'rewards' && winner === 'children' && (
            <div style={{ animation: 'zoomIn 0.5s ease-out' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                🎮
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: theme.textPrimary,
                marginBottom: '20px'
              }}>
                XP Rewards Unlocked!
              </h2>
              
              <div style={{
                backgroundColor: `${theme.accent}20`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                {Object.entries(studentXP).map(([id, data]) => (
                  <div key={id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    backgroundColor: data.isMVP ? '#FFD70030' : 'transparent',
                    borderRadius: '8px',
                    marginBottom: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {data.isMVP && <span style={{ fontSize: '16px' }}>👑</span>}
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: data.isMVP ? '600' : '400',
                        color: theme.textPrimary 
                      }}>
                        {data.name}
                      </span>
                    </div>
                    <div style={{
                      backgroundColor: data.isMVP ? '#FFD700' : theme.primary,
                      color: data.isMVP ? '#000' : '#FFF',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      +{data.xp} XP
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: theme.textSecondary,
                fontStyle: 'italic',
                marginBottom: '16px'
              }}>
                {mvp && mvp.isStudentMVP ? 
                  `${mvp.name} earned an extra 25 XP for being MVP!` :
                  'All team members earned 25 XP for the victory!'}
              </div>
              
              <button
                onClick={handleNextStage}
                style={{
                  backgroundColor: theme.accent,
                  color: theme.textPrimary,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continue →
              </button>
            </div>
          )}
          
          {stage === 'bragging' && winner === 'parents' && (
            <div style={{ animation: 'slideInRight 0.5s ease-out' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>
                🏆
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: theme.textPrimary,
                marginBottom: '20px'
              }}>
                Victory Achieved!
              </h2>
              
              <div style={{
                backgroundColor: '#FFD700',
                color: '#000',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  {isStudent ? 
                    "Your parents have won this week!" :
                    "You've added another victory to your collection!"}
                </div>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {isStudent ? 
                    "Time to step up your game for next week! 💪" :
                    "Check your Victory Archive to see all your championship moments! 🎊"}
                </div>
              </div>
              
              {!isStudent && (
                <button
                  onClick={handleNextStage}
                  style={{
                    backgroundColor: '#FFD700',
                    color: '#000',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  View Victory Archive 🏆
                </button>
              )}
              
              <button
                onClick={handleNextStage}
                style={{
                  backgroundColor: theme.accent,
                  color: theme.textPrimary,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continue →
              </button>
            </div>
          )}
          
          {stage === 'summary' && (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                🎊
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: theme.textPrimary,
                marginBottom: '16px'
              }}>
                Week {weekNumber} Complete!
              </h2>
              
              {winner !== 'tie' && (Object.keys(studentBreakdown).length > 1 || Object.keys(parentBreakdown || {}).length > 1) && (
                <div style={{
                  backgroundColor: `${theme.primary}10`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.textPrimary,
                    marginBottom: '12px'
                  }}>
                    Final Team Stats:
                  </div>
                  
                  {Object.keys(studentBreakdown).length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#4ECDC4',
                        marginBottom: '4px'
                      }}>
                        Team Kids:
                      </div>
                      {Object.entries(studentBreakdown).map(([id, data]) => (
                        <div key={id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '2px 8px',
                          fontSize: '11px',
                          color: theme.textSecondary
                        }}>
                          <span>{data.name}</span>
                          <span>{data.minutes} min</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {Object.keys(parentBreakdown || {}).length > 1 && (
                    <div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#FF6B6B',
                        marginBottom: '4px'
                      }}>
                        Team Parents:
                      </div>
                      {Object.entries(parentBreakdown).map(([uid, minutes], index) => (
                        <div key={uid} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '2px 8px',
                          fontSize: '11px',
                          color: theme.textSecondary
                        }}>
                          <span>Parent {index + 1}</span>
                          <span>{minutes} min</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <p style={{
                fontSize: '16px',
                color: theme.textSecondary,
                marginBottom: '20px',
                lineHeight: '1.5'
              }}>
                Great job everyone! The new battle for Week {weekNumber + 1} starts tomorrow. 
                Keep reading to claim victory!
              </p>
              
              <button
                onClick={() => {
                  setIsVisible(false);
                  if (onClose) onClose();
                }}
                style={{
                  backgroundColor: theme.accent,
                  color: theme.textPrimary,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Start Week {weekNumber + 1} 🚀
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}