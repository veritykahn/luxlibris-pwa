// pages/parent/legal.js - Dedicated legal page for parents
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head'

export default function ParentLegal() {
  const router = useRouter();
  const { userProfile, hasCompletedOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  useEffect(() => {
    // Check if this is a returning user who has already completed onboarding
    if (userProfile && userProfile.accountType === 'parent' && hasCompletedOnboarding()) {
      setIsReturningUser(true);
    }
  }, [userProfile, hasCompletedOnboarding]);

  const acceptAndProceed = async () => {
    setIsLoading(true);
    
    // Store acceptance in localStorage for PWA
    localStorage.setItem('hasAcceptedLegal', 'true');
    localStorage.setItem('acceptedTermsVersion', '2025.06.27');
    localStorage.setItem('parentTermsAccepted', 'true');
    
    // Always route to parent onboarding
    router.push('/parent/onboarding');
    
    setIsLoading(false);
  };

  return (
  <>
    <Head>
      <title>Family Terms & Privacy - Lux Libris</title>
      <meta name="description" content="Lux Libris Terms of Service and Privacy Policy for families" />
      <link rel="icon" href="/images/lux_libris_logo.png" />
    </Head>
    
    <div style={{
      backgroundColor: '#FFFCF5',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #34D399, #10B981)',
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
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px'
            }}
          >
            ←
          </button>
          <h1 style={{
            fontFamily: 'Didot, serif',
            fontSize: '20px',
            color: 'white',
            margin: 0
          }}>
            Family Terms & Privacy
          </h1>
        </div>
      </div>

      <div style={{
        padding: '24px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            fontFamily: 'Didot, serif',
            color: '#223848',
            marginBottom: '16px'
          }}>
            {isReturningUser ? 'Terms Already Accepted' : 'Welcome to Your Family\'s Reading Journey!'}
          </h2>
          <p style={{
            fontSize: '18px',
            color: '#223848',
            lineHeight: '1.6',
            marginBottom: '24px'
          }}>
            {isReturningUser ? (
              <>You have already accepted our Family Terms and Privacy Policy. This page is for reference only.</>
            ) : (
              <>Support your children as they discover amazing books and unlock beautiful <strong>Luxlings™</strong> saint achievements. Together, you'll create lasting reading memories and healthy family habits.</>
            )}
          </p>
        </div>

        {/* Key Family Benefits */}
        {!isReturningUser && (
          <div style={{
            background: 'linear-gradient(135deg, #34D39920, #10B98120)',
            border: '2px solid #34D399',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#223848',
              marginBottom: '16px',
              fontFamily: 'Didot, serif'
            }}>
              🏠 What Your Family Account Includes
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              fontSize: '14px',
              color: '#065f46'
            }}>
              <div>
                <strong>📊 Progress Tracking</strong><br/>
                Watch your children's reading journey unfold
              </div>
              <div>
                <strong>🔐 Quiz Approval</strong><br/>
                Help unlock your child's next achievement
              </div>
              <div>
                <strong>🏆 Family Battles</strong><br/>
                Compete together in reading challenges
              </div>
              <div>
                <strong>🎉 Celebration Tools</strong><br/>
                Share in every reading milestone
              </div>
            </div>
          </div>
        )}

        {/* Main Title */}
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'Didot, serif',
          color: '#223848',
          marginBottom: '20px'
        }}>
          Family Terms of Service & Privacy Policy
        </h2>

        {/* Family-Focused Sections */}
        <div style={{ marginBottom: '32px' }}>
          <Section
            title="👨‍👩‍👧‍👦 Your Family's Data"
            content="We collect only what's needed for your family's reading journey:
• Your contact information for account access
• Your children's first names and reading progress
• Family reading goals and preferences
• Quiz approval history and achievement celebrations

All data is used exclusively to enhance your family's reading experience and is never sold or shared with third parties."
          />

          <Section
            title="🔒 Your Privacy Rights"
            content="As a parent, you have complete control:
• View all data we collect about your family
• Request deletion of your family's data at any time
• Control what information is shared with schools
• Manage your children's quiz access and approvals
• Download your family's reading history

Your children are identified only by first name and last initial - no full names or personal details are visible to others."
          />

          <Section
            title="🏫 School Partnership"
            content="Your family account works alongside your child's school:
• Teachers can see reading progress to support learning
• You control whether family participation is visible to schools
• School data remains separate from family account data
• You can opt out of school data sharing at any time
• Educational use falls under your school's existing privacy policies"
          />

          <Section
            title="🛡️ Keeping Your Family Safe"
            content="We protect your family with industry-leading security:
• Bank-level encryption for all data storage and transfer
• Secure account linking that only you can control
• Regular security audits and updates
• COPPA and FERPA compliant practices
• No third-party data sharing or advertising

Your family's reading journey stays private and secure."
          />

          <Section
            title="🎨 Luxlings™ Achievements"
            content="Your children will unlock original Luxlings™ saint artwork:
• 137 exclusive chibi-style saint characters
• Created specifically for Lux Libris by Dr. Verity Kahn
• Earned through reading milestones and healthy habits
• Celebrated in your family dashboard
• Shareable within your family unit

These achievements are part of the educational experience and help motivate reading while teaching about inspiring historical figures."
          />

          <Section
            title="🏆 Family Reading Battles"
            content="Optional family competition features:
• Parents vs children reading challenges
• Family goal tracking and celebrations
• Friendly leaderboards within your family only
• Motivational notifications and progress sharing
• Completely optional - you control participation

All family battle data stays within your family unit and is never shared publicly."
          />

          <Section
            title="👶 Children Under 13"
            content="We follow strict guidelines for young readers:
• Schools obtain required parental consent before student registration
• Family accounts provide additional parental oversight
• You can review and delete your child's data at any time
• Educational use is covered under school consent policies
• We never collect unnecessary personal information from children"
          />

          <Section
            title="📞 Family Support"
            content="We're here to help your family succeed:
• Dedicated family support at families@luxlibris.org
• Help with account setup and student linking
• Guidance on supporting your child's reading
• Technical assistance with quiz approvals
• Resources for building family reading habits"
          />

          <Section
            title="🔄 Policy Updates"
            content="We'll notify you of any important changes:
• Email notifications for policy updates affecting families
• Opportunity to review changes before they take effect
• Option to export your data if you choose not to continue
• Clear explanations of what changes mean for your family"
          />
        </div>

        {/* Contact Information */}
        <div style={{
          backgroundColor: '#34D39920',
          border: '2px solid #34D399',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#223848',
            marginBottom: '12px'
          }}>
            📧 Family Support Contacts
          </h3>
          <div style={{
            fontSize: '14px',
            color: '#223848',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Family Support:</strong> families@luxlibris.org
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Technical Help:</strong> support@luxlibris.org  
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Website:</strong> luxlibris.org
            </p>
            <p style={{
              fontSize: '12px',
              color: '#666666',
              fontStyle: 'italic',
              margin: '12px 0 0 0'
            }}>
              Family Terms Version: 2025.06.27
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <div style={{
          backgroundColor: '#F0F8FF',
          border: '2px solid #ADD4EA',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '16px',
            fontWeight: '500',
            color: '#223848',
            textAlign: 'center',
            margin: 0,
            lineHeight: '1.5'
          }}>
            {isReturningUser ? (
              'Terms were accepted during account creation. For the most current version, please visit luxlibris.org'
            ) : (
              'By clicking "I Accept & Create My Family Account", you agree to these Family Terms and Privacy Policy. You\'re taking an important step in supporting your child\'s reading journey!'
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
                background: 'linear-gradient(135deg, #34D399, #10B981)',
                color: 'white',
                border: 'none',
                padding: '20px 40px',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(52, 211, 153, 0.3)',
                width: '100%',
                maxWidth: '400px',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 6px 16px rgba(52, 211, 153, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 12px rgba(52, 211, 153, 0.3)'
                }
              }}
            >
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Creating Account...
                </div>
              ) : (
                '✅ I Accept & Create My Family Account'
              )}
            </button>
          </div>
        )}

        {/* Go Back Button for returning users */}
        {isReturningUser && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => router.back()}
              style={{
                backgroundColor: '#34D399',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '300px'
              }}
            >
              ← Return to Dashboard
            </button>
          </div>
        )}

        {/* Family-Focused Footer */}
        <div style={{
          backgroundColor: '#FFFCF5',
          border: '1px solid #34D39940',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#223848',
            margin: '0 0 8px 0'
          }}>
            🌟 Thank you for supporting your child's reading journey!
          </p>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: 0
          }}>
            For the most current terms and family resources, visit luxlibris.org/families
          </p>
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

// Section Component
function Section({ title, content }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#223848',
        marginBottom: '12px',
        fontFamily: 'Didot, serif'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: '#223848',
        lineHeight: '1.6',
        margin: 0,
        whiteSpace: 'pre-line'
      }}>
        {content}
      </p>
    </div>
  );
}