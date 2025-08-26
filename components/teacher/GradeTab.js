// components/teacher/GradeTab.js - Grade-specific Student Management
import React, { useState } from 'react'
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc } from 'firebase/firestore'

export default function GradeTab({ 
  grade,
  appStudents, 
  manualStudents, 
  searchTerm, 
  filterType,
  userProfile,
  teacherNominees,
  teacherSubmissionOptions,
  onStudentUpdate
}) {
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'
  const [showAddManualModal, setShowAddManualModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [showBooksListModal, setShowBooksListModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  
  // Form states
  const [newManualStudent, setNewManualStudent] = useState({
    firstName: '',
    lastInitial: '',
    grade: grade,
    personalGoal: 10
  })
  
  const [bookSubmission, setBookSubmission] = useState({
    bookId: '',
    bookTitle: '',
    submissionType: 'book_report',
    submissionDate: new Date().toISOString().split('T')[0]
  })

  // Filter students
  const filterStudents = (students, type) => {
    let filtered = students
    
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastInitial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.displayUsername && student.displayUsername.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    if (filterType !== 'all') {
      if (filterType === 'app' && type === 'manual') return []
      if (filterType === 'manual' && type === 'app') return []
    }
    
    return filtered
  }

  const filteredApp = filterStudents(appStudents, 'app')
  const filteredManual = filterStudents(manualStudents, 'manual')
  const allStudents = [...filteredApp.map(s => ({...s, type: 'app'})), ...filteredManual.map(s => ({...s, type: 'manual'}))]
    .sort((a, b) => a.firstName.localeCompare(b.firstName))

  // Stats for this grade
  const gradeStats = {
    totalStudents: allStudents.length,
    activeStudents: allStudents.filter(s => s.status !== 'inactive').length,
    totalBooks: allStudents.reduce((sum, s) => 
      sum + (s.type === 'app' ? (s.booksSubmittedThisYear || 0) : (s.totalBooksThisYear || 0)), 0
    ),
    avgBooks: allStudents.length > 0 ? 
      (allStudents.reduce((sum, s) => 
        sum + (s.type === 'app' ? (s.booksSubmittedThisYear || 0) : (s.totalBooksThisYear || 0)), 0
      ) / allStudents.length).toFixed(1) : 0
  }

  // Toggle app student status
  const toggleAppStudentStatus = async (student) => {
    // Add confirmation for deactivation
    if (student.status === 'active') {
      const confirmed = confirm(`Are you sure you want to deactivate ${student.firstName} ${student.lastInitial}.?

This will:
• Prevent them from logging into the app
• Hide them from active student lists
• Keep all their data and progress

You can reactivate them at any time.

Continue?`)
      
      if (!confirmed) return
    }
    
    setIsProcessing(true)
    try {
      const newStatus = student.status === 'inactive' ? 'active' : 'inactive'
      
      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id)
      await updateDoc(studentRef, {
        status: newStatus,
        lastModified: new Date()
      })

      onStudentUpdate()
      setShowSuccess(`📱 ${student.firstName} ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('Error updating student status:', error)
      setShowSuccess('❌ Error updating status')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Add manual student
  const addManualStudent = async () => {
    if (!newManualStudent.firstName || !newManualStudent.lastInitial) {
      setShowSuccess('❌ Please fill in all required fields')
      setTimeout(() => setShowSuccess(''), 3000)
      return
    }

    setIsProcessing(true)
    try {
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      const studentData = {
        ...newManualStudent,
        booksSubmitted: [],
        totalBooksThisYear: 0,
        lifetimeBooksSubmitted: 0,
        status: 'active',
        createdAt: new Date(),
        lastModified: new Date()
      }

      const manualStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`)
      await addDoc(manualStudentsRef, studentData)

      onStudentUpdate()
      setNewManualStudent({
        firstName: '',
        lastInitial: '',
        grade: grade,
        personalGoal: 10
      })
      setShowAddManualModal(false)
      setShowSuccess(`✅ ${newManualStudent.firstName} added successfully!`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('Error adding manual student:', error)
      setShowSuccess('❌ Error adding student')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Delete manual student
  const deleteManualStudent = async (student) => {
    if (!student || student.type !== 'manual') {
      setShowSuccess('❌ Can only delete manual students')
      setTimeout(() => setShowSuccess(''), 3000)
      return
    }
    
    if (!confirm(`Are you sure you want to delete ${student.firstName} ${student.lastInitial}.?

This will permanently delete:
• All student data
• All book records
• All progress

This action cannot be undone.

Continue?`)) {
      return
    }

    setIsProcessing(true)
    try {
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id)
      await deleteDoc(studentRef)

      onStudentUpdate()
      setShowSuccess(`🗑️ ${student.firstName} deleted`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('Error deleting student:', error)
      setShowSuccess('❌ Error deleting student')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Get available books for student
  const getAvailableBooksForStudent = (student) => {
    if (!student || !teacherNominees.length) return teacherNominees
    
    const completedBookIds = new Set()
    if (student.type === 'manual' && student.booksSubmitted) {
      student.booksSubmitted.forEach(submission => {
        if (submission.bookId) completedBookIds.add(submission.bookId)
      })
    } else if (student.type === 'app' && student.bookshelf) {
      student.bookshelf.forEach(book => {
        if (book.completed && book.bookId) completedBookIds.add(book.bookId)
      })
    }
    
    return teacherNominees.filter(book => !completedBookIds.has(book.id))
  }

  // Add book submission for manual student
  const addBookSubmission = async () => {
    if (!bookSubmission.bookId) {
      setShowSuccess('❌ Please select a book')
      setTimeout(() => setShowSuccess(''), 3000)
      return
    }

    setIsProcessing(true)
    try {
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      const selectedBook = teacherNominees.find(book => book.id === bookSubmission.bookId)
      
      const submission = {
        bookId: bookSubmission.bookId,
        bookTitle: selectedBook?.title || bookSubmission.bookTitle,
        submissionType: bookSubmission.submissionType,
        submittedDate: new Date(bookSubmission.submissionDate),
        approved: true
      }

      const currentSubmissions = selectedStudent.booksSubmitted || []
      const updatedSubmissions = [...currentSubmissions, submission]
      const newTotalBooks = (selectedStudent.totalBooksThisYear || 0) + 1

      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, selectedStudent.id)
      await updateDoc(studentRef, {
        booksSubmitted: updatedSubmissions,
        totalBooksThisYear: newTotalBooks,
        lastModified: new Date()
      })

      onStudentUpdate()
      setBookSubmission({
        bookId: '',
        bookTitle: '',
        submissionType: 'book_report',
        submissionDate: new Date().toISOString().split('T')[0]
      })
      setShowBookModal(false)
      setShowSuccess(`📚 Book added for ${selectedStudent.firstName}!`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('Error adding book submission:', error)
      setShowSuccess('❌ Error adding book')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Update manual student
  const updateManualStudent = async () => {
    if (!selectedStudent.firstName || !selectedStudent.lastInitial) {
      setShowSuccess('❌ Please fill in all required fields')
      setTimeout(() => setShowSuccess(''), 3000)
      return
    }

    setIsProcessing(true)
    try {
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, selectedStudent.id)
      await updateDoc(studentRef, {
        firstName: selectedStudent.firstName,
        lastInitial: selectedStudent.lastInitial,
        grade: selectedStudent.grade,
        personalGoal: selectedStudent.personalGoal,
        lastModified: new Date()
      })

      onStudentUpdate()
      setShowEditModal(false)
      setShowSuccess(`✅ ${selectedStudent.firstName} updated successfully!`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('Error updating student:', error)
      setShowSuccess('❌ Error updating student')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Get available submission options
  const getAvailableSubmissionOptions = () => {
    const options = []
    options.push({ value: 'book_report', label: 'Book Report' })
    
    if (teacherSubmissionOptions.presentToTeacher) {
      options.push({ value: 'presentToTeacher', label: 'Present to Teacher' })
    }
    if (teacherSubmissionOptions.submitReview) {
      options.push({ value: 'submitReview', label: 'Submit Review' })
    }
    if (teacherSubmissionOptions.createStoryboard) {
      options.push({ value: 'createStoryboard', label: 'Create Storyboard' })
    }
    if (teacherSubmissionOptions.discussWithLibrarian) {
      options.push({ value: 'discussWithLibrarian', label: 'Discuss with Librarian' })
    }
    if (teacherSubmissionOptions.actOutScene) {
      options.push({ value: 'actOutScene', label: 'Act Out Scene' })
    }
    
    return options
  }

  const availableSubmissionOptions = getAvailableSubmissionOptions()

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      
      {/* Grade Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '2px solid #0EA5E9'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#223848',
              margin: '0 0 0.5rem 0'
            }}>
              Grade {grade} Students
            </h2>
            <div style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#075985'
            }}>
              <span>📱 {filteredApp.length} App</span>
              <span>📝 {filteredManual.length} Manual</span>
              <span>📚 {gradeStats.totalBooks} Books</span>
              <span>📊 {gradeStats.avgBooks} Avg</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              gap: '0.25rem',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '0.25rem',
              border: '1px solid #E5E7EB'
            }}>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: viewMode === 'cards' ? '#0EA5E9' : 'transparent',
                  color: viewMode === 'cards' ? 'white' : '#6B7280',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              >
                📇 Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: viewMode === 'table' ? '#0EA5E9' : 'transparent',
                  color: viewMode === 'table' ? 'white' : '#6B7280',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              >
                📋 Table
              </button>
            </div>
            
            {/* Add Manual Student Button */}
            <button
              onClick={() => setShowAddManualModal(true)}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ➕ Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Students Display */}
      {allStudents.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#223848',
            marginBottom: '0.5rem'
          }}>
            No Grade {grade} Students
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {searchTerm ? 'No students match your search.' : 'Add students to get started.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddManualModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ➕ Add First Student
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <StudentTable
          students={allStudents}
          onToggleStatus={toggleAppStudentStatus}
          onEdit={(student) => {
            setSelectedStudent({...student})
            setShowEditModal(true)
          }}
          onDelete={deleteManualStudent}
          onAddBook={(student) => {
            setSelectedStudent(student)
            setBookSubmission({
              bookId: '',
              bookTitle: '',
              submissionType: 'book_report',
              submissionDate: new Date().toISOString().split('T')[0]
            })
            setShowBookModal(true)
          }}
          onViewBooks={(student) => {
            setSelectedStudent(student)
            setShowBooksListModal(true)
          }}
          onViewLogin={(student) => {
            setSelectedStudent(student)
            setShowLoginModal(true)
          }}
          isProcessing={isProcessing}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {allStudents.map(student => (
            <StudentCard
              key={`${student.type}-${student.id}`}
              student={student}
              onToggleStatus={() => toggleAppStudentStatus(student)}
              onEdit={() => {
                setSelectedStudent({...student})
                setShowEditModal(true)
              }}
              onDelete={() => deleteManualStudent(student)}
              onAddBook={() => {
                setSelectedStudent(student)
                setBookSubmission({
                  bookId: '',
                  bookTitle: '',
                  submissionType: 'book_report',
                  submissionDate: new Date().toISOString().split('T')[0]
                })
                setShowBookModal(true)
              }}
              onViewBooks={() => {
                setSelectedStudent(student)
                setShowBooksListModal(true)
              }}
              onViewLogin={() => {
                setSelectedStudent(student)
                setShowLoginModal(true)
              }}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddManualModal && (
        <Modal
          title={`➕ Add Grade ${grade} Student`}
          onClose={() => setShowAddManualModal(false)}
        >
          <StudentForm
            student={newManualStudent}
            onChange={setNewManualStudent}
            onSubmit={addManualStudent}
            onCancel={() => setShowAddManualModal(false)}
            isProcessing={isProcessing}
            grade={grade}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedStudent && (
        <Modal
          title={`✏️ Edit ${selectedStudent.firstName}`}
          onClose={() => setShowEditModal(false)}
        >
          <StudentForm
            student={selectedStudent}
            onChange={(updater) => {
              if (typeof updater === 'function') {
                setSelectedStudent(prev => updater(prev))
              } else {
                setSelectedStudent(updater)
              }
            }}
            onSubmit={updateManualStudent}
            onCancel={() => setShowEditModal(false)}
            isProcessing={isProcessing}
            grade={grade}
          />
        </Modal>
      )}

      {/* Add Book Modal */}
      {showBookModal && selectedStudent && (
        <Modal
          title={`📚 Add Book for ${selectedStudent.firstName}`}
          onClose={() => setShowBookModal(false)}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Select Book *
              </label>
              <select
                value={bookSubmission.bookId}
                onChange={(e) => {
                  const selectedBook = teacherNominees.find(book => book.id === e.target.value)
                  setBookSubmission(prev => ({ 
                    ...prev, 
                    bookId: e.target.value,
                    bookTitle: selectedBook?.title || ''
                  }))
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Choose a book...</option>
                {getAvailableBooksForStudent(selectedStudent).map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} by {book.authors}
                  </option>
                ))}
              </select>
              {getAvailableBooksForStudent(selectedStudent).length === 0 && (
                <p style={{
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  margin: '0.5rem 0 0 0'
                }}>
                  This student has completed all available books!
                </p>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Submission Type
                </label>
                <select
                  value={bookSubmission.submissionType}
                  onChange={(e) => setBookSubmission(prev => ({ ...prev, submissionType: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {availableSubmissionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Date
                </label>
                <input
                  type="date"
                  value={bookSubmission.submissionDate}
                  onChange={(e) => setBookSubmission(prev => ({ ...prev, submissionDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              marginTop: '1rem'
            }}>
              <button
                onClick={() => setShowBookModal(false)}
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
                onClick={addBookSubmission}
                disabled={isProcessing || !bookSubmission.bookId}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  opacity: (isProcessing || !bookSubmission.bookId) ? 0.7 : 1
                }}
              >
                {isProcessing ? 'Adding...' : 'Add Book'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Books Modal */}
      {showBooksListModal && selectedStudent && (
        <Modal
          title={`📖 Books - ${selectedStudent.firstName} ${selectedStudent.lastInitial}.`}
          onClose={() => setShowBooksListModal(false)}
        >
          <BooksListModal
            student={selectedStudent}
            teacherNominees={teacherNominees}
            onClose={() => setShowBooksListModal(false)}
          />
        </Modal>
      )}

      {/* Login Info Modal */}
      {showLoginModal && selectedStudent && (
        <Modal
          title={`🔑 Login Credentials - ${selectedStudent.firstName} ${selectedStudent.lastInitial}.`}
          onClose={() => setShowLoginModal(false)}
        >
          <LoginCredentialsModalContent
            student={selectedStudent}
            onClose={() => setShowLoginModal(false)}
          />
        </Modal>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: showSuccess.includes('❌') ? '#EF4444' : '#4CAF50',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '20px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          zIndex: 10002,
          fontSize: '14px',
          fontWeight: '500',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {showSuccess}
        </div>
      )}
    </div>
  )
}

// Student Card Component
function StudentCard({ student, onToggleStatus, onEdit, onDelete, onAddBook, onViewBooks, onViewLogin, isProcessing }) {
  const isActive = student.status !== 'inactive'
  const books = student.type === 'app' ? (student.booksSubmittedThisYear || 0) : (student.totalBooksThisYear || 0)
  const progress = (books / student.personalGoal) * 100
  
  return (
    <div style={{
      background: isActive ? 'white' : '#F9FAFB',
      border: `2px solid ${isActive ? '#E5E7EB' : '#D1D5DB'}`,
      borderRadius: '0.75rem',
      padding: '1rem',
      opacity: isActive ? 1 : 0.8
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#223848',
            margin: '0 0 0.25rem 0'
          }}>
            {student.firstName} {student.lastInitial}.
          </h4>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.125rem 0.375rem',
            backgroundColor: student.type === 'app' ? '#ADD4EA' : '#C3E0DE',
            color: '#223848',
            borderRadius: '0.25rem',
            fontWeight: '600'
          }}>
            {student.type === 'app' ? '📱 APP' : '📝 MANUAL'}
          </span>
        </div>
        <span style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2',
          color: isActive ? '#065F46' : '#991B1B',
          borderRadius: '0.25rem',
          fontWeight: '500'
        }}>
          {isActive ? '✅ Active' : '⏸️ Inactive'}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#6B7280',
          marginBottom: '0.25rem'
        }}>
          <span>Progress</span>
          <span>{books}/{student.personalGoal} books</span>
        </div>
        <div style={{
          height: '8px',
          background: '#E5E7EB',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            background: progress >= 100 ? '#10B981' : '#0EA5E9',
            transition: 'width 0.3s'
          }}></div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: student.type === 'app' ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: '0.5rem'
      }}>
        {student.type === 'app' ? (
          <>
            <button
              onClick={() => onViewLogin(student)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🔑 Login
            </button>
            <button
              onClick={() => onViewBooks(student)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#E0F2FE',
                color: '#075985',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📖 Books
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onAddBook(student)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ➕ Add
            </button>
            <button
              onClick={() => onViewBooks(student)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#E0F2FE',
                color: '#075985',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📖 View
            </button>
            <button
              onClick={() => onEdit(student)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#F3E8FF',
                color: '#6B46C1',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ✏️ Edit
            </button>
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div style={{
        marginTop: '0.5rem',
        paddingTop: '0.5rem',
        borderTop: '1px solid #E5E7EB'
      }}>
        {student.type === 'app' ? (
          <button
            onClick={() => onToggleStatus(student)}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: isActive ? '#FEE2E2' : '#D1FAE5',
              color: isActive ? '#991B1B' : '#065F46',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {isActive ? '⏸️ Deactivate' : '▶️ Activate'}
          </button>
        ) : (
          <button
            onClick={() => onDelete(student)}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            🗑️ Delete Student
          </button>
        )}
      </div>
    </div>
  )
}

// Student Table Component
function StudentTable({ students, onToggleStatus, onEdit, onDelete, onAddBook, onViewBooks, onViewLogin, isProcessing }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#F9FAFB',
              borderBottom: '2px solid #E5E7EB'
            }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Name
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                Type
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                Progress
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
                Status
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr 
                key={`${student.type}-${student.id}`}
                style={{
                  backgroundColor: index % 2 === 0 ? 'white' : '#FAFAFA',
                  borderBottom: '1px solid #F3F4F6'
                }}
              >
                <td style={{ padding: '0.75rem', fontWeight: '500', color: '#111827' }}>
                  {student.firstName} {student.lastInitial}.
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.375rem',
                    backgroundColor: student.type === 'app' ? '#ADD4EA' : '#C3E0DE',
                    color: '#223848',
                    borderRadius: '0.25rem',
                    fontWeight: '600'
                  }}>
                    {student.type === 'app' ? 'APP' : 'MANUAL'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {student.type === 'app' 
                    ? `${student.booksSubmittedThisYear || 0}/${student.personalGoal}`
                    : `${student.totalBooksThisYear || 0}/${student.personalGoal}`
                  }
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.5rem',
                    backgroundColor: student.status === 'active' ? '#ECFDF5' : '#FEF2F2',
                    color: student.status === 'active' ? '#065F46' : '#991B1B',
                    borderRadius: '0.25rem',
                    fontWeight: '500'
                  }}>
                    {student.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    justifyContent: 'flex-end'
                  }}>
                    {student.type === 'app' ? (
                      <>
                        <button
                          onClick={() => onViewLogin(student)}
                          title="View Login"
                          style={{
                            padding: '0.375rem',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => onViewBooks(student)}
                          title="View Books"
                          style={{
                            padding: '0.375rem',
                            backgroundColor: '#E0F2FE',
                            color: '#075985',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          📖
                        </button>
                        <button
                          onClick={() => onToggleStatus(student)}
                          disabled={isProcessing}
                          title={student.status === 'active' ? 'Deactivate' : 'Activate'}
                          style={{
                            padding: '0.375rem',
                            backgroundColor: student.status === 'active' ? '#FEE2E2' : '#D1FAE5',
                            color: student.status === 'active' ? '#991B1B' : '#065F46',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            opacity: isProcessing ? 0.7 : 1
                          }}
                        >
                          {student.status === 'active' ? '⏸' : '▶'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onAddBook(student)}
                          title="Add Book"
                          style={{
                            padding: '0.375rem',
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          ➕
                        </button>
                        <button
                          onClick={() => onViewBooks(student)}
                          title="View Books"
                          style={{
                            padding: '0.375rem',
                            backgroundColor: '#E0F2FE',
                            color: '#075985',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          📖
                        </button>
                        <button
                          onClick={() => onEdit(student)}
                          title="Edit"
                          style={{
                            padding: '0.375rem',
                            backgroundColor: '#F3E8FF',
                            color: '#6B46C1',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDelete(student)}
                          disabled={isProcessing}
                          title="Delete"
                          style={{
                            padding: '0.375rem',
                            backgroundColor: '#FEE2E2',
                            color: '#991B1B',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            opacity: isProcessing ? 0.7 : 1
                          }}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Modal Component
function Modal({ title, children, onClose }) {
  return (
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
        overflowY: 'auto'
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
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Student Form Component
function StudentForm({ student, onChange, onSubmit, onCancel, isProcessing, grade }) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          First Name *
        </label>
        <input
          type="text"
          value={student.firstName}
          onChange={(e) => onChange(prev => ({ ...prev, firstName: e.target.value }))}
          placeholder="Enter first name"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          Last Initial *
        </label>
        <input
          type="text"
          value={student.lastInitial}
          onChange={(e) => onChange(prev => ({ 
            ...prev, 
            lastInitial: e.target.value.toUpperCase().slice(0, 1) 
          }))}
          placeholder="Enter last initial"
          maxLength={1}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            boxSizing: 'border-box',
            textTransform: 'uppercase'
          }}
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          Reading Goal
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={student.personalGoal}
          onChange={(e) => onChange(prev => ({ ...prev, personalGoal: parseInt(e.target.value) }))}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'flex-end',
        marginTop: '1rem'
      }}>
        <button
          onClick={onCancel}
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
          onClick={onSubmit}
          disabled={isProcessing}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            opacity: isProcessing ? 0.7 : 1
          }}
        >
          {isProcessing ? 'Saving...' : 'Save Student'}
        </button>
      </div>
    </div>
  )
}

// FIXED Books List Modal Component
function BooksListModal({ student, teacherNominees, onClose }) {
  const [studentBooks, setStudentBooks] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Load books on mount
  React.useEffect(() => {
    const loadBooks = () => {
      setLoading(true)
      
      if (student.type === 'manual') {
        // For manual students, books are already in the student object
        setStudentBooks(student.booksSubmitted || [])
      } else if (student.type === 'app') {
        // For app students, use the bookshelf data that's already available
        const completedBooks = (student.bookshelf || []).filter(book => book.completed === true)
        setStudentBooks(completedBooks)
      }
      
      setLoading(false)
    }
    
    loadBooks()
  }, [student])

  const totalBooks = student.type === 'app' 
    ? (student.booksSubmittedThisYear || 0)
    : (student.totalBooksThisYear || 0)
  const progress = (totalBooks / student.personalGoal) * 100

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '1rem', color: '#6B7280' }}>
          Loading books...
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Summary Card */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '0.5rem',
        padding: '1rem',
        border: '1px solid #e2e8f0'
      }}>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#223848',
          margin: '0 0 0.5rem 0'
        }}>
          📊 Reading Progress
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.5rem',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <div>Books: {totalBooks}</div>
          <div>Goal: {student.personalGoal}</div>
          <div>Progress: {Math.round(progress)}%</div>
        </div>
        <div style={{
          marginTop: '0.75rem',
          height: '8px',
          background: '#E5E7EB',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            background: progress >= 100 ? '#10B981' : '#0EA5E9',
            transition: 'width 0.3s'
          }}></div>
        </div>
      </div>

      {/* Books List */}
      {studentBooks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
          <p>No books completed yet.</p>
        </div>
      ) : (
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          display: 'grid',
          gap: '0.75rem'
        }}>
          {studentBooks.map((bookEntry, index) => {
            // For both app and manual students, try to find book details
            const bookDetails = teacherNominees.find(b => b.id === bookEntry.bookId)
            
            return (
              <div
                key={index}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#223848',
                      margin: '0 0 0.25rem 0'
                    }}>
                      {bookDetails?.title || bookEntry.bookTitle || 'Unknown Book'}
                    </h5>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: '0 0 0.25rem 0'
                    }}>
                      by {bookDetails?.authors || 'Unknown Author'}
                    </p>
                    
                    {/* Book metadata */}
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#374151',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      {/* Submission/Format type */}
                      <span style={{
                        background: '#e5e7eb',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}>
                        {bookEntry.submissionType || bookEntry.format || 'Completed'}
                      </span>
                      
                      {/* App students: quiz score */}
                      {student.type === 'app' && bookEntry.quizScore && (
                        <span style={{
                          background: '#dbeafe',
                          color: '#1e40af',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem'
                        }}>
                          Quiz: {bookEntry.quizScore}
                        </span>
                      )}
                      
                      {/* App students: rating */}
                      {student.type === 'app' && bookEntry.rating && (
                        <span style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem'
                        }}>
                          ⭐ {bookEntry.rating}/5
                        </span>
                      )}
                    </div>
                    
                    {/* Date */}
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: '0.25rem'
                    }}>
                      {(() => {
                        let dateToShow = null
                        if (bookEntry.submittedAt) {
                          dateToShow = bookEntry.submittedAt.seconds 
                            ? new Date(bookEntry.submittedAt.seconds * 1000) 
                            : new Date(bookEntry.submittedAt)
                        } else if (bookEntry.submittedDate) {
                          dateToShow = bookEntry.submittedDate.seconds 
                            ? new Date(bookEntry.submittedDate.seconds * 1000) 
                            : new Date(bookEntry.submittedDate)
                        }
                        
                        return dateToShow ? `Completed: ${dateToShow.toLocaleDateString()}` : ''
                      })()}
                    </div>
                  </div>
                  
                  {/* Status badge */}
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    background: '#ECFDF5',
                    color: '#065F46',
                    borderRadius: '0.25rem',
                    fontWeight: '500',
                    marginLeft: '0.5rem',
                    flexShrink: 0
                  }}>
                    ✅ {student.type === 'app' ? 'Completed' : 'Approved'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
          color: '#223848',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Close
      </button>
    </div>
  )
}

// Login Credentials Modal Content Component
function LoginCredentialsModalContent({ student, onClose }) {
  const [copiedField, setCopiedField] = useState('')
  
  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };
  
  const copyAllForEmail = () => {
    const emailText = `Student Login Information
Name: ${student.firstName} ${student.lastInitial}.
Username: ${student.displayUsername || 'Not set'}
Sign-in Code: ${student.signInCode || 'Not set'}
Password: ${student.personalPassword || 'Not set'}

Please keep this information secure.`;
    
    navigator.clipboard.writeText(emailText);
    setCopiedField('all');
    setTimeout(() => setCopiedField(''), 2000);
  };
  
  if (student.type === 'manual') {
    return (
      <div>
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '0.5rem',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#92400E',
            margin: 0,
            fontSize: '0.875rem'
          }}>
            Manual students don&apos;t have login credentials.
            They don&apos;t use the app directly.
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
            color: '#223848',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{
        background: '#F0F9FF',
        border: '1px solid #0EA5E9',
        borderRadius: '0.5rem',
        padding: '1rem'
      }}>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#223848',
          margin: '0 0 0.5rem 0'
        }}>
          Student Information
        </h4>
        <p style={{
          fontSize: '0.875rem',
          color: '#6B7280',
          margin: 0
        }}>
          Grade {student.grade} • {student.status === 'active' ? '✅ Active' : '⏸️ Inactive'}
        </p>
      </div>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        {/* Username */}
        <div style={{
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '0.75rem'
        }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#6B7280',
            marginBottom: '0.25rem'
          }}>
            Username
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: '500',
              color: '#223848',
              fontFamily: 'monospace'
            }}>
              {student.displayUsername || 'Not set'}
            </span>
            <button
              onClick={() => copyToClipboard(student.displayUsername || '', 'username')}
              disabled={!student.displayUsername}
              style={{
                padding: '0.25rem 0.5rem',
                background: copiedField === 'username' ? '#10B981' : '#F3F4F6',
                color: copiedField === 'username' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: student.displayUsername ? 'pointer' : 'not-allowed',
                opacity: student.displayUsername ? 1 : 0.5
              }}
            >
              {copiedField === 'username' ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>
        
        {/* Sign-in Code */}
        <div style={{
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '0.75rem'
        }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#6B7280',
            marginBottom: '0.25rem'
          }}>
            Sign-in Code
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: '500',
              color: '#223848',
              fontFamily: 'monospace'
            }}>
              {student.signInCode || 'Not set'}
            </span>
            <button
              onClick={() => copyToClipboard(student.signInCode || '', 'code')}
              disabled={!student.signInCode}
              style={{
                padding: '0.25rem 0.5rem',
                background: copiedField === 'code' ? '#10B981' : '#F3F4F6',
                color: copiedField === 'code' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: student.signInCode ? 'pointer' : 'not-allowed',
                opacity: student.signInCode ? 1 : 0.5
              }}
            >
              {copiedField === 'code' ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>
        
        {/* Password */}
        <div style={{
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '0.75rem'
        }}>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#6B7280',
            marginBottom: '0.25rem'
          }}>
            Password
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: '500',
              color: '#223848',
              fontFamily: 'monospace'
            }}>
              {student.personalPassword || 'Not set'}
            </span>
            <button
              onClick={() => copyToClipboard(student.personalPassword || '', 'password')}
              disabled={!student.personalPassword}
              style={{
                padding: '0.25rem 0.5rem',
                background: copiedField === 'password' ? '#10B981' : '#F3F4F6',
                color: copiedField === 'password' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                cursor: student.personalPassword ? 'pointer' : 'not-allowed',
                opacity: student.personalPassword ? 1 : 0.5
              }}
            >
              {copiedField === 'password' ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Copy All Button */}
      <button
        onClick={copyAllForEmail}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: copiedField === 'all' 
            ? 'linear-gradient(135deg, #10B981, #059669)' 
            : 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
          color: copiedField === 'all' ? 'white' : '#223848',
          border: 'none',
          borderRadius: '0.5rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {copiedField === 'all' ? (
          <>✓ Copied to Clipboard!</>
        ) : (
          <>📧 Copy All for Email</>
        )}
      </button>
      
      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: '#F3F4F6',
          color: '#374151',
          border: 'none',
          borderRadius: '0.5rem',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Close
      </button>
    </div>
  )
}