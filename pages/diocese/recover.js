// pages/diocese/recover.js - DIOCESE PASSWORD RECOVERY PAGE
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { db } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function DiocesePasswordRecovery() {
  const router = useRouter()
  const [step, setStep] = useState('choose') // choose, recover, support, success
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dioceseName: '',
    adminEmail: '',
    supportMessage: ''
  })
  const [recoveredInfo, setRecoveredInfo] = useState(null)
  const [error, setError] = useState('')

  // Self-service password recovery
  const handleSelfRecovery = async () => {
    if (!formData.dioceseName.trim() || !formData.adminEmail.trim()) {
      setError('Please enter both diocese name and admin email')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔍 Searching for diocese...')
      
      // Search through entities collection
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      let foundDiocese = null
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityData = entityDoc.data()
        
        // Check if this is a diocese/isd and matches both name and admin email
        if ((entityData.type === 'diocese' || entityData.type === 'isd') &&
            entityData.name.toLowerCase().trim() === formData.dioceseName.toLowerCase().trim() &&
            entityData.adminEmail.toLowerCase().trim() === formData.adminEmail.toLowerCase().trim()) {
          
          foundDiocese = {
            id: entityDoc.id,
            ...entityData
          }
          break
        }
      }

      if (!foundDiocese) {
        setError('Diocese not found. Please check your diocese name and admin email address.')
        setLoading(false)
        return
      }

      console.log('✅ Diocese found:', foundDiocese.name)
      
      // Set recovered info
      setRecoveredInfo({
        name: foundDiocese.name,
        accessCode: foundDiocese.accessCode,
        password: foundDiocese.passwordHash,
        adminEmail: foundDiocese.adminEmail
      })
      
      setStep('success')

    } catch (error) {
      console.error('❌ Recovery error:', error)
      setError('System error occurred. Please try the email support option.')
    }
    
    setLoading(false)
  }

  // Email to support
  const handleEmailSupport = () => {
    if (!formData.dioceseName.trim() || !formData.adminEmail.trim()) {
      setError('Please enter both diocese name and admin email')
      return
    }

    const subject = encodeURIComponent('Diocese Password Recovery Request')
    const body = encodeURIComponent(`Hello Lux Libris Support Team,

I need help recovering my diocese dashboard access credentials.

Diocese Information:
- Diocese Name: ${formData.dioceseName}
- Admin Email: ${formData.adminEmail}

Additional Details:
${formData.supportMessage || 'No additional details provided.'}

Please send me my access code and password at your earliest convenience.

Thank you,
Diocese Administrator`)

    window.open(`mailto:support@luxlibris.org?subject=${subject}&body=${body}`, '_blank')
    
    // Show confirmation
    setStep('support')
  }

  return (
    <>
      <Head>
        <title>Diocese Password Recovery - Lux Libris</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: '#FFFCF5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          border: '1px solid #C3E0DE',
          boxShadow: '0 10px 25px rgba(34, 56, 72, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #223848, #ADD4EA)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1rem'
            }}>
              🔑
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '300',
              color: '#223848',
              margin: '0 0 0.5rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              Diocese Password Recovery
            </h1>
            <p style={{
              color: '#ADD4EA',
              marginBottom: '0',
              fontFamily: 'Avenir',
              letterSpacing: '1.2px'
            }}>
              Recover your diocese dashboard access
            </p>
          </div>

          {/* Step 1: Choose Recovery Method */}
          {step === 'choose' && (
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#223848',
                marginBottom: '1rem',
                fontFamily: 'Didot, Georgia, serif'
              }}>
                Choose Recovery Method
              </h2>
              
              <div style={{
                display: 'grid',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {/* Self-Service Option */}
                <button
                  onClick={() => setStep('recover')}
                  style={{
                    background: 'linear-gradient(135deg, #A1E5DB, #68D391)',
                    color: '#223848',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontFamily: 'Avenir'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                    🚀 Instant Self-Service Recovery
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    Get your credentials immediately using your diocese name and admin email
                  </div>
                </button>

                {/* Email Support Option */}
                <button
                  onClick={() => setStep('support_form')}
                  style={{
                    background: 'linear-gradient(135deg, #ADD4EA, #B6DFEB)',
                    color: '#223848',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontFamily: 'Avenir'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                    📧 Email Support Request
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    Send a request to our support team (response within 24 hours)
                  </div>
                </button>
              </div>

              {/* Back to Login */}
              <div style={{ textAlign: 'center' }}>
                <Link href="/diocese/dashboard" style={{
                  color: '#ADD4EA',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontFamily: 'Avenir'
                }}>
                  ← Back to Diocese Login
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: Self-Service Recovery Form */}
          {step === 'recover' && (
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#223848',
                marginBottom: '1rem',
                fontFamily: 'Didot, Georgia, serif'
              }}>
                Diocese Information
              </h2>
              
              <p style={{
                color: '#ADD4EA',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
                fontFamily: 'Avenir'
              }}>
                Enter your exact diocese name and admin email address to recover your credentials.
              </p>

              {error && (
                <div style={{
                  background: '#FED7D7',
                  border: '1px solid #E53E3E',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#E53E3E',
                  fontSize: '0.875rem',
                  fontFamily: 'Avenir'
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#223848',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontFamily: 'Avenir'
                }}>
                  Diocese Name *
                </label>
                <input
                  type="text"
                  placeholder="Diocese of Austin"
                  value={formData.dioceseName}
                  onChange={(e) => setFormData(prev => ({ ...prev, dioceseName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #C3E0DE',
                    background: '#FFFCF5',
                    color: '#223848',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'Avenir'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#223848',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontFamily: 'Avenir'
                }}>
                  Admin Email Address *
                </label>
                <input
                  type="email"
                  placeholder="admin@austindiocese.org"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #C3E0DE',
                    background: '#FFFCF5',
                    color: '#223848',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'Avenir'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <button
                  onClick={() => setStep('choose')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#F7FAFC',
                    color: '#718096',
                    border: '1px solid #E2E8F0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'Avenir'
                  }}
                >
                  Back
                </button>
                
                <button
                  onClick={handleSelfRecovery}
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    background: loading 
                      ? '#B6DFEB' 
                      : 'linear-gradient(135deg, #223848, #ADD4EA)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontFamily: 'Avenir'
                  }}
                >
                  {loading && (
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  )}
                  {loading ? 'Searching...' : 'Recover Credentials'}
                </button>
              </div>

              <div style={{
                background: '#C3E0DE',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <p style={{
                  color: '#223848',
                  fontSize: '0.875rem',
                  margin: 0,
                  lineHeight: '1.4',
                  fontFamily: 'Avenir'
                }}>
                  🔒 <strong>Security Note:</strong> We can only display credentials when both your diocese name and admin email match exactly what's in our system.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Email Support Form */}
          {step === 'support_form' && (
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#223848',
                marginBottom: '1rem',
                fontFamily: 'Didot, Georgia, serif'
              }}>
                Email Support Request
              </h2>
              
              <p style={{
                color: '#ADD4EA',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
                fontFamily: 'Avenir'
              }}>
                We'll prepare an email to our support team with your information.
              </p>

              {error && (
                <div style={{
                  background: '#FED7D7',
                  border: '1px solid #E53E3E',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#E53E3E',
                  fontSize: '0.875rem',
                  fontFamily: 'Avenir'
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#223848',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontFamily: 'Avenir'
                }}>
                  Diocese Name *
                </label>
                <input
                  type="text"
                  placeholder="Diocese of Austin"
                  value={formData.dioceseName}
                  onChange={(e) => setFormData(prev => ({ ...prev, dioceseName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #C3E0DE',
                    background: '#FFFCF5',
                    color: '#223848',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'Avenir'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  color: '#223848',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontFamily: 'Avenir'
                }}>
                  Admin Email Address *
                </label>
                <input
                  type="email"
                  placeholder="admin@austindiocese.org"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #C3E0DE',
                    background: '#FFFCF5',
                    color: '#223848',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'Avenir'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#223848',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  fontFamily: 'Avenir'
                }}>
                  Additional Details (Optional)
                </label>
                <textarea
                  placeholder="Any additional context that might help us verify your identity..."
                  value={formData.supportMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, supportMessage: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #C3E0DE',
                    background: '#FFFCF5',
                    color: '#223848',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'Avenir',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <button
                  onClick={() => setStep('choose')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#F7FAFC',
                    color: '#718096',
                    border: '1px solid #E2E8F0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'Avenir'
                  }}
                >
                  Back
                </button>
                
                <button
                  onClick={handleEmailSupport}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #F6AD55, #ED8936)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'Avenir'
                  }}
                >
                  📧 Send Support Email
                </button>
              </div>

              <div style={{
                background: '#C3E0DE',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <p style={{
                  color: '#223848',
                  fontSize: '0.875rem',
                  margin: 0,
                  lineHeight: '1.4',
                  fontFamily: 'Avenir'
                }}>
                  📧 <strong>Support Response Time:</strong> Our team typically responds to password recovery requests within 24 hours during business days.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Success - Show Recovered Credentials */}
          {step === 'success' && recoveredInfo && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'linear-gradient(135deg, #68D391, #38A169)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 1rem'
                }}>
                  ✅
                </div>
                <h2 style={{
                  fontSize: '1.5rem',
                  color: '#223848',
                  margin: '0 0 0.5rem',
                  fontFamily: 'Didot, Georgia, serif'
                }}>
                  Credentials Retrieved
                </h2>
                <p style={{
                  color: '#ADD4EA',
                  fontSize: '0.875rem',
                  fontFamily: 'Avenir'
                }}>
                  Here are your diocese dashboard login credentials:
                </p>
              </div>

              <div style={{
                background: '#C3E0DE',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Didot, Georgia, serif'
                }}>
                  {recoveredInfo.name}
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#223848',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    fontFamily: 'Avenir'
                  }}>
                    Access Code:
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#223848',
                    background: 'white',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    letterSpacing: '0.1em',
                    fontFamily: 'Avenir',
                    wordBreak: 'break-all'
                  }}>
                    {recoveredInfo.accessCode}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#223848',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    fontFamily: 'Avenir'
                  }}>
                    Password:
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#223848',
                    background: 'white',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    letterSpacing: '0.05em',
                    fontFamily: 'Avenir',
                    wordBreak: 'break-all'
                  }}>
                    {recoveredInfo.password}
                  </div>
                </div>

                <div style={{
                  fontSize: '0.875rem',
                  color: '#223848',
                  fontFamily: 'Avenir'
                }}>
                  <strong>Admin Email:</strong> {recoveredInfo.adminEmail}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Access Code: ${recoveredInfo.accessCode}\nPassword: ${recoveredInfo.password}`)
                    alert('Credentials copied to clipboard!')
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ADD4EA, #B6DFEB)',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'Avenir'
                  }}
                >
                  📋 Copy Credentials
                </button>

                <button
                  onClick={() => router.push('/diocese/dashboard')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #223848, #ADD4EA)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'Avenir'
                  }}
                >
                  🚀 Go to Dashboard
                </button>
              </div>

              <div style={{
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <p style={{
                  color: '#B45309',
                  fontSize: '0.875rem',
                  margin: 0,
                  lineHeight: '1.4',
                  fontFamily: 'Avenir'
                }}>
                  🔒 <strong>Important:</strong> Please save these credentials securely. Consider changing your password immediately after logging in using the dashboard security settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Support Email Sent Confirmation */}
          {step === 'support' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  background: 'linear-gradient(135deg, #F6AD55, #ED8936)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 1rem'
                }}>
                  📧
                </div>
                <h2 style={{
                  fontSize: '1.5rem',
                  color: '#223848',
                  margin: '0 0 0.5rem',
                  fontFamily: 'Didot, Georgia, serif'
                }}>
                  Support Email Prepared
                </h2>
                <p style={{
                  color: '#ADD4EA',
                  fontSize: '0.875rem',
                  fontFamily: 'Avenir'
                }}>
                  An email to our support team should have opened in your default email client.
                </p>
              </div>

              <div style={{
                background: '#C3E0DE',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  color: '#223848',
                  marginBottom: '1rem',
                  fontFamily: 'Didot, Georgia, serif'
                }}>
                  What Happens Next?
                </h3>
                
                <div style={{
                  fontSize: '0.875rem',
                  color: '#223848',
                  lineHeight: '1.5',
                  fontFamily: 'Avenir'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    1. <strong>Review the email</strong> - Check that all information is correct
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    2. <strong>Send the email</strong> - Send it to support@luxlibris.org
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    3. <strong>Wait for response</strong> - We'll respond within 24 hours during business days
                  </div>
                  <div>
                    4. <strong>Check your email</strong> - We'll send your credentials to your admin email address
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <button
                  onClick={() => setStep('choose')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#F7FAFC',
                    color: '#718096',
                    border: '1px solid #E2E8F0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'Avenir'
                  }}
                >
                  Try Another Method
                </button>

                <button
                  onClick={() => router.push('/diocese/dashboard')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #223848, #ADD4EA)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'Avenir'
                  }}
                >
                  Back to Login
                </button>
              </div>

              <div style={{
                background: '#FED7D7',
                border: '1px solid #E53E3E',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <p style={{
                  color: '#E53E3E',
                  fontSize: '0.875rem',
                  margin: 0,
                  lineHeight: '1.4',
                  fontFamily: 'Avenir'
                }}>
                  <strong>Didn't see an email compose window?</strong> You can manually send an email to support@luxlibris.org with your diocese name and admin email address.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

// Updated Diocese Dashboard Login with Recovery Link
// Add this to the authentication screen in the main dashboard:

/*
ADD THIS TO THE AUTHENTICATION SECTION IN THE MAIN DASHBOARD:

After the login button, add:

<div style={{ textAlign: 'center', marginTop: '1rem' }}>
  <Link 
    href="/diocese/recover"
    style={{
      color: '#ADD4EA',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontFamily: 'Avenir'
    }}
  >
    🔑 Forgot your access code or password?
  </Link>
</div>

*/