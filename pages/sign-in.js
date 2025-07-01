// pages/sign-in.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { authHelpers, dbHelpers } from '../lib/firebase';

export default function SignIn() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    accountType: '',
    username: '',
    schoolCode: '',
    email: '',
    password: ''
  });

  const accountTypes = [
    {
      type: 'student',
      title: 'Student',
      icon: '📚',
      description: 'Sign in with your reading username',
      buttonText: 'Student Sign In'
    },
    {
      type: 'admin',
      title: 'School Admin',
      icon: '👨‍💼',
      description: 'Manage your school\'s reading program',
      buttonText: 'Admin Sign In'
    },
    {
      type: 'parent',
      title: 'Parent/Guardian',
      icon: '👨‍👩‍👧‍👦',
      description: 'Track your child\'s reading progress',
      buttonText: 'Parent Sign In'
    }
  ];

  const handleAccountTypeSelect = (type) => {
    setFormData({ ...formData, accountType: type });
    setError('');
    setStep(2);
  };

  const handleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      if (formData.accountType === 'student') {
        // Student sign in with username
        if (!formData.username.trim()) {
          setError('Please enter your username');
          setLoading(false);
          return;
        }

        // Find student by display username across all schools
        const student = await dbHelpers.findStudentByUsername(formData.username);
        
        if (!student) {
          setError('Username not found. Check your spelling or ask your teacher.');
          setLoading(false);
          return;
        }

        // Sign in using the student's auth account
        await authHelpers.signInStudent(student);
        
        // Redirect to student dashboard
        router.push('/student-dashboard');
        
      } else if (formData.accountType === 'admin') {
        // Admin sign in with email/password (traditional)
        if (!formData.email || !formData.password) {
          setError('Please enter both email and password');
          setLoading(false);
          return;
        }

        await authHelpers.signIn(formData.email, formData.password);
        router.push('/admin/school-dashboard');
        
      } else if (formData.accountType === 'parent') {
        // Parent sign in with email/password
        if (!formData.email || !formData.password) {
          setError('Please enter both email and password');
          setLoading(false);
          return;
        }

        await authHelpers.signIn(formData.email, formData.password);
        router.push('/parent-dashboard');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Sign in failed. Please check your information and try again.');
    }

    setLoading(false);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(1);
      setError('');
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - Lux Libris</title>
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
                        color: '#6b7280',
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
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    lineHeight: '1.4'
                  }}>
                    Enter the username you were given when you created your account
                  </p>

                  <div style={{ marginBottom: '1.5rem' }}>
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
                      placeholder="VerityK4"
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
                        letterSpacing: '0.05em'
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
                      Just the letters and numbers (like VerityK4)
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
                      💡 <strong>Forgot your username?</strong> Ask your teacher or check the paper you got when you first signed up!
                    </p>
                  </div>
                </div>
              )}

              {/* Admin/Parent Sign In */}
              {(formData.accountType === 'admin' || formData.accountType === 'parent') && (
                <div>
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
                      placeholder="your-email@example.com"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none'
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
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        password: e.target.value 
                      }))}
                      placeholder="Enter your password"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#ADD4EA'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
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
                disabled={loading}
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
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  minHeight: '48px',
                  minWidth: '120px'
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
                Sign In
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
              Need help signing in? Contact your teacher or administrator.
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