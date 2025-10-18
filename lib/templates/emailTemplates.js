// lib/templates/emailTemplates.js
// Parent Email Templates for Lux Libris Program
// Enhanced with warmth, personalization, and dynamic data fields

export const emailTemplates = {
  // Email 1: Beginning of Program (June)
  programStart: {
    title: 'Welcome to Lux Libris - Beginning of Program',
    sendTime: 'Send in June when program opens',
    subject: 'Welcome to Lux Libris - Your Child\'s Reading Adventure Begins! ✨',
    
    // Dynamic fields this template uses:
    dynamicFields: {
      TEACHER_FIRST_NAME: 'Teacher first name',
      TEACHER_LAST_NAME: 'Teacher last name', 
      SCHOOL_NAME: 'School name',
      STUDENT_JOIN_CODE: 'Student join code',
      PARENT_QUIZ_CODE: 'Parent quiz code',
      TOTAL_BOOKS: 'Total number of books selected',
      ACHIEVEMENT_LIST: 'Formatted list of achievement tiers',
      SUBMISSION_OPTIONS: 'List of available submission methods',
      WEBSITE_URL: 'luxlibris.org/role-selector',
      // Teacher must manually add:
      CUSTOM_WELCOME_MESSAGE: '[TEACHER TO ADD: Personal welcome message or summer greeting]',
    },
    
    body: `Dear {{SCHOOL_NAME}} Families,

I hope this message finds you enjoying the beginning of summer! I am absolutely thrilled to welcome you and your child to Lux Libris, our reading program designed to form saints, one book at a time!

{{CUSTOM_WELCOME_MESSAGE}}

This is more than just a summer reading program - it's an invitation to discover stories that spark curiosity, inspire action, and open hearts. Over the next ten months, your child will have access to {{TOTAL_BOOKS}} carefully curated books chosen to help them grow as readers, thinkers, and people of faith.

✨ **Getting Started is Easy!**

**STUDENT JOIN CODE:** {{STUDENT_JOIN_CODE}}
**PARENT QUIZ CODE:** {{PARENT_QUIZ_CODE}}

1. Visit {{WEBSITE_URL}}
2. Have your child create their account using the student join code above
3. Once they're set up, they can generate a parent link code under Settings
4. Use that link to create your own parent account and connect with your child
5. Use the Parent Quiz Code to unlock quizzes from your child's app

💡 On mobile/tablet: Click "Install Now" to add Lux Libris to your home screen for the best experience!

**What Makes This Year Special:**

📚 **{{TOTAL_BOOKS}} Thoughtfully Curated Books** - A beautiful mix of graphic novels, non-fiction, chapter books, picture books, a classic, and a Catholic pick
🎨 **Multiple Reading Formats** - Something for every type of reader
✝️ **Faith-Integrated Journey** - Collect adorable Luxlings™ saints while building literacy skills
🌍 **Books That Open Hearts** - Stories from around the world that celebrate diverse voices and cultivate empathy
🏆 **Real-World Rewards** - The achievements you've always treasured, now with app tracking:

{{ACHIEVEMENT_LIST}}

**How to Submit Books:**

Your child can demonstrate their reading comprehension in multiple ways:
{{SUBMISSION_OPTIONS}}

**What About Screen Time?**

I know this is important to you! The Lux Libris app uses less than 30 minutes of screen time weekly for tracking - but here's the game-changer: during reading time, the Healthy Habits Timer actually **locks** the device. Your child cannot access any other apps, scroll social media, or get distracted. It's technology being used to enforce good, screen-free reading habits!

**A Note on the Leaderboard:**

You decide whether your child competes on the XP Leaderboard. While everything is designed to be positive and anonymous, some students thrive in competition while others may find it stressful. You know what's best for your child, and you can control this in the parent app settings.

**Parent App Features Just for You:**

• Family Battle - challenge your kids to a reading race!
• Reading DNA Lab - discover your family's unique reading patterns
• Detailed information on all nominee books with discussion guides
• Track your own reading (model that lifelong love of books!)
• Connect with multiple children through one family profile

**Summer Reading & Previous Years:**

• If your child reads a Lux Libris nominee over the summer for their school reading project, they can add it to the app and I'll approve it for credit
• If your child completed Lectio books in previous years, please let me know how many years they participated - those achievements will automatically transfer to their Lux Libris record!

**Important Reminders:**

This is a pilot program, and while I've poured my heart into creating something extraordinary, there may be a few little glitches along the way. Your patience and grace as we grow together means the world to me.

I'm here to support you every step of the way. Please reach out with any and all questions - no question is too small!

Together, we're building a joyful culture of literacy at {{SCHOOL_NAME}}. I cannot wait to witness how this program illuminates the hearts and minds of our students, one book at a time.

Happy reading, and thank you for joining me on this adventure!

Warmest wishes and God bless,
{{TEACHER_FIRST_NAME}} {{TEACHER_LAST_NAME}}

P.S. Pro tip: Explore the books together as a family! The parent app has reading guides and discussion questions that make story time even more meaningful. 📖✨`
  },

  // Email 2: Beginning of School Year (Mid-August)
  schoolYearStart: {
    title: 'School Year Begins - Lux Libris Update',
    sendTime: 'Send in mid-August when school starts',
    subject: 'Welcome Back! Let\'s Keep the Reading Magic Going ✨',
    
    dynamicFields: {
      TEACHER_FIRST_NAME: 'Teacher first name',
      TEACHER_LAST_NAME: 'Teacher last name',
      SCHOOL_NAME: 'School name',
      STUDENT_JOIN_CODE: 'Student join code (for new families)',
      PARENT_QUIZ_CODE: 'Parent quiz code',
      ACHIEVEMENT_LIST: 'Formatted list of achievement tiers',
      TOTAL_BOOKS: 'Total number of books selected',
      // Teacher must manually add:
      SUMMER_STATS: '[TEACHER TO ADD: Summer reading statistics - average books read, participation rate, fun highlights]',
      SCHOOL_YEAR_READING_EXPECTATIONS: '[TEACHER TO ADD: How reading fits into homework/library time this year]',
      WEEKLY_READING_GOAL: '[TEACHER TO ADD: Suggested weekly reading time, e.g., "20 minutes daily"]',
    },
    
    body: `Dear {{SCHOOL_NAME}} Families,

Welcome back! I hope you all had a restful and joy-filled summer. As we begin this new school year together, I'm excited to reconnect with our Lux Libris reading community!

**Summer Celebration! 🎉**

{{SUMMER_STATS}}

Thank you for supporting your children's reading over the summer. Every book opened was a victory, and I'm so proud of our readers!

**Continuing the Journey Through March 31st**

The wonderful news is that Lux Libris continues throughout the school year! Students have plenty of time to discover more amazing stories, work toward their reading goals, and collect those adorable Luxlings™ saints.

**For New Families Joining Us:**

Welcome! It's not too late to join the adventure:

**STUDENT JOIN CODE:** {{STUDENT_JOIN_CODE}}
**PARENT QUIZ CODE:** {{PARENT_QUIZ_CODE}}

Visit luxlibris.org/role-selector to get started. Need help? Just reach out - I'm here for you!

**How Reading Fits Into This School Year:**

{{SCHOOL_YEAR_READING_EXPECTATIONS}}

I encourage families to aim for {{WEEKLY_READING_GOAL}}. Remember, the Healthy Habits Timer helps create focused, distraction-free reading time by locking the device during reading sessions!

**Achievement Milestones to Celebrate:**

{{ACHIEVEMENT_LIST}}

**Making the Most of Family Reading Time:**

Some ideas that have worked beautifully for other families:
• Read together before bedtime
• Share favorite moments from books at dinner
• Use the Family Battle feature in the parent app to make it a fun competition
• Explore the Reading DNA Lab together to discover reading patterns
• Ask your child about the Luxlings™ saints they've collected - it's a wonderful conversation starter!

**A Gentle Reminder About "It Came from the Trees":**

This thriller is intentionally aimed at our more mature readers. If your child begins this book and finds it too intense, that's completely okay! Self-awareness about reading comfort zones is a valuable skill. They can submit it with a note explaining their decision, select "Discussion with Librarian," and receive full credit. More guidance is available in your parent app.

**You're Not Alone in This Journey:**

Building reading habits takes a village, and I'm so grateful for your partnership. Every conversation about books, every quiet reading moment, every "just one more chapter" - it all matters. You're doing an incredible job.

Please reach out anytime with questions, concerns, or just to share something wonderful your child discovered in a book!

Remember: Every book opened is a victory in your child's spiritual and intellectual growth. Let's make this school year a beautiful chapter in their reading story!

In Christ,
{{TEACHER_FIRST_NAME}} {{TEACHER_LAST_NAME}}

P.S. Check your parent app regularly - you might be surprised by what your child is reading! And don't forget to track your own reading to model that lifelong love of books. 📚✨`
  },

  // Email 3: One Month Before End (End of February)
  oneMonthReminder: {
    title: 'One Month Remaining - Final Push',
    sendTime: 'Send at end of February (one month before program ends)',
    subject: 'One Month Left - Let\'s Finish Strong! 🌟',
    
    dynamicFields: {
      TEACHER_FIRST_NAME: 'Teacher first name',
      TEACHER_LAST_NAME: 'Teacher last name',
      SCHOOL_NAME: 'School name',
      TOTAL_BOOKS: 'Total number of books selected',
      MIN_BOOKS_REFERENCE: 'Minimum realistic books (1)',
      // Teacher must manually add:
      CLASS_AVERAGE_BOOKS: '[TEACHER TO ADD: Average books read by class]',
      STUDENTS_NEAR_MILESTONE: '[TEACHER TO ADD: Number of students close to next achievement]',
      MOST_POPULAR_BOOK: '[TEACHER TO ADD: Most popular book title]',
      MOST_POPULAR_CATEGORY: '[TEACHER TO ADD: Most popular category]',
      CUSTOM_ENCOURAGEMENT: '[TEACHER TO ADD: Specific encouragement for students close to milestones, or general celebration of class achievements]',
      CERTIFICATE_DATE: '[TEACHER TO ADD: When certificates will be distributed]',
      MASS_DATE: '[TEACHER TO ADD: Date of end-of-year Mass with recognitions]',
    },
    
    body: `Dear {{SCHOOL_NAME}} Families,

Can you believe we're in the final stretch? March 31st is just around the corner, and I'm absolutely amazed by the reading journey our students have taken this year!

**Let's Celebrate How Far We've Come! 🎉**

Class Statistics:
• Average books read: **{{CLASS_AVERAGE_BOOKS}}**
• Students close to their next achievement milestone: **{{STUDENTS_NEAR_MILESTONE}}**
• Class favorite: **{{MOST_POPULAR_BOOK}}**
• Most loved category: **{{MOST_POPULAR_CATEGORY}}**

{{CUSTOM_ENCOURAGEMENT}}

**One Month to Make Magic Happen! ✨**

This final month is the perfect time to:
• Finish books they've started (check that progress slider in the app!)
• Reach for that next achievement tier
• Try a new category they haven't explored yet
• Complete any pending quizzes or book discussions
• Use spring break for extra reading time

**Quick App Tips for These Final Weeks:**

📱 Check your child's bookshelf to see what's in progress
📊 Review their stats page together to visualize how close they are
🏆 Celebrate every submission - each one counts!
⏰ Use the Healthy Habits Timer to make the most of reading time
👪 Try the Family Battle feature for one last reading race!

**Important Dates:**

• **March 31st:** Final day to submit book completions
• **{{CERTIFICATE_DATE}}:** Achievement certificates distributed
• **{{MASS_DATE}}:** End-of-year Mass with special recognitions

**For Students Close to a Milestone:**

If your child is 1-2 books away from their next achievement level, these final weeks are precious! Here are some strategies that work:

• Picture books count and can be read quickly (like our wonderful nominees!)
• Graphic novels are engaging and move quickly
• Set aside dedicated reading time during spring break
• Remember: the goal is joyful reading, not stress. One more book is wonderful, but so is everything they've already accomplished!

**Every Single Book Counts**

I want to be very clear about something: whether your child reads {{MIN_BOOKS_REFERENCE}} book or {{TOTAL_BOOKS}} this year, each story represents growth, effort, and courage. Some of our students faced challenges that made reading harder this year. Some discovered they needed different kinds of books than they thought. Some learned valuable lessons about their reading preferences and boundaries.

All of this is part of becoming a thoughtful, self-aware reader. I'm proud of every single one of them.

**A Note to Parents:**

You've been incredible partners this year. Thank you for:
• Encouraging reading at home
• Supporting quiz completion
• Celebrating each book finished
• Being patient with this pilot program
• Sharing feedback that helps us grow
• Modeling reading in your own lives

Your support has made all the difference.

**Let's Finish This Year Strong!**

One month. So many stories still waiting to be discovered. Let's make these final weeks count - not from pressure, but from the pure joy of reading together!

As always, I'm here for any questions, encouragement, or celebration you need. Let's cross that finish line together!

Faithfully,
{{TEACHER_FIRST_NAME}} {{TEACHER_LAST_NAME}}

P.S. Spring break reading counts too! Pack a book (or three) along with those beach toys or hiking boots. 🏖️📚`
  },

  // Email 4: End of Program (After March 31st)
  programEnd: {
    title: 'Program Complete - Celebration Time',
    sendTime: 'Send after March 31st when program ends',
    subject: 'We Did It! Celebrating an Incredible Year of Reading 🎉',
    
    dynamicFields: {
      TEACHER_FIRST_NAME: 'Teacher first name',
      TEACHER_LAST_NAME: 'Teacher last name',
      SCHOOL_NAME: 'School name',
      ACHIEVEMENT_LIST: 'Formatted list of achievement tiers',
      TOTAL_BOOKS: 'Total number of books selected',
      MIN_BOOKS_REFERENCE: 'Minimum realistic books (varies per student)',
      // Teacher must manually add:
      TOTAL_CLASS_BOOKS: '[TEACHER TO ADD: Total books read by entire class]',
      CLASS_AVERAGE: '[TEACHER TO ADD: Average books per student]',
      MOST_POPULAR_BOOK: '[TEACHER TO ADD: Most popular book title]',
      FAVORITE_CATEGORY: '[TEACHER TO ADD: Favorite category overall]',
      CERTIFICATE_DATE: '[TEACHER TO ADD: When certificates will be distributed in class]',
      MASS_DATE: '[TEACHER TO ADD: Date of end-of-year Mass with awards]',
      PARTY_DATE: '[TEACHER TO ADD: Date of achievement party for qualifying readers]',
      CELEBRATION_HIGHLIGHTS: '[TEACHER TO ADD: Special moments, surprising achievements, or heartwarming stories from the year]',
      PERSONAL_THANK_YOU: '[TEACHER TO ADD: Personal message to families about their specific contributions]',
    },
    
    body: `Dear {{SCHOOL_NAME}} Families,

We did it! 🎉

Another year of Lux Libris is complete, and my heart is absolutely overflowing with pride and gratitude. What an incredible reading journey we've shared!

**Our Year in Review:**

📚 Total books read by our class: **{{TOTAL_CLASS_BOOKS}}**
📊 Average books per student: **{{CLASS_AVERAGE}}**
🌟 Class favorite: **{{MOST_POPULAR_BOOK}}**
❤️ Most loved category: **{{FAVORITE_CATEGORY}}**

{{CELEBRATION_HIGHLIGHTS}}

**Every Child's Journey Matters**

Your child's personal reading story this year has been unique and valuable. Whether they read {{MIN_BOOKS_REFERENCE}} or {{TOTAL_BOOKS}}, they:
• Discovered new worlds between the pages
• Developed as a reader and thinker
• Learned about themselves and their preferences
• Grew in faith through story
• Built skills that will serve them for life

You can see your child's specific achievements in their Lux Libris app, and I encourage you to celebrate together - look at their bookshelf, review the Luxlings™ saints they collected, read through their stats. What a year!

**Our Achievement Milestones:**

{{ACHIEVEMENT_LIST}}

**Celebration Details:**

📅 **{{CERTIFICATE_DATE}}:** Certificates distributed in class
⛪ **{{MASS_DATE}}:** End-of-year Mass with awards presentation
🎊 **{{PARTY_DATE}}:** Achievement party for qualifying students who earned the party milestone (treats, prizes, and a brand new book to keep!)

**Looking Ahead:**

The Lux Libris platform remains available through the summer! Students can:
• Continue reading nominees from this year's list
• Review their achievements and stats
• Keep collecting Luxlings™ saints
• Prepare for next year's adventure

Next year's book selections are being thoughtfully curated right now, and I'm excited to share them with you when the new school year begins!

**A Heartfelt Thank You**

{{PERSONAL_THANK_YOU}}

When families read together, children don't just become better readers - they become more empathetic humans, deeper thinkers, and more faithful disciples. You've given your children an extraordinary gift this year.

**Feedback Welcome!**

This was our pilot year for Lux Libris, and your input helps shape the future of this program. What worked well? What could be better? What would you like to see next year? Please share your thoughts - I'm listening and learning!

**The Most Important Thing**

"Today a reader, tomorrow a leader."

Through Lux Libris, your children haven't just read stories - they've:
• Discovered new worlds and perspectives
• Developed empathy and understanding
• Strengthened their faith
• Grown as disciples of Christ
• Learned that reading is a joyful, lifelong adventure

No matter how many books they read, every story mattered. Every page turned was a victory. Every book completed was a step in their formation.

**Thank You for This Incredible Year**

Thank you for trusting me with this pilot program. Thank you for your patience with the glitches and your enthusiasm for the wins. Thank you for reading alongside your children and for making literacy a family value.

Most of all, thank you for partnering with me in forming saints, one book at a time.

I can't wait to see what next year brings!

With immense gratitude and blessings,
{{TEACHER_FIRST_NAME}} {{TEACHER_LAST_NAME}}

P.S. Don't forget to celebrate your child's achievement at home too - maybe a special treat, extra screen time, or a trip to the bookstore to choose their next great read! Every reader deserves to be celebrated. 🌟📚✨`
  },

  // Email 5: Special Communication About "It Came from the Trees"
  itCameFromTrees: {
    title: 'Special Book Guidance - "It Came from the Trees"',
    sendTime: 'Send in October/November when students begin reading this book',
    subject: 'Supporting Your Reader: A Note About "It Came from the Trees"',
    
    dynamicFields: {
      TEACHER_FIRST_NAME: 'Teacher first name',
      TEACHER_LAST_NAME: 'Teacher last name',
      SCHOOL_NAME: 'School name',
    },
    
    body: `Dear {{SCHOOL_NAME}} Families,

As your children explore this year's book selection, I want to take a moment to discuss one of our nominees that deserves special attention: **"It Came from the Trees" by Ally Russell**.

This compelling mystery-thriller is intentionally aimed at our more mature Lux Libris readers and represents an important milestone in literary development. Many students have expressed genuine excitement about this scarier selection, appreciating the opportunity to explore more sophisticated themes and suspenseful storytelling.

**Supporting Your Reader Through Challenging Content**

For families whose children choose this book, the Lux Libris parent app provides specific reading guidance, including gentle reassurance that the missing girl in the story is found safe.

However, I want to address something equally important: **learning when to pause our reading journey**.

**The Power of Reader Self-Awareness**

Research in developmental literacy shows that one of the most valuable skills young readers can develop is self-awareness about their reading comfort zones. Some students may begin "It Came from the Trees" and discover that while they're intellectually *capable* of reading it, they're not emotionally *ready* for its themes.

**This is not only acceptable - it's educationally valuable.**

There's an important distinction between what is *age-appropriate* and what is *developmentally ready* for each individual child. All books in our Lux Libris collection are carefully vetted as appropriate for grades 4-8. However, developmental readiness varies significantly among readers, and this variation should be celebrated, not discouraged.

**If Your Child Needs to Stop Reading This Book**

If your child begins "It Came from the Trees" and finds they cannot or do not wish to continue, here's what they should do:

1. **Recognize this as a learning moment** - Understanding personal boundaries with literature is a sophisticated reading skill
2. **Complete the submission process** - Move the progress slider to 100% and add a note explaining the book was too intense to finish
3. **Select "Discussion with Librarian"** as the submission type
4. **Receive full credit** - I will review their thoughtful decision and approve it as a completed book toward their reading goal

This process honors both their reading intelligence and emotional wisdom.

**Looking Forward: Enhanced Choice**

Your feedback and your children's experiences are shaping how we grow together. Beginning next year, when we include thriller or horror selections aimed at our older readers, we will simultaneously offer an alternative book specifically chosen for students who prefer different themes.

Students will select one of these two options, maintaining our total of 20 books while empowering families to make choices that best serve their child's current developmental stage. This approach allows students to grow with Lux Libris throughout their reading journey, always feeling both challenged and supported.

**Why This Matters**

Current research shows that student agency in book selection significantly increases both engagement and comprehension. When children feel empowered to make thoughtful decisions about their reading - including the decision to pause when content exceeds their comfort zone - they develop:

• Stronger reading skills
• Better self-awareness  
• Healthy boundaries
• Lifelong positive associations with literature
• The confidence to try challenging content knowing they can stop if needed

**The Bottom Line**

Whether your child:
• Loves "It Came from the Trees" and reads it cover to cover
• Starts it but decides it's not for them right now
• Chooses a different book from the beginning

...they are making smart, thoughtful reading choices. All of these outcomes represent growth, and I'm proud of each one.

**I'm Here to Support You**

If you have any questions about "It Came from the Trees" or any other book in our collection, please don't hesitate to reach out. The parent app also contains detailed book information and discussion guides.

Your partnership in your child's reading journey means everything. Together, we're helping them become confident, discerning, lifelong readers.

Happy reading!

Warmest wishes and God bless,
{{TEACHER_FIRST_NAME}} {{TEACHER_LAST_NAME}}

P.S. Remember to check your Lux Libris parent app for book-specific guidance and your child's reading progress updates! The app is designed to support these exact conversations. 📚✨`
  }
}

// Helper function to determine which email to show based on current date
export const getCurrentEmailTemplate = () => {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const day = now.getDate()
  
  // June (program starts)
  if (month === 6) {
    return 'programStart'
  }
  // Mid-August (school starts)
  else if (month === 8 && day >= 15) {
    return 'schoolYearStart'
  }
  // End of February (one month warning)
  else if (month === 2 && day >= 20) {
    return 'oneMonthReminder'
  }
  // After March 31 (program ends)
  else if (month === 4 || (month === 3 && day === 31)) {
    return 'programEnd'
  }
  // October/November (It Came from Trees guidance)
  else if (month === 10 || month === 11) {
    return 'itCameFromTrees'
  }
  // Default to most relevant based on time of year
  else if (month >= 9 || month <= 2) {
    return 'schoolYearStart' // During school year
  } else {
    return 'programStart' // Default
  }
}

// Helper function to format achievement tiers from teacher data
export const formatAchievementList = (achievementTiers, schoolName) => {
  if (!achievementTiers || achievementTiers.length === 0) {
    return '• Achievement tiers to be configured by your teacher'
  }
  
  return achievementTiers
    .sort((a, b) => a.books - b.books)
    .map(tier => {
      const books = tier.books
      const reward = tier.reward || 'Special recognition'
      
      if (tier.type === 'lifetime') {
        return `• **${books} books (across 5 years):** ${reward}${schoolName ? ` in the ${schoolName} library` : ''}`
      }
      
      return `• **${books} book${books !== 1 ? 's' : ''}:** ${reward}`
    })
    .join('\n')
}

// Helper function to format submission options from teacher data
export const formatSubmissionOptions = (submissionOptions) => {
  if (!submissionOptions) {
    return '• Options to be configured by your teacher'
  }
  
  const options = []
  
  if (submissionOptions.quiz) {
    options.push('• **Quiz** - Answer questions about the book directly in the app')
  }
  if (submissionOptions.discussWithLibrarian) {
    options.push('• **Discussion with Librarian** - Have a conversation about the book in person')
  }
  if (submissionOptions.bookReport) {
    options.push('• **Book Report** - Write a detailed report about what you read')
  }
  if (submissionOptions.createStoryboard) {
    options.push('• **Storyboard** - Create a visual representation of the story')
  }
  if (submissionOptions.presentToTeacher) {
    options.push('• **Present to Teacher** - Share your thoughts in a presentation')
  }
  if (submissionOptions.submitReview) {
    options.push('• **Book Review** - Write and submit a review of the book')
  }
  if (submissionOptions.actOutScene) {
    options.push('• **Act Out a Scene** - Perform a scene from the book')
  }
  
  if (options.length === 0) {
    return '• Submission methods to be configured by your teacher'
  }
  
  return options.join('\n')
}

// Helper function to replace template variables with actual data
export const fillEmailTemplate = (template, teacherData) => {
  let filledBody = template.body
  let filledSubject = template.subject
  
  // Build userData object from teacherData structure
  const userData = {
    TEACHER_FIRST_NAME: teacherData.firstName || '',
    TEACHER_LAST_NAME: teacherData.lastName || '',
    SCHOOL_NAME: teacherData.schoolName || '',
    STUDENT_JOIN_CODE: teacherData.studentJoinCode || '',
    PARENT_QUIZ_CODE: teacherData.parentQuizCode || '',
    TOTAL_BOOKS: teacherData.selectedNominees?.length?.toString() || '20',
    MIN_BOOKS_REFERENCE: '1',
    WEBSITE_URL: 'luxlibris.org/role-selector',
    ACHIEVEMENT_LIST: formatAchievementList(teacherData.achievementTiers, teacherData.schoolName),
    SUBMISSION_OPTIONS: formatSubmissionOptions(teacherData.submissionOptions),
    
    // Keep teacher-customizable fields as placeholders
    ...Object.keys(template.dynamicFields || {})
      .filter(key => template.dynamicFields[key].includes('[TEACHER TO ADD'))
      .reduce((acc, key) => {
        acc[key] = template.dynamicFields[key]
        return acc
      }, {})
  }
  
  // Escape special regex characters in placeholder
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // Replace all placeholders in body
  Object.keys(userData).forEach(key => {
    const placeholder = `{{${key}}}`
    const value = userData[key] || placeholder
    const regex = new RegExp(escapeRegex(placeholder), 'g')
    filledBody = filledBody.replace(regex, value)
  })
  
  // Replace all placeholders in subject
  Object.keys(userData).forEach(key => {
    const placeholder = `{{${key}}}`
    const value = userData[key] || placeholder
    const regex = new RegExp(escapeRegex(placeholder), 'g')
    filledSubject = filledSubject.replace(regex, value)
  })
  
  return {
    ...template,
    subject: filledSubject,
    body: filledBody
  }
}

// Example usage:
// Import your teacher data from Firebase/database
// const teacherData = {
//   firstName: 'Verity',
//   lastName: 'Kahn',
//   schoolName: 'Holy Family',
//   studentJoinCode: 'TXAUST-HOLY-KAHN58-STUDENT',
//   parentQuizCode: 'ODLRPU20',
//   selectedNominees: ['001', '002', '003'... '020'], // 20 books
//   achievementTiers: [
//     { books: 5, reward: 'Recognition at Mass', type: 'basic' },
//     { books: 10, reward: 'Certificate', type: 'basic' },
//     { books: 15, reward: 'Pizza Party', type: 'basic' },
//     { books: 20, reward: 'Medal', type: 'annual' },
//     { books: 100, reward: 'Plaque', type: 'lifetime' }
//   ],
//   submissionOptions: {
//     quiz: true,
//     discussWithLibrarian: true,
//     bookReport: true,
//     createStoryboard: true,
//     presentToTeacher: false,
//     submitReview: false,
//     actOutScene: false
//   }
// }
// 
// // Fill the template with teacher's actual data
// const filledEmail = fillEmailTemplate(emailTemplates.programStart, teacherData)
// 
// // Now filledEmail.body will have:
// // - Real teacher name, school name, join codes
// // - Actual number of books (not hardcoded 20)
// // - Real achievement tiers from their configuration
// // - Actual submission options they've enabled
// // - Placeholders for fields teacher needs to customize manually