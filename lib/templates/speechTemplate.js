// lib/templates/speechTemplate.js
// Lux Libris Awards Speech Template
// Update this file each year to customize the speech content

export const generateAwardsSpeech = (schoolName, currentDate, totalBooks, tiersWithStudents, maxBookRequirement) => {
  let speech = `${'='.repeat(60)}\n`
  speech += `LUX LIBRIS AWARDS PRESENTATION\n`
  speech += `${schoolName}\n`
  speech += `${currentDate}\n`
  speech += `${'='.repeat(60)}\n\n`

  // OPENING
  speech += `Good morning, everyone.\n\n`
  
  // INTRODUCTION - Update yearly
  speech += `This year, our school embarked on an amazing journey with Lux Libris—a program whose very name means "light" and "books," reflecting our belief that stories have the power to illuminate the world, helping students grow as readers, thinkers, and disciples.\n\n`
  
  // MISSION STATEMENT - Update yearly
  speech += `Our mission has been simple yet profound: Forming Saints, One Book at a time. Through the Lux Libris platform, our students have explored ${totalBooks} exceptional books carefully curated to form them intellectually, emotionally, and spiritually. They've journeyed through vibrant graphic novels that spark imagination, discovered truths in non-fiction that expand their minds, adventured through chapter books from voices around the globe, encountered timeless classics that connect them to our literary and historical heritage, and deepened their faith through our specially chosen Catholic pick. Together, these ${totalBooks} books read represent stories from every corner of our world—building empathy and understanding, from our Catholic worldview.\n\n`
  
  // PERSONAL JOURNEY - Update yearly
  speech += `At its heart, Lux Libris understands that reading is a deeply personal pilgrimage. Whether a child read one book or all ${totalBooks}, they've grown. They've stretched their imagination, strengthened their spirit, and discovered new horizons. Every single book opened is a victory. Every story embraced is a step toward becoming who God created them to be. In this light, there are no small achievements—only beautiful, unique journeys of growth.\n\n`
  
  // CELEBRATION - Update yearly
  speech += `Today we celebrate not just books read, but a community transformed. We celebrate students who have discovered that in stories—whether set in distant lands or familiar neighborhoods, whether ancient or modern—we find reflections of truth, beauty, and goodness. We celebrate young readers who are learning to see the world through eyes of faith, illuminated by the light of great literature.\n\n`
  
  // AWARDS INTRODUCTION
  speech += `And now, without further ado:\n\n`
  speech += `${'─'.repeat(60)}\n\n`

  // AWARDS LISTING - Dynamic based on tiers
  tiersWithStudents.forEach((tier, index) => {
    if (tier.highestTierStudents.length > 0) {
      const isHighestTier = tier.books === maxBookRequirement
      
      if (isHighestTier) {
        // Special announcement for highest tier (5-year achievement)
        speech += `And finally, having reached the incredible 5-year achievement of ${tier.books} books:\n\n`
      } else {
        // Regular tier announcements
        speech += `Having read ${tier.books} book${tier.books !== 1 ? 's' : ''}:\n\n`
      }
      
      // List student names
      tier.highestTierStudents.forEach((student, idx) => {
        speech += `  • ${student.firstName} ${student.lastInitial}.\n`
      })
      
      speech += `\n`
    }
  })

  // CLOSING
  speech += `${'─'.repeat(60)}\n\n`
  speech += `Congratulations to all our readers!\n\n`
  speech += `[END OF SPEECH]\n`

  return speech
}

// Optional: Add special year-specific messages
export const yearSpecificMessages = {
  '2025-26': {
    introduction: 'In this inaugural year of Lux Libris...',
    closing: 'As we close this first chapter of our Lux Libris journey...'
  },
  '2026-27': {
    introduction: 'Building on last year\'s incredible success...',
    closing: 'Another year of literary excellence...'
  }
  // Add more years as needed
}