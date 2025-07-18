// pages/student-onboarding.js - Updated with Personal Password Step
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, getCurrentAcademicYear } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import Head from 'next/head'

export default function StudentOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [error, setError] = useState('');
  
  // Student data
  const [formData, setFormData] = useState({
    firstName: '',
    lastInitial: '',
    grade: 4,
    personalPassword: '', // NEW: Personal password field
    teacherId: '',
    entityId: '',
    schoolId: '',
    schoolName: '',
    schoolCity: '',
    schoolState: '',
    teacherName: '',
    teacherJoinCode: '',
    currentYearGoal: 10,
    selectedTheme: 'classic_lux'
  });

  // Theme definitions
  const themes = [
    {
      name: 'Lux Libris Classic',
      assetPrefix: 'classic_lux',
      primary: '#ADD4EA',
      secondary: '#C3E0DE',
      accent: '#A1E5DB',
      background: '#FFFCF5',
      surface: '#FFFFFF',
      textPrimary: '#223848'
    },
    {
      name: 'Athletic Champion',
      assetPrefix: 'darkwood_sports',
      primary: '#2F5F5F',
      secondary: '#8B2635',
      accent: '#F5DEB3',
      background: '#F5F5DC',
      surface: '#FFF8DC',
      textPrimary: '#2F1B14'
    },
    {
      name: 'Cosmic Explorer',
      assetPrefix: 'lavender_space',
      primary: '#9C88C4',
      secondary: '#B19CD9',
      accent: '#E1D5F7',
      background: '#2A1B3D',
      surface: '#3D2B54',
      textPrimary: '#E1D5F7'
    },
    {
      name: 'Musical Harmony',
      assetPrefix: 'mint_music',
      primary: '#B8E6B8',
      secondary: '#FFB3BA',
      accent: '#FFCCCB',
      background: '#FEFEFE',
      surface: '#F8FDF8',
      textPrimary: '#2E4739'
    },
    {
      name: 'Kawaii Dreams',
      assetPrefix: 'pink_plushies',
      primary: '#FFB6C1',
      secondary: '#FFC0CB',
      accent: '#FFE4E1',
      background: '#FFF0F5',
      surface: '#FFE4E6',
      textPrimary: '#4A2C2A'
    },
    {
      name: 'Otaku Paradise',
      assetPrefix: 'teal_anime',
      primary: '#20B2AA',
      secondary: '#48D1CC',
      accent: '#7FFFD4',
      background: '#E0FFFF',
      surface: '#AFEEEE',
      textPrimary: '#2F4F4F'
    },
    {
      name: 'Pure Serenity',
      assetPrefix: 'white_nature',
      primary: '#6B8E6B',
      secondary: '#D2B48C',
      accent: '#F5F5DC',
      background: '#FFFEF8',
      surface: '#FFFFFF',
      textPrimary: '#2F4F2F'
    },
    {
      name: 'Luxlings™',
      assetPrefix: 'little_luminaries',
      primary: '#666666',
      secondary: '#000000',
      accent: '#E8E8E8',
      background: '#FFFFFF',
      surface: '#FAFAFA',
      textPrimary: '#B8860B',
    }
  ];

  const grades = [4, 5, 6, 7, 8];
  const bookGoals = Array.from({length: 20}, (_, i) => i + 1);

  useEffect(() => {
    loadTeacherDataFromStorage();
  }, []);

  const loadTeacherDataFromStorage = () => {
    const tempTeacherData = localStorage.getItem('tempTeacherData');
    
    if (tempTeacherData) {
      const parsed = JSON.parse(tempTeacherData);
      console.log('Loading teacher data from account creation:', parsed.teacherName);
      
      setFormData(prev => ({
        ...prev,
        teacherId: parsed.teacherId || '',
        entityId: parsed.entityId || '',
        schoolId: parsed.schoolId || '',
        schoolName: parsed.schoolName || '',
        schoolCity: parsed.schoolCity || '',
        schoolState: parsed.schoolState || '',
        teacherName: parsed.teacherName || '',
        teacherJoinCode: parsed.teacherJoinCode || ''
      }));
    } else {
      console.warn('No teacher data found - student may have accessed onboarding directly');
      setError('Please start from the account creation page');
    }
  };

  const generateUsername = async (firstName, lastInitial, grade, teacherData, entityId, schoolId) => {
    try {
      const teacherFullName = teacherData.teacherName || '';
      const teacherLastName = teacherFullName.split(' ').pop() || 'TCHR';
      const teacherCode = teacherLastName.toUpperCase().substring(0, 4).padEnd(4, 'X');
      const baseUsername = `${firstName}${lastInitial}${grade}${teacherCode}`;
      
      const studentsCollection = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
      const querySnapshot = await getDocs(studentsCollection);
      
      const existingUsernames = [];
      querySnapshot.forEach((doc) => {
        const studentData = doc.data();
        if (studentData.displayUsername) {
          existingUsernames.push(studentData.displayUsername);
        }
      });
      
      let finalUsername = baseUsername;
      let counter = 2;
      
      while (existingUsernames.includes(finalUsername)) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }
      
      console.log('✅ Generated unique username:', finalUsername);
      return finalUsername;
    } catch (error) {
      console.error('Error generating username:', error);
      throw error;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) { // Updated: Now 5 steps (0-4)
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation function for personal password
  const isPasswordValid = (password) => {
    return password && password.length >= 5 && /^[a-z]+$/.test(password);
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Validate required data
      if (!formData.firstName || !formData.lastInitial || !formData.personalPassword || !formData.teacherId || !formData.entityId || !formData.schoolId) {
        throw new Error('Missing required information');
      }

      // Validate personal password
      if (!isPasswordValid(formData.personalPassword)) {
        throw new Error('Personal password must be at least 5 letters (lowercase only)');
      }

      // Verify teacher exists
      const teacherRef = doc(db, `entities/${formData.entityId}/schools/${formData.schoolId}/teachers`, formData.teacherId);
      const teacherDoc = await getDoc(teacherRef);
      
      if (!teacherDoc.exists()) {
        throw new Error('Teacher not found in database');
      }
      
      const teacherData = { id: formData.teacherId, ...teacherDoc.data() };
      console.log('✅ Teacher verified:', teacherData.firstName, teacherData.lastName);
      
      // Generate unique username
      const displayUsername = await generateUsername(
        formData.firstName, 
        formData.lastInitial, 
        formData.grade, 
        { teacherName: formData.teacherName },
        formData.entityId,
        formData.schoolId
      );
      
      setGeneratedUsername(displayUsername);

      // Create sign-in credentials
      const studentEmail = `${displayUsername.toLowerCase()}@${formData.teacherJoinCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}.luxlibris.app`;
      
      // Create student database record
      const studentData = {
        // Authentication fields for future sign-in
        authEmail: studentEmail,
        displayUsername: displayUsername,
        signInCode: formData.teacherJoinCode,
        personalPassword: formData.personalPassword.toLowerCase(), // Store lowercase personal password
        
        // Personal info
  firstName: formData.firstName,
  lastInitial: formData.lastInitial,
  
  // ADD THESE TWO LINES:
  academicYear: getCurrentAcademicYear(),
  gradeHistory: [{ academicYear: getCurrentAcademicYear(), grade: parseInt(formData.grade), joinedAt: new Date() }],
  
  // Teacher & School linking
  currentTeacherId: formData.teacherId,
        teacherHistory: [formData.teacherId],
        createdByTeacherId: formData.teacherId,
        
        entityId: formData.entityId,
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,
        
        // Academic info
        grade: parseInt(formData.grade),
        personalGoal: formData.currentYearGoal,
        
        // Customization
        selectedTheme: formData.selectedTheme,
        
        // Progress tracking
        thisYearBooks: 0,
        booksSubmittedThisYear: 0,
        lifetimeBooksSubmitted: 0,
        saintUnlocks: [],
        
        // Reading habits
        readingStreaks: { 
          current: 0, 
          longest: 0,
          lastReadingDate: null 
        },
        
        // Bookshelf
        bookshelf: [],
        
        // Historical data
        historicalBooksSubmitted: {},
        
        // Metadata
        accountCreated: new Date(),
        onboardingCompleted: true,
        accountType: 'student',
        needsFirstSignIn: true
      };

      const studentDocRef = await addDoc(
        collection(db, `entities/${formData.entityId}/schools/${formData.schoolId}/students`), 
        studentData
      );
      
      console.log('✅ Student profile created with ID:', studentDocRef.id);
      
      // Clean up temp data
      localStorage.removeItem('tempTeacherData');
      localStorage.removeItem('luxlibris_account_flow');
      
      // Show success popup
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error('Error creating student profile:', error);
      setError(`Profile creation failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleSuccessPopupClose = () => {
    const params = new URLSearchParams({
      username: generatedUsername,
      teacherCode: formData.teacherJoinCode,
      newAccount: 'true'
    });
    
    router.push(`/student-sign-in?${params.toString()}`);
  };

  const selectedTheme = themes.find(theme => theme.assetPrefix === formData.selectedTheme);

  return (
    <>
      <Head>
        <title>Welcome to Lux Libris - Student Setup</title>
        <meta name="description" content="Set up your reading profile and join your teacher's program" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{ 
        backgroundColor: selectedTheme.background, 
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative'
      }}>
        {/* Success Popup */}
        {showSuccessPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: selectedTheme.surface,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: selectedTheme.textPrimary,
                marginBottom: '16px'
              }}>
                Profile Created!
              </h2>
              <p style={{
                fontSize: '16px',
                color: `${selectedTheme.textPrimary}CC`,
                marginBottom: '24px'
              }}>
                Your reading profile is ready! Now let&apos;s sign you in.
              </p>
              
              {/* Username Display */}
              <div style={{
                backgroundColor: `${selectedTheme.primary}20`,
                border: `1px solid ${selectedTheme.primary}50`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: selectedTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  Your Username:
                </p>
                <p style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: selectedTheme.primary,
                  fontFamily: 'monospace',
                  marginBottom: '8px'
                }}>
                  {generatedUsername}
                </p>
              </div>
              
              {/* NEW: Personal Password Display */}
              <div style={{
                backgroundColor: `${selectedTheme.secondary}20`,
                border: `1px solid ${selectedTheme.secondary}50`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: selectedTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  Your Personal Password:
                </p>
                <p style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: selectedTheme.secondary,
                  fontFamily: 'monospace'
                }}>
                  {formData.personalPassword}
                </p>
              </div>
              
              {/* Teacher Code Display */}
              <div style={{
                backgroundColor: `${selectedTheme.accent}20`,
                border: `1px solid ${selectedTheme.accent}50`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: selectedTheme.textPrimary,
                  marginBottom: '8px'
                }}>
                  Your Teacher Code:
                </p>
                <p style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: selectedTheme.primary,
                  fontFamily: 'monospace'
                }}>
                  {formData.teacherJoinCode}
                </p>
              </div>
              
              <p style={{
                fontSize: '14px',
                color: `${selectedTheme.textPrimary}CC`,
                marginBottom: '24px',
                fontStyle: 'italic'
              }}>
                Write these down! You&apos;ll need all three to sign in.
              </p>
              
              <button
                onClick={handleSuccessPopupClose}
                style={{
                  backgroundColor: selectedTheme.primary,
                  color: selectedTheme.textPrimary,
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Sign In Now →
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{
          backgroundColor: selectedTheme.secondary,
          padding: '16px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            fontFamily: 'Didot, serif',
            fontSize: '20px',
            color: selectedTheme.textPrimary,
            margin: 0,
            textAlign: 'center'
          }}>
            Welcome to Lux Libris!
          </h1>
        </div>

        {/* Progress Indicator */}
        <div style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2, 3, 4].map(step => ( // Updated: Now 5 steps
              <div
                key={step}
                style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: step <= currentStep ? selectedTheme.primary : `${selectedTheme.accent}50`,
                  borderRadius: '2px',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Page Content */}
        <div style={{ 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 160px)'
        }}>
          
          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                color: '#dc2626',
                fontSize: '0.875rem',
                margin: 0
              }}>
                {error}
              </p>
            </div>
          )}
          
          <div style={{ flex: 1 }}>
            {currentStep === 0 && <WelcomePage selectedTheme={selectedTheme} />}
            {currentStep === 1 && (
              <InfoPage 
                formData={formData} 
                setFormData={setFormData} 
                selectedTheme={selectedTheme} 
                grades={grades} 
              />
            )}
            {/* NEW: Personal Password Step */}
            {currentStep === 2 && (
              <PasswordPage 
                formData={formData} 
                setFormData={setFormData} 
                selectedTheme={selectedTheme}
                isPasswordValid={isPasswordValid}
              />
            )}
            {currentStep === 3 && (
              <GoalPage 
                formData={formData} 
                setFormData={setFormData} 
                selectedTheme={selectedTheme} 
                bookGoals={bookGoals} 
              />
            )}
            {currentStep === 4 && (
              <ThemePage 
                formData={formData} 
                setFormData={setFormData} 
                themes={themes} 
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px'
          }}>
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                color: selectedTheme.textPrimary,
                fontSize: '16px',
                cursor: 'pointer',
                padding: '12px 16px',
                opacity: currentStep > 0 ? 1 : 0,
                pointerEvents: currentStep > 0 ? 'auto' : 'none'
              }}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={
                isLoading || 
                (currentStep === 1 && (!formData.firstName || !formData.lastInitial)) ||
                (currentStep === 2 && !isPasswordValid(formData.personalPassword))
              }
              style={{
                backgroundColor: selectedTheme.primary,
                color: selectedTheme.textPrimary,
                border: 'none',
                padding: '12px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                opacity: (
                  isLoading || 
                  (currentStep === 1 && (!formData.firstName || !formData.lastInitial)) ||
                  (currentStep === 2 && !isPasswordValid(formData.personalPassword))
                ) ? 0.7 : 1
              }}
            >
              {isLoading ? 'Creating Profile...' : currentStep < 4 ? 'Next' : 'Create Profile!'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Component pages
function WelcomePage({ selectedTheme }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      minHeight: '400px'
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        backgroundColor: `${selectedTheme.primary}30`,
        borderRadius: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '60px',
        marginBottom: '32px'
      }}>
        📚
      </div>
      
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: selectedTheme.textPrimary,
        fontFamily: 'Didot, serif',
        lineHeight: '1.2',
        marginBottom: '16px'
      }}>
        Ready for an Amazing<br/>Reading Adventure?
      </h2>
      
      <p style={{
        fontSize: '16px',
        color: `${selectedTheme.textPrimary}CC`,
        lineHeight: '1.4',
        maxWidth: '300px'
      }}>
        Collect saints, unlock achievements, and discover incredible books on your journey!
      </p>
    </div>
  );
}

function InfoPage({ formData, setFormData, selectedTheme, grades }) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: selectedTheme.textPrimary,
        fontFamily: 'Didot, serif',
        marginBottom: '32px'
      }}>
        Tell us about yourself!
      </h2>

      {/* Teacher & School Display */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontSize: '16px',
          fontWeight: '600',
          color: `${selectedTheme.textPrimary}80`,
          display: 'block',
          marginBottom: '8px'
        }}>
          Your Teacher & School
        </label>
        <div style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: `${selectedTheme.surface}50`,
          color: `${selectedTheme.textPrimary}80`,
          fontSize: '14px',
          lineHeight: '1.4'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            👩‍🏫 {formData.teacherName || 'Loading teacher...'}
          </div>
          <div>
            🏫 {formData.schoolName ? `${formData.schoolName} - ${formData.schoolCity}, ${formData.schoolState}` : 'Loading school...'}
          </div>
        </div>
      </div>

      {/* First Name */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontSize: '16px',
          fontWeight: '600',
          color: selectedTheme.textPrimary,
          display: 'block',
          marginBottom: '8px'
        }}>
          What&apos;s your first name?
        </label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          placeholder="Enter your first name"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: selectedTheme.surface,
            color: selectedTheme.textPrimary,
            fontSize: '16px'
          }}
        />
      </div>

      {/* Last Initial */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          fontSize: '16px',
          fontWeight: '600',
          color: selectedTheme.textPrimary,
          display: 'block',
          marginBottom: '8px'
        }}>
          What&apos;s the first letter of your last name?
        </label>
        <input
          type="text"
          value={formData.lastInitial}
          onChange={(e) => setFormData({...formData, lastInitial: e.target.value.toUpperCase().slice(0,1)})}
          placeholder="Just one letter (like &quot;S&quot;)"
          maxLength={1}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: selectedTheme.surface,
            color: selectedTheme.textPrimary,
            fontSize: '16px',
            textTransform: 'uppercase'
          }}
        />
      </div>

      {/* Grade Selection */}
      <div>
        <label style={{
          fontSize: '16px',
          fontWeight: '600',
          color: selectedTheme.textPrimary,
          display: 'block',
          marginBottom: '12px'
        }}>
          What grade are you in?
        </label>
        <div style={{
          backgroundColor: selectedTheme.surface,
          borderRadius: '12px',
          padding: '8px'
        }}>
          {grades.map(grade => (
            <button
              key={grade}
              onClick={() => setFormData({...formData, grade})}
              style={{
                width: '100%',
                padding: '12px',
                margin: '4px 0',
                backgroundColor: formData.grade === grade ? selectedTheme.primary : 'transparent',
                color: selectedTheme.textPrimary,
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {grade}th Grade
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// NEW: Personal Password Page
function PasswordPage({ formData, setFormData, selectedTheme, isPasswordValid }) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: selectedTheme.textPrimary,
        fontFamily: 'Didot, serif',
        marginBottom: '16px'
      }}>
        Create Your Personal Password
      </h2>
      
      <p style={{
        color: `${selectedTheme.textPrimary}CC`,
        fontSize: '16px',
        lineHeight: '1.4',
        marginBottom: '32px'
      }}>
        This is just for you! Make it simple and easy to remember.
      </p>

      <div style={{ marginBottom: '24px' }}>
        <label style={{
          fontSize: '16px',
          fontWeight: '600',
          color: selectedTheme.textPrimary,
          display: 'block',
          marginBottom: '12px',
          textAlign: 'left'
        }}>
          Your Personal Password
        </label>
        
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? "text" : "password"}
            value={formData.personalPassword}
            onChange={(e) => setFormData({
              ...formData, 
              personalPassword: e.target.value.toLowerCase().replace(/[^a-z]/g, '')
            })}
            placeholder="at least 5 letters"
            maxLength={20}
            style={{
              width: '100%',
              padding: '16px',
              paddingRight: '50px',
              borderRadius: '12px',
              border: `2px solid ${isPasswordValid(formData.personalPassword) ? selectedTheme.primary : '#e5e7eb'}`,
              backgroundColor: selectedTheme.surface,
              color: selectedTheme.textPrimary,
              fontSize: '18px',
              fontFamily: 'monospace',
              textAlign: 'center',
              transition: 'border-color 0.2s ease'
            }}
          />
          
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        
        {/* Password Rules */}
        <div style={{
          backgroundColor: `${selectedTheme.primary}10`,
          border: `1px solid ${selectedTheme.primary}30`,
          borderRadius: '8px',
          padding: '12px',
          marginTop: '12px',
          textAlign: 'left'
        }}>
          <p style={{
            fontSize: '14px',
            color: selectedTheme.textPrimary,
            margin: '0 0 8px 0',
            fontWeight: '600'
          }}>
            Password Rules:
          </p>
          <ul style={{
            fontSize: '13px',
            color: `${selectedTheme.textPrimary}CC`,
            margin: 0,
            paddingLeft: '16px'
          }}>
            <li style={{ 
              color: formData.personalPassword.length >= 5 ? '#10b981' : `${selectedTheme.textPrimary}CC`,
              marginBottom: '4px'
            }}>
              At least 5 letters {formData.personalPassword.length >= 5 ? '✓' : ''}
            </li>
            <li style={{ 
              color: /^[a-z]*$/.test(formData.personalPassword) ? '#10b981' : `${selectedTheme.textPrimary}CC`,
              marginBottom: '4px'
            }}>
              Only lowercase letters (a-z) {/^[a-z]*$/.test(formData.personalPassword) ? '✓' : ''}
            </li>
            <li style={{ 
              color: `${selectedTheme.textPrimary}CC`
            }}>
              Easy to remember (like &quot;books&quot; or &quot;reading&quot;)
            </li>
          </ul>
        </div>
      </div>

      {/* Example suggestions */}
      <div style={{
        backgroundColor: `${selectedTheme.accent}20`,
        border: `1px solid ${selectedTheme.accent}50`,
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'left'
      }}>
        <p style={{
          fontSize: '14px',
          fontWeight: '600',
          color: selectedTheme.textPrimary,
          margin: '0 0 8px 0'
        }}>
          💡 Good password ideas:
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          fontSize: '13px',
          color: `${selectedTheme.textPrimary}CC`
        }}>
          <span>books</span>
          <span>reading</span>
          <span>stories</span>
          <span>adventure</span>
          <span>dragons</span>
          <span>unicorn</span>
        </div>
      </div>
    </div>
  );
}

function GoalPage({ formData, setFormData, selectedTheme, bookGoals }) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: selectedTheme.textPrimary,
        fontFamily: 'Didot, serif',
        marginBottom: '16px'
      }}>
        Set Your Reading Goal!
      </h2>
      
      <p style={{
        color: `${selectedTheme.textPrimary}CC`,
        fontSize: '16px',
        lineHeight: '1.4',
        marginBottom: '32px'
      }}>
        How many books do you want to read this year? You can always change this later!
      </p>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: selectedTheme.textPrimary,
          marginBottom: '8px'
        }}>
          Your Reading Goal
        </h3>

        <div style={{
          backgroundColor: selectedTheme.surface,
          borderRadius: '12px',
          border: `2px solid ${selectedTheme.primary}50`,
          padding: '16px',
          maxWidth: '200px',
          margin: '0 auto'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: selectedTheme.primary,
            marginBottom: '4px'
          }}>
            {formData.currentYearGoal}
          </div>
          <div style={{
            fontSize: '12px',
            color: `${selectedTheme.textPrimary}CC`,
            marginBottom: '16px'
          }}>
            {formData.currentYearGoal === 1 ? 'book' : 'books'}
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            {bookGoals.map(goal => (
              <button
                key={goal}
                onClick={() => setFormData({...formData, currentYearGoal: goal})}
                style={{
                  padding: '8px',
                  backgroundColor: formData.currentYearGoal === goal ? selectedTheme.primary : 'transparent',
                  color: selectedTheme.textPrimary,
                  border: `1px solid ${selectedTheme.primary}30`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: `${selectedTheme.accent}20`,
        border: `1px solid ${selectedTheme.accent}50`,
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        textAlign: 'left'
      }}>
        <span style={{ fontSize: '20px', marginRight: '12px' }}>💡</span>
        <span style={{
          color: `${selectedTheme.textPrimary}CC`,
          fontSize: '14px'
        }}>
          Pro tip: Start with a goal that feels exciting but achievable!
        </span>
      </div>
    </div>
  );
}

function ThemePage({ formData, setFormData, themes }) {
  const selectedTheme = themes.find(theme => theme.assetPrefix === formData.selectedTheme);
  
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: selectedTheme.textPrimary,
        fontFamily: 'Didot, serif',
        marginBottom: '8px'
      }}>
        Choose Your Style!
      </h2>
      
      <p style={{
        color: `${selectedTheme.textPrimary}CC`,
        fontSize: '16px',
        marginBottom: '20px'
      }}>
        Pick your bookshelf &amp; trophy case design. You can change it anytime in settings!
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 'clamp(8px, 2vw, 16px)'
      }}>
        {themes.map(theme => {
          const isSelected = theme.assetPrefix === formData.selectedTheme;
          return (
            <button
              key={theme.assetPrefix}
              onClick={() => setFormData({...formData, selectedTheme: theme.assetPrefix})}
              style={{
                padding: 'clamp(8px, 2vw, 12px)',
                backgroundColor: theme.surface,
                border: `${isSelected ? '3px' : '2px'} solid ${isSelected ? theme.primary : `${theme.primary}50`}`,
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isSelected ? `0 8px 24px ${theme.primary}40` : '0 2px 8px rgba(0,0,0,0.1)',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                position: 'relative',
                minWidth: 0
              }}
            >
              <div style={{
                fontSize: 'clamp(11px, 2.5vw, 13px)',
                fontWeight: '600',
                color: theme.textPrimary,
                textAlign: 'center',
                lineHeight: '1.2',
                marginBottom: 'clamp(4px, 1.5vw, 8px)'
              }}>
                {theme.name}
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(3px, 1vw, 6px)',
                alignItems: 'center',
                marginBottom: 'clamp(2px, 1vw, 4px)'
              }}>
                <img 
                  src={`/bookshelves/${theme.assetPrefix}.jpg`}
                  alt={`${theme.name} bookshelf`}
                  style={{
                    width: 'clamp(70px, 18vw, 90px)',
                    height: 'clamp(35px, 9vw, 45px)',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: `1px solid ${theme.primary}30`
                  }}
                />
                <img 
                  src={`/trophy_cases/${theme.assetPrefix}.jpg`}
                  alt={`${theme.name} trophy case`}
                  style={{
                    width: 'clamp(70px, 18vw, 90px)',
                    height: 'clamp(35px, 9vw, 45px)',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: `1px solid ${theme.primary}30`
                  }}
                />
              </div>
              
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: theme.primary,
                  color: 'white',
                  borderRadius: '50%',
                  width: 'clamp(20px, 5vw, 24px)',
                  height: 'clamp(20px, 5vw, 24px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(10px, 2.5vw, 12px)',
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
      
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: `${selectedTheme.primary}15`,
        border: `1px solid ${selectedTheme.primary}30`,
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '14px',
          color: selectedTheme.textPrimary,
          margin: 0
        }}>
          <strong>{selectedTheme.name}</strong> - Your bookshelf and trophy case will look amazing! 📚🏆
        </p>
      </div>
    </div>
  );
}