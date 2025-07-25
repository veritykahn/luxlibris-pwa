// reading-dna-manager.js - Lux Libris Reading DNA Assessment (Combined Data + Functions)
import { db } from './lib/firebase'
import { collection, doc, setDoc, getDocs, getDoc, query, where, writeBatch } from 'firebase/firestore'

// READING DNA ASSESSMENT DATA
export const READING_DNA_QUESTIONS = [
  {
    id: 'intrinsic_motivation',
    question: 'What makes reading feel most satisfying to you?',
    researchBase: 'Inspired by what scientists know about reading motivation',
    options: [
      { 
        id: 'creative_expression', 
        text: 'When stories inspire me to imagine, draw, or create something new',
        motivationType: 'creative_explorer'
      },
      { 
        id: 'learning_discovery', 
        text: 'When I learn fascinating new facts or understand something better',
        motivationType: 'curious_investigator'
      },
      { 
        id: 'social_sharing', 
        text: 'When I can share exciting stories with friends or family',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      { 
        id: 'personal_accomplishment', 
        text: 'When I finish a book that seemed challenging at first',
        motivationType: 'challenge_seeker'
      },
      { 
        id: 'independent_choice', 
        text: 'When I get to pick exactly what I want to read',
        motivationType: 'freedom_reader',
        modifierHints: ['I']
      },
      { 
        id: 'deep_thinking', 
        text: 'When it makes me think deeply about life and myself',
        motivationType: 'reflective_thinker'
      }
    ]
  },
  {
    id: 'autonomy_preference',
    question: 'How do you like to choose what to read?',
    options: [
      { 
        id: 'browse_discover', 
        text: 'I love browsing and discovering books that catch my interest',
        motivationType: 'freedom_reader',
        modifierHints: ['I']
      },
      { 
        id: 'topic_driven', 
        text: 'I pick books about subjects I\'m curious to learn about',
        motivationType: 'curious_investigator',
        modifierHints: ['P']
      },
      { 
        id: 'social_recommendations', 
        text: 'I like getting recommendations from people I trust',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      { 
        id: 'mood_based', 
        text: 'I choose based on how I\'m feeling and what seems right',
        motivationType: 'reflective_thinker'
      },
      { 
        id: 'challenge_seeking', 
        text: 'I look for books that will challenge me and help me grow',
        motivationType: 'challenge_seeker'
      },
      { 
        id: 'creative_inspiration', 
        text: 'I choose books that might inspire my own creative projects',
        motivationType: 'creative_explorer'
      }
    ]
  },
  {
    id: 'optimal_challenge',
    question: 'What makes a book feel "just right" for you?',
    options: [
      { 
        id: 'creative_potential', 
        text: 'When it gives me lots of ideas for my own creations',
        motivationType: 'creative_explorer'
      },
      { 
        id: 'independence_choice', 
        text: 'When I get to read it at my own pace without pressure',
        motivationType: 'freedom_reader'
      },
      { 
        id: 'discussion_worthy', 
        text: 'When it\'s something I\'ll want to talk about with others',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      { 
        id: 'achievable_stretch', 
        text: 'When it\'s challenging but I know I can conquer it',
        motivationType: 'challenge_seeker'
      },
      { 
        id: 'learning_opportunity', 
        text: 'When it teaches me amazing things I really want to know',
        motivationType: 'curious_investigator',
        modifierHints: ['P']
      },
      { 
        id: 'meaningful_connection', 
        text: 'When it connects to my life and makes me think deeply',
        motivationType: 'reflective_thinker'
      }
    ]
  },
  {
    id: 'reading_environment',
    question: 'Where and when do you read best?',
    options: [
      { 
        id: 'quiet_focus', 
        text: 'Somewhere quiet where I can really concentrate and learn',
        motivationType: 'curious_investigator'
      },
      { 
        id: 'flexible_freedom', 
        text: 'Wherever I want - I like being free to read anywhere',
        motivationType: 'freedom_reader'
      },
      { 
        id: 'social_proximity', 
        text: 'Near family or friends, even if we\'re reading different books',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      { 
        id: 'personal_retreat', 
        text: 'In my own special reading spot where I can think deeply',
        motivationType: 'reflective_thinker'
      },
      { 
        id: 'inspiring_spaces', 
        text: 'In cozy or beautiful places that spark my imagination',
        motivationType: 'creative_explorer'
      },
      { 
        id: 'achievement_zone', 
        text: 'Somewhere I can focus on conquering difficult books',
        motivationType: 'challenge_seeker'
      }
    ]
  },
  {
    id: 'meaning_making',
    question: 'What do you do when you read something really interesting?',
    options: [
      { 
        id: 'create_express', 
        text: 'I want to create something - art, stories, or projects',
        motivationType: 'creative_explorer'
      },
      { 
        id: 'research_extend', 
        text: 'I want to learn even more about that topic',
        motivationType: 'curious_investigator',
        modifierHints: ['P']
      },
      { 
        id: 'challenge_harder', 
        text: 'I want to try reading something even more challenging',
        motivationType: 'challenge_seeker'
      },
      { 
        id: 'reflect_connect', 
        text: 'I think about how it connects to my life and experiences',
        motivationType: 'reflective_thinker'
      },
      { 
        id: 'share_discuss', 
        text: 'I want to share it with someone and hear their thoughts',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      { 
        id: 'explore_more', 
        text: 'I want to find more books like it on my own',
        motivationType: 'freedom_reader'
      }
    ]
  },
  {
    id: 'difficulty_response',
    question: 'When reading gets challenging, what helps you most?',
    options: [
      { 
        id: 'creative_approach', 
        text: 'Trying different ways to understand, like drawing or acting it out',
        motivationType: 'creative_explorer'
      },
      { 
        id: 'own_methods', 
        text: 'Finding my own way to figure it out without asking for help',
        motivationType: 'freedom_reader'
      },
      { 
        id: 'collaborative_support', 
        text: 'Talking it through with someone who can help me understand',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      { 
        id: 'persistent_effort', 
        text: 'Sticking with it because I love conquering hard things',
        motivationType: 'challenge_seeker'
      },
      { 
        id: 'strategic_learning', 
        text: 'Breaking it down step by step and researching more',
        motivationType: 'curious_investigator'
      },
      { 
        id: 'thoughtful_reflection', 
        text: 'Taking time to think deeply about what it means',
        motivationType: 'reflective_thinker'
      }
    ]
  },
  {
    id: 'confusion_response',
    question: 'How do you feel when you read something and don\'t understand it right away?',
    options: [
      {
        id: 'excited_puzzle',
        text: 'Excited - it\'s like a fun puzzle to solve!',
        motivationType: 'challenge_seeker',
        modifierHints: ['G']
      },
      {
        id: 'creative_interpretation',
        text: 'Curious - I wonder what it could mean and imagine possibilities',
        motivationType: 'creative_explorer'
      },
      {
        id: 'research_mode',
        text: 'Motivated to look up more information to understand it',
        motivationType: 'curious_investigator'
      },
      {
        id: 'need_clarity',
        text: 'I prefer to ask for help so I can understand it perfectly',
        motivationType: 'reflective_thinker',
        modifierHints: ['A', 'S']
      },
      {
        id: 'reread_master',
        text: 'I keep reading it until it makes complete sense to me',
        motivationType: 'challenge_seeker',
        modifierHints: ['A', 'R']
      },
      {
        id: 'discuss_understanding',
        text: 'I like to talk about it with others to figure it out together',
        motivationType: 'social_connector',
        modifierHints: ['S']
      }
    ]
  },
  {
    id: 'book_completion_pride',
    question: 'What makes you feel most proud about your reading?',
    options: [
      { 
        id: 'creative_achievement', 
        text: 'When I create something inspired by what I read',
        motivationType: 'creative_explorer'
      },
      { 
        id: 'any_completion', 
        text: 'When I finish any book I\'ve chosen, no matter how long',
        motivationType: 'freedom_reader',
        modifierHints: ['E']
      },
      { 
        id: 'connection_building', 
        text: 'When reading helps me connect better with other people',
        motivationType: 'social_connector'
      },
      { 
        id: 'personal_growth', 
        text: 'When reading helps me understand myself and the world better',
        motivationType: 'reflective_thinker'
      },
      { 
        id: 'practical_knowledge', 
        text: 'When I learn something I can actually use in my life',
        motivationType: 'curious_investigator',
        modifierHints: ['P']
      },
      { 
        id: 'difficult_conquest', 
        text: 'When I finish books that seemed really hard at first',
        motivationType: 'challenge_seeker'
      }
    ]
  },
  {
    id: 'reading_confidence',
    question: 'When do you feel most confident as a reader?',
    options: [
      {
        id: 'solo_discovery',
        text: 'When I discover amazing books completely on my own',
        motivationType: 'freedom_reader',
        modifierHints: ['I']
      },
      {
        id: 'creative_flow',
        text: 'When reading gives me tons of creative ideas',
        motivationType: 'creative_explorer'
      },
      {
        id: 'shared_experience',
        text: 'When I\'m reading along with friends or family',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      {
        id: 'comfortable_level',
        text: 'When I\'m reading books that feel just right for me',
        motivationType: 'reflective_thinker',
        modifierHints: ['E', 'F']
      },
      {
        id: 'expert_feeling',
        text: 'When I\'m reading about topics I already know something about',
        motivationType: 'curious_investigator',
        modifierHints: ['P']
      },
      {
        id: 'conquering_challenges',
        text: 'When I\'m pushing through something difficult and succeeding',
        motivationType: 'challenge_seeker'
      }
    ]
  },
  {
    id: 'motivation_source',
    question: 'What gets you most excited about reading?',
    options: [
      { 
        id: 'knowledge_discovery', 
        text: 'All the incredible things I can learn and understand',
        motivationType: 'curious_investigator'
      },
      { 
        id: 'complete_freedom', 
        text: 'Having total freedom to read whatever I want, whenever I want',
        motivationType: 'freedom_reader'
      },
      { 
        id: 'overcome_challenges', 
        text: 'Proving I can read anything, no matter how hard it seems',
        motivationType: 'challenge_seeker'
      },
      { 
        id: 'personal_journey', 
        text: 'How reading helps me grow and discover who I am',
        motivationType: 'reflective_thinker'
      },
      { 
        id: 'creative_possibilities', 
        text: 'All the amazing worlds and ideas I can explore and create from',
        motivationType: 'creative_explorer'
      },
      { 
        id: 'shared_experiences', 
        text: 'Being able to share stories and connect with others through books',
        motivationType: 'social_connector',
        modifierHints: ['S']
      }
    ]
  },
  {
    id: 'reading_identity',
    question: 'How do you see yourself as a reader?',
    options: [
      { 
        id: 'creative_visionary', 
        text: 'As someone who uses books to fuel my imagination and creativity',
        motivationType: 'creative_explorer'
      },
      { 
        id: 'knowledge_seeker', 
        text: 'As someone who reads to learn and understand the world',
        motivationType: 'curious_investigator'
      },
      { 
        id: 'community_reader', 
        text: 'As someone who shares the joy of reading with others',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      { 
        id: 'challenge_champion', 
        text: 'As someone who conquers difficult books and grows stronger',
        motivationType: 'challenge_seeker'
      },
      { 
        id: 'independent_explorer', 
        text: 'As someone who charts my own reading adventure',
        motivationType: 'freedom_reader'
      },
      { 
        id: 'thoughtful_philosopher', 
        text: 'As someone who reads to understand life and myself better',
        motivationType: 'reflective_thinker'
      }
    ]
  },
  {
    id: 'reading_success',
    question: 'When do you feel most successful as a reader?',
    options: [
      { 
        id: 'creative_output', 
        text: 'When my reading inspires me to make something amazing',
        motivationType: 'creative_explorer'
      },
      { 
        id: 'knowledge_application', 
        text: 'When I can use what I learned to understand something new',
        motivationType: 'curious_investigator'
      },
      { 
        id: 'social_impact', 
        text: 'When I help someone else discover a book they love',
        motivationType: 'social_connector'
      },
      { 
        id: 'challenge_victory', 
        text: 'When I finish a book that seemed too hard for me',
        motivationType: 'challenge_seeker'
      },
      { 
        id: 'autonomous_discovery', 
        text: 'When I find an incredible book completely on my own',
        motivationType: 'freedom_reader'
      },
      { 
        id: 'personal_insight', 
        text: 'When reading helps me understand something important about life',
        motivationType: 'reflective_thinker'
      }
    ]
  },
  {
    id: 'reading_environment_focus',
    question: 'What kind of reading environment helps you focus best?',
    options: [
      {
        id: 'quiet_dedicated',
        text: 'A quiet, dedicated reading spot with no distractions',
        motivationType: 'reflective_thinker',
        modifierHints: ['F', 'R']
      },
      {
        id: 'anywhere_flexible',
        text: 'I can read anywhere - I don\'t need special conditions',
        motivationType: 'freedom_reader',
        modifierHints: ['I']
      },
      {
        id: 'social_nearby',
        text: 'Where family or friends are nearby, even if busy',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      {
        id: 'routine_spot',
        text: 'The same comfortable spot at the same time each day',
        motivationType: 'reflective_thinker',
        modifierHints: ['R']
      },
      {
        id: 'inspiring_changing',
        text: 'Different inspiring places that spark my creativity',
        motivationType: 'creative_explorer',
        modifierHints: ['G']
      },
      {
        id: 'practical_setting',
        text: 'Where I can easily look things up or take notes',
        motivationType: 'curious_investigator',
        modifierHints: ['P']
      }
    ]
  },
  {
    id: 'challenge_approach',
    question: 'How do you feel about trying books that seem difficult?',
    options: [
      {
        id: 'embrace_challenge',
        text: 'Excited! Difficult books help my brain grow stronger',
        motivationType: 'challenge_seeker',
        modifierHints: ['G']
      },
      {
        id: 'need_confidence',
        text: 'I prefer books where I know I can succeed',
        motivationType: 'reflective_thinker',
        modifierHints: ['E']
      },
      {
        id: 'want_support',
        text: 'I like trying hard books when someone can help me',
        motivationType: 'social_connector',
        modifierHints: ['S']
      },
      {
        id: 'need_perfection',
        text: 'I want to understand everything perfectly before moving on',
        motivationType: 'curious_investigator',
        modifierHints: ['A']
      },
      {
        id: 'choose_own_level',
        text: 'I like picking my own level of challenge',
        motivationType: 'freedom_reader',
        modifierHints: ['I']
      },
      {
        id: 'need_purpose',
        text: 'I\'ll try hard books if they\'re about something I care about',
        motivationType: 'creative_explorer',
        modifierHints: ['P']
      }
    ]
  },
  {
    id: 'reading_routine',
    question: 'What helps you read consistently?',
    options: [
      {
        id: 'same_time_place',
        text: 'Reading at the same time and place every day',
        motivationType: 'reflective_thinker',
        modifierHints: ['R']
      },
      {
        id: 'complete_freedom',
        text: 'Having total freedom to read when I feel like it',
        motivationType: 'freedom_reader',
        modifierHints: ['I']
      },
      {
        id: 'reading_together',
        text: 'When my family or friends read at the same time',
        motivationType: 'social_connector',
        modifierHints: ['S', 'R']
      },
      {
        id: 'achievable_goals',
        text: 'Setting small, achievable reading goals I can meet',
        motivationType: 'challenge_seeker',
        modifierHints: ['E']
      },
      {
        id: 'interesting_books',
        text: 'Having books about topics that fascinate me',
        motivationType: 'curious_investigator',
        modifierHints: ['P']
      },
      {
        id: 'quiet_focused_time',
        text: 'Having quiet, focused time without interruptions',
        motivationType: 'creative_explorer',
        modifierHints: ['F']
      }
    ]
  }
];

// READING DNA TYPES (Student Assessment Results)
export const READING_DNA_TYPES = {
  creative_explorer: {
    name: 'Creative Explorer',
    emoji: '🎨',
    description: 'Reading sparks your imagination and inspires you to create amazing things! You love books that give you ideas for art, stories, and creative projects.',
    color: '#FF6B9D',
    researchNote: 'Scientists have found that when reading inspires creativity, it makes people want to read more!',
    intrinsicMotivators: ['Creative inspiration', 'Imaginative freedom', 'Artistic expression'],
    perfectBooks: ['Fantasy with rich worlds', 'Books with beautiful illustrations', 'Stories that inspire making things'],
    supportStrategies: [
      'Keep art supplies, journals, or building materials near your reading space',
      'Try responding to books through drawing, writing, or making things',
      'Look for books that inspire you to create projects'
    ]
  },
  curious_investigator: {
    name: 'Curious Investigator', 
    emoji: '🔬',
    description: 'You love learning fascinating facts and understanding how the world works! Reading is your tool for becoming an expert on things you care about.',
    color: '#4ECDC4',
    researchNote: 'Scientists have found that when reading satisfies curiosity, people become lifelong learners!',
    intrinsicMotivators: ['Learning and discovery', 'Building expertise', 'Satisfying curiosity'],
    perfectBooks: ['Non-fiction on your interests', 'Science and nature books', 'Biographies of people you admire'],
    supportStrategies: [
      'Follow up interesting books with more books on the same topic',
      'Keep a learning journal about cool facts you discover',
      'Share your expertise by teaching others what you\'ve learned'
    ]
  },
  social_connector: {
    name: 'Social Connector',
    emoji: '🦋', 
    description: 'Reading is more fun when you can share it with others! You love discussing books and connecting with friends and family through stories.',
    color: '#95E1D3',
    researchNote: 'Scientists have found that sharing reading experiences makes books more meaningful and memorable!',
    intrinsicMotivators: ['Social connection', 'Shared experiences', 'Building relationships through books'],
    perfectBooks: ['Stories about friendship and relationships', 'Books others in your community are reading', 'Stories with strong emotional connections'],
    supportStrategies: [
      'Find reading buddies or join book clubs with friends',
      'Share your favorite books with family and friends',
      'Talk about characters and stories with people you care about'
    ]
  },
  challenge_seeker: {
    name: 'Challenge Seeker',
    emoji: '🏔️',
    description: 'You love the feeling of conquering a difficult book! Challenges make reading exciting, and you feel proud when you accomplish reading goals.',
    color: '#D4A574',
    researchNote: 'Scientists have found that the right level of challenge keeps reading exciting and helps people grow!',
    intrinsicMotivators: ['Overcoming challenges', 'Feeling capable and strong', 'Personal achievement'],
    perfectBooks: ['Series that grow in complexity', 'Books slightly above your current level', 'Stories about characters overcoming obstacles'],
    supportStrategies: [
      'Set your own reading goals and challenges that feel exciting',
      'Celebrate your effort and persistence, not just finishing',
      'Look for books that stretch you without being overwhelming'
    ]
  },
  freedom_reader: {
    name: 'Freedom Reader',
    emoji: '🕊️',
    description: 'You read best when you have the freedom to choose what, when, and how to read! You love having control over your reading journey.',
    color: '#AED6F1',
    researchNote: 'Scientists have found that having choice in reading makes people more motivated and engaged!',
    intrinsicMotivators: ['Personal choice and control', 'Independent exploration', 'Self-direction'],
    perfectBooks: ['Wide variety of options to choose from', 'Books you discover on your own', 'Stories that match your current interests and moods'],
    supportStrategies: [
      'Choose your own books from lots of good options',
      'Read at your own pace and in your own way',
      'Trust your instincts about what you want to read'
    ]
  },
  reflective_thinker: {
    name: 'Reflective Thinker',
    emoji: '🌙',
    description: 'You love thinking deeply about books and connecting them to your life! Reading helps you understand yourself and the world around you.',
    color: '#4A5568',
    researchNote: 'Scientists have found that when reading connects to personal meaning, it becomes more powerful and memorable!',
    intrinsicMotivators: ['Personal connections', 'Deep understanding', 'Finding meaning and purpose'],
    perfectBooks: ['Books with deep themes and meaning', 'Stories that connect to your life experiences', 'Books that make you think about big questions'],
    supportStrategies: [
      'Give yourself time to think about what you read',
      'Keep a reading journal for your thoughts and connections',
      'Look for books that connect to your life and experiences'
    ]
  }
};

// MODIFIER STRATEGIES (Educator/Parent-Focused)
export const MODIFIER_STRATEGIES = {
  A: {
    name: 'Achieving',
    description: 'High standards and perfectionism',
    researchBase: 'Growth mindset research shows perfectionism can limit learning',
    indicators: ['Wants to understand everything perfectly', 'Gets frustrated with confusion', 'Avoids books they might not excel at'],
    strategies: [
      'Emphasize reading for joy and growth, not just achievement',
      'Model that confusion is part of learning and shows brain growth',
      'Celebrate effort, strategies, and persistence over perfection',
      'Choose "safe challenge" books with built-in supports'
    ]
  },
  E: {
    name: 'Emerging',
    description: 'Building confidence and competence',
    researchBase: 'Self-efficacy research shows confidence drives engagement',
    indicators: ['Feels proud completing any book', 'Needs encouragement to try new genres', 'Prefers familiar authors/series'],
    strategies: [
      'Choose high-interest books at comfortable reading level',
      'Celebrate all reading victories, big and small',
      'Use audiobooks paired with text to build confidence',
      'Create predictable reading successes with series and familiar authors'
    ]
  },
  S: {
    name: 'Supported',
    description: 'Thrives with guidance and community',
    researchBase: 'Scaffolding research shows guided practice improves outcomes',
    indicators: ['Prefers shared reading experiences', 'Likes discussing books immediately', 'More confident when not reading alone'],
    strategies: [
      'Create reading buddy systems or family reading time',
      'Use read-alouds and shared reading experiences',
      'Encourage immediate discussion after reading',
      'Provide gentle guidance in book selection'
    ]
  },
  P: {
    name: 'Practical',
    description: 'Purpose-driven and relevance-focused',
    researchBase: 'Relevance research shows connection to interests increases motivation',
    indicators: ['Prefers reading connected to real interests', 'Asks "Why do I need to read this?"', 'Loves learning useful information'],
    strategies: [
      'Connect all reading to student\'s hobbies and interests',
      'Use informational texts and biographies of people they admire',
      'Show clear real-world applications of reading skills',
      'Allow choice in topic-driven reading projects'
    ]
  },
  I: {
    name: 'Independent',
    description: 'Self-directed and autonomous',
    researchBase: 'Self-determination theory shows autonomy increases intrinsic motivation',
    indicators: ['Prefers choosing own books', 'Likes reading at own pace', 'Resists reading assignments or suggestions'],
    strategies: [
      'Provide many options and let them choose freely',
      'Avoid micromanaging their reading process',
      'Trust their instincts about what they want to read',
      'Create reading goals together rather than imposing them'
    ]
  },
  F: {
    name: 'Focus-Needs',
    description: 'Benefits from minimal distractions',
    researchBase: 'Attention research shows some children need quieter environments to process text',
    indicators: ['Gets distracted easily while reading', 'Reads better in quiet spaces', 'Struggles with comprehension in busy environments'],
    strategies: [
      'Create a dedicated, quiet reading space',
      'Use shorter reading sessions to match attention span',
      'Remove visual and auditory distractions during reading time',
      'Try noise-canceling headphones or soft background music'
    ]
  },
  G: {
    name: 'Growth-Oriented',
    description: 'Embraces challenge and learns from mistakes',
    researchBase: 'Growth mindset research shows embracing difficulty leads to greater achievement',
    indicators: ['Excited by challenging books', 'Views confusion as interesting', 'Learns from reading mistakes'],
    strategies: [
      'Provide appropriately challenging books that stretch skills',
      'Celebrate mistakes as learning opportunities',
      'Model thinking through difficult parts of books',
      'Use phrases like "You haven\'t understood this YET"'
    ]
  },
  R: {
    name: 'Routine-Loving',
    description: 'Thrives with structure and predictability',
    researchBase: 'Executive function research shows routine supports learning for many children',
    indicators: ['Reads better at same time/place daily', 'Likes knowing what to expect', 'Struggles with reading when routine is disrupted'],
    strategies: [
      'Establish consistent daily reading time and place',
      'Create predictable reading rituals and routines',
      'Use visual schedules or reading calendars',
      'Prepare for changes to routine in advance'
    ]
  }
};

// STUDENT-FRIENDLY MODIFIERS (Student-Facing)
export const STUDENT_FRIENDLY_MODIFIERS = {
  S: {
    name: 'Social Learner',
    emoji: '👥',
    description: 'You learn best when you can share ideas with others! Reading becomes more meaningful when you have people to discuss books with.',
    studentInsights: [
      'You make reading better for everyone around you',
      'Your questions and thoughts help other people understand too',
      'You turn reading into a community experience'
    ],
    studentTips: [
      'Find reading buddies or join book clubs',
      'Talk about books with family and friends right after reading',
      'Choose books you can discuss with people you care about'
    ]
  },
  A: {
    name: 'Thoughtful Achiever',
    emoji: '🎯',
    description: 'You care about really understanding what you read. You like to make sure things make sense before moving on.',
    studentInsights: [
      'Taking time to understand deeply shows you\'re a careful, smart reader',
      'Your attention to detail helps you catch things others might miss',
      'You have high standards because you care about doing your best'
    ],
    studentTips: [
      'Don\'t worry if you need to reread parts - that shows you care about understanding',
      'Ask questions when things don\'t make sense - that helps everyone learn',
      'Remember that confusion means your brain is working hard to grow'
    ]
  },
  E: {
    name: 'Confident Builder',
    emoji: '🌱',
    description: 'You grow stronger by celebrating every success, big or small. Each book you finish makes you a more confident reader.',
    studentInsights: [
      'You understand that every reader grows at their own pace',
      'You know that finishing any book is an achievement worth celebrating',
      'You build confidence by choosing books that feel just right'
    ],
    studentTips: [
      'Celebrate every book you finish, no matter how long it took',
      'Choose books that interest you and feel comfortable',
      'Remember that becoming a great reader takes time and practice'
    ]
  },
  P: {
    name: 'Purpose-Driven Learner',
    emoji: '🎪',
    description: 'You love learning things you can actually use and connect to your interests. Reading feels most exciting when it teaches you about things you care about.',
    studentInsights: [
      'You see the real-world value in what you learn from books',
      'You make connections between reading and your hobbies and interests',
      'You ask great questions like "How can I use this?" and "Why does this matter?"'
    ],
    studentTips: [
      'Look for books about your hobbies, interests, and future goals',
      'Read biographies of people you admire',
      'Connect what you read to real situations in your life'
    ]
  },
  I: {
    name: 'Self-Directed Explorer',
    emoji: '🗺️',
    description: 'You learn best when you have freedom to choose and explore on your own. You trust your instincts about what you want to read.',
    studentInsights: [
      'You have great instincts about what books will interest you',
      'You read best when you have control over your reading journey',
      'You enjoy discovering books and authors on your own'
    ],
    studentTips: [
      'Trust yourself to choose books that appeal to you',
      'Read at your own pace without pressure from others',
      'Explore different genres and authors that catch your interest'
    ]
  },
  F: {
    name: 'Focused Thinker',
    emoji: '🧘',
    description: 'You think most clearly in calm, quiet spaces without distractions. Your brain works best when you can really focus.',
    studentInsights: [
      'You know what kind of environment helps you concentrate best',
      'You understand that your brain needs quiet to process complex ideas',
      'You\'re good at creating the right conditions for learning'
    ],
    studentTips: [
      'Find a quiet, comfortable spot for your reading time',
      'It\'s okay to ask for less noise or fewer distractions when reading',
      'Take breaks when you feel overwhelmed or distracted'
    ]
  },
  G: {
    name: 'Challenge Embracer',
    emoji: '💪',
    description: 'You know that confusion and mistakes are just your brain growing stronger. You\'re excited by books that stretch your thinking.',
    studentInsights: [
      'You see difficult books as opportunities to grow',
      'You understand that struggle means learning is happening',
      'You bounce back from confusion because you know it\'s temporary'
    ],
    studentTips: [
      'Choose books that challenge you but don\'t overwhelm you',
      'When something is confusing, remember your brain is growing',
      'Celebrate the effort you put in, not just the final result'
    ]
  },
  R: {
    name: 'Steady Learner',
    emoji: '⭐',
    description: 'You thrive with predictable routines and knowing what to expect. Structure helps you feel confident and ready to learn.',
    studentInsights: [
      'You know that routines help you be your best self',
      'You understand that consistency leads to growth',
      'You appreciate when things are organized and predictable'
    ],
    studentTips: [
      'Create a regular reading time and place that works for you',
      'Use reading calendars or charts to track your progress',
      'Let others know when changes to routine might affect your reading'
    ]
  }
};

// ASSESSMENT CONFIGURATION
export const READING_DNA_CONFIG = {
  version: "1.0.0",
  academic_year: "2025-26",
  status: "active",
  assessment_type: "personality",
  target_ages: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  target_grades: [4, 5, 6, 7, 9, 10, 11, 12],
  total_questions: READING_DNA_QUESTIONS.length,
  estimated_time_minutes: 3,
  research_based: true,
  requires_unlock: true,
  created_date: "2025-01-01",
  last_updated: "2025-01-01",
  languages_supported: ["en"],
  accessibility_features: ["large_text", "high_contrast", "screen_reader_friendly", "audio_support"],
  privacy_compliant: true,
  educational_use_approved: true,
  catholic_educational_approved: true,
  parental_unlock_required: true
};

// FIREBASE MANAGEMENT FUNCTIONS (Matching Your Pattern Exactly)

// BULK SETUP FUNCTION - Complete Reading DNA Assessment
const setupReadingDnaAssessment = async () => {
  try {
    console.log('🧬 Setting up Reading DNA Assessment (overwrites existing)...')
    
    // Check if collections exist
    const questionsRef = collection(db, 'reading-dna-questions')
    const typesRef = collection(db, 'reading-dna-types')
    const modifiersRef = collection(db, 'reading-dna-modifiers')
    const configRef = collection(db, 'reading-dna-config')
    
    const existingQuestions = await getDocs(questionsRef)
    const existingTypes = await getDocs(typesRef)
    const existingModifiers = await getDocs(modifiersRef)
    const existingConfig = await getDocs(configRef)
    
    const totalExisting = existingQuestions.size + existingTypes.size + existingModifiers.size + existingConfig.size
    
    if (totalExisting > 0) {
      const overwrite = window.confirm(`Reading DNA Assessment collections exist with ${totalExisting} total documents. This will OVERWRITE all existing Reading DNA data with the current version. Continue?`)
      if (!overwrite) {
        return { success: false, message: 'Reading DNA setup cancelled' }
      }
    }
    
    // Clear existing data first (clean slate)
    if (totalExisting > 0) {
      console.log(`🗑️ Removing ${totalExisting} existing Reading DNA documents...`)
      const batch = writeBatch(db)
      const allCollections = [existingQuestions, existingTypes, existingModifiers, existingConfig]
      
      for (const collection of allCollections) {
        collection.forEach((doc) => {
          batch.delete(doc.ref)
        })
      }
      await batch.commit()
      console.log('✅ Existing Reading DNA data removed')
    }
    
    let processedCount = 0
    
    // 1. Add Questions
    console.log('📝 Adding Reading DNA questions...')
    for (const [index, question] of READING_DNA_QUESTIONS.entries()) {
      await setDoc(doc(db, 'reading-dna-questions', index.toString().padStart(3, '0')), {
        ...question,
        order: index,
        created_date: new Date().toISOString(),
        status: 'active'
      })
      console.log(`✅ Processed question: ${question.id}`)
      processedCount++
    }
    
    // 2. Add DNA Types
    console.log('🧬 Adding Reading DNA types...')
    for (const [typeId, typeData] of Object.entries(READING_DNA_TYPES)) {
      await setDoc(doc(db, 'reading-dna-types', typeId), {
        id: typeId,
        ...typeData,
        created_date: new Date().toISOString(),
        status: 'active'
      })
      console.log(`✅ Processed DNA type: ${typeData.name}`)
      processedCount++
    }
    
    // 3. Add Educator Modifier Strategies
    console.log('🎯 Adding educator modifier strategies...')
    for (const [modifierId, modifierData] of Object.entries(MODIFIER_STRATEGIES)) {
      await setDoc(doc(db, 'reading-dna-modifiers', `educator_${modifierId}`), {
        id: modifierId,
        type: 'educator',
        ...modifierData,
        created_date: new Date().toISOString(),
        status: 'active'
      })
      console.log(`✅ Processed educator modifier: ${modifierData.name}`)
      processedCount++
    }
    
    // 4. Add Student-Friendly Modifiers
    console.log('👥 Adding student-friendly modifiers...')
    for (const [modifierId, modifierData] of Object.entries(STUDENT_FRIENDLY_MODIFIERS)) {
      await setDoc(doc(db, 'reading-dna-modifiers', `student_${modifierId}`), {
        id: modifierId,
        type: 'student',
        ...modifierData,
        created_date: new Date().toISOString(),
        status: 'active'
      })
      console.log(`✅ Processed student modifier: ${modifierData.name}`)
      processedCount++
    }
    
    // 5. Add Configuration
    console.log('⚙️ Adding assessment configuration...')
    await setDoc(doc(db, 'reading-dna-config', 'current'), {
      ...READING_DNA_CONFIG,
      setup_date: new Date().toISOString(),
      questions_count: READING_DNA_QUESTIONS.length,
      types_count: Object.keys(READING_DNA_TYPES).length,
      modifiers_count: Object.keys(MODIFIER_STRATEGIES).length
    })
    console.log('✅ Processed configuration')
    processedCount++
    
    console.log(`🎉 Reading DNA Assessment setup complete! Processed ${processedCount} documents`)
    return {
      success: true,
      message: `Successfully set up Reading DNA Assessment with ${processedCount} documents for ${READING_DNA_CONFIG.academic_year}`,
      stats: { 
        total: processedCount, 
        questions: READING_DNA_QUESTIONS.length,
        types: Object.keys(READING_DNA_TYPES).length,
        modifiers: (Object.keys(MODIFIER_STRATEGIES).length * 2) + 1, // educator + student + config
        operation: 'full_setup',
        academic_year: READING_DNA_CONFIG.academic_year,
        version: READING_DNA_CONFIG.version
      }
    }
    
  } catch (error) {
    console.error('❌ Reading DNA setup error:', error)
    return { success: false, message: 'Reading DNA setup failed: ' + error.message }
  }
}

// GET READING DNA STATISTICS
const getReadingDnaStats = async () => {
  try {
    const questionsRef = collection(db, 'reading-dna-questions')
    const typesRef = collection(db, 'reading-dna-types')
    const modifiersRef = collection(db, 'reading-dna-modifiers')
    const configRef = collection(db, 'reading-dna-config')
    
    const [questionsSnapshot, typesSnapshot, modifiersSnapshot, configSnapshot] = await Promise.all([
      getDocs(questionsRef),
      getDocs(typesRef),
      getDocs(modifiersRef),
      getDocs(configRef)
    ])
    
    const stats = {
      total_documents: questionsSnapshot.size + typesSnapshot.size + modifiersSnapshot.size + configSnapshot.size,
      questions: questionsSnapshot.size,
      types: typesSnapshot.size,
      modifiers: modifiersSnapshot.size,
      active: 0,
      by_type: {
        educator_modifiers: 0,
        student_modifiers: 0
      },
      config: {
        exists: configSnapshot.size > 0,
        version: null,
        academic_year: null
      }
    }
    
    // Analyze modifiers by type
    modifiersSnapshot.forEach((doc) => {
      const modifier = doc.data()
      if (modifier.status === 'active') {
        stats.active++
      }
      
      if (modifier.type === 'educator') {
        stats.by_type.educator_modifiers++
      } else if (modifier.type === 'student') {
        stats.by_type.student_modifiers++
      }
    })
    
    // Count active questions and types
    questionsSnapshot.forEach((doc) => {
      const question = doc.data()
      if (question.status === 'active') {
        stats.active++
      }
    })
    
    typesSnapshot.forEach((doc) => {
      const type = doc.data()
      if (type.status === 'active') {
        stats.active++
      }
    })
    
    // Get config info
    configSnapshot.forEach((doc) => {
      const config = doc.data()
      stats.config.version = config.version
      stats.config.academic_year = config.academic_year
    })
    
    return stats
  } catch (error) {
    console.error('Error getting Reading DNA stats:', error)
    return {
      total_documents: 0,
      questions: 0,
      types: 0,
      modifiers: 0,
      active: 0,
      by_type: { educator_modifiers: 0, student_modifiers: 0 },
      config: { exists: false, version: null, academic_year: null }
    }
  }
}

// GET ASSESSMENT FOR STUDENTS (Active items only)
const getReadingDnaAssessment = async () => {
  try {
    console.log('📖 Loading Reading DNA assessment for students...')
    
    const questionsRef = collection(db, 'reading-dna-questions')
    const typesRef = collection(db, 'reading-dna-types')
    const modifiersRef = collection(db, 'reading-dna-modifiers')
    const configRef = collection(db, 'reading-dna-config')
    
    // Get active questions
    const questionsQuery = query(questionsRef, where('status', '==', 'active'))
    const questionsSnapshot = await getDocs(questionsQuery)
    
    const questions = []
    questionsSnapshot.forEach((doc) => {
      const data = doc.data()
      questions.push({
        id: data.id,
        question: data.question,
        researchBase: data.researchBase,
        options: data.options,
        order: data.order
      })
    })
    
    // Sort questions by order
    questions.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    // Get active types
    const typesQuery = query(typesRef, where('status', '==', 'active'))
    const typesSnapshot = await getDocs(typesQuery)
    
    const types = {}
    typesSnapshot.forEach((doc) => {
      const data = doc.data()
      types[data.id] = {
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        color: data.color,
        researchNote: data.researchNote,
        intrinsicMotivators: data.intrinsicMotivators,
        perfectBooks: data.perfectBooks,
        supportStrategies: data.supportStrategies
      }
    })
    
    // Get active student-friendly modifiers
    const studentModifiersQuery = query(modifiersRef, where('type', '==', 'student'), where('status', '==', 'active'))
    const studentModifiersSnapshot = await getDocs(studentModifiersQuery)
    
    const studentModifiers = {}
    studentModifiersSnapshot.forEach((doc) => {
      const data = doc.data()
      studentModifiers[data.id] = {
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        studentInsights: data.studentInsights,
        studentTips: data.studentTips
      }
    })
    
    // Get config
    const configSnapshot = await getDocs(configRef)
    let config = null
    configSnapshot.forEach((doc) => {
      config = doc.data()
    })
    
    return {
      questions,
      types,
      studentModifiers,
      config
    }
  } catch (error) {
    console.error('Error loading Reading DNA assessment:', error)
    return {
      questions: [],
      types: {},
      studentModifiers: {},
      config: null
    }
  }
}

// GET EDUCATOR RESOURCES (Modifier strategies for educators/parents)
const getEducatorModifierStrategies = async () => {
  try {
    console.log('👩‍🏫 Loading educator modifier strategies...')
    
    const modifiersRef = collection(db, 'reading-dna-modifiers')
    const educatorModifiersQuery = query(modifiersRef, where('type', '==', 'educator'), where('status', '==', 'active'))
    const educatorModifiersSnapshot = await getDocs(educatorModifiersQuery)
    
    const educatorStrategies = {}
    educatorModifiersSnapshot.forEach((doc) => {
      const data = doc.data()
      educatorStrategies[data.id] = {
        name: data.name,
        description: data.description,
        researchBase: data.researchBase,
        indicators: data.indicators,
        strategies: data.strategies
      }
    })
    
    return educatorStrategies
  } catch (error) {
    console.error('Error loading educator strategies:', error)
    return {}
  }
}

// ADD SINGLE QUESTION (For future expansion)
const addReadingDnaQuestion = async (questionData) => {
  try {
    console.log(`➕ Adding Reading DNA question: ${questionData.question?.substring(0, 50)}...`)
    
    // Validate required fields
    const requiredFields = ['id', 'question', 'options']
    for (const field of requiredFields) {
      if (!questionData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    // Get next order number
    const questionsRef = collection(db, 'reading-dna-questions')
    const questionsSnapshot = await getDocs(questionsRef)
    const nextOrder = questionsSnapshot.size
    
    const questionRef = doc(db, 'reading-dna-questions', nextOrder.toString().padStart(3, '0'))
    await setDoc(questionRef, {
      ...questionData,
      order: nextOrder,
      created_date: new Date().toISOString(),
      status: 'active'
    })
    
    console.log(`✅ Successfully added question: ${questionData.id}`)
    return {
      success: true,
      message: `Successfully added question ${questionData.id}`,
      stats: { added: 1, operation: 'single_question_add' }
    }
    
  } catch (error) {
    console.error('❌ Add Reading DNA question error:', error)
    return { success: false, message: 'Add question failed: ' + error.message }
  }
}

// VALIDATION HELPER
const validateReadingDnaResult = (dnaResult) => {
  const errors = []
  
  // Required fields
  const requiredFields = ['type', 'details', 'motivationCounts', 'modifiers', 'fullCode', 'responses']
  
  for (const field of requiredFields) {
    if (!dnaResult[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  }
  
  // Validate type exists
  if (dnaResult.type && !READING_DNA_TYPES[dnaResult.type]) {
    errors.push(`Invalid DNA type: ${dnaResult.type}`)
  }
  
  // Validate modifiers exist
  if (dnaResult.modifiers && Array.isArray(dnaResult.modifiers)) {
    dnaResult.modifiers.forEach(modifier => {
      if (!MODIFIER_STRATEGIES[modifier] && !STUDENT_FRIENDLY_MODIFIERS[modifier]) {
        errors.push(`Invalid modifier: ${modifier}`)
      }
    })
  }
  
  return errors
}

// EXPORTS (Matching Your Pattern)
export { 
  setupReadingDnaAssessment,           // Complete setup (overwrites)
  getReadingDnaStats,                  // Get collection statistics
  getReadingDnaAssessment,             // Get assessment for students
  getEducatorModifierStrategies,       // Get educator resources
  addReadingDnaQuestion,               // Add single question
  validateReadingDnaResult             // Validate DNA result structure
}

export default {
  setupReadingDnaAssessment,
  getReadingDnaStats,
  getReadingDnaAssessment,
  getEducatorModifierStrategies,
  addReadingDnaQuestion,
  validateReadingDnaResult
}