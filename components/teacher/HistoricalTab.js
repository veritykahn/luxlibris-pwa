// components/teacher/HistoricalTab.js - Historical Grade Completions
import React, { useState, useCallback } from 'react'
import { db } from '../../lib/firebase'
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'

// Grade Saint Mappings
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

const SAINT_NAMES = {
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

export default function HistoricalTab({ 
  appStudents, 
  manualStudents, 
  userProfile,
  onStudentUpdate 
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGrade, setFilterGrade] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedGrade, setSelectedGrade] = useState('')
  const [bookCount, setBookCount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState('')
  const [expandedStudents, setExpandedStudents] = useState(new Set())

  // Combine all students
  const allStudents = [
    ...appStudents.map(s => ({ ...s, type: 'app' })),
    ...manualStudents.map(s => ({ ...s, type: 'manual' }))
  ]
    .filter(s => s.status !== 'inactive')
    .sort((a, b) => a.firstName.localeCompare(b.firstName))

  // Filter students
  const filteredStudents = allStudents.filter(student => {
    const matchesSearch = !searchTerm || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastInitial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.displayUsername && student.displayUsername.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesGrade = filterGrade === 'all' || student.grade.toString() === filterGrade
    
    return matchesSearch && matchesGrade
  })

  // Get available grades for a student
  const getAvailableGradesForStudent = (student) => {
    if (!student) return []
    
    const currentGrade = parseInt(student.grade)
    const availableGrades = []
    
    // Only show grades 4 through ONE BELOW current grade
    const minGrade = 4
    const maxGrade = Math.min(currentGrade - 1, 7)
    
    if (currentGrade > 4) {
      for (let grade = minGrade; grade <= maxGrade; grade++) {
        availableGrades.push(grade)
      }
    }
    
    return availableGrades
  }

  // Check if student has maxed out historical completions
  const hasMaxHistoricalCompletions = (student) => {
    if (!student) return false
    
    // Grade 4 students have no previous grades to add
    if (parseInt(student.grade) === 4) return true
    
    const availableGrades = getAvailableGradesForStudent(student)
    const existingCompletions = student.historicalCompletions || []
    
    return availableGrades.every(grade => 
      existingCompletions.some(comp => comp.grade === grade)
    )
  }

  // Play unlock sound
  const playHistoricalUnlockSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/unlock_achievement.mp3');
      audio.volume = 0.4;
      audio.play().catch(error => {
        console.log('Audio play failed:', error);
      });
    } catch (error) {
      console.log('Sound loading failed:', error);
    }
  }, []);

  // Add historical grade completion
  const addHistoricalGradeCompletion = async () => {
    if (!selectedStudent || !selectedGrade || !bookCount) {
      setShowSuccess('❌ Please fill in all fields');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    const books = parseInt(bookCount);
    if (books < 1 || books > 20) {
      setShowSuccess('❌ Book count must be between 1 and 20');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    // Check for duplicate grade
    const existingCompletions = selectedStudent.historicalCompletions || [];
    const hasGrade = existingCompletions.some(comp => comp.grade === parseInt(selectedGrade));
    
    if (hasGrade) {
      setShowSuccess(`❌ Grade ${selectedGrade} already added for ${selectedStudent.firstName}`);
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    // Additional validation
    if (parseInt(selectedGrade) >= parseInt(selectedStudent.grade)) {
      setShowSuccess(`❌ Can only add historical data for grades before Grade ${selectedStudent.grade}`);
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    const saintMapping = GRADE_SAINT_MAPPINGS[parseInt(selectedGrade)];
    const saintNames = [
      SAINT_NAMES[saintMapping.seasonal],
      SAINT_NAMES[saintMapping.grade],
      SAINT_NAMES[saintMapping.marian]
    ];

    const confirmed = window.confirm(`Add Grade ${selectedGrade} completion for ${selectedStudent.firstName}?

📚 Books: ${books}
🎯 Saints to unlock: ${saintNames.join(', ')}
🏆 New lifetime total: ${(selectedStudent.lifetimeBooksSubmitted || 0) + books}

This action cannot be undone.`);

    if (!confirmed) return;

    setIsProcessing(true);
    
    try {
      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
      const teacherSnapshot = await getDocs(teacherQuery);
      const teacherId = teacherSnapshot.docs[0].id;

      const saintsToUnlock = Object.values(saintMapping);
      
      if (selectedStudent.type === 'manual') {
        // Manual student update
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, selectedStudent.id);
        
        const currentLifetime = selectedStudent.lifetimeBooksSubmitted || 0;
        const newLifetime = currentLifetime + books;

        const historicalEntry = {
          grade: parseInt(selectedGrade),
          books: books,
          saintsUnlocked: saintsToUnlock,
          addedAt: new Date(),
          addedBy: 'teacher'
        };

        const existingHistory = selectedStudent.historicalCompletions || [];
        const updatedHistory = [...existingHistory, historicalEntry];

        await updateDoc(studentRef, {
          lifetimeBooksSubmitted: newLifetime,
          historicalCompletions: updatedHistory,
          lastModified: new Date()
        });

      } else {
        // App student update
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, selectedStudent.id);
        
        const currentLifetime = selectedStudent.lifetimeBooksSubmitted || 0;
        const newLifetime = currentLifetime + books;

        const currentUnlocked = selectedStudent.unlockedSaints || [];
        const currentTimestamps = selectedStudent.newlyUnlockedSaintsWithTimestamp || {};

        const updatedUnlocked = [...new Set([...currentUnlocked, ...saintsToUnlock])];
        
        const now = new Date().toISOString();
        const newTimestamps = { ...currentTimestamps };
        
        saintsToUnlock.forEach(saintId => {
          if (!currentUnlocked.includes(saintId)) {
            newTimestamps[saintId] = {
              timestamp: now,
              name: SAINT_NAMES[saintId],
              source: 'historical_completion'
            };
          }
        });

        const historicalEntry = {
          grade: parseInt(selectedGrade),
          books: books,
          saintsUnlocked: saintsToUnlock,
          addedAt: new Date(),
          addedBy: 'teacher'
        };

        const existingHistory = selectedStudent.historicalCompletions || [];
        const updatedHistory = [...existingHistory, historicalEntry];

        await updateDoc(studentRef, {
          lifetimeBooksSubmitted: newLifetime,
          unlockedSaints: updatedUnlocked,
          newlyUnlockedSaintsWithTimestamp: newTimestamps,
          historicalCompletions: updatedHistory,
          lastModified: new Date()
        });
      }

      playHistoricalUnlockSound();
      onStudentUpdate();
      
      // Reset form
      setSelectedStudent(null);
      setSelectedGrade('');
      setBookCount('');
      
      setShowSuccess(`🎉 Added Grade ${selectedGrade} completion! +${books} books for ${selectedStudent.firstName}!`);
      setTimeout(() => setShowSuccess(''), 4000);

    } catch (error) {
      console.error('Error adding historical completion:', error);
      setShowSuccess('❌ Error adding completion. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle student expansion
  const toggleStudentExpansion = (studentId) => {
    setExpandedStudents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  // Get students with historical data
  const studentsWithHistory = filteredStudents.filter(s => 
    s.historicalCompletions && s.historicalCompletions.length > 0
  )
  
  // Get students who can add historical data
  const studentsCanAddHistory = filteredStudents.filter(s => 
    !hasMaxHistoricalCompletions(s) && parseInt(s.grade) > 4
  )

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      
      {/* Header with Instructions */}
      <div style={{
        background: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
        borderRadius: '1rem',
        padding: '1.5rem',
        border: '2px solid #9370DB'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#6B46C1',
          margin: '0 0 1rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🏆 Historical Grade Completions
        </h2>
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          padding: '1rem'
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
            <li>Add books from grades completed before the current school year</li>
            <li>Each grade unlocks 3 saints (Grade + Seasonal + Marian)</li>
            <li>Maximum 20 books per grade year</li>
            <li>Only grades BELOW student&apos;s current grade are available</li>
            <li>Saints will sparkle for 24 hours in student&apos;s collection</li>
          </ul>
        </div>
      </div>

      {/* Quick Add Form */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#223848',
          margin: '0 0 1rem 0'
        }}>
          ➕ Quick Add Historical Completion
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr 1fr auto',
          gap: '1rem',
          alignItems: 'end'
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
              value={selectedStudent?.id || ''}
              onChange={(e) => {
                const student = filteredStudents.find(s => `${s.type}-${s.id}` === e.target.value);
                setSelectedStudent(student || null);
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
                backgroundColor: '#FAFAFF'
              }}
            >
              <option value="">Select student...</option>
              {studentsCanAddHistory.map(student => (
                <option 
                  key={`${student.type}-${student.id}`} 
                  value={`${student.type}-${student.id}`}
                >
                  {student.firstName} {student.lastInitial}. - Grade {student.grade} ({student.type.toUpperCase()})
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
              Grade *
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              disabled={!selectedStudent}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #9370DB',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: selectedStudent ? '#FAFAFF' : '#F3F4F6',
                cursor: selectedStudent ? 'pointer' : 'not-allowed'
              }}
            >
              <option value="">Select...</option>
              {selectedStudent && getAvailableGradesForStudent(selectedStudent).map(grade => {
                const alreadyAdded = selectedStudent?.historicalCompletions?.some(comp => comp.grade === grade);
                return (
                  <option key={grade} value={grade} disabled={alreadyAdded}>
                    Grade {grade} {alreadyAdded ? '✓' : ''}
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
              Books *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={bookCount}
              onChange={(e) => setBookCount(e.target.value)}
              placeholder="1-20"
              disabled={!selectedStudent || !selectedGrade}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #9370DB',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: (selectedStudent && selectedGrade) ? '#FAFAFF' : '#F3F4F6',
                cursor: (selectedStudent && selectedGrade) ? 'text' : 'not-allowed'
              }}
            />
          </div>

          <button
            onClick={addHistoricalGradeCompletion}
            disabled={!selectedStudent || !selectedGrade || !bookCount || isProcessing}
            style={{
              padding: '0.75rem 1.5rem',
              background: (selectedStudent && selectedGrade && bookCount) ? 
                'linear-gradient(135deg, #9370DB, #8A2BE2)' : '#E5E7EB',
              color: (selectedStudent && selectedGrade && bookCount) ? 'white' : '#9CA3AF',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: (selectedStudent && selectedGrade && bookCount) ? 'pointer' : 'not-allowed',
              minWidth: '120px'
            }}
          >
            {isProcessing ? '⏳ Adding...' : '🏆 Add'}
          </button>
        </div>

        {/* Preview */}
        {selectedStudent && selectedGrade && bookCount && (
          <div style={{
            marginTop: '1rem',
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
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.5rem',
              fontSize: '0.875rem', 
              color: '#7C3AED' 
            }}>
              <div>📚 Books to add: {bookCount}</div>
              <div>🏆 New lifetime: {(selectedStudent.lifetimeBooksSubmitted || 0) + parseInt(bookCount)}</div>
              <div>🎯 Saints: {Object.values(GRADE_SAINT_MAPPINGS[parseInt(selectedGrade)] || {}).map(id => SAINT_NAMES[id]).join(', ')}</div>
            </div>
          </div>
        )}
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

      {/* Students with Historical Data */}
      {studentsWithHistory.length > 0 && (
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
            ✅ Students with Historical Completions ({studentsWithHistory.length})
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {studentsWithHistory.map(student => {
              const isExpanded = expandedStudents.has(`${student.type}-${student.id}`)
              const totalHistoricalBooks = (student.historicalCompletions || [])
                .reduce((sum, comp) => sum + comp.books, 0)
              
              return (
                <div
                  key={`${student.type}-${student.id}`}
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => toggleStudentExpansion(`${student.type}-${student.id}`)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: isExpanded ? '#F3E8FF' : '#F9FAFB',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}>
                        ▶
                      </span>
                      <div>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#223848'
                        }}>
                          {student.firstName} {student.lastInitial}.
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6B7280'
                        }}>
                          Grade {student.grade} • {student.type === 'app' ? '📱 App' : '📝 Manual'}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#9370DB',
                        color: 'white',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {student.historicalCompletions.length} grades
                      </span>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#ECFDF5',
                        color: '#065F46',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {totalHistoricalBooks} books
                      </span>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div style={{
                      padding: '1rem',
                      borderTop: '1px solid #E5E7EB',
                      background: 'white'
                    }}>
                      {student.historicalCompletions
                        .sort((a, b) => a.grade - b.grade)
                        .map((completion, index) => (
                        <div 
                          key={index}
                          style={{
                            padding: '0.5rem',
                            background: '#F9FAFB',
                            borderRadius: '0.375rem',
                            marginBottom: index < student.historicalCompletions.length - 1 ? '0.5rem' : 0
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}>
                            <div>
                              <div style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#374151',
                                marginBottom: '0.25rem'
                              }}>
                                Grade {completion.grade}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6B7280'
                              }}>
                                📚 {completion.books} books • 🎯 {completion.saintsUnlocked?.length || 0} saints
                              </div>
                            </div>
                            <div style={{
                              fontSize: '0.625rem',
                              color: '#9CA3AF'
                            }}>
                              {completion.addedAt && new Date(completion.addedAt.seconds ? completion.addedAt.seconds * 1000 : completion.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Students Who Can Add History */}
      {studentsCanAddHistory.length > 0 && (
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
            ⏳ Students Who Can Add Historical Data ({studentsCanAddHistory.length})
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '0.75rem'
          }}>
            {studentsCanAddHistory.map(student => {
              const availableGrades = getAvailableGradesForStudent(student)
              const completedGrades = (student.historicalCompletions || []).map(c => c.grade)
              const remainingGrades = availableGrades.filter(g => !completedGrades.includes(g))
              
              return (
                <div
                  key={`${student.type}-${student.id}`}
                  style={{
                    padding: '1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    background: '#F9FAFB'
                  }}
                >
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#223848',
                    marginBottom: '0.25rem'
                  }}>
                    {student.firstName} {student.lastInitial}.
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginBottom: '0.5rem'
                  }}>
                    Grade {student.grade} • {student.type === 'app' ? '📱' : '📝'}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#7C3AED'
                  }}>
                    Can add: Grades {remainingGrades.join(', ')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Students Message */}
      {filteredStudents.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#223848',
            marginBottom: '0.5rem'
          }}>
            No Students Found
          </h3>
          <p style={{ color: '#6b7280' }}>
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {/* All Complete Message */}
      {filteredStudents.length > 0 && studentsCanAddHistory.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          border: '2px solid #9370DB'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#6B46C1',
            marginBottom: '0.5rem'
          }}>
            All Historical Data Complete!
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#7C3AED'
          }}>
            All eligible students have their historical completions recorded.
            (Grade 4 students have no previous grades to add)
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