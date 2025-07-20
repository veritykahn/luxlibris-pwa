// book-quizzes-manager.js - CLEAN: Simple IDs with Academic Year
import { db } from './lib/firebase'
import { collection, doc, setDoc, getDocs, query, where, deleteDoc, getDoc } from 'firebase/firestore'

// CURRENT ACADEMIC YEAR CONSTANT
const CURRENT_ACADEMIC_YEAR = "2025-26"

// BOOK QUIZZES DATA FOR CURRENT YEAR - Simple IDs that match masterNominees book IDs
const CURRENT_YEAR_BOOK_QUIZZES = [
   {
    "book_id": "020",
    "questions": [
      {
        "question": "What is the Silver Sword in the story?",
        "options": [
          "A treasure chest",
          "A folded piece of paper",
          "A real silver blade",
          "A key to a safe"
        ],
        "answer": "A folded piece of paper"
      },
      {
        "question": "Who first finds the Silver Sword?",
        "options": [
          "Jabek",
          "Ruth",
          "Edek",
          "Joseph"
        ],
        "answer": "Ruth"
      },
      {
        "question": "What is the Silver Sword's message?",
        "options": [
          "Run away fast",
          "The war is over",
          "Keep smiling",
          "Poland is free again"
        ],
        "answer": "Keep smiling"
      },
      {
        "question": "Where do the children live at the beginning of the story?",
        "options": [
          "Warsaw",
          "Geneva",
          "London",
          "Berlin"
        ],
        "answer": "Warsaw"
      },
      {
        "question": "How do the children meet Jan's father, Joseph?",
        "options": [
          "At a train station",
          "In a bombed building",
          "In a refugee camp",
          "During Christmas"
        ],
        "answer": "In a refugee camp"
      },
      {
        "question": "What disguise helps Ruth and Edek get past soldiers?",
        "options": [
          "Pretending to be twins",
          "Pretending to be orphans",
          "Riding in an ambulance",
          "Wearing festive clothes"
        ],
        "answer": "Pretending to be orphans"
      },
      {
        "question": "Which child is known for being the most sensible?",
        "options": [
          "Ruth",
          "Jan",
          "Edek",
          "Bronia"
        ],
        "answer": "Ruth"
      },
      {
        "question": "What challenges the children during their journey?",
        "options": [
          "Wild animals",
          "Running out of food",
          "Finding a map",
          "Misplacing the Silver Sword"
        ],
        "answer": "Running out of food"
      },
      {
        "question": "Who helps the children cross a river?",
        "options": [
          "A fisherman",
          "A nurse",
          "A British soldier",
          "A priest"
        ],
        "answer": "A British soldier"
      },
      {
        "question": "Why do the children travel to Switzerland?",
        "options": [
          "To find food",
          "To escape the war",
          "To meet Joseph",
          "To sell the Silver Sword"
        ],
        "answer": "To meet Joseph"
      },
      {
        "question": "What does Joseph do for a living?",
        "options": [
          "Banker",
          "Tailor",
          "Teacher",
          "Policeman"
        ],
        "answer": "Teacher"
      },
      {
        "question": "Which sibling is the youngest?",
        "options": [
          "Edek",
          "Ruth",
          "Jan",
          "Bronia"
        ],
        "answer": "Bronia"
      },
      {
        "question": "What is a major theme of the story?",
        "options": [
          "Friendship overcomes fear",
          "Money solves problems",
          "Science wins wars",
          "Lying is sometimes okay"
        ],
        "answer": "Friendship overcomes fear"
      },
      {
        "question": "What keeps the children hopeful throughout the war?",
        "options": [
          "The Silver Sword",
          "Their childhood games",
          "Letters from home",
          "Memories of school"
        ],
        "answer": "The Silver Sword"
      },
      {
        "question": "How do the children finally reach their father?",
        "options": [
          "By plane",
          "On foot and train",
          "By ship",
          "By car"
        ],
        "answer": "On foot and train"
      },
      {
        "question": "Who accompanies the children most of the way?",
        "options": [
          "A stray dog",
          "A volunteer guide",
          "A helpful stranger",
          "Joseph's friend"
        ],
        "answer": "A helpful stranger"
      },
      {
        "question": "Which city do they pass through on their journey?",
        "options": [
          "Paris",
          "Rome",
          "Lisbon",
          "Madrid"
        ],
        "answer": "Rome"
      },
      {
        "question": "What does the Silver Sword symbolize?",
        "options": [
          "Wealth",
          "Freedom and hope",
          "Power",
          "Knowledge"
        ],
        "answer": "Freedom and hope"
      },
      {
        "question": "Which obstacle nearly stops them from reaching Switzerland?",
        "options": [
          "Snowstorm",
          "A locked fortress",
          "A flooded bridge",
          "A landslide"
        ],
        "answer": "A flooded bridge"
      },
      {
        "question": "What emotion do the children feel when reuniting with their father?",
        "options": [
          "Fear",
          "Relief and joy",
          "Confusion",
          "Anger"
        ],
        "answer": "Relief and joy"
      }
    ]
  },
  {
    "book_id": "017",
    "questions": [
      {
        "question": "What unusual method does the Surinam toad use to give birth?",
        "options": [
          "Lays eggs in water",
          "Gives live birth like mammals",
          "Bursts babies out of her back",
          "Buries eggs in the mud"
        ],
        "answer": "Bursts babies out of her back"
      },
      {
        "question": "What do flamingos do to cool down?",
        "options": [
          "Fan themselves with wings",
          "Poop on their legs",
          "Hide in the shade",
          "Dive into water"
        ],
        "answer": "Poop on their legs"
      },
      {
        "question": "How do herring fish 'talk' to each other?",
        "options": [
          "By flashing scales",
          "By farting",
          "By slapping tails",
          "By glowing"
        ],
        "answer": "By farting"
      },
      {
        "question": "How do bees make honey?",
        "options": [
          "They squeeze it from flowers",
          "They cry it out",
          "They vomit it up over and over",
          "They burp it"
        ],
        "answer": "They vomit it up over and over"
      },
      {
        "question": "What do glowworms use to catch prey?",
        "options": [
          "Poison",
          "Sticky glowing spit strings",
          "Sharp teeth",
          "Loud squeaks"
        ],
        "answer": "Sticky glowing spit strings"
      },
      {
        "question": "What does a rain frog do when covered in biting insects?",
        "options": [
          "Screams loudly",
          "Hides under a leaf",
          "Sheds its skin and eats it",
          "Runs away"
        ],
        "answer": "Sheds its skin and eats it"
      },
      {
        "question": "What is a mushroom really part of?",
        "options": [
          "A tree root",
          "A single fungus organism underground",
          "A plant colony",
          "A moldy rock"
        ],
        "answer": "A single fungus organism underground"
      },
      {
        "question": "What happens to a caterpillar inside its chrysalis?",
        "options": [
          "It falls asleep",
          "It grows wings",
          "It turns into goo",
          "It shrinks"
        ],
        "answer": "It turns into goo"
      },
      {
        "question": "Why is a sloth's fur green?",
        "options": [
          "It has mold",
          "It grows algae",
          "It rolls in grass",
          "It sweats green liquid"
        ],
        "answer": "It grows algae"
      },
      {
        "question": "What lives inside a sloth's fur?",
        "options": [
          "Nothing",
          "More sloths",
          "Moths and bugs",
          "Worms"
        ],
        "answer": "Moths and bugs"
      },
      {
        "question": "What kind of animal helps clean wounds by eating dead flesh?",
        "options": [
          "Earthworms",
          "Leeches",
          "Maggots",
          "Ants"
        ],
        "answer": "Maggots"
      },
      {
        "question": "What creature eats whales from the inside out?",
        "options": [
          "Sharks",
          "Crabs",
          "Hagfish",
          "Vultures"
        ],
        "answer": "Hagfish"
      },
      {
        "question": "What do hagfish excrete when threatened?",
        "options": [
          "Acid",
          "Ink",
          "Slime",
          "Fire"
        ],
        "answer": "Slime"
      },
      {
        "question": "Why do baby koalas eat their mom's poop?",
        "options": [
          "They're bored",
          "To build bacteria in their guts",
          "To get closer to her",
          "For hydration"
        ],
        "answer": "To build bacteria in their guts"
      },
      {
        "question": "What's one thing all mammals (including whales) do when digesting food?",
        "options": [
          "Burp bubbles",
          "Explode",
          "Sneeze",
          "Fart"
        ],
        "answer": "Fart"
      },
      {
        "question": "How big can a blue whale fart bubble be?",
        "options": [
          "Size of a basketball",
          "Size of a car",
          "Size of a soccer ball",
          "Size of a grapefruit"
        ],
        "answer": "Size of a car"
      },
      {
        "question": "What does a lobster do to show aggression or attract mates?",
        "options": [
          "Roar",
          "Snap claws",
          "Pee from its face",
          "Dance"
        ],
        "answer": "Pee from its face"
      },
      {
        "question": "What do maggots eat in medical treatments?",
        "options": [
          "Healthy skin",
          "Bones",
          "Dead tissue",
          "Germs"
        ],
        "answer": "Dead tissue"
      },
      {
        "question": "What is the glowing substance glowworms use made of?",
        "options": [
          "Fire",
          "Snot",
          "Crystal",
          "Oil"
        ],
        "answer": "Snot"
      },
      {
        "question": "What type of poem did the book suggest writing about gross nature facts?",
        "options": [
          "Sonnet",
          "Limerick",
          "Haiku",
          "Ode"
        ],
        "answer": "Haiku"
      }
    ]
  },
  {
    "book_id": "016",
    "questions": [
      {
        "question": "What is a volcano?",
        "options": [
          "A mountain that never changes",
          "A vent in Earth's crust that releases lava, steam, ash, and rocks",
          "A type of earthquake",
          "A deep hole in the ground"
        ],
        "answer": "A vent in Earth's crust that releases lava, steam, ash, and rocks"
      },
      {
        "question": "According to the book, how many volcanoes could be erupting right now?",
        "options": [
          "About 5",
          "About 10",
          "At least 20",
          "Over 100"
        ],
        "answer": "At least 20"
      },
      {
        "question": "What is the temperature range that glowing red lava can reach?",
        "options": [
          "More than 500 degrees Fahrenheit",
          "More than 1,000 degrees Fahrenheit",
          "More than 2,000 degrees Fahrenheit",
          "More than 3,000 degrees Fahrenheit"
        ],
        "answer": "More than 2,000 degrees Fahrenheit"
      },
      {
        "question": "What is the Hawaiian name for gently flowing lava?",
        "options": [
          "Kilauea",
          "Pahoehoe",
          "Mauna Loa",
          "Haleakala"
        ],
        "answer": "Pahoehoe"
      },
      {
        "question": "What are scientists who study volcanoes called?",
        "options": [
          "Geologists",
          "Seismologists",
          "Volcanologists",
          "Meteorologists"
        ],
        "answer": "Volcanologists"
      },
      {
        "question": "What is the Ring of Fire?",
        "options": [
          "A circle of active volcanoes around the Pacific Ocean",
          "A type of volcanic eruption",
          "The hottest part of a volcano",
          "A famous volcano in Hawaii"
        ],
        "answer": "A circle of active volcanoes around the Pacific Ocean"
      },
      {
        "question": "How many spots of volcanic activity are found around the Ring of Fire?",
        "options": [
          "352",
          "452",
          "552",
          "652"
        ],
        "answer": "452"
      },
      {
        "question": "What caused the loudest sound in recorded human history?",
        "options": [
          "Mount Vesuvius erupting",
          "Krakatoa erupting in 1883",
          "Mount St. Helens erupting",
          "An earthquake in Japan"
        ],
        "answer": "Krakatoa erupting in 1883"
      },
      {
        "question": "How high were the tsunamis created by the Krakatoa eruption?",
        "options": [
          "Over 50 feet high",
          "Over 75 feet high",
          "Over 100 feet high",
          "Over 120 feet high"
        ],
        "answer": "Over 120 feet high"
      },
      {
        "question": "What makes underwater volcanoes special according to the book?",
        "options": [
          "They are always dangerous",
          "They create new islands over time",
          "They allow unique communities of life to exist in the ocean depths",
          "They are the largest volcanoes on Earth"
        ],
        "answer": "They allow unique communities of life to exist in the ocean depths"
      },
      {
        "question": "What was special about the Hunga Tonga-Hunga Ha'apai eruption in 2022?",
        "options": [
          "It was the smallest eruption ever recorded",
          "It created the biggest tsunami in history",
          "The ash cloud stretched 36 miles high - five times higher than planes fly",
          "It lasted for three months"
        ],
        "answer": "The ash cloud stretched 36 miles high - five times higher than planes fly"
      },
      {
        "question": "What are the two basic types of volcanoes mentioned in the book?",
        "options": [
          "Big and small",
          "Active and inactive",
          "Red and gray",
          "Hot and cold"
        ],
        "answer": "Red and gray"
      },
      {
        "question": "Which type of volcano is actually MORE dangerous?",
        "options": [
          "Red volcanoes",
          "Gray volcanoes",
          "Underwater volcanoes",
          "Small volcanoes"
        ],
        "answer": "Gray volcanoes"
      },
      {
        "question": "What does VEI stand for?",
        "options": [
          "Very Explosive Index",
          "Volcanic Explosivity Index",
          "Volcanic Eruption Information",
          "Very Extreme Index"
        ],
        "answer": "Volcanic Explosivity Index"
      },
      {
        "question": "How many people died from the Mount Tambora eruption in 1815?",
        "options": [
          "1,000 people",
          "10,000 people",
          "100,000 people",
          "Over 1 million people"
        ],
        "answer": "Over 1 million people"
      },
      {
        "question": "What is the largest known volcano in our solar system?",
        "options": [
          "Mount Vesuvius",
          "Mauna Loa on Earth",
          "Olympus Mons on Mars",
          "Kilauea in Hawaii"
        ],
        "answer": "Olympus Mons on Mars"
      },
      {
        "question": "How much larger is Olympus Mons compared to Earth's largest active volcano?",
        "options": [
          "10 times larger",
          "50 times larger",
          "100 times larger",
          "500 times larger"
        ],
        "answer": "100 times larger"
      },
      {
        "question": "Approximately how many people live in areas that could be damaged by volcanic eruptions?",
        "options": [
          "More than 100 million",
          "More than 500 million",
          "More than 800 million",
          "More than 1 billion"
        ],
        "answer": "More than 800 million"
      },
      {
        "question": "Where does the word \"volcano\" come from?",
        "options": [
          "A Greek word meaning \"fire mountain\"",
          "A Latin word meaning \"exploding earth\"",
          "The name of the Roman god of fire, Vulcan",
          "An ancient word meaning \"dangerous mountain\""
        ],
        "answer": "The name of the Roman god of fire, Vulcan"
      },
      {
        "question": "What is one reason why many people choose to live near volcanoes?",
        "options": [
          "The weather is always perfect",
          "Volcanic ash creates nutrient-rich farmland",
          "Volcanoes provide free electricity",
          "The land is always cheap"
        ],
        "answer": "Volcanic ash creates nutrient-rich farmland"
      }
    ]
  },
  {
    "book_id": "014",
    "questions": [
      {
        "question": "Where was the main character born?",
        "options": [
          "New Delhi, India",
          "Mumbai, India",
          "A village near Mumbai, India",
          "Chennai, India"
        ],
        "answer": "A village near Mumbai, India"
      },
      {
        "question": "What caused the main character to lose the ability to walk?",
        "options": [
          "An accident",
          "A birth defect",
          "Polio",
          "A virus from a bug bite"
        ],
        "answer": "Polio"
      },
      {
        "question": "How old was she when she had surgeries to help her walk?",
        "options": [
          "2",
          "5",
          "8",
          "10"
        ],
        "answer": "5"
      },
      {
        "question": "What mobility aids did she use after her surgeries?",
        "options": [
          "Wheelchair only",
          "Braces and crutches",
          "Cane",
          "Prosthetic legs"
        ],
        "answer": "Braces and crutches"
      },
      {
        "question": "What challenge did she learn to conquer so she could ride the school bus?",
        "options": [
          "Running",
          "Stairs",
          "Lifting her wheelchair",
          "Riding a bike"
        ],
        "answer": "Stairs"
      },
      {
        "question": "What did she struggle to do after starting school?",
        "options": [
          "Read and write",
          "Speak English",
          "Do her chores",
          "Make friends"
        ],
        "answer": "Make friends"
      },
      {
        "question": "What club did she join in New York City that changed her life?",
        "options": [
          "Reading club",
          "Science club",
          "Running club",
          "Dance club"
        ],
        "answer": "Running club"
      },
      {
        "question": "What kind of racing equipment did she use in competitions?",
        "options": [
          "Track wheelchair and cane",
          "Racing wheelchair and handcycle",
          "Scooter and walker",
          "Rollerblades and crutches"
        ],
        "answer": "Racing wheelchair and handcycle"
      },
      {
        "question": "What was her biggest fear about the triathlon?",
        "options": [
          "The biking portion",
          "Being last",
          "Swimming in the ocean",
          "Losing her goggles"
        ],
        "answer": "Swimming in the ocean"
      },
      {
        "question": "What happened during her first big race?",
        "options": [
          "She lost a shoe",
          "She fell off her handcycle",
          "She lost her goggles",
          "She quit halfway"
        ],
        "answer": "She lost her goggles"
      },
      {
        "question": "What did her dad often say to encourage her?",
        "options": [
          "You're stronger than you think.",
          "Just keep going.",
          "You can do it, Minda.",
          "Never give up."
        ],
        "answer": "You can do it, Minda."
      },
      {
        "question": "Where did her adoptive parents live?",
        "options": [
          "New York City",
          "Seattle",
          "Spokane, Washington",
          "Los Angeles"
        ],
        "answer": "Spokane, Washington"
      },
      {
        "question": "What musical instrument did she learn to play?",
        "options": [
          "Violin",
          "Guitar",
          "Flute",
          "Piano"
        ],
        "answer": "Piano"
      },
      {
        "question": "Where did she intern during college?",
        "options": [
          "The Mayor's Office",
          "NASA",
          "The White House",
          "Google"
        ],
        "answer": "The White House"
      },
      {
        "question": "What helped her build strength and confidence before the triathlon?",
        "options": [
          "Swimming in the lake",
          "Running every day",
          "Weightlifting and sleeping well",
          "Climbing stairs"
        ],
        "answer": "Weightlifting and sleeping well"
      },
      {
        "question": "What international competition did she complete?",
        "options": [
          "The Paralympic Games",
          "The Ironman World Championship",
          "The Boston Marathon",
          "The World Wheelchair Games"
        ],
        "answer": "The Ironman World Championship"
      },
      {
        "question": "How did she feel before crossing the finish line at the championship?",
        "options": [
          "Nervous but calm",
          "Like she was going to fail",
          "Full of doubt",
          "Determined and proud"
        ],
        "answer": "Determined and proud"
      },
      {
        "question": "What phrase did she repeat while swimming?",
        "options": [
          "Don't stop now.",
          "One, two, three, breathe.",
          "You've got this.",
          "Keep going, keep going."
        ],
        "answer": "One, two, three, breathe."
      },
      {
        "question": "What did the announcer say when she finished?",
        "options": [
          "Congratulations, champ!",
          "Here comes Minda!",
          "Minda Dentler, you are an Ironman!",
          "Way to go, superstar!"
        ],
        "answer": "Minda Dentler, you are an Ironman!"
      },
      {
        "question": "What lesson does her story teach readers?",
        "options": [
          "Practice makes perfect",
          "You can achieve anything with effort and belief",
          "Stay in your comfort zone",
          "Winning is the most important goal"
        ],
        "answer": "You can achieve anything with effort and belief"
      }
    ]
  },
  {
    "book_id": "001",
    "questions": [
      {
        "question": "How does the train leave the garden?",
        "options": [
          "It crashes through the fence and destroys the neighbor's house",
          "It follows the tracks into the woods instead of crashing through the fence",
          "It flies over the fence and lands in the street",
          "It disappears in a puff of smoke and reappears in the forest"
        ],
        "answer": "It follows the tracks into the woods instead of crashing through the fence"
      },
      {
        "question": "How does the train communicate with Kate and Tom?",
        "options": [
          "It speaks through a loudspeaker system",
          "It whistles in a special code",
          "It prints a message",
          "It flashes its lights in patterns"
        ],
        "answer": "It prints a message"
      },
      {
        "question": "Which of these train cars do Kate and Tom NOT pick at the rail yard?",
        "options": [
          "A library car and swimming pool car",
          "A candy car and mystery car",
          "A circus car and theater car",
          "Kitchen cars and passenger cars"
        ],
        "answer": "A circus car and theater car"
      },
      {
        "question": "What destinations are printed on the animals' tickets?",
        "options": [
          "Paris, London, Rome, and Berlin",
          "Isle of Wight, Lower Silesian Wilderness, Sagano Bamboo Forest, and Howland Forest",
          "Grand Canyon, Yellowstone, Yosemite, and Glacier National Park",
          "Amazon Rainforest, Sahara Desert, Arctic Tundra, and Great Barrier Reef"
        ],
        "answer": "Isle of Wight, Lower Silesian Wilderness, Sagano Bamboo Forest, and Howland Forest"
      },
      {
        "question": "Why does the porcupine argue with the roseate tern?",
        "options": [
          "The tern took his favorite seat",
          "The tern was making too much noise",
          "His ticket says he can have a compartment to himself",
          "The tern ate his food"
        ],
        "answer": "His ticket says he can have a compartment to himself"
      },
      {
        "question": "Which animals join Kate in the library car?",
        "options": [
          "The porcupine, fishing cat, snake, and heron",
          "The polar bear, wild boar, and roseate tern",
          "The pangolin, butterfly, and starling",
          "The elephant, giraffe, and zebra"
        ],
        "answer": "The porcupine, fishing cat, snake, and heron"
      },
      {
        "question": "At the unscheduled station, which animal tries to get on the train?",
        "options": [
          "A wild elephant",
          "A wild boar",
          "A wild tiger",
          "A wild eagle"
        ],
        "answer": "A wild boar"
      },
      {
        "question": "Why did someone release starlings into New York City?",
        "options": [
          "To control the insect population",
          "To add music to the city streets",
          "Because he thought North America should have all the bird species mentioned in Shakespeare",
          "To study their migration patterns"
        ],
        "answer": "Because he thought North America should have all the bird species mentioned in Shakespeare"
      },
      {
        "question": "What animal does the train stop in the middle of the ocean to pick up?",
        "options": [
          "A whale",
          "A dolphin",
          "A polar bear",
          "A sea turtle"
        ],
        "answer": "A polar bear"
      },
      {
        "question": "What special machine does the candy car have?",
        "options": [
          "A chocolate fountain that never stops flowing",
          "A machine that can deliver any flavor of jelly bean",
          "A cotton candy maker that spins rainbow colors",
          "A gum dispenser that blows bubbles automatically"
        ],
        "answer": "A machine that can deliver any flavor of jelly bean"
      },
      {
        "question": "What happens to Kate and Tom when the train takes a branch line?",
        "options": [
          "They fall asleep and dream of flying",
          "They shrink down to the size of mice",
          "They turn into trees",
          "They become invisible"
        ],
        "answer": "They turn into trees"
      },
      {
        "question": "How are the butterflies transported on the train?",
        "options": [
          "In special butterfly nets",
          "In a greenhouse full of butterflies added to the train",
          "Flying freely through all the cars",
          "In individual glass containers"
        ],
        "answer": "In a greenhouse full of butterflies added to the train"
      },
      {
        "question": "Which train cars do they leave behind when climbing the mountain?",
        "options": [
          "The heaviest cars including the swimming pool car",
          "The candy car and mystery car",
          "All the passenger cars",
          "They don't leave any cars behind"
        ],
        "answer": "They don't leave any cars behind"
      },
      {
        "question": "What treasure do Kate and Tom find on the underwater island?",
        "options": [
          "Pirates' gold and silver coins",
          "Ancient maps and compass",
          "Grace Hopper's glasses and Foxy Brown (Tom's lost toy)",
          "Magical crystals and gemstones"
        ],
        "answer": "Grace Hopper's glasses and Foxy Brown (Tom's lost toy)"
      },
      {
        "question": "What does Kate find when she walks along the roof of the train?",
        "options": [
          "A family of birds nesting",
          "The Twilight Star - the train that didn't come back",
          "A secret passage to another car",
          "A telescope for stargazing"
        ],
        "answer": "The Twilight Star - the train that didn't come back"
      },
      {
        "question": "Why was there no platform for the polar bear to wait on?",
        "options": [
          "The station was too small",
          "It was made of ice that melted in the warm weather",
          "The platform was being repaired",
          "Polar bears don't use platforms"
        ],
        "answer": "It was made of ice that melted in the warm weather"
      },
      {
        "question": "What does the mysterious train car contain?",
        "options": [
          "A rocket",
          "A time machine",
          "A portal to another dimension",
          "A laboratory full of experiments"
        ],
        "answer": "A rocket"
      },
      {
        "question": "Where do they leave the baby pangolin?",
        "options": [
          "At a jungle station",
          "At a desert oasis",
          "On a cloud station in the sky",
          "At an underground cavern"
        ],
        "answer": "On a cloud station in the sky"
      },
      {
        "question": "Where does the fishing cat leave the train?",
        "options": [
          "At a mountain lake",
          "At a mangrove forest",
          "At a river delta",
          "At an ocean pier"
        ],
        "answer": "At a mangrove forest"
      },
      {
        "question": "Which animal is the last to leave the train?",
        "options": [
          "The fishing cat",
          "The roseate tern",
          "The porcupine",
          "The baby pangolin"
        ],
        "answer": "The porcupine"
      }
    ]
  },
  {
    "book_id": "019",
    "questions": [
      {
        "question": "Where do cardinals gather to elect a new pope?",
        "options": [
          "Paris, France",
          "Rome, Italy",
          "London, England",
          "Madrid, Spain"
        ],
        "answer": "Rome, Italy"
      },
      {
        "question": "Who did Jesus make the very first pope?",
        "options": [
          "John the Baptist",
          "Paul the Apostle",
          "Peter the Apostle",
          "Matthew the Apostle"
        ],
        "answer": "Peter the Apostle"
      },
      {
        "question": "What did Jesus give to Peter along with making him pope?",
        "options": [
          "The keys to His Kingdom",
          "A special ring",
          "A golden crown",
          "A sacred book"
        ],
        "answer": "The keys to His Kingdom"
      },
      {
        "question": "What did Jesus call Peter that relates to the Church?",
        "options": [
          "The light of the world",
          "The rock on which the Church would be built",
          "The shepherd of the flock",
          "The keeper of the faith"
        ],
        "answer": "The rock on which the Church would be built"
      },
      {
        "question": "What are the cardinals doing when they gather in Rome?",
        "options": [
          "Having a vacation",
          "Studying together",
          "Choosing a new leader for Catholics everywhere",
          "Planning a celebration"
        ],
        "answer": "Choosing a new leader for Catholics everywhere"
      },
      {
        "question": "What does the book say about the different colors of cardinal clothing?",
        "options": [
          "They represent different countries",
          "They show different ranks and roles",
          "They are chosen randomly",
          "They represent different languages"
        ],
        "answer": "They show different ranks and roles"
      },
      {
        "question": "What is the special process called when cardinals are locked away to choose a pope?",
        "options": [
          "The Conclave",
          "The Assembly",
          "The Conference",
          "The Gathering"
        ],
        "answer": "The Conclave"
      },
      {
        "question": "In which famous chapel do the cardinals vote?",
        "options": [
          "The Sistine Chapel",
          "The Vatican Chapel",
          "The Apostolic Chapel",
          "The Sacred Chapel"
        ],
        "answer": "The Sistine Chapel"
      },
      {
        "question": "Who painted the famous ceiling above the cardinals as they vote?",
        "options": [
          "Leonardo da Vinci",
          "Raphael",
          "Michelangelo",
          "Donatello"
        ],
        "answer": "Michelangelo"
      },
      {
        "question": "How do the cardinals cast their votes?",
        "options": [
          "They raise their hands",
          "They vote out loud",
          "They use a secret ballot",
          "They write on a chalkboard"
        ],
        "answer": "They use a secret ballot"
      },
      {
        "question": "What happens if no one gets enough votes in the first round?",
        "options": [
          "They stop and try again next year",
          "They choose randomly",
          "The cardinals must vote again",
          "The oldest cardinal becomes pope"
        ],
        "answer": "The cardinals must vote again"
      },
      {
        "question": "What color smoke means the cardinals need more time to choose?",
        "options": [
          "White smoke",
          "Black smoke",
          "Gray smoke",
          "Blue smoke"
        ],
        "answer": "Black smoke"
      },
      {
        "question": "What color smoke means a new pope has been chosen?",
        "options": [
          "Black smoke",
          "Gray smoke",
          "White smoke",
          "Yellow smoke"
        ],
        "answer": "White smoke"
      },
      {
        "question": "Where does the smoke come from?",
        "options": [
          "A regular fireplace",
          "A special chimney in the roof of the Sistine Chapel",
          "The church bells",
          "A signal fire outside"
        ],
        "answer": "A special chimney in the roof of the Sistine Chapel"
      },
      {
        "question": "What famous Latin phrase is announced when a new pope is chosen?",
        "options": [
          "Veni, Vidi, Vici",
          "Habemus Papam",
          "Ave Maria",
          "Gloria in Excelsis"
        ],
        "answer": "Habemus Papam"
      },
      {
        "question": "What does \"Habemus Papam\" mean in English?",
        "options": [
          "God bless the Pope",
          "Long live the Pope",
          "We have a Pope",
          "The Pope is holy"
        ],
        "answer": "We have a Pope"
      },
      {
        "question": "Where does the new pope first appear to the public?",
        "options": [
          "On the steps of the Sistine Chapel",
          "In St. Peter's Square",
          "From the balcony of St. Peter's Basilica",
          "At the Vatican gates"
        ],
        "answer": "From the balcony of St. Peter's Basilica"
      },
      {
        "question": "What do the crowds in St. Peter's Square do when they see the new pope?",
        "options": [
          "They remain silent",
          "They sing hymns",
          "They cheer and celebrate",
          "They kneel in prayer"
        ],
        "answer": "They cheer and celebrate"
      },
      {
        "question": "How long can the papal election process take?",
        "options": [
          "It must be finished in one day",
          "It can take several days or even longer",
          "It always takes exactly three days",
          "It must be completed in one hour"
        ],
        "answer": "It can take several days or even longer"
      },
      {
        "question": "According to the book, what is the main job of the new pope?",
        "options": [
          "To rule over Italy",
          "To lead God's people with faith",
          "To collect money for the Church",
          "To write new laws for the world"
        ],
        "answer": "To lead God's people with faith"
      }
    ]
  },
  {
    "book_id": "009",
    "questions": [
      {
        "question": "What does Fletcher release from an old jar?",
        "options": [
          "A fairy",
          "A goblin",
          "A genie",
          "A dragon"
        ],
        "answer": "A goblin"
      },
      {
        "question": "Where does Aunt Caroline abandon Nimbus?",
        "options": [
          "At the train station",
          "At the dump",
          "In the forest",
          "At an orphanage"
        ],
        "answer": "At the dump"
      },
      {
        "question": "What unusual item does Rhett wear?",
        "options": [
          "A feathered hat",
          "An old sock",
          "A broken watch",
          "A torn cape"
        ],
        "answer": "An old sock"
      },
      {
        "question": "What happens to Nimbus's eyes after her fight with the goblin?",
        "options": [
          "They both turn completely black",
          "She becomes temporarily blind",
          "She has one green eye and one yellow eye",
          "They glow bright blue in the dark"
        ],
        "answer": "She has one green eye and one yellow eye"
      },
      {
        "question": "What does Agatha's name mean?",
        "options": [
          "Wise",
          "Brave",
          "Kind",
          "Strong"
        ],
        "answer": "Kind"
      },
      {
        "question": "Where did Rochester use to live?",
        "options": [
          "In a library",
          "In a bookshop",
          "In a museum",
          "In a school"
        ],
        "answer": "In a bookshop"
      },
      {
        "question": "What does Fern want to return to?",
        "options": [
          "Her childhood home",
          "The memories of her kittens",
          "Her days as a young witch",
          "Her lost magical powers"
        ],
        "answer": "The memories of her kittens"
      },
      {
        "question": "What are the three diversions?",
        "options": [
          "Reading, writing, and sleeping",
          "Hunting, playing, and watching",
          "Flying, swimming, and running",
          "Singing, dancing, and laughing"
        ],
        "answer": "Hunting, playing, and watching"
      },
      {
        "question": "What plant does Agatha gather at night?",
        "options": [
          "Wolfsbane",
          "Mandrake",
          "Vervain",
          "Nightshade"
        ],
        "answer": "Vervain"
      },
      {
        "question": "How did Grimalkin communicate with Agatha?",
        "options": [
          "By meowing in different tones",
          "By putting her paw to Agatha's palm",
          "By leaving messages in the dirt",
          "By moving objects with her mind"
        ],
        "answer": "By putting her paw to Agatha's palm"
      },
      {
        "question": "What had the ruined mansion been?",
        "options": [
          "A hospital for magical creatures",
          "A school for young witches",
          "A prison for dangerous wizards",
          "A library of forbidden spells"
        ],
        "answer": "A school for young witches"
      },
      {
        "question": "What is a nazar?",
        "options": [
          "A magical potion ingredient",
          "An all-seeing eye - a protection amulet",
          "A type of dangerous spell",
          "A messenger bird"
        ],
        "answer": "An all-seeing eye - a protection amulet"
      },
      {
        "question": "What is the stolen Dragon's Eye?",
        "options": [
          "A precious emerald",
          "An old chipped marble",
          "A magical crystal orb",
          "A golden coin"
        ],
        "answer": "An old chipped marble"
      },
      {
        "question": "What was Abraxas' best friend?",
        "options": [
          "A dog called Striker",
          "A cat called Shadow",
          "A crow called Midnight",
          "A snake called Viper"
        ],
        "answer": "A dog called Striker"
      },
      {
        "question": "How does the goblin try to get Nimbus back?",
        "options": [
          "By casting a powerful spell",
          "By using Aunt Caroline's body",
          "By sending magical creatures after her",
          "By appearing in her dreams"
        ],
        "answer": "By using Aunt Caroline's body"
      },
      {
        "question": "What does Hecate always have with her?",
        "options": [
          "A magical wand",
          "A crystal ball",
          "A black animal (dog, mouse, lizard, cat, crow, spiders, snake)",
          "A spellbook"
        ],
        "answer": "A black animal (dog, mouse, lizard, cat, crow, spiders, snake)"
      },
      {
        "question": "How does Nimbus know how to kill the goblin?",
        "options": [
          "By consulting an ancient spellbook",
          "By remembering the story of The Hobbit",
          "By asking Agatha for advice",
          "By following her magical instincts"
        ],
        "answer": "By remembering the story of The Hobbit"
      },
      {
        "question": "What is Fletcher's amulet?",
        "options": [
          "An old arrowhead",
          "A silver coin",
          "A carved wooden charm",
          "A piece of jade"
        ],
        "answer": "An old arrowhead"
      },
      {
        "question": "Who is the stray cat?",
        "options": [
          "Rochester",
          "Grimalkin",
          "Fern",
          "Hecate"
        ],
        "answer": "Grimalkin"
      },
      {
        "question": "What does Rhett do on Fletcher's father's horror show?",
        "options": [
          "He writes the scripts",
          "He operates the cameras",
          "He co-stars on the show",
          "He does the special effects"
        ],
        "answer": "He co-stars on the show"
      }
    ]
  },
  {
    "book_id": "005",
    "questions": [
      {
        "question": "What unusual physical trait does Mortimer have?",
        "options": [
          "He has two different colored eyes",
          "He has six toes on each foot",
          "He has webbed fingers",
          "He has naturally blue hair"
        ],
        "answer": "He has six toes on each foot"
      },
      {
        "question": "What does the sign in the little free library say?",
        "options": [
          "Take a book, leave a book. Or both",
          "Free books for everyone to enjoy",
          "Reading is the key to knowledge",
          "Books are friends that never leave"
        ],
        "answer": "Take a book, leave a book. Or both"
      },
      {
        "question": "Who are the three ghosts that live in Martinville's History House?",
        "options": [
          "Al, Mrs. Baker, and Finn",
          "Mortimer, Evan, and Rafe",
          "Al, Ms. Scoggin, and Mr. Brock",
          "Demetri, Al, and Mrs. Baker"
        ],
        "answer": "Al, Ms. Scoggin, and Mr. Brock"
      },
      {
        "question": "Where did Evan find a Polaroid?",
        "options": [
          "Hidden in the library ruins",
          "Between the pages of \"How to Write a Mystery Novel\"",
          "In the tree house under some old papers",
          "In a box in the History House attic"
        ],
        "answer": "Between the pages of \"How to Write a Mystery Novel\""
      },
      {
        "question": "What was Al's favorite thing from before she was a ghost?",
        "options": [
          "Reading mystery novels alone",
          "The Wednesday book club",
          "Working the night shift at the library",
          "Organizing the card catalog"
        ],
        "answer": "The Wednesday book club"
      },
      {
        "question": "What happens to Finn's tail?",
        "options": [
          "It gets caught in a door and breaks off",
          "He loses the end of it when a bird catches him",
          "It gets singed in a small fire",
          "It gets tangled in some fishing line"
        ],
        "answer": "He loses the end of it when a bird catches him"
      },
      {
        "question": "When were all the books from the library cart returned?",
        "options": [
          "The week after the library burned down",
          "On the same day as the library burned down",
          "The day before the library burned down",
          "A month after the library burned down"
        ],
        "answer": "On the same day as the library burned down"
      },
      {
        "question": "What sandwich is left for Al every Wednesday?",
        "options": [
          "Ham and cheese with mustard",
          "Peanut butter and jelly",
          "Tuna fish and dill pickle",
          "Turkey and avocado"
        ],
        "answer": "Tuna fish and dill pickle"
      },
      {
        "question": "What does Evan find in the library ruins?",
        "options": [
          "A box of old photographs",
          "A burned book with a hidden message",
          "Two keys on a ring",
          "A damaged typewriter"
        ],
        "answer": "Two keys on a ring"
      },
      {
        "question": "When do Rafe's parents' rules expire?",
        "options": [
          "When he turns sixteen",
          "When he graduates high school",
          "Middle school",
          "When he gets his driver's license"
        ],
        "answer": "Middle school"
      },
      {
        "question": "What does Mrs. Baker read?",
        "options": [
          "A short story by Edgar Allan Poe",
          "A poem by Langston Hughes",
          "A chapter from a mystery novel",
          "A passage from Shakespeare"
        ],
        "answer": "A poem by Langston Hughes"
      },
      {
        "question": "How many types of desserts were at graduation?",
        "options": [
          "45 kinds of desserts plus 2 bags of nuts",
          "59 kinds of cakes, pies, brownies and cookies plus 1 bag of nuts",
          "62 different sweet treats",
          "50 kinds of desserts plus 3 bags of mixed nuts"
        ],
        "answer": "59 kinds of cakes, pies, brownies and cookies plus 1 bag of nuts"
      },
      {
        "question": "What does Demetri have?",
        "options": [
          "A birthmark shaped like a star",
          "An epic scar which runs from hip to knee on one leg",
          "A collection of rare coins",
          "A photographic memory"
        ],
        "answer": "An epic scar which runs from hip to knee on one leg"
      },
      {
        "question": "What happened when Evan opened the tree house door?",
        "options": [
          "The door handle came off in his hand",
          "The hinges broke and it fell off",
          "It got stuck and wouldn't open all the way",
          "A family of squirrels ran out"
        ],
        "answer": "The hinges broke and it fell off"
      },
      {
        "question": "What does \"Al\" stand for?",
        "options": [
          "Always Learning",
          "Assistant Librarian",
          "Absolutely Lovely",
          "Alexandria Louise"
        ],
        "answer": "Assistant Librarian"
      },
      {
        "question": "What does Al admit about herself?",
        "options": [
          "She was never really good at her job",
          "She isn't a ghost, she was just heartbroken",
          "She's been lying about her age",
          "She never actually liked books"
        ],
        "answer": "She isn't a ghost, she was just heartbroken"
      },
      {
        "question": "Where does the six-toed monster live?",
        "options": [
          "In the basement of the History House",
          "At the Grantville movie theatre",
          "In the ruins of the old library",
          "In the woods behind the school"
        ],
        "answer": "At the Grantville movie theatre"
      },
      {
        "question": "Why was Mr. Brock in the library the night of the fire?",
        "options": [
          "He was working late on a research project",
          "He was waiting for Ms. Scoggin to go to a movie together",
          "He was looking for a book he had lost",
          "He was hiding from someone who was chasing him"
        ],
        "answer": "He was waiting for Ms. Scoggin to go to a movie together"
      },
      {
        "question": "Who is Evan's father?",
        "options": [
          "Mr. Brock",
          "H.G. Higgins",
          "Mortimer",
          "Demetri"
        ],
        "answer": "H.G. Higgins"
      },
      {
        "question": "What caused the library fire?",
        "options": [
          "An electrical problem with old wiring",
          "Someone left a candle burning",
          "It was an accident caused by mice",
          "Lightning struck the building"
        ],
        "answer": "It was an accident caused by mice"
      }
    ]
  },
  {
    "book_id": "018",
    "questions": [
      {
        "question": "What is a casapasaran?",
        "options": [
          "A magical sword that never breaks",
          "A compass that shows the way home",
          "A flying carpet that travels at night",
          "A map that reveals hidden treasures"
        ],
        "answer": "A compass that shows the way home"
      },
      {
        "question": "Why does Christopher jump in the lake?",
        "options": [
          "To find a hidden underwater cave",
          "To escape from enemy soldiers",
          "To save Gelifen",
          "To retrieve a lost magical item"
        ],
        "answer": "To save Gelifen"
      },
      {
        "question": "How do Mal and Christopher escape the murderer?",
        "options": [
          "By hiding in a secret underground tunnel",
          "By riding on the backs of unicorns",
          "By using a magical invisibility cloak",
          "By flying away on a giant eagle"
        ],
        "answer": "By riding on the backs of unicorns"
      },
      {
        "question": "What kind of creature is Ratwin, the Neverfear's navigator?",
        "options": [
          "A phoenix",
          "A griffin",
          "A ratatoska",
          "A basilisk"
        ],
        "answer": "A ratatoska"
      },
      {
        "question": "How does the senate building move from town to town?",
        "options": [
          "It rolls on giant wheels made of stone",
          "It teleports using ancient magic",
          "It flies through the sky carried by longmas",
          "It travels underground through tunnels"
        ],
        "answer": "It flies through the sky carried by longmas"
      },
      {
        "question": "What is the immortal?",
        "options": [
          "A wizard who discovered the secret of eternal life",
          "The soul born from the world's first apple on the world's first tree",
          "A dragon that has lived for a thousand years",
          "A goddess who rules over all magical creatures"
        ],
        "answer": "The soul born from the world's first apple on the world's first tree"
      },
      {
        "question": "How does the murderer find them?",
        "options": [
          "By following the al mirages green trail in the pavement cracks",
          "By tracking their footprints in the mud",
          "By using a magical crystal ball",
          "By following the sound of their voices"
        ],
        "answer": "By following the al mirages green trail in the pavement cracks"
      },
      {
        "question": "What destroys the Neverfear?",
        "options": [
          "A powerful storm at sea",
          "A kraken",
          "Enemy cannon fire",
          "Sharp rocks hidden beneath the waves"
        ],
        "answer": "A kraken"
      },
      {
        "question": "What are the sails of the Shadowdancer made of?",
        "options": [
          "The finest silk from magical spiders",
          "The wings of the Pegasus",
          "Clouds woven together with starlight",
          "The feathers of a thousand birds"
        ],
        "answer": "The wings of the Pegasus"
      },
      {
        "question": "How do the sphinxes record their knowledge?",
        "options": [
          "By writing in books made of golden pages",
          "By carving it into mountains",
          "By singing songs that echo through time",
          "By creating magical scrolls that never fade"
        ],
        "answer": "By carving it into mountains"
      },
      {
        "question": "What is the answer to Christopher's riddle?",
        "options": [
          "Fire and water",
          "Love and hate",
          "Day and night",
          "Life and death"
        ],
        "answer": "Day and night"
      },
      {
        "question": "Who built the maze that hides the Glimourie Tree?",
        "options": [
          "Leonardo da Vinci and his cousin Enzo da Vinci",
          "A powerful sorcerer and his apprentice",
          "The sphinxes using their ancient wisdom",
          "A team of skilled dwarven craftsmen"
        ],
        "answer": "Leonardo da Vinci and his cousin Enzo da Vinci"
      },
      {
        "question": "Why do they go to the Island of the immortal?",
        "options": [
          "To find a cure for a deadly curse",
          "To collect a boat made of dryad wood",
          "To ask the immortal for magical powers",
          "To rescue a captured friend"
        ],
        "answer": "To collect a boat made of dryad wood"
      },
      {
        "question": "Why does the Jaculus dragon let them go?",
        "options": [
          "Because they solve his ancient riddle",
          "Because they give him a chest full of gold",
          "Because Christopher gives him the name Jacques",
          "Because they promise to return with a gift"
        ],
        "answer": "Because Christopher gives him the name Jacques"
      },
      {
        "question": "Who steals the Shadowdancer?",
        "options": [
          "A band of ruthless pirates",
          "The murderer and his crew",
          "Petroc the centaur",
          "A group of sea witches"
        ],
        "answer": "Petroc the centaur"
      },
      {
        "question": "Why does the island of manticores have only manticores on it?",
        "options": [
          "Because they scared away all other creatures",
          "Because they eat everything they see",
          "Because the climate is too harsh for other animals",
          "Because they built walls to keep others out"
        ],
        "answer": "Because they eat everything they see"
      },
      {
        "question": "How is Irian able to call for help?",
        "options": [
          "Because she has a magical conch shell",
          "Because she knows ancient spells",
          "Because she is part nereid",
          "Because she carries a special whistle"
        ],
        "answer": "Because she is part nereid"
      },
      {
        "question": "How did Francisco Sforza find his way through the maze?",
        "options": [
          "He followed a trail of magical breadcrumbs",
          "He used a compass that pointed to the center",
          "Enzo da Vinci made a map of it before he lost his memory",
          "He memorized the pattern from studying it for years"
        ],
        "answer": "Enzo da Vinci made a map of it before he lost his memory"
      },
      {
        "question": "How does Mal defeat Sforza?",
        "options": [
          "By trapping him in a magical cage",
          "By flying with him into the somnulum",
          "By challenging him to a duel with swords",
          "By using a spell that turns him to stone"
        ],
        "answer": "By flying with him into the somnulum"
      },
      {
        "question": "Why does Jacques bite Christopher's hand?",
        "options": [
          "Because he is angry and wants revenge",
          "To leave a scar so that he will know the adventure was real",
          "Because he is protecting his territory",
          "To mark Christopher as his friend forever"
        ],
        "answer": "To leave a scar so that he will know the adventure was real"
      }
    ]
  },
  {
    "book_id": "003",
    "questions": [
      {
        "question": "What color are Paul's wings?",
        "options": [
          "Snow white",
          "Pigeon colored",
          "Golden yellow",
          "Midnight black"
        ],
        "answer": "Pigeon colored"
      },
      {
        "question": "What does Chapel want to be when she dies?",
        "options": [
          "An angel",
          "A ghost",
          "A spirit guide",
          "A guardian"
        ],
        "answer": "A ghost"
      },
      {
        "question": "What does the librarian show Jerry and Chapel how to use?",
        "options": [
          "The card catalog system",
          "The microfiche machine",
          "The computer database",
          "The rare books collection"
        ],
        "answer": "The microfiche machine"
      },
      {
        "question": "What was Windy Pines before it became a town?",
        "options": [
          "A lumber mill",
          "A mining camp",
          "A trading post",
          "A military base"
        ],
        "answer": "A mining camp"
      },
      {
        "question": "Why did Jerry's father have a sword?",
        "options": [
          "It was a family heirloom",
          "He was a collector of antiques",
          "He liked fantasy books",
          "He was a history teacher"
        ],
        "answer": "He liked fantasy books"
      },
      {
        "question": "What do the Xs on the map mark?",
        "options": [
          "Treasure locations",
          "Old mining shafts",
          "Abandoned buildings",
          "Dangerous areas"
        ],
        "answer": "Old mining shafts"
      },
      {
        "question": "What is found in the circles of stones?",
        "options": [
          "Ancient coins",
          "A soot-like substance",
          "Glowing crystals",
          "Carved symbols"
        ],
        "answer": "A soot-like substance"
      },
      {
        "question": "What happens to Chapel in the woods?",
        "options": [
          "She becomes invisible",
          "She has a bluish glow",
          "She grows taller",
          "She can fly"
        ],
        "answer": "She has a bluish glow"
      },
      {
        "question": "How do Jerry and Chapel make a trap for the demons?",
        "options": [
          "Using their own rope",
          "Digging a deep pit",
          "Setting up mirrors",
          "Creating a magic circle"
        ],
        "answer": "Using their own rope"
      },
      {
        "question": "What do they wade through to throw the demons off the scent?",
        "options": [
          "Muddy swamp water",
          "Slimy water",
          "A rushing river",
          "Thick fog"
        ],
        "answer": "Slimy water"
      },
      {
        "question": "Who can Chapel see in the woods?",
        "options": [
          "Jerry's father",
          "Paul",
          "Miss Mavis",
          "The Guardians"
        ],
        "answer": "Paul"
      },
      {
        "question": "What do the initials JEB on the sword stand for?",
        "options": [
          "Jerry's father's real name",
          "Joshua Eli Blum",
          "The sword's maker",
          "An ancient warrior's name"
        ],
        "answer": "Joshua Eli Blum"
      },
      {
        "question": "What do they find in the witch's house?",
        "options": [
          "A secret room behind a bookshelf",
          "A door in the floor",
          "A hidden staircase",
          "A magic cauldron"
        ],
        "answer": "A door in the floor"
      },
      {
        "question": "Where is Jerry's mother found?",
        "options": [
          "Locked in the witch's house",
          "Tied up with Edwin in the tunnel",
          "Hidden in the old mine",
          "Trapped in the motel basement"
        ],
        "answer": "Tied up with Edwin in the tunnel"
      },
      {
        "question": "Who is Miss Mavis?",
        "options": [
          "The town librarian",
          "The witch of the woods",
          "Jerry's grandmother",
          "Chapel's teacher"
        ],
        "answer": "The witch of the woods"
      },
      {
        "question": "How do they distract the demons?",
        "options": [
          "They make loud noises",
          "They throw shiny things",
          "They create smoke",
          "They sing magical songs"
        ],
        "answer": "They throw shiny things"
      },
      {
        "question": "What are the Guardians?",
        "options": [
          "Magical forest spirits",
          "Giant stone creatures",
          "Ancient tree beings",
          "Ghostly protectors"
        ],
        "answer": "Giant stone creatures"
      },
      {
        "question": "Where do the demons escape to?",
        "options": [
          "The old mine shafts",
          "The motel",
          "The town square",
          "The abandoned school"
        ],
        "answer": "The motel"
      },
      {
        "question": "Who is the last ghost to be freed?",
        "options": [
          "Paul",
          "Millie Dobbs",
          "Jerry's father",
          "Edwin"
        ],
        "answer": "Millie Dobbs"
      },
      {
        "question": "What does Jerry's mother give someone?",
        "options": [
          "A magical amulet",
          "A cellphone",
          "A protective charm",
          "A family photograph"
        ],
        "answer": "A cellphone"
      }
    ]
  },
  {
    "book_id": "015",
    "title": "Scare School Diaries Quiz",
    "grades": "4-8",
    "questions": [
      {
        "question": "What is the main character's name?",
        "options": ["Boo", "Bash", "Bell", "Bob"],
        "answer": "Bash"
      },
      {
        "question": "What type of creature is the main character?",
        "options": ["Vampire", "Werewolf", "Ghost", "Zombie"],
        "answer": "Ghost"
      },
      {
        "question": "Who is Bash's sister?",
        "options": ["Bella", "Betty", "Brianna", "Bonnie"],
        "answer": "Bella"
      },
      {
        "question": "What is special about Bash's sister's experience at Scare School?",
        "options": ["She failed all her classes", "She was expelled", "She loved it and did well", "She never attended"],
        "answer": "She loved it and did well"
      },
      {
        "question": "Who is Bash's roommate?",
        "options": ["Vlad", "Itsy", "Wes", "Mumford"],
        "answer": "Itsy"
      },
      {
        "question": "What type of creature is Bash's roommate?",
        "options": ["Spider", "Bat", "Snake", "Troll"],
        "answer": "Spider"
      },
      {
        "question": "Which teacher is Bash's homeroom teacher?",
        "options": ["Mr. Crane", "Professor Snekk", "Ms. Graves", "Captain Loosebeard"],
        "answer": "Ms. Graves"
      },
      {
        "question": "What does C.A.T. stand for?",
        "options": ["Creatures Are Terrifying", "Creepy Animal Test", "Creature Aptitude Test", "Cool And Terrifying"],
        "answer": "Creature Aptitude Test"
      },
      {
        "question": "Who are the main bullies in the story?",
        "options": ["Wes and Mumford", "Vlad and Vicky", "Zara and Batslee", "Mimi and Itsy"],
        "answer": "Vlad and Vicky"
      },
      {
        "question": "What type of creatures are the bullies?",
        "options": ["Werewolves", "Zombies", "Vampires", "Ghosts"],
        "answer": "Vampires"
      },
      {
        "question": "Which ghost skill does Bash struggle with the most?",
        "options": ["Flying", "Making scary noises", "Passing through walls", "Disappearing completely"],
        "answer": "Passing through walls"
      },
      {
        "question": "What subject does Mr. Crane teach?",
        "options": ["Introduction to Scare Tactics", "Human Behavior", "Creature Intensive", "Philosophy of Fear"],
        "answer": "Creature Intensive"
      },
      {
        "question": "Who teaches \"Advanced Creeping and Crawling\"?",
        "options": ["Ms. Graves", "Mr. Crane", "Professor Snekk", "Ms. Scully"],
        "answer": "Professor Snekk"
      },
      {
        "question": "What is Captain Loosebeard's job at the school?",
        "options": ["Principal", "Librarian", "School cook", "Security guard"],
        "answer": "School cook"
      },
      {
        "question": "How many special creature skills must students demonstrate to pass the C.A.T.?",
        "options": ["One", "Two", "Three", "Four"],
        "answer": "Two"
      },
      {
        "question": "Why does Bash finally succeed in passing through the wall?",
        "options": ["He practiced more", "He used a magic potion", "He wanted to help Itsy who was in trouble", "Mr. Crane helped him"],
        "answer": "He wanted to help Itsy who was in trouble"
      },
      {
        "question": "What does Bash receive from Bella during his time at school?",
        "options": ["A care package", "A phone call", "A letter", "A visit"],
        "answer": "A letter"
      },
      {
        "question": "How does Mr. Crane's attitude toward Bash change by the end?",
        "options": ["He becomes meaner", "He stays the same", "He becomes more encouraging", "He ignores Bash completely"],
        "answer": "He becomes more encouraging"
      },
      {
        "question": "What does Bash plan to do after passing his test?",
        "options": ["Transfer to a different school", "Go home and never return", "Return to Scare School for more learning", "Become a teacher"],
        "answer": "Return to Scare School for more learning"
      },
      {
        "question": "What is the main theme of the story?",
        "options": ["Being scary is the most important thing", "Friendship and courage help you overcome challenges", "School is always terrible", "Ghosts are better than other creatures"],
        "answer": "Friendship and courage help you overcome challenges"
      }
    ]
  },
  {
    "book_id": "002",
    "title": "When We Flew Away Quiz",
    "author": "Alice Hoffman",
    "grades": "4-8",
    "questions": [
      {
        "question": "What did Anne and Margot call their father?",
        "options": ["Papa", "Daddy", "Pim", "Father"],
        "answer": "Pim"
      },
      {
        "question": "Where did Anne imagine she would go one day?",
        "options": ["California", "England", "Canada", "Australia"],
        "answer": "California"
      },
      {
        "question": "What were bolus?",
        "options": ["German soldiers", "Dutch sweet rolls with cinnamon, raisins, and candied citrus peel", "Jewish identification cards", "Bird nests"],
        "answer": "Dutch sweet rolls with cinnamon, raisins, and candied citrus peel"
      },
      {
        "question": "What animal followed Anne home?",
        "options": ["A crow", "A pigeon", "A magpie", "A sparrow"],
        "answer": "A magpie"
      },
      {
        "question": "What did the family first think was thunder one morning?",
        "options": ["A storm approaching", "Construction work", "German bombers", "Artillery practice"],
        "answer": "German bombers"
      },
      {
        "question": "What did Pim's company sell?",
        "options": ["Jam and preserves", "Opekta, a thickening agent for jam", "Baking supplies", "Newspapers"],
        "answer": "Opekta, a thickening agent for jam"
      },
      {
        "question": "What were all Jewish residents required to do?",
        "options": ["Move to a different neighborhood", "Register with the Civic Registry", "Pay extra taxes", "Attend special schools"],
        "answer": "Register with the Civic Registry"
      },
      {
        "question": "What tragic statistic is mentioned about the Netherlands?",
        "options": ["It had the most Jewish refugees", "It had the longest occupation", "It would have the greatest percentage of Jews murdered of any Western European country", "It had the most resistance fighters"],
        "answer": "It would have the greatest percentage of Jews murdered of any Western European country"
      },
      {
        "question": "How many countries wanted Jewish refugees?",
        "options": ["Many countries", "A few countries", "Most European countries", "No country"],
        "answer": "No country"
      },
      {
        "question": "How many Jewish men were arrested and deported to Mauthausen?",
        "options": ["200", "300", "400", "500"],
        "answer": "400"
      },
      {
        "question": "What did Anne find in a stork's nest?",
        "options": ["A blue hair ribbon", "A gold coin", "A letter", "A small bird"],
        "answer": "A blue hair ribbon"
      },
      {
        "question": "What did many Dutch children join?",
        "options": ["The resistance", "Youth clubs", "The Jeugdstorm (Youth Storm)", "Sports teams"],
        "answer": "The Jeugdstorm (Youth Storm)"
      },
      {
        "question": "What did the signs say that were posted everywhere?",
        "options": ["Germans Welcome", "Voor Juden Verboden (Forbidden For Jews)", "Registration Required", "Curfew in Effect"],
        "answer": "Voor Juden Verboden (Forbidden For Jews)"
      },
      {
        "question": "What did Edith give to Margot on her sixteenth birthday?",
        "options": ["A diary", "Oma's gold necklace", "A silver bracelet", "A book"],
        "answer": "Oma's gold necklace"
      },
      {
        "question": "What is Purim?",
        "options": ["A type of food", "A festival that marks Queen Esther saving her people", "A German holiday", "A Jewish prayer"],
        "answer": "A festival that marks Queen Esther saving her people"
      },
      {
        "question": "What were Jewish people forced to sew on their clothes?",
        "options": ["A red circle", "A black square", "A yellow star", "A blue triangle"],
        "answer": "A yellow star"
      },
      {
        "question": "What was special about the Jewish market?",
        "options": ["It had the best food", "It was open all day", "It only had the food no one else wanted", "It was free"],
        "answer": "It only had the food no one else wanted"
      },
      {
        "question": "What was Helmut Silberberg's nickname?",
        "options": ["Hank", "Harry", "Hello", "Henry"],
        "answer": "Hello"
      },
      {
        "question": "What did Anne leave on an Elm Tree?",
        "options": ["A letter to her friend", "A wish: \"Remember us - Remember me\"", "A blue ribbon", "A small gift"],
        "answer": "A wish: \"Remember us - Remember me\""
      },
      {
        "question": "What was Anne looking for throughout the story?",
        "options": ["A new home", "A place where she wouldn't have to be afraid of soldiers on the streets", "Her lost pet", "A way to help other families"],
        "answer": "A place where she wouldn't have to be afraid of soldiers on the streets"
      }
    ]
  },
  {
    "book_id": "006",
    "title": "Legendarios: Wrath of the Rain God - Quiz",
    "questions": [
      {
        "question": "Where are Emma and Martín moving from and to?",
        "options": ["From Chicago to Mexico City", "From Cuernavaca, Mexico to Chicago", "From Mexico City to Los Angeles", "From Chicago to Cuernavaca"],
        "answer": "From Cuernavaca, Mexico to Chicago"
      },
      {
        "question": "What special gift does Abuela give the twins before they move?",
        "options": ["A magic mirror", "A book of Mexican legends", "An obsidian necklace", "A lightning bolt"],
        "answer": "A book of Mexican legends"
      },
      {
        "question": "What is the name of the rain god in the story?",
        "options": ["Tezcatlipoca", "Quetzalcoatl", "Tlaloc", "Smoking Mirror"],
        "answer": "Tlaloc"
      },
      {
        "question": "What has been stolen from Tlaloc that is causing the storms?",
        "options": ["His mirror", "His crown", "His lightning bolt", "His temple"],
        "answer": "His lightning bolt"
      },
      {
        "question": "What is Tezcatlipoca also known as?",
        "options": ["Rain God", "Smoking Mirror", "Lightning Lord", "Storm Bringer"],
        "answer": "Smoking Mirror"
      },
      {
        "question": "What type of animal form does Tezcatlipoca take?",
        "options": ["Eagle", "Serpent", "Jaguar", "Butterfly"],
        "answer": "Jaguar"
      },
      {
        "question": "What is the name of the girl who helps Emma and Martín in the magical world?",
        "options": ["Nelli", "Carmela", "Victoria", "Beatriz"],
        "answer": "Nelli"
      },
      {
        "question": "What is Nelli's grandmother called?",
        "options": ["Abuela", "Cihtli", "Mami", "Nana"],
        "answer": "Cihtli"
      },
      {
        "question": "What object does Martín treasure that was supposed to bring good luck?",
        "options": ["A jade bracelet", "A maneki-neko (Japanese cat statue)", "A silver coin", "A crystal pendant"],
        "answer": "A maneki-neko (Japanese cat statue)"
      },
      {
        "question": "What does Emma wear around her neck that has magical properties?",
        "options": ["A jade necklace", "A silver chain", "An obsidian necklace", "A golden amulet"],
        "answer": "An obsidian necklace"
      },
      {
        "question": "What creates the magical archways that transport the characters?",
        "options": ["Tlaloc's storms", "Emma's necklace activating", "The book glowing", "Tezcatlipoca's mirror"],
        "answer": "Emma's necklace activating"
      },
      {
        "question": "What gift does Abuela give Martín before leaving?",
        "options": ["A book", "An abalone shell", "A wooden flute", "A painted mask"],
        "answer": "An abalone shell"
      },
      {
        "question": "What does the message on Martín's shell say?",
        "options": ["Magic awaits you", "Beauty is sometimes hard to find, unless you know where to look for it", "Home is where the heart is", "Adventure calls to the brave"],
        "answer": "Beauty is sometimes hard to find, unless you know where to look for it"
      },
      {
        "question": "What does Nelli's brother Manauia create from the abalone shell?",
        "options": ["A magical mirror", "A beautiful necklace for Tezcatlipoca", "A ceremonial mask", "A lightning rod"],
        "answer": "A beautiful necklace for Tezcatlipoca"
      },
      {
        "question": "How do the children \"charge\" Tlaloc to give him energy?",
        "options": ["They perform a rain dance", "They place their hands on his stone head", "They give him the lightning bolt", "They sing ancient songs"],
        "answer": "They place their hands on his stone head"
      },
      {
        "question": "What is the name of Emma and Martín's home city in Mexico?",
        "options": ["Mexico City", "Texcoco", "Cuernavaca", "Tenochtitlan"],
        "answer": "Cuernavaca"
      },
      {
        "question": "Why is Cuernavaca called \"the City of the Eternal Spring\"?",
        "options": ["It has many flowers", "It has springlike weather all year", "It was built near a spring", "It has eternal youth magic"],
        "answer": "It has springlike weather all year"
      },
      {
        "question": "What does \"Tlaloc\" mean in Nahuatl?",
        "options": ["Rain Maker", "Storm Bringer", "He Who Makes Things Sprout", "Lightning God"],
        "answer": "He Who Makes Things Sprout"
      },
      {
        "question": "At the beginning of the story, what are Emma and Martín doing in Abuela's kitchen?",
        "options": ["Cooking dinner", "Packing boxes", "Eating chocolate and churros", "Reading books"],
        "answer": "Eating chocolate and churros"
      },
      {
        "question": "What promise does Tlaloc make to Nelli's village at the end?",
        "options": ["He will never make it rain again", "He will guard their village with special care", "He will give them magical powers", "He will move his temple there"],
        "answer": "He will guard their village with special care"
      }
    ]
  },
  {
    "book_id": "004",
    "title": "It came from the trees",
    "author": "Ally Russell",
    "questions": [
      {
        "question": "What scout organization does Jenna initially join with her best friend Reese?",
        "options": ["Owlet Scouts", "Cottontail Scouts", "Wilderness Scouts", "Pine Tree Scouts"],
        "answer": "Cottontail Scouts"
      },
      {
        "question": "What does Jenna first spot watching them from the trees during their hike?",
        "options": ["A black bear", "A park ranger", "A large, mysterious creature", "A lost hiker"],
        "answer": "A large, mysterious creature"
      },
      {
        "question": "How does Reese disappear from their tent?",
        "options": ["She runs away after fighting with the troop leader", "She gets lost looking for the bathroom", "A creature breaks into their tent and takes her", "She falls into a hidden cave"],
        "answer": "A creature breaks into their tent and takes her"
      },
      {
        "question": "What do the police and adults initially believe happened to Reese?",
        "options": ["She was taken by a wild animal", "She ran away from camp", "She got lost in the woods", "She was kidnapped by a person"],
        "answer": "She ran away from camp"
      },
      {
        "question": "What is the name of the blog that helps Jenna understand what she encountered?",
        "options": ["Wilderness Mysteries", "It Came from the Trees", "Forest Creature Reports", "Missing in the Woods"],
        "answer": "It Came from the Trees"
      },
      {
        "question": "What scout organization does Jenna join for her second camping trip?",
        "options": ["Cottontail Scouts", "Forest Rangers", "Owlet Scouts", "Adventure Scouts"],
        "answer": "Owlet Scouts"
      },
      {
        "question": "Who becomes Jenna's closest friend among the new scouts?",
        "options": ["Ana", "Ashley", "Rosie", "Norrie"],
        "answer": "Norrie"
      },
      {
        "question": "What disturbing signs do the new scouts find that indicate they're being stalked?",
        "options": ["Human footprints only", "Large footprints, claw marks, and strange sounds", "Broken camping equipment", "Written messages on trees"],
        "answer": "Large footprints, claw marks, and strange sounds"
      },
      {
        "question": "What does Jenna secretly do to try to help Reese?",
        "options": ["Leaves food caches and pink chalk marks on trees", "Builds signal fires every night", "Sends radio messages", "Leaves written notes in bottles"],
        "answer": "Leaves food caches and pink chalk marks on trees"
      },
      {
        "question": "What happens when the creature stalks their camp at night?",
        "options": ["It steals their food and leaves", "It makes threatening sounds and tries to get into their tent", "It attacks them immediately", "It just watches from a distance"],
        "answer": "It makes threatening sounds and tries to get into their tent"
      },
      {
        "question": "What disturbing discovery do they make in the creature's territory?",
        "options": ["Human bones scattered around", "A dead coyote hanging in a tree", "An abandoned cabin", "Old camping equipment"],
        "answer": "A dead coyote hanging in a tree"
      },
      {
        "question": "What happens to Troop Leader Stacy during the creature's daylight attack?",
        "options": ["She's taken by the creature", "She breaks her leg and becomes stranded", "She successfully fights off the creature", "She runs away in fear"],
        "answer": "She breaks her leg and becomes stranded"
      },
      {
        "question": "What does Jenna finally reveal to her fellow scouts when they're trapped?",
        "options": ["That she's actually older than she claims", "That she knows the way out of the woods", "The truth about Reese's disappearance and the creature", "That she's related to a park ranger"],
        "answer": "The truth about Reese's disappearance and the creature"
      },
      {
        "question": "How do the scouts successfully fight the creature?",
        "options": ["They use guns borrowed from rangers", "They hide until it goes away", "They use improvised weapons and set it on fire", "They call for help on a radio"],
        "answer": "They use improvised weapons and set it on fire"
      },
      {
        "question": "Who arrives to rescue them the next morning?",
        "options": ["Their parents only", "Park rangers with a rescue team", "The police", "A helicopter crew"],
        "answer": "Park rangers with a rescue team"
      },
      {
        "question": "What is suspicious about one of the men who comes with the rescue team?",
        "options": ["He's wearing the wrong uniform", "He's the same man who followed them in a pickup truck earlier", "He claims to be Jenna's relative", "He's carrying weapons"],
        "answer": "He's the same man who followed them in a pickup truck earlier"
      },
      {
        "question": "What happens during the creature's final attack near the van?",
        "options": ["The creature successfully takes one of the scouts", "The united scouts scare it away together", "The rangers shoot and kill it", "It retreats when it sees the adults"],
        "answer": "The united scouts scare it away together"
      },
      {
        "question": "How does Jenna's family finally react to her story?",
        "options": ["They still don't believe her", "They believe her after witnessing the creature themselves", "They think she's having nightmares", "They send her to therapy"],
        "answer": "They believe her after witnessing the creature themselves"
      },
      {
        "question": "What is revealed about Reese's fate at the end?",
        "options": ["She's found dead in the woods", "She's never found", "She's found alive after surviving alone for weeks", "She's found living with a family who took her in"],
        "answer": "She's found alive after surviving alone for weeks"
      },
      {
        "question": "How did Reese ultimately find her way to safety?",
        "options": ["She remembered the trail back to camp", "She followed a river to civilization", "She followed Jenna's pink chalk trail markers", "She was rescued by other campers"],
        "answer": "She followed Jenna's pink chalk trail markers"
      }
    ]
  },
  {
    "book_id": "011",
    "title": "Dona Quixote: Rise of the Knight Quiz",
    "questions": [
      {
        "question": "How did Lucia's Abuelo save his sister from el sombrerón?",
        "options": ["He fought the creature with a sword", "He cut off her hair", "He gave the creature gold coins", "He chanted a magical spell"],
        "answer": "He cut off her hair"
      },
      {
        "question": "What is the name of Lucia's noble donkey steed?",
        "options": ["Pedro", "Thunder", "Rocky", "Santiago"],
        "answer": "Rocky"
      },
      {
        "question": "Why is Lucia's family worried about Abuela being discovered by the mayor?",
        "options": ["She owes money to the town", "She's not a legal citizen yet", "She's been practicing magic", "She's wanted by the police"],
        "answer": "She's not a legal citizen yet"
      },
      {
        "question": "According to the story, who originally owned Abuelo's lance, helmet, and shield?",
        "options": ["A famous Spanish conquistador", "Lucia's great-grandfather", "Alonso Quijano Mancha (Don Quixote)", "A legendary Mexican knight"],
        "answer": "Alonso Quijano Mancha (Don Quixote)"
      },
      {
        "question": "What is Rule Number 8 of the Knight's Code that Sandro adds?",
        "options": ["Always tell the truth", "You must always trust and listen to your best friend", "Never retreat from battle", "Protect the innocent"],
        "answer": "You must always trust and listen to your best friend"
      },
      {
        "question": "What is Rule Number 2 of the Knight's Code?",
        "options": ["Always be brave in the face of danger", "Thous shalt support and protect they family and friends", "Never lie or deceive others", "Honor your elders"],
        "answer": "Thous shalt support and protect they family and friends"
      },
      {
        "question": "What physical reaction does the mayor cause in Lucia?",
        "options": ["She gets dizzy", "She feels cold", "She gets a bad feeling in her tummy", "She gets a headache"],
        "answer": "She gets a bad feeling in her tummy"
      },
      {
        "question": "What kind of creature is the mayor revealed to be?",
        "options": ["A vampire", "A shapeshifter who takes the form of a jaguar", "A werewolf", "A demon"],
        "answer": "A shapeshifter who takes the form of a jaguar"
      },
      {
        "question": "Who is La Mujer de Blanco in relation to Lucia?",
        "options": ["Her long-lost aunt", "A spirit who pretends to be her friend", "Her grandmother's ghost", "A helpful witch"],
        "answer": "A spirit who pretends to be her friend"
      },
      {
        "question": "What did people used to call Lucia's Abuelo?",
        "options": ["Abuelo Fuerte (Strong Grandfather)", "Abuelo Sabio (Wise Grandfather)", "Abuelo Loco (Crazy Grandfather)", "Abuelo Valiente (Brave Grandfather)"],
        "answer": "Abuelo Loco (Crazy Grandfather)"
      },
      {
        "question": "What creatures have actually been dumping out people's trash, not raccoons?",
        "options": ["Goblins", "Chaneques (magical pixies)", "Sprites", "Gremlins"],
        "answer": "Chaneques (magical pixies)"
      },
      {
        "question": "What is a Sisimito described as?",
        "options": ["A bird-like creature with human hands", "A snake with legs", "A gorilla-like creature with a human face, fur, and backwards feet", "A cat with wings"],
        "answer": "A gorilla-like creature with a human face, fur, and backwards feet"
      },
      {
        "question": "How does Sandro stop the Sisimito?",
        "options": ["He sings to it", "He tricks it with food", "He dancing, causing it to trip and fall", "He uses magic"],
        "answer": "He dancing, causing it to trip and fall"
      },
      {
        "question": "What is the true purpose of the Chaneques?",
        "options": ["They're thieves stealing valuable items", "They're guardians of the environment sorting recyclables", "They're messengers from the spirit world", "They're protectors of buried treasure"],
        "answer": "They're guardians of the environment sorting recyclables"
      },
      {
        "question": "What do Duendes eat, and what do they do for children?",
        "options": ["Flowers and leaves; they grant wishes", "Termites, ants, and toenail clippings; they watch out and protect children", "Fruits and vegetables; they teach them magic", "Nothing; they're invisible spirits"],
        "answer": "Termites, ants, and toenail clippings; they watch out and protect children"
      },
      {
        "question": "What kind of creature is the pitmaster at Famous Barbeque BBQ?",
        "options": ["A chupacabra", "A huay chivo (part goat)", "A vampire", "A wendigo"],
        "answer": "A huay chivo (part goat)"
      },
      {
        "question": "What are huay chivos' best friends, and what are they afraid of?",
        "options": ["Dogs; spiders", "Birds; water", "Cats; butterflies", "Rabbits; loud noises"],
        "answer": "Cats; butterflies"
      },
      {
        "question": "What is the mayor's name, and what happened to make him evil?",
        "options": ["Carlos; he was cursed by a witch", "Miguel; he sold his soul", "Jim; he met La Mujer de Blanco", "Roberto; he was possessed by a demon"],
        "answer": "Jim; he met La Mujer de Blanco"
      },
      {
        "question": "What is the arch that La Mujer de Blanco forces the mayor to build really called?",
        "options": ["El Arco del Destino (The Arch of Destiny)", "El Arco de Pesadilla (The Nightmare Arch)", "El Arco de la Muerte (The Arch of Death)", "El Arco del Mal (The Arch of Evil)"],
        "answer": "El Arco de Pesadilla (The Nightmare Arch)"
      },
      {
        "question": "Who is La Mujer de Blanco revealed to be?",
        "options": ["Moctezuma's daughter", "A fallen angel", "The Cihuacóatl (serpent goddess)", "The ghost of a Spanish queen"],
        "answer": "The Cihuacóatl (serpent goddess)"
      }
    ]
  },
  {
    "book_id": "008",
    "title": "Tales From Cabin 23: The Boo Hag Flex Quiz",
    "questions": [
      {
        "question": "What did the witch command Elaina to do?",
        "options": ["Dance around a fire", "Listen to a story", "Find a magical herb", "Sing an ancient song"],
        "answer": "Listen to a story"
      },
      {
        "question": "What was special about Tasha's notebook?",
        "options": ["It was enchanted with protective spells", "It contained her grandmother's recipes", "It was the last thing her mom had given her", "It was over 100 years old"],
        "answer": "It was the last thing her mom had given her"
      },
      {
        "question": "What kind of establishment was The Goal Line?",
        "options": ["A coffee shop", "A sports bar", "A bookstore", "A movie theater"],
        "answer": "A sports bar"
      },
      {
        "question": "What book was Tasha reading?",
        "options": ["A Guide to Southern Myths and Legends", "Ghost Stories of the South", "Witchcraft and Magic", "Tales of the Supernatural"],
        "answer": "A Guide to Southern Myths and Legends"
      },
      {
        "question": "What disturbing thing fell out from under the sheet?",
        "options": ["A snake", "A hand", "A skull", "A bloody knife"],
        "answer": "A hand"
      },
      {
        "question": "What was the name of Ms. Greta's dog?",
        "options": ["Bruno", "Fredo", "Max", "Charlie"],
        "answer": "Fredo"
      },
      {
        "question": "What did Ellie show Tasha?",
        "options": ["A dead bird", "A dead cat", "A dead fish", "A dead mouse"],
        "answer": "A dead cat"
      },
      {
        "question": "Where did Tasha bump into Kim?",
        "options": ["At the grocery store", "At school", "At the library", "At the park"],
        "answer": "At the library"
      },
      {
        "question": "What was unusual about how Tasha and her mom ordered at restaurants?",
        "options": ["They always shared one meal", "They always started with dessert", "They never ordered drinks", "They always asked for the check first"],
        "answer": "They always started with dessert"
      },
      {
        "question": "According to the story, what did blinking lights on the water at night mean?",
        "options": ["A ship was in distress", "Fishermen were working late", "A murder ghost was looking for something", "The coast guard was patrolling"],
        "answer": "A murder ghost was looking for something"
      },
      {
        "question": "What did the store clerk mistakenly think about Kim?",
        "options": ["That she was Tasha's sister", "That she was Tasha's teacher", "That she was Tasha's mother", "That she was Tasha's aunt"],
        "answer": "That she was Tasha's mother"
      },
      {
        "question": "What do Boo Hags do when they go hunting?",
        "options": ["They turn invisible", "They take off their skin", "They grow claws", "They fly through the air"],
        "answer": "They take off their skin"
      },
      {
        "question": "What did the girls find where John had been kneeling?",
        "options": ["Something like fish skin", "Strange footprints", "A pool of blood", "Mysterious symbols"],
        "answer": "Something like fish skin"
      },
      {
        "question": "What habit did Mrs. Washington have?",
        "options": ["She often fell asleep reading books", "She often fell asleep in front of the TV", "She often fell asleep in her garden", "She often fell asleep at the kitchen table"],
        "answer": "She often fell asleep in front of the TV"
      },
      {
        "question": "What pattern was on Tasha's new dress?",
        "options": ["A mermaid swimming", "A dolphin jumping", "An octopus reading", "A whale singing"],
        "answer": "An octopus reading"
      },
      {
        "question": "How can someone defeat a Boo Hag?",
        "options": ["By burning sage around them", "By saying a special prayer", "By making sure it can't put its skin back on", "By throwing salt at them"],
        "answer": "By making sure it can't put its skin back on"
      },
      {
        "question": "Where did Tasha go with John and Kim?",
        "options": ["Charleston", "Savannah", "Atlanta", "Macon"],
        "answer": "Savannah"
      },
      {
        "question": "How did the creature move in the room?",
        "options": ["It slithered like a snake", "It hopped like a frog", "It climbed onto the ceiling like a giant spider", "It floated like a ghost"],
        "answer": "It climbed onto the ceiling like a giant spider"
      },
      {
        "question": "What did the girls find in the closet that made them suspicious of John?",
        "options": ["Kim's clothes", "Kim's skin", "Kim's diary", "Kim's jewelry"],
        "answer": "Kim's skin"
      },
      {
        "question": "What happens if beans are scattered in front of a witch?",
        "options": ["She will become paralyzed", "She will disappear immediately", "She will have to pick them up and count them", "She will lose her magical powers"],
        "answer": "She will have to pick them up and count them"
      }
    ]
  },
  {
    "book_id": "013",
    "title": "The Sherlock Society by James Ponti Quiz",
    "questions": [
      {
        "question": "What did Ms. Compos do with the library?",
        "options": ["She turned it into an escape room", "She converted it into a computer lab", "She made it into a study hall", "She transformed it into a detective museum"],
        "answer": "She turned it into an escape room"
      },
      {
        "question": "According to the story, when does information go from trivial to significant?",
        "options": ["When you have enough facts", "When you understand the meaning behind it", "When you can prove it's true", "When you share it with others"],
        "answer": "When you understand the meaning behind it"
      },
      {
        "question": "Why is Miami nicknamed the \"Magic City\"?",
        "options": ["Because of its beautiful beaches", "Because of its nightlife", "Because Northerners were tricked into buying land before it was even a city", "Because of its art scene"],
        "answer": "Because Northerners were tricked into buying land before it was even a city"
      },
      {
        "question": "What is a ventanita?",
        "options": ["A small balcony", "A type of window shade", "A Cuban dance", "A type of Cuban café where you order food from the sidewalk"],
        "answer": "A type of Cuban café where you order food from the sidewalk"
      },
      {
        "question": "Who was revealed to be \"Desperate Dan\"?",
        "options": ["Alex and Zoe's mother", "Their grandfather", "Their teacher", "A local criminal"],
        "answer": "Alex and Zoe's mother"
      },
      {
        "question": "What did Grandpa suggest they use to find unsolved mysteries?",
        "options": ["The internet", "His old files", "Library archives", "Police reports"],
        "answer": "His old files"
      },
      {
        "question": "What are the five Ws in detective work?",
        "options": ["Who, what, where, when, and why", "Who, what, where, when, and which", "Who, what, where, when, and with", "Who, what, where, when, and will"],
        "answer": "Who, what, where, when, and why"
      },
      {
        "question": "Who was featured in the Pizza Impossible advertisement?",
        "options": ["Alex", "Zoe", "Yadi", "Lina"],
        "answer": "Yadi"
      },
      {
        "question": "Where did they find a hidden map?",
        "options": ["Under a desk drawer", "Behind a picture frame", "In the spine of the botany book", "Inside a computer"],
        "answer": "In the spine of the botany book"
      },
      {
        "question": "What is Alligator Alley?",
        "options": ["A tourist attraction", "A street in Miami", "A nature preserve", "The interstate that runs through the Everglades"],
        "answer": "The interstate that runs through the Everglades"
      },
      {
        "question": "What is the Skunk Ape?",
        "options": ["Florida's version of Bigfoot", "A type of swamp animal", "A local urban legend about a ghost", "A character in local folklore"],
        "answer": "Florida's version of Bigfoot"
      },
      {
        "question": "What disturbing discovery did they make in the slough?",
        "options": ["Toxic waste", "Dead animals", "Stolen goods", "Ancient artifacts"],
        "answer": "Dead animals"
      },
      {
        "question": "What kind of environment did the wet lab maintain?",
        "options": ["Desert-like conditions", "Arctic temperatures", "A tropical environment", "Mountain climate"],
        "answer": "A tropical environment"
      },
      {
        "question": "Why did Zoe order chicken fingers at the seafood restaurant?",
        "options": ["She was allergic to seafood", "She didn't like the other options", "She was vegetarian", "To be difficult"],
        "answer": "To be difficult"
      },
      {
        "question": "What did they examine to find more evidence?",
        "options": ["Drone footage", "Security camera recordings", "Witness statements", "Police reports"],
        "answer": "Drone footage"
      },
      {
        "question": "What excuse did they use to talk to Morris Kane?",
        "options": ["They were students doing research", "They pretended to be making a documentary", "They said they were tourists", "They claimed to be reporters"],
        "answer": "They pretended to be making a documentary"
      },
      {
        "question": "What mistake did Lina make during their investigation?",
        "options": ["She didn't turn off the microphone", "She forgot to bring the camera", "She lost the evidence", "She called the wrong number"],
        "answer": "She didn't turn off the microphone"
      },
      {
        "question": "What did Zoe accidentally leave behind?",
        "options": ["Her phone", "Her mask and flippers on Kane's sailboat", "Her notebook", "Her camera"],
        "answer": "Her mask and flippers on Kane's sailboat"
      },
      {
        "question": "Why did the Secret Service give them immunity?",
        "options": ["They were minors", "They cooperated with the investigation", "They worked out where the counterfeiting plates were hidden", "They promised to stay quiet"],
        "answer": "They worked out where the counterfeiting plates were hidden"
      },
      {
        "question": "Where did they go for their family vacation?",
        "options": ["Orlando", "Tampa", "Jacksonville", "The Keys"],
        "answer": "The Keys"
      }
    ]
  },
  {
  "book_id": "007",
  "questions": [
    {
      "question": "What problem do Weatherby and Skip encounter with their regatta equipment?",
      "options": [
        "Their sails are too large",
        "Their boat has a leak",
        "Their mast is broken",
        "Their anchor is missing"
      ],
      "answer": "Their sails are too large"
    },
    {
      "question": "Who is Weatherby paired with at the first sailing practice?",
      "options": [
        "Harper",
        "Teddie Covington",
        "Skip",
        "Jack"
      ],
      "answer": "Teddie Covington"
    },
    {
      "question": "Where are anagrams of passwords found?",
      "options": [
        "On tree trunks",
        "In old books",
        "Engraved on the bottom of rocks",
        "Written on walls"
      ],
      "answer": "Engraved on the bottom of rocks"
    },
    {
      "question": "How was the money for the trip stolen?",
      "options": [
        "From a school safe",
        "By pickpocketing",
        "From a cash register",
        "By hacking into the bank's system"
      ],
      "answer": "By hacking into the bank's system"
    },
    {
      "question": "What does the code 'T >T/T >T' mean?",
      "options": [
        "Truth before Trust, Tradition before Truth",
        "Trust before Truth, Truth before Tradition",
        "Time before Trust, Truth before Time",
        "Trust before Time, Tradition before Trust"
      ],
      "answer": "Trust before Truth, Truth before Tradition"
    },
    {
      "question": "What is distinctive about how Jack ties knots?",
      "options": [
        "He always ties a bowline with extra loops",
        "He uses a clove hitch exclusively",
        "He always ties a sheet bend with a double loop",
        "He never uses proper sailing knots"
      ],
      "answer": "He always ties a sheet bend with a double loop"
    },
    {
      "question": "Why can't Boston participate in the Interconference Regatta?",
      "options": [
        "Their team was disqualified",
        "They don't have enough sailors",
        "Their boats had been vandalized",
        "Their coach quit"
      ],
      "answer": "Their boats had been vandalized"
    },
    {
      "question": "What blocks the school's gates?",
      "options": [
        "Construction equipment",
        "Protesters and police cars",
        "Reporters and news vans",
        "Fallen trees"
      ],
      "answer": "Reporters and news vans"
    },
    {
      "question": "What do we learn about Harper's financial situation?",
      "options": [
        "She comes from a wealthy family",
        "She is also on a scholarship",
        "She works part-time to pay tuition",
        "Her parents pay full tuition"
      ],
      "answer": "She is also on a scholarship"
    },
    {
      "question": "How did Harper get her cool stuff?",
      "options": [
        "Her parents bought it for her",
        "She saved up money to buy it",
        "Teddie introduced her to thrifting",
        "She borrowed it from friends"
      ],
      "answer": "Teddie introduced her to thrifting"
    },
    {
      "question": "What is Jack's alibi?",
      "options": [
        "He was at home studying",
        "He was at the library",
        "He was at the club with Prescott",
        "He was visiting family"
      ],
      "answer": "He was at the club with Prescott"
    },
    {
      "question": "What does Iris discover on her mother's computer?",
      "options": [
        "A non-disclosure agreement",
        "Secret emails",
        "Bank statements",
        "School records"
      ],
      "answer": "A non-disclosure agreement"
    },
    {
      "question": "Who used to be friends with Yates Hunt?",
      "options": [
        "Weatherby",
        "Jack",
        "Harper",
        "Skip"
      ],
      "answer": "Skip"
    },
    {
      "question": "What are the five students accused of being?",
      "options": [
        "Cheaters, Liars, Thieves, Bullies, and Fakes",
        "A Liar, a Thief, a Fake, a Sneak and a Cheat",
        "Criminals, Vandals, Hackers, Forgers, and Spies",
        "Troublemakers, Rule-breakers, Rebels, Outcasts, and Misfits"
      ],
      "answer": "A Liar, a Thief, a Fake, a Sneak and a Cheat"
    },
    {
      "question": "What boat do they take to Hart Isle?",
      "options": [
        "The Huntress",
        "The Explorer",
        "The Navigator",
        "The Seeker"
      ],
      "answer": "The Huntress"
    },
    {
      "question": "What is the code for the zip line?",
      "options": [
        "Harper",
        "Skip",
        "Jack",
        "Weatherby"
      ],
      "answer": "Weatherby"
    },
    {
      "question": "Who actually sent them to the island?",
      "options": [
        "Last Heir",
        "Harper",
        "A mysterious stranger",
        "The school administration"
      ],
      "answer": "Harper"
    },
    {
      "question": "What is Jack's relationship to Weatherby?",
      "options": [
        "They are brothers",
        "Jack is Weatherby's cousin",
        "They are best friends",
        "They are unrelated"
      ],
      "answer": "Jack is Weatherby's cousin"
    },
    {
      "question": "Who was the letter really meant for?",
      "options": [
        "Weatherby",
        "Harper",
        "Jack",
        "Skip"
      ],
      "answer": "Jack"
    },
    {
      "question": "What do 'Last Heir' and 'Hart Isle' have in common?",
      "options": [
        "They are both boat names",
        "They are both anagrams of 'The Liars'",
        "They are both locations in the story",
        "They are both character nicknames"
      ],
      "answer": "They are both anagrams of 'The Liars'"
    }
  ]
},
  {
    "book_id": "010",
    "title": "Invisible Isabel by Sally J. Pla Quiz",
    "questions": [
      {
        "question": "What random thought did Isabel have about squirrels?",
        "options": ["She wondered what squirrels did with their tails when they sat on chairs", "She wondered if squirrels could swim", "She wondered why squirrels buried nuts", "She wondered if squirrels could see colors"],
        "answer": "She wondered what squirrels did with their tails when they sat on chairs"
      },
      {
        "question": "How did Monica Hicks view herself?",
        "options": ["As a misunderstood artist", "As the brilliant queen of everything", "As a future scientist", "As a natural leader"],
        "answer": "As the brilliant queen of everything"
      },
      {
        "question": "What special event did the Beanes have on Sunday?",
        "options": ["A graduation celebration", "A birthday party", "A big family party", "A holiday dinner"],
        "answer": "A big family party"
      },
      {
        "question": "What helped calm Isabel's worry moths?",
        "options": ["Deep breathing exercises", "Listening to music", "Drawing pictures", "When they were rocked"],
        "answer": "When they were rocked"
      },
      {
        "question": "What was notable about Monica's behavior toward others?",
        "options": ["She was kind to everyone", "She ignored most people", "She was competitive with everyone", "She was only nice to people who counted"],
        "answer": "She was only nice to people who counted"
      },
      {
        "question": "What sign did Isabel put on her bedroom door?",
        "options": ["Do Not Disturb: Secret Project Underway", "Keep Out: Artist at Work", "Please Knock First", "Study Time: Do Not Enter"],
        "answer": "Do Not Disturb: Secret Project Underway"
      },
      {
        "question": "What piece of jewelry was Hayden wearing?",
        "options": ["A silver bracelet", "A tiny silver horseshoe", "A gold necklace", "A friendship ring"],
        "answer": "A tiny silver horseshoe"
      },
      {
        "question": "How did the girls know their picture gifts were from Isabel?",
        "options": ["Isabel signed her name on them", "They recognized her handwriting", "She had drawn Monica holding her", "Isabel told them directly"],
        "answer": "She had drawn Monica holding her"
      },
      {
        "question": "Where did Isabel's tears fall during class?",
        "options": ["On her desk", "On her backpack", "Onto her maths worksheet", "On her textbook"],
        "answer": "Onto her maths worksheet"
      },
      {
        "question": "How was Isabel's new pain described?",
        "options": ["Dull and aching", "Throbbing and constant", "Cold and numbing", "Sharp and fiery"],
        "answer": "Sharp and fiery"
      },
      {
        "question": "Who called for emergency medical help?",
        "options": ["Nurse Ito", "Mrs. Pickel", "Isabel's mother", "The school principal"],
        "answer": "Nurse Ito"
      },
      {
        "question": "What were the other girls worried about regarding Isabel's illness?",
        "options": ["That she might not come back to school", "That you could make someone sick by hurting their feelings", "That they would get in trouble", "That she would be angry with them"],
        "answer": "That you could make someone sick by hurting their feelings"
      },
      {
        "question": "What type of flowers were Monica's mother's favorite?",
        "options": ["Red roses", "Purple violets", "Gold chrysanthemums", "White daisies"],
        "answer": "Gold chrysanthemums"
      },
      {
        "question": "What does MRI stand for?",
        "options": ["Medical radiation imaging", "Multiple range inspection", "Molecular research investigation", "Magnetic resonance imaging"],
        "answer": "Magnetic resonance imaging"
      },
      {
        "question": "What did Mrs. Pickel offer the class during recess?",
        "options": ["They could stay in to make get-well cards", "They could have extra free time", "They could watch a movie", "They could have a class party"],
        "answer": "They could stay in to make get-well cards"
      },
      {
        "question": "What medical procedure did Dr. Hicks perform on Isabel?",
        "options": ["He set her broken arm", "He removed her appendix", "He treated her concussion", "He performed eye surgery"],
        "answer": "He removed her appendix"
      },
      {
        "question": "What changed about Isabel's social situation in the hospital?",
        "options": ["She became more anxious", "She felt more lonely than ever", "She wasn't invisible anymore", "She made new enemies"],
        "answer": "She wasn't invisible anymore"
      },
      {
        "question": "What important information did Dr. Hicks share with Isabel about herself?",
        "options": ["She was extremely intelligent", "She had a rare medical condition", "She needed to change schools", "She was neurodivergent"],
        "answer": "She was neurodivergent"
      },
      {
        "question": "Who helped Isabel develop coping strategies?",
        "options": ["Counselor Wanda", "Dr. Hicks", "Nurse Ito", "Mrs. Pickel"],
        "answer": "Counselor Wanda"
      },
      {
        "question": "What did Counselor Wanda help Isabel create to manage her worries?",
        "options": ["A list of coping strategies to fight off the worry moths", "A daily schedule to reduce stress", "A journal for recording her feelings", "A meditation routine for relaxation"],
        "answer": "A list of coping strategies to fight off the worry moths"
      }
    ]
  },
  {
    "book_id": "012",
    "title": "Dog Town by Katherine Applegate & Gennifer Choldenko Quiz",
    "questions": [
      {
        "question": "What gimmick did Dogtown 2.0 introduce to the shelter?",
        "options": ["Robot dogs", "Virtual reality pet experiences", "Automated feeding machines", "Holographic displays"],
        "answer": "Robot dogs"
      },
      {
        "question": "What was Metal Head constantly doing?",
        "options": ["Charging his battery", "Reading his manual", "Playing with toys", "Watching television"],
        "answer": "Reading his manual"
      },
      {
        "question": "What made Mouse special in terms of communication?",
        "options": ["He could speak human words", "He could write messages", "He was trilingual - understanding mouse, human and dog", "He could use sign language"],
        "answer": "He was trilingual - understanding mouse, human and dog"
      },
      {
        "question": "What was Chance's particular genius with people?",
        "options": ["She could predict their emotions", "She could perform amazing tricks", "She could find lost objects", "She made everyone feel like her favourite"],
        "answer": "She made everyone feel like her favourite"
      },
      {
        "question": "How did Quinn smell to the dogs?",
        "options": ["Like buttered toast with a touch of toothpaste", "Like flowers and soap", "Like peanut butter and jelly", "Like coffee and vanilla"],
        "answer": "Like buttered toast with a touch of toothpaste"
      },
      {
        "question": "Why did Buster chew Quinn's book?",
        "options": ["He was teething and needed something to gnaw", "He thought Geraldine needed help", "He was angry about being ignored", "He was trying to get attention"],
        "answer": "He thought Geraldine needed help"
      },
      {
        "question": "How do dogs make promises to each other?",
        "options": ["By barking in a special way", "By wagging their tails", "By touching noses", "By pawing the ground"],
        "answer": "By touching noses"
      },
      {
        "question": "What was a \"tail-out\" at the shelter?",
        "options": ["A special grooming technique", "A way to exercise the dogs", "A feeding schedule", "All the dogs turned away from patrons so they wouldn't be adopted"],
        "answer": "All the dogs turned away from patrons so they wouldn't be adopted"
      },
      {
        "question": "According to the story, why do dogs steal socks?",
        "options": ["To understand a person by the way their feet smell", "Because they like the texture", "To play tug-of-war games", "Because they're bored"],
        "answer": "To understand a person by the way their feet smell"
      },
      {
        "question": "What food did Metal Head share with Chance and Mouse?",
        "options": ["Hot dogs", "Cheese sandwiches", "Peanut butter cookies", "Chicken nuggets"],
        "answer": "Cheese sandwiches"
      },
      {
        "question": "Why didn't Johnny want Metal Head anymore?",
        "options": ["The robot was broken", "His parents said no more pets", "He thought he was too old for a toy dog", "He preferred real dogs"],
        "answer": "He thought he was too old for a toy dog"
      },
      {
        "question": "Where did Professor Bessel and Jessie go together?",
        "options": ["On a research trip to Japan", "To visit family in England", "On a vacation to France", "On a sabbatical to Italy"],
        "answer": "On a sabbatical to Italy"
      },
      {
        "question": "What tragic accident happened to Chance?",
        "options": ["The baby-sitter's boyfriend ran over her in his truck", "She fell down a steep cliff", "She was hit by a delivery van", "She was injured by another dog"],
        "answer": "The baby-sitter's boyfriend ran over her in his truck"
      },
      {
        "question": "What happened to Quinn regarding the reading buddies program?",
        "options": ["She was promoted to head volunteer", "She was suspended, which meant temporary removal", "She was transferred to a different location", "She was given additional responsibilities"],
        "answer": "She was suspended, which meant temporary removal"
      },
      {
        "question": "Where did Chance, Metal Head, and Mouse get accidentally trapped?",
        "options": ["In the shelter's storage room", "In the car boot", "In a delivery truck", "In the veterinarian's office"],
        "answer": "In the car boot"
      },
      {
        "question": "What did Mouse retrieve at the fish market?",
        "options": ["A whole fish", "Some seaweed", "A piece of shrimp", "A crab shell"],
        "answer": "A piece of shrimp"
      },
      {
        "question": "What harsh reality did Metal Head tell Chance about her situation?",
        "options": ["That shelter life was temporary", "That she needed more training", "That her humans wouldn't be searching for a three-legged dog", "That robot dogs were replacing real ones"],
        "answer": "That her humans wouldn't be searching for a three-legged dog"
      },
      {
        "question": "According to the story, what happens when a metal dog misbehaves?",
        "options": ["They blame the manufacturer", "They need to be reprogrammed", "They get sent back to the factory", "They lose their warranty"],
        "answer": "They blame the manufacturer"
      },
      {
        "question": "Who took Chance's place under the poker table?",
        "options": ["Bear", "Mouse", "Metal Head", "Another shelter dog"],
        "answer": "Bear"
      },
      {
        "question": "What did the note under Chance's collar say?",
        "options": ["Every dog deserves a loving home", "Friendship knows no boundaries", "Hope is the thing with feathers", "The heart is a muscle. It grows stronger the more you use it"],
        "answer": "The heart is a muscle. It grows stronger the more you use it"
      }
    ]
  }
]

// BULK SETUP - OVERWRITES ALL QUIZZES COLLECTION FOR CURRENT YEAR
const setupAllBookQuizzes = async () => {
  try {
    console.log(`🎯 Setting up book quizzes for ${CURRENT_ACADEMIC_YEAR}...`)
    
    if (CURRENT_YEAR_BOOK_QUIZZES.length === 0) {
      console.log('⚠️ No book quizzes to add in CURRENT_YEAR_BOOK_QUIZZES array')
      return {
        success: false,
        message: 'No book quizzes defined for current year'
      }
    }
    
    // Step 1: Delete ALL existing quizzes (since we completely replace each year)
    console.log('🗑️ Removing ALL existing quizzes...')
    const quizzesRef = collection(db, 'quizzes')
    const allQuizzes = await getDocs(quizzesRef)
    
    for (const quizDoc of allQuizzes.docs) {
      await deleteDoc(doc(db, 'quizzes', quizDoc.id))
      console.log(`🗑️ Deleted quiz: ${quizDoc.id}`)
    }
    
    // Step 2: Add new quizzes for current year
    let addedCount = 0
    for (const bookQuiz of CURRENT_YEAR_BOOK_QUIZZES) {
      try {
        // Use simple book_id as document ID (001, 017, 020, etc.)
        const quizDocId = bookQuiz.book_id
        
        const quizData = {
          book_id: bookQuiz.book_id,
          academicYear: CURRENT_ACADEMIC_YEAR, // 🔑 KEY: Academic year for linking
          questions: bookQuiz.questions,
          passThreshold: 7,
          cooldownHours: 24,
          createdAt: new Date(),
          createdBy: 'Admin Dashboard'
        }
        
        // Store with simple ID (017, 020, etc.)
        await setDoc(doc(db, 'quizzes', quizDocId), quizData)
        console.log(`✅ Added quiz: ${quizDocId} for academic year ${CURRENT_ACADEMIC_YEAR}`)
        
        addedCount++
        
      } catch (error) {
        console.error(`❌ Error adding quiz for book ${bookQuiz.book_id}:`, error)
      }
    }
    
    console.log(`🎉 Book quizzes setup complete! Added: ${addedCount}`)
    
    return {
      success: true,
      message: `Successfully added ${addedCount} book quizzes for ${CURRENT_ACADEMIC_YEAR}`,
      stats: {
        operation: 'bulk_setup',
        added: addedCount,
        academicYear: CURRENT_ACADEMIC_YEAR
      }
    }
    
  } catch (error) {
    console.error('❌ Error setting up book quizzes:', error)
    return {
      success: false,
      message: 'Setup failed: ' + error.message
    }
  }
}

// ADD SINGLE BOOK QUIZ
const addSingleBookQuiz = async (quizData) => {
  try {
    console.log(`➕ Adding quiz for book: ${quizData.book_id}`)
    
    // Validate required fields
    if (!quizData.book_id || !quizData.questions || quizData.questions.length === 0) {
      return {
        success: false,
        message: 'Book ID and questions are required'
      }
    }
    
    // Use simple book_id as document ID
    const quizDocId = quizData.book_id
    
    // Check if quiz already exists
    const existingQuiz = await getDoc(doc(db, 'quizzes', quizDocId))
    
    if (existingQuiz.exists()) {
      return {
        success: false,
        message: `Quiz for book ${quizData.book_id} already exists. Use setup to overwrite.`
      }
    }
    
    // Add the quiz data
    const completeQuizData = {
      book_id: quizData.book_id,
      academicYear: CURRENT_ACADEMIC_YEAR,
      questions: quizData.questions,
      passThreshold: 7,
      cooldownHours: 24,
      createdAt: new Date(),
      createdBy: 'Admin Dashboard'
    }
    
    await setDoc(doc(db, 'quizzes', quizDocId), completeQuizData)
    
    console.log(`✅ Successfully added quiz: ${quizDocId}`)
    
    return {
      success: true,
      message: `Successfully added quiz for book ${quizData.book_id}`,
      stats: {
        operation: 'single_add',
        bookId: quizData.book_id,
        questionsCount: quizData.questions.length,
        academicYear: CURRENT_ACADEMIC_YEAR,
        docId: quizDocId
      }
    }
    
  } catch (error) {
    console.error('❌ Error adding book quiz:', error)
    return {
      success: false,
      message: 'Add quiz failed: ' + error.message
    }
  }
}

// ARCHIVE PREVIOUS YEAR QUIZZES (Actually just deletes them since we replace completely)
const archivePreviousYearQuizzes = async (previousAcademicYear) => {
  try {
    console.log(`📦 Archiving (deleting) book quizzes for ${previousAcademicYear}...`)
    
    if (!previousAcademicYear) {
      return {
        success: false,
        message: 'No academic year specified for archiving'
      }
    }
    
    // Find and delete quizzes for the specified academic year
    const quizzesRef = collection(db, 'quizzes')
    const quizzesToDelete = query(quizzesRef, where('academicYear', '==', previousAcademicYear))
    const snapshot = await getDocs(quizzesToDelete)
    
    let deletedCount = 0
    
    for (const quizDoc of snapshot.docs) {
      try {
        await deleteDoc(doc(db, 'quizzes', quizDoc.id))
        console.log(`🗑️ Deleted quiz: ${quizDoc.id} (${previousAcademicYear})`)
        deletedCount++
      } catch (error) {
        console.error(`❌ Error deleting quiz ${quizDoc.id}:`, error)
      }
    }
    
    if (deletedCount === 0) {
      console.log(`⚠️ No quizzes found for ${previousAcademicYear}`)
      return {
        success: false,
        message: `No quizzes found for ${previousAcademicYear}`
      }
    }
    
    console.log(`🎉 Archive complete! Deleted ${deletedCount} quizzes from ${previousAcademicYear}`)
    
    return {
      success: true,
      message: `Successfully deleted ${deletedCount} quizzes from ${previousAcademicYear}`,
      stats: {
        operation: 'archive_year',
        deleted: deletedCount,
        academicYear: previousAcademicYear
      }
    }
    
  } catch (error) {
    console.error('❌ Error archiving book quizzes:', error)
    return {
      success: false,
      message: 'Archive failed: ' + error.message
    }
  }
}

// GET BOOK QUIZZES STATISTICS
const getBookQuizzesStats = async () => {
  try {
    const quizzesRef = collection(db, 'quizzes')
    const allQuizzes = await getDocs(quizzesRef)
    
    const stats = {
      total: 0,
      currentYear: 0,
      byYear: {},
      byBook: {}
    }
    
    allQuizzes.forEach((doc) => {
      const quiz = doc.data()
      stats.total++
      
      // Count by academic year
      const year = quiz.academicYear || 'unknown'
      stats.byYear[year] = (stats.byYear[year] || 0) + 1
      
      if (year === CURRENT_ACADEMIC_YEAR) stats.currentYear++
      
      // Count by book
      const bookId = quiz.book_id || doc.id
      stats.byBook[bookId] = (stats.byBook[bookId] || 0) + 1
    })
    
    // For compatibility with admin dashboard
    stats.active = stats.total
    stats.archived = 0
    stats.byStatus = { active: stats.total }
    
    return stats
    
  } catch (error) {
    console.error('❌ Error getting book quizzes stats:', error)
    return {
      total: 0,
      active: 0,
      archived: 0,
      currentYear: 0,
      byYear: {},
      byStatus: {},
      byBook: {}
    }
  }
}

// GET QUIZ BY BOOK ID (for student access) - Links with masterNominees
const getQuizByBookId = async (bookId, requiredAcademicYear = CURRENT_ACADEMIC_YEAR) => {
  try {
    console.log(`🔍 Looking for quiz with book_id: ${bookId}`)
    
    // Step 1: Get the quiz document
    const quizDoc = await getDoc(doc(db, 'quizzes', bookId))
    
    if (!quizDoc.exists()) {
      console.log(`❌ No quiz found with ID: ${bookId}`)
      return null
    }
    
    const quizData = quizDoc.data()
    console.log(`✅ Found quiz for book ${bookId}, academic year: ${quizData.academicYear}`)
    
    // Step 2: Verify the quiz is for the correct academic year
    if (quizData.academicYear !== requiredAcademicYear) {
      console.log(`❌ Quiz academic year (${quizData.academicYear}) doesn't match required year (${requiredAcademicYear})`)
      return null
    }
    
    // Step 3: Verify matching book exists in masterNominees with same ID, academic year, and active status
    const masterNomineesRef = collection(db, 'masterNominees')
    const bookQuery = query(
      masterNomineesRef,
      where('id', '==', bookId),
      where('academicYear', '==', requiredAcademicYear),
      where('status', '==', 'active')
    )
    
    const bookSnapshot = await getDocs(bookQuery)
    
    if (bookSnapshot.empty) {
      console.log(`❌ No active book found in masterNominees with id: ${bookId}, academicYear: ${requiredAcademicYear}`)
      return null
    }
    
    console.log(`✅ Verified matching active book exists in masterNominees`)
    
    return { id: quizDoc.id, ...quizData }
    
  } catch (error) {
    console.error(`❌ Error getting quiz for book ${bookId}:`, error)
    return null
  }
}

// GET ALL QUIZZES FOR CURRENT ACADEMIC YEAR
const getCurrentYearQuizzes = async () => {
  try {
    const quizzesQuery = query(
      collection(db, 'quizzes'),
      where('academicYear', '==', CURRENT_ACADEMIC_YEAR)
    )
    const currentQuizzes = await getDocs(quizzesQuery)
    
    const quizzes = []
    currentQuizzes.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() })
    })
    
    return quizzes
    
  } catch (error) {
    console.error('❌ Error getting current year quizzes:', error)
    return []
  }
}

// GET QUIZZES FOR SPECIFIC ACADEMIC YEAR
const getQuizzesForYear = async (academicYear) => {
  try {
    const quizzesQuery = query(
      collection(db, 'quizzes'),
      where('academicYear', '==', academicYear)
    )
    const yearQuizzes = await getDocs(quizzesQuery)
    
    const quizzes = []
    yearQuizzes.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() })
    })
    
    return quizzes
    
  } catch (error) {
    console.error(`❌ Error getting quizzes for year ${academicYear}:`, error)
    return []
  }
}

// EXPORT ALL FUNCTIONS
export {
  setupAllBookQuizzes,
  addSingleBookQuiz,
  archivePreviousYearQuizzes,
  getBookQuizzesStats,
  getQuizzesForYear,
  getCurrentYearQuizzes,
  getQuizByBookId,
  CURRENT_ACADEMIC_YEAR
}

// DEFAULT EXPORT
export default {
  setupAllBookQuizzes,
  addSingleBookQuiz,
  archivePreviousYearQuizzes,
  getBookQuizzesStats,
  getQuizzesForYear,
  getCurrentYearQuizzes,
  getQuizByBookId,
  CURRENT_ACADEMIC_YEAR
}