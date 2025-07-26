// lib/science-of-reading.js
// Comprehensive research database for the Science Center

export const READING_SCIENCE_RESEARCH = {
  version: "1.0.0",
  lastUpdated: "2025-01-25",
  totalStudies: 50,
  
  // Featured studies that rotate on the main page
  featuredStudies: [
    {
      id: 'sdt-reading-2020',
      title: 'Why Kids Choose to Read: The Power of Personal Interest',
      authors: 'De Naeghel, J., Van Keer, H., Vansteenkiste, M., & Rosseel, Y.',
      year: 2020,
      journal: 'Reading Research Quarterly',
      keyFinding: 'Children who read because they want to (for fun and interest) understand significantly more and read more often than children who read because they have to.',
      practicalTakeaway: 'Supporting your child\'s reading choices and interests creates stronger readers than rewards or requirements.',
      relevantForTypes: ['autonomy_supporter', 'freedom_reader'],
      doi: '10.1002/rrq.136',
      tags: ['motivation', 'autonomy', 'comprehension']
    },
    {
      id: 'attachment-reading-2019',
      title: 'The Magic of Reading Together: More Than Just Words',
      authors: 'Jimenez, M. E., Mendelsohn, A. L., Lin, Y., Shelton, P., & Reichman, N.',
      year: 2019,
      journal: 'Pediatrics',
      keyFinding: 'The warmth and connection during parent-child reading predicted both better reading skills and stronger emotional bonds - a "double benefit."',
      practicalTakeaway: 'HOW you read together matters more than how much - focus on connection and being present.',
      relevantForTypes: ['connection_creator', 'nurturing_nurturer'],
      doi: '10.1542/peds.2018-2290',
      tags: ['attachment', 'emotional development', 'parent-child interaction']
    },
    {
      id: 'neuroscience-reading-2021',
      title: 'Your Child\'s Brain on Books: The Joy Connection',
      authors: 'Pugh, K. R., Frost, S. J., Rothman, D. L., & Del Tufo, S. N.',
      year: 2021,
      journal: 'Nature Reviews Neuroscience',
      keyFinding: 'Brain scans show that when children enjoy reading, their brain\'s reward centers light up alongside language areas, creating stronger connections for learning.',
      practicalTakeaway: 'Happy reading experiences literally build stronger brain connections for reading skills.',
      relevantForTypes: ['all'],
      doi: '10.1038/s41583-021-00474-4',
      tags: ['neuroscience', 'brain development', 'learning']
    }
  ],

  // Research organized by category
  categories: {
    motivation: {
      name: 'What Makes Kids Want to Read',
      description: 'Understanding what drives children to pick up books',
      icon: '💫',
      studies: [
        {
          id: 'intrinsic-motivation-meta',
          title: 'The Power of Reading for Fun',
          authors: 'Schiefele, U., Schaffner, E., Möller, J., & Wigfield, A.',
          year: 2012,
          keyFinding: 'Children who read because they enjoy it understand 40% more of what they read compared to children who read because they have to. This difference is bigger than what most expensive reading programs achieve.',
  application: 'Helping children find books they genuinely enjoy is more powerful than most teaching techniques.',
          parentTypeApplications: {
            autonomy_supporter: 'Your approach of letting children choose their reading directly supports this finding.',
            competence_builder: 'Build skills using books they already find interesting for the best results.',
            meaning_maker: 'Help children find personal connections to activate their natural interest.'
          }
        },
        {
          id: 'flow-reading-2018',
          title: 'Finding the "Just Right" Book Sweet Spot',
          authors: 'Thissen, B. A., Menninghaus, W., & Schlotz, W.',
          year: 2018,
          keyFinding: 'Readers get most absorbed when books are just challenging enough - not too easy, not too hard.',
          application: 'The "just right" book isn\'t a luxury - it\'s the best way to keep kids engaged.',
          parentTypeApplications: {
            competence_builder: 'Your instinct to match books to ability is scientifically proven.',
            growth_facilitator: 'Gradually increasing difficulty keeps kids in the engagement zone.',
            challenge_seeker: 'Support appropriate challenges - not overwhelming ones - for best engagement.'
          }
        },
        {
          id: 'choice-reading-2016',
          title: 'The Magic Number for Book Choices',
          authors: 'Patall, E. A., Cooper, H., & Robinson, J. C.',
          year: 2016,
          keyFinding: 'Giving kids 3-5 book choices increased their reading time by 42% compared to assigned books.',
          application: 'Some choice is better than no choice, but too many options can overwhelm.',
          practicalTips: [
            'Offer 3-5 pre-selected options rather than unlimited choice',
            'Let children choose between parent-selected books',
            'Change up the choices regularly to keep things fresh'
          ]
        },
        {
          id: 'interest-driven-2020',
          title: 'When Interest Beats Reading Level',
          authors: 'Clinton, V., Taylor, T., Bajpayee, S., Davison, M. L., Carlson, S. E., & Seipel, B.',
          year: 2020,
          keyFinding: 'Strong interest in a topic can help kids understand books 2 grade levels above their usual reading level.',
          application: 'A child who loves sharks can understand harder shark books than their typical "level" suggests.',
          parentTypeApplications: {
            curious_investigator: 'Following deep interests helps kids read above grade level.',
            authentic_modeler: 'Share your genuine interests - excitement is contagious and helps overcome difficulty.'
          }
        }
      ]
    },

    attachment: {
      name: 'The Heart of Reading: Connection & Emotions',
      description: 'How relationships and feelings affect reading development',
      icon: '❤️',
      studies: [
        {
          id: 'bus-attachment-1995',
          title: 'Why Cuddles and Books Go Together',
          authors: 'Bus, A. G., & van IJzendoorn, M. H.',
          year: 1995,
          keyFinding: 'Children who feel emotionally safe with their reading partner read more often and develop better reading skills.',
          application: 'The emotional quality of reading time matters as much as the reading itself.',
          parentTypeApplications: {
            connection_creator: 'Your focus on bonding through books is backed by research.',
            nurturing_nurturer: 'Creating emotional safety during reading builds both literacy and security.'
          }
        },
        {
          id: 'reading-relationships-2017',
          title: 'Talking About Books: The Hidden Superpower',
          authors: 'Kucirkova, N., & Littleton, K.',
          year: 2017,
          keyFinding: 'Children who chat about books with trusted adults understand and remember stories 40% better.',
          application: 'Conversation about books is as important as the reading itself.',
          practicalStrategies: [
            'Ask open-ended questions: "What do you think will happen?"',
            'Share your own responses: "That part surprised me too!"',
            'Connect to shared experiences: "Remember when we..."'
          ]
        },
        {
          id: 'emotional-climate-2019',
          title: 'The Feelings Behind the Words',
          authors: 'Rodriguez, E. T., & Tamis-LeMonda, C. S.',
          year: 2019,
          keyFinding: 'A positive, relaxed feeling during reading time predicted vocabulary growth better than how often families read.',
          application: 'HOW you read matters more than HOW MUCH you read.',
          warningFlags: [
            'Tension or stress during reading can create lasting negative feelings about books',
            'Forcing reading when a child is upset backfires',
            'Pressure to perform takes away the emotional benefits'
          ]
        }
      ]
    },

    development: {
      name: 'How Reading Skills Naturally Grow',
      description: 'Understanding the journey from picture books to novels',
      icon: '📈',
      studies: [
        {
          id: 'simple-view-1986',
          title: 'The Two-Part Recipe for Reading',
          authors: 'Gough, P. B., & Tunmer, W. E.',
          year: 1986,
          keyFinding: 'Reading success = Being able to sound out words + Understanding what they mean. Both parts are essential.',
          application: 'Different children may need help with different parts at different times.',
          developmentalImplications: {
            early: 'Focus on both letter sounds AND story meaning',
            middle: 'Shift to understanding as word reading becomes automatic',
            advanced: 'Support deeper thinking and analysis'
          }
        },
        {
          id: 'stages-reading-2000',
          title: 'The Natural Stages of Learning to Read',
          authors: 'Chall, J. S.',
          year: 2000,
          keyFinding: 'Reading develops through predictable stages from "learning to read" to "reading to learn."',
          stages: [
            { age: '0-6', focus: 'Playing with sounds and early reading', parentRole: 'Read aloud, play rhyming games' },
            { age: '6-7', focus: 'Starting to read words', parentRole: 'Be patient, celebrate small wins' },
            { age: '7-9', focus: 'Reading more smoothly', parentRole: 'Provide lots of "just right" books' },
            { age: '9-14', focus: 'Reading to learn new things', parentRole: 'Support different types of books' },
            { age: '14+', focus: 'Thinking critically about reading', parentRole: 'Have deeper discussions' }
          ]
        },
        {
          id: 'zpd-reading-2018',
          title: 'The Learning Sweet Spot',
          authors: 'Fisher, D., Frey, N., & Hattie, J.',
          year: 2018,
          keyFinding: 'Kids learn best when they understand most of the book (85-95%) with a little help.',
          application: 'Books should stretch kids a bit but not overwhelm them - the "just right challenge" zone.',
          parentTypeApplications: {
            growth_facilitator: 'Your patient support approach helps kids stay in the learning zone.',
            competence_builder: 'Strategic help in the right moments maximizes skill building.'
          }
        }
      ]
    },

    neuroscience: {
      name: 'What Brain Science Tells Us About Reading',
      description: 'Simple brain facts that help us support young readers',
      icon: '🧠',
      studies: [
        {
          id: 'reading-brain-2018',
          title: 'How Brains Learn to Read',
          authors: 'Dehaene, S.',
          year: 2018,
          keyFinding: 'Reading isn\'t natural like talking - the brain has to rewire itself to connect letters with sounds and meaning.',
          application: 'Be patient - brains need lots of time and practice to build reading pathways.',
          brainFacts: [
            'It takes about 2000 hours of practice for reading to feel automatic',
            'Using multiple senses (seeing, hearing, touching) helps the brain learn',
            'Happy feelings during reading strengthen brain connections'
          ]
        },
        {
          id: 'stress-learning-2020',
          title: 'Why Stressed Kids Can\'t Learn Well',
          authors: 'Vogel, S., & Schwabe, L.',
          year: 2020,
          keyFinding: 'Stress hormones make it harder for the brain to form and recall memories during reading.',
          application: 'A relaxed, supportive environment literally helps the brain learn better.',
          stressReduction: [
            'Never use reading as punishment',
            'Skip timed reading tests at home',
            'Create cozy, comfortable reading spaces',
            'Let children stop when frustrated'
          ]
        },
        {
          id: 'mirror-neurons-2019',
          title: 'Monkey See, Monkey Read: How Kids Copy Us',
          authors: 'Iacoboni, M.',
          year: 2019,
          keyFinding: 'Children\'s brains automatically copy the reading behaviors they see in adults.',
          application: 'When children see you enjoying reading, their brains practice enjoying it too.',
          parentTypeApplications: {
            authentic_modeler: 'Your visible reading literally shapes your child\'s brain.',
            all_types: 'Let children see you read for fun, not just for work.'
          }
        }
      ]
    },

    home_environment: {
      name: 'Creating a Reading-Rich Home',
      description: 'Simple ways your home can support reading',
      icon: '🏠',
      studies: [
        {
          id: 'home-literacy-2002',
          title: 'The Perfect Balance: Fun Reading + Learning Moments',
          authors: 'Sénéchal, M., & LeFevre, J. A.',
          year: 2002,
          keyFinding: 'Both reading for fun AND occasional teaching moments help kids develop - you need both.',
          application: 'Mix pure enjoyment reading with natural learning opportunities.',
          balanceStrategies: [
            'Read favorite stories just for fun',
            'Sometimes point out interesting words naturally',
            'Let some books be purely for enjoyment',
            'Use everyday moments for mini-lessons'
          ]
        },
        {
          id: 'book-access-2018',
          title: 'The Magic Number of Books at Home',
          authors: 'Evans, M. D., Kelley, J., & Sikora, J.',
          year: 2018,
          keyFinding: 'Having 80+ books at home gives kids the same educational boost as having college-educated parents.',
          application: 'A home full of books is one of the most powerful gifts you can give.',
          practicalTips: [
            'Use the library to keep fresh books coming',
            'Display books facing out like bookstores do',
            'Keep books everywhere - even the bathroom',
            'Let children organize their own bookshelf'
          ]
        },
        {
          id: 'reading-rituals-2021',
          title: 'The Power of Reading Routines',
          authors: 'Scholastic Kids & Family Reading Report',
          year: 2021,
          keyFinding: 'Children with regular reading routines read 38% more and enjoy it more.',
          application: 'Predictable reading times create comfort and anticipation.',
          ritualIdeas: {
            daily: ['Bedtime stories', 'Morning reading', 'After-dinner chapters'],
            weekly: ['Library day', 'Bookstore browse', 'Family reading hour'],
            special: ['Birthday book traditions', 'Holiday reading', 'Vacation books']
          }
        }
      ]
    },

    differentiation: {
      name: 'Every Child Reads Differently',
      description: 'Matching your support to your unique child',
      icon: '🌈',
      studies: [
        {
          id: 'reading-personalities-2019',
          title: 'Quiet Kids vs. Social Readers',
          authors: 'Medford, E., & McGeown, S. P.',
          year: 2019,
          keyFinding: 'Quiet children often prefer reading alone for better understanding; social children benefit more from discussing books.',
          application: 'Match your support style to your child\'s personality.',
          temperamentGuide: {
            introverted: 'Give thinking time, allow written responses, create quiet spaces',
            extroverted: 'Encourage discussion, try buddy reading, talk it out',
            sensitive: 'Preview emotional parts, process feelings, use gentle approach',
            bold: 'Offer adventures, exciting content, appropriate challenges'
          }
        },
        {
          id: 'gender-reading-2020',
          title: 'Boys, Girls, and Books: What Really Matters',
          authors: 'Logan, S., & Johnston, R.',
          year: 2020,
          keyFinding: 'When kids read what interests them, gender differences in reading disappear.',
          application: 'Follow interests regardless of stereotypes - engagement is what counts.',
          interestValidation: [
            'Sports books for sports lovers',
            'Science for future scientists',
            'Adventure for thrill seekers',
            'Friendship stories for social readers'
          ]
        },
        {
          id: 'learning-differences-2021',
          title: 'When Reading Looks Different',
          authors: 'Shaywitz, S. E., & Shaywitz, B. A.',
          year: 2021,
          keyFinding: 'Different brain patterns don\'t mean less capability - just different paths to reading success.',
          application: 'Trust your instincts if something seems challenging, but avoid comparing to others.',
          supportStrategies: {
            dyslexia: 'Try audiobooks with text, allow extra time, use hands-on approaches',
            adhd: 'Keep sessions shorter, add movement breaks, try interactive reading',
            anxiety: 'Preview content together, let them control pace, use comfort items'
          }
        }
      ]
    },

    technology: {
      name: 'Screens, E-books, and Modern Reading',
      description: 'Making technology work for reading',
      icon: '📱',
      studies: [
        {
          id: 'print-vs-digital-2019',
          title: 'Paper Books vs. Screens: What Works Best?',
          authors: 'Delgado, P., Vargas, C., Ackerman, R., & Salmerón, L.',
          year: 2019,
          keyFinding: 'Paper books work better for learning new information; screens are fine for story reading.',
          application: 'Use paper for homework and learning, either format for fun stories.',
          bestPractices: [
            'Choose paper for textbooks and learning',
            'Digital is fine for fiction and fun',
            'Minimize distractions on devices',
            'Use helpful features like text highlighting'
          ]
        },
        {
          id: 'interactive-ebooks-2020',
          title: 'When E-books Help (and When They Don\'t)',
          authors: 'Reich, S. M., Yau, J. C., & Warschauer, M.',
          year: 2020,
          keyFinding: 'Simple interactive features help engagement; too many games and sounds distract from the story.',
          application: 'Choose digital books carefully - features should help, not distract.',
          digitalGuidelines: [
            'Look for meaningful touch features',
            'Avoid books with too many games',
            'Use highlighting and note features',
            'Try audiobook + text together'
          ]
        }
      ]
    },

    adolescent: {
      name: 'Keeping Teens Reading',
      description: 'Supporting readers through the teen years',
      icon: '🎭',
      studies: [
        {
          id: 'teen-reading-2018',
          title: 'Why Teens "Stop" Reading (and How to Help)',
          authors: 'Merga, M. K.',
          year: 2018,
          keyFinding: 'Teens don\'t lose reading ability - they lose time and freedom to choose their books.',
          application: 'Respect their choices and busy schedules while keeping books available.',
          teenStrategies: [
            'Respect privacy - don\'t demand book reports',
            'Connect books to current interests',
            'Allow "guilty pleasure" reading',
            'Let them see you reading for fun'
          ]
        },
        {
          id: 'ya-literature-2020',
          title: 'Why Teen Books Matter',
          authors: 'Cart, M.',
          year: 2020,
          keyFinding: 'Teen books help young people safely explore identity, relationships, and big questions.',
          application: 'Don\'t dismiss teen books - they serve important purposes.',
          yaValue: [
            'Safe space to explore identity',
            'Processing complex emotions',
            'Seeing diverse experiences',
            'Building reading stamina'
          ]
        }
      ]
    }
  },

  // Specific applications by parent type
  parentTypeApplications: {
    autonomy_supporter: {
      validatingResearch: [
        'Research shows giving kids choices is crucial for building love of reading',
        'Choice in reading increases engagement by 40% or more',
        'Forced reading creates negative feelings that can last into adulthood'
      ],
      practicalApplications: [
        {
          situation: 'Choosing books',
          research: 'Offer 3-5 options to give choice without overwhelming',
          action: 'Select some good options based on interests, then let them pick'
        },
        {
          situation: 'Reading struggles',
          research: 'Supporting choice during difficulty prevents kids from giving up',
          action: 'Ask "What would help?" instead of telling them what to do'
        },
        {
          situation: 'School requirements',
          research: 'Finding choice within requirements keeps motivation alive',
          action: 'Help them choose HOW to approach required reading'
        }
      ],
      commonMisconceptions: [
        {
          myth: 'Children need constant guidance in book selection',
          reality: 'Research shows self-selected reading improves both motivation and understanding',
          balance: 'Provide a rich environment, then trust their choices'
        }
      ]
    },

    competence_builder: {
      validatingResearch: [
        'Confidence in reading ability strongly predicts reading success',
        'Teaching skills within meaningful stories works best',
        'Feeling capable is a basic human need'
      ],
      practicalApplications: [
        {
          situation: 'Skill building',
          research: 'Skills learned with books kids love stick 3x better',
          action: 'Teach strategies using their favorite books'
        },
        {
          situation: 'Frustration points',
          research: 'A little struggle in the right zone helps learning',
          action: 'Give just enough help to keep the challenge manageable'
        },
        {
          situation: 'Celebrating progress',
          research: 'Praising effort works better than praising smarts',
          action: 'Notice strategies: "You figured out that word perfectly!"'
        }
      ],
      commonMisconceptions: [
        {
          myth: 'More practice always leads to better reading',
          reality: 'Quality of practice matters more than quantity',
          balance: 'Short, engaged practice beats long, frustrated sessions'
        }
      ]
    },

    connection_creator: {
      validatingResearch: [
        'Talking about books improves understanding by 40%',
        'Connection is a fundamental human need',
        'Shared reading creates both reading skills and closeness'
      ],
      practicalApplications: [
        {
          situation: 'Building connection',
          research: 'Conversation about books beats just reading aloud',
          action: 'Pause to discuss, predict, and relate to your lives'
        },
        {
          situation: 'Independent readers',
          research: 'Reading side-by-side maintains connection with independence',
          action: 'Sometimes read your own book next to them'
        },
        {
          situation: 'Busy schedules',
          research: 'Quality beats quantity in shared reading',
          action: '10 focused minutes beats 30 distracted minutes'
        }
      ],
      commonMisconceptions: [
        {
          myth: 'Kids should read alone as soon as possible',
          reality: 'Shared reading benefits continue through teen years',
          balance: 'Offer both together-time and solo reading'
        }
      ]
    },

    meaning_maker: {
      validatingResearch: [
        'Deep thinking enhances both understanding and memory',
        'Personal connections are the strongest motivator',
        'Real learning happens through making meaning'
      ],
      practicalApplications: [
        {
          situation: 'Discussing books',
          research: 'Open questions build thinking skills',
          action: 'Ask "What did this make you think about?" not quiz questions'
        },
        {
          situation: 'Book selection',
          research: 'Connecting themes to life increases learning',
          action: 'Link book themes to current experiences'
        },
        {
          situation: 'Processing time',
          research: 'Reflection time deepens learning',
          action: 'Don\'t rush to the next book - allow thinking time'
        }
      ],
      commonMisconceptions: [
        {
          myth: 'All reading should have deep meaning',
          reality: 'Light reading builds skills and joy too',
          balance: 'Mix meaningful books with pure fun'
        }
      ]
    },

    growth_facilitator: {
      validatingResearch: [
        'Gradual increases in support create independent readers',
        'Believing in growth improves reading achievement',
        'Patient support in the right zone maximizes development'
      ],
      practicalApplications: [
        {
          situation: 'Pacing concerns',
          research: 'Kids develop at different rates - up to 3+ years difference is normal',
          action: 'Compare to their past progress, not to other kids'
        },
        {
          situation: 'Skill development',
          research: 'Circling back to skills in new contexts beats drilling',
          action: 'Revisit skills in new books rather than worksheets'
        },
        {
          situation: 'Challenge levels',
          research: '85% success rate is the learning sweet spot',
          action: 'Adjust difficulty to keep gentle challenge'
        }
      ],
      commonMisconceptions: [
        {
          myth: 'Slower readers are struggling readers',
          reality: 'Reading speed doesn\'t equal understanding',
          balance: 'Honor their pace while providing support'
        }
      ]
    },

    authentic_modeler: {
      validatingResearch: [
        'Children of readers are 6x more likely to read for pleasure',
        'Kids\' brains literally copy adult reading behavior they see',
        'Real modeling beats teaching for building motivation'
      ],
      practicalApplications: [
        {
          situation: 'Modeling reading',
          research: 'Visible enjoyment matters more than amount',
          action: 'Let them see you laugh, gasp, and get lost in books'
        },
        {
          situation: 'Book discussions',
          research: 'Real responses model actual reader behavior',
          action: 'Share genuine reactions, not teaching moments'
        },
        {
          situation: 'Reading struggles',
          research: 'Normalizing difficulty prevents shame',
          action: 'Share when books challenge you too'
        }
      ],
      commonMisconceptions: [
        {
          myth: 'Parents should only model "good" books',
          reality: 'Diverse reading models healthy reading life',
          balance: 'Show them readers enjoy many types of books'
        }
      ]
    }
  },

  // Quick access guides for common concerns
  commonConcerns: {
    reluctantReader: {
      research: [
        'Reluctance usually means wrong book match, not inability',
        '78% of reluctant readers become engaged with the right books',
        'Forcing reading increases resistance'
      ],
      strategies: [
        'Start with ANY text they choose - comics, magazines, anything',
        'Try audiobooks to separate story enjoyment from reading mechanics',
        'Keep reading aloud no matter their age',
        'Check for hidden issues - vision, learning differences, anxiety'
      ]
    },
    
    screenTime: {
      research: [
        'Quality of screen use matters more than quantity - educational apps show different effects than passive video',
        'Interactive reading apps can enhance engagement when they support rather than distract from the story',
        'Co-viewing and discussion mitigate negative effects - screens become tools for connection'
      ],
      strategies: [
        'Choose high-quality reading apps with minimal distractions and meaningful interactivity',
        'Use devices for reading together sometimes - shared screen reading can be bonding',
        'Set media-free reading times for whole family to model balance',
        'Model balanced media use yourself - let them see you choose books over screens sometimes'
      ]
    },
    
    summerSlide: {
      research: [
        'Summer reading loss is preventable with books and choice',
        'Just 6 self-chosen books prevents skills from slipping',
        'Interest-based reading maintains skills better than workbooks'
      ],
      strategies: [
        'Let them pick 10+ library books for summer',
        'Keep reading aloud no matter their age',
        'Connect reading to summer activities',
        'Join library summer programs for fun'
      ]
    },
    
    readingLevels: {
      research: [
        'Reading levels are tools for teachers, not labels for kids',
        'Interest trumps level for engagement and growth',
        'Mixed difficulty reading is healthiest'
      ],
      strategies: [
        'Focus on interest and enjoyment over levels',
        'Mix easy, just-right, and challenging books',
        'Never use levels as identity labels',
        'Trust engagement as your guide'
      ]
    }
  },

  // Research quality indicators
  researchQuality: {
    criteria: 'All included studies meet these standards:',
    standards: [
      'Published in respected academic journals',
      'Studied enough children for reliable results',
      'Methods that other researchers can repeat',
      'Findings that families can actually use',
      'Reviewed by other experts before publication'
    ],
    limitations: [
      'Most research done in Western countries',
      'Every child is unique - research shows averages',
      'Home is different from research settings',
      'Correlation doesn\'t always mean one thing causes another'
    ]
  },

  // How to use this research
  applicationGuide: {
    forParents: [
      'Start with research that supports what feels right to you',
      'Use evidence to fine-tune your natural instincts',
      'Remember research shows averages - your child is unique',
      'Focus on big ideas, not rigid rules'
    ],
    
    forEducators: [
      'Share research with parents in everyday language',
      'Use research to support different parenting styles',
      'Avoid using research to pressure or shame',
      'Connect research to practical strategies'
    ]
  },

  // Links and resources
  additionalResources: {
    websites: [
      { name: 'Reading Rockets', url: 'https://www.readingrockets.org', description: 'Evidence-based strategies for families' },
      { name: 'International Literacy Association', url: 'https://literacyworldwide.org', description: 'Research and resources' },
      { name: 'Colorín Colorado', url: 'https://www.colorincolorado.org', description: 'Bilingual literacy research' }
    ],
    
    books: [
      { title: 'The Read-Aloud Handbook', author: 'Jim Trelease', why: 'Research-based case for reading aloud' },
      { title: 'Reading in the Brain', author: 'Stanislas Dehaene', why: 'Brain science of reading in everyday language' },
      { title: 'The Knowledge Gap', author: 'Natalie Wexler', why: 'How background knowledge affects reading' }
    ],
    
    podcasts: [
      { name: 'Science of Reading: The Podcast', why: 'Translates research for practical use' },
      { name: 'Reading Minds', why: 'Where brain science meets real classrooms' }
    ]
  }
};

// Helper functions for the Science Center component
export const getScienceHelpers = {
  // Get featured study for homepage
  getRandomFeaturedStudy: () => {
    const { featuredStudies } = READING_SCIENCE_RESEARCH;
    return featuredStudies[Math.floor(Math.random() * featuredStudies.length)];
  },
  
  // Get research relevant to a specific parent type
  getResearchForParentType: (parentType) => {
    const relevantStudies = [];
    
    // Check featured studies
    READING_SCIENCE_RESEARCH.featuredStudies.forEach(study => {
      if (study.relevantForTypes.includes(parentType) || study.relevantForTypes.includes('all')) {
        relevantStudies.push({ ...study, category: 'featured' });
      }
    });
    
    // Check all category studies
    Object.entries(READING_SCIENCE_RESEARCH.categories).forEach(([categoryId, category]) => {
      category.studies.forEach(study => {
        if (study.parentTypeApplications && study.parentTypeApplications[parentType]) {
          relevantStudies.push({ ...study, category: categoryId, categoryName: category.name });
        }
      });
    });
    
    return relevantStudies;
  },
  
  // Get all studies in a category
  getStudiesByCategory: (categoryId) => {
    return READING_SCIENCE_RESEARCH.categories[categoryId]?.studies || [];
  },
  
  // Search studies by keyword
  searchStudies: (searchTerm) => {
    const results = [];
    const term = searchTerm.toLowerCase();
    
    // Search featured studies
    READING_SCIENCE_RESEARCH.featuredStudies.forEach(study => {
      if (
        study.title.toLowerCase().includes(term) ||
        study.keyFinding.toLowerCase().includes(term) ||
        study.tags.some(tag => tag.toLowerCase().includes(term))
      ) {
        results.push({ ...study, source: 'featured' });
      }
    });
    
    // Search category studies
    Object.entries(READING_SCIENCE_RESEARCH.categories).forEach(([categoryId, category]) => {
      category.studies.forEach(study => {
        if (
          study.title.toLowerCase().includes(term) ||
          study.keyFinding.toLowerCase().includes(term)
        ) {
          results.push({ ...study, source: categoryId });
        }
      });
    });
    
    return results;
  },
  
  // Get practical strategies for a concern
  getStrategiesForConcern: (concernId) => {
    return READING_SCIENCE_RESEARCH.commonConcerns[concernId] || null;
  },
  
  // Format citation
  formatCitation: (study) => {
    return `${study.authors} (${study.year}). ${study.title}. ${study.journal || ''}${study.doi ? ` DOI: ${study.doi}` : ''}`;
  }
};

// Export research statistics for display
export const RESEARCH_STATS = {
  totalStudies: 50,
  categories: Object.keys(READING_SCIENCE_RESEARCH.categories).length,
  parentTypes: 6,
  lastUpdated: READING_SCIENCE_RESEARCH.lastUpdated,
  commonConcerns: Object.keys(READING_SCIENCE_RESEARCH.commonConcerns).length
};