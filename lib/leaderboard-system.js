// lib/leaderboard-system.js - Real Firebase Leaderboard

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Get anonymous leaderboard for student's grade
export const getGradeLeaderboard = async (studentData) => {
  try {
    console.log('🏆 Loading grade leaderboard for:', studentData.grade, 'at school:', studentData.schoolId);
    
    // Get all students in same grade and school
    const studentsRef = collection(db, `entities/${studentData.entityId}/schools/${studentData.schoolId}/students`);
    const gradeQuery = query(studentsRef, where('grade', '==', studentData.grade));
    const gradeSnapshot = await getDocs(gradeQuery);
    
    const students = [];
    
    gradeSnapshot.forEach(doc => {
      const student = doc.data();
      
      // Only include active students with XP data
      if (student.accountStatus === 'active' && student.totalXP !== undefined) {
        students.push({
          id: doc.id,
          totalXP: student.totalXP || 0,
          firstName: student.firstName,
          isCurrentUser: doc.id === studentData.id,
          // Count badges earned
          badgesEarned: getBadgeCount(student),
          // Get weekly XP (you could make this more sophisticated)
          weeklyXP: getWeeklyXP(student)
        });
      }
    });
    
    // Sort by total XP (descending)
    students.sort((a, b) => b.totalXP - a.totalXP);
    
    // Create anonymous rankings
    const rankings = students.map((student, index) => ({
      rank: index + 1,
      displayName: student.isCurrentUser ? 'You!' : `Reader ${index + 1}`,
      totalXP: student.totalXP,
      weeklyXP: student.weeklyXP,
      badgesEarned: student.badgesEarned,
      isCurrentUser: student.isCurrentUser
    }));
    
    console.log('✅ Generated leaderboard with', rankings.length, 'students');
    return rankings;
    
  } catch (error) {
    console.error('❌ Error loading grade leaderboard:', error);
    return [];
  }
};

// Count badges earned by student
const getBadgeCount = (studentData) => {
  let badgeCount = 0;
  
  for (let week = 1; week <= 39; week++) {
    if (studentData[`badgeEarned_week${week}`] === true) {
      badgeCount++;
    }
  }
  
  return badgeCount;
};

// Get weekly XP (simplified - you could make this more accurate)
const getWeeklyXP = (studentData) => {
  // For now, return a portion of total XP as "weekly"
  // You could enhance this by tracking actual weekly XP in Firebase
  const totalXP = studentData.totalXP || 0;
  
  // Simulate weekly XP as recent activity (10-30% of total)
  const weeklyPercentage = 0.15 + (Math.random() * 0.15); // 15-30%
  return Math.floor(totalXP * weeklyPercentage);
};

// Get school-wide leaderboard (for school stats page)
export const getSchoolLeaderboard = async (entityId, schoolId) => {
  try {
    console.log('🏫 Loading school leaderboard for:', schoolId);
    
    const studentsRef = collection(db, `entities/${entityId}/schools/${schoolId}/students`);
    const studentsSnapshot = await getDocs(studentsRef);
    
    const students = [];
    
    studentsSnapshot.forEach(doc => {
      const student = doc.data();
      
      if (student.accountStatus === 'active' && student.totalXP !== undefined) {
        students.push({
          id: doc.id,
          grade: student.grade,
          totalXP: student.totalXP || 0,
          booksThisYear: student.booksSubmittedThisYear || 0,
          badgesEarned: getBadgeCount(student)
        });
      }
    });
    
    // Sort by total XP
    students.sort((a, b) => b.totalXP - a.totalXP);
    
    // Group by grade for display
    const gradeStats = {};
    students.forEach(student => {
      if (!gradeStats[student.grade]) {
        gradeStats[student.grade] = {
          students: 0,
          totalXP: 0,
          totalBooks: 0,
          totalBadges: 0
        };
      }
      
      gradeStats[student.grade].students++;
      gradeStats[student.grade].totalXP += student.totalXP;
      gradeStats[student.grade].totalBooks += student.booksThisYear;
      gradeStats[student.grade].totalBadges += student.badgesEarned;
    });
    
    return {
      topStudents: students.slice(0, 10), // Top 10 anonymous
      gradeStats,
      totalStudents: students.length
    };
    
  } catch (error) {
    console.error('❌ Error loading school leaderboard:', error);
    return { topStudents: [], gradeStats: {}, totalStudents: 0 };
  }
};

// Enhanced bragging rights with badge integration
export const generateEnhancedBraggingRights = (studentData, personalStats, badgeProgress, earnedBadges) => {
  try {
    const achievements = [];
    
    // Badge achievements (highest priority)
    if (earnedBadges.length >= 20) {
      achievements.push(`🏆 Badge Collector - ${earnedBadges.length} badges earned!`);
    } else if (earnedBadges.length >= 10) {
      achievements.push(`🎖️ Badge Hunter - ${earnedBadges.length} badges unlocked!`);
    } else if (earnedBadges.length >= 5) {
      achievements.push(`🏅 Badge Starter - ${earnedBadges.length} badges collected!`);
    }
    
    // Find special badges
    const specialBadges = earnedBadges.filter(badge => 
      badge.xp >= 100 || 
      badge.name.includes('Perfect') ||
      badge.name.includes('Summit') ||
      badge.name.includes('Marathon')
    );
    
    if (specialBadges.length > 0) {
      achievements.push(`⚡ ${specialBadges[0].emoji} ${specialBadges[0].name} achieved!`);
    }
    
    // XP and Level achievements
    const levelInfo = personalStats ? {
      level: Math.floor((studentData.totalXP || 0) / 200) + 1,
      totalXP: studentData.totalXP || 0
    } : { level: 1, totalXP: 0 };
    
    if (levelInfo.level >= 10) {
      achievements.push(`⭐ Level ${levelInfo.level} Reader - ${levelInfo.totalXP} XP earned!`);
    } else if (levelInfo.level >= 5) {
      achievements.push(`🌟 Level ${levelInfo.level} - ${levelInfo.totalXP} total XP!`);
    } else if (levelInfo.totalXP >= 100) {
      achievements.push(`⚡ ${levelInfo.totalXP} XP earned this year!`);
    }
    
    // Reading achievements
    if (personalStats) {
      if (personalStats.booksThisYear >= personalStats.personalGoal) {
        achievements.push(`🎯 Goal Crusher - ${personalStats.booksThisYear}/${personalStats.personalGoal} books!`);
      } else if (personalStats.booksThisYear >= 10) {
        achievements.push(`📚 Bookworm - ${personalStats.booksThisYear} books read this year!`);
      } else if (personalStats.booksThisYear >= 5) {
        achievements.push(`📖 Reader - ${personalStats.booksThisYear} books completed!`);
      }
      
      if (personalStats.currentStreak >= 30) {
        achievements.push(`🔥🔥 30+ Day Streak Master!`);
      } else if (personalStats.currentStreak >= 14) {
        achievements.push(`🔥 ${personalStats.currentStreak}-Day Reading Streak!`);
      } else if (personalStats.currentStreak >= 7) {
        achievements.push(`✨ ${personalStats.currentStreak}-Day Streak Keeper!`);
      }
      
      if (personalStats.readingHours >= 20) {
        achievements.push(`⏰ Time Champion - ${personalStats.readingHours} hours read!`);
      }
    }
    
    // Saints achievements
    const saintsCount = (studentData.unlockedSaints || []).length;
    if (saintsCount >= 50) {
      achievements.push(`♔ Saint Master - ${saintsCount} saints collected!`);
    } else if (saintsCount >= 20) {
      achievements.push(`♔ Saint Collector - ${saintsCount} saints unlocked!`);
    } else if (saintsCount >= 10) {
      achievements.push(`♔ Saint Seeker - ${saintsCount} saints discovered!`);
    }
    
    // Ensure we have at least a few achievements
    if (achievements.length < 3) {
      achievements.push(`🌟 Active Reader this year!`);
      achievements.push(`📚 Building great reading habits!`);
      if (earnedBadges.length > 0) {
        achievements.push(`🏆 Badge earner - ${earnedBadges.length} collected!`);
      }
    }
    
    return {
      topAchievements: achievements.slice(0, 8), // Up to 8 achievements
      studentName: `${studentData.firstName} ${studentData.lastInitial}`,
      schoolName: studentData.schoolName,
      grade: studentData.grade,
      date: new Date().toLocaleDateString(),
      
      // Enhanced stats
      totalXP: levelInfo.totalXP,
      level: levelInfo.level,
      badgesEarned: earnedBadges.length,
      saintsCount: saintsCount,
      currentStreak: personalStats?.currentStreak || 0,
      booksThisYear: personalStats?.booksThisYear || 0,
      
      // Featured achievements
      featuredBadge: earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : null,
      specialBadges: specialBadges.slice(0, 3)
    };
    
  } catch (error) {
    console.error('Error generating enhanced bragging rights:', error);
    return null;
  }
};