// pages/home/sign-in.js - FIXED: Added failsafe for students who skipped first sign-in

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { authHelpers, dbHelpers, auth, db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ForgotPasswordModal } from '../../components/ForgotPasswordModal';

export default function SignIn() {
  const router = useRouter();
  const { userProfile, getDashboardUrl } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [waitingForProfile, setWaitingForProfile] = useState(false);
  const [error, setError] = useState('');
  const [showSessionExpiredMessage, setShowSessionExpiredMessage] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Input validation errors
  const [usernameError, setUsernameError] = useState('');
  const [teacherCodeError, setTeacherCodeError] = useState('');

  const [formData, setFormData] = useState({
    accountType: '',
    username: '',
    teacherCode: '',
    personalPassword: '',
    email: '',
    password: '',
    teacherJoinCode: ''
  });

  // Check for session expired message
  useEffect(() => {
    if (router.query.reason === 'session-expired') {
      setShowSessionExpiredMessage(true);
    }
  }, [router.query]);

  // Wait for userProfile to load, then redirect
  useEffect(() => {
    if (waitingForProfile && userProfile) {
      console.log('✅ User profile loaded, redirecting...');
      
      // Check for incomplete account flag
      const isIncompleteAccount = typeof window !== 'undefined' && 
        localStorage.getItem('luxlibris_incomplete_account') === 'true';
      
      if (isIncompleteAccount) {
        console.log('🔧 Redirecting incomplete account to onboarding');
        localStorage.removeItem('luxlibris_incomplete_account');
        
        if (userProfile.accountType === 'parent') {
          router.push('/parent/onboarding');
        } else {
          // Fallback to normal dashboard URL for other account types
          const dashboardUrl = getDashboardUrl();
          router.push(dashboardUrl);
        }
      } else {
        const dashboardUrl = getDashboardUrl();
        router.push(dashboardUrl);
      }
    }
  }, [waitingForProfile, userProfile, getDashboardUrl, router]);

  // Safety timeout if profile takes too long
  useEffect(() => {
    if (waitingForProfile) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Profile loading timeout, redirecting to fallback');
        if (formData.accountType === 'student') {
          router.push('/student-dashboard');
        } else if (formData.accountType === 'educator') {
          router.push('/admin/school-dashboard');
        } else if (formData.accountType === 'parent') {
          router.push('/parent/dashboard');
        }
      }, 8000);

      return () => clearTimeout(timeout);
    }
  }, [waitingForProfile, formData.accountType, router]);

  const accountTypes = [
    {
      type: 'student',
      title: 'Student',
      icon: '📚',
      description: 'Sign in with your username, teacher code, and personal password',
      buttonText: 'Student Sign In'
    },
    {
      type: 'educator',
      title: 'Teacher/Librarian',
      icon: '👨‍💼',
      description: 'Manage your school\'s reading program',
      buttonText: 'Teacher/Librarian Sign In'
    },
    {
      type: 'parent',
      title: 'Parent/Guardian',
      icon: '👨‍👩‍👧‍👦',
      description: 'Track your child\'s reading progress and family activities',
      buttonText: 'Parent Sign In'
    }
  ];

  const handleAccountTypeSelect = (type) => {
    setFormData({ ...formData, accountType: type });
    setError('');
    setShowSessionExpiredMessage(false);
    setStep(2);
  };

  // Handle username input - remove spaces and special characters
  const handleUsernameChange = (e) => {
    const input = e.target.value;
    // Remove all spaces and keep only alphanumeric characters
    const cleaned = input.replace(/\s/g, '');
    
    // Set error if user tried to type spaces
    if (input !== cleaned) {
      setUsernameError('No spaces allowed in username');
    } else {
      setUsernameError('');
    }
    
    setFormData(prev => ({ 
      ...prev, 
      username: cleaned 
    }));
  };

  // Handle teacher code input - uppercase and remove spaces
  const handleTeacherCodeChange = (e) => {
    const input = e.target.value.toUpperCase();
    // Remove all spaces
    const cleaned = input.replace(/\s/g, '');
    
    // Set error if user tried to type spaces
    if (input !== cleaned) {
      setTeacherCodeError('No spaces allowed in teacher code');
    } else {
      setTeacherCodeError('');
    }
    
    setFormData(prev => ({ 
      ...prev, 
      teacherCode: cleaned 
    }));
  };

  // Handle educator teacher join code - uppercase and remove spaces
  const handleEducatorJoinCodeChange = (e) => {
    const input = e.target.value.toUpperCase();
    // Remove all spaces
    const cleaned = input.replace(/\s/g, '');
    
    setFormData(prev => ({ 
      ...prev, 
      teacherJoinCode: cleaned 
    }));
  };

  // Validate personal password
  const isPasswordValid = (password) => {
    return password && password.length >= 5 && /^[a-z]+$/.test(password);
  };

  // Find student record by username and teacher code (copied from student-sign-in.js)
  const findStudentByUsernameAndTeacherCode = async (username, teacherCode) => {
    try {
      console.log('🔍 Searching for student record:', username, teacherCode);
      
      // Search all entities for student with matching username and signInCode
      const entitiesRef = collection(db, 'entities');
      const entitiesSnapshot = await getDocs(entitiesRef);
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id;
        console.log(`🔍 Searching entity: ${entityId}`);
        
        try {
          const schoolsRef = collection(db, `entities/${entityId}/schools`);
          const schoolsSnapshot = await getDocs(schoolsRef);
          
          for (const schoolDoc of schoolsSnapshot.docs) {
            const schoolId = schoolDoc.id;
            console.log(`🔍 Searching school: ${schoolId}`);
            
            try {
              const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
              const studentQuery = query(
                studentsRef,
                where('displayUsername', '==', username),
                where('signInCode', '==', teacherCode)
              );
              const studentSnapshot = await getDocs(studentQuery);
              
              if (!studentSnapshot.empty) {
                const studentDoc = studentSnapshot.docs[0];
                console.log('✅ Found student record:', studentDoc.id);
                return {
                  id: studentDoc.id,
                  entityId,
                  schoolId,
                  ...studentDoc.data()
                };
              }
            } catch (studentError) {
              console.log(`No students found in school ${schoolId}`);
            }
          }
        } catch (schoolError) {
          console.log(`No schools found in entity ${entityId}`);
        }
      }
      
      console.log('❌ Student record not found');
      return null;
    } catch (error) {
      console.error('❌ Error searching for student:', error);
      return null;
    }
  };

  // Validate personal password
  const validatePersonalPassword = (studentRecord, inputPassword) => {
    // Check if student has a personal password set
    if (!studentRecord.personalPassword) {
      console.log('❌ Student missing personal password');
      return { valid: false, error: 'Personal password not found. Please contact your teacher.' };
    }
    
    // Validate password
    const isValid = studentRecord.personalPassword === inputPassword.toLowerCase();
    console.log(`🔐 Personal password validation: ${isValid ? 'SUCCESS' : 'FAILED'}`);
    
    return { valid: isValid, error: isValid ? null : 'Personal password is incorrect' };
  };

  // Enhanced student sign-in with failsafe for first-time users
  const performStudentSignIn = async () => {
    try {
      console.log('🔐 Starting enhanced student sign-in process...');
      console.log('👤 Username:', formData.username);
      console.log('🏫 Teacher Code:', formData.teacherCode);

      // Step 1: Find existing student record in database
      console.log('📚 Step 1: Finding student record...');
      const studentRecord = await findStudentByUsernameAndTeacherCode(
        formData.username, 
        formData.teacherCode.toUpperCase()
      );
      
      if (!studentRecord) {
        throw new Error('Username or teacher code is incorrect. Please check your information and try again.');
      }

      console.log('✅ Student record found:', studentRecord.firstName);
      console.log('🔍 Student needs first sign-in:', studentRecord.needsFirstSignIn);

      // Step 2: Validate personal password
      console.log('🔐 Step 2: Validating personal password...');
      const passwordCheck = validatePersonalPassword(studentRecord, formData.personalPassword);
      
      if (!passwordCheck.valid) {
        throw new Error(passwordCheck.error);
      }

      // Step 3: Check if Firebase Auth account exists (failsafe detection)
      const studentEmail = `${formData.username.toLowerCase()}@${formData.teacherCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}.luxlibris.app`;
      
      if (!studentRecord.uid || studentRecord.needsFirstSignIn) {
        console.log('🆕 FAILSAFE DETECTED: Student needs Firebase Auth account creation');
        
        // Create Firebase Auth user (same as in student-sign-in.js)
        console.log('🔐 Step 3a: Creating Firebase Auth user...');
        let firebaseUser;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, formData.teacherCode);
          firebaseUser = userCredential.user;
          console.log('✅ Firebase Auth user created:', firebaseUser.uid);
        } catch (authError) {
          console.error('❌ Firebase Auth error:', authError);
          if (authError.code === 'auth/email-already-in-use') {
            // If email exists, try to sign in instead
            console.log('📧 Email exists, attempting sign-in...');
            try {
              const signInCredential = await signInWithEmailAndPassword(auth, studentEmail, formData.teacherCode);
              firebaseUser = signInCredential.user;
              console.log('✅ Successfully signed in existing Firebase Auth user:', firebaseUser.uid);
            } catch (signInError) {
              throw new Error('Account exists but sign-in failed. Please contact your teacher for help.');
            }
          } else if (authError.code === 'auth/weak-password') {
            throw new Error('Teacher code is too short. Please contact your teacher.');
          } else {
            throw new Error('Failed to create your account. Please try again or contact your teacher.');
          }
        }

        // Update student record with Firebase UID and first sign-in completion
        console.log('💾 Step 3b: Updating student record with UID...');
        try {
          const studentRef = doc(db, `entities/${studentRecord.entityId}/schools/${studentRecord.schoolId}/students`, studentRecord.id);
          await updateDoc(studentRef, {
            uid: firebaseUser.uid,
            needsFirstSignIn: false,
            lastSignIn: new Date()
          });
          console.log('✅ Student record updated with UID and first sign-in completion');
        } catch (updateError) {
          console.error('❌ Database update error:', updateError);
          throw new Error('Account created but failed to link to your profile. Please contact your teacher.');
        }

        console.log('🎉 First-time sign-in completed successfully via failsafe!');
        
      } else {
        // Regular sign-in for students who already have Firebase Auth accounts
        console.log('🔐 Step 3: Regular Firebase Auth sign-in...');
        try {
          await signInWithEmailAndPassword(auth, studentEmail, formData.teacherCode);
          console.log('✅ Regular Firebase Auth sign-in successful');
          
          // Update last sign-in timestamp
          const studentRef = doc(db, `entities/${studentRecord.entityId}/schools/${studentRecord.schoolId}/students`, studentRecord.id);
          await updateDoc(studentRef, {
            lastSignIn: new Date()
          });
        } catch (signInError) {
          console.error('❌ Regular sign-in failed:', signInError);
          throw new Error('Sign-in failed. Please check your teacher code or contact your teacher.');
        }
      }
      
      console.log('✅ Student sign-in process completed - waiting for profile to load');
      
    } catch (error) {
      console.error('❌ Student sign-in error:', error);
      throw error;
    }
  };

  // Perform parent sign-in and check completion status
  const performParentSignIn = async () => {
    try {
      console.log('🔐 Starting parent sign-in process...');
      console.log('📧 Email:', formData.email);

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email.trim(), 
        formData.password
      );
      
      console.log('✅ Firebase sign-in successful:', userCredential.user.uid);

      // Check if parent account is incomplete
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      
      const parentRef = doc(db, 'parents', userCredential.user.uid);
      const parentDoc = await getDoc(parentRef);
      
      if (parentDoc.exists()) {
        const parentData = parentDoc.data();
        console.log('👤 Parent account status:', {
          onboardingCompleted: parentData.onboardingCompleted,
          hasParentProfile: !!parentData.parentProfile,
          hasFamilyId: !!parentData.familyId,
          hasReadingGoals: !!parentData.readingGoals
        });
        
        // If account is incomplete, set flag for immediate redirect
        if (!parentData.onboardingCompleted || !parentData.parentProfile || !parentData.readingGoals) {
          console.log('🔧 Detected incomplete parent account - will redirect to onboarding');
          if (typeof window !== 'undefined') {
            localStorage.setItem('luxlibris_incomplete_account', 'true');
          }
        }
      }

    } catch (error) {
      console.error('❌ Parent sign-in error:', error);
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          throw new Error('No account found with this email address. Please check your email or create a new account.');
        case 'auth/wrong-password':
          throw new Error('Incorrect password. Please try again.');
        case 'auth/invalid-email':
          throw new Error('Please enter a valid email address.');
        case 'auth/too-many-requests':
          throw new Error('Too many failed attempts. Please wait a moment and try again.');
        case 'auth/user-disabled':
          throw new Error('This account has been disabled. Please contact support.');
        case 'auth/invalid-credential':
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        default:
          throw new Error('Failed to sign in. Please try again or contact support.');
      }
    }
  };

  const handleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      if (formData.accountType === 'student') {
        if (!formData.username.trim() || !formData.teacherCode.trim()) {
          setError('Please enter your username and teacher code');
          setLoading(false);
          return;
        }

        if (!formData.personalPassword.trim()) {
          setError('Please enter your personal password');
          setLoading(false);
          return;
        }

        // Handle student sign-in with failsafe
        await performStudentSignIn();
        
      } else if (formData.accountType === 'educator') {
        if (!formData.email || !formData.password || !formData.teacherJoinCode) {
          setError('Please enter email, password, and teacher join code');
          setLoading(false);
          return;
        }

        console.log('🔐 Attempting educator sign-in...');
        console.log('📧 Email:', formData.email);
        console.log('🏫 Teacher Join Code:', formData.teacherJoinCode);

        // Use the teacher verification function
        const teacherAccess = await dbHelpers.verifyTeacherAccess(formData.email, formData.teacherJoinCode.toUpperCase());
        if (!teacherAccess.valid) {
          setError(teacherAccess.error);
          setLoading(false);
          return;
        }

        await authHelpers.signIn(formData.email, formData.password);
        
        console.log('✅ Educator sign-in successful - waiting for profile to load');
        
      } else if (formData.accountType === 'parent') {
        if (!formData.email.trim() || !formData.password.trim()) {
          setError('Please enter your email and password');
          setLoading(false);
          return;
        }

        // Handle parent sign-in
        await performParentSignIn();
      }

      // After successful authentication, wait for profile
      setLoading(false);
      setWaitingForProfile(true);

    } catch (error) {
      console.error('❌ Sign in error:', error);
      setError(error.message || 'Sign in failed. Please check your information and try again.');
      setLoading(false);
      setWaitingForProfile(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(1);
      setError('');
      setShowSessionExpiredMessage(false);
      setUsernameError('');
      setTeacherCodeError('');
    } else {
      router.push('/');
    }
  };

  // Show loading state while waiting for profile
  if (waitingForProfile) {
    return (
      <>
        <Head>
          <title>Loading Account - Lux Libris</title>
          <meta name="description" content="Loading your Lux Libris account" />
          <link rel="icon" href="/images/lux_libris_logo.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FFFCF5 0%, #ADD4EA 50%, #C3E0DE 100%)',
          fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          letterSpacing: '0.12em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            background: 'white',
            borderRadius: '1.5rem',
            padding: 'clamp(1.5rem, 5vw, 2.5rem)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '1.75rem'
            }}>
              ⏳
            </div>
            
            <h1 style={{
              fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 1rem 0',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '0.02em'
            }}>
              Loading Your Account...
            </h1>
            
            <p style={{
              color: '#223848',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: '0 0 2rem 0',
              lineHeight: '1.4'
            }}>
              Setting up your personalized dashboard
            </p>

            <div style={{
              width: '3rem',
              height: '3rem',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #ADD4EA',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Sign In - Lux Libris</title>
        <meta name="description" content="Sign in to access your Lux Libris reading journey" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #ADD4EA 50%, #C3E0DE 100%)',
        fontFamily: 'Avenir, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        letterSpacing: '0.12em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '28rem',
          width: '100%',
          background: 'white',
          borderRadius: '1.5rem',
          padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.75rem'
            }}>
              🔑
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 0.5rem 0',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '0.02em'
            }}>
              Welcome Back!
            </h1>
            <p style={{
              color: '#223848',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Sign in to continue your reading journey
            </p>
          </div>

          {/* Session Expired Message */}
          {showSessionExpiredMessage && (
            <div style={{
              background: '#fef3cd',
              border: '1px solid #f59e0b',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem'
            }}>
              <p style={{
                color: '#223848',
                fontSize: '0.875rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ⏰ <strong>Session Expired:</strong> Your educator session timed out after 1 hour. Please sign in again.
              </p>
            </div>
          )}

          {/* Step 1: Account Type Selection */}
          {step === 1 && (
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#223848',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                How are you using Lux Libris?
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {accountTypes.map(account => (
                  <button
                    key={account.type}
                    onClick={() => handleAccountTypeSelect(account.type)}
                    style={{
                      padding: '1.25rem',
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#ADD4EA';
                      e.target.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ fontSize: '2rem' }}>{account.icon}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#223848',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {account.title}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#223848',
                        margin: 0,
                        lineHeight: '1.3'
                      }}>
                        {account.description}
                      </p>
                    </div>
                    <div style={{
                      color: '#ADD4EA',
                      fontSize: '1.25rem'
                    }}>
                      →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Sign In Form */}
          {step === 2 && (
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#223848',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {accountTypes.find(a => a.type === formData.accountType)?.buttonText}
              </h2>

              {/* Student Sign In */}
              {formData.accountType === 'student' && (
                <div>
                  <p style={{
                    color: '#223848',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    lineHeight: '1.4'
                  }}>
                    Enter your username, teacher code, and personal password to sign in
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      marginBottom: '0.5rem'
                    }}>
                      Your Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={handleUsernameChange}
                      placeholder="EmmaK4SMIT"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: usernameError ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        color: '#223848',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => {
                        if (!usernameError) e.target.style.borderColor = '#ADD4EA';
                      }}
                      onBlur={(e) => {
                        if (!usernameError) e.target.style.borderColor = '#e5e7eb';
                      }}
                    />
                    {usernameError && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        margin: '0.25rem 0 0 0',
                        textAlign: 'center'
                      }}>
                        ⚠️ {usernameError}
                      </p>
                    )}
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#223848',
                      margin: '0.5rem 0 0 0',
                      textAlign: 'center'
                    }}>
                      This was shown when you created your account
                    </p>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      marginBottom: '0.5rem'
                    }}>
                      Teacher Code
                    </label>
                    <input
                      type="text"
                      value={formData.teacherCode}
                      onChange={handleTeacherCodeChange}
                      placeholder="LUXLIB-SCHOOL-SMITH25-STUDENT"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: teacherCodeError ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em',
                        color: '#223848',
                        backgroundColor: 'white',
                        textTransform: 'uppercase'
                      }}
                      onFocus={(e) => {
                        if (!teacherCodeError) e.target.style.borderColor = '#ADD4EA';
                      }}
                      onBlur={(e) => {
                        if (!teacherCodeError) e.target.style.borderColor = '#e5e7eb';
                      }}
                    />
                    {teacherCodeError && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        margin: '0.25rem 0 0 0',
                        textAlign: 'center'
                      }}>
                        ⚠️ {teacherCodeError}
                      </p>
                    )}
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#223848',
                      margin: '0.5rem 0 0 0',
                      textAlign: 'center'
                    }}>
                      This is the code your teacher gave you
                    </p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      marginBottom: '0.5rem'
                    }}>
                      Your Personal Password
                    </label>
                    <input
                      type="password"
                      value={formData.personalPassword}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        personalPassword: e.target.value.toLowerCase().replace(/[^a-z]/g, '')
                      }))}
                      placeholder="your personal password"
                      maxLength={20}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                        color: '#223848',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#223848',
                      margin: '0.5rem 0 0 0',
                      textAlign: 'center'
                    }}>
                      The simple password you chose (lowercase letters only)
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(173, 212, 234, 0.1)',
                    border: '1px solid rgba(173, 212, 234, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <p style={{
                      color: '#223848',
                      fontSize: '0.875rem',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      🔐 <strong>Secure Sign-In:</strong> Your username and teacher code identify you, and your personal password keeps your account safe! <em>(Works even if you skipped signing in after account creation)</em>
                    </p>
                  </div>
                </div>
              )}

              {/* Educator Sign In */}
              {formData.accountType === 'educator' && (
                <div>
                  <p style={{
                    color: '#223848',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    lineHeight: '1.4'
                  }}>
                    Sign in with your teacher/librarian account credentials
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      marginBottom: '0.5rem'
                    }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        email: e.target.value 
                      }))}
                      placeholder="teacher@school.edu"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        color: '#223848',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      marginBottom: '0.5rem'
                    }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        password: e.target.value 
                      }))}
                      placeholder="Your chosen password"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        color: '#223848',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Forgot Password Link for Teachers */}
                  <div style={{ textAlign: 'right', marginTop: '0.5rem', marginBottom: '1rem' }}>
                    <button
                      onClick={() => {
                        if (!formData.email?.trim()) {
                          setError('Please enter your email address first');
                          return;
                        }
                        setShowForgotPassword(true);
                      }}
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ADD4EA',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      marginBottom: '0.5rem'
                    }}>
                      Teacher Join Code
                    </label>
                    <input
                      type="text"
                      value={formData.teacherJoinCode}
                      onChange={handleEducatorJoinCodeChange}
                      placeholder="TXTEST-DEMO-TEACHER-2025"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em',
                        color: '#223848',
                        backgroundColor: 'white',
                        textTransform: 'uppercase'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#223848',
                      margin: '0.5rem 0 0 0',
                      textAlign: 'center'
                    }}>
                      Use the code from your school administrator
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <p style={{
                      color: '#223848',
                      fontSize: '0.875rem',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      👩‍🏫 <strong>Teacher/Librarian Access:</strong> Use the same teacher join code you used when you created your account.
                    </p>
                  </div>
                </div>
              )}

              {/* Parent Sign In */}
              {formData.accountType === 'parent' && (
                <div>
                  <p style={{
                    color: '#223848',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    lineHeight: '1.4'
                  }}>
                    Welcome back! Sign in to access your family dashboard
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      marginBottom: '0.5rem'
                    }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        email: e.target.value 
                      }))}
                      placeholder="parent@example.com"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        color: '#223848',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      marginBottom: '0.5rem'
                    }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        password: e.target.value 
                      }))}
                      placeholder="Your password"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        color: '#223848',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && formData.email.trim() && formData.password.trim()) {
                          handleSignIn()
                        }
                      }}
                    />
                  </div>

                  {/* Forgot Password Link */}
                  <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                    <button
                      onClick={() => {
                        if (!formData.email?.trim()) {
                          setError('Please enter your email address first');
                          return;
                        }
                        setShowForgotPassword(true);
                      }}
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ADD4EA',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div style={{
                    background: 'rgba(173, 212, 234, 0.1)',
                    border: '1px solid rgba(173, 212, 234, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <p style={{
                      color: '#223848',
                      fontSize: '0.875rem',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      👨‍👩‍👧‍👦 <strong>Family Dashboard:</strong> Track your children&apos;s reading progress, approve quiz codes, and participate in family reading battles!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleBack}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.875rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                minHeight: '48px',
                minWidth: '100px'
              }}
            >
              Back
            </button>
            
            {step === 2 && (
              <button
                onClick={handleSignIn}
                disabled={
                  loading || 
                  (formData.accountType === 'student' && (
                    !formData.username.trim() || 
                    !formData.teacherCode.trim() || 
                    !formData.personalPassword.trim()
                  )) ||
                  (formData.accountType === 'educator' && (
                    !formData.email.trim() || 
                    !formData.password.trim() || 
                    !formData.teacherJoinCode.trim()
                  )) ||
                  (formData.accountType === 'parent' && (
                    !formData.email.trim() || 
                    !formData.password.trim()
                  ))
                }
                style={{
                  flex: 2,
                  padding: '0.875rem 1.5rem',
                  background: loading 
                    ? '#d1d5db' 
                    : 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                  color: '#223848',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: (
                    loading || 
                    (formData.accountType === 'student' && (
                      !formData.username.trim() || 
                      !formData.teacherCode.trim() || 
                      !formData.personalPassword.trim()
                    )) ||
                    (formData.accountType === 'educator' && (
                      !formData.email.trim() || 
                      !formData.password.trim() || 
                      !formData.teacherJoinCode.trim()
                    )) ||
                    (formData.accountType === 'parent' && (
                      !formData.email.trim() || 
                      !formData.password.trim()
                    ))
                  ) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  minHeight: '48px',
                  minWidth: '120px',
                  opacity: (
                    loading || 
                    (formData.accountType === 'student' && (
                      !formData.username.trim() || 
                      !formData.teacherCode.trim() || 
                      !formData.personalPassword.trim()
                    )) ||
                    (formData.accountType === 'educator' && (
                      !formData.email.trim() || 
                      !formData.password.trim() || 
                      !formData.teacherJoinCode.trim()
                    )) ||
                    (formData.accountType === 'parent' && (
                      !formData.email.trim() || 
                      !formData.password.trim()
                    ))
                  ) ? 0.7 : 1
                }}
              >
                {loading && (
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    border: '2px solid #223848',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            )}
          </div>

          {/* Help Text */}
          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: '#223848',
              margin: '0 0 0.5rem 0',
              lineHeight: '1.4'
            }}>
              {formData.accountType === 'parent' 
                ? 'Need help? Contact us at support@luxlibris.org'
                : 'Need help signing in? Contact your teacher, librarian or school administrator.'
              }
            </p>
            <button
              onClick={() => router.push('/role-selector')}
              style={{
                background: 'none',
                border: 'none',
                color: '#ADD4EA',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Don&apos;t have an account? Create one here
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal
          accountType={formData.accountType}
          email={formData.email}
          onClose={() => setShowForgotPassword(false)}
          onSuccess={() => {
            setShowForgotPassword(false);
            setError('');
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}