// pages/student-onboarding.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

export default function StudentOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');
  
  // Student data
  const [formData, setFormData] = useState({
    firstName: '',
    lastInitial: '',
    grade: '4th Grade',
    schoolId: '',
    schoolName: '',
    schoolCity: '',
    schoolState: '',
    population: '', // This will be auto-filled and greyed out
    currentYearGoal: 10,
    selectedTheme: 'classic_lux'
  });

  // Theme definitions matching your Flutter code
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
      primary: '#8B4513',
      secondary: '#D2691E',
      accent: '#FF8C00',
      background: '#F5F5DC',
      surface: '#FFE4B5',
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
      primary: '#66CDAA',
      secondary: '#98FB98',
      accent: '#AFEEEE',
      background: '#F0FFF0',
      surface: '#E0FFE0',
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
      primary: '#90EE90',
      secondary: '#F0FFF0',
      accent: '#98FB98',
      background: '#FFFFF0',
      surface: '#FFFFFF',
      textPrimary: '#2F4F2F'
    }
  ];

  const grades = ['4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade'];
  const bookGoals = Array.from({length: 20}, (_, i) => i + 1);

  useEffect(() => {
    loadSchools();
    loadExistingData();
  }, []);

  const loadExistingData = () => {
    // Pre-populate from account creation flow
    const tempSchoolData = localStorage.getItem('tempSchoolData');
    
    if (tempSchoolData) {
      const parsed = JSON.parse(tempSchoolData);
      setFormData(prev => ({
        ...prev,
        schoolId: parsed.schoolId || '',
        schoolName: parsed.schoolName || '',
        schoolCity: parsed.schoolCity || '',
        schoolState: parsed.schoolState || '',
        population: `${parsed.schoolCity}, ${parsed.schoolState}` // Auto-fill population field
      }));
      
      // Add this school to the schools list if it's not already there
      setSchools(prev => {
        const exists = prev.find(school => school.id === parsed.schoolId);
        if (!exists && parsed.schoolId) {
          return [...prev, {
            id: parsed.schoolId,
            name: parsed.schoolName,
            city: parsed.schoolCity,
            state: parsed.schoolState
          }];
        }
        return prev;
      });
    }
  };

  const loadSchools = async () => {
    try {
      const schoolsCollection = collection(db, 'schools');
      const schoolSnapshot = await getDocs(schoolsCollection);
      const schoolList = schoolSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchools(schoolList);
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  };

  const handleSchoolSelection = async (schoolId) => {
    const selectedSchool = schools.find(s => s.id === schoolId);
    if (selectedSchool) {
      setFormData(prev => ({
        ...prev,
        schoolId: schoolId,
        schoolName: selectedSchool.name,
        schoolCity: selectedSchool.city,
        schoolState: selectedSchool.state,
        population: `${selectedSchool.city}, ${selectedSchool.state}` // Auto-fill population field
      }));
    }
  };

  const generateUsername = async (firstName, lastInitial, grade, schoolCode) => {
    // Extract grade number (4, 5, 6, 7, 8)
    const gradeNum = grade.charAt(0);
    
    // Create base username: EmmaK4
    const baseUsername = `${firstName}${lastInitial}${gradeNum}`;
    
    // Check for existing usernames in this school to avoid duplicates
    const usersCollection = collection(db, 'users');
    const q = query(
      usersCollection, 
      where('schoolId', '==', formData.schoolId)
    );
    const querySnapshot = await getDocs(q);
    
    // Get all existing usernames for this school
    const existingUsernames = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.generatedUsername) {
        // Extract just the username part before @ symbol
        const username = userData.generatedUsername.split('@')[0];
        existingUsernames.push(username);
      }
    });
    
    // Check if base username exists, if so add number
    let finalUsername = baseUsername; // EmmaK4
    let counter = 2; // Start with 2 for first duplicate (EmmaK42)
    
    while (existingUsernames.includes(finalUsername)) {
      finalUsername = `${baseUsername}${counter}`; // EmmaK42, EmmaK43, etc.
      counter++;
    }
    
    // Return full email format: EmmaK4@hfcs2025.luxlibris.app
    return `${finalUsername}@${schoolCode.toLowerCase()}.luxlibris.app`;
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
    try {
      // Get school data from Firebase to get the current join code
      const schoolDoc = await getDoc(doc(db, 'schools', formData.schoolId));
      const schoolData = schoolDoc.data();
      
      if (!schoolData) {
        throw new Error('School not found');
      }
      
      // Generate username with duplicate checking
      const username = await generateUsername(
        formData.firstName, 
        formData.lastInitial, 
        formData.grade, 
        schoolData.currentJoinCode
      );
      
      setGeneratedUsername(username);

      // Create student document in 'users' collection (matching your Firebase structure)
      const studentData = {
        // Authentication fields
        uid: `student_${Date.now()}`, // Temporary UID until Firebase Auth integration
        firstName: formData.firstName,
        lastInitial: formData.lastInitial,
        
        // School linking
        schoolId: formData.schoolId,
        
        // Academic info
        grade: parseInt(formData.grade.charAt(0)), // Store as number: 4, 5, 6, 7, 8
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
        
        // Generated username for display
        generatedUsername: username
      };

      const docRef = await addDoc(collection(db, 'users'), studentData);
      console.log('✅ Student saved to users collection with ID:', docRef.id);
      
      // Store student ID in localStorage for PWA
      localStorage.setItem('studentId', docRef.id);
      localStorage.setItem('studentData', JSON.stringify(studentData));
      
      // Clean up temp data
      localStorage.removeItem('tempSchoolData');
      localStorage.removeItem('luxlibris_account_flow');
      
      // Show success popup first
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error saving your information. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    setIsLoading(false);
    // Redirect to splash screen, then dashboard
    router.push('/splash?type=student');
  };

  const selectedTheme = themes.find(theme => theme.assetPrefix === formData.selectedTheme);

  return (
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
                fontSize: '16px',
                fontWeight: 'bold',
                color: selectedTheme.primary,
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {generatedUsername}
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
        <div style={{ flex: 1 }}>
          {currentStep === 0 && <WelcomePage selectedTheme={selectedTheme} />}
          {currentStep === 1 && (
            <InfoPage 
              formData={formData} 
              setFormData={setFormData} 
              selectedTheme={selectedTheme} 
              grades={grades} 
              schools={schools}
              onSchoolSelect={handleSchoolSelection}
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
            disabled={isLoading || (currentStep === 1 && (!formData.firstName || !formData.lastInitial || !formData.schoolId))}
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
              opacity: (isLoading || (currentStep === 1 && (!formData.firstName || !formData.lastInitial || !formData.schoolId))) ? 0.7 : 1
            }}
          >
            {isLoading ? 'Creating Account...' : currentStep < 3 ? 'Next' : 'Create Account!'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Welcome Page Component
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

// Info Page Component  
function InfoPage({ formData, setFormData, selectedTheme, grades, schools, onSchoolSelect }) {
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

      {/* School Selection - Pre-filled and read-only from account creation */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontSize: '16px',
          fontWeight: '600',
          color: formData.schoolId ? `${selectedTheme.textPrimary}80` : selectedTheme.textPrimary,
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
          backgroundColor: formData.schoolId ? `${selectedTheme.surface}50` : selectedTheme.surface,
          color: formData.schoolId ? `${selectedTheme.textPrimary}80` : selectedTheme.textPrimary,
          fontSize: '16px'
        }}>
          {formData.schoolId ? (
            `${formData.schoolName} - ${formData.schoolCity}, ${formData.schoolState}`
          ) : (
            <select
              value={formData.schoolId}
              onChange={(e) => onSchoolSelect(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                backgroundColor: 'transparent',
                color: selectedTheme.textPrimary,
                fontSize: '16px',
                outline: 'none'
              }}
            >
              <option value="">Select your school</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name} - {school.city}, {school.state}
                </option>
              ))}
            </select>
          )}
        </div>
        {formData.schoolId && (
          <p style={{
            fontSize: '12px',
            color: `${selectedTheme.textPrimary}60`,
            margin: '4px 0 0 0',
            fontStyle: 'italic'
          }}>
            School selected from previous step
          </p>
        )}
      </div>

      {/* Population Field - GREYED OUT and auto-filled */}
      {formData.population && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            fontSize: '16px',
            fontWeight: '600',
            color: `${selectedTheme.textPrimary}80`,
            display: 'block',
            marginBottom: '8px'
          }}>
            School Location
          </label>
          <input
            type="text"
            value={formData.population}
            disabled={true}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: `${selectedTheme.surface}50`,
              color: `${selectedTheme.textPrimary}60`,
              fontSize: '16px',
              cursor: 'not-allowed'
            }}
          />
          <p style={{
            fontSize: '12px',
            color: `${selectedTheme.textPrimary}60`,
            margin: '4px 0 0 0',
            fontStyle: 'italic'
          }}>
            Automatically filled from your school
          </p>
        </div>
      )}

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
              {grade}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Goal Page Component
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
        <p style={{
          color: `${selectedTheme.textPrimary}CC`,
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          How many books from our list?
        </p>

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

// Theme Page Component
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px'
      }}>
        {themes.map(theme => {
          const isSelected = theme.assetPrefix === formData.selectedTheme;
          return (
            <button
              key={theme.assetPrefix}
              onClick={() => setFormData({...formData, selectedTheme: theme.assetPrefix})}
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
                height: '80px',
                borderRadius: '8px',
                marginBottom: '8px',
                backgroundImage: `url(/bookshelves/${theme.assetPrefix}.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: `${theme.primary}20`
              }} />
              
              {/* Trophy Case Preview */}
              <div style={{
                width: '100%',
                height: '60px',
                borderRadius: '6px',
                marginBottom: '12px',
                backgroundImage: `url(/trophy_cases/${theme.assetPrefix}.png)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: `${theme.accent}20`
              }} />
              
              {/* Theme Name */}
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: theme.textPrimary,
                textAlign: 'center',
                lineHeight: '1.2',
                marginBottom: '4px'
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
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
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