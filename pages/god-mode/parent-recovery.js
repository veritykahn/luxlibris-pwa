// pages/god-mode/parent-recovery.js - Find and help incomplete parent accounts (God Mode Styled)
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Head from 'next/head';
import GodModeAuth from '../../components/god-mode/GodModeAuth';
import GodModeHeader from '../../components/god-mode/GodModeHeader';

export default function ParentRecovery() {
  const [incompleteParents, setIncompleteParents] = useState([]);
  const [recentlyFixedParents, setRecentlyFixedParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  // Test email function
  const sendTestEmail = async () => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'veritykahn@gmail.com',
          subject: 'Lux Libris Email System Test',
          text: 'This is a test email from the Lux Libris parent recovery system. If you receive this, the email integration is working correctly!',
          html: `
            <div style="font-family: Arial, sans-serif; color: #223848;">
              <h2 style="color: #ADD4EA;">🧪 Email System Test</h2>
              <p>This is a test email from the Lux Libris parent recovery system.</p>
              <p><strong>✅ If you receive this, the email integration is working correctly!</strong></p>
              <hr>
              <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
            </div>
          `,
          fromAccount: 'support'
        }),
      });

      if (response.ok) {
        alert('✅ Test email sent successfully to veritykahn@gmail.com!');
      } else {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API Error: ${errorData.error || 'Unknown error'} - ${errorData.details || ''}`);
      }
    } catch (error) {
      console.error('Test email error:', error);
      alert(`❌ Test email failed: ${error.message}`);
    }
  };

  // Find all incomplete parent accounts AND recently fixed ones
  const findIncompleteParents = async () => {
    try {
      console.log('🔍 Scanning for incomplete parent accounts...');
      
      const parentsRef = collection(db, 'parents');
      const parentsSnapshot = await getDocs(parentsRef);
      
      const incomplete = [];
      const recentlyFixed = [];
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      
      parentsSnapshot.forEach(doc => {
        const parentData = doc.data();
        
        // Check if parent account is incomplete
        const isIncomplete = !parentData.onboardingCompleted || 
                            !parentData.familyId || 
                            !parentData.parentProfile ||
                            !parentData.readingGoals;
        
        if (isIncomplete) {
          incomplete.push({
            id: doc.id,
            ...parentData,
            missingFields: {
              onboardingCompleted: !parentData.onboardingCompleted,
              familyId: !parentData.familyId,
              parentProfile: !parentData.parentProfile,
              readingGoals: !parentData.readingGoals,
              preferences: !parentData.preferences
            }
          });
        }
        
        // Check if recently fixed (completed in last hour)
        if (parentData.onboardingCompleted && 
            parentData.onboardingCompletedAt && 
            parentData.onboardingCompletedAt.toDate() > oneHourAgo) {
          recentlyFixed.push({
            id: doc.id,
            ...parentData,
            fixedAt: parentData.onboardingCompletedAt.toDate()
          });
        }
      });
      
      console.log(`📊 Found ${incomplete.length} incomplete parent accounts`);
      console.log(`📊 Found ${recentlyFixed.length} recently fixed parent accounts`);
      setIncompleteParents(incomplete);
      setRecentlyFixedParents(recentlyFixed);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error finding incomplete parents:', error);
      setLoading(false);
    }
  };

  // Generate recovery link for a parent
  const generateRecoveryLink = (parentId) => {
    return `${window.location.origin}/parent/recovery?id=${parentId}`;
  };

  // Send recovery email using real API
  const sendRecoveryEmail = async (parent) => {
    try {
      const recoveryLink = generateRecoveryLink(parent.id);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #223848;">
          <h2 style="color: #ADD4EA;">Your Lux Libris Parent Account is Ready!</h2>
          
          <p>Hi ${parent.firstName},</p>
          
          <p>Good news! We've resolved the technical issue with your Lux Libris parent account setup.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>You can now sign in at:</strong></p>
            <p><a href="${window.location.origin}/sign-in" style="color: #ADD4EA; font-size: 18px;">luxlibris.org/sign-in</a></p>
          </div>
          
          <p>Your account is fully set up and ready to:</p>
          <ul>
            <li>Track your family's reading progress</li>
            <li>Approve quiz codes for your children</li>
            <li>Participate in family reading battles</li>
            <li>Celebrate achievements together</li>
          </ul>
          
          <p>If you have any questions, simply reply to this email.</p>
          
          <p>Happy reading!<br>
          <strong>Lux Libris Support Team</strong></p>
        </div>
      `;

      const emailText = `
Hi ${parent.firstName},

Good news! We've resolved the technical issue with your Lux Libris parent account setup.

You can now sign in at: ${window.location.origin}/sign-in

Your account is fully set up and ready to track your family's reading progress, approve quiz codes, participate in family reading battles, and celebrate achievements together.

If you have any questions, simply reply to this email.

Happy reading!
Lux Libris Support Team
      `.trim();

      // Send email to parent
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: parent.email,
          subject: 'Your Lux Libris Parent Account is Ready!',
          text: emailText,
          html: emailHtml,
          fromAccount: 'support'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      // Send copy to veritykahn@luxlibris.org
      await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'veritykahn@luxlibris.org',
          subject: `[COPY] Parent Recovery Email Sent to ${parent.email}`,
          text: `Recovery email sent to: ${parent.firstName} ${parent.lastName} (${parent.email})\n\n--- EMAIL CONTENT ---\n\n${emailText}`,
          html: `<p><strong>Recovery email sent to:</strong> ${parent.firstName} ${parent.lastName} (${parent.email})</p><hr>${emailHtml}`,
          fromAccount: 'support'
        }),
      });

      alert(`✅ Recovery email sent successfully to ${parent.email} (copy sent to veritykahn@luxlibris.org)`);
    } catch (error) {
      console.error('Error sending recovery email:', error);
      alert(`❌ Failed to send email to ${parent.email}: ${error.message}`);
    }
  };

  // Send emails to all recently fixed parents
  const sendBulkRecoveryEmails = async () => {
    try {
      for (const parent of recentlyFixedParents) {
        await sendRecoveryEmail(parent);
        // Small delay between emails to be nice to the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Bulk email error:', error);
    }
  };

  // Bulk fix incomplete accounts (auto-complete with defaults)
  const bulkFixAccounts = async () => {
    if (!confirm(`Auto-fix ${incompleteParents.length} incomplete accounts with default settings?`)) {
      return;
    }
    
    setProcessing(true);
    const results = { success: 0, failed: 0, errors: [] };
    
    for (const parent of incompleteParents) {
      try {
        console.log(`🔧 Fixing account for ${parent.firstName} ${parent.lastName}`);
        
        const parentRef = doc(db, 'parents', parent.id);
        
        // Create default completion data
        const completionData = {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          familyName: parent.familyName || `The ${parent.lastName} Family`,
          
          // Default parent profile
          parentProfile: parent.parentProfile || {
            favoriteGenres: ['Fiction'],
            readingExperience: 'regular',
            supportStyle: 'encourager'
          },
          
          // Default reading goals
          readingGoals: parent.readingGoals || {
            parentDaily: 20,
            familyWeekly: 150,
            competitionMode: true
          },
          
          // Default preferences
          preferences: parent.preferences || {
            notifications: {
              achievements: true,
              quizUnlocks: true,
              weeklyProgress: true,
              familyBattles: true
            },
            themes: {
              preferredTheme: 'classic_lux',
              allowChildThemeChanges: true
            }
          },
          
          // Ensure legal acceptance
          legalAccepted: true,
          legalAcceptedAt: parent.legalAcceptedAt || new Date(),
          termsVersion: '2025.07.18',
          
          lastUpdated: new Date()
        };
        
        // Only add familyId if they don't have one
        if (!parent.familyId && parent.linkedStudents?.length > 0) {
          // Use parentId as familyId for single-parent families
          completionData.familyId = parent.id;
        }
        
        await updateDoc(parentRef, completionData);
        
        results.success++;
        console.log(`✅ Fixed ${parent.firstName} ${parent.lastName}`);
        
      } catch (error) {
        results.failed++;
        results.errors.push(`${parent.firstName} ${parent.lastName}: ${error.message}`);
        console.error(`❌ Failed to fix ${parent.firstName}:`, error);
      }
    }
    
    setResults(results);
    setProcessing(false);
    
    // Refresh the list
    await findIncompleteParents();
  };

  useEffect(() => {
    findIncompleteParents();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #a855f7',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'white' }}>Scanning parent accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <GodModeAuth pageName="Parent Account Recovery">
      {({ isAuthenticated, sessionTimeRemaining, handleLogout }) => (
        <>
          <Head>
            <title>Parent Recovery - GOD MODE - Lux Libris</title>
          </Head>

          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            
            <GodModeHeader 
              title="Parent Account Recovery"
              icon="👨‍👩‍👧‍👦"
              sessionTimeRemaining={sessionTimeRemaining}
              onLogout={handleLogout}
              showDashboardButton={true}
              showManagerButton={true}
            />

            <div style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '2rem 1.5rem'
            }}>
              
              {/* Header */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '0.75rem',
                padding: '2rem',
                marginBottom: '2rem',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 1rem 0',
                  fontFamily: 'Georgia, serif'
                }}>
                  👨‍👩‍👧‍👦 Parent Account Recovery Center
                </h1>
                <p style={{
                  color: '#c084fc',
                  margin: 0,
                  fontSize: '1.125rem'
                }}>
                  Find and fix parent accounts that got stuck during onboarding
                </p>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: incompleteParents.length > 0 ? '2px solid #ef444440' : '2px solid #10b98140'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: incompleteParents.length > 0 ? '#ef4444' : '#10b981'
                  }}>
                    {incompleteParents.length}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Incomplete Accounts
                  </div>
                </div>

                {results && (
                  <>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      textAlign: 'center',
                      border: '2px solid #10b98140'
                    }}>
                      <div style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#10b981'
                      }}>
                        {results.success}
                      </div>
                      <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                        Fixed Successfully
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      textAlign: 'center',
                      border: results.failed > 0 ? '2px solid #ef444440' : '2px solid #6b728040'
                    }}>
                      <div style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: results.failed > 0 ? '#ef4444' : '#6b7280'
                      }}>
                        {results.failed}
                      </div>
                      <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                        Failed to Fix
                      </div>
                    </div>
                  </>
                )}

                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  border: recentlyFixedParents.length > 0 ? '2px solid #f59e0b40' : '2px solid #6b728040'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: recentlyFixedParents.length > 0 ? '#f59e0b' : '#6b7280'
                  }}>
                    {recentlyFixedParents.length}
                  </div>
                  <div style={{ color: '#c084fc', fontSize: '0.875rem' }}>
                    Recently Fixed
                  </div>
                </div>
              </div>

              {/* Actions */}
              {incompleteParents.length > 0 && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  border: '1px solid rgba(168, 85, 247, 0.3)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 1rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    ⚡ Bulk Actions
                  </h2>
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={sendTestEmail}
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🧪 Send Test Email
                    </button>

                    <button
                      onClick={bulkFixAccounts}
                      disabled={processing}
                      style={{
                        background: processing ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        cursor: processing ? 'not-allowed' : 'pointer',
                        opacity: processing ? 0.7 : 1,
                        fontWeight: '600'
                      }}
                    >
                      {processing ? '⏳ Fixing...' : '🔧 Auto-Fix All Accounts'}
                    </button>

                    <button
                      onClick={() => {
                        incompleteParents.forEach(parent => {
                          console.log(`Recovery link for ${parent.email}: ${generateRecoveryLink(parent.id)}`);
                        });
                        alert('Recovery links logged to console');
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🔗 Generate All Recovery Links
                    </button>
                  </div>
                  
                  <p style={{
                    color: '#c084fc',
                    fontSize: '0.875rem',
                    margin: '1rem 0 0 0'
                  }}>
                    Auto-fix will complete accounts with default settings. Users can modify these later.
                  </p>
                </div>
              )}

              {/* Recently Fixed Parents List */}
              {recentlyFixedParents.length > 0 && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '2px solid #f59e0b60',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  marginBottom: '2rem',
                  backdropFilter: 'blur(8px)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                    margin: '0 0 1rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    🎉 Recently Fixed Accounts (Last Hour)
                  </h2>
                  <p style={{
                    color: '#fbbf24',
                    marginBottom: '1.5rem'
                  }}>
                    These accounts were just fixed! Send them recovery emails so they know their accounts are ready.
                  </p>

                  <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                    {recentlyFixedParents.map(parent => (
                      <div key={parent.id} style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid #f59e0b60',
                        borderRadius: '0.5rem',
                        padding: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.5rem'
                        }}>
                          <div>
                            <strong style={{ color: 'white' }}>
                              {parent.firstName} {parent.lastName}
                            </strong>
                            <div style={{ color: '#fbbf24' }}>
                              {parent.email}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#c084fc' }}>
                              Fixed at: {parent.fixedAt?.toLocaleString() || 'Just now'}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => sendRecoveryEmail(parent)}
                              style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              📧 Send &quot;Account Ready&quot; Email
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={sendBulkRecoveryEmails}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      width: '100%',
                      fontWeight: '600'
                    }}
                  >
                    📧 Send &quot;Account Ready&quot; Emails to All {recentlyFixedParents.length} Parents
                  </button>
                </div>
              )}

              {/* Incomplete Parents List */}
              {incompleteParents.length > 0 ? (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 1rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    🔧 Incomplete Parent Accounts
                  </h2>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {incompleteParents.map(parent => (
                      <div key={parent.id} style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '0.5rem',
                        padding: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.5rem'
                        }}>
                          <div>
                            <strong style={{ color: 'white' }}>
                              {parent.firstName} {parent.lastName}
                            </strong>
                            <div style={{ color: '#c084fc' }}>
                              {parent.email}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                              Account created: {parent.accountCreated?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => sendRecoveryEmail(parent)}
                              style={{
                                background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                padding: '0.5rem 1rem',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              📧 Send Recovery Email
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.875rem' }}>
                          <strong style={{ color: 'white' }}>Missing fields:</strong>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                            {Object.entries(parent.missingFields).map(([field, missing]) => 
                              missing && (
                                <span key={field} style={{
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  color: '#ef4444',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  border: '1px solid rgba(239, 68, 68, 0.4)'
                                }}>
                                  {field}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '0.75rem',
                  padding: '3rem',
                  textAlign: 'center',
                  border: '2px solid #10b98140'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    color: 'white',
                    margin: '0 0 0.5rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    All Parent Accounts Complete!
                  </h2>
                  <p style={{ color: '#c084fc' }}>
                    No incomplete parent accounts found.
                  </p>
                </div>
              )}

              {/* Results */}
              {results && (
                <div style={{
                  background: results.success > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `2px solid ${results.success > 0 ? '#10b98160' : '#ef444460'}`,
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  marginTop: '2rem',
                  backdropFilter: 'blur(8px)'
                }}>
                  <h3 style={{
                    color: results.success > 0 ? '#10b981' : '#ef4444',
                    margin: '0 0 1rem 0',
                    fontFamily: 'Georgia, serif'
                  }}>
                    🔧 Bulk Fix Results
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', color: 'white' }}>
                    Successfully fixed: <strong style={{ color: '#10b981' }}>{results.success}</strong> accounts
                    <br />
                    Failed: <strong style={{ color: '#ef4444' }}>{results.failed}</strong> accounts
                  </p>
                  
                  {results.errors.length > 0 && (
                    <div>
                      <strong style={{ color: 'white' }}>Errors:</strong>
                      <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                        {results.errors.map((error, index) => (
                          <li key={index} style={{ color: '#ef4444' }}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </>
      )}
    </GodModeAuth>
  );
}