// pages/student-settings.js - Updated with Account Deletion
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { usePhaseAccess } from '../hooks/usePhaseAccess';
import { getStudentDataEntities, updateStudentDataEntities, getSchoolNomineesEntities, dbHelpers } from '../lib/firebase';
import { createParentInviteCode } from '../lib/parentLinking';
import DataExportComponent from '../components/DataExportComponent';
import Head from 'next/head'

// Theme definitions
const themes = {
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
    primary: '#9C88C4',
    secondary: '#B19CD9',
    accent: '#E1D5F7',
    background: '#2A1B3D',
    surface: '#3D2B54',
    textPrimary: '#E1D5F7',
    textSecondary: '#B19CD9'
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
    primary: '#666666',
    secondary: '#000000',
    accent: '#E8E8E8',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    textPrimary: '#B8860B',
    textSecondary: '#AAAAAA'
  }
};

export default function StudentSettings() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { phaseData, hasAccess, getPhaseMessage, getPhaseInfo } = usePhaseAccess();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [selectedThemePreview, setSelectedThemePreview] = useState('');
  const [newGoal, setNewGoal] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');
  const [parentInviteCode, setParentInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [timerDuration, setTimerDuration] = useState(20);
  const [maxNominees, setMaxNominees] = useState(100);

  // Personal Password Management State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Account Deletion State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Navigation Menu State
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationProcessing, setNotificationProcessing] = useState(false);

  // Navigation menu items with phase awareness
  const navMenuItems = useMemo(() => [
    { name: 'Dashboard', path: '/student-dashboard', icon: '⌂' },
    { name: 'Nominees', path: '/student-nominees', icon: '□', access: 'nomineesBrowsing' },
    { name: 'Bookshelf', path: '/student-bookshelf', icon: '⚏', access: 'bookshelfViewing' },
    { name: 'Healthy Habits', path: '/student-healthy-habits', icon: '○' },
    { name: 'Saints', path: '/student-saints', icon: '♔' },
    { name: 'Stats', path: '/student-stats', icon: '△' },
    { name: 'Settings', path: '/student-settings', icon: '⚙', current: true }
  ], []);

  // Password validation function
  const isPasswordValid = useCallback((password) => {
    return password && password.length >= 5 && /^[a-z]+$/.test(password);
  }, []);

  // Notification functions
  const requestNotificationPermission = useCallback(async () => {
    console.log('Starting notification permission request...');
    
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      alert('This browser does not support notifications');
      return false;
    }

    console.log('Current permission:', Notification.permission);

    if (Notification.permission === 'granted') {
      console.log('Permission already granted');
      setNotificationsEnabled(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Permission was denied');
      alert('Notifications were blocked. Please enable them in your browser settings.');
      return false;
    }

    try {
      console.log('Requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      
      const enabled = permission === 'granted';
      setNotificationsEnabled(enabled);
      
      if (enabled) {
        new Notification('🎉 Notifications Enabled!', {
          body: 'You\'ll now get notified when you unlock new saints!',
          icon: '/images/lux_libris_logo.png'
        });
      } else {
        alert('Notifications were not enabled. You can enable them later in your browser settings.');
      }
      
      return enabled;
    } catch (error) {
      console.error('Notification permission error:', error);
      alert('Error requesting notification permission: ' + error.message);
      return false;
    }
  }, []);

  const themesArray = Object.entries(themes).map(([key, value]) => ({
    assetPrefix: key,
    ...value
  }));

  // useEffects
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        console.log('Clicking outside menu, closing...');
        setShowNavMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showNavMenu) {
        setShowNavMenu(false);
      }
    };

    if (showNavMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showNavMenu]);

  const loadStudentData = useCallback(async () => {
    try {
      if (!user?.uid) {
        router.push('/student-account-creation');
        return;
      }

      console.log('🔍 Loading student data for UID:', user.uid);
      
      const realStudentData = await getStudentDataEntities(user.uid);
      if (!realStudentData) {
        console.error('❌ Student data not found');
        router.push('/student-account-creation');
        return;
      }

      console.log('✅ Loaded student data:', realStudentData);
      
      setStudentData(realStudentData);
      setCurrentTheme(themes[realStudentData.selectedTheme] || themes.classic_lux);
      setSelectedThemePreview(realStudentData.selectedTheme || 'classic_lux');
      setNewGoal(realStudentData.personalGoal || 20);
      setParentInviteCode(realStudentData.parentInviteCode || '');
      setTimerDuration(realStudentData.readingSettings?.defaultTimerDuration || 20);
      
      if (realStudentData.entityId && realStudentData.schoolId) {
        try {
          const schoolNominees = await getSchoolNomineesEntities(
            realStudentData.entityId, 
            realStudentData.schoolId
          );
          const availableBooks = Math.min(schoolNominees.length || 100, 100);
          setMaxNominees(availableBooks);
          console.log(`📚 School has ${schoolNominees.length} nominees, reading goal capped at ${availableBooks}`);
        } catch (error) {
          console.warn('⚠️ Could not load nominees for reading goal cap:', error);
          setMaxNominees(100);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading student data:', error);
      router.push('/student-account-creation');
    }
    setIsLoading(false);
  }, [user, router]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Save functions
  const saveThemeChange = async () => {
    if (selectedThemePreview === studentData.selectedTheme) return;
    
    setIsSaving(true);
    try {
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        selectedTheme: selectedThemePreview
      });
      
      const updatedData = { ...studentData, selectedTheme: selectedThemePreview };
      setStudentData(updatedData);
      setCurrentTheme(themes[selectedThemePreview]);
      
      setShowSuccess('✨ Theme saved! Your bookshelf and saints collection look amazing!');
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error saving theme:', error);
      setShowSuccess('❌ Error saving theme. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    setIsSaving(false);
  };

  const saveGoalChange = async () => {
    if (newGoal === studentData.personalGoal) return;
    
    setIsSaving(true);
    try {
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        personalGoal: newGoal
      });
      
      const updatedData = { ...studentData, personalGoal: newGoal };
      setStudentData(updatedData);
      
      setShowSuccess(`🎯 Reading goal updated to ${newGoal} books!`);
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error saving goal:', error);
      setShowSuccess('❌ Error saving goal. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    setIsSaving(false);
  };

  const saveTimerChange = async () => {
    if (timerDuration === (studentData.readingSettings?.defaultTimerDuration || 20)) return;
    
    setIsSaving(true);
    try {
      const updatedReadingSettings = {
        ...studentData.readingSettings,
        defaultTimerDuration: timerDuration
      };
      
      await updateStudentDataEntities(studentData.id, studentData.entityId, studentData.schoolId, {
        readingSettings: updatedReadingSettings
      });
      
      const updatedData = { 
        ...studentData, 
        readingSettings: updatedReadingSettings 
      };
      setStudentData(updatedData);
      
      setShowSuccess(`⏱️ Timer updated to ${timerDuration} minutes!`);
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error saving timer:', error);
      setShowSuccess('❌ Error saving timer. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    setIsSaving(false);
  };

  // Password change functionality
  const handlePasswordChange = async () => {
    setPasswordError('');
    setIsSaving(true);
    
    try {
      if (currentPassword !== studentData.personalPassword) {
        setPasswordError('Current password is incorrect');
        setIsSaving(false);
        return;
      }
      
      if (!isPasswordValid(newPassword)) {
        setPasswordError('New password must be at least 5 lowercase letters');
        setIsSaving(false);
        return;
      }
      
      if (currentPassword === newPassword) {
        setPasswordError('New password must be different from current password');
        setIsSaving(false);
        return;
      }
      
      await dbHelpers.updateStudentPersonalPassword(
        studentData.id, 
        studentData.entityId, 
        studentData.schoolId, 
        newPassword
      );
      
      const updatedData = { ...studentData, personalPassword: newPassword };
      setStudentData(updatedData);
      
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordSection(false);
      
      setShowSuccess('🔐 Personal password updated successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error updating password:', error);
      setPasswordError('Failed to update password. Please try again.');
    }
    setIsSaving(false);
  };

  const generateParentInvite = async () => {
    setIsSaving(true);
    try {
      const inviteCode = await createParentInviteCode(
        studentData.id,
        studentData.entityId,
        studentData.schoolId,
        studentData.firstName,
        studentData.lastInitial,
        studentData.grade
      );
      
      setParentInviteCode(inviteCode);
      setShowInviteCode(true);
      
      const updatedData = { ...studentData, parentInviteCode: inviteCode };
      setStudentData(updatedData);
      
      setShowSuccess('👨‍👩‍👧‍👦 Parent invite code generated!');
      setTimeout(() => setShowSuccess(''), 3000);
      
    } catch (error) {
      console.error('❌ Error generating parent invite:', error);
      setShowSuccess('❌ Error generating invite code. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    }
    setIsSaving(false);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(parentInviteCode);
    setShowSuccess('📋 Invite code copied!');
    setTimeout(() => setShowSuccess(''), 2000);
  };

  const handleSignOut = async () => {
    try {
      setIsSaving(true);
      await signOut({ redirectTo: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      setShowSuccess('❌ Error signing out. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
      setIsSaving(false);
    }
  };

  // Account deletion functionality with audit logging
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setShowSuccess('❌ Please type "DELETE MY ACCOUNT" exactly to confirm.');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    setIsDeleting(true);
    try {
      console.log('🗑️ Starting account deletion with audit logging...');
      
      // Use enhanced deletion with export and audit logging
      await dbHelpers.deleteStudentAccountWithExport(
        user.uid,
        studentData.id,
        studentData.entityId,
        studentData.schoolId,
        false // Don't auto-export since user can export manually
      );
      
      console.log('✅ Account deleted successfully with audit trail');
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      
      // Redirect to homepage
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      setShowSuccess('❌ Failed to delete account. Please try again or contact support.');
      setTimeout(() => setShowSuccess(''), 5000);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  // Phase-aware reading goal message
  const getReadingGoalMessage = () => {
    const currentPhase = phaseData.currentPhase;
    const booksRead = studentData?.booksSubmittedThisYear || 0;
    const goal = studentData?.personalGoal || 20;
    
    if (currentPhase === 'VOTING' || currentPhase === 'RESULTS') {
      if (booksRead >= goal) {
        return {
          title: `🎉 Amazing Year - Goal Achieved!`,
          message: `You crushed your goal this year! You read ${booksRead} books and aimed for ${goal}. Incredible work!`,
          showControls: false
        };
      } else {
        return {
          title: `📚 Great Reading Year!`,
          message: `You read ${booksRead} books this year towards your goal of ${goal}. Every book counts - well done!`,
          showControls: false
        };
      }
    }
    
    if (currentPhase === 'TEACHER_SELECTION') {
      return {
        title: `🎯 New Year, New Goals!`,
        message: `Your reading goal will be available soon when your teacher selects this year's amazing book nominees!`,
        showControls: false
      };
    }
    
    return {
      title: `🎯 Reading Goal`,
      message: `How many books do you want to read this year? (Max: ${maxNominees} books)`,
      showControls: true
    };
  };

  const previewTheme = themes[selectedThemePreview] || themes.classic_lux;

  if (isLoading || !studentData || !currentTheme) {
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
          <p style={{ color: '#223848' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  const readingGoalInfo = getReadingGoalMessage();

  return (
    <>
      <Head>
        <title>Student Settings - Lux Libris</title>
        <meta name="description" content="Customize your reading experience, themes, and account settings" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        backgroundColor: previewTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'background-color 0.3s ease'
      }}>
        {/* Header with Hamburger Menu */}
        <div style={{
          background: `linear-gradient(135deg, ${previewTheme.primary}F0, ${previewTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease'
        }}>
          <button
            onClick={() => router.back()}
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
              color: previewTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ←
          </button>

          <h1 style={{
            fontSize: '24px',
            fontWeight: '400',
            color: previewTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center',
            flex: 1
          }}>
            Settings
          </h1>

          {/* Hamburger Menu */}
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
                color: previewTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ☰
            </button>

            {/* Dropdown Menu */}
            {showNavMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: previewTheme.surface,
                borderRadius: '12px',
                minWidth: '180px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${previewTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                {navMenuItems.map((item, index) => {
                  const isAccessible = !item.access || hasAccess(item.access);
                  
                  return (
                    <button
                      key={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowNavMenu(false);
                        
                        if (item.current) return;
                        
                        if (!isAccessible) {
                          setShowSuccess(`${item.name} isn't available right now`);
                          setTimeout(() => setShowSuccess(''), 3000);
                          return;
                        }
                        
                        setTimeout(() => router.push(item.path), 100);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: item.current ? `${previewTheme.primary}30` : 'transparent',
                        border: 'none',
                        borderBottom: index < navMenuItems.length - 1 ? `1px solid ${previewTheme.primary}40` : 'none',
                        cursor: item.current ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '14px',
                        color: !isAccessible ? previewTheme.textSecondary : previewTheme.textPrimary,
                        fontWeight: item.current ? '600' : '500',
                        textAlign: 'left',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'background-color 0.2s ease',
                        opacity: !isAccessible ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!item.current && isAccessible) {
                          e.target.style.backgroundColor = `${previewTheme.primary}20`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!item.current) {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <span>{item.name}</span>
                      {!isAccessible && (
                        <span style={{ marginLeft: 'auto', fontSize: '12px' }}>🔒</span>
                      )}
                      {item.current && (
                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: previewTheme.primary }}>●</span>
                      )}
                    </button>
                  );
                })}
                
                {/* Notification Toggle */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: `1px solid ${previewTheme.primary}40`,
                  backgroundColor: `${previewTheme.primary}10`
                }}>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      if (notificationProcessing) return;
                      
                      setNotificationProcessing(true);
                      try {
                        const enabled = await requestNotificationPermission();
                      } catch (error) {
                        console.error('Notification error:', error);
                      } finally {
                        setNotificationProcessing(false);
                        setTimeout(() => setShowNavMenu(false), 1000);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: notificationsEnabled ? `${previewTheme.primary}30` : previewTheme.surface,
                      border: `2px solid ${notificationsEnabled ? previewTheme.primary : previewTheme.textSecondary}60`,
                      borderRadius: '8px',
                      cursor: notificationProcessing ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: previewTheme.textPrimary,
                      fontWeight: '600',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.2s ease',
                      opacity: notificationProcessing ? 0.7 : 1
                    }}
                  >
                    <span>
                      {notificationProcessing ? '⏳' : (notificationsEnabled ? '🔔' : '🔕')}
                    </span>
                    <span>
                      {notificationProcessing ? 'Processing...' : (notificationsEnabled ? 'Notifications On' : 'Enable Notifications')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Student Info Section */}
          <div style={{
            backgroundColor: previewTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: previewTheme.textPrimary,
              marginBottom: '12px'
            }}>
              👋 Your Profile
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', color: previewTheme.textSecondary, margin: '0 0 4px 0' }}>Name</p>
                <p style={{ fontSize: '16px', color: previewTheme.textPrimary, margin: 0, fontWeight: '600' }}>
                  {studentData.firstName} {studentData.lastInitial}.
                </p>
              </div>
              <div>
                <p style={{ fontSize: '14px', color: previewTheme.textSecondary, margin: '0 0 4px 0' }}>Grade</p>
                <p style={{ fontSize: '16px', color: previewTheme.textPrimary, margin: 0, fontWeight: '600' }}>
                  {studentData.grade}th Grade
                </p>
              </div>
              <div>
                <p style={{ fontSize: '14px', color: previewTheme.textSecondary, margin: '0 0 4px 0' }}>Username</p>
                <p style={{ fontSize: '16px', color: previewTheme.textPrimary, margin: 0, fontWeight: '600', fontFamily: 'monospace' }}>
                  {studentData.displayUsername}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '14px', color: previewTheme.textSecondary, margin: '0 0 4px 0' }}>School Code</p>
                <p style={{ fontSize: '16px', color: previewTheme.textPrimary, margin: 0, fontWeight: '600', fontFamily: 'monospace' }}>
                  {studentData.schoolCode || 'TEST-STUDENT-2025'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '14px', color: previewTheme.textSecondary, margin: '0 0 4px 0' }}>School</p>
                <p style={{ fontSize: '16px', color: previewTheme.textPrimary, margin: 0, fontWeight: '600' }}>
                  {studentData.schoolName || 'Test Catholic School'}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Password Section */}
          <div style={{
            backgroundColor: previewTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: previewTheme.textPrimary,
                margin: 0
              }}>
                🔐 Personal Password
              </h2>
              <button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                style={{
                  backgroundColor: showPasswordSection ? `${previewTheme.secondary}30` : previewTheme.primary,
                  color: previewTheme.textPrimary,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            
            {!showPasswordSection ? (
              <div>
                <p style={{
                  fontSize: '14px',
                  color: previewTheme.textSecondary,
                  marginBottom: '12px'
                }}>
                  Your personal password keeps your account secure from other students.
                </p>
                <div style={{
                  backgroundColor: `${previewTheme.primary}20`,
                  border: `1px solid ${previewTheme.primary}50`,
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '14px', color: previewTheme.textPrimary }}>
                    Current password: 
                  </span>
                  <code style={{
                    backgroundColor: previewTheme.surface,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: previewTheme.textPrimary,
                    border: `1px solid ${previewTheme.primary}30`
                  }}>
                    {studentData.personalPassword}
                  </code>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: previewTheme.textPrimary,
                    marginBottom: '6px'
                  }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                      placeholder="Enter your current password"
                      style={{
                        width: '100%',
                        padding: '10px',
                        paddingRight: '40px',
                        border: `2px solid ${previewTheme.primary}50`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        backgroundColor: previewTheme.background
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      {showCurrentPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: previewTheme.textPrimary,
                    marginBottom: '6px'
                  }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                      placeholder="Enter your new password"
                      maxLength={20}
                      style={{
                        width: '100%',
                        padding: '10px',
                        paddingRight: '40px',
                        border: `2px solid ${isPasswordValid(newPassword) ? previewTheme.primary : '#e5e7eb'}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        backgroundColor: previewTheme.background
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  
                  <div style={{
                    backgroundColor: `${previewTheme.primary}10`,
                    border: `1px solid ${previewTheme.primary}30`,
                    borderRadius: '6px',
                    padding: '8px',
                    marginTop: '8px',
                    fontSize: '12px'
                  }}>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: previewTheme.textSecondary }}>
                      <li style={{ color: newPassword.length >= 5 ? '#10b981' : previewTheme.textSecondary }}>
                        At least 5 letters {newPassword.length >= 5 ? '✓' : ''}
                      </li>
                      <li style={{ color: /^[a-z]*$/.test(newPassword) ? '#10b981' : previewTheme.textSecondary }}>
                        Only lowercase letters {/^[a-z]*$/.test(newPassword) ? '✓' : ''}
                      </li>
                    </ul>
                  </div>
                </div>

                {passwordError && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '16px'
                  }}>
                    <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>
                      {passwordError}
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePasswordChange}
                  disabled={
                    isSaving || 
                    !currentPassword.trim() || 
                    !isPasswordValid(newPassword) ||
                    currentPassword === newPassword
                  }
                  style={{
                    backgroundColor: previewTheme.primary,
                    color: previewTheme.textPrimary,
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (
                      isSaving || 
                      !currentPassword.trim() || 
                      !isPasswordValid(newPassword) ||
                      currentPassword === newPassword
                    ) ? 'not-allowed' : 'pointer',
                    opacity: (
                      isSaving || 
                      !currentPassword.trim() || 
                      !isPasswordValid(newPassword) ||
                      currentPassword === newPassword
                    ) ? 0.7 : 1
                  }}
                >
                  {isSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>

          {/* Reading Goal Section */}
          <div style={{
            backgroundColor: previewTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: previewTheme.textPrimary,
              marginBottom: '8px'
            }}>
              {readingGoalInfo.title}
            </h2>
            <p style={{
              fontSize: '14px',
              color: previewTheme.textSecondary,
              marginBottom: '16px'
            }}>
              {readingGoalInfo.message}
            </p>
            
            {readingGoalInfo.showControls ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setNewGoal(Math.max(1, newGoal - 1))}
                      style={{
                        backgroundColor: previewTheme.primary,
                        color: previewTheme.textPrimary,
                        border: 'none',
                        borderRadius: '8px',
                        width: '40px',
                        height: '40px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      −
                    </button>
                    <div style={{
                      padding: '12px 16px',
                      border: `2px solid ${previewTheme.primary}50`,
                      borderRadius: '8px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      minWidth: '60px',
                      textAlign: 'center',
                      backgroundColor: previewTheme.background,
                      color: previewTheme.textPrimary
                    }}>
                      {newGoal}
                    </div>
                    <button
                      onClick={() => setNewGoal(Math.min(maxNominees, newGoal + 1))}
                      disabled={newGoal >= maxNominees}
                      style={{
                        backgroundColor: previewTheme.primary,
                        color: previewTheme.textPrimary,
                        border: 'none',
                        borderRadius: '8px',
                        width: '40px',
                        height: '40px',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        cursor: newGoal >= maxNominees ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: newGoal >= maxNominees ? 0.5 : 1
                      }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: '16px', color: previewTheme.textPrimary }}>
                    books this year {newGoal === maxNominees ? '(max reached)' : ''}
                  </span>
                </div>

                {newGoal !== studentData.personalGoal && (
                  <button
                    onClick={saveGoalChange}
                    disabled={isSaving}
                    style={{
                      backgroundColor: previewTheme.primary,
                      color: previewTheme.textPrimary,
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: isSaving ? 0.7 : 1
                    }}
                  >
                    {isSaving ? 'Saving...' : `Save Goal (${newGoal} books)`}
                  </button>
                )}
              </>
            ) : (
              <div style={{
                backgroundColor: `${previewTheme.primary}20`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '32px' }}>
                  {phaseData.currentPhase === 'VOTING' || phaseData.currentPhase === 'RESULTS' ? '🎉' : '🔜'}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: previewTheme.textPrimary,
                    marginBottom: '4px'
                  }}>
                    {phaseData.currentPhase === 'VOTING' || phaseData.currentPhase === 'RESULTS' 
                      ? 'This year is complete!'
                      : 'Coming soon!'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: previewTheme.textSecondary
                  }}>
                    {phaseData.currentPhase === 'VOTING' || phaseData.currentPhase === 'RESULTS' 
                      ? 'Keep reading and earning XP!'
                      : 'New goals will be available soon'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reading Session Timer Section */}
          <div style={{
            backgroundColor: previewTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: previewTheme.textPrimary,
              marginBottom: '8px'
            }}>
              ⏱️ Reading Session Timer
            </h2>
            <p style={{
              fontSize: '14px',
              color: previewTheme.textSecondary,
              marginBottom: '16px'
            }}>
              How long should your reading sessions be?
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setTimerDuration(Math.max(20, timerDuration - 5))}
                  style={{
                    backgroundColor: previewTheme.primary,
                    color: previewTheme.textPrimary,
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  −
                </button>
                <div style={{
                  padding: '12px 16px',
                  border: `2px solid ${previewTheme.primary}50`,
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  minWidth: '100px',
                  textAlign: 'center',
                  backgroundColor: previewTheme.background,
                  color: previewTheme.textPrimary
                }}>
                  {timerDuration} min
                </div>
                <button
                  onClick={() => setTimerDuration(Math.min(60, timerDuration + 5))}
                  style={{
                    backgroundColor: previewTheme.primary,
                    color: previewTheme.textPrimary,
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  +
                </button>
              </div>
            </div>
            
            <div style={{
              backgroundColor: `${previewTheme.primary}20`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: previewTheme.textSecondary,
                marginBottom: '4px'
              }}>
                {timerDuration <= 30 ? '📚 Perfect Session' : 
                 timerDuration <= 40 ? '⚡ Extended Session' : 
                 '🎯 Deep Focus Session'}
              </div>
              <div style={{
                backgroundColor: previewTheme.primary,
                height: '4px',
                borderRadius: '2px',
                width: `${(timerDuration / 60) * 100}%`,
                margin: '0 auto',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {timerDuration !== (studentData.readingSettings?.defaultTimerDuration || 20) && (
              <button
                onClick={saveTimerChange}
                disabled={isSaving}
                style={{
                  backgroundColor: previewTheme.primary,
                  color: previewTheme.textPrimary,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Saving...' : `Save Timer (${timerDuration} min)`}
              </button>
            )}
          </div>

          {/* Parent Invite Section */}
          <div style={{
            backgroundColor: previewTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: previewTheme.textPrimary,
              marginBottom: '8px'
            }}>
              👨‍👩‍👧‍👦 Invite Your Parents
            </h2>
            <p style={{
              fontSize: '14px',
              color: previewTheme.textSecondary,
              marginBottom: '16px'
            }}>
              Let your parents see your reading progress and celebrate your achievements!
            </p>

            {!parentInviteCode ? (
              <button
                onClick={generateParentInvite}
                disabled={isSaving}
                style={{
                  backgroundColor: previewTheme.primary,
                  color: previewTheme.textPrimary,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Generating...' : '✨ Generate Parent Invite Code'}
              </button>
            ) : (
              <div style={{
                backgroundColor: `${previewTheme.primary}20`,
                border: `2px solid ${previewTheme.primary}50`,
                borderRadius: '12px',
                padding: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: previewTheme.textPrimary,
                  marginBottom: '8px',
                  fontWeight: '600'
                }}>
                  🎉 Your Parent Invite Code:
                </p>
                <div style={{
                  backgroundColor: previewTheme.surface,
                  border: `1px solid ${previewTheme.primary}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <code style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: previewTheme.textPrimary,
                    fontFamily: 'monospace'
                  }}>
                    {parentInviteCode}
                  </code>
                  <button
                    onClick={copyInviteCode}
                    style={{
                      backgroundColor: previewTheme.primary,
                      color: previewTheme.textPrimary,
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: previewTheme.textSecondary,
                  margin: 0
                }}>
                  Share this code with your parents so they can create an account and see your progress!
                </p>
              </div>
            )}
          </div>

          {/* Theme Selection */}
          <div style={{
            backgroundColor: previewTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: previewTheme.textPrimary,
              marginBottom: '8px'
            }}>
              🎨 Choose Your Theme
            </h2>
            <p style={{
              fontSize: '14px',
              color: previewTheme.textSecondary,
              marginBottom: '20px'
            }}>
              Select your bookshelf &amp; trophy case design. Changes apply instantly!
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {themesArray.map(theme => {
                const isSelected = theme.assetPrefix === selectedThemePreview;
                return (
                  <button
                    key={theme.assetPrefix}
                    onClick={() => setSelectedThemePreview(theme.assetPrefix)}
                    style={{
                      padding: '12px',
                      backgroundColor: theme.surface,
                      border: `${isSelected ? '3px' : '2px'} solid ${isSelected ? theme.primary : `${theme.primary}50`}`,
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isSelected ? `0 8px 24px ${theme.primary}40` : '0 2px 8px rgba(0,0,0,0.1)',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '60px',
                      borderRadius: '8px',
                      marginBottom: '6px',
                      backgroundImage: `url(/bookshelves/${theme.assetPrefix}.jpg)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: `${theme.primary}20`
                    }} />
                    
                    <div style={{
                      width: '100%',
                      height: '45px',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      backgroundImage: `url(/trophy_cases/${theme.assetPrefix}.jpg)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: `${theme.accent}20`
                    }} />
                    
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: theme.textPrimary,
                      textAlign: 'center',
                      lineHeight: '1.2'
                    }}>
                      {theme.name}
                    </div>
                    
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: theme.primary,
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedThemePreview !== studentData.selectedTheme && (
              <div>
                <button
                  onClick={saveThemeChange}
                  disabled={isSaving}
                  style={{
                    backgroundColor: previewTheme.primary,
                    color: previewTheme.textPrimary,
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? 'Saving...' : `Save ${previewTheme.name}`}
                </button>
              </div>
            )}
          </div>

          {/* Data Export Section */}
          <DataExportComponent 
            accountType="student"
            studentData={studentData}
            theme={previewTheme}
            onExportComplete={(result) => {
              setShowSuccess('📦 Data exported successfully!');
              setTimeout(() => setShowSuccess(''), 3000);
            }}
          />

          {/* Account & Other Settings */}
          <div style={{
            backgroundColor: previewTheme.surface,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '80px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: previewTheme.textPrimary,
              marginBottom: '16px'
            }}>
              ⚙️ Account & Settings
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => router.push('/legal')}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${previewTheme.primary}50`,
                  color: previewTheme.textPrimary,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left'
                }}
              >
                📋 Privacy &amp; Terms
              </button>

              <button
                onClick={() => setShowSignOutConfirm(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left',
                  fontWeight: '600'
                }}
              >
                🚪 Sign Out
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #dc2626',
                  color: '#dc2626',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left',
                  fontWeight: '600'
                }}
              >
                🗑️ Delete Account & Data
              </button>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: previewTheme.primary,
              color: previewTheme.textPrimary,
              padding: '12px 24px',
              borderRadius: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 1000,
              fontSize: '14px',
              fontWeight: '600',
              maxWidth: '90vw',
              textAlign: 'center'
            }}>
              {showSuccess}
            </div>
          )}

          {/* Sign Out Confirmation Modal */}
          {showSignOutConfirm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: previewTheme.surface,
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: previewTheme.textPrimary,
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  🚪 Sign Out
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: previewTheme.textSecondary,
                  marginBottom: '20px',
                  textAlign: 'center',
                  lineHeight: '1.4'
                }}>
                  Are you sure you want to sign out? You&apos;ll need to sign in again to access your books and progress.
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${previewTheme.primary}50`,
                      color: previewTheme.textPrimary,
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={isSaving}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: isSaving ? 0.7 : 1
                    }}
                  >
                    {isSaving ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Account Confirmation Modal */}
          {showDeleteConfirm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: previewTheme.surface,
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '450px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  🗑️ Delete Account & Data
                </h3>
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#dc2626',
                    margin: '0 0 12px 0',
                    lineHeight: '1.4',
                    fontWeight: '600'
                  }}>
                    ⚠️ This action cannot be undone!
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: '#dc2626',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    Deleting your account will permanently remove:
                  </p>
                  <ul style={{
                    fontSize: '13px',
                    color: '#dc2626',
                    margin: '8px 0 0 16px',
                    lineHeight: '1.4'
                  }}>
                    <li>Your reading progress and bookshelf</li>
                    <li>All achievements and saints unlocked</li>
                    <li>Your account settings and preferences</li>
                    <li>Connection to your parents (if any)</li>
                  </ul>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: previewTheme.textPrimary,
                    marginBottom: '6px'
                  }}>
                    Type &quot;DELETE MY ACCOUNT&quot; to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `2px solid ${deleteConfirmText === 'DELETE MY ACCOUNT' ? '#dc2626' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      backgroundColor: previewTheme.background
                    }}
                  />
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={isDeleting}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${previewTheme.primary}50`,
                      color: previewTheme.textPrimary,
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: isDeleting ? 0.5 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: (isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT') ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: (isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT') ? 0.5 : 1
                    }}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
          }
        `}</style>
      </div>
    </>
  );
}