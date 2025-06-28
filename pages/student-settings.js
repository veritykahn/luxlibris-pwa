// pages/student-settings.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function StudentSettings() {
  const router = useRouter();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [selectedThemePreview, setSelectedThemePreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Theme definitions (same as everywhere else)
  const themes = {
    classic_lux: {
      name: 'Lux Libris Classic',
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
      primary: '#8B4513',
      secondary: '#D2691E',
      accent: '#FF8C00',
      background: '#F5F5DC',
      surface: '#FFE4B5',
      textPrimary: '#2F1B14',
      textSecondary: '#5D4037'
    },
    lavender_space: {
      name: 'Cosmic Explorer',
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
      primary: '#66CDAA',
      secondary: '#98FB98',
      accent: '#AFEEEE',
      background: '#F0FFF0',
      surface: '#E0FFE0',
      textPrimary: '#2E4739',
      textSecondary: '#4A6B57'
    },
    pink_plushies: {
      name: 'Kawaii Dreams',
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
      primary: '#90EE90',
      secondary: '#F0FFF0',
      accent: '#98FB98',
      background: '#FFFFF0',
      surface: '#FFFFFF',
      textPrimary: '#2F4F2F',
      textSecondary: '#556B2F'
    }
  };

  const themesArray = Object.entries(themes).map(([key, value]) => ({
    assetPrefix: key,
    ...value
  }));

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const savedStudentData = localStorage.getItem('studentData');
      if (savedStudentData) {
        const parsed = JSON.parse(savedStudentData);
        setStudentData(parsed);
        setCurrentTheme(themes[parsed.selectedTheme] || themes.classic_lux);
        setSelectedThemePreview(parsed.selectedTheme || 'classic_lux');
      } else {
        router.push('/student-onboarding');
        return;
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      router.push('/student-onboarding');
    }
    setIsLoading(false);
  };

  const saveThemeChange = async () => {
    setIsSaving(true);
    try {
      const updatedStudentData = {
        ...studentData,
        selectedTheme: selectedThemePreview
      };
      
      // Update localStorage
      localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
      
      // Update Firebase if we have studentId
      const studentId = localStorage.getItem('studentId');
      if (studentId) {
        await updateDoc(doc(db, 'users/students', studentId), {
          selectedTheme: selectedThemePreview
        });
      }
      
      // Update local state
      setStudentData(updatedStudentData);
      setCurrentTheme(themes[selectedThemePreview]);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Error saving your theme. Please try again.');
    }
    setIsSaving(false);
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
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
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
              <p style={{ fontSize: '14px', color: previewTheme.textSecondary, margin: '0 0 4px 0' }}>Reading Goal</p>
              <p style={{ fontSize: '16px', color: previewTheme.textPrimary, margin: 0, fontWeight: '600' }}>
                {studentData.currentYearGoal} books
              </p>
            </div>
          </div>
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
                    backgroundImage: `url(/assets/bookshelves/${theme.assetPrefix}.png)`,
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
                    backgroundImage: `url(/assets/trophy_cases/${theme.assetPrefix}.png)`,
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              onClick={() => alert('Reading goal changes coming soon!')}
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
              🎯 Change Reading Goal
            </button>
            
            <button
              onClick={() => alert('Notifications settings coming soon!')}
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
              🔔 Notifications
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
            fontWeight: '600'
          }}>
            ✨ Theme saved! Your bookshelf looks amazing!
          </div>
        )}
      </div>
    </div>
  );
}