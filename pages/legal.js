// pages/legal.js - FIXED to be static for returning users
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head'

export default function Legal() {
  const router = useRouter();
  const { userProfile, hasCompletedOnboarding } = useAuth();
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    // Check if this is a returning user who has already completed onboarding
    if (userProfile && hasCompletedOnboarding()) {
      setIsReturningUser(true);
    }
  }, [userProfile, hasCompletedOnboarding]);

  const acceptAndProceed = async () => {
    setIsLoading(true);
    
    // Store acceptance in localStorage for PWA
    localStorage.setItem('hasAcceptedLegal', 'true');
    localStorage.setItem('acceptedTermsVersion', '2025.06.27');
    
    // Navigate based on user type (could be passed as query param)
    const flow = router.query.flow || 'student-onboarding';

    // Route based on flow parameter
    switch (flow) {
      case 'student-onboarding':
        router.push('/student-onboarding');
        break;
      case 'parent-onboarding':
        router.push('/parent-onboarding');
        break;
      case 'admin-onboarding':
        router.push('/admin/school-onboarding');
        break;
      default:
        router.push('/student-onboarding');
    }
    
    setIsLoading(false);
  };

  return (
  <>
    <Head>
      <title>Terms & Privacy - Lux Libris</title>
      <meta name="description" content="Lux Libris Terms of Service and Privacy Policy for students, parents, and schools" />
      <link rel="icon" href="/images/lux_libris_logo.png" />
    </Head>
    
    <div style={{
      backgroundColor: '#FFFCF5',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#C3E0DE',
        padding: '16px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#223848',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ←
          </button>
          <h1 style={{
            fontFamily: 'Didot, serif',
            fontSize: '20px',
            color: '#223848',
            margin: 0
          }}>
            Privacy & Terms
          </h1>
        </div>
      </div>

      <div style={{
        padding: '24px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Welcome Section - Different for returning users */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            fontFamily: 'Didot, serif',
            color: '#223848',
            marginBottom: '16px'
          }}>
            {isReturningUser ? 'Terms Already Accepted' : 'Welcome to Lux Libris!'}
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#223848',
            lineHeight: '1.5',
            marginBottom: '24px'
          }}>
            {isReturningUser ? (
              <>You have already accepted our Terms of Service and Privacy Policy. This page is for reference only.</>
            ) : (
              <>Welcome to your reading journey! As you read amazing books, you&apos;ll unlock beautiful <strong>Luxlings™</strong> saint achievements created exclusively for Lux Libris. By continuing, you agree to our Terms of Service and Privacy Policy.</>
            )}
          </p>
        </div>

        {/* Main Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'Didot, serif',
          color: '#223848',
          marginBottom: '20px'
        }}>
          Lux Libris Terms of Service & Privacy Policy
        </h2>

        {/* Sections */}
        <div style={{ marginBottom: '32px' }}>
          <Section
            title="📊 Data Collection & Use"
            content="Lux Libris collects basic information including:
• Student first name and last initial
• Grade level (4th-8th grade)
• Reading progress and book selections
• Quiz results and achievement milestones
• Reading goals and preferences

This data is used exclusively for tracking reading progress, generating achievement rewards, and improving the educational experience."
          />

          <Section
            title="🔒 Privacy & Protection"
            content="Your privacy is our top priority:
• No personally identifiable information (PII) is publicly shared
• Student data is only accessible to authorized school administrators
• Parent verification codes protect quiz access
• Data is never sold or shared with third parties
• Students are identified by first name and last initial only"
          />

          <Section
            title="🛡️ Data Security"
            content="We implement industry-standard security measures:
• Secure cloud storage with Firebase
• Data encryption in transit and at rest
• Access restricted to authorized personnel only
• Regular security audits and updates
• COPPA and FERPA compliant practices"
          />

          <Section
            title="👨‍👩‍👧‍👦 Parental Consent"
            content="For users under 13:
• Schools obtain necessary parental consent before registration
• Parents may request data deletion at any time
• Parents can review their child's data through school administrators
• Educational use falls under school's existing consent policies"
          />

          <Section
            title="🎨 Luxlings™ & Intellectual Property"
            content="Lux Libris features original Luxlings™ saint artwork:
- 137 original chibi-style saint characters created exclusively for Lux Libris
- Proprietary saint achievement system and reward structure
- Luxlings™ is a trademark of Lux Libris
- Original artwork by Dr. Verity Kahn, all rights reserved
- Students enjoy these achievements as part of the educational program
- Unauthorized reproduction, distribution, or commercial use is prohibited
- Educational fair use permitted with proper attribution

All other content including app design, user interface, educational concepts, and achievement systems are also protected by copyright and trademark law."
          />

          <Section
            title="📋 School Administrator Rights"
            content="Authorized school personnel may:
• View reading progress for their registered students
• Export educational reports and analytics
• Manage student accounts and goals
• Configure school-specific reading lists
• Access usage statistics for program evaluation"
          />

          <Section
            title="🔄 Terms Updates"
            content="These terms may be updated as Lux Libris evolves. Users will be notified of significant changes and may need to re-accept updated terms."
          />
        </div>

        {/* Contact Information */}
        <div style={{
          backgroundColor: '#ADD4EA30',
          border: '1px solid #ADD4EA',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#223848',
            marginBottom: '8px'
          }}>
            📧 Contact Information
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#223848',
            marginBottom: '8px',
            lineHeight: '1.5'
          }}>
            Questions or concerns? Contact us at:<br/>
            Website: luxlibris.org<br/>
            Support: support@luxlibris.org
          </p>
          <p style={{
            fontSize: '12px',
            color: '#666666',
            fontStyle: 'italic',
            margin: 0
          }}>
            Version: 2025.06.27
          </p>
        </div>

        {/* Bottom Info */}
        <div style={{
          backgroundColor: '#F0F8FF',
          border: '1px solid #ADD4EA',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#223848',
            textAlign: 'center',
            margin: 0
          }}>
            {isReturningUser ? (
              'Terms were accepted during account creation. For the most current version, please visit luxlibris.org'
            ) : (
              'By tapping "I Accept & Continue", you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and Privacy Policy.'
            )}
          </p>
        </div>

        {/* Acceptance Button - Only show for new users */}
        {!isReturningUser && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={acceptAndProceed}
              disabled={isLoading}
              style={{
                backgroundColor: '#ADD4EA',
                color: '#223848',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                letterSpacing: '1.2px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '300px',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Processing...' : 'I Accept & Continue'}
            </button>
          </div>
        )}

        {/* Go Back Button for returning users */}
        {isReturningUser && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => router.back()}
              style={{
                backgroundColor: '#C3E0DE',
                color: '#223848',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                letterSpacing: '1.2px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '300px'
              }}
            >
              ← Go Back
            </button>
          </div>
        )}

        {/* Reference Note */}
        <div style={{
          backgroundColor: '#F0F8FF',
          border: '1px solid #ADD4EA',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px'
        }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#223848',
            textAlign: 'center',
            margin: 0
          }}>
            For the most current version of our terms and additional information, please visit luxlibris.org
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

// Section Component
function Section({ title, content }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#223848',
        marginBottom: '8px'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: '#223848',
        lineHeight: '1.5',
        margin: 0,
        whiteSpace: 'pre-line'
      }}>
        {content}
      </p>
    </div>
  );
}