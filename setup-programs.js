// setup-programs.js - SIMPLIFIED VERSION that works with unified pricing-config.js
import { db } from './lib/firebase'
import { collection, doc, setDoc, getDocs } from 'firebase/firestore'
import { PRICING_CONFIG } from './lib/pricing-config'

// PROGRAMS CATALOG DATA - Just the program definitions, no pricing
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
    availableForTiers: ["starter", "small", "medium", "large", "xlarge", "enterprise", "unlimited"],
    
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
    
    availableForTiers: ["starter", "small", "medium", "large", "xlarge", "enterprise", "unlimited"],
    
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
    status: "coming_soon",        // Future program
    
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
    
    availableForTiers: ["starter", "small", "medium", "large", "xlarge", "enterprise", "unlimited"],
    
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

// MAIN SETUP FUNCTION
const setupProgramsCollection = async () => {
  try {
    console.log('🚀 Setting up Programs Collection...')
    
    // Check if programs collection already exists
    const programsRef = collection(db, 'programs')
    const existingPrograms = await getDocs(programsRef)
    
    if (!existingPrograms.empty) {
      console.log('⚠️ Programs collection already exists with', existingPrograms.size, 'programs')
      const overwrite = window.confirm('Programs collection already exists. Overwrite with new version?')
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
    
    console.log(`🎉 Programs setup complete! Created ${createdCount} programs`)
    console.log('📚 Lux Libris: Elementary/Middle (grades 4-8)')
    console.log('🌱 Laudato Literary: High School (grades 9-12) with advanced features')
    console.log('🌼 Bluebonnet: Coming Soon (K-12)')
    
    return {
      success: true,
      message: `Successfully created ${createdCount} programs`,
      programs: PROGRAMS_CATALOG.map(p => ({ 
        id: p.id, 
        name: p.name, 
        status: p.status,
        targetAudience: p.targetAudience 
      }))
    }
    
  } catch (error) {
    console.error('❌ Error setting up programs:', error)
    return {
      success: false, 
      message: 'Setup failed: ' + error.message
    }
  }
}

// UTILITY FUNCTIONS - Now use pricing-config.js for all pricing logic

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

// Get available programs for a specific tier - now uses pricing-config.js
const getAvailableProgramsForTier = async (tierName) => {
  try {
    const tierConfig = PRICING_CONFIG.tiers[tierName]
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

// Get tier display info - now uses pricing-config.js
const getTierDisplayInfo = (tierName) => {
  const tierConfig = PRICING_CONFIG.tiers[tierName]
  if (!tierConfig) return null
  
  return {
    tierName,
    maxPrograms: tierConfig.programs.max,
    includedPrograms: tierConfig.programs.included,
    extraCost: tierConfig.programs.extraCost,
    description: `${tierConfig.programs.included} included, up to ${tierConfig.programs.max} total`,
    canOverride: true             // GOD MODE can override limits
  }
}

// Validate program selection - now uses pricing-config.js
const validateProgramSelection = (tierName, selectedPrograms, customOverride = false, maxOverride = null) => {
  const tierConfig = PRICING_CONFIG.tiers[tierName]
  if (!tierConfig) return { valid: false, error: 'Invalid tier' }
  
  // Check minimum programs (at least 1)
  if (selectedPrograms.length === 0) {
    return {
      valid: false,
      error: 'Please select at least one reading program'
    }
  }
  
  // If custom override is enabled, use override limit
  const effectiveMaxPrograms = customOverride && maxOverride ? maxOverride : tierConfig.programs.max
  
  // Check against effective limit (but allow GOD MODE overrides)
  if (!customOverride && selectedPrograms.length > effectiveMaxPrograms) {
    const extraPrograms = selectedPrograms.length - tierConfig.programs.included
    const extraCost = Math.max(0, extraPrograms) * tierConfig.programs.extraCost
    
    return {
      valid: false,
      error: `${tierName} tier includes ${tierConfig.programs.included} programs. ${extraPrograms} extra programs would cost $${extraCost} additional.`,
      suggestOverride: true,
      pricingInfo: {
        extraPrograms,
        extraCost
      }
    }
  }
  
  // All validations passed
  const extraPrograms = Math.max(0, selectedPrograms.length - tierConfig.programs.included)
  const extraCost = extraPrograms * tierConfig.programs.extraCost
  
  return { 
    valid: true,
    pricingInfo: {
      extraPrograms,
      extraCost
    }
  }
}

// Calculate program pricing - now uses pricing-config.js
const calculateProgramPricing = (tierName, selectedProgramCount, customOverride = false) => {
  const tierConfig = PRICING_CONFIG.tiers[tierName]
  if (!tierConfig) return { totalPrice: 0, breakdown: {} }
  
  const includedPrograms = tierConfig.programs.included
  const extraCost = tierConfig.programs.extraCost
  
  let extraPrograms = 0
  let breakdown = {
    includedPrograms,
    extraPrograms: 0,
    extraCost: 0
  }
  
  if (selectedProgramCount > includedPrograms) {
    extraPrograms = selectedProgramCount - includedPrograms
    const totalExtraCost = extraPrograms * extraCost
    
    breakdown.extraPrograms = extraPrograms
    breakdown.extraCost = totalExtraCost
  }
  
  return {
    totalPrice: breakdown.extraCost,
    breakdown,
    extraProgramsAdded: extraPrograms,
    pricePerExtraProgram: extraCost
  }
}

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

// SINGLE EXPORT SECTION
export { 
  setupProgramsCollection,
  getAllActivePrograms,
  getAvailableProgramsForTier, 
  getTierDisplayInfo,
  validateProgramSelection,
  calculateProgramPricing,
  getProgramById,
  getProgramsByIds,
  PROGRAMS_CATALOG
}

export default {
  setupProgramsCollection,
  getAllActivePrograms,
  getAvailableProgramsForTier,
  getTierDisplayInfo,
  validateProgramSelection,
  calculateProgramPricing,
  PROGRAMS_CATALOG
}