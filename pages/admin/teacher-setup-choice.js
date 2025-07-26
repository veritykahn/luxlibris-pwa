// pages/admin/teacher-setup-choice.js - Choose between Reading Program vs Classroom Management
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function TeacherSetupChoice() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Teacher Setup - Choose Your Focus</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
            onClick={() => router.push('/role-selector')}
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
          <div>
            <h1 style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
              fontWeight: '300',
              color: '#223848',
              margin: 0,
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px'
            }}>
              Choose Your Setup Type
            </h1>
            <p style={{
              color: '#A1E5DB',
              fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
              margin: 0,
              fontFamily: 'Avenir',
              letterSpacing: '1.2px'
            }}>
              What would you like to set up?
            </p>
          </div>
        </div>
        
        <div style={{
          maxWidth: '75rem',
          margin: '0 auto',
          padding: '1rem 1.5rem 3rem',
          textAlign: 'center'
        }}>
          
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', marginBottom: '1rem' }}>👩‍🏫</div>
            <p style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              color: '#6b7280',
              marginBottom: '2rem',
              fontFamily: 'Avenir',
              letterSpacing: '1.2px',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Lux Libris supports both school-wide reading programs and individual classroom management. Choose your focus:
            </p>
          </div>

          {/* Two Setup Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem',
            maxWidth: '70rem',
            margin: '0 auto 3rem auto'
          }}>
            
            {/* School Reading Program Card */}
            <SetupCard
              icon="🏫"
              title="School Reading Program"
              description="Manage a school-wide reading initiative with book selections, achievements, and student progress tracking"
              features={[
                "📚 Curate book nominees for the year",
                "🏆 Set up achievement tiers & rewards", 
                "👥 Multiple teachers can join",
                "📊 School-wide progress tracking",
                "🎯 Academic year management",
                "🔗 Parent connection support"
              ]}
              buttonText="Set Up Reading Program"
              onClick={() => router.push('/admin/school-onboarding')}
              gradient="from-purple-500 to-pink-500"
              highlight="Most Popular"
              available={true}
            />

            {/* Teacher Classroom Card - GREYED OUT */}
            <SetupCard
              icon="📝"
              title="Teacher Classroom Management"
              description="Manage your individual classroom's reading activities, assignments, and student interactions"
              features={[
                "📖 Assign specific books to students",
                "✍️ Create reading assignments", 
                "💬 Discussion forums & activities",
                "📈 Individual student analytics",
                "🗓️ Reading calendars & schedules",
                "📋 Assessment tools"
              ]}
              buttonText="Set Up Classroom"
              onClick={() => {}} // No action for now
              gradient="from-blue-500 to-teal-500"
              highlight="Coming Soon"
              available={false}
            />
          </div>

          {/* Help Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid rgba(195, 224, 222, 0.4)',
            maxWidth: '50rem',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
              fontWeight: '300',
              color: '#223848',
              marginBottom: '1rem',
              fontFamily: 'Didot, Georgia, serif',
              letterSpacing: '1.2px',
              textAlign: 'center'
            }}>
              🤔 Not Sure Which to Choose?
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              fontSize: 'clamp(0.875rem, 2.5vw, 0.95rem)',
              color: '#6b7280',
              fontFamily: 'Avenir'
            }}>
              <div>
                <strong style={{ color: '#223848' }}>Choose Reading Program if:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                  <li>You&apos;re setting up for your whole school</li>
                  <li>You want school-wide book selections</li>
                  <li>You need achievement tracking</li>
                </ul>
              </div>
              <div>
                <strong style={{ color: '#223848' }}>Choose Classroom Management if:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                  <li>You&apos;re managing just your classroom</li>
                  <li>You need discussion tools</li>
                </ul>
              </div>
            </div>
            
            <div style={{
              textAlign: 'center',
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(173, 212, 234, 0.1)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(173, 212, 234, 0.3)'
            }}>
              <p style={{
                margin: 0,
                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                color: '#223848',
                fontFamily: 'Avenir'
              }}>
                💡 <strong>Note:</strong> You can always set up both types later. Start with your immediate need!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function SetupCard({ 
  icon, 
  title, 
  description, 
  features, 
  buttonText, 
  onClick, 
  gradient, 
  highlight, 
  available = true 
}) {
  const cardStyle = {
    background: available ? 'white' : '#f8f9fa',
    borderRadius: '1rem',
    padding: 'clamp(1.5rem, 3vw, 2rem)',
    boxShadow: available ? '0 10px 25px rgba(0, 0, 0, 0.1)' : '0 4px 10px rgba(0, 0, 0, 0.05)',
    border: available ? '1px solid rgba(195, 224, 222, 0.4)' : '2px dashed #d1d5db',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: available ? 'pointer' : 'not-allowed',
    position: 'relative',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    opacity: available ? 1 : 0.6,
    minHeight: '500px'
  }

  return (
    <div style={cardStyle}
      onMouseEnter={(e) => {
        if (available) {
          e.currentTarget.style.transform = 'translateY(-8px)'
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (available) {
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
          background: available ? 
            (highlight === 'Most Popular' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6b7280, #4b5563)') :
            '#6b7280',
          color: 'white',
          padding: '0.4rem 1rem',
          borderRadius: '1rem',
          fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
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
        width: 'clamp(3.5rem, 8vw, 4rem)',
        height: 'clamp(3.5rem, 8vw, 4rem)',
        background: available ? 
          (gradient.includes('purple') ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #14b8a6)') :
          '#9ca3af',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(1.75rem, 4vw, 2rem)',
        margin: '0 auto 1.5rem',
        boxShadow: available ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none'
      }}>
        {icon}
      </div>
      
      <h3 style={{
        fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
        fontWeight: '300',
        color: available ? '#223848' : '#6b7280',
        marginBottom: '1rem',
        fontFamily: 'Didot, Georgia, serif',
        letterSpacing: '1.2px',
        textAlign: 'center'
      }}>
        {title}
      </h3>
      
      <p style={{
        color: available ? '#6b7280' : '#9ca3af',
        marginBottom: '1.5rem',
        lineHeight: '1.6',
        fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
        flexGrow: 1,
        fontFamily: 'Avenir',
        letterSpacing: '1.2px',
        textAlign: 'center'
      }}>
        {description}
      </p>
      
      <ul style={{
        listStyle: 'none',
        padding: 0,
        margin: '0 0 2rem 0',
        textAlign: 'left'
      }}>
        {features.map((feature, index) => (
          <li key={index} style={{
            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
            color: available ? '#6b7280' : '#9ca3af',
            marginBottom: '0.75rem',
            lineHeight: '1.4',
            fontFamily: 'Avenir',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <span style={{ flexShrink: 0 }}>•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <div style={{ marginTop: 'auto' }}>
        {!available ? (
          <div style={{
            display: 'block',
            width: '100%',
            background: '#d1d5db',
            color: '#6b7280',
            padding: '1rem',
            borderRadius: '0.75rem',
            textAlign: 'center',
            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
            boxSizing: 'border-box',
            minHeight: '54px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Avenir',
            letterSpacing: '1.2px',
            fontWeight: '600'
          }}>
            🚧 {buttonText} (Coming Soon)
          </div>
        ) : (
          <button onClick={onClick} style={{
            display: 'block',
            width: '100%',
            background: gradient.includes('purple') ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'linear-gradient(135deg, #3b82f6, #14b8a6)',
            color: 'white',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: 'none',
            fontWeight: '600',
            transition: 'all 0.2s',
            textAlign: 'center',
            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
            boxSizing: 'border-box',
            cursor: 'pointer',
            minHeight: '54px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            fontFamily: 'Avenir',
            letterSpacing: '1.2px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)'
          }}
          >
            🚀 {buttonText}
          </button>
        )}
      </div>
    </div>
  )
}