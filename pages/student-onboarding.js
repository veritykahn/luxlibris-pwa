// pages/student-onboarding.js - FIXED for Diocese Structure
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, authHelpers, dbHelpers } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
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
    schoolId: '',
    dioceseId: '',
    schoolName: '',
    schoolCity: '',
    schoolState: '',
    studentAccessCode: '',
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
    name: 'Little Luminaries™',
    assetPrefix: 'little_luminaries',
  primary: '#000000',        // Black (striking black accents/buttons)
  secondary: '#666666',      // Medium grey 
  accent: '#E8E8E8',         // Light grey accent
  background: '#FFFFFF',     // White background (main content)
  surface: '#000000',        // Black surface (navigation)
  textPrimary: '#CCCCCC',    // Light grey text (for dark surfaces like black nav)
  }
  ];

  const grades = [4, 5, 6, 7, 8];
  const bookGoals = Array.from({length: 20}, (_, i) => i + 1);

  useEffect(() => {
    loadSchoolDataFromStorage();
  }, []);

  const loadSchoolDataFromStorage = () => {
    // Load school data from student account creation flow
    const tempSchoolData = localStorage.getItem('tempSchoolData');
    
    if (tempSchoolData) {
      const parsed = JSON.parse(tempSchoolData);
      console.log('📚 Loading school data from account creation:', parsed);
      
      setFormData(prev => ({
        ...prev,
        schoolId: parsed.schoolId || '',
        dioceseId: parsed.dioceseId || '',
        schoolName: parsed.schoolName || '',
        schoolCity: parsed.schoolCity || '',
        schoolState: parsed.schoolState || '',
        studentAccessCode: parsed.schoolJoinCode || ''
      }));
    } else {
      console.warn('⚠️ No temp school data found - student may have accessed onboarding directly');
      setError('Please start from the account creation page');
    }
  };

  const generateUsername = async (firstName, lastInitial, grade, schoolData) => {
    try {
      console.log('🔄 Generating username for:', firstName, lastInitial, grade);
      
      // Create base username: EmmaK4
      const baseUsername = `${firstName}${lastInitial}${grade}`;
      
      // Check for existing usernames in this school's students subcollection
      const studentsCollection = collection(db, `dioceses/${schoolData.dioceseId}/schools/${schoolData.id}/students`);
      const querySnapshot = await getDocs(studentsCollection);
      
      // Get all existing usernames for this school
      const existingUsernames = [];
      querySnapshot.forEach((doc) => {
        const studentData = doc.data();
        if (studentData.displayUsername) {
          existingUsernames.push(studentData.displayUsername);
        }
      });
      
      console.log('📋 Existing usernames in school:', existingUsernames);
      
      // Check if base username exists, if so add number
      let finalUsername = baseUsername; // EmmaK4
      let counter = 2; // Start with 2 for first duplicate (EmmaK42)
      
      while (existingUsernames.includes(finalUsername)) {
        finalUsername = `${baseUsername}${counter}`; // EmmaK42, EmmaK43, etc.
        counter++;
      }
      
      console.log('✅ Generated unique username:', finalUsername);
      return finalUsername;
    } catch (error) {
      console.error('❌ Error generating username:', error);
      throw error;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
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

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🚀 Starting account creation process...');
      
      // Validate required data
      if (!formData.firstName || !formData.lastInitial || !formData.schoolId || !formData.dioceseId) {
        throw new Error('Missing required information');
      }

      // Get school data from Firebase to verify it exists
      const schoolRef = doc(db, `dioceses/${formData.dioceseId}/schools`, formData.schoolId);
      const schoolDoc = await getDoc(schoolRef);
      
      if (!schoolDoc.exists()) {
        throw new Error('School not found in database');
      }
      
      const schoolData = {
        id: formData.schoolId,
        dioceseId: formData.dioceseId,
        ...schoolDoc.data()
      };
      
      console.log('✅ School data verified:', schoolData.name);
      
      // Generate unique username
      const displayUsername = await generateUsername(
        formData.firstName, 
        formData.lastInitial, 
        formData.grade, 
        schoolData
      );
      
      setGeneratedUsername(displayUsername);

      // 🔥 CREATE FIREBASE AUTH ACCOUNT using new system
      console.log('🔐 Creating Firebase Auth account...');
      const authResult = await authHelpers.createStudentAccount(
        formData.firstName,
        formData.lastInitial,
        formData.grade,
        schoolData
      );

      console.log('✅ Firebase Auth account created with UID:', authResult.uid);

      // Create student document in proper diocese structure
      const studentData = {
        // Authentication fields
        uid: authResult.uid,
        authEmail: authResult.email,
        firstName: formData.firstName,
        lastInitial: formData.lastInitial,
        displayUsername: displayUsername,
        
        // School linking
        schoolId: formData.schoolId,
        dioceseId: formData.dioceseId,
        schoolName: formData.schoolName,
        
        // Academic info
        grade: parseInt(formData.grade),
        personalGoal: formData.currentYearGoal,
        
        // Customization
        selectedTheme: formData.selectedTheme,
        
        // Progress tracking
        thisYearBooks: 0,
        lifetimeBooks: 0,
        saintUnlocks: [],
        
        // Reading habits
        readingStreaks: { 
          current: 0, 
          longest: 0,
          lastReadingDate: null 
        },
        
        // Historical data for retroactive credit
        historicalBooksSubmitted: {},
        
        // Metadata
        accountCreated: new Date(),
        onboardingCompleted: true,
        accountType: 'student'
      };

      // 🎯 SAVE TO PROPER DIOCESE STRUCTURE
      console.log('💾 Saving student to diocese structure...');
      const studentDocRef = await addDoc(
        collection(db, `dioceses/${formData.dioceseId}/schools/${formData.schoolId}/students`), 
        studentData
      );
      
      console.log('✅ Student saved to diocese structure with ID:', studentDocRef.id);
      
      // 🔥 ALSO CREATE GLOBAL USER PROFILE (for AuthContext compatibility)
      const globalUserProfile = {
        uid: authResult.uid,
        firstName: formData.firstName,
        lastInitial: formData.lastInitial,
        displayUsername: displayUsername,
        schoolId: formData.schoolId,
        dioceseId: formData.dioceseId,
        schoolName: formData.schoolName,
        accountType: 'student',
        onboardingCompleted: true,
        accountCreated: new Date(),
        // Reference to the actual student record
        studentDocId: studentDocRef.id,
        studentDocPath: `dioceses/${formData.dioceseId}/schools/${formData.schoolId}/students/${studentDocRef.id}`
      };
      
      await addDoc(collection(db, 'users'), globalUserProfile);
      console.log('✅ Global user profile created');
      
      // Store in localStorage for app usage
      localStorage.setItem('studentId', studentDocRef.id);
      localStorage.setItem('studentData', JSON.stringify(studentData));
      
      // Clean up temp data
      localStorage.removeItem('tempSchoolData');
      localStorage.removeItem('luxlibris_account_flow');
      
      console.log('🎉 Account creation completed successfully!');
      
      // Show success popup
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      setError(`Account creation failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    setIsLoading(false);
    // Redirect to student dashboard (user is already signed in)
    router.push('/student-dashboard');
  };

  const selectedTheme = themes.find(theme => theme.assetPrefix === formData.selectedTheme);

  return (
  <>
    <Head>
      <title>Welcome to Lux Libris - Student Setup</title>
      <meta name="description" content="Set up your reading profile and join your school's program" />
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
              Welcome to Lux Libris!
            </h2>
            <p style={{
              fontSize: '16px',
              color: `${selectedTheme.textPrimary}CC`,
              marginBottom: '24px'
            }}>
              Your account has been created successfully!
            </p>
            <div style={{
              backgroundColor: `${selectedTheme.primary}20`,
              border: `1px solid ${selectedTheme.primary}50`,
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
                Your Lux Libris Username:
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
              <p style={{
                fontSize: '12px',
                color: `${selectedTheme.textPrimary}CC`,
                fontStyle: 'italic'
              }}>
                Remember this! You&apos;ll use it with your school code to sign in.
              </p>
            </div>
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
                Your School Code (Password):
              </p>
              <p style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: selectedTheme.primary,
                fontFamily: 'monospace'
              }}>
                {formData.studentAccessCode}
              </p>
            </div>
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
              Start My Reading Journey!
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
          {[0, 1, 2, 3].map(step => (
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
          {currentStep === 2 && (
            <GoalPage 
              formData={formData} 
              setFormData={setFormData} 
              selectedTheme={selectedTheme} 
              bookGoals={bookGoals} 
            />
          )}
          {currentStep === 3 && (
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
            disabled={isLoading || (currentStep === 1 && (!formData.firstName || !formData.lastInitial))}
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
              opacity: (isLoading || (currentStep === 1 && (!formData.firstName || !formData.lastInitial))) ? 0.7 : 1
            }}
          >
            {isLoading ? 'Creating Account...' : currentStep < 3 ? 'Next' : 'Create Account!'}
          </button>
        </div>
      </div>
    </div>
  </>
);
}

// Component pages (simplified for diocese structure)
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

      {/* School Display - Pre-filled from account creation */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontSize: '16px',
          fontWeight: '600',
          color: `${selectedTheme.textPrimary}80`,
          display: 'block',
          marginBottom: '8px'
        }}>
          Your School
        </label>
        <div style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: `${selectedTheme.surface}50`,
          color: `${selectedTheme.textPrimary}80`,
          fontSize: '16px'
        }}>
          {formData.schoolName ? `${formData.schoolName} - ${formData.schoolCity}, ${formData.schoolState}` : 'Loading school...'}
        </div>
        <p style={{
          fontSize: '12px',
          color: `${selectedTheme.textPrimary}60`,
          margin: '4px 0 0 0',
          fontStyle: 'italic'
        }}>
          Confirmed from account creation
        </p>
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
              {grade}{grade === 4 ? 'th' : grade === 5 ? 'th' : grade === 6 ? 'th' : grade === 7 ? 'th' : 'th'} Grade
            </button>
          ))}
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

        {/* Goal Picker */}
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

      {/* Pro Tip */}
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
              {/* Theme Name */}
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
              
              {/* Theme Preview Images */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(3px, 1vw, 6px)',
                alignItems: 'center',
                marginBottom: 'clamp(2px, 1vw, 4px)'
              }}>
                {/* Bookshelf Preview */}
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
                {/* Trophy Case Preview */}
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
              
              {/* Selected Indicator */}
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
      
      {/* Selected Theme Info */}
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