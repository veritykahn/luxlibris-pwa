// pages/parent/onboarding.js - Updated to use pre-validated codes
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { createParentAccount, linkParentToStudent, createFamily, joinExistingFamily, checkExistingFamily } from '../../lib/parentLinking'

export default function ParentOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [onboardingData, setOnboardingData] = useState(null)
  const [existingFamilyInfo, setExistingFamilyInfo] = useState(null)
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
          console.log('🔧 Processing pre-validated parent data...')
          
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

            // Process validated codes (they're already validated)
            const successfulLinks = []
            const failedLinks = []
            let existingFamily = null
            
            if (data.codesPreValidated && data.validatedCodes) {
              // Use pre-validated codes
              for (const validatedCode of data.validatedCodes) {
                try {
                  console.log('🔗 Linking to pre-validated student:', validatedCode.studentInfo.firstName)
                  
                  const linkResult = await linkParentToStudent(
                    parentId, 
                    validatedCode.code,
                    validatedCode // Pass the validated info
                  )
                  
                  successfulLinks.push({
                    inviteCode: validatedCode.code,
                    student: linkResult
                  })
                  
                  if (!linkResult.isNewFamily && linkResult.familyId) {
                    existingFamily = {
                      familyId: linkResult.familyId,
                      familyName: linkResult.familyName,
                      isSecondParent: true
                    }
                  }
                  
                  console.log('✅ Successfully linked to:', linkResult.studentName)
                } catch (linkError) {
                  console.error('❌ Failed to link validated code:', validatedCode.code, linkError)
                  failedLinks.push({
                    inviteCode: validatedCode.code,
                    error: linkError.message
                  })
                }
              }
            } else {
              // Legacy flow - should not happen with new validation
              console.warn('⚠️ Using legacy code validation flow')
              throw new Error('Invalid pre-validation data')
            }

            // Create onboarding data structure
            const onboardingData = {
              parentId,
              linkedStudents: successfulLinks,
              failedLinks,
              parentInfo: data.parentInfo,
              existingFamily
            }
            
            setOnboardingData(onboardingData)
            
            // Handle family name based on existing family or new family
            if (existingFamily) {
              setExistingFamilyInfo(existingFamily)
              setFamilyData(prev => ({
                ...prev,
                familyName: existingFamily.familyName
              }))
            } else {
              // Use parent's LAST name for new family
              setFamilyData(prev => ({
                ...prev,
                familyName: `The ${data.parentInfo.lastName} Family`
              }))
            }
            
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
            
            // Set family name appropriately
            if (data.existingFamily) {
              setExistingFamilyInfo(data.existingFamily)
              setFamilyData(prev => ({
                ...prev,
                familyName: data.existingFamily.familyName
              }))
            } else if (data.parentInfo) {
              setFamilyData(prev => ({
                ...prev,
                familyName: `The ${data.parentInfo.lastName} Family`
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
    'Biography', 'History', 'Self-Help', 'Parenting', 'Business', 'Religion',
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
    
    if (step < 5) {
      setStep(step + 1)
      return
    }

    // Final step: Save to Firebase and redirect directly to dashboard
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

      // Handle family creation or joining
let finalFamilyId = null;

// Check if any of the linked students revealed an existing family
const hasExistingFamily = onboardingData.linkedStudents.some(link => 
  link.familyId || (link.existingFamily && link.existingFamily.familyId)
);

if (hasExistingFamily) {
  // Get the family ID from the first student that has one
  const studentWithFamily = onboardingData.linkedStudents.find(link => 
    link.familyId || (link.existingFamily && link.existingFamily.familyId)
  );
  finalFamilyId = studentWithFamily.familyId || studentWithFamily.existingFamily.familyId;
  
  console.log('✅ Parent already joined existing family during linking:', finalFamilyId);
  
  // Update family preferences if needed
  const familyRef = doc(db, 'families', finalFamilyId);
  await updateDoc(familyRef, {
    // Merge reading goals (keep higher values)
    'readingGoals.familyWeekly': Math.max(
      familyData.readingGoals.familyWeekly,
      150 // default if not set
    ),
    lastUpdated: new Date()
  });
} else {
  // Create new family only if no existing family was found
  const allLinkedStudents = onboardingData.linkedStudents.map(link => ({
    id: link.student.studentId,
    firstName: link.student.studentName.split(' ')[0],
    lastInitial: link.student.studentName.split(' ')[1],
    schoolName: link.student.schoolName,
    entityId: link.student.entityId,
    schoolId: link.student.schoolId,
    grade: link.student.grade
  }));
  
  finalFamilyId = await createFamily(
    onboardingData.parentId,
    onboardingData.parentInfo.lastName,
    allLinkedStudents
  );
  
  console.log('✅ Created new family:', familyData.familyName, 'with ID:', finalFamilyId);
}

// Ensure parent document has the correct familyId
await updateDoc(doc(db, 'parents', onboardingData.parentId), {
  familyId: finalFamilyId,
  lastUpdated: new Date()
});

      console.log('✅ Parent onboarding completed successfully')

      // Set marker for AuthContext consistency handling
      if (typeof window !== 'undefined') {
        localStorage.removeItem('parentOnboardingData')
        localStorage.setItem('luxlibris_account_created', 'true')
      }

      console.log('🎯 Redirecting directly to parent dashboard...')
      router.push('/parent/dashboard')

    } catch (error) {
      console.error('❌ Error completing onboarding:', error)
      setError('Failed to complete setup. Please try again.')
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError('')
    }
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
            Setting up your family account...
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
              ⌂
            </div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
              fontWeight: 'bold',
              color: luxTheme.textPrimary,
              margin: '0 0 0.5rem 0',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              {existingFamilyInfo ? 'Join Your Family' : 'Family Setup'}
            </h1>
            <p style={{
              color: luxTheme.textSecondary,
              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {existingFamilyInfo 
                ? `Welcome to ${existingFamilyInfo.familyName}!`
                : 'Let\'s personalize your family reading experience'
              }
            </p>
          </div>

          {/* Progress Steps */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '2rem',
            gap: '0.25rem'
          }}>
            {[1, 2, 3, 4, 5].map(stepNum => (
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
                {stepNum < 5 && (
                  <div style={{
                    width: '0.75rem',
                    height: '2px',
                    background: stepNum < step ? luxTheme.primary : '#e5e7eb'
                  }}></div>
                )}
              </div>
            ))}
          </div>

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
                  {existingFamilyInfo ? 'Your Family' : 'What should we call your family?'}
                </h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    fontWeight: '600',
                    color: luxTheme.textSecondary,
                    marginBottom: '0.5rem'
                  }}>
                    Family Name {existingFamilyInfo ? '(already set)' : '*'}
                  </label>
                  <input
                    type="text"
                    value={familyData.familyName}
                    onChange={(e) => setFamilyData(prev => ({ 
                      ...prev, 
                      familyName: e.target.value 
                    }))}
                    placeholder="The Smith Family"
                    disabled={existingFamilyInfo}
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
                      minHeight: '48px',
                      backgroundColor: existingFamilyInfo ? `${luxTheme.primary}10` : luxTheme.surface,
                      color: luxTheme.textPrimary,
                      cursor: existingFamilyInfo ? 'not-allowed' : 'text'
                    }}
                    onFocus={(e) => !existingFamilyInfo && (e.target.style.borderColor = luxTheme.primary)}
                    onBlur={(e) => !existingFamilyInfo && (e.target.style.borderColor = `${luxTheme.primary}40`)}
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

                {existingFamilyInfo ? (
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
                      🎉 <strong>Welcome!</strong> You&apos;re joining as the second parent in this family. You&apos;ll have full access to view progress and unlock quizzes!
                    </p>
                  </div>
                ) : (
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
                      🏆 <strong>Family Reading Battles:</strong> You&apos;ll compete in friendly reading challenges with your children to motivate everyone!
                    </p>
                  </div>
                )}
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
                  Set your {existingFamilyInfo ? 'personal' : 'family'} reading goals
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

                  {!existingFamilyInfo && (
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
                  )}

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
                        {existingFamilyInfo ? 'Join' : 'Enable'} Family Reading Battles 🏆
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
                        color: luxTheme.textPrimary,
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
                      How do you like to support your child&apos;s reading?
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
                        color: luxTheme.textPrimary,
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
                    🚀 <strong>Almost ready!</strong> Next, discover our premium features that make family reading even more engaging!
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Premium Features */}
            {step === 5 && (
              <div>
                <h2 style={{
                  fontSize: 'clamp(1.125rem, 4vw, 1.25rem)',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  Unlock Premium Features
                </h2>

                {/* Pilot Banner */}
                <div style={{
                  background: `linear-gradient(135deg, #10B981, #059669)`,
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                  <h3 style={{
                    fontSize: 'clamp(0.875rem, 4vw, 1rem)',
                    fontWeight: 'bold',
                    margin: '0 0 0.5rem 0'
                  }}>
                    Currently FREE for Pilot Users!
                  </h3>
                  <p style={{
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    margin: 0,
                    opacity: 0.9,
                    lineHeight: '1.4'
                  }}>
                    All premium features are unlocked during our pilot program. After the pilot, premium access will be $10/year.
                  </p>
                </div>

                {/* Premium Features Grid */}
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  
                  {/* Healthy Habits Timer */}
                  <div style={{
                    backgroundColor: `${luxTheme.primary}15`,
                    border: `2px solid ${luxTheme.primary}40`,
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: '#10B981',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                      fontWeight: '600'
                    }}>
                      UNLOCKED
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}>
                        ⏱️
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          margin: '0 0 0.25rem 0'
                        }}>
                          Healthy Habits Timer
                        </h4>
                        <p style={{
                          fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                          color: luxTheme.textSecondary,
                          margin: 0,
                          lineHeight: '1.3'
                        }}>
                          Track your personal reading time and lead by example for your children
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Family Battles */}
                  <div style={{
                    backgroundColor: `${luxTheme.secondary}15`,
                    border: `2px solid ${luxTheme.secondary}40`,
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: '#10B981',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                      fontWeight: '600'
                    }}>
                      UNLOCKED
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${luxTheme.secondary}, ${luxTheme.accent})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}>
                        ⚔️
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          margin: '0 0 0.25rem 0'
                        }}>
                          Family Battles
                        </h4>
                        <p style={{
                          fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                          color: luxTheme.textSecondary,
                          margin: 0,
                          lineHeight: '1.3'
                        }}>
                          Compete in weekly reading challenges and motivate your whole family
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reading DNA Lab */}
                  <div style={{
                    backgroundColor: `${luxTheme.accent}15`,
                    border: `2px solid ${luxTheme.accent}40`,
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      backgroundColor: '#10B981',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                      fontWeight: '600'
                    }}>
                      UNLOCKED
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${luxTheme.accent}, ${luxTheme.primary})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}>
                        ⬢
                      </div>
                      <div>
                        <h4 style={{
                          fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          margin: '0 0 0.25rem 0'
                        }}>
                          Reading DNA Lab
                        </h4>
                        <p style={{
                          fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                          color: luxTheme.textSecondary,
                          margin: 0,
                          lineHeight: '1.3'
                        }}>
                          Deep analytics and insights into your family&apos;s reading patterns and growth
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Future Pricing Info */}
                <div style={{
                  background: `${luxTheme.primary}10`,
                  border: `1px solid ${luxTheme.primary}30`,
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1rem' }}>💰</span>
                    <h4 style={{
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: 0
                    }}>
                      After Pilot: $10/year
                    </h4>
                  </div>
                  <p style={{
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    color: luxTheme.textSecondary,
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    When the pilot ends, premium features will be available for just $10/year. You can always upgrade later in your Settings.
                  </p>
                </div>

                {/* Final CTA */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <p style={{
                    color: '#0369a1',
                    fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                    margin: 0,
                    lineHeight: '1.4'
                  }}>
                    🚀 <strong>Ready to start!</strong> Click &apos;Complete Setup&apos; to access your family dashboard with all premium features unlocked!
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
              disabled={loading || (step === 1 && !existingFamilyInfo && !familyData.familyName.trim())}
              style={{
                flex: step === 1 ? 1 : 2,
                padding: '0.875rem 1.5rem',
                background: loading || (step === 1 && !existingFamilyInfo && !familyData.familyName.trim())
                  ? '#d1d5db' 
                  : `linear-gradient(135deg, ${luxTheme.primary}, ${luxTheme.secondary})`,
                color: luxTheme.textPrimary,
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
                fontWeight: '600',
                cursor: (loading || (step === 1 && !existingFamilyInfo && !familyData.familyName.trim())) ? 'not-allowed' : 'pointer',
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
              {step === 5 ? 'Complete Setup' : 'Continue'}
            </button>
          </div>

          {/* Help Text */}
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
              {step === 5 ? 
                'Premium features can also be managed later in Settings.' :
                existingFamilyInfo ? 
                  'Joining an existing family reading journey.' :
                  'Setting up your family for reading success together.'
              }
            </p>
          </div>
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