// pages/parent/dna-lab.js - FINAL COMPLETE VERSION
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Head from 'next/head'

// Import separate components
import DNALabHeader from '../../components/parent/dna-lab/DNALabHeader'
import ParentAssessmentCard from '../../components/parent/dna-lab/ParentAssessmentCard'
import ParentProfileDisplay from '../../components/parent/dna-lab/ParentProfileDisplay'
import ChildrenDNASection from '../../components/parent/dna-lab/ChildrenDNASection'
import FamilyActivitiesSection from '../../components/parent/dna-lab/FamilyActivitiesSection'
import DisclaimerBadge from '../../components/parent/dna-lab/DisclaimerBadge'
import SuccessMessage from '../../components/parent/dna-lab/SuccessMessage'
import LoadingSpinner from '../../components/parent/dna-lab/LoadingSpinner'
import ErrorDisplay from '../../components/parent/dna-lab/ErrorDisplay'

// Import assessment modal
import AssessmentModal from '../../components/parent/dna-lab/modals/AssessmentModal'
// ADD TO IMPORTS (top of file):
import ParentResultsModal from '../../components/parent/dna-lab/modals/ParentResultsModal'

// Import custom hook
import { useDNALabData } from '../../hooks/useDNALabData'
import { luxTheme } from '../../utils/theme'

export default function ParentFamilyDNALab() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  
  // MODIFY THE CUSTOM HOOK DESTRUCTURING (around line 20):
  const {
    loading,
    error,
    parentDNA,
    hasCompletedAssessment,
    linkedStudents,
    familyCompatibility,
    familyRecommendations,
    showSuccess,
    setShowSuccess,
    
    // Assessment states
    showAssessment,
    setShowAssessment,
    currentQuestion,
    setCurrentQuestion,
    answers,
    setAnswers,
    handleAnswerSelect,
    
    // 🎉 NEW: Add results modal state
    showParentResults,
    setShowParentResults,
    
    // Actions
    unlockDNAForChild,
    startAssessment
  } = useDNALabData(user, userProfile, isAuthenticated)

  // Redirect logic
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, userProfile, router])

  // Loading state
  if (authLoading || loading || !userProfile) {
    return <LoadingSpinner />
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} />
  }

  return (
    <>
      <Head>
        <title>Family DNA Lab - Lux Libris Parent</title>
        <meta name="description" content="Discover your family's reading personalities and get personalized guidance" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '100px'
      }}>
        {/* Header Component */}
        <DNALabHeader onBack={() => router.push('/parent/dashboard')} />

        {/* Main Content */}
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Disclaimer Badge */}
          <DisclaimerBadge />

          {/* Assessment or Profile Display */}
          {!hasCompletedAssessment ? (
            <ParentAssessmentCard 
              linkedStudentCount={linkedStudents.length}
              onStartAssessment={startAssessment}
            />
          ) : (
            // UPDATE ParentProfileDisplay CALL (around line 70):
            <ParentProfileDisplay 
              parentDNA={parentDNA}
              onStartAssessment={startAssessment}
              linkedStudentCount={linkedStudents.length} // ← ADD THIS for stats
            />
          )}

          {/* Children Section */}
          {hasCompletedAssessment && (
            <ChildrenDNASection
              linkedStudents={linkedStudents}
              parentDNA={parentDNA}
              familyCompatibility={familyCompatibility}
              onUnlockDNA={unlockDNAForChild}
            />
          )}

          {/* Family Activities */}
          {hasCompletedAssessment && familyCompatibility.length > 0 && (
            <FamilyActivitiesSection
              parentDNA={parentDNA}
              familyRecommendations={familyRecommendations}
            />
          )}
        </div>

        {/* ADD THE MODAL BEFORE CLOSING DIV (around line 110, before </div>): */}
        {/* 🎉 NEW: Parent Results Celebration Modal */}
        <ParentResultsModal
          parentDNA={parentDNA}
          show={showParentResults}
          onClose={() => setShowParentResults(false)}
          onViewDetails={() => {
            setShowParentResults(false)
            // Could scroll to profile or open detail modal here
            // For now, just close and let them see the profile
          }}
        />

        {/* EXISTING: Assessment Modal */}
        <AssessmentModal
          showAssessment={showAssessment}
          currentQuestion={currentQuestion}
          answers={answers}
          onAnswerSelect={handleAnswerSelect}
          onClose={() => {
            setShowAssessment(false)
            setAnswers({})
            setCurrentQuestion(0)
          }}
        />

        {/* Success Message */}
        <SuccessMessage 
          message={showSuccess}
          onClose={() => setShowSuccess('')}
        />

        {/* Global Styles */}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
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
        `}</style>
      </div>
    </>
  )
}