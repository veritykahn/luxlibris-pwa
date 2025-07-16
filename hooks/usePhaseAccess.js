// hooks/usePhaseAccess.js - Phase-aware locking system for student pages
import { useState, useEffect } from 'react';
import { dbHelpers } from '../lib/firebase';

export const usePhaseAccess = () => {
  const [phaseData, setPhaseData] = useState({
    currentPhase: 'ACTIVE',
    academicYear: '2025-26',
    loading: true
  });

  // Phase permission configurations
  const phasePermissions = {
    SETUP: {
      // During setup, students are completely locked out
      bookSelection: false,
      bookSubmission: false,
      nomineesBrowsing: false,
      bookshelfEditing: false,
      votingInterface: false,
      
      // Year-round features stay available
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: true,
      
      // Advanced features locked
      advancedStats: false,
      achievements: false,
      
      message: "📝 System is being set up for the new academic year. Enjoy exploring your saints and healthy habits!"
    },
    
    TEACHER_SELECTION: {
      // During teacher selection, students wait
      bookSelection: false,
      bookSubmission: false,
      nomineesBrowsing: false,
      bookshelfEditing: false,
      votingInterface: false,
      
      // Year-round features available
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: true,
      
      // Advanced features locked
      advancedStats: false,
      achievements: false,
      
      message: "👩‍🏫 Teachers are selecting amazing books for you! Check back soon to start reading!"
    },
    
    ACTIVE: {
      // Full access during active reading period
      bookSelection: true,
      bookSubmission: true,
      nomineesBrowsing: true,
      bookshelfEditing: true,
      votingInterface: false,
      
      // All features available
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
      // Selective locking during voting
      bookSelection: false,     // Can't add new books
      bookSubmission: false,    // Can't submit completions
      nomineesBrowsing: false,  // Can't browse for new books
      bookshelfEditing: false,  // Can't edit bookshelf
      votingInterface: true,    // Voting is active!
      
      // Year-round features stay open
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: true,        // Can view book details
      
      // Program-specific features locked
      advancedStats: false,     // No new program stats
      achievements: false,      // No new achievement earning
      
      message: "🗳️ Voting time! Choose your favorite books you've read this year!"
    },
    
    RESULTS: {
      // Similar to voting but no voting interface
      bookSelection: false,
      bookSubmission: false,
      nomineesBrowsing: false,
      bookshelfEditing: false,
      votingInterface: false,
      votingResults: true,        // NEW: Show results to students
      
      // Year-round features available
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: true,
      
      // Program features locked
      advancedStats: false,
      achievements: false,
      
      message: "🏆 Results are in! Check out this year's winners while we prepare for next year!"
    },
    
    CLOSED: {
      // Between academic years
      bookSelection: false,
      bookSubmission: false,
      nomineesBrowsing: false,
      bookshelfEditing: false,
      votingInterface: false,
      
      // Only year-round features
      saintsPages: true,
      healthyHabits: true,
      readingTimer: true,
      basicStats: true,
      bookDetails: false,
      
      // Everything else locked
      advancedStats: false,
      achievements: false,
      
      message: "❄️ Taking a break between school years. Keep up your reading habits!"
    }
  };

  // Load current phase data
  useEffect(() => {
    const loadPhaseData = async () => {
      try {
        const config = await dbHelpers.getSystemConfig();
        const currentYear = dbHelpers.getCurrentAcademicYear();
        
        setPhaseData({
          currentPhase: config.programPhase || 'ACTIVE',
          academicYear: currentYear,
          loading: false,
          config: config
        });
        
        console.log('✅ Phase data loaded:', {
          phase: config.programPhase,
          year: currentYear
        });
        
      } catch (error) {
        console.error('❌ Error loading phase data:', error);
        setPhaseData(prev => ({ 
          ...prev, 
          loading: false,
          currentPhase: 'ACTIVE' // Failsafe
        }));
      }
    };
    
    loadPhaseData();
    
    // Check for phase updates every 5 minutes
    const interval = setInterval(loadPhaseData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  return {
    phaseData,
    permissions: getPermissions(),
    hasAccess,
    getPhaseMessage,
    getPhaseInfo,
    isLoading: phaseData.loading
  };
};

// HOC for wrapping components with phase protection
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