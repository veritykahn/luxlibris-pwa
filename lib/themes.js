// lib/themes.js - Catholic School Theme System with Liturgical & Seasonal Themes

// Helper function to check if a date is within a range
const isDateInRange = (startMonth, startDay, endMonth, endDay) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  const currentDay = now.getDate();
  
  // Handle year-crossing ranges (like Dec to Jan)
  if (startMonth > endMonth) {
    return (currentMonth >= startMonth && currentDay >= startDay) || 
           (currentMonth <= endMonth && currentDay <= endDay) ||
           (currentMonth > startMonth) ||
           (currentMonth < endMonth);
  }
  
  // Normal date ranges within the same year
  if (currentMonth === startMonth && currentMonth === endMonth) {
    return currentDay >= startDay && currentDay <= endDay;
  }
  if (currentMonth === startMonth) {
    return currentDay >= startDay;
  }
  if (currentMonth === endMonth) {
    return currentDay <= endDay;
  }
  return currentMonth > startMonth && currentMonth < endMonth;
};

// Base themes - always available (RESTORED TO ORIGINAL)
export const baseThemes = {
  classic_lux: {
    name: 'Lux Libris Classic',
    assetPrefix: 'classic_lux',
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  },
  
  darkwood_sports: {
    name: 'Athletic Champion',
    assetPrefix: 'darkwood_sports',
    primary: '#2F5F5F',
    secondary: '#8B2635',
    accent: '#F5DEB3',
    background: '#F5F5DC',
    surface: '#FFF8DC',
    textPrimary: '#2F1B14',
    textSecondary: '#5D4037'
  },
  
  lavender_space: {
    name: 'Cosmic Explorer',
    assetPrefix: 'lavender_space',
    primary: '#8B7AA8',
    secondary: '#9B85C4',
    accent: '#C8B3E8',
    background: '#2A1B3D',
    surface: '#3D2B54',
    textPrimary: '#E8DEFF',
    textSecondary: '#B8A6D9'
  },
  
  mint_music: {
    name: 'Musical Harmony',
    assetPrefix: 'mint_music',
    primary: '#B8E6B8',
    secondary: '#FFB3BA',
    accent: '#FFCCCB',
    background: '#FEFEFE',
    surface: '#F8FDF8',
    textPrimary: '#2E4739',
    textSecondary: '#4A6B57'
  },
  
  pink_plushies: {
    name: 'Kawaii Dreams',
    assetPrefix: 'pink_plushies',
    primary: '#FFB6C1',
    secondary: '#FFC0CB',
    accent: '#FFE4E1',
    background: '#FFF0F5',
    surface: '#FFE4E6',
    textPrimary: '#4A2C2A',
    textSecondary: '#8B4B5C'
  },
  
  teal_anime: {
    name: 'Otaku Paradise',
    assetPrefix: 'teal_anime',
    primary: '#20B2AA',
    secondary: '#48D1CC',
    accent: '#7FFFD4',
    background: '#E0FFFF',
    surface: '#AFEEEE',
    textPrimary: '#2F4F4F',
    textSecondary: '#5F9EA0'
  },
  
  white_nature: {
    name: 'Pure Serenity',
    assetPrefix: 'white_nature',
    primary: '#6B8E6B',
    secondary: '#D2B48C',
    accent: '#F5F5DC',
    background: '#FFFEF8',
    surface: '#FFFFFF',
    textPrimary: '#2F4F2F',
    textSecondary: '#556B2F'
  },
  
  // Classical Monochrome Luxlings™
  little_luminaries: {
    name: 'Luxlings™ Classic',
    assetPrefix: 'little_luminaries',
    primary: '#D0D0D0',        // Light silver (excellent contrast with black text)
    secondary: '#404040',      // Charcoal grey
    accent: '#DAA520',         // Goldenrod accent
    background: '#FFFFFF',     // Pure white background
    surface: '#F8F8F8',        // Near white surface
    textPrimary: '#000000',    // Pure black text
    textSecondary: '#505050'   // Dark grey text (better contrast on light backgrounds)
  }
};

// Seasonal & Liturgical themes - only available during specific dates
export const seasonalThemes = {
  
  // VALENTINE'S - February 1-14 (St. Valentine)
  st_valentine: {
    name: '💝 St. Valentine',
    assetPrefix: 'st_valentine',
    primary: '#E91E63',        // Hot pink
    secondary: '#F8BBD0',      // Light pink
    accent: '#FF1744',         // Red accent
    background: '#FFF0F5',     // Lavender blush
    surface: '#FFE4E9',        // Pale pink
    textPrimary: '#880E4F',    // Deep pink
    textSecondary: '#AD1457',  // Medium pink
    availability: {
      startMonth: 2, startDay: 1,
      endMonth: 2, endDay: 14
    },
    special: true,
    icon: '💝'
  },
  
  // ST. PATRICK - March 10-17
  st_patrick: {
    name: '☘️ St. Patrick',
    assetPrefix: 'st_patrick',
    primary: '#1B5E20',        // Irish green
    secondary: '#43A047',      // Medium green
    accent: '#FFD700',         // Gold
    background: '#E8F5E9',     // Pale green
    surface: '#C8E6C9',        // Light green
    textPrimary: '#0D47A1',    // Navy (Irish flag)
    textSecondary: '#2E7D32',  // Forest green
    availability: {
      startMonth: 3, startDay: 10,
      endMonth: 3, endDay: 17
    },
    special: true,
    icon: '☘️'
  },
  
  // LENT - Varies (approximate March 1 - April 10)
  lenten_journey: {
    name: '✝️ Lenten Journey',
    assetPrefix: 'lenten_journey',
    primary: '#6A1B9A',        // Purple (liturgical)
    secondary: '#AB47BC',      // Light purple
    accent: '#9E9E9E',         // Ash grey
    background: '#F3E5F5',     // Very pale purple
    surface: '#E1BEE7',        // Light purple
    textPrimary: '#4A148C',    // Deep purple
    textSecondary: '#6A1B9A',  // Medium purple
    availability: {
      startMonth: 3, startDay: 1,
      endMonth: 4, endDay: 10
    },
    special: true,
    liturgical: true,
    icon: '✝️'
  },
  
  // EASTER - April 11-30 (approximate)
  easter_glory: {
    name: '🐣 Easter Glory',
    assetPrefix: 'easter_glory',
    primary: '#FFD700',        // Gold (resurrection)
    secondary: '#E1BEE7',      // Lavender
    accent: '#81C784',         // Spring green
    background: '#FFFEF7',     // Cream white
    surface: '#FFF9C4',        // Pale yellow
    textPrimary: '#5D4037',    // Brown
    textSecondary: '#7B1FA2',  // Purple
    availability: {
      startMonth: 4, startDay: 11,
      endMonth: 4, endDay: 30
    },
    special: true,
    liturgical: true,
    icon: '🐣'
  },
  
  // MARIAN MAY - May (Month of Mary)
  marian_may: {
    name: '🌹 Marian May',
    assetPrefix: 'marian_may',
    primary: '#42A5F5',        // Marian blue
    secondary: '#90CAF9',      // Light blue
    accent: '#FFB6C1',         // Rose pink
    background: '#E3F2FD',     // Very pale blue
    surface: '#BBDEFB',        // Pale blue
    textPrimary: '#0D47A1',    // Deep blue
    textSecondary: '#1565C0',  // Medium blue
    availability: {
      startMonth: 5, startDay: 1,
      endMonth: 5, endDay: 31
    },
    special: true,
    liturgical: true,
    icon: '🌹'
  },
  
  // SUMMER BEACH - June 15 - July 31
  summer_beach: {
    name: '🏖️ Summer Beach',
    assetPrefix: 'summer_beach',
    primary: '#00ACC1',        // Ocean cyan
    secondary: '#FFB74D',      // Sandy orange
    accent: '#FF7043',         // Coral
    background: '#FFF3E0',     // Cream sand
    surface: '#FFE0B2',        // Peach sand
    textPrimary: '#E65100',    // Burnt orange
    textSecondary: '#006064',  // Dark cyan
    availability: {
      startMonth: 6, startDay: 15,
      endMonth: 7, endDay: 31
    },
    special: true,
    icon: '🏖️'
  },
  
  // BACK TO SCHOOL - August 1-31
  back_to_school: {
    name: '📚 Back to School',
    assetPrefix: 'back_to_school',
    primary: '#2196F3',        // Bright blue (blue pen/folder)
    secondary: '#FF5722',      // Orange (folder/highlighter)
    accent: '#4CAF50',         // Green (marker/folder)
    background: '#FFFFFF',     // White paper
    surface: '#F5F5F5',        // Light grey
    textPrimary: '#212121',    // Black ink
    textSecondary: '#616161',  // Grey pencil
    availability: {
      startMonth: 8, startDay: 1,
      endMonth: 8, endDay: 31
    },
    special: true,
    icon: '📚'
  },
  
  // FALL HARVEST - September 15 - October 15
  autumn_harvest: {
    name: '🍂 Autumn Harvest',
    assetPrefix: 'autumn_harvest',
    primary: '#E65100',        // Pumpkin orange
    secondary: '#795548',      // Tree brown
    accent: '#FFC107',         // Golden leaves
    background: '#FFF3E0',     // Warm cream
    surface: '#FFE0B2',        // Peach
    textPrimary: '#3E2723',    // Dark brown
    textSecondary: '#5D4037',  // Medium brown
    availability: {
      startMonth: 9, startDay: 15,
      endMonth: 10, endDay: 15
    },
    special: true,
    icon: '🍂'
  },
  
  // HALLOWEEN - October 16-31
  spooky_halloween: {
    name: '🎃 Spooky Halloween',
    assetPrefix: 'spooky_halloween',
    primary: '#FF6F00',        // Jack-o-lantern orange
    secondary: '#512DA8',      // Witch purple
    accent: '#76FF03',         // Monster green
    background: '#0D0D0D',     // Midnight black
    surface: '#1A1A1A',        // Dark grey
    textPrimary: '#FFAB00',    // Candy corn yellow
    textSecondary: '#E040FB',  // Purple glow
    availability: {
      startMonth: 10, startDay: 16,
      endMonth: 10, endDay: 31
    },
    special: true,
    icon: '🎃'
  },
  
  // ALL SAINTS - November 1-8
  all_saints: {
    name: '⚜️ All Saints Glory',
    assetPrefix: 'all_saints',
    primary: '#FFD700',        // Gold halos
    secondary: '#4169E1',      // Royal blue
    accent: '#DC143C',         // Martyr red
    background: '#FFFAF0',     // Heaven white
    surface: '#FFF8DC',        // Cornsilk
    textPrimary: '#191970',    // Midnight blue
    textSecondary: '#8B4513',  // Brown (Franciscan)
    availability: {
      startMonth: 11, startDay: 1,
      endMonth: 11, endDay: 8
    },
    special: true,
    liturgical: true,
    icon: '⚜️'
  },
  
  // THANKSGIVING - November 15-30
  thanksgiving: {
    name: '🦃 Thanksgiving',
    assetPrefix: 'thanksgiving',
    primary: '#8D6E63',        // Turkey brown
    secondary: '#FF8A65',      // Cranberry orange
    accent: '#FDD835',         // Corn yellow
    background: '#FFF8E1',     // Cream
    surface: '#FFECB3',        // Light amber
    textPrimary: '#3E2723',    // Dark brown
    textSecondary: '#5D4037',  // Medium brown
    availability: {
      startMonth: 11, startDay: 15,
      endMonth: 11, endDay: 30
    },
    special: true,
    icon: '🦃'
  },
  
  // ADVENT - December 1-24 (purple/pink liturgical colors)
  advent_season: {
    name: '🕯️ Advent Waiting',
    assetPrefix: 'advent_season',
    primary: '#7B1FA2',        // Advent purple
    secondary: '#EC407A',      // Gaudete pink
    accent: '#FFC107',         // Candle flame
    background: '#EDE7F6',     // Pale purple
    surface: '#D1C4E9',        // Light purple
    textPrimary: '#4A148C',    // Deep purple
    textSecondary: '#6A1B9A',  // Medium purple
    availability: {
      startMonth: 12, startDay: 1,
      endMonth: 12, endDay: 24
    },
    special: true,
    liturgical: true,
    icon: '🕯️'
  },
  
  // ST. NICHOLAS/CHRISTMAS - December 6 to January 5
  st_nicholas: {
    name: '🎅 St. Nicholas',
    assetPrefix: 'st_nicholas',
    primary: '#C62828',        // Christmas red
    secondary: '#2E7D32',      // Christmas green
    accent: '#FFD700',         // Gold star
    background: '#FFFEF7',     // Snow white
    surface: '#FFF9C4',        // Candle glow
    textPrimary: '#1B5E20',    // Dark green
    textSecondary: '#B71C1C',  // Dark red
    availability: {
      startMonth: 12, startDay: 6,
      endMonth: 1, endDay: 5
    },
    special: true,
    liturgical: true,
    icon: '🎅'
  },
  
  // WINTER WONDERLAND - December 25 to January 6
  winter_frost: {
    name: '❄️ Winter Frost',
    assetPrefix: 'winter_frost',
    primary: '#00BCD4',        // Ice blue
    secondary: '#B2EBF2',      // Frost blue
    accent: '#E0F7FA',         // Snow white
    background: '#E1F5FE',     // Pale ice
    surface: '#B3E5FC',        // Light ice
    textPrimary: '#01579B',    // Deep blue
    textSecondary: '#0277BD',  // Medium blue
    availability: {
      startMonth: 12, startDay: 25,
      endMonth: 1, endDay: 6
    },
    special: true,
    icon: '❄️'
  },
  
  // EPIPHANY - January 6-13 (Three Kings)
  epiphany_kings: {
    name: '👑 Epiphany Kings',
    assetPrefix: 'epiphany_kings',
    primary: '#FFD700',        // Gold
    secondary: '#8B4513',      // Frankincense
    accent: '#8B0000',         // Myrrh
    background: '#001F3F',     // Night sky
    surface: '#003366',        // Dark blue
    textPrimary: '#FFE4B5',    // Star light
    textSecondary: '#F0E68C',  // Pale gold
    availability: {
      startMonth: 1, startDay: 6,
      endMonth: 1, endDay: 13
    },
    special: true,
    liturgical: true,
    icon: '👑'
  }
};

// Get all currently available themes (base + seasonal)
export const getAvailableThemes = () => {
  const available = { ...baseThemes };
  
  // Check each seasonal theme
  Object.keys(seasonalThemes).forEach(key => {
    const theme = seasonalThemes[key];
    if (theme.availability) {
      const { startMonth, startDay, endMonth, endDay } = theme.availability;
      if (isDateInRange(startMonth, startDay, endMonth, endDay)) {
        available[key] = theme;
      }
    }
  });
  
  return available;
};

// Get a specific theme (with fallback)
export const getTheme = (themeName) => {
  const availableThemes = getAvailableThemes();
  
  // If the requested theme is available, return it
  if (availableThemes[themeName]) {
    return availableThemes[themeName];
  }
  
  // If it's a seasonal theme that's not currently available, 
  // return the classic theme with a note
  if (seasonalThemes[themeName]) {
    console.log(`🎨 Theme "${themeName}" is not available right now. Using classic theme.`);
    return baseThemes.classic_lux;
  }
  
  // Default fallback
  return baseThemes.classic_lux;
};

// Check if a theme is currently available
export const isThemeAvailable = (themeName) => {
  const availableThemes = getAvailableThemes();
  return !!availableThemes[themeName];
};

// Get seasonal theme announcement (for notifications)
export const getSeasonalThemeAnnouncement = () => {
  const announcements = [];
  
  Object.keys(seasonalThemes).forEach(key => {
    const theme = seasonalThemes[key];
    if (theme.availability) {
      const { startMonth, startDay, endMonth, endDay } = theme.availability;
      if (isDateInRange(startMonth, startDay, endMonth, endDay)) {
        announcements.push({
          key,
          name: theme.name,
          icon: theme.icon,
          message: `${theme.icon} Special ${theme.name} theme is available!`,
          liturgical: theme.liturgical || false
        });
      }
    }
  });
  
  return announcements;
};

// Get upcoming themes (for preview/anticipation)
export const getUpcomingThemes = (daysAhead = 7) => {
  const upcoming = [];
  const now = new Date();
  
  Object.keys(seasonalThemes).forEach(key => {
    const theme = seasonalThemes[key];
    if (theme.availability) {
      const { startMonth, startDay } = theme.availability;
      const themeStart = new Date(now.getFullYear(), startMonth - 1, startDay);
      
      // Handle year transition
      if (themeStart < now) {
        themeStart.setFullYear(now.getFullYear() + 1);
      }
      
      const daysUntil = Math.floor((themeStart - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntil > 0 && daysUntil <= daysAhead) {
        upcoming.push({
          key,
          name: theme.name,
          icon: theme.icon,
          daysUntil,
          liturgical: theme.liturgical || false
        });
      }
    }
  });
  
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
};

// Export all themes for reference (like in settings page)
export const allThemes = {
  ...baseThemes,
  ...seasonalThemes
};

// Helper to determine if background is light or dark
export const isLightBackground = (hexColor) => {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// Get contrasting text color for any background
export const getContrastingTextColor = (backgroundColor) => {
  return isLightBackground(backgroundColor) ? '#000000' : '#FFFFFF';
};

// Check if theme is liturgical
export const isLiturgicalTheme = (themeName) => {
  const theme = seasonalThemes[themeName];
  return theme && theme.liturgical === true;
};

// Default export
export default {
  themes: baseThemes,
  seasonalThemes,
  getAvailableThemes,
  getTheme,
  isThemeAvailable,
  getSeasonalThemeAnnouncement,
  getUpcomingThemes,
  isLiturgicalTheme
};