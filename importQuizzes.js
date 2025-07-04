// importQuizzes.js - Quiz Import Script
import { db } from './lib/firebase.js';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

// 🔥 YOUR QUIZ DATA - Replace this with your complete quiz JSON
const quizData = [
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
  }
];

// 🚀 IMPORT FUNCTION
async function importQuizzes() {
  console.log('🔥 Starting quiz import...');
  
  try {
    const batch = writeBatch(db);
    
    for (const quiz of quizData) {
      const quizRef = doc(db, 'quizzes', quiz.book_id);
      
      batch.set(quizRef, {
        bookId: quiz.book_id,
        questions: quiz.questions,
        totalQuestions: quiz.questions.length,
        
        // 🎯 YOUR QUIZ SETTINGS:
        questionsPerQuiz: 10, // Show 10 random from 20
        passThreshold: 7, // 7 correct to pass
        requiresParentCode: true, // Parent code required
        timerMinutes: 30, // 30 minute timer
        cooldownHours: 24, // 24 hour cooldown
        
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ Prepared quiz for book ${quiz.book_id}`);
    }
    
    await batch.commit();
    console.log('🎉 ALL QUIZZES IMPORTED!');
    console.log('📊 Settings: 10 questions, 7 to pass, 30min timer, 24hr cooldown');
    
  } catch (error) {
    console.error('❌ Error importing quizzes:', error);
  }
}

// 🚀 RUN THE IMPORT
// importQuizzes();  // <-- Comment this out so it doesn't auto-run