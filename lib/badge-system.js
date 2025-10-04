// lib/badge-system.js - CORRECTED 52-WEEK BIRD BADGE SYSTEM (Each Bird Used Once)

// Academic year calculation - NOW STARTS JUNE 1ST
export const getCurrentWeekOfYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const june1 = new Date(currentYear, 5, 1); // June 1st this year
  
  // If we're before June 1st, check if we're in the previous academic year
  if (now < june1) {
    const previousJune1 = new Date(currentYear - 1, 5, 1);
    const timeDiff = now.getTime() - previousJune1.getTime();
    const weekNum = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7)) + 1;
    return Math.min(weekNum, 52);
  }
  
  const timeDiff = now.getTime() - june1.getTime();
  const weekNum = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7)) + 1;
  return Math.min(weekNum, 52); // Cap at 52 weeks
};

// 52-Week Bird Badge Calendar - Each Bird Used Once with Proper Names & Matching Facts
export const BADGE_CALENDAR = {
  // SUMMER LAUNCH WEEKS (June - August) - Weeks 1-13
  1: { 
    name: "Hummingbird Herald", 
    pngName: "hummingbird.png",
    xp: 75, 
    type: "content", 
    description: "Celebrate the new nominee list by adding your first book to your shelf",
    birdFact: "Hummingbirds are the only birds that can fly backwards and their hearts beat 1,200 times per minute during flight."
  },
  2: { 
    name: "Kingfisher Kickoff", 
    pngName: "kingfisher.png", 
    xp: 60, 
    type: "timer", 
    description: "Complete your first 20-minute reading session of summer",
    birdFact: "Kingfishers dive into water at 25 mph and can adjust for light refraction to catch fish with incredible accuracy."
  },
  3: { 
    name: "Cardinal Courage", 
    pngName: "cardinal.png", 
    xp: 70, 
    type: "timer", 
    description: "Read 30+ minutes in a single session this week",
    birdFact: "Only cardinal males are bright red; females are brown to stay camouflaged while sitting on eggs."
  },
  4: { 
    name: "Flamingo Focus", 
    pngName: "flamingo.png", 
    xp: 65, 
    type: "timer", 
    description: "Read on 4 different days this week",
    birdFact: "Flamingos are pink because they eat shrimp and algae rich in carotenoids - zoo flamingos turn white without this diet!"
  },
  5: { 
    name: "Toucan Triumph", 
    pngName: "toucan.png", 
    xp: 80, 
    type: "timer", 
    description: "Complete a 45+ minute reading session",
    birdFact: "The massive colorful bill of a toucan is actually lightweight and works like an air conditioner to regulate body temperature."
  },
  6: { 
    name: "Peacock Pride", 
    pngName: "peacock.png", 
    xp: 75, 
    type: "content", 
    description: "Rate your first book of the summer",
    birdFact: "A peacock's tail feathers can have over 200 iridescent \"eye-spots\" that shimmer with colors that don't exist in any paint."
  },
  7: { 
    name: "Pelican Persistence", 
    pngName: "pelican.png", 
    xp: 85, 
    type: "timer", 
    description: "Read 3+ hours total this week (180+ minutes)",
    birdFact: "A Pelican's throat pouch can hold up to 3 gallons of water - more than their stomach can hold!"
  },
  8: { 
    name: "Macaw Motivation", 
    pngName: "macaw.png", 
    xp: 70, 
    type: "timer", 
    description: "Complete 2+ morning sessions (before 9am) this week",
    birdFact: "Macaws can live over 80 years and have beaks strong enough to crack coconuts and even small bones."
  },
  9: { 
    name: "Albatross Adventure", 
    pngName: "albatross.png", 
    xp: 60, 
    type: "timer", 
    description: "Complete 60+ minutes over 3 reading sessions",
    birdFact: "Albatrosses can soar for hours without flapping and have the longest wingspan of any bird - up to 12 feet!"
  },
  10: { 
    name: "Puffin Power", 
    pngName: "puffin.png", 
    xp: 65, 
    type: "timer", 
    description: "Read during weekend days (Saturday or Sunday)",
    birdFact: "Puffins can hold up to 60 small fish crosswise in their colorful beaks at once without dropping any!"
  },
  11: { 
    name: "Heron Habits", 
    pngName: "heron.png", 
    xp: 90, 
    type: "timer", 
    description: "Read 20+ minutes for 5 consecutive days",
    birdFact: "Herons can stand motionless for over an hour, then strike with lightning speed in 1/10th of a second."
  },
  12: { 
    name: "Duck Dedication", 
    pngName: "duck.png", 
    xp: 95, 
    type: "timer", 
    description: "Read every day this week (7 days straight)",
    birdFact: "Ducks have completely waterproof feathers and can sleep with one eye open to watch for predators."
  },
  13: { 
    name: "Bald Eagle Excellence", 
    pngName: "baldeagle.png", 
    xp: 100, 
    type: "timer", 
    description: "Complete 4+ hours of reading this week (240+ minutes)",
    birdFact: "Bald eagles are not actually bald - their white head feathers just make them appear so from a distance."
  },

  // SCHOOL YEAR BEGINS - FALL WEEKS (September-November) - Weeks 14-25
  14: { 
    name: "Pigeon Starter", 
    pngName: "pigeon.png", 
    xp: 75, 
    type: "timer", 
    description: "Celebrate the new school year with a reading session",
    birdFact: "Pigeons can navigate using Earth's magnetic field and are one of the few animals that can recognize themselves in mirrors."
  },
  15: { 
    name: "Bee-eater Brilliance", 
    pngName: "beeeater.png", 
    xp: 55, 
    type: "timer", 
    description: "Read 20+ minutes on 5 different days this week",
    birdFact: "Bee-eaters catch bees in mid-flight and expertly remove the stinger by rubbing it on branches before eating."
  },
  16: { 
    name: "Woodpecker Wisdom", 
    pngName: "woodpecker.png", 
    xp: 85, 
    type: "content", 
    description: "Track your reading progress on any book you are still reading",
    birdFact: "Woodpeckers have shock-absorbing skulls and tongues that wrap around their brains to prevent damage while hammering."
  },
  17: { 
  name: "Goose Goals", 
  pngName: "goose.png", 
  xp: 65, 
  type: "timer", 
  description: "Read 20% more minutes this week than last week",
  birdFact: "Geese fly in V-formations because each bird gets a lift from the wingtip vortex of the bird ahead, saving 20% energy."
},
  18: { 
    name: "Quetzal Quest", 
    pngName: "quetzal.png", 
    xp: 60, 
    type: "timer", 
    description: "Read during beautiful autumn season",
    birdFact: "Ancient Maya and Aztecs considered the tail feathers of an quetzal to be more valuable than gold and killing one was punishable by death."
  },
  19: { 
    name: "Ostrich Odyssey", 
    pngName: "ostrich.png", 
    xp: 70, 
    type: "timer", 
    description: "Complete a 45+ minute reading session",
    birdFact: "Ostriches can run 45 mph and their eggs are so large that one can make an omelet for 8 people!"
  },
  20: { 
    name: "Bird of Paradise Performance", 
    pngName: "birdofparadise.png", 
    xp: 80, 
    type: "timer", 
    description: "Complete a 60+ minute reading session",
    birdFact: "Male birds of paradise perform elaborate dances and have some of the most spectacular plumage on Earth - their feathers can look like alien creatures!"
  },
  21: { 
    name: "Pheasant Focus", 
    pngName: "pheasant.png", 
    xp: 70, 
    type: "timer", 
    description: "Complete 2+ morning sessions (before 9am) this week",
    birdFact: "Male pheasants have incredibly long, colorful tail feathers that can be over 2 feet long and are shed annually."
  },
  22: { 
    name: "Vulture Victory", 
    pngName: "vulture.png", 
    xp: 65, 
    type: "timer", 
    description: "Read during Halloween week",
    birdFact: "Vultures have the strongest stomach acid of any animal (pH of 1), allowing them to safely digest rotten meat."
  },
  23: { 
    name: "Cassowary Challenge", 
    pngName: "cassowary.png", 
    xp: 85, 
    type: "timer", 
    description: "Read 3+ hours total this week (180+ minutes)",
    birdFact: "Considered the world's most dangerous bird, cassowaries can kill with their dagger-like middle toe claw."
  },
  24: { 
    name: "Raven Ratings", 
    pngName: "raven.png", 
    xp: 90, 
    type: "content", 
    description: "Rate 2 different books this week (any ratings)",
    birdFact: "Ravens can learn to mimic human speech, use tools, and even play games like sliding down snowy hills for fun."
  },
  25: { 
    name: "Penguin Thanksgiving", 
    pngName: "penguin.png", 
    xp: 65, 
    type: "timer", 
    description: "Read during Thanksgiving week",
    birdFact: "Emperor penguins huddle in groups of 5,000+ and rotate positions so everyone gets a turn in the warm center."
  },

  // WINTER WEEKS (December-February) - Weeks 26-38
  26: { 
    name: "Crow Marathon", 
    pngName: "crow.png", 
    xp: 100, 
    type: "timer", 
    description: "Read 4+ hours total this week (240+ minutes)",
    birdFact: "Crows can recognize individual human faces, hold grudges for years, and even pass hatred of specific people to their offspring."
  },
  27: { 
    name: "Swan Serenity", 
    pngName: "swan.png", 
    xp: 60, 
    type: "timer", 
    description: "Read during winter season",
    birdFact: "They mate for life and can live over 20 years, with some pairs staying together for decades."
  },
  28: { 
    name: "Barn Owl Night Reader", 
    pngName: "barnowl.png", 
    xp: 70, 
    type: "timer", 
    description: "Complete 2+ evening sessions (after 7pm) this week",
    birdFact: "Their heart-shaped faces work like satellite dishes, focusing sound waves to their ears with deadly precision."
  },
  29: { 
    name: "Frigate Lightning", 
    pngName: "frigate.png", 
    xp: 80, 
    type: "timer", 
    description: "Complete 3 sessions of 30+ minutes each this week",
    birdFact: "Males inflate their bright red throat pouches like balloons to attract females during mating displays."
  },
  30: { 
    name: "Snowy Owl Scholar", 
    pngName: "snowyowl.png", 
    xp: 70, 
    type: "timer", 
    description: "Read during Christmas/holiday week",
    birdFact: "They have asymmetrical ear openings that help them pinpoint prey moving under thick snow."
  },
  31: { 
    name: "Ibis Inspiration", 
    pngName: "ibis.png", 
    xp: 75, 
    type: "timer", 
    description: "Start the new year with 3 reading sessions",
    birdFact: "Ancient Egyptians considered them sacred and mummified thousands of them as offerings to the god Thoth!"
  },
  32: { 
  name: "Avocet Achievement", 
  pngName: "avocet.png", 
  xp: 75, 
  type: "timer", 
  description: "Average 30+ minutes per session this week",  // UPDATED
  birdFact: "They sweep their upturned bills side to side underwater like living metal detectors to find tiny prey."
},
  33: { 
    name: "Spoonbill Scholar", 
    pngName: "spoonbill.png", 
    xp: 95, 
    type: "content", 
    description: "Write notes on 3 different books this week",
    birdFact: "Their spoon-shaped bills are packed with nerve endings that can detect the tiniest fish movements."
  },
  34: { 
    name: "Shoebill Strength", 
    pngName: "shoebill.png", 
    xp: 85, 
    type: "timer", 
    description: "Read 15+ minutes every day for 7 days",
    birdFact: "They sound like machine guns when they clatter their massive bills together as a greeting!"
  },
  35: { 
    name: "Oystercatcher Streak", 
    pngName: "oystercatcher.png", 
    xp: 90, 
    type: "timer", 
    description: "Read 20+ minutes for 7 consecutive days",
    birdFact: "They use their chisel-like bills to pry open shellfish and can live over 35 years."
  },
  36: { 
    name: "Seagull Sweetheart", 
    pngName: "seagull.png", 
    xp: 60, 
    type: "timer", 
    description: "Read during Valentine's week",
    birdFact: "They can drink both fresh and salt water thanks to special salt-filtering glands above their eyes."
  },
  37: { 
  name: "Secretary Bird Weekend", 
  pngName: "secretarybird.png", 
  xp: 70, 
  type: "timer", 
  description: "Complete 2 reading sessions on weekend days", // Changed from "Read both Saturday AND Sunday"
  birdFact: "They kill venomous snakes by stamping on them with their long, powerful legs like feathered ninjas."
},
  38: { 
  name: "Turnstone Variety", 
  pngName: "turnstone.png", 
  xp: 85, 
  type: "timer", 
  description: "Read during morning, afternoon, AND evening this week",  // UPDATED
  birdFact: "They flip over rocks, seaweed, and debris with their bills to find hidden food underneath."
},

  // SPRING WEEKS (March-May) - Weeks 39-52
 39: { 
  name: "Roller Progress", 
  pngName: "roller.png", 
  xp: 65, 
  type: "timer", 
  description: "Read more minutes this week than last week",  // UPDATED
  birdFact: "They get their name from their spectacular acrobatic rolling flight displays during mating season."
},
  40: { 
    name: "Hoopoe Luck", 
    pngName: "hoopoe.png", 
    xp: 60, 
    type: "timer", 
    description: "Read during St. Patrick's week",
    birdFact: "Baby hoopoes can spray foul-smelling liquid feces at predators as a defense mechanism - nature's stink bomb!"
  },
  41: { 
    name: "Horned Owl Summit", 
    pngName: "hornedowl.png", 
    xp: 120, 
    type: "timer", 
    description: "Complete a 90+ minute reading session",
    birdFact: "They have excellent night vision and can rotate their heads 270 degrees to see behind them."
  },
  42: { 
    name: "Lyre Bird Perfection", 
    pngName: "lyre.png", 
    xp: 100, 
    type: "timer", 
    description: "Read 30+ minutes every single day this week",
    birdFact: "They can mimic almost any sound including chainsaws, car alarms, camera shutters, and other bird calls perfectly."
  },
  43: { 
    name: "Gannet Sprint", 
    pngName: "gannet.png", 
    xp: 110, 
    type: "content", 
    description: "Make sure there are stars or notes in all the books in your bookshelf this week",
    birdFact: "They dive into the ocean from 100 feet high at 60 mph and have air sacs in their necks to cushion impact."
  },
  44: { 
    name: "Cormorant Democracy", 
    pngName: "cormorant.png", 
    xp: 150, 
    type: "voting", 
    description: "Vote for your favorite book from your school's nominees",
    birdFact: "They spread their wings to dry after swimming because their feathers aren't fully waterproof like most water birds."
  },
  45: { 
    name: "Jacana Journey", 
    pngName: "jacana.png", 
    xp: 80, 
    type: "timer", 
    description: "Continue your reading streak after program submissions end",
    birdFact: "They can walk on lily pads thanks to their extremely long toes that distribute their weight."
  },
  46: { 
    name: "Booby Morning", 
    pngName: "booby.png", 
    xp: 75, 
    type: "timer", 
    description: "Complete 4 morning reading sessions this week",
    birdFact: "They have no external nostrils and breathe through their mouths, which also helps them dive underwater."
  },
  47: { 
    name: "Loon Library", 
    pngName: "loon.png", 
    xp: 70, 
    type: "timer", 
    description: "Read any books (non-nominees okay) using timer this week",
    birdFact: "Their haunting calls can be heard up to 3 miles away across a lake and are the sound of wilderness."
  },
  48: { 
    name: "Grebe Streak", 
    pngName: "grebe.png", 
    xp: 85, 
    type: "timer", 
    description: "Maintain 7+ day reading streak",
    birdFact: "They eat their own feathers to help their stomachs digest fish bones and form protective pellets."
  },
  49: { 
    name: "Sandgrouse Summer", 
    pngName: "sandgrouse.png", 
    xp: 85, 
    type: "timer", 
    description: "Read 3+ hours total this week",
    birdFact: "Males can carry water in their specially adapted belly feathers to bring drinks to their chicks in the desert."
  },
  50: { 
    name: "Kiwi Consistency", 
    pngName: "kiwi.png", 
    xp: 90, 
    type: "timer", 
    description: "Use reading timer every day this week",
    birdFact: "They're the only birds with nostrils at the tip of their bills and can smell earthworms underground."
  },
  51: { 
    name: "Roadrunner Speed", 
    pngName: "roadrunner.png", 
    xp: 95, 
    type: "timer", 
    description: "Complete 3 sessions of 45+ minutes this week",
    birdFact: "They can run up to 20 mph and rarely fly, preferring to sprint after lizards and snakes."
  },
  52: { 
    name: "Hornbill Champion", 
    pngName: "hornbill.png", 
    xp: 125, 
    type: "timer", 
    description: "Perfect final week: 30+ minutes daily to celebrate the year's success",
    birdFact: "They seal the female inside a tree cavity during nesting season, leaving only a small opening for the male to pass food."
  }
};

// XP calculation remains the same - 1 XP per minute
export const calculateSessionXP = (durationMinutes, completed) => {
  return Math.max(1, Math.floor(durationMinutes));
};

// Level system remains the same
const LEVEL_THRESHOLDS = [
  0,    // Level 1: 0 XP
  20,   // Level 2: 20 XP
  65,   // Level 3: 65 XP total (40 more)
  130,  // Level 4: 130 XP total (65 more)  
  220,  // Level 5: 220 XP total (90 more)
  335,  // Level 6: 335 XP total (115 more)
  475,  // Level 7: 475 XP total (140 more)
  640,  // Level 8: 640 XP total (165 more)
  830,  // Level 9: 830 XP total (190 more)
  1045, // Level 10: 1045 XP total (215 more)
];

const getThresholdForLevel = (level) => {
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level - 1];
  }
  
  let threshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  let increment = 240;
  
  for (let i = LEVEL_THRESHOLDS.length + 1; i <= level; i++) {
    threshold += increment;
    increment += 25;
    
    if (i > 50) increment += 25;
    if (i > 100) increment += 50;
    if (i > 150) increment += 75;
    if (i > 200) increment += 100;
  }
  
  return threshold;
};

export const calculateLevel = (totalXP) => {
  for (let level = 1; level <= 1000; level++) {
    if (totalXP < getThresholdForLevel(level + 1)) {
      return level;
    }
  }
  return 1000;
};

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

export const getCurrentWeekBadge = () => {
  const currentWeek = getCurrentWeekOfYear();
  
  if (currentWeek === 0) {
    return {
      name: "Program Starting Soon!",
      pngName: "hummingbird.png",
      description: "Badge challenges begin June 1st, 2025",
      xp: 0,
      type: "placeholder",
      week: 0,
      birdFact: "Get ready for an amazing year of reading adventures!"
    };
  }
  
  const badge = BADGE_CALENDAR[currentWeek];
  return badge ? { ...badge, week: currentWeek } : null;
};

export const hasEarnedWeeklyBadge = (studentData, weekNumber) => {
  return studentData[`badgeEarnedWeek${weekNumber}`] === true;
};

// Fixed checkTimerBadgeProgress function with all badge cases
export const checkTimerBadgeProgress = async (studentData, sessionData, weekNumber) => {
  const badge = BADGE_CALENDAR[weekNumber];
  if (!badge || badge.type !== 'timer') return null;
  
  if (hasEarnedWeeklyBadge(studentData, weekNumber)) return null;
  
  const sessionMinutes = sessionData.duration;
  const sessionHour = new Date(sessionData.startTime).getHours();
  const sessionDay = new Date(sessionData.startTime).getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check specific badge requirements
  switch (badge.name) {
    // STARTER BADGES - First session
    case "Hummingbird Herald":
    case "Pigeon Starter":
      return { earned: true, badge };
    
    // 30+ MINUTE SESSION BADGES
    case "Cardinal Courage":
      if (sessionMinutes >= 30) {
        return { earned: true, badge };
      }
      break;
    
    // 45+ MINUTE SESSION BADGES
    case "Toucan Triumph":
    case "Ostrich Odyssey":
      if (sessionMinutes >= 45) {
        return { earned: true, badge };
      }
      break;
    
    // 60+ MINUTE SESSION BADGES
    case "Albatross Adventure":
    case "Bird of Paradise Performance":
      if (sessionMinutes >= 60) {
        return { earned: true, badge };
      }
      break;
    
    // 90+ MINUTE SESSION BADGES
    case "Horned Owl Summit":
      if (sessionMinutes >= 90) {
        return { earned: true, badge };
      }
      break;
    
    // MORNING SESSION BADGES (before 9am)
    case "Macaw Motivation":
    case "Pheasant Focus":
    case "Booby Morning":
      if (sessionHour < 9) {
        return { earned: true, badge };
      }
      break;
    
    // EVENING SESSION BADGES (after 7pm)
    case "Barn Owl Night Reader":
      if (sessionHour >= 19) {
        return { earned: true, badge };
      }
      break;
    
    // WEEKEND READING BADGES
    case "Puffin Power":
    case "Secretary Bird Weekend":
      if (sessionDay === 0 || sessionDay === 6) { // Sunday or Saturday
        return { earned: true, badge };
      }
      break;
    
    // MULTI-DAY/WEEKLY TOTAL BADGES
    // These need to check weekly totals, not just single session
    case "Flamingo Focus": // 4 different days
    case "Pelican Persistence": // 180+ min total
    case "Duck Dedication": // 7 days straight
    case "Bald Eagle Excellence": // 240+ min total
    case "Heron Habits": // 5 consecutive days
    case "Crow Marathon": // 240+ min total
    case "Cassowary Challenge": // 180+ min total
    case "Sandgrouse Summer": // 180+ min total
    case "Lyre Bird Perfection": // 30+ min every day
    case "Oystercatcher Streak": // 20+ min for 7 days
    case "Roadrunner Speed": // 3 sessions of 45+ min
    case "Hornbill Champion": // 30+ min daily final week
    case "Kiwi Consistency": // Use timer every day
    case "Grebe Streak": // 7+ day streak
      // These require weekly analysis - don't award on single session
      return null;
    
    // SEASONAL/HOLIDAY BADGES - Award any timer session during the week
    case "Kingfisher Kickoff":
    case "Quetzal Quest":
    case "Vulture Victory": // Halloween
    case "Penguin Thanksgiving":
    case "Swan Serenity": // Winter
    case "Snowy Owl Scholar": // Christmas
    case "Ibis Inspiration": // New Year
    case "Seagull Sweetheart": // Valentine's
    case "Hoopoe Luck": // St. Patrick's
      // Award for any completed session during these special weeks
      if (sessionData.completed) {
        return { earned: true, badge };
      }
      break;
    
    // IMPROVEMENT/PROGRESS BADGES
case "Goose Goals":
  // This needs weekly comparison - will be checked at end of week
  return null;

case "Roller Progress": // Read more than last week
case "Turnstone Variety": // Different times
case "Avocet Achievement": // Average 30+ min
  // These need comparison logic - don't award on single session
  return null;
    
    // ANY READING SESSION BADGES
    case "Frigate Lightning":
    case "Jacana Journey":
    case "Loon Library":
      // Award for any completed session
      if (sessionData.completed) {
        return { earned: true, badge };
      }
      break;
    
    default:
      // Don't automatically award unknown badges!
      console.warn(`Unknown badge type: ${badge.name}`);
      return null;
  }
  
  return null;
};

export const getEarnedBadges = (studentData) => {
  const earnedBadges = [];
  
  for (let week = 1; week <= 52; week++) {
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

export const getBadgeProgress = (studentData) => {
  const earnedCount = getEarnedBadges(studentData).length;
  const totalBadges = Object.keys(BADGE_CALENDAR).length;
  
  return {
    earned: earnedCount,
    total: totalBadges,
    percentage: Math.round((earnedCount / totalBadges) * 100)
  };
};