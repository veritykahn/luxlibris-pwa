// components/FamilyBattleVictoryModal.js - FIXED VERSION
import { useState, useEffect } from 'react';

// Victory bragging lines based on TOTAL VICTORIES, not week number
const PARENT_VICTORY_BRAGS = [
  { victoryNum: 1, line: "First blood! The championship journey begins! Your children have much to learn." },
  { victoryNum: 2, line: "Two victories! You're building a dynasty one book at a time!" },
  { victoryNum: 3, line: "Hat trick! Three wins! The kids are starting to sweat! 🎩" },
  { victoryNum: 4, line: "Four victories! You're officially a reading warrior!" },
  { victoryNum: 5, line: "Five wins! Your reading muscles are getting swole 💪📚" },
  { victoryNum: 6, line: "Six victories! The library should name a wing after you!" },
  { victoryNum: 7, line: "Lucky number 7! Your kids are googling 'how to beat parent at reading'" },
  { victoryNum: 8, line: "Eight wins! You're basically the Michael Phelps of reading!" },
  { victoryNum: 9, line: "Nine victories! You're basically the LeBron James of family reading!" },
  { victoryNum: 10, line: "DOUBLE DIGITS! 10 victories! Hall of Fame status achieved! 🏆" },
  { victoryNum: 11, line: "Eleven wins! Your reading throne remains unshaken!" },
  { victoryNum: 12, line: "A dozen victories! Time to write a book about winning!" },
  { victoryNum: 13, line: "Baker's dozen! 13 wins! Sweet like victory cookies 🍪" },
  { victoryNum: 14, line: "Fourteen victories! You're teaching a masterclass in domination!" },
  { victoryNum: 15, line: "Fifteen wins! The kids suspect you have reading superpowers!" },
  { victoryNum: 16, line: "Sweet 16 victories! Your legacy grows stronger!" },
  { victoryNum: 17, line: "Seventeen wins! Even autocorrect bows to your greatness!" },
  { victoryNum: 18, line: "Eighteen victories! Old enough to vote you as eternal champion!" },
  { victoryNum: 19, line: "Nineteen wins! The books whisper your name in reverence!" },
  { victoryNum: 20, line: "TWENTY VICTORIES! You've unlocked legendary status! 🎮" },
  { victoryNum: 21, line: "Twenty-one wins! You've come of age as a reading champion!" },
  { victoryNum: 22, line: "Twenty-two victories! Catch-22? More like Catch-YOU winning!" },
  { victoryNum: 23, line: "Twenty-three wins! Jordan's number, your game!" },
  { victoryNum: 24, line: "Two dozen victories! You're running out of room for trophies!" },
  { victoryNum: 25, line: "QUARTER CENTURY of wins! The kids need a new strategy!" },
  { victoryNum: 26, line: "Twenty-six victories! You've won the alphabet of reading battles!" },
  { victoryNum: 27, line: "Twenty-seven wins! Three cubed! Mathematical domination!" },
  { victoryNum: 28, line: "Twenty-eight victories! A perfect month of wins!" },
  { victoryNum: 29, line: "Twenty-nine wins! One away from the dirty thirty!" },
  { victoryNum: 30, line: "THIRTY VICTORIES! 🔥 You're officially a reading deity!" },
  { victoryNum: 31, line: "Thirty-one wins! A victory for each day of the longest months!" },
  { victoryNum: 32, line: "Thirty-two victories! Your power level is over 9000!" },
  { victoryNum: 33, line: "Thirty-three wins! The magic number of champions!" },
  { victoryNum: 34, line: "Thirty-four victories! Even the bookmarks salute you!" },
  { victoryNum: 35, line: "Thirty-five wins! High five times seven!" },
  { victoryNum: 36, line: "Three dozen victories! That's a lot of humble pie for the kids!" },
  { victoryNum: 37, line: "Thirty-seven wins! Your streak is aged like fine wine!" },
  { victoryNum: 38, line: "Thirty-eight victories! The library named a shelf after you!" },
  { victoryNum: 39, line: "Thirty-nine wins! The kids are writing your biography!" },
  { victoryNum: 40, line: "FORTY VICTORIES! 🎊 You've reached reading enlightenment!" },
  { victoryNum: 41, line: "Forty-one wins! The answer to life, the universe, and beating kids!" },
  { victoryNum: 42, line: "Forty-two victories! The ULTIMATE answer!" },
  { victoryNum: 43, line: "Forty-three wins! The kids are composing ballads about you!" },
  { victoryNum: 44, line: "Forty-four victories! Double trouble, double triumph!" },
  { victoryNum: 45, line: "Forty-five wins! Halfway to 90! No mercy!" },
  { victoryNum: 46, line: "Forty-six victories! The books read themselves for you now!" },
  { victoryNum: 47, line: "Forty-seven wins! Your greatness is visible from space!" },
  { victoryNum: 48, line: "Four dozen victories! That's 48 servings of success!" },
  { victoryNum: 49, line: "Forty-nine wins! Seven squared! Perfect champion!" },
  { victoryNum: 50, line: "FIFTY VICTORIES! 🏆 Half a century of pure domination!" },
  { victoryNum: 51, line: "Fifty-one wins! Area 51 called - they want to study your power!" },
  { victoryNum: 52, line: "52 VICTORIES! A full deck of wins! You are UNSTOPPABLE! 👑" }
];

export default function FamilyBattleVictoryModal({ show, onClose, victories, theme }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const itemsPerPage = 6;
  
  // Filter and enrich parent victories with victory number
  const parentVictories = victories
    .filter(v => v.winner === 'parents')
    .map((victory, index) => ({
      ...victory,
      victoryNumber: victory.victoryNumber || index + 1 // Use provided or calculate
    }));
  
  const totalPages = Math.ceil(parentVictories.length / itemsPerPage);
  
  if (!show || parentVictories.length === 0) return null;
  
  const currentVictories = parentVictories.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );
  
  const handlePageChange = (newPage) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsAnimating(false);
    }, 150);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.3s ease-out'
    }}
    onClick={onClose}>
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: `3px solid ${theme.primary}`,
        animation: 'slideInUp 0.4s ease-out'
      }}
      onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          borderBottom: `2px solid ${theme.primary}40`,
          paddingBottom: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: theme.textPrimary,
            marginBottom: '8px',
            fontFamily: 'Didot, "Times New Roman", serif'
          }}>
            Your Championship Collection
          </h2>
          <p style={{
            fontSize: '14px',
            color: theme.textSecondary
          }}>
            {parentVictories.length} {parentVictories.length === 1 ? 'victory' : 'victories'} and counting! 📚
          </p>
        </div>
        
        {/* Victory List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '20px',
          opacity: isAnimating ? 0 : 1,
          transition: 'opacity 0.15s ease'
        }}>
          {currentVictories.map((victory, index) => {
            // Use victory number for the brag line, not the week number
            const bragLine = PARENT_VICTORY_BRAGS[victory.victoryNumber - 1] || 
              PARENT_VICTORY_BRAGS[Math.min(51, victory.victoryNumber - 1)];
            
            return (
              <div key={`${victory.week}-${index}`} style={{
                backgroundColor: `${theme.primary}10`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                border: `1px solid ${theme.primary}40`,
                animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
                position: 'relative'
              }}>
                {/* Victory number badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: '#FF6B6B',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  Victory #{victory.victoryNumber}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      backgroundColor: '#FFD700',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#000'
                    }}>
                      W{victory.week}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '11px',
                        color: theme.textSecondary
                      }}>
                        Program Week {victory.week}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#FF6B6B'
                      }}>
                        Won by {victory.margin} min!
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: theme.textSecondary,
                    textAlign: 'right',
                    marginRight: '60px'
                  }}>
                    {victory.parentMinutes || victory.parents} vs {victory.childrenMinutes || victory.children}
                  </div>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: theme.textPrimary,
                  fontStyle: 'italic',
                  lineHeight: '1.4',
                  paddingLeft: '48px',
                  paddingRight: '60px'
                }}>
                  &quot;{bragLine.line}&quot;
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              style={{
                backgroundColor: theme.primary,
                color: theme.textPrimary,
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 0 ? 0.5 : 1
              }}
            >
              ← Previous
            </button>
            <span style={{
              fontSize: '14px',
              color: theme.textSecondary
            }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              style={{
                backgroundColor: theme.primary,
                color: theme.textPrimary,
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages - 1 ? 0.5 : 1
              }}
            >
              Next →
            </button>
          </div>
        )}
        
        {/* Stats Summary */}
        <div style={{
          backgroundColor: `${theme.accent}20`,
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: theme.textPrimary }}>
              {parentVictories.length}
            </div>
            <div style={{ fontSize: '10px', color: theme.textSecondary }}>
              Total Wins
            </div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF6B6B' }}>
              {parentVictories.reduce((sum, v) => sum + (v.parentMinutes || v.parents || 0), 0)}
            </div>
            <div style={{ fontSize: '10px', color: theme.textSecondary }}>
              Victory Minutes
            </div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ECDC4' }}>
              {Math.max(...(parentVictories.map(v => v.margin || 0)))}
            </div>
            <div style={{ fontSize: '10px', color: theme.textSecondary }}>
              Biggest Win
            </div>
          </div>
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: theme.accent,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Close Victory Archive
        </button>
      </div>
      
      <style jsx>{`
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
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}