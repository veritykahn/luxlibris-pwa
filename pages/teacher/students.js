// pages/teacher/students.js - Complete Student Management System with Compact View and Login Info
import { useState, useEffect, useCallback, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePhaseAccess } from '../../hooks/usePhaseAccess'
import { db } from '../../lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where, orderBy } from 'firebase/firestore'

// 🏆 GRADE SAINT MAPPINGS
const GRADE_SAINT_MAPPINGS = {
  4: {
    seasonal: 'saint_028', // St Nicholas
    grade: 'saint_082',    // Dominic Savio
    marian: 'saint_134'    // Our Lady of Guadalupe
  },
  5: {
    seasonal: 'saint_088', // St George
    grade: 'saint_015',    // Elizabeth Ann Seton
    marian: 'saint_132'    // Our Lady of Lourdes
  },
  6: {
    seasonal: 'saint_136', // Our Lady of the Rosary
    grade: 'saint_018',    // Thomas Aquinas
    marian: 'saint_133'    // Our Lady of Fatima
  },
  7: {
    seasonal: 'saint_109', // St Christopher
    grade: 'saint_124',    // St Hildegard of Bingen
    marian: 'saint_135'    // Our Lady of Sorrows
  }
};

// Constants
const STUDENTS_PER_PAGE = 50;
const VIEW_MODES = {
  COMPACT: 'compact',
  CARDS: 'cards'
};

// Login Credentials Modal Component
function LoginCredentialsModal({ student, onClose }) {
  const [copiedField, setCopiedField] = useState('');
  
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
        zIndex: 10001,
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#223848',
              margin: 0
            }}>
              🔑 Login Information
            </h3>
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
      </div>
    );
  }
  
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
      zIndex: 10001,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#223848',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🔑 Login Credentials
          </h3>
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
        
        <div style={{
          background: '#F0F9FF',
          border: '1px solid #0EA5E9',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#223848',
            margin: '0 0 0.5rem 0'
          }}>
            {student.firstName} {student.lastInitial}.
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
            marginTop: '1rem',
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
            marginTop: '0.5rem',
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
    </div>
  );
}

// Grade Section Component with Collapsible Functionality
function GradeSection({ 
  grade, 
  students, 
  viewMode,
  onToggleAppStatus,
  onEditManualStudent,
  onDeleteManualStudent,
  onAddBookSubmission,
  onViewDetails,
  onViewBooks,
  onViewLogin,
  onOpenHistoricalModal,
  isProcessing,
  hasMaxHistoricalCompletions,
  defaultExpanded = false,
  searchTerm = ''
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showMore, setShowMore] = useState(false);
  
  // Auto-expand if searching and has matching students
  useEffect(() => {
    if (searchTerm && students.length > 0) {
      setIsExpanded(true);
    }
  }, [searchTerm, students.length]);
  
  const displayedStudents = showMore ? students : students.slice(0, STUDENTS_PER_PAGE);
  const hasMore = students.length > STUDENTS_PER_PAGE;
  
  const activeCount = students.filter(s => s.status !== 'inactive').length;
  const totalBooks = students.reduce((sum, s) => 
    sum + (s.type === 'app' ? (s.booksSubmittedThisYear || 0) : (s.totalBooksThisYear || 0)), 0
  );
  
  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      marginBottom: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          background: isExpanded ? 'linear-gradient(135deg, #F0F9FF, #E0F2FE)' : 'white',
          border: 'none',
          borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background 0.2s'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{
            fontSize: '1.5rem',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>
            ▶
          </span>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#223848',
            margin: 0
          }}>
            Grade {grade} ({students.length} student{students.length !== 1 ? 's' : ''})
          </h3>
          {students.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              fontSize: '0.875rem'
            }}>
              <span style={{
                padding: '0.25rem 0.75rem',
                background: '#ECFDF5',
                color: '#065F46',
                borderRadius: '0.25rem',
                fontWeight: '500'
              }}>
                {activeCount} active
              </span>
              <span style={{
                padding: '0.25rem 0.75rem',
                background: '#F0F9FF',
                color: '#075985',
                borderRadius: '0.25rem',
                fontWeight: '500'
              }}>
                {totalBooks} books
              </span>
            </div>
          )}
        </div>
      </button>
      
      {isExpanded && students.length > 0 && (
        <div style={{ padding: '1rem' }}>
          {viewMode === VIEW_MODES.COMPACT ? (
            <CompactStudentTable
              students={displayedStudents}
              onToggleAppStatus={onToggleAppStatus}
              onEditManualStudent={onEditManualStudent}
              onDeleteManualStudent={onDeleteManualStudent}
              onAddBookSubmission={onAddBookSubmission}
              onViewBooks={onViewBooks}
              onViewLogin={onViewLogin}
              onOpenHistoricalModal={onOpenHistoricalModal}
              isProcessing={isProcessing}
              hasMaxHistoricalCompletions={hasMaxHistoricalCompletions}
            />
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {displayedStudents.map(student => (
                <StudentCard
                  key={`${student.type}-${student.id}`}
                  student={student}
                  type={student.type}
                  onToggleStatus={() => onToggleAppStatus(student)}
                  onViewDetails={() => onViewDetails(student)}
                  onEditStudent={() => onEditManualStudent(student)}
                  onDeleteStudent={() => onDeleteManualStudent(student)}
                  onAddBookSubmission={() => onAddBookSubmission(student)}
                  onViewBooks={() => onViewBooks(student)}
                  onViewLogin={() => onViewLogin(student)}
                  onOpenHistoricalModal={() => onOpenHistoricalModal(student)}
                  isProcessing={isProcessing}
                  hasMaxHistoricalCompletions={hasMaxHistoricalCompletions}
                />
              ))}
            </div>
          )}
          
          {hasMore && !showMore && (
            <button
              onClick={() => setShowMore(true)}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                color: '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Show All {students.length} Students
            </button>
          )}
          
          {hasMore && showMore && (
            <button
              onClick={() => setShowMore(false)}
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
                color: '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Show Less
            </button>
          )}
        </div>
      )}
      
      {isExpanded && students.length === 0 && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#6B7280'
        }}>
          No students in Grade {grade}
        </div>
      )}
    </div>
  );
}

// Compact Table View Component
function CompactStudentTable({ 
  students, 
  onToggleAppStatus,
  onEditManualStudent,
  onDeleteManualStudent,
  onAddBookSubmission,
  onViewBooks,
  onViewLogin,
  onOpenHistoricalModal,
  isProcessing,
  hasMaxHistoricalCompletions
}) {
  return (
    <div style={{
      overflowX: 'auto',
      border: '1px solid #E5E7EB',
      borderRadius: '0.5rem'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.875rem'
      }}>
        <thead>
          <tr style={{
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB'
          }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
              Name
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
              Type
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
              Username
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>
              Books/Goal
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
              <td style={{ padding: '0.75rem', color: '#6B7280' }}>
                {student.displayUsername || '-'}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6B7280' }}>
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
                  {student.type === 'app' && (
                    <button
                      onClick={() => onViewLogin(student)}
                      title="View Login Info"
                      style={{
                        padding: '0.375rem',
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      🔑
                    </button>
                  )}
                  
                  <button
                    onClick={() => onViewBooks(student)}
                    title="View Books"
                    style={{
                      padding: '0.375rem',
                      backgroundColor: '#E0F2FE',
                      color: '#075985',
                      border: 'none',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    📖
                  </button>
                  
                  {student.type === 'app' ? (
                    <button
                      onClick={() => onToggleAppStatus(student)}
                      disabled={isProcessing}
                      title={student.status === 'active' ? 'Deactivate' : 'Activate'}
                      style={{
                        padding: '0.375rem',
                        backgroundColor: student.status === 'active' ? '#FEE2E2' : '#D1FAE5',
                        color: student.status === 'active' ? '#991B1B' : '#065F46',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        opacity: isProcessing ? 0.7 : 1
                      }}
                    >
                      {student.status === 'active' ? '⏸' : '▶'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onAddBookSubmission(student)}
                        title="Add Book"
                        style={{
                          padding: '0.375rem',
                          backgroundColor: '#D1FAE5',
                          color: '#065F46',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        ➕
                      </button>
                      <button
                        onClick={() => onEditManualStudent(student)}
                        title="Edit"
                        style={{
                          padding: '0.375rem',
                          backgroundColor: '#E0F2FE',
                          color: '#075985',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteManualStudent(student)}
                        disabled={isProcessing}
                        title="Delete"
                        style={{
                          padding: '0.375rem',
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          opacity: isProcessing ? 0.7 : 1
                        }}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                  
                  {!hasMaxHistoricalCompletions(student) && parseInt(student.grade) > 4 && (
                    <button
                      onClick={() => onOpenHistoricalModal(student)}
                      title="Add Historical"
                      style={{
                        padding: '0.375rem',
                        backgroundColor: '#F3E8FF',
                        color: '#6B46C1',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      🏆
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Manual Student Voting Interface Component
function ManualStudentVotingInterface({ 
  manualStudents, 
  teacherNominees, 
  userProfile, 
  onVoteCast, 
  isProcessing 
}) {
  const [selectedVotes, setSelectedVotes] = useState({}) // studentId -> bookId
  const [votingStatus, setVotingStatus] = useState({}) // studentId -> voting state
  
  // Check if student has already voted
  const hasStudentVoted = (student) => {
    return student.hasVotedThisYear === true || student.vote || student.votes?.length > 0
  }

  // Get students who need votes
  const studentsNeedingVotes = manualStudents.filter(student => 
    student.status !== 'inactive' && !hasStudentVoted(student)
  )
  
  // Get students who have voted
  const studentsWhoVoted = manualStudents.filter(student => 
    student.status !== 'inactive' && hasStudentVoted(student)
  )

  // Handle vote selection
  const handleVoteSelection = (studentId, bookId) => {
    setSelectedVotes(prev => ({
      ...prev,
      [studentId]: bookId
    }))
  }

  // Cast vote for a student
  const handleCastVote = async (student, bookId) => {
    if (!bookId) return
    
    const confirmed = window.confirm(`Cast vote for ${student.firstName} ${student.lastInitial}?
Selected Book: ${teacherNominees.find(b => b.id === bookId)?.title}

⚠️ This vote is PERMANENT and cannot be changed.

Continue?`)
    
    if (!confirmed) return

    setVotingStatus(prev => ({ ...prev, [student.id]: 'voting' }))
    
    try {
      await onVoteCast(student, bookId)
      setVotingStatus(prev => ({ ...prev, [student.id]: 'completed' }))
      // Clear the selection for this student
      setSelectedVotes(prev => {
        const updated = { ...prev }
        delete updated[student.id]
        return updated
      })
    } catch (error) {
      console.error('Error casting vote:', error)
      setVotingStatus(prev => ({ ...prev, [student.id]: 'error' }))
      setTimeout(() => {
        setVotingStatus(prev => {
          const updated = { ...prev }
          delete updated[student.id]
          return updated
        })
      }, 3000)
    }
  }

  if (teacherNominees.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '2px solid #FEF3C7'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#92400e',
          margin: '0 0 1rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🗳️ Manual Student Voting
        </h3>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#92400e'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
          <p style={{ margin: 0 }}>
            No books available for voting. Please configure your book selection in Settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '2px solid #10B981'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#223848',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🗳️ Manual Student Voting
        </h3>
        <div style={{
          background: '#10B981',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          Voting Period Active
        </div>
      </div>

      <div style={{
        background: '#ECFDF5',
        border: '1px solid #10B981',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <p style={{ 
          color: '#065F46', 
          margin: '0 0 0.5rem 0', 
          fontWeight: '600',
          fontSize: '0.875rem'
        }}>
          📋 Manual Student Voting Instructions:
        </p>
        <ul style={{ 
          color: '#047857', 
          margin: 0,
          paddingLeft: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <li>Cast votes on behalf of your manual students</li>
          <li>Each student gets ONE vote for their favorite book</li>
          <li>Votes are PERMANENT and cannot be changed</li>
          <li>Only students who have completed books can participate</li>
        </ul>
      </div>

      {/* Students Needing Votes */}
      {studentsNeedingVotes.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#223848',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📊 Cast Votes ({studentsNeedingVotes.length} students)
          </h4>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {studentsNeedingVotes.map(student => (
              <div
                key={student.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#F9FAFB'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h5 style={{
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: '#223848',
                      margin: '0 0 0.25rem 0'
                    }}>
                      {student.firstName} {student.lastInitial}.
                    </h5>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6B7280'
                    }}>
                      Grade {student.grade} • {student.totalBooksThisYear || 0} books completed
                    </div>
                  </div>
                  
                  <div style={{
                    background: votingStatus[student.id] === 'completed' ? '#ECFDF5' : 
                              votingStatus[student.id] === 'error' ? '#FEF2F2' : '#FEF3C7',
                    color: votingStatus[student.id] === 'completed' ? '#065F46' : 
                           votingStatus[student.id] === 'error' ? '#991B1B' : '#92400E',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {votingStatus[student.id] === 'voting' ? '⏳ Voting...' :
                     votingStatus[student.id] === 'completed' ? '✅ Vote Cast!' :
                     votingStatus[student.id] === 'error' ? '❌ Error' : '⏳ Needs Vote'}
                  </div>
                </div>

                {votingStatus[student.id] !== 'completed' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}>
                    <select
                      value={selectedVotes[student.id] || ''}
                      onChange={(e) => handleVoteSelection(student.id, e.target.value)}
                      disabled={votingStatus[student.id] === 'voting'}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'white',
                        color: '#374151'
                      }}
                    >
                      <option value="">Select {student.firstName}&apos;s favorite book...</option>
                      {teacherNominees.map(book => (
                        <option key={book.id} value={book.id}>
                          {book.title} by {book.authors}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => handleCastVote(student, selectedVotes[student.id])}
                      disabled={!selectedVotes[student.id] || votingStatus[student.id] === 'voting'}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: selectedVotes[student.id] ? 
                          'linear-gradient(135deg, #10B981, #059669)' : '#E5E7EB',
                        color: selectedVotes[student.id] ? 'white' : '#9CA3AF',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: selectedVotes[student.id] ? 'pointer' : 'not-allowed',
                        minWidth: '100px'
                      }}
                    >
                      {votingStatus[student.id] === 'voting' ? '⏳' : '🗳️ Cast Vote'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students Who Have Voted */}
      {studentsWhoVoted.length > 0 && (
        <div>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#223848',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ✅ Votes Cast ({studentsWhoVoted.length} students)
          </h4>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {studentsWhoVoted.map(student => {
              const votedBook = student.vote ? 
                teacherNominees.find(book => book.id === student.vote.bookId) : null
              
              return (
                <div
                  key={student.id}
                  style={{
                    border: '1px solid #D1FAE5',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    backgroundColor: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#065F46'
                    }}>
                      {student.firstName} {student.lastInitial}.
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#047857'
                    }}>
                      Voted for: {votedBook?.title || 'Unknown Book'}
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#10B981',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    🔒 Vote Locked
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Manual Students Message */}
      {manualStudents.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          color: '#6B7280'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h4 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#223848',
            marginBottom: '0.5rem'
          }}>
            No Manual Students
          </h4>
          <p style={{ margin: 0 }}>
            Add manual students to vote on their behalf during the voting period.
          </p>
        </div>
      )}
    </div>
  )
}

export default function TeacherStudents() {
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

  // Use the updated phase access hook instead of custom loading
  const { 
    phaseData, 
    permissions, 
    hasAccess, 
    getPhaseMessage, 
    getPhaseInfo,
    refreshPhase,
    isLoading: phaseLoading 
  } = usePhaseAccess(userProfile)

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'app', or 'manual'
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [viewMode, setViewMode] = useState(VIEW_MODES.COMPACT) // 'compact' or 'cards'
  
  // Student data
  const [appStudents, setAppStudents] = useState([])
  const [manualStudents, setManualStudents] = useState([])
  const [statsData, setStatsData] = useState({
    totalAppStudents: 0,
    totalManualStudents: 0,
    totalBooks: 0,
    activeStudents: 0
  })

  // Teacher's configuration data
  const [teacherNominees, setTeacherNominees] = useState([])
  const [teacherSubmissionOptions, setTeacherSubmissionOptions] = useState({})

  // UI states
  const [showAddManualModal, setShowAddManualModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBookSubmissionModal, setShowBookSubmissionModal] = useState(false)
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false)
  const [showStudentBooksModal, setShowStudentBooksModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStudentBooks, setSelectedStudentBooks] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  // Historical Completions State Variables
  const [showHistoricalModal, setShowHistoricalModal] = useState(false)
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null)
  const [selectedGrade, setSelectedGrade] = useState('')
  const [bookCount, setBookCount] = useState('')
  const [isProcessingHistorical, setIsProcessingHistorical] = useState(false)
  const [showHistoricalSection, setShowHistoricalSection] = useState(false)
  const [historicalSearchTerm, setHistoricalSearchTerm] = useState('')

  // Form data
  const [newManualStudent, setNewManualStudent] = useState({
    firstName: '',
    lastInitial: '',
    grade: 4,
    personalGoal: 10
  })

  const [bookSubmission, setBookSubmission] = useState({
    bookId: '',
    bookTitle: '',
    submissionType: 'book_report',
    submissionDate: new Date().toISOString().split('T')[0]
  })

  // 🔧 SOUND FUNCTIONS
  const playHistoricalUnlockSound = useCallback(() => {
    try {
      // Play special sound for bulk unlock
      const audio = new Audio('/sounds/unlock_achievement.mp3');
      audio.volume = 0.4;
      audio.play().catch(error => {
        console.log('Audio play failed:', error);
      });
    } catch (error) {
      console.log('Sound loading failed:', error);
    }
  }, []);

  // 🔧 HELPER FUNCTION: Get Saint Name
  const getSaintName = (saintId) => {
    const saintNames = {
      'saint_028': 'St. Nicholas',
      'saint_088': 'St. George', 
      'saint_136': 'Our Lady of the Rosary',
      'saint_109': 'St. Christopher',
      'saint_082': 'St. Dominic Savio',
      'saint_015': 'St. Elizabeth Ann Seton',
      'saint_018': 'St. Thomas Aquinas',
      'saint_124': 'St. Hildegard of Bingen',
      'saint_134': 'Our Lady of Guadalupe',
      'saint_132': 'Our Lady of Lourdes',
      'saint_133': 'Our Lady of Fatima',
      'saint_135': 'Our Lady of Sorrows'
    };
    return saintNames[saintId] || 'Unknown Saint';
  };

  // 🔧 Get available grades for a student (only PREVIOUS grades, not current)
  const getAvailableGradesForStudent = (student) => {
    if (!student) return []
    
    const currentGrade = parseInt(student.grade)
    const availableGrades = []
    
    // Only show grades 4 through ONE BELOW current grade (but max grade 6 for historical)
    const minGrade = 4
    const maxGrade = Math.min(currentGrade - 1, 7) // One below current grade, max 7
    
    // Only add grades if student is above grade 4
    if (currentGrade > 4) {
      for (let grade = minGrade; grade <= maxGrade; grade++) {
        availableGrades.push(grade)
      }
    }
    
    return availableGrades
  }

  // 🔧 Check if student has maxed out historical completions
  const hasMaxHistoricalCompletions = (student) => {
    if (!student) return false
    
    // Grade 4 students have no previous grades to add
    if (parseInt(student.grade) === 4) return true
    
    const availableGrades = getAvailableGradesForStudent(student)
    const existingCompletions = student.historicalCompletions || []
    
    // If all available grades have been added, they're maxed out
    return availableGrades.every(grade => 
      existingCompletions.some(comp => comp.grade === grade)
    )
  }

  // 🔧 MAIN FUNCTION: Add Historical Grade Completion
  const addHistoricalGradeCompletion = async (student, grade, bookCount) => {
    if (!student || !grade || !bookCount) return;

    const gradeNum = parseInt(grade);
    const books = parseInt(bookCount);
    const currentGrade = parseInt(student.grade);

    // Validate grade is less than current grade
    if (gradeNum >= currentGrade) {
      throw new Error('Historical completions can only be added for previous grades');
    }

    // UPDATED: Changed from 4 to 20 books maximum
    if (books < 1 || books > 20) {
      throw new Error('Book count must be between 1 and 20');
    }

    if (!GRADE_SAINT_MAPPINGS[gradeNum]) {
      throw new Error('Invalid grade selected');
    }

    try {
      console.log('📚 Adding historical completion:', {
        student: student.firstName,
        grade: gradeNum,
        books: books
      });

      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
      const teacherSnapshot = await getDocs(teacherQuery);
      const teacherId = teacherSnapshot.docs[0].id;

      const saintMapping = GRADE_SAINT_MAPPINGS[gradeNum];
      const saintsToUnlock = [
        saintMapping.seasonal,
        saintMapping.grade,
        saintMapping.marian
      ];

      console.log('🎯 Saints to unlock:', saintsToUnlock);

      if (student.type === 'manual') {
        // 📝 MANUAL STUDENT UPDATE
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id);
        
        const currentLifetime = student.lifetimeBooksSubmitted || 0;
        const newLifetime = currentLifetime + books;

        // Create historical completion entry
        const historicalEntry = {
          grade: gradeNum,
          books: books,
          saintsUnlocked: saintsToUnlock,
          addedAt: new Date(),
          addedBy: 'teacher'
        };

        const existingHistory = student.historicalCompletions || [];
        const updatedHistory = [...existingHistory, historicalEntry];

        await updateDoc(studentRef, {
          lifetimeBooksSubmitted: newLifetime,
          historicalCompletions: updatedHistory,
          lastModified: new Date()
        });

        console.log(`✅ Updated manual student ${student.firstName}: +${books} books, total: ${newLifetime}`);

      } else {
        // 📱 APP STUDENT UPDATE
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id);
        
        const currentLifetime = student.lifetimeBooksSubmitted || 0;
        const newLifetime = currentLifetime + books;

        const currentUnlocked = student.unlockedSaints || [];
        const currentTimestamps = student.newlyUnlockedSaintsWithTimestamp || {};

        // Add new saints to unlocked list
        const updatedUnlocked = [...new Set([...currentUnlocked, ...saintsToUnlock])];
        
        // Add timestamps for glow effect
        const now = new Date().toISOString();
        const newTimestamps = { ...currentTimestamps };
        
        saintsToUnlock.forEach(saintId => {
          if (!currentUnlocked.includes(saintId)) {
            newTimestamps[saintId] = {
              timestamp: now,
              name: getSaintName(saintId),
              source: 'historical_completion'
            };
          }
        });

        // Create historical completion entry
        const historicalEntry = {
          grade: gradeNum,
          books: books,
          saintsUnlocked: saintsToUnlock,
          addedAt: new Date(),
          addedBy: 'teacher'
        };

        const existingHistory = student.historicalCompletions || [];
        const updatedHistory = [...existingHistory, historicalEntry];

        await updateDoc(studentRef, {
          lifetimeBooksSubmitted: newLifetime,
          unlockedSaints: updatedUnlocked,
          newlyUnlockedSaintsWithTimestamp: newTimestamps,
          historicalCompletions: updatedHistory,
          lastModified: new Date()
        });

        console.log(`✅ Updated app student ${student.firstName}: +${books} books, +${saintsToUnlock.length} saints`);
      }

      // 🔊 Play unlock sound
      playHistoricalUnlockSound();

      return {
        success: true,
        booksAdded: books,
        saintsUnlocked: saintsToUnlock.length,
        newLifetimeTotal: (student.lifetimeBooksSubmitted || 0) + books
      };

    } catch (error) {
      console.error('❌ Error adding historical completion:', error);
      throw error;
    }
  };

  // 🔧 OPEN HISTORICAL MODAL
  const openHistoricalModal = (student) => {
    setSelectedStudentForHistory(student);
    setSelectedGrade('');
    setBookCount('');
    setShowHistoricalModal(true);
  };

  // 🔧 HANDLE HISTORICAL COMPLETION
  const handleHistoricalCompletion = async () => {
    if (!selectedStudentForHistory || !selectedGrade || !bookCount) {
      setShowSuccess('❌ Please fill in all fields');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    const books = parseInt(bookCount);
    // UPDATED: Changed from 4 to 20 books maximum
    if (books < 1 || books > 20) {
      setShowSuccess('❌ Book count must be between 1 and 20');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    // Check for duplicate grade
    const existingCompletions = selectedStudentForHistory.historicalCompletions || [];
    const hasGrade = existingCompletions.some(comp => comp.grade === parseInt(selectedGrade));
    
    if (hasGrade) {
      setShowSuccess(`❌ Grade ${selectedGrade} already added for ${selectedStudentForHistory.firstName}`);
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    // Additional validation: ensure selected grade is below current grade
    if (parseInt(selectedGrade) >= parseInt(selectedStudentForHistory.grade)) {
      setShowSuccess(`❌ Can only add historical data for grades before Grade ${selectedStudentForHistory.grade}`);
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    const saintMapping = GRADE_SAINT_MAPPINGS[parseInt(selectedGrade)];
    const saintNames = [
      getSaintName(saintMapping.seasonal),
      getSaintName(saintMapping.grade),
      getSaintName(saintMapping.marian)
    ];

    const confirmed = window.confirm(`Add Grade ${selectedGrade} completion for ${selectedStudentForHistory.firstName}?
(Current grade: ${selectedStudentForHistory.grade})

📚 Books: ${books}
🎯 Saints to unlock: ${saintNames.join(', ')}
🏆 New lifetime total: ${(selectedStudentForHistory.lifetimeBooksSubmitted || 0) + books}

This action cannot be undone.`);

    if (!confirmed) return;

    setIsProcessingHistorical(true);
    
    try {
      const result = await addHistoricalGradeCompletion(selectedStudentForHistory, selectedGrade, books);
      
      // Update local state
      if (selectedStudentForHistory.type === 'manual') {
        setManualStudents(prev => 
          prev.map(s => 
            s.id === selectedStudentForHistory.id 
              ? { 
                  ...s, 
                  lifetimeBooksSubmitted: result.newLifetimeTotal,
                  historicalCompletions: [...(s.historicalCompletions || []), {
                    grade: parseInt(selectedGrade),
                    books: books,
                    saintsUnlocked: Object.values(saintMapping),
                    addedAt: new Date(),
                    addedBy: 'teacher'
                  }]
                }
              : s
          )
        );
      } else {
        setAppStudents(prev => 
          prev.map(s => 
            s.id === selectedStudentForHistory.id 
              ? { 
                  ...s, 
                  lifetimeBooksSubmitted: result.newLifetimeTotal,
                  historicalCompletions: [...(s.historicalCompletions || []), {
                    grade: parseInt(selectedGrade),
                    books: books,
                    saintsUnlocked: Object.values(saintMapping),
                    addedAt: new Date(),
                    addedBy: 'teacher'
                  }]
                }
              : s
          )
        );
      }

      // Close modal and reset form
      setShowHistoricalModal(false)
      setSelectedStudentForHistory(null);
      setSelectedGrade('');
      setBookCount('');
      
      setShowSuccess(`🎉 Added Grade ${selectedGrade} completion! +${books} books, +${result.saintsUnlocked} saints for ${selectedStudentForHistory.firstName}!`);
      setTimeout(() => setShowSuccess(''), 4000);

    } catch (error) {
      console.error('Error adding historical completion:', error);
      setShowSuccess('❌ Error adding completion. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    } finally {
      setIsProcessingHistorical(false);
    }
  };

  // 🔧 FILTER STUDENTS FOR HISTORICAL
  const getFilteredStudentsForHistorical = () => {
    const allStudents = [
      ...appStudents.map(s => ({ ...s, type: 'app' })),
      ...manualStudents.map(s => ({ ...s, type: 'manual' }))
    ].filter(s => s.status !== 'inactive');

    if (!historicalSearchTerm) return allStudents;

    return allStudents.filter(student => 
      student.firstName.toLowerCase().includes(historicalSearchTerm.toLowerCase()) ||
      student.lastInitial.toLowerCase().includes(historicalSearchTerm.toLowerCase()) ||
      (student.displayUsername && student.displayUsername.toLowerCase().includes(historicalSearchTerm.toLowerCase()))
    );
  };

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading || phaseLoading) return

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
        loadTeacherConfiguration()
        loadStudentsData()
      }
    }

    checkAuth()
  }, [authLoading, phaseLoading, isAuthenticated, userProfile, router, isSessionExpired, signOut])

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

  // Load teacher's configuration (nominees and submission options)
  const loadTeacherConfiguration = async () => {
    try {
      console.log('🔧 Loading teacher configuration...')
      
      if (!userProfile?.entityId || !userProfile?.schoolId || !userProfile?.uid) {
        console.error('❌ Missing teacher profile data')
        return
      }

      // Find teacher document by UID to get configuration
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      
      if (teacherSnapshot.empty) {
        console.error('❌ Teacher document not found')
        return
      }

      const teacherDoc = teacherSnapshot.docs[0]
      const teacherData = teacherDoc.data()
      
      console.log('👩‍🏫 Teacher data:', teacherData)

      // Get teacher's selected nominees
      const selectedNomineeIds = teacherData.selectedNominees || []
      console.log('📚 Selected nominee IDs:', selectedNomineeIds)

      // Fetch full book data for selected nominees
      if (selectedNomineeIds.length > 0) {
        const masterNomineesRef = collection(db, 'masterNominees')
        const masterNomineesSnapshot = await getDocs(masterNomineesRef)
        
        const nominees = []
        masterNomineesSnapshot.forEach(doc => {
          const bookData = doc.data()
          if (selectedNomineeIds.includes(bookData.id)) {
            nominees.push({
              id: bookData.id,
              ...bookData
            })
          }
        })
        
        console.log('✅ Loaded teacher nominees:', nominees.length)
        setTeacherNominees(nominees)
      }

      // Get teacher's submission options
      const submissionOptions = teacherData.submissionOptions || {}
      console.log('📝 Teacher submission options:', submissionOptions)
      setTeacherSubmissionOptions(submissionOptions)

    } catch (error) {
      console.error('❌ Error loading teacher configuration:', error)
    }
  }

  // Load students data
  const loadStudentsData = async () => {
    try {
      console.log('📊 Loading students data...')
      
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

      // Load app students (where currentTeacherId === teacherId)
      const appStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`)
      const appStudentsQuery = query(
        appStudentsRef, 
        where('currentTeacherId', '==', teacherId)
      )
      const appStudentsSnapshot = await getDocs(appStudentsQuery)
      
      const appStudentsData = []
      appStudentsSnapshot.forEach(doc => {
        const studentData = { id: doc.id, ...doc.data() }
        if (studentData.status !== 'deleted') {
          appStudentsData.push(studentData)
        }
      })
      
      // Sort by firstName in JavaScript
      appStudentsData.sort((a, b) => a.firstName.localeCompare(b.firstName))

      // Load manual students
      const manualStudentsRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`)
      let manualStudentsSnapshot = { docs: [] }
      
      try {
        manualStudentsSnapshot = await getDocs(manualStudentsRef)
      } catch (error) {
        console.log('No manual students collection yet')
      }

      const manualStudentsData = []
      manualStudentsSnapshot.forEach(doc => {
        manualStudentsData.push({ id: doc.id, ...doc.data() })
      })
      
      // Sort by firstName in JavaScript
      manualStudentsData.sort((a, b) => a.firstName.localeCompare(b.firstName))

      // Calculate stats
      const totalBooks = appStudentsData.reduce((sum, student) => 
        sum + (student.booksSubmittedThisYear || 0), 0
      ) + manualStudentsData.reduce((sum, student) => 
        sum + (student.totalBooksThisYear || 0), 0
      )

      const activeAppStudents = appStudentsData.filter(s => s.status !== 'inactive').length
      const activeManualStudents = manualStudentsData.filter(s => s.status !== 'inactive').length

      setAppStudents(appStudentsData)
      setManualStudents(manualStudentsData)
      setStatsData({
        totalAppStudents: appStudentsData.length,
        totalManualStudents: manualStudentsData.length,
        totalBooks,
        activeStudents: activeAppStudents + activeManualStudents
      })

      console.log(`✅ Loaded ${appStudentsData.length} app students, ${manualStudentsData.length} manual students`)

    } catch (error) {
      console.error('❌ Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle vote casting for manual students
  const handleVoteCast = async (student, bookId) => {
    try {
      console.log('🗳️ Casting vote for student:', student.firstName, 'Book:', bookId)
      
      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      // Create vote object
      const voteData = {
        bookId: bookId,
        votedAt: new Date(),
        votedBy: 'teacher'
      }

      // Update the manual student with vote data
      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id)
      await updateDoc(studentRef, {
        vote: voteData,
        hasVotedThisYear: true,
        lastModified: new Date()
      })

      // Update local state
      setManualStudents(prev => 
        prev.map(s => 
          s.id === student.id 
            ? { ...s, vote: voteData, hasVotedThisYear: true }
            : s
        )
      )

      setShowSuccess(`🗳️ Vote cast for ${student.firstName}!`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error casting vote:', error)
      setShowSuccess('❌ Error casting vote. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
      throw error // Re-throw to trigger error handling in the component
    }
  }

  // Toggle app student status
  const toggleAppStudentStatus = async (student) => {
    setIsProcessing(true)
    try {
      const newStatus = student.status === 'inactive' ? 'active' : 'inactive'
      
      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id)
      await updateDoc(studentRef, {
        status: newStatus,
        lastModified: new Date()
      })

      setAppStudents(prev => 
        prev.map(s => 
          s.id === student.id 
            ? { ...s, status: newStatus }
            : s
        )
      )

      setShowSuccess(`📱 ${student.firstName} ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error updating student status:', error)
      setShowSuccess('❌ Error updating status. Please try again.')
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
      // Find teacher document ID
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
      const docRef = await addDoc(manualStudentsRef, studentData)

      const newStudent = { id: docRef.id, ...studentData }
      
      setManualStudents(prev => {
        const updated = [...prev, newStudent]
        setStatsData(prevStats => ({
          ...prevStats,
          totalManualStudents: updated.length,
          activeStudents: prevStats.activeStudents + 1
        }))
        return updated
      })
      
      setNewManualStudent({
        firstName: '',
        lastInitial: '',
        grade: 4,
        personalGoal: 10
      })
      setShowAddManualModal(false)
      setShowSuccess(`✅ ${newManualStudent.firstName} added successfully!`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error adding manual student:', error)
      setShowSuccess('❌ Error adding student. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Add book submission for manual student with book selection
  const addBookSubmission = async () => {
    if (!bookSubmission.bookId) {
      setShowSuccess('❌ Please select a book')
      setTimeout(() => setShowSuccess(''), 3000)
      return
    }

    setIsProcessing(true)
    try {
      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      // Find the selected book details
      const selectedBook = teacherNominees.find(book => book.id === bookSubmission.bookId)
      
      const submission = {
        bookId: bookSubmission.bookId,
        bookTitle: selectedBook?.title || bookSubmission.bookTitle,
        submissionType: bookSubmission.submissionType,
        submittedDate: new Date(bookSubmission.submissionDate),
        approved: true // Auto-approve manual submissions
      }

      const updatedStudent = {
        ...selectedStudent,
        booksSubmitted: [...(selectedStudent.booksSubmitted || []), submission],
        totalBooksThisYear: (selectedStudent.totalBooksThisYear || 0) + 1,
        lastModified: new Date()
      }

      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, selectedStudent.id)
      await updateDoc(studentRef, {
        booksSubmitted: updatedStudent.booksSubmitted,
        totalBooksThisYear: updatedStudent.totalBooksThisYear,
        lastModified: updatedStudent.lastModified
      })

      setManualStudents(prev => 
        prev.map(s => 
          s.id === selectedStudent.id ? updatedStudent : s
        )
      )

      setBookSubmission({
        bookId: '',
        bookTitle: '',
        submissionType: 'book_report',
        submissionDate: new Date().toISOString().split('T')[0]
      })
      setShowBookSubmissionModal(false)
      setShowSuccess(`📚 Book added for ${selectedStudent.firstName}!`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error adding book submission:', error)
      setShowSuccess('❌ Error adding book. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Delete manual student
  const deleteManualStudent = async (student) => {
    if (!confirm(`Are you sure you want to delete ${student.firstName} ${student.lastInitial}? This cannot be undone.`)) {
      return
    }

    setIsProcessing(true)
    try {
      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
      const teacherSnapshot = await getDocs(teacherQuery)
      const teacherId = teacherSnapshot.docs[0].id

      const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id)
      await deleteDoc(studentRef)

      setManualStudents(prev => {
        const updated = prev.filter(s => s.id !== student.id)
        setStatsData(prevStats => ({
          ...prevStats,
          totalManualStudents: updated.length,
          activeStudents: prevStats.activeStudents - (student.status === 'active' ? 1 : 0)
        }))
        return updated
      })
      
      setShowSuccess(`🗑️ ${student.firstName} deleted successfully`)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('❌ Error deleting student:', error)
      setShowSuccess('❌ Error deleting student. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  // Filter students
  const filterStudents = (students) => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastInitial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.displayUsername && student.displayUsername.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesGrade = gradeFilter === 'all' || student.grade.toString() === gradeFilter
      
      return matchesSearch && matchesGrade
    })
  }

  // Get all students combined for "All" tab
  const getAllStudents = () => {
    const combined = [
      ...appStudents.map(s => ({ ...s, type: 'app' })),
      ...manualStudents.map(s => ({ ...s, type: 'manual' }))
    ]
    return combined.sort((a, b) => a.firstName.localeCompare(b.firstName))
  }

  // Load student's completed books
  const loadStudentBooks = async (student) => {
    try {
      console.log('📚 Loading books for student:', student.firstName)
      setSelectedStudent(student)
      
      if (student.type === 'manual') {
        // For manual students, books are in booksSubmitted array
        const books = student.booksSubmitted || []
        console.log('📝 Manual student books:', books)
        
        // Get full book details for each submitted book
        const booksWithDetails = await Promise.all(
          books.map(async (submission) => {
            try {
              const bookDetails = teacherNominees.find(book => book.id === submission.bookId)
              return {
                ...submission,
                bookDetails: bookDetails || { title: submission.bookTitle, authors: 'Unknown' }
              }
            } catch (error) {
              return {
                ...submission,
                bookDetails: { title: submission.bookTitle || 'Unknown Book', authors: 'Unknown' }
              }
            }
          })
        )
        
        setSelectedStudentBooks(booksWithDetails)
        
      } else {
        // For app students, load their bookshelf from Firebase
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id)
        const studentDoc = await getDoc(studentRef)
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data()
          const bookshelf = studentData.bookshelf || []
          
          // Filter for completed books only
          const completedBooks = bookshelf.filter(book => book.completed === true)
          
          // Get full book details
          const booksWithDetails = await Promise.all(
            completedBooks.map(async (bookEntry) => {
              try {
                const bookDetails = teacherNominees.find(book => book.id === bookEntry.bookId)
                return {
                  ...bookEntry,
                  bookDetails: bookDetails || { title: 'Unknown Book', authors: 'Unknown' }
                }
              } catch (error) {
                return {
                  ...bookEntry,
                  bookDetails: { title: 'Unknown Book', authors: 'Unknown' }
                }
              }
            })
          )
          
          setSelectedStudentBooks(booksWithDetails)
        } else {
          setSelectedStudentBooks([])
        }
      }
      
      setShowStudentBooksModal(true)
      
    } catch (error) {
      console.error('❌ Error loading student books:', error)
      setShowSuccess('❌ Error loading student books')
      setTimeout(() => setShowSuccess(''), 3000)
    }
  }

  // Get available books for this student (filtering out already completed)
  const getAvailableBooksForStudent = (student) => {
    if (!student || !teacherNominees.length) return []
    
    const completedBookIds = new Set()
    
    if (student.type === 'manual') {
      // For manual students, get completed book IDs from booksSubmitted
      const submissions = student.booksSubmitted || []
      submissions.forEach(submission => {
        if (submission.bookId) {
          completedBookIds.add(submission.bookId)
        }
      })
    } else {
      // For app students, we'd need to load their bookshelf, but for now
      // we'll just return all books since we're focusing on manual students
      // This could be enhanced later
    }
    
    // Filter out books already completed by this student
    return teacherNominees.filter(book => !completedBookIds.has(book.id))
  }

  // Get available submission options for manual students (excluding quiz)
  const getAvailableSubmissionOptions = () => {
    const options = []
    
    // Always include book report as fallback
    options.push({ value: 'book_report', label: 'Book Report' })
    
    // Add teacher's enabled options (excluding quiz)
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

  // Session extension
  const extendSession = () => {
    updateLastActivity()
    setShowTimeoutWarning(false)
  }

  const handleTimeoutSignOut = async () => {
    await signOut({ redirectTo: '/sign-in?reason=session-expired' })
  }

  // Open login modal
  const openLoginModal = (student) => {
    setSelectedStudent(student)
    setShowLoginModal(true)
  }

  // Group students by grade
  const getStudentsByGrade = useMemo(() => {
    const allStudents = getAllStudents()
    const filtered = filterStudents(allStudents)
    
    const byGrade = {}
    for (let grade = 4; grade <= 8; grade++) {
      byGrade[grade] = filtered.filter(s => parseInt(s.grade) === grade)
    }
    
    return byGrade
  }, [appStudents, manualStudents, searchTerm, gradeFilter])

  // Show loading
  if (authLoading || loading || phaseLoading || !userProfile) {
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
            Loading students...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile || !['teacher', 'admin'].includes(userProfile.accountType)) {
    return null
  }

  const filteredAppStudents = filterStudents(appStudents)
  const filteredManualStudents = filterStudents(manualStudents)
  const filteredAllStudents = filterStudents(getAllStudents())
  const availableSubmissionOptions = getAvailableSubmissionOptions()

  return (
    <>
      <Head>
        <title>My Students - Lux Libris</title>
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
                  My Students
                </h1>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  Manage your reading program students
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

          {/* Phase Status Display - Now using hook data */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: `2px solid ${getPhaseInfo().color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{getPhaseInfo().icon}</span>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#223848', margin: 0 }}>
                {getPhaseInfo().name} Mode
              </h3>
              {/* Optional: Add refresh button for manual testing */}
              <button
                onClick={refreshPhase}
                style={{
                  marginLeft: 'auto',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              {getPhaseMessage()}
            </p>
          </div>

          {/* Stats Cards - Compact Version */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <StatCard
              icon="📱"
              title="App Students"
              value={statsData.totalAppStudents}
              subtitle="Self-registered students"
              color="#ADD4EA"
            />
            <StatCard
              icon="📝"
              title="Manual Students"
              value={statsData.totalManualStudents}
              subtitle="Teacher-managed"
              color="#C3E0DE"
            />
            <StatCard
              icon="📚"
              title="Total Books"
              value={statsData.totalBooks}
              subtitle="Books completed this year"
              color="#A1E5DB"
            />
            <StatCard
              icon="✅"
              title="Active Students"
              value={statsData.activeStudents}
              subtitle="Currently participating"
              color="#B6DFEB"
            />
          </div>

          {/* Manual Student Voting Interface - Updated condition */}
          {permissions.currentPhase === 'VOTING' && (
            <ManualStudentVotingInterface
              manualStudents={manualStudents}
              teacherNominees={teacherNominees}
              userProfile={userProfile}
              onVoteCast={handleVoteCast}
              isProcessing={isProcessing}
            />
          )}

          {/* Historical Completions Section */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '2px solid #9370DB'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🏆 Add Historical Grade Completions
              </h3>
              <button
                onClick={() => setShowHistoricalSection(!showHistoricalSection)}
                style={{
                  background: showHistoricalSection ? '#9370DB' : 'linear-gradient(135deg, #9370DB, #8A2BE2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {showHistoricalSection ? '➖ Hide' : '➕ Show'} Section
              </button>
            </div>

            {showHistoricalSection && (
              <>
                <div style={{
                  background: '#F3E8FF',
                  border: '1px solid #9370DB',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ 
                    color: '#6B46C1', 
                    margin: '0 0 0.5rem 0', 
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    📋 Add Previous Year Completions:
                  </p>
                  <ul style={{ 
                    color: '#7C3AED', 
                    margin: 0,
                    paddingLeft: '1.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <li>Add books from previous grades (before current year)</li>
                    <li>Each grade adds books to lifetime total and unlocks 3 saints</li>
                    <li>Maximum 20 books per grade year</li>
                    <li>Only grades BELOW student&apos;s current grade are available</li>
                  </ul>
                </div>

                {/* Student Search */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Search Students
                  </label>
                  <input
                    type="text"
                    value={historicalSearchTerm}
                    onChange={(e) => setHistoricalSearchTerm(e.target.value)}
                    placeholder="Search by name or username..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #9370DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      backgroundColor: '#FAFAFF',
                      color: '#374151'
                    }}
                  />
                </div>

                {/* Student Selection */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: '1rem',
                  alignItems: 'end',
                  marginBottom: '1.5rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Student *
                    </label>
                    <select
                      value={selectedStudentForHistory?.id || ''}
                      onChange={(e) => {
                        const student = getFilteredStudentsForHistorical().find(s => s.id === e.target.value);
                        setSelectedStudentForHistory(student || null);
                        setSelectedGrade('');
                        setBookCount('');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #9370DB',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        backgroundColor: '#FAFAFF',
                        color: '#374151'
                      }}
                    >
                      <option value="">Select student...</option>
                      {getFilteredStudentsForHistorical().map(student => {
                        const hasMaxed = hasMaxHistoricalCompletions(student)
                        const isGrade4 = parseInt(student.grade) === 4
                        return (
                          <option 
                            key={`${student.type}-${student.id}`} 
                            value={student.id}
                            disabled={hasMaxed || isGrade4}
                          >
                            {student.firstName} {student.lastInitial}. ({student.type.toUpperCase()}) 
                            - Grade {student.grade}
                            {hasMaxed ? ' (All grades completed)' : isGrade4 ? ' (No previous grades)' : ''}
                          </option>
                        )
                      })}
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
                      Grade *
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      disabled={!selectedStudentForHistory}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #9370DB',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        backgroundColor: selectedStudentForHistory ? '#FAFAFF' : '#F3F4F6',
                        color: selectedStudentForHistory ? '#374151' : '#9CA3AF',
                        cursor: selectedStudentForHistory ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <option value="">Select grade...</option>
                      {selectedStudentForHistory && getAvailableGradesForStudent(selectedStudentForHistory).map(grade => {
                        const alreadyAdded = selectedStudentForHistory?.historicalCompletions?.some(comp => comp.grade === grade);
                        return (
                          <option key={grade} value={grade} disabled={alreadyAdded}>
                            Grade {grade} {alreadyAdded ? '(Already added)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {selectedStudentForHistory && getAvailableGradesForStudent(selectedStudentForHistory).length === 0 && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#EF4444',
                        margin: '0.25rem 0 0 0'
                      }}>
                        No previous grades available (Grade 4 students have no prior grades)
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Books (1-20) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={bookCount}
                      onChange={(e) => setBookCount(e.target.value)}
                      placeholder="1-20"
                      disabled={!selectedStudentForHistory || !selectedGrade}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #9370DB',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        backgroundColor: (selectedStudentForHistory && selectedGrade) ? '#FAFAFF' : '#F3F4F6',
                        color: (selectedStudentForHistory && selectedGrade) ? '#374151' : '#9CA3AF',
                        cursor: (selectedStudentForHistory && selectedGrade) ? 'text' : 'not-allowed'
                      }}
                    />
                  </div>

                  {(!selectedStudentForHistory || (!hasMaxHistoricalCompletions(selectedStudentForHistory) && parseInt(selectedStudentForHistory?.grade) > 4)) ? (
                    <button
                      onClick={handleHistoricalCompletion}
                      disabled={!selectedStudentForHistory || !selectedGrade || !bookCount || isProcessingHistorical || parseInt(selectedStudentForHistory?.grade) === 4}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: (selectedStudentForHistory && selectedGrade && bookCount && parseInt(selectedStudentForHistory.grade) > 4) ? 
                          'linear-gradient(135deg, #9370DB, #8A2BE2)' : '#E5E7EB',
                        color: (selectedStudentForHistory && selectedGrade && bookCount && parseInt(selectedStudentForHistory.grade) > 4) ? 'white' : '#9CA3AF',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: (selectedStudentForHistory && selectedGrade && bookCount && parseInt(selectedStudentForHistory.grade) > 4) ? 'pointer' : 'not-allowed',
                        minWidth: '120px'
                      }}
                    >
                      {isProcessingHistorical ? '⏳ Adding...' : '🏆 Add Completion'}
                    </button>
                  ) : (
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: '#F3E8FF',
                      color: '#6B46C1',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textAlign: 'center',
                      border: '1px solid #9370DB'
                    }}>
                      {parseInt(selectedStudentForHistory?.grade) === 4 ? '❌ No Previous Grades' : '✅ All Completed'}
                    </div>
                  )}
                </div>

                {/* Preview */}
                {selectedStudentForHistory && selectedGrade && bookCount && (
                  <div style={{
                    background: '#F3E8FF',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid #9370DB'
                  }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#6B46C1',
                      margin: '0 0 0.5rem 0'
                    }}>
                      📋 Preview for {selectedStudentForHistory.firstName}:
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#7C3AED' }}>
                      <div>📚 Books to add: {bookCount}</div>
                      <div>🏆 New lifetime total: {(selectedStudentForHistory.lifetimeBooksSubmitted || 0) + parseInt(bookCount)}</div>
                      <div>🎯 Saints to unlock: {Object.values(GRADE_SAINT_MAPPINGS[parseInt(selectedGrade)] || {}).map(getSaintName).join(', ')}</div>
                    </div>
                  </div>
                )}

                {/* Existing Completions */}
                {selectedStudentForHistory?.historicalCompletions?.length > 0 && (
                  <div style={{
                    marginTop: '1rem',
                    background: '#F8FAFC',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid #E2E8F0'
                  }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 0.5rem 0'
                    }}>
                      📅 Existing Historical Completions for {selectedStudentForHistory.firstName}:
                    </h4>
                    {selectedStudentForHistory.historicalCompletions
                      .sort((a, b) => a.grade - b.grade)
                      .map((completion, index) => (
                      <div key={index} style={{
                        fontSize: '0.875rem',
                        color: '#6B7280',
                        marginBottom: '0.25rem',
                        padding: '0.25rem 0',
                        borderBottom: index < selectedStudentForHistory.historicalCompletions.length - 1 ? '1px solid #E5E7EB' : 'none'
                      }}>
                        <strong>Grade {completion.grade}:</strong> {completion.books} books, 
                        {' '}{completion.saintsUnlocked?.length || 0} saints unlocked
                      </div>
                    ))}
                  </div>
                )}

                {/* Message when all students have completed all grades or no grades available */}
                {getFilteredStudentsForHistorical().every(s => 
                  hasMaxHistoricalCompletions(s) || parseInt(s.grade) === 4
                ) && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: '#F3E8FF',
                    borderRadius: '0.5rem',
                    border: '1px solid #9370DB'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉</div>
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#6B46C1',
                      marginBottom: '0.5rem'
                    }}>
                      All Historical Data Complete!
                    </h4>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#7C3AED',
                      margin: 0
                    }}>
                      All eligible students have their historical completions recorded.
                      (Grade 4 students have no previous grades to add)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Search, Filter and View Mode Controls */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr auto auto',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search students by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  width: '100%',
                  boxSizing: 'border-box',
                  color: '#1f2937',
                  backgroundColor: '#ffffff'
                }}
              />
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                style={{
                  padding: '0.75rem 1rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  minWidth: '120px',
                  color: '#1f2937',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="all">All Grades</option>
                <option value="4">4th Grade</option>
                <option value="5">5th Grade</option>
                <option value="6">6th Grade</option>
                <option value="7">7th Grade</option>
                <option value="8">8th Grade</option>
              </select>
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                backgroundColor: '#F3F4F6',
                borderRadius: '0.5rem',
                padding: '0.25rem'
              }}>
                <button
                  onClick={() => setViewMode(VIEW_MODES.COMPACT)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: viewMode === VIEW_MODES.COMPACT ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: viewMode === VIEW_MODES.COMPACT ? '600' : '400',
                    color: viewMode === VIEW_MODES.COMPACT ? '#223848' : '#6B7280'
                  }}
                >
                  📋 Table
                </button>
                <button
                  onClick={() => setViewMode(VIEW_MODES.CARDS)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: viewMode === VIEW_MODES.CARDS ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: viewMode === VIEW_MODES.CARDS ? '600' : '400',
                    color: viewMode === VIEW_MODES.CARDS ? '#223848' : '#6B7280'
                  }}
                >
                  📇 Cards
                </button>
              </div>
            </div>
          </div>

          {/* Add Manual Student Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => setShowAddManualModal(true)}
              style={{
                background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                color: '#223848',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ➕ Add Manual Student
            </button>
          </div>

          {/* Students by Grade Sections */}
          {[4, 5, 6, 7, 8].map(grade => {
            const gradeStudents = getStudentsByGrade[grade]
            if (gradeStudents.length === 0 && !searchTerm) return null
            
            return (
              <GradeSection
                key={grade}
                grade={grade}
                students={gradeStudents}
                viewMode={viewMode}
                onToggleAppStatus={toggleAppStudentStatus}
                onEditManualStudent={(student) => {
                  setSelectedStudent(student)
                  setShowEditModal(true)
                }}
                onDeleteManualStudent={deleteManualStudent}
                onAddBookSubmission={(student) => {
                  setSelectedStudent(student)
                  setShowBookSubmissionModal(true)
                }}
                onViewDetails={(student) => {
                  setSelectedStudent(student)
                  setShowStudentDetailModal(true)
                }}
                onViewBooks={loadStudentBooks}
                onViewLogin={openLoginModal}
                onOpenHistoricalModal={openHistoricalModal}
                isProcessing={isProcessing}
                hasMaxHistoricalCompletions={hasMaxHistoricalCompletions}
                defaultExpanded={false}
                searchTerm={searchTerm}
              />
            )
          })}

          {/* No students message */}
          {filteredAllStudents.length === 0 && (
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {searchTerm ? '🔍' : '👥'}
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#223848',
                marginBottom: '0.5rem'
              }}>
                {searchTerm ? 'No Students Found' : 'No Students Yet'}
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem'
              }}>
                {searchTerm 
                  ? 'Try adjusting your search or filters.'
                  : 'Students will appear here when they join your class or you add them manually.'}
              </p>
            </div>
          )}
        </div>

        {/* Add Manual Student Modal */}
        {showAddManualModal && (
          <Modal
            title="➕ Add Manual Student"
            onClose={() => setShowAddManualModal(false)}
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
                  First Name *
                </label>
                <input
                  type="text"
                  value={newManualStudent.firstName}
                  onChange={(e) => setNewManualStudent(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    color: '#1f2937',
                    backgroundColor: '#ffffff'
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
                  value={newManualStudent.lastInitial}
                  onChange={(e) => setNewManualStudent(prev => ({ 
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
                    textTransform: 'uppercase',
                    color: '#1f2937',
                    backgroundColor: '#ffffff'
                  }}
                />
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
                    Grade
                  </label>
                  <select
                    value={newManualStudent.grade}
                    onChange={(e) => setNewManualStudent(prev => ({ ...prev, grade: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      color: '#1f2937',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value={4}>4th Grade</option>
                    <option value={5}>5th Grade</option>
                    <option value={6}>6th Grade</option>
                    <option value={7}>7th Grade</option>
                    <option value={8}>8th Grade</option>
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
                    Reading Goal
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newManualStudent.personalGoal}
                    onChange={(e) => setNewManualStudent(prev => ({ ...prev, personalGoal: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      color: '#1f2937',
                      backgroundColor: '#ffffff'
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
                  onClick={() => setShowAddManualModal(false)}
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
                  onClick={addManualStudent}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Manual Student Modal */}
        {showEditModal && selectedStudent && selectedStudent.type === 'manual' && (
          <Modal
            title="✏️ Edit Student"
            onClose={() => setShowEditModal(false)}
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
                  First Name *
                </label>
                <input
                  type="text"
                  value={selectedStudent.firstName}
                  onChange={(e) => setSelectedStudent(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    color: '#1f2937',
                    backgroundColor: '#ffffff'
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
                  value={selectedStudent.lastInitial}
                  onChange={(e) => setSelectedStudent(prev => ({ 
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
                    textTransform: 'uppercase',
                    color: '#1f2937',
                    backgroundColor: '#ffffff'
                  }}
                />
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
                    Grade
                  </label>
                  <select
                    value={selectedStudent.grade}
                    onChange={(e) => setSelectedStudent(prev => ({ ...prev, grade: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      color: '#1f2937',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value={4}>4th Grade</option>
                    <option value={5}>5th Grade</option>
                    <option value={6}>6th Grade</option>
                    <option value={7}>7th Grade</option>
                    <option value={8}>8th Grade</option>
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
                    Reading Goal
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={selectedStudent.personalGoal}
                    onChange={(e) => setSelectedStudent(prev => ({ ...prev, personalGoal: parseInt(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      color: '#1f2937',
                      backgroundColor: '#ffffff'
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
                  onClick={() => setShowEditModal(false)}
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
                  onClick={async () => {
                    setIsProcessing(true)
                    try {
                      // Find teacher document ID
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

                      setManualStudents(prev => 
                        prev.map(s => 
                          s.id === selectedStudent.id ? selectedStudent : s
                        )
                      )
                      
                      setShowEditModal(false)
                      setShowSuccess(`✅ ${selectedStudent.firstName} updated successfully!`)
                      setTimeout(() => setShowSuccess(''), 3000)

                    } catch (error) {
                      console.error('❌ Error updating student:', error)
                      setShowSuccess('❌ Error updating student. Please try again.')
                      setTimeout(() => setShowSuccess(''), 3000)
                    } finally {
                      setIsProcessing(false)
                    }
                  }}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #C3E0DE, #A1E5DB)',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Modal>
        )}
        {showBookSubmissionModal && selectedStudent && (
          <Modal
            title={`📚 Add Book for ${selectedStudent.firstName}`}
            onClose={() => setShowBookSubmissionModal(false)}
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
                    const availableBooks = getAvailableBooksForStudent(selectedStudent)
                    const selectedBook = availableBooks.find(book => book.id === e.target.value)
                    setBookSubmission(prev => ({ 
                      ...prev, 
                      bookId: e.target.value,
                      bookTitle: selectedBook?.title || ''
                    }))
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
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
                {getAvailableBooksForStudent(selectedStudent).length === 0 ? (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    margin: '0.5rem 0 0 0'
                  }}>
                    {selectedStudent.type === 'manual' ? 
                      'This student has completed all available books!' :
                      'No books available. Please select books during teacher onboarding.'
                    }
                  </p>
                ) : (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: '0.5rem 0 0 0'
                  }}>
                    {selectedStudent.type === 'manual' && (selectedStudent.booksSubmitted?.length || 0) > 0 && (
                      `Already completed: ${selectedStudent.booksSubmitted.length} book${selectedStudent.booksSubmitted.length !== 1 ? 's' : ''}`
                    )}
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
                      border: '1px solid #e5e7eb',
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
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: '0.25rem 0 0 0',
                    fontStyle: 'italic'
                  }}>
                    Quiz option only available through the app
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Submission Date
                  </label>
                  <input
                    type="date"
                    value={bookSubmission.submissionDate}
                    onChange={(e) => setBookSubmission(prev => ({ ...prev, submissionDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
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
                  onClick={() => setShowBookSubmissionModal(false)}
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
                    background: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
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

        {/* Student Books Modal */}
        {showStudentBooksModal && selectedStudent && (
          <Modal
            title={`📖 Books for ${selectedStudent.firstName} ${selectedStudent.lastInitial}.`}
            onClose={() => setShowStudentBooksModal(false)}
          >
            <div style={{ display: 'grid', gap: '1rem' }}>
              {selectedStudentBooks.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
                  <p>No books completed yet.</p>
                </div>
              ) : (
                <>
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
                      📊 Summary
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <div>Total Books: {selectedStudentBooks.length}</div>
                      <div>Grade: {selectedStudent.grade}</div>
                      <div>Goal: {selectedStudent.personalGoal} books</div>
                      <div>Progress: {Math.round((selectedStudentBooks.length / selectedStudent.personalGoal) * 100)}%</div>
                    </div>
                  </div>
                  
                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    display: 'grid',
                    gap: '0.75rem'
                  }}>
                    {selectedStudentBooks.map((bookEntry, index) => (
                      <div
                        key={index}
                        style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h5 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#223848',
                            margin: '0 0 0.25rem 0'
                          }}>
                            {bookEntry.bookDetails?.title || bookEntry.bookTitle || 'Unknown Book'}
                          </h5>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            margin: '0 0 0.25rem 0'
                          }}>
                            by {bookEntry.bookDetails?.authors || 'Unknown Author'}
                          </p>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#374151'
                          }}>
                            <span style={{
                              background: '#e5e7eb',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              marginRight: '0.5rem'
                            }}>
                              {bookEntry.submissionType || bookEntry.format || 'Completed'}
                            </span>
                            {bookEntry.submittedDate && (
                              <span>{new Date(bookEntry.submittedDate.seconds ? bookEntry.submittedDate.seconds * 1000 : bookEntry.submittedDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '1rem'
              }}>
                <button
                  onClick={() => setShowStudentBooksModal(false)}
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
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Login Credentials Modal */}
        {showLoginModal && selectedStudent && (
          <LoginCredentialsModal
            student={selectedStudent}
            onClose={() => setShowLoginModal(false)}
          />
        )}

        {/* Historical Completion Modal */}
        {showHistoricalModal && selectedStudentForHistory && (
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
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🏆 Add Historical Books - {selectedStudentForHistory.firstName}
                </h2>
                <button
                  onClick={() => setShowHistoricalModal(false)}
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

              {/* Info Box */}
              <div style={{
                background: '#F3E8FF',
                border: '1px solid #9370DB',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                {parseInt(selectedStudentForHistory.grade) === 4 ? (
                  <>
                    <p style={{ 
                      color: '#6B46C1', 
                      margin: '0 0 0.5rem 0', 
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      ⚠️ No Previous Grades Available
                    </p>
                    <p style={{ 
                      color: '#7C3AED', 
                      margin: 0,
                      fontSize: '0.875rem'
                    }}>
                      {selectedStudentForHistory.firstName} is in Grade 4 and has no previous grades to add historical data for.
                      Historical completions can only be added for grades completed before the current school year.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ 
                      color: '#6B46C1', 
                      margin: '0 0 0.5rem 0', 
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      📋 Add Previous Year Completion:
                    </p>
                    <ul style={{ 
                      color: '#7C3AED', 
                      margin: 0,
                      paddingLeft: '1.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <li>Each grade unlocks 3 saints (Grade + Seasonal + Marian)</li>
                      <li>Books add to lifetime total and appear in student dashboard</li>
                      <li>Maximum 20 books per grade, grades 4-{selectedStudentForHistory.grade - 1} only</li>
                      <li>Saints will sparkle for 24 hours in student&apos;s collection</li>
                    </ul>
                  </>
                )}
              </div>

              {/* Form - only show if not Grade 4 */}
              {parseInt(selectedStudentForHistory.grade) > 4 ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
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
                        Grade *
                      </label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #9370DB',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          boxSizing: 'border-box',
                          backgroundColor: '#FAFAFF',
                          color: '#374151'
                        }}
                      >
                        <option value="">Select grade...</option>
                        {getAvailableGradesForStudent(selectedStudentForHistory).map(grade => {
                          const alreadyAdded = selectedStudentForHistory?.historicalCompletions?.some(comp => comp.grade === grade);
                          return (
                            <option key={grade} value={grade} disabled={alreadyAdded}>
                              Grade {grade} {alreadyAdded ? '(Already added)' : ''}
                            </option>
                          );
                        })}
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
                        Books (1-20) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={bookCount}
                        onChange={(e) => setBookCount(e.target.value)}
                        placeholder="1-20"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #9370DB',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          boxSizing: 'border-box',
                          backgroundColor: '#FAFAFF',
                          color: '#374151'
                        }}
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {selectedGrade && bookCount && (
                    <div style={{
                      background: '#F3E8FF',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      border: '1px solid #9370DB'
                    }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#6B46C1',
                        margin: '0 0 0.5rem 0'
                      }}>
                        📋 Preview:
                      </h4>
                      <div style={{ fontSize: '0.875rem', color: '#7C3AED' }}>
                        <div>📚 Books to add: {bookCount}</div>
                        <div>🏆 New lifetime total: {(selectedStudentForHistory.lifetimeBooksSubmitted || 0) + parseInt(bookCount)}</div>
                        <div>🎯 Saints to unlock: {Object.values(GRADE_SAINT_MAPPINGS[parseInt(selectedGrade)] || {}).map(getSaintName).join(', ')}</div>
                      </div>
                    </div>
                  )}

                  {/* Existing Completions */}
                  {selectedStudentForHistory?.historicalCompletions?.length > 0 && (
                    <div style={{
                      background: '#F8FAFC',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      border: '1px solid #E2E8F0'
                    }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#374151',
                        margin: '0 0 0.5rem 0'
                      }}>
                        📅 Previous Completions:
                      </h4>
                      {selectedStudentForHistory.historicalCompletions
                        .sort((a, b) => a.grade - b.grade)
                        .map((completion, index) => (
                        <div key={index} style={{
                          fontSize: '0.875rem',
                          color: '#6B7280',
                          marginBottom: '0.25rem'
                        }}>
                          Grade {completion.grade}: {completion.books} books, {completion.saintsUnlocked?.length || 0} saints
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end',
                    marginTop: '1rem'
                  }}>
                    <button
                      onClick={() => setShowHistoricalModal(false)}
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
                      onClick={handleHistoricalCompletion}
                      disabled={!selectedGrade || !bookCount || isProcessingHistorical}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: (selectedGrade && bookCount) ? 
                          'linear-gradient(135deg, #9370DB, #8A2BE2)' : '#E5E7EB',
                        color: (selectedGrade && bookCount) ? 'white' : '#9CA3AF',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: (selectedGrade && bookCount) ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isProcessingHistorical ? '⏳ Adding...' : '🏆 Add Historical Books'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Grade 4 student - just show close button */
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={() => setShowHistoricalModal(false)}
                    style={{
                      padding: '0.75rem 2rem',
                      backgroundColor: '#9370DB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
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
            { id: 'students', icon: '👥', label: 'Students', active: true },
            { id: 'submissions', icon: '📋', label: 'Submissions', active: false },
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
            backgroundColor: showSuccess.includes('❌') ? '#EF4444' : '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 10002,
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '85vw',
            textAlign: 'center',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {showSuccess}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes slideUp {
            from {
              transform: translate(-50%, 20px);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </>
  )
}

// Supporting Components
function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      border: `1px solid ${color}20`,
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.25rem'
      }}>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <div style={{
          width: '1.5rem',
          height: '1.5rem',
          background: `${color}15`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '60%',
            height: '60%',
            background: color,
            borderRadius: '50%'
          }}></div>
        </div>
      </div>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#223848',
        margin: '0 0 0.125rem 0'
      }}>
        {value}
      </h3>
      <p style={{
        fontSize: '0.7rem',
        color: '#6b7280',
        margin: 0,
        fontWeight: '600'
      }}>
        {title}
      </p>
      <p style={{
        fontSize: '0.6rem',
        color: '#9ca3af',
        margin: '0.06rem 0 0 0'
      }}>
        {subtitle}
      </p>
    </div>
  )
}

function StudentCard({ student, type, onToggleStatus, onViewDetails, onEditStudent, onDeleteStudent, onAddBookSubmission, onViewBooks, onViewLogin, onOpenHistoricalModal, isProcessing, hasMaxHistoricalCompletions }) {
  const isActive = student.status !== 'inactive'
  
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      padding: '1rem',
      backgroundColor: isActive ? 'white' : '#f9fafb',
      opacity: isActive ? 1 : 0.7
    }}>
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
              {student.firstName} {student.lastInitial}.
            </h4>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: type === 'app' ? '#ADD4EA' : '#C3E0DE',
              color: '#223848',
              borderRadius: '0.25rem',
              fontWeight: '600'
            }}>
              {type === 'app' ? 'APP' : 'MANUAL'}
            </span>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <div>Grade: {student.grade}</div>
            <div>Goal: {student.personalGoal} books</div>
            {type === 'app' && student.displayUsername && (
              <div>Username: {student.displayUsername}</div>
            )}
            <div>
              Books: {type === 'app' ? (student.booksSubmittedThisYear || 0) : (student.totalBooksThisYear || 0)}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          alignItems: 'flex-end'
        }}>
          {type === 'app' ? (
            <>
              <button
                onClick={onToggleStatus}
                disabled={isProcessing}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: isActive ? '#f87171' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '80px',
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={onViewLogin}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '80px'
                }}
              >
                🔑 Login Info
              </button>
              <button
                onClick={onViewBooks}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#B6DFEB',
                  color: '#223848',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '80px'
                }}
              >
                📖 View Books
              </button>
              {!hasMaxHistoricalCompletions(student) && parseInt(student.grade) > 4 && (
                <button
                  onClick={onOpenHistoricalModal}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#9370DB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '80px'
                  }}
                >
                  🏆 Historical
                </button>
              )}
            </>
          ) : (
            <>
              {/* Row 1: Edit/Delete actions */}
              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={onEditStudent}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#C3E0DE',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={onDeleteStudent}
                  disabled={isProcessing}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#f87171',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  🗑️
                </button>
              </div>
              {/* Row 2: Book actions */}
              <div style={{ display: 'flex', gap: '0.25rem', width: '100%' }}>
                <button
                  onClick={onAddBookSubmission}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  📚 Add Book
                </button>
                <button
                  onClick={onViewBooks}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#B6DFEB',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  📖 View Books
                </button>
              </div>
              {/* Row 3: Historical button - only show if grade > 4 */}
              {parseInt(student.grade) > 4 && !hasMaxHistoricalCompletions(student) ? (
                <div style={{ display: 'flex', width: '100%' }}>
                  <button
                    onClick={onOpenHistoricalModal}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#9370DB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    🏆 Add Historical Books
                  </button>
                </div>
              ) : parseInt(student.grade) > 4 ? (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#F3E8FF',
                  color: '#6B46C1',
                  border: '1px solid #9370DB',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textAlign: 'center',
                  width: '100%'
                }}>
                  ✅ Historical Complete
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

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
            {title}
          </h2>
          <button
            onClick={onClose}
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
        {children}
      </div>
    </div>
  )
}