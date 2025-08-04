// pages/home/help-center.js
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

export default function HelpCenter() {
  const [activeCategory, setActiveCategory] = useState('general')
  const [searchQuery, setSearchQuery] = useState('')

  const faqCategories = {
    general: {
      title: 'General Questions',
      icon: '📚',
      questions: [
        {
          question: "What is Lux Libris?",
          answer: "Lux Libris is a Catholic reading gamification platform where students unlock Luxlings™ saint achievements through curated book reading. With 137 original Little Luminaries™ saint characters, comprehensive school administration tools, and optional parent premium features, it transforms Catholic school reading programs."
        },
        {
          question: "How does the gamification work?",
          answer: "Students earn XP (1 point per minute read), collect weekly bird badges, and unlock Luxlings™ saints through reading streaks and achievements. The Healthy Habits Timer promotes 20+ minute daily reading sessions, and students compete on anonymous leaderboards while building consistent reading habits."
        },
        {
          question: "What are Luxlings™ saints?",
          answer: "Luxlings™ are 234 collectible vinyl chibi-style saint figures (digital in-app) created by Dr. Verity Kahn. Students unlock different series (Common, Rare, Legendary) through reading streaks, book completions, and grade achievements. Each saint includes feast days, patronage info, biographies, and fun facts."
        },
        {
          question: "When is the program available each year?",
          answer: "The reading program runs from June 1st to March 31st. After that, students vote for their favorite books (April 1-14), winners are announced April 15th, and the new year's nominees are revealed in late May before the cycle begins again June 1st."
        },
        {
          question: "I'm having trouble logging in. What should I do?",
          answer: "First, ensure you're using the correct email associated with your account. Try resetting your password using the 'Forgot Password' link. If issues persist, email support@luxlibris.org with your school name and we'll help immediately."
        }
      ]
    },
    schools: {
      title: 'For Schools',
      icon: '🏫',
      questions: [
        {
          question: "How does school setup work?",
          answer: "Schools receive access codes from their diocese or directly from Dr. Kahn. Administrators use these codes to create school accounts, then generate teacher join codes. Teachers create accounts and receive unique student/parent codes for their classes. The entire process takes about 5 minutes."
        },
        {
          question: "What's included in a school subscription?",
          answer: "Schools get the Lux Libris Award program (20 curated books) and/or the Classroom Reading program. This includes teacher dashboards, student accounts, basic parent access, customizable achievement tiers, submission management, school-wide analytics, and the complete Luxlings™ saint collection system."
        },
        {
          question: "How much does it cost?",
          answer: "During the 2025/2026 pilot year at Holy Family Catholic School, all features are FREE. Starting in 2026/2027, schools pay $2,000-5,000 annually depending on size. Diocese bulk subscriptions offer discounted rates for multiple schools."
        },
        {
          question: "Can we customize the program for our school?",
          answer: "Yes! Schools select 15-20 books from our annual list, set custom achievement intervals (e.g., rewards at 5, 10, 15, 20 books), configure submission options (quizzes, teacher discussions, projects), and define real-world rewards like mass recognition or certificates."
        },
        {
          question: "Our diocese wants to implement Lux Libris. Who should we contact?",
          answer: "For diocese-wide implementations, email inquiries@luxlibris.org. We offer special pricing for multi-school organizations and can coordinate rollout across all your schools."
        }
      ]
    },
    students: {
      title: 'For Students',
      icon: '🎒',
      questions: [
        {
          question: "How do students join the program?",
          answer: "Students enter their teacher's unique student code, provide their first name and last initial (for privacy), select their grade (4-8), and set a personal reading goal. They can then customize their app theme and start reading immediately."
        },
        {
          question: "What happens when I finish a book?",
          answer: "When you reach 100% on a book, you can either take a parent-unlocked quiz (10 random questions, need 7/10 to pass) or submit to your teacher through discussion, storyboard, or other approved methods. Once approved, the book is marked complete and counts toward your goals."
        },
        {
          question: "How do I unlock Luxlings™ saints?",
          answer: "Saints unlock through various achievements: 14-day reading streak (Common saint), 30-day streak (Rare saint), 90-day streak (Legendary saint), first book submitted (Grade saint), program completion (Mini Marian), and the ultimate 100-book goal unlocks Jesus Christ."
        },
        {
          question: "Can I use the app without internet?",
          answer: "The reading timer and basic features work offline. You only need internet to sync progress, take quizzes, submit books, and view leaderboards. Your reading data is saved locally and syncs when you reconnect."
        },
        {
          question: "How do I get a teacher code to join my school?",
          answer: "Teacher codes are provided by your school administrator. Contact your principal or librarian to receive your unique join code. If your school hasn't registered yet, direct them to luxlibris.org/for-schools."
        }
      ]
    },
    parents: {
      title: 'For Parents',
      icon: '👨‍👩‍👧',
      questions: [
        {
          question: "How do parents access the program?",
          answer: "Parents receive a code from their child's teacher. Basic features are FREE with your school's subscription, including progress tracking, quiz unlocking, and achievement viewing. Premium features ($10/year, free during pilot) add Reading DNA analysis and family challenges."
        },
        {
          question: "What's included in the free parent access?",
          answer: "Free features include: family dashboard for multiple children, book information with discussion questions, quiz approval system, progress and achievement tracking, bragging rights certificates, and guidance for age-appropriate content discussions."
        },
        {
          question: "What are the premium parent features?",
          answer: "Premium features (normally $10/year, free during pilot) include: Parent Healthy Habits Timer to model reading, weekly family reading battles, Reading DNA Lab with science-based analysis, parent-child compatibility insights, emergency toolkit for reluctant readers, and access to 50+ reading research papers."
        },
        {
          question: "Can homeschool families use Lux Libris?",
          answer: "Yes! Homeschool families can subscribe independently for $25/year (coming in Phase 3). This includes up to 6 children, a scaled reading program, basic saint achievements, and family progress tracking - perfect for homeschool co-ops and reading groups."
        },
        {
          question: "Can parents use the app if they don't have a smartphone?",
          answer: "Yes! The parent app works on any device with internet access, including computers and tablets. Parents can also participate without the app - teachers can print progress reports to send home."
        }
      ]
    },
    technical: {
      title: 'Technical Support',
      icon: '🔧',
      questions: [
        {
          question: "What devices are supported?",
          answer: "Lux Libris is a Progressive Web App (PWA) that works on any modern browser (Chrome, Safari, Firefox, Edge) and can be installed like a native app on iOS and Android devices. It's optimized for phones, tablets, and Chromebooks."
        },
        {
          question: "How is student privacy protected?",
          answer: "We follow COPPA compliance standards. Students only provide first name and last initial, no email required. All data is encrypted, we never sell information, and schools own their student data. Parents control data collection permissions."
        },
        {
          question: "What if students don't have devices?",
          answer: "Teachers can manually track students without devices. The program is designed to be inclusive - students can participate through teacher-managed accounts, with physical reading logs, and still earn real-world achievement rewards."
        },
        {
          question: "How do teacher accounts work?",
          answer: "Teachers join with school-provided codes, create email/password accounts, and receive unique codes for their students and parents. Each teacher can manage their own classroom, track submissions, and view class-specific analytics while maintaining student privacy."
        },
        {
          question: "Is there a help center or documentation available?",
          answer: "Yes! Once logged in, you'll find comprehensive help documentation in your dashboard. We also offer video tutorials and PDF guides. For immediate assistance, email support@luxlibris.org."
        }
      ]
    }
  }

  // Filter questions based on search query
  const getFilteredQuestions = () => {
    if (!searchQuery) return null;
    
    const filtered = {};
    const query = searchQuery.toLowerCase();
    
    Object.entries(faqCategories).forEach(([key, category]) => {
      const matchingQuestions = category.questions.filter(
        item => 
          item.question.toLowerCase().includes(query) || 
          item.answer.toLowerCase().includes(query)
      );
      
      if (matchingQuestions.length > 0) {
        filtered[key] = {
          ...category,
          questions: matchingQuestions
        };
      }
    });
    
    return Object.keys(filtered).length > 0 ? filtered : null;
  };

  const filteredCategories = getFilteredQuestions();
  const displayCategories = searchQuery ? filteredCategories : { [activeCategory]: faqCategories[activeCategory] };

  return (
    <Layout 
      title="Help Center - Lux Libris Support" 
      description="Find answers to frequently asked questions about Lux Libris. Get help with setup, features, technical support, and more."
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800"
              style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em'}}>
            How Can We
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}Help You?
            </span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto mb-12 leading-relaxed text-gray-700">
            Find answers to common questions or reach out to our support team for personalized assistance.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-full shadow-lg text-lg pr-12 text-gray-800 border border-gray-200 focus:border-[#A1E5DB] focus:ring-2 focus:ring-[#A1E5DB]/20 transition-all"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl">
                🔍
              </span>
            </div>
            {searchQuery && !filteredCategories && (
              <p className="mt-4 text-gray-600">No results found for "{searchQuery}"</p>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Category Tabs - only show if not searching */}
          {!searchQuery && (
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {Object.entries(faqCategories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`
                    px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2
                    ${activeCategory === key 
                      ? 'text-white shadow-lg' 
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }
                  `}
                  style={activeCategory === key ? {backgroundColor: '#A1E5DB'} : {}}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span>{category.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* FAQ Content */}
          <div className="max-w-4xl mx-auto">
            {displayCategories ? (
              Object.entries(displayCategories).map(([key, category]) => (
                <div key={key} className="mb-8">
                  {searchQuery && (
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                      <span>{category.icon}</span>
                      <span>{category.title}</span>
                    </h3>
                  )}
                  <div className="space-y-6">
                    {category.questions.map((item, index) => (
                      <FAQItem
                        key={`${key}-${index}`}
                        question={item.question}
                        answer={item.answer}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600">No questions found in this category.</p>
            )}
          </div>
        </div>
      </section>

      {/* Still Need Help Section */}
      <section className="py-20 bg-orange-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800" style={{fontFamily: 'Didot, Georgia, serif'}}>
            Still Need Help?
          </h2>
          <p className="text-xl mb-8 text-gray-700">
            Our support team is here to assist you with any questions about Lux Libris.
          </p>

          <Link
            href="/home/contact"
            className="inline-block text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
            style={{backgroundColor: '#A1E5DB'}}
          >
            Contact Us
          </Link>
        </div>
      </section>

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </Layout>
  )
}

// Supporting Components
function FAQItem({ question, answer, searchQuery }) {
  const [isOpen, setIsOpen] = useState(!!searchQuery)

  // Highlight search terms
  const highlightText = (text) => {
    if (!searchQuery) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <span key={index} style={{backgroundColor: '#A1E5DB40'}}>{part}</span>
        : part
    );
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h4 className="text-lg font-bold pr-4 text-gray-800">
          {highlightText(question)}
        </h4>
        <span className="text-2xl transform transition-transform text-gray-500" style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ⌄
        </span>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 animate-fadeIn">
          <p className="leading-relaxed text-gray-700">
            {highlightText(answer)}
          </p>
        </div>
      )}
    </div>
  )
}