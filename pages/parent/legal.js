// pages/parent/legal.js - SIMPLIFIED: Clean localStorage at flow start + Database field
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Head from 'next/head'

export default function ParentLegal() {
  const router = useRouter();
  const { userProfile, hasCompletedOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Lux Libris Classic Theme
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }

  useEffect(() => {
    checkUserStatus();
  }, [userProfile, hasCompletedOnboarding]);

  const checkUserStatus = async () => {
    // Check if this is a returning user (has account with legal accepted in database)
    if (userProfile && userProfile.accountType === 'parent' && userProfile.legalAccepted === true) {
      setIsReturningUser(true);
    }
    // OR if they have completed onboarding (fallback for existing users)
    else if (userProfile && userProfile.accountType === 'parent' && await hasCompletedOnboarding()) {
      setIsReturningUser(true);
    }
    else {
      setIsReturningUser(false);
    }
  };

  const acceptAndProceed = async () => {
    setIsLoading(true);
    
    // Simple localStorage storage during account creation flow
    localStorage.setItem('hasAcceptedLegal', 'true');
    localStorage.setItem('acceptedTermsVersion', '2025.07.18');
    localStorage.setItem('parentTermsAccepted', 'true');
    
    router.push('/parent/onboarding');
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Family Terms & Privacy - Lux Libris School Reading Program</title>
        <meta name="description" content="Lux Libris Terms of Service and Privacy Policy for families participating in school reading programs" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '40px'
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              backgroundColor: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: luxTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ←
          </button>
          <h1 style={{
            fontSize: 'clamp(18px, 5vw, 22px)',
            fontWeight: '400',
            color: luxTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif'
          }}>
            School Reading Program Terms
          </h1>
        </div>

        <div style={{
          padding: '20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Welcome Section */}
          <div style={{
            background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: `0 8px 24px ${luxTheme.primary}30`,
            color: luxTheme.textPrimary
          }}>
            <h2 style={{
              fontSize: 'clamp(20px, 5vw, 26px)',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              margin: '0 0 12px 0'
            }}>
              {isReturningUser ? 'Terms Already Accepted' : 'Join Your Child\'s School Reading Program!'}
            </h2>
            <p style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              margin: '0',
              lineHeight: '1.5',
              opacity: 0.9
            }}>
              {isReturningUser ? (
                <>You have already accepted our Terms of Service and Privacy Policy. This page is for reference only.</>
              ) : (
                <>Your child&apos;s teacher or librarian provided a join code for Lux Libris! Support your child as they discover amazing books and unlock beautiful <strong>Luxlings™</strong> saint achievements as part of their school reading program.</>
              )}
            </p>
          </div>

          {/* Data Sharing Transparency */}
          {!isReturningUser && (
            <div style={{
              backgroundColor: luxTheme.surface,
              border: `2px solid ${luxTheme.primary}`,
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: 'clamp(16px, 4vw, 18px)',
                fontWeight: 'bold',
                color: luxTheme.textPrimary,
                marginBottom: '16px',
                fontFamily: 'Didot, serif'
              }}>
                🔍 Who Sees What - Complete Transparency
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                fontSize: 'clamp(12px, 3.5vw, 14px)',
                color: luxTheme.textPrimary
              }}>
                <div style={{ padding: '12px', backgroundColor: '#E8F4FD', borderRadius: '8px' }}>
                  <strong>📚 Your Child&apos;s Teacher/Librarian Sees:</strong><br/>
                  • Student name and grade<br/>
                  • Books submitted for reading<br/>
                  • Number of books completed
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F0F8E8', borderRadius: '8px' }}>
                  <strong>🏫 Your School Administration Sees:</strong><br/>
                  • Number of students per teacher<br/>
                  • Overall participation statistics<br/>
                  • NO individual names or book details
                </div>
                <div style={{ padding: '12px', backgroundColor: '#FFF0E8', borderRadius: '8px' }}>
                  <strong>🏛️ Diocese/District Sees:</strong><br/>
                  • Number of students per school<br/>
                  • Program participation totals<br/>
                  • NO names, books, or individual data
                </div>
              </div>
            </div>
          )}

          {/* Main Title */}
          <h2 style={{
            fontSize: 'clamp(18px, 5vw, 22px)',
            fontWeight: 'bold',
            fontFamily: 'Didot, serif',
            color: luxTheme.textPrimary,
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Terms of Service & Privacy Policy for School Reading Program
          </h2>

          {/* School-Focused Sections */}
          <div style={{ marginBottom: '32px' }}>
            <Section
              title="🏫 How the School Reading Program Works"
              content="Your child's school has licensed Lux Libris as an educational reading program:
• Teachers or librarians provide join codes for voluntary family participation
• **Participation is completely optional** - you choose whether to enroll your child
• Your child's educational staff can see their name, grade, and reading progress to support learning
• You maintain full control over your child's account and can delete it anytime
• The program is designed for grades 4-8 to support age-appropriate reading development

This creates a bridge between school reading goals and family engagement at home."
              theme={luxTheme}
            />

            <Section
              title="📊 Data Collection & Educational Use"
              content="When you enroll your child using the school join code, we collect:
• Your child's first name and grade level (4th-8th grade)
• Reading progress, book selections, and quiz results
• Achievement milestones and Luxlings™ saint unlocks
• Reading goals and preferences

**Educational Purpose:** This data helps your child's educational staff support their reading development while providing your child with personalized achievements and recommendations."
              theme={luxTheme}
            />

            <Section
              title="👶 COPPA Compliance & Parental Consent"
              content="For children under 13, you are providing informed consent under COPPA:
• You consent to collection of your child's educational reading data
• You understand your child's teacher/librarian can see their reading progress
• You can review, modify, or delete your child's information anytime
• Your child is identified by first name and last initial for privacy protection
• You can withdraw consent and delete the account through parent settings

By using the school join code, you're giving educational consent for this school-supported program."
              theme={luxTheme}
            />

            <Section
              title="🔄 Annual Data Refresh"
              content="Each school year, we provide a fresh start while maintaining continuity:
• **Kept:** Your child's name and updated grade level
• **Kept:** Lifetime reading goals to track long-term progress
• **Cleared:** Previous year's specific book submissions and quiz details
• **Updated:** Account settings refreshed for the new school year

This approach balances educational continuity with privacy protection and keeps data current."
              theme={luxTheme}
            />

            <Section
              title="🎯 Precise Data Sharing Levels"
              content="We maintain strict data boundaries at each level:

**Your Child's Teacher/Librarian:**
• Student name and current grade
• Books submitted and reading progress
• Number of books completed

**School Administration:**
• Total number of participating students per teacher
• Overall program engagement statistics
• NO access to individual student names or reading details

**Diocese/District:**
• Total number of participating students per school
• Program-wide participation metrics
• NO access to individual schools' detailed data

**Never Shared:** Personal family information, detailed reading preferences, or individual achievement data beyond the classroom level."
              theme={luxTheme}
            />

            <Section
              title="🛡️ Security & Privacy Protection"
              content="We protect your family's data with industry-standard security:
• Encrypted data storage and transmission via Google Cloud Platform
• Secure account access with controlled permissions
• Regular security audits and platform updates
• Privacy-focused design with minimal data collection
• No advertising or sale of personal information to third parties

Service providers who help operate the platform may access technical data, and we may be legally required to share information in specific circumstances."
              theme={luxTheme}
            />

            <Section
              title="🎨 Luxlings™ Educational Achievements"
              content="Your child will earn exclusive Luxlings™ saint artwork:
• 137 original chibi-style saint characters created by Dr. Verity Kahn
• Each achievement teaches about inspiring historical figures
• Earned through reading milestones and educational goals
• Designed to motivate continued reading and learning
• Celebrated both at home and in the educational setting

These achievements are part of the educational experience and help bridge school learning with family engagement."
              theme={luxTheme}
            />

            <Section
              title="⚙️ Your Control & Data Rights"
              content="You maintain complete control over your child's participation:
• **Access:** View all collected information in your account settings
• **Correction:** Update or correct any inaccurate information
• **Deletion:** Delete your child's account and data permanently anytime
• **Export:** Download your child's reading history and achievements
• **Withdrawal:** Remove your child from the program while keeping school access

Account deletion is immediate and permanent, removing all data from our systems within 30 days."
              theme={luxTheme}
            />

            <Section
              title="📞 Support & Educational Partnership"
              content="We support both families and educational staff:
• Technical assistance for account setup and management
• Privacy guidance and data questions
• Educational resources for supporting reading at home
• Coordination with your child's educational staff when appropriate

Our goal is to strengthen the partnership between home and school in supporting your child's reading development."
              theme={luxTheme}
            />

            <Section
              title="🔄 Policy Updates & Communication"
              content="We communicate changes transparently:
• Email notifications for significant policy updates
• 30-day advance notice before changes take effect
• Clear explanations of how changes affect your family
• Option to export data and withdraw if you disagree with changes
• Version tracking and availability of previous terms"
              theme={luxTheme}
            />
          </div>

          {/* Contact Information */}
          <div style={{
            backgroundColor: luxTheme.surface,
            border: `2px solid ${luxTheme.primary}`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              fontWeight: 'bold',
              color: luxTheme.textPrimary,
              marginBottom: '12px'
            }}>
              📧 Contact Information
            </h3>
            <div style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              color: luxTheme.textPrimary,
              lineHeight: '1.6'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Privacy Questions:</strong> support@luxlibris.org
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Technical Support:</strong> support@luxlibris.org
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Website:</strong> luxlibris.org
              </p>
              <p style={{
                fontSize: 'clamp(10px, 3vw, 12px)',
                color: luxTheme.textSecondary,
                fontStyle: 'italic',
                margin: '12px 0 0 0'
              }}>
                School Program Terms Version: 2025.07.18
              </p>
            </div>
          </div>

          {/* Bottom Info */}
          <div style={{
            backgroundColor: `${luxTheme.accent}30`,
            border: `2px solid ${luxTheme.accent}`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              fontWeight: '500',
              color: luxTheme.textPrimary,
              textAlign: 'center',
              margin: 0,
              lineHeight: '1.5'
            }}>
              {isReturningUser ? (
                'Terms were accepted during account creation. For current terms, visit luxlibris.org'
              ) : (
                'By clicking "I Accept & Enroll My Child", you provide parental consent for your child\'s participation in this school-supported reading program and agree to these Terms and Privacy Policy.'
              )}
            </p>
          </div>

          {/* Acceptance Button - Only show for new users */}
          {!isReturningUser && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                onClick={acceptAndProceed}
                disabled={isLoading}
                style={{
                  background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  padding: '18px 32px',
                  borderRadius: '16px',
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px ${luxTheme.primary}40`,
                  width: '100%',
                  maxWidth: '400px',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  minHeight: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: `2px solid ${luxTheme.textPrimary}`,
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Enrolling...
                  </div>
                ) : (
                  '✅ I Accept & Enroll My Child'
                )}
              </button>
            </div>
          )}

          {/* Go Back Button for returning users */}
          {isReturningUser && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => router.back()}
                style={{
                  backgroundColor: luxTheme.primary,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  width: '100%',
                  maxWidth: '300px',
                  minHeight: '56px',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                ← Return to Dashboard
              </button>
            </div>
          )}

          {/* Educational Partnership Footer */}
          <div style={{
            backgroundColor: luxTheme.surface,
            border: `1px solid ${luxTheme.primary}40`,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              fontWeight: '500',
              color: luxTheme.textPrimary,
              margin: '0 0 8px 0'
            }}>
              🌟 Supporting your child&apos;s reading journey at home and school!
            </p>
            <p style={{
              fontSize: 'clamp(10px, 3vw, 12px)',
              color: luxTheme.textSecondary,
              margin: 0
            }}>
              Partnership between families and educators • Visit luxlibris.org for resources
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            touch-action: manipulation;
          }
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        `}</style>
      </div>
    </>
  );
}

// Section Component with Lux Libris styling
function Section({ title, content, theme }) {
  return (
    <div style={{
      backgroundColor: theme.surface,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: `1px solid ${theme.primary}30`
    }}>
      <h3 style={{
        fontSize: 'clamp(14px, 4vw, 16px)',
        fontWeight: 'bold',
        color: theme.textPrimary,
        marginBottom: '12px',
        fontFamily: 'Didot, serif'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 'clamp(12px, 3.5vw, 14px)',
        color: theme.textPrimary,
        lineHeight: '1.6',
        margin: 0,
        whiteSpace: 'pre-line'
      }}>
        {content}
      </p>
    </div>
  );
}