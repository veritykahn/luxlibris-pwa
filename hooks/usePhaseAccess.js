// hooks/usePhaseAccess.js - UPDATED with proper system config fallback
import { useState, useEffect } from 'react';
import { dbHelpers } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const usePhaseAccess = (userProfile = null) => {
  const [phaseData, setPhaseData] = useState({
    currentPhase: 'ACTIVE',
    academicYear: '2025-26',
    loading: true
  });

  // Phase permission configurations (same as before)
  const phasePermissions = {
    SETUP: {
      bookSelection: false,
      bookSubmission: false,
      nomineesBrowsing: false,
      bookshelfEditing: false,
      bookshelfViewing: false,
      votingInterface: false,
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: true,
      advancedStats: false,
      achievements: false,
      message: "📝 System is being set up for the new academic year. Enjoy exploring your saints and healthy habits!"
    },
    
    TEACHER_SELECTION: {
      bookSelection: false,
      bookSubmission: false,
      nomineesBrowsing: false,
      bookshelfEditing: false,
      bookshelfViewing: false,
      votingInterface: false,
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: true,
      advancedStats: false,
      achievements: false,
      message: "👩‍🏫 Teachers are selecting amazing books for you! Check back soon to start reading!"
    },
    
    ACTIVE: {
      bookSelection: true,
      bookSubmission: true,
      nomineesBrowsing: true,
      bookshelfEditing: true,
      bookshelfViewing: true,
      votingInterface: false,
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: true,
      advancedStats: true,
      achievements: true,
      message: "📚 Happy reading! Explore books, earn achievements, and unlock saints!"
    },
    
    VOTING: {
      bookSelection: false,
      bookSubmission: false,
      nomineesBrowsing: false,
      bookshelfEditing: false,
      bookshelfViewing: true,
      votingInterface: true,
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: true,
      advancedStats: false,
      achievements: false,
      message: "🗳️ Voting time! Choose your favorite books you've read this year!"
    },
    
    RESULTS: {
      bookSelection: false,
      bookSubmission: false,
      nomineesBrowsing: false,
      bookshelfEditing: false,
      bookshelfViewing: false,
      votingInterface: false,
      votingResults: true,
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: false,
      advancedStats: false,
      achievements: false,
      message: "🏆 Carry on with your reading habits and collecting XP and saints while we prepare next year's nominees!"
    },
    
    CLOSED: {
      bookSelection: false,
      bookSubmission: false,
      nomineesBrowsing: false,
      bookshelfEditing: false,
      bookshelfViewing: false,
      votingInterface: false,
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: false,
      advancedStats: false,
      achievements: false,
      message: "❄️ Taking a break between school years. Keep up your reading habits!"
    }
  };

  // Load current phase data with real-time listener
  useEffect(() => {
    let unsubscribe = null;

    const setupPhaseListener = async () => {
      try {
        // ✅ ALWAYS load system config first as fallback
        const systemConfig = await dbHelpers.getSystemConfig();
        const currentYear = dbHelpers.getCurrentAcademicYear();
        
        console.log('🔄 System config loaded:', {
          phase: systemConfig.programPhase,
          year: currentYear
        });

        // If we have user profile, try to listen to school-specific phase
        if (userProfile?.entityId && userProfile?.schoolId) {
          console.log('🔄 Setting up school-specific phase listener...');
          
          const schoolRef = doc(db, `entities/${userProfile.entityId}/schools`, userProfile.schoolId);
          
          unsubscribe = onSnapshot(schoolRef, (doc) => {
            if (doc.exists()) {
              const schoolData = doc.data();
              
              // ✅ FIXED: Check if school has its own phase status, otherwise use system config
              const schoolPhase = schoolData.phaseStatus?.currentPhase;
              const currentPhase = schoolPhase || systemConfig.programPhase || 'ACTIVE';
              
              setPhaseData({
                currentPhase: currentPhase,
                academicYear: currentYear,
                loading: false,
                config: schoolData.phaseStatus || systemConfig,
                source: schoolPhase ? 'school' : 'system'
              });
              
              console.log('✅ Phase updated:', {
                phase: currentPhase,
                source: schoolPhase ? 'school-specific' : 'system-wide',
                year: currentYear
              });
            } else {
              // School doesn't exist, use system config
              setPhaseData({
                currentPhase: systemConfig.programPhase || 'ACTIVE',
                academicYear: currentYear,
                loading: false,
                config: systemConfig,
                source: 'system'
              });
            }
          }, (error) => {
            console.error('❌ Error in school phase listener:', error);
            // Fallback to system config
            setPhaseData({
              currentPhase: systemConfig.programPhase || 'ACTIVE',
              academicYear: currentYear,
              loading: false,
              config: systemConfig,
              source: 'system'
            });
          });
          
        } else {
          // No user profile, use system-wide phase config
          setPhaseData({
            currentPhase: systemConfig.programPhase || 'ACTIVE',
            academicYear: currentYear,
            loading: false,
            config: systemConfig,
            source: 'system'
          });
          
          // Set up polling as backup for system config
          const interval = setInterval(async () => {
            try {
              const updatedConfig = await dbHelpers.getSystemConfig();
              setPhaseData(prev => ({
                ...prev,
                currentPhase: updatedConfig.programPhase || 'ACTIVE',
                config: updatedConfig
              }));
            } catch (error) {
              console.error('❌ Error in phase polling:', error);
            }
          }, 60 * 1000); // Poll every 1 minute
          
          return () => clearInterval(interval);
        }
        
      } catch (error) {
        console.error('❌ Error setting up phase listener:', error);
        setPhaseData(prev => ({ 
          ...prev, 
          loading: false,
          currentPhase: 'ACTIVE' // Failsafe
        }));
      }
    };

    setupPhaseListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userProfile?.entityId, userProfile?.schoolId]);

  // Get permissions for current phase
  const getPermissions = () => {
    if (phaseData.loading) {
      return {
        ...phasePermissions.ACTIVE, // Default while loading
        loading: true
      };
    }
    
    return {
      ...phasePermissions[phaseData.currentPhase] || phasePermissions.ACTIVE,
      loading: false,
      currentPhase: phaseData.currentPhase,
      academicYear: phaseData.academicYear
    };
  };

  // Check if a specific feature is accessible
  const hasAccess = (feature) => {
    const permissions = getPermissions();
    return permissions[feature] === true;
  };

  // Get phase-specific message for users
  const getPhaseMessage = () => {
    const permissions = getPermissions();
    return permissions.message || "Welcome to Lux Libris!";
  };

  // Get phase display info
  const getPhaseInfo = () => {
    const phaseIcons = {
      SETUP: { icon: '📝', name: 'Setup', color: '#f59e0b' },
      TEACHER_SELECTION: { icon: '👩‍🏫', name: 'Teacher Selection', color: '#3b82f6' },
      ACTIVE: { icon: '📚', name: 'Active Reading', color: '#10b981' },
      VOTING: { icon: '🗳️', name: 'Voting Period', color: '#8b5cf6' },
      RESULTS: { icon: '🏆', name: 'Results', color: '#f59e0b' },
      CLOSED: { icon: '❄️', name: 'Closed', color: '#6b7280' }
    };
    
    return phaseIcons[phaseData.currentPhase] || phaseIcons.ACTIVE;
  };

  // Force refresh phase data (useful for manual testing)
  const refreshPhase = async () => {
    console.log('🔄 Force refreshing phase data...');
    setPhaseData(prev => ({ ...prev, loading: true }));
    
    try {
      // ✅ ALWAYS load system config first
      const systemConfig = await dbHelpers.getSystemConfig();
      const currentYear = dbHelpers.getCurrentAcademicYear();
      
      if (userProfile?.entityId && userProfile?.schoolId) {
        // Try to reload school phase
        const schoolRef = doc(db, `entities/${userProfile.entityId}/schools`, userProfile.schoolId);
        const schoolSnap = await getDoc(schoolRef);
        
        if (schoolSnap.exists()) {
          const schoolData = schoolSnap.data();
          
          // Use school phase if available, otherwise system config
          const schoolPhase = schoolData.phaseStatus?.currentPhase;
          const currentPhase = schoolPhase || systemConfig.programPhase || 'ACTIVE';
          
          setPhaseData({
            currentPhase: currentPhase,
            academicYear: currentYear,
            loading: false,
            config: schoolData.phaseStatus || systemConfig,
            source: schoolPhase ? 'school' : 'system'
          });
          
          console.log('✅ Phase refreshed:', {
            phase: currentPhase,
            source: schoolPhase ? 'school-specific' : 'system-wide'
          });
        } else {
          // School doesn't exist, use system config
          setPhaseData({
            currentPhase: systemConfig.programPhase || 'ACTIVE',
            academicYear: currentYear,
            loading: false,
            config: systemConfig,
            source: 'system'
          });
        }
      } else {
        // No user profile, use system config
        setPhaseData({
          currentPhase: systemConfig.programPhase || 'ACTIVE',
          academicYear: currentYear,
          loading: false,
          config: systemConfig,
          source: 'system'
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing phase:', error);
      setPhaseData(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    phaseData,
    permissions: getPermissions(),
    hasAccess,
    getPhaseMessage,
    getPhaseInfo,
    refreshPhase,
    isLoading: phaseData.loading
  };
};

// HOC for wrapping components with phase protection (same as before)
export const withPhaseProtection = (WrappedComponent, requiredFeature, fallbackMessage) => {
  return function PhaseProtectedComponent(props) {
    const { hasAccess, getPhaseMessage, getPhaseInfo } = usePhaseAccess();
    
    if (!hasAccess(requiredFeature)) {
      const phaseInfo = getPhaseInfo();
      
      return (
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center',
          border: '2px solid #e2e8f0',
          margin: '20px'
        }}>
          <div style={{ 
            fontSize: '64px', 
            marginBottom: '16px',
            opacity: 0.7
          }}>
            {phaseInfo.icon}
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            {phaseInfo.name} Mode
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.5',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {fallbackMessage || getPhaseMessage()}
          </p>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

export default usePhaseAccess;