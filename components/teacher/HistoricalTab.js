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
  teacherNominees,
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
  
  // Collapsible sections - COLLAPSED BY DEFAULT
  const [showInstructions, setShowInstructions] = useState(false)
  const [showStudentsWithHistory, setShowStudentsWithHistory] = useState(false)
  const [showEligibleStudents, setShowEligibleStudents] = useState(false)
  const [showCompletedStudents, setShowCompletedStudents] = useState(false)

  // NEW: Custom modal states
  const [showAddHistoricalModal, setShowAddHistoricalModal] = useState(false)
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false)
  const [showUnmarkCompleteModal, setShowUnmarkCompleteModal] = useState(false)
  const [pendingHistoricalAdd, setPendingHistoricalAdd] = useState(null)
  const [pendingMarkComplete, setPendingMarkComplete] = useState(null)
  const [pendingUnmarkComplete, setPendingUnmarkComplete] = useState(null)

  // Calculate maximum books based on teacher's selected nominees
  const maxBooksPerGrade = teacherNominees?.length || 20;

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

  // Check if student has maxed out historical completions (AUTOMATIC)
  const hasMaxHistoricalCompletions = (student) => {
    if (!student) return false
    
    // Grade 4 students have no previous grades to add
    if (parseInt(student.grade) === 4) return true
    
    const availableGrades = getAvailableGradesForStudent(student)
    const existingCompletions = student.historicalCompletions || []
    
    // Check if all available grades have been added
    return availableGrades.every(grade => 
      existingCompletions.some(comp => comp.grade === grade)
    )
  }

  // Check if student is marked as complete (MANUAL or AUTOMATIC)
  const isHistoricalDataComplete = (student) => {
    // Manual override - teacher marked as complete
    if (student.historicalDataMarkedComplete === true) {
      return true
    }
    
    // Automatic - all possible grades added
    return hasMaxHistoricalCompletions(student)
  }

  // Get students with historical data (not complete)
  const studentsWithHistory = filteredStudents.filter(s => 
    (s.historicalCompletions && s.historicalCompletions.length > 0) && 
    !isHistoricalDataComplete(s)
  )
  
  // Get students who can add historical data (not complete)
  const studentsCanAddHistory = filteredStudents.filter(s => 
    !isHistoricalDataComplete(s) && parseInt(s.grade) > 4
  )

  // Get students with complete historical data
  const studentsWithCompleteHistory = filteredStudents.filter(s => 
    isHistoricalDataComplete(s) && parseInt(s.grade) > 4
  )

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

  // UPDATED: Add historical grade completion - now opens modal
  const addHistoricalGradeCompletion = async () => {
    if (!selectedStudent || !selectedGrade || !bookCount) {
      setShowSuccess('❌ Please fill in all fields');
      setTimeout(() => setShowSuccess(''), 3000);
      return;
    }

    const books = parseInt(bookCount);
    if (books < 1 || books > maxBooksPerGrade) {
      setShowSuccess(`❌ Book count must be between 1 and ${maxBooksPerGrade}`);
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

    // Open modal instead of confirm()
    setPendingHistoricalAdd({
      student: selectedStudent,
      grade: selectedGrade,
      books: books
    });
    setShowAddHistoricalModal(true);
  };

  // NEW: Execute historical addition after modal confirmation
  const executeHistoricalAddition = async () => {
    if (!pendingHistoricalAdd) return;

    const { student, grade, books } = pendingHistoricalAdd;

    setIsProcessing(true);
    setShowAddHistoricalModal(false);
    
    try {
      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
      const teacherSnapshot = await getDocs(teacherQuery);
      const teacherId = teacherSnapshot.docs[0].id;

      const saintMapping = GRADE_SAINT_MAPPINGS[parseInt(grade)];
      const saintsToUnlock = Object.values(saintMapping);
      
      if (student.type === 'manual') {
        // Manual student update
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id);
        
        const currentLifetime = student.lifetimeBooksSubmitted || 0;
        const newLifetime = currentLifetime + books;

        const historicalEntry = {
          grade: parseInt(grade),
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

      } else {
        // App student update
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id);
        
        const currentLifetime = student.lifetimeBooksSubmitted || 0;
        const newLifetime = currentLifetime + books;

        const currentUnlocked = student.unlockedSaints || [];
        const currentTimestamps = student.newlyUnlockedSaintsWithTimestamp || {};

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
          grade: parseInt(grade),
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
      }

      playHistoricalUnlockSound();
      onStudentUpdate();
      
      // Reset form
      setSelectedStudent(null);
      setSelectedGrade('');
      setBookCount('');
      
      setShowSuccess(`🎉 Added Grade ${grade} completion! +${books} books for ${student.firstName}!`);
      setTimeout(() => setShowSuccess(''), 4000);

    } catch (error) {
      console.error('Error adding historical completion:', error);
      setShowSuccess('❌ Error adding completion. Please try again.');
      setTimeout(() => setShowSuccess(''), 3000);
    } finally {
      setIsProcessing(false);
      setPendingHistoricalAdd(null);
    }
  };

  // UPDATED: Mark student historical data as complete - now opens modal
  const markHistoricalDataComplete = async (student) => {
    setPendingMarkComplete(student);
    setShowMarkCompleteModal(true);
  };

  // NEW: Execute mark complete after modal confirmation
  const executeMarkComplete = async () => {
    if (!pendingMarkComplete) return;

    const student = pendingMarkComplete;

    setIsProcessing(true);
    setShowMarkCompleteModal(false);
    
    try {
      if (student.type === 'manual') {
        const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
        const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
        const teacherSnapshot = await getDocs(teacherQuery);
        const teacherId = teacherSnapshot.docs[0].id;

        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id);
        await updateDoc(studentRef, {
          historicalDataMarkedComplete: true,
          lastModified: new Date()
        });
      } else {
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id);
        await updateDoc(studentRef, {
          historicalDataMarkedComplete: true,
          lastModified: new Date()
        });
      }

      onStudentUpdate();
      setShowSuccess(`✅ ${student.firstName} marked as complete!`);
      setTimeout(() => setShowSuccess(''), 3000);

    } catch (error) {
      console.error('Error marking complete:', error);
      setShowSuccess('❌ Error updating student');
      setTimeout(() => setShowSuccess(''), 3000);
    } finally {
      setIsProcessing(false);
      setPendingMarkComplete(null);
    }
  };

  // UPDATED: Unmark student historical data as complete - now opens modal
  const unmarkHistoricalDataComplete = async (student) => {
    setPendingUnmarkComplete(student);
    setShowUnmarkCompleteModal(true);
  };

  // NEW: Execute unmark complete after modal confirmation
  const executeUnmarkComplete = async () => {
    if (!pendingUnmarkComplete) return;

    const student = pendingUnmarkComplete;

    setIsProcessing(true);
    setShowUnmarkCompleteModal(false);
    
    try {
      if (student.type === 'manual') {
        const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
        const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
        const teacherSnapshot = await getDocs(teacherQuery);
        const teacherId = teacherSnapshot.docs[0].id;

        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id);
        await updateDoc(studentRef, {
          historicalDataMarkedComplete: false,
          lastModified: new Date()
        });
      } else {
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id);
        await updateDoc(studentRef, {
          historicalDataMarkedComplete: false,
          lastModified: new Date()
        });
      }

      onStudentUpdate();
      setShowSuccess(`🔄 ${student.firstName} returned to eligible list!`);
      setTimeout(() => setShowSuccess(''), 3000);

    } catch (error) {
      console.error('Error unmarking complete:', error);
      setShowSuccess('❌ Error updating student');
      setTimeout(() => setShowSuccess(''), 3000);
    } finally {
      setIsProcessing(false);
      setPendingUnmarkComplete(null);
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

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      
      {/* Header */}
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
          margin: '0 0 0.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🏆 Historical Grade Completions
        </h2>
        <p style={{
          color: '#7C3AED',
          fontSize: '0.875rem',
          margin: 0
        }}>
          Add books from previous grades to unlock saints and increase lifetime totals
        </p>
      </div>

      {/* Collapsible Instructions */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              transform: showInstructions ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: '0.875rem'
            }}>
              ▶
            </span>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#6B46C1'
            }}>
              📋 Instructions & Guidelines
            </span>
          </div>
        </button>
        
        {showInstructions && (
          <div style={{
            padding: '0 1rem 1rem 1rem',
            borderTop: '1px solid #E5E7EB'
          }}>
            <ul style={{ 
              color: '#7C3AED', 
              margin: '0.5rem 0 0 0',
              paddingLeft: '1.5rem',
              fontSize: '0.875rem'
            }}>
              <li>Add books from grades completed before the current school year</li>
              <li>Each grade unlocks 3 saints (Grade + Seasonal + Marian)</li>
              <li>Maximum {maxBooksPerGrade} books per grade year (based on your selected nominees)</li>
              <li>Only grades BELOW student&apos;s current grade are available</li>
              <li>Saints will sparkle for 24 hours in student&apos;s collection</li>
              <li>Mark students as &quot;complete&quot; if they have gaps but shouldn&apos;t add more</li>
            </ul>
          </div>
        )}
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
              value={selectedStudent ? `${selectedStudent.type}-${selectedStudent.id}` : ''}
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
                backgroundColor: 'white',
                color: '#223848'
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
                backgroundColor: selectedStudent ? 'white' : '#F3F4F6',
                color: '#223848',
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
              max={maxBooksPerGrade}
              value={bookCount}
              onChange={(e) => setBookCount(e.target.value)}
              placeholder={`1-${maxBooksPerGrade}`}
              disabled={!selectedStudent || !selectedGrade}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #9370DB',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: (selectedStudent && selectedGrade) ? 'white' : '#F3F4F6',
                color: '#223848',
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

      {/* Collapsible: Students with Historical Data */}
      {studentsWithHistory.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          border: '1px solid #E5E7EB',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setShowStudentsWithHistory(!showStudentsWithHistory)}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                transform: showStudentsWithHistory ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>
                ▶
              </span>
              <span style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#223848'
              }}>
                ✅ Students with Historical Completions ({studentsWithHistory.length})
              </span>
            </div>
            <span style={{
              padding: '0.25rem 0.75rem',
              background: '#9370DB',
              color: 'white',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              In Progress
            </span>
          </button>
          
          {showStudentsWithHistory && (
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              markHistoricalDataComplete(student)
                            }}
                            disabled={isProcessing}
                            style={{
                              width: '100%',
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              background: 'linear-gradient(135deg, #10B981, #059669)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ✅ Mark as Complete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsible: Students Who Can Add History */}
      {studentsCanAddHistory.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          border: '1px solid #E5E7EB',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setShowEligibleStudents(!showEligibleStudents)}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                transform: showEligibleStudents ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>
                ▶
              </span>
              <span style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#223848'
              }}>
                ⏳ Students Eligible for Historical Data ({studentsCanAddHistory.length})
              </span>
            </div>
            <span style={{
              padding: '0.25rem 0.75rem',
              background: '#FEF3C7',
              color: '#92400E',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Can Add
            </span>
          </button>
          
          {showEligibleStudents && (
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
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
                        color: '#7C3AED',
                        marginBottom: '0.5rem'
                      }}>
                        Can add: Grades {remainingGrades.join(', ')}
                      </div>
                      <button
                        onClick={() => markHistoricalDataComplete(student)}
                        disabled={isProcessing}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✅ Mark Complete
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsible: Students with Complete Historical Data */}
      {studentsWithCompleteHistory.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          border: '1px solid #10B981',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setShowCompletedStudents(!showCompletedStudents)}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                transform: showCompletedStudents ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>
                ▶
              </span>
              <span style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#223848'
              }}>
                ✅ Completed Historical Data ({studentsWithCompleteHistory.length})
              </span>
            </div>
            <span style={{
              padding: '0.25rem 0.75rem',
              background: '#ECFDF5',
              color: '#065F46',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Complete
            </span>
          </button>
          
          {showCompletedStudents && (
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '0.75rem'
              }}>
                {studentsWithCompleteHistory.map(student => {
                  const totalHistoricalBooks = (student.historicalCompletions || [])
                    .reduce((sum, comp) => sum + comp.books, 0)
                  const isManuallyMarked = student.historicalDataMarkedComplete === true
                  
                  return (
                    <div
                      key={`${student.type}-${student.id}`}
                      style={{
                        padding: '1rem',
                        border: '1px solid #10B981',
                        borderRadius: '0.5rem',
                        background: '#ECFDF5'
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
                        color: '#065F46',
                        marginBottom: '0.25rem'
                      }}>
                        {(student.historicalCompletions || []).length} grades • {totalHistoricalBooks} books
                      </div>
                      <div style={{
                        fontSize: '0.625rem',
                        color: '#059669',
                        marginBottom: '0.5rem',
                        fontStyle: 'italic'
                      }}>
                        {isManuallyMarked ? '✓ Manually marked complete' : '✓ All grades completed'}
                      </div>
                      <button
                        onClick={() => unmarkHistoricalDataComplete(student)}
                        disabled={isProcessing}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: '#F3F4F6',
                          color: '#6B7280',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Reopen
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
      {filteredStudents.length > 0 && studentsCanAddHistory.length === 0 && studentsWithHistory.length === 0 && (
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

      {/* NEW: Add Historical Completion Modal */}
      {showAddHistoricalModal && pendingHistoricalAdd && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🏆</span>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#223848',
                  margin: 0
                }}>
                  Add Historical Completion
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddHistoricalModal(false);
                  setPendingHistoricalAdd(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '0',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                marginBottom: '1rem',
                lineHeight: '1.6'
              }}>
                Add Grade {pendingHistoricalAdd.grade} completion for <strong>{pendingHistoricalAdd.student.firstName} {pendingHistoricalAdd.student.lastInitial}.</strong>?
              </p>

              <div style={{
                background: '#F3E8FF',
                border: '1px solid #9370DB',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6B46C1',
                  lineHeight: '1.5'
                }}>
                  📚 <strong>Books:</strong> {pendingHistoricalAdd.books}<br />
                  🎯 <strong>Saints to unlock:</strong> {Object.values(GRADE_SAINT_MAPPINGS[parseInt(pendingHistoricalAdd.grade)] || {}).map(id => SAINT_NAMES[id]).join(', ')}<br />
                  🏆 <strong>New lifetime total:</strong> {(pendingHistoricalAdd.student.lifetimeBooksSubmitted || 0) + pendingHistoricalAdd.books}
                </div>
              </div>

              <div style={{
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#92400E',
                  lineHeight: '1.5',
                  fontWeight: '500'
                }}>
                  ⚠️ This action cannot be undone.
                </div>
              </div>

              {/* Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem'
              }}>
                <button
                  onClick={() => {
                    setShowAddHistoricalModal(false);
                    setPendingHistoricalAdd(null);
                  }}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.5 : 1,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeHistoricalAddition}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #9370DB, #8A2BE2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  {isProcessing ? '⏳ Adding...' : '🏆 Add Completion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Mark Complete Modal */}
      {showMarkCompleteModal && pendingMarkComplete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#223848',
                  margin: 0
                }}>
                  Mark as Complete
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowMarkCompleteModal(false);
                  setPendingMarkComplete(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '0',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                marginBottom: '1rem',
                lineHeight: '1.6'
              }}>
                Mark historical data as complete for <strong>{pendingMarkComplete.firstName} {pendingMarkComplete.lastInitial}.</strong>?
              </p>

              <div style={{
                background: '#ECFDF5',
                border: '1px solid #10B981',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#065F46',
                  lineHeight: '1.5'
                }}>
                  This will:<br />
                  • Remove them from the &quot;eligible to add&quot; list<br />
                  • Indicate no more historical grades need to be added<br />
                  • Can be reversed if needed
                </div>
              </div>

              {/* Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem'
              }}>
                <button
                  onClick={() => {
                    setShowMarkCompleteModal(false);
                    setPendingMarkComplete(null);
                  }}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.5 : 1,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeMarkComplete}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  {isProcessing ? '⏳ Marking...' : '✅ Mark Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Unmark Complete Modal */}
      {showUnmarkCompleteModal && pendingUnmarkComplete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🔄</span>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#223848',
                  margin: 0
                }}>
                  Reopen Historical Data
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowUnmarkCompleteModal(false);
                  setPendingUnmarkComplete(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6B7280',
                  padding: '0',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                marginBottom: '1rem',
                lineHeight: '1.6'
              }}>
                Remove &quot;complete&quot; status for <strong>{pendingUnmarkComplete.firstName} {pendingUnmarkComplete.lastInitial}.</strong>?
              </p>

              <div style={{
                background: '#E0F2FE',
                border: '1px solid #0EA5E9',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#075985',
                  lineHeight: '1.5'
                }}>
                  This will:<br />
                  • Return them to the &quot;eligible to add&quot; list<br />
                  • Allow adding more historical grades<br />
                  • Not remove any existing data
                </div>
              </div>

              {/* Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem'
              }}>
                <button
                  onClick={() => {
                    setShowUnmarkCompleteModal(false);
                    setPendingUnmarkComplete(null);
                  }}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.5 : 1,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeUnmarkComplete}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  {isProcessing ? '⏳ Reopening...' : '🔄 Reopen'}
                </button>
              </div>
            </div>
          </div>
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