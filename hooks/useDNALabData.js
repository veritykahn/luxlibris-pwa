// hooks/useDNALabData.js - CLEAN VERSION WITH NO DUPLICATES
import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateParentDNAType, calculateFamilyCompatibility, generateFamilyRecommendations } from '../utils/dnaCalculations'
import { parentDNAQuestions } from '../utils/dnaTypes'

export function useDNALabData(user, userProfile, isAuthenticated) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parentData, setParentData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [parentDNA, setParentDNA] = useState(null)
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false)
  const [familyCompatibility, setFamilyCompatibility] = useState([])
  const [familyRecommendations, setFamilyRecommendations] = useState([])
  const [showSuccess, setShowSuccess] = useState('')

  // Assessment states
  const [showAssessment, setShowAssessment] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated || !user || userProfile?.accountType !== 'parent') return
    
    loadInitialData()
  }, [user, userProfile, isAuthenticated])

  const loadInitialData = async () => {
    try {
      console.log('🧬 Loading family DNA lab data...')
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentProfile = parentDoc.data()
      setParentData(parentProfile)
      
      // Check if parent has completed DNA assessment
      if (parentProfile.luxDNA && parentProfile.luxDNA.details) {
        setParentDNA(parentProfile.luxDNA)
        setHasCompletedAssessment(true)
      }

      // Load linked students with their DNA data
      await loadLinkedStudentsWithDNA(parentProfile.linkedStudents || [])
      
    } catch (error) {
      console.error('❌ Error loading family DNA data:', error)
      setError('Failed to load family DNA data. Please try again.')
    }
    
    setLoading(false)
  }

  const loadLinkedStudentsWithDNA = async (linkedStudentIds) => {
    try {
      const students = []
      const entitiesSnapshot = await getDocs(collection(db, 'entities'))
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id
        const schoolsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools`))
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id
          const schoolData = schoolDoc.data()
          const studentsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools/${schoolId}/students`))
          
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
      
      // Only calculate compatibility if parent has completed assessment AND some children have too
      if (parentData?.luxDNA && parentData.luxDNA.type && parentData.luxDNA.details) {
        const studentsWithDNA = students.filter(student => student.readingDNA && student.readingDNA.type)
        
        if (studentsWithDNA.length > 0) {
          const compatibility = calculateFamilyCompatibility(parentData.luxDNA, studentsWithDNA)
          setFamilyCompatibility(compatibility)
          
          const recommendations = generateFamilyRecommendations(parentData.luxDNA, compatibility)
          setFamilyRecommendations(recommendations)
        } else {
          setFamilyCompatibility([])
          setFamilyRecommendations([])
        }
      } else {
        setFamilyCompatibility([])
        setFamilyRecommendations([])
      }
      
      console.log('✅ Linked students with DNA status loaded:', students.length)
      console.log('Students with completed DNA:', students.filter(s => s.readingDNA && s.readingDNA.type).length)
      
    } catch (error) {
      console.error('❌ Error loading linked students DNA:', error)
    }
  }

  // Complete assessment and save results - SINGLE DECLARATION
  const completeAssessment = useCallback(async (finalAnswers) => {
    try {
      if (!user?.uid) {
        console.error('No user available for assessment completion')
        return
      }

      const dnaResult = calculateParentDNAType(finalAnswers || answers)
      
      // Save to parent profile
      const parentRef = doc(db, 'parents', user.uid)
      await updateDoc(parentRef, {
        luxDNA: dnaResult,
        luxDNACompletedAt: new Date()
      })
      
      setParentDNA(dnaResult)
      setHasCompletedAssessment(true)
      setShowAssessment(false)
      
      // Calculate compatibility with children who have completed their DNA
      const studentsWithDNA = linkedStudents.filter(student => student.readingDNA && student.readingDNA.type)
      
      if (studentsWithDNA.length > 0 && dnaResult && dnaResult.details) {
        const compatibility = calculateFamilyCompatibility(dnaResult, studentsWithDNA)
        setFamilyCompatibility(compatibility)
        
        const recommendations = generateFamilyRecommendations(dnaResult, compatibility)
        setFamilyRecommendations(recommendations)
      } else {
        setFamilyCompatibility([])
        setFamilyRecommendations([])
      }
      
      setShowSuccess('🎉 Your Family DNA Profile is complete!')
      setTimeout(() => setShowSuccess(''), 3000)
      
    } catch (error) {
      console.error('❌ Error completing assessment:', error)
      setShowSuccess('❌ Error saving assessment. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    }
  }, [answers, linkedStudents, user?.uid])

  // Handle answer selection with auto-advance - SINGLE DECLARATION
  const handleAnswerSelect = useCallback((answerId) => {
    const newAnswers = {
      ...answers,
      [parentDNAQuestions[currentQuestion].id]: answerId
    }
    setAnswers(newAnswers)
    
    // Auto-advance to next question after short delay
    setTimeout(() => {
      if (currentQuestion < parentDNAQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
      } else {
        // Assessment complete
        completeAssessment(newAnswers)
      }
    }, 500)
  }, [currentQuestion, answers, completeAssessment])

  // Start assessment - SINGLE DECLARATION
  const startAssessment = useCallback(() => {
    setAnswers({})
    setCurrentQuestion(0)
    setShowAssessment(true)
  }, [])

  // Unlock DNA Assessment for Child - SINGLE DECLARATION
  const unlockDNAForChild = useCallback(async (childId) => {
    try {
      if (!user?.uid) {
        console.error('No user available for unlocking assessment')
        return
      }

      console.log('🔓 Unlocking DNA assessment for child:', childId)
      
      // Find the child in linked students
      const child = linkedStudents.find(s => s.id === childId)
      if (!child) {
        throw new Error('Child not found')
      }
      
      // Update the child's record to allow DNA assessment
      const studentRef = doc(db, `entities/${child.entityId}/schools/${child.schoolId}/students`, childId)
      await updateDoc(studentRef, {
        dnaUnlocked: true,
        dnaUnlockedBy: user.uid,
        dnaUnlockedAt: new Date(),
        lastModified: new Date()
      })
      
      // Update local state
      setLinkedStudents(prev => prev.map(student => 
        student.id === childId 
          ? { ...student, dnaUnlocked: true }
          : student
      ))
      
      setShowSuccess(`🎉 Reading DNA assessment unlocked for ${child.firstName}! They can now take their assessment.`)
      setTimeout(() => setShowSuccess(''), 4000)
      
    } catch (error) {
      console.error('❌ Error unlocking DNA assessment:', error)
      setShowSuccess('❌ Error unlocking assessment. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    }
  }, [linkedStudents, user?.uid])

  return {
    loading,
    error,
    parentData,
    linkedStudents,
    parentDNA,
    hasCompletedAssessment,
    familyCompatibility,
    familyRecommendations,
    showSuccess,
    setShowSuccess,
    
    // Assessment related
    showAssessment,
    setShowAssessment,
    currentQuestion,
    setCurrentQuestion,
    answers,
    setAnswers,
    handleAnswerSelect,
    
    // Actions
    startAssessment,
    completeAssessment,
    unlockDNAForChild
  }
}