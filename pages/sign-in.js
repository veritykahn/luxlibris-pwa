// pages/sign-in.js - Updated with Personal Password Support

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { authHelpers, dbHelpers } from '../lib/firebase';

export default function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSessionExpiredMessage, setShowSessionExpiredMessage] = useState(false);

  const [formData, setFormData] = useState({
    accountType: '',
    username: '',
    teacherCode: '',
    personalPassword: '', // NEW: Personal password field
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
    description: 'Coming soon! Track your child\'s reading progress',
    buttonText: 'Parent Sign In (Coming Soon)',
    disabled: true
  }
];

  const handleAccountTypeSelect = (type) => {
    if (type === 'parent') {
      // Don't allow parent selection - coming soon
      return;
    }
    
    setFormData({ ...formData, accountType: type });
    setError('');
    setShowSessionExpiredMessage(false);

    setStep(2);
  };

  // NEW: Validate personal password
  const isPasswordValid = (password) => {
    return password && password.length >= 5 && /^[a-z]+$/.test(password);
  };

  // Perform student sign-in with enhanced authentication
  const performStudentSignIn = async () => {
    try {
      console.log('🔐 Attempting student sign-in with enhanced authentication...');
      console.log('👤 Username:', formData.username);
      console.log('🏫 Teacher Code:', formData.teacherCode);

      // Use the updated 3-parameter function
      await authHelpers.signInStudentWithTeacherCode(
        formData.username, 
        formData.teacherCode.toUpperCase(),
        formData.personalPassword.toLowerCase()
      );
      
      console.log('✅ Student sign-in successful - redirecting to dashboard');
      router.push('/student-dashboard');
      
    } catch (error) {
      console.error('❌ Student sign-in error:', error);
      throw error;
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

        // Handle student sign-in
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
        
        console.log('✅ Educator sign-in successful - redirecting to dashboard');
        router.push('/admin/school-dashboard');
        
      } else if (formData.accountType === 'parent') {
        // Parent sign-in coming soon
        setError('Parent sign-in is coming soon! Please check back later.');
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      setError(error.message || 'Sign in failed. Please check your information and try again.');
    }

    setLoading(false);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(1);
      setError('');
      setShowSessionExpiredMessage(false);
    } else {
      router.push('/');
    }
  };

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
              🔑
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 0.5rem 0',
              fontFamily: 'Georgia, serif'
            }}>
              Welcome Back!
            </h1>
            <p style={{
              color: '#6b7280',
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
                color: '#92400e',
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
                    disabled={account.disabled}
                    style={{
                      padding: '1.25rem',
                      background: account.disabled ? '#f9fafb' : 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      cursor: account.disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      opacity: account.disabled ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!account.disabled) {
                        e.target.style.borderColor = '#ADD4EA';
                        e.target.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!account.disabled) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = 'white';
                      }
                    }}
                  >
                  <div style={{ fontSize: '2rem' }}>{account.icon}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: account.disabled ? '#9ca3af' : '#223848',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {account.title}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: account.disabled ? '#9ca3af' : '#6b7280',
                        margin: 0,
                        lineHeight: '1.3'
                      }}>
                        {account.description}
                      </p>
                    </div>
                    {!account.disabled && (
                      <div style={{
                        color: '#ADD4EA',
                        fontSize: '1.25rem'
                      }}>
                        →
                      </div>
                    )}
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

              {/* Student Sign In - UPDATED */}
              {formData.accountType === 'student' && (
                <div>
                  <p style={{
                    color: '#6b7280',
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

                  {/* NEW: Personal Password Field */}
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
              )}

              {/* Educator Sign In - UNCHANGED */}
              {formData.accountType === 'educator' && (
                <div>
                  <p style={{
                    color: '#6b7280',
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
                      color: '#374151',
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
                        color: '#1f2937',
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
                      color: '#374151',
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
                        color: '#1f2937',
                        backgroundColor: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Teacher Join Code
                    </label>
                    <input
                      type="text"
                      value={formData.teacherJoinCode}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        teacherJoinCode: e.target.value.toUpperCase() 
                      }))}
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
                      The code you used when joining or given by your school administrator
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

              {/* Parent Sign In - Coming Soon */}
              {formData.accountType === 'parent' && (
                <div>
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      color: '#223848',
                      fontSize: '0.875rem',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      👨‍👩‍👧‍👦 <strong>Parent Access Coming Soon!</strong><br />
                      For now, basic progress viewing is included with your school&apos;s subscription. Ask your child&apos;s teacher for access to their reading progress.
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
            
            {step === 2 && formData.accountType !== 'parent' && (
              <button
                onClick={handleSignIn}
                disabled={
                  loading || 
                  (formData.accountType === 'student' && (
                    !formData.username.trim() || 
                    !formData.teacherCode.trim() || 
                    !formData.personalPassword.trim()
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
              color: '#6b7280',
              margin: '0 0 0.5rem 0',
              lineHeight: '1.4'
            }}>
              Need help signing in? Contact your teacher, librarian or school administrator.
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

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}