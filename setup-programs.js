// setup-programs.js - Enhanced with flexible tier system and custom overrides
import { db } from './lib/firebase'
import { collection, doc, setDoc, getDocs } from 'firebase/firestore'

// PROGRAMS CATALOG DATA
const PROGRAMS_CATALOG = [
  {
    id: "luxlibris",
    name: "Lux Libris Reading Program",
    description: "Catholic reading program for elementary/middle school with saints achievements and book tracking",
    type: "reading",
    status: "active",
    
    // Data sources this program uses (your existing collections)
    collections: {
      books: "masterNominees",      // Your existing book collection
      achievements: "saints",       // Your existing saints collection  
      assessments: "quizzes"        // Your existing quizzes collection
    },
    
    // Program details
    targetGrades: ["4", "5", "6", "7", "8"],
    targetAudience: "Elementary & Middle School",
    features: [
      "Reading progress tracking",
      "Saint achievement unlocks", 
      "Interactive book quizzes",
      "Reading timer and habits",
      "Student dashboard",
      "Teacher management",
      "Parent engagement tools"
    ],
    
    // Program availability (available to all tiers)
    availableForTiers: ["small", "medium", "large", "enterprise"],
    
    // UI/Branding
    color: "#fbbf24",              // Beautiful yellow theme
    icon: "📚",
    logoUrl: null,                 // Add later if needed
    
    // Program configuration options
    configurableOptions: {
      bookSelection: true,         // Schools can select which books
      achievementTiers: true,      // Schools can set achievement levels
      submissionTypes: true        // Quiz vs presentation options
    },
    
    // Metadata
    version: "1.0",
    createdAt: new Date(),
    createdBy: "Dr. Verity Kahn",
    lastModified: new Date()
  },
  
  {
    id: "laudatoliterary", 
    name: "Laudato Literary List",
    description: "Advanced environmental & ecological literature program for high school inspired by Pope Francis' Laudato Si'",
    type: "reading", 
    status: "active",              // Now active for grades 9-12
    
    collections: {
      books: "laudatoBooks",       // Future collection for eco-focused books
      achievements: "ecoAchievements", // Environmental achievements
      assessments: "ecoQuizzes"    // Environmental literacy quizzes
    },
    
    targetGrades: ["9", "10", "11", "12"],  // HIGH SCHOOL ONLY
    targetAudience: "High School",
    features: [
      "Advanced environmental literature",
      "Luxlings reward system (advanced)",
      "Creation care achievements", 
      "Ecological awareness tracking",
      "Healthy habits integration",
      "Reading timer with analytics",
      "Real world stewardship projects",
      "Pope Francis inspired content",
      "College prep reading skills",
      "Environmental action portfolio"
    ],
    
    availableForTiers: ["small", "medium", "large", "enterprise"], // All tiers can choose
    
    color: "#10b981",             // Green for environmental theme
    icon: "🌱",
    
    configurableOptions: {
      bookSelection: true,
      projectTypes: true,
      assessmentTypes: true,
      realWorldActions: true,      // Track real environmental actions
      luxlingsIntegration: true    // Advanced reward system
    },
    
    version: "1.0",
    createdAt: new Date(), 
    createdBy: "Dr. Verity Kahn",
    lastModified: new Date()
  },

  // FUTURE PROGRAM PLACEHOLDER
  {
    id: "bluebonnet",
    name: "Texas Bluebonnet Award Program", 
    description: "Official Texas Bluebonnet reading list program for K-12",
    type: "reading",
    status: "coming soon",        // Future program
    
    collections: {
      books: "bluebonnetBooks",
      achievements: "texasAchievements", 
      assessments: "bluebonnetQuizzes"
    },
    
    targetGrades: ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    targetAudience: "All Grades (K-12)",
    features: [
      "Official Texas Bluebonnet lists",
      "State award program alignment",
      "Reading comprehension assessments", 
      "Texas-themed achievements",
      "Voting and selection process",
      "Library partnerships"
    ],
    
    availableForTiers: ["small", "medium", "large", "enterprise"], // Available to all tiers
    
    color: "#6366f1", 
    icon: "🌼",
    
    configurableOptions: {
      gradeSelection: true,
      votingEnabled: true,
      libraryIntegration: true
    },
    
    version: "1.0",
    createdAt: new Date(),
    createdBy: "Dr. Verity Kahn", 
    lastModified: new Date()
  }
]

// FLEXIBLE TIER CONFIGURATION - Number of programs each tier includes
const TIER_PROGRAM_LIMITS = {
  small: {
    maxPrograms: 1,
    basePrice: 2000,
    description: "Choose 1 reading program",
    extraListPrice: 500          // $500 per additional list
  },
  medium: {
    maxPrograms: 2,
    basePrice: 4500, 
    description: "Choose up to 2 reading programs",
    extraListPrice: 400          // $400 per additional list
  },
  large: {
    maxPrograms: 3,
    basePrice: 8000,
    description: "Choose up to 3 reading programs", 
    extraListPrice: 300          // $300 per additional list
  },
  enterprise: {
    maxPrograms: 4,              // 4+ programs
    basePrice: 15000,
    description: "Choose up to 4+ reading programs",
    extraListPrice: 200          // $200 per additional list
  }
}

// MAIN SETUP FUNCTION
const setupProgramsCollection = async () => {
  try {
    console.log('🚀 Setting up Enhanced Programs Collection...')
    
    // Check if programs collection already exists
    const programsRef = collection(db, 'programs')
    const existingPrograms = await getDocs(programsRef)
    
    if (!existingPrograms.empty) {
      console.log('⚠️ Programs collection already exists with', existingPrograms.size, 'programs')
      const overwrite = window.confirm('Programs collection already exists. Overwrite with enhanced version?')
      if (!overwrite) {
        console.log('❌ Setup cancelled by user')
        return { success: false, message: 'Setup cancelled' }
      }
    }
    
    // Create each program document
    let createdCount = 0
    for (const program of PROGRAMS_CATALOG) {
      try {
        await setDoc(doc(db, 'programs', program.id), program)
        console.log(`✅ Created program: ${program.name} (${program.status}) - ${program.targetAudience}`)
        createdCount++
      } catch (error) {
        console.error(`❌ Error creating program ${program.id}:`, error)
      }
    }
    
    // Create enhanced tier configuration document
    try {
      await setDoc(doc(db, 'systemConfig', 'tierPrograms'), {
        tiers: TIER_PROGRAM_LIMITS,
        flexibleTierSystem: true,     // Flag for new system
        allowCustomOverrides: true,    // GOD MODE can override limits
        extraListPricing: {
          enabled: true,
          basePrice: 500,              // Default extra list price
          tierSpecificPricing: true    // Use tier-specific pricing
        },
        lastModified: new Date(),
        createdBy: 'Dr. Verity Kahn',
        version: '2.0'               // Enhanced version
      })
      console.log('✅ Created enhanced tier configuration')
    } catch (error) {
      console.error('❌ Error creating tier config:', error)
    }
    
    console.log(`🎉 Enhanced Programs setup complete! Created ${createdCount} programs`)
    console.log('📚 Lux Libris: Elementary/Middle (grades 4-8)')
    console.log('🌱 Laudato Literary: High School (grades 9-12) with advanced features')
    console.log('🌼 Bluebonnet: Coming Soon (K-12)')
    
    return {
      success: true,
      message: `Successfully created ${createdCount} programs with flexible tier system`,
      programs: PROGRAMS_CATALOG.map(p => ({ 
        id: p.id, 
        name: p.name, 
        status: p.status,
        targetAudience: p.targetAudience 
      }))
    }
    
  } catch (error) {
    console.error('❌ Error setting up enhanced programs:', error)
    return {
      success: false, 
      message: 'Setup failed: ' + error.message
    }
  }
}

// ENHANCED UTILITY FUNCTIONS FOR GOD MODE

// Get all active programs available for selection
const getAllActivePrograms = async () => {
  try {
    const programsRef = collection(db, 'programs')
    const programsSnapshot = await getDocs(programsRef)
    
    const activePrograms = []
    programsSnapshot.forEach((doc) => {
      const program = doc.data()
      // Show both active and coming soon programs in GOD MODE for testing
      if (program.status === 'active' || program.status === 'coming soon') {
        activePrograms.push({ id: doc.id, ...program })
      }
    })
    
    return activePrograms
  } catch (error) {
    console.error('Error getting active programs:', error)
    return []
  }
}

// Get available programs for a specific tier (with tier limits)
const getAvailableProgramsForTier = async (tierName) => {
  try {
    const tierConfig = TIER_PROGRAM_LIMITS[tierName]
    if (!tierConfig) return []
    
    // Get all active programs (flexible system - any program available to any tier)
    const activePrograms = await getAllActivePrograms()
    
    // Filter by tier availability if specified in program
    const tierAvailablePrograms = activePrograms.filter(program => 
      !program.availableForTiers || program.availableForTiers.includes(tierName)
    )
    
    return tierAvailablePrograms
  } catch (error) {
    console.error('Error getting available programs:', error)
    return []
  }
}

// Get tier display info for GOD MODE UI
const getTierDisplayInfo = (tierName) => {
  const tierConfig = TIER_PROGRAM_LIMITS[tierName]
  if (!tierConfig) return null
  
  return {
    tierName,
    maxPrograms: tierConfig.maxPrograms,
    basePrice: tierConfig.basePrice,
    extraListPrice: tierConfig.extraListPrice,
    description: tierConfig.description,
    selectionType: 'flexible',
    canOverride: true             // GOD MODE can override limits
  }
}

// Calculate pricing for program selection (including overrides)
const calculateProgramPricing = (tierName, selectedProgramCount, customOverride = false) => {
  const tierConfig = TIER_PROGRAM_LIMITS[tierName]
  if (!tierConfig) return { totalPrice: 0, breakdown: {} }
  
  const maxIncluded = tierConfig.maxPrograms
  const basePrice = tierConfig.basePrice
  const extraListPrice = tierConfig.extraListPrice
  
  let totalPrice = basePrice
  let extraLists = 0
  let breakdown = {
    baseTier: basePrice,
    extraLists: 0,
    extraListCount: 0
  }
  
  if (selectedProgramCount > maxIncluded) {
    extraLists = selectedProgramCount - maxIncluded
    const extraCost = extraLists * extraListPrice
    totalPrice += extraCost
    
    breakdown.extraLists = extraCost
    breakdown.extraListCount = extraLists
  }
  
  return {
    totalPrice,
    breakdown,
    extraListsAdded: extraLists,
    pricePerExtraList: extraListPrice
  }
}

// Validate program selection with flexible rules and override support
const validateProgramSelection = (tierName, selectedPrograms, customOverride = false, maxOverride = null) => {
  const tierConfig = TIER_PROGRAM_LIMITS[tierName]
  if (!tierConfig) return { valid: false, error: 'Invalid tier' }
  
  // Check minimum programs (at least 1)
  if (selectedPrograms.length === 0) {
    return {
      valid: false,
      error: 'Please select at least one reading program'
    }
  }
  
  // If custom override is enabled, use override limit
  const effectiveMaxPrograms = customOverride && maxOverride ? maxOverride : tierConfig.maxPrograms
  
  // Check against effective limit (but allow GOD MODE overrides)
  if (!customOverride && selectedPrograms.length > effectiveMaxPrograms) {
    const pricing = calculateProgramPricing(tierName, selectedPrograms.length)
    return {
      valid: false,
      error: `${tierName} tier includes ${effectiveMaxPrograms} programs. ${pricing.extraListsAdded} extra lists would cost $${pricing.breakdown.extraLists} additional.`,
      suggestOverride: true,
      pricingInfo: pricing
    }
  }
  
  // All validations passed
  return { 
    valid: true,
    pricingInfo: calculateProgramPricing(tierName, selectedPrograms.length, customOverride)
  }
}

// Get default programs for a tier (no defaults in flexible system)
const getDefaultProgramsForTier = async (tierName) => {
  // Flexible system has no defaults - user/admin chooses
  return []
}

// PROGRAM COLLECTION HELPERS

// Get program by ID
const getProgramById = async (programId) => {
  try {
    const programsRef = collection(db, 'programs')
    const programsSnapshot = await getDocs(programsRef)
    
    let foundProgram = null
    programsSnapshot.forEach((doc) => {
      if (doc.id === programId) {
        foundProgram = { id: doc.id, ...doc.data() }
      }
    })
    
    return foundProgram
  } catch (error) {
    console.error('Error getting program:', error)
    return null
  }
}

// Get programs by IDs
const getProgramsByIds = async (programIds) => {
  try {
    const programs = []
    for (const programId of programIds) {
      const program = await getProgramById(programId)
      if (program) programs.push(program)
    }
    return programs
  } catch (error) {
    console.error('Error getting programs by IDs:', error)
    return []
  }
}

// SINGLE EXPORT SECTION - ONLY ONE SET OF EXPORTS
export { 
  setupProgramsCollection,
  getAllActivePrograms,
  getAvailableProgramsForTier, 
  getDefaultProgramsForTier,
  getTierDisplayInfo,
  validateProgramSelection,
  calculateProgramPricing,
  getProgramById,
  getProgramsByIds,
  PROGRAMS_CATALOG,
  TIER_PROGRAM_LIMITS
}

export default {
  setupProgramsCollection,
  getAllActivePrograms,
  getAvailableProgramsForTier,
  getTierDisplayInfo,
  validateProgramSelection,
  calculateProgramPricing,
  PROGRAMS_CATALOG,
  TIER_PROGRAM_LIMITS
}