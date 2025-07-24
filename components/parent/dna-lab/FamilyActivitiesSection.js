// components/parent/dna-lab/FamilyActivitiesSection.js
import { useState } from 'react'
import { luxTheme } from '../../../utils/theme'
import FamilyActivitiesModal from './modals/FamilyActivitiesModal'

export default function FamilyActivitiesSection({ parentDNA, familyRecommendations }) {
  const [showFamilyActivitiesModal, setShowFamilyActivitiesModal] = useState(false)

  if (!parentDNA || !familyRecommendations || familyRecommendations.length === 0) {
    return null
  }

  return (
    <>
      <div style={{
        backgroundColor: luxTheme.surface,
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: luxTheme.textPrimary,
            margin: 0
          }}>
            🏠 This Week&apos;s Family Activities
          </h3>
          <button
            onClick={() => setShowFamilyActivitiesModal(true)}
            style={{
              backgroundColor: luxTheme.secondary,
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: luxTheme.textPrimary,
              cursor: 'pointer'
            }}
          >
            📚 All Ideas
          </button>
        </div>

        <div style={{
          backgroundColor: `${luxTheme.accent}20`,
          borderRadius: '12px',
          padding: '16px',
          borderLeft: `4px solid ${luxTheme.accent}`
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: luxTheme.textPrimary,
            marginBottom: '6px'
          }}>
            📚 Choice-Based Family Reading Time
          </div>
          <div style={{
            fontSize: '12px',
            color: luxTheme.textSecondary,
            lineHeight: '1.4'
          }}>
            Set up reading time where everyone chooses their own book and reads together in the same space. Perfect for your {parentDNA.details.name} style!
          </div>
        </div>
      </div>

      {/* Family Activities Modal */}
      {showFamilyActivitiesModal && (
        <FamilyActivitiesModal
          familyRecommendations={familyRecommendations}
          onClose={() => setShowFamilyActivitiesModal(false)}
        />
      )}
    </>
  )
}