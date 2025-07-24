// utils/compatibilityInsights.js - FIXED VERSION WITH EXPLICIT EXPORTS
import { parentReadingDnaGuide } from './dnaTypes'
import { enhancedCompatibilityMatrix, enhancedParentTypes } from './parentPsychology'

// Move formatDNACode here to avoid circular imports
const formatDNACode = (readingDNA) => {
  if (!readingDNA || !readingDNA.type) return 'Unknown'
  
  // Convert type to initials (e.g., curious_investigator -> CI)
  const typeInitials = readingDNA.type
    .split('_')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
  
  // Format modifiers (keep uppercase)
  const modifiers = readingDNA.modifiers || []
  const modifierString = modifiers.length > 0 ? `-${modifiers.join('')}` : ''
  
  return `${typeInitials}${modifierString}`
}

// Enhanced Parent Guidance for Child (extracts from Firebase readingDNA structure)
const getParentGuidanceForChild = (childReadingDNA) => {
  if (!childReadingDNA || !childReadingDNA.type) return null;
  
  const baseType = childReadingDNA.type;
  const modifiers = childReadingDNA.modifiers || [];
  const base = parentReadingDnaGuide.baseTypes[baseType];
  
  if (!base) return null;
  
  // Extract modifier guidance from both our guide and Firebase data
  const modifierAdvice = modifiers.map(mod => parentReadingDnaGuide.modifiers[mod]).filter(Boolean);
  const firebaseModifierDetails = childReadingDNA.modifierDetails || [];
  
  // Combine strategies from base type + modifiers + Firebase details
  const allStrategies = [
    ...base.parentStrategies, // All base strategies
    ...modifierAdvice.flatMap(mod => mod.parentStrategies), // All modifier strategies
    ...firebaseModifierDetails.flatMap(detail => detail.strategies || []) // Firebase strategies
  ];
  
  // Remove duplicates and take top strategies
  const uniqueStrategies = [...new Set(allStrategies)];
  
  // Create modifier descriptions
  const modifierDescriptions = modifiers.map(mod => {
    const guideData = parentReadingDnaGuide.modifiers[mod];
    const firebaseData = firebaseModifierDetails.find(detail => 
      detail.name && detail.name.charAt(0) === mod
    );
    
    return {
      code: mod,
      name: guideData?.parentName || firebaseData?.name || `${mod} Learner`,
      explanation: guideData?.whatThisMeans || firebaseData?.description || 'Special learning style',
      strategies: guideData?.parentStrategies || firebaseData?.strategies || []
    };
  }).filter(Boolean);
  
  return {
    childType: base.parentName,
    quickSummary: base.quickSummary,
    combinedDescription: `Your child is a ${base.parentName}${modifiers.length > 0 ? ' with ' + modifierDescriptions.map(mod => mod.name).join(' and ') + ' traits' : ''}.`,
    keyStrategies: uniqueStrategies.slice(0, 6), // Top 6 strategies
    helpfulPhrases: modifierAdvice.flatMap(mod => mod.phrases || []),
    bookRecommendations: base.bookRecommendations,
    hasModifiers: modifiers.length > 0,
    modifierExplanations: modifierDescriptions,
    fullCode: childReadingDNA.fullCode || formatDNACode(childReadingDNA),
    detailedType: `${base.parentName} (${modifierDescriptions.map(m => m.name).join(', ')})`
  };
};

// Enhanced compatibility insights that consider student modifiers - COMPREHENSIVE VERSION
const getCompatibilityInsights = (parentType, studentType, studentModifiers = []) => {
  // First try to get enhanced compatibility
  const enhancedCompat = enhancedCompatibilityMatrix[parentType]?.[studentType]
  
  if (enhancedCompat) {
    // Use the enhanced realistic compatibility
    let baseCompatibility = {
      level: enhancedCompat.level,
      quickTip: enhancedCompat.realityCheck.howToNavigate,
      strengths: enhancedCompat.specificStrategies.slice(0, 3),
      considerations: [enhancedCompat.realityCheck.whereTensionArises],
      tips: enhancedCompat.specificStrategies,
      
      // Add the new realistic compatibility fields
      honeymoonPhase: enhancedCompat.realityCheck.honeymoonPhase,
      whereTensionArises: enhancedCompat.realityCheck.whereTensionArises,
      theClash: enhancedCompat.realityCheck.theClash,
      howToNavigate: enhancedCompat.realityCheck.howToNavigate,
      growthOpportunity: enhancedCompat.realityCheck.growthOpportunity
    }

    // Apply modifier-specific enhancements
    const modifierAdjustments = {
      'A': { // Achieving - needs encouragement about mistakes
        socialTip: 'They have high standards and may get frustrated with confusion - remind them that struggle means their brain is growing stronger.',
        phrases: ['Your brain is working so hard right now!', 'Challenging parts help you become an even better reader', 'I love how carefully you think about books'],
        strategies: ['Emphasize effort over perfection', 'Normalize confusion as part of learning', 'Celebrate persistence and thinking']
      },
      'E': { // Emerging - needs confidence building
        confidenceTip: 'They\'re building confidence - celebrate every reading victory, big and small, and choose books that ensure success.',
        phrases: ['Look how much you\'ve grown as a reader!', 'I\'m so proud of how you stuck with that book', 'You\'re becoming such a strong reader'],
        strategies: ['Choose high-interest books at comfortable level', 'Celebrate all reading achievements', 'Build success momentum gradually']
      },
      'S': { // Supported - needs community
        socialTip: 'They thrive with shared reading experiences - read together often, discuss characters like real friends, and create family book traditions.',
        phrases: ['Tell me about your favorite character', 'Should we read this together?', 'What would you say to that character?'],
        strategies: ['Create regular family reading discussions', 'Read the same books so you can talk about them', 'Encourage them to share favorite parts immediately']
      },
      'F': { // Focus-needs - needs calm environment
        focusTip: 'They need quiet, calm reading environments to do their best thinking - create distraction-free spaces and use shorter sessions.',
        phrases: ['Let\'s find the perfect quiet spot for reading', 'Take your time - there\'s no rush', 'How does this reading spot feel for you?'],
        strategies: ['Create dedicated quiet reading spaces', 'Remove visual and auditory distractions', 'Use shorter, focused reading sessions']
      },
      'I': { // Independent - needs autonomy
        independenceTip: 'They need complete reading independence - trust their instincts about what to read and when.',
        phrases: ['What kind of book are you in the mood for?', 'You made such a great choice with that book', 'I trust your reading decisions'],
        strategies: ['Provide many options but let them choose', 'Avoid micromanaging their reading', 'Respect their reading pace and schedule']
      },
      'P': { // Practical - needs purpose
        practicalTip: 'They love reading that connects to their interests and goals - show them how books relate to things they care about.',
        phrases: ['How does this connect to [their interest]?', 'You\'re becoming an expert on [their topic]', 'This will help you with [their goal]'],
        strategies: ['Connect all reading to their interests', 'Choose books related to their hobbies', 'Show real-world applications of reading']
      },
      'G': { // Growth-oriented - embraces challenge
        growthTip: 'They see difficulty as exciting and embrace challenges - provide appropriately challenging books and celebrate growth mindset.',
        phrases: ['Your brain is growing stronger!', 'You haven\'t mastered this YET', 'I love how you embrace challenges'],
        strategies: ['Provide appropriately challenging books', 'Celebrate struggle as growth', 'Use growth mindset language consistently']
      },
      'R': { // Routine-loving - needs structure
        routineTip: 'They thrive with consistent reading routines and predictable structure - establish regular reading times and spaces.',
        phrases: ['It\'s our special reading time!', 'Let\'s set up your reading space just how you like it', 'Our reading routine helps you focus'],
        strategies: ['Establish consistent reading times', 'Create predictable reading rituals', 'Maintain structured reading environments']
      }
    }
    
    // Apply modifier adjustments
    studentModifiers.forEach(modifier => {
      if (modifierAdjustments[modifier]) {
        const adjustment = modifierAdjustments[modifier]
        baseCompatibility = {
          ...baseCompatibility,
          tips: [...(baseCompatibility.tips || []), ...(adjustment.strategies || [])],
          socialTip: adjustment.socialTip || baseCompatibility.socialTip,
          confidenceTip: adjustment.confidenceTip || baseCompatibility.confidenceTip,
          focusTip: adjustment.focusTip || baseCompatibility.focusTip,
          independenceTip: adjustment.independenceTip || baseCompatibility.independenceTip,
          practicalTip: adjustment.practicalTip || baseCompatibility.practicalTip,
          growthTip: adjustment.growthTip || baseCompatibility.growthTip,
          routineTip: adjustment.routineTip || baseCompatibility.routineTip,
          phrases: [...(baseCompatibility.phrases || []), ...(adjustment.phrases || [])]
        }
      }
    })
    
    return baseCompatibility
  }

  // Fallback to existing basic compatibility for combinations not yet enhanced
  const basicCompatibilityData = {
    'autonomy_supporter': {
      'freedom_reader': {
        level: 'Excellent Match',
        quickTip: 'Your natural trust in their choices perfectly supports their love of reading freedom!',
        strengths: ['Perfect autonomy alignment', 'Mutual respect for choices', 'Natural understanding of independence needs'],
        considerations: ['May occasionally need gentle guidance on skill-building', 'Consider offering rich environments for discovery'],
        tips: [
          'Celebrate their book choices enthusiastically and ask "What made you choose this?"',
          'Create multiple cozy reading spaces they can customize',
          'Trust their reading pace completely - resist urges to push faster'
        ]
      },
      'creative_explorer': {
        level: 'Strong Match', 
        quickTip: 'Your support for their choices gives them freedom to explore and create!',
        strengths: ['Honors creative responses', 'Supports open-ended exploration', 'Values unique interpretations'],
        considerations: ['May need occasional structure for skill development', 'Balance creative freedom with reading growth'],
        tips: [
          'Keep art supplies, journals, and building materials near reading areas',
          'Ask "What did this story inspire you to create?" instead of comprehension questions',
          'Celebrate their creative book responses as much as the reading itself'
        ]
      }
      // Add other basic combinations as needed
    }
    // Add other parent types as needed
  }

  const parentData = basicCompatibilityData[parentType]
  let baseCompatibility = parentData?.[studentType] || {
    level: 'Growing Together',
    strengths: ['Complementary motivation styles', 'Opportunity for mutual learning', 'Balanced reading support'],
    considerations: ['Understanding different motivational needs'],
    tips: ['Ask your child what motivates their reading', 'Try adapting to their natural style', 'Combine your approaches thoughtfully'],
    quickTip: 'Every parent-child reading combination is unique and wonderful!'
  }

  // Apply the same modifier logic for basic compatibility
  const modifierAdjustments = {
    'A': { 
      socialTip: 'They have high standards and may get frustrated with confusion - remind them that struggle means their brain is growing stronger.',
      strategies: ['Emphasize effort over perfection', 'Normalize confusion as part of learning', 'Celebrate persistence and thinking']
    },
    'E': { 
      confidenceTip: 'They\'re building confidence - celebrate every reading victory, big and small, and choose books that ensure success.',
      strategies: ['Choose high-interest books at comfortable level', 'Celebrate all reading achievements', 'Build success momentum gradually']
    },
    'S': { 
      socialTip: 'They thrive with shared reading experiences - read together often, discuss characters like real friends, and create family book traditions.',
      strategies: ['Create regular family reading discussions', 'Read the same books so you can talk about them', 'Encourage them to share favorite parts immediately']
    },
    'F': { 
      focusTip: 'They need quiet, calm reading environments to do their best thinking - create distraction-free spaces and use shorter sessions.',
      strategies: ['Create dedicated quiet reading spaces', 'Remove visual and auditory distractions', 'Use shorter, focused reading sessions']
    },
    'I': { 
      independenceTip: 'They need complete reading independence - trust their instincts about what to read and when.',
      strategies: ['Provide many options but let them choose', 'Avoid micromanaging their reading', 'Respect their reading pace and schedule']
    },
    'P': { 
      practicalTip: 'They love reading that connects to their interests and goals - show them how books relate to things they care about.',
      strategies: ['Connect all reading to their interests', 'Choose books related to their hobbies', 'Show real-world applications of reading']
    },
    'G': { 
      growthTip: 'They see difficulty as exciting and embrace challenges - provide appropriately challenging books and celebrate growth mindset.',
      strategies: ['Provide appropriately challenging books', 'Celebrate struggle as growth', 'Use growth mindset language consistently']
    },
    'R': { 
      routineTip: 'They thrive with consistent reading routines and predictable structure - establish regular reading times and spaces.',
      strategies: ['Establish consistent reading times', 'Create predictable reading rituals', 'Maintain structured reading environments']
    }
  }
  
  // Apply modifier adjustments for basic compatibility too
  studentModifiers.forEach(modifier => {
    if (modifierAdjustments[modifier]) {
      const adjustment = modifierAdjustments[modifier]
      baseCompatibility = {
        ...baseCompatibility,
        tips: [...(baseCompatibility.tips || []), ...(adjustment.strategies || [])],
        socialTip: adjustment.socialTip || baseCompatibility.socialTip,
        confidenceTip: adjustment.confidenceTip || baseCompatibility.confidenceTip,
        focusTip: adjustment.focusTip || baseCompatibility.focusTip,
        independenceTip: adjustment.independenceTip || baseCompatibility.independenceTip,
        practicalTip: adjustment.practicalTip || baseCompatibility.practicalTip,
        growthTip: adjustment.growthTip || baseCompatibility.growthTip,
        routineTip: adjustment.routineTip || baseCompatibility.routineTip
      }
    }
  })
  
  return baseCompatibility
}

// EXPLICIT EXPORTS - Including enhancedCompatibilityMatrix that other files expect
export { formatDNACode, getParentGuidanceForChild, getCompatibilityInsights, enhancedCompatibilityMatrix }