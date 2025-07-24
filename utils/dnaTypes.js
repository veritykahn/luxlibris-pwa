// utils/dnaTypes.js - DNA type definitions and assessment questions

import { enhancedParentTypes } from './enhancedParentTypes' 

export const parentDNAQuestions = [
  {
    id: 'reading_struggle_response',
    question: 'Your child has been avoiding a book they used to love. When you notice this, what\'s your instinct?',
    researchBase: 'Motivation repair and autonomy support research',
    options: [
      { 
        id: 'curious_exploration',
        text: 'Get curious about what changed - ask open questions about their experience with the book',
        traits: ['autonomy_supportive', 'emotionally_attuned', 'meaning_making']
      },
      { 
        id: 'environmental_adjustment', 
        text: 'Quietly adjust the environment - maybe offer different books or reading spaces without making it a big deal',
        traits: ['autonomy_supportive', 'growth_facilitating', 'subtle_influence']
      },
      {
        id: 'collaborative_problem_solving',
        text: 'Bring it up gently and work together to understand what would make reading feel good again',
        traits: ['connection_creating', 'collaborative', 'emotionally_supportive']
      },
      {
        id: 'skill_assessment',
        text: 'Wonder if the book became too challenging and look for ways to support their skills',
        traits: ['competence_building', 'strategic', 'problem_solving']
      },
      {
        id: 'patience_and_trust',
        text: 'Trust that this is temporary and give them space to work through whatever is happening',
        traits: ['growth_facilitating', 'patient', 'developmental_thinking']
      }
    ]
  },

  {
    id: 'child_excitement_response',
    question: 'Your child bursts in excitedly wanting to tell you everything about their book. You\'re in the middle of something important. What happens?',
    researchBase: 'Responsiveness and attachment research',
    options: [
      {
        id: 'immediate_engagement',
        text: 'Drop what you\'re doing - their excitement about reading takes priority over almost everything',
        traits: ['connection_creating', 'responsive', 'reading_prioritizing']
      },
      {
        id: 'authentic_attention',
        text: 'Say "I want to hear this! Give me two minutes to finish and then I\'m all yours"',
        traits: ['authentic_modeling', 'respectful', 'intentional_presence']
      },
      {
        id: 'child_led_timing',
        text: 'Ask them if they want to tell you now or if they\'d rather wait until you can really focus',
        traits: ['autonomy_supportive', 'respectful', 'choice_offering']
      },
      {
        id: 'capture_and_schedule',
        text: 'Listen briefly to capture their enthusiasm, then schedule a time to hear the full story',
        traits: ['growth_facilitating', 'organized', 'balancing_needs']
      },
      {
        id: 'meaning_focus',
        text: 'Listen for the most important part of what they want to share and focus there',
        traits: ['meaning_making', 'attuned', 'depth_seeking']
      }
    ]
  },

  {
    id: 'reading_difficulty_philosophy',
    question: 'Your child is struggling with reading fluency. Other parents are hiring tutors and using apps. What feels right to you?',
    researchBase: 'Intervention timing and autonomy research',
    options: [
      {
        id: 'strategic_intervention',
        text: 'Research effective approaches and create a systematic plan to build their skills',
        traits: ['competence_building', 'strategic', 'proactive']
      },
      {
        id: 'authentic_support',
        text: 'Focus on reading together and modeling your own love of books rather than formal intervention',
        traits: ['authentic_modeling', 'relationship_focused', 'indirect_influence']
      },
      {
        id: 'child_centered_approach',
        text: 'Talk with your child about how they\'re feeling and what kind of help they want',
        traits: ['autonomy_supportive', 'child_centered', 'collaborative']
      },
      {
        id: 'developmental_patience',
        text: 'Give them more time - children develop reading skills at different paces and you don\'t want to create anxiety',
        traits: ['growth_facilitating', 'patient', 'developmental_thinking']
      },
      {
        id: 'connection_first',
        text: 'Focus on making reading a positive, shared experience while keeping an eye on the skills',
        traits: ['connection_creating', 'relationship_prioritizing', 'holistic_thinking']
      },
      {
        id: 'meaning_motivation',
        text: 'Help them find books that connect to their interests and experiences - engagement will drive improvement',
        traits: ['meaning_making', 'interest_driven', 'intrinsic_motivation']
      }
    ]
  },

  {
    id: 'reading_preference_conflict',
    question: 'Your child only wants to read graphic novels/series books, but you worry they should be reading "real literature." What\'s your inner conflict?',
    researchBase: 'Text complexity and reading motivation research',
    options: [
      {
        id: 'trust_their_process',
        text: 'Any reading is good reading - their enthusiasm matters more than the format or perceived quality',
        traits: ['autonomy_supportive', 'trust_based', 'joy_prioritizing']
      },
      {
        id: 'gradual_expansion',
        text: 'Let them enjoy what they love while slowly introducing other types of books alongside',
        traits: ['growth_facilitating', 'strategic', 'both_and_thinking']
      },
      {
        id: 'skill_building_focus',
        text: 'Focus on whether they\'re building reading skills and stamina, regardless of the genre',
        traits: ['competence_building', 'strategic', 'outcome_focused']
      },
      {
        id: 'authentic_sharing',
        text: 'Share your own reading preferences honestly while respecting that theirs might be different',
        traits: ['authentic_modeling', 'respectful', 'individual_differences']
      },
      {
        id: 'connection_through_interest',
        text: 'Dive into their interests with them - if they love graphic novels, learn about what makes them compelling',
        traits: ['connection_creating', 'curious', 'interest_following']
      },
      {
        id: 'deeper_exploration',
        text: 'Help them think about what they love about these books and find those same elements in other types of literature',
        traits: ['meaning_making', 'analytical', 'bridge_building']
      }
    ]
  },

  {
    id: 'reading_motivation_philosophy',
    question: 'When you think about what truly motivates children to become lifelong readers, what feels most important?',
    researchBase: 'Intrinsic motivation and reading identity research',
    options: [
      {
        id: 'autonomy_and_choice',
        text: 'Having genuine choices and feeling ownership over their reading journey',
        traits: ['autonomy_supportive', 'choice_centered', 'intrinsic_motivation']
      },
      {
        id: 'competence_and_success',
        text: 'Feeling capable and experiencing success with appropriately challenging texts',
        traits: ['competence_building', 'mastery_oriented', 'strategic_support']
      },
      {
        id: 'connection_and_sharing',
        text: 'Having people to share their reading experiences with and feeling part of a reading community',
        traits: ['connection_creating', 'socially_motivated', 'relationship_centered']
      },
      {
        id: 'meaning_and_relevance',
        text: 'Finding personal significance and connection between books and their own life experiences',
        traits: ['meaning_making', 'relevance_focused', 'identity_development']
      },
      {
        id: 'natural_development',
        text: 'Being supported through their natural developmental process without pressure or artificial motivation',
        traits: ['growth_facilitating', 'developmental_thinking', 'organic_approach']
      },
      {
        id: 'authentic_modeling',
        text: 'Seeing adults who genuinely love reading and integrate it into their lives in authentic ways',
        traits: ['authentic_modeling', 'inspirational', 'natural_influence']
      }
    ]
  },

  {
    id: 'parental_reading_habits',
    question: 'How does your own relationship with reading influence your approach to supporting your children?',
    researchBase: 'Social modeling and intergenerational transmission research',
    options: [
      {
        id: 'intentional_modeling',
        text: 'I deliberately read where my children can see me and share my genuine enthusiasm for books',
        traits: ['authentic_modeling', 'intentional', 'conscious_influence']
      },
      {
        id: 'natural_sharing',
        text: 'I just live as a reader naturally, and hope they absorb that books are part of a good life',
        traits: ['authentic_modeling', 'indirect_influence', 'natural_integration']
      },
      {
        id: 'past_experience_influence',
        text: 'My own childhood reading experiences (positive or negative) strongly shape how I approach this with them',
        traits: ['reflective', 'experience_based', 'intergenerational_awareness']
      },
      {
        id: 'skill_focus',
        text: 'I focus more on ensuring they develop strong reading skills than on my own reading modeling',
        traits: ['competence_building', 'strategic', 'skill_prioritizing']
      },
      {
        id: 'growth_together',
        text: 'We\'re growing as readers together - I learn from them as much as they learn from me',
        traits: ['growth_facilitating', 'mutual_learning', 'collaborative']
      },
      {
        id: 'connection_building',
        text: 'I use my love of reading as a way to connect with them and share experiences together',
        traits: ['connection_creating', 'relationship_building', 'shared_experience']
      }
    ]
  },

  {
    id: 'reading_environment_creation',
    question: 'You\'re setting up reading spaces and routines in your home. What feels most important to get right?',
    researchBase: 'Environmental psychology and reading motivation research',
    options: [
      {
        id: 'choice_and_flexibility',
        text: 'Multiple options and flexibility - different spaces for different moods and reading preferences',
        traits: ['autonomy_supportive', 'flexible', 'choice_oriented']
      },
      {
        id: 'organized_accessibility',
        text: 'Well-organized systems where books and materials are easy to find and access',
        traits: ['competence_building', 'organized', 'accessibility_focused']
      },
      {
        id: 'cozy_connection',
        text: 'Warm, inviting spaces that feel good and make reading feel like a treat',
        traits: ['connection_creating', 'comfort_focused', 'positive_associations']
      },
      {
        id: 'meaningful_personalization',
        text: 'Spaces that reflect their interests and help them see reading as connected to who they are',
        traits: ['meaning_making', 'identity_supporting', 'personalized']
      },
      {
        id: 'natural_integration',
        text: 'Reading naturally integrated into daily life rather than set apart in special spaces',
        traits: ['authentic_modeling', 'natural_integration', 'lifestyle_focused']
      },
      {
        id: 'developmental_responsiveness',
        text: 'Spaces that can grow and change as the child\'s reading needs and interests develop',
        traits: ['growth_facilitating', 'adaptive', 'developmental_thinking']
      }
    ]
  },

  {
    id: 'reading_challenge_support',
    question: 'Your child is attempting a book that\'s quite challenging for them. They\'re struggling but haven\'t asked for help. What\'s your instinct?',
    researchBase: 'Zone of proximal development and help-seeking behavior research',
    options: [
      {
        id: 'respect_autonomy',
        text: 'Let them work through it - they\'ll ask for help if they need it, and the struggle might be valuable',
        traits: ['autonomy_supportive', 'trust_based', 'struggle_positive']
      },
      {
        id: 'strategic_support',
        text: 'Offer specific strategies or tools that might help, while letting them maintain ownership',
        traits: ['competence_building', 'strategic', 'supportive']
      },
      {
        id: 'gentle_connection',
        text: 'Check in about how it\'s going and let them know you\'re there if they want company',
        traits: ['connection_creating', 'supportive_presence', 'available']
      },
      {
        id: 'meaning_exploration',
        text: 'Ask what\'s compelling them about this book - understanding their motivation will help you know how to support',
        traits: ['meaning_making', 'curious', 'motivation_focused']
      },
      {
        id: 'developmental_assessment',
        text: 'Observe carefully to assess whether this is productive struggle or overwhelming frustration',
        traits: ['growth_facilitating', 'observant', 'developmental_thinking']
      },
      {
        id: 'authentic_sharing',
        text: 'Share your own experiences with challenging books and how you handle difficulty',
        traits: ['authentic_modeling', 'experiential', 'normalizing']
      }
    ]
  },

  {
    id: 'reading_success_celebration',
    question: 'Your child just finished a book they\'ve been working on for weeks. How do you naturally want to celebrate this achievement?',
    researchBase: 'Achievement motivation and celebration research',
    options: [
      {
        id: 'honor_their_choice',
        text: 'Ask them how they want to celebrate - let them choose what feels meaningful',
        traits: ['autonomy_supportive', 'child_centered', 'choice_honoring']
      },
      {
        id: 'acknowledge_growth',
        text: 'Focus on how much they\'ve grown as a reader and what skills they\'ve developed',
        traits: ['competence_building', 'growth_focused', 'skill_acknowledging']
      },
      {
        id: 'share_excitement',
        text: 'Share in their excitement and maybe plan a special reading-related activity together',
        traits: ['connection_creating', 'shared_joy', 'experience_creating']
      },
      {
        id: 'explore_meaning',
        text: 'Talk about what this book meant to them and how it might have changed their thinking',
        traits: ['meaning_making', 'reflective', 'depth_seeking']
      },
      {
        id: 'natural_acknowledgment',
        text: 'Acknowledge it naturally without making a big deal - let the intrinsic satisfaction be the main reward',
        traits: ['authentic_modeling', 'low_key', 'intrinsic_focus']
      },
      {
        id: 'document_progress',
        text: 'Help them see this achievement in the context of their overall reading journey and development',
        traits: ['growth_facilitating', 'perspective_giving', 'developmental_thinking']
      }
    ]
  }
]

// Enhanced Parent Support Types with better trait coverage
export const parentDNATypes = {
  autonomy_supporter: enhancedParentTypes.autonomy_supporter,
  competence_builder: enhancedParentTypes.competence_builder,
  connection_creator: enhancedParentTypes.connection_creator,
  meaning_maker: enhancedParentTypes.meaning_maker,
  growth_facilitator: enhancedParentTypes.growth_facilitator,
  authentic_modeler: enhancedParentTypes.authentic_modeler
}

// Parent-Friendly Student Reading DNA Guide (from comprehensive system)
export const parentReadingDnaGuide = {
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