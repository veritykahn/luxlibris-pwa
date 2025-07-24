// components/parent/dna-lab/ChildrenDNASection.js - FIXED VERSION
import { useState } from 'react'
import { luxTheme } from '../../../utils/theme'
import { getParentGuidanceForChild } from '../../../utils/compatibilityInsights'
import ChildDNACard from './ChildDNACard'
import UnlockModal from './modals/UnlockModal'

export default function ChildrenDNASection({
  linkedStudents,
  parentDNA,
  familyCompatibility,
  onUnlockDNA
}) {
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [selectedChildForUnlock, setSelectedChildForUnlock] = useState(null)

  const openUnlockModal = (child) => {
    setSelectedChildForUnlock(child)
    setShowUnlockModal(true)
  }

  const closeUnlockModal = () => {
    setShowUnlockModal(false)
    setSelectedChildForUnlock(null)
  }

  // Calculate stats for header
  const completedDNA = linkedStudents.filter(s => s.readingDNA && s.readingDNA.type).length
  const unlockedDNA = linkedStudents.filter(s => s.dnaUnlocked === true).length
  const excellentMatches = familyCompatibility.filter(f => f.compatibilityLevel === 'Excellent Match').length
  const strongMatches = familyCompatibility.filter(f => f.compatibilityLevel === 'Strong Match').length

  // Calculate actual number of strategies available
  const totalStrategies = linkedStudents.reduce((total, student) => {
    if (student.readingDNA && student.readingDNA.type) {
      const guidance = getParentGuidanceForChild(student.readingDNA)
      return total + (guidance?.keyStrategies?.length || 0)
    }
    return total
  }, 0)

  return (
    <>
      <div style={{
        backgroundColor: luxTheme.surface,
        borderRadius: '24px',
        padding: '28px',
        marginBottom: '24px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, ${luxTheme.primary}05 25%, transparent 25%), linear-gradient(-45deg, ${luxTheme.primary}05 25%, transparent 25%)`,
          backgroundSize: '40px 40px',
          opacity: 0.3
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Enhanced Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '12px'
            }}>
              👨‍👩‍👧‍👦
            </div>
            
            <h3 style={{
              fontSize: '22px',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              margin: '0 0 8px 0',
              fontFamily: 'Didot, "Times New Roman", serif'
            }}>
              Your Family's Reading DNA
            </h3>
            
            <div style={{
              fontSize: '14px',
              color: luxTheme.textSecondary,
              marginBottom: '20px'
            }}>
              Discover how your {parentDNA?.details?.name || 'parenting'} style matches with each child
            </div>

            {/* Fixed Stats Dashboard */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              maxWidth: '360px',
              margin: '0 auto'
            }}>
              <div style={{
                backgroundColor: `${luxTheme.primary}15`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: luxTheme.textPrimary
                }}>
                  {completedDNA}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: luxTheme.textSecondary
                }}>
                  DNA Complete
                </div>
              </div>
              
              <div style={{
                backgroundColor: `${luxTheme.secondary}15`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: luxTheme.textPrimary
                }}>
                  {totalStrategies > 0 ? totalStrategies : '—'}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: luxTheme.textSecondary
                }}>
                  Strategies Ready
                </div>
              </div>
              
              <div style={{
                backgroundColor: `${luxTheme.accent}15`,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: luxTheme.textPrimary
                }}>
                  {linkedStudents.length}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: luxTheme.textSecondary
                }}>
                  Total Children
                </div>
              </div>
            </div>
          </div>

          {/* Children Cards */}
          {linkedStudents.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
            }}>
              {linkedStudents.map((student) => (
                <ChildDNACard
                  key={student.id}
                  student={student}
                  parentDNA={parentDNA}
                  onUnlockDNA={() => openUnlockModal(student)}
                />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{ 
                fontSize: '64px', 
                marginBottom: '20px',
                opacity: 0.5
              }}>
                👨‍👩‍👧‍👦
              </div>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px'
              }}>
                No Children Linked Yet
              </h4>
              <p style={{
                fontSize: '14px',
                color: luxTheme.textSecondary,
                lineHeight: '1.5',
                maxWidth: '300px',
                margin: '0 auto'
              }}>
                Connect with your children's accounts to see their reading personalities and get personalized parenting strategies!
              </p>
            </div>
          )}

          {/* Family Insights Summary */}
          {familyCompatibility.length > 0 && (
            <div style={{
              marginTop: '24px',
              backgroundColor: `${luxTheme.primary}10`,
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '8px'
              }}>
                🎯 Family Reading Insights
              </div>
              <div style={{
                fontSize: '13px',
                color: luxTheme.textSecondary,
                lineHeight: '1.4'
              }}>
                {excellentMatches > 0 && `${excellentMatches} excellent compatibility match${excellentMatches > 1 ? 'es' : ''}`}
                {excellentMatches > 0 && strongMatches > 0 && ' and '}
                {strongMatches > 0 && `${strongMatches} strong match${strongMatches > 1 ? 'es' : ''}`}
                {excellentMatches + strongMatches > 0 ? 
                  ' - your family reading dynamic is looking great!' : 
                  'Compatibility insights available as children complete their assessments'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && selectedChildForUnlock && (
        <UnlockModal
          child={selectedChildForUnlock}
          onUnlock={() => {
            onUnlockDNA(selectedChildForUnlock.id)
            closeUnlockModal()
          }}
          onClose={closeUnlockModal}
        />
      )}
    </>
  )
}