import { useState } from 'react'
import Head from 'next/head'

export default function RoleSelector() {
  return (
    <>
      <Head>
        <title>Join Lux Libris - Select Your Role</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        <div style={{
          maxWidth: '90rem', // Wider container for 4 cards
          margin: '0 auto',
          padding: '3rem 1.5rem',
          textAlign: 'center'
        }}>
          
          <div style={{ marginBottom: '3rem' }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: '#223848',
              marginBottom: '1rem',
              fontFamily: 'Georgia, serif'
            }}>
              Welcome to Lux Libris!
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#ADD4EA',
              marginBottom: '2rem'
            }}>
              Choose your role to get started with your reading journey
            </p>
          </div>

          {/* FIXED: 4 Cards in One Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)', // Force exactly 4 columns
            gap: '1.25rem', // Slightly smaller gap to fit better
            marginBottom: '3rem',
            maxWidth: '85rem', // Control max width
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
                "🏆 Saint achievements", 
                "🔥 Reading streaks",
                "🎯 Personal goals"
              ]}
              buttonText="Join My School&apos;s Program"
              href="/student-onboarding"
              gradient="from-blue-400 to-purple-500"
              installPrompt={true}
            />

            {/* Parent Card - School Connected */}
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
              href="/parent-onboarding"
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
              href="#"
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
              href="/admin/school-onboarding"
              gradient="from-purple-500 to-pink-500"
              installPrompt={false}
              highlight="For librarians & principals"
            />
          </div>

          {/* Simplified Independent Option - Post-Pilot */}
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
              fontSize: '1.25rem',
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
              fontSize: '1rem'
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
                fontSize: '0.9rem'
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
                fontSize: '0.9rem',
                border: '2px solid #ADD4EA'
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
              fontSize: '1.25rem',
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
              textAlign: 'center'
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
                textAlign: 'center'
              }}>
                📧 Contact Us
              </a>
            </div>
          </div>

          {/* PWA Install Info - Professional Credibility */}
          <div style={{
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '1rem',
            border: '1px solid rgba(195, 224, 222, 0.4)',
            maxWidth: '60rem',
            margin: '0 auto'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#223848',
              marginBottom: '1rem',
              fontFamily: 'Georgia, serif'
            }}>
              📱 Install as an App
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              For the best experience, install Lux Libris on your device:
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              textAlign: 'left'
            }}>
              <div>
                <strong style={{ color: '#223848' }}>📱 iPhone/iPad:</strong>
                <br />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Tap Share → &quot;Add to Home Screen&quot;
                </span>
              </div>
              <div>
                <strong style={{ color: '#223848' }}>🤖 Android:</strong>
                <br />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Tap &quot;Install App&quot; when prompted
                </span>
              </div>
              <div>
                <strong style={{ color: '#223848' }}>💻 Desktop:</strong>
                <br />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Click install icon in address bar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function RoleCard({ icon, title, description, features, buttonText, href, gradient, installPrompt, highlight, disabled = false }) {
  const cardStyle = {
    background: disabled ? '#f8f9fa' : 'white',
    borderRadius: '1rem',
    padding: '1.75rem',
    boxShadow: disabled ? '0 4px 10px rgba(0, 0, 0, 0.05)' : '0 10px 25px rgba(0, 0, 0, 0.1)',
    border: disabled ? '2px dashed #d1d5db' : '1px solid rgba(195, 224, 222, 0.4)',
    transition: 'transform 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    opacity: disabled ? 0.6 : 1
  }

  return (
    <div style={cardStyle}
    onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(-4px)')}
    onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(0)')}
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
          fontSize: '0.7rem',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {highlight}
        </div>
      )}
      
      <div style={{
        width: '3.5rem',
        height: '3.5rem',
        background: disabled ? '#9ca3af' : 
                   gradient.includes('blue') ? 'linear-gradient(135deg, #60a5fa, #a78bfa)' :
                   gradient.includes('green') ? 'linear-gradient(135deg, #34d399, #14b8a6)' :
                   gradient.includes('amber') ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                   'linear-gradient(135deg, #a855f7, #ec4899)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.75rem',
        margin: '0 auto 1.25rem'
      }}>
        {icon}
      </div>
      
      <h3 style={{
        fontSize: '1.375rem',
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
        lineHeight: '1.4',
        fontSize: '0.95rem',
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
            fontSize: '0.8rem',
            color: disabled ? '#9ca3af' : '#6b7280',
            marginBottom: '0.4rem'
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
            padding: '0.65rem 1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            marginTop: 'auto',
            boxSizing: 'border-box'
          }}>
            {buttonText}
          </div>
        ) : (
          <a href={href} style={{
            display: 'block',
            width: '100%',
            background: gradient.includes('blue') ? 'linear-gradient(135deg, #60a5fa, #a78bfa)' :
                       gradient.includes('green') ? 'linear-gradient(135deg, #34d399, #14b8a6)' :
                       gradient.includes('amber') ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                       'linear-gradient(135deg, #a855f7, #ec4899)',
            color: 'white',
            padding: '0.65rem 1rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'all 0.2s',
            textAlign: 'center',
            fontSize: '0.85rem',
            marginTop: 'auto',
            boxSizing: 'border-box'
          }}>
            {buttonText}
          </a>
        )}
      </div>
      
      {installPrompt && !disabled && (
        <p style={{
          fontSize: '0.7rem',
          color: '#ADD4EA',
          marginTop: '0.75rem',
          fontStyle: 'italic'
        }}>
          💡 Install as app for best experience!
        </p>
      )}
    </div>
  )
}