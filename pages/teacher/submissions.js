// pages/teacher/submissions.js - Teacher Submissions Management
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../lib/firebase'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'

export default function TeacherSubmissions() {
  const router = useRouter()
  const { 
    user, 
    userProfile, 
    loading: authLoading, 
    isAuthenticated, 
    isSessionExpired, 
    signOut,
    updateLastActivity
  } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  
  // Notes modal state
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [actionType, setActionType] = useState('') // 'approve' or 'revise'
  const [teacherNotes, setTeacherNotes] = useState('')

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return

      if (!isAuthenticated) {
        router.push('/sign-in')
        return
      }

      if (userProfile && !['teacher', 'admin'].includes(userProfile.accountType)) {
        router.push('/role-selector')
        return
      }

      if (userProfile?.accountType && ['teacher', 'admin'].includes(userProfile.accountType) && isSessionExpired()) {
        await signOut({ redirectTo: '/sign-in?reason=session-expired' })
        return
      }

      if (userProfile) {
        loadSubmissions()
      }
    }

    checkAuth()
  }, [authLoading, isAuthenticated, userProfile, router, isSessionExpired, signOut])

  // Session timeout checking
  useEffect(() => {
    if (!userProfile?.accountType || !['teacher', 'admin'].includes(userProfile.accountType)) return

    const sessionCheckInterval = setInterval(() => {
      if (isSessionExpired()) {
        signOut({ redirectTo: '/sign-in?reason=session-expired' })
      } else {
        const warningTime = 55 * 60 * 1000
        const timeLeft = warningTime - (Date.now() - (parseInt(localStorage.getItem('luxlibris_last_activity')) || Date.now()))
        
        if (timeLeft <= 0 && timeLeft > -60000) {
          setShowTimeoutWarning(true)
        }
      }
    }, 60000)

    return () => clearInterval(sessionCheckInterval)
  }, [userProfile, isSessionExpired, signOut])

  // Activity tracking
  const handleUserActivity = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  useEffect(() => {
    document.addEventListener('click', handleUserActivity)
    document.addEventListener('keypress', handleUserActivity)

    return () => {
      document.removeEventListener('click', handleUserActivity)
      document.removeEventListener('keypress', handleUserActivity)
    }
  }, [])

  // Load pending submissions
  const loadSubmissions = async () => {
    try {
      console.log('📋 Loading pending submissions...')
      
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        console.error('❌ Missing teacher profile data')
        setLoading(false)
        return
      }

      // Find teacher document by UID to get document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) {
        console.error('❌ Teacher document not found')
        setLoading(false)
        return
      }

      const teacherDoc = teacherSnapshot.docs[0]
      const teacherId = teacherDoc.id

      // Load school nominees to get book titles
      const { getSchoolNomineesEntities } = await import('../../lib/firebase')
      const nominees = await getSchoolNomineesEntities(userProfile.entityId, userProfile.schoolId)
      
      // Create a map for quick book title lookup
      const bookTitleMap = {}
      nominees.forEach(book => {
        bookTitleMap[book.id] = book.title
      })

      // Load all students assigned to this teacher
      const appStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`)
      const appStudentsQuery = query(
        appStudentsRef, 
        where('currentTeacherId', '==', teacherId)
      )
      const appStudentsSnapshot = await getDocs(appStudentsQuery)
      
      const pendingSubmissions = []
      
      // Check each student's bookshelf for pending submissions
      appStudentsSnapshot.forEach(studentDoc => {
        const studentData = { id: studentDoc.id, ...studentDoc.data() }
        
        if (studentData.bookshelf && Array.isArray(studentData.bookshelf)) {
          studentData.bookshelf.forEach(book => {
            if (book.status === 'pending_approval') {
              pendingSubmissions.push({
                id: `${studentData.id}-${book.bookId}`,
                studentId: studentData.id,
                studentName: `${studentData.firstName} ${studentData.lastInitial || ''}`,
                bookId: book.bookId,
                bookTitle: bookTitleMap[book.bookId] || book.bookTitle || 'Unknown Book',
                submissionType: book.submissionType || 'Unknown',
                submittedAt: book.submittedAt,
                rating: book.rating || 0,
                notes: book.notes || '',
                progress: book.currentProgress || 0,
                entityId: userProfile.entityId,
                schoolId: userProfile.schoolId
              })
            }
          })
        }
      })

      // Sort by submission date (newest first)
      pendingSubmissions.sort((a, b) => {
        const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt || 0)
        const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt || 0)
        return dateB - dateA
      })

      setSubmissions(pendingSubmissions)
      console.log(`✅ Loaded ${pendingSubmissions.length} pending submissions`)

    } catch (error) {
      console.error('❌ Error loading submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Open notes modal
  const openNotesModal = (submission, action) => {
    setSelectedSubmission(submission)
    setActionType(action)
    setTeacherNotes('')
    setShowNotesModal(true)
  }

  // Close notes modal
  const closeNotesModal = () => {
    setShowNotesModal(false)
    setSelectedSubmission(null)
    setActionType('')
    setTeacherNotes('')
  }

  // Handle submission approval/revision
  const handleSubmissionAction = async () => {
    if (!selectedSubmission) return

    setIsProcessing(true)
    try {
      const studentRef = doc(db, `entities/${selectedSubmission.entityId}/schools/${selectedSubmission.schoolId}/students`, selectedSubmission.studentId)
      
      // Get current student data
      const studentDoc = await getDocs(query(collection(db, `entities/${selectedSubmission.entityId}/schools/${selectedSubmission.schoolId}/students`), where('__name__', '==', selectedSubmission.studentId)))
      
      if (studentDoc.empty) {
        throw new Error('Student not found')
      }

      const studentData = studentDoc.docs[0].data()
      const updatedBookshelf = studentData.bookshelf.map(book => {
        if (book.bookId === selectedSubmission.bookId && book.status === 'pending_approval') {
          if (actionType === 'approve') {
            return {
              ...book,
              status: 'completed',
              approvedAt: new Date(),
              teacherNotes: teacherNotes.trim() || undefined,
              completed: true
            }
          } else if (actionType === 'revise') {
            return {
              ...book,
              status: 'revision_requested',
              revisionRequestedAt: new Date(),
              teacherNotes: teacherNotes.trim() || undefined,
              completed: false
            }
          }
        }
        return book
      })

      // Update student's bookshelf
      await updateDoc(studentRef, {
        bookshelf: updatedBookshelf,
        // If approving, increment books completed count
        ...(actionType === 'approve' && {
          booksSubmittedThisYear: (studentData.booksSubmittedThisYear || 0) + 1,
          lifetimeBooksSubmitted: (studentData.lifetimeBooksSubmitted || 0) + 1
        }),
        lastModified: new Date()
      })

      // Remove from local state
      setSubmissions(prev => prev.filter(sub => sub.id !== selectedSubmission.id))
      
      const actionText = actionType === 'approve' ? 'approved' : 'revision requested'
      setShowSuccess(`✅ ${selectedSubmission.studentName}'s "${selectedSubmission.bookTitle}" ${actionText}`)
      
      closeNotesModal()
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error processing submission:', error)
      setShowSuccess('❌ Error processing submission. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Format submission type for display
  const formatSubmissionType = (type) => {
    const typeMap = {
      'presentToTeacher': 'Present to Teacher',
      'submitReview': 'Written Review',
      'createStoryboard': 'Storyboard',
      'bookReport': 'Book Report',
      'discussWithLibrarian': 'Discussion with Librarian',
      'actOutScene': 'Act Out Scene',
      'quiz': 'Quiz'
    }
    return typeMap[type] || type
  }

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Unknown'
    const dateObj = date?.toDate ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Session extension
  const extendSession = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  const handleTimeoutSignOut = async () => {
    await signOut({ redirectTo: '/sign-in?reason=session-expired' })
  }

  // Show loading
  if (authLoading || loading || !userProfile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #C3E0DE',
            borderTop: '4px solid #223848',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#223848', fontSize: '1.1rem' }}>
            Loading submissions...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile || !['teacher', 'admin'].includes(userProfile.accountType)) {
    return null
  }

  return (
    <>
      <Head>
        <title>Submissions - Lux Libris</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFCF5 0%, #C3E0DE 50%, #A1E5DB 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '80px'
      }}>

        {/* Session Timeout Warning Modal */}
        {showTimeoutWarning && (
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
            zIndex: 10000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏰</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                marginBottom: '1rem'
              }}>
                Session Expiring Soon
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.4'
              }}>
                Your session will expire in a few minutes for security. Continue working?
              </p>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleTimeoutSignOut}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Sign Out
                </button>
                <button
                  onClick={extendSession}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}
                >
                  Continue Working
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(195, 224, 222, 0.3)',
          padding: '1rem 0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem'
            }}>
              <button
                onClick={() => router.push('/admin/school-dashboard')}
                style={{
                  backgroundColor: 'rgba(195, 224, 222, 0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#223848'
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0,
                  fontFamily: 'Georgia, serif'
                }}>
                  Submissions
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Review and approve student work
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(173, 212, 234, 0.1)',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#223848'
              }}>
                <span>{userProfile.firstName || 'Teacher'}</span>
              </div>
              <button 
                onClick={() => signOut()}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'linear-gradient(135deg, #f87171, #ef4444)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1rem'
        }}>

          {/* Summary */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: submissions.length > 0 ? '2px solid #FEF3C7' : '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: submissions.length > 0 ? '#FEF3C7' : '#F3F4F6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                📋
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: '0 0 0.25rem 0'
                }}>
                  {submissions.length} Pending Submission{submissions.length !== 1 ? 's' : ''}
                </h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  {submissions.length === 0 
                    ? 'All caught up! No submissions waiting for review.'
                    : 'Students are waiting for your review'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          {submissions.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                marginBottom: '0.5rem'
              }}>
                All submissions reviewed!
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem'
              }}>
                No pending submissions at this time. Great work staying on top of things!
              </p>
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {submissions.map(submission => (
                  <div
                    key={submission.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <h4 style={{
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            color: '#223848',
                            margin: 0
                          }}>
                            {submission.studentName}
                          </h4>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#ADD4EA',
                            color: '#223848',
                            borderRadius: '0.25rem',
                            fontWeight: '600'
                          }}>
                            {formatSubmissionType(submission.submissionType)}
                          </span>
                        </div>
                        
                        <p style={{
                          fontSize: '1rem',
                          color: '#374151',
                          margin: '0 0 0.5rem 0',
                          fontWeight: '500'
                        }}>
                          "{submission.bookTitle}"
                        </p>
                        
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          display: 'flex',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          <span>Submitted: {formatDate(submission.submittedAt)}</span>
                          {submission.rating > 0 && (
                            <span>Student rating: {'★'.repeat(submission.rating)}</span>
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        alignItems: 'flex-end',
                        flexShrink: 0
                      }}>
                        <button
                          onClick={() => openNotesModal(submission, 'approve')}
                          disabled={isProcessing}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            minWidth: '100px',
                            opacity: isProcessing ? 0.7 : 1
                          }}
                        >
                          ✅ Approve
                        </button>
                        
                        <button
                          onClick={() => openNotesModal(submission, 'revise')}
                          disabled={isProcessing}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#FF9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            minWidth: '100px',
                            opacity: isProcessing ? 0.7 : 1
                          }}
                        >
                          📝 Request Revisions
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes Modal */}
        {showNotesModal && selectedSubmission && (
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
            zIndex: 10000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#223848',
                  margin: 0
                }}>
                  {actionType === 'approve' ? '✅ Approve Submission' : '📝 Request Revisions'}
                </h2>
                <button
                  onClick={closeNotesModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0.25rem',
                    borderRadius: '0.25rem'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  margin: '0 0 0.5rem 0',
                  fontWeight: '500'
                }}>
                  <strong>{selectedSubmission.studentName}</strong> - "{selectedSubmission.bookTitle}"
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Submission type: {formatSubmissionType(selectedSubmission.submissionType)}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {actionType === 'approve' 
                    ? 'Feedback for student (optional)'
                    : 'What needs to be revised? (optional)'
                  }
                </label>
                <textarea
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  placeholder={actionType === 'approve' 
                    ? "Great work! Your presentation was engaging..."
                    : "Please add more details about the main character..."
                  }
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  maxLength={500}
                />
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  margin: '0.25rem 0 0 0',
                  textAlign: 'right'
                }}>
                  {teacherNotes.length}/500 characters
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={closeNotesModal}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmissionAction}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: actionType === 'approve' ? '#4CAF50' : '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing 
                    ? 'Processing...' 
                    : actionType === 'approve' 
                      ? '✅ Approve' 
                      : '📝 Request Revisions'
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          padding: '8px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '4px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard', active: false },
            { id: 'students', icon: '👥', label: 'Students', active: false },
            { id: 'submissions', icon: '📋', label: 'Submissions', active: true },
            { id: 'achievements', icon: '🏆', label: 'Achievements', active: false },
            { id: 'settings', icon: '⚙️', label: 'Settings', active: false }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'dashboard') router.push('/admin/school-dashboard')
                else router.push(`/teacher/${tab.id}`)
              }}
              style={{
                background: tab.active 
                  ? `linear-gradient(135deg, #ADD4EA15, #ADD4EA25)`
                  : 'none',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 4px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                color: tab.active ? '#ADD4EA' : '#6b7280',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <span style={{ 
                fontSize: '20px',
                filter: tab.active ? 'none' : 'opacity(0.7)'
              }}>
                {tab.icon}
              </span>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: tab.active ? '600' : '500'
              }}>
                {tab.label}
              </span>
              {submissions.length > 0 && tab.id === 'submissions' && (
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  right: '8px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 'bold'
                }}>
                  {submissions.length > 9 ? '9+' : submissions.length}
                </div>
              )}
              {tab.active && (
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#ADD4EA',
                  borderRadius: '50%'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 1001,
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '85vw',
            textAlign: 'center'
          }}>
            {showSuccess}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  )
}