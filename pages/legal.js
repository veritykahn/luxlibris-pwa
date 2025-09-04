// pages/legal.js - FIXED: Prevents cross-account legal acceptance conflicts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Head from 'next/head'

export default function StudentLegal() {
  const router = useRouter();
  const { userProfile, hasCompletedOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [showClearDataOption, setShowClearDataOption] = useState(false);

  useEffect(() => {
    checkUserStatus();
  }, [userProfile, hasCompletedOnboarding]);

  const checkUserStatus = async () => {
    // Only show "returning user" if there's an actual authenticated user who has completed onboarding
    if (userProfile && await hasCompletedOnboarding()) {
      setIsReturningUser(true);
      setShowClearDataOption(false);
    } else {
      // Check if there's orphaned legal acceptance data from a previous user
      if (typeof window !== 'undefined') {
        const hasOrphanedAcceptance = localStorage.getItem('hasAcceptedLegal') === 'true';
        const hasCurrentFlow = localStorage.getItem('luxlibris_account_flow') || 
                              localStorage.getItem('tempTeacherData') || 
                              localStorage.getItem('tempParentData');
        
        // If there's legal acceptance but no current account flow, show clear option
        if (hasOrphanedAcceptance && !hasCurrentFlow && !userProfile) {
          setShowClearDataOption(true);
          console.log('⚠️ Detected orphaned legal acceptance from previous user');
        }
      }
      setIsReturningUser(false);
    }
  };

  const clearPreviousData = () => {
    if (typeof window !== 'undefined') {
      // Clear only the legal-related data, not all localStorage
      localStorage.removeItem('hasAcceptedLegal');
      localStorage.removeItem('acceptedTermsVersion');
      setShowClearDataOption(false);
      console.log('🧹 Cleared previous legal acceptance data');
    }
  };

  const acceptAndProceed = async () => {
    setIsLoading(true);
    
    // Create user-specific key if we have account flow data
    const accountFlow = localStorage.getItem('luxlibris_account_flow');
    const timestamp = Date.now();
    
    // Store acceptance with account flow context
    if (accountFlow) {
      localStorage.setItem(`hasAcceptedLegal_${accountFlow}_${timestamp}`, 'true');
      localStorage.setItem(`acceptedTermsVersion_${accountFlow}_${timestamp}`, '2025.07.18');
    } else {
      // Fallback to global if no flow context
      localStorage.setItem('hasAcceptedLegal', 'true');
      localStorage.setItem('acceptedTermsVersion', '2025.07.18');
    }
    
    const flow = router.query.flow || 'student-onboarding';
    switch (flow) {
      case 'student-onboarding':
        router.push('/student-onboarding');
        break;
      case 'parent-onboarding':
        router.push('/parent/onboarding');
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
        <title>Terms & Privacy - Lux Libris School Reading Program</title>
        <meta name="description" content="Lux Libris Terms of Service and Privacy Policy for Students" />
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
          {/* NEW: Clear Previous Data Option */}
          {showClearDataOption && (
            <div style={{
              backgroundColor: '#fef3cd',
              border: '2px solid #f59e0b',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#92400e',
                marginBottom: '12px',
                margin: '0 0 12px 0'
              }}>
                ⚠️ Setting up a NEW account?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#92400e',
                marginBottom: '16px',
                lineHeight: '1.4',
                margin: '0 0 16px 0'
              }}>
                It looks like someone already accepted our terms on this computer. If you're setting up a <strong>different</strong> account for a <strong>different person</strong>, please clear the previous data first.
              </p>
              <button
                onClick={clearPreviousData}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  marginRight: '12px'
                }}
              >
                🧹 Clear & Start Fresh
              </button>
              <button
                onClick={() => window.location.href = 'https://www.luxlibris.org/sign-in'}
                style={{
                  backgroundColor: '#ADD4EA',
                  color: '#223848',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                🔑 Or Sign Into Existing Account
              </button>
            </div>
          )}

          {/* Welcome Section */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              color: '#223848',
              marginBottom: '16px'
            }}>
              {isReturningUser ? 'Terms Already Accepted' : 'Welcome to Your School Reading Program!'}
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#223848',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              {isReturningUser ? (
                <>You have already accepted our Terms and Privacy Policy. This page is for reference only.</>
              ) : (
                <>Your teacher or librarian gave your parent a special join code so you can join Lux Libris! As you read amazing books, you'll unlock beautiful <strong>Luxlings™</strong> saint achievements. Your reading journey starts here!</>
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
            Lux Libris Terms & Privacy Policy for Students
          </h2>

          {/* Kid-Friendly Sections */}
          <div style={{ marginBottom: '32px' }}>
            <Section
              title="🏫 How Your School Reading Program Works"
              content="Your school uses Lux Libris to make reading more fun! Here's how it works:
• Your teacher or librarian gave your parent a special join code
• Your educational staff can see your name, grade, and which books you've read
• They can see how many books you've finished to help support your reading
• Your school sees how many students are participating (but not your personal info)
• Your diocese/district only sees how many students total are reading

Your educational staff wants to help you become an amazing reader!"
            />

            <Section
              title="📊 What Information We Keep Track Of"
              content="To help you on your reading journey, we keep track of:
• Your first name and grade (4th-8th grade only)
• Which books you've read and finished
• Your quiz results and reading progress
• The beautiful Luxlings™ saints you've earned
• Your reading goals and favorite types of books

We only collect what helps you read better and earn achievements!"
            />

            <Section
              title="👨‍👩‍👧‍👦 Your Parent's Permission"
              content="Your parent said YES to let you use Lux Libris:
• They used the join code from your teacher/librarian to sign you up
• They know your educational staff can see your reading progress
• They can help you with your account if you need it
• They can delete your account if your family wants to stop
• You need their permission because you're under 18

Your parent is your partner in this reading adventure!"
            />

            <Section
              title="🔄 Fresh Start Each School Year"
              content="Every school year, we give you a fresh start:
• We keep your name and update your grade level
• We keep your lifetime reading goals to track your amazing progress
• Everything else gets cleared out for a new year of reading
• This helps keep your information current and safe
• Your earned achievements and progress stay with you!

Each year is a new reading adventure!"
            />

            <Section
              title="🎨 Your Amazing Luxlings™ Achievements"
              content="The saint pictures you earn are very special:
• 137 beautiful chibi-style saints created just for Lux Libris
• Each one tells the story of an inspiring person from history
• You earn them by reading books and reaching your goals
• They're yours to enjoy and share with your family
• The artwork belongs to Lux Libris, but your achievements are yours!

Every Luxling you earn shows how hard you've worked!"
            />

            <Section
              title="🔒 Keeping You Safe Online"
              content="We protect your information carefully:
• Your data is stored safely with special computer security
• Only you, your parent, your educational staff, and Lux Libris can see your reading info
• We never sell your information to advertisers
• We only use your information to help you read better and learn
• If legally required, we might have to share information, but we protect you

We want you to feel safe while you read and learn!"
            />

            <Section
              title="⚙️ Managing Your Reading Account"
              content="You have control over your reading journey:
• You can see your progress and achievements anytime
• Your parent can help you change your settings
• When you're older, you can manage your own account
• Your parent can delete your account if your family chooses to
• You can always ask questions about your information

Contact support@luxlibris.org if you need help with anything!"
            />

            <Section
              title="📚 Having Fun & Learning Together"
              content="Lux Libris is designed to support your education:
• Read books you enjoy and discover new favorites
• Celebrate every achievement you earn with your class
• Share your progress with your family and educational staff
• Learn about inspiring saints and historical figures
• Build healthy reading habits that will help you forever

Reading is an adventure - enjoy every page!"
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
              📧 Need Help?
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#223848',
              marginBottom: '8px',
              lineHeight: '1.5'
            }}>
              If you have questions, ask your parent to contact us:<br/>
              Privacy Questions: support@luxlibris.org<br/>
              Website: luxlibris.org
            </p>
            <p style={{
              fontSize: '12px',
              color: '#666666',
              fontStyle: 'italic',
              margin: 0
            }}>
              Student Terms Version: 2025.07.18
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
                'Terms were accepted when your account was created. Happy reading!'
              ) : (
                'By clicking "I Accept & Start Reading", you agree to these Terms and Privacy Policy with your parent\'s permission.'
              )}
            </p>
          </div>

          {/* Buttons */}
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
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  width: '100%',
                  maxWidth: '300px',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Starting...' : '📚 I Accept & Start Reading!'}
              </button>
            </div>
          )}

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
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  width: '100%',
                  maxWidth: '300px'
                }}
              >
                ← Back to Reading
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

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