import Layout from '../../components/Layout'
import Link from 'next/link'
import { useState } from 'react'

export default function LuxLibrisAward() {
  const [activeTab, setActiveTab] = useState('about')

  // Category color schemes
  const categoryColors = {
    chapterBooks: {
      primary: '#F4D03F',
      secondary: '#F7DC6F',
      accent: '#FCF3CF',
      background: '#FFFEF7'
    },
    pictureBooks: {
      primary: '#48CAE4',
      secondary: '#00B4D8',
      accent: '#90E0EF',
      background: '#F0FDFF'
    },
    graphicNovels: {
      primary: '#FF6B35',
      secondary: '#FF8C42',
      accent: '#FFB563',
      background: '#FFF4E6'
    },
    classic: {
      primary: '#3F51B5',
      secondary: '#5C6BC0',
      accent: '#9FA8DA',
      background: '#F3F4FF'
    },
    catholicPick: {
      primary: '#64B5F6',
      secondary: '#90CAF9',
      accent: '#BBDEFB',
      background: '#F8FCFF'
    },
    hiddenTreasure: {
      primary: '#D32F2F',
      secondary: '#F44336',
      accent: '#FFCDD2',
      background: '#FFF8F8'
    }
  }

  // Book nominees data with cover URLs
  const nominees = {
    chapterBooks: [
      { title: "Dogtown", authors: "Katherine Applegate and Gennifer Choldenko", grades: "4-7", review: "Dogs, loyalty, and an unforgettable story about rescue and friendship.", coverUrl: "https://mpd-biblio-covers.imgix.net/9781250811608.jpg" },
      { title: "Impossible Creatures", authors: "Katherine Rundell", grades: "5-8", review: "Mythical creatures come to life in this magical, adventurous read that&apos;s perfect for animal lovers and daydreamers alike. Already a classic and one of my favorites!", coverUrl: "https://images.penguinrandomhouse.com/cover/9780593809860" },
      { title: "Invisible Isabel", authors: "Sally J. Pla", grades: "4-6", review: "A heartwarming story about a girl with sensory differences, helping us see how we can love and understand each other better.", coverUrl: "https://www.harpercollins.com/cdn/shop/files/9780063268852_af2480f8-5db4-4273-aa89-814ac893538f_1200x1200.jpg?v=1748056742" },
      { title: "It Came from the Trees", authors: "Ally Russell", grades: "4-7", review: "A creepy, spooky mystery that makes you think twice about the world outside—and how we care for it.", coverUrl: "https://images2.penguinrandomhouse.com/cover/9780593865583" },
      { title: "Legendarios: Wrath of the Rain God", authors: "Karla Arenas Valenti", grades: "4-7", review: "A thrilling dive into Aztec mythology—action-packed and full of cultural richness.", coverUrl: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781665935999/wrath-of-the-rain-god-9781665935999_hr.jpg" },
      { title: "Lost Library", authors: "Rebecca Stead", grades: "4-7", review: "A story with a ghost and a secret library—what&apos;s not to love? It&apos;s a book about the power of stories themselves.", coverUrl: "https://mpd-biblio-covers.imgix.net/9781250838810.jpg" },
      { title: "Nimbus", authors: "Jan Eldredge", grades: "4-6", review: "A little creepy, a lot magical—this book is for kids who like to explore the unknown.", coverUrl: "https://www.harpercollins.com/cdn/shop/files/9780062680372.jpg?v=1747467590" },
      { title: "Tales from Cabin 23: The Boo Hag Flex", authors: "Justina Ireland", grades: "4-6", review: "A spooky, exciting tale with a southern twist—just the right amount of scary for middle-grade readers.", coverUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlqhFdpPsrg6hs6n2ZyrpLe_tKAPRjIBIWiQ&s" },
      { title: "The Liars Society", authors: "Alyson Gerber", grades: "4-7", review: "A smart, engaging mystery that&apos;ll get kids thinking about truth, trust, and what we owe our friends.", coverUrl: "https://static.wixstatic.com/media/31eb4f_bd3e663d12c24489be1343440d0d819c~mv2.webp/v1/fill/w_720,h_1008,al_c,q_85,enc_avif,quality_auto/LiarsSociety1.webp" },
      { title: "The Lumbering Giants of Windy Pines", authors: "Mo Netz", grades: "4-7", review: "Sasquatch meets small-town mystery—this one&apos;s just plain fun.", coverUrl: "https://www.harpercollins.com/cdn/shop/files/9780063266537_056c64c5-2547-4553-b585-8dbd3b8d82f7.jpg?v=1747961510" },
      { title: "The Sherlock Society", authors: "James Ponti", grades: "4-7", review: "From a fan-favorite mystery writer—this is a brand-new series perfect for kids who love solving puzzles.", coverUrl: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781665932530/the-sherlock-society-9781665932530.jpg" },
      { title: "When We Flew Away", authors: "Alice Hoffman", grades: "5-8", review: "A gorgeous, imaginative story about Anne Frank—before the diary. It&apos;s a moving look at the creeping oppression of the Nazi regime, told through a lyrical, hopeful lens.", coverUrl: "https://alicehoffman.com/wp-content/uploads/2024/05/When-We-Flew-Away-Alice-Hoffman.jpg" }
    ],
    pictureBooks: [
      { title: "Haiku, Ew!", authors: "Lynn Brunelle, illustrated by Julia Patton", grades: "3-5", review: "Gross, funny, and totally delightful—it&apos;s a celebration of the weird side of nature in haiku form!", coverUrl: "https://www.slj.com/binaries/content/gallery/Jlibrary/2024/04/haiku-ew.jpg" },
      { title: "The Girl Who Figured It Out", authors: "Minda Dentler, illustrated by Stephanie Dehennin", grades: "2-5", review: "The true story of Minda Dentler—an inspiring tale of determination, courage, and never giving up.", coverUrl: "https://s3.amazonaws.com/ArchiveImages/LegacyReviews/SLJ/9781728276533.jpg" },
      { title: "Volcanoes", authors: "Nell Cross Beckerman, illustrated by Kalen Chock", grades: "3-6", review: "Big, bold, and fascinating—this book makes volcanoes come alive.", coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1697708712i/195263597.jpg" }
    ],
    graphicNovels: [
      { title: "Doña Quixote: Rise of the Knight", authors: "Rey Terciero, illustrated by Monica M. Magaña", grades: "4-7", review: "A clever, fresh take on the classic story, featuring a girl with big dreams of becoming a knight. It&apos;s fun, empowering, and packed with heart.", coverUrl: "https://mpd-biblio-covers.imgix.net/9781250795472.jpg" },
      { title: "Scare School Diaries: Welcome to Scare School", authors: "Jarrett Lerner", grades: "3-6", review: "Spooky, silly, and full of laugh-out-loud moments—this one&apos;s a great intro to the graphic novel world.", coverUrl: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781665922081/welcome-to-scare-school-9781665922081_hr.jpg" }
    ],
    hiddenTreasure: [
      { title: "The Silver Arrow", authors: "Lev Grossman", grades: "4-7", review: "A magical train, talking animals, and an environmental message—this book&apos;s an adventure from start to finish.", coverUrl: "https://www.hachettebookgroup.com/wp-content/uploads/2021/01/SilverArrow_9780316539548_PB_cvr.jpg?w=441" }
    ],
    catholicPick: [
      { title: "We Have a Pope", authors: "Katherine Bogner", grades: "3-5", review: "This is a warm, welcoming introduction to how we get a new pope—and why it matters. It&apos;s the kind of book that makes kids feel part of the Church, showing that the Catholic faith is a family and a community.", coverUrl: "https://cdn4.volusion.store/xmfkv-mtaqs/v/vspfiles/photos/9781645853633-2.png?v-cache=1736590235" }
    ],
    classic: [
      { title: "The Silver Sword", authors: "Ian Serraillier", grades: "5-8", review: "This book is a powerful story about kids surviving on their own during World War II. It&apos;s not just an adventure—it&apos;s about family, courage, and finding hope even when everything feels impossible.", coverUrl: "https://ofscriptedshadows.wordpress.com/wp-content/uploads/2018/11/9780141362649.jpg" }
    ]
  }

  return (
    <Layout 
      title="The Lux Libris Award - Illuminating the World Through Stories" 
      description="Learn about the Lux Libris Award, a Catholic school reading program that forms saints one book at a time through carefully curated literature."
    >
      <style jsx global>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16" style={{backgroundColor: '#F5EBDC'}}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4"
              style={{fontFamily: 'Didot, Georgia, serif', letterSpacing: '0.02em', color: '#223848'}}>
            The Lux Libris
            <span style={{
              background: 'linear-gradient(to right, #FFAB91, #ADD4EA, #A1E5DB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {" "}Award
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl italic mb-6" style={{color: '#556B7A', fontFamily: 'Didot, Georgia, serif'}}>
            &quot;Illuminating the World Through Stories&quot;
          </p>
          
          <p className="text-base sm:text-lg max-w-3xl mx-auto mb-8 leading-relaxed" style={{color: '#223848'}}>
            A Catholic school reading program that curates 20 exceptional books each year, 
            fostering a love of reading while forming students intellectually, emotionally, and spiritually.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="/downloads/lux-libris-nominees-2025-2026.pdf"
              download="Lux-Libris-Nominees-2025-2026.pdf"
              className="text-white px-6 sm:px-8 py-3 rounded-full text-base sm:text-lg font-semibold transition-all inline-flex items-center justify-center gap-2"
              style={{backgroundColor: '#A1E5DB'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#8DD4C9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#A1E5DB'}
            >
              📄 Download 2025-2026 List
            </a>
            
            <Link 
              href="/home/for-schools" 
              className="border-2 px-6 sm:px-8 py-3 rounded-full text-base sm:text-lg font-semibold transition-all inline-block text-center"
              style={{borderColor: '#A1E5DB', color: '#A1E5DB'}}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#F0FDFB';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Bring to Your School
            </Link>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white sticky top-0 z-40 shadow-md">
        <div className="w-full px-4 md:px-6">
          <div className="flex justify-center overflow-x-auto scrollbar-hide max-w-5xl mx-auto">
            <TabButton active={activeTab === 'about'} onClick={() => setActiveTab('about')}>
              About
            </TabButton>
            <TabButton active={activeTab === 'nominees'} onClick={() => setActiveTab('nominees')}>
              2025-2026 Books
            </TabButton>
            <TabButton active={activeTab === 'mission'} onClick={() => setActiveTab('mission')}>
              Mission & Values
            </TabButton>
            <TabButton active={activeTab === 'program'} onClick={() => setActiveTab('program')}>
              How It Works
            </TabButton>
            <TabButton active={activeTab === 'story'} onClick={() => setActiveTab('story')}>
              Our Story
            </TabButton>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-12">
        <div className="w-full px-6">
          
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="animate-fadeIn max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Welcome to the Lux Libris Award
              </h2>
              
              <div className="prose prose-lg mx-auto" style={{color: '#223848'}}>
                <p className="text-lg leading-relaxed mb-6">
                  The Lux Libris Award is more than just a reading list—it&apos;s a carefully curated journey 
                  designed to illuminate young minds and hearts through the power of story. Each year, 
                  we select 20 exceptional books that span genres, cultures, and perspectives, all while 
                  remaining true to our Catholic values.
                </p>
                
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-bold mb-3" style={{fontFamily: 'Didot, Georgia, serif'}}>
                    What Makes Lux Libris Special?
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-3 text-xl" style={{color: '#A1E5DB'}}>✨</span>
                      <span><strong>Faith-Integrated Selection:</strong> Every book is vetted to align with Catholic values while exploring the full human experience</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-xl" style={{color: '#A1E5DB'}}>🌍</span>
                      <span><strong>Global Perspectives:</strong> Stories from around the world that build empathy and understanding</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-xl" style={{color: '#A1E5DB'}}>📚</span>
                      <span><strong>Diverse Formats:</strong> Picture books, chapter books, graphic novels, and more—something for every reader</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-xl" style={{color: '#A1E5DB'}}>🏛️</span>
                      <span><strong>Classic & Contemporary:</strong> Timeless classics alongside fresh, modern voices</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-xl" style={{color: '#A1E5DB'}}>🎯</span>
                      <span><strong>Student Voice:</strong> Students who read 5+ books get to vote for their favorite</span>
                    </li>
                  </ul>
                </div>

                <p className="text-lg leading-relaxed">
                  Lux means &quot;light&quot; and Libris means &quot;books&quot;—together, they represent our belief that 
                  stories have the power to illuminate the world, helping students grow as readers, 
                  thinkers, and disciples of Christ.
                </p>
              </div>
            </div>
          )}

          {/* Nominees Tab */}
          {activeTab === 'nominees' && (
            <div className="animate-fadeIn max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                2025-2026 Lux Libris Nominees
              </h2>
              
              {/* Chapter Books */}
              <CategorySection 
                title="📖 Chapter Books that Stick With You"
                books={nominees.chapterBooks}
                color={categoryColors.chapterBooks}
              />
              
              {/* Picture Books */}
              <CategorySection 
                title="🖼️ Picture Books with Heart"
                books={nominees.pictureBooks}
                color={categoryColors.pictureBooks}
              />
              
              {/* Graphic Novels */}
              <CategorySection 
                title="🎨 Graphic Novels with a Twist"
                books={nominees.graphicNovels}
                color={categoryColors.graphicNovels}
              />
              
              {/* Hidden Treasure */}
              <CategorySection 
                title="🗝️ Hidden Treasure"
                books={nominees.hiddenTreasure}
                color={categoryColors.hiddenTreasure}
                description="A remarkable book published a few years ago that deserves rediscovery."
              />
              
              {/* Catholic Pick */}
              <CategorySection 
                title="✝️ Our Catholic Pick"
                books={nominees.catholicPick}
                color={categoryColors.catholicPick}
                description="A book that deepens understanding of Catholic identity, history, and values."
              />
              
              {/* Classic */}
              <CategorySection 
                title="🏛️ Our Classic"
                books={nominees.classic}
                color={categoryColors.classic}
                description="A timeless work that has shaped cultures and inspired generations."
              />
              
              {/* Download CTA */}
              <div className="text-center mt-8">
                <a 
                  href="/downloads/lux-libris-nominees-2025-2026.pdf"
                  download="Lux-Libris-Nominees-2025-2026.pdf"
                  className="text-white px-8 py-4 rounded-full text-lg font-semibold transition-all inline-flex items-center gap-2"
                  style={{backgroundColor: '#A1E5DB'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#8DD4C9'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#A1E5DB'}
                >
                  📄 Download Complete List PDF
                </a>
              </div>
            </div>
          )}

          {/* Mission Tab */}
          {activeTab === 'mission' && (
            <div className="animate-fadeIn max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Our Mission & Objectives
              </h2>
              
              <div className="bg-gradient-to-br from-amber-50 to-teal-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold mb-3" style={{color: '#223848'}}>Mission Statement</h3>
                <p className="text-base leading-relaxed" style={{color: '#223848'}}>
                  The Lux Libris Award curates 20 exceptional book nominees each year—spanning picture books, 
                  fiction, nonfiction, graphic novels, and manga—from around the globe. Each list includes 
                  a timeless classic and a specifically Catholic title, ensuring readers encounter a broad 
                  and beautiful vision of the human experience.
                </p>
                <p className="text-base leading-relaxed mt-3" style={{color: '#223848'}}>
                  Rooted in our Catholic faith, we guide readers to engage with the world through the lens 
                  of truth, goodness, and beauty. We seek to educate the whole child: cultivating empathy, 
                  expanding knowledge, and encouraging action in service of others.
                </p>
              </div>

              <h3 className="text-xl font-bold mb-4" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                Our Objectives
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <ObjectiveCard 
                  icon="🌍"
                  title="Illuminate the World"
                  description="Highlight diverse voices, cultures, and experiences from around the globe."
                />
                <ObjectiveCard 
                  icon="👤"
                  title="Form the Whole Child"
                  description="Nurture students intellectually, emotionally, and spiritually through balanced book selection."
                />
                <ObjectiveCard 
                  icon="✝️"
                  title="Ground in Faith"
                  description="Offer titles that deepen understanding of Catholic identity while fostering curiosity about the wider world."
                />
                <ObjectiveCard 
                  icon="🏛️"
                  title="Champion Classics"
                  description="Ensure students engage with works of enduring significance that build cultural literacy."
                />
                <ObjectiveCard 
                  icon="📚"
                  title="Foster Love of Reading"
                  description="Provide engaging, age-appropriate books across a variety of genres and formats."
                />
                <ObjectiveCard 
                  icon="🎯"
                  title="Encourage Action"
                  description="Inspire students to think critically about global challenges and contribute to building a just world."
                />
                <ObjectiveCard 
                  icon="🤝"
                  title="Support Communities"
                  description="Provide a thoughtfully curated, faith-informed list that aligns with Catholic values."
                />
                <ObjectiveCard 
                  icon="✨"
                  title="Reveal Christ&apos;s Light"
                  description="Recognize storytelling as a vital way to encounter truth, foster empathy, and build bridges."
                />
              </div>
            </div>
          )}

          {/* Program Tab */}
          {activeTab === 'program' && (
            <div className="animate-fadeIn max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                How the Program Works
              </h2>
              
              <div className="space-y-6">
                <ProgramStep 
                  number="1"
                  title="Schools Join the Program"
                  description="Catholic schools sign up for Lux Libris and receive access to our curated book list, resources, and support materials."
                />
                
                <ProgramStep 
                  number="2"
                  title="Students Start Reading"
                  description="Students in grades 4-8 begin reading from the 20 nominated books. They can choose titles that interest them across all categories."
                />
                
                <ProgramStep 
                  number="3"
                  title="Track Progress & Earn Rewards"
                  description="As students read, they earn recognition at different milestones: 5 books (Mass recognition), 10 books (certificate), 15 books (party + new book), 20 books (medal)."
                />
                
                <ProgramStep 
                  number="4"
                  title="Submit & Share"
                  description="Students complete quizzes, book summaries, reviews, or creative projects to demonstrate their reading comprehension."
                />
                
                <ProgramStep 
                  number="5"
                  title="Vote for Favorites"
                  description="Any student who reads 5 or more books earns the right to vote for their favorite title at the end of the year."
                />
                
                <ProgramStep 
                  number="6"
                  title="Celebrate Achievement"
                  description="Schools celebrate readers with special events, and students who complete all 5 years by 8th grade receive a plaque in the school library."
                />
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 mt-8">
                <h3 className="text-xl font-bold mb-3" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                  100 Book Achievement
                </h3>
                <p className="text-base" style={{color: '#223848'}}>
                  Students who complete the full Lux Libris journey—reading all 20 books each year from 4th through 8th grade—will have 
                  read 100 carefully selected books that have shaped their minds, hearts, and souls. Their names are inscribed on a 
                  permanent plaque in the school library, honoring their dedication to becoming lifelong readers.
                </p>
              </div>
            </div>
          )}

          {/* Story Tab */}
          {activeTab === 'story' && (
            <div className="animate-fadeIn max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-center" style={{fontFamily: 'Didot, Georgia, serif', color: '#223848'}}>
                The Story Behind Lux Libris
              </h2>
              
              <div className="prose prose-lg mx-auto" style={{color: '#223848'}}>
                <p className="text-lg leading-relaxed mb-6">
                  In the spring of 2025, Catholic schools across the country received unexpected news: 
                  the only national Catholic reading program that had been a cornerstone of many school 
                  reading programs for nearly a decade was coming to an end.
                </p>
                
                <blockquote className="border-l-4 pl-6 italic my-6" style={{borderColor: '#A1E5DB'}}>
                  &quot;I was shocked and saddened. This program had been meaningful to so many students&apos; 
                  journeys, and suddenly schools were left without a Catholic-centered reading program.&quot;
                  <footer className="text-sm mt-2">— A School Librarian</footer>
                </blockquote>
                
                <p className="text-lg leading-relaxed mb-6">
                  But from this ending came a new beginning. Dr. Verity Kahn, an award-winning Catholic school librarian and educator, saw an 
                  opportunity to not just fill the gap, but to create something even better—a program that 
                  would honor what came before while expanding the vision for Catholic reading education.
                </p>
                
                <div className="bg-amber-50 rounded-xl p-5 my-6">
                  <h3 className="text-xl font-bold mb-3">Why &quot;Lux Libris&quot;?</h3>
                  <p className="text-base">
                    The name reflects the award&apos;s mission perfectly. <em>Lux</em> means &quot;light&quot; in Latin, 
                    and <em>Libris</em> means &quot;books.&quot; Together, they represent our belief that books 
                    illuminate the minds and hearts of our students, guiding them toward truth, beauty, 
                    and goodness.
                  </p>
                </div>
                
                <h3 className="text-2xl font-bold mt-6 mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
                  From PDF Tracking to Digital Platform
                </h3>
                
                <p className="text-lg leading-relaxed mb-6">
                  Reading programs around the country have followed a simple format: a curated book list with PDF tracking 
                  sheets. But Dr. Kahn recognized that along with the need for a new Catholic-centered reading program, there was a need for a complete reimagining of what a reading program could be.
                  For busy librarians, teachers, and educators, managing a reading program is often too challenging. Many schools wanted to participate but 
                  found the administrative burden overwhelming.
                </p>
                
                <p className="text-lg leading-relaxed mb-6">
                  That&apos;s when the vision of Lux Libris expanded: What if there was a better way? What if schools could 
                  have a complete digital platform that made running a Catholic reading program not just 
                  manageable, but delightful? The Lux Libris reading platform was born.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-teal-50 rounded-lg p-5">
                    <h4 className="font-bold mb-2">🆕 New Additions</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• A specifically Catholic book each year</li>
                      <li>• A children&apos;s classic on every list</li>
                      <li>• &quot;Hidden Treasure&quot; category for overlooked gems</li>
                      <li>• Digital platform for easy tracking</li>
                      <li>• Student engagement features</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-5">
                    <h4 className="font-bold mb-2">✅ What Continues</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Student voting for favorites</li>
                      <li>• 20 exceptional books each year</li>
                      <li>• Focus on grades 4-8</li>
                      <li>• Achievement milestones</li>
                      <li>• School-wide celebrations</li>
                    </ul>
                  </div>
                </div>
                
                <p className="text-lg leading-relaxed">
                  Today, the Lux Libris Award and its digital platform offer Catholic schools a 
                  comprehensive solution for reading engagement. No more tracking sheets, no more 
                  administrative headaches—just a focus on what matters most: forming saints, 
                  one book at a time.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{background: 'linear-gradient(to right, #ADD4EA, #A1E5DB)'}}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4" style={{fontFamily: 'Didot, Georgia, serif'}}>
            Ready to Illuminate Your School?
          </h2>
          <p className="text-xl text-white mb-6 max-w-2xl mx-auto">
            Join the growing community of Catholic schools using Lux Libris to transform their reading programs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/home/for-schools" 
              className="bg-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-block text-center"
              style={{color: '#A1E5DB'}}
            >
              Learn More for Schools
            </Link>
            
            <Link 
              href="/home/contact" 
              className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold transition-all inline-block text-center"
              style={{}}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = '#A1E5DB';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}

// Supporting Components
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 sm:px-6 py-3 font-semibold transition-all whitespace-nowrap text-center text-sm sm:text-base
        ${active 
          ? 'border-b-4' 
          : 'text-gray-600 hover:text-gray-800 border-b-4 border-transparent'
        }
      `}
      style={active ? {color: '#A1E5DB', borderColor: '#A1E5DB'} : {}}
    >
      {children}
    </button>
  )
}

function CategorySection({ title, books, color, description }) {
  const getGridClass = () => {
    if (books.length === 1) return "grid grid-cols-1 max-w-sm mx-auto";
    if (books.length === 2) return "grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto";
    return "grid md:grid-cols-2 lg:grid-cols-3 gap-4";
  };

  // Determine container width based on number of books
  const getContainerClass = () => {
    if (books.length === 1) return "max-w-md mx-auto";
    if (books.length === 2) return "max-w-3xl mx-auto";
    return "w-full";
  };

  return (
    <div className={`mb-8 ${getContainerClass()}`}>
      <div 
        className="rounded-t-xl p-3 text-center"
        style={{background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`}}
      >
        <h3 className="text-xl font-bold text-white" style={{fontFamily: 'Didot, Georgia, serif'}}>
          {title}
        </h3>
        {description && (
          <p className="text-white/90 text-sm mt-1 max-w-3xl mx-auto">{description}</p>
        )}
      </div>
      
      <div 
        className="rounded-b-xl p-4 shadow-md"
        style={{backgroundColor: color.background, border: `2px solid ${color.primary}`}}
      >
        <div className={getGridClass()}>
          {books.map((book, index) => (
            <BookItem key={index} book={book} color={color} />
          ))}
        </div>
      </div>
    </div>
  )
}

function BookItem({ book, color }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      className="p-3 rounded-lg hover:shadow-md transition-all flex flex-col"
      style={{backgroundColor: 'white', border: `1px solid ${color.accent}`}}
    >
      {/* Book cover */}
      {book.coverUrl && !imageError ? (
        <div className="mb-2 rounded-md overflow-hidden shadow-sm bg-gray-100 mx-auto" style={{width: '120px', height: '180px'}}>
          <img 
            src={book.coverUrl} 
            alt={`Cover of ${book.title}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="mb-2 rounded-md overflow-hidden shadow-sm bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto" style={{width: '120px', height: '180px'}}>
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>
      )}
      
      <h4 className="font-bold mb-1 text-sm text-center" style={{color: '#223848'}}>
        {book.title}
      </h4>
      <p className="text-xs mb-1 text-center" style={{color: '#556B7A'}}>
        by {book.authors}
      </p>
      <p className="text-xs mb-2 text-center" style={{color: color.primary}}>
        Grades {book.grades}
      </p>
      {book.review && (
        <p className="text-xs italic leading-relaxed text-center" style={{color: '#556B7A'}}>
          &quot;{book.review}&quot;
        </p>
      )}
    </div>
  )
}

function ObjectiveCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-all">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-bold mb-1" style={{color: '#223848'}}>{title}</h4>
      <p className="text-sm" style={{color: '#556B7A'}}>{description}</p>
    </div>
  )
}

function ProgramStep({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
        style={{backgroundColor: '#ADD4EA'}}
      >
        {number}
      </div>
      <div>
        <h3 className="text-lg font-bold mb-1" style={{color: '#223848'}}>{title}</h3>
        <p className="text-sm" style={{color: '#556B7A'}}>{description}</p>
      </div>
    </div>
  )
}