// pages/role-selector.js - With bottom sheet install modal
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function RoleSelector() {
  const router = useRouter()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)

  useEffect(() => {
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
      setShowInstallModal(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        // Show the native install prompt
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
        // Fallback to showing instructions
        setShowInstallModal(true)
      }
    } else {
      // No native prompt available, show instruction modal
      setShowInstallModal(true)
    }
  }

  const closeInstallModal = () => {
    setShowInstallModal(false)
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
        fontFamily: 'Avenir, system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Header with Back Arrow */}
        <div style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(173, 212, 234, 0.5)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#223848',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ADD4EA'
              e.target.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.9)'
              e.target.style.transform = 'scale(1)'
            }}
          >
            ←
          </button>
          <h1 style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
            fontWeight: '300',
            color: '#223848',
            margin: 0,
            fontFamily: 'Didot, Georgia, serif',
            letterSpacing: '1.2px'
          }}>
            Choose Your Role
          </h1>
        </div>
        
        <div style={{
          maxWidth: '90rem',
          margin: '0 auto',
          padding: '1rem 1.5rem 3rem',
          textAlign: 'center'
        }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <p style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              color: '#6b7280',
              marginBottom: '2rem',
              fontFamily: 'Avenir',
              letterSpacing: '1.2px'
            }}>
              Select your role to get started with your reading journey
            </p>

            {/* PROMINENT INSTALL APP BANNER */}
            {!isInstalled && (
              <div 
                onClick={handleInstallClick}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  color: 'white',
                  padding: '1.25rem 2rem',
                  borderRadius: '1rem',
                  marginBottom: '2.5rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px)'
                  e.target.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: '2rem' }}>📱</div>
                  <div style={{ textAlign: 'left', flex: '1', minWidth: '200px' }}>
                    <h3 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                      fontWeight: '700'
                    }}>
                      Install Lux Libris as an App First!
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                      opacity: 0.9
                    }}>
                      Get the best reading experience with faster loading & native app experience
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    🚀 Install Now
                  </div>
                </div>
              </div>
            )}

            {/* App Already Installed Banner */}
            {isInstalled && (
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '1rem',
                marginBottom: '2.5rem',
                boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>✅</div>
                  <div>
                    <h3 style={{
                      margin: '0 0 0.25rem 0',
                      fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
                      fontWeight: '700'
                    }}>
                      App Installed Successfully!
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                      opacity: 0.9
                    }}>
                      You&apos;re all set for the best Lux Libris experience
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3 Role Cards - Mobile Responsive Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
            maxWidth: '85rem',
            margin: '0 auto 3rem auto'
          }}>
            
            {/* Student Card */}
            <RoleCard
              icon="🧑‍🎓"
              title="Student"
              description="Connect to your school's reading program and start your journey!"
              features={[
                "🏫 Connect to your school",
                "📚 Interactive bookshelf",
                "🏆 Luxlings™ saint achievements", 
                "🔥 Reading streaks",
                "🎯 Personal goals"
              ]}
              buttonText="Join My School's Program"
              onClick={() => router.push('/student-account-creation')}
              gradient="from-blue-400 to-purple-500"
            />

            {/* Parent Card */}
            <RoleCard
              icon="👨‍👩‍👧‍👦"
              title="Parent"
              description="Support your childs school reading program"
              features={[
                "🏫 Connect to your child's school",
                "👀 Basic progress viewing (FREE)",
                "🔐 Quiz code access",
                "⭐ Premium analytics ($10/yr)",
                "🎉 Celebrate achievements"
              ]}
              buttonText="Support My Child"
              onClick={() => router.push('/parent/account-creation')}
              gradient="from-green-400 to-teal-500"
              highlight="Basic access FREE with school!"
            />

            {/* Educators Card */}
            <RoleCard
              icon="👩‍🏫"
              title="Educators"
              description="Teachers & librarians managing reading programs"
              features={[
                "📚 Run school reading programs",
                "👥 Manage class reading",
                "📊 Student progress tracking",
                "🏆 Achievement celebrations",
                "📈 Reading analytics"
              ]}
              buttonText="Join as Educator"
              onClick={() => router.push('/admin/teacher-setup-choice')}
              gradient="from-purple-500 to-pink-500"
              highlight="Teachers & Librarians"
            />
          </div>

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
              fontWeight: '300',
              color: '#223848',
              marginBottom: '0.75rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              🏠 School Not Participating Yet?
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '1rem',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontFamily: 'Avenir',
              letterSpacing: '1.2px'
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
                minHeight: '44px',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
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
                minHeight: '44px',
                fontFamily: 'Avenir',
                letterSpacing: '1.2px'
              }}>
                📋 Pilot Information
              </a>
            </div>
            
            <p style={{
              marginTop: '1rem',
              fontSize: '0.8rem',
              color: '#6b7280',
              textAlign: 'center',
              fontStyle: 'italic',
              fontFamily: 'Avenir'
            }}>
              Independent family plans will be available after the pilot phase
            </p>
          </div>
        </div>

        {/* Install Modal/Bottom Sheet */}
        {showInstallModal && (
          <>
            {/* Backdrop */}
            <div 
              onClick={closeInstallModal}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9998,
                backdropFilter: 'blur(4px)'
              }}
            />
            
            {/* Bottom Sheet Modal */}
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'white',
              borderTopLeftRadius: '1.5rem',
              borderTopRightRadius: '1.5rem',
              padding: '1.5rem',
              zIndex: 9999,
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
              animation: 'slideUp 0.3s ease-out'
            }}>
              {/* Handle bar */}
              <div style={{
                width: '40px',
                height: '4px',
                background: '#d1d5db',
                borderRadius: '2px',
                margin: '0 auto 1.5rem auto'
              }} />

              {/* Close button */}
              <button
                onClick={closeInstallModal}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(107, 114, 128, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#6b7280',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(107, 114, 128, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(107, 114, 128, 0.1)'
                }}
              >
                ×
              </button>

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
                <h3 style={{
                  fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '0.5rem',
                  fontFamily: 'Avenir'
                }}>
                  Install Lux Libris
                </h3>
                <p style={{
                  color: '#6b7280',
                  fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                  fontFamily: 'Avenir'
                }}>
                  Follow the instructions for your device to install the app
                </p>
              </div>

              {/* Install Instructions */}
              <div style={{
                display: 'grid',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {/* iPhone/iPad Instructions */}
                <div style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(59, 130, 246, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>📱</div>
                    <strong style={{
                      color: '#223848',
                      fontSize: '1.1rem',
                      fontFamily: 'Avenir'
                    }}>
                      iPhone / iPad (Safari)
                    </strong>
                  </div>
                  <ol style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    fontFamily: 'Avenir'
                  }}>
<li>Tap the <strong>Share</strong> button (<img src="/images/ios-share-icon.png" alt="share icon" style={{display: 'inline-block', height: '24px', width: 'auto', verticalAlign: 'middle', margin: '0 2px', backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '2px 4px', borderRadius: '4px'}} />) at the bottom of Safari</li>                    
<li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> to install the app</li>
                  </ol>
                </div>

                {/* Android Instructions */}
                <div style={{
                  background: 'rgba(34, 197, 94, 0.05)',
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(34, 197, 94, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>🤖</div>
                    <strong style={{
                      color: '#223848',
                      fontSize: '1.1rem',
                      fontFamily: 'Avenir'
                    }}>
                      Android (Chrome)
                    </strong>
                  </div>
                  <ol style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    fontFamily: 'Avenir'
                  }}>
                    <li>Tap the <strong>menu</strong> button (⋮) in Chrome</li>
                    <li>Look for <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
                    <li>Tap to confirm installation</li>
                  </ol>
                </div>

                {/* Desktop Instructions */}
                <div style={{
                  background: 'rgba(168, 85, 247, 0.05)',
                  padding: '1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(168, 85, 247, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>💻</div>
                    <strong style={{
                      color: '#223848',
                      fontSize: '1.1rem',
                      fontFamily: 'Avenir'
                    }}>
                      Desktop (Chrome/Edge)
                    </strong>
                  </div>
                  <ol style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    fontFamily: 'Avenir'
                  }}>
                    <li>Look for the <strong>install icon</strong> (⊕) in the address bar</li>
                    <li>Or use browser menu → <strong>"Install Lux Libris"</strong></li>
                    <li>Follow the prompts to install</li>
                  </ol>
                </div>
              </div>

              {/* Benefits */}
              <div style={{
                background: 'rgba(34, 56, 72, 0.03)',
                padding: '1rem',
                borderRadius: '0.75rem',
                textAlign: 'center'
              }}>
                <p style={{
                  color: '#223848',
                  fontSize: '0.9rem',
                  margin: 0,
                  fontWeight: '500',
                  fontFamily: 'Avenir'
                }}>
                  💡 <strong>Benefits:</strong> Faster loading • Push notifications • Native app experience
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

function RoleCard({ icon, title, description, features, buttonText, onClick, gradient, highlight, disabled = false }) {
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
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          fontFamily: 'Avenir',
          letterSpacing: '1.2px'
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
        fontWeight: '300',
        color: disabled ? '#6b7280' : '#223848',
        marginBottom: '1rem',
        fontFamily: 'Didot, Georgia, serif',
        letterSpacing: '1.2px'
      }}>
        {title}
      </h3>
      
      <p style={{
        color: disabled ? '#9ca3af' : '#6b7280',
        marginBottom: '1.25rem',
        lineHeight: '1.5',
        fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
        flexGrow: 1,
        fontFamily: 'Avenir',
        letterSpacing: '1.2px'
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
            lineHeight: '1.3',
            fontFamily: 'Avenir'
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
            justifyContent: 'center',
            fontFamily: 'Avenir',
            letterSpacing: '1.2px'
          }}>
            {buttonText}
          </div>
        ) : (
          <button onClick={onClick} style={{
            display: 'block',
            width: '100%',
            background: gradient.includes('blue') ? 'linear-gradient(135deg, #60a5fa, #a78bfa)' :
                       gradient.includes('green') ? 'linear-gradient(135deg, #34d399, #14b8a6)' :
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            fontFamily: 'Avenir',
            letterSpacing: '1.2px'
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
    </div>
  )
}