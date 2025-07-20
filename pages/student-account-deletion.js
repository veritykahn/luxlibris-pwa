// pages/student-account-deletion.js - Dedicated page for data export and account deletion
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getStudentDataEntities, dbHelpers } from '../lib/firebase';
import DataExportComponent from '../components/DataExportComponent';
import Head from 'next/head'

// Theme definitions (same as settings page)
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

export default function StudentAccountDeletion() {
  const router = useRouter();
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState('');

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasExportedData, setHasExportedData] = useState(false);

  // Load student data
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
      
    } catch (error) {
      console.error('❌ Error loading student data:', error);
      router.push('/student-account-creation');
    }
    setIsLoading(false);
  }, [user, router]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

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
          <p style={{ color: '#223848' }}>Loading account data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Export & Delete Account - Lux Libris</title>
        <meta name="description" content="Export your reading data and delete your account" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        backgroundColor: currentTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
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
          transition: 'all 0.3s ease'
        }}>
          <button
            onClick={() => router.push('/student-settings')}
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

          <h1 style={{
            fontSize: '20px',
            fontWeight: '400',
            color: currentTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center',
            flex: 1
          }}>
            Export & Delete Account
          </h1>

          <div style={{ width: '44px' }} /> {/* Spacer for center alignment */}
        </div>

        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Warning Section */}
          <div style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #fca5a5',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '12px'
            }}>
              Important: Account Deletion
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#dc2626',
              lineHeight: '1.5',
              marginBottom: '16px'
            }}>
              This page allows you to export your reading data and permanently delete your account.
              Once deleted, your account cannot be recovered.
            </p>
            <div style={{
              backgroundColor: '#fee2e2',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#dc2626',
                margin: '0 0 8px 0',
                fontWeight: '600'
              }}>
                Account deletion will permanently remove:
              </p>
              <ul style={{
                fontSize: '14px',
                color: '#dc2626',
                margin: '0',
                paddingLeft: '20px',
                lineHeight: '1.4'
              }}>
                <li>Your reading progress and bookshelf</li>
                <li>All achievements and saints unlocked</li>
                <li>Your account settings and theme preferences</li>
                <li>Connection to your parents (if any)</li>
                <li>All personal information and data</li>
              </ul>
            </div>
          </div>

          {/* Step 1: Data Export */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: hasExportedData ? `2px solid #10b981` : `2px solid ${currentTheme.primary}50`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                backgroundColor: hasExportedData ? '#10b981' : currentTheme.primary,
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {hasExportedData ? '✓' : '1'}
              </div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: currentTheme.textPrimary,
                margin: 0
              }}>
                📦 Export Your Reading Data (Recommended)
              </h2>
            </div>
            
            <p style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              Before deleting your account, we recommend exporting your reading data. This creates a file 
              with all your book progress, achievements, and account information that you can keep forever.
            </p>

            <DataExportComponent 
              accountType="student"
              studentData={studentData}
              theme={currentTheme}
              onExportComplete={(result) => {
                setHasExportedData(true);
                setShowSuccess('📦 Data exported successfully! You can now proceed with account deletion if desired.');
                setTimeout(() => setShowSuccess(''), 5000);
              }}
            />

            {hasExportedData && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: '#16a34a', fontSize: '16px' }}>✅</span>
                <span style={{ color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>
                  Data export completed! Your reading data has been saved.
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Account Deletion */}
          <div style={{
            backgroundColor: currentTheme.surface,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '80px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid #dc2626`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                2
              </div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#dc2626',
                margin: 0
              }}>
                🗑️ Delete Your Account
              </h2>
            </div>

            <p style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              Once you delete your account, all your data will be permanently removed from our systems. 
              This action cannot be undone.
            </p>

            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#dc2626',
                marginBottom: '12px'
              }}>
                What happens when you delete your account:
              </h3>
              <ul style={{
                fontSize: '14px',
                color: '#dc2626',
                margin: 0,
                paddingLeft: '20px',
                lineHeight: '1.6'
              }}>
                <li><strong>Immediate removal:</strong> Your account is deleted instantly</li>
                <li><strong>Data removal:</strong> All reading progress, books, and achievements are permanently deleted</li>
                <li><strong>Parent disconnection:</strong> Any parent accounts linked to yours will be disconnected</li>
                <li><strong>No recovery:</strong> We cannot restore your account or data after deletion</li>
                <li><strong>Sign out:</strong> You'll be automatically signed out and redirected to the homepage</li>
              </ul>
            </div>

            <div style={{
              backgroundColor: hasExportedData ? '#f0fdf4' : '#fef3c7',
              border: `1px solid ${hasExportedData ? '#bbf7d0' : '#fcd34d'}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>
                {hasExportedData ? '✅' : '💡'}
              </span>
              <span style={{ 
                color: hasExportedData ? '#16a34a' : '#d97706', 
                fontSize: '14px', 
                fontWeight: '600' 
              }}>
                {hasExportedData 
                  ? 'Great! You\'ve exported your data and can safely delete your account.'
                  : 'Consider exporting your data first to keep a record of your reading journey.'
                }
              </span>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
              }}
            >
              🗑️ Proceed with Account Deletion
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: currentTheme.primary,
              color: currentTheme.textPrimary,
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

          {/* Delete Account Confirmation Modal */}
          {showDeleteConfirm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: currentTheme.surface,
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '2px solid #dc2626'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗑️</div>
                  <h3 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#dc2626',
                    marginBottom: '8px'
                  }}>
                    Delete Account Forever
                  </h3>
                  <p style={{
                    fontSize: '16px',
                    color: currentTheme.textSecondary,
                    margin: 0
                  }}>
                    This action cannot be undone!
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#dc2626',
                    margin: '0 0 12px 0',
                    lineHeight: '1.4',
                    fontWeight: '600'
                  }}>
                    ⚠️ Final Warning: This will permanently delete:
                  </p>
                  <ul style={{
                    fontSize: '13px',
                    color: '#dc2626',
                    margin: '0',
                    paddingLeft: '16px',
                    lineHeight: '1.4'
                  }}>
                    <li>Your reading progress and bookshelf ({studentData.bookshelf?.length || 0} books)</li>
                    <li>All achievements and saints unlocked ({studentData.unlockedSaints?.length || 0} saints)</li>
                    <li>Your account settings and theme preferences</li>
                    <li>Connection to your parents (if any)</li>
                    <li>Your username: <strong>{studentData.displayUsername}</strong></li>
                  </ul>
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: currentTheme.textPrimary,
                    marginBottom: '8px'
                  }}>
                    To confirm deletion, type exactly: <strong>DELETE MY ACCOUNT</strong>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${deleteConfirmText === 'DELETE MY ACCOUNT' ? '#dc2626' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      backgroundColor: currentTheme.background,
                      color: currentTheme.textPrimary
                    }}
                  />
                  
                  {deleteConfirmText && deleteConfirmText !== 'DELETE MY ACCOUNT' && (
                    <p style={{
                      fontSize: '12px',
                      color: '#dc2626',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>
                      Please type exactly: DELETE MY ACCOUNT
                    </p>
                  )}
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
                      border: `2px solid ${currentTheme.primary}`,
                      color: currentTheme.textPrimary,
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
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
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: (isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT') ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: (isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT') ? 0.5 : 1,
                      minWidth: '140px'
                    }}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Forever'}
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