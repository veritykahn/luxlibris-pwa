// pages/parent/dna-lab.js - Enhanced Family DNA Lab with Progressive Disclosure
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Head from 'next/head'
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function ParentFamilyDNALab() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parentData, setParentData] = useState(null)
  const [linkedStudents, setLinkedStudents] = useState([])
  const [showNavMenu, setShowNavMenu] = useState(false)
  
  // DNA Assessment States
  const [parentDNA, setParentDNA] = useState(null)
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false)
  const [showAssessment, setShowAssessment] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showSuccess, setShowSuccess] = useState('')
  
  // Results States
  const [familyCompatibility, setFamilyCompatibility] = useState([])
  const [familyRecommendations, setFamilyRecommendations] = useState([])

  // Progressive Disclosure States
  const [expandedChild, setExpandedChild] = useState(null)
  const [showQuickTips, setShowQuickTips] = useState(false)
  const [showDetailedParentModal, setShowDetailedParentModal] = useState(false)
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(null)
  const [showFamilyActivitiesModal, setShowFamilyActivitiesModal] = useState(false)
  const [showDetailedChildModal, setShowDetailedChildModal] = useState(null)

  // Research Modal State
  const [showResearchModal, setShowResearchModal] = useState(false)
  const [selectedDNATypeForResearch, setSelectedDNATypeForResearch] = useState(null)
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false)

  // Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [selectedChildForUnlock, setSelectedChildForUnlock] = useState(null)

  // Lux Libris Classic Theme
  const luxTheme = {
    primary: '#ADD4EA',
    secondary: '#C3E0DE',
    accent: '#A1E5DB',
    background: '#FFFCF5',
    surface: '#FFFFFF',
    textPrimary: '#223848',
    textSecondary: '#556B7A'
  }

  // Navigation menu items
  const navMenuItems = useMemo(() => [
    { name: 'Family Dashboard', path: '/parent/dashboard', icon: '⌂' },
    { name: 'Book Nominees', path: '/parent/nominees', icon: '□' },
    { name: 'Reading Habits', path: '/parent/healthy-habits', icon: '◉' },
    { name: 'Family DNA Lab', path: '/parent/dna-lab', icon: '🧬', current: true },
    { name: 'Quiz Unlock Center', path: '/parent/quiz-unlock', icon: '▦' },
    { name: 'Family Celebrations', path: '/parent/celebrations', icon: '♔' },
    { name: 'Settings', path: '/parent/settings', icon: '⚙' }
  ], [])

  // ENHANCED Parent DNA Assessment Questions (12 questions for better differentiation)
  const parentDNAQuestions = [
    {
      id: 'autonomy_support',
      question: 'When your child chooses their own books, how do you typically respond?',
      researchBase: 'Self-Determination Theory - Autonomy Support (Deci & Ryan)',
      options: [
        { id: 'honor_choices', text: 'I honor their choices and show interest in what they picked', traits: ['autonomy_supportive', 'nurturing'] },
        { id: 'guide_suggestions', text: 'I offer gentle suggestions to expand their interests', traits: ['guidance_oriented', 'growth_minded'] },
        { id: 'ensure_appropriate', text: 'I make sure their choices are educational and appropriate', traits: ['structure_oriented', 'protective'] },
        { id: 'share_enthusiasm', text: 'I get excited and ask them to tell me why they chose it', traits: ['connection_focused', 'enthusiastic'] },
        { id: 'trust_completely', text: 'I trust their judgment completely and step back', traits: ['autonomy_supportive', 'trusting', 'empowering'] }
      ]
    },
    {
      id: 'competence_building',
      question: 'When your child struggles with reading, what\'s your instinct?',
      researchBase: 'Self-Efficacy and Competence Support (Bandura)',
      options: [
        { id: 'emotional_support', text: 'Provide emotional support and remind them that struggle is normal', traits: ['emotionally_supportive', 'patient'] },
        { id: 'strategic_help', text: 'Help them develop specific strategies to work through challenges', traits: ['strategic', 'skill_building'] },
        { id: 'adjust_challenge', text: 'Find books at a better level so they can experience success', traits: ['adaptive', 'success_oriented'] },
        { id: 'collaborative_problem_solving', text: 'Work together to figure out solutions they feel good about', traits: ['collaborative', 'empowering'] },
        { id: 'build_foundation', text: 'Focus on building their basic skills step by step', traits: ['foundational', 'systematic', 'patient'] }
      ]
    },
    {
      id: 'intrinsic_motivation',
      question: 'What do you think motivates children to love reading most?',
      researchBase: 'Intrinsic vs. Extrinsic Motivation Research (Deci & Ryan)',
      options: [
        { id: 'personal_connection', text: 'Finding personal meaning and connection in stories', traits: ['meaning_focused', 'reflective'] },
        { id: 'curiosity_satisfaction', text: 'Having their natural curiosity fed and expanded', traits: ['curiosity_nurturing', 'growth_oriented'] },
        { id: 'social_sharing', text: 'Being able to share excitement about books with others', traits: ['socially_motivated', 'community_building'] },
        { id: 'competence_mastery', text: 'Feeling capable and successful as readers', traits: ['competence_building', 'achievement_supporting'] },
        { id: 'joyful_discovery', text: 'The pure joy of discovering new worlds and ideas', traits: ['joy_focused', 'discovery_oriented', 'enthusiastic'] }
      ]
    },
    {
      id: 'reading_environment',
      question: 'How do you create reading opportunities in your home?',
      researchBase: 'Environmental Support for Reading (Neuman & Celano)',
      options: [
        { id: 'rich_environment', text: 'I create cozy reading spaces and keep books visible everywhere', traits: ['environment_creating', 'nurturing'] },
        { id: 'structured_time', text: 'I establish regular reading times and routines for the family', traits: ['structure_providing', 'consistent'] },
        { id: 'model_behavior', text: 'I read openly so my children see me enjoying books', traits: ['modeling', 'authentic'] },
        { id: 'discussion_culture', text: 'I encourage book conversations and sharing at family time', traits: ['discussion_promoting', 'interactive'] },
        { id: 'flexible_access', text: 'I make books available but let them find their own reading rhythms', traits: ['flexible', 'autonomy_supporting', 'adaptive'] }
      ]
    },
    {
      id: 'challenge_response',
      question: 'When your child faces a book that\'s too difficult, you tend to:',
      researchBase: 'Zone of Proximal Development and Scaffolding (Vygotsky)',
      options: [
        { id: 'emotional_scaffolding', text: 'Provide encouragement while honoring their feelings about it', traits: ['emotionally_attuned', 'supportive'] },
        { id: 'strategic_scaffolding', text: 'Break it down into manageable parts or find supports', traits: ['strategic', 'problem_solving'] },
        { id: 'choice_empowerment', text: 'Let them decide whether to continue or choose something else', traits: ['autonomy_supporting', 'empowering'] },
        { id: 'collaborative_approach', text: 'Suggest reading it together or taking turns', traits: ['collaborative', 'participatory'] },
        { id: 'growth_mindset', text: 'Celebrate the challenge as a sign their brain is growing', traits: ['growth_focused', 'developmental', 'encouraging'] }
      ]
    },
    {
      id: 'success_recognition',
      question: 'How do you celebrate your child\'s reading achievements?',
      researchBase: 'Motivation and Recognition Research (Gambrell)',
      options: [
        { id: 'personal_growth', text: 'I focus on how much they\'ve grown and what they\'ve learned', traits: ['growth_focused', 'reflective'] },
        { id: 'effort_process', text: 'I celebrate their effort, persistence, and reading strategies', traits: ['process_focused', 'encouraging'] },
        { id: 'joy_sharing', text: 'I share in their excitement and ask them to tell me about it', traits: ['joy_focused', 'connecting'] },
        { id: 'independence_pride', text: 'I acknowledge their independence and personal choices', traits: ['independence_supporting', 'empowering'] },
        { id: 'authentic_interest', text: 'I show genuine curiosity about what they discovered', traits: ['authentic', 'curiosity_nurturing', 'interested'] }
      ]
    },
    {
      id: 'discussion_style',
      question: 'During family book conversations, you naturally:',
      researchBase: 'Dialogic Reading Research (Whitehurst & Lonigan)',
      options: [
        { id: 'open_ended', text: 'Ask open-ended questions about their thoughts and feelings', traits: ['inquiry_based', 'thoughtful'] },
        { id: 'extension_focused', text: 'Help them connect books to their life and other learning', traits: ['connection_making', 'integrative'] },
        { id: 'appreciation_focused', text: 'Share what you both enjoyed and found interesting', traits: ['appreciation_based', 'positive'] },
        { id: 'child_led', text: 'Let them lead the conversation and follow their interests', traits: ['child_centered', 'responsive'] },
        { id: 'curious_exploration', text: 'Explore questions and mysteries in the story together', traits: ['exploratory', 'collaborative', 'curious'] }
      ]
    },
    {
      id: 'motivation_philosophy',
      question: 'What\'s your core belief about motivating children to read?',
      researchBase: 'Self-Determination Theory Application (Ryan & Deci)',
      options: [
        { id: 'authentic_interest', text: 'Motivation comes from authentic interest and personal choice', traits: ['authenticity_focused', 'autonomy_supporting'] },
        { id: 'supported_growth', text: 'Motivation grows when children feel supported to take on challenges', traits: ['growth_supporting', 'competence_building'] },
        { id: 'social_connection', text: 'Motivation thrives in warm, connected reading relationships', traits: ['relationship_focused', 'community_building'] },
        { id: 'meaningful_purpose', text: 'Motivation comes from helping them find personal meaning in reading', traits: ['meaning_making', 'purpose_driven'] },
        { id: 'natural_development', text: 'Motivation unfolds naturally when we create the right conditions', traits: ['developmental', 'organic', 'patient'] }
      ]
    },
    {
      id: 'reading_modeling',
      question: 'How do you naturally share your own reading experiences with your children?',
      researchBase: 'Social Cognitive Theory - Modeling Research (Bandura)',
      options: [
        { id: 'visible_reading', text: 'I read my own books where they can see me enjoying the process', traits: ['modeling', 'authentic', 'inspiring'] },
        { id: 'share_discoveries', text: 'I tell them about interesting things I learn from my reading', traits: ['sharing', 'curious', 'connecting'] },
        { id: 'read_together', text: 'I invite them to read alongside me during family reading time', traits: ['participatory', 'social', 'inclusive'] },
        { id: 'discuss_impact', text: 'I share how books have influenced my thinking or decisions', traits: ['meaning_focused', 'reflective', 'authentic'] },
        { id: 'demonstrate_joy', text: 'I openly express my excitement and passion for books', traits: ['enthusiastic', 'joyful', 'expressive', 'inspiring'] }
      ]
    },
    {
      id: 'developmental_support',
      question: 'When your child is ready to tackle harder books, how do you support their growth?',
      researchBase: 'Zone of Proximal Development - Scaffolding Research (Vygotsky)',
      options: [
        { id: 'gradual_release', text: 'I start by reading together, then gradually let them take over', traits: ['scaffolding', 'developmental', 'supportive'] },
        { id: 'skill_building', text: 'I help them practice specific reading strategies they\'ll need', traits: ['skill_focused', 'strategic', 'preparatory'] },
        { id: 'confidence_first', text: 'I make sure they feel confident before moving to the next level', traits: ['confidence_building', 'patient', 'supportive'] },
        { id: 'choice_scaffolding', text: 'I offer several appropriately challenging options and let them choose', traits: ['choice_supporting', 'adaptive', 'empowering'] },
        { id: 'celebration_growth', text: 'I celebrate their readiness and excitement for new challenges', traits: ['growth_celebrating', 'encouraging', 'positive'] }
      ]
    },
    {
      id: 'personal_relevance',
      question: 'How do you help your children find personal connections in their reading?',
      researchBase: 'Personal Relevance and Interest Development Theory (Hidi & Renninger)',
      options: [
        { id: 'life_connections', text: 'I ask how the story relates to their own experiences', traits: ['connection_making', 'reflective', 'personal'] },
        { id: 'value_exploration', text: 'I help them think about the book\'s messages and what they mean', traits: ['meaning_focused', 'thoughtful', 'values_oriented'] },
        { id: 'identity_links', text: 'I encourage them to see themselves in characters or situations', traits: ['identity_supporting', 'empathetic', 'personal'] },
        { id: 'future_relevance', text: 'I help them think about how books might guide their future choices', traits: ['forward_thinking', 'purposeful', 'growth_oriented'] },
        { id: 'emotional_processing', text: 'I use books to help them process their feelings and experiences', traits: ['emotionally_supportive', 'therapeutic', 'caring'] }
      ]
    },
    {
      id: 'reading_struggles',
      question: 'When your child says "I don\'t like reading," what\'s your first instinct?',
      researchBase: 'Motivation Repair and Re-engagement Research',
      options: [
        { id: 'explore_why', text: 'I try to understand what specifically they don\'t like about it', traits: ['understanding', 'patient', 'diagnostic'] },
        { id: 'find_right_fit', text: 'I help them find books that match their interests better', traits: ['adaptive', 'choice_supporting', 'responsive'] },
        { id: 'reduce_pressure', text: 'I back off and let them come to reading in their own time', traits: ['autonomy_supporting', 'patient', 'trusting'] },
        { id: 'positive_experiences', text: 'I focus on creating fun, low-pressure reading experiences together', traits: ['experience_creating', 'supportive', 'relationship_focused'] },
        { id: 'respect_feelings', text: 'I acknowledge their feelings while gently exploring alternatives', traits: ['empathetic', 'respectful', 'collaborative'] }
      ]
    }
  ]

  // Enhanced Parent Support Types with better trait coverage
  const parentDNATypes = {
    autonomy_supporter: {
      name: 'Autonomy Supporter',
      emoji: '🌱',
      description: 'You trust your children\'s natural reading instincts and create space for their authentic interests to flourish',
      traits: ['autonomy_supportive', 'empowering', 'trusting', 'child_centered'],
      color: '#52C41A',
      researchBase: 'Inspired by Self-Determination Theory\'s autonomy support research',
      strengths: ['Builds intrinsic motivation', 'Develops independent readers', 'Honors child voice'],
      approaches: ['Offer meaningful choices', 'Avoid pressure and control', 'Trust their reading journey'],
      motivationSupport: 'Research shows autonomy support is linked to stronger intrinsic motivation',
      keyResearch: {
        theory: 'Self-Determination Theory (Deci & Ryan, 1985)',
        principle: 'Autonomy support fosters intrinsic motivation and engagement',
        application: 'Providing choice and honoring children\'s preferences builds lasting reading motivation',
        evidence: 'Studies consistently find that autonomy-supportive environments enhance intrinsic motivation across age groups'
      }
    },
    competence_builder: {
      name: 'Competence Builder',
      emoji: '🏗️',
      description: 'You help children develop reading confidence through strategic support and celebrating growth',
      traits: ['competence_building', 'strategic', 'growth_focused', 'skill_developing'],
      color: '#1890FF',
      researchBase: 'Inspired by self-efficacy and competence research',
      strengths: ['Builds reading confidence', 'Develops strategies', 'Supports persistence'],
      approaches: ['Provide appropriate challenges', 'Celebrate effort and growth', 'Teach specific strategies'],
      motivationSupport: 'Research shows competence beliefs predict reading engagement and achievement',
      keyResearch: {
        theory: 'Self-Efficacy Theory (Bandura, 1997)',
        principle: 'Beliefs about one\'s capabilities influence motivation and achievement',
        application: 'Supporting skill development and recognizing growth builds reading confidence',
        evidence: 'Self-efficacy research demonstrates that competence beliefs strongly predict academic engagement'
      }
    },
    connection_creator: {
      name: 'Connection Creator',
      emoji: '🤝',
      description: 'You build reading motivation through warm relationships and shared literary experiences',
      traits: ['relationship_focused', 'community_building', 'socially_motivated', 'connecting'],
      color: '#EB2F96',
      researchBase: 'Inspired by relatedness and social motivation research',
      strengths: ['Creates reading community', 'Builds warm associations', 'Encourages sharing'],
      approaches: ['Read together regularly', 'Create discussion opportunities', 'Share your own reading'],
      motivationSupport: 'Research shows social connections enhance engagement and enjoyment',
      keyResearch: {
        theory: 'Relatedness Component of Self-Determination Theory',
        principle: 'Social connections and belonging needs drive motivation',
        application: 'Creating shared reading experiences builds positive associations with books',
        evidence: 'Research on social motivation shows that interpersonal connections enhance learning engagement'
      }
    },
    meaning_maker: {
      name: 'Meaning Maker',
      emoji: '🌟',
      description: 'You help children discover personal significance and deeper purpose in their reading journey',
      traits: ['meaning_focused', 'reflective', 'purpose_driven', 'thoughtful'],
      color: '#722ED1',
      researchBase: 'Inspired by personal relevance and meaning-making research',
      strengths: ['Develops deep thinking', 'Creates personal connections', 'Builds lifelong love'],
      approaches: ['Connect books to life', 'Ask meaningful questions', 'Explore deeper themes'],
      motivationSupport: 'Research shows personal relevance is fundamental to lasting engagement',
      keyResearch: {
        theory: 'Interest Development Theory (Hidi & Renninger, 2006)',
        principle: 'Personal relevance and meaning-making drive sustained interest',
        application: 'Helping children connect books to their lives builds deeper engagement',
        evidence: 'Research on interest shows that personal connections lead to sustained motivation'
      }
    },
    growth_facilitator: {
      name: 'Growth Facilitator',
      emoji: '📈',
      description: 'You support reading development through scaffolding, patience, and celebrating learning progress',
      traits: ['growth_supporting', 'patient', 'developmental', 'encouraging', 'scaffolding'],
      color: '#13C2C2',
      researchBase: 'Inspired by scaffolding and zone of proximal development research',
      strengths: ['Provides optimal support', 'Encourages risk-taking', 'Builds resilience'],
      approaches: ['Offer just-right challenges', 'Scaffold appropriately', 'Focus on progress'],
      motivationSupport: 'Research shows optimal challenge and support enhance learning',
      keyResearch: {
        theory: 'Zone of Proximal Development (Vygotsky, 1978)',
        principle: 'Learning occurs best with appropriate support and challenge',
        application: 'Providing scaffolded support helps children tackle progressively harder texts',
        evidence: 'Educational research demonstrates that optimal challenge levels enhance both learning and motivation'
      }
    },
    authentic_modeler: {
      name: 'Authentic Modeler',
      emoji: '📚',
      description: 'You inspire reading through genuine demonstration of your own love for books and learning',
      traits: ['modeling', 'authentic', 'passionate', 'inspiring'],
      color: '#FA8C16',
      researchBase: 'Inspired by social learning and modeling research',
      strengths: ['Demonstrates reading value', 'Shows authentic enjoyment', 'Inspires naturally'],
      approaches: ['Read visibly and enjoyably', 'Share your book excitement', 'Model reading habits'],
      motivationSupport: 'Research shows children learn attitudes and behaviors through observation',
      keyResearch: {
        theory: 'Social Cognitive Theory (Bandura, 1991)',
        principle: 'Children learn behaviors and attitudes through observing others',
        application: 'Authentic modeling of reading enjoyment influences children\'s attitudes toward books',
        evidence: 'Social learning research shows that observed behaviors strongly influence children\'s own practices'
      }
    }
  }

  // Parent-Friendly Student Reading DNA Guide (from comprehensive system)
  const parentReadingDnaGuide = {
    baseTypes: {
      creative_explorer: {
        parentName: "Creative Explorer",
        quickSummary: "Your child uses reading to fuel their imagination and creative projects",
        whatThisMeans: "Your Creative Explorer sees books as inspiration for their own creations. They might want to draw characters, act out scenes, or build worlds they've read about.",
        strengths: [
          "Strong imagination and creative thinking",
          "Makes personal connections to stories", 
          "Often inspired to create after reading",
          "Sees reading as a springboard for other activities"
        ],
        parentStrategies: [
          "Keep art supplies, journals, or building materials near reading areas",
          "Encourage them to respond to books through creative projects",
          "Look for books with rich visual descriptions and world-building",
          "Celebrate their creative responses to reading as much as the reading itself"
        ],
        bookRecommendations: [
          "Fantasy series with detailed world-building",
          "Books with beautiful illustrations or graphic novels",
          "Stories that inspire making, building, or creating",
          "Books about artists, inventors, or creators"
        ]
      },
      
      curious_investigator: {
        parentName: "Curious Investigator", 
        quickSummary: "Your child reads to learn and become an expert on topics they care about",
        whatThisMeans: "Your Curious Investigator treats reading as a tool for building knowledge. They love learning facts, understanding how things work, and becoming 'experts' on their interests.",
        strengths: [
          "Strong desire to learn and understand",
          "Builds deep knowledge on topics of interest",
          "Asks thoughtful questions about what they read",
          "Naturally connects new learning to existing knowledge"
        ],
        parentStrategies: [
          "Follow their interests - if they love dinosaurs, find every dinosaur book possible",
          "Encourage them to teach you what they've learned",
          "Keep a 'cool facts' journal together",
          "Connect their reading to real-world experiences and field trips"
        ],
        bookRecommendations: [
          "Non-fiction books on their specific interests",
          "Biography series about people they admire",
          "Science and nature books with real photographs",
          "How-to books that teach skills they want to learn"
        ]
      },
      
      social_connector: {
        parentName: "Social Connector",
        quickSummary: "Your child enjoys reading most when they can share the experience with others",
        whatThisMeans: "Your Social Connector sees reading as a social activity. They want to discuss characters, share favorite parts, and connect with family and friends through books.",
        strengths: [
          "Makes reading a shared, community experience",
          "Great at discussing books and characters",
          "Helps others enjoy reading through enthusiasm",
          "Understands characters' relationships and emotions well"
        ],
        parentStrategies: [
          "Read the same books they're reading so you can discuss them",
          "Create family reading time where everyone reads together",
          "Ask about characters and story events regularly",
          "Connect them with book clubs or reading buddies"
        ],
        bookRecommendations: [
          "Books about friendship and family relationships",
          "Popular series that other kids are reading",
          "Books with strong emotional connections and relatable characters",
          "Stories that generate good discussion questions"
        ]
      },
      
      challenge_seeker: {
        parentName: "Challenge Seeker",
        quickSummary: "Your child feels proud and motivated when they conquer difficult books",
        whatThisMeans: "Your Challenge Seeker sees difficult books as mountains to climb. They feel accomplished when they finish something that seemed hard at first.",
        strengths: [
          "Persistent and determined when faced with difficulty",
          "Motivated by personal achievement and growth",
          "Willing to try books outside their comfort zone",
          "Builds confidence through overcoming challenges"
        ],
        parentStrategies: [
          "Celebrate their effort and persistence, not just completion",
          "Help them set their own reading goals and challenges",
          "Provide books that are challenging but not overwhelming",
          "Acknowledge when they're working hard, even if they don't finish"
        ],
        bookRecommendations: [
          "Series that increase in complexity over time",
          "Books slightly above their current reading level",
          "Stories about characters who overcome obstacles",
          "Award-winning books that offer rich challenges"
        ]
      },
      
      freedom_reader: {
        parentName: "Freedom Reader",
        quickSummary: "Your child reads best when they have control over their reading choices",
        whatThisMeans: "Your Freedom Reader needs autonomy in their reading journey. They're motivated by choice and may resist reading assignments or suggestions.",
        strengths: [
          "Strong sense of personal preferences and interests",
          "Self-motivated when given choices",
          "Good at self-regulating reading pace and schedule",
          "Develops independent reading identity"
        ],
        parentStrategies: [
          "Provide lots of options but let them choose",
          "Avoid micromanaging their reading process",
          "Trust their instincts about what they want to read",
          "Create reading goals together rather than imposing them"
        ],
        bookRecommendations: [
          "Variety packs or collections with multiple genres",
          "Library visits where they can browse and discover",
          "Book series where they can choose which order to read",
          "Books that match their current interests and moods"
        ]
      },
      
      reflective_thinker: {
        parentName: "Reflective Thinker",
        quickSummary: "Your child loves connecting books to their life and thinking deeply about meaning",
        whatThisMeans: "Your Reflective Thinker uses reading for personal growth and understanding. They connect stories to their own experiences and think about big questions.",
        strengths: [
          "Makes personal connections to reading",
          "Thinks deeply about themes and meaning",
          "Uses reading for emotional processing and growth",
          "Appreciates books with depth and substance"
        ],
        parentStrategies: [
          "Give them time to process what they've read",
          "Ask open-ended questions about how stories connect to their life",
          "Keep a reading journal together for thoughts and connections",
          "Choose books that relate to their current life experiences"
        ],
        bookRecommendations: [
          "Books with deep themes about growing up, friendship, family",
          "Stories that connect to their current life experiences",
          "Books that explore big questions about life and relationships",
          "Character-driven stories with emotional depth"
        ]
      }
    },

    modifiers: {
      A: {
        parentName: "Achieving (High Standards)",
        whatThisMeans: "Your child has high personal standards and may feel frustrated when reading feels 'messy' or unclear.",
        parentStrategies: [
          "Emphasize that confusion means their brain is working hard to grow",
          "Celebrate effort and strategies, not just correct answers"
        ],
        phrases: [
          "I notice you're working really hard to understand that part",
          "Challenging books help your brain grow stronger"
        ]
      },
      E: {
        parentName: "Emerging (Building Confidence)",
        whatThisMeans: "Your child is building their reading confidence and feels proudest when they complete books successfully.",
        parentStrategies: [
          "Celebrate all reading victories, big and small",
          "Choose high-interest books at a comfortable reading level"
        ],
        phrases: [
          "I'm so proud of how you stuck with that book",
          "Look how much you've grown as a reader this year"
        ]
      },
      S: {
        parentName: "Supported (Thrives with Community)",
        whatThisMeans: "Your child reads best when they have people to share the experience with.",
        parentStrategies: [
          "Read along with them or read their books so you can discuss",
          "Create family reading time where everyone reads together"
        ],
        phrases: [
          "Tell me about your favorite character in that book",
          "Should we read this book together?"
        ]
      },
      P: {
        parentName: "Practical (Purpose-Driven)",
        whatThisMeans: "Your child is motivated by reading that connects to their interests and has clear value.",
        parentStrategies: [
          "Connect all reading to their current interests and hobbies",
          "Show them how reading skills apply to their goals"
        ],
        phrases: [
          "How does this book connect to [their interest]?",
          "You're becoming an expert on [their topic]"
        ]
      },
      I: {
        parentName: "Independent (Self-Directed)",
        whatThisMeans: "Your child reads best when they have autonomy and control over their reading journey.",
        parentStrategies: [
          "Provide many options but let them choose freely",
          "Trust their instincts about what appeals to them"
        ],
        phrases: [
          "What kind of book are you in the mood for?",
          "You made a great choice with that book"
        ]
      },
      F: {
        parentName: "Focus-Needs (Minimal Distractions)",
        whatThisMeans: "Your child's brain works best in calm, quiet environments.",
        parentStrategies: [
          "Create a dedicated, quiet reading space in your home",
          "Use shorter reading sessions to match their attention span"
        ],
        phrases: [
          "Let's find a quiet spot for your reading time",
          "Take your time - there's no rush"
        ]
      },
      G: {
        parentName: "Growth-Oriented (Embraces Challenge)",
        whatThisMeans: "Your child sees confusion and difficulty as signs their brain is growing.",
        parentStrategies: [
          "Provide appropriately challenging books that stretch their skills",
          "Celebrate when they encounter difficulty - it means growth"
        ],
        phrases: [
          "Your brain is really working hard right now!",
          "You haven't mastered this YET, but you're getting there"
        ]
      },
      R: {
        parentName: "Routine-Loving (Thrives with Structure)",
        whatThisMeans: "Your child reads best when they have predictable routines and know what to expect.",
        parentStrategies: [
          "Establish consistent daily reading time and place",
          "Create predictable reading rituals"
        ],
        phrases: [
          "It's time for our daily reading hour",
          "Let's get your reading space set up just how you like it"
        ]
      }
    }
  }

  // Quick Tips for Parent Types
  const getQuickTips = (parentType) => {
    const tips = {
      autonomy_supporter: {
        daily: [
          "Let them choose 2-3 books from options you provide",
          "Ask 'What made you pick that book?' with genuine curiosity",
          "Honor their reading choices without immediate suggestions"
        ],
        weekly: [
          "Create a cozy reading corner they can customize",
          "Visit the library and let them browse freely",
          "Set up choice-based family reading time"
        ]
      },
      competence_builder: {
        daily: [
          "Celebrate effort: 'I noticed you kept trying when it got hard!'",
          "Point out strategies: 'You used that bookmark trick really well'",
          "Notice growth: 'You're reading longer books than last month!'"
        ],
        weekly: [
          "Set small, achievable reading goals together",
          "Create a reading progress chart they help design",
          "Practice one new reading strategy together"
        ]
      },
      connection_creator: {
        daily: [
          "Ask about characters like they're real people: 'How is Harry feeling?'",
          "Share your own reading: 'I'm reading about...'",
          "Read together for at least 10 minutes"
        ],
        weekly: [
          "Start a family book club with one shared book",
          "Create discussion time after reading",
          "Find books others in your community are reading"
        ]
      },
      meaning_maker: {
        daily: [
          "Ask: 'What did this remind you of from your life?'",
          "Explore themes: 'What do you think the author wants us to learn?'",
          "Connect books to current events or family experiences"
        ],
        weekly: [
          "Keep a family reading journal for deep thoughts",
          "Choose books that relate to current life events",
          "Discuss how books connect to family values"
        ]
      },
      growth_facilitator: {
        daily: [
          "Acknowledge challenge: 'This book is making your brain work hard!'",
          "Scaffold support: 'Would it help to read this part together?'",
          "Celebrate persistence: 'You didn't give up when it got confusing!'"
        ],
        weekly: [
          "Gradually increase book difficulty",
          "Create step-by-step reading goals",
          "Focus on progress over perfection"
        ]
      },
      authentic_modeler: {
        daily: [
          "Read your own book where they can see your enjoyment",
          "Share excitement: 'This part of my book was so surprising!'",
          "Model reading choices: 'I chose this because...'"
        ],
        weekly: [
          "Share what you're learning from your reading",
          "Read different types of books visibly",
          "Show how reading impacts your decisions"
        ]
      }
    }
    return tips[parentType] || tips.autonomy_supporter
  }

  // Enhanced Parent Guidance for Child (extracts from Firebase readingDNA structure)
  const getParentGuidanceForChild = (childReadingDNA) => {
    if (!childReadingDNA || !childReadingDNA.type) return null;
    
    const baseType = childReadingDNA.type;
    const modifiers = childReadingDNA.modifiers || [];
    const base = parentReadingDnaGuide.baseTypes[baseType];
    
    if (!base) return null;
    
    // Extract modifier guidance from both our guide and Firebase data
    const modifierAdvice = modifiers.map(mod => parentReadingDnaGuide.modifiers[mod]).filter(Boolean);
    const firebaseModifierDetails = childReadingDNA.modifierDetails || [];
    
    // Combine strategies from base type + modifiers + Firebase details
    const allStrategies = [
      ...base.parentStrategies, // All base strategies
      ...modifierAdvice.flatMap(mod => mod.parentStrategies), // All modifier strategies
      ...firebaseModifierDetails.flatMap(detail => detail.strategies || []) // Firebase strategies
    ];
    
    // Remove duplicates and take top strategies
    const uniqueStrategies = [...new Set(allStrategies)];
    
    // Create modifier descriptions
    const modifierDescriptions = modifiers.map(mod => {
      const guideData = parentReadingDnaGuide.modifiers[mod];
      const firebaseData = firebaseModifierDetails.find(detail => 
        detail.name && detail.name.charAt(0) === mod
      );
      
      return {
        code: mod,
        name: guideData?.parentName || firebaseData?.name || `${mod} Learner`,
        explanation: guideData?.whatThisMeans || firebaseData?.description || 'Special learning style',
        strategies: guideData?.parentStrategies || firebaseData?.strategies || []
      };
    }).filter(Boolean);
    
    return {
      childType: base.parentName,
      quickSummary: base.quickSummary,
      combinedDescription: `Your child is a ${base.parentName}${modifiers.length > 0 ? ' with ' + modifierDescriptions.map(mod => mod.name).join(' and ') + ' traits' : ''}.`,
      keyStrategies: uniqueStrategies.slice(0, 6), // Top 6 strategies
      helpfulPhrases: modifierAdvice.flatMap(mod => mod.phrases || []),
      bookRecommendations: base.bookRecommendations,
      hasModifiers: modifiers.length > 0,
      modifierExplanations: modifierDescriptions,
      fullCode: childReadingDNA.fullCode || `${baseType}-${modifiers.join('')}`,
      detailedType: `${base.parentName} (${modifierDescriptions.map(m => m.name).join(', ')})`
    };
  };

  // Calculate DNA type from answers (enhanced with better scoring)
  const calculateParentDNAType = useCallback((responses) => {
    const traitCounts = {}
    
    // Count trait occurrences with weighted scoring
    Object.entries(responses).forEach(([questionId, answerId]) => {
      const question = parentDNAQuestions.find(q => q.id === questionId)
      const answer = question?.options.find(opt => opt.id === answerId)
      
      if (answer?.traits) {
        answer.traits.forEach(trait => {
          traitCounts[trait] = (traitCounts[trait] || 0) + 1
        })
      }
    })

    // Map traits to DNA types and find best match
    const typeScores = {}
    
    Object.entries(parentDNATypes).forEach(([typeId, typeData]) => {
      let score = 0
      typeData.traits.forEach(trait => {
        if (traitCounts[trait]) {
          score += traitCounts[trait]
        }
      })
      typeScores[typeId] = score
    })

    // Find highest scoring type
    const bestType = Object.entries(typeScores).reduce((a, b) => 
      typeScores[a[0]] > typeScores[b[0]] ? a : b
    )[0]

    return {
      type: bestType,
      details: parentDNATypes[bestType],
      traitCounts,
      allScores: typeScores
    }
  }, [])

  // Enhanced compatibility with student modifiers
  const calculateFamilyCompatibility = useCallback((parentDNA, studentDNAs) => {
    const compatibilityMatrix = []
    
    studentDNAs.forEach(student => {
      if (student.readingDNA && student.readingDNA.type) {
        const parentType = parentDNA.type
        const studentType = student.readingDNA.type
        const studentModifiers = student.readingDNA.modifiers || []
        
        // Get compatibility insights
        const compatibility = getCompatibilityInsights(parentType, studentType, studentModifiers)
        
        compatibilityMatrix.push({
          studentId: student.id,
          studentName: student.firstName,
          studentType: studentType,
          studentModifiers: studentModifiers,
          studentGrade: student.grade,
          parentType: parentType,
          compatibilityLevel: compatibility.level,
          strengths: compatibility.strengths,
          considerations: compatibility.considerations,
          tips: compatibility.tips,
          hasCompletedDNA: true,
          parentGuidance: getParentGuidanceForChild(student.readingDNA)
        })
      }
    })
    
    return compatibilityMatrix
  }, [])

  // Enhanced compatibility insights that consider student modifiers
  const getCompatibilityInsights = (parentType, studentType, studentModifiers = []) => {
    // Base compatibility
    const compatibilityData = {
      'autonomy_supporter': {
        'freedom_reader': {
          level: 'Excellent Match',
          strengths: ['Natural autonomy alignment', 'Mutual respect for choices', 'Supports independent exploration'],
          considerations: ['May occasionally benefit from gentle guidance'],
          tips: ['Celebrate their book choices enthusiastically', 'Create rich reading environments for discovery', 'Ask "What made you choose this?" with genuine curiosity'],
          quickTip: 'Your natural trust in their choices perfectly supports their love of reading freedom!'
        },
        'creative_explorer': {
          level: 'Strong Match',
          strengths: ['Honors creative responses', 'Supports open-ended exploration', 'Values child\'s interpretations'],
          considerations: ['May occasionally need structure for skill-building'],
          tips: ['Provide materials for creative book responses', 'Ask "What did this inspire you to create?"', 'Honor all forms of literary response'],
          quickTip: 'Your support for their choices gives them freedom to explore and create!'
        },
        'challenge_seeker': {
          level: 'Good Match',
          strengths: ['Supports self-chosen challenges', 'Trusts child\'s readiness', 'Avoids pressure'],
          considerations: ['May need to help identify appropriate challenge levels'],
          tips: ['Let them choose their own reading goals', 'Celebrate self-directed achievement', 'Support their challenge preferences'],
          quickTip: 'Let them set their own reading challenges - they\'ll push themselves naturally!'
        }
      },
      'competence_builder': {
        'challenge_seeker': {
          level: 'Excellent Match',
          strengths: ['Perfect competence alignment', 'Strategic challenge support', 'Celebrates growth and effort'],
          considerations: ['Keep focus on learning rather than performance'],
          tips: ['Focus on effort and strategy development', 'Provide scaffolding for appropriate challenges', 'Celebrate persistence and problem-solving'],
          quickTip: 'Your focus on building skills perfectly matches their love of challenge!'
        },
        'curious_investigator': {
          level: 'Strong Match',
          strengths: ['Supports skill development', 'Builds reading strategies', 'Encourages mastery'],
          considerations: ['Maintain focus on learning rather than achievement'],
          tips: ['Help develop research and comprehension strategies', 'Celebrate knowledge gained', 'Support their investigative interests'],
          quickTip: 'Your strategic support helps them become even better at learning from books!'
        }
      },
      'connection_creator': {
        'social_connector': {
          level: 'Excellent Match',
          strengths: ['Perfect social alignment', 'Natural discussion partners', 'Shared reading enthusiasm'],
          considerations: ['Also support independent reading time'],
          tips: ['Create regular book discussion times', 'Share your own reading excitement', 'Connect them with reading communities'],
          quickTip: 'You both love sharing reading experiences - you\'re natural reading partners!'
        }
      },
      'meaning_maker': {
        'reflective_thinker': {
          level: 'Excellent Match',
          strengths: ['Perfect meaning alignment', 'Deep connection focus', 'Personal relevance emphasis'],
          considerations: ['Also include lighter, fun reading sometimes'],
          tips: ['Ask about personal connections to books', 'Explore deeper themes together', 'Connect reading to life experiences'],
          quickTip: 'You both love finding deeper meaning in books - explore those big ideas together!'
        }
      },
      'growth_facilitator': {
        'challenge_seeker': {
          level: 'Excellent Match',
          strengths: ['Perfect growth alignment', 'Optimal challenge support', 'Scaffolds appropriately'],
          considerations: ['Let them drive their own growth'],
          tips: ['Provide just-right challenge levels', 'Celebrate growth and progress', 'Support their stretching goals'],
          quickTip: 'Your growth focus perfectly supports their love of challenge!'
        }
      },
      'authentic_modeler': {
        'creative_explorer': {
          level: 'Strong Match',
          strengths: ['Models creative engagement', 'Shows authentic book joy', 'Inspires through example'],
          considerations: ['Honor their unique creative style'],
          tips: ['Share your own creative responses to books', 'Read creatively together', 'Model joy in discovery'],
          quickTip: 'Your authentic reading joy inspires their creative exploration!'
        },
        'curious_investigator': {
          level: 'Strong Match',
          strengths: ['Models learning curiosity', 'Shows research excitement', 'Demonstrates question-asking'],
          considerations: ['Let them lead their investigations'],
          tips: ['Share your own learning from books', 'Model curiosity and questioning', 'Research topics together'],
          quickTip: 'Your visible love of learning encourages their natural curiosity!'
        }
      }
    }
    
    const parentData = compatibilityData[parentType]
    let baseCompatibility = parentData?.[studentType] || {
      level: 'Growing Together',
      strengths: ['Complementary motivation styles', 'Opportunity for mutual learning', 'Balanced reading support'],
      considerations: ['Understanding different motivational needs'],
      tips: ['Ask your child what motivates their reading', 'Try adapting to their natural style', 'Combine your approaches thoughtfully'],
      quickTip: 'Every parent-child reading combination is unique and wonderful!'
    }
    
    // Modify based on student modifiers
    const modifierAdjustments = {
      'A': { // Achieving - needs encouragement about mistakes
        tips: [...baseCompatibility.tips, 'Remind them that confusion means learning is happening', 'Celebrate effort over perfection'],
        socialTip: 'They have high standards - emphasize that struggle shows their brain is growing!'
      },
      'E': { // Emerging - needs confidence building
        tips: [...baseCompatibility.tips, 'Choose books that ensure success', 'Celebrate every reading victory'],
        confidenceTip: 'They\'re building confidence - celebrate every reading win, big or small!'
      },
      'S': { // Supported - needs community
        tips: [...baseCompatibility.tips, 'Read along with them', 'Create discussion opportunities'],
        socialTip: 'They thrive with shared reading experiences - read together often!'
      },
      'F': { // Focus-needs - needs calm environment
        tips: [...baseCompatibility.tips, 'Create distraction-free reading spaces', 'Use shorter reading sessions'],
        focusTip: 'They need quiet, calm reading environments to do their best thinking!'
      },
      'I': { // Independent - needs autonomy
        tips: [...baseCompatibility.tips, 'Trust their book choices completely', 'Let them read at their own pace'],
        independenceTip: 'They thrive with complete reading independence - trust their instincts!'
      },
      'P': { // Practical - needs purpose
        tips: [...baseCompatibility.tips, 'Connect reading to their interests', 'Show real-world applications'],
        practicalTip: 'They love reading that connects to their interests and goals!'
      },
      'G': { // Growth-oriented - embraces challenge
        tips: [...baseCompatibility.tips, 'Celebrate when they struggle - it means growth!', 'Provide appropriately challenging books'],
        growthTip: 'They see difficulty as exciting - celebrate their growth mindset!'
      },
      'R': { // Routine-loving - needs structure
        tips: [...baseCompatibility.tips, 'Create predictable reading routines', 'Establish consistent reading times'],
        routineTip: 'They thrive with consistent reading routines and predictable structure!'
      }
    }
    
    // Apply modifier adjustments
    studentModifiers.forEach(modifier => {
      if (modifierAdjustments[modifier]) {
        baseCompatibility = {
          ...baseCompatibility,
          tips: modifierAdjustments[modifier].tips,
          socialTip: modifierAdjustments[modifier].socialTip || baseCompatibility.socialTip,
          confidenceTip: modifierAdjustments[modifier].confidenceTip || baseCompatibility.confidenceTip,
          focusTip: modifierAdjustments[modifier].focusTip || baseCompatibility.focusTip,
          independenceTip: modifierAdjustments[modifier].independenceTip || baseCompatibility.independenceTip,
          practicalTip: modifierAdjustments[modifier].practicalTip || baseCompatibility.practicalTip,
          growthTip: modifierAdjustments[modifier].growthTip || baseCompatibility.growthTip,
          routineTip: modifierAdjustments[modifier].routineTip || baseCompatibility.routineTip
        }
      }
    })
    
    return baseCompatibility
  }

  // Generate family reading recommendations
  const generateFamilyRecommendations = useCallback((parentDNA, familyCompatibility) => {
    const recommendations = []
    
    // Family-wide activities based on parent type
    const parentTypeActivities = {
      'autonomy_supporter': [
        'Create multiple cozy reading spaces and let children choose where to read',
        'Set up a family "book discovery" time where everyone shares interesting finds',
        'Let children lead family reading discussions about their chosen books'
      ],
      'competence_builder': [
        'Create a family reading growth chart to celebrate progress',
        'Practice reading strategies together during family reading time',
        'Start a family book challenge with achievable, self-set goals'
      ],
      'connection_creator': [
        'Start a weekly family book club with rotating discussion leaders',
        'Create reading traditions like story time before bed or weekend book brunches',
        'Share your own reading excitement and ask children about their favorites'
      ],
      'meaning_maker': [
        'Connect books to real life during family discussions',
        'Ask open-ended questions about how stories relate to your family\'s experiences',
        'Explore themes and deeper meanings in books together'
      ],
      'growth_facilitator': [
        'Provide just-right challenges by having books at multiple levels available',
        'Celebrate reading effort and persistence, not just completion',
        'Create supportive reading environments where struggle is normalized'
      ],
      'authentic_modeler': [
        'Read your own books openly where children can see your enjoyment',
        'Share your excitement about books you\'re reading',
        'Model how to choose books and talk about reading preferences'
      ]
    }
    
    recommendations.push({
      category: 'Family Activities',
      icon: '👨‍👩‍👧‍👦',
      items: parentTypeActivities[parentDNA.type] || parentTypeActivities['connection_creator']
    })
    
    // Individual child recommendations based on compatibility
    familyCompatibility.forEach(childData => {
      if (childData.parentGuidance) {
        recommendations.push({
          category: `Supporting ${childData.studentName}`,
          icon: '⭐',
          items: childData.parentGuidance.keyStrategies || [
            'Spend one-on-one reading time together',
            'Ask about their favorite characters and scenes',
            'Celebrate their reading achievements'
          ]
        })
      }
    })
    
    return recommendations
  }, [])

  // Unlock DNA Assessment for Child
  const unlockDNAForChild = async (childId) => {
    try {
      console.log('🔓 Unlocking DNA assessment for child:', childId)
      
      // Find the child in linked students
      const child = linkedStudents.find(s => s.id === childId)
      if (!child) {
        throw new Error('Child not found')
      }
      
      // Update the child's record to allow DNA assessment
      const studentRef = doc(db, `entities/${child.entityId}/schools/${child.schoolId}/students`, childId)
      await updateDoc(studentRef, {
        dnaUnlocked: true,
        dnaUnlockedBy: user.uid,
        dnaUnlockedAt: new Date(),
        lastModified: new Date()
      })
      
      // Update local state
      setLinkedStudents(prev => prev.map(student => 
        student.id === childId 
          ? { ...student, dnaUnlocked: true }
          : student
      ))
      
      setShowSuccess(`🎉 Reading DNA assessment unlocked for ${child.firstName}! They can now take their assessment.`)
      setTimeout(() => setShowSuccess(''), 4000)
      
    } catch (error) {
      console.error('❌ Error unlocking DNA assessment:', error)
      setShowSuccess('❌ Error unlocking assessment. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    }
  }

  // Load initial data
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && userProfile?.accountType === 'parent') {
      loadInitialData()
    } else if (!authLoading && !isAuthenticated) {
      router.push('/role-selector')
    } else if (!authLoading && userProfile?.accountType !== 'parent') {
      router.push('/student-dashboard')
    }
  }, [authLoading, isAuthenticated, user, userProfile])

  const loadInitialData = async () => {
    try {
      console.log('🧬 Loading family DNA lab data...')
      
      // Load parent profile
      const parentRef = doc(db, 'parents', user.uid)
      const parentDoc = await getDoc(parentRef)
      
      if (!parentDoc.exists()) {
        throw new Error('Parent profile not found')
      }

      const parentProfile = parentDoc.data()
      setParentData(parentProfile)
      
      // Check if parent has completed DNA assessment
      if (parentProfile.luxDNA && parentProfile.luxDNA.details) {
        setParentDNA(parentProfile.luxDNA)
        setHasCompletedAssessment(true)
      }

      // Load linked students with their DNA data
      await loadLinkedStudentsWithDNA(parentProfile.linkedStudents || [])
      
    } catch (error) {
      console.error('❌ Error loading family DNA data:', error)
      setError('Failed to load family DNA data. Please try again.')
    }
    
    setLoading(false)
  }

  const loadLinkedStudentsWithDNA = async (linkedStudentIds) => {
    try {
      const students = []
      const entitiesSnapshot = await getDocs(collection(db, 'entities'))
      
      for (const entityDoc of entitiesSnapshot.docs) {
        const entityId = entityDoc.id
        const schoolsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools`))
        
        for (const schoolDoc of schoolsSnapshot.docs) {
          const schoolId = schoolDoc.id
          const schoolData = schoolDoc.data()
          const studentsSnapshot = await getDocs(collection(db, `entities/${entityId}/schools/${schoolId}/students`))
          
          for (const studentDoc of studentsSnapshot.docs) {
            if (linkedStudentIds.includes(studentDoc.id)) {
              const studentData = {
                id: studentDoc.id,
                entityId,
                schoolId,
                schoolName: schoolData.name,
                ...studentDoc.data()
              }
              students.push(studentData)
            }
          }
        }
      }
      
      setLinkedStudents(students)
      
      // Only calculate compatibility if parent has completed assessment AND some children have too
      if (parentData?.luxDNA && parentData.luxDNA.type && parentData.luxDNA.details) {
        const studentsWithDNA = students.filter(student => student.readingDNA && student.readingDNA.type)
        
        if (studentsWithDNA.length > 0) {
          const compatibility = calculateFamilyCompatibility(parentData.luxDNA, studentsWithDNA)
          setFamilyCompatibility(compatibility)
          
          const recommendations = generateFamilyRecommendations(parentData.luxDNA, compatibility)
          setFamilyRecommendations(recommendations)
        } else {
          setFamilyCompatibility([])
          setFamilyRecommendations([])
        }
      } else {
        setFamilyCompatibility([])
        setFamilyRecommendations([])
      }
      
      console.log('✅ Linked students with DNA status loaded:', students.length)
      console.log('Students with completed DNA:', students.filter(s => s.readingDNA && s.readingDNA.type).length)
      
    } catch (error) {
      console.error('❌ Error loading linked students DNA:', error)
    }
  }

  // Handle assessment completion
  const completeAssessment = async () => {
    try {
      const dnaResult = calculateParentDNAType(answers)
      
      // Save to parent profile
      const parentRef = doc(db, 'parents', user.uid)
      await updateDoc(parentRef, {
        luxDNA: dnaResult,
        luxDNACompletedAt: new Date()
      })
      
      setParentDNA(dnaResult)
      setHasCompletedAssessment(true)
      setShowAssessment(false)
      
      // Only calculate compatibility with children who have completed their DNA
      const studentsWithDNA = linkedStudents.filter(student => student.readingDNA && student.readingDNA.type)
      
      if (studentsWithDNA.length > 0 && dnaResult && dnaResult.details) {
        const compatibility = calculateFamilyCompatibility(dnaResult, studentsWithDNA)
        setFamilyCompatibility(compatibility)
        
        const recommendations = generateFamilyRecommendations(dnaResult, compatibility)
        setFamilyRecommendations(recommendations)
      } else {
        setFamilyCompatibility([])
        setFamilyRecommendations([])
      }
      
      setShowSuccess('🎉 Your Family DNA Profile is complete!')
      setTimeout(() => setShowSuccess(''), 3000)
      
    } catch (error) {
      console.error('❌ Error completing assessment:', error)
      setShowSuccess('❌ Error saving assessment. Please try again.')
      setTimeout(() => setShowSuccess(''), 3000)
    }
  }

  // Handle answer selection
  const handleAnswerSelect = (answerId) => {
    setAnswers(prev => ({
      ...prev,
      [parentDNAQuestions[currentQuestion].id]: answerId
    }))
    
    // Auto-advance to next question after short delay
    setTimeout(() => {
      if (currentQuestion < parentDNAQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
      } else {
        // Assessment complete
        completeAssessment()
      }
    }, 500)
  }

  // Start assessment
  const startAssessment = () => {
    setAnswers({})
    setCurrentQuestion(0)
    setShowAssessment(true)
  }

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.current) return
    
    setShowNavMenu(false)
    
    setTimeout(() => {
      router.push(item.path)
    }, 100)
  }

  // Research modal handlers
  const openResearchModal = (dnaType) => {
    setSelectedDNATypeForResearch(dnaType)
    setShowResearchModal(true)
  }

  const closeResearchModal = () => {
    setShowResearchModal(false)
    setSelectedDNATypeForResearch(null)
  }

  // Unlock modal handlers
  const openUnlockModal = (child) => {
    setSelectedChildForUnlock(child)
    setShowUnlockModal(true)
  }

  const closeUnlockModal = () => {
    setShowUnlockModal(false)
    setSelectedChildForUnlock(null)
  }

  // Close nav menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNavMenu && !event.target.closest('.nav-menu-container')) {
        setShowNavMenu(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape' && showNavMenu) {
        setShowNavMenu(false)
      }
    }

    if (showNavMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showNavMenu])

  // Show loading while data loads
  if (authLoading || loading || !userProfile) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${luxTheme.primary}30`,
            borderTop: `3px solid ${luxTheme.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: luxTheme.textPrimary }}>Loading Family DNA Lab...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😞</div>
          <h2 style={{ color: luxTheme.textPrimary, marginBottom: '1rem' }}>Oops!</h2>
          <p style={{ color: luxTheme.textSecondary, marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: luxTheme.primary,
              color: luxTheme.textPrimary,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Family DNA Lab - Lux Libris Parent</title>
        <meta name="description" content="Discover your family's reading personalities and get personalized guidance" />
        <link rel="icon" href="/images/lux_libris_logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
      </Head>

      <div style={{
        backgroundColor: luxTheme.background,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '100px'
      }}>
        
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${luxTheme.primary}F0, ${luxTheme.secondary}F0)`,
          backdropFilter: 'blur(20px)',
          padding: '30px 20px 12px',
          position: 'relative',
          borderRadius: '0 0 25px 25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Back Button */}
          <button
            onClick={() => router.push('/parent/dashboard')}
            style={{
              position: 'absolute',
              left: '20px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: luxTheme.textPrimary,
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ←
          </button>

          {/* Centered Title */}
          <h1 style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: '400',
            color: luxTheme.textPrimary,
            margin: '0',
            letterSpacing: '1px',
            fontFamily: 'Didot, "Times New Roman", serif',
            textAlign: 'center'
          }}>
            Family DNA Lab
          </h1>

          {/* Hamburger Menu */}
          <div className="nav-menu-container" style={{ position: 'absolute', right: '20px' }}>
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                color: luxTheme.textPrimary,
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              ☰
            </button>

            {/* Dropdown Menu */}
            {showNavMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: luxTheme.surface,
                borderRadius: '12px',
                minWidth: '200px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${luxTheme.primary}60`,
                overflow: 'hidden',
                zIndex: 9999
              }}>
                {navMenuItems.map((item, index) => (
                  <button
                    key={item.path}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleNavigation(item)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: item.current ? `${luxTheme.primary}30` : 'transparent',
                      border: 'none',
                      borderBottom: index < navMenuItems.length - 1 ? `1px solid ${luxTheme.primary}40` : 'none',
                      cursor: item.current ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      fontWeight: item.current ? '600' : '500',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = `${luxTheme.primary}20`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.current) {
                        e.target.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                    {item.current && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: luxTheme.primary }}>●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>

          {/* Compact Header */}
          <div style={{
            background: `linear-gradient(135deg, ${luxTheme.secondary}, ${luxTheme.primary})`,
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: `0 6px 20px ${luxTheme.primary}30`,
            color: luxTheme.textPrimary,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧬</div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              fontFamily: 'Didot, serif',
              margin: '0 0 8px 0'
            }}>
              Family Reading DNA Lab
            </h2>
            <p style={{
              fontSize: '14px',
              margin: '0',
              opacity: 0.9,
              lineHeight: '1.4'
            }}>
              Smart insights for supporting each child&apos;s unique reading journey
            </p>
          </div>

          {/* Enhanced Disclaimer Badge */}
          <div style={{
            backgroundColor: `${luxTheme.primary}15`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            border: `1px solid ${luxTheme.primary}40`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>🔬</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: luxTheme.textPrimary }}>
                Research-Inspired Insight Tool
              </span>
              <button
                onClick={() => setShowDisclaimerModal(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: luxTheme.primary,
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  marginLeft: 'auto'
                }}
              >
                Important Info
              </button>
            </div>
            <p style={{ fontSize: '11px', color: luxTheme.textSecondary, margin: '0 0 8px 0', lineHeight: '1.4' }}>
              Based on Self-Determination Theory and reading motivation research. This tool provides personalized insights to help support your family&apos;s reading journey.
            </p>
            <div style={{
              backgroundColor: `${luxTheme.secondary}20`,
              borderRadius: '8px',
              padding: '8px',
              fontSize: '10px',
              color: luxTheme.textSecondary,
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              <strong>Note:</strong> This is not a diagnostic tool. Results are for educational insight and family guidance only.
            </div>
          </div>

          {/* Assessment Not Completed */}
          {!hasCompletedAssessment && (
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: `2px solid ${luxTheme.primary}30`
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔬</div>
              
              <h3 style={{
                fontSize: '22px',
                fontWeight: 'bold',
                color: luxTheme.textPrimary,
                marginBottom: '12px'
              }}>
                Take Your Parent Reading Assessment
              </h3>
              
              <p style={{
                fontSize: '16px',
                color: luxTheme.textSecondary,
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                Discover your parenting reading style and get personalized guidance for supporting each of your {linkedStudents.length} children.
              </p>

              {/* Assessment Disclaimer */}
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#7F1D1D',
                  lineHeight: '1.4',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
                  <div>
                    <strong>Important:</strong> This is an insight tool for family reflection, not a diagnostic assessment. 
                    Results provide general guidance and conversation starters about reading preferences.
                  </div>
                </div>
              </div>

              <button
                onClick={startAssessment}
                style={{
                  backgroundColor: luxTheme.primary,
                  color: luxTheme.textPrimary,
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                🧬 Start Assessment
              </button>

              <p style={{
                fontSize: '12px',
                color: luxTheme.textSecondary,
                marginTop: '16px',
                lineHeight: '1.4'
              }}>
                Takes about 4 minutes • {parentDNAQuestions.length} thoughtful questions
              </p>
            </div>
          )}

          {/* Assessment Completed - NEW MOBILE-FRIENDLY DESIGN */}
          {hasCompletedAssessment && parentDNA && (
            <>
              {/* Your Reading Parent Style - Condensed */}
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                border: `2px solid ${parentDNA.details.color}40`,
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '32px',
                    backgroundColor: parentDNA.details.color,
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {parentDNA.details.emoji}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary
                    }}>
                      You are a {parentDNA.details.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary
                    }}>
                      Your natural reading parent style
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowDetailedParentModal(true)}
                  style={{
                    backgroundColor: `${parentDNA.details.color}20`,
                    border: `1px solid ${parentDNA.details.color}60`,
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    cursor: 'pointer'
                  }}
                >
                  📖 Learn About Your Style
                </button>
              </div>

              {/* Quick Daily Tips */}
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    margin: 0
                  }}>
                    ⚡ Quick Daily Tips
                  </h3>
                  <button
                    onClick={() => setShowQuickTips(!showQuickTips)}
                    style={{
                      backgroundColor: luxTheme.primary,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      cursor: 'pointer'
                    }}
                  >
                    {showQuickTips ? '✕ Close' : '✨ Show Tips'}
                  </button>
                </div>

                {showQuickTips && (
                  <div style={{
                    backgroundColor: `${luxTheme.primary}15`,
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    {getQuickTips(parentDNA.type)?.daily.map((tip, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: index < getQuickTips(parentDNA.type).daily.length - 1 ? '12px' : '0'
                      }}>
                        <span style={{ fontSize: '14px', flexShrink: 0 }}>💡</span>
                        <span style={{
                          fontSize: '14px',
                          color: luxTheme.textPrimary,
                          lineHeight: '1.4'
                        }}>
                          {tip}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Children Section - COMPREHENSIVE Information with Progressive Disclosure */}
              <div style={{
                backgroundColor: luxTheme.surface,
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 16px 0',
                  textAlign: 'center'
                }}>
                  👨‍👩‍👧‍👦 Your Children&apos;s Reading DNA Profiles
                </h3>

                {linkedStudents.length > 0 ? (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {linkedStudents.map((student, index) => {
                      const hasCompletedDNA = student.readingDNA && student.readingDNA.type
                      const hasUnlockedDNA = student.dnaUnlocked === true
                      const parentGuidance = hasCompletedDNA ? getParentGuidanceForChild(student.readingDNA) : null
                      const isExpanded = expandedChild === student.id
                      
                      if (hasCompletedDNA) {
                        const compatibility = getCompatibilityInsights(
                          parentDNA.type, 
                          student.readingDNA?.type, 
                          student.readingDNA?.modifiers || []
                        )

                        return (
                          <div key={student.id} style={{
                            backgroundColor: `${luxTheme.primary}10`,
                            borderRadius: '16px',
                            padding: '20px',
                            border: `2px solid ${luxTheme.primary}30`
                          }}>
                            {/* Child Header with Full DNA Info */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '16px'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                              }}>
                                <div style={{
                                  fontSize: '32px',
                                  backgroundColor: luxTheme.primary,
                                  borderRadius: '50%',
                                  width: '50px',
                                  height: '50px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  🧬
                                </div>
                                <div>
                                  <div style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: luxTheme.textPrimary
                                  }}>
                                    {student.firstName}
                                  </div>
                                  <div style={{
                                    fontSize: '12px',
                                    color: luxTheme.textSecondary
                                  }}>
                                    Grade {student.grade} • {parentGuidance?.childType || 'Reading DNA Complete'}
                                  </div>
                                  {/* Full DNA Code Display */}
                                  <div style={{
                                    fontSize: '10px',
                                    color: luxTheme.primary,
                                    fontWeight: '600',
                                    backgroundColor: `${luxTheme.primary}20`,
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    marginTop: '4px',
                                    display: 'inline-block'
                                  }}>
                                    DNA: {parentGuidance?.fullCode || student.readingDNA.fullCode}
                                  </div>
                                </div>
                              </div>
                              
                              <div style={{
                                backgroundColor: compatibility.level === 'Excellent Match' ? '#10B981' : 
                                               compatibility.level === 'Strong Match' ? '#059669' :
                                               compatibility.level === 'Good Match' ? '#F59E0B' : '#6B7280',
                                color: 'white',
                                borderRadius: '12px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}>
                                {compatibility.level}
                              </div>
                            </div>

                            {/* Reading Type Summary */}
                            <div style={{
                              backgroundColor: `${luxTheme.secondary}20`,
                              borderRadius: '12px',
                              padding: '14px',
                              marginBottom: '16px'
                            }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: luxTheme.textPrimary,
                                marginBottom: '6px'
                              }}>
                                📚 {parentGuidance?.childType}: {parentGuidance?.quickSummary}
                              </div>
                              
                              {/* Modifier Display */}
                              {parentGuidance?.hasModifiers && (
                                <div style={{
                                  marginTop: '8px'
                                }}>
                                  <div style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: luxTheme.textPrimary,
                                    marginBottom: '4px'
                                  }}>
                                    🌟 Learning Style Modifiers:
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '4px'
                                  }}>
                                    {parentGuidance.modifierExplanations.map((modifier, idx) => (
                                      <span key={idx} style={{
                                        backgroundColor: `${luxTheme.primary}30`,
                                        color: luxTheme.textPrimary,
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: '600'
                                      }}>
                                        {modifier.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Quick Compatibility Insight */}
                            <div style={{
                              backgroundColor: `${luxTheme.accent}20`,
                              borderRadius: '12px',
                              padding: '12px',
                              marginBottom: '16px'
                            }}>
                              <div style={{
                                fontSize: '12px',
                                color: luxTheme.textPrimary,
                                lineHeight: '1.4',
                                marginBottom: '8px'
                              }}>
                                💡 <strong>Parent-Child Match:</strong> {compatibility.quickTip}
                              </div>
                              
                              {/* Learning Style Specific Quick Tips */}
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                marginTop: '8px'
                              }}>
                                {compatibility.socialTip && (
                                  <div style={{
                                    fontSize: '10px',
                                    backgroundColor: '#3B82F620',
                                    color: '#1E40AF',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: '500'
                                  }}>
                                    👥 Social: {compatibility.socialTip.substring(0, 40)}...
                                  </div>
                                )}
                                
                                {compatibility.confidenceTip && (
                                  <div style={{
                                    fontSize: '10px',
                                    backgroundColor: '#10B98120',
                                    color: '#065F46',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: '500'
                                  }}>
                                    🌟 Confidence: {compatibility.confidenceTip.substring(0, 40)}...
                                  </div>
                                )}
                                
                                {compatibility.independenceTip && (
                                  <div style={{
                                    fontSize: '10px',
                                    backgroundColor: '#8B5CF620',
                                    color: '#5B21B6',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: '500'
                                  }}>
                                    🗺️ Independence: {compatibility.independenceTip.substring(0, 40)}...
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              gap: '8px'
                            }}>
                              <button
                                onClick={() => setExpandedChild(isExpanded ? null : student.id)}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: `1px solid ${luxTheme.primary}60`,
                                  borderRadius: '8px',
                                  padding: '8px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: luxTheme.textPrimary,
                                  cursor: 'pointer'
                                }}
                              >
                                {isExpanded ? '➖ Less' : '➕ More'}
                              </button>
                              
                              <button
                                onClick={() => setShowCompatibilityModal(student.id)}
                                style={{
                                  backgroundColor: luxTheme.primary,
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: luxTheme.textPrimary,
                                  cursor: 'pointer'
                                }}
                              >
                                🔍 Deep Dive
                              </button>

                              <button
                                onClick={() => setShowDetailedChildModal(student.id)}
                                style={{
                                  backgroundColor: luxTheme.secondary,
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: luxTheme.textPrimary,
                                  cursor: 'pointer'
                                }}
                              >
                                📋 Full Profile
                              </button>
                            </div>

                            {/* Expanded Section - All Strategies */}
                            {isExpanded && (
                              <div style={{
                                marginTop: '16px',
                                backgroundColor: luxTheme.surface,
                                borderRadius: '12px',
                                padding: '16px'
                              }}>
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: luxTheme.textPrimary,
                                  marginBottom: '12px'
                                }}>
                                  ✨ Key Strategies for {student.firstName}:
                                </div>
                                
                                <div style={{
                                  display: 'grid',
                                  gap: '8px'
                                }}>
                                  {(parentGuidance?.keyStrategies || []).slice(0, 4).map((strategy, idx) => (
                                    <div key={idx} style={{
                                      fontSize: '12px',
                                      color: luxTheme.textSecondary,
                                      padding: '8px 12px',
                                      backgroundColor: `${luxTheme.primary}10`,
                                      borderRadius: '8px',
                                      borderLeft: `3px solid ${luxTheme.primary}`,
                                      lineHeight: '1.4'
                                    }}>
                                      • {strategy}
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Book Recommendations Preview */}
                                {parentGuidance?.bookRecommendations && (
                                  <div style={{
                                    marginTop: '12px',
                                    backgroundColor: `${luxTheme.secondary}15`,
                                    borderRadius: '8px',
                                    padding: '12px'
                                  }}>
                                    <div style={{
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      color: luxTheme.textPrimary,
                                      marginBottom: '6px'
                                    }}>
                                      📚 Book Recommendations:
                                    </div>
                                    <div style={{
                                      fontSize: '11px',
                                      color: luxTheme.textSecondary,
                                      lineHeight: '1.4'
                                    }}>
                                      {parentGuidance.bookRecommendations.slice(0, 2).join(' • ')}
                                      {parentGuidance.bookRecommendations.length > 2 && '...'}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      } else {
                        // Child hasn't completed DNA yet - keep existing unlock UI
                        return (
                          <div key={student.id} style={{
                            backgroundColor: hasUnlockedDNA ? '#F59E0B20' : '#F3F4F6',
                            borderRadius: '12px',
                            padding: '16px',
                            border: hasUnlockedDNA ? '2px dashed #F59E0B' : '2px dashed #9CA3AF'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '12px'
                            }}>
                              <div>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: luxTheme.textPrimary
                                }}>
                                  {student.firstName}
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  color: luxTheme.textSecondary
                                }}>
                                  Grade {student.grade}
                                </div>
                              </div>
                              
                              <div style={{
                                backgroundColor: hasUnlockedDNA ? '#F59E0B' : '#6B7280',
                                color: 'white',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                {hasUnlockedDNA ? '⏳ Unlocked' : '🔒 Locked'}
                              </div>
                            </div>

                            {hasUnlockedDNA ? (
                              <div style={{ textAlign: 'center', padding: '12px' }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                                <div style={{
                                  fontSize: '12px',
                                  color: luxTheme.textSecondary,
                                  lineHeight: '1.4'
                                }}>
                                  Assessment is unlocked! {student.firstName} can now take their Reading DNA assessment in their student dashboard.
                                </div>
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '12px' }}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔒</div>
                                <div style={{
                                  fontSize: '12px',
                                  color: luxTheme.textSecondary,
                                  marginBottom: '12px',
                                  lineHeight: '1.4'
                                }}>
                                  {student.firstName} needs permission to discover their reading personality.
                                </div>
                                
                                <button
                                  onClick={() => openUnlockModal(student)}
                                  style={{
                                    backgroundColor: luxTheme.primary,
                                    color: luxTheme.textPrimary,
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '8px 16px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🔓 Unlock Assessment
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      }
                    })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: luxTheme.textSecondary
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
                    <p>No children linked to your account yet.</p>
                  </div>
                )}
              </div>

              {/* Family Activities - Simplified */}
              {familyCompatibility.length > 0 && (
                <div style={{
                  backgroundColor: luxTheme.surface,
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      margin: 0
                    }}>
                      🏠 This Week&apos;s Family Activities
                    </h3>
                    <button
                      onClick={() => setShowFamilyActivitiesModal(true)}
                      style={{
                        backgroundColor: luxTheme.secondary,
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        cursor: 'pointer'
                      }}
                    >
                      📚 All Ideas
                    </button>
                  </div>

                  <div style={{
                    backgroundColor: `${luxTheme.accent}20`,
                    borderRadius: '12px',
                    padding: '16px',
                    borderLeft: `4px solid ${luxTheme.accent}`
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: luxTheme.textPrimary,
                      marginBottom: '6px'
                    }}>
                      📚 Choice-Based Family Reading Time
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: luxTheme.textSecondary,
                      lineHeight: '1.4'
                    }}>
                      Set up reading time where everyone chooses their own book and reads together in the same space. Perfect for your {parentDNA.details.name} style!
                    </div>
                  </div>
                </div>
              )}

              {/* Retake Assessment Button */}
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  onClick={startAssessment}
                  style={{
                    backgroundColor: luxTheme.textSecondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Retake Assessment
                </button>
              </div>
            </>
          )}
        </div>

        {/* Assessment Modal */}
        {showAssessment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '90vw',
              width: '100%',
              maxWidth: '500px',
              textAlign: 'center'
            }}>
              {/* Progress Bar */}
              <div style={{
                backgroundColor: `${luxTheme.primary}20`,
                borderRadius: '8px',
                height: '8px',
                marginBottom: '24px',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: luxTheme.primary,
                  height: '100%',
                  width: `${((currentQuestion + 1) / parentDNAQuestions.length) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>

              <p style={{
                fontSize: '14px',
                color: luxTheme.textSecondary,
                marginBottom: '16px'
              }}>
                Question {currentQuestion + 1} of {parentDNAQuestions.length}
              </p>

              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: luxTheme.textPrimary,
                marginBottom: '24px',
                lineHeight: '1.4'
              }}>
                {parentDNAQuestions[currentQuestion]?.question}
              </h3>

              <div style={{ display: 'grid', gap: '12px' }}>
                {parentDNAQuestions[currentQuestion]?.options.map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    style={{
                      backgroundColor: luxTheme.surface,
                      border: `2px solid ${luxTheme.primary}40`,
                      borderRadius: '12px',
                      padding: '16px',
                      fontSize: '14px',
                      color: luxTheme.textPrimary,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      lineHeight: '1.4'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `${luxTheme.primary}20`
                      e.target.style.borderColor = luxTheme.primary
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = luxTheme.surface
                      e.target.style.borderColor = `${luxTheme.primary}40`
                    }}
                  >
                    {option.text}
                  </button>
                ))}
              </div>

              {/* Assessment Disclaimer */}
              {currentQuestion === 0 && (
                <div style={{
                  backgroundColor: '#FEF9E7',
                  border: '1px solid #FCD34D',
                  borderRadius: '8px',
                  padding: '8px',
                  marginTop: '16px',
                  fontSize: '10px',
                  color: '#92400E',
                  textAlign: 'center',
                  lineHeight: '1.3'
                }}>
                  💭 This assessment provides insights for family reflection - not professional or diagnostic evaluation.
                </div>
              )}

              <button
                onClick={() => {
                  setShowAssessment(false)
                  setAnswers({})
                  setCurrentQuestion(0)
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: luxTheme.textSecondary,
                  border: 'none',
                  padding: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '16px'
                }}
              >
                Cancel Assessment
              </button>
            </div>
          </div>
        )}

        {/* Detailed Parent Modal */}
        {showDetailedParentModal && parentDNA && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  margin: 0,
                  color: luxTheme.textPrimary,
                  fontSize: '18px'
                }}>
                  {parentDNA.details.emoji} Your Reading Parent Style
                </h3>
                <button 
                  onClick={() => setShowDetailedParentModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: luxTheme.textSecondary
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{
                fontSize: '14px',
                color: luxTheme.textPrimary,
                lineHeight: '1.5',
                marginBottom: '16px'
              }}>
                {parentDNA.details.description}
              </div>

              <div style={{
                backgroundColor: `${parentDNA.details.color}15`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0'
                }}>
                  🌟 Your Natural Strengths:
                </h4>
                <ul style={{
                  fontSize: '12px',
                  color: luxTheme.textSecondary,
                  margin: 0,
                  paddingLeft: '20px',
                  lineHeight: '1.5'
                }}>
                  {parentDNA.details.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                backgroundColor: `${luxTheme.secondary}15`,
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0'
                }}>
                💫 How to Use Your Strengths:
                </h4>
                <ul style={{
                  fontSize: '12px',
                  color: luxTheme.textSecondary,
                  margin: 0,
                  paddingLeft: '20px',
                  lineHeight: '1.5'
                }}>
                  {parentDNA.details.approaches.map((approach, index) => (
                    <li key={index}>{approach}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => openResearchModal(parentDNA.details)}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${luxTheme.primary}60`,
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: luxTheme.primary,
                  cursor: 'pointer',
                  marginTop: '16px',
                  width: '100%'
                }}
              >
                🔬 View Research Inspiration
              </button>
            </div>
          </div>
        )}

        {/* Detailed Child Profile Modal */}
        {showDetailedChildModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto'
            }}>
              {(() => {
                const child = linkedStudents.find(c => c.id === showDetailedChildModal)
                if (!child || !child.readingDNA) return null

                const parentGuidance = getParentGuidanceForChild(child.readingDNA)
                if (!parentGuidance) return null

                const compatibility = getCompatibilityInsights(
                  parentDNA.type,
                  child.readingDNA?.type,
                  child.readingDNA?.modifiers || []
                )

                return (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        color: luxTheme.textPrimary,
                        fontSize: '18px'
                      }}>
                        📋 {child.firstName}&apos;s Reading Profile
                      </h3>
                      <button 
                        onClick={() => setShowDetailedChildModal(null)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          fontSize: '20px',
                          cursor: 'pointer',
                          color: luxTheme.textSecondary
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Reading Type Overview */}
                    <div style={{
                      backgroundColor: `${luxTheme.primary}20`,
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '32px',
                        marginBottom: '8px'
                      }}>
                        🧬
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        marginBottom: '4px'
                      }}>
                        {parentGuidance.childType}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: luxTheme.textSecondary,
                        marginBottom: '8px'
                      }}>
                        DNA Code: {parentGuidance.fullCode}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: luxTheme.textPrimary,
                        lineHeight: '1.4'
                      }}>
                        {parentGuidance.quickSummary}
                      </div>
                    </div>

                    {/* Learning Style Modifiers */}
                    {parentGuidance.hasModifiers && (
                      <div style={{
                        marginBottom: '20px'
                      }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: luxTheme.textPrimary,
                          margin: '0 0 12px 0'
                        }}>
                          🌟 Learning Style Details:
                        </h4>
                        {parentGuidance.modifierExplanations.map((modifier, idx) => (
                          <div key={idx} style={{
                            backgroundColor: `${luxTheme.secondary}15`,
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '8px',
                            border: `1px solid ${luxTheme.secondary}40`
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: luxTheme.textPrimary,
                              marginBottom: '4px'
                            }}>
                              {modifier.name} ({modifier.code})
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: luxTheme.textSecondary,
                              lineHeight: '1.4'
                            }}>
                              {modifier.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Key Support Strategies */}
                    <div style={{
                      marginBottom: '20px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        margin: '0 0 8px 0'
                      }}>
                        💡 Quick Insight:
                      </h4>
                      <p style={{
                        fontSize: '13px',
                        color: luxTheme.textPrimary,
                        lineHeight: '1.4',
                        margin: 0,
                        backgroundColor: `${luxTheme.primary}15`,
                        padding: '12px',
                        borderRadius: '8px'
                      }}>
                        {compatibility.quickTip}
                      </p>
                    </div>

                    <div style={{
                      marginBottom: '16px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        margin: '0 0 8px 0'
                      }}>
                        🎯 Specific Tips for {child.firstName}:
                      </h4>
                      <div style={{
                        backgroundColor: `${luxTheme.secondary}15`,
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        {compatibility.socialTip && (
                          <div style={{
                            fontSize: '12px',
                            color: luxTheme.textPrimary,
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px'
                          }}>
                            <span>👥</span>
                            <span>{compatibility.socialTip}</span>
                          </div>
                        )}
                        
                        {compatibility.confidenceTip && (
                          <div style={{
                            fontSize: '12px',
                            color: luxTheme.textPrimary,
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px'
                          }}>
                            <span>🌟</span>
                            <span>{compatibility.confidenceTip}</span>
                          </div>
                        )}
                        
                        {compatibility.independenceTip && (
                          <div style={{
                            fontSize: '12px',
                            color: luxTheme.textPrimary,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px'
                          }}>
                            <span>🗺️</span>
                            <span>{compatibility.independenceTip}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: `${luxTheme.accent}15`,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <h4 style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        margin: '0 0 6px 0'
                      }}>
                        📚 This Week&apos;s Action:
                      </h4>
                      <p style={{
                        fontSize: '11px',
                        color: luxTheme.textSecondary,
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        Try one tip from above and notice {child.firstName}&apos;s response. 
                        Small adjustments make big differences in reading motivation!
                      </p>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Compatibility Modal */}
        {showCompatibilityModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              {(() => {
                const child = linkedStudents.find(c => c.id === showCompatibilityModal)
                if (!child) return null

                const compatibility = getCompatibilityInsights(
                  parentDNA.type,
                  child.readingDNA?.type,
                  child.readingDNA?.modifiers || []
                )

                return (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        color: luxTheme.textPrimary,
                        fontSize: '18px'
                      }}>
                        🔍 Supporting {child.firstName}
                      </h3>
                      <button 
                        onClick={() => setShowCompatibilityModal(null)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          fontSize: '20px',
                          cursor: 'pointer',
                          color: luxTheme.textSecondary
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{
                      backgroundColor: compatibility.level === 'Excellent Match' ? '#10B98120' : 
                                     compatibility.level === 'Strong Match' ? '#05966920' :
                                     compatibility.level === 'Good Match' ? '#F59E0B20' : '#6B728020',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        marginBottom: '4px'
                      }}>
                        {compatibility.level} ✨
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: luxTheme.textSecondary
                      }}>
                        Your {parentDNA.details.name} style with their {child.readingDNA?.type?.replace('_', ' ')} personality
                      </div>
                    </div>

                    <div style={{
                      marginBottom: '16px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        margin: '0 0 8px 0'
                      }}>
                        💡 How This Works:
                      </h4>
                      <p style={{
                        fontSize: '13px',
                        color: luxTheme.textPrimary,
                        lineHeight: '1.4',
                        margin: 0,
                        backgroundColor: `${luxTheme.primary}15`,
                        padding: '12px',
                        borderRadius: '8px'
                      }}>
                        {compatibility.quickTip}
                      </p>
                    </div>

                    <div style={{
                      marginBottom: '16px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        margin: '0 0 8px 0'
                      }}>
                        🌟 Your Strengths Together:
                      </h4>
                      <ul style={{
                        fontSize: '12px',
                        color: luxTheme.textSecondary,
                        margin: 0,
                        paddingLeft: '20px',
                        lineHeight: '1.4'
                      }}>
                        {compatibility.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{
                      marginBottom: '16px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        margin: '0 0 8px 0'
                      }}>
                        💭 Things to Keep in Mind:
                      </h4>
                      <ul style={{
                        fontSize: '12px',
                        color: luxTheme.textSecondary,
                        margin: 0,
                        paddingLeft: '20px',
                        lineHeight: '1.4'
                      }}>
                        {compatibility.considerations.map((consideration, index) => (
                          <li key={index}>{consideration}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{
                      backgroundColor: `${luxTheme.accent}15`,
                      borderRadius: '12px',
                      padding: '16px'
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: luxTheme.textPrimary,
                        margin: '0 0 8px 0'
                      }}>
                        🎯 Specific Tips:
                      </h4>
                      <ul style={{
                        fontSize: '12px',
                        color: luxTheme.textPrimary,
                        margin: 0,
                        paddingLeft: '20px',
                        lineHeight: '1.4'
                      }}>
                        {compatibility.tips.slice(0, 4).map((tip, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* Family Activities Modal */}
        {showFamilyActivitiesModal && familyRecommendations.length > 0 && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  margin: 0,
                  color: luxTheme.textPrimary,
                  fontSize: '18px'
                }}>
                  📚 Family Reading Activities
                </h3>
                <button 
                  onClick={() => setShowFamilyActivitiesModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: luxTheme.textSecondary
                  }}
                >
                  ✕
                </button>
              </div>

              {familyRecommendations.map((category, index) => (
                <div key={index} style={{
                  marginBottom: index < familyRecommendations.length - 1 ? '20px' : '0'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: luxTheme.textPrimary,
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{category.icon}</span>
                    {category.category}
                  </h4>
                  
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} style={{
                        backgroundColor: `${luxTheme.primary}10`,
                        borderRadius: '12px',
                        padding: '12px',
                        borderLeft: `4px solid ${luxTheme.primary}`
                      }}>
                        <p style={{
                          fontSize: '13px',
                          color: luxTheme.textPrimary,
                          margin: 0,
                          lineHeight: '1.4'
                        }}>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DNA Unlock Modal */}
        {showUnlockModal && selectedChildForUnlock && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '90vw',
              width: '100%',
              maxWidth: '450px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔓</div>
                <h3 style={{ margin: '0 0 12px 0', color: luxTheme.textPrimary, fontSize: '20px' }}>
                  Unlock Reading DNA Assessment
                </h3>
                <p style={{ 
                  fontSize: '16px', 
                  color: luxTheme.textSecondary,
                  margin: '0 0 20px 0',
                  lineHeight: '1.5'
                }}>
                  Let {selectedChildForUnlock.firstName} discover their unique reading personality and learning style!
                </p>
              </div>
              
              <div style={{
                backgroundColor: `${luxTheme.primary}15`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  🧬 What {selectedChildForUnlock.firstName} will discover:
                </h4>
                <ul style={{
                  fontSize: '13px',
                  color: luxTheme.textSecondary,
                  margin: 0,
                  paddingLeft: '20px',
                  lineHeight: '1.4'
                }}>
                  <li>Their unique reading motivation style</li>
                  <li>Personalized book recommendations</li>
                  <li>Reading strategies that work for them</li>
                  <li>How they learn and grow best</li>
                </ul>
              </div>

              <div style={{
                backgroundColor: `${luxTheme.secondary}15`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'left'
              }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  💡 What you&apos;ll get:
                </h4>
                <ul style={{
                  fontSize: '13px',
                  color: luxTheme.textSecondary,
                  margin: 0,
                  paddingLeft: '20px',
                  lineHeight: '1.4'
                }}>
                  <li>Specific strategies to support their reading</li>
                  <li>Understanding of their learning preferences</li>
                  <li>Family compatibility insights</li>
                  <li>Helpful phrases and book recommendations</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    unlockDNAForChild(selectedChildForUnlock.id)
                    closeUnlockModal()
                  }}
                  style={{
                    backgroundColor: luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🔓 Unlock Assessment
                </button>
                <button
                  onClick={closeUnlockModal}
                  style={{
                    backgroundColor: 'transparent',
                    color: luxTheme.textSecondary,
                    border: `2px solid ${luxTheme.textSecondary}40`,
                    borderRadius: '12px',
                    padding: '14px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Research Modal */}
        {showResearchModal && selectedDNATypeForResearch && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '90vw',
              width: '100%',
              maxWidth: '550px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: luxTheme.textPrimary, fontSize: '20px' }}>🔬 Research Inspiration</h3>
                <button 
                  onClick={closeResearchModal}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: luxTheme.textSecondary,
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '16px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px', color: selectedDNATypeForResearch.color }}>{selectedDNATypeForResearch.emoji}</span>
                  {selectedDNATypeForResearch.name}
                </h4>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  Research Theory:
                </h4>
                <div style={{
                  backgroundColor: `${selectedDNATypeForResearch.color}15`,
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '13px',
                  color: luxTheme.textSecondary,
                  lineHeight: '1.4'
                }}>
                  <strong>{selectedDNATypeForResearch.keyResearch?.theory}</strong>
                  <br />
                  {selectedDNATypeForResearch.keyResearch?.principle}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  Research Application:
                </h4>
                <p style={{ 
                  fontSize: '13px', 
                  color: luxTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.4',
                  backgroundColor: `${luxTheme.primary}10`,
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  {selectedDNATypeForResearch.keyResearch?.application}
                </p>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  Research Evidence:
                </h4>
                <p style={{ 
                  fontSize: '12px', 
                  color: luxTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.3',
                  fontStyle: 'italic',
                  backgroundColor: `${luxTheme.secondary}15`,
                  padding: '10px',
                  borderRadius: '6px'
                }}>
                  {selectedDNATypeForResearch.keyResearch?.evidence}
                </p>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  How This Supports Your Children:
                </h4>
                <ul style={{
                  fontSize: '13px',
                  color: luxTheme.textSecondary,
                  margin: 0,
                  paddingLeft: '20px',
                  lineHeight: '1.4'
                }}>
                  {selectedDNATypeForResearch.approaches?.map((approach, index) => (
                    <li key={index} style={{ marginBottom: '6px' }}>{approach}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                backgroundColor: `${luxTheme.primary}15`,
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <p style={{ 
                  fontSize: '11px', 
                  color: luxTheme.textSecondary,
                  margin: '0 0 6px 0',
                  lineHeight: '1.3'
                }}>
                  <strong>Research Context:</strong> This tool draws inspiration from established educational psychology research 
                  but is designed for family insight and conversation - not diagnosis or clinical assessment.
                </p>
                <p style={{ 
                  fontSize: '10px', 
                  color: luxTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.3',
                  fontStyle: 'italic'
                }}>
                  Trust your parent instincts above all - you know your family best! 💚
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Disclaimer Modal */}
        {showDisclaimerModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: luxTheme.surface,
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '90vw',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: luxTheme.textPrimary, fontSize: '18px' }}>⚠️ Important Information</h3>
                <button 
                  onClick={() => setShowDisclaimerModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: luxTheme.textSecondary,
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
              
              {/* Not Diagnostic */}
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '2px solid #FECACA',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <h4 style={{ color: '#DC2626', fontSize: '14px', margin: '0 0 8px 0' }}>
                  🏥 Not a Diagnostic Tool
                </h4>
                <p style={{ 
                  fontSize: '13px', 
                  color: '#7F1D1D',
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  This assessment is <strong>not a medical, psychological, or educational diagnostic tool</strong>. 
                  It does not diagnose learning disabilities, reading disorders, or any medical conditions. 
                  For professional assessment, consult qualified educational or healthcare professionals.
                </p>
              </div>

              {/* For Insight Only */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  💡 Educational Insight Only
                </h4>
                <p style={{ 
                  fontSize: '13px', 
                  color: luxTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  This tool provides general insights about reading preferences and motivation styles. 
                  Results are meant to spark conversation and offer gentle guidance - not replace professional judgment 
                  or override your knowledge of your child&apos;s needs.
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  🔬 Research-Inspired, Not Validated
                </h4>
                <p style={{ 
                  fontSize: '13px', 
                  color: luxTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  While inspired by established educational psychology research (like Self-Determination Theory), 
                  this specific assessment and its categories have not undergone rigorous scientific validation. 
                  Consider it a fun, thoughtful starting point for family reflection.
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  👨‍👩‍👧‍👦 Trust Your Parent Instincts
                </h4>
                <p style={{ 
                  fontSize: '13px', 
                  color: luxTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  You know your children best. If any suggestions don&apos;t feel right for your family, 
                  trust your instincts. Every child is unique, and what works varies greatly from family to family.
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: luxTheme.textPrimary, fontSize: '14px', margin: '0 0 8px 0' }}>
                  📚 Supplemental, Not Prescriptive
                </h4>
                <p style={{ 
                  fontSize: '13px', 
                  color: luxTheme.textSecondary,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  These insights supplement - never replace - professional educational guidance, 
                  teacher recommendations, or clinical assessments. Use this as one perspective among many 
                  when supporting your child&apos;s reading development.
                </p>
              </div>

              {/* Positive Note */}
              <div style={{
                backgroundColor: `${luxTheme.primary}15`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <h4 style={{ 
                  fontSize: '14px', 
                  color: luxTheme.textPrimary,
                  margin: '0 0 8px 0',
                  fontWeight: '600'
                }}>
                  🌟 Our Goal
                </h4>
                <p style={{ 
                  fontSize: '12px', 
                  color: luxTheme.textPrimary,
                  margin: 0,
                  lineHeight: '1.4'
                }}>
                  To spark joy, understanding, and meaningful conversations about reading in your family. 
                  Every insight is offered with care, respect for your family&apos;s uniqueness, and hope for 
                  wonderful reading adventures together! 📖✨
                </p>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => setShowDisclaimerModal(false)}
                  style={{
                    backgroundColor: luxTheme.primary,
                    color: luxTheme.textPrimary,
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✅ I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: luxTheme.primary,
            color: luxTheme.textPrimary,
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1001,
            fontSize: 'clamp(12px, 3.5vw, 14px)',
            fontWeight: '600',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            {showSuccess}
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          button {
            -webkit-tap-highlight-color: transparent;
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
            touch-action: manipulation;
          }
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
          
          @media (max-width: 768px) {
            .nav-menu-container > div {
              right: 10px !important;
              minWidth: 180px !important;
            }
          }

          @media (max-width: 480px) {
            .nav-menu-container > div {
              right: 5px !important;
              minWidth: 160px !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}