// pages/student-stats/family-battle.js - FIXED VERSION
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { usePhaseAccess } from '../../hooks/usePhaseAccess';
import { getStudentDataEntities, updateStudentDataEntities } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';

// Import modal component
import FamilyBattleResultsModal from '../../components/FamilyBattleResultsModal';

// Import sync functions - UPDATED to include syncFamilyBattleData
import {
  syncFamilyBattleData,
  getStudentFamilyBattleStatus,
  getFamilyBattleDataForStudent,
  getStudentBattleContribution
} from '../../lib/family-battle-sync';

// Import simplified battle system
import { 
  getJaneAustenQuote,
  getProgramWeekNumber,
  getLocalDateString,
  getProgramWeekStart 
} from '../../lib/family-battle-system';

// Sunday Results Button Component
function SundayResultsButton({ onClick, winner, margin, weekNumber }) {
  const getResultText = () => {
    if (winner === 'children') {
      return `Kids Won +${margin}`;
    } else if (winner === 'parents') {
      return `Parents Won +${margin}`;
    } else {
      return 'Tie Battle';
    }
  };

  const getResultEmoji = () => {
    if (winner === 'children') return '🏆';
    if (winner === 'parents') return '😭';
    return '🤝';
  };

  return (
    <div 
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#FFD700',
        borderRadius: '50px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(255, 215, 0, 0.5)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        animation: 'pulse 2s infinite',
        zIndex: 200,
        border: '2px solid #FFC700'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.7)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.5)';
      }}
    >
      <span style={{ 
        fontSize: '20px',
        animation: 'bounce 1s infinite'
      }}>
        {getResultEmoji()}
      </span>
      <div style={{ color: '#000000' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          lineHeight: '1'
        }}>
          WEEK {weekNumber}
        </div>
        <div style={{
          fontSize: '10px',
          opacity: 0.8,
          lineHeight: '1'
        }}>
          {getResultText()}
        </div>
      </div>
    </div>
  );
}

// Stone Cold Jane Austen Helper
function StoneColdjaneAustenHelper({ show, battleState, winner, onClose, currentTheme, familyBattleData }) {
  const [currentQuote, setCurrentQuote] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get quote type and image based on day and battle state
  const getQuoteTypeAndImage = () => {
    const dayOfWeek = new Date().getDay();
    
    // Sunday - Prayerful Day of Rest
    if (dayOfWeek === 0) {
      return { 
        type: 'prayerful', 
        image: '/images/jane-austen-prayerful.png',
        tagline: "Stone Cold Jane Austen's Sunday Reflection:"
      };
    }
    
    // Monday-Tuesday - Encouraging
    if (dayOfWeek >= 1 && dayOfWeek <= 2) {
      return { 
        type: 'encouraging', 
        image: '/images/jane-austen-encouraging.png',
        tagline: "Because Stone Cold Jane Austen sayeth so:"
      };
    }
    
    // Wednesday-Thursday - Battle Ready
    if (dayOfWeek >= 3 && dayOfWeek <= 4) {
      return { 
        type: 'battleReady', 
        image: '/images/jane-austen-battle-ready.png',
        tagline: "Because Stone Cold Jane Austen sayeth so:"
      };
    }
    
    // Friday-Saturday - Victorious
    if (dayOfWeek >= 5 && dayOfWeek <= 6) {
      return { 
        type: 'victorious', 
        image: '/images/jane-austen-victorious.png',
        tagline: "Because Stone Cold Jane Austen sayeth so:"
      };
    }
    
    // Default fallback
    return { 
      type: 'encouraging', 
      image: '/images/jane-austen-encouraging.png',
      tagline: "Because Stone Cold Jane Austen sayeth so:"
    };
  };

  useEffect(() => {
    const { type } = getQuoteTypeAndImage();
    setCurrentQuote(getJaneAustenQuote(type));
  }, [battleState, winner, familyBattleData]);

  useEffect(() => {
    if (show && !isVisible) {
      setIsVisible(true);
      const duration = new Date().getDay() === 0 ? 15000 : 12000;
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, isVisible]);

  useEffect(() => {
    if (show) {
      const interval = setInterval(() => setIsVisible(true), 45000);
      return () => clearInterval(interval);
    }
  }, [show]);

  if (!isVisible) return null;

  const { image, type, tagline } = getQuoteTypeAndImage();
  const isPrayerful = type === 'prayerful';

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: isPrayerful 
        ? `linear-gradient(135deg, #E6E6FA, #F0E6FF, #FFFFFF)`
        : `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
      borderRadius: '16px',
      padding: '12px 16px',
      maxWidth: '320px',
      width: '90vw',
      animation: 'slideInUp 0.5s ease-out',
      boxShadow: isPrayerful
        ? `0 8px 32px rgba(138, 43, 226, 0.2), 0 0 0 2px #E6E6FA`
        : `0 8px 32px rgba(0,0,0,0.25), 0 0 0 2px ${currentTheme.accent}`,
      border: isPrayerful 
        ? `3px solid #DDA0DD`
        : `3px solid ${currentTheme.primary}`,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {!imageError ? (
          <img 
            src={image}
            alt="Stone Cold Jane Austen"
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'contain',
              filter: isPrayerful ? 'brightness(1.05)' : 'none'
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: isPrayerful ? '#E6E6FA' : currentTheme.accent,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            border: isPrayerful 
              ? `2px solid #DDA0DD`
              : `2px solid ${currentTheme.primary}`
          }}>
            {isPrayerful ? '🙏' : '👩‍🎓'}
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: isPrayerful ? '#4B0082' : currentTheme.textPrimary,
          marginBottom: '6px',
          fontFamily: 'Didot, "Times New Roman", serif'
        }}>
          {tagline}
        </div>
        <div style={{
          fontSize: '11px',
          color: isPrayerful ? '#4B0082' : currentTheme.textPrimary,
          lineHeight: '1.4',
          fontStyle: isPrayerful ? 'normal' : 'italic',
          fontFamily: isPrayerful ? 'Georgia, serif' : 'Didot, "Times New Roman", serif',
          fontWeight: isPrayerful ? '500' : 'normal'
        }}>
          {isPrayerful ? (
            <span>{currentQuote}</span>
          ) : (
            <span>&quot;{currentQuote}&quot;</span>
          )}
        </div>
      </div>
      
      <button
        onClick={() => setIsVisible(false)}
        style={{
          backgroundColor: isPrayerful ? '#DDA0DD' : currentTheme.primary,
          color: isPrayerful ? '#FFFFFF' : currentTheme.textPrimary,
          border: 'none',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          cursor: 'pointer',
          flexShrink: 0,
          fontWeight: 'bold'
        }}
      >
        ✕
      </button>
    </div>
  );
}

// Battle Arena Component
function BattleArena({ battleData, currentTheme, studentData }) {
  if (!battleData) return null;

  // Debug logging
  console.log('🎯 Battle Data:', {
    childrenMinutes: battleData.childrenMinutes,
    parentMinutes: battleData.parentMinutes,
    winner: battleData.winner,
    margin: battleData.margin
  });

  // Determine who's winning based on actual minutes (not just winner field which is 'ongoing' during week)
  const childrenWinning = battleData.childrenMinutes > battleData.parentMinutes;
  const parentWinning = battleData.parentMinutes > battleData.childrenMinutes;
  const isTie = battleData.childrenMinutes === battleData.parentMinutes;
  const dayOfWeek = new Date().getDay();
  const isSunday = dayOfWeek === 0;

  console.log('👑 Crown should show:', { childrenWinning, parentWinning, isTie });

  // Find student contribution from breakdown
  const getStudentContribution = () => {
    if (!battleData.studentBreakdown) return 0;
    
    for (const [id, data] of Object.entries(battleData.studentBreakdown)) {
      if (data.name === studentData.firstName) {
        return data.minutes || 0;
      }
    }
    
    return 0;
  };

  const studentContribution = getStudentContribution();

  // Dynamic messaging based on day and status
  const getBattleStatusMessage = () => {
    if (isSunday) {
      // Sunday - Results day (Monday-Saturday totals)
      if (childrenWinning && battleData.margin >= 30) {
        return `🏆 TOTAL DOMINATION! Kids crushed parents by ${battleData.margin} minutes! You have bragging rights until next week! 🎉👑`;
      } else if (childrenWinning && battleData.margin > 0) {
        return `🏆 KIDS RULE THE BATTLE! Won by ${battleData.margin} minutes! Victory is yours! 👑`;
      } else if (parentWinning && battleData.margin >= 30) {
        return `😤 Parents DESTROYED you by ${battleData.margin} minutes! Time for REVENGE next week! 🔥`;
      } else if (parentWinning && battleData.margin > 0) {
        return `😅 Parents won this week (+${battleData.margin} min) but don't give up! Rematch time! ⚔️`;
      } else if (isTie && battleData.totalMinutes > 0) {
        return '🤝 Epic Tie Battle! Both teams fought hard! Who will dominate next week? 🥊';
      } else {
        return 'No reading this week? The battle awaits next week! 💪';
      }
    } else {
      // During the week (Monday-Saturday)
      if (childrenWinning && battleData.margin > 0) {
        return `🔥 Kids leading by ${battleData.margin} minutes! Keep reading to stay ahead!`;
      } else if (parentWinning && battleData.margin > 0) {
        return `Parents ahead by ${battleData.margin} minutes! Time to catch up! 📚`;
      } else if (isTie && battleData.totalMinutes > 0) {
        return '⚖️ Tied up! Every minute counts in this battle!';
      } else {
        return 'The battle begins! Start reading to take the lead! 💪';
      }
    }
  };

  const getMotivationMessage = () => {
    if (isSunday) {
      return childrenWinning ? '🎉 Enjoy your victory! New battle starts tomorrow!' : 
             '💪 New week, new chance for victory starting tomorrow!';
    } else {
      return '📚 Keep reading! Every minute counts toward Sunday\'s final score!';
    }
  };

  return (
    <div className="battle-arena" style={{
      backgroundColor: currentTheme.surface,
      borderRadius: '20px',
      padding: '24px',
      paddingTop: '10px',
      marginBottom: '20px',
      marginTop: '20px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      position: 'relative',
      overflow: 'visible'
    }}>
      {/* Battle Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚔️</div>
        <h2 style={{
          fontSize: 'clamp(18px, 5vw, 20px)',
          fontWeight: 'bold',
          color: currentTheme.textPrimary,
          margin: '0 0 4px 0',
          fontFamily: 'Didot, "Times New Roman", serif'
        }}>
          Family Reading Showdown
        </h2>
        <p style={{
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: currentTheme.textSecondary,
          margin: 0
        }}>
          Week {battleData.weekNumber} • {isSunday ? '🏆 RESULTS DAY!' : `${7 - dayOfWeek} days until results`}
        </p>
      </div>

      {/* Battle Grid */}
      <div className="battle-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px',
        marginTop: '50px', // Extra space for crown floating above cards
        position: 'relative'
      }}>
        {/* KIDS CORNER */}
        <div style={{
          background: childrenWinning 
            ? `linear-gradient(145deg, #4ECDC440, #4ECDC420, #FFFFFF)`
            : `linear-gradient(145deg, ${currentTheme.surface}, #4ECDC410, #FFFFFF)`,
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
          border: childrenWinning ? '3px solid #4ECDC4' : '2px solid #E5E7EB',
          boxShadow: childrenWinning 
            ? '0 8px 25px rgba(78, 205, 196, 0.4)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative',
          transform: childrenWinning ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '280px'
        }}>
          {/* CROWN FOR WINNING TEAM - FLOATING ABOVE */}
          {childrenWinning && (
            <div style={{
              position: 'absolute',
              top: '-38px',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <div style={{
                fontSize: '54px',
                animation: 'crownFloat 3s ease-in-out infinite',
                lineHeight: '1'
              }}>
                👑
              </div>
            </div>
          )}
          
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>👧👦</div>
          
          <h3 style={{
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: '600',
            color: currentTheme.textPrimary,
            marginBottom: '4px'
          }}>
            Kids Squad
          </h3>
          <div style={{
            fontSize: 'clamp(24px, 8vw, 28px)',
            fontWeight: 'bold',
            color: '#4ECDC4',
            marginBottom: '4px'
          }}>
            {battleData.childrenMinutes}
          </div>
          <div style={{
            fontSize: 'clamp(10px, 3vw, 12px)',
            color: currentTheme.textSecondary,
            marginBottom: '8px'
          }}>
            minutes this week
          </div>
          
          <div style={{
            backgroundColor: '#4ECDC420',
            borderRadius: '8px',
            padding: '8px',
            fontSize: 'clamp(10px, 3vw, 11px)',
            color: currentTheme.textPrimary
          }}>
            <strong>You: {studentContribution} min</strong>
          </div>
          
          <div style={{
            marginTop: '12px',
            fontSize: 'clamp(10px, 3vw, 11px)',
            fontWeight: '600',
            color: '#4ECDC4',
            fontStyle: 'italic'
          }}>
            {childrenWinning && isSunday ? "VICTORIOUS! 🎉" :
             childrenWinning ? "Leading! 🔥" :
             parentWinning ? "Time to catch up! 😤" :
             "Keep fighting! 💪"}
          </div>
        </div>
        
        {/* PARENTS CORNER */}
        <div style={{
          background: parentWinning 
            ? `linear-gradient(145deg, #FF6B6B40, #FF6B6B20, #FFFFFF)`
            : `linear-gradient(145deg, ${currentTheme.surface}, #FF6B6B10, #FFFFFF)`,
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
          border: parentWinning ? '3px solid #FF6B6B' : '2px solid #E5E7EB',
          boxShadow: parentWinning 
            ? '0 8px 25px rgba(255, 107, 107, 0.4)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative',
          transform: parentWinning ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '280px'
        }}>
          {/* CROWN FOR WINNING TEAM - ABOVE EVERYTHING */}
          {parentWinning && (
            <div style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '48px',
              animation: 'crownFloat 3s ease-in-out infinite',
              filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.8))',
              lineHeight: '1',
              zIndex: 10
            }}>
              👑
            </div>
          )}
          
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>👨‍👩</div>
          
          <h3 style={{
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: '600',
            color: currentTheme.textPrimary,
            marginBottom: '4px'
          }}>
            Parent Power
          </h3>
          <div style={{
            fontSize: 'clamp(24px, 8vw, 28px)',
            fontWeight: 'bold',
            color: '#FF6B6B',
            marginBottom: '4px'
          }}>
            {battleData.parentMinutes}
          </div>
          <div style={{
            fontSize: 'clamp(10px, 3vw, 12px)',
            color: currentTheme.textSecondary,
            marginBottom: '16px'
          }}>
            minutes this week
          </div>
          
          <div style={{
            marginTop: '12px',
            fontSize: 'clamp(10px, 3vw, 11px)',
            fontWeight: '600',
            color: '#FF6B6B',
            fontStyle: 'italic'
          }}>
            {parentWinning && isSunday ? "Winners! 🏆" : 
             parentWinning ? "Leading! 👑" :
             childrenWinning ? "Under pressure! 😅" :
             "Ready to fight! 💪"}
          </div>
        </div>
      </div>

      {/* Battle Status Banner */}
      <div style={{
        backgroundColor: isSunday ? '#FFD70020' :
                        childrenWinning ? '#4ECDC420' : 
                        parentWinning ? '#FF6B6B20' : 
                        `${currentTheme.primary}20`,
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        border: isSunday ? '2px solid #FFD700' :
                childrenWinning ? '2px solid #4ECDC4' : 
                parentWinning ? '2px solid #FF6B6B' : 
                `2px solid ${currentTheme.primary}60`
      }}>
        <div style={{
          fontSize: 'clamp(16px, 5vw, 18px)',
          fontWeight: 'bold',
          color: currentTheme.textPrimary,
          marginBottom: '8px',
          lineHeight: '1.3'
        }}>
          {getBattleStatusMessage()}
        </div>
        
        <div style={{
          fontSize: 'clamp(11px, 3vw, 12px)',
          color: currentTheme.textSecondary,
          fontStyle: 'italic'
        }}>
          {getMotivationMessage()}
        </div>
      </div>
    </div>
  );
}

export default function StudentFamilyBattleSimplified() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { phaseData, hasAccess } = usePhaseAccess();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState('');
  
  // Battle states
  const [familyBattleUnlocked, setFamilyBattleUnlocked] = useState(false);
  const [familyBattleData, setFamilyBattleData] = useState(null);
  const [studentContribution, setStudentContribution] = useState(0);
  const [familyStats, setFamilyStats] = useState(null);
  
  // UI states
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showJaneAusten, setShowJaneAusten] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false);
  
  // Refs to prevent rapid refreshes
  const lastRefreshTime = useRef(0);
  const refreshIntervalRef = useRef(null);

  // Check if it's Sunday
  const isSunday = new Date().getDay() === 0;

  // Theme definitions
  const themes = useMemo(() => ({
    classic_lux: {
      name: 'Lux Libris Classic',
      assetPrefix: 'classic_lux',
      primary: '#ADD4EA',
      secondary: '#C3E0DE',
      accent: '#A1E5DB',
      background: '#FFFCF5',
      surface: '#FFFFFF',
      textPrimary: '#223848',
      textSecondary: '#556B7A'
    },
    darkwood_sports: {
      name: 'Athletic Champion',
      assetPrefix: 'darkwood_sports',
      primary: '#2F5F5F',
      secondary: '#8B2635',
      accent: '#F5DEB3',
      background: '#F5F5DC',
      surface: '#FFF8DC',
      textPrimary: '#2F1B14',
      textSecondary: '#5D4037'
    },
    lavender_space: {
      name: 'Cosmic Explorer',
      assetPrefix: 'lavender_space',
      primary: '#8B7AA8',
      secondary: '#9B85C4',
      accent: '#C8B3E8',
      background: '#2A1B3D',
      surface: '#3D2B54',
      textPrimary: '#E8DEFF',
      textSecondary: '#B8A6D9'
    },
    mint_music: {
      name: 'Musical Harmony',
      assetPrefix: 'mint_music',
      primary: '#B8E6B8',
      secondary: '#FFB3BA',
      accent: '#FFCCCB',
      background: '#FEFEFE',
      surface: '#F8FDF8',
      textPrimary: '#2E4739',
      textSecondary: '#4A6B57'
    },
    pink_plushies: {
      name: 'Kawaii Dreams',
      assetPrefix: 'pink_plushies',
      primary: '#FFB6C1',
      secondary: '#FFC0CB',
      accent: '#FFE4E1',
      background: '#FFF0F5',
      surface: '#FFE4E6',
      textPrimary: '#4A2C2A',
      textSecondary: '#8B4B5C'
    },
    teal_anime: {
      name: 'Otaku Paradise',
      assetPrefix: 'teal_anime',
      primary: '#20B2AA',
      secondary: '#48D1CC',
      accent: '#7FFFD4',
      background: '#E0FFFF',
      surface: '#AFEEEE',
      textPrimary: '#2F4F4F',
      textSecondary: '#5F9EA0'
    },
    white_nature: {
      name: 'Pure Serenity',
      assetPrefix: 'white_nature',
      primary: '#6B8E6B',
      secondary: '#D2B48C',
      accent: '#F5F5DC',
      background: '#FFFEF8',
      surface: '#FFFFFF',
      textPrimary: '#2F4F2F',
      textSecondary: '#556B2F'
    },
    little_luminaries: {
      name: 'Luxlings™',
      assetPrefix: 'little_luminaries',
      primary: '#000000',
      secondary: '#000000',
      accent: '#E8E8E8',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      textPrimary: '#8B6914',
      textSecondary: '#606060'
    }
  }), []);

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { 
      name: 'Nominees', 
      path: '/student-nominees', 
      icon: '□', 
      locked: !hasAccess('nomineesBrowsing'), 
      lockReason: phaseData.currentPhase === 'VOTING' ? 'Nominees locked during voting' : 
                 phaseData.currentPhase === 'RESULTS' ? 'Nominees locked during results' :
                 phaseData.currentPhase === 'TEACHER_SELECTION' ? 'New amazing nominees coming this week!' : 'Nominees not available'
    },
    { 
      name: 'Bookshelf', 
      path: '/student-bookshelf', 
      icon: '⚏', 
      locked: !hasAccess('bookshelfViewing'), 
      lockReason: phaseData.currentPhase === 'RESULTS' ? 'Bookshelf locked during results' :
                 phaseData.currentPhase === 'TEACHER_SELECTION' ? 'Stats refreshing - new bookshelf coming!' : 'Bookshelf not available'
    },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△' },
    { name: 'Settings', path: '/student-settings', icon: '⚙' }
  ], [hasAccess, phaseData.currentPhase]);

  // Stats navigation options
  const statsNavOptions = useMemo(() => [
    { name: 'Stats Dashboard', path: '/student-stats', icon: '📊', description: 'Fun overview' },
    { name: 'My Stats', path: '/student-stats/my-stats', icon: '📈', description: 'Personal deep dive' },
    { name: 'Grade Stats', path: '/student-stats/grade-stats', icon: '🎓', description: 'Compare with classmates' },
    { name: 'School Stats', path: '/student-stats/school-stats', icon: '🏫', description: 'School-wide progress' },
    { name: 'Diocese Stats', path: '/student-stats/diocese-stats', icon: '⛪', description: 'Coming soon!', disabled: true },
    { name: 'Global Stats', path: '/student-stats/global-stats', icon: '🌎', description: 'Coming soon!', disabled: true },
    { 
      name: 'Lux DNA Lab', 
      path: '/student-stats/lux-dna-lab', 
      icon: '🧬', 
      description: phaseData.currentPhase === 'RESULTS' ? 'Nominees DNA locked for year' : 'Discover your reading personality',
      phaseNote: phaseData.currentPhase === 'RESULTS' ? 'Nominees DNA analysis is closed for this academic year' : null
    },
    { name: 'Family Battle', path: '/student-stats/family-battle', icon: '🥊', description: 'WWE-style reading showdown!', current: true }
  ], [phaseData.currentPhase]);

  // Handle stats navigation
  const handleStatsNavigation = (option) => {
    setShowStatsDropdown(false);
    
    if (option.disabled) {
      alert(`${option.name} is coming soon! 🚧`);
      return;
    }
    
    if (option.current) {
      return;
    }
    
    router.push(option.path);
  };

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const firebaseStudentData = await getStudentDataEntities(user.uid);
      if (!firebaseStudentData) {
        router.push('/student-onboarding');
        return;
      }
      
      const studentRef = doc(
        db, 
        `entities/${firebaseStudentData.entityId}/schools/${firebaseStudentData.schoolId}/students/${user.uid}`
      );
      const freshStudentDoc = await getDoc(studentRef);
      
      if (freshStudentDoc.exists()) {
        const freshData = freshStudentDoc.data();
        const completeStudentData = {
          ...firebaseStudentData,
          ...freshData,
          familyBattleSettings: freshData.familyBattleSettings || null
        };
        
        setStudentData(completeStudentData);
        
        const selectedThemeKey = completeStudentData.selectedTheme || 'classic_lux';
        const selectedTheme = themes[selectedThemeKey];
        setCurrentTheme(selectedTheme);
      } else {
        setStudentData(firebaseStudentData);
        
        const selectedThemeKey = firebaseStudentData.selectedTheme || 'classic_lux';
        const selectedTheme = themes[selectedThemeKey];
        setCurrentTheme(selectedTheme);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load family battle data. Please try again.');
    }
    
    setIsLoading(false);
  }, [user?.uid, router, themes]);

  // Auto-show results modal on Sunday
  useEffect(() => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    
    if (isSunday && 
        familyBattleData && 
        familyBattleData.winner && 
        familyBattleData.winner !== 'ongoing' &&
        familyBattleData.weekNumber) {
      
      const localStorageKey = `familyBattleResultsShown_student_${user?.uid}_week_${familyBattleData.weekNumber}`;
      const hasSeenResults = localStorage.getItem(localStorageKey) === 'true';
      
      if (!hasSeenResults) {
        console.log('📊 Auto-showing results modal for week:', familyBattleData.weekNumber);
        
        // Check if student got XP (will be in their data if sync already ran)
        if (familyBattleData.winner === 'children' && 
            studentData[`familyBattleWeek${familyBattleData.weekNumber}XPAwarded`]) {
          
          console.log('✅ Student already received XP for Week', familyBattleData.weekNumber);
          
          // Calculate if student was MVP for display
          let isStudentMVP = false;
          let maxMinutes = 0;
          
          Object.entries(familyBattleData.studentBreakdown || {}).forEach(([id, data]) => {
            if ((data.minutes || 0) > maxMinutes) {
              maxMinutes = data.minutes || 0;
              if (data.name === studentData.firstName) {
                isStudentMVP = true;
              }
            }
          });
          
          const xpAmount = isStudentMVP ? 50 : 25; // Base 25 + MVP bonus 25
          setShowSuccess(`🎉 Victory! You earned ${xpAmount} XP for Week ${familyBattleData.weekNumber}!`);
          setTimeout(() => setShowSuccess(''), 4000);
        }
        
        // Show the modal
        setShowResultsModal(true);
        localStorage.setItem(localStorageKey, 'true');
      } else {
        console.log('📊 Results already shown for week:', familyBattleData.weekNumber);
      }
    }
  }, [isSunday, familyBattleData, user?.uid, studentData]);

  // Load family battle status with throttling - UPDATED WITH SYNC
  useEffect(() => {
    const loadFamilyBattleStatus = async () => {
      if (!user?.uid || !studentData) return;
      
      // Throttle refreshes - minimum 10 seconds between loads
      const now = Date.now();
      if (now - lastRefreshTime.current < 10000) {
        console.log('🚫 Throttling battle data load - too soon');
        return;
      }
      
      lastRefreshTime.current = now;
      
      try {
        console.log('🥊 Loading family battle status for student...');
        
        const battleStatus = await getStudentFamilyBattleStatus(studentData);
        
        if (battleStatus.enabled) {
          console.log('✅ Family battle is enabled!');
          setFamilyBattleUnlocked(true);
          
          // CRITICAL FIX: Sync the battle data instead of just reading it
          if (battleStatus.familyId) {
            console.log('🔄 Syncing fresh battle data for family:', battleStatus.familyId);
            
            // We need to get linked students for the sync
            // Since we're a student, we'll pass ourselves as the only student for now
            const studentForSync = [{
              id: studentData.id || user.uid,
              entityId: studentData.entityId,
              schoolId: studentData.schoolId,
              firstName: studentData.firstName,
              name: studentData.firstName || studentData.studentName
            }];
            
            // Sync the data
            const syncedData = await syncFamilyBattleData(battleStatus.familyId, studentForSync);
            
            console.log('🔍 SYNCED DATA:', syncedData);
            
            // Use the synced data
            setFamilyBattleData({
              weekNumber: syncedData.weekNumber,
              childrenMinutes: syncedData.childrenMinutes,
              parentMinutes: syncedData.parentMinutes,
              winner: syncedData.winner,
              margin: syncedData.margin,
              battleStatus: syncedData.battleStatus,
              isResultsDay: syncedData.isResultsDay,
              totalMinutes: syncedData.totalMinutes,
              studentBreakdown: syncedData.studentBreakdown,
              parentBreakdown: syncedData.parentBreakdown
            });
          } else if (battleStatus.battleData) {
            // Fallback to existing data if no familyId
            setFamilyBattleData({
              weekNumber: battleStatus.battleData.weekNumber,
              childrenMinutes: battleStatus.battleData.childrenMinutes,
              parentMinutes: battleStatus.battleData.parentMinutes,
              winner: battleStatus.battleData.winner,
              margin: battleStatus.battleData.margin,
              battleStatus: battleStatus.battleData.battleStatus,
              isResultsDay: battleStatus.battleData.isResultsDay,
              totalMinutes: battleStatus.battleData.totalMinutes,
              studentBreakdown: battleStatus.battleData.studentBreakdown,
              parentBreakdown: battleStatus.battleData.parentBreakdown
            });
          }
          
          // Check if XP was already awarded
          if (battleStatus.battleData?.isResultsDay && 
              battleStatus.battleData?.winner === 'children' &&
              studentData[`familyBattleWeek${battleStatus.battleData?.weekNumber}XPAwarded`]) {
            console.log('✅ XP already awarded for Week', battleStatus.battleData?.weekNumber);
          }
          
          // Get contribution from battle data
          let contribution = 0;
          if (battleStatus.battleData?.studentBreakdown) {
            for (const [id, data] of Object.entries(battleStatus.battleData.studentBreakdown)) {
              if (data.name === studentData.firstName) {
                contribution = data.minutes || 0;
                break;
              }
            }
          }
          
          setStudentContribution(contribution);
          
          if (battleStatus.familyStats) {
            const stats = battleStatus.familyStats;
            setFamilyStats({
              totalBattles: stats.totalBattles || 0,
              currentStreak: stats.currentStreak || { team: null, weeks: 0 },
              winRates: {
                children: stats.totalBattles > 0 ? 
                  Math.round((stats.childrenWins / stats.totalBattles) * 100) : 0,
                parents: stats.totalBattles > 0 ? 
                  Math.round((stats.parentWins / stats.totalBattles) * 100) : 0
              }
            });
          }
        } else {
          console.log('❌ Family battle not enabled:', battleStatus.reason);
          setFamilyBattleUnlocked(false);
          
          if (battleStatus.reason === 'No parent account linked') {
            setError('No parent account linked. Ask your parent to connect with your invite code!');
          } else if (battleStatus.reason === 'Family battle not enabled by parent') {
            setError('Ask your parent to enable Family Battle in their settings!');
          } else {
            setError(battleStatus.reason || 'Family battle not available');
          }
        }
        
      } catch (error) {
        console.error('❌ Error loading family battle:', error);
        setError('Failed to load family battle data. Please try again.');
        setFamilyBattleUnlocked(false);
      }
    };
    
    loadFamilyBattleStatus();
  }, [user?.uid, studentData, isSunday]);

  // Auto-refresh with proper cleanup and throttling
  useEffect(() => {
    // Clear any existing interval first
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    if (!familyBattleUnlocked || !studentData || isSunday) return;
    
    console.log('⏰ Setting up 30-second auto-refresh for student battle data');
    refreshIntervalRef.current = setInterval(async () => {
      try {
        console.log('🔄 Auto-refreshing student battle data...');
        const battleStatus = await getStudentFamilyBattleStatus(studentData);
        
        if (battleStatus.enabled && battleStatus.battleData) {
          setFamilyBattleData({
            weekNumber: battleStatus.battleData.weekNumber,
            childrenMinutes: battleStatus.battleData.childrenMinutes,
            parentMinutes: battleStatus.battleData.parentMinutes,
            winner: battleStatus.battleData.winner,
            margin: battleStatus.battleData.margin,
            battleStatus: battleStatus.battleData.battleStatus,
            isResultsDay: battleStatus.battleData.isResultsDay,
            totalMinutes: battleStatus.battleData.totalMinutes,
            studentBreakdown: battleStatus.battleData.studentBreakdown,
            parentBreakdown: battleStatus.battleData.parentBreakdown
          });
          
          // Get contribution from breakdown
          let contribution = 0;
          if (battleStatus.battleData?.studentBreakdown) {
            for (const [id, data] of Object.entries(battleStatus.battleData.studentBreakdown)) {
              if (data.name === studentData.firstName) {
                contribution = data.minutes || 0;
                break;
              }
            }
          }
          setStudentContribution(contribution);
        }
      } catch (error) {
        console.error('❌ Error refreshing battle data:', error);
      }
    }, 30000); // 30 seconds
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [familyBattleUnlocked, studentData, isSunday]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      loadData();
    } else if (!loading && !isAuthenticated) {
      router.push('/role-selector');
    }
  }, [loading, isAuthenticated, user, loadData]);

  // Close nav menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false);
      }
      if (showStatsDropdown && !event.target.closest('.stats-dropdown-container')) {
        setShowStatsDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowNavMenu(false);
        setShowStatsDropdown(false);
      }
    };

    if (showNavMenu || showStatsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu, showStatsDropdown]);

  // Phase-specific messaging for Family Battle
  const getPhaseSpecificMessage = () => {
    switch (phaseData.currentPhase) {
      case 'VOTING':
        return "🗳️ The Lux Libris award program has ended for this year, but the battle continues! Keep challenging your parents and flexing those reading muscles! 💪📚";
      case 'RESULTS':
        return "🏆 Congratulations on an amazing reading year! Keep the family battle alive and show your parents who the real reading champions are! 📚⚔️";
      case 'TEACHER_SELECTION':
        return "📊 Your family battle stats will continue while we prepare next year's amazing books! Keep those reading habits strong and keep dominating the family showdown! 🔥📚";
      default:
        return null;
    }
  };

  // Handle results button click
  const handleResultsClick = () => {
    setShowResultsModal(true);
  };

  if (loading || isLoading || !studentData || !currentTheme) {
    return (
      <div style={{
        backgroundColor: '#FFFCF5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #ADD4EA30',
            borderTop: '3px solid #ADD4EA',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#223848', fontSize: '14px' }}>Loading battle arena...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Family Battle - Lux Libris</title>
        <meta name="description" content="Challenge your parents in epic reading battles" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        backgroundColor: currentTheme.background,
        paddingBottom: '100px'
      }}>
        
        {/* Success message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: '600',
            animation: 'slideInDown 0.3s ease-out'
          }}>
            {showSuccess}
          </div>
        )}
        
        {/* Sunday Results Button - ONLY on Sunday when there are results */}
        {isSunday && familyBattleData && familyBattleData.winner && familyBattleData.winner !== 'ongoing' && (
          <SundayResultsButton
            onClick={handleResultsClick}
            winner={familyBattleData.winner}
            margin={familyBattleData.margin}
            weekNumber={familyBattleData.weekNumber}
          />
        )}
        
        {/* HEADER */}
        <div style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}F0, ${currentTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: (isSunday && familyBattleData) ? '70px' : '30px'
        }}>
          <button
            onClick={() => router.push('/student-stats')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: currentTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ←
          </button>

          {/* STATS DROPDOWN */}
          <div className="stats-dropdown-container" style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setShowStatsDropdown(!showStatsDropdown)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: currentTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                fontSize: '16px',
                fontWeight: '500',
                minHeight: '40px',
                margin: '0 auto',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: '18px' }}>🥊</span>
              <span style={{ fontFamily: 'Didot, "Times New Roman", serif' }}>Family Battle</span>
              <span style={{ fontSize: '12px', transform: showStatsDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>

            {showStatsDropdown && (
              <div style={{
                position: 'absolute',
                top: '50px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: currentTheme.surface,
                borderRadius: '16px',
                minWidth: '280px',
                maxWidth: '320px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${currentTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: `${currentTheme.primary}20`,
                  borderBottom: `1px solid ${currentTheme.primary}40`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    textAlign: 'center'
                  }}>
                    📊 Stats Explorer
                  </div>
                </div>
                
                {statsNavOptions.map((option, index) => (
                  <button
                    key={option.name}
                    onClick={() => handleStatsNavigation(option)}
                    disabled={option.disabled}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: option.current ? `${currentTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < statsNavOptions.length - 1 ? `1px solid ${currentTheme.primary}40` : 'none',
                      cursor: option.disabled ? 'not-allowed' : option.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '13px',
                      color: option.disabled ? currentTheme.textSecondary : currentTheme.textPrimary,
                      fontWeight: option.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      opacity: option.disabled ? 0.6 : 1,
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!option.disabled && !option.current) {
                        e.target.style.backgroundColor = `${currentTheme.primary}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!option.disabled && !option.current) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{option.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '2px'
                      }}>
                        {option.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: option.phaseNote ? '#FF9800' : currentTheme.textSecondary,
                        opacity: 0.8
                      }}>
                        {option.phaseNote || option.description}
                      </div>
                    </div>
                    {option.current && (
                      <span style={{ fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                    {option.disabled && (
                      <span style={{
                        fontSize: '9px',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}>
                        SOON
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* HAMBURGER MENU */}
          <div className="nav-menu-container" style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                color: currentTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ☰
            </button>

            {showNavMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: currentTheme.surface,
                borderRadius: '12px',
                minWidth: '180px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${currentTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setShowNavMenu(false);
                      if (item.locked) {
                        alert(`🔒 ${item.lockReason}`);
                        return;
                      }
                      if (!item.current) {
                        router.push(item.path);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${currentTheme.primary}30` : 
                                      item.locked ? `${currentTheme.textSecondary}10` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${currentTheme.primary}40` : 'none',
                      cursor: item.locked ? 'not-allowed' : (item.current ? 'default' : 'pointer'),
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: item.locked ? currentTheme.textSecondary : currentTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      opacity: item.locked ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current && !item.locked) {
                        e.target.style.backgroundColor = `${currentTheme.primary}20`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current && !item.locked) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                    title={item.locked ? item.lockReason : undefined}
                  >
                    <span style={{ 
                      fontSize: '16px',
                      filter: item.locked ? 'grayscale(1)' : 'none'
                    }}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.primary }}>●</span>
                    )}
                    {item.locked && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: currentTheme.textSecondary }}>🔒</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        {phaseData.currentPhase === 'TEACHER_SELECTION' ? (
          <div style={{ padding: 'clamp(40px, 10vw, 60px) clamp(20px, 5vw, 40px)', textAlign: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              padding: '40px 24px',
              borderRadius: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚧</div>
              <div style={{
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '12px',
                fontFamily: 'Didot, "Times New Roman", serif'
              }}>
                New Program Starting Soon!
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '400',
                lineHeight: '1.5',
                opacity: 0.95
              }}>
                📊 Your family battle stats will continue while we prepare next year&apos;s amazing books! Keep those reading habits strong and keep dominating the family showdown! 🔥📚
              </div>
              <div style={{
                marginTop: '24px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => router.push('/student-healthy-habits')}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                  }}
                >
                  ○ Healthy Habits
                </button>
                <button
                  onClick={() => router.push('/student-saints')}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.3)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                  }}
                >
                  ♔ Saints
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Phase-specific alert */}
            {getPhaseSpecificMessage() && (
              <div style={{
                background: phaseData.currentPhase === 'VOTING' ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : 
                           phaseData.currentPhase === 'RESULTS' ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 
                           'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                padding: '12px 16px',
                margin: '0 16px 16px 16px',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '14px',
                animation: 'slideInDown 0.6s ease-out'
              }}>
                {getPhaseSpecificMessage()}
              </div>
            )}

            {/* Main Content */}
            <div className="family-battle-content" style={{ 
              padding: 'clamp(16px, 5vw, 32px)', 
              maxWidth: '800px',
              margin: '0 auto',
              paddingBottom: '120px',
              overflow: 'visible' // Ensure crown is visible
            }}>
              
              {error && !familyBattleUnlocked ? (
                /* Error State - Battle Arena Closed */
                <div style={{
                  backgroundColor: currentTheme.surface,
                  borderRadius: '20px',
                  padding: '40px 20px',
                  marginTop: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>😞</div>
                  <h2 style={{ 
                    color: currentTheme.textPrimary, 
                    marginBottom: '16px',
                    fontSize: 'clamp(20px, 5vw, 24px)',
                    fontFamily: 'Didot, "Times New Roman", serif'
                  }}>
                    Battle Arena Closed!
                  </h2>
                  <p style={{ 
                    color: currentTheme.textSecondary, 
                    marginBottom: '24px',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    lineHeight: '1.5'
                  }}>
                    {error}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      backgroundColor: currentTheme.primary,
                      color: currentTheme.textPrimary,
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: 'clamp(14px, 4vw, 16px)',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🔄 Try Again
                  </button>
                </div>
              ) : familyBattleUnlocked && familyBattleData ? (
                <>
                  {/* Battle Arena */}
                  <BattleArena 
                    battleData={familyBattleData}
                    currentTheme={currentTheme}
                    studentData={studentData}
                  />

                  {/* Start Reading Button */}
                  <div className="motivational-section" style={{
                    backgroundColor: currentTheme.surface,
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: `2px solid ${currentTheme.accent}60`
                  }}>
                    {isSunday ? (
                      <>
                        <h3 style={{
                          fontSize: 'clamp(16px, 4.5vw, 18px)',
                          fontWeight: '600',
                          color: currentTheme.textPrimary,
                          marginBottom: '8px'
                        }}>
                          🙏 Sunday Day of Rest 🙏
                        </h3>
                        <p style={{
                          fontSize: 'clamp(12px, 3.5vw, 14px)',
                          color: currentTheme.textSecondary,
                          marginBottom: '16px',
                          lineHeight: '1.5'
                        }}>
                          Reflect on this week&apos;s reading journey and celebrate your accomplishments. 
                          The battle resumes tomorrow with renewed spirit!
                        </p>
                        <button
                          onClick={() => router.push('/student-saints')}
                          style={{
                            backgroundColor: currentTheme.accent,
                            color: currentTheme.textPrimary,
                            border: 'none',
                            borderRadius: '16px',
                            padding: '16px 24px',
                            fontSize: 'clamp(14px, 4vw, 16px)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            margin: '0 auto'
                          }}
                        >
                          ♔ Visit Saints for Inspiration
                        </button>
                      </>
                    ) : (
                      <>
                        <h3 style={{
                          fontSize: 'clamp(16px, 4.5vw, 18px)',
                          fontWeight: '600',
                          color: currentTheme.textPrimary,
                          marginBottom: '8px'
                        }}>
                          Time to Read & Conquer!
                        </h3>
                        <p style={{
                          fontSize: 'clamp(12px, 3.5vw, 14px)',
                          color: currentTheme.textSecondary,
                          marginBottom: '16px'
                        }}>
                          Every minute helps your team dominate the family battle!
                        </p>
                        <button
                          onClick={() => router.push('/student-healthy-habits')}
                          style={{
                            backgroundColor: currentTheme.accent,
                            color: currentTheme.textPrimary,
                            border: 'none',
                            borderRadius: '16px',
                            padding: '16px 24px',
                            fontSize: 'clamp(14px, 4vw, 16px)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            margin: '0 auto'
                          }}
                        >
                          🤼 Enter the Reading Ring
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* Family Battle Locked */
                <div className="battle-locked-section" style={{
                  backgroundColor: currentTheme.surface,
                  borderRadius: '20px',
                  padding: '40px 20px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚔️</div>
                  
                  <div style={{
                    fontSize: 'clamp(18px, 5vw, 20px)',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '12px',
                    fontFamily: 'Didot, "Times New Roman", serif'
                  }}>
                    Battle Arena Awaits!
                  </div>
                  
                  <div style={{
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    color: currentTheme.textSecondary,
                    marginBottom: '24px',
                    lineHeight: '1.5'
                  }}>
                    Ask your parent to enable Family Battle, then you can challenge them in epic reading showdowns!
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Stone Cold Jane Austen Helper */}
        {phaseData.currentPhase !== 'TEACHER_SELECTION' && (
          <StoneColdjaneAustenHelper
            show={showJaneAusten && familyBattleUnlocked}
            battleState={familyBattleData?.winner === 'children' ? 'victory' : 'encouraging'}
            winner={familyBattleData?.winner}
            onClose={() => setShowJaneAusten(false)}
            currentTheme={currentTheme}
            familyBattleData={familyBattleData}
          />
        )}

        {/* Results Modal */}
        <FamilyBattleResultsModal
          show={showResultsModal && familyBattleUnlocked}
          onClose={() => {
            setShowResultsModal(false);
            if (familyBattleData?.weekNumber) {
              const localStorageKey = `familyBattleResultsShown_student_${user?.uid}_week_${familyBattleData.weekNumber}`;
              localStorage.setItem(localStorageKey, 'true');
            }
          }}
          battleData={familyBattleData}
          isStudent={true}
          theme={currentTheme}
        />

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes slideInUp {
            from { 
              opacity: 0; 
              transform: translateY(30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes slideInDown {
            from { 
              opacity: 0; 
              transform: translateY(-30px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
            40% { transform: translateX(-50%) translateY(-10px); }
            60% { transform: translateX(-50%) translateY(-5px); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          
          @keyframes crownFloat {
            0%, 100% { 
              transform: translateY(0) rotate(-5deg) scale(1); 
            }
            25% { 
              transform: translateY(-6px) rotate(0deg) scale(1.05); 
            }
            50% { 
              transform: translateY(0) rotate(5deg) scale(1.1); 
            }
            75% { 
              transform: translateY(-3px) rotate(0deg) scale(1.05); 
            }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            touch-action: manipulation;
          }

          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        `}</style>
      </div>
    </>
  );
}