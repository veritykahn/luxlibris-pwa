// lib/jane-austen-system.js
// Stone Cold Jane Austen quotes and Bible verses system for Family Battle

// ============================================================================
// PROGRAM YEAR UTILITIES (needed for Bible verse selection)
// ============================================================================

/**
 * Get the current program year (June 1 - May 31)
 */
export const getCurrentProgramYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const june1 = new Date(currentYear, 5, 1); // June 1st (month is 0-indexed)
  
  if (now >= june1) {
    return currentYear; // Current program year
  } else {
    return currentYear - 1; // Previous program year
  }
};

/**
 * Get week number within program year (1-52)
 */
export const getProgramWeekNumber = (date = new Date()) => {
  const programYear = getCurrentProgramYear();
  const programStart = new Date(programYear, 5, 1); // June 1st
  
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksDiff = Math.floor((date - programStart) / msPerWeek);
  
  return Math.max(1, Math.min(52, weeksDiff + 1));
};

// ============================================================================
// STONE COLD JANE AUSTEN QUOTES SYSTEM
// ============================================================================

export const JANE_AUSTEN_QUOTES = {
  battleReady: [
    "You seek discourse? Then prepare for the most uncivil of educations.",
    "Pray remove thyself from my parlour, for Stone Cold Jane Austen hath spoken.",
    "If thou art unpleased, I suggest you turn the page and do weep.",
    "You are but an unfinished draft; I am the final edition.",
    "Consider thyself shelved — permanently.",
    "Thy intellect is as thin as a pamphlet.",
    "Even the prologue of thy argument is insufferable.",
    "You've been edited out of relevance.",
    "Your reasoning is fit only for the bargain bin.",
    "A footnote has more substance than thy rhetoric.",
    "You are as insipid as unseasoned porridge.",
    "My quill dismantles thee as easily as parchment tears.",
    "Welcome to the literary arena, where I am the headlining author!",
    "Prepare to receive thy comeuppance in the most elegant manner.",
    "I shall apply the pressure of prose until thou dost surrender.",
    "Dost thou detect the aroma of literary victory cooking?",
    "The battle of wits begins now - though thou dost appear unarmed.",
    "Challenge accepted! Let the words fly like steel!",
    "Time to separate the readers from the mere page-turners!",
    "Your literary education commences NOW!"
  ],
  
  victorious: [
    "The lady has turned the final page — and conquered.",
    "I write my own ending, and it is victorious.",
    "This chapter of competition closes: I stand the victor.",
    "The quill strikes mightier than the sword — and it is mine.",
    "Observe: I conclude this narrative with triumph.",
    "Your character arc ends most unfavourably — mine, in glory.",
    "This book is finished, and so are you.",
    "The final draft bears my signature.",
    "It is most agreeable to conclude with such satisfaction.",
    "I outwrite, outwit, and outlast.",
    "The book closes upon my victory.",
    "Stone Cold Jane Austen has spoken — and thou art done.",
    "Behold! A new champion of letters has emerged!",
    "I remain, as always, thy undisputed sovereign of syntax!",
    "Thus concludes this most satisfying era of literary dominance!",
    "Good heavens! I have quite thoroughly dismantled thy arguments!",
    "Victory tastes sweeter than the finest tea!",
    "And THAT'S the bottom line, because Stone Cold Jane said so!",
    "Consider thyself well and truly EDITED!",
    "Another challenger falls to my literary prowess!"
  ],
  
  encouraging: [
    "Turn the page, for idleness is the enemy.",
    "Read fiercely, as though the quill were your weapon.",
    "Fortune favours the well‑read.",
    "Pray silence, for Jane Austen hath entered the library!",
    "One chapter more, dear reader, and glory is thine.",
    "In this ring of letters, you are a champion.",
    "Your literacy is your legacy.",
    "Let your library be your armory.",
    "A reader is never defeated.",
    "Devour words as the famished devour bread.",
    "Where is my tea? There is conquest to be toasted.",
    "My discourse is sharp, my tea hotter still.",
    "If thou art prepared for literary combat, pray give me thy most enthusiastic affirmation!",
    "What say you? Speak louder! I commanded thee to peruse thy volumes!",
    "The championship of letters lies within thy grasp — seize it with dignity!",
    "Enter ye into the squared circle of scholarship and defend thy intellect!",
    "This domain belongs to thee — guard it with the most vigorous reading!",
    "Art thou prepared to engage in literary fisticuffs with the finest literature?",
    "Rise up, young scholar! Your moment of glory awaits!",
    "Every page turned is a step toward victory!",
    "The battle may be fierce, but thy spirit is fiercer!",
    "Read on, brave soul! Literature needs champions like thee!"
  ]
};

// Bible verses for each week of the program year (June 1 - May 31)
export const WEEKLY_BIBLE_VERSES = [
  "The kingdom of God is at hand. Repent, and believe in the gospel. - Mark 1:15",
  "Come to me, all you who labor and are burdened, and I will give you rest. - Matthew 11:28",
  "I am the vine, you are the branches. - John 15:5",
  "For where your treasure is, there also will your heart be. - Matthew 6:21",
  "Ask and it will be given to you; seek and you will find. - Matthew 7:7",
  "You are the light of the world. - Matthew 5:14",
  "By this everyone will know that you are my disciples, if you have love for one another. - John 13:35",
  "The harvest is abundant but the laborers are few. - Matthew 9:37",
  "Whoever wishes to come after me must deny himself, take up his cross, and follow me. - Matthew 16:24",
  "Faith is the realization of what is hoped for and evidence of things not seen. - Hebrews 11:1",
  "Be still and know that I am God. - Psalm 46:11", // Week 11 - mid-August
  "The Lord is my shepherd; there is nothing I shall want. - Psalm 23:1",
  "Do not be afraid, for I am with you. - Isaiah 43:5",
  "Trust in the Lord with all your heart. - Proverbs 3:5",
  "Let the children come to me, and do not prevent them. - Matthew 19:14",
  "What does it profit a man to gain the whole world and forfeit his soul? - Mark 8:36",
  "Blessed are the poor in spirit, for theirs is the kingdom of heaven. - Matthew 5:3",
  "You shall love the Lord your God with all your heart. - Matthew 22:37",
  "Give and gifts will be given to you. - Luke 6:38",
  "I have come that they might have life and have it more abundantly. - John 10:10",
  "Be merciful, just as your Father is merciful. - Luke 6:36",
  "The Lord is near to the brokenhearted. - Psalm 34:19",
  "In everything give thanks. - 1 Thessalonians 5:18",
  "Your word is a lamp for my feet, a light for my path. - Psalm 119:105",
  "Heaven and earth will pass away, but my words will not pass away. - Mark 13:31",
  "Prepare the way of the Lord, make straight his paths. - Mark 1:3", // Advent Week 26
  "The people who walked in darkness have seen a great light. - Isaiah 9:1",
  "Behold, I am the handmaid of the Lord. - Luke 1:38",
  "Do not be afraid, Mary, for you have found favor with God. - Luke 1:30",
  "A child is born to us, a son is given to us. - Isaiah 9:5", // Christmas Week 30
  "Glory to God in the highest and on earth peace. - Luke 2:14",
  "Behold, the Lamb of God, who takes away the sin of the world. - John 1:29",
  "Speak, Lord, for your servant is listening. - 1 Samuel 3:9",
  "Follow me and I will make you fishers of men. - Matthew 4:19",
  "Your faith has saved you; go in peace. - Luke 7:50",
  "Remember that you are dust, and to dust you shall return. - Genesis 3:19", // Lent Week 36
  "Rend your hearts, not your garments, and return to the Lord. - Joel 2:13",
  "Man does not live by bread alone. - Matthew 4:4",
  "This is my beloved Son. Listen to him. - Mark 9:7",
  "Unless a grain of wheat falls to the ground and dies, it remains just a grain of wheat. - John 12:24",
  "Father, into your hands I commend my spirit. - Luke 23:46",
  "Hosanna! Blessed is he who comes in the name of the Lord! - Mark 11:9", // Holy Week 42
  "This is my body, which will be given for you; do this in memory of me. - Luke 22:19",
  "He is not here, for he has been raised. - Matthew 28:6", // Easter Week 44
  "Peace be with you. - John 20:19",
  "My Lord and my God! - John 20:28",
  "Did not our hearts burn within us? - Luke 24:32",
  "I am the good shepherd. - John 10:11",
  "I will not leave you orphans; I will come to you. - John 14:18",
  "As the Father has sent me, so I send you. - John 20:21",
  "Go, therefore, and make disciples of all nations. - Matthew 28:19",
  "And behold, I am with you always, until the end of the age. - Matthew 28:20"
];

/**
 * Get a Jane Austen quote or Bible verse based on type
 */
export const getJaneAustenQuote = (type = 'encouraging') => {
  // Handle prayerful type with Bible verses
  if (type === 'prayerful') {
    const weekNumber = getProgramWeekNumber();
    // Ensure we stay within bounds (1-52)
    const verseIndex = Math.max(0, Math.min(51, weekNumber - 1));
    return WEEKLY_BIBLE_VERSES[verseIndex];
  }

  // Original quote handling for other types
  const quotes = JANE_AUSTEN_QUOTES[type] || JANE_AUSTEN_QUOTES.encouraging;
  return quotes[Math.floor(Math.random() * quotes.length)];
};

/**
 * Get Jane Austen mode based on day of week
 * Updated schedule:
 * Sunday: Prayerful (Day of Rest with Bible verses)
 * Monday-Tuesday: Encouraging
 * Wednesday-Thursday: Battle Ready
 * Friday-Saturday: Victorious
 */
export const getJaneAustenModeByDay = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  switch (dayOfWeek) {
    case 0: // Sunday - Prayerful Day of Rest
      return 'prayerful';
    case 1: // Monday - Encouraging
    case 2: // Tuesday - Encouraging
      return 'encouraging';
    case 3: // Wednesday - Battle Ready
    case 4: // Thursday - Battle Ready
      return 'battleReady';
    case 5: // Friday - Victorious
    case 6: // Saturday - Victorious
      return 'victorious';
    default:
      return 'encouraging';
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Quote systems
  JANE_AUSTEN_QUOTES,
  WEEKLY_BIBLE_VERSES,
  getJaneAustenQuote,
  getJaneAustenModeByDay,
  
  // Utilities (needed for Bible verse selection)
  getCurrentProgramYear,
  getProgramWeekNumber
};