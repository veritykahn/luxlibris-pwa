// lib/badge-system.js - UPDATED XP SYSTEM (1 XP per minute)

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

// Badge definitions (XP stays the same - creates nice level jumps!)
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

// NEW: 1 XP per minute reading system
export const calculateSessionXP = (durationMinutes, completed) => {
  // Simple: 1 XP per minute read
  return Math.max(1, Math.floor(durationMinutes));
};

// NEW: Fast early level progression
const LEVEL_THRESHOLDS = [
  0,    // Level 1: 0 XP
  20,   // Level 2: 20 XP (1 badge or ~20 min reading)
  65,   // Level 3: 65 XP total (40 more)
  130,  // Level 4: 130 XP total (65 more)  
  220,  // Level 5: 220 XP total (90 more)
  335,  // Level 6: 335 XP total (115 more)
  475,  // Level 7: 475 XP total (140 more)
  640,  // Level 8: 640 XP total (165 more)
  830,  // Level 9: 830 XP total (190 more)
  1045, // Level 10: 1045 XP total (215 more)
  // Continue pattern: each level needs +25 more than previous
];

// Generate higher level thresholds dynamically
const getThresholdForLevel = (level) => {
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level - 1];
  }
  
  // For levels beyond our array, continue the pattern
  let threshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  let increment = 240; // Last increment was 215, so next is 240
  
  for (let i = LEVEL_THRESHOLDS.length + 1; i <= level; i++) {
    threshold += increment;
    increment += 25; // Each level gets +25 harder
    
    // After level 50, make it even harder
    if (i > 50) increment += 25;
    if (i > 100) increment += 50;
    if (i > 150) increment += 75;
    if (i > 200) increment += 100;
  }
  
  return threshold;
};

// Calculate level from XP
export const calculateLevel = (totalXP) => {
  for (let level = 1; level <= 1000; level++) {
    if (totalXP < getThresholdForLevel(level + 1)) {
      return level;
    }
  }
  return 1000; // Max level cap
};

// Get level progress
export const getLevelProgress = (totalXP) => {
  const currentLevel = calculateLevel(totalXP);
  const currentThreshold = getThresholdForLevel(currentLevel);
  const nextThreshold = getThresholdForLevel(currentLevel + 1);
  
  const progressInLevel = totalXP - currentThreshold;
  const xpNeededForLevel = nextThreshold - currentThreshold;
  const percentage = Math.round((progressInLevel / xpNeededForLevel) * 100);
  
  return {
    level: currentLevel,
    progress: progressInLevel,
    toNext: nextThreshold - totalXP,
    percentage: Math.max(0, Math.min(100, percentage)),
    currentThreshold,
    nextThreshold,
    xpNeededForLevel
  };
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

// Check if student has already earned this week's badge
export const hasEarnedWeeklyBadge = (studentData, weekNumber) => {
  return studentData[`badgeEarnedWeek${weekNumber}`] === true;
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

// Get all badges earned by student
export const getEarnedBadges = (studentData) => {
  const earnedBadges = [];
  
  for (let week = 1; week <= 39; week++) {
    if (studentData[`badgeEarnedWeek${week}`] === true) {
      const badge = BADGE_CALENDAR[week];
      if (badge) {
        earnedBadges.push({ 
          ...badge, 
          week, 
          earnedDate: studentData.lastBadgeEarned || new Date()
        });
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