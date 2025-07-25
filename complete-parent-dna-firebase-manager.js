// complete-parent-dna-firebase-manager.js
// READY TO IMPORT: Complete Parent DNA System with Psychology + Toolkit Integration
import { db } from './lib/firebase'
import { collection, doc, setDoc, getDocs, getDoc, query, where, writeBatch } from 'firebase/firestore'

// Import all the integrated data
import { 
  PARENT_DNA_QUESTIONS,
  INTEGRATED_PARENT_DNA_TYPES,
  PARENT_CHILD_COMPATIBILITY,
  PARENT_GUIDANCE_CONTENT,
  PARENT_DNA_CONFIG,
  SHARED_UTILS
} from './complete-integrated-parent-data'

// COMPLETE FIREBASE IMPORT FUNCTION
const setupCompleteParentDnaSystem = async () => {
  try {
    console.log('🎯 Setting up COMPLETE Parent DNA System (Psychology + Toolkit + Compatibility)...')
    
    // Check existing data across all collections
    const collections = [
      { name: 'parent-dna-questions', ref: collection(db, 'parent-dna-questions') },
      { name: 'parent-dna-types', ref: collection(db, 'parent-dna-types') },
      { name: 'parent-child-compatibility', ref: collection(db, 'parent-child-compatibility') },
      { name: 'parent-guidance-content', ref: collection(db, 'parent-guidance-content') },
      { name: 'parent-dna-config', ref: collection(db, 'parent-dna-config') }
    ]
    
    // Get existing document counts
    const existingData = await Promise.all(
      collections.map(async (col) => ({
        name: col.name,
        snapshot: await getDocs(col.ref)
      }))
    )
    
    const totalExisting = existingData.reduce((sum, col) => sum + col.snapshot.size, 0)
    
    if (totalExisting > 0) {
      const breakdown = existingData
        .map(col => `${col.name}: ${col.snapshot.size}`)
        .join(', ')
      
      const overwrite = window.confirm(
        `Found ${totalExisting} existing Parent DNA documents (${breakdown}). ` +
        `This will COMPLETELY REPLACE all existing data with the new integrated version. Continue?`
      )
      
      if (!overwrite) {
        return { success: false, message: 'Parent DNA setup cancelled by user' }
      }
      
      // Clear all existing data
      console.log(`🗑️ Removing ${totalExisting} existing documents...`)
      const batch = writeBatch(db)
      
      existingData.forEach(col => {
        col.snapshot.forEach(doc => {
          batch.delete(doc.ref)
        })
      })
      
      await batch.commit()
      console.log('✅ Existing data cleared')
    }
    
    let processedCount = 0
    
    // 1. PARENT ASSESSMENT QUESTIONS
    console.log('📝 Adding parent assessment questions...')
    for (const [index, question] of PARENT_DNA_QUESTIONS.entries()) {
      const docId = index.toString().padStart(3, '0')
      await setDoc(doc(db, 'parent-dna-questions', docId), {
        ...question,
        order: index,
        created_date: new Date().toISOString(),
        status: 'active',
        version: PARENT_DNA_CONFIG.version
      })
      console.log(`✅ Question ${index + 1}/${PARENT_DNA_QUESTIONS.length}: ${question.id}`)
      processedCount++
    }
    
    // 2. INTEGRATED PARENT DNA TYPES (Psychology + Toolkit)
    console.log('🧠 Adding integrated parent DNA types (psychology + toolkit)...')
    for (const [typeId, typeData] of Object.entries(INTEGRATED_PARENT_DNA_TYPES)) {
      await setDoc(doc(db, 'parent-dna-types', typeId), {
        ...typeData,
        created_date: new Date().toISOString(),
        status: 'active',
        version: PARENT_DNA_CONFIG.version,
        integration_complete: true
      })
      console.log(`✅ Parent Type: ${typeData.name} (${typeData.emoji})`)
      processedCount++
    }
    
    // 3. PARENT-CHILD COMPATIBILITY MATRIX
    console.log('🤝 Adding parent-child compatibility matrix...')
    let compatibilityCount = 0
    for (const [parentType, childCompatibilities] of Object.entries(PARENT_CHILD_COMPATIBILITY)) {
      for (const [childType, compatData] of Object.entries(childCompatibilities)) {
        const docId = `${parentType}_${childType}`
        await setDoc(doc(db, 'parent-child-compatibility', docId), {
          parentType,
          childType,
          ...compatData,
          created_date: new Date().toISOString(),
          status: 'active',
          version: PARENT_DNA_CONFIG.version
        })
        console.log(`✅ Compatibility: ${parentType} + ${childType} (${compatData.level})`)
        processedCount++
        compatibilityCount++
      }
    }
    
    // 4. PARENT GUIDANCE CONTENT
    console.log('📚 Adding parent guidance content...')
    
    // Child Type Guidance
    for (const [childType, guidance] of Object.entries(PARENT_GUIDANCE_CONTENT.baseTypes)) {
      const docId = `childtype_${childType}`
      await setDoc(doc(db, 'parent-guidance-content', docId), {
        type: 'child_type',
        childType,
        ...guidance,
        created_date: new Date().toISOString(),
        status: 'active',
        version: PARENT_DNA_CONFIG.version
      })
      console.log(`✅ Child Type Guidance: ${guidance.parentName}`)
      processedCount++
    }
    
    // Modifier Guidance
    for (const [modifierId, modifierData] of Object.entries(PARENT_GUIDANCE_CONTENT.modifiers)) {
      const docId = `modifier_${modifierId}`
      await setDoc(doc(db, 'parent-guidance-content', docId), {
        type: 'modifier',
        modifierId,
        ...modifierData,
        created_date: new Date().toISOString(),
        status: 'active',
        version: PARENT_DNA_CONFIG.version
      })
      console.log(`✅ Modifier Guidance: ${modifierData.parentName}`)
      processedCount++
    }
    
    // 5. CONFIGURATION & METADATA
    console.log('⚙️ Adding system configuration...')
    const finalConfig = {
      ...PARENT_DNA_CONFIG,
      setup_date: new Date().toISOString(),
      total_documents: processedCount + 1,
      questions_count: PARENT_DNA_QUESTIONS.length,
      parent_types_count: Object.keys(INTEGRATED_PARENT_DNA_TYPES).length,
      compatibility_pairs_count: compatibilityCount,
      child_types_count: Object.keys(PARENT_GUIDANCE_CONTENT.baseTypes).length,
      modifiers_count: Object.keys(PARENT_GUIDANCE_CONTENT.modifiers).length,
      setup_completed: true
    }
    
    await setDoc(doc(db, 'parent-dna-config', 'current'), finalConfig)
    console.log('✅ Configuration saved')
    processedCount++
    
    // SUCCESS SUMMARY
    console.log('')
    console.log('🎉 COMPLETE PARENT DNA SYSTEM SETUP SUCCESSFUL!')
    console.log('=' .repeat(60))
    console.log(`📊 Total Documents: ${processedCount}`)
    console.log(`❓ Assessment Questions: ${PARENT_DNA_QUESTIONS.length}`)
    console.log(`👥 Parent Types: ${Object.keys(INTEGRATED_PARENT_DNA_TYPES).length}`)
    console.log(`🤝 Compatibility Pairs: ${compatibilityCount}`)
    console.log(`👶 Child Type Guidance: ${Object.keys(PARENT_GUIDANCE_CONTENT.baseTypes).length}`)
    console.log(`🔧 Modifier Guidance: ${Object.keys(PARENT_GUIDANCE_CONTENT.modifiers).length}`)
    console.log(`📅 Version: ${PARENT_DNA_CONFIG.version}`)
    console.log(`🧠 Psychology Included: ✅`)
    console.log(`🛠️ Toolkit Included: ✅`)
    console.log(`🤝 Compatibility Included: ✅`)
    console.log('')
    
    return {
      success: true,
      message: `Successfully imported complete Parent DNA system with ${processedCount} documents`,
      stats: {
        total_documents: processedCount,
        questions: PARENT_DNA_QUESTIONS.length,
        parent_types: Object.keys(INTEGRATED_PARENT_DNA_TYPES).length,
        compatibility_pairs: compatibilityCount,
        child_type_guidance: Object.keys(PARENT_GUIDANCE_CONTENT.baseTypes).length,
        modifier_guidance: Object.keys(PARENT_GUIDANCE_CONTENT.modifiers).length,
        version: PARENT_DNA_CONFIG.version,
        integration_complete: true,
        psychology_included: true,
        toolkit_included: true,
        compatibility_included: true,
        operation: 'complete_parent_system_setup'
      }
    }
    
  } catch (error) {
    console.error('❌ Parent DNA System Setup Error:', error)
    return { 
      success: false, 
      message: `Setup failed: ${error.message}`,
      error: error.stack
    }
  }
}

// GET COMPLETE PARENT DNA STATISTICS
const getCompleteParentDnaStats = async () => {
  try {
    const collections = [
      'parent-dna-questions',
      'parent-dna-types', 
      'parent-child-compatibility',
      'parent-guidance-content',
      'parent-dna-config'
    ]
    
    const snapshots = await Promise.all(
      collections.map(name => getDocs(collection(db, name)))
    )
    
    const stats = {
      total_documents: snapshots.reduce((sum, snap) => sum + snap.size, 0),
      questions: snapshots[0].size,
      parent_types: snapshots[1].size,
      compatibility_pairs: snapshots[2].size,
      guidance_items: snapshots[3].size,
      config_exists: snapshots[4].size > 0,
      version: null,
      setup_date: null,
      integration_complete: false
    }
    
    // Get config details
    if (stats.config_exists) {
      const configDoc = await getDoc(doc(db, 'parent-dna-config', 'current'))
      if (configDoc.exists()) {
        const config = configDoc.data()
        stats.version = config.version
        stats.setup_date = config.setup_date
        stats.integration_complete = config.integration_complete || false
      }
    }
    
    return stats
  } catch (error) {
    console.error('Error getting parent DNA stats:', error)
    return {
      total_documents: 0,
      questions: 0,
      parent_types: 0,
      compatibility_pairs: 0,
      guidance_items: 0,
      config_exists: false,
      version: null,
      setup_date: null,
      integration_complete: false,
      error: error.message
    }
  }
}

// GET PARENT ASSESSMENT FOR QUIZ TAKING
const getParentDnaAssessment = async () => {
  try {
    console.log('📖 Loading parent DNA assessment for quiz...')
    
    const questionsRef = collection(db, 'parent-dna-questions')
    const questionsQuery = query(questionsRef, where('status', '==', 'active'))
    const questionsSnapshot = await getDocs(questionsQuery)
    
    const questions = []
    questionsSnapshot.forEach((doc) => {
      const data = doc.data()
      questions.push({
        id: data.id,
        question: data.question,
        researchBase: data.researchBase,
        options: data.options,
        order: data.order
      })
    })
    
    // Sort by order
    questions.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    return { 
      questions,
      totalQuestions: questions.length,
      estimatedMinutes: PARENT_DNA_CONFIG.estimated_time_minutes
    }
  } catch (error) {
    console.error('Error loading parent DNA assessment:', error)
    return { 
      questions: [],
      totalQuestions: 0,
      estimatedMinutes: 0,
      error: error.message
    }
  }
}

// GET INTEGRATED PARENT DNA TYPES FOR RESULTS
const getIntegratedParentDnaTypes = async () => {
  try {
    const typesRef = collection(db, 'parent-dna-types')
    const typesQuery = query(typesRef, where('status', '==', 'active'))
    const typesSnapshot = await getDocs(typesQuery)
    
    const types = {}
    typesSnapshot.forEach((doc) => {
      const data = doc.data()
      types[data.id] = data
    })
    
    return types
  } catch (error) {
    console.error('Error loading parent DNA types:', error)
    return {}
  }
}

// GET PARENT-CHILD COMPATIBILITY
const getParentChildCompatibility = async (parentType, childType) => {
  try {
    const docId = `${parentType}_${childType}`
    const compatRef = doc(db, 'parent-child-compatibility', docId)
    const compatSnapshot = await getDoc(compatRef)
    
    if (compatSnapshot.exists()) {
      return compatSnapshot.data()
    }
    
    return null
  } catch (error) {
    console.error('Error loading parent-child compatibility:', error)
    return null
  }
}

// GET ALL COMPATIBILITY PAIRS FOR A PARENT TYPE
const getAllCompatibilityForParent = async (parentType) => {
  try {
    const compatRef = collection(db, 'parent-child-compatibility')
    const compatQuery = query(compatRef, where('parentType', '==', parentType), where('status', '==', 'active'))
    const compatSnapshot = await getDocs(compatQuery)
    
    const compatibilities = {}
    compatSnapshot.forEach((doc) => {
      const data = doc.data()
      compatibilities[data.childType] = data
    })
    
    return compatibilities
  } catch (error) {
    console.error('Error loading compatibility data:', error)
    return {}
  }
}

// GET PARENT GUIDANCE FOR CHILD TYPE
const getParentGuidanceForChild = async (childType, modifiers = []) => {
  try {
    // Get base child type guidance
    const baseRef = doc(db, 'parent-guidance-content', `childtype_${childType}`)
    const baseSnapshot = await getDoc(baseRef)
    
    let baseGuidance = null
    if (baseSnapshot.exists()) {
      baseGuidance = baseSnapshot.data()
    }
    
    // Get modifier guidance
    const modifierGuidance = []
    for (const modifier of modifiers) {
      const modRef = doc(db, 'parent-guidance-content', `modifier_${modifier}`)
      const modSnapshot = await getDoc(modRef)
      if (modSnapshot.exists()) {
        modifierGuidance.push(modSnapshot.data())
      }
    }
    
    return {
      baseGuidance,
      modifierGuidance,
      hasGuidance: baseGuidance !== null || modifierGuidance.length > 0
    }
  } catch (error) {
    console.error('Error loading parent guidance:', error)
    return {
      baseGuidance: null,
      modifierGuidance: [],
      hasGuidance: false,
      error: error.message
    }
  }
}

// CALCULATE PARENT DNA TYPE FROM RESPONSES
const calculateParentDNAType = (responses) => {
  return SHARED_UTILS.calculateParentDNAType(responses)
}

// FORMAT DNA CODE
const formatDNACode = (readingDNA) => {
  return SHARED_UTILS.formatDNACode(readingDNA)
}

// VALIDATE SETUP
const validateParentDnaSetup = async () => {
  try {
    const stats = await getCompleteParentDnaStats()
    
    const validation = {
      isValid: true,
      issues: [],
      recommendations: []
    }
    
    // Check if setup is complete
    if (stats.total_documents === 0) {
      validation.isValid = false
      validation.issues.push('No Parent DNA data found - run setupCompleteParentDnaSystem()')
    }
    
    // Check for minimum required documents
    const minimums = {
      questions: 5,
      parent_types: 6,
      compatibility_pairs: 10,
      guidance_items: 10
    }
    
    Object.entries(minimums).forEach(([key, minCount]) => {
      if (stats[key] < minCount) {
        validation.isValid = false
        validation.issues.push(`Only ${stats[key]} ${key} found, expected at least ${minCount}`)
      }
    })
    
    // Check integration status
    if (!stats.integration_complete) {
      validation.recommendations.push('Integration may not be complete - verify data structure')
    }
    
    // Check version
    if (!stats.version) {
      validation.recommendations.push('No version information found - may need to re-import')
    }
    
    return {
      ...validation,
      stats,
      summary: validation.isValid 
        ? `✅ Parent DNA system is valid (${stats.total_documents} documents)` 
        : `❌ Parent DNA system has ${validation.issues.length} issues`
    }
  } catch (error) {
    return {
      isValid: false,
      issues: [`Validation failed: ${error.message}`],
      recommendations: ['Check Firebase connection and permissions'],
      stats: null,
      summary: '❌ Validation failed due to error'
    }
  }
}

// EXPORT ALL FUNCTIONS
export {
  // Setup & Management
  setupCompleteParentDnaSystem,
  getCompleteParentDnaStats,
  validateParentDnaSetup,
  
  // Assessment & Results
  getParentDnaAssessment,
  getIntegratedParentDnaTypes,
  calculateParentDNAType,
  
  // Compatibility & Guidance
  getParentChildCompatibility,
  getAllCompatibilityForParent,
  getParentGuidanceForChild,
  
  // Utilities
  formatDNACode
}

// DEFAULT EXPORT
export default {
  setupCompleteParentDnaSystem,
  getCompleteParentDnaStats,
  validateParentDnaSetup,
  getParentDnaAssessment,
  getIntegratedParentDnaTypes,
  calculateParentDNAType,
  getParentChildCompatibility,
  getAllCompatibilityForParent,
  getParentGuidanceForChild,
  formatDNACode
}

// USAGE INSTRUCTIONS
/* 

🚀 TO IMPORT YOUR COMPLETE PARENT DNA SYSTEM:

1. Import this manager:
   import parentDnaManager from './complete-parent-dna-firebase-manager'

2. Run the complete setup:
   const result = await parentDnaManager.setupCompleteParentDnaSystem()
   console.log(result)

3. Validate the setup:
   const validation = await parentDnaManager.validateParentDnaSetup()
   console.log(validation)

4. Use in your app:
   // Get assessment questions
   const assessment = await parentDnaManager.getParentDnaAssessment()
   
   // Calculate parent type from responses
   const parentDNA = parentDnaManager.calculateParentDnaType(responses)
   
   // Get compatibility with child
   const compatibility = await parentDnaManager.getParentChildCompatibility('autonomy_supporter', 'creative_explorer')
   
   // Get guidance for child type
   const guidance = await parentDnaManager.getParentGuidanceForChild('creative_explorer', ['A', 'S'])

📊 WHAT GETS IMPORTED:
- 9 Assessment Questions (psychology-based)
- 6 Integrated Parent Types (psychology + comprehensive toolkit)
- 36+ Parent-Child Compatibility Combinations (realistic insights)
- 6 Child Type Guidance Documents 
- 8 Modifier Guidance Documents
- 1 Configuration Document

Total: ~60+ documents with complete integrated system

*/