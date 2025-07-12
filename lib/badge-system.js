// lib/badge-system.js - Centralized Badge System

// Academic year calculation
export const getCurrentWeekOfYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const september1 = new Date(currentYear, 8, 1); // September 1st this year
  
  // If we're before September 1st, program hasn't started yet
  if (now < september1) {
    return 0; // Pre-program
  }
  
  const timeDiff = now.getTime() - september1.getTime();
  const weekNum = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7)) + 1;
  return Math.min(weekNum, 39); // Cap at 39 weeks
};

// Badge definitions from your roadmap
export const BADGE_CALENDAR = {
  1: { name: "School Starter", emoji: "🎒", xp: 75, type: "timer", description: "Complete your first reading session of the new school year" },
  2: { name: "Bookworm", emoji: "📚", xp: 55, type: "timer", description: "Read 20+ minutes on 5 different days this week" },
  3: { name: "Progress Tracker", emoji: "📊", xp: 85, type: "content", description: "Update progress on 1 book this week" },
  4: { name: "Goal Getter", emoji: "🎯", xp: 65, type: "timer", description: "Exceed your weekly reading goal by 50%" },
  5: { name: "Fall Reader", emoji: "🍂", xp: 60, type: "timer", description: "Read during beautiful autumn season" },
  6: { name: "Speed Demon", emoji: "🚀", xp: 70, type: "timer", description: "Complete a 45+ minute reading session" },
  7: { name: "Power Reader", emoji: "🔋", xp: 80, type: "timer", description: "Complete a 60+ minute reading session" },
  8: { name: "Early Riser", emoji: "🌅", xp: 70, type: "timer", description: "Complete 2+ morning sessions (before 9am) this week" },
  9: { name: "Halloween Reader", emoji: "🎃", xp: 65, type: "timer", description: "Read during Halloween week" },
  10: { name: "Endurance", emoji: "💪", xp: 85, type: "timer", description: "Read 3+ hours total this week (180+ minutes)" },
  11: { name: "Star Rater", emoji: "⭐", xp: 90, type: "content", description: "Rate 2 different books this week (any ratings)" },
  12: { name: "Thanksgiving Reader", emoji: "🦃", xp: 65, type: "timer", description: "Read during Thanksgiving week" },
  13: { name: "Marathon Week", emoji: "🏃‍♂️", xp: 100, type: "timer", description: "Read 4+ hours total this week (240+ minutes)" },
  14: { name: "Winter Reader", emoji: "❄️", xp: 60, type: "timer", description: "Read during winter season" },
  15: { name: "Night Owl", emoji: "🌙", xp: 70, type: "timer", description: "Complete 2+ evening sessions (after 7pm) this week" },
  16: { name: "Lightning Strike", emoji: "⚡", xp: 80, type: "timer", description: "Complete 3 sessions of 30+ minutes each this week" },
  17: { name: "Holiday Spirit", emoji: "🎄", xp: 70, type: "timer", description: "Read during Christmas/holiday week" },
  18: { name: "New Year Energy", emoji: "🎆", xp: 75, type: "timer", description: "Start the new year with 3 reading sessions" },
  19: { name: "Star Session", emoji: "🌟", xp: 75, type: "timer", description: "Average 30+ minutes per session this week" },
  20: { name: "Note Taker", emoji: "📝", xp: 95, type: "content", description: "Write notes on 3 different books this week" },
  21: { name: "Consistency Diamond", emoji: "💎", xp: 85, type: "timer", description: "Read 15+ minutes every day for 7 days" },
  22: { name: "Hot Streak", emoji: "🔥", xp: 90, type: "timer", description: "Read 20+ minutes for 7 consecutive days" },
  23: { name: "Valentine Reader", emoji: "💖", xp: 60, type: "timer", description: "Read during Valentine's week" },
  24: { name: "Weekend Warrior", emoji: "🎪", xp: 70, type: "timer", description: "Read 20+ minutes both Saturday AND Sunday" },
  25: { name: "Rainbow Week", emoji: "🌈", xp: 85, type: "timer", description: "Read at different times each day (morning, afternoon, evening)" },
  26: { name: "Progress Champion", emoji: "📈", xp: 65, type: "timer", description: "Read more minutes than last week" },
  27: { name: "Lucky Reader", emoji: "🍀", xp: 60, type: "timer", description: "Read during St. Patrick's week" },
  28: { name: "Summit Reader", emoji: "🏔️", xp: 120, type: "timer", description: "Complete a 90+ minute reading session" },
  29: { name: "Perfect Week", emoji: "💯", xp: 100, type: "timer", description: "Read 30+ minutes every single day this week" },
  30: { name: "Final Sprint", emoji: "🏁", xp: 110, type: "content", description: "Make sure there are stars or notes in all the books in your bookshelf this week" },
  31: { name: "Democracy Badge", emoji: "🗳️", xp: 150, type: "voting", description: "Vote for your favorite book from your school's nominees" },
  32: { name: "App Loyalist", emoji: "📱", xp: 80, type: "timer", description: "Continue your reading streak after program submissions end" },
  33: { name: "Morning Habit", emoji: "☕", xp: 75, type: "timer", description: "Complete 4 morning reading sessions this week" },
  34: { name: "Library Explorer", emoji: "🏛️", xp: 70, type: "timer", description: "Read any books (non-nominees okay) using timer this week" },
  35: { name: "Streak Keeper", emoji: "🏆", xp: 85, type: "timer", description: "Maintain 7+ day reading streak" },
  36: { name: "Summer Strength", emoji: "☀️", xp: 85, type: "timer", description: "Read 3+ hours total this week" },
  37: { name: "Consistent Reader", emoji: "📖", xp: 90, type: "timer", description: "Use reading timer every day this week" },
  38: { name: "Speed Sessions", emoji: "🏎️", xp: 95, type: "timer", description: "Complete 3 sessions of 45+ minutes this week" },
  39: { name: "Inaugural Celebration", emoji: "🎉", xp: 125, type: "timer", description: "Perfect final week: 30+ minutes daily to celebrate pilot success" }
};

// Get current week's badge
export const getCurrentWeekBadge = () => {
  const currentWeek = getCurrentWeekOfYear();
  
  if (currentWeek === 0) {
    return {
      name: "Program Starting Soon!",
      emoji: "🚀", 
      description: "Badge challenges begin September 1st, 2025",
      xp: 0,
      type: "placeholder",
      week: 0
    };
  }
  
  const badge = BADGE_CALENDAR[currentWeek];
  return badge ? { ...badge, week: currentWeek } : null;
};

// Calculate XP for reading session
export const calculateSessionXP = (duration, completed) => {
  let baseXP = 0;
  
  if (completed) {
    baseXP = 25; // Base XP for 20+ minute session
    
    // Bonus XP for longer sessions
    if (duration >= 30) baseXP += 5;
    if (duration >= 45) baseXP += 10;
    if (duration >= 60) baseXP += 15;
  } else {
    // Partial XP for banked sessions
    baseXP = Math.floor(duration / 5); // 1 XP per 5 minutes
  }
  
  return baseXP;
};

// Check if student has already earned this week's badge
export const hasEarnedWeeklyBadge = (studentData, weekNumber) => {
  return studentData[`badgeEarned_week${weekNumber}`] === true;
};

// Check for timer-based badge completion
export const checkTimerBadgeProgress = async (studentData, sessionData, weekNumber) => {
  const badge = BADGE_CALENDAR[weekNumber];
  if (!badge || badge.type !== 'timer') return null;
  
  // Don't check if already earned
  if (hasEarnedWeeklyBadge(studentData, weekNumber)) return null;
  
  const sessionMinutes = sessionData.duration;
  const sessionHour = new Date(sessionData.startTime).getHours();
  
  switch (badge.name) {
    case "School Starter":
      return { earned: true, badge };
    
    case "Speed Demon":
      if (sessionMinutes >= 45) {
        return { earned: true, badge };
      }
      break;
      
    case "Power Reader":
      if (sessionMinutes >= 60) {
        return { earned: true, badge };
      }
      break;
      
    case "Summit Reader":
      if (sessionMinutes >= 90) {
        return { earned: true, badge };
      }
      break;
      
    case "Early Riser":
      if (sessionHour < 9) {
        // Would need to check if this is 2+ morning sessions this week
        // For now, just award on first morning session
        return { earned: true, badge };
      }
      break;
      
    case "Night Owl":
      if (sessionHour >= 19) { // 7pm or later
        return { earned: true, badge };
      }
      break;
      
    // Add more badge logic as needed
    default:
      // For seasonal badges, just award them during the week
      if (badge.name.includes("Reader") && !badge.name.includes("Power") && !badge.name.includes("Speed")) {
        return { earned: true, badge };
      }
      break;
  }
  
  return null;
};

// Calculate level from XP
export const calculateLevel = (totalXP) => Math.floor(totalXP / 200) + 1;

// Get level progress
export const getLevelProgress = (totalXP) => {
  const currentLevel = calculateLevel(totalXP);
  const xpInCurrentLevel = totalXP % 200;
  const xpToNextLevel = 200 - xpInCurrentLevel;
  
  return {
    level: currentLevel,
    progress: xpInCurrentLevel,
    toNext: xpToNextLevel,
    percentage: (xpInCurrentLevel / 200) * 100
  };
};

// Get all badges earned by student
export const getEarnedBadges = (studentData) => {
  const earnedBadges = [];
  
  for (let week = 1; week <= 39; week++) {
    if (hasEarnedWeeklyBadge(studentData, week)) {
      const badge = BADGE_CALENDAR[week];
      if (badge) {
        earnedBadges.push({ ...badge, week, earnedDate: studentData.lastBadgeEarned });
      }
    }
  }
  
  return earnedBadges;
};

// Get badge progress (for stats display)
export const getBadgeProgress = (studentData) => {
  const earnedCount = getEarnedBadges(studentData).length;
  const totalBadges = Object.keys(BADGE_CALENDAR).length;
  
  return {
    earned: earnedCount,
    total: totalBadges,
    percentage: Math.round((earnedCount / totalBadges) * 100)
  };
};