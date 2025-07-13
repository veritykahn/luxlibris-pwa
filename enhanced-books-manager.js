// enhanced-books-manager.js - Academic Year System for Books Management
import { db } from './lib/firebase'
import { collection, doc, setDoc, getDocs, query, where, updateDoc, addDoc } from 'firebase/firestore'

// CURRENT ACADEMIC YEAR CONSTANT
const CURRENT_ACADEMIC_YEAR = "2025-26"

// NEW BOOKS TO ADD FOR CURRENT YEAR (empty since user is happy with current 20)
const NEW_BOOKS_TO_ADD = [
  // Add new books here when needed for current academic year
  // Example:
  // {
  //   title: "New Book Title",
  //   author: "Author Name", 
  //   coverImage: "https://yourcdn.com/book.jpg",
  //   totalPages: 250,
  //   isAudiobook: true,
  //   totalMinutes: 300,
  //   platforms: "Audible, Libro.fm",
  //   academicYear: CURRENT_ACADEMIC_YEAR,
  //   status: "active"
  // }
]

// SETUP ACADEMIC YEAR SYSTEM FOR EXISTING BOOKS
const setupAcademicYearSystem = async () => {
  try {
    console.log('📚 Setting up status field for existing books...')
    
    // Get all existing books
    const booksRef = collection(db, 'masterNominees')
    const existingBooks = await getDocs(booksRef)
    
    if (existingBooks.empty) {
      console.log('⚠️ No existing books found in masterNominees collection')
      return {
        success: false,
        message: 'No existing books found to update'
      }
    }
    
    console.log(`📖 Found ${existingBooks.size} existing books to check`)
    
    let updatedCount = 0
    let skippedCount = 0
    
    // Update each existing book with status field only
    for (const bookDoc of existingBooks.docs) {
      try {
        const bookData = bookDoc.data()
        
        // Check if book already has status field
        if (bookData.status) {
          console.log(`⏭️ Skipping "${bookData.title}" - already has status: ${bookData.status}`)
          skippedCount++
          continue
        }
        
        // Only add status field (academicYear already added manually)
        await updateDoc(doc(db, 'masterNominees', bookDoc.id), {
          status: 'active'
        })
        
        console.log(`✅ Updated "${bookData.title}" with status: active`)
        updatedCount++
        
      } catch (error) {
        console.error(`❌ Error updating book ${bookDoc.id}:`, error)
      }
    }
    
    console.log(`🎉 Status field setup complete! Updated: ${updatedCount}, Skipped: ${skippedCount}`)
    
    return {
      success: true,
      message: `Successfully added status field to ${updatedCount} books. Skipped ${skippedCount} books that already had status field.`,
      stats: {
        operation: 'status_field_setup',
        updated: updatedCount,
        skipped: skippedCount,
        total: existingBooks.size
      }
    }
    
  } catch (error) {
    console.error('❌ Error setting up status field:', error)
    return {
      success: false,
      message: 'Setup failed: ' + error.message
    }
  }
}

// ADD CURRENT YEAR NOMINEES
const addCurrentYearNominees = async () => {
  try {
    console.log(`📚 Adding nominees for academic year ${CURRENT_ACADEMIC_YEAR}...`)
    
    if (NEW_BOOKS_TO_ADD.length === 0) {
      console.log('⚠️ No new books to add in NEW_BOOKS_TO_ADD array')
      return {
        success: false,
        message: 'No new books defined to add for current year'
      }
    }
    
    let addedCount = 0
    let skippedCount = 0
    
    for (const newBook of NEW_BOOKS_TO_ADD) {
      try {
        // Get next internal ID for current academic year
        const nextInternalId = await getNextBookIdForYear(CURRENT_ACADEMIC_YEAR)
        
        // Check if book already exists (by title and author)
        const existingBooksQuery = query(
          collection(db, 'masterNominees'),
          where('title', '==', newBook.title),
          where('author', '==', newBook.author)
        )
        const existingBooks = await getDocs(existingBooksQuery)
        
        if (!existingBooks.empty) {
          console.log(`⏭️ Skipping "${newBook.title}" by ${newBook.author} - already exists`)
          skippedCount++
          continue
        }
        
        // Create book document with auto-generated Firebase doc ID and internal ID
        const bookData = {
          ...newBook,
          id: nextInternalId,  // Internal ID field (001, 002, etc.)
          academicYear: CURRENT_ACADEMIC_YEAR,
          status: 'active'
        }
        
        // Use addDoc to let Firebase auto-generate the document ID
        const docRef = await addDoc(collection(db, 'masterNominees'), bookData)
        console.log(`✅ Added "${newBook.title}" by ${newBook.author} with Firebase doc ID: ${docRef.id} and internal ID: ${nextInternalId}`)
        addedCount++
        
      } catch (error) {
        console.error(`❌ Error adding book "${newBook.title}":`, error)
      }
    }
    
    console.log(`🎉 Current year nominees added! Added: ${addedCount}, Skipped: ${skippedCount}`)
    
    return {
      success: true,
      message: `Successfully added ${addedCount} new books for ${CURRENT_ACADEMIC_YEAR}. Skipped ${skippedCount} existing books.`,
      stats: {
        operation: 'add_current_year',
        added: addedCount,
        skipped: skippedCount,
        academicYear: CURRENT_ACADEMIC_YEAR
      }
    }
    
  } catch (error) {
    console.error('❌ Error adding current year nominees:', error)
    return {
      success: false,
      message: 'Add current year failed: ' + error.message
    }
  }
}

// ARCHIVE PREVIOUS YEAR NOMINEES
const archivePreviousYear = async (previousAcademicYear) => {
  try {
    console.log(`📦 Archiving nominees for academic year ${previousAcademicYear}...`)
    
    if (!previousAcademicYear) {
      return {
        success: false,
        message: 'No academic year specified for archiving'
      }
    }
    
    // Get books for the specified academic year that are currently active
    const booksQuery = query(
      collection(db, 'masterNominees'),
      where('academicYear', '==', previousAcademicYear),
      where('status', '==', 'active')
    )
    const booksToArchive = await getDocs(booksQuery)
    
    if (booksToArchive.empty) {
      console.log(`⚠️ No active books found for academic year ${previousAcademicYear}`)
      return {
        success: false,
        message: `No active books found for academic year ${previousAcademicYear}`
      }
    }
    
    console.log(`📦 Found ${booksToArchive.size} books to archive for ${previousAcademicYear}`)
    
    let archivedCount = 0
    
    // Archive each book by updating status
    for (const bookDoc of booksToArchive.docs) {
      try {
        const bookData = bookDoc.data()
        
        await updateDoc(doc(db, 'masterNominees', bookDoc.id), {
          status: 'archived',
          archivedDate: new Date(),
          archivedBy: 'Admin Dashboard'
        })
        
        console.log(`📦 Archived "${bookData.title}" (${bookData.academicYear})`)
        archivedCount++
        
      } catch (error) {
        console.error(`❌ Error archiving book ${bookDoc.id}:`, error)
      }
    }
    
    console.log(`🎉 Archive complete! Archived ${archivedCount} books from ${previousAcademicYear}`)
    
    return {
      success: true,
      message: `Successfully archived ${archivedCount} books from academic year ${previousAcademicYear}`,
      stats: {
        operation: 'archive_year',
        archived: archivedCount,
        academicYear: previousAcademicYear
      }
    }
    
  } catch (error) {
    console.error('❌ Error archiving previous year:', error)
    return {
      success: false,
      message: 'Archive failed: ' + error.message
    }
  }
}

// GET NEXT BOOK ID FOR ACADEMIC YEAR (001, 002, etc. per year)
const getNextBookIdForYear = async (academicYear) => {
  try {
    // Get all books for the specified academic year
    const booksQuery = query(
      collection(db, 'masterNominees'),
      where('academicYear', '==', academicYear)
    )
    const yearBooks = await getDocs(booksQuery)
    
    // Find the highest numeric ID for this year from the internal 'id' field
    let maxId = 0
    yearBooks.forEach((doc) => {
      const bookData = doc.data()
      // Use the internal 'id' field, not the Firebase document ID
      if (bookData.id) {
        const numericId = parseInt(bookData.id, 10)
        if (!isNaN(numericId) && numericId > maxId) {
          maxId = numericId
        }
      }
    })
    
    // Return next ID with leading zeros
    const nextId = (maxId + 1).toString().padStart(3, '0')
    console.log(`📊 Next internal ID for ${academicYear}: ${nextId} (found ${yearBooks.size} existing books)`)
    
    return nextId
    
  } catch (error) {
    console.error('❌ Error getting next book ID:', error)
    // Fallback to simple incremental ID
    return '001'
  }
}

// ADD SINGLE BOOK
const addSingleBook = async (bookData) => {
  try {
    console.log(`➕ Adding single book: "${bookData.title}" by ${bookData.author}`)
    
    // Validate required fields
    if (!bookData.title || !bookData.author) {
      return {
        success: false,
        message: 'Title and author are required fields'
      }
    }
    
    // Check if book already exists
    const existingBooksQuery = query(
      collection(db, 'masterNominees'),
      where('title', '==', bookData.title),
      where('author', '==', bookData.author)
    )
    const existingBooks = await getDocs(existingBooksQuery)
    
    if (!existingBooks.empty) {
      return {
        success: false,
        message: `Book "${bookData.title}" by ${bookData.author} already exists`
      }
    }
    
    // Ensure academic year and status are set
    const completeBookData = {
      ...bookData,
      id: bookData.id, // Keep the internal ID
      academicYear: bookData.academicYear || CURRENT_ACADEMIC_YEAR,
      status: bookData.status || 'active',
      createdDate: new Date(),
      createdBy: 'Admin Dashboard'
    }
    
    // Use addDoc to let Firebase auto-generate the document ID
    const docRef = await addDoc(collection(db, 'masterNominees'), completeBookData)
    
    console.log(`✅ Successfully added "${bookData.title}" with Firebase doc ID: ${docRef.id} and internal ID: ${bookData.id}`)
    
    return {
      success: true,
      message: `Successfully added "${bookData.title}" by ${bookData.author}`,
      stats: {
        operation: 'single_add',
        firebaseDocId: docRef.id,
        internalId: bookData.id,
        academicYear: completeBookData.academicYear
      }
    }
    
  } catch (error) {
    console.error('❌ Error adding single book:', error)
    return {
      success: false,
      message: 'Add single book failed: ' + error.message
    }
  }
}

// GET BOOKS STATISTICS BY ACADEMIC YEAR
const getBooksStats = async () => {
  try {
    const booksRef = collection(db, 'masterNominees')
    const allBooks = await getDocs(booksRef)
    
    const stats = {
      total: 0,
      active: 0,
      archived: 0,
      currentYear: 0,
      byYear: {},
      byStatus: {}
    }
    
    allBooks.forEach((doc) => {
      const book = doc.data()
      stats.total++
      
      // Count by status
      const status = book.status || 'active'
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      
      if (status === 'active') stats.active++
      if (status === 'archived') stats.archived++
      
      // Count by academic year
      const year = book.academicYear || 'unknown'
      stats.byYear[year] = (stats.byYear[year] || 0) + 1
      
      if (year === CURRENT_ACADEMIC_YEAR) stats.currentYear++
    })
    
    return stats
    
  } catch (error) {
    console.error('❌ Error getting books stats:', error)
    return {
      total: 0,
      active: 0,
      archived: 0,
      currentYear: 0,
      byYear: {},
      byStatus: {}
    }
  }
}

// GET BOOKS FOR SPECIFIC ACADEMIC YEAR
const getBooksForYear = async (academicYear) => {
  try {
    const booksQuery = query(
      collection(db, 'masterNominees'),
      where('academicYear', '==', academicYear)
    )
    const yearBooks = await getDocs(booksQuery)
    
    const books = []
    yearBooks.forEach((doc) => {
      books.push({ id: doc.id, ...doc.data() })
    })
    
    return books
    
  } catch (error) {
    console.error(`❌ Error getting books for year ${academicYear}:`, error)
    return []
  }
}

// GET ACTIVE BOOKS ONLY
const getActiveBooks = async () => {
  try {
    const booksQuery = query(
      collection(db, 'masterNominees'),
      where('status', '==', 'active')
    )
    const activeBooks = await getDocs(booksQuery)
    
    const books = []
    activeBooks.forEach((doc) => {
      books.push({ id: doc.id, ...doc.data() })
    })
    
    return books
    
  } catch (error) {
    console.error('❌ Error getting active books:', error)
    return []
  }
}

// GET CURRENT YEAR BOOKS (active books for current academic year)
const getCurrentYearBooks = async () => {
  try {
    const booksQuery = query(
      collection(db, 'masterNominees'),
      where('academicYear', '==', CURRENT_ACADEMIC_YEAR),
      where('status', '==', 'active')
    )
    const currentBooks = await getDocs(booksQuery)
    
    const books = []
    currentBooks.forEach((doc) => {
      books.push({ id: doc.id, ...doc.data() })
    })
    
    return books
    
  } catch (error) {
    console.error('❌ Error getting current year books:', error)
    return []
  }
}

// UTILITY: GET ALL ACADEMIC YEARS
const getAllAcademicYears = async () => {
  try {
    const booksRef = collection(db, 'masterNominees')
    const allBooks = await getDocs(booksRef)
    
    const years = new Set()
    allBooks.forEach((doc) => {
      const book = doc.data()
      if (book.academicYear) {
        years.add(book.academicYear)
      }
    })
    
    return Array.from(years).sort()
    
  } catch (error) {
    console.error('❌ Error getting academic years:', error)
    return []
  }
}

// BULK UPDATE OPERATIONS (if needed for future use)
const bulkUpdateBooks = async (updates) => {
  try {
    console.log(`🔄 Starting bulk update of ${updates.length} books...`)
    
    let updatedCount = 0
    let errorCount = 0
    
    for (const update of updates) {
      try {
        await updateDoc(doc(db, 'masterNominees', update.id), update.data)
        console.log(`✅ Updated book ID: ${update.id}`)
        updatedCount++
      } catch (error) {
        console.error(`❌ Error updating book ${update.id}:`, error)
        errorCount++
      }
    }
    
    console.log(`🎉 Bulk update complete! Updated: ${updatedCount}, Errors: ${errorCount}`)
    
    return {
      success: errorCount === 0,
      message: `Bulk update completed. Updated: ${updatedCount}, Errors: ${errorCount}`,
      stats: {
        operation: 'bulk_update',
        updated: updatedCount,
        errors: errorCount
      }
    }
    
  } catch (error) {
    console.error('❌ Error in bulk update:', error)
    return {
      success: false,
      message: 'Bulk update failed: ' + error.message
    }
  }
}

// EXPORT ALL FUNCTIONS
export {
  setupAcademicYearSystem,
  addCurrentYearNominees,
  archivePreviousYear,
  getNextBookIdForYear,
  addSingleBook,
  getBooksStats,
  getBooksForYear,
  getActiveBooks,
  getCurrentYearBooks,
  getAllAcademicYears,
  bulkUpdateBooks,
  CURRENT_ACADEMIC_YEAR
}

// DEFAULT EXPORT FOR EASIER IMPORTS
export default {
  setupAcademicYearSystem,
  addCurrentYearNominees,
  archivePreviousYear,
  getNextBookIdForYear,
  addSingleBook,
  getBooksStats,
  getBooksForYear,
  getActiveBooks,
  getCurrentYearBooks,
  getAllAcademicYears,
  bulkUpdateBooks,
  CURRENT_ACADEMIC_YEAR
}