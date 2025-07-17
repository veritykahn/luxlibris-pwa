// components/EnhancedBraggingRightsModal.js - Shared component for both pages

import { useState, useEffect } from 'react';
import { getCurrentAcademicYear, getAcademicYearDates } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Historical Figure Comparisons (1-20 books)
const HISTORICAL_COMPARISONS = {
  1: "You are like Isaac Newton with his Principia Mathematica - one masterpiece that changed everything! Just like Newton's single groundbreaking work revolutionized science, your one book showed the beginning of something extraordinary.",
  2: "You are like the Wright Brothers with their two historic flights - each one building toward greatness! Orville and Wilbur's first two flights lasted mere seconds but launched the age of aviation. Your two books launched your reading journey!",
  3: "You are like Beethoven with his three greatest symphonies - each one a perfect creation! The maestro's 3rd, 5th, and 9th symphonies are timeless classics. Your three books created your own masterpiece collection!",
  4: "You are like the four Gospels of Matthew, Mark, Luke, and John - each one telling an important story! These four books changed the world by sharing the greatest story ever told. Your four books built your own amazing story!",
  5: "You are like Shakespeare with his five greatest plays - each one a work of art! Hamlet, Romeo and Juliet, Macbeth, Othello, and King Lear remain the pinnacle of theater. Your five books showed you appreciate true literary excellence!",
  6: "You are like Michelangelo during his six years painting the Sistine Chapel - patient and dedicated, creating beauty! The master spent six years creating one of history's greatest artworks. Your six books showed the same dedication to your craft!",
  7: "You are like the seven wonders of the ancient world - each one magnificent and memorable! From the Pyramids to the Lighthouse of Alexandria, these seven marvels amazed all who saw them. Your seven books built your own wonder-filled mind!",
  8: "You are like Mozart with his eight greatest symphonies - each one a perfect harmony! The musical genius created symphonies that still move hearts centuries later. Your eight books created perfect harmony in your reading life!",
  9: "You are like the nine months it takes to grow new life - patient, steady progress toward something beautiful! Just as new life develops steadily over nine months, your nine books showed steady growth toward reading mastery!",
  10: "You are like the Ten Commandments - a perfect foundation for everything that follows! Moses received ten laws that became the foundation of faith for millions. Your ten books became the perfect foundation for a lifetime of learning!",
  11: "You are like the eleven apostles who spread the Gospel to the world - each one carrying an important message! After Jesus' resurrection, eleven devoted followers changed the world. Your eleven books showed you were ready to change your world too!",
  12: "You are like the twelve months of the year - each one essential for the complete cycle! Every month brings its own gifts and growth. Your twelve books represented a complete year of reading growth and discovery!",
  13: "You are like the thirteen original colonies that became America - each one contributing to something greater! Thirteen small colonies united to create a great nation. Your thirteen books united to create a great reader!",
  14: "You are like Saint Teresa of Avila during her fourteen years founding convents - each year building something lasting! This great saint spent fourteen years establishing houses of prayer that still serve God today. Your fourteen books built something lasting in your mind and heart!",
  15: "You are like Leonardo da Vinci with his fifteen masterpieces - taking time to perfect each one! The great Renaissance master created fifteen paintings that still inspire wonder today. Just like da Vinci, you took time to truly appreciate each book!",
  16: "You are like Saint John Bosco during his sixteen years building his first school - dedication that changed thousands of lives! This saint's sixteen years of hard work created a school that saved countless young people. Your sixteen books showed the same life-changing dedication!",
  17: "You are like the seventeen years cicadas spend underground before emerging transformed! These amazing insects spend seventeen years growing in darkness before emerging as beautiful, singing creatures. Your seventeen books showed patient transformation into a master reader!",
  18: "You are like Mary during the eighteen years she spent raising Jesus - each year nurturing something precious! Our Blessed Mother spent eighteen years lovingly raising the Savior of the world. Your eighteen books showed you nurtured the precious gift of knowledge!",
  19: "You are like Saint John Paul II during his nineteen years as Pope - each year serving with love and wisdom! This beloved saint spent nineteen years leading the Church with incredible dedication. Your nineteen books showed the same incredible dedication to learning!",
  20: "You are like the twenty mysteries of the Rosary - each one a perfect meditation on God's love! The Joyful, Sorrowful, Glorious, and Luminous mysteries give us twenty perfect moments of prayer. Your twenty books were twenty perfect moments of discovery!"
};

// Function to calculate academic year reading minutes (June 1st to March 31st)
const calculateAcademicYearMinutes = async (studentData) => {
  try {
    const currentYear = getCurrentAcademicYear();
    const { startDate, endDate } = getAcademicYearDates(currentYear);
    
    const sessionsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students/${studentData.id}/readingSessions`);
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    let totalMinutes = 0;
    
    sessionsSnapshot.forEach(doc => {
      const session = doc.data();
      const sessionDate = session.startTime?.toDate ? session.startTime.toDate() : new Date(session.startTime);
      
      if (sessionDate >= startDate && sessionDate <= endDate) {
        totalMinutes += session.duration || 0;
      }
    });
    
    return totalMinutes;
  } catch (error) {
    console.error('Error calculating academic year minutes:', error);
    return 0;
  }
};

// Function to get random saint from completed quiz results
const getRandomSaintFromQuizzes = (studentData) => {
  const quizResults = studentData.quizResults || {};
  const saintNames = Object.values(quizResults).map(result => result.saintName).filter(Boolean);
  
  if (saintNames.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * saintNames.length);
  return saintNames[randomIndex];
};

// Enhanced Bragging Rights Modal Component
export default function EnhancedBraggingRightsModal({ 
  show, 
  onClose, 
  studentData, 
  earnedBadges = [], 
  levelProgress = null, 
  readingPersonality = null, 
  currentTheme 
}) {
  const [braggingData, setBraggingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (show && studentData) {
      generateBraggingData();
    }
  }, [show, studentData]);

  const generateBraggingData = async () => {
    setIsLoading(true);
    try {
      const booksRead = studentData.booksSubmittedThisYear || 0;
      const achievementTiers = studentData.achievementTiers || [];
      const earnedAchievements = achievementTiers.filter(tier => booksRead >= tier.books);
      
      // Calculate academic year minutes
      const academicYearMinutes = await calculateAcademicYearMinutes(studentData);
      
      // Get random saint from quiz results
      const randomSaint = getRandomSaintFromQuizzes(studentData);
      
      // Get historical comparison
      const historicalComparison = HISTORICAL_COMPARISONS[Math.min(booksRead, 20)] || 
        `You read ${booksRead} books this year - that's incredible dedication to learning!`;
      
      // Get current academic year
      const currentYear = getCurrentAcademicYear();
      
      setBraggingData({
        studentName: `${studentData.firstName} ${studentData.lastInitial}`,
        grade: studentData.grade,
        academicYear: currentYear,
        
        // Main stats for the three boxes
        booksRead: booksRead,
        realWorldAchievements: earnedAchievements.length,
        totalMinutes: academicYearMinutes,
        
        // Historical comparison
        historicalComparison: historicalComparison,
        
        // Saint DNA result (if available)
        saintComparison: randomSaint ? `You were most like ${randomSaint} this year!` : null,
        
        // Reading personality (if available)
        readingPersonality: readingPersonality?.name ? `You were ${readingPersonality.name.toLowerCase()} this year!` : null,
        
        // Level and XP info
        level: levelProgress?.level || 1,
        totalXP: studentData.totalXP || 0,
        badgesEarned: earnedBadges.length,
        
        // Real world achievements list
        realWorldAchievementsList: earnedAchievements.map(achievement => ({
          books: achievement.books,
          reward: achievement.reward,
          type: achievement.type
        })),
        
        // Featured badge (latest earned)
        featuredBadge: earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null,
        
        // Special badges for display
        specialBadges: earnedBadges.filter(badge => badge.xp >= 100).slice(0, 3)
      });
    } catch (error) {
      console.error('Error generating bragging data:', error);
      setBraggingData(null);
    }
    setIsLoading(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {isLoading || !braggingData ? (
        <div style={{
          backgroundColor: currentTheme.surface,
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '300px',
          width: '100%'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #E0E0E0',
            borderTop: '3px solid ' + currentTheme.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ 
            color: currentTheme.textPrimary,
            fontSize: '14px',
            margin: '0'
          }}>
            {isLoading ? 'Generating your certificate...' : 'Loading...'}
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '380px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
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
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ✕
          </button>

          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            borderRadius: '20px 20px 0 0',
            padding: '20px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: 'clamp(40px, 12vw, 48px)', marginBottom: '8px' }}>🏆</div>
            <h2 style={{
              fontSize: 'clamp(18px, 5vw, 20px)',
              fontWeight: '600',
              margin: '0 0 4px 0',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Lux Libris Award
            </h2>
            <h3 style={{
              fontSize: 'clamp(16px, 4.5vw, 18px)',
              fontWeight: '500',
              margin: '0 0 8px 0',
              opacity: 0.95,
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Reading Achievement Certificate
            </h3>
            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              opacity: 0.9,
              margin: '0'
            }}>
              {braggingData.studentName} • Grade {braggingData.grade} • {braggingData.academicYear}
            </p>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Historical Comparison */}
            <div style={{
              backgroundColor: `${currentTheme.primary}10`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 'clamp(12px, 3.5vw, 14px)',
                color: currentTheme.textPrimary,
                lineHeight: '1.4',
                fontWeight: '500'
              }}>
                {braggingData.historicalComparison}
              </div>
            </div>

            {/* Saint and Reading Personality */}
            {(braggingData.saintComparison || braggingData.readingPersonality) && (
              <div style={{
                backgroundColor: `${currentTheme.secondary}15`,
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {braggingData.saintComparison && (
                  <div style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    color: currentTheme.textPrimary,
                    fontWeight: '500',
                    marginBottom: braggingData.readingPersonality ? '4px' : '0'
                  }}>
                    ♔ {braggingData.saintComparison}
                  </div>
                )}
                {braggingData.readingPersonality && (
                  <div style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    color: currentTheme.textPrimary,
                    fontWeight: '500'
                  }}>
                    🕐 {braggingData.readingPersonality}
                  </div>
                )}
              </div>
            )}

            {/* Main Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                border: `2px solid ${currentTheme.primary}`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 18px)',
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {braggingData.booksRead}
                </div>
                <div style={{
                  fontSize: 'clamp(9px, 2.5vw, 10px)',
                  color: '#666666'
                }}>
                  Books Read
                </div>
              </div>
              <div style={{
                backgroundColor: '#FFFFFF',
                border: `2px solid ${currentTheme.primary}`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 18px)',
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {braggingData.realWorldAchievements}
                </div>
                <div style={{
                  fontSize: 'clamp(9px, 2.5vw, 10px)',
                  color: '#666666'
                }}>
                  Real Achievements
                </div>
              </div>
              <div style={{
                backgroundColor: '#FFFFFF',
                border: `2px solid ${currentTheme.primary}`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(16px, 5vw, 18px)',
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  {Math.round(braggingData.totalMinutes / 60)}
                </div>
                <div style={{
                  fontSize: 'clamp(9px, 2.5vw, 10px)',
                  color: '#666666'
                }}>
                  Hours This Year
                </div>
              </div>
            </div>

            {/* Real World Achievements */}
            {braggingData.realWorldAchievementsList.length > 0 && (
              <div style={{
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  fontWeight: '600',
                  color: currentTheme.textPrimary,
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  🌟 Your Amazing Real-World Achievements 🌟
                </div>
                
                {braggingData.realWorldAchievementsList.map((achievement, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${currentTheme.primary}60`,
                      borderRadius: '12px',
                      padding: '10px',
                      marginBottom: '6px',
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      fontWeight: '500',
                      color: '#000000',
                      textAlign: 'left'
                    }}
                  >
                    🏆 {achievement.reward} ({achievement.books} books)
                  </div>
                ))}
              </div>
            )}

            {/* Badge Collection */}
            {braggingData.badgesEarned > 0 && (
              <div style={{
                backgroundColor: `${currentTheme.secondary}20`,
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: 'clamp(11px, 3vw, 12px)',
                  color: currentTheme.textSecondary,
                  marginBottom: '8px'
                }}>
                  ⚡ Level {braggingData.level} • {braggingData.totalXP} XP • {braggingData.badgesEarned} Badges
                </div>
                {braggingData.specialBadges.length > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {braggingData.specialBadges.map((badge, index) => (
                      <div key={index} style={{
                        fontSize: '20px',
                        padding: '4px',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        borderRadius: '8px',
                        border: `1px solid ${currentTheme.primary}40`
                      }}>
                        {badge.emoji}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Screenshot hint */}
            <div style={{
              backgroundColor: `${currentTheme.primary}20`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              marginTop: '16px'
            }}>
              <div style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: '600',
                color: currentTheme.textPrimary,
                marginBottom: '8px'
              }}>
                📸 Want to share this?
              </div>
              <div style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                color: currentTheme.textSecondary
              }}>
                Take a screenshot to share your achievements with family and friends!
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}