// pages/parent/account-deletion.js - FIXED VERSION with proper family status checking
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db, dbHelpers } from '../../lib/firebase'
import DataExportComponent from '../../components/DataExportComponent'
import Head from 'next/head'

export default function ParentAccountDeletion() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState('')
  const [parentData, setParentData] = useState(null)
  const [familyData, setFamilyData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [familyStatus, setFamilyStatus] = useState(null)
  const [otherParents, setOtherParents] = useState([])

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasExportedData, setHasExportedData] = useState(false)

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
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadParentData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile])

  // FIXED: Load parent data and check family status properly
  const loadParentData = useCallback(async () => {
    try {
      if (!user?.uid) {
        router.push('/parent/settings')
        return
      }

      console.log('🔍 Loading parent data for UID:', user.uid)
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        console.error('❌ Parent data not found')
        router.push('/parent/settings')
        return
      }

      const parentProfile = parentDoc.data()
      console.log('✅ Loaded parent data:', parentProfile)
      setParentData(parentProfile)

      // FIXED: Use the corrected family status checking function
      const status = await dbHelpers.checkParentFamilyStatus(user.uid)
      console.log('📊 Family status result:', status)
      setFamilyStatus(status)
      
      if (status.hasFamily) {
        setFamilyData(status.familyData)
        
        // Get other parent details if there are any
        if (status.otherParents && status.otherParents.length > 0) {
          const otherParentDetails = await dbHelpers.getLinkedParentDetails(status.otherParents)
          setOtherParents(otherParentDetails)
        }
      }
      
      // Load linked students for display purposes
      if (parentProfile.linkedStudents && parentProfile.linkedStudents.length > 0) {
        await loadLinkedStudentsInfo(parentProfile.linkedStudents)
      }
      
    } catch (error) {
      console.error('❌ Error loading parent data:', error)
      router.push('/parent/settings')
    }
    setLoading(false)
  }, [user, router])

  const loadLinkedStudentsInfo = async (linkedStudentIds) => {
    try {
      const students = []
      
      // Search all entities/schools for linked students
      const entitiesRef = collection(db, 'entities')
      const entitiesSnapshot = await getDocs(entitiesRef)
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id
        const schoolsRef = collection(db, `entities/${entityId}/schools`)
        const schoolsSnapshot = await getDocs(schoolsRef)
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id
          const schoolData = schoolDoc.data()
          const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`)
          const studentsSnapshot = await getDocs(studentsRef)
          
          for (const studentDoc of studentsSnapshot.docs) {
            if (linkedStudentIds.includes(studentDoc.id)) {
              const studentData = {
                id: studentDoc.id,
                entityId,
                schoolId,
                schoolName: schoolData.name,
                ...studentDoc.data()
              }
              students.push(studentData)
            }
          }
        }
      }
      
      setLinkedStudents(students)
      console.log('✅ Loaded', students.length, 'linked students')
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error)
    }
  }

  useEffect(() => {
    loadParentData()
  }, [loadParentData])

  // FIXED: Account deletion with proper family handling
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" exactly to confirm.')
      setTimeout(() => setError(''), 3000)
      return
    }

    setIsDeleting(true)
    try {
      console.log('🗑️ Starting parent account deletion with proper family handling...')
      
      // Get linked student IDs for the deletion process
      const linkedStudentIds = parentData.linkedStudents || []
      
      // FIXED: Use the corrected deletion function
      const result = await dbHelpers.deleteParentAccountWithExport(
        user.uid, 
        linkedStudentIds,
        false // Don't auto-export since user can export manually
      )
      
      console.log('✅ Parent account deleted successfully')
      console.log('📊 Deletion result:', result)
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
      
      // Redirect to homepage
      window.location.href = '/'
      
    } catch (error) {
      console.error('❌ Error deleting account:', error)
      setError('Failed to delete account. Please try again or contact support.')
      setTimeout(() => setError(''), 5000)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    }
  }

  if (authLoading || loading || !userProfile || !parentData || !familyStatus) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${luxTheme.primary}30`,
            borderTop: `3px solid ${luxTheme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: luxTheme.textPrimary }}>Loading account data...</p>
        </div>
      </div>
    )
  }

  // FIXED: Determine messaging based on corrected family status
  const isOnlyParent = familyStatus?.isOnlyParent ?? true
  const parentCount = familyStatus?.parentCount ?? 1

  return (
    <>
      <Head>
        <title>Export & Delete {isOnlyParent ? 'Family' : 'Parent'} Account - Lux Libris</title>
        <meta name="description" content="Export your family data and delete your parent account" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>
      
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease'
        }}>
          <button
            onClick={() => router.push('/parent/settings')}
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
            fontSize: 'clamp(18px, 4.5vw, 20px)',
            fontWeight: '400',
            color: luxTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center',
            flex: 1
          }}>
            Export & Delete {isOnlyParent ? 'Family' : 'Parent'} Account
          </h1>

          <div style={{ width: '44px' }} /> {/* Spacer for center alignment */}
        </div>

        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Success/Error Messages */}
          {showSuccess && (
            <div style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              padding: '12px 24px',
              borderRadius: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              zIndex: 1000,
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              fontWeight: '600',
              maxWidth: '90vw',
              textAlign: 'center'
            }}>
              {showSuccess}
            </div>
          )}
          
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: 'clamp(12px, 3.5vw, 14px)'
            }}>
              ❌ {error}
            </div>
          )}

          {/* UPDATED: Warning Section with corrected logic */}
          <div style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #fca5a5',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '12px'
            }}>
              Important: {isOnlyParent ? 'Family' : 'Parent'} Account Deletion
            </h2>
            <p style={{
              fontSize: 'clamp(14px, 4vw, 16px)',
              color: '#dc2626',
              lineHeight: '1.5',
              marginBottom: '16px'
            }}>
              {isOnlyParent 
                ? 'This will permanently delete your parent account and the entire family. Once deleted, your account cannot be recovered.'
                : `You are one of ${parentCount} parents in this family. This will remove only you from the family. The family and other parent(s) will remain active.`
              }
            </p>
            
            {/* Show other parents if not the only one */}
            {!isOnlyParent && otherParents.length > 0 && (
              <div style={{
                backgroundColor: '#e0f2fe',
                border: '1px solid #0284c7',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: '#0369a1',
                  margin: '0 0 8px 0',
                  fontWeight: '600'
                }}>
                  👨‍👩‍👧‍👦 Other parent(s) in this family:
                </p>
                <ul style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: '#0369a1',
                  margin: '0',
                  paddingLeft: '20px',
                  lineHeight: '1.4',
                  textAlign: 'left'
                }}>
                  {otherParents.map((parent) => (
                    <li key={parent.id}>
                      {parent.firstName} {parent.lastName} ({parent.email})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div style={{
              backgroundColor: '#fee2e2',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left'
            }}>
              <p style={{
                fontSize: 'clamp(12px, 3.5vw, 14px)',
                color: '#dc2626',
                margin: '0 0 8px 0',
                fontWeight: '600'
              }}>
                {isOnlyParent 
                  ? 'Family account deletion will permanently remove:'
                  : 'Your account deletion will permanently remove:'
                }
              </p>
              <ul style={{
                fontSize: 'clamp(12px, 3.5vw, 14px)',
                color: '#dc2626',
                margin: '0',
                paddingLeft: '20px',
                lineHeight: '1.4'
              }}>
                <li>Your parent profile and login credentials</li>
                {isOnlyParent ? (
                  <>
                    <li>The entire family settings and preferences</li>
                    <li>Connection to your children's accounts ({linkedStudents.length} {linkedStudents.length === 1 ? 'child' : 'children'})</li>
                    <li>All saved teacher quiz codes</li>
                    <li>Family name and all family data</li>
                    <li>Family battles: {isOnlyParent ? 'Deactivated permanently' : 'Will remain active for other parent(s)'}</li>
                  </>
                ) : (
                  <>
                    <li>Your connection to the family</li>
                    <li>Your access to children's accounts</li>
                    <li>Your ability to approve quiz requests</li>
                    <li>Family reading battles will be deactivated</li>
                    <li style={{ color: '#16a34a', fontWeight: '600' }}>
                      ✅ The family and other parent(s) will remain active
                    </li>
                  </>
                )}
              </ul>
              
              {linkedStudents.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: isOnlyParent ? '#10b981' : '#f59e0b',
                  borderRadius: '6px'
                }}>
                  <p style={{
                    fontSize: 'clamp(10px, 3vw, 12px)',
                    color: 'white',
                    margin: 0,
                    fontWeight: '600'
                  }}>
                    {isOnlyParent ? (
                      <>✅ Good News: Your {linkedStudents.length} {linkedStudents.length === 1 ? 'child' : 'children'} will keep their reading accounts and all progress!</>
                    ) : (
                      <>⚠️ Note: You will be removed from your {linkedStudents.length} {linkedStudents.length === 1 ? 'child\'s' : 'children\'s'} account(s), but they remain connected to other parent(s)</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 1: Data Export */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: hasExportedData ? `2px solid #10b981` : `2px solid ${luxTheme.primary}50`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                backgroundColor: hasExportedData ? '#10b981' : luxTheme.primary,
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {hasExportedData ? '✓' : '1'}
              </div>
              <h2 style={{
                fontSize: 'clamp(18px, 4.5vw, 20px)',
                fontWeight: 'bold',
                color: luxTheme.textPrimary,
                margin: 0
              }}>
                📦 Export Your Family Data (Recommended)
              </h2>
            </div>
            
            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              color: luxTheme.textSecondary,
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              Before deleting your {isOnlyParent ? 'family' : 'parent'} account, we recommend exporting your data. This creates a file 
              with all your family information, quiz codes, and linked children details that you can keep forever.
            </p>

            <DataExportComponent 
              accountType="parent"
              parentData={parentData}
              theme={luxTheme}
              onExportComplete={(result) => {
                setHasExportedData(true)
                setShowSuccess('📦 Family data exported successfully! You can now proceed with account deletion if desired.')
                setTimeout(() => setShowSuccess(''), 5000)
              }}
            />

            {hasExportedData && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: '#16a34a', fontSize: '16px' }}>✅</span>
                <span style={{ color: '#16a34a', fontSize: 'clamp(12px, 3.5vw, 14px)', fontWeight: '600' }}>
                  Data export completed! Your family data has been saved.
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Account Deletion */}
          <div style={{
            backgroundColor: luxTheme.surface,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '80px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid #dc2626`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                2
              </div>
              <h2 style={{
                fontSize: 'clamp(18px, 4.5vw, 20px)',
                fontWeight: 'bold',
                color: '#dc2626',
                margin: 0
              }}>
                🗑️ Delete Your {isOnlyParent ? 'Family' : 'Parent'} Account
              </h2>
            </div>

            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              color: luxTheme.textSecondary,
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              {isOnlyParent 
                ? 'Once you delete your family account, all your data and the family will be permanently removed from our systems. This action cannot be undone.'
                : 'Once you delete your parent account, you will be removed from the family. The family and other parent(s) will continue to have access. This action cannot be undone.'
              }
            </p>

            {/* UPDATED: What Happens Section with family battle info */}
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: 'bold',
                color: '#dc2626',
                marginBottom: '12px'
              }}>
                What happens when you delete your {isOnlyParent ? 'family' : 'parent'} account:
              </h3>
              <ul style={{
                fontSize: 'clamp(12px, 3.5vw, 14px)',
                color: '#dc2626',
                margin: '0',
                paddingLeft: '20px',
                lineHeight: '1.6'
              }}>
                <li><strong>Your parent account:</strong> Deleted immediately and permanently</li>
                {isOnlyParent ? (
                  <>
                    <li><strong>Family settings:</strong> Entire family deleted</li>
                    <li><strong>Quiz codes:</strong> All saved teacher codes deleted</li>
                    <li><strong>Children's accounts:</strong> Remain active but lose parent dashboard access</li>
                    <li><strong>Family battles:</strong> {isOnlyParent ? 'Deactivated permanently' : 'Will remain active for other parent(s)'}</li>
                  </>
                ) : (
                  <>
                    <li><strong>Family settings:</strong> Remain active for other parent(s)</li>
                    <li><strong>Quiz codes:</strong> Remain available to other parent(s)</li>
                    <li><strong>Children's accounts:</strong> Remain connected to other parent(s)</li>
                    <li><strong>Family battles:</strong> {isOnlyParent ? 'Deactivated permanently' : 'Will remain active for other parent(s)'}</li>
                  </>
                )}
                <li><strong>Your access:</strong> Permanently removed</li>
              </ul>
            </div>

            {/* Children's Accounts Information */}
            {linkedStudents.length > 0 && (
              <div style={{
                backgroundColor: '#e0f2fe',
                border: '1px solid #0284c7',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>👨‍👩‍👧‍👦</span>
                  <h4 style={{
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: 'bold',
                    color: '#0284c7',
                    margin: 0
                  }}>
                    Your Children's Accounts Will Be Preserved
                  </h4>
                </div>
                
                <p style={{
                  fontSize: 'clamp(12px, 3.5vw, 14px)',
                  color: '#0369a1',
                  margin: '0 0 12px 0',
                  lineHeight: '1.4'
                }}>
                  Your {linkedStudents.length} {linkedStudents.length === 1 ? 'child' : 'children'} will keep their reading accounts and all progress:
                </p>
                
                <div style={{ marginBottom: '16px' }}>
                  {linkedStudents.map((student) => (
                    <div key={student.id} style={{
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      borderRadius: '6px',
                      padding: '8px',
                      marginBottom: '6px',
                      fontSize: 'clamp(11px, 3vw, 13px)',
                      color: '#0369a1'
                    }}>
                      <strong>{student.firstName} {student.lastInitial}.</strong> - {student.booksSubmittedThisYear || 0} books this year, Grade {student.grade}
                      <br />
                      <span style={{ opacity: 0.8 }}>
                        ✅ Keeps all reading progress • ✅ Keeps all achievements • ✅ Keeps all saints
                        {!isOnlyParent && ' • ✅ Remains connected to other parent(s)'}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: 'clamp(11px, 3vw, 13px)',
                  color: '#0369a1',
                  lineHeight: '1.4'
                }}>
                  <strong>📱 Next Steps:</strong> 
                  {isOnlyParent 
                    ? ' Your children can continue using Lux Libris independently. Simply remove the parent connection by deleting the app from their devices if you no longer want them to use it.'
                    : ' Your children will continue to have parent support through the remaining parent(s) in the family.'
                  }
                </div>
              </div>
            )}

            <div style={{
              background: hasExportedData ? '#f0fdf4' : '#fef3c7',
              border: `1px solid ${hasExportedData ? '#bbf7d0' : '#fcd34d'}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>
                {hasExportedData ? '✅' : '💡'}
              </span>
              <span style={{ 
                color: hasExportedData ? '#16a34a' : '#d97706', 
                fontSize: 'clamp(12px, 3.5vw, 14px)', 
                fontWeight: '600' 
              }}>
                {hasExportedData 
                  ? `Great! You've exported your family data and can safely proceed with ${isOnlyParent ? 'family' : 'parent'} account deletion.`
                  : 'Consider exporting your family data first to keep a record of your settings and quiz codes.'
                }
              </span>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto',
                minHeight: '48px',
                touchAction: 'manipulation'
              }}
            >
              🗑️ Delete {isOnlyParent ? 'Family Account' : 'My Parent Account'}
            </button>
          </div>

          {/* UPDATED: Delete Account Confirmation Modal */}
          {showDeleteConfirm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                border: '2px solid #dc2626'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗑️</div>
                  <h3 style={{
                    fontSize: 'clamp(20px, 5vw, 24px)',
                    fontWeight: 'bold',
                    color: '#dc2626',
                    marginBottom: '8px'
                  }}>
                    Delete {isOnlyParent ? 'Family Account' : 'Parent Account'}
                  </h3>
                  <p style={{
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    color: luxTheme.textSecondary,
                    margin: 0
                  }}>
                    This action cannot be undone!
                  </p>
                </div>

                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <p style={{
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    color: '#dc2626',
                    margin: '0 0 12px 0',
                    lineHeight: '1.4',
                    fontWeight: '600'
                  }}>
                    ⚠️ Final Warning: This will permanently delete:
                  </p>
                  <ul style={{
                    fontSize: 'clamp(11px, 3vw, 13px)',
                    color: '#dc2626',
                    margin: '0',
                    paddingLeft: '16px',
                    lineHeight: '1.4'
                  }}>
                    <li>Your parent profile: <strong>{parentData.firstName} {parentData.lastName}</strong></li>
                    {isOnlyParent ? (
                      <>
                        <li>The entire family and all settings</li>
                        <li>Connection to {linkedStudents.length} {linkedStudents.length === 1 ? 'child' : 'children'}</li>
                        <li>All saved teacher quiz codes</li>
                        <li>Family battles: {isOnlyParent ? 'Deactivated permanently' : 'Will remain active for other parent(s)'}</li>
                      </>
                    ) : (
                      <>
                        <li>Your connection to the family</li>
                        <li>Your access to {linkedStudents.length} {linkedStudents.length === 1 ? 'child' : 'children'}</li>
                        <li>Family battles: {isOnlyParent ? 'Deactivated permanently' : 'Will remain active for other parent(s)'}</li>
                        <li style={{ color: '#16a34a', marginTop: '8px' }}>
                          <strong>✅ The family remains active for: {otherParents.map(p => p.firstName).join(', ')}</strong>
                        </li>
                      </>
                    )}
                  </ul>
                  
                  {linkedStudents.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px',
                      backgroundColor: '#10b981',
                      borderRadius: '6px'
                    }}>
                      <p style={{
                        fontSize: 'clamp(10px, 3vw, 12px)',
                        color: 'white',
                        margin: 0,
                        fontWeight: '600'
                      }}>
                        ✅ Your children's accounts and reading progress will remain safe.
                      </p>
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: '8px'
                  }}>
                    To confirm deletion, type exactly: <strong>DELETE MY ACCOUNT</strong>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `2px solid ${deleteConfirmText === 'DELETE MY ACCOUNT' ? '#dc2626' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontFamily: 'monospace',
                      backgroundColor: luxTheme.background,
                      color: luxTheme.textPrimary,
                      boxSizing: 'border-box'
                    }}
                  />
                  
                  {deleteConfirmText && deleteConfirmText !== 'DELETE MY ACCOUNT' && (
                    <p style={{
                      fontSize: 'clamp(10px, 3vw, 12px)',
                      color: '#dc2626',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>
                      Please type exactly: DELETE MY ACCOUNT
                    </p>
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText('')
                    }}
                    disabled={isDeleting}
                    style={{
                      backgroundColor: 'transparent',
                      border: `2px solid ${luxTheme.primary}`,
                      color: luxTheme.textPrimary,
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      opacity: isDeleting ? 0.5 : 1,
                      minHeight: '48px',
                      touchAction: 'manipulation'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                    style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: (isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT') ? 'not-allowed' : 'pointer',
                      fontSize: 'clamp(12px, 3.5vw, 14px)',
                      fontWeight: '600',
                      opacity: (isDeleting || deleteConfirmText !== 'DELETE MY ACCOUNT') ? 0.5 : 1,
                      minWidth: '140px',
                      minHeight: '48px',
                      touchAction: 'manipulation'
                    }}
                  >
                    {isDeleting ? 'Deleting...' : `Delete ${isOnlyParent ? 'Family' : 'My'} Account`}
                  </button>
                </div>
              </div>
            </div>
          )}
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
            input {
              font-size: 16px !important; /* Prevents zoom on iOS */
            }
          }
        `}</style>
      </div>
    </>
  )
}