// pages/parent/child-progress.js - UPDATED with hamburger menu + notifications
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { usePhaseAccess } from '../../hooks/usePhaseAccess'
import useUnlockNotifications from '../../hooks/useUnlockNotifications'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore'
import { db, getSchoolNomineesEntities, getCurrentAcademicYear } from '../../lib/firebase'
import EnhancedBraggingRightsModal from '../../components/EnhancedBraggingRightsModal'

// 🔧 FIXED: Helper function to extract unlock requests from student data structure
const extractUnlockRequests = (student) => {
  const unlockRequests = [];
  
  // Check for leaderboard unlock request
  if (student.leaderboardUnlockRequested && !student.leaderboardUnlocked) {
    unlockRequests.push({
      type: 'leaderboard',
      requestedAt: student.leaderboardRequestedAt || student.requestedAt || new Date(),
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastInitial || ''}`
    });
  }
  
  // 🔧 FIXED: Check bookshelf for quiz unlock requests (this is how students actually store them)
  if (student.bookshelf && Array.isArray(student.bookshelf)) {
    student.bookshelf.forEach(book => {
      if (book.status === 'pending_parent_quiz_unlock') {
        unlockRequests.push({
          type: 'quiz',
          bookId: book.bookId,
          bookTitle: book.bookTitle || 'Unknown Book',
          requestedAt: book.requestedAt || new Date(),
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastInitial || ''}`
        });
      }
    });
  }
  
  return unlockRequests;
};

// Note: Notifications are automatically cleared by the useUnlockNotifications hook when:
// - leaderboardUnlockRequested changes to false (after approval)
// - A book's status changes from 'pending_parent_quiz_unlock' to 'quiz_unlocked'
// This ensures notifications don't persist forever and are removed once handled

// Helper to get book title from nominees if not stored in student data
const getBookTitle = (bookId, nominees) => {
  const book = nominees.find(nominee => nominee.id === bookId);
  return book ? book.title : 'Unknown Book';
};

// 🔧 FIXED: Child Detail Modal Component - hooks moved to top + real-time updates + expandable books
function ChildDetailModal({ child, isOpen, onClose, theme, childColor, nominees, readingStats, onApproveUnlock, initialTab = 'reading', showComingSoon, setShowComingSoon }) {
  // ✅ FIXED: Move all hooks to the top, before any conditional returns
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showAllAvailable, setShowAllAvailable] = useState(false)
  
  // ✅ FIXED: Reset tab when modal opens with specific tab
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])
  
  // ✅ FIXED: Move useEffect to top and add dependency on isOpen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // ✅ FIXED: Conditional return AFTER all hooks
  if (!isOpen || !child) return null

  // 🔧 FIXED: Use helper function to extract unlock requests properly - updates in real-time
  const unlockRequests = extractUnlockRequests(child);
  
  // Categorize books (keeping original logic)
  const completedBooks = (child.bookshelf || []).filter(book => book.completed === true)
  const readingBooks = (child.bookshelf || []).filter(book => book.completed !== true && book.currentProgress > 0)
  const bookshelfBookIds = (child.bookshelf || []).map(book => book.bookId)
  const notReadBooks = nominees.filter(book => !bookshelfBookIds.includes(book.id))

  // Enhanced approval handler with notifications
  const handleModalApproval = async (studentId, unlockType, bookId = null) => {
    await onApproveUnlock(studentId, unlockType, bookId)
    
    // Show success notification
    if (unlockType === 'leaderboard') {
      setShowComingSoon('✅ Leaderboard access approved!')
    } else if (unlockType === 'quiz') {
      const bookTitle = getBookTitle(bookId, nominees)
      setShowComingSoon(`✅ Quiz approved for "${bookTitle}"!`)
    }
    
    setTimeout(() => setShowComingSoon(''), 3000)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}>
      
      <div style={{
        backgroundColor: theme.surface,
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '85vh',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        border: `3px solid ${childColor}`
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${childColor}, ${childColor}90)`,
          padding: '20px',
          color: '#FFFFFF',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#FFFFFF'
            }}
          >
            ✕
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {child.firstName?.charAt(0) || '?'}
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold' }}>
                {child.firstName} {child.lastInitial}.
              </h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                Grade {child.grade} • {child.schoolName}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {child.booksSubmittedThisYear || 0}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>Books Read</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {child.personalGoal || 20}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>Goal</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {readingStats.averageMinutesPerDay}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>Min/Day</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: `2px solid ${theme.primary}30`
        }}>
          {[
            { key: 'reading', label: 'Reading Progress', icon: '📚' },
            { key: 'unlocks', label: `Pending Unlocks${unlockRequests.length > 0 ? ` (${unlockRequests.length})` : ''}`, icon: '🔓' },
            { key: 'achievements', label: 'Achievements', icon: '🏆' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '12px 8px',
                backgroundColor: activeTab === tab.key ? `${childColor}20` : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? `3px solid ${childColor}` : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === tab.key ? '600' : '500',
                color: activeTab === tab.key ? childColor : theme.textSecondary,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          padding: '20px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          
          {/* Reading Progress Tab */}
          {activeTab === 'reading' && (
            <div>
              {/* Progress Bar */}
              <div style={{
                backgroundColor: `${childColor}20`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: theme.textPrimary }}>
                    Reading Goal Progress
                  </span>
                  <span style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {Math.round(((child.booksSubmittedThisYear || 0) / (child.personalGoal || 20)) * 100)}%
                  </span>
                </div>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderRadius: '6px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    backgroundColor: childColor,
                    height: '100%',
                    width: `${Math.min(((child.booksSubmittedThisYear || 0) / (child.personalGoal || 20)) * 100, 100)}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Book Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Completed Books */}
                <div>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    ✅ Completed ({completedBooks.length})
                  </h4>
                  {completedBooks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {completedBooks.slice(0, 3).map((book, index) => {
                        const bookDetails = nominees.find(n => n.id === book.bookId)
                        return (
                          <div key={index} style={{
                            backgroundColor: '#E8F5E8',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            border: '1px solid #4CAF50'
                          }}>
                            {bookDetails?.title || 'Unknown Book'}
                            {book.rating > 0 && (
                              <span style={{ marginLeft: '8px', color: '#4CAF50' }}>
                                {'⭐'.repeat(book.rating)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                      {completedBooks.length > 3 && (
                        <div style={{ fontSize: '11px', color: theme.textSecondary, textAlign: 'center' }}>
                          +{completedBooks.length - 3} more completed books
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: theme.textSecondary, fontStyle: 'italic' }}>
                      No completed books yet
                    </div>
                  )}
                </div>

                {/* Currently Reading */}
                <div>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    📖 Currently Reading ({readingBooks.length})
                  </h4>
                  {readingBooks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {readingBooks.map((book, index) => {
                        const bookDetails = nominees.find(n => n.id === book.bookId)
                        const total = book.format === 'audiobook' 
                          ? (bookDetails?.totalMinutes || 0)
                          : (bookDetails?.pages || bookDetails?.pageCount || 0)
                        const progress = total > 0 ? Math.round((book.currentProgress / total) * 100) : 0
                        
                        return (
                          <div key={index} style={{
                            backgroundColor: '#E3F2FD',
                            borderRadius: '8px',
                            padding: '8px',
                            fontSize: '12px',
                            border: '1px solid #2196F3'
                          }}>
                            <div>{bookDetails?.title || 'Unknown Book'}</div>
                            <div style={{ marginTop: '4px', fontSize: '10px', color: '#1565C0' }}>
                              {progress}% complete • {book.currentProgress} {book.format === 'audiobook' ? 'mins' : 'pages'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: theme.textSecondary, fontStyle: 'italic' }}>
                      No books currently being read
                    </div>
                  )}
                </div>

                {/* 🆕 FIXED: Available to Read - Now Expandable */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{
                      margin: '0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      📚 Available to Read ({notReadBooks.length})
                    </h4>
                    {notReadBooks.length > 3 && (
                      <button
                        onClick={() => setShowAllAvailable(!showAllAvailable)}
                        style={{
                          backgroundColor: 'transparent',
                          border: `1px solid ${childColor}40`,
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          color: childColor,
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {showAllAvailable ? 'Show Less' : `Show All ${notReadBooks.length}`}
                      </button>
                    )}
                  </div>
                  {notReadBooks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(showAllAvailable ? notReadBooks : notReadBooks.slice(0, 3)).map((book, index) => (
                        <div key={index} style={{
                          backgroundColor: '#FFF3E0',
                          borderRadius: '8px',
                          padding: '8px',
                          fontSize: '12px',
                          border: '1px solid #FF9800'
                        }}>
                          {book.title}
                        </div>
                      ))}
                      {!showAllAvailable && notReadBooks.length > 3 && (
                        <div style={{ fontSize: '11px', color: theme.textSecondary, textAlign: 'center' }}>
                          +{notReadBooks.length - 3} more available books
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: theme.textSecondary, fontStyle: 'italic' }}>
                      All available books have been added to bookshelf
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 🔧 FIXED: Pending Unlocks Tab - now properly handles student data structure + real-time updates */}
          {activeTab === 'unlocks' && (
            <div>
              {unlockRequests.length > 0 ? (
                unlockRequests.map((request, index) => (
                  <div key={index} style={{
                    backgroundColor: request.type === 'leaderboard' ? '#FEF3CD' : '#E3F2FD',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    border: `1px solid ${request.type === 'leaderboard' ? '#F59E0B' : '#2196F3'}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: request.type === 'leaderboard' ? '#92400E' : '#1565C0'
                      }}>
                        {request.type === 'leaderboard' ? '🏆 Leaderboard Access Request' : '📝 Quiz Unlock Request'}
                      </div>
                      <button
                        onClick={() => handleModalApproval(child.id, request.type, request.bookId)}
                        style={{
                          backgroundColor: request.type === 'leaderboard' ? '#F59E0B' : '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Approve
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', color: request.type === 'leaderboard' ? '#A16207' : '#1976D2' }}>
                      {request.type === 'leaderboard' 
                        ? `${child.firstName} wants access to the class leaderboard`
                        : `Quiz for "${getBookTitle(request.bookId, nominees)}"`
                      }
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: theme.textSecondary
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                  <div style={{ fontSize: '14px' }}>No pending unlock requests</div>
                </div>
              )}
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              <div style={{
                backgroundColor: `${childColor}10`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme.textPrimary,
                  marginBottom: '12px'
                }}>
                  📊 Stats Overview
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: theme.textSecondary }}>Total XP:</span><br/>
                    <span style={{ fontWeight: 'bold', color: theme.textPrimary }}>
                      {child.totalXP || 0}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: theme.textSecondary }}>Saints Unlocked:</span><br/>
                    <span style={{ fontWeight: 'bold', color: theme.textPrimary }}>
                      {(child.saintUnlocks || []).length}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: theme.textSecondary }}>Reading Streak:</span><br/>
                    <span style={{ fontWeight: 'bold', color: theme.textPrimary }}>
                      {child.readingStreaks?.current || 0} days
                    </span>
                  </div>
                  <div>
                    <span style={{ color: theme.textSecondary }}>Lifetime Books:</span><br/>
                    <span style={{ fontWeight: 'bold', color: theme.textPrimary }}>
                      {child.lifetimeBooksSubmitted || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Saints Collection */}
              {child.saintUnlocks && child.saintUnlocks.length > 0 && (
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.textPrimary,
                    marginBottom: '12px'
                  }}>
                    ♔ Saints Collection
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: '8px'
                  }}>
                    {child.saintUnlocks.slice(0, 6).map((saint, index) => (
                      <div key={index} style={{
                        backgroundColor: theme.surface,
                        borderRadius: '8px',
                        padding: '8px',
                        textAlign: 'center',
                        border: `1px solid ${childColor}40`,
                        fontSize: '10px'
                      }}>
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>♔</div>
                        <div style={{ fontWeight: '600' }}>
                          {saint.name || `Saint ${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  {child.saintUnlocks.length > 6 && (
                    <div style={{
                      textAlign: 'center',
                      marginTop: '8px',
                      fontSize: '11px',
                      color: theme.textSecondary
                    }}>
                      +{child.saintUnlocks.length - 6} more saints unlocked
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 🆕 FIXED: Child Progress Card Component - clickable pending unlocks
function ChildProgressCard({ child, theme, childColor, onViewDetails, onApproveUnlock, readingStats, onViewUnlocks, showComingSoon, setShowComingSoon, notifications }) {
  // Calculate progress percentage
  const progressPercentage = Math.round(((child.booksSubmittedThisYear || 0) / (child.personalGoal || 20)) * 100)
  
  // Use real-time notification data for this specific child
  const childNotifications = notifications?.getNotificationsByStudent(child.id) || []
  const pendingCount = childNotifications.length

  return (
    <div style={{
      background: `linear-gradient(145deg, ${theme.surface}, ${childColor}10, #FFFFFF)`,
      borderRadius: '20px',
      padding: '20px',
      boxShadow: `0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)`,
      border: `4px solid ${childColor}`,
      position: 'relative',
      minHeight: '300px'
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${childColor}, ${childColor}CC)`,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '20px',
        color: '#FFFFFF',
        textAlign: 'center'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 auto 12px'
        }}>
          {child.firstName?.charAt(0) || '?'}
        </div>
        <h2 style={{
          fontSize: 'clamp(18px, 5vw, 20px)',
          fontWeight: 'bold',
          margin: '0 0 4px 0'
        }}>
          {child.firstName} {child.lastInitial}.
        </h2>
        <p style={{
          fontSize: 'clamp(12px, 3.5vw, 14px)',
          margin: 0,
          opacity: 0.9
        }}>
          Grade {child.grade} • {child.schoolName}
        </p>
      </div>

      {/* Reading Goal Progress */}
      <div style={{
        backgroundColor: `${childColor}20`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            fontWeight: '600',
            color: theme.textPrimary
          }}>
            📚 Reading Goal
          </span>
          <span style={{
            fontSize: 'clamp(11px, 3vw, 12px)',
            color: theme.textSecondary
          }}>
            {child.booksSubmittedThisYear || 0} / {child.personalGoal || 20}
          </span>
        </div>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.5)',
          borderRadius: '6px',
          height: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            backgroundColor: childColor,
            height: '100%',
            width: `${Math.min(progressPercentage, 100)}%`,
            transition: 'width 1s ease'
          }} />
        </div>
        <div style={{
          textAlign: 'center',
          marginTop: '8px',
          fontSize: 'clamp(14px, 4vw, 16px)',
          fontWeight: 'bold',
          color: childColor
        }}>
          {progressPercentage}% Complete
        </div>
      </div>

      {/* Daily Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '10px',
          padding: '12px',
          textAlign: 'center',
          border: `1px solid ${childColor}40`
        }}>
          <div style={{
            fontSize: 'clamp(16px, 4.5vw, 18px)',
            fontWeight: 'bold',
            color: childColor
          }}>
            {readingStats.averageMinutesPerDay}
          </div>
          <div style={{
            fontSize: 'clamp(9px, 2.5vw, 10px)',
            color: theme.textSecondary
          }}>
            Minutes/Day
          </div>
        </div>
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '10px',
          padding: '12px',
          textAlign: 'center',
          border: `1px solid ${childColor}40`
        }}>
          <div style={{
            fontSize: 'clamp(16px, 4.5vw, 18px)',
            fontWeight: 'bold',
            color: childColor
          }}>
            {readingStats.sessionsThisWeek}
          </div>
          <div style={{
            fontSize: 'clamp(9px, 2.5vw, 10px)',
            color: theme.textSecondary
          }}>
            Sessions/Week
          </div>
        </div>
      </div>

      {/* 🆕 FIXED: Clickable Pending Approvals Alert */}
      {pendingCount > 0 && (
        <button
          onClick={onViewUnlocks}
          style={{
            width: '100%',
            backgroundColor: '#FEF3CD',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '16px',
            border: '1px solid #F59E0B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#FDE68A'
            e.target.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#FEF3CD'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          <span style={{ fontSize: '16px' }}>🔓</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{
              fontSize: 'clamp(11px, 3vw, 12px)',
              fontWeight: '600',
              color: '#92400E'
            }}>
              {pendingCount} unlock request{pendingCount > 1 ? 's' : ''} waiting
            </div>
            <div style={{
              fontSize: 'clamp(9px, 2.5vw, 10px)',
              color: '#A16207'
            }}>
              Tap to review & approve
            </div>
          </div>
          <div style={{
            backgroundColor: '#F59E0B',
            color: 'white',
            borderRadius: '12px',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            {pendingCount}
          </div>
        </button>
      )}

      {/* View Details Button */}
      <button
        onClick={onViewDetails}
        style={{
          width: '100%',
          backgroundColor: childColor,
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '12px',
          padding: '12px',
          fontSize: 'clamp(12px, 3.5vw, 14px)',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = 'none'
        }}
      >
        View Full Progress
      </button>
    </div>
  )
}

export default function ChildProgress() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  const { permissions, hasAccess, getPhaseMessage } = usePhaseAccess(userProfile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkedStudents, setLinkedStudents] = useState([])
  const [nominees, setNominees] = useState([])
  const [currentChildIndex, setCurrentChildIndex] = useState(0)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedChild, setSelectedChild] = useState(null)
  const [readingStats, setReadingStats] = useState({})
  const [showBraggingRights, setShowBraggingRights] = useState(false)
  const [modalInitialTab, setModalInitialTab] = useState('reading')
  const [showComingSoon, setShowComingSoon] = useState('')
  
  // Navigation menu state
  const [showNavMenu, setShowNavMenu] = useState(false)

  // 🆕 NEW: Notification integration
  const {
    markNotificationsAsSeen,
    getNotificationsByStudent,
    totalCount,
    newCount
  } = useUnlockNotifications()

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

  // Navigation menu items with notification badge
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { 
      name: 'Child Progress', 
      path: '/parent/child-progress', 
      icon: '◐', 
      current: true,
      badge: totalCount > 0 ? totalCount : null,
      badgeColor: newCount > 0 ? '#F59E0B' : '#6B7280'
    },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family Battle', path: '/parent/family-battle', icon: '⚔️' },
    { name: 'Reading DNA Lab', path: '/parent/dna-lab', icon: '⬢' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [totalCount, newCount])

  // Generate consistent color for each child
  const getChildColor = (childName, childId) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#FF7F50', '#87CEEB', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#82E0AA', '#F8C471', '#F1948A'
    ]
    
    const str = (childName + childId).toLowerCase()
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadChildProgressData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile])

  // Close nav menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showNavMenu) {
        setShowNavMenu(false)
      }
    }

    if (showNavMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNavMenu])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && currentChildIndex > 0) {
        setCurrentChildIndex(currentChildIndex - 1)
      } else if (e.key === 'ArrowRight' && currentChildIndex < linkedStudents.length - 1) {
        setCurrentChildIndex(currentChildIndex + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentChildIndex, linkedStudents.length])

  const loadChildProgressData = async () => {
    try {
      console.log('📊 Loading child progress data...')
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentData = parentDoc.data()
      
      // Load linked students data
      const students = await loadLinkedStudentsData(parentData.linkedStudents || [])
      
      if (students.length > 0) {
        // Load nominees from first student's school
        const firstStudent = students[0]
        const allNominees = await getSchoolNomineesEntities(
          firstStudent.entityId,
          firstStudent.schoolId
        )
        
        const currentYear = getCurrentAcademicYear()
        const currentYearNominees = allNominees.filter(book => 
          book.academicYear === currentYear || !book.academicYear
        )
        
        setNominees(currentYearNominees)
        
        // Load reading stats for each student
        const statsPromises = students.map(student => loadReadingStats(student))
        const allStats = await Promise.all(statsPromises)
        
        const statsMap = {}
        students.forEach((student, index) => {
          statsMap[student.id] = allStats[index]
        })
        setReadingStats(statsMap)
      }

    } catch (error) {
      console.error('❌ Error loading child progress:', error)
      setError('Failed to load child progress data. Please try again.')
    }
    
    setLoading(false)
  }

  const loadLinkedStudentsData = async (linkedStudentIds) => {
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
      return students
      
    } catch (error) {
      console.error('❌ Error loading linked students:', error)
      return []
    }
  }

  const loadReadingStats = async (student) => {
    try {
      // Mock reading stats - in real app would query readingSessions collection
      return {
        averageMinutesPerDay: Math.floor(Math.random() * 30) + 10,
        sessionsThisWeek: Math.floor(Math.random() * 7) + 1,
        totalMinutesThisWeek: Math.floor(Math.random() * 200) + 50,
        longestSession: Math.floor(Math.random() * 60) + 15
      }
    } catch (error) {
      console.error('❌ Error loading reading stats:', error)
      return {
        averageMinutesPerDay: 0,
        sessionsThisWeek: 0,
        totalMinutesThisWeek: 0,
        longestSession: 0
      }
    }
  }

  // Handle viewing unlock requests (mark as seen)
  const handleViewUnlocks = (child) => {
    setSelectedChild(child)
    setModalInitialTab('unlocks')
    
    // Mark notifications as seen when viewing unlocks
    if (newCount > 0) {
      markNotificationsAsSeen()
    }
    
    if (permissions.currentPhase === 'VOTING') {
      setShowBraggingRights(true)
    } else {
      setShowDetailModal(true)
    }
  }

  // UPDATED: handleApproveUnlock with better notification integration
  const handleApproveUnlock = async (studentId, unlockType, bookId = null) => {
    try {
      console.log('🔓 Approving unlock:', unlockType, 'for student:', studentId, 'bookId:', bookId)
      
      const student = linkedStudents.find(s => s.id === studentId)
      if (!student) return
      
      const studentRef = doc(db, `entities/${student.entityId}/schools/${student.schoolId}/students`, studentId)
      
      if (unlockType === 'leaderboard') {
        await updateDoc(studentRef, {
          leaderboardUnlocked: true,
          leaderboardUnlockRequested: false,
          leaderboardUnlockedAt: new Date(),
          leaderboardUnlockedBy: user.uid
        })
        
        // Update local state
        setLinkedStudents(prev => prev.map(s => 
          s.id === studentId 
            ? { ...s, leaderboardUnlocked: true, leaderboardUnlockRequested: false }
            : s
        ))
        
        // Show success notification
        setShowComingSoon('✅ Leaderboard access approved!')
        setTimeout(() => setShowComingSoon(''), 3000)
        
      } else if (unlockType === 'quiz' && bookId) {
        // Handle quiz unlock by updating the specific book's status in bookshelf
        const currentStudent = await getDoc(studentRef);
        const studentData = currentStudent.data();
        const currentBookshelf = studentData.bookshelf || [];
        
        // Update the specific book's status to 'quiz_unlocked'
        const updatedBookshelf = currentBookshelf.map(book => {
          if (book.bookId === bookId && book.status === 'pending_parent_quiz_unlock') {
            return {
              ...book,
              status: 'quiz_unlocked',
              parentUnlockedAt: new Date(),
              parentUnlockedBy: user.uid
            };
          }
          return book;
        });
        
        await updateDoc(studentRef, {
          bookshelf: updatedBookshelf,
          lastModified: new Date()
        })
        
        // Update local state
        setLinkedStudents(prev => prev.map(s => 
          s.id === studentId 
            ? { 
                ...s, 
                bookshelf: s.bookshelf?.map(book => 
                  book.bookId === bookId && book.status === 'pending_parent_quiz_unlock'
                    ? { ...book, status: 'quiz_unlocked', parentUnlockedAt: new Date() }
                    : book
                ) || []
              }
            : s
        ))
        
        // Show success notification with book title
        const bookTitle = getBookTitle(bookId, nominees)
        setShowComingSoon(`✅ Quiz approved for "${bookTitle}"!`)
        setTimeout(() => setShowComingSoon(''), 3000)
      }
      
      console.log('✅ Unlock approved successfully')
      
      // Notifications are automatically cleared by the useUnlockNotifications hook
      // when it detects the status change in the database (real-time listeners).
      // No manual notification clearing needed here.
      
    } catch (error) {
      console.error('❌ Error approving unlock:', error)
      setShowComingSoon('❌ Failed to approve unlock. Please try again.')
      setTimeout(() => setShowComingSoon(''), 3000)
    }
  }

  const goToPrevChild = () => {
    if (currentChildIndex > 0) {
      setCurrentChildIndex(currentChildIndex - 1)
    } else {
      setCurrentChildIndex(linkedStudents.length - 1)
    }
  }

  const goToNextChild = () => {
    if (currentChildIndex < linkedStudents.length - 1) {
      setCurrentChildIndex(currentChildIndex + 1)
    } else {
      setCurrentChildIndex(0)
    }
  }

  // UPDATED: Navigation handler - all pages are now built
  const handleNavigation = (item) => {
    if (item.current) return
    
    setShowNavMenu(false)
    
    // Navigate to the selected page
    setTimeout(() => {
      router.push(item.path)
    }, 100)
  }

  const handleViewDetails = (child) => {
    setSelectedChild(child)
    setModalInitialTab('reading') // Default to reading tab
    
    // Check if in voting phase - show bragging rights instead
    if (permissions.currentPhase === 'VOTING') {
      setShowBraggingRights(true)
    } else {
      setShowDetailModal(true)
    }
  }

  // Show loading while data loads
  if (authLoading || loading || !userProfile) {
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
          <p style={{ color: luxTheme.textPrimary }}>Loading child progress...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
          <h2 style={{ color: luxTheme.textPrimary, marginBottom: '1rem' }}>Oops!</h2>
          <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (linkedStudents.length === 0) {
    return (
      <>
        <Head>
          <title>Child Progress - Lux Libris Parent</title>
          <meta name="description" content="Track your children's reading progress, goals, and achievements" />
          <link rel="icon" href="/images/lux_libris_logo.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        </Head>
        <div style={{
          backgroundColor: luxTheme.background,
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>👨‍👩‍👧‍👦</div>
            <h2 style={{
              fontSize: '24px',
              color: luxTheme.textPrimary,
              marginBottom: '12px'
            }}>
              No Children Linked
            </h2>
            <p style={{
              fontSize: '16px',
              color: luxTheme.textSecondary,
              marginBottom: '24px'
            }}>
              Link your children&apos;s accounts to track their reading progress.
            </p>
            <button
              onClick={() => router.push('/parent/dashboard')}
              style={{
                backgroundColor: luxTheme.primary,
                color: luxTheme.textPrimary,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </>
    )
  }

  const currentChild = linkedStudents[currentChildIndex]
  const childColor = getChildColor(currentChild.firstName, currentChild.id)
  const currentChildStats = readingStats[currentChild.id] || {
    averageMinutesPerDay: 0,
    sessionsThisWeek: 0,
    totalMinutesThisWeek: 0,
    longestSession: 0
  }

  // 🆕 FIXED: Get current child from linkedStudents for real-time updates in modal
  const modalChild = selectedChild ? linkedStudents.find(s => s.id === selectedChild.id) || selectedChild : null

  return (
    <>
      <Head>
        <title>Child Progress - Lux Libris Parent</title>
        <meta name="description" content="Track your children's reading progress, goals, and achievements" />
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
          justifyContent: 'center'
        }}>
          {/* Back Button */}
          <button
            onClick={() => router.push('/parent/dashboard')}
            style={{
              position: 'absolute',
              left: '20px',
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

          {/* Centered Title */}
          <h1 style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: '400',
            color: luxTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center'
          }}>
            Child Progress
          </h1>

          {/* Hamburger Menu */}
          <div className="nav-menu-container" style={{ position: 'absolute', right: '20px' }}>
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
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
              ☰
            </button>

            {/* Dropdown Menu */}
            {showNavMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: luxTheme.surface,
                borderRadius: '12px',
                minWidth: '200px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${luxTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleNavigation(item)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${luxTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${luxTheme.primary}40` : 'none',
                      cursor: item.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = `${luxTheme.primary}20`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: luxTheme.primary }}>●</span>
                    )}
                    {item.badge && (
                      <div style={{
                        position: 'absolute',
                        right: '16px',
                        backgroundColor: item.badgeColor,
                        color: 'white',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '600',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        {item.badge}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          padding: '20px 20px 0 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 'calc(100vh - 120px)',
          paddingTop: '20px'
        }}>
          {/* Subtitle */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            maxWidth: '400px'
          }}>
            <h2 style={{
              fontSize: 'clamp(16px, 4vw, 18px)',
              color: luxTheme.textPrimary,
              margin: '0 0 8px 0',
              fontWeight: '600'
            }}>
              Track Reading Goals & Achievements
            </h2>
            <p style={{
              fontSize: 'clamp(12px, 3.5vw, 14px)',
              color: luxTheme.textSecondary,
              margin: 0,
              lineHeight: '1.4'
            }}>
              Monitor progress, approve unlocks, and celebrate milestones
            </p>
          </div>

          {/* Main Card with Navigation */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px',
            marginBottom: '20px'
          }}>
            {/* Left Arrow */}
            {linkedStudents.length > 1 && (
              <button
                onClick={goToPrevChild}
                style={{
                  position: 'absolute',
                  left: '-24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: childColor,
                  border: `3px solid ${luxTheme.secondary}`,
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  zIndex: 100,
                  transition: 'all 0.3s ease',
                  userSelect: 'none',
                  boxShadow: `0 4px 12px ${childColor}40, 0 2px 8px rgba(0,0,0,0.2)`,
                  touchAction: 'manipulation'
                }}
              >
                ←
              </button>
            )}

            {/* Right Arrow */}
            {linkedStudents.length > 1 && (
              <button
                onClick={goToNextChild}
                style={{
                  position: 'absolute',
                  right: '-24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: childColor,
                  border: `3px solid ${luxTheme.secondary}`,
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  zIndex: 100,
                  transition: 'all 0.3s ease',
                  userSelect: 'none',
                  boxShadow: `0 4px 12px ${childColor}40, 0 2px 8px rgba(0,0,0,0.2)`,
                  touchAction: 'manipulation'
                }}
              >
                →
              </button>
            )}

            <ChildProgressCard
              child={currentChild}
              theme={luxTheme}
              childColor={childColor}
              onViewDetails={() => handleViewDetails(currentChild)}
              onViewUnlocks={() => handleViewUnlocks(currentChild)}
              onApproveUnlock={handleApproveUnlock}
              readingStats={currentChildStats}
              showComingSoon={showComingSoon}
              setShowComingSoon={setShowComingSoon}
              notifications={{ getNotificationsByStudent }}
            />
          </div>

          {/* Navigation Hint */}
          {linkedStudents.length > 1 && (
            <div style={{
              fontSize: '12px',
              color: luxTheme.textSecondary,
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              ← Swipe to see other children →
            </div>
          )}

          {/* Quick Browse Children */}
          {linkedStudents.length > 1 && (
            <div style={{
              width: '100%',
              maxWidth: '400px',
              marginBottom: '40px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: luxTheme.textPrimary,
                margin: '0 0 12px 0',
                textAlign: 'center'
              }}>
                Your Children
              </h3>
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                padding: '8px 0 40px 0',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {linkedStudents.map((child, index) => {
                  const color = getChildColor(child.firstName, child.id)
                  return (
                    <button
                      key={child.id}
                      onClick={() => setCurrentChildIndex(index)}
                      style={{
                        flexShrink: 0,
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: index === currentChildIndex
                          ? `3px solid ${color}`
                          : `2px solid ${color}60`,
                        cursor: 'pointer',
                        backgroundColor: color,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        transform: index === currentChildIndex ? 'scale(1.1)' : 'scale(1)',
                        touchAction: 'manipulation'
                      }}
                    >
                      {child.firstName?.charAt(0) || '?'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 🆕 FIXED: Child Detail Modal with real-time updates + notifications */}
        <ChildDetailModal
          child={modalChild} // Use modalChild for real-time updates
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedChild(null)
            setModalInitialTab('reading')
          }}
          theme={luxTheme}
          childColor={modalChild ? getChildColor(modalChild.firstName, modalChild.id) : luxTheme.primary}
          nominees={nominees}
          readingStats={modalChild ? readingStats[modalChild.id] || {} : {}}
          onApproveUnlock={handleApproveUnlock}
          initialTab={modalInitialTab} // 🆕 NEW: Pass initial tab
          showComingSoon={showComingSoon} // 🆕 NEW: Pass notifications
          setShowComingSoon={setShowComingSoon} // 🆕 NEW: Pass notifications
        />

        {/* Bragging Rights Modal for Voting Phase */}
        {showBraggingRights && selectedChild && (
          <EnhancedBraggingRightsModal
            show={showBraggingRights}
            onClose={() => {
              setShowBraggingRights(false)
              setSelectedChild(null)
            }}
            studentData={selectedChild}
            earnedBadges={[]}
            levelProgress={{ level: 1 }}
            readingPersonality={null}
            currentTheme={luxTheme}
          />
        )}

        {/* 🆕 NEW: Coming Soon Message */}
        {showComingSoon && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: luxTheme.primary,
            color: luxTheme.textPrimary,
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1001,
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            fontWeight: '600',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            {showComingSoon}
          </div>
        )}

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
          
          ::-webkit-scrollbar {
            display: none;
          }
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          @media (max-width: 768px) {
            .nav-menu-container > div {
              right: 10px !important;
              minWidth: 180px !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}