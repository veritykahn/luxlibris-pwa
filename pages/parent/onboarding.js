// pages/parent/onboarding.js - Updated with Lux Libris styling and mobile optimization
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { createParentAccount, linkParentToStudent } from '../../lib/parentLinking'

export default function ParentOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [onboardingData, setOnboardingData] = useState(null)
  const [familyData, setFamilyData] = useState({
    familyName: '',
    readingGoals: {
      parentDaily: 20, // minutes
      familyWeekly: 150, // minutes
      competitionMode: true
    },
    preferences: {
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
    parentProfile: {
      favoriteGenres: [],
      readingExperience: '',
      supportStyle: ''
    }
  })

  // UPDATED: Lux Libris Classic Theme (same as student dashboard)
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }

  // Load temp data and create account if needed
  useEffect(() => {
    const handleAccountCreation = async () => {
      if (typeof window !== 'undefined') {
        // Check for temp data (new flow)
        const tempData = localStorage.getItem('tempParentData')
        
        if (tempData) {
          const data = JSON.parse(tempData)
          console.log('🔧 Creating parent account from temp data...')
          
          try {
            setLoading(true)
            
            // Create parent account
            const parentId = await createParentAccount(
              data.parentInfo.email,
              data.parentInfo.password,
              data.parentInfo.firstName,
              data.parentInfo.lastName
            )

            console.log('✅ Parent account created:', parentId)

            // Link to each student
            const successfulLinks = []
            const failedLinks = []
            
            for (const inviteCode of data.validInviteCodes) {
              try {
                console.log('🔗 Linking to student with code:', inviteCode)
                const linkResult = await linkParentToStudent(parentId, inviteCode)
                successfulLinks.push({
                  inviteCode,
                  student: linkResult
                })
                console.log('✅ Successfully linked to:', linkResult.studentName)
              } catch (linkError) {
                console.error('❌ Failed to link to code:', inviteCode, linkError)
                failedLinks.push({
                  inviteCode,
                  error: linkError.message
                })
              }
            }

            // Create onboarding data structure
            const onboardingData = {
              parentId,
              linkedStudents: successfulLinks,
              failedLinks,
              parentInfo: data.parentInfo
            }
            
            setOnboardingData(onboardingData)
            
            // Pre-populate family name
            setFamilyData(prev => ({
              ...prev,
              familyName: `${data.parentInfo.firstName} Family`
            }))
            
            // Clean up temp data
            localStorage.removeItem('tempParentData')
            
            setLoading(false)
            
          } catch (error) {
            console.error('❌ Error creating account:', error)
            setError('Failed to create account. Please try again.')
            setLoading(false)
            // Redirect back to account creation on error
            setTimeout(() => {
              router.push('/parent/account-creation')
            }, 3000)
          }
          
        } else {
          // Check for existing onboarding data (returning flow)
          const stored = localStorage.getItem('parentOnboardingData')
          if (stored) {
            const data = JSON.parse(stored)
            setOnboardingData(data)
            // Pre-populate family name
            if (data.parentInfo) {
              setFamilyData(prev => ({
                ...prev,
                familyName: `${data.parentInfo.firstName} Family`
              }))
            }
          } else {
            // No data at all, redirect back to account creation
            router.push('/parent/account-creation')
          }
        }
      }
    }

    handleAccountCreation()
  }, [])

  const genreOptions = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 
    'Biography', 'History', 'Self-Help', 'Parenting', 'Business', 'Spirituality',
    'Cooking', 'Travel', 'Health & Fitness', 'Poetry'
  ]

  const readingExperienceOptions = [
    { value: 'avid', label: 'Avid Reader - I read daily' },
    { value: 'regular', label: 'Regular Reader - A few books per month' },
    { value: 'occasional', label: 'Occasional Reader - A few books per year' },
    { value: 'returning', label: 'Returning Reader - Getting back into reading' },
    { value: 'new', label: 'New to Reading - Just starting my journey' }
  ]

  const supportStyleOptions = [
    { value: 'hands-on', label: 'Hands-on Helper - I love reading together' },
    { value: 'encourager', label: 'Cheerleader - I celebrate achievements' },
    { value: 'facilitator', label: 'Facilitator - I provide structure and reminders' },
    { value: 'companion', label: 'Reading Companion - We read our own books together' },
    { value: 'observer', label: 'Supportive Observer - I let them lead their journey' }
  ]

  const handleGenreToggle = (genre) => {
    setFamilyData(prev => ({
      ...prev,
      parentProfile: {
        ...prev.parentProfile,
        favoriteGenres: prev.parentProfile.favoriteGenres.includes(genre)
          ? prev.parentProfile.favoriteGenres.filter(g => g !== genre)
          : [...prev.parentProfile.favoriteGenres, genre]
      }
    }))
  }

  const handleNext = async () => {
    setError('')
    
    if (step < 4) {
      setStep(step + 1)
      return
    }

    // Final step: Save to Firebase
    setLoading(true)

    try {
      if (!onboardingData?.parentId) {
        throw new Error('Missing parent ID')
      }

      console.log('💾 Saving parent onboarding data...')

      // Update parent profile
      const parentRef = doc(db, 'parents', onboardingData.parentId)
      await updateDoc(parentRef, {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        familyName: familyData.familyName,
        readingGoals: familyData.readingGoals,
        preferences: familyData.preferences,
        parentProfile: familyData.parentProfile
      })

      // Create family profile document
      const familyRef = doc(db, 'families', onboardingData.parentId)
      await setDoc(familyRef, {
        parentId: onboardingData.parentId,
        familyName: familyData.familyName,
        linkedStudents: onboardingData.linkedStudents.map(link => ({
          studentId: link.student.studentId,
          studentName: link.student.studentName,
          schoolName: link.student.schoolName,
          entityId: link.student.entityId,
          schoolId: link.student.schoolId
        })),
        readingGoals: familyData.readingGoals,
        familyBattleSettings: {
          enabled: familyData.readingGoals.competitionMode,
          weeklyGoal: familyData.readingGoals.familyWeekly,
          currentWeekPoints: { parent: 0, children: 0 }
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      })

      console.log('✅ Parent onboarding completed successfully')

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('parentOnboardingData')
        localStorage.setItem('luxlibris_account_created', 'true')
      }

      // Move to success step
      setStep(5)

    } catch (error) {
      console.error('❌ Error completing onboarding:', error)
      setError('Failed to complete setup. Please try again.')
    }

    setLoading(false)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError('')
    }
  }

  const handleContinueToDashboard = () => {
    router.push('/parent/sign-in')
  }

  if (!onboardingData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${luxTheme.background} 0%, ${luxTheme.primary} 30%, ${luxTheme.secondary} 100%)`
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: `4px solid ${luxTheme.primary}`,
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: luxTheme.textPrimary, fontSize: '1.1rem' }}>
            Loading family setup...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Family Setup - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${luxTheme.background} 0%, ${luxTheme.primary} 30%, ${luxTheme.secondary} 100%)`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '36rem',
          width: '100%',
          background: luxTheme.surface,
          borderRadius: '1.5rem',
          padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontSize: '1.75rem'
            }}>
              {step === 5 ? '🎉' : '⌂'}
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
              fontWeight: 'bold',
              color: luxTheme.textPrimary,
              margin: '0 0 0.5rem 0',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              {step === 5 ? 'Welcome to Lux Libris!' : 'Family Setup'}
            </h1>
            <p style={{
              color: luxTheme.textSecondary,
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {step === 5 
                ? 'Your family dashboard is ready! Let\'s start your reading journey together.'
                : 'Let\'s personalize your family reading experience'
              }
            </p>
          </div>

          {/* Progress Steps */}
          {step < 5 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '2rem',
              gap: '0.25rem'
            }}>
              {[1, 2, 3, 4].map(stepNum => (
                <div key={stepNum} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    background: stepNum <= step 
                      ? `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`
                      : '#e5e7eb',
                    color: stepNum <= step ? luxTheme.textPrimary : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.625rem',
                    fontWeight: 'bold'
                  }}>
                    {stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div style={{
                      width: '1rem',
                      height: '2px',
                      background: stepNum < step ? luxTheme.primary : '#e5e7eb'
                    }}></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step Content */}
          <div style={{ marginBottom: '2rem' }}>
            
            {/* Step 1: Family Name */}
            {step === 1 && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.125rem, 4vw, 1.25rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  What should we call your family?
                </h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    fontWeight: '600',
                    color: luxTheme.textSecondary,
                    marginBottom: '0.5rem'
                  }}>
                    Family Name *
                  </label>
                  <input
                    type="text"
                    value={familyData.familyName}
                    onChange={(e) => setFamilyData(prev => ({ 
                      ...prev, 
                      familyName: e.target.value 
                    }))}
                    placeholder="The Smith Family"
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      border: `2px solid ${luxTheme.primary}40`,
                      borderRadius: '0.75rem',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      boxSizing: 'border-box',
                      outline: 'none',
                      textAlign: 'center',
                      fontWeight: '600',
                      minHeight: '48px'
                    }}
                    onFocus={(e) => e.target.style.borderColor = luxTheme.primary}
                    onBlur={(e) => e.target.style.borderColor = `${luxTheme.primary}40`}
                  />
                </div>

                {onboardingData?.linkedStudents && (
                  <div style={{
                    background: `${luxTheme.primary}20`,
                    border: `2px solid ${luxTheme.primary}`,
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h3 style={{
                      fontSize: 'clamp(0.875rem, 4vw, 1rem)',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: '0 0 1rem 0'
                    }}>
                      Connected Children:
                    </h3>
                    {onboardingData.linkedStudents.map((link, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: index < onboardingData.linkedStudents.length - 1 ? '0.5rem' : '0',
                        fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                        color: luxTheme.textPrimary
                      }}>
                        <span>📚</span>
                        <strong>{link.student.studentName}</strong>
                        <span>at {link.student.schoolName}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{
                  background: `rgba(173, 212, 234, 0.1)`,
                  border: `1px solid rgba(173, 212, 234, 0.3)`,
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{
                    color: luxTheme.textPrimary,
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    🏆 <strong>Family Reading Battles:</strong> You'll compete in friendly reading challenges with your children to motivate everyone!
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Reading Goals */}
            {step === 2 && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.125rem, 4vw, 1.25rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Set your family reading goals
                </h2>

                <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '0.5rem'
                    }}>
                      Your Daily Reading Goal
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        step="5"
                        value={familyData.readingGoals.parentDaily}
                        onChange={(e) => setFamilyData(prev => ({
                          ...prev,
                          readingGoals: {
                            ...prev.readingGoals,
                            parentDaily: parseInt(e.target.value)
                          }
                        }))}
                        style={{
                          flex: 1,
                          height: '8px',
                          background: `${luxTheme.primary}40`,
                          borderRadius: '4px',
                          outline: 'none',
                          accentColor: luxTheme.primary
                        }}
                      />
                      <div style={{
                        minWidth: '80px',
                        textAlign: 'center',
                        fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                        fontWeight: '600',
                        color: luxTheme.textPrimary
                      }}>
                        {familyData.readingGoals.parentDaily} min/day
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '0.5rem'
                    }}>
                      Family Weekly Goal
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input
                        type="range"
                        min="60"
                        max="420"
                        step="30"
                        value={familyData.readingGoals.familyWeekly}
                        onChange={(e) => setFamilyData(prev => ({
                          ...prev,
                          readingGoals: {
                            ...prev.readingGoals,
                            familyWeekly: parseInt(e.target.value)
                          }
                        }))}
                        style={{
                          flex: 1,
                          height: '8px',
                          background: `${luxTheme.primary}40`,
                          borderRadius: '4px',
                          outline: 'none',
                          accentColor: luxTheme.primary
                        }}
                      />
                      <div style={{
                        minWidth: '80px',
                        textAlign: 'center',
                        fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                        fontWeight: '600',
                        color: luxTheme.textPrimary
                      }}>
                        {familyData.readingGoals.familyWeekly} min/week
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={familyData.readingGoals.competitionMode}
                        onChange={(e) => setFamilyData(prev => ({
                          ...prev,
                          readingGoals: {
                            ...prev.readingGoals,
                            competitionMode: e.target.checked
                          }
                        }))}
                        style={{
                          width: '1.25rem',
                          height: '1.25rem',
                          accentColor: luxTheme.primary
                        }}
                      />
                      <span style={{
                        fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                        fontWeight: '600',
                        color: luxTheme.textSecondary
                      }}>
                        Enable Family Reading Battles 🏆
                      </span>
                    </label>
                    <p style={{
                      fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                      color: luxTheme.textSecondary,
                      margin: '0.5rem 0 0 1.75rem',
                      lineHeight: '1.4'
                    }}>
                      Compete with your children in weekly reading challenges
                    </p>
                  </div>
                </div>

                <div style={{
                  background: `rgba(195, 224, 222, 0.1)`,
                  border: `1px solid rgba(195, 224, 222, 0.3)`,
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{
                    color: luxTheme.textPrimary,
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    💡 <strong>Pro tip:</strong> Start with achievable goals and increase them as you build the habit!
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Your Reading Profile */}
            {step === 3 && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.125rem, 4vw, 1.25rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Tell us about your reading
                </h2>

                <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '0.75rem'
                    }}>
                      What genres do you enjoy? (Select all that apply)
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '0.5rem'
                    }}>
                      {genreOptions.map(genre => (
                        <button
                          key={genre}
                          onClick={() => handleGenreToggle(genre)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                            fontWeight: '600',
                            borderRadius: '0.5rem',
                            border: '2px solid',
                            borderColor: familyData.parentProfile.favoriteGenres.includes(genre) 
                              ? luxTheme.primary : `${luxTheme.primary}40`,
                            backgroundColor: familyData.parentProfile.favoriteGenres.includes(genre) 
                              ? luxTheme.primary : luxTheme.surface,
                            color: familyData.parentProfile.favoriteGenres.includes(genre) 
                              ? luxTheme.textPrimary : luxTheme.textSecondary,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minHeight: '36px',
                            touchAction: 'manipulation'
                          }}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '0.5rem'
                    }}>
                      How would you describe your reading experience?
                    </label>
                    <select
                      value={familyData.parentProfile.readingExperience}
                      onChange={(e) => setFamilyData(prev => ({
                        ...prev,
                        parentProfile: {
                          ...prev.parentProfile,
                          readingExperience: e.target.value
                        }
                      }))}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${luxTheme.primary}40`,
                        borderRadius: '0.75rem',
                        fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                        backgroundColor: luxTheme.surface,
                        outline: 'none',
                        minHeight: '48px'
                      }}
                    >
                      <option value="">Choose your reading style...</option>
                      {readingExperienceOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                      fontWeight: '600',
                      color: luxTheme.textSecondary,
                      marginBottom: '0.5rem'
                    }}>
                      How do you like to support your child's reading?
                    </label>
                    <select
                      value={familyData.parentProfile.supportStyle}
                      onChange={(e) => setFamilyData(prev => ({
                        ...prev,
                        parentProfile: {
                          ...prev.parentProfile,
                          supportStyle: e.target.value
                        }
                      }))}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: `2px solid ${luxTheme.primary}40`,
                        borderRadius: '0.75rem',
                        fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                        backgroundColor: luxTheme.surface,
                        outline: 'none',
                        minHeight: '48px'
                      }}
                    >
                      <option value="">Choose your support style...</option>
                      {supportStyleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Notification Preferences */}
            {step === 4 && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.125rem, 4vw, 1.25rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Notification preferences
                </h2>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    { key: 'achievements', label: 'Achievement Unlocks', desc: 'When your children unlock new saints' },
                    { key: 'quizUnlocks', label: 'Quiz Approvals', desc: 'When children need quiz codes' },
                    { key: 'weeklyProgress', label: 'Weekly Progress', desc: 'Weekly family reading summary' },
                    { key: 'familyBattles', label: 'Family Battles', desc: 'Reading competition updates' }
                  ].map(notification => (
                    <div key={notification.key} style={{
                      backgroundColor: `${luxTheme.primary}10`,
                      border: `1px solid ${luxTheme.primary}30`,
                      borderRadius: '0.75rem',
                      padding: '1rem'
                    }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={familyData.preferences.notifications[notification.key]}
                          onChange={(e) => setFamilyData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              notifications: {
                                ...prev.preferences.notifications,
                                [notification.key]: e.target.checked
                              }
                            }
                          }))}
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            accentColor: luxTheme.primary,
                            marginTop: '0.125rem',
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <div style={{
                            fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                            fontWeight: '600',
                            color: luxTheme.textSecondary,
                            marginBottom: '0.25rem'
                          }}>
                            {notification.label}
                          </div>
                          <div style={{
                            fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                            color: luxTheme.textSecondary,
                            lineHeight: '1.4'
                          }}>
                            {notification.desc}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: '#fef3cd',
                  border: '1px solid #f59e0b',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}>
                  <p style={{
                    color: '#92400e',
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    🚀 <strong>Almost ready!</strong> Click "Complete Setup" to finish creating your family dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem'
                }}>
                  Family Setup Complete!
                </h2>

                <div style={{
                  background: `${luxTheme.primary}20`,
                  border: `2px solid ${luxTheme.primary}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: 'clamp(0.875rem, 4vw, 1rem)',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: '0 0 1rem 0'
                  }}>
                    Your {familyData.familyName} is ready!
                  </h3>
                  <div style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', color: luxTheme.textPrimary, lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      ✅ Family dashboard created
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      ✅ Reading goals set
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      ✅ Connected to {onboardingData?.linkedStudents?.length || 0} student{(onboardingData?.linkedStudents?.length || 0) !== 1 ? 's' : ''}
                    </p>
                    <p style={{ margin: 0 }}>
                      ✅ Notifications configured
                    </p>
                  </div>
                </div>

                <div style={{
                  background: `rgba(173, 212, 234, 0.1)`,
                  border: `1px solid rgba(173, 212, 234, 0.3)`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{
                    color: luxTheme.textPrimary,
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    🏆 <strong>Ready to start:</strong> Track progress, approve quiz codes, and compete in family reading battles!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                color: '#dc2626',
                fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                margin: 0
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {step < 5 ? (
              <>
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '0.875rem 1.5rem',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                      minHeight: '48px',
                      minWidth: '100px',
                      touchAction: 'manipulation'
                    }}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={loading || (step === 1 && !familyData.familyName.trim())}
                  style={{
                    flex: step === 1 ? 1 : 2,
                    padding: '0.875rem 1.5rem',
                    background: loading || (step === 1 && !familyData.familyName.trim())
                      ? '#d1d5db' 
                      : `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                    fontWeight: '600',
                    cursor: (loading || (step === 1 && !familyData.familyName.trim())) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minHeight: '48px',
                    minWidth: '120px',
                    touchAction: 'manipulation'
                  }}
                >
                  {loading && (
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: `2px solid ${luxTheme.textPrimary}`,
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  )}
                  {step === 4 ? 'Complete Setup' : 'Continue'}
                </button>
              </>
            ) : (
              <button
                onClick={handleContinueToDashboard}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '48px',
                  touchAction: 'manipulation'
                }}
              >
                Continue to Sign In 🚀
              </button>
            )}
          </div>

          {/* Help Text */}
          {step < 5 && (
            <div style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: `1px solid ${luxTheme.primary}20`
            }}>
              <p style={{
                fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                color: luxTheme.textSecondary,
                margin: 0,
                lineHeight: '1.4'
              }}>
                Setting up your family for reading success together.
              </p>
            </div>
          )}
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
        
        @media (max-width: 768px) {
          input, select {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
        }
      `}</style>
    </>
  )
}