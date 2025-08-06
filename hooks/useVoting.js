// hooks/useVoting.js - PERMANENT VOTING: Single favorite + no changes once voted
import { useState, useEffect } from 'react';
import { db, dbHelpers } from '../lib/firebase';
import { doc, updateDoc, getDoc, collection, getDocs, query, where, addDoc, setDoc, increment, arrayUnion } from 'firebase/firestore';
import { checkSpecificContentBadge } from '../lib/badge-system-content';

export const useVoting = (studentData) => {
  const [votingData, setVotingData] = useState({
    eligibleBooks: [],
    currentVote: null, // Single vote instead of array
    maxVotes: 1, // Single favorite
    hasVoted: false,
    loading: true,
    results: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load voting data when component mounts
  useEffect(() => {
    if (studentData) {
      loadVotingData();
    }
  }, [studentData]);

  // Load all voting-related data
  const loadVotingData = async () => {
    try {
      console.log('🗳️ Loading voting data for student:', studentData.firstName);
      
      const currentYear = dbHelpers.getCurrentAcademicYear();
      
      // Get books the student has completed this year
      const bookshelf = studentData.bookshelf || [];
      const completedBooks = bookshelf.filter(book => 
        book.completed && 
        book.status === 'completed' &&
        (book.academicYear === currentYear || !book.academicYear)
      );
      
      console.log(`📚 Found ${completedBooks.length} completed books for voting`);
      
      // Load ALL masterNominees first, then filter by ID (same as getSchoolNomineesEntities)
      console.log('📖 Loading masterNominees collection...');
      const masterNomineesRef = collection(db, 'masterNominees');
      const masterNomineesSnapshot = await getDocs(masterNomineesRef);
      
      // Create a map of book ID to book data
      const bookDataMap = {};
      masterNomineesSnapshot.forEach(doc => {
        const bookData = doc.data();
        if (bookData.id) {
          bookDataMap[bookData.id] = {
            id: bookData.id,
            ...bookData
          };
        }
      });
      
      // Get full book details for eligible books using the map
      const eligibleBooksWithDetails = completedBooks.map(bookEntry => {
        const bookData = bookDataMap[bookEntry.bookId];
        
        if (bookData) {
          return {
            ...bookData,
            completedAt: bookEntry.completedAt,
            rating: bookEntry.rating || 0,
            format: bookEntry.format
          };
        } else {
          console.log(`❌ Book ${bookEntry.bookId} not found in masterNominees`);
          return null;
        }
      }).filter(book => book !== null);
      
      console.log(`✅ ELIGIBLE BOOKS: ${eligibleBooksWithDetails.length}`);
      
      // Get student's single vote for this year
      const existingVotes = studentData.votes?.filter(vote => 
        vote.academicYear === currentYear
      ) || [];
      
      const currentVote = existingVotes.length > 0 ? existingVotes[0] : null; // Take first (should only be one)
      
      setVotingData({
        eligibleBooks: eligibleBooksWithDetails,
        currentVote: currentVote, // Single vote object
        maxVotes: 1,
        hasVoted: currentVote !== null,
        loading: false,
        academicYear: currentYear
      });
      
      console.log('✅ Voting data loaded:', {
        eligible: eligibleBooksWithDetails.length,
        hasVoted: currentVote !== null,
        votedFor: currentVote?.bookId || 'none'
      });
      
    } catch (error) {
      console.error('❌ Error loading voting data:', error);
      setVotingData(prev => ({ ...prev, loading: false }));
    }
  };

  // PERMANENT VOTING: Submit a vote (single favorite + no changes allowed)
  const submitVote = async (bookId) => {
    if (!studentData || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log('🗳️ Submitting PERMANENT vote for book:', bookId);
      
      const currentYear = dbHelpers.getCurrentAcademicYear();
      
      // PERMANENT: Prevent voting if already voted
      if (votingData.hasVoted) {
        throw new Error('You have already cast your vote and cannot change it.');
      }
      
      // Check if book is in eligible list
      if (!votingData.eligibleBooks.some(book => book.id === bookId)) {
        throw new Error('You can only vote for books you have completed');
      }
      
      // Get book details for centralized storage
      const bookDetails = votingData.eligibleBooks.find(book => book.id === bookId);
      
      // Create vote entry
      const newVote = {
        bookId: bookId,
        academicYear: currentYear,
        votedAt: new Date(),
        studentId: studentData.id,
        studentGrade: studentData.grade,
        entityId: studentData.entityId,
        schoolId: studentData.schoolId,
        isPermanent: true // Mark as permanent vote
      };
      
      // HYBRID STORAGE: Update both student document AND centralized collection
      
      // 1. Update student document (for personalization)
      const studentRef = doc(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students`, studentData.id);
      
      await updateDoc(studentRef, {
        votes: [newVote], // Single vote array
        hasVotedThisYear: true, // Flag to prevent future voting
        lastModified: new Date()
      });
      
      // 2. Update centralized vote tracking (for fast results)
      const centralVoteDocId = `${currentYear}-${bookId}`;
      const centralVoteRef = doc(db, 'votes', centralVoteDocId);
      
      try {
        // Try to get existing centralized vote document
        const centralVoteDoc = await getDoc(centralVoteRef);
        
        if (centralVoteDoc.exists()) {
          // Document exists, increment count and add voter
          await updateDoc(centralVoteRef, {
            totalVotes: increment(1),
            voterIds: arrayUnion(studentData.id),
            lastUpdated: new Date()
          });
        } else {
          // Create new centralized vote document
          await setDoc(centralVoteRef, {
            bookId: bookId,
            academicYear: currentYear,
            totalVotes: 1,
            voterIds: [studentData.id],
            bookTitle: bookDetails?.title || 'Unknown Book',
            bookAuthors: bookDetails?.authors || 'Unknown Author',
            bookCoverUrl: bookDetails?.coverImageUrl || null,
            createdAt: new Date(),
            lastUpdated: new Date()
          });
        }
        
        console.log('✅ Centralized vote tracking updated');
        
      } catch (centralError) {
        console.error('❌ Error updating centralized votes (non-critical):', centralError);
        // Don't fail the whole operation if centralized tracking fails
      }
      
      // Update local state
      setVotingData(prev => ({
        ...prev,
        currentVote: newVote,
        hasVoted: true
      }));
      
      // CHECK CORMORANT DEMOCRACY BADGE
      const updatedStudent = {
        ...studentData,
        votes: [newVote]
      };

      const cormorantBadge = await checkSpecificContentBadge(
        updatedStudent, studentData.entityId, studentData.schoolId, "Cormorant Democracy"
      );

      console.log('✅ PERMANENT vote submitted successfully!');

      if (cormorantBadge) {
        return { 
          success: true, 
          badgeEarned: cormorantBadge 
        };
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error submitting vote:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // REMOVED: changeVote function - voting is now permanent!

  // Check if student has voted for a specific book
  const hasVotedForBook = (bookId) => {
    return votingData.currentVote?.bookId === bookId;
  };

  // Get remaining votes (always 0 if voted, 1 if not)
  const getRemainingVotes = () => {
    return votingData.hasVoted ? 0 : 1;
  };

  // Calculate voting progress (0% or 100%)
  const getVotingProgress = () => {
    return votingData.hasVoted ? 100 : 0;
  };

  return {
    votingData,
    isSubmitting,
    submitVote,
    // REMOVED: changeVote - no longer available!
    hasVotedForBook,
    getRemainingVotes,
    getVotingProgress,
    refreshVotingData: loadVotingData
  };
};

export default useVoting;