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
  
  // Collapsible sections - COLLAPSED BY DEFAULT
  const [showInstructions, setShowInstructions] = useState(false)
  const [showStudentsWithHistory, setShowStudentsWithHistory] = useState(false)
  const [showEligibleStudents, setShowEligibleStudents] = useState(false)
  const [showCompletedStudents, setShowCompletedStudents] = useState(false)

  // Modal states for custom popups
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false)
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false)
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [pendingAddData, setPendingAddData] = useState(null)
  const [pendingMarkCompleteStudent, setPendingMarkCompleteStudent] = useState(null)
  const [pendingReopenStudent, setPendingReopenStudent] = useState(null)

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

    // Store data and show custom modal instead of window.confirm
    setPendingAddData({
      student: selectedStudent,
      grade: selectedGrade,
      books: books,
      saintNames: saintNames,
      saintMapping: saintMapping
    });
    setShowAddConfirmModal(true);
  }

  // Execute the add after confirmation
  const executeAddHistoricalGrade = async () => {
    if (!pendingAddData) return;

    const { student, grade, books, saintMapping } = pendingAddData;

    setIsProcessing(true);
    setShowAddConfirmModal(false);
    
    try {
      // Find teacher document ID
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
      const teacherSnapshot = await getDocs(teacherQuery);
      const teacherId = teacherSnapshot.docs[0].id;

      const saintsToUnlock = Object.values(saintMapping);
      
      if (student.type === 'manual') {
        // Manual student update
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id);
        
        const currentLifetime = student.lifetimeBooksSubmitted || 0;
        const newLifetime = currentLifetime + books;

        const historicalEntry = {
          grade: parseInt(grade),
          books: books,
          completedAt: new Date()
        };

        const newCompletions = [...(student.historicalCompletions || []), historicalEntry];

        const currentUnlockedSaints = student.unlockedSaints || [];
        const newUnlockedSaints = [...new Set([...currentUnlockedSaints, ...saintsToUnlock])];

        await updateDoc(studentRef, {
          historicalCompletions: newCompletions,
          lifetimeBooksSubmitted: newLifetime,
          unlockedSaints: newUnlockedSaints,
          lastModified: new Date()
        });

      } else {
        // App student update
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id);
        
        const currentLifetime = student.lifetimeBooksSubmitted || 0;
        const newLifetime = currentLifetime + books;

        const historicalEntry = {
          grade: parseInt(grade),
          books: books,
          completedAt: new Date()
        };

        const newCompletions = [...(student.historicalCompletions || []), historicalEntry];

        const currentUnlockedSaints = student.unlockedSaints || [];
        const newUnlockedSaints = [...new Set([...currentUnlockedSaints, ...saintsToUnlock])];

        await updateDoc(studentRef, {
          historicalCompletions: newCompletions,
          lifetimeBooksSubmitted: newLifetime,
          unlockedSaints: newUnlockedSaints,
          lastModified: new Date()
        });
      }

      playHistoricalUnlockSound();
      onStudentUpdate();
      
      setSelectedStudent(null);
      setSelectedGrade('');
      setBookCount('');
      setPendingAddData(null);
      
      setShowSuccess(`🎯 Grade ${grade} added for ${student.firstName}! ${books} books & ${saintsToUnlock.length} saints unlocked!`);
      setTimeout(() => setShowSuccess(''), 5000);

    } catch (error) {
      console.error('Error adding historical completion:', error);
      setShowSuccess('❌ Error adding historical data');
      setTimeout(() => setShowSuccess(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }

  // Mark historical data as complete
  const markHistoricalDataComplete = async (student) => {
    // Show custom modal instead of window.confirm
    setPendingMarkCompleteStudent(student);
    setShowMarkCompleteModal(true);
  }

  // Execute mark complete after confirmation
  const executeMarkComplete = async () => {
    if (!pendingMarkCompleteStudent) return;

    const student = pendingMarkCompleteStudent;
    setIsProcessing(true);
    setShowMarkCompleteModal(false);

    try {
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
      const teacherSnapshot = await getDocs(teacherQuery);
      const teacherId = teacherSnapshot.docs[0].id;

      if (student.type === 'manual') {
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
      setPendingMarkCompleteStudent(null);
      setShowSuccess(`✅ ${student.firstName}'s historical data marked complete`);
      setTimeout(() => setShowSuccess(''), 3000);

    } catch (error) {
      console.error('Error marking complete:', error);
      setShowSuccess('❌ Error updating student');
      setTimeout(() => setShowSuccess(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }

  // Unmark historical data as complete (reopen)
  const unmarkHistoricalDataComplete = async (student) => {
    // Show custom modal instead of window.confirm
    setPendingReopenStudent(student);
    setShowReopenModal(true);
  }

  // Execute reopen after confirmation
  const executeReopen = async () => {
    if (!pendingReopenStudent) return;

    const student = pendingReopenStudent;
    setIsProcessing(true);
    setShowReopenModal(false);

    try {
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
      const teacherSnapshot = await getDocs(teacherQuery);
      const teacherId = teacherSnapshot.docs[0].id;

      if (student.type === 'manual') {
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
      setPendingReopenStudent(null);
      setShowSuccess(`🔄 ${student.firstName} returned to eligible list`);
      setTimeout(() => setShowSuccess(''), 3000);

    } catch (error) {
      console.error('Error reopening:', error);
      setShowSuccess('❌ Error updating student');
      setTimeout(() => setShowSuccess(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }

  // Remove specific historical completion
  const removeHistoricalCompletion = async (student, gradeToRemove) => {
    if (!window.confirm(`Remove Grade ${gradeToRemove} completion for ${student.firstName}?\n\nThis will remove the books and saints unlocked for this grade.`)) {
      return;
    }

    setIsProcessing(true);

    try {
      const teachersRef = collection(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers`);
      const teacherQuery = query(teachersRef, where('uid', '==', userProfile.uid));
      const teacherSnapshot = await getDocs(teacherQuery);
      const teacherId = teacherSnapshot.docs[0].id;

      const completionToRemove = student.historicalCompletions.find(c => c.grade === gradeToRemove);
      const booksToRemove = completionToRemove.books;

      const updatedCompletions = student.historicalCompletions.filter(c => c.grade !== gradeToRemove);
      
      const saintMapping = GRADE_SAINT_MAPPINGS[gradeToRemove];
      const saintsToRemove = Object.values(saintMapping);
      
      const updatedUnlockedSaints = (student.unlockedSaints || []).filter(
        saint => !saintsToRemove.includes(saint)
      );

      const newLifetime = Math.max(0, (student.lifetimeBooksSubmitted || 0) - booksToRemove);

      if (student.type === 'manual') {
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/teachers/${teacherId}/manualStudents`, student.id);
        await updateDoc(studentRef, {
          historicalCompletions: updatedCompletions,
          lifetimeBooksSubmitted: newLifetime,
          unlockedSaints: updatedUnlockedSaints,
          lastModified: new Date()
        });
      } else {
        const studentRef = doc(db, `entities/${userProfile.entityId}/schools/${userProfile.schoolId}/students`, student.id);
        await updateDoc(studentRef, {
          historicalCompletions: updatedCompletions,
          lifetimeBooksSubmitted: newLifetime,
          unlockedSaints: updatedUnlockedSaints,
          lastModified: new Date()
        });
      }

      onStudentUpdate();
      setShowSuccess(`🗑️ Grade ${gradeToRemove} removed for ${student.firstName}`);
      setTimeout(() => setShowSuccess(''), 3000);

    } catch (error) {
      console.error('Error removing completion:', error);
      setShowSuccess('❌ Error removing completion');
      setTimeout(() => setShowSuccess(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }

  const toggleStudentExpanded = (studentId) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  }

  return (
    <div style={{
      padding: '1.5rem',
      display: 'grid',
      gap: '1.5rem',
      position: 'relative'
    }}>
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translate(-50%, 20px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }
        `}
      </style>

      {/* Header */}
      <div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#223848',
          marginBottom: '0.5rem'
        }}>
          📚 Historical Grade Completions
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          Add previous grade completions for students who completed grades before joining Lux Libris
        </p>
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '0.75rem',
        alignItems: 'end'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.25rem'
          }}>
            Search Students
          </label>
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.25rem'
          }}>
            Filter by Grade
          </label>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Grades</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
            <option value="6">Grade 6</option>
            <option value="7">Grade 7</option>
          </select>
        </div>
      </div>

      {/* Collapsible: Instructions */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        border: '1px solid #93C5FD',
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
            justifyContent: 'space-between'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              transform: showInstructions ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}>
              ▶
            </span>
            <span style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#223848'
            }}>
              ℹ️ How It Works
            </span>
          </div>
        </button>
        
        {showInstructions && (
          <div style={{
            padding: '0 1rem 1rem 1rem',
            fontSize: '0.875rem',
            color: '#374151',
            lineHeight: '1.6'
          }}>
            <div style={{
              background: '#EFF6FF',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #BFDBFE'
            }}>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                <strong>Purpose:</strong> Track books students read in previous grades before using Lux Libris.
              </p>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                <strong>What happens:</strong> Adding a historical grade completion will:
              </p>
              <ul style={{ margin: '0 0 0.75rem 0', paddingLeft: '1.5rem' }}>
                <li>Add books to their lifetime total</li>
                <li>Unlock the 3 saints for that grade (Seasonal, Grade, and Marian)</li>
                <li>Create a permanent record of that grade&apos;s completion</li>
              </ul>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                <strong>Eligibility:</strong> You can only add grades that are BEFORE their current grade.
              </p>
              <p style={{ margin: '0' }}>
                <strong>Completion:</strong> When all possible historical grades are added (or you manually mark it complete), the student moves to the &quot;Completed&quot; section.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible: Students with Some Historical Data */}
      {studentsWithHistory.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          border: '1px solid #FDB943',
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
                📝 In Progress ({studentsWithHistory.length})
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
              Add More
            </span>
          </button>
          
          {showStudentsWithHistory && (
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
              <div style={{
                display: 'grid',
                gap: '0.75rem'
              }}>
                {studentsWithHistory.map(student => {
                  const isExpanded = expandedStudents.has(`history-${student.type}-${student.id}`)
                  const totalHistoricalBooks = (student.historicalCompletions || [])
                    .reduce((sum, comp) => sum + comp.books, 0)
                  
                  return (
                    <div
                      key={`history-${student.type}-${student.id}`}
                      style={{
                        padding: '1rem',
                        border: '1px solid #FDB943',
                        borderRadius: '0.5rem',
                        background: '#FFFBEB'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: isExpanded ? '0.75rem' : '0'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#223848'
                          }}>
                            {student.firstName} {student.lastInitial}.
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6B7280'
                          }}>
                            Grade {student.grade} • {student.type === 'app' ? '📱' : '📝'} • {(student.historicalCompletions || []).length} grades • {totalHistoricalBooks} books
                          </div>
                        </div>
                        <button
                          onClick={() => toggleStudentExpanded(`history-${student.type}-${student.id}`)}
                          style={{
                            padding: '0.5rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.25rem'
                          }}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={{
                          borderTop: '1px solid #FDB943',
                          paddingTop: '0.75rem',
                          display: 'grid',
                          gap: '0.5rem'
                        }}>
                          {(student.historicalCompletions || []).map((completion, idx) => {
                            const saintMapping = GRADE_SAINT_MAPPINGS[completion.grade]
                            const saintNames = saintMapping ? [
                              SAINT_NAMES[saintMapping.seasonal],
                              SAINT_NAMES[saintMapping.grade],
                              SAINT_NAMES[saintMapping.marian]
                            ] : []

                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: '0.5rem',
                                  background: 'white',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: '600', color: '#223848' }}>
                                    Grade {completion.grade} • {completion.books} books
                                  </div>
                                  <div style={{ color: '#6B7280', fontSize: '0.625rem' }}>
                                    {saintNames.join(', ')}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeHistoricalCompletion(student, completion.grade)}
                                  disabled={isProcessing}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    background: '#FEE2E2',
                                    color: '#991B1B',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.625rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🗑️ Remove
                                </button>
                              </div>
                            )
                          })}
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

      {/* Collapsible: Eligible Students (Can Add) */}
      {studentsCanAddHistory.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          border: '1px solid #60A5FA',
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
                ➕ Eligible to Add ({studentsCanAddHistory.length})
              </span>
            </div>
            <span style={{
              padding: '0.25rem 0.75rem',
              background: '#DBEAFE',
              color: '#1E40AF',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              Add Data
            </span>
          </button>
          
          {showEligibleStudents && (
            <div style={{ padding: '0 1rem 1rem 1rem' }}>
              {/* Add Form */}
              <div style={{
                background: '#EFF6FF',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #93C5FD',
                marginBottom: '1rem'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '0.75rem'
                }}>
                  Add Historical Grade Completion
                </h4>
                
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {/* Student Select */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Student
                    </label>
                    <select
                      value={selectedStudent ? `${selectedStudent.type}-${selectedStudent.id}` : ''}
                      onChange={(e) => {
                        const [type, id] = e.target.value.split('-')
                        const student = studentsCanAddHistory.find(s => s.type === type && s.id === id)
                        setSelectedStudent(student || null)
                        setSelectedGrade('')
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">Select a student...</option>
                      {studentsCanAddHistory.map(s => (
                        <option key={`${s.type}-${s.id}`} value={`${s.type}-${s.id}`}>
                          {s.firstName} {s.lastInitial}. (Grade {s.grade}) - {s.type === 'app' ? '📱' : '📝'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Grade Select */}
                  {selectedStudent && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Historical Grade
                      </label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select a grade...</option>
                        {getAvailableGradesForStudent(selectedStudent)
                          .filter(grade => {
                            const existingCompletions = selectedStudent.historicalCompletions || []
                            return !existingCompletions.some(comp => comp.grade === grade)
                          })
                          .map(grade => (
                            <option key={grade} value={grade}>
                              Grade {grade}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Book Count */}
                  {selectedGrade && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Number of Books (1-20)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={bookCount}
                        onChange={(e) => setBookCount(e.target.value)}
                        placeholder="10"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  )}

                  {/* Add Button */}
                  <button
                    onClick={addHistoricalGradeCompletion}
                    disabled={!selectedStudent || !selectedGrade || !bookCount || isProcessing}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: (!selectedStudent || !selectedGrade || !bookCount || isProcessing) 
                        ? '#E5E7EB' 
                        : 'linear-gradient(135deg, #60A5FA, #3B82F6)',
                      color: (!selectedStudent || !selectedGrade || !bookCount || isProcessing) 
                        ? '#9CA3AF' 
                        : 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: (!selectedStudent || !selectedGrade || !bookCount || isProcessing) 
                        ? 'not-allowed' 
                        : 'pointer'
                    }}
                  >
                    {isProcessing ? '⏳ Adding...' : '➕ Add Historical Grade'}
                  </button>
                </div>
              </div>

              {/* Student List */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '0.75rem'
              }}>
                {studentsCanAddHistory.map(student => {
                  const availableGrades = getAvailableGradesForStudent(student)
                  const existingCompletions = student.historicalCompletions || []
                  const remainingGrades = availableGrades.filter(grade =>
                    !existingCompletions.some(comp => comp.grade === grade)
                  )
                  const completedCount = existingCompletions.length
                  const totalPossible = availableGrades.length
                  
                  return (
                    <div
                      key={`eligible-${student.type}-${student.id}`}
                      style={{
                        padding: '1rem',
                        border: '1px solid #93C5FD',
                        borderRadius: '0.5rem',
                        background: 'white'
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
                        color: '#3B82F6',
                        marginBottom: '0.25rem'
                      }}>
                        {completedCount} of {totalPossible} grades added
                      </div>
                      <div style={{
                        fontSize: '0.625rem',
                        color: '#6B7280',
                        fontStyle: 'italic',
                        marginBottom: '0.5rem'
                      }}>
                        Can add: {remainingGrades.length > 0 ? `Grade ${remainingGrades.join(', ')}` : 'All grades added'}
                      </div>
                      {remainingGrades.length === 0 && (
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
                      )}
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

      {/* Custom Modal: Add Historical Grade Confirmation */}
      {showAddConfirmModal && pendingAddData && (
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
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
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
                <span style={{ fontSize: '1.5rem' }}>📚</span>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#223848',
                  margin: 0
                }}>
                  Add Historical Grade Completion
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddConfirmModal(false);
                  setPendingAddData(null);
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
              {/* Student Info */}
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#223848',
                  marginBottom: '0.5rem'
                }}>
                  Student Information
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  {pendingAddData.student.firstName} {pendingAddData.student.lastInitial}. • Grade {pendingAddData.student.grade}
                </div>
              </div>

              {/* Details */}
              <div style={{
                background: '#F9FAFB',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'grid',
                gap: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6B7280'
                  }}>
                    Historical Grade:
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#223848'
                  }}>
                    Grade {pendingAddData.grade}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6B7280'
                  }}>
                    Books:
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#223848'
                  }}>
                    {pendingAddData.books}
                  </span>
                </div>

                <div style={{
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6B7280',
                    marginBottom: '0.5rem'
                  }}>
                    Saints to Unlock:
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#223848',
                    lineHeight: '1.5'
                  }}>
                    {pendingAddData.saintNames.join(', ')}
                  </div>
                </div>

                <div style={{
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#6B7280'
                    }}>
                      New Lifetime Total:
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#10B981'
                    }}>
                      {(pendingAddData.student.lifetimeBooksSubmitted || 0) + pendingAddData.books} books
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FDB943',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '1rem' }}>⚠️</span>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#92400E',
                    lineHeight: '1.5'
                  }}>
                    <strong>This action cannot be undone.</strong><br />
                    The historical completion will be permanently added to the student&apos;s record.
                  </div>
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
                    setShowAddConfirmModal(false);
                    setPendingAddData(null);
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
                    opacity: isProcessing ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeAddHistoricalGrade}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? '⏳ Adding...' : '✅ Add Completion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal: Mark Complete Confirmation */}
      {showMarkCompleteModal && pendingMarkCompleteStudent && (
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
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
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
                  Mark Historical Data Complete
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowMarkCompleteModal(false);
                  setPendingMarkCompleteStudent(null);
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
                Mark historical data as complete for <strong>{pendingMarkCompleteStudent.firstName} {pendingMarkCompleteStudent.lastInitial}.</strong>?
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
                  This will move them to the &quot;Completed&quot; section. You can reopen them later if needed.
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
                    setPendingMarkCompleteStudent(null);
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
                    opacity: isProcessing ? 0.5 : 1
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
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? '⏳ Marking...' : '✅ Mark Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal: Reopen Confirmation */}
      {showReopenModal && pendingReopenStudent && (
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
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
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
                  Remove &quot;Complete&quot; Status
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowReopenModal(false);
                  setPendingReopenStudent(null);
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
                Remove &quot;complete&quot; status for <strong>{pendingReopenStudent.firstName} {pendingReopenStudent.lastInitial}.</strong>?
              </p>

              <div style={{
                background: '#EFF6FF',
                border: '1px solid #93C5FD',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#1E40AF',
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
                    setShowReopenModal(false);
                    setPendingReopenStudent(null);
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
                    opacity: isProcessing ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeReopen}
                  disabled={isProcessing}
                  style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ADD4EA, #C3E0DE)',
                    color: '#223848',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1
                  }}
                >
                  {isProcessing ? '⏳ Reopening...' : '🔄 Reopen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}