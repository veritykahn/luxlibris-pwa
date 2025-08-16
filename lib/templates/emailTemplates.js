// lib/templates/emailTemplates.js
// Parent Email Templates for Lux Libris Program
// Update these templates yearly as needed

export const emailTemplates = {
  // Email 1: Beginning of Program (June)
  programStart: {
    title: 'Welcome to Lux Libris - Beginning of Program',
    sendTime: 'Send in June when program opens',
    subject: 'Welcome to Lux Libris - Your Child\'s Summer Reading Adventure Begins!',
    body: `Dear Parents,

[PLACEHOLDER - Beginning of Program Email]

Welcome to Lux Libris, our school's innovative reading program designed to form saints, one book at a time!

Key Information:
• Program Duration: June 1st - March 31st
• Total Books Available: [NUMBER] carefully curated selections
• Categories: Graphic Novels, Non-Fiction, Chapter Books, Classics, and Catholic Picks
• Access: Your child can log in using their school credentials

What to Expect:
- Your child will have access to our digital library
- They can select books that interest them
- After reading, they'll complete engaging activities
- Progress is tracked throughout the year
- Achievements are celebrated at our end-of-year Mass

Getting Started:
1. Visit [WEBSITE]
2. Use your child's login credentials
3. Explore the library together
4. Set reading goals for the summer

We encourage you to read alongside your child and discuss the stories they discover. Reading together strengthens family bonds and faith.

Questions? Contact your child's teacher or visit our FAQ page.

Blessings,
[TEACHER NAME]
[SCHOOL NAME]`
  },

  // Email 2: Beginning of School Year (Mid-August)
  schoolYearStart: {
    title: 'School Year Begins - Lux Libris Update',
    sendTime: 'Send in mid-August when school starts',
    subject: 'Lux Libris School Year Update - Keep the Reading Momentum Going!',
    body: `Dear Parents,

[PLACEHOLDER - Beginning of School Year Email]

Welcome back to school! As we begin the new academic year, we want to remind you about the exciting Lux Libris reading program.

Summer Progress Update:
• [Customize with class statistics]
• Many students have already discovered amazing stories
• The journey continues through March 31st

School Year Reading:
- Reading continues to be part of homework expectations
- Students can read at their own pace
- Weekly reading time is encouraged
- Library periods will include Lux Libris exploration

Achievement Milestones:
• 5 Books: Recognition at Mass
• 10 Books: Certificate
• 15 Books: Special Party
• 20 Books: Medal
• 100 Books (5-year): Commemorative Plaque

Parent Involvement:
- Ask your child about their current book
- Help them set weekly reading goals
- Celebrate completed books together
- Share favorite stories at dinner

Remember: Every book opened is a victory in your child's spiritual and intellectual growth.

In Christ,
[TEACHER NAME]
[SCHOOL NAME]`
  },

  // Email 3: One Month Before End (End of February)
  oneMonthReminder: {
    title: 'One Month Remaining - Final Push',
    sendTime: 'Send at end of February (one month before program ends)',
    subject: 'Lux Libris - One Month Remaining to Reach Reading Goals!',
    body: `Dear Parents,

[PLACEHOLDER - One Month Before End Email]

Can you believe we're in the final month of this year's Lux Libris program? The deadline of March 31st is approaching quickly!

Current Class Statistics:
• Average books read: [NUMBER]
• Students close to next achievement level: [NUMBER]
• Most popular book category: [CATEGORY]

Final Month Encouragement:
This is the perfect time to help your child:
- Finish books they've started
- Reach for that next achievement tier
- Try a new category they haven't explored
- Complete any pending quizzes or activities

Achievement Status:
[Teacher can customize with specific encouragement]
• Students 1-2 books away from next level
• Opportunities for spring break reading
• Last chance for this year's recognitions

Important Dates:
• March 31st: Final day to submit book completions
• [DATE]: Achievement certificates distributed
• [DATE]: End-of-year Mass with special recognitions

Every Book Counts:
Remember, whether your child reads 1 book or 20, each story is a step in their formation as readers, thinkers, and disciples.

Let's make this final month count!

Faithfully,
[TEACHER NAME]
[SCHOOL NAME]`
  },

  // Email 4: End of Program (After March 31st)
  programEnd: {
    title: 'Program Complete - Celebration Time',
    sendTime: 'Send after March 31st when program ends',
    subject: 'Lux Libris Year Complete - Celebrating Your Child\'s Reading Journey!',
    body: `Dear Parents,

[PLACEHOLDER - End of Program Email]

Congratulations! We've completed another successful year of Lux Libris, and we're thrilled to celebrate your child's reading achievements!

Year in Review:
• Total books read by our class: [NUMBER]
• Average books per student: [NUMBER]
• Most popular book: [TITLE]
• Favorite category: [CATEGORY]

Your Child's Journey:
[Teacher personalizes with child's specific achievements]
• Books completed: [NUMBER]
• Achievement level reached: [LEVEL]
• Favorite discoveries: [Customize]

Celebration Details:
• [DATE]: Certificates distributed in class
• [DATE]: End-of-year Mass with awards presentation
• [DATE]: Achievement party for qualifying students

Looking Ahead:
- Summer reading continues to be available
- Next year's book selections being curated
- Consider setting family reading goals
- Share feedback about this year's program

Thank You:
Your support at home made all the difference. When families read together, children thrive as learners and grow in faith.

A Special Message:
"Today a reader, tomorrow a leader." Through Lux Libris, your children have not just read stories—they've discovered new worlds, developed empathy, strengthened their faith, and grown as disciples of Christ.

Thank you for partnering with us in forming saints, one book at a time.

With gratitude and blessings,
[TEACHER NAME]
[SCHOOL NAME]

P.S. Don't forget to celebrate your child's achievement, no matter how many books they read. Every story matters!`
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
  // Default to most relevant based on time of year
  else if (month >= 9 || month <= 2) {
    return 'schoolYearStart' // During school year
  } else {
    return 'programStart' // Default
  }
}