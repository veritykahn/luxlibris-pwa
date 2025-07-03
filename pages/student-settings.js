// pages/student-settings.js - COPY THIS CODE
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentData, updateStudentData } from '../lib/firebase';
import { createParentInviteCode } from '../lib/parentLinking';
import Head from 'next/head'

export default function StudentSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [selectedThemePreview, setSelectedThemePreview] = useState('');
  const [newGoal, setNewGoal] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');
  const [parentInviteCode, setParentInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);

  // Theme definitions (same as everywhere else)
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
    primary: '#2F5F5F',        // Deep teal (your preferred)
    secondary: '#8B2635',      // Burnt subdued red (your preferred)
    accent: '#F5DEB3',         // Warm wheat/cream (your preferred)
    background: '#F5F5DC',
    surface: '#FFF8DC',        // Cream surface (your preferred)
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
    primary: '#B8E6B8',        // Soft pastel green (new)
    secondary: '#FFB3BA',      // Soft coral (new)
    accent: '#FFCCCB',         // Pastel coral (new)
    background: '#FEFEFE',     // Pure white
    surface: '#F8FDF8',        // Very subtle green tint
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
    primary: '#6B8E6B',        // Forest green (your preferred)
    secondary: '#D2B48C',      // Warm tan/khaki (your preferred)
    accent: '#F5F5DC',         // Beige accent (your preferred)
    background: '#FFFEF8',     // Warm white (your preferred)
    surface: '#FFFFFF',
    textPrimary: '#2F4F2F',
    textSecondary: '#556B2F'
  },
  little_luminaries: {
    name: 'Little Luminaries™',
    assetPrefix: 'little_luminaries',
  primary: '#666666', // Medium grey (for buttons/elements)
 secondary: '#333333', // Dark grey (for accents, not black)
 accent: '#E8E8E8', // Light grey accent
 background: '#FFFFFF', // Pure white background
 surface: '#FAFAFA', // Very light grey surface
 textPrimary: '#333333', // Dark grey text (readable on all light backgrounds)
 textSecondary: '#666666' // Medium grey text
}
};

  const themesArray = Object.entries(themes).map(([key, value]) => ({
    assetPrefix: key,
    ...value
  }));

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const loadStudentData = async () => {
    try {
      if (!user?.uid) {
        router.push('/student-account-creation');
        return;
      }

      console.log('🔍 Loading student data for UID:', user.uid);
      
      // Get real data from Firebase diocese structure
      const realStudentData = await getStudentData(user.uid);
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
      
    } catch (error) {
      console.error('❌ Error loading student data:', error);
      router.push('/student-account-creation');
    }
    setIsLoading(false);
  };

  const saveThemeChange = async () => {
    if (selectedThemePreview === studentData.selectedTheme) return;
    
    setIsSaving(true);
    try {
      // Update Firebase
      await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
        selectedTheme: selectedThemePreview
      });
      
      // Update local state
      const updatedData = { ...studentData, selectedTheme: selectedThemePreview };
      setStudentData(updatedData);
      setCurrentTheme(themes[selectedThemePreview]);
      
      setShowSuccess('✨ Theme saved! Your bookshelf looks amazing!');
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
      // Update Firebase
      await updateStudentData(studentData.id, studentData.dioceseId, studentData.schoolId, {
        personalGoal: newGoal
      });
      
      // Update local state
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

  const generateParentInvite = async () => {
    setIsSaving(true);
    try {
      const inviteCode = await createParentInviteCode(
        studentData.id,
        studentData.dioceseId, 
        studentData.schoolId,
        studentData.firstName,
        studentData.lastInitial,
        studentData.grade
      );
      
      setParentInviteCode(inviteCode);
      setShowInviteCode(true);
      
      // Update local state
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
      {/* Header */}
      <div style={{
        backgroundColor: previewTheme.secondary,
        padding: '16px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'background-color 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: previewTheme.textPrimary,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ←
          </button>
          <h1 style={{
            fontFamily: 'Didot, serif',
            fontSize: '20px',
            color: previewTheme.textPrimary,
            margin: 0
          }}>
            Settings
          </h1>
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

        {/* Reading Goal Section */}
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
            marginBottom: '8px'
          }}>
            🎯 Reading Goal
          </h2>
          <p style={{
            fontSize: '14px',
            color: previewTheme.textSecondary,
            marginBottom: '16px'
          }}>
            How many books do you want to read this year?
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
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
      onClick={() => setNewGoal(Math.min(100, newGoal + 1))}
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
  <span style={{ fontSize: '16px', color: previewTheme.textPrimary }}>books this year</span>
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
        </div>

        {/* Parent Invite Section */}
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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

          {/* Theme Grid */}
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
                  {/* Bookshelf Preview */}
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
                  
                  {/* Trophy Case Preview */}
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
                  
                  {/* Theme Name */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.textPrimary,
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                    {theme.name}
                  </div>
                  
                  {/* Selected Indicator */}
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

          {/* Save Button */}
          {selectedThemePreview !== studentData.selectedTheme && (
            <div style={{ textAlign: 'center' }}>
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

        {/* Other Settings */}
        <div style={{
          backgroundColor: previewTheme.surface,
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '80px', // Space for navigation
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: previewTheme.textPrimary,
            marginBottom: '16px'
          }}>
            ⚙️ Other Settings
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
     </div>
    </div>
  </>
);
}