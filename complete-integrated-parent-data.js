// complete-integrated-parent-data.js
// All 6 Parent Types - Psychology + Comprehensive Toolkit Integrated

// PARENT DNA ASSESSMENT QUESTIONS (from dnaTypes.js)
  export const PARENT_DNA_QUESTIONS = [
  // OPENING: Everyday Reading Moments
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
    id: 'library_visit_style',
    question: 'You\'re at the library with your child. What happens?',
    researchBase: 'Environmental influence on reading choices and autonomy',
    options: [
      {
        id: 'child_leads_completely',
        text: 'Follow them around as they explore, letting them choose everything',
        traits: ['autonomy_supportive', 'child_centered', 'trust_based']
      },
      {
        id: 'strategic_guidance',
        text: 'Guide them to sections that match their reading level and interests',
        traits: ['competence_building', 'strategic', 'scaffolding']
      },
      {
        id: 'explore_together',
        text: 'Make it an adventure, discovering new books and sections together',
        traits: ['connection_creating', 'shared_experience', 'joyful']
      },
      {
        id: 'teach_selection',
        text: 'Show them how to evaluate books - checking difficulty, previewing, etc.',
        traits: ['competence_building', 'skill_teaching', 'metacognitive']
      },
      {
        id: 'model_browsing',
        text: 'Browse for your own books while they browse for theirs',
        traits: ['authentic_modeling', 'parallel_activity', 'independence']
      },
      {
        id: 'meaningful_choices',
        text: 'Ask them what kinds of stories or information they\'re hoping to find today',
        traits: ['meaning_making', 'intentional', 'reflective']
      }
    ]
  },

  {
    id: 'bedtime_reading_philosophy',
    question: 'It\'s bedtime and your child wants "just one more chapter." You\'re tired. What typically happens?',
    researchBase: 'Boundaries, flexibility, and reading as comfort',
    options: [
      {
        id: 'honor_engagement',
        text: 'Their engagement with the book is more important than strict bedtime',
        traits: ['autonomy_supportive', 'flexible', 'engagement_prioritizing']
      },
      {
        id: 'negotiate_compromise',
        text: 'Negotiate - "Two more pages, then lights out"',
        traits: ['growth_facilitating', 'balanced', 'boundary_setting']
      },
      {
        id: 'connection_opportunity',
        text: 'See it as bonus connection time and read together a bit longer',
        traits: ['connection_creating', 'relationship_prioritizing', 'present']
      },
      {
        id: 'skill_building_moment',
        text: 'Use it as a lesson in stopping at cliffhangers and anticipation for tomorrow',
        traits: ['competence_building', 'strategic', 'delayed_gratification']
      },
      {
        id: 'routine_matters',
        text: 'Maintain the bedtime boundary while validating their excitement',
        traits: ['growth_facilitating', 'structured', 'consistent']
      },
      {
        id: 'explore_feelings',
        text: 'Ask what\'s making it so hard to stop and talk about the story',
        traits: ['meaning_making', 'emotionally_attuned', 'curious']
      }
    ]
  },

  // CHALLENGES & STRUGGLES
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
    id: 'homework_reading_approach',
    question: 'Your child has a reading assignment they\'re not interested in. How do you handle it?',
    researchBase: 'Extrinsic vs intrinsic motivation in required reading',
    options: [
      {
        id: 'find_personal_connection',
        text: 'Help them find something in the book that connects to their interests or life',
        traits: ['meaning_making', 'connection_creating', 'relevance_focused']
      },
      {
        id: 'acknowledge_and_support',
        text: 'Acknowledge that not all reading is fun but we sometimes do things we need to do',
        traits: ['authentic_modeling', 'realistic', 'growth_facilitating']
      },
      {
        id: 'make_it_game',
        text: 'Turn it into a challenge or game to make it more engaging',
        traits: ['competence_building', 'strategic', 'creative_problem_solving']
      },
      {
        id: 'minimal_intervention',
        text: 'Let them figure out their own way to get through it',
        traits: ['autonomy_supportive', 'trust_based', 'independence_fostering']
      },
      {
        id: 'read_together',
        text: 'Offer to read it with them or take turns reading aloud',
        traits: ['connection_creating', 'supportive_presence', 'collaborative']
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

  // BOOK CHOICES & PREFERENCES
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
    id: 'book_gift_philosophy',
    question: 'You\'re choosing books as gifts for your child. What guides your selection?',
    researchBase: 'Adult book selection and child autonomy',
    options: [
      {
        id: 'pure_interest',
        text: 'Only books I know align with their current interests and choices',
        traits: ['autonomy_supportive', 'child_centered', 'responsive']
      },
      {
        id: 'gentle_stretch',
        text: 'Books slightly above their current level to encourage growth',
        traits: ['competence_building', 'strategic', 'growth_oriented']
      },
      {
        id: 'shared_enjoyment',
        text: 'Books we can enjoy together or that create discussion opportunities',
        traits: ['connection_creating', 'relationship_building', 'interactive']
      },
      {
        id: 'meaningful_themes',
        text: 'Books that explore themes relevant to their life or development',
        traits: ['meaning_making', 'thoughtful', 'developmental']
      },
      {
        id: 'variety_exposure',
        text: 'A mix of different genres to expose them to various types of reading',
        traits: ['growth_facilitating', 'expansive', 'exploratory']
      },
      {
        id: 'modeling_choices',
        text: 'Books similar to what I genuinely enjoy, hoping to share that love',
        traits: ['authentic_modeling', 'genuine', 'sharing']
      }
    ]
  },

  // SOCIAL & EMOTIONAL MOMENTS
  {
    id: 'reading_comparison_response',
    question: 'Your child says "My friend reads way harder books than me." How do you respond?',
    researchBase: 'Social comparison and reading identity',
    options: [
      {
        id: 'validate_journey',
        text: 'Everyone has their own reading journey and timeline - yours is perfect for you',
        traits: ['growth_facilitating', 'individualized', 'validating']
      },
      {
        id: 'explore_interest',
        text: 'Are you interested in trying harder books, or are you happy with what you\'re reading?',
        traits: ['autonomy_supportive', 'choice_focused', 'empowering']
      },
      {
        id: 'reframe_perspective',
        text: 'What matters is finding books you love, not how hard they are',
        traits: ['meaning_making', 'value_focused', 'reframing']
      },
      {
        id: 'skill_opportunity',
        text: 'If you want to read harder books, we can work on some strategies together',
        traits: ['competence_building', 'supportive', 'goal_oriented']
      },
      {
        id: 'share_experience',
        text: 'I remember feeling that way - let me tell you what I learned...',
        traits: ['authentic_modeling', 'empathetic', 'experiential']
      },
      {
        id: 'connection_focus',
        text: 'Maybe you and your friend can share favorite books with each other',
        traits: ['connection_creating', 'social_solution', 'positive_reframe']
      }
    ]
  },

  {
    id: 'reading_confidence_crisis',
    question: 'Your child says "I\'m just not a good reader." Your heart breaks. What\'s your response?',
    researchBase: 'Reading identity and self-efficacy',
    options: [
      {
        id: 'redefine_good',
        text: 'Help them redefine what being a "good reader" means - it\'s not about speed or level',
        traits: ['meaning_making', 'reframing', 'identity_supportive']
      },
      {
        id: 'skill_inventory',
        text: 'Point out all the reading skills they have developed and celebrate their progress',
        traits: ['competence_building', 'affirming', 'concrete']
      },
      {
        id: 'emotional_support',
        text: 'Focus on understanding their feelings and providing comfort before solutions',
        traits: ['connection_creating', 'emotionally_present', 'validating']
      },
      {
        id: 'growth_mindset',
        text: 'You\'re not a good reader YET - let\'s talk about what would help you feel more confident',
        traits: ['growth_facilitating', 'forward_looking', 'empowering']
      },
      {
        id: 'choice_power',
        text: 'Maybe you haven\'t found the right books for you yet - what would you like to try?',
        traits: ['autonomy_supportive', 'possibility_focused', 'choice_emphasizing']
      },
      {
        id: 'share_struggles',
        text: 'Share your own reading challenges and how you still consider yourself a reader',
        traits: ['authentic_modeling', 'vulnerable', 'normalizing']
      }
    ]
  },

  {
    id: 'reading_social_pressure',
    question: 'Your child feels embarrassed about their reading choices (too easy, too weird, not cool). Your response?',
    researchBase: 'Reading identity and peer influence',
    options: [
      {
        id: 'validate_choices',
        text: 'Your reading choices are perfect for you - there\'s no such thing as a wrong book to love',
        traits: ['autonomy_supportive', 'validating', 'accepting']
      },
      {
        id: 'private_public',
        text: 'Help them think about having both private reading and books they share with friends',
        traits: ['competence_building', 'strategic', 'practical']
      },
      {
        id: 'find_community',
        text: 'Help them find others who share their reading interests',
        traits: ['connection_creating', 'community_building', 'supportive']
      },
      {
        id: 'explore_meaning',
        text: 'Talk about why certain books speak to them and why that matters',
        traits: ['meaning_making', 'deep', 'identity_affirming']
      },
      {
        id: 'confidence_building',
        text: 'Work on building their confidence to own their unique interests',
        traits: ['growth_facilitating', 'empowering', 'identity_building']
      },
      {
        id: 'share_quirky',
        text: 'Share your own "embarrassing" reading pleasures and why you love them',
        traits: ['authentic_modeling', 'vulnerable', 'relatable']
      }
    ]
  },

  // ENVIRONMENT & ROUTINES
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
    id: 'reading_space_creation',
    question: 'Your child wants to create their own reading space. How involved do you get?',
    researchBase: 'Environmental control and ownership',
    options: [
      {
        id: 'full_autonomy',
        text: 'It\'s their space - they design it however they want',
        traits: ['autonomy_supportive', 'ownership_granting', 'trusting']
      },
      {
        id: 'collaborative_design',
        text: 'Work together to create a space that\'s both appealing and functional',
        traits: ['connection_creating', 'collaborative', 'balanced']
      },
      {
        id: 'gentle_guidance',
        text: 'Offer suggestions about lighting, comfort, and organization',
        traits: ['competence_building', 'practical', 'supportive']
      },
      {
        id: 'meaningful_elements',
        text: 'Help them think about what elements would make reading feel special',
        traits: ['meaning_making', 'thoughtful', 'intentional']
      },
      {
        id: 'gradual_development',
        text: 'Start simple and let the space evolve as their reading evolves',
        traits: ['growth_facilitating', 'evolutionary', 'patient']
      },
      {
        id: 'model_spaces',
        text: 'Show them your reading spaces and how you\'ve made them work for you',
        traits: ['authentic_modeling', 'sharing', 'demonstrative']
      }
    ]
  },

  // SKILL DEVELOPMENT
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
    id: 'reading_mistake_response',
    question: 'Your child consistently mispronounces a word while reading aloud. What\'s your instinct?',
    researchBase: 'Error correction and reading confidence',
    options: [
      {
        id: 'gentle_correction',
        text: 'Gently provide the correct pronunciation when it doesn\'t disrupt the flow',
        traits: ['competence_building', 'supportive', 'skill_focused']
      },
      {
        id: 'ignore_for_flow',
        text: 'Let it go - understanding the story matters more than perfect pronunciation',
        traits: ['meaning_making', 'holistic', 'comprehension_focused']
      },
      {
        id: 'note_for_later',
        text: 'Make a mental note to work on that word later in a different context',
        traits: ['growth_facilitating', 'strategic', 'patient']
      },
      {
        id: 'let_them_lead',
        text: 'Wait to see if they self-correct or ask for help',
        traits: ['autonomy_supportive', 'patient', 'self_directed']
      },
      {
        id: 'make_it_fun',
        text: 'Turn it into a playful moment - "That\'s a tricky word! Let\'s figure it out together"',
        traits: ['connection_creating', 'playful', 'collaborative']
      }
    ]
  },

  // CELEBRATIONS & MOTIVATION
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
  },

  {
    id: 'reading_reward_philosophy',
    question: 'Your thoughts on rewards for reading (sticker charts, prizes, etc.)?',
    researchBase: 'Intrinsic vs extrinsic motivation',
    options: [
      {
        id: 'intrinsic_only',
        text: 'Reading is its own reward - external rewards can damage natural motivation',
        traits: ['autonomy_supportive', 'intrinsic_focus', 'purist']
      },
      {
        id: 'strategic_use',
        text: 'Rewards can be helpful tools when used strategically and phased out',
        traits: ['competence_building', 'pragmatic', 'flexible']
      },
      {
        id: 'celebration_focus',
        text: 'Celebrations and special reading experiences are better than material rewards',
        traits: ['connection_creating', 'experience_focused', 'meaningful']
      },
      {
        id: 'milestone_marking',
        text: 'Marking reading milestones helps children see their growth journey',
        traits: ['growth_facilitating', 'progress_focused', 'visual']
      },
      {
        id: 'child_directed',
        text: 'Ask the child what would make reading feel more rewarding to them',
        traits: ['autonomy_supportive', 'collaborative', 'responsive']
      },
      {
        id: 'natural_consequences',
        text: 'Focus on natural rewards - the joy of story, learning new things, etc.',
        traits: ['authentic_modeling', 'natural', 'intrinsic_highlighting']
      }
    ]
  },

  // PHILOSOPHY & VALUES
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
    id: 'future_reader_vision',
    question: 'When you imagine your child as an adult reader, what matters most to you?',
    researchBase: 'Long-term reading goals and values',
    options: [
      {
        id: 'chooses_freely',
        text: 'That they feel free to read (or not read) based on their own choices and interests',
        traits: ['autonomy_supportive', 'freedom_focused', 'respectful']
      },
      {
        id: 'skilled_confident',
        text: 'That they have the skills and confidence to tackle any text they need or want to read',
        traits: ['competence_building', 'capability_focused', 'empowering']
      },
      {
        id: 'shares_joy',
        text: 'That reading remains a source of connection and shared joy in their relationships',
        traits: ['connection_creating', 'relationship_focused', 'community']
      },
      {
        id: 'finds_meaning',
        text: 'That they use reading to understand themselves and the world more deeply',
        traits: ['meaning_making', 'wisdom_focused', 'reflective']
      },
      {
        id: 'lifetime_growth',
        text: 'That they see reading as one tool for continued growth and learning',
        traits: ['growth_facilitating', 'lifelong_learning', 'adaptive']
      },
      {
        id: 'authentic_relationship',
        text: 'That they have an honest, authentic relationship with reading - whatever that looks like',
        traits: ['authentic_modeling', 'accepting', 'genuine']
      }
    ]
  }
];

// INTEGRATED PARENT DNA TYPES - All 6 with Psychology + Toolkit
export const INTEGRATED_PARENT_DNA_TYPES = {
  
  autonomy_supporter: {
    id: 'autonomy_supporter',
    name: 'Autonomy Supporter',
    emoji: '🌱',
    color: '#52C41A',
    traits: ['autonomy_supportive', 'trust_based', 'choice_centered', 'intrinsic_motivation'],
    
    quickDescription: 'You instinctively believe that children learn best when they feel ownership over their choices. Your parenting is guided by deep trust in children\'s natural curiosity.',
    
    psychologicalCore: {
      unconsciousDrive: 'You\'re driven by a fundamental belief that childhood should preserve wonder and natural learning. You may have experienced too much control as a child, or you naturally lean toward respecting others\' autonomy as a core value.',
      dailyBehaviors: [
        'When your child resists reading, your instinct is to step back rather than push harder',
        'You find yourself saying "What do you think?" more than giving direct answers',
        'You feel uncomfortable when other parents heavily manage their children\'s reading',
        'You notice when children light up making their own discoveries',
        'You get frustrated by school assignments that seem to kill natural interest'
      ],
      stressResponse: 'Under pressure, you may become even more hands-off, sometimes to the point where children who need more support feel abandoned. You might avoid necessary structure because it feels too controlling.',
      childExperience: 'Children with autonomy-supportive parents typically develop strong internal motivation and confidence in their own judgment. They learn to trust their instincts about what they enjoy and often become self-directed learners.'
    },
    
    strengths: [
      'Creates intrinsically motivated readers who love books for their own sake',
      'Builds children\'s confidence in their own judgment and preferences',
      'Develops independent readers who don\'t need external validation',
      'Preserves natural curiosity by not over-directing the learning process',
      'Models respect for individual differences and learning styles',
      'Creates positive associations with reading by avoiding power struggles'
    ],
    
    growthEdges: {
      title: 'Where You Might Need to Stretch',
      areas: [
        {
          challenge: 'Sometimes children need more structure than you naturally provide',
          insight: 'Your trust in their autonomy is beautiful, but some children (especially those with attention challenges) thrive with gentle scaffolding. Structure can actually increase their sense of autonomy by giving them tools to succeed.',
          growthAction: 'Notice when a child seems lost or frustrated. Offer support as "tools for their toolkit" rather than rules.'
        },
        {
          challenge: 'You may avoid addressing real reading difficulties',
          insight: 'Your hands-off approach can sometimes mask a child\'s genuine struggle with decoding or comprehension. Respecting autonomy doesn\'t mean ignoring learning gaps.',
          growthAction: 'Trust your child\'s autonomy AND trust your parental instincts. If something feels off, investigate with curiosity rather than control.'
        },
        {
          challenge: 'Children may interpret your restraint as lack of interest',
          insight: 'Your respectful distance can sometimes feel like disengagement to children who crave your enthusiasm about their interests.',
          growthAction: 'Share your genuine excitement about their discoveries. Enthusiasm isn\'t the same as control.'
        }
      ]
    },
    
    researchFoundation: {
      coreTheory: 'Self-Determination Theory (Deci & Ryan)',
      keyFinding: 'Autonomy is one of three basic psychological needs for motivation and well-being',
      application: 'When parents honor children\'s perspectives, provide meaningful choices, and support natural interests, children develop stronger internal motivation for reading that lasts throughout life.',
      caution: 'Research also shows that autonomy support works best when combined with appropriate structure and warmth. Pure permissiveness can actually undermine children\'s sense of security.'
    },
    
    confidenceBuilders: [
      '🌟 Research from Self-Determination Theory shows that autonomy is one of three basic psychological needs for motivation and well-being',
      '🌟 You\'re raising readers who choose books because they love them, not because they have to—this creates lifelong reading habits',
      '🌟 Your respect for their choices builds genuine decision-making skills that transfer to all areas of life',
      '🌟 Studies show that autonomy-supportive parenting leads to higher creativity, better problem-solving, and stronger intrinsic motivation',
      '🌟 Children who experience choice and autonomy in reading develop stronger reading identities and more positive attitudes toward learning',
      '🌟 Your approach helps prevent the "reading wars" that can damage parent-child relationships and kill natural love of books'
    ],
    
    dailyStrategies: {
      engagement: [
        "Offer 2-3 book options and let them choose what feels right for that day",
        "Ask 'What kind of story mood are you in?' instead of directing toward specific books",
        "Create a rich reading environment with varied options visible and accessible"
      ],
      conflict: [
        "When they resist reading: 'I notice you don't seem interested in reading right now. What's going on?'",
        "When they pick 'easy' books: 'You know what feels right for you. I trust your choice.'",
        "When school pressures mount: 'Let's figure out how to meet requirements while honoring what you enjoy.'"
      ],
      celebration: [
        "Celebrate their choices: 'I love how you picked that book—what drew you to it?'",
        "Honor their discoveries: 'You're becoming such a thoughtful book chooser!'",
        "Avoid taking over their joy: Let them share their excitement without adding your agenda"
      ]
    },
    
    problemsToolkit: {
      reluctantReader: {
        yourInstinct: "Give them space and trust the process—pressure often backfires",
        whyThisWorks: "Resistance often signals that reading has become associated with external pressure rather than internal joy. Stepping back allows natural curiosity to re-emerge.",
        whenToWorry: "If complete avoidance lasts more than 2-3 weeks or if you notice signs of genuine reading difficulty",
        gentleApproaches: [
          "Create a rich reading environment without requirements—audiobooks, comics, magazines all count",
          "Share your own reading excitement without expecting reciprocation",
          "Ask curious questions: 'I wonder what you're thinking about books lately?' without pushing for answers"
        ],
        scripts: {
          doSay: [
            "I noticed you haven't been reading much. What's on your mind?",
            "What would make reading feel good for you right now?",
            "I trust you to know what you need. I'm here if you want to talk about it."
          ],
          dontSay: [
            "You need to read more—it's important for school",
            "Reading is good for you, so you should do it",
            "Other kids your age are reading chapter books already"
          ]
        }
      },
      achievementPressure: {
        yourApproach: "Focus on the joy of discovery, not performance metrics",
        balanceAct: "How to celebrate progress without creating external pressure or making reading about pleasing you",
        scripts: {
          doSay: [
            "I love seeing you enjoy that book—tell me what's interesting about it",
            "You seem really engaged with that story",
            "I can tell you're thinking deeply about what you're reading"
          ],
          dontSay: [
            "You're such a good reader—I'm so proud of your level",
            "I love how much you're reading—keep it up!",
            "You're ahead of your grade level—that's wonderful!"
          ]
        }
      },
      powerStruggles: {
        prevention: "Avoid making reading a battleground by honoring their autonomy from the start",
        whenTheyHappen: [
          "Step back and examine what external pressures might be creating the resistance",
          "Return to choice: 'What would make this feel better for you?'",
          "Separate school requirements from home reading joy",
          "Remember that saying no to reading might be saying yes to autonomy"
        ]
      },
      bookChoiceStruggles: {
  yourPhilosophy: "Choice is sacred, but overwhelm is real—provide structure that enhances rather than limits autonomy",
  practicalTips: [
    "Offer 2-3 pre-selected options instead of unlimited choice when they seem overwhelmed",
    "Let them browse freely but have backup options ready for decision fatigue",
    "Honor their 'weird' choices—series books, graphic novels, books 'below' their level all have value",
    "Create themed choice sets: 'Want something funny, adventurous, or mysterious today?'"
  ]
},
readingHabitBuilding: {
  yourApproach: "Trust their natural rhythms while providing gentle environmental support",
  practicalStrategies: [
    "Make reading materials easily accessible throughout your home",
    "Model your own reading choices and natural reading rhythms",
    "Ask what time of day feels best for them to read",
    "Create cozy reading spots they can customize and claim as their own"
  ]
},
differentLearningSpeeds: {
  yourPhilosophy: "Every child's timeline is perfect for them—comparison kills natural motivation",
  approaches: [
    "Focus on their unique interests and discoveries rather than benchmarks",
    "Trust that children who feel supported develop at their own optimal pace",
    "Provide rich experiences at their natural level without pushing advancement",
    "Celebrate their specific growth rather than comparing to others"
  ]
}
    },
    
    seasonalSupport: {
      backToSchool: {
        challenge: "Balancing school requirements with natural choice and maintaining reading joy",
        strategies: [
          "Ask: 'How can we make this required reading feel more like your choice?'",
          "Separate school reading from home reading joy",
          "Help them find connections between required books and their interests"
        ]
      },
      summer: {
        challenge: "Avoiding summer slide while maintaining reading joy",
        strategies: [
          "Ask what summer reading would feel fun for them",
          "Provide access to beach reads, comics, audiobooks for car trips",
          "Let reading happen naturally around summer activities rather than requiring it"
        ]
      },
      holidays: {
  challenge: "Managing gift-giving and family reading traditions while honoring their autonomy",
  strategies: [
    "Ask what kinds of books they're hoping to discover",
    "Create gift experiences around their book interests rather than imposing your choices",
    "Honor family reading traditions while allowing them to participate in their own way"
  ]
},
spring: {
  challenge: "Supporting natural energy shifts and outdoor interests",
  strategies: [
    "Follow their lead if they want more outdoor time and less reading",
    "Provide portable reading options for outdoor spaces",
    "Trust that reading motivation naturally ebbs and flows with seasons"
  ]
}
    },
    
    reflectionPrompts: [
      "What reading moment with your child felt most natural and joyful this week?",
      "When did you feel pressure to intervene or control? How did you handle it?",
      "How did your child's reading choices surprise or delight you recently?",
      "What signs of natural motivation and curiosity are you noticing?",
      "When did stepping back create space for your child's own initiative to emerge?"
    ]
  },

  competence_builder: {
    id: 'competence_builder',
    name: 'Competence Builder',
    emoji: '🏗️',
    color: '#1890FF',
    traits: ['competence_building', 'strategic', 'mastery_oriented', 'strategic_support'],
    
    quickDescription: 'You see reading challenges as puzzles to solve together. Your natural instinct is to break down difficulties into manageable steps, celebrate progress, and help children develop the tools they need to succeed.',
    
    psychologicalCore: {
      unconsciousDrive: 'You\'re motivated by wanting children to feel genuinely capable, not just praised. You may have experienced the satisfaction of mastering difficult things, or felt the frustration of being in over your head without proper support.',
      dailyBehaviors: [
        'When your child struggles, you immediately start thinking about what skill or support they need',
        'You notice and comment on specific improvements: "You read that word without sounding it out!"',
        'You feel satisfied when you can help a child breakthrough a learning barrier',
        'You get frustrated by empty praise that doesn\'t acknowledge real effort or growth',
        'You automatically think in terms of "next steps" and skill progression'
      ],
      stressResponse: 'Under pressure, you may become overly focused on fixing problems and miss the emotional needs. You might turn everything into a lesson when a child just needs empathy.',
      childExperience: 'Children with competence-building parents typically develop strong skills and genuine confidence in their abilities. They learn to persist through challenges because they trust they\'ll receive the support they need.'
    },
    
    strengths: [
      'Builds genuine reading confidence through skill development',
      'Helps children persist through challenges with strategic support',
      'Creates readers who aren\'t afraid of difficult texts',
      'Develops children\'s metacognitive awareness of their own learning',
      'Provides the scaffolding that many children need to succeed',
      'Celebrates authentic achievement based on real growth'
    ],
    
    growthEdges: {
      title: 'Where You Might Need to Stretch',
      areas: [
        {
          challenge: 'You may turn everything into a teaching moment',
          insight: 'Your desire to help children grow is wonderful, but sometimes they need to just enjoy a book without it becoming a lesson. Over-teaching can kill the joy of reading.',
          growthAction: 'Practice sitting back and enjoying stories together without analyzing or teaching. Let some reading just be for pleasure.'
        },
        {
          challenge: 'You might focus on deficits rather than interests',
          insight: 'Your skill-building instincts can lead you to focus on what children can\'t do yet, rather than building on what excites them.',
          growthAction: 'Start with their interests and passions, then sneak in skill-building through books they already love.'
        },
        {
          challenge: 'Some children may feel like projects rather than people',
          insight: 'Your strategic approach to helping can sometimes feel clinical to children who need emotional connection before academic support.',
          growthAction: 'Lead with relationship. Make sure children feel seen and valued for who they are, not just what they can achieve.'
        }
      ]
    },
    
    researchFoundation: {
      coreTheory: 'Self-Efficacy Theory (Albert Bandura) and Zone of Proximal Development (Vygotsky)',
      keyFinding: 'Beliefs about capability strongly predict motivation and achievement; learning happens best with appropriate challenge and support',
      application: 'When parents provide strategic skill-building support within children\'s zone of proximal development, children develop both competence and confidence that fuels continued motivation.',
      caution: 'Research also shows that competence support works best when it feels supportive rather than evaluative. Children need to feel that their worth isn\'t tied to their performance.'
    },
    
    confidenceBuilders: [
      '🌟 Research from Albert Bandura shows that self-efficacy beliefs (confidence in one\'s abilities) strongly predict motivation and achievement',
      '🌟 You\'re building genuine reading confidence through skill development rather than empty praise',
      '🌟 Your strategic approach helps children persist through challenges with concrete tools and strategies',
      '🌟 Studies show that children who develop strong foundational skills early become more confident with increasingly difficult texts',
      '🌟 Your focus on specific feedback helps children develop metacognitive awareness of their own learning',
      '🌟 Research confirms that competence support increases intrinsic motivation when combined with autonomy and connection'
    ],
    
    dailyStrategies: {
      engagement: [
        "Start with a quick success: Choose something you know they can read confidently to build momentum",
        "Set a small, achievable goal: 'Let\'s see if we can figure out these three challenging words today'",
        "Remind them of recent progress: 'Remember how you figured out that tricky part yesterday?'"
      ],
      conflict: [
        "When they\'re frustrated: 'This is challenging your brain—that means you\'re growing stronger!'",
        "When they want to quit: 'Let\'s break this down into smaller pieces that feel more manageable'",
        "When they compare themselves to others: 'Look how much stronger you are now compared to last month!'"
      ],
      celebration: [
        "Celebrate specific strategies: 'I saw you use that word attack strategy we practiced!'",
        "Acknowledge effort over outcome: 'Your persistence with that difficult page paid off'",
        "Make progress visible: Keep a record of books completed, new words learned, or strategies mastered"
      ]
    },
    
    problemsToolkit: {
      reluctantReader: {
        yourInstinct: "Assess skill gaps and provide strategic support to build confidence through capability",
        whyThisWorks: "Often resistance stems from feeling overwhelmed or unsuccessful. Building skills creates positive experiences that change their relationship with reading.",
        whenToWorry: "If resistance continues despite appropriate skill support, or if you notice signs of learning differences",
        gentleApproaches: [
          "Start with high-interest books at a comfortable skill level to rebuild positive associations",
          "Focus on one skill at a time rather than overwhelming with multiple strategies",
          "Use audiobooks paired with text to support comprehension while building decoding skills",
          "Create successful experiences first, then gradually increase challenge"
        ],
        scripts: {
          doSay: [
            "Let\'s find the right level of challenge that helps your brain grow without feeling overwhelming",
            "I notice you\'re working hard on this—what part feels tricky?",
            "You have all the tools you need to figure this out. Let\'s think through it together."
          ],
          dontSay: [
            "This should be easy for someone your age",
            "Just try harder and you\'ll get it",
            "Other kids don\'t have trouble with this"
          ]
        }
      },
      achievementPressure: {
        yourApproach: "Focus on mastery and growth rather than performance comparisons",
        scripts: {
          doSay: [
            "I can see your reading skills getting stronger every day",
            "You\'re becoming such a strategic reader—I love how you think through challenges",
            "The way you figured that out shows real growth in your reading brain"
          ],
          dontSay: [
            "You need to be reading at this level by now",
            "You\'re behind where you should be",
            "If you just practiced more, you\'d be caught up"
          ]
        }
      },
      powerStruggles: {
        prevention: "Ensure that your skill-building focus doesn\'t overshadow their autonomy and interests",
        whenTheyHappen: [
          "Step back and check: Am I turning everything into a lesson?",
          "Return to their interests: What do they actually want to read about?",
          "Balance instruction with pure enjoyment",
          "Let some reading happen without any teaching agenda"
        ]
      },
      bookChoiceStruggles: {
  yourPhilosophy: "Guide choice toward books that provide appropriate challenge while honoring interests",
  practicalTips: [
    "Help them identify the 'just right' challenge level—not too easy, not too hard",
    "Teach them to do the 'five finger test' or other self-assessment strategies",
    "Connect their interests to books at their skill level",
    "Gradually introduce slightly more challenging books within their areas of passion"
  ]
},
readingHabitBuilding: {
  yourApproach: "Create structured success experiences that build momentum and confidence",
  practicalStrategies: [
    "Start with very achievable goals and gradually increase expectations",
    "Track visible progress—books completed, pages read, new words learned",
    "Create predictable reading routines that set children up for success",
    "Pair skill practice with enjoyable reading experiences"
  ]
},
differentLearningSpeeds: {
  yourPhilosophy: "Meet each child where they are and build systematically from there",
  approaches: [
    "Assess current skill levels honestly without judgment",
    "Provide intensive support for foundational skills that may be missing",
    "Celebrate incremental progress even if it seems small",
    "Adjust expectations to match individual learning needs and timelines"
  ]
}
    },
    
    seasonalSupport: {
      backToSchool: {
        challenge: "Supporting school skill expectations while maintaining reading motivation",
        strategies: [
          "Communicate with teachers about your child\'s current skill level and growth goals",
          "Provide additional support for skills that are challenging at school",
          "Help bridge the gap between school expectations and current abilities"
        ]
      },
      summer: {
        challenge: "Preventing skill loss while maintaining motivation during break",
        strategies: [
          "Create a summer reading plan that maintains skills without feeling like school",
          "Use library programs and reading challenges to provide structure",
          "Focus on high-interest books that keep skills active"
        ]
      },
      holidays: {
  challenge: "Maintaining skill development during breaks while allowing for rest",
  strategies: [
    "Choose engaging books that maintain skills without feeling like work",
    "Use holiday themes to make skill practice feel more like play",
    "Balance structured reading time with recreational reading"
  ]
},
spring: {
  challenge: "Sustaining momentum and addressing any skill gaps before year-end",
  strategies: [
    "Assess progress toward yearly goals and adjust support as needed",
    "Increase challenge gradually as skills strengthen",
    "Use outdoor reading opportunities to maintain engagement"
  ]
}
    },
    
    reflectionPrompts: [
      "What specific reading skill did your child develop or strengthen this week?",
      "How did you balance skill-building with pure reading enjoyment?",
      "What breakthrough moment did you witness in your child\'s reading growth?",
      "When did your strategic support help your child persist through a challenge?",
      "How are you celebrating authentic progress and effort rather than just outcomes?"
    ]
  },

  connection_creator: {
    id: 'connection_creator',
    name: 'Connection Creator',
    emoji: '🤝',
    color: '#EB2F96',
    traits: ['connection_creating', 'socially_motivated', 'relationship_centered', 'responsive'],
    
    quickDescription: 'You believe reading is fundamentally a social act - something to be shared, discussed, and enjoyed together. Your instinct is to create warm, connected experiences around books where relationships and stories intertwine.',
    
    psychologicalCore: {
      unconsciousDrive: 'You\'re motivated by the belief that learning happens in relationship and that shared experiences create the most powerful memories. You may have wonderful memories of reading with others, or you naturally process experiences by sharing them with people you care about.',
      dailyBehaviors: [
        'You feel most satisfied when reading becomes a shared experience',
        'Your first instinct with a great book is to find someone to talk about it with',
        'You remember books as much for who you read them with as for the stories themselves',
        'You feel energized by children\'s excitement about books and want to join in',
        'You naturally create rituals and traditions around reading'
      ],
      stressResponse: 'Under pressure, you may become pushy about connection, not recognizing when children need space. You might take their desire for independent reading personally.',
      childExperience: 'Children with connection-creating parents typically develop rich associations between reading and love, and often become enthusiastic book discussers and recommenders. They learn to see reading as a social activity.'
    },
    
    strengths: [
      'Creates rich, positive associations between reading and relationship',
      'Builds family cultures where books and stories are valued and shared',
      'Helps children develop social skills around discussing ideas and stories',
      'Models enthusiasm and joy about reading in contagious ways',
      'Makes reading feel like a celebration rather than a chore',
      'Creates lasting memories that connect reading with love and belonging'
    ],
    
    growthEdges: {
      title: 'Where You Might Need to Stretch',
      areas: [
        {
          challenge: 'You may not recognize when children need reading independence',
          insight: 'Your desire for connection is beautiful, but some children process stories internally and feel interrupted by too much discussion. Some need solitary reading time to fully engage.',
          growthAction: 'Learn to read the cues. Ask "Would you like to tell me about your book, or do you want to keep it private for now?" Honor both answers.'
        },
        {
          challenge: 'You might feel rejected when children prefer reading alone',
          insight: 'Independent reading isn\'t a rejection of you - it\'s often a sign that children have internalized your love of books and are developing their own relationship with reading.',
          growthAction: 'Celebrate their independent reading as a success, not a loss. Find other ways to connect around books without requiring constant sharing.'
        },
        {
          challenge: 'You may overwhelm reluctant readers with enthusiasm',
          insight: 'Your excitement about books can sometimes feel like pressure to children who are struggling or reluctant. They may feel like they\'re disappointing you.',
          growthAction: 'Match their energy level. Sometimes quiet companionship is more connecting than enthusiastic discussion.'
        }
      ]
    },
    
    researchFoundation: {
      coreTheory: 'Social Learning Theory (Bandura) and Relatedness in Self-Determination Theory',
      keyFinding: 'Learning is fundamentally social; relatedness (connection and belonging) is a basic psychological need',
      application: 'When parents create warm, connected experiences around reading, children develop positive associations between books and relationship, leading to stronger reading motivation and family bonds.',
      caution: 'Research also shows that individual differences matter greatly. Some children are more socially motivated than others, and pushing connection can backfire with children who prefer independence.'
    },
    
    confidenceBuilders: [
      '🌟 Research shows that social interaction around texts significantly improves comprehension and retention',
      '🌟 You\'re creating positive associations between reading and relationship that will last a lifetime',
      '🌟 Your approach builds family culture where books and stories are valued and celebrated',
      '🌟 Studies show that children who discuss books develop stronger critical thinking and empathy',
      '🌟 Shared reading experiences create some of the most treasured family memories',
      '🌟 Your enthusiasm and discussion naturally model what engaged readers do—think about and share their reading'
    ],
    
    dailyStrategies: {
      engagement: [
        "Start with connection: 'What are you hoping to discover in your book today?'",
        "Share your own reading plans: 'I\'m excited to continue my book—want to read in the same room?'",
        "Create anticipation: 'I can\'t wait to hear what happens next in your story!'"
      ],
      conflict: [
        "When they resist reading: 'Would it help to read together, or do you need some quiet time first?'",
        "When they don\'t want to discuss: 'You don\'t have to share now—I\'m here when you\'re ready'",
        "When they seem disconnected: 'What would make reading feel more enjoyable for you right now?'"
      ],
      celebration: [
        "Celebrate their discoveries: 'I love how excited you are about that character!'",
        "Honor their sharing: 'Thank you for telling me about that—it sounds fascinating'",
        "Create memory moments: 'I\'ll always remember how much you loved that series'"
      ]
    },
    
    problemsToolkit: {
      reluctantReader: {
        yourInstinct: "Make reading a social, connected experience that feels warm and inviting",
        whyThisWorks: "Often resistance comes from reading feeling isolated or disconnected from what matters to them. Social connection can reignite interest.",
        whenToWorry: "If they resist connection around reading consistently, or if social pressure seems to increase their avoidance",
        gentleApproaches: [
          "Read aloud together without requiring them to read independently",
          "Share books you both enjoy and discuss characters like real friends",
          "Create cozy reading traditions—special snacks, locations, or times",
          "Connect books to shared interests, experiences, or inside jokes"
        ],
        scripts: {
          doSay: [
            "Would you like company while you read, or would you prefer quiet time?",
            "I found a book that reminded me of you—want to hear about it?",
            "Reading together is one of my favorite times with you"
          ],
          dontSay: [
            "We need to discuss this book right now",
            "You should be excited about reading like I am",
            "If you don\'t read, we can\'t have our special time together"
          ]
        }
      },
      achievementPressure: {
        yourApproach: "Focus on the relationship and joy rather than performance metrics",
        scripts: {
          doSay: [
            "I love sharing these reading moments with you",
            "It\'s so fun to hear about the books you\'re enjoying",
            "You always choose such interesting stories to tell me about"
          ],
          dontSay: [
            "I\'m so proud of how much you\'re reading—keep it up!",
            "You\'re becoming such a good reader—that makes me happy",
            "I love that you\'re finally enjoying books like I do"
          ]
        }
      },
      powerStruggles: {
        prevention: "Ensure that your desire for connection doesn\'t become pressure or intrusion",
        whenTheyHappen: [
          "Step back and check: Am I making reading about my needs for connection?",
          "Honor their need for reading independence: \'You can read privately—I\'m here if you want to share\'",
          "Separate your enthusiasm from expectations about their response",
          "Remember that independent reading is also valuable and doesn\'t reflect on your relationship"
        ]
      },
      bookChoiceStruggles: {
  yourPhilosophy: "Help them find books that create opportunities for meaningful connection and discussion",
  practicalTips: [
    "Suggest books that you can enjoy together or discuss meaningfully",
    "Ask what kinds of characters or situations they're interested in",
    "Share books that connect to your family's experiences or values",
    "Let them choose from options that you're also excited to talk about"
  ]
},
readingHabitBuilding: {
  yourApproach: "Create consistent connected reading experiences that children look forward to",
  practicalStrategies: [
    "Establish regular reading times that feel like special together time",
    "Create reading rituals that include connection—discussion, sharing, or parallel reading",
    "Make reading a family activity where everyone participates in their own way",
    "Use reading as a way to connect throughout the day—sharing quotes, funny parts, or interesting discoveries"
  ]
},
differentLearningSpeeds: {
  yourPhilosophy: "Every child can participate in reading culture in their own way and timeline",
  approaches: [
    "Create inclusive reading experiences where different levels can participate together",
    "Use audiobooks, pictures, and discussion to include children at various skill levels",
    "Celebrate each child's unique contributions to family reading culture",
    "Focus on connection and enjoyment rather than comparing reading levels"
  ]
}
    },
    
    seasonalSupport: {
      backToSchool: {
        challenge: "Maintaining reading connection while managing school requirements and schedules",
        strategies: [
          "Establish regular family reading time that feels different from homework",
          "Discuss school reading assignments as a family to make them more social",
          "Create connections between school books and family interests or experiences"
        ]
      },
      summer: {
        challenge: "Creating connected reading experiences during relaxed summer schedules",
        strategies: [
          "Plan family reading adventures—bookstore visits, library programs, author events",
          "Create summer reading traditions—beach books, camping stories, travel reading",
          "Use vacation time for extended reading discussions and sharing"
        ]
      },
      holidays: {
  challenge: "Creating meaningful reading traditions while managing busy family schedules",
  strategies: [
    "Establish holiday reading traditions—special books, reading locations, or discussion times",
    "Give books as gifts that create opportunities for shared experience",
    "Use holiday themes to spark reading discussions and connections to family values"
  ]
},
spring: {
  challenge: "Maintaining reading connection as outdoor activities compete for time",
  strategies: [
    "Take reading outside—picnic reading, park reading, outdoor story time",
    "Connect reading to spring interests—gardening books, nature guides, outdoor adventure stories",
    "Use longer daylight hours for evening reading and discussion time"
  ]
}
    },
    
    reflectionPrompts: [
      "What reading moment created the strongest connection with your child this week?",
      "When did sharing a book or story bring you closer together?",
      "How did your child\'s enthusiasm about reading energize your own love of books?",
      "When did you successfully balance connection with your child\'s need for reading independence?",
      "What reading tradition or ritual is most meaningful in your family right now?"
    ]
  },

  meaning_maker: {
    id: 'meaning_maker',
    name: 'Meaning Maker',
    emoji: '🌟',
    color: '#722ED1',
    traits: ['meaning_making', 'relevance_focused', 'identity_development', 'depth_seeking'],
    
    quickDescription: 'You see reading as a pathway to understanding life, exploring big questions, and developing wisdom. Your instinct is to help children connect books to their experiences, values, and the deeper patterns of human existence.',
    
    psychologicalCore: {
      unconsciousDrive: 'You\'re motivated by the belief that stories help us make sense of life and that reading can be transformative. You may be naturally philosophical, or have experienced books as sources of guidance and insight during important life moments.',
      dailyBehaviors: [
        'You find yourself asking "What does this remind you of?" or "How does this connect to your life?"',
        'You notice themes and patterns across different books and point them out',
        'You feel most engaged by books that explore complex emotions or moral questions',
        'You remember books for how they changed your thinking, not just for the plots',
        'You naturally connect current events, family situations, or life transitions to books'
      ],
      stressResponse: 'Under pressure, you may become too heavy-handed about finding meaning, turning enjoyable stories into homework. You might miss when children just want fun, escapist reading.',
      childExperience: 'Children with meaning-making parents typically develop sophisticated thinking skills and the ability to use reading for emotional processing and personal growth. They often become deep thinkers who see connections across ideas and experiences.'
    },
    
    strengths: [
      'Develops children\'s capacity for deep thinking and reflection',
      'Helps children use reading for emotional processing and growth',
      'Creates readers who see books as sources of wisdom and guidance',
      'Models how reading can provide insight into life\'s challenges',
      'Builds children\'s ability to make connections across ideas and experiences',
      'Encourages empathy and understanding of different perspectives'
    ],
    
    growthEdges: {
      title: 'Where You Might Need to Stretch',
      areas: [
        {
          challenge: 'You may intellectualize when children need emotional support',
          insight: 'Your search for meaning is valuable, but sometimes children experiencing strong emotions need validation and comfort before analysis and insight.',
          growthAction: 'Lead with empathy. Say "That sounds really hard" before "What do you think the author is trying to show us about friendship?"'
        },
        {
          challenge: 'You might dismiss "light" reading as less valuable',
          insight: 'Your appreciation for meaningful books can sometimes lead to subtle devaluing of fun, escapist, or series reading that children love.',
          growthAction: 'Remember that building reading stamina and joy through "easy" books often leads to readiness for deeper texts later. Fun reading has its own important purpose.'
        },
        {
          challenge: 'Children may feel like their interpretations aren\'t sophisticated enough',
          insight: 'Your comfort with complex ideas can sometimes make children feel like their simpler responses aren\'t good enough.',
          growthAction: 'Start with their level of meaning-making. A seven-year-old saying "The character was sad like me when my dog died" is profound meaning-making for that age.'
        }
      ]
    },
    
    researchFoundation: {
      coreTheory: 'Transformative Learning Theory (Mezirow) and Reader Response Theory',
      keyFinding: 'Learning becomes transformative when it connects to personal meaning and experience; readers actively construct meaning through interaction with texts',
      application: 'When parents help children connect literature to their own experiences and questions, reading becomes a tool for personal growth, emotional processing, and wisdom development.',
      caution: 'Research shows that meaning-making develops gradually. Pushing for insights beyond children\'s developmental level can create anxiety rather than understanding.'
    },
    
    confidenceBuilders: [
      '🌟 Research on "transformative learning" shows that connecting literature to personal experience enhances both comprehension and personal growth',
      '🌟 You\'re developing children\'s capacity for deep thinking and reflection that will serve them throughout life',
      '🌟 Your approach helps children use reading for emotional processing and developing wisdom',
      '🌟 Studies show that discussing themes and meanings in books improves critical thinking and moral reasoning',
      '🌟 Children who learn to find personal relevance in reading become more engaged and motivated readers',
      '🌟 Your meaning-making approach builds empathy and understanding of different perspectives and experiences'
    ],
    
    dailyStrategies: {
      engagement: [
        "Connect reading to the day ahead: 'I wonder if you\'ll discover something in your book that connects to today'",
        "Share meaningful quotes or insights from your own reading",
        "Ask about their current book: 'What\'s the character teaching you about friendship/courage/growing up?'"
      ],
      conflict: [
        "When they resist deeper discussion: 'You don\'t have to analyze it—just tell me what you\'re thinking about'",
        "When they prefer surface-level books: 'What are you getting from this story? What does it give you right now?'",
        "When they seem overwhelmed by meaning: 'Sometimes books are just for fun—that\'s important too'"
      ],
      celebration: [
        "Celebrate their insights: 'That\'s such a thoughtful way to think about that character\'s choice'",
        "Honor their connections: 'I love how you connected that story to your own experience'",
        "Value their questions: 'That\'s exactly the kind of question great readers ask'"
      ]
    },
    
    problemsToolkit: {
      reluctantReader: {
        yourInstinct: "Help them find personal relevance and connection to their own life and interests",
        whyThisWorks: "When reading connects to what matters to them personally, motivation naturally increases",
        whenToWorry: "If your search for meaning consistently overshadows their natural enjoyment, or if they begin to resist meaningful books",
        gentleApproaches: [
          "Start with books that naturally connect to their current life situations or interests",
          "Ask about their thoughts and feelings rather than pushing for deep analysis",
          "Let meaning emerge naturally from their responses rather than imposing your interpretations",
          "Balance meaningful books with purely entertaining ones"
        ],
        scripts: {
          doSay: [
            "What\'s interesting to you about this story?",
            "Does anything in this book remind you of your own life?",
            "I\'m curious what you\'re thinking about while you read this"
          ],
          dontSay: [
            "What is the author trying to teach us about life?",
            "This is an important book that will help you understand the world",
            "You should be getting more meaning from this story"
          ]
        }
      },
      achievementPressure: {
        yourApproach: "Focus on personal growth and insight rather than analytical performance",
        scripts: {
          doSay: [
            "I love hearing your thoughts about that character",
            "You\'re becoming such a thoughtful reader",
            "Your insights about that story really made me think"
          ],
          dontSay: [
            "That\'s a very sophisticated analysis for someone your age",
            "You\'re getting so good at finding the deeper meaning",
            "Your interpretations are becoming more mature"
          ]
        }
      },
      powerStruggles: {
        prevention: "Ensure that your desire for meaningful discussion doesn\'t overwhelm their natural response to books",
        whenTheyHappen: [
          "Step back and check: Am I making every book into a lesson?",
          "Honor their developmental level: A seven-year-old\'s emotional response is meaningful",
          "Let some reading happen without any discussion or analysis",
          "Remember that entertainment and escape are also valid reasons to read"
        ]
      },
      bookChoiceStruggles: {
  yourPhilosophy: "Guide them toward books that offer meaningful content while honoring their interests and developmental level",
  practicalTips: [
    "Help them find books that explore themes they're naturally curious about",
    "Connect their interests to books with meaningful content",
    "Introduce books that deal with situations they're currently facing",
    "Balance heavy, meaningful books with lighter fare that still offers some depth"
  ]
},
readingHabitBuilding: {
  yourApproach: "Create reading experiences that naturally invite reflection and personal connection",
  practicalStrategies: [
    "Establish regular discussion times that feel like conversations rather than interrogations",
    "Keep a family reading journal where insights and connections can be shared",
    "Create traditions around books that deal with important themes or life transitions",
    "Model your own meaning-making by sharing insights from your reading"
  ]
},
differentLearningSpeeds: {
  yourPhilosophy: "Meaning-making happens at every level and in different ways for each child",
  approaches: [
    "Meet children where they are developmentally in their capacity for meaning-making",
    "Use pictures, movies, and discussion to make complex themes accessible",
    "Celebrate simple emotional responses as valid meaning-making",
    "Provide books with meaningful content at appropriate skill levels"
  ]
}
    },
    
    seasonalSupport: {
      backToSchool: {
        challenge: "Balancing school\'s analytical requirements with natural, personal meaning-making",
        strategies: [
          "Show how school analysis can deepen rather than replace personal response",
          "Help them find personal relevance in required reading",
          "Teach them to balance academic requirements with their own insights"
        ]
      },
      summer: {
        challenge: "Maintaining meaningful reading experiences during relaxed summer schedules",
        strategies: [
          "Choose summer books that offer both entertainment and meaningful themes",
          "Use travel and new experiences as springboards for discussing books about adventure or discovery",
          "Create relaxed discussion opportunities around meaningful summer reading"
        ]
      },
      holidays: {
  challenge: "Using seasonal themes to explore meaningful questions about family, tradition, and values",
  strategies: [
    "Choose holiday books that explore meaningful themes about family, giving, or tradition",
    "Use seasonal transitions to discuss books about change, growth, or cycles",
    "Connect holiday experiences to books about similar themes or values"
  ]
},
spring: {
  challenge: "Using themes of growth, renewal, and change for deeper reading connections",
  strategies: [
    "Choose books that explore themes of growth, change, or new beginnings",
    "Connect spring observations to books about nature, cycles, or transformation",
    "Use longer daylight hours for extended discussions about meaningful books"
  ]
}
    },
    
    reflectionPrompts: [
      "What meaningful insight did your child gain from reading this week?",
      "How did a book help your child process or understand something important in their life?",
      "When did your child make a connection between a story and their own experience?",
      "How did you balance meaning-making with pure reading enjoyment?",
      "What deep question or theme is your child naturally drawn to exploring through books?"
    ]
  },

  growth_facilitator: {
    id: 'growth_facilitator',
    name: 'Growth Facilitator',
    emoji: '📈',
    color: '#13C2C2',
    traits: ['growth_facilitating', 'developmental_thinking', 'organic_approach', 'patient'],
    
    quickDescription: 'You see reading development as a gradual unfolding that requires patience, appropriate challenge, and celebration of progress. Your instinct is to create conditions where growth can happen naturally while providing just enough support.',
    
    psychologicalCore: {
      unconsciousDrive: 'You\'re motivated by understanding that learning is a process, not an event. You may have experienced the satisfaction of gradual mastery, or naturally think in developmental terms about how skills and interests unfold over time.',
      dailyBehaviors: [
        'You notice small signs of progress that others might miss',
        'You think about where a child is developmentally, not just chronologically',
        'You feel comfortable with children taking time to develop at their own pace',
        'You instinctively provide just enough challenge without overwhelming',
        'You celebrate effort and growth more than finished products'
      ],
      stressResponse: 'Under pressure, you may become overly cautious about challenge, keeping children in their comfort zones too long. You might focus so much on the process that you miss when children are ready for bigger leaps.',
      childExperience: 'Children with growth-facilitating parents typically develop strong foundational skills and confidence in their ability to learn and grow. They learn to persist through challenges because the support they receive is carefully calibrated to their needs.'
    },
    
    strengths: [
      'Creates optimal learning conditions with appropriate challenge and support',
      'Helps children develop resilience and persistence through manageable struggles',
      'Builds children\'s confidence by ensuring they experience success along the way',
      'Models patience and faith in the learning process',
      'Recognizes and celebrates growth that others might overlook',
      'Prevents reading anxiety by never pushing too hard too fast'
    ],
    
    growthEdges: {
      title: 'Where You Might Need to Stretch',
      areas: [
        {
          challenge: 'You may underestimate what children are ready for',
          insight: 'Your careful attention to appropriate challenge is wonderful, but sometimes children are ready for bigger leaps than you realize. They may feel held back by too much caution.',
          growthAction: 'Regularly check in: "Do you feel ready for something more challenging?" Trust their self-assessment along with your observations.'
        },
        {
          challenge: 'You might focus so much on process that you miss joy',
          insight: 'Your developmental awareness can sometimes make you overly analytical about reading progression, forgetting that passion and excitement can accelerate growth.',
          growthAction: 'Remember that sometimes children grow fastest through books they absolutely love, even if they seem "too easy" or "too hard" developmentally.'
        },
        {
          challenge: 'Children may feel like they\'re moving too slowly',
          insight: 'Your patience is a gift, but some children want to feel challenged and may interpret your gradual approach as lack of confidence in their abilities.',
          growthAction: 'Be transparent about your intentional support. Say "I\'m giving you time to really master this because I believe in building strong foundations."'
        }
      ]
    },
    
    researchFoundation: {
      coreTheory: 'Zone of Proximal Development (Vygotsky) and Gradual Release of Responsibility Model',
      keyFinding: 'Optimal learning occurs when challenge is appropriately matched to current capacity with supportive scaffolding',
      application: 'When parents provide developmentally appropriate challenge with responsive support, children develop both skills and confidence while maintaining intrinsic motivation for continued growth.',
      caution: 'Research also shows that individualized pacing with appropriate scaffolding leads to stronger skill development, better retention, and more positive attitudes toward learning than one-size-fits-all approaches.'
    },
    
    confidenceBuilders: [
      '🌟 Research from Vygotsky\'s Zone of Proximal Development shows that optimal learning happens with appropriate challenge and support',
      '🌟 Your patient approach prevents reading anxiety and creates positive associations with learning',
      '🌟 You\'re building children\'s confidence by ensuring they experience success along the way to mastery',
      '🌟 Studies show that gradual release of responsibility creates more independent, confident learners',
      '🌟 Your focus on process over product develops growth mindset and resilience in learners',
      '🌟 Research confirms that individualized pacing leads to stronger long-term retention and motivation'
    ],
    
    dailyStrategies: {
      engagement: [
        "Set realistic goals: 'Let\'s see what feels like the right challenge for you today'",
        "Acknowledge current capacity: 'You\'re ready for this next step based on what I\'ve seen you do'",
        "Provide preview support: 'Here\'s what we\'ll work toward gradually'"
      ],
      conflict: [
        "When they\'re frustrated: 'Learning takes time—you\'re exactly where you need to be right now'",
        "When they want to rush: 'Let\'s make sure you feel solid with this before we move on'",
        "When they feel stuck: 'I can see your brain working hard—growth is happening even when it doesn\'t feel like it'"
      ],
      celebration: [
        "Celebrate incremental progress: 'Look how much stronger you\'ve gotten since last month!'",
        "Honor the process: 'I love seeing how hard you\'re working on becoming a better reader'",
        "Make growth visible: Keep records that show development over time"
      ]
    },
    
    problemsToolkit: {
      reluctantReader: {
        yourInstinct: "Assess current level and provide gentle, graduated support that builds confidence through small successes",
        whyThisWorks: "Reluctance often stems from feeling overwhelmed or unsuccessful. Gradual challenge with support rebuilds confidence.",
        whenToWorry: "If reluctance persists despite appropriate scaffolding, or if you notice signs of learning differences that need specialized support",
        gentleApproaches: [
          "Start where they are, not where you think they should be",
          "Provide multiple small successes before introducing new challenges",
          "Use interest as the motivator while gradually building skills",
          "Break down reading tasks into manageable, achievable steps"
        ],
        scripts: {
          doSay: [
            "You\'re growing as a reader every day, even when it doesn\'t feel like it",
            "Let\'s find the right level of challenge that helps you grow without feeling overwhelmed",
            "I can see progress in your reading, even if you can\'t feel it yet"
          ],
          dontSay: [
            "You should be reading at this level by now",
            "If you just try harder, you\'ll catch up",
            "Other kids your age are reading much harder books"
          ]
        }
      },
      achievementPressure: {
        yourApproach: "Focus on individual growth trajectory rather than external comparisons or timelines",
        scripts: {
          doSay: [
            "Look how much you\'ve grown since we started this journey",
            "You\'re developing exactly as you should—every reader has their own timeline",
            "I\'m proud of the effort you\'re putting into growing as a reader"
          ],
          dontSay: [
            "You need to catch up to grade level",
            "If you worked harder, you\'d be reading better by now",
            "I wish you were progressing faster"
          ]
        }
      },
      powerStruggles: {
        prevention: "Ensure that your developmental approach doesn\'t feel controlling or limiting to children who want more challenge",
        whenTheyHappen: [
          "Check: Am I being too cautious about their readiness for challenge?",
          "Ask them: \'What feels like the right challenge level for you?\'",
          "Balance your assessment with their self-advocacy",
          "Remember that motivation can sometimes overcome developmental limitations"
        ]
      },
      bookChoiceStruggles: {
  yourPhilosophy: "Guide choice toward books that provide appropriate developmental challenge while honoring interests",
  practicalTips: [
    "Help them identify books that are 'just right'—not too easy, not too hard",
    "Gradually introduce slightly more challenging books within their interest areas",
    "Teach them self-assessment strategies for choosing appropriate books",
    "Balance comfort reading with gentle stretch reading"
  ]
},
readingHabitBuilding: {
  yourApproach: "Build habits gradually with systems that support rather than pressure natural development",
  practicalStrategies: [
    "Start with very small, achievable reading goals and gradually increase",
    "Create predictable routines that support reading development",
    "Track progress in ways that make growth visible over time",
    "Adjust expectations based on individual capacity and life circumstances"
  ]
},
differentLearningSpeeds: {
  yourPhilosophy: "Every child has their own optimal learning pace and pathway",
  approaches: [
    "Assess individual starting points without judgment or comparison",
    "Provide intensive support for areas of need while building on strengths",
    "Celebrate progress relative to individual starting point",
    "Adjust timelines and expectations to match individual learning profiles"
  ]
}
    },
    
    seasonalSupport: {
      backToSchool: {
        challenge: "Supporting school expectations while maintaining developmentally appropriate pacing",
        strategies: [
          "Communicate with teachers about your child\'s developmental needs and growth trajectory",
          "Provide supplemental support that bridges gaps without overwhelming",
          "Help your child understand that everyone grows at their own pace"
        ]
      },
      summer: {
        challenge: "Preventing skill regression while allowing for natural rest and play",
        strategies: [
          "Create summer plans that maintain skills without feeling like school",
          "Use library programs and reading challenges to provide gentle structure",
          "Balance skill maintenance with recreational reading and play"
        ]
      },
      holidays: {
  challenge: "Maintaining developmental momentum during schedule disruptions",
  strategies: [
    "Adjust expectations for holiday schedules while maintaining gentle progress",
    "Use holiday themes to continue development in engaging ways",
    "Balance rest with gentle skill maintenance"
  ]
},
spring: {
  challenge: "Building momentum for end-of-year goals while respecting natural energy cycles",
  strategies: [
    "Assess progress toward yearly goals and adjust plans realistically",
    "Use spring energy to tackle slightly more challenging books or skills",
    "Prepare gradually for summer reading to prevent skill loss"
  ]
}
    },
    
    reflectionPrompts: [
      "What small sign of reading growth did you notice in your child this week?",
      "How did you provide just the right amount of challenge without overwhelming them?",
      "When did your patient approach pay off in your child\'s development?",
      "How are you celebrating progress rather than comparing to external benchmarks?",
      "What adjustment did you make to better match your child\'s current developmental needs?"
    ]
  },

  authentic_modeler: {
    id: 'authentic_modeler',
    name: 'Authentic Modeler',
    emoji: '📚',
    color: '#FA8C16',
    traits: ['authentic_modeling', 'inspirational', 'natural_influence', 'intentional'],
    
    quickDescription: 'You believe the most powerful teaching happens through genuine demonstration. Your instinct is to live as a reader yourself - showing rather than telling children what a life enriched by books looks like.',
    
    psychologicalCore: {
      unconsciousDrive: 'You\'re motivated by the belief that authenticity is more powerful than instruction and that children naturally want to emulate what they see as genuinely valuable in adult life. You may have been influenced by adults who genuinely loved what they shared with you.',
      dailyBehaviors: [
        'You read your own books visibly, where children can see your genuine enjoyment',
        'You share your real reactions to books - excitement, surprise, even disappointment',
        'You feel uncomfortable with artificial "educational" approaches that you wouldn\'t use yourself',
        'You make reading choices based on your authentic interests, not what you think you "should" read',
        'You talk about books the way you talk about other things you love - naturally and enthusiastically'
      ],
      stressResponse: 'Under pressure, you may become resistant to any structured approaches, even ones that might help. You might dismiss effective techniques because they feel artificial to you.',
      childExperience: 'Children with authentic modeling parents typically develop natural reading habits and positive associations with books as part of life. They see reading as something adults genuinely enjoy and choose to do, not just something imposed on children.'
    },
    
    strengths: [
      'Models what genuine reading enthusiasm looks like in daily life',
      'Creates authentic reading culture where books are naturally valued',
      'Shows children that reading is something adults choose to do, not just assign',
      'Builds children\'s reading identity through powerful positive modeling',
      'Demonstrates how reading fits into a full, engaged life',
      'Inspires children through contagious passion rather than artificial motivation'
    ],
    
    growthEdges: {
      title: 'Where You Might Need to Stretch',
      areas: [
        {
          challenge: 'You may resist helpful structures because they feel artificial',
          insight: 'Your commitment to authenticity is valuable, but some children need more explicit support than modeling alone provides. Structure can coexist with authenticity.',
          growthAction: 'Think of reading strategies as tools that enhance authentic experience, not replace it. You can teach phonics authentically if a child needs it to access books they love.'
        },
        {
          challenge: 'Your reading level may intimidate developing readers',
          insight: 'Your sophisticated reading choices, while authentic to you, can sometimes make children feel like "real reading" is beyond their reach.',
          growthAction: 'Also read some books at your child\'s level with genuine interest. Show that all kinds of reading have value and can be enjoyed authentically.'
        },
        {
          challenge: 'You might not provide enough explicit guidance',
          insight: 'Your natural approach assumes children will absorb reading behaviors through observation, but some children need more direct instruction to develop skills.',
          growthAction: 'Balance modeling with teaching. You can authentically share the strategies you use as a reader: "When I don\'t understand something, I usually..."'
        }
      ]
    },
    
    researchFoundation: {
      coreTheory: 'Social Learning Theory (Albert Bandura) and Social Cognitive Theory',
      keyFinding: 'People learn through observing others\' behaviors, attitudes, and outcomes; modeling is most effective when it\'s authentic and from trusted sources',
      application: 'When parents authentically demonstrate reading as a valued part of adult life, children develop positive associations and natural motivation to adopt reading behaviors themselves.',
      caution: 'Research also shows that modeling works best when combined with explicit instruction for children who need it. Some skills require direct teaching, not just demonstration.'
    },
    
    confidenceBuilders: [
      '🌟 Research from Social Learning Theory shows that children learn powerfully through observing authentic models',
      '🌟 Your genuine reading life creates more powerful motivation than artificial educational approaches',
      '🌟 You\'re building children\'s reading identity by showing them what engaged adult readers actually look like',
      '🌟 Studies show that adult reading behavior significantly influences children\'s reading attitudes and habits',
      '🌟 Your authentic approach prevents the artificial separation between "kid reading" and "real reading"',
      '🌟 Children who see reading as part of natural adult life are more likely to maintain reading habits throughout their lives'
    ],
    
    dailyStrategies: {
      engagement: [
        "Read your own book where children can see you enjoying it",
        "Share what you\'re excited to read today: 'I can\'t wait to see what happens next in my book!'",
        "Let them see your reading choices and decision-making process"
      ],
      conflict: [
        "When they resist reading: Model rather than pressure—'I\'m going to read for a bit. You\'re welcome to join me or do something else\'",
        "When they question reading value: Share authentically—'Reading gives me so much joy/knowledge/relaxation\'",
        "When they prefer screens: Don\'t compete, just continue modeling—'I love my book time\'"
      ],
      celebration: [
        "Share your authentic reading joy: 'I just read the most amazing part!'",
        "Include them in your reading life: 'Want to hear about this interesting thing I learned?'",
        "Model reading celebration: Let them see you savor finishing a good book"
      ]
    },
    
    problemsToolkit: {
      reluctantReader: {
        yourInstinct: "Continue modeling authentic reading joy without pressuring them to join",
        whyThisWorks: "Children often resist when they feel pressured, but authentic modeling plants seeds that may sprout later",
        whenToWorry: "If modeling alone isn\'t sufficient and they seem to need more structured support or have underlying difficulties",
        gentleApproaches: [
          "Read visibly and enjoyably without requiring them to participate",
          "Share your genuine reading experiences without expecting reciprocation",
          "Let them see how books enrich your life naturally",
          "Include them in book-related activities (bookstore visits, library trips) without pressure to engage"
        ],
        scripts: {
          doSay: [
            "I\'m going to read for a while—you\'re welcome to read too or do something else",
            "This book is so good—I can hardly put it down!",
            "I love having reading time to myself"
          ],
          dontSay: [
            "You should read like I do",
            "See how much I enjoy reading? You should try it",
            "I\'m reading to show you how fun it is"
          ]
        }
      },
      achievementPressure: {
        yourApproach: "Model reading for intrinsic rewards rather than external achievement",
        scripts: {
          doSay: [
            "This book is teaching me so much about [topic I\'m genuinely interested in]",
            "I love getting lost in a good story",
            "Reading helps me relax/learn/understand the world"
          ],
          dontSay: [
            "Look how smart reading makes me",
            "I read because it\'s good for me",
            "Reading makes me a better person—it will do the same for you"
          ]
        }
      },
      powerStruggles: {
        prevention: "Avoid turning reading into an issue by maintaining focus on your own authentic reading life",
        whenTheyHappen: [
          "Return to modeling rather than instruction or pressure",
          "Separate your reading enjoyment from their reading behavior",
          "Continue demonstrating reading value without requiring their participation",
          "Remember that authentic modeling works over time, not immediately"
        ]
      },
      bookChoiceStruggles: {
  yourPhilosophy: "Model thoughtful book selection while letting them develop their own taste",
  practicalTips: [
    "Let them see your book selection process—browsing, reading reviews, asking for recommendations",
    "Share why you choose certain books without implying they should make the same choices",
    "Model how you abandon books that don't capture your interest",
    "Show appreciation for different types of reading—fiction, nonfiction, easy reads, challenging books"
  ]
},
readingHabitBuilding: {
  yourApproach: "Model natural reading rhythms and show how reading fits into real life",
  practicalStrategies: [
    "Read at various times and in various places, showing reading as a flexible life practice",
    "Let them see how you make time for reading in your real schedule",
    "Model reading for different purposes—learning, relaxation, problem-solving, entertainment",
    "Show how you integrate reading with other life activities and interests"
  ]
},
differentLearningSpeeds: {
  yourPhilosophy: "Model how different types of reading and different paces all have value",
  approaches: [
    "Let them see you read books at various levels and complexity",
    "Model how you adjust your reading approach based on material and purpose",
    "Show appreciation for all types of reading—quick reads, challenging books, re-reading favorites",
    "Demonstrate that being a reader doesn't mean reading at any particular level or speed"
  ]
}
    },
    
    seasonalSupport: {
      backToSchool: {
        challenge: "Modeling how reading fits into busy real-life schedules",
        strategies: [
          "Let them see how you carve out reading time even when life gets busy",
          "Model how you use different types of reading for different situations",
          "Show how you balance required reading with chosen reading"
        ]
      },
      summer: {
        challenge: "Demonstrating how reading enhances rather than competes with summer activities",
        strategies: [
          "Model vacation reading, beach reading, travel reading",
          "Let them see you choose books that complement summer experiences",
          "Show how reading can be part of summer relaxation and enjoyment"
        ]
      },
      holidays: {
  challenge: "Modeling how reading enriches celebrations and traditions",
  strategies: [
    "Let them see you choose books related to holiday themes or travel",
    "Model how reading can be part of holiday relaxation and enjoyment",
    "Share books as gifts in ways that reflect genuine enthusiasm rather than obligation"
  ]
},
spring: {
  challenge: "Showing how reading adapts to seasonal energy and outdoor time",
  strategies: [
    "Model reading outdoors and in different seasonal settings",
    "Let them see you choose books that match spring energy—lighter reads, garden books, travel planning",
    "Show how reading complements rather than competes with outdoor activities"
  ]
}
    },
    
    reflectionPrompts: [
      "How did your authentic reading life inspire or influence your child this week?",
      "What did your child observe about your reading habits and choices?",
      "When did modeling work better than direct instruction or encouragement?",
      "How are you balancing authentic modeling with responsive support for your child\'s needs?",
      "What aspect of your reading life do you most want your child to absorb through observation?"
    ]
  }
};

// PARENT-CHILD COMPATIBILITY MATRIX (from parentPsychology.js)
export const PARENT_CHILD_COMPATIBILITY = {
  'autonomy_supporter': {
    'social_connector': {
      level: 'Growing Together',
      realityCheck: {
        honeymoonPhase: 'Initially, your child loves that you don\'t pressure them about reading, and you appreciate their social enthusiasm.',
        whereTensionArises: 'Your social connector child WANTS you to engage with their reading - to ask questions, share excitement, even read together. But your respectful distance can feel like rejection.',
        theClash: 'You: "I don\'t want to intrude on their reading experience." Them: "Why won\'t Mom/Dad talk to me about my book?"',
        howToNavigate: 'Your child\'s need for social connection around reading isn\'t the same as needing control. You can be enthusiastically interested without being directive.',
        growthOpportunity: 'This pairing teaches you that autonomy and connection aren\'t opposites. Your child can help you see that sometimes the most supportive thing you can do is show genuine interest, not respectful distance.'
      },
      specificStrategies: [
        'Say "Tell me about your favorite character" instead of analyzing the book yourself',
        'Ask "What was the most exciting part?" and let them lead the conversation',
        'Create regular "book sharing time" where they can tell you what they want to share',
        'Show enthusiasm for THEIR discoveries rather than steering toward your preferences'
      ]
    },
    'challenge_seeker': {
      level: 'Strong Match',
      realityCheck: {
        honeymoonPhase: 'Your child loves that you trust them to tackle difficult books, and you admire their determination and independence.',
        whereTensionArises: 'When your child hits a real barrier, your instinct to step back conflicts with their need for strategic support to overcome challenges.',
        theClash: 'You: "They\'ll figure it out - I don\'t want to take over." Them: "I need help but don\'t want to admit it or have someone do it for me."',
        howToNavigate: 'Offer support as "tools for their toolkit" rather than taking over. Your challenge-seeker wants to maintain ownership while getting strategic help.',
        growthOpportunity: 'This pairing helps you learn that providing scaffolding can actually enhance autonomy rather than undermine it.'
      },
      specificStrategies: [
        'Say "Here\'s a strategy that might help" rather than "Let me show you"',
        'Offer multiple approaches and let them choose which to try',
        'Celebrate their persistence while providing the tools they need to succeed',
        'Ask "What kind of support would feel helpful right now?" and honor their answer'
      ]
    },
    'curious_investigator': {
      level: 'Excellent Match',
      realityCheck: {
        honeymoonPhase: 'Perfect harmony - you love their self-directed learning and they love having freedom to explore their interests deeply.',
        whereTensionArises: 'Rarely! But sometimes your hands-off approach means missing opportunities to extend their learning.',
        theClash: 'You: "They\'re learning so much on their own." Them: "I wish someone would get excited about this with me."',
        howToNavigate: 'Your investigator child actually loves sharing their expertise - they want an interested audience for their discoveries.',
        growthOpportunity: 'This pairing shows you that interest and autonomy can coexist beautifully.'
      },
      specificStrategies: [
        'Ask them to teach you about their current interest area',
        'Provide resources and access without directing how they use them',
        'Celebrate their growing expertise in their chosen topics',
        'Connect them with other experts or resources when they\'re ready to go deeper'
      ]
    },
    'creative_explorer': {
      level: 'Strong Match',
      realityCheck: {
        honeymoonPhase: 'You love their unique responses to books and they love having freedom to create and explore without judgment.',
        whereTensionArises: 'Sometimes your hands-off approach means missing opportunities to provide materials or support that could enhance their creative work.',
        theClash: 'You: "I don\'t want to interfere with their creative process." Them: "I have so many ideas but don\'t know how to make them happen."',
        howToNavigate: 'Provide rich environments and resources without directing how they\'re used. Your creative explorer wants tools and opportunities, not instructions.',
        growthOpportunity: 'This pairing teaches you that supporting creativity doesn\'t mean controlling it.'
      },
      specificStrategies: [
        'Keep art supplies, building materials, and journals easily accessible near reading areas',
        'Ask "What materials would help you bring that idea to life?" rather than suggesting specific projects',
        'Celebrate their creative interpretations without trying to steer them toward "academic" responses',
        'Document their creative work to show you value their unique way of processing stories'
      ]
    },
    'freedom_reader': {
      level: 'Excellent Match',
      realityCheck: {
        honeymoonPhase: 'Perfect match - you both value choice, independence, and following natural interests.',
        whereTensionArises: 'Very rarely, but sometimes two highly autonomous people can miss opportunities for connection.',
        theClash: 'You: "They\'re so independent." Them: "I wonder if anyone cares what I\'m reading."',
        howToNavigate: 'Even freedom readers sometimes want to share their discoveries. Create optional opportunities for connection without making them required.',
        growthOpportunity: 'This pairing is naturally harmonious but can teach you both that independence and connection can coexist when neither is forced.'
      },
      specificStrategies: [
        'Offer optional sharing: "Want to tell me about your book, or are you keeping it private?"',
        'Share your own reading choices and discoveries without expecting reciprocation',
        'Create a family reading culture where everyone reads their own books in the same space',
        'Trust their instincts completely while staying available for connection when they want it'
      ]
    },
    'reflective_thinker': {
      level: 'Good Match',
      realityCheck: {
        honeymoonPhase: 'You respect their need for processing time and they appreciate not being rushed to share their thoughts.',
        whereTensionArises: 'Your hands-off approach might sometimes miss opportunities to help them articulate or extend their thinking.',
        theClash: 'You: "I don\'t want to interrupt their reflection." Them: "I have all these thoughts but don\'t know if anyone wants to hear them."',
        howToNavigate: 'Reflective thinkers often want to share their insights - they just need time to develop them first.',
        growthOpportunity: 'This pairing teaches you that respecting someone\'s process doesn\'t mean being completely hands-off.'
      },
      specificStrategies: [
        'Give them plenty of time to process books before asking questions',
        'Ask "Have you had any interesting thoughts about that book?" rather than specific questions',
        'Keep a family reading journal where they can write thoughts if they prefer that to talking',
        'Show that you value their thoughtful approach to reading'
      ]
    }
  },
  // Complete Parent-Child Compatibility Matrix - Ready to paste after autonomy_supporter
// This includes all remaining 30 combinations (5 parent types × 6 child types each)

'competence_builder': {
  'social_connector': {
    level: 'Strong Match',
    realityCheck: {
      honeymoonPhase: 'Your child loves when you help them share their reading with others more effectively, and you appreciate their enthusiasm for discussing books.',
      whereTensionArises: 'Your focus on skill-building can sometimes overshadow their desire for social connection around books. They want to connect emotionally, not just improve technically.',
      theClash: 'You: "Let\'s work on your reading fluency first." Them: "But I want to tell everyone about this story right now!"',
      howToNavigate: 'Use their social motivation as the context for skill-building. They\'ll work harder on skills when they know it helps them share stories better with friends and family.',
      growthOpportunity: 'This pairing teaches you that social connection can be a powerful motivator for skill development, and teaches them that skills enhance their ability to connect.'
    },
    specificStrategies: [
      'Build skills through partner reading and discussion activities',
      'Use book clubs or reading buddies as motivation for skill development',
      'Celebrate how improved skills help them share stories more effectively',
      'Create opportunities to practice reading aloud for an audience'
    ]
  },
  'challenge_seeker': {
    level: 'Excellent Match',
    realityCheck: {
      honeymoonPhase: 'Perfect synergy - you love supporting their drive to conquer difficult texts, and they thrive with your strategic skill-building approach.',
      whereTensionArises: 'Sometimes your careful scaffolding might feel too slow for their desire to tackle the biggest challenges immediately.',
      theClash: 'You: "Let\'s build up to that book gradually." Them: "I want to try the hardest one NOW!"',
      howToNavigate: 'Balance their need for immediate challenge with strategic support. Let them attempt hard books while providing the scaffolding they need to succeed.',
      growthOpportunity: 'This pairing teaches you to trust their ambition while they learn to value the systematic approach that ensures success.'
    },
    specificStrategies: [
      'Set ambitious but achievable skill goals together',
      'Provide just-in-time skill instruction when they hit obstacles',
      'Create skill challenges that feel like conquests, not drills',
      'Document their skill growth alongside their reading achievements'
    ]
  },
  'curious_investigator': {
    level: 'Strong Match',
    realityCheck: {
      honeymoonPhase: 'You appreciate their systematic approach to learning, and they value the skills you help them develop for deeper research.',
      whereTensionArises: 'Your focus on general reading skills might conflict with their desire to dive deep into specific topics immediately.',
      theClash: 'You: "We need to work on these comprehension strategies." Them: "But I just want to learn everything about dinosaurs!"',
      howToNavigate: 'Use their content interests as the vehicle for skill development. They\'ll engage with skills when they see how it helps them learn more effectively.',
      growthOpportunity: 'This pairing teaches you that passion-driven learning accelerates skill development, while they learn that skills unlock deeper knowledge.'
    },
    specificStrategies: [
      'Teach research and note-taking skills through their interest topics',
      'Show how reading skills help them become better investigators',
      'Use their expertise areas to practice advanced comprehension strategies',
      'Build skills through comparing multiple sources on their favorite topics'
    ]
  },
  'creative_explorer': {
    level: 'Growing Together',
    realityCheck: {
      honeymoonPhase: 'You appreciate their imaginative responses to reading, and they enjoy when you help them express their ideas more effectively.',
      whereTensionArises: 'Your systematic approach might feel constraining to their free-flowing creative process.',
      theClash: 'You: "Let\'s work on summarizing the main idea." Them: "But I want to rewrite the ending with dragons!"',
      howToNavigate: 'Embed skill work within creative projects. They\'ll develop skills naturally when working toward creative goals.',
      growthOpportunity: 'This pairing teaches you that creativity and skills aren\'t opposites, while they learn that skills give them tools for better creative expression.'
    },
    specificStrategies: [
      'Use creative writing as a context for building writing and reading skills',
      'Teach story structure through their own creative projects',
      'Build vocabulary through describing their imaginative ideas',
      'Celebrate both the creativity and the skills demonstrated in their work'
    ]
  },
  'freedom_reader': {
    level: 'Growing Together',
    realityCheck: {
      honeymoonPhase: 'Initially, they appreciate when your skill support helps them read what they want more easily.',
      whereTensionArises: 'Your structured approach to skill-building can feel like control to a child who values reading autonomy above all.',
      theClash: 'You: "Let\'s practice these strategies with this book." Them: "I don\'t want to practice, I just want to read what I want!"',
      howToNavigate: 'Offer skill support as optional tools they can choose to use. Frame skills as increasing their freedom to read anything.',
      growthOpportunity: 'This pairing teaches you to respect autonomy within skill development, while they learn that skills actually increase their reading freedom.'
    },
    specificStrategies: [
      'Present skills as "tools for your reading toolkit" they can choose to use',
      'Let them pick which books to use for skill practice',
      'Focus on how skills give them access to more book choices',
      'Celebrate when they independently choose to use a strategy you\'ve taught'
    ]
  },
  'reflective_thinker': {
    level: 'Good Match',
    realityCheck: {
      honeymoonPhase: 'You both value depth and thoughtfulness, and they appreciate skills that help them understand books more deeply.',
      whereTensionArises: 'Your focus on measurable skills might miss the value of their processing time and internal reflection.',
      theClash: 'You: "Show me how you used that comprehension strategy." Them: "I\'m still thinking about what the book means to me."',
      howToNavigate: 'Give them time to reflect before asking them to demonstrate skills. Use their insights as evidence of deep comprehension.',
      growthOpportunity: 'This pairing teaches you that reflection is a skill in itself, while they learn that analytical tools can deepen their thinking.'
    },
    specificStrategies: [
      'Teach analytical skills that support deeper reflection',
      'Use reading journals to capture both skills and insights',
      'Allow processing time between reading and skill demonstration',
      'Celebrate thoughtful responses as much as technical skills'
    ]
  }
},

'connection_creator': {
  'social_connector': {
    level: 'Excellent Match',
    realityCheck: {
      honeymoonPhase: 'Pure harmony - you both see reading as inherently social and love sharing book experiences together.',
      whereTensionArises: 'Rarely! But sometimes your combined enthusiasm might overwhelm others or leave little room for quiet, individual reading.',
      theClash: 'You: "Let\'s discuss every chapter!" Them: "Yes! And tell everyone we know about it!"',
      howToNavigate: 'Channel your shared social energy productively while also respecting that some reading moments can be private.',
      growthOpportunity: 'This pairing can model joyful reading community for others while learning that connection can include quiet companionship too.'
    },
    specificStrategies: [
      'Create family book clubs and reading celebrations together',
      'Take turns being the discussion leader for different books',
      'Balance social reading time with quiet reading-together time',
      'Use your combined enthusiasm to create reading community for others'
    ]
  },
  'challenge_seeker': {
    level: 'Growing Together',
    realityCheck: {
      honeymoonPhase: 'You love celebrating their reading victories together, and they enjoy having someone to share their conquests with.',
      whereTensionArises: 'Your desire for shared reading might conflict with their need to independently conquer difficult books.',
      theClash: 'You: "Let\'s read this challenging book together!" Them: "No, I need to do it myself to feel proud."',
      howToNavigate: 'Celebrate their independent achievements while finding other ways to connect around their reading journey.',
      growthOpportunity: 'This pairing teaches you that supporting someone\'s challenge doesn\'t always mean doing it together, while they learn that sharing victories enhances joy.'
    },
    specificStrategies: [
      'Be their cheerleader without taking over their challenge',
      'Create celebration rituals for when they finish difficult books',
      'Ask them to teach you about the hard books they\'ve conquered',
      'Find different books to read in parallel rather than the same book together'
    ]
  },
  'curious_investigator': {
    level: 'Good Match',
    realityCheck: {
      honeymoonPhase: 'You love their enthusiasm for sharing facts, and they enjoy having an interested audience for their discoveries.',
      whereTensionArises: 'Your focus on emotional connection might not match their more factual, information-focused approach to books.',
      theClash: 'You: "How did that book make you feel?" Them: "I don\'t know, but did you know that octopuses have three hearts?"',
      howToNavigate: 'Connect through their interests. Show genuine curiosity about their facts and findings as a form of emotional connection.',
      growthOpportunity: 'This pairing teaches you that sharing knowledge is a form of connection, while they learn that facts can spark meaningful conversations.'
    },
    specificStrategies: [
      'Show genuine interest in the facts and information they discover',
      'Create "teaching moments" where they share their expertise with family',
      'Connect their factual interests to family experiences or trips',
      'Use their knowledge as conversation starters at family gatherings'
    ]
  },
  'creative_explorer': {
    level: 'Strong Match',
    realityCheck: {
      honeymoonPhase: 'You love experiencing their creative responses to books, and they enjoy having an appreciative audience.',
      whereTensionArises: 'Your desire for verbal sharing might not match their preference for expressing ideas through art or imagination.',
      theClash: 'You: "Tell me about your book!" Them: "I can\'t explain it, but I made this..."',
      howToNavigate: 'Learn to "read" their creative expressions as a form of sharing. Engage with their art as enthusiastically as with words.',
      growthOpportunity: 'This pairing teaches you that connection happens through many languages, while they learn their creativity builds relationships.'
    },
    specificStrategies: [
      'Participate in their creative responses - draw, build, or act out stories together',
      'Display their book-inspired creations prominently as conversation starters',
      'Share your emotional responses to their creative work',
      'Create collaborative art projects based on shared reading'
    ]
  },
  'freedom_reader': {
    level: 'Growing Together',
    realityCheck: {
      honeymoonPhase: 'Initially, they enjoy choosing when and how to share their reading with you.',
      whereTensionArises: 'Your desire for constant connection around books might feel intrusive to their need for reading independence.',
      theClash: 'You: "What are you reading? Can we talk about it?" Them: "I just want to read by myself right now."',
      howToNavigate: 'Create optional connection opportunities. Show them that respecting their independence is a form of love and connection.',
      growthOpportunity: 'This pairing teaches you that honoring independence strengthens relationships, while they learn that chosen connection is meaningful.'
    },
    specificStrategies: [
      'Create "open door" policies - "I\'m here if you want to talk about your book"',
      'Share your own reading without expecting reciprocation',
      'Celebrate their independent reading as a success, not a rejection',
      'Find non-intrusive ways to show interest, like providing bookmarks or treats'
    ]
  },
  'reflective_thinker': {
    level: 'Good Match',
    realityCheck: {
      honeymoonPhase: 'You both value meaningful connection, and they appreciate having someone to process deep thoughts with.',
      whereTensionArises: 'Your immediate desire to connect might rush their need for processing time before sharing.',
      theClash: 'You: "I can\'t wait to hear your thoughts!" Them: "I\'m not ready to talk about it yet."',
      howToNavigate: 'Honor their reflection time as part of the connection process. Deep sharing requires time to develop thoughts.',
      growthOpportunity: 'This pairing teaches you that the best connections can\'t be rushed, while they learn that sharing deepens understanding.'
    },
    specificStrategies: [
      'Create rituals that allow for processing time - weekly book talks rather than daily',
      'Use written exchanges (notes, journals) for those still-forming thoughts',
      'Share your own reading reflections to model and invite reciprocal sharing',
      'Celebrate the depth of eventual sharing rather than the immediacy'
    ]
  }
},

'meaning_maker': {
  'social_connector': {
    level: 'Good Match',
    realityCheck: {
      honeymoonPhase: 'You appreciate their desire to share meaningful insights, and they enjoy discussing important themes with others.',
      whereTensionArises: 'Your focus on deep meaning might overshadow their simpler desire for social connection and fun.',
      theClash: 'You: "What does this story teach us about human nature?" Them: "I just want to talk about how funny the character is!"',
      howToNavigate: 'Start with their social observations and gently guide toward deeper themes when they\'re ready.',
      growthOpportunity: 'This pairing teaches you that meaning can emerge through light social exchange, while they learn that sharing can include deeper insights.'
    },
    specificStrategies: [
      'Use their social discussions as springboards for deeper exploration',
      'Ask "What did you and your friend think about..." to combine social and meaning',
      'Find books with both entertaining social elements and deeper themes',
      'Model finding meaning in everyday social interactions'
    ]
  },
  'challenge_seeker': {
    level: 'Strong Match',
    realityCheck: {
      honeymoonPhase: 'You appreciate their willingness to tackle books with complex themes, and they enjoy the intellectual challenge you provide.',
      whereTensionArises: 'They might focus on conquering the book while missing the deeper meanings you find important.',
      theClash: 'You: "What did you discover about yourself?" Them: "I discovered I can read a 300-page book!"',
      howToNavigate: 'Celebrate their achievement first, then explore meaning. Use their pride as an entry point for deeper discussion.',
      growthOpportunity: 'This pairing teaches you to honor concrete achievements while they learn that the biggest challenges are often internal.'
    },
    specificStrategies: [
      'Choose challenging books that also have rich thematic content',
      'Frame meaning-making as another type of challenge to conquer',
      'Ask "What was the hardest part to understand?" to bridge challenge and meaning',
      'Celebrate both finishing difficult books AND understanding difficult ideas'
    ]
  },
  'curious_investigator': {
    level: 'Strong Match',
    realityCheck: {
      honeymoonPhase: 'You both love going deep, you with meaning and them with facts, creating rich conversations.',
      whereTensionArises: 'Your philosophical approach might frustrate their desire for concrete, factual information.',
      theClash: 'You: "What does this tell us about life?" Them: "It tells us that sharks have electroreceptors!"',
      howToNavigate: 'Bridge facts and meaning by exploring why things matter, not just what they are.',
      growthOpportunity: 'This pairing teaches you that facts can lead to meaning, while they learn that information gains power through interpretation.'
    },
    specificStrategies: [
      'Ask "Why do you think that\'s important?" about their facts',
      'Connect their factual interests to bigger life questions',
      'Use their research skills to explore philosophical questions together',
      'Find books that blend factual information with deeper themes'
    ]
  },
  'creative_explorer': {
    level: 'Excellent Match',
    realityCheck: {
      honeymoonPhase: 'You love how their creativity expresses deep themes, and they appreciate your recognition of meaning in their art.',
      whereTensionArises: 'Sometimes you might over-interpret their creative work when they just wanted to make something beautiful.',
      theClash: 'You: "Your painting really captures the theme of loss in the story." Them: "I just liked the colors."',
      howToNavigate: 'Let their creative work speak for itself first. Ask what it means to them rather than imposing interpretation.',
      growthOpportunity: 'This pairing teaches you that meaning can be felt rather than analyzed, while they learn their creativity carries inherent significance.'
    },
    specificStrategies: [
      'Ask open-ended questions about their creative work',
      'Share how their art makes you feel rather than what it means',
      'Create alongside them to understand their process',
      'Find books that inspire both creative expression and meaningful reflection'
    ]
  },
  'freedom_reader': {
    level: 'Growing Together',
    realityCheck: {
      honeymoonPhase: 'You respect their independent discoveries, and they occasionally surprise you with profound insights.',
      whereTensionArises: 'Your desire to discuss meaning might feel like pressure to a child who just wants to read freely.',
      theClash: 'You: "Let\'s explore what this means for your life." Them: "Can\'t I just enjoy the story?"',
      howToNavigate: 'Plant seeds of meaning without requiring harvest. Trust that they\'re absorbing more than they express.',
      growthOpportunity: 'This pairing teaches you that meaning can\'t be forced, while they learn that freedom includes the freedom to go deep.'
    },
    specificStrategies: [
      'Share your own insights without expecting response',
      'Leave thoughtful questions in bookmarks for them to find',
      'Celebrate when they voluntarily share meaningful observations',
      'Provide books with layers - entertaining on surface, meaningful underneath'
    ]
  },
  'reflective_thinker': {
    level: 'Excellent Match',
    realityCheck: {
      honeymoonPhase: 'Perfect alignment - you both naturally seek deeper significance and enjoy exploring life\'s big questions together.',
      whereTensionArises: 'Sometimes your combined intensity might make reading feel heavy when lightness is needed.',
      theClash: 'You: "This connects to everything we\'ve been discussing." Them: "Sometimes I just need a funny book."',
      howToNavigate: 'Balance meaningful exploration with lighter reading. Remember that joy and humor have their own wisdom.',
      growthOpportunity: 'This pairing creates profound connections while learning that meaning includes the full spectrum of human experience.'
    },
    specificStrategies: [
      'Create regular "deep dive" discussions with clear boundaries',
      'Balance meaningful books with purely enjoyable ones',
      'Keep shared journals for ongoing philosophical conversations',
      'Model finding meaning in light moments too'
    ]
  }
},

'growth_facilitator': {
  'social_connector': {
    level: 'Good Match',
    realityCheck: {
      honeymoonPhase: 'You patiently support their social reading development, and they appreciate your gentle encouragement.',
      whereTensionArises: 'Your measured pace might frustrate their immediate desire to share and connect with others.',
      theClash: 'You: "Take your time developing those thoughts." Them: "But I want to tell everyone about it NOW!"',
      howToNavigate: 'Honor their social urgency while providing scaffolding for deeper sharing over time.',
      growthOpportunity: 'This pairing teaches you that social motivation can accelerate growth, while they learn patience enhances connection quality.'
    },
    specificStrategies: [
      'Create "quick share" opportunities alongside deeper discussion times',
      'Use their social motivation to set growth goals together',
      'Document their developing ability to share ideas with others',
      'Celebrate both immediate enthusiasm and growing articulation skills'
    ]
  },
  'challenge_seeker': {
    level: 'Growing Together',
    realityCheck: {
      honeymoonPhase: 'You appreciate their drive, and they initially benefit from your careful scaffolding approach.',
      whereTensionArises: 'Your cautious pacing might frustrate their desire to leap into the biggest challenges immediately.',
      theClash: 'You: "Let\'s build up to that gradually." Them: "I\'m ready for the hardest level NOW!"',
      howToNavigate: 'Trust their self-assessment more. Sometimes they\'re ready for bigger leaps than your careful approach suggests.',
      growthOpportunity: 'This pairing teaches you that growth can happen in leaps, not just steps, while they learn that foundations enable higher achievements.'
    },
    specificStrategies: [
      'Negotiate challenge levels together - find middle ground',
      'Provide scaffolding for ambitious attempts rather than limiting choices',
      'Document their growth trajectory to show how far they can leap',
      'Celebrate both the attempt and the growth, regardless of outcome'
    ]
  },
  'curious_investigator': {
    level: 'Excellent Match',
    realityCheck: {
      honeymoonPhase: 'Your patient support perfectly matches their methodical approach to building knowledge.',
      whereTensionArises: 'Sometimes your general developmental approach might not align with their specific interest timelines.',
      theClash: 'You: "Let\'s work on general reading skills." Them: "But I need to know everything about space RIGHT NOW!"',
      howToNavigate: 'Use their specific interests as the vehicle for general skill development.',
      growthOpportunity: 'This pairing teaches you that passion-driven timelines can exceed developmental expectations, while they learn patience in building expertise.'
    },
    specificStrategies: [
      'Create learning progressions within their interest areas',
      'Show how foundational skills unlock advanced knowledge',
      'Document their growing expertise alongside reading development',
      'Provide increasingly complex resources as they develop'
    ]
  },
  'creative_explorer': {
    level: 'Strong Match',
    realityCheck: {
      honeymoonPhase: 'You provide space for their creativity to develop naturally, and they flourish with your patient support.',
      whereTensionArises: 'Your systematic approach might not match their non-linear creative process.',
      theClash: 'You: "Let\'s develop these skills in order." Them: "But inspiration doesn\'t follow order!"',
      howToNavigate: 'Support their creative journey while providing structure when they seek it.',
      growthOpportunity: 'This pairing teaches you that growth can be spiral rather than linear, while they learn that skills support creative expression.'
    },
    specificStrategies: [
      'Document creative growth through portfolios rather than linear progressions',
      'Provide materials and opportunities without prescribed outcomes',
      'Celebrate creative development as valid growth',
      'Support skill development within creative projects'
    ]
  },
  'freedom_reader': {
    level: 'Excellent Match',
    realityCheck: {
      honeymoonPhase: 'Your patient approach perfectly respects their need for autonomy while providing gentle support.',
      whereTensionArises: 'Rarely! But sometimes they might want more challenge than your careful approach suggests.',
      theClash: 'You: "There\'s no rush." Them: "But I\'m ready to move faster!"',
      howToNavigate: 'Stay attuned to their cues for readiness rather than relying solely on developmental markers.',
      growthOpportunity: 'This pairing models how support and freedom can coexist beautifully.'
    },
    specificStrategies: [
      'Provide resources and let them set their own pace',
      'Offer support when asked rather than preemptively',
      'Document their self-directed growth journey',
      'Celebrate their ownership of their reading development'
    ]
  },
  'reflective_thinker': {
    level: 'Excellent Match',
    realityCheck: {
      honeymoonPhase: 'Your patience perfectly matches their need for processing time, creating ideal conditions for deep growth.',
      whereTensionArises: 'Sometimes your combined thoughtfulness might mean missing opportunities for spontaneous discovery.',
      theClash: 'You: "Take time to process." Them: "I\'m still thinking about the book from last month."',
      howToNavigate: 'Balance reflection time with gentle encouragement to engage with new material.',
      growthOpportunity: 'This pairing creates space for profound development while learning that growth includes both reflection and action.'
    },
    specificStrategies: [
      'Create extended timelines that honor deep processing',
      'Use journals or portfolios to capture evolving thoughts',
      'Celebrate depth of insight alongside pace of progress',
      'Model how reflection leads to meaningful growth'
    ]
  }
},

'authentic_modeler': {
  'social_connector': {
    level: 'Strong Match',
    realityCheck: {
      honeymoonPhase: 'They love seeing your genuine reading enthusiasm and naturally want to share the experience with you.',
      whereTensionArises: 'Your independent reading style might disappoint their desire for constant interaction.',
      theClash: 'You: "I\'m just going to read quietly." Them: "But I want to read WITH you and talk about it!"',
      howToNavigate: 'Model how readers can be together - sometimes sharing, sometimes reading side by side in comfortable silence.',
      growthOpportunity: 'This pairing teaches you that modeling can include social reading, while they learn that readers also need quiet time.'
    },
    specificStrategies: [
      'Create "reading together" time where you both read your own books in the same space',
      'Share exciting moments from your reading when they naturally occur',
      'Model how you talk about books with other adults',
      'Show them how readers build community while respecting individual reading time'
    ]
  },
  'challenge_seeker': {
    level: 'Good Match',
    realityCheck: {
      honeymoonPhase: 'They\'re inspired by seeing you tackle challenging books and want to emulate your reading ambition.',
      whereTensionArises: 'They might attempt books beyond their level to match what they see you reading.',
      theClash: 'You: "I\'m reading this complex novel." Them: "I want to read that too!" (It\'s way too hard)',
      howToNavigate: 'Also model reading variety - show them that you read at different levels for different purposes.',
      growthOpportunity: 'This pairing teaches you to be mindful of modeling appropriately, while they learn that challenge is relative to development.'
    },
    specificStrategies: [
      'Let them see you reading various difficulty levels',
      'Share when books challenge you and how you handle it',
      'Model persistence with difficult texts',
      'Show that even adult readers sometimes don\'t finish books'
    ]
  },
  'curious_investigator': {
    level: 'Strong Match',
    realityCheck: {
      honeymoonPhase: 'They love seeing how you use reading to learn, and you appreciate their genuine knowledge-seeking.',
      whereTensionArises: 'Your broader reading interests might not match their focused, deep-dive approach.',
      theClash: 'You: "I\'m reading this novel." Them: "Why aren\'t you reading to learn something?"',
      howToNavigate: 'Model how fiction and non-fiction both offer learning opportunities in different ways.',
      growthOpportunity: 'This pairing teaches you to articulate what different types of reading offer, while they learn that knowledge comes in many forms.'
    },
    specificStrategies: [
      'Share interesting facts from all types of reading',
      'Model research processes when you need to learn something',
      'Show how you choose books based on what you want to learn',
      'Demonstrate that novels teach us about human nature'
    ]
  },
  'creative_explorer': {
    level: 'Good Match',
    realityCheck: {
      honeymoonPhase: 'They\'re inspired by your reading life and express this through creative responses to their own books.',
      whereTensionArises: 'Your quiet reading model might not show them how to channel their creative responses.',
      theClash: 'You: "I love getting lost in a book." Them: "But what do you DO with the ideas?"',
      howToNavigate: 'Share more of your internal response to reading - the thoughts, images, and connections you make.',
      growthOpportunity: 'This pairing teaches you that modeling includes sharing internal processes, while they learn that creativity can be quiet too.'
    },
    specificStrategies: [
      'Share the images and ideas books create in your mind',
      'Show any creative responses you have - even just doodling while reading',
      'Model how reading influences your other creative pursuits',
      'Demonstrate that readers respond in many different ways'
    ]
  },
  'freedom_reader': {
    level: 'Excellent Match',
    realityCheck: {
      honeymoonPhase: 'Perfect harmony - they see you choosing your own reading freely and feel validated in their independence.',
      whereTensionArises: 'Rarely! But sometimes two independent readers might miss opportunities for connection.',
      theClash: 'You: "Reading my book." Them: "Reading my book." (No interaction)',
      howToNavigate: 'Model how independent readers can still share space and occasional enthusiasm.',
      growthOpportunity: 'This pairing validates independent reading while showing that freedom includes the freedom to connect.'
    },
    specificStrategies: [
      'Read in shared spaces to model reading as part of daily life',
      'Occasionally share spontaneous reactions to your reading',
      'Show how you choose books based on mood and interest',
      'Model respecting others\' reading choices and privacy'
    ]
  },
  'reflective_thinker': {
    level: 'Strong Match',
    realityCheck: {
      honeymoonPhase: 'They observe your thoughtful reading approach and feel validated in taking time to process.',
      whereTensionArises: 'Your model might be too internal - they can\'t see your thinking process.',
      theClash: 'You: "Lost in thought about my book." Them: "What are you thinking about?"',
      howToNavigate: 'Make your internal processing more visible through occasional thinking aloud.',
      growthOpportunity: 'This pairing teaches you that modeling includes sharing cognitive processes, while they learn that deep thinking is valued.'
    },
    specificStrategies: [
      'Occasionally think aloud about what you\'re reading',
      'Share connections you make between books and life',
      'Model using journals or notes to capture thoughts',
      'Show that taking time to think about books is normal and valuable'
    ]
  }
}
};

// PARENT GUIDANCE FOR CHILD TYPES (from dnaTypes.js)
export const PARENT_GUIDANCE_CONTENT = {
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
};

// SHARED UTILITIES (resolves formatDNACode duplicate)
export const SHARED_UTILS = {
  formatDNACode: (readingDNA) => {
    if (!readingDNA || !readingDNA.type) return 'Unknown'
    
    // Convert type to initials (e.g., curious_investigator -> CI)
    const typeInitials = readingDNA.type
      .split('_')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
    
    // Format modifiers (keep uppercase)
    const modifiers = readingDNA.modifiers || []
    const modifierString = modifiers.length > 0 ? `-${modifiers.join('')}` : ''
    
    return `${typeInitials}${modifierString}`
  },

  calculateParentDNAType: (responses) => {
    const traitCounts = {}
    
    // Count trait occurrences with weighted scoring
    Object.entries(responses).forEach(([questionId, answerId]) => {
      const question = PARENT_DNA_QUESTIONS.find(q => q.id === questionId)
      const answer = question?.options.find(opt => opt.id === answerId)
      
      if (answer?.traits) {
        answer.traits.forEach(trait => {
          traitCounts[trait] = (traitCounts[trait] || 0) + 1
        })
      }
    })

    // Map traits to DNA types and find best match
    const typeScores = {}
    
    Object.entries(INTEGRATED_PARENT_DNA_TYPES).forEach(([typeId, typeData]) => {
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
      details: INTEGRATED_PARENT_DNA_TYPES[bestType],
      traitCounts,
      allScores: typeScores
    }
  }
};

// CONFIGURATION
export const PARENT_DNA_CONFIG = {
  version: "1.0.0",
  academic_year: "2025-26",
  status: "active",
  assessment_type: "parent_psychology_comprehensive",
  total_questions: PARENT_DNA_QUESTIONS.length,
  total_parent_types: Object.keys(INTEGRATED_PARENT_DNA_TYPES).length,
  estimated_time_minutes: 8,
  research_based: true,
  requires_unlock: false,
  created_date: "2025-01-01",
  last_updated: "2025-01-01",
  languages_supported: ["en"],
  privacy_compliant: true,
  educational_use_approved: true,
  integration_complete: true,
  includes_psychology: true,
  includes_toolkit: true
};