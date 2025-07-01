import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../contexts/AuthContext'

export default function RoleSelector() {
  const router = useRouter()
  const { user, userProfile, loading, getDashboardUrl } = useAuth()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Redirect if already authenticated
    if (!loading && user && userProfile) {
      console.log('🔄 User already authenticated, redirecting to dashboard...')
      router.push(getDashboardUrl())
      return
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Check if installation is possible on this device
    const checkInstallability = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      const isDesktop = !isIOS && !isAndroid
      
      setCanInstall(isIOS || isAndroid || isDesktop)
    }

    checkInstallability()

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setIsInstalled(true)
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [user, userProfile, loading, router, getDashboardUrl])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the install prompt
      alert('To install this app:\n\n📱 iPhone/iPad: Tap Share → &quot;Add to Home Screen&quot;\n🤖 Android: Look for &quot;Install App&quot; in browser menu\n💻 Desktop: Look for install icon in address bar')
      return
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setShowInstallButton(false)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  // Show loading while checking auth state
  if (loading) {
    return (
      <>
        <Head>
          <title>Lux Libris - Select Your Role</title>
          <link rel="icon" href="/images/lux_libris_logo.png" />
        </Head>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #ADD4EA',
              borderTop: '3px solid #223848',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#223848', fontSize: '1.125rem' }}>Loading Lux Libris...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Join Lux Libris - Select Your Role</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        <div style={{
          maxWidth: '90rem',
          margin: '0 auto',
          padding: '3rem 1.5rem',
          textAlign: 'center'
        }}>
          
          <div style={{ marginBottom: '3rem' }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 'bold',
              color: '#223848',
              marginBottom: '1rem',
              fontFamily: 'Georgia, serif'
            }}>
              Welcome to Lux Libris!
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              color: '#ADD4EA',
              marginBottom: '2rem'
            }}>
              Choose your role to get started with your reading journey
            </p>

            {/* Enhanced PWA Install Button */}
            {showInstallButton && !isInstalled && (
              <div style={{
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                color: 'white',
                padding: '1rem 1.5rem',
                borderRadius: '1rem',
                marginBottom: '2rem',
                display: 'inline-block',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}>
                <p style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}>
                  📱 Install Lux Libris as an App!
                </p>
                <button
                  onClick={handleInstallClick}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'white'
                    e.target.style.color = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                    e.target.style.color = 'white'
                  }}
                >
                  🚀 Install Now
                </button>
              </div>
            )}

            {isInstalled && (
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '1rem',
                marginBottom: '2rem',
                display: 'inline-block',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                ✅ App Installed! You&apos;re ready to go!
              </div>
            )}
          </div>

          {/* 4 Role Cards - Mobile Responsive Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '3rem',
            maxWidth: '85rem',
            margin: '0 auto 3rem auto'
          }}>
            
            {/* Student Card */}
            <RoleCard
              icon="🧑‍🎓"
              title="Student"
              description="Connect to your school&apos;s reading program and start your journey!"
              features={[
                "🏫 Connect to your school",
                "📚 Interactive bookshelf",
                "🏆 Little Luminaries™ saint achievements", 
                "🔥 Reading streaks",
                "🎯 Personal goals"
              ]}
              buttonText="Join My School&apos;s Program"
              onClick={() => router.push('/student-account-creation')}
              gradient="from-blue-400 to-purple-500"
              installPrompt={true}
            />

            {/* Parent Card */}
            <RoleCard
              icon="👨‍👩‍👧‍👦"
              title="Parent"
              description="Support your child&apos;s school reading program"
              features={[
                "🏫 Connect to your child&apos;s school",
                "👀 Basic progress viewing (FREE)",
                "🔐 Quiz code access",
                "⭐ Premium analytics ($10/yr)",
                "🎉 Celebrate achievements"
              ]}
              buttonText="Support My Child"
              onClick={() => router.push('/parent-account-creation')}
              gradient="from-green-400 to-teal-500"
              installPrompt={true}
              highlight="Basic access FREE with school!"
            />

            {/* Teacher Card - Future Phase */}
            <RoleCard
              icon="👩‍🏫"
              title="School Staff"
              description="Monitor student progress across your classes"
              features={[
                "📈 Class overview dashboard",
                "🎯 Student goal tracking",
                "📋 Progress reports",
                "🏆 Achievement celebrations",
                "📊 Reading analytics"
              ]}
              buttonText="Coming Soon!"
              onClick={() => {}} // No action for disabled card
              gradient="from-amber-400 to-orange-500"
              installPrompt={false}
              highlight="Available after pilot"
              disabled={true}
            />

            {/* Admin Card */}
            <RoleCard
              icon="👑"
              title="School Admin"
              description="Set up and manage your school&apos;s reading program"
              features={[
                "🏫 School configuration",
                "📚 Book selection from 20 nominees",
                "🏆 Achievement setup",
                "👥 Student management",
                "📊 Program analytics"
              ]}
              buttonText="Configure School"
              onClick={() => router.push('/admin/school-onboarding')}
              gradient="from-purple-500 to-pink-500"
              installPrompt={false}
              highlight="For librarians & principals"
            />
          </div>

          {/* Rest of the component stays the same... */}
          {/* Simplified Independent Option */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px dashed rgba(173, 212, 234, 0.5)',
            marginBottom: '3rem',
            maxWidth: '50rem',
            margin: '0 auto 3rem auto'
          }}>
            <h3 style={{
              fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
              fontWeight: 'bold',
              color: '#223848',
              marginBottom: '0.75rem',
              fontFamily: 'Georgia, serif'
            }}>
              🏠 School Not Participating Yet?
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '1rem',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Independent options coming soon! For now, encourage your school to join the pilot.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a href="mailto:admin@luxlibris.org?subject=School Interest&body=Hi! I'd like my school to participate in Lux Libris." style={{
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'inline-block',
                textAlign: 'center',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                minHeight: '44px'
              }}>
                📧 Contact Your School
              </a>
              <a href="#pilot-info" style={{
                background: 'transparent',
                color: '#223848',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'inline-block',
                textAlign: 'center',
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                border: '2px solid #ADD4EA',
                minHeight: '44px'
              }}>
                📋 Pilot Information
              </a>
            </div>
            
            <p style={{
              marginTop: '1rem',
              fontSize: '0.8rem',
              color: '#6b7280',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Independent family plans will be available after the pilot phase
            </p>
          </div>

          {/* Pilot Information */}
          <div id="pilot-info" style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '1rem',
            border: '1px solid rgba(195, 224, 222, 0.4)',
            maxWidth: '55rem',
            margin: '0 auto 3rem auto'
          }}>
            <h3 style={{
              fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
              fontWeight: 'bold',
              color: '#223848',
              marginBottom: '1rem',
              fontFamily: 'Georgia, serif'
            }}>
              🚀 Join the Lux Libris Pilot Program
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '1rem',
              textAlign: 'center',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              We&apos;re currently piloting with select Catholic schools. Interested in bringing Lux Libris to your school?
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a href="mailto:admin@luxlibris.org?subject=Pilot Interest" style={{
                background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                color: '#223848',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'inline-block',
                textAlign: 'center',
                minHeight: '44px'
              }}>
                📧 Contact Us
              </a>
            </div>
          </div>

          {/* ENHANCED PWA Install Instructions Section */}
          <div style={{
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '1rem',
            border: '1px solid rgba(195, 224, 222, 0.4)',
            maxWidth: '60rem',
            margin: '0 auto',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
              fontWeight: 'bold',
              color: '#223848',
              marginBottom: '1rem',
              fontFamily: 'Georgia, serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              📱 For the Best Experience: Install Lux Libris as an App
            </h3>
            
            {isInstalled ? (
              <div style={{
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600'
                }}>
                  🎉 Excellent! Lux Libris is installed as an app on your device!
                </p>
              </div>
            ) : showInstallButton ? (
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600'
                }}>
                  ✨ Your device supports app installation!
                </p>
                <button
                  onClick={handleInstallClick}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'white'
                    e.target.style.color = '#3b82f6'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                    e.target.style.color = 'white'
                  }}
                >
                  🚀 Install App Now
                </button>
              </div>
            ) : canInstall ? (
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                <p style={{
                  margin: '0 0 0.75rem 0',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600'
                }}>
                  📲 Install Lux Libris for the best reading experience!
                </p>
                <button
                  onClick={handleInstallClick}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minHeight: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'white'
                    e.target.style.color = '#f59e0b'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)'
                    e.target.style.color = 'white'
                  }}
                >
                  📖 Show Install Instructions
                </button>
              </div>
            ) : null}
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{
                background: 'rgba(173, 212, 234, 0.1)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(173, 212, 234, 0.3)'
              }}>
                <strong style={{ color: '#223848', fontSize: '1.1rem' }}>📱 iPhone/iPad:</strong>
                <br />
                <span style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.4' }}>
                  1. Tap the Share button (square with arrow up)<br />
                  2. Scroll down and tap &quot;Add to Home Screen&quot;<br />
                  3. Tap &quot;Add&quot; to install
                </span>
              </div>
              <div style={{
                background: 'rgba(161, 229, 219, 0.1)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(161, 229, 219, 0.3)'
              }}>
                <strong style={{ color: '#223848', fontSize: '1.1rem' }}>🤖 Android:</strong>
                <br />
                <span style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.4' }}>
                  1. Tap the browser menu (3 dots)<br />
                  2. Look for &quot;Install app&quot; or &quot;Add to Home Screen&quot;<br />
                  3. Confirm installation
                </span>
              </div>
              <div style={{
                background: 'rgba(195, 224, 222, 0.1)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(195, 224, 222, 0.3)'
              }}>
                <strong style={{ color: '#223848', fontSize: '1.1rem' }}>💻 Desktop:</strong>
                <br />
                <span style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.4' }}>
                  1. Look for install icon in address bar<br />
                  2. Or use browser menu &quot;Install Lux Libris&quot;<br />
                  3. Follow the prompts to install
                </span>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(34, 56, 72, 0.05)',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#223848',
                fontSize: '0.9rem',
                margin: 0,
                fontWeight: '500'
              }}>
                💡 <strong>Why install?</strong> Faster loading • Offline access • Push notifications • Native app experience
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

function RoleCard({ icon, title, description, features, buttonText, onClick, gradient, installPrompt, highlight, disabled = false }) {
  const cardStyle = {
    background: disabled ? '#f8f9fa' : 'white',
    borderRadius: '1rem',
    padding: 'clamp(1.25rem, 3vw, 1.75rem)',
    boxShadow: disabled ? '0 4px 10px rgba(0, 0, 0, 0.05)' : '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: disabled ? '2px dashed #d1d5db' : '1px solid rgba(195, 224, 222, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    opacity: disabled ? 0.6 : 1,
    minHeight: '420px'
  }

  return (
    <div style={cardStyle}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-8px)'
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      
      {highlight && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: disabled ? '#6b7280' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}>
          {highlight}
        </div>
      )}
      
      <div style={{
        width: 'clamp(3rem, 8vw, 3.5rem)',
        height: 'clamp(3rem, 8vw, 3.5rem)',
        background: disabled ? '#9ca3af' : 
                   gradient.includes('blue') ? 'linear-gradient(135deg, #60a5fa, #a78bfa)' :
                   gradient.includes('green') ? 'linear-gradient(135deg, #34d399, #14b8a6)' :
                   gradient.includes('amber') ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                   'linear-gradient(135deg, #a855f7, #ec4899)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
        margin: '0 auto 1.25rem',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        {icon}
      </div>
      
      <h3 style={{
        fontSize: 'clamp(1.125rem, 3vw, 1.375rem)',
        fontWeight: 'bold',
        color: disabled ? '#6b7280' : '#223848',
        marginBottom: '1rem',
        fontFamily: 'Georgia, serif'
      }}>
        {title}
      </h3>
      
      <p style={{
        color: disabled ? '#9ca3af' : '#6b7280',
        marginBottom: '1.25rem',
        lineHeight: '1.5',
        fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
        flexGrow: 1
      }}>
        {description}
      </p>
      
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: '0 0 1.5rem 0',
        textAlign: 'left'
      }}>
        {features.map((feature, index) => (
          <li key={index} style={{
            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
            color: disabled ? '#9ca3af' : '#6b7280',
            marginBottom: '0.5rem',
            lineHeight: '1.3'
          }}>
            {feature}
          </li>
        ))}
      </ul>
      
      <div style={{ padding: '0 0.5rem' }}>
        {disabled ? (
          <div style={{
            display: 'block',
            width: '100%',
            background: '#d1d5db',
            color: '#6b7280',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            fontSize: 'clamp(0.8rem, 2.5vw, 0.85rem)',
            marginTop: 'auto',
            boxSizing: 'border-box',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {buttonText}
          </div>
        ) : (
          <button onClick={onClick} style={{
            display: 'block',
            width: '100%',
            background: gradient.includes('blue') ? 'linear-gradient(135deg, #60a5fa, #a78bfa)' :
                       gradient.includes('green') ? 'linear-gradient(135deg, #34d399, #14b8a6)' :
                       gradient.includes('amber') ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                       'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: '600',
            transition: 'all 0.2s',
            textAlign: 'center',
            fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
            marginTop: 'auto',
            boxSizing: 'border-box',
            cursor: 'pointer',
            minHeight: '44px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
          >
            {buttonText}
          </button>
        )}
      </div>
      
      {installPrompt && !disabled && (
        <p style={{
          fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
          color: '#ADD4EA',
          marginTop: '0.75rem',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          💡 Install as app for best experience!
        </p>
      )}
    </div>
  )
}