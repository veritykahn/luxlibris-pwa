// components/ParentFamilyBattleManager.js - FIXED VERSION

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePremiumFeatures } from '../hooks/usePremiumFeatures';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Import new sync system
import { 
  syncFamilyBattleData,
  forceBattleDataRefresh,
  getJaneAustenModeByDay
} from '../lib/family-battle-sync';

// Import simplified battle system
import { 
  initializeFamilyBattle,
  getJaneAustenQuote,
  enableFamilyBattleForStudents,
  resetWeeklyBattle
} from '../lib/family-battle-system';

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
    
    // Default fallback (shouldn't happen)
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
      // Show for 15 seconds on Sunday (longer for reflection), 12 seconds other days
      const duration = new Date().getDay() === 0 ? 15000 : 12000;
      const timer = setTimeout(() => setIsVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, isVisible]);

  useEffect(() => {
    if (show) {
      // Reappear every 45 seconds
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
        ? `linear-gradient(135deg, #E6E6FA, #F0E6FF, #FFFFFF)` // Softer purple gradient for prayerful
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
            // For Bible verses, no extra quotes needed as they're in the string
            <span>{currentQuote}</span>
          ) : (
            // For regular quotes, wrap in quotes
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

// Battle Status Card
function BattleStatusCard({ currentBattle, theme }) {
  if (!currentBattle) return null;

  const childrenAhead = currentBattle.childrenMinutes > currentBattle.parentMinutes;
  const parentAhead = currentBattle.parentMinutes > currentBattle.childrenMinutes;
  const isTie = currentBattle.childrenMinutes === currentBattle.parentMinutes;
  const dayOfWeek = new Date().getDay();
  const isSunday = dayOfWeek === 0;

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      border: `2px solid ${theme.primary}40`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: theme.textPrimary,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚔️ Week {currentBattle.weekNumber} Battle
        </h3>
        {isSunday && (
          <span style={{
            backgroundColor: '#FFD700',
            color: '#000',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            RESULTS DAY!
          </span>
        )}
      </div>
      
      {/* Battle Arena */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Parents Team */}
        <div style={{
          backgroundColor: parentAhead ? '#FF6B6B20' : `${theme.primary}10`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          border: parentAhead ? '2px solid #FF6B6B' : '1px solid #E5E7EB',
          position: 'relative'
        }}>
          {parentAhead && currentBattle.margin > 0 && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '20px',
              animation: 'bounce 2s infinite'
            }}>
              {isSunday ? '👑' : '🔥'}
            </div>
          )}
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>👨‍👩</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#FF6B6B'
          }}>
            {currentBattle.parentMinutes}
          </div>
          <div style={{
            fontSize: '11px',
            color: theme.textSecondary
          }}>
            Your Minutes
          </div>
        </div>
        
        {/* Children Team */}
        <div style={{
          backgroundColor: childrenAhead ? '#4ECDC420' : `${theme.primary}10`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          border: childrenAhead ? '2px solid #4ECDC4' : '1px solid #E5E7EB',
          position: 'relative'
        }}>
          {childrenAhead && currentBattle.margin > 0 && (
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '20px',
              animation: 'bounce 2s infinite'
            }}>
              {isSunday ? '👑' : '🔥'}
            </div>
          )}
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>👧👦</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#4ECDC4'
          }}>
            {currentBattle.childrenMinutes}
          </div>
          <div style={{
            fontSize: '11px',
            color: theme.textSecondary
          }}>
            Kids Minutes
          </div>
        </div>
      </div>
      
      {/* Battle Status Message */}
      <div style={{
        backgroundColor: isSunday ? '#FFD70020' : `${theme.accent}20`,
        borderRadius: '8px',
        padding: '12px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: theme.textPrimary
        }}>
          {currentBattle.battleStatus}
        </div>
      </div>
    </div>
  );
}

// Championship History Card
function ChampionshipCard({ familyStats, theme, setShowVictoryModal }) {
  if (!familyStats) return null;

  // Calculate parent victories from total battles and win rate
  const parentVictories = [];
  if (familyStats.totalBattles > 0 && familyStats.winRates?.parents > 0) {
    const parentWins = Math.round(familyStats.totalBattles * (familyStats.winRates.parents / 100));
    // Create array with parent wins count for the button badge
    for (let i = 0; i < parentWins; i++) {
      parentVictories.push(i);
    }
  }

  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      border: `1px solid ${theme.primary}40`
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
        🏆 Family Championship History
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
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#FF6B6B'
          }}>
            {familyStats.winRates?.parents || 0}%
          </div>
          <div style={{
            fontSize: '10px',
            color: theme.textSecondary
          }}>
            Your Win Rate
          </div>
        </div>
        <div style={{
          backgroundColor: `${theme.primary}20`,
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: theme.textPrimary
          }}>
            {familyStats.totalBattles || 0}
          </div>
          <div style={{
            fontSize: '10px',
            color: theme.textSecondary
          }}>
            Total Battles
          </div>
        </div>
        <div style={{
          backgroundColor: `${theme.primary}20`,
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#4ECDC4'
          }}>
            {familyStats.winRates?.children || 0}%
          </div>
          <div style={{
            fontSize: '10px',
            color: theme.textSecondary
          }}>
            Kids Win Rate
          </div>
        </div>
      </div>

      {/* Current Streak */}
      {familyStats.currentStreak?.team && (
        <div style={{
          backgroundColor: `${theme.secondary}20`,
          borderRadius: '8px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: theme.textPrimary
          }}>
            👑 {familyStats.currentStreak.team === 'children' ? 'Kids' : 'Parents'} on {familyStats.currentStreak.weeks}-Week Winning Streak!
          </div>
        </div>
      )}
      
      {/* Victory Archive Button */}
      {familyStats.winRates?.parents > 0 && (
        <button
          onClick={() => setShowVictoryModal(true)}
          style={{
            backgroundColor: '#FFD700',
            color: '#000',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '16px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          🏆 View Your Victory Archive
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
            {parentVictories.length}
          </span>
        </button>
      )}
    </div>
  );
}

// Helper function to load linked students data
const loadLinkedStudentsData = async (linkedStudentIds) => {
  try {
    const students = [];
    const entitiesSnapshot = await getDocs(collection(db, 'entities'));
    
    for (const entityDoc of entitiesSnapshot.docs) {
      const entityId = entityDoc.id;
      const schoolsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools`));
      
      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;
        const schoolData = schoolDoc.data();
        const studentsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools/${schoolId}/students`));
        
        for (const studentDoc of studentsSnapshot.docs) {
          if (linkedStudentIds.includes(studentDoc.id)) {
            const studentData = {
              id: studentDoc.id,
              entityId,
              schoolId,
              schoolName: schoolData.name,
              ...studentDoc.data()
            };
            students.push(studentData);
          }
        }
      }
    }
    
    console.log('✅ Linked students loaded:', students.length);
    return students;
    
  } catch (error) {
    console.error('❌ Error loading linked students:', error);
    return [];
  }
};

// Main Parent Family Battle Manager Component
export default function ParentFamilyBattleManager({ theme, parentData, linkedStudents, onUpdate, battleData, isSunday }) {
  const { user } = useAuth();
  const { hasFeature, isPilotPhase } = usePremiumFeatures();
  
  const [familyBattleEnabled, setFamilyBattleEnabled] = useState(false);
  const [familyStats, setFamilyStats] = useState(null);
  const [currentBattle, setCurrentBattle] = useState(null);
  const [invitedStudents, setInvitedStudents] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');
  const [showJaneAusten, setShowJaneAusten] = useState(true);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  
  // Track last refresh time to prevent rapid refreshes
  const lastRefreshTime = useRef(0);
  const refreshIntervalRef = useRef(null);

  const familyId = parentData?.familyId;

  // Use passed battle data on Sunday instead of loading fresh
  useEffect(() => {
    if (isSunday && battleData) {
      console.log('📊 Using passed Sunday battle data:', battleData);
      setCurrentBattle(battleData);
    }
  }, [isSunday, battleData]);

  // Load family battle data using sync system - WITH THROTTLING
  const loadFamilyBattleData = useCallback(async () => {
    // Don't load fresh data on Sunday if we have passed data
    if (isSunday && battleData) {
      console.log('📊 Skipping fresh load on Sunday, using passed data');
      setCurrentBattle(battleData);
      return;
    }
    
    if (!user?.uid || !familyId) return;
    
    // Throttle refreshes - minimum 10 seconds between loads
    const now = Date.now();
    if (now - lastRefreshTime.current < 10000) {
      console.log('🚫 Throttling battle data load - too soon');
      return;
    }
    
    lastRefreshTime.current = now;
    
    try {
      setIsLoading(true);
      
      // Get linked students if not available
      let studentsToUse = linkedStudents;
      if (!studentsToUse || studentsToUse.length === 0) {
        const parentRef = doc(db, 'parents', user.uid);
        const parentDoc = await getDoc(parentRef);
        
        if (parentDoc.exists()) {
          const parentData = parentDoc.data();
          studentsToUse = await loadLinkedStudentsData(parentData.linkedStudents || []);
        }
      }
      
      // Use sync system to get battle data
      const battleData = await syncFamilyBattleData(familyId, studentsToUse || []);
      setCurrentBattle(battleData);
      
      // Pass battle data up to parent component
      if (onUpdate) {
        onUpdate({ battleData });
      }
      
      // Get family statistics
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        
        // Build family stats
        const history = familyData.championshipHistory || {};
        const stats = {
          totalBattles: history.totalBattles || 0,
          winRates: {
            children: history.totalBattles > 0 ? 
              Math.round((history.childrenWins / history.totalBattles) * 100) : 0,
            parents: history.totalBattles > 0 ? 
              Math.round((history.parentWins / history.totalBattles) * 100) : 0
          },
          currentStreak: history.currentStreak,
          recentResults: (history.recentResults || []).slice(-3)
        };
        setFamilyStats(stats);
      }
      
    } catch (error) {
      console.error('❌ Error loading family battle data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, familyId, linkedStudents, isSunday, battleData, onUpdate]);

  // Check family battle status and auto-invite students
  useEffect(() => {
    const checkFamilyBattleStatus = async () => {
      if (!user?.uid || !familyId) return;
      
      try {
        const familyRef = doc(db, 'families', familyId);
        const familyDoc = await getDoc(familyRef);
        
        if (familyDoc.exists()) {
          const familyData = familyDoc.data();
          
          if (familyData.familyBattleSettings?.enabled) {
            setFamilyBattleEnabled(true);
            
            // Track invited students
            const alreadyInvited = new Set();
            if (familyData.invitedStudents) {
              familyData.invitedStudents.forEach(studentId => alreadyInvited.add(studentId));
            }
            setInvitedStudents(alreadyInvited);
            
            // Auto-invite new children
            if (linkedStudents && linkedStudents.length > 0) {
              const newStudents = linkedStudents.filter(student => !alreadyInvited.has(student.id));
              
              if (newStudents.length > 0) {
                console.log('🚀 Auto-inviting new children to family battle:', newStudents.length);
                await enableFamilyBattleForStudents(familyId, newStudents);
                
                const updatedInvited = new Set(alreadyInvited);
                newStudents.forEach(student => updatedInvited.add(student.id));
                setInvitedStudents(updatedInvited);
                
                await updateDoc(familyRef, {
                  invitedStudents: Array.from(updatedInvited)
                });
                
                setShowSuccess(`🚀 ${newStudents.length} new child${newStudents.length !== 1 ? 'ren' : ''} automatically invited to the battle! ⚔️`);
                setTimeout(() => setShowSuccess(''), 4000);
              }
            }
            
            await loadFamilyBattleData();
          } else {
            setFamilyBattleEnabled(false);
          }
        } else {
          setFamilyBattleEnabled(false);
        }
      } catch (error) {
        console.error('❌ Error checking family battle status:', error);
        setFamilyBattleEnabled(false);
      }
    };
    
    if (user?.uid && familyId && linkedStudents) {
      checkFamilyBattleStatus();
    }
  }, [user?.uid, familyId, linkedStudents?.length]); // FIXED: Only depend on length, not full array

  // FIXED: Auto-refresh battle data every 30 seconds with proper cleanup
  useEffect(() => {
    // Clear any existing interval first
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    if (familyBattleEnabled && currentBattle && !isSunday) {
      console.log('⏰ Setting up 30-second auto-refresh');
      refreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing battle data...');
        loadFamilyBattleData();
      }, 30000); // 30 seconds
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [familyBattleEnabled, isSunday]); // FIXED: Removed currentBattle dependency to prevent loops

  // Initialize family battle
  const handleInitializeBattle = async () => {
    if (!hasFeature('familyBattle')) {
      alert('Family Battle requires premium features!');
      return;
    }
    
    if (!familyId) {
      alert('No family ID found. Please ensure your family is set up correctly.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await initializeFamilyBattle(familyId, { ...parentData, uid: user.uid });
      
      // Enable for all linked students
      if (linkedStudents && linkedStudents.length > 0) {
        await enableFamilyBattleForStudents(familyId, linkedStudents);
        
        const invitedIds = new Set(linkedStudents.map(student => student.id));
        setInvitedStudents(invitedIds);
        
        const familyRef = doc(db, 'families', familyId);
        await updateDoc(familyRef, {
          invitedStudents: Array.from(invitedIds)
        });
      }
      
      setFamilyBattleEnabled(true);
      setShowSuccess('🏆 Family Battle arena opened! Let the games begin! ⚔️');
      setTimeout(() => setShowSuccess(''), 4000);
      
      await loadFamilyBattleData();
      
      if (onUpdate) onUpdate();
      
    } catch (error) {
      console.error('Error initializing family battle:', error);
      alert('Error setting up Family Battle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasUninvitedStudents = linkedStudents && linkedStudents.some(student => !invitedStudents.has(student.id));

  // Extract battle state and winner from currentBattle for Jane Austen component
  const battleState = currentBattle?.childrenMinutes > currentBattle?.parentMinutes ? 'childrenLead' : 
                      currentBattle?.parentMinutes > currentBattle?.childrenMinutes ? 'parentsLead' : 'tie';
  const winner = currentBattle?.winner || null;

  if (!hasFeature('familyBattle')) {
    return (
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        border: `2px solid ${theme.primary}60`
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '8px'
        }}>
          Premium Feature: Family Battle Arena
        </h3>
        <p style={{
          fontSize: '14px',
          color: theme.textSecondary,
          marginBottom: '16px'
        }}>
          {isPilotPhase ? 
            "WWE-style family reading battles unlocked for pilot users! Time to challenge your kids!" :
            "Upgrade to Premium to unlock epic family reading competitions with Stone Cold Jane Austen commentary!"
          }
        </p>
        
        {isPilotPhase && (
          <button
            onClick={handleInitializeBattle}
            disabled={isLoading || !familyId}
            style={{
              backgroundColor: theme.primary,
              color: theme.textPrimary,
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading || !familyId ? 'not-allowed' : 'pointer',
              opacity: isLoading || !familyId ? 0.7 : 1
            }}
          >
            {isLoading ? '⏳ Opening Arena...' : '⚔️ Open Battle Arena'}
          </button>
        )}
      </div>
    );
  }

  if (!familyBattleEnabled) {
    return (
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚔️</div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '8px'
        }}>
          Ready for Reading Battle Royale?
        </h3>
        <p style={{
          fontSize: '14px',
          color: theme.textSecondary,
          marginBottom: '16px'
        }}>
          Challenge your children to epic weekly reading battles! Complete with Stone Cold Jane Austen commentary and WWE-style showdowns!
        </p>
        
        <button
          onClick={handleInitializeBattle}
          disabled={isLoading || !familyId}
          style={{
            backgroundColor: theme.primary,
            color: theme.textPrimary,
            border: 'none',
            borderRadius: '12px',
            padding: '14px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isLoading || !familyId ? 'not-allowed' : 'pointer',
            opacity: isLoading || !familyId ? 0.7 : 1
          }}
        >
          {isLoading ? '⏳ Opening Arena...' : '🚀 Start Family Battle!'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Success Message */}
      {showSuccess && (
        <div style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {showSuccess}
        </div>
      )}

      {/* Current Battle Status */}
      <BattleStatusCard 
        currentBattle={currentBattle}
        theme={theme}
      />

      {/* Championship History */}
      <ChampionshipCard
        familyStats={familyStats}
        theme={theme}
        setShowVictoryModal={setShowVictoryModal}
      />

      {/* Battle Management */}
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '16px',
        padding: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '16px'
        }}>
          ⚙️ Battle Arena Management
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasUninvitedStudents ? '1fr 1fr' : '1fr',
          gap: '12px'
        }}>
          {hasUninvitedStudents && (
            <button
              onClick={async () => {
                const uninvited = linkedStudents.filter(student => !invitedStudents.has(student.id));
                if (uninvited.length > 0) {
                  setIsLoading(true);
                  try {
                    await enableFamilyBattleForStudents(familyId, uninvited);
                    
                    const updatedInvited = new Set(invitedStudents);
                    uninvited.forEach(student => updatedInvited.add(student.id));
                    setInvitedStudents(updatedInvited);
                    
                    const familyRef = doc(db, 'families', familyId);
                    await updateDoc(familyRef, {
                      invitedStudents: Array.from(updatedInvited)
                    });
                    
                    setShowSuccess(`🚀 ${uninvited.length} more child${uninvited.length !== 1 ? 'ren' : ''} invited to the battle! ⚔️`);
                    setTimeout(() => setShowSuccess(''), 4000);
                  } catch (error) {
                    console.error('Error inviting students:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              disabled={isLoading}
              style={{
                backgroundColor: theme.primary,
                color: theme.textPrimary,
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              🚀 Invite New Kids
            </button>
          )}
          
          <button
            onClick={loadFamilyBattleData}
            disabled={isLoading}
            style={{
              backgroundColor: theme.secondary,
              color: theme.textPrimary,
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            🔄 Refresh Arena
          </button>
        </div>

        {/* Status of invited children */}
        {linkedStudents && linkedStudents.length > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: `${theme.primary}10`,
            borderRadius: '8px',
            fontSize: '11px',
            color: theme.textSecondary
          }}>
            📊 Battle Status: {invitedStudents.size} of {linkedStudents.length} children invited
            {invitedStudents.size === linkedStudents.length && ' ✅ All children in the battle!'}
          </div>
        )}
      </div>

      {/* Stone Cold Jane Austen Helper */}
      <StoneColdjaneAustenHelper
        show={showJaneAusten && familyBattleEnabled}
        battleState={battleState}
        winner={winner}
        onClose={() => setShowJaneAusten(false)}
        currentTheme={theme}
        familyBattleData={currentBattle}
      />

      <style jsx>{`
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
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }
      `}</style>
    </div>
  );
}