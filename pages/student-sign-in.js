// pages/student-sign-in.js - Clean Version (No Legacy Code)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function StudentSignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    teacherCode: '',
    personalPassword: ''
  });

  // Handle URL parameters from onboarding redirect
  useEffect(() => {
    const { username, teacherCode, newAccount } = router.query;
    if (username && teacherCode) {
      setFormData(prev => ({
        ...prev,
        username: username,
        teacherCode: teacherCode
      }));
    }
    if (newAccount === 'true') {
      setIsNewAccount(true);
    }
  }, [router.query]);

  // Find student record by username and teacher code
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

  const handleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      if (!formData.username.trim() || !formData.teacherCode.trim() || !formData.personalPassword.trim()) {
        setError('Please enter your username, teacher code, and personal password');
        setLoading(false);
        return;
      }

      console.log('🔐 Starting student sign-in process...');
      console.log('👤 Username:', formData.username);
      console.log('🏫 Teacher Code:', formData.teacherCode);

      // Step 1: Find existing student record in database
      console.log('📚 Step 1: Finding student record...');
      const studentRecord = await findStudentByUsernameAndTeacherCode(
        formData.username, 
        formData.teacherCode.toUpperCase()
      );
      
      if (!studentRecord) {
        setError('Username or teacher code is incorrect. Please check your information and try again.');
        setLoading(false);
        return;
      }

      console.log('✅ Student record found:', studentRecord.firstName);

      // Step 2: Validate personal password
      console.log('🔐 Step 2: Validating personal password...');
      const passwordCheck = validatePersonalPassword(studentRecord, formData.personalPassword);
      
      if (!passwordCheck.valid) {
        setError(passwordCheck.error);
        setLoading(false);
        return;
      }

      // Step 3: Create Firebase Auth user
      console.log('🔐 Step 3: Creating Firebase Auth user...');
      const studentEmail = `${formData.username.toLowerCase()}@${formData.teacherCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}.luxlibris.app`;
      
      let firebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, formData.teacherCode);
        firebaseUser = userCredential.user;
        console.log('✅ Firebase Auth user created:', firebaseUser.uid);
      } catch (authError) {
        console.error('❌ Firebase Auth error:', authError);
        if (authError.code === 'auth/email-already-in-use') {
          setError('This account already has a Firebase user. Please contact your teacher for help.');
        } else if (authError.code === 'auth/weak-password') {
          setError('Teacher code is too short. Please contact your teacher.');
        } else {
          setError('Failed to create your account. Please try again or contact your teacher.');
        }
        setLoading(false);
        return;
      }

      // Step 4: Update student record with Firebase UID
      console.log('💾 Step 4: Updating student record with UID...');
      try {
        const studentRef = doc(db, `entities/${studentRecord.entityId}/schools/${studentRecord.schoolId}/students`, studentRecord.id);
        await updateDoc(studentRef, {
          uid: firebaseUser.uid,
          needsFirstSignIn: false,
          lastSignIn: new Date()
        });
        console.log('✅ Student record updated with UID');
      } catch (updateError) {
        console.error('❌ Database update error:', updateError);
        setError('Account created but failed to link to your profile. Please contact your teacher.');
        setLoading(false);
        return;
      }

      // Step 5: Success! Redirect to dashboard
      console.log('🎉 Sign-in completed successfully! Redirecting to dashboard...');
      router.push('/student-dashboard');

    } catch (error) {
      console.error('❌ Unexpected sign-in error:', error);
      setError('An unexpected error occurred. Please try again or contact your teacher.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/role-selector');
  };

  return (
    <>
      <Head>
        <title>Student Sign In - Lux Libris</title>
        <meta name="description" content="Student sign in to access your reading journey" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #ADD4EA 50%, #C3E0DE 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
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
              📚
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 0.5rem 0',
              fontFamily: 'Georgia, serif'
            }}>
              {isNewAccount ? 'Welcome to Lux Libris!' : 'Student Sign In'}
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {isNewAccount ? 'Let\'s sign you in to start your reading journey!' : 
               'Sign in with your username, teacher code, and personal password'}
            </p>
          </div>

          {/* New Account Welcome Message */}
          {isNewAccount && (
            <div style={{
              background: 'rgba(173, 212, 234, 0.1)',
              border: '1px solid rgba(173, 212, 234, 0.3)',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#223848',
                fontSize: '0.875rem',
                margin: 0,
                lineHeight: '1.4'
              }}>
                🎉 <strong>Your profile is ready!</strong> Use your username, teacher code, and personal password below to sign in for the first time.
              </p>
            </div>
          )}

          {/* Sign In Form */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Your Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  username: e.target.value 
                }))}
                placeholder="EmmaK4SMIT"
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
                  color: '#1f2937',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
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
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Teacher Code
              </label>
              <input
                type="password"
                value={formData.teacherCode}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  teacherCode: e.target.value.toUpperCase() 
                }))}
                placeholder="LUXLIB-SCHOOL-SMITH25-STUDENT"
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
                  color: '#1f2937',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: '0.5rem 0 0 0',
                textAlign: 'center'
              }}>
                This is the code your teacher gave you
              </p>
            </div>

            {/* Personal Password Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
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
                  color: '#1f2937',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: '0.5rem 0 0 0',
                textAlign: 'center'
              }}>
                The simple password you chose when creating your account
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
                🔐 <strong>Secure Sign-In:</strong> Your username and teacher code identify you, and your personal password keeps your account safe!
              </p>
            </div>
          </div>

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
            
            <button
              onClick={handleSignIn}
              disabled={
                loading || 
                !formData.username.trim() || 
                !formData.teacherCode.trim() || 
                !formData.personalPassword.trim()
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
                  !formData.username.trim() || 
                  !formData.teacherCode.trim() || 
                  !formData.personalPassword.trim()
                ) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '48px',
                minWidth: '120px',
                opacity: (
                  loading || 
                  !formData.username.trim() || 
                  !formData.teacherCode.trim() || 
                  !formData.personalPassword.trim()
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
              color: '#6b7280',
              margin: '0 0 0.5rem 0',
              lineHeight: '1.4'
            }}>
              Need help signing in? Contact your teacher or librarian.
            </p>
            {!isNewAccount && (
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
            )}
          </div>
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