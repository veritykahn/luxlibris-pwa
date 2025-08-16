// components/teacher/VotingTab.js - Manual Student Voting Interface
import React, { useState } from 'react'
import { db } from '../../lib/firebase'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'

export default function VotingTab({ 
  manualStudents, 
  teacherNominees, 
  userProfile,
  onStudentUpdate 
}) {
  const [selectedVotes, setSelectedVotes] = useState({}) // studentId -> bookId
  const [votingStatus, setVotingStatus] = useState({}) // studentId -> voting state
  const [filterGrade, setFilterGrade] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuccess, setShowSuccess] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkBookId, setBulkBookId] = useState('')
  const [selectedStudentsForBulk, setSelectedStudentsForBulk] = useState(new Set())

  // Filter manual students
  const filteredStudents = manualStudents
    .filter(s => s.status !== 'inactive')
    .filter(s => {
      const matchesSearch = !searchTerm || 
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastInitial.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesGrade = filterGrade === 'all' || s.grade.toString() === filterGrade
      
      return matchesSearch && matchesGrade
    })

  // Check if student has voted
  const hasStudentVoted = (student) => {
    return student.hasVotedThisYear === true || student.vote || student.votes?.length > 0
  }

  // Get students who need votes
  const studentsNeedingVotes = filteredStudents.filter(student => !hasStudentVoted(student))
  
  // Get students who have voted
  const studentsWhoVoted = filteredStudents.filter(student => hasStudentVoted(student))

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
    
    const book = teacherNominees.find(b => b.id === bookId)
    const confirmed = window.confirm(`Cast vote for ${student.firstName} ${student.lastInitial}?
Selected Book: ${book?.title}

⚠️ This vote is PERMANENT and cannot be changed.

Continue?`)
    
    if (!confirmed) return

    setVotingStatus(prev => ({ ...prev, [student.id]: 'voting' }))
    
    try {
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

      setVotingStatus(prev => ({ ...prev, [student.id]: 'completed' }))
      // Clear the selection for this student
      setSelectedVotes(prev => {
        const updated = { ...prev }
        delete updated[student.id]
        return updated
      })
      
      // Update the local data
      onStudentUpdate()
      
      setShowSuccess(`🗳️ Vote cast for ${student.firstName}!`)
      setTimeout(() => setShowSuccess(''), 3000)

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
      setShowSuccess('❌ Error casting vote. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    }
  }

  // Handle bulk vote casting
  const handleBulkVote = async () => {
    if (!bulkBookId || selectedStudentsForBulk.size === 0) {
      setShowSuccess('❌ Please select a book and at least one student')
      setTimeout(() => setShowSuccess(''), 3000)
      return
    }

    const book = teacherNominees.find(b => b.id === bulkBookId)
    const selectedStudentsList = Array.from(selectedStudentsForBulk)
      .map(id => studentsNeedingVotes.find(s => s.id === id))
      .filter(Boolean)

    const confirmed = window.confirm(`Cast votes for ${selectedStudentsList.length} students?
Selected Book: ${book?.title}

Students:
${selectedStudentsList.map(s => `- ${s.firstName} ${s.lastInitial}.`).join('\n')}

⚠️ These votes are PERMANENT and cannot be changed.

Continue?`)
    
    if (!confirmed) return

    let successCount = 0
    let errorCount = 0

    for (const student of selectedStudentsList) {
      try {
        setVotingStatus(prev => ({ ...prev, [student.id]: 'voting' }))
        
        const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`)
        const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid))
        const teacherSnapshot = await getDocs(teacherQuery)
        const teacherId = teacherSnapshot.docs[0].id

        const voteData = {
          bookId: bulkBookId,
          votedAt: new Date(),
          votedBy: 'teacher'
        }

        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id)
        await updateDoc(studentRef, {
          vote: voteData,
          hasVotedThisYear: true,
          lastModified: new Date()
        })

        setVotingStatus(prev => ({ ...prev, [student.id]: 'completed' }))
        successCount++
      } catch (error) {
        console.error('Error casting vote for', student.firstName, error)
        setVotingStatus(prev => ({ ...prev, [student.id]: 'error' }))
        errorCount++
      }
    }

    // Clear bulk selection
    setSelectedStudentsForBulk(new Set())
    setBulkBookId('')
    setBulkMode(false)
    
    // Update the local data
    onStudentUpdate()
    
    if (errorCount === 0) {
      setShowSuccess(`🎉 Successfully cast ${successCount} votes!`)
    } else {
      setShowSuccess(`⚠️ Cast ${successCount} votes, ${errorCount} errors`)
    }
    setTimeout(() => setShowSuccess(''), 4000)
  }

  // Toggle student selection for bulk voting
  const toggleStudentForBulk = (studentId) => {
    setSelectedStudentsForBulk(prev => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  // Stats
  const votingStats = {
    total: filteredStudents.length,
    voted: studentsWhoVoted.length,
    remaining: studentsNeedingVotes.length,
    percentage: filteredStudents.length > 0 
      ? Math.round((studentsWhoVoted.length / filteredStudents.length) * 100)
      : 0
  }

  if (teacherNominees.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '2px solid #FEF3C7'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#92400e',
          marginBottom: '0.5rem'
        }}>
          No Books Available for Voting
        </h3>
        <p style={{ color: '#92400e' }}>
          Please configure your book selection in Settings to enable voting.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      
      {/* Voting Status Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '2px solid #10B981'
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
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#065F46',
              margin: '0 0 0.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🗳️ Manual Student Voting
              <span style={{
                padding: '0.25rem 0.75rem',
                background: '#10B981',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                VOTING ACTIVE
              </span>
            </h2>
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              fontSize: '0.875rem',
              color: '#047857'
            }}>
              <span>📊 {votingStats.voted}/{votingStats.total} Voted</span>
              <span>⏳ {votingStats.remaining} Remaining</span>
              <span>✅ {votingStats.percentage}% Complete</span>
            </div>
          </div>
          
          {/* Bulk Mode Toggle */}
          <button
            onClick={() => setBulkMode(!bulkMode)}
            style={{
              padding: '0.5rem 1rem',
              background: bulkMode ? '#EF4444' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {bulkMode ? '✕ Cancel Bulk' : '⚡ Bulk Vote'}
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          marginTop: '1rem',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${votingStats.percentage}%`,
            background: '#10B981',
            transition: 'width 0.3s'
          }}></div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1rem',
        border: '1px solid #E5E7EB'
      }}>
        <p style={{ 
          color: '#065F46', 
          margin: '0 0 0.5rem 0', 
          fontWeight: '600',
          fontSize: '0.875rem'
        }}>
          📋 Voting Instructions:
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
          <li>Use bulk mode to vote the same book for multiple students</li>
        </ul>
      </div>

      {/* Search and Filter */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            border: '2px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        />
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '2px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <option value="all">All Grades</option>
          <option value="4">Grade 4</option>
          <option value="5">Grade 5</option>
          <option value="6">Grade 6</option>
          <option value="7">Grade 7</option>
          <option value="8">Grade 8</option>
        </select>
      </div>

      {/* Bulk Voting Interface */}
      {bulkMode && studentsNeedingVotes.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
          borderRadius: '1rem',
          padding: '1.5rem',
          border: '2px solid #3B82F6'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#1E40AF',
            margin: '0 0 1rem 0'
          }}>
            ⚡ Bulk Vote Mode
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1E40AF',
              marginBottom: '0.5rem'
            }}>
              Select Book for All Selected Students:
            </label>
            <select
              value={bulkBookId}
              onChange={(e) => setBulkBookId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #3B82F6',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="">Choose a book...</option>
              {teacherNominees.map(book => (
                <option key={book.id} value={book.id}>
                  {book.title} by {book.authors}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#1E40AF',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Select Students ({selectedStudentsForBulk.size} selected):
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.5rem',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '0.5rem',
              background: 'white',
              borderRadius: '0.5rem',
              border: '1px solid #CBD5E1'
            }}>
              {studentsNeedingVotes.map(student => (
                <label
                  key={student.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    background: selectedStudentsForBulk.has(student.id) ? '#DBEAFE' : '#F9FAFB',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    border: selectedStudentsForBulk.has(student.id) ? '1px solid #3B82F6' : '1px solid #E5E7EB'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentsForBulk.has(student.id)}
                    onChange={() => toggleStudentForBulk(student.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151'
                  }}>
                    {student.firstName} {student.lastInitial}. (Gr {student.grade})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleBulkVote}
            disabled={!bulkBookId || selectedStudentsForBulk.size === 0}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: bulkBookId && selectedStudentsForBulk.size > 0
                ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
                : '#E5E7EB',
              color: bulkBookId && selectedStudentsForBulk.size > 0 ? 'white' : '#9CA3AF',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: bulkBookId && selectedStudentsForBulk.size > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            🗳️ Cast {selectedStudentsForBulk.size} Votes
          </button>
        </div>
      )}

      {/* Students Needing Votes */}
      {!bulkMode && studentsNeedingVotes.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#223848',
            margin: '0 0 1rem 0'
          }}>
            📊 Cast Votes ({studentsNeedingVotes.length} students)
          </h3>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {studentsNeedingVotes.map(student => (
              <div
                key={student.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  backgroundColor: votingStatus[student.id] === 'completed' ? '#ECFDF5' : '#F9FAFB'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '0.75rem'
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
                        backgroundColor: 'white'
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
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#223848',
            margin: '0 0 1rem 0'
          }}>
            ✅ Votes Cast ({studentsWhoVoted.length} students)
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '0.75rem'
          }}>
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
                      fontSize: '0.75rem',
                      color: '#047857',
                      marginTop: '0.125rem'
                    }}>
                      Grade {student.grade} • Voted for: {votedBook?.title || 'Unknown Book'}
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
                    🔒 Locked
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Manual Students Message */}
      {filteredStudents.length === 0 && (
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
            No Manual Students Found
          </h3>
          <p style={{ color: '#6b7280' }}>
            {searchTerm || filterGrade !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Add manual students to vote on their behalf during the voting period.'}
          </p>
        </div>
      )}

      {/* All Students Voted Message */}
      {filteredStudents.length > 0 && studentsNeedingVotes.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          border: '2px solid #10B981'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#065F46',
            marginBottom: '0.5rem'
          }}>
            All Votes Cast!
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#047857'
          }}>
            All {studentsWhoVoted.length} manual students have cast their votes.
            Voting is complete for your class!
          </p>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: showSuccess.includes('❌') ? '#EF4444' : 
                           showSuccess.includes('⚠️') ? '#F59E0B' : '#4CAF50',
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