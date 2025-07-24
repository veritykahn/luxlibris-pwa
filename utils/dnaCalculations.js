// utils/dnaCalculations.js - All DNA calculation logic
import { parentDNATypes, parentDNAQuestions } from './dnaTypes'
import { getCompatibilityInsights, getParentGuidanceForChild } from './compatibilityInsights'

// Calculate DNA type from answers (enhanced with better scoring)
export const calculateParentDNAType = (responses) => {
  const traitCounts = {}
  
  // Count trait occurrences with weighted scoring
  Object.entries(responses).forEach(([questionId, answerId]) => {
    const question = parentDNAQuestions.find(q => q.id === questionId)
    const answer = question?.options.find(opt => opt.id === answerId)
    
    if (answer?.traits) {
      answer.traits.forEach(trait => {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1
      })
    }
  })

  // Map traits to DNA types and find best match
  const typeScores = {}
  
  Object.entries(parentDNATypes).forEach(([typeId, typeData]) => {
    let score = 0
    typeData.traits.forEach(trait => {
      if (traitCounts[trait]) {
        score += traitCounts[trait]
      }
    })
    typeScores[typeId] = score
  })

  // Find highest scoring type
  const bestType = Object.entries(typeScores).reduce((a, b) => 
    typeScores[a[0]] > typeScores[b[0]] ? a : b
  )[0]

  return {
    type: bestType,
    details: parentDNATypes[bestType],
    traitCounts,
    allScores: typeScores
  }
}

// Enhanced compatibility with student modifiers
export const calculateFamilyCompatibility = (parentDNA, studentDNAs) => {
  const compatibilityMatrix = []
  
  studentDNAs.forEach(student => {
    if (student.readingDNA && student.readingDNA.type) {
      const parentType = parentDNA.type
      const studentType = student.readingDNA.type
      const studentModifiers = student.readingDNA.modifiers || []
      
      // Get compatibility insights
      const compatibility = getCompatibilityInsights(parentType, studentType, studentModifiers)
      
      compatibilityMatrix.push({
        studentId: student.id,
        studentName: student.firstName,
        studentType: studentType,
        studentModifiers: studentModifiers,
        studentGrade: student.grade,
        parentType: parentType,
        compatibilityLevel: compatibility.level,
        strengths: compatibility.strengths,
        considerations: compatibility.considerations,
        tips: compatibility.tips,
        hasCompletedDNA: true,
        parentGuidance: getParentGuidanceForChild(student.readingDNA)
      })
    }
  })
  
  return compatibilityMatrix
}

// Generate family reading recommendations
export const generateFamilyRecommendations = (parentDNA, familyCompatibility) => {
  const recommendations = []
  
  // Family-wide activities based on parent type
  const parentTypeActivities = {
    'autonomy_supporter': [
      'Create multiple cozy reading spaces and let children choose where to read',
      'Set up a family "book discovery" time where everyone shares interesting finds',
      'Let children lead family reading discussions about their chosen books'
    ],
    'competence_builder': [
      'Create a family reading growth chart to celebrate progress',
      'Practice reading strategies together during family reading time',
      'Start a family book challenge with achievable, self-set goals'
    ],
    'connection_creator': [
      'Start a weekly family book club with rotating discussion leaders',
      'Create reading traditions like story time before bed or weekend book brunches',
      'Share your own reading excitement and ask children about their favorites'
    ],
    'meaning_maker': [
      'Connect books to real life during family discussions',
      'Ask open-ended questions about how stories relate to your family\'s experiences',
      'Explore themes and deeper meanings in books together'
    ],
    'growth_facilitator': [
      'Provide just-right challenges by having books at multiple levels available',
      'Celebrate reading effort and persistence, not just completion',
      'Create supportive reading environments where struggle is normalized'
    ],
    'authentic_modeler': [
      'Read your own books openly where children can see your enjoyment',
      'Share your excitement about books you\'re reading',
      'Model how to choose books and talk about reading preferences'
    ]
  }
  
  recommendations.push({
    category: 'Family Activities',
    icon: '👨‍👩‍👧‍👦',
    items: parentTypeActivities[parentDNA.type] || parentTypeActivities['connection_creator']
  })
  
  // Individual child recommendations based on compatibility
  familyCompatibility.forEach(childData => {
    if (childData.parentGuidance) {
      recommendations.push({
        category: `Supporting ${childData.studentName}`,
        icon: '⭐',
        items: childData.parentGuidance.keyStrategies || [
          'Spend one-on-one reading time together',
          'Ask about their favorite characters and scenes',
          'Celebrate their reading achievements'
        ]
      })
    }
  })
  
  return recommendations
}

// Clean DNA Code Formatting
export const formatDNACode = (readingDNA) => {
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

// Enhanced Quick Tips Function
export const getQuickTips = (parentType) => {
  const tips = {
    autonomy_supporter: {
      daily: [
        "Let them choose 2-3 books from options you provide",
        "Ask 'What made you pick that book?' with genuine curiosity", 
        "Honor their reading choices without immediate suggestions",
        "Celebrate their book discoveries enthusiastically",
        "Trust their reading pace completely"
      ],
      weekly: [
        "Create a cozy reading corner they can customize",
        "Visit the library and let them browse freely for 30 minutes",
        "Set up choice-based family reading time where everyone picks their own book",
        "Ask them to teach you about their favorite book this week"
      ]
    },
    competence_builder: {
      daily: [
        "Celebrate effort: 'I noticed you kept trying when it got hard!'",
        "Point out strategies: 'You used that bookmark trick really well'",
        "Notice growth: 'You're reading longer books than last month!'",
        "Focus on what they CAN do before addressing challenges",
        "Use specific praise about their reading skills"
      ],
      weekly: [
        "Set small, achievable reading goals together",
        "Create a reading progress chart they help design", 
        "Practice one new reading strategy together",
        "Celebrate weekly reading achievements with specific recognition"
      ]
    },
    connection_creator: {
      daily: [
        "Ask about characters like they're real people: 'How is Harry feeling?'",
        "Share your own reading: 'I'm reading about...'",
        "Read together for at least 10 minutes",
        "Create immediate discussion opportunities after reading",
        "Show excitement about their book discoveries"
      ],
      weekly: [
        "Start a family book club with one shared book",
        "Create dedicated discussion time after reading",
        "Find books others in your community are reading",
        "Plan family reading activities or book-related outings"
      ]
    },
    meaning_maker: {
      daily: [
        "Ask: 'What did this remind you of from your life?'",
        "Explore themes: 'What do you think the author wants us to learn?'",
        "Connect books to current events or family experiences",
        "Give them time to process what they've read",
        "Ask open-ended questions about deeper meaning"
      ],
      weekly: [
        "Keep a family reading journal for deep thoughts",
        "Choose books that relate to current life events",
        "Discuss how books connect to family values",
        "Explore big questions raised by their reading"
      ]
    },
    growth_facilitator: {
      daily: [
        "Acknowledge challenge: 'This book is making your brain work hard!'",
        "Scaffold support: 'Would it help to read this part together?'", 
        "Celebrate persistence: 'You didn't give up when it got confusing!'",
        "Provide just-right challenge levels",
        "Focus on progress over perfection"
      ],
      weekly: [
        "Gradually increase book difficulty",
        "Create step-by-step reading goals",
        "Practice new reading strategies together",
        "Celebrate growth and learning milestones"
      ]
    },
    authentic_modeler: {
      daily: [
        "Read your own book where they can see your enjoyment",
        "Share excitement: 'This part of my book was so surprising!'",
        "Model reading choices: 'I chose this because...'",
        "Demonstrate how you handle reading challenges",
        "Show genuine passion for learning through books"
      ],
      weekly: [
        "Share what you're learning from your reading",
        "Read different types of books visibly",
        "Show how reading impacts your decisions",
        "Discuss your book discoveries with enthusiasm"
      ]
    }
  }
  return tips[parentType] || tips.autonomy_supporter
}