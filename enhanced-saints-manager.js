// enhanced-saints-manager.js - Flexible saint management system
import { db } from './lib/firebase'
import { collection, doc, setDoc, getDocs, getDoc, addDoc } from 'firebase/firestore'

// EXISTING SAINTS CATALOG (your current 137 saints)
const EXISTING_SAINTS_CATALOG = [
  // ... (your existing 137 saints would go here)
  // I'm showing a few examples:
  {
    "id": "saint_001",
    "name": "St. Therese of Lisieux",
    "patronage": "Missions, Florists",
    "feast_day": "October 1",
    "short_blurb": "Known as 'The Little Flower,' she taught simplicity and love of God.",
    "extra_fact": "Became a Doctor of the Church despite dying young at 24.",
    "icon_asset": "assets/saints/saint_therese.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_002",
    "name": "St. Francis of Assisi",
    "patronage": "Animals, Ecology",
    "feast_day": "October 4",
    "short_blurb": "Founded the Franciscans and loved all of creation.",
    "extra_fact": "First person known to receive the stigmata.",
    "icon_asset": "assets/saints/saint_francis.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_003",
    "name": "St. Joan of Arc",
    "patronage": "Soldiers, France",
    "feast_day": "May 30",
    "short_blurb": "Led French armies at 17, trusting God's call.",
    "extra_fact": "Burned at the stake, later canonized.",
    "icon_asset": "assets/saints/saint_joan.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_004",
    "name": "St. Blaise of Sebaste",
    "patronage": "Throat Ailments, Veterinarians",
    "feast_day": "February 3",
    "short_blurb": "Bishop and martyr known for healing and blessing throats.",
    "extra_fact": "Catholics get their throats blessed with candles on his feast day.",
    "icon_asset": "assets/saints/saint_blaise.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_005",
    "name": "St. Cecilia",
    "patronage": "Musicians",
    "feast_day": "November 22",
    "short_blurb": "Sang to God even while facing martyrdom.",
    "extra_fact": "Often shown with musical instruments.",
    "icon_asset": "assets/saints/saint_cecilia.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_006",
    "name": "St. Padre Pio",
    "patronage": "Healing, Confession",
    "feast_day": "September 23",
    "short_blurb": "Famous for his deep prayer and miraculous healings.",
    "extra_fact": "Bore the stigmata for over 50 years.",
    "icon_asset": "assets/saints/saint_padrepio.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_007",
    "name": "St. Joseph",
    "patronage": "Fathers, Workers",
    "feast_day": "March 19",
    "short_blurb": "Foster father of Jesus, model of humble service.",
    "extra_fact": "Also honored on May 1 as patron of workers.",
    "icon_asset": "assets/saints/saint_joseph.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_008",
    "name": "St. Augustine",
    "patronage": "Theologians, Converts",
    "feast_day": "August 28",
    "short_blurb": "Brilliant thinker who converted after years of searching.",
    "extra_fact": "Wrote The Confessions and The City of God.",
    "icon_asset": "assets/saints/saint_augustine.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_009",
    "name": "St. Lucy",
    "patronage": "The Blind, Light",
    "feast_day": "December 13",
    "short_blurb": "Martyred for her faith, name means 'light.'",
    "extra_fact": "Often depicted holding her eyes on a plate.",
    "icon_asset": "assets/saints/saint_lucy.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_010",
    "name": "St. Kateri Tekakwitha",
    "patronage": "Native Americans, Ecology",
    "feast_day": "July 14",
    "short_blurb": "First Native American saint, known for her deep prayer life.",
    "extra_fact": "Called the 'Lily of the Mohawks.'",
    "icon_asset": "assets/saints/saint_kateri.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_011",
    "name": "St. Michael the Archangel",
    "patronage": "Soldiers, Police",
    "feast_day": "September 29",
    "short_blurb": "Leader of God's heavenly army against evil.",
    "extra_fact": "Mentioned in the Book of Revelation.",
    "icon_asset": "assets/saints/saint_michael.png",
    "rarity": "seasonal",
    "unlockCondition": "seasonal_feast_day",
    "luxlings_series": "Cherub Chibis"
  },
  {
    "id": "saint_012",
    "name": "St. Catherine of Siena",
    "patronage": "Nurses, Italy",
    "feast_day": "April 29",
    "short_blurb": "Advised popes and helped heal the Church.",
    "extra_fact": "Received the stigmata invisibly.",
    "icon_asset": "assets/saints/saint_catherine.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_013",
    "name": "St. Maximilian Kolbe",
    "patronage": "Prisoners, Families",
    "feast_day": "August 14",
    "short_blurb": "Gave his life for another man in Auschwitz.",
    "extra_fact": "Founded the Militia Immaculata movement.",
    "icon_asset": "assets/saints/saint_kolbe.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_014",
    "name": "St. Benedict",
    "patronage": "Students, Europe",
    "feast_day": "July 11",
    "short_blurb": "Father of Western monasticism, wrote the Rule of St. Benedict.",
    "extra_fact": "His motto: 'Ora et Labora' — Pray and Work.",
    "icon_asset": "assets/saints/saint_benedict.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_015",
    "name": "St. Elizabeth Ann Seton",
    "patronage": "Catholic Schools",
    "feast_day": "January 4",
    "short_blurb": "First American-born saint; founded Catholic schools.",
    "extra_fact": "Converted to Catholicism after her husband's death.",
    "icon_asset": "assets/saints/saint_elizabeth.png",
    "rarity": "grade_exclusive_5",
    "unlockCondition": "first_book_grade_5",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_016",
    "name": "St. Anthony of Padua",
    "patronage": "Lost Things",
    "feast_day": "June 13",
    "short_blurb": "Known for his powerful preaching and miracles.",
    "extra_fact": "Often pictured with Baby Jesus and lilies.",
    "icon_asset": "assets/saints/saint_anthony.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_017",
    "name": "St. Dominic",
    "patronage": "Preachers, The Rosary",
    "feast_day": "August 8",
    "short_blurb": "Founded the Dominican Order, promoted the Rosary.",
    "extra_fact": "Had a vision of Mary giving him the Rosary.",
    "icon_asset": "assets/saints/saint_dominic.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_018",
    "name": "St. Thomas Aquinas",
    "patronage": "Scholars, Students",
    "feast_day": "January 28",
    "short_blurb": "Wrote Summa Theologica, a masterwork of theology.",
    "extra_fact": "Known as the 'Angelic Doctor.'",
    "icon_asset": "assets/saints/saint_aquinas.png",
    "rarity": "grade_exclusive_6",
    "unlockCondition": "first_book_grade_6",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_019",
    "name": "St. Bernadette",
    "patronage": "Illness, Lourdes",
    "feast_day": "April 16",
    "short_blurb": "Mary appeared to her at Lourdes, France.",
    "extra_fact": "Spring at Lourdes still brings many pilgrims seeking healing.",
    "icon_asset": "assets/saints/saint_bernadette.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_020",
    "name": "St. Ignatius of Loyola",
    "patronage": "Soldiers, Retreats",
    "feast_day": "July 31",
    "short_blurb": "Founded the Jesuits after converting from military life.",
    "extra_fact": "Created the Spiritual Exercises.",
    "icon_asset": "assets/saints/saint_ignatius.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_021",
    "name": "St. Rose of Lima",
    "patronage": "South America, Florists",
    "feast_day": "August 23",
    "short_blurb": "First saint of the Americas, known for her piety.",
    "extra_fact": "Wore a crown of thorns as penance.",
    "icon_asset": "assets/saints/saint_rose.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_022",
    "name": "St. Clare of Assisi",
    "patronage": "TV, Poor",
    "feast_day": "August 11",
    "short_blurb": "Founded the Poor Clares, a Franciscan order for women.",
    "extra_fact": "Once held up the Eucharist to stop an invading army.",
    "icon_asset": "assets/saints/saint_clare.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_023",
    "name": "St. Jerome",
    "patronage": "Scripture Scholars",
    "feast_day": "September 30",
    "short_blurb": "Translated the Bible into Latin (the Vulgate).",
    "extra_fact": "Famous for his fiery debates and scholarship.",
    "icon_asset": "assets/saints/saint_jerome.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_024",
    "name": "St. Peter",
    "patronage": "The Church, Fishermen",
    "feast_day": "June 29",
    "short_blurb": "First pope, chosen by Jesus.",
    "extra_fact": "Martyred upside down in Rome.",
    "icon_asset": "assets/saints/saint_peter.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_025",
    "name": "St. Paul",
    "patronage": "Missionaries, Writers",
    "feast_day": "June 29",
    "short_blurb": "Traveled spreading the Gospel, wrote many letters.",
    "extra_fact": "Converted after seeing Jesus in a vision.",
    "icon_asset": "assets/saints/saint_paul.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_026",
    "name": "St. Andrew",
    "patronage": "Fishermen, Scotland",
    "feast_day": "November 30",
    "short_blurb": "First called by Jesus, brother of Peter.",
    "extra_fact": "Patron of Scotland; martyred on X-shaped cross.",
    "icon_asset": "assets/saints/saint_andrew.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_027",
    "name": "St. Faustina Kowalska",
    "patronage": "Divine Mercy, Poland",
    "feast_day": "October 5",
    "short_blurb": "Received visions of Jesus and spread Divine Mercy devotion.",
    "extra_fact": "Her vision gave us the famous 'Jesus, I Trust in You' prayer.",
    "icon_asset": "assets/saints/saint_faustina.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_028",
    "name": "St. Nicholas",
    "patronage": "Children, Sailors",
    "feast_day": "December 6",
    "short_blurb": "Secretly gave gifts to help the poor.",
    "extra_fact": "Inspired the Santa Claus tradition.",
    "icon_asset": "assets/saints/saint_nicholas.png",
    "rarity": "seasonal",
    "unlockCondition": "seasonal_feast_day",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_029",
    "name": "St. Sebastian",
    "patronage": "Athletes, Soldiers",
    "feast_day": "January 20",
    "short_blurb": "Shot with arrows for his faith, survived martyrdom attempt.",
    "extra_fact": "Became a symbol of courage and resilience.",
    "icon_asset": "assets/saints/saint_sebastian.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_030",
    "name": "St. Patrick",
    "patronage": "Ireland, Missionaries",
    "feast_day": "March 17",
    "short_blurb": "Brought Christianity to Ireland.",
    "extra_fact": "Used the shamrock to explain the Trinity.",
    "icon_asset": "assets/saints/saint_patrick.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_031",
    "name": "St. Martin de Porres",
    "patronage": "Barbers, Racial Harmony",
    "feast_day": "November 3",
    "short_blurb": "Known for his humility and care for the sick.",
    "extra_fact": "First Black saint of the Americas.",
    "icon_asset": "assets/saints/saint_martin.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_032",
    "name": "St. Juan Diego",
    "patronage": "Indigenous Peoples",
    "feast_day": "December 9",
    "short_blurb": "Mary appeared to him as Our Lady of Guadalupe.",
    "extra_fact": "His tilma still displays the miraculous image.",
    "icon_asset": "assets/saints/saint_juan.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_033",
    "name": "St. Anne",
    "patronage": "Mothers, Grandparents",
    "feast_day": "July 26",
    "short_blurb": "Mother of the Virgin Mary.",
    "extra_fact": "Grandmother of Jesus.",
    "icon_asset": "assets/saints/saint_anne.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Faithful Families"
  },
  {
    "id": "saint_034",
    "name": "St. Joachim",
    "patronage": "Fathers, Grandparents",
    "feast_day": "July 26",
    "short_blurb": "Father of the Virgin Mary.",
    "extra_fact": "Grandfather of Jesus.",
    "icon_asset": "assets/saints/saint_joachim.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Faithful Families"
  },
  {
    "id": "saint_035",
    "name": "St. Gabriel the Archangel",
    "patronage": "Messengers, Communication",
    "feast_day": "March 24",
    "short_blurb": "Announced to Mary she would be Jesus' mother.",
    "extra_fact": "Name means 'God is my strength.'",
    "icon_asset": "assets/saints/saint_gabriel.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Cherub Chibis"
  },
  {
    "id": "saint_036",
    "name": "St. Raphael the Archangel",
    "patronage": "Travelers, Healing",
    "feast_day": "September 29",
    "short_blurb": "Helped guide Tobias in the Bible.",
    "extra_fact": "Name means 'God heals.'",
    "icon_asset": "assets/saints/saint_raphael.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Cherub Chibis"
  },
  {
    "id": "saint_037",
    "name": "St. Stephen",
    "patronage": "Deacons, Martyrs",
    "feast_day": "December 26",
    "short_blurb": "First Christian martyr.",
    "extra_fact": "Died forgiving his attackers.",
    "icon_asset": "assets/saints/saint_stephen.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_038",
    "name": "St. Polycarp",
    "patronage": "Martyrs, Bishops",
    "feast_day": "February 23",
    "short_blurb": "Early Church Father and martyr.",
    "extra_fact": "Disciple of St. John the Apostle.",
    "icon_asset": "assets/saints/saint_polycarp.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_039",
    "name": "St. Perpetua & St. Felicity",
    "patronage": "Mothers, Martyrs",
    "feast_day": "March 7",
    "short_blurb": "Martyred together for their faith.",
    "extra_fact": "Their courage inspired many early Christians.",
    "icon_asset": "assets/saints/saint_perpetua.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_040",
    "name": "St. Lawrence",
    "patronage": "Cooks, The Poor",
    "feast_day": "August 10",
    "short_blurb": "Said 'Turn me over, I'm done on this side' while being martyred.",
    "extra_fact": "Gave Church treasures to the poor.",
    "icon_asset": "assets/saints/saint_lawrence.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_041",
    "name": "St. Monica",
    "patronage": "Mothers, Converts",
    "feast_day": "August 27",
    "short_blurb": "Prayed for years for her son's conversion.",
    "extra_fact": "Mother of St. Augustine.",
    "icon_asset": "assets/saints/saint_monica.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_042",
    "name": "St. Scholastica",
    "patronage": "Nuns, Storms",
    "feast_day": "February 10",
    "short_blurb": "Twin sister of St. Benedict.",
    "extra_fact": "Her prayers once stopped a storm.",
    "icon_asset": "assets/saints/saint_scholastica.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_043",
    "name": "St. Martha",
    "patronage": "Homemakers, Hospitality",
    "feast_day": "July 29",
    "short_blurb": "Served Jesus and trusted in His power.",
    "extra_fact": "Sister of Mary and Lazarus.",
    "icon_asset": "assets/saints/saint_martha.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_044",
    "name": "St. Lazarus",
    "patronage": "The Sick, The Poor",
    "feast_day": "December 17",
    "short_blurb": "Raised from the dead by Jesus.",
    "extra_fact": "Friend of Jesus.",
    "icon_asset": "assets/saints/saint_lazarus.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_045",
    "name": "St. Anthony the Great",
    "patronage": "Monks, Animals",
    "feast_day": "January 17",
    "short_blurb": "Father of Christian monasticism.",
    "extra_fact": "Lived in the Egyptian desert.",
    "icon_asset": "assets/saints/saint_anthonygreat.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_046",
    "name": "St. Isidore the Farmer",
    "patronage": "Farmers, Laborers",
    "feast_day": "May 15",
    "short_blurb": "Hardworking farmer who loved prayer.",
    "extra_fact": "Angels were said to help him plow.",
    "icon_asset": "assets/saints/saint_isidore.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_047",
    "name": "St. Zita",
    "patronage": "Domestic Workers, Servers",
    "feast_day": "April 27",
    "short_blurb": "Known for charity and service.",
    "extra_fact": "Patron saint of maids and housekeepers.",
    "icon_asset": "assets/saints/saint_zita.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_048",
    "name": "St. John Bosco",
    "patronage": "Youth, Teachers",
    "feast_day": "January 31",
    "short_blurb": "Founded schools for poor boys.",
    "extra_fact": "Had dreams from God as a child.",
    "icon_asset": "assets/saints/saint_bosco.png",
    "rarity": "grade_exclusive_8",
    "unlockCondition": "first_book_grade_8",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_049",
    "name": "St. Maria Goretti",
    "patronage": "Purity, Young People",
    "feast_day": "July 6",
    "short_blurb": "Forgave her attacker before dying.",
    "extra_fact": "Canonized as a model of forgiveness.",
    "icon_asset": "assets/saints/saint_goretti.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_050",
    "name": "St. Philomena",
    "patronage": "Infants, Impossible Causes",
    "feast_day": "August 11",
    "short_blurb": "Young martyr known for many miracles.",
    "extra_fact": "Remains discovered in the catacombs.",
    "icon_asset": "assets/saints/saint_philomena.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_051",
    "name": "St. Catherine Labouré",
    "patronage": "Miraculous Medal",
    "feast_day": "November 28",
    "short_blurb": "Received visions of Mary in Paris.",
    "extra_fact": "The Miraculous Medal spreads her message.",
    "icon_asset": "assets/saints/saint_laboure.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_052",
    "name": "St. Elizabeth of Hungary",
    "patronage": "Charitable Workers",
    "feast_day": "November 17",
    "short_blurb": "Gave generously to the poor.",
    "extra_fact": "Became a Franciscan after her husband's death.",
    "icon_asset": "assets/saints/saint_hungary.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_053",
    "name": "St. Aloysius Gonzaga",
    "patronage": "Students, Youth",
    "feast_day": "June 21",
    "short_blurb": "Gave up wealth to become a Jesuit.",
    "extra_fact": "Died caring for plague victims.",
    "icon_asset": "assets/saints/saint_aloysius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_054",
    "name": "St. Ignatius of Antioch",
    "patronage": "Bishops, Martyrs",
    "feast_day": "October 17",
    "short_blurb": "Early Church leader who wrote letters to Christians.",
    "extra_fact": "Fed to lions in Rome for his faith.",
    "icon_asset": "assets/saints/saint_antioch.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_055",
    "name": "St. Barbara",
    "patronage": "Firefighters, Lightning",
    "feast_day": "December 4",
    "short_blurb": "Imprisoned for her Christian faith.",
    "extra_fact": "Patron of those in dangerous work.",
    "icon_asset": "assets/saints/saint_barbara.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_056",
    "name": "St. Margaret Mary Alacoque",
    "patronage": "Sacred Heart Devotion",
    "feast_day": "October 16",
    "short_blurb": "Received visions of Jesus' Sacred Heart.",
    "extra_fact": "Spread devotion to Jesus' love.",
    "icon_asset": "assets/saints/saint_margaretmary.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_057",
    "name": "St. John the Baptist",
    "patronage": "Conversion, Baptism",
    "feast_day": "June 24",
    "short_blurb": "Baptized Jesus in the Jordan River.",
    "extra_fact": "Prepared the way for Christ.",
    "icon_asset": "assets/saints/saint_baptist.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_058",
    "name": "St. Jude Thaddeus",
    "patronage": "Impossible Cases",
    "feast_day": "October 28",
    "short_blurb": "One of the Twelve Apostles.",
    "extra_fact": "Called on for desperate needs.",
    "icon_asset": "assets/saints/saint_jude.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_059",
    "name": "St. Simon of Cyrene",
    "patronage": "Laborers, Cross Bearers",
    "feast_day": "March 27",
    "short_blurb": "Helped Jesus carry His cross.",
    "extra_fact": "Mentioned in all three Synoptic Gospels.",
    "icon_asset": "assets/saints/saint_simon.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_060",
    "name": "St. Edith Stein",
    "patronage": "Europe, Scholars",
    "feast_day": "August 9",
    "short_blurb": "Jewish convert, philosopher, martyr.",
    "extra_fact": "Died in Auschwitz during WWII.",
    "icon_asset": "assets/saints/saint_stein.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_061",
    "name": "St. Damian of Molokai",
    "patronage": "Lepers, Outcasts",
    "feast_day": "May 10",
    "short_blurb": "Served lepers in Hawaii.",
    "extra_fact": "Cared for people no one else would touch.",
    "icon_asset": "assets/saints/saint_damianmolokai.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_062",
    "name": "St. Jerome Emiliani",
    "patronage": "Orphans, Abandoned Children",
    "feast_day": "February 8",
    "short_blurb": "Founded orphanages in Italy.",
    "extra_fact": "Former soldier who turned to service.",
    "icon_asset": "assets/saints/saint_emiliani.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_063",
    "name": "St. Peter Claver",
    "patronage": "Slaves, Racial Justice",
    "feast_day": "September 9",
    "short_blurb": "Ministered to enslaved people in Colombia.",
    "extra_fact": "Baptized thousands.",
    "icon_asset": "assets/saints/saint_claver.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_064",
    "name": "St. Ambrose",
    "patronage": "Beekeepers, Teachers",
    "feast_day": "December 7",
    "short_blurb": "Famous bishop and teacher of St. Augustine.",
    "extra_fact": "Known for beautiful hymns and preaching.",
    "icon_asset": "assets/saints/saint_ambrose.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_065",
    "name": "St. Anselm",
    "patronage": "Philosophers, Theologians",
    "feast_day": "April 21",
    "short_blurb": "Wrote 'faith seeking understanding.'",
    "extra_fact": "Archbishop of Canterbury.",
    "icon_asset": "assets/saints/saint_anselm.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_066",
    "name": "St. John Neumann",
    "patronage": "Catholic Education",
    "feast_day": "January 5",
    "short_blurb": "Started the Catholic school system in America.",
    "extra_fact": "Spoke 6 languages.",
    "icon_asset": "assets/saints/saint_neumann.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_067",
    "name": "St. Gregory the Great",
    "patronage": "Popes, Musicians",
    "feast_day": "September 3",
    "short_blurb": "Organized Church music — Gregorian chant.",
    "extra_fact": "Sent missionaries to England.",
    "icon_asset": "assets/saints/saint_gregorygreat.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_068",
    "name": "St. Moses the Black",
    "patronage": "Peaceful Conversion, Africa",
    "feast_day": "August 28",
    "short_blurb": "Former thief and bandit who converted and became a holy Desert Father.",
    "extra_fact": "Went from leading a gang of robbers to leading monks in prayer.",
    "icon_asset": "assets/saints/saint_moses.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_069",
    "name": "St. Oscar Romero",
    "patronage": "The Oppressed, Peace",
    "feast_day": "March 24",
    "short_blurb": "Spoke out against injustice in El Salvador.",
    "extra_fact": "Martyred while saying Mass.",
    "icon_asset": "assets/saints/saint_romero.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_070",
    "name": "St. André Bessette",
    "patronage": "The Sick, Miracles",
    "feast_day": "January 6",
    "short_blurb": "Built St. Joseph's Oratory in Canada.",
    "extra_fact": "Performed many healings.",
    "icon_asset": "assets/saints/saint_andre.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_071",
    "name": "St. Vincent de Paul",
    "patronage": "Charities, Poor",
    "feast_day": "September 27",
    "short_blurb": "Organized care for the poor and sick.",
    "extra_fact": "Founded the Daughters of Charity.",
    "icon_asset": "assets/saints/saint_vincent.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_072",
    "name": "St. John of the Cross",
    "patronage": "Mystics, Spirituality",
    "feast_day": "December 14",
    "short_blurb": "Wrote 'Dark Night of the Soul.'",
    "extra_fact": "Partnered with St. Teresa of Avila to reform the Carmelites.",
    "icon_asset": "assets/saints/saint_johncross.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_073",
    "name": "St. Teresa of Avila",
    "patronage": "Prayer, Mystics",
    "feast_day": "October 15",
    "short_blurb": "Great writer and teacher on prayer.",
    "extra_fact": "One of only four female Doctors of the Church.",
    "icon_asset": "assets/saints/saint_teresaavila.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_074",
    "name": "St. Mark the Evangelist",
    "patronage": "Lawyers, Egypt, Venice",
    "feast_day": "April 25",
    "short_blurb": "Wrote the shortest Gospel and traveled with St. Paul and St. Peter.",
    "extra_fact": "His symbol is the winged lion, and he founded the Church in Alexandria.",
    "icon_asset": "assets/saints/saint_mark.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_075",
    "name": "St. Matthew the Evangelist",
    "patronage": "Tax Collectors, Accountants, Bankers",
    "feast_day": "September 21",
    "short_blurb": "Former tax collector who became an apostle and wrote the first Gospel.",
    "extra_fact": "Left his tax booth immediately when Jesus called him to follow.",
    "icon_asset": "assets/saints/saint_matthew.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_076",
    "name": "St. Luke the Evangelist",
    "patronage": "Doctors, Artists, Surgeons",
    "feast_day": "October 18",
    "short_blurb": "Wrote the Gospel of Luke and traveled with St. Paul as a missionary.",
    "extra_fact": "Only Gospel writer who was also a doctor and artist.",
    "icon_asset": "assets/saints/saint_luke.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_077",
    "name": "St. John Vianney",
    "patronage": "Priests, Confessors",
    "feast_day": "August 4",
    "short_blurb": "Spent hours hearing confessions.",
    "extra_fact": "Known for his deep holiness and humility.",
    "icon_asset": "assets/saints/saint_vianney.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_078",
    "name": "St. Zélie Martin",
    "patronage": "Mothers, Loss of Children",
    "feast_day": "July 12",
    "short_blurb": "Mother of St. Thérèse, canonized with her husband Louis.",
    "extra_fact": "First married couple to be canonized together in modern times.",
    "icon_asset": "assets/saints/saint_zelie.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Faithful Families"
  },
  {
    "id": "saint_079",
    "name": "St. Boniface",
    "patronage": "Germany, Missionaries",
    "feast_day": "June 5",
    "short_blurb": "Brought Christianity to Germany.",
    "extra_fact": "Chopped down pagan tree to prove God's power.",
    "icon_asset": "assets/saints/saint_boniface.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_080",
    "name": "St. Cyril",
    "patronage": "Missionaries, Translators",
    "feast_day": "February 14",
    "short_blurb": "Created the Cyrillic alphabet.",
    "extra_fact": "Helped evangelize Eastern Europe.",
    "icon_asset": "assets/saints/saint_cyril.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_081",
    "name": "St. Methodius",
    "patronage": "Slavs, Missionaries",
    "feast_day": "February 14",
    "short_blurb": "Brother of St. Cyril.",
    "extra_fact": "Worked together to bring Christianity to Slavic people.",
    "icon_asset": "assets/saints/saint_methodius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_082",
    "name": "St. Dominic Savio",
    "patronage": "Young People",
    "feast_day": "May 6",
    "short_blurb": "Young student of St. John Bosco.",
    "extra_fact": "Lived a holy life at only 14.",
    "icon_asset": "assets/saints/saint_dominicsavio.png",
    "rarity": "grade_exclusive_4",
    "unlockCondition": "first_book_grade_4",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_083",
    "name": "St. Francis Xavier",
    "patronage": "Missions, Asia",
    "feast_day": "December 3",
    "short_blurb": "Spread Christianity in India and Japan.",
    "extra_fact": "Co-founder of the Jesuits.",
    "icon_asset": "assets/saints/saint_francisxavier.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_084",
    "name": "St. Margaret of Scotland",
    "patronage": "Scotland, Mothers",
    "feast_day": "November 16",
    "short_blurb": "Queen known for her charity and kindness.",
    "extra_fact": "Helped the poor and reformed the Church.",
    "icon_asset": "assets/saints/saint_margaretscotland.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_085",
    "name": "St. Edith of Wilton",
    "patronage": "Nuns, Scholars",
    "feast_day": "July 15",
    "short_blurb": "Princess who became a nun.",
    "extra_fact": "Loved learning and prayer.",
    "icon_asset": "assets/saints/saint_edithwilton.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_086",
    "name": "St. Helena",
    "patronage": "Archaeologists, Converts",
    "feast_day": "August 18",
    "short_blurb": "Mother of Emperor Constantine.",
    "extra_fact": "Found the True Cross in Jerusalem.",
    "icon_asset": "assets/saints/saint_helena.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_087",
    "name": "St. John the Evangelist",
    "patronage": "Writers, Friendship",
    "feast_day": "December 27",
    "short_blurb": "Wrote the Gospel of John.",
    "extra_fact": "Called the 'beloved disciple.'",
    "icon_asset": "assets/saints/saint_evangelist.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_088",
    "name": "St. George",
    "patronage": "England, Soldiers, Scouts",
    "feast_day": "April 23",
    "short_blurb": "Legendary knight who slayed a dragon to save a princess.",
    "extra_fact": "His courage in the face of the dragon represents fighting evil with faith.",
    "icon_asset": "assets/saints/saint_george.png",
    "rarity": "seasonal",
    "unlockCondition": "seasonal_feast_day",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_089",
    "name": "St. Bruno",
    "patronage": "Monks, Contemplatives",
    "feast_day": "October 6",
    "short_blurb": "Founded the Carthusian Order.",
    "extra_fact": "Lived in deep silence and prayer.",
    "icon_asset": "assets/saints/saint_bruno.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_090",
    "name": "St. Brigid of Kildare",
    "patronage": "Ireland, Dairy Workers, Cattle",
    "feast_day": "February 1",
    "short_blurb": "Irish abbess known for miraculous generosity and hospitality.",
    "extra_fact": "Legend says she could turn water into ale and make butter from a single cow's milk.",
    "icon_asset": "assets/saints/saint_brigid.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_091",
    "name": "St. Agatha",
    "patronage": "Nurses, Breast Cancer",
    "feast_day": "February 5",
    "short_blurb": "Martyred for refusing to deny Christ.",
    "extra_fact": "Protector of women with illness.",
    "icon_asset": "assets/saints/saint_agatha.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_092",
    "name": "St. Apollonia",
    "patronage": "Dentists",
    "feast_day": "February 9",
    "short_blurb": "Martyred by having her teeth broken.",
    "extra_fact": "Patron saint of dentists and toothaches.",
    "icon_asset": "assets/saints/saint_apollonia.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_093",
    "name": "St. Felix of Nola",
    "patronage": "Spiders, Protection from False Accusation",
    "feast_day": "January 14",
    "short_blurb": "Protected by spiders who wove webs to hide him from persecutors.",
    "extra_fact": "Legend says spiders spun webs over his hiding place, making it look abandoned.",
    "icon_asset": "assets/saints/saint_felix.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_094",
    "name": "St. Cuthbert of Lindisfarne",
    "patronage": "Northern England",
    "feast_day": "March 20",
    "short_blurb": "Monk and bishop who lived on islands.",
    "extra_fact": "Known for caring for animals and nature.",
    "icon_asset": "assets/saints/saint_cuthbert.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_095",
    "name": "St. Longinus",
    "patronage": "Soldiers",
    "feast_day": "March 15",
    "short_blurb": "Roman soldier who pierced Christ's side.",
    "extra_fact": "Converted and became a saint.",
    "icon_asset": "assets/saints/saint_longinus.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_096",
    "name": "St. Veronica",
    "patronage": "Compassion",
    "feast_day": "July 12",
    "short_blurb": "Wiped Jesus' face on the way to Calvary.",
    "extra_fact": "Image of Christ appeared on her cloth.",
    "icon_asset": "assets/saints/saint_veronica.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_097",
    "name": "St. Dismas (Good Thief)",
    "patronage": "Repentance",
    "feast_day": "March 25",
    "short_blurb": "Crucified beside Jesus and forgiven.",
    "extra_fact": "First canonized saint by Christ Himself.",
    "icon_asset": "assets/saints/saint_dismas.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_098",
    "name": "St. Simon Stock",
    "patronage": "Brown Scapular",
    "feast_day": "May 16",
    "short_blurb": "Received scapular vision from Our Lady.",
    "extra_fact": "Linked to Carmelite devotion.",
    "icon_asset": "assets/saints/saint_simonstock.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_099",
    "name": "St. John Paul II",
    "patronage": "Youth, Pilgrims",
    "feast_day": "October 22",
    "short_blurb": "First Polish pope, beloved by youth.",
    "extra_fact": "World Youth Day founder.",
    "icon_asset": "assets/saints/saint_jp2.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_100",
    "name": "St. Teresa of Calcutta",
    "patronage": "The Poor, Missionaries",
    "feast_day": "September 5",
    "short_blurb": "Served the poorest of the poor in India.",
    "extra_fact": "Nobel Peace Prize recipient.",
    "icon_asset": "assets/saints/saint_teresa.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_101",
    "name": "Bl. Carlo Acutis",
    "patronage": "Youth, the Internet",
    "feast_day": "October 12",
    "short_blurb": "Teen who loved the Eucharist and used tech to spread faith.",
    "extra_fact": "Built an online database of Eucharistic miracles before dying at age 15.",
    "icon_asset": "assets/saints/saint_carlo.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_102",
    "name": "St. Angela Merici",
    "patronage": "Teachers, Girls",
    "feast_day": "January 27",
    "short_blurb": "Founded the Ursuline Sisters to educate girls.",
    "extra_fact": "Pioneered education for women.",
    "icon_asset": "assets/saints/saint_angela.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_103",
    "name": "St. Charles Borromeo",
    "patronage": "Catechists, Seminarians",
    "feast_day": "November 4",
    "short_blurb": "Led church reform after Council of Trent.",
    "extra_fact": "Known for great charity during plagues.",
    "icon_asset": "assets/saints/saint_charles.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_104",
    "name": "St. John Henry Newman",
    "patronage": "Converts, Educators",
    "feast_day": "October 9",
    "short_blurb": "Anglican convert who became a Catholic cardinal.",
    "extra_fact": "Famous for his sermons and scholarship.",
    "icon_asset": "assets/saints/saint_newman.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_105",
    "name": "St. Rose Philippine Duchesne",
    "patronage": "Missionaries, Frontier",
    "feast_day": "November 18",
    "short_blurb": "Brought Catholic education to Native Americans.",
    "extra_fact": "Nicknamed 'Woman Who Prays Always.'",
    "icon_asset": "assets/saints/saint_duchesne.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_106",
    "name": "St. Junípero Serra",
    "patronage": "California Missions",
    "feast_day": "July 1",
    "short_blurb": "Founded many California missions.",
    "extra_fact": "Canonized in 2015.",
    "icon_asset": "assets/saints/saint_serra.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_107",
    "name": "St. Catherine Drexel",
    "patronage": "Racial Justice, Native Americans",
    "feast_day": "March 3",
    "short_blurb": "Gave her fortune to support schools.",
    "extra_fact": "Founded Xavier University.",
    "icon_asset": "assets/saints/saint_drexel.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_108",
    "name": "St. Peter Chanel",
    "patronage": "Oceania, Missionaries",
    "feast_day": "April 28",
    "short_blurb": "First martyr of Oceania.",
    "extra_fact": "Died evangelizing in the Pacific Islands.",
    "icon_asset": "assets/saints/saint_chanel.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_109",
    "name": "St. Christopher",
    "patronage": "Travelers, Drivers, Safe Journeys",
    "feast_day": "July 25",
    "short_blurb": "Giant who carried travelers across a dangerous river, then carried the Christ child.",
    "extra_fact": "His name means 'Christ-bearer' after he carried Jesus across the water.",
    "icon_asset": "assets/saints/saint_christopher.png",
    "rarity": "seasonal",
    "unlockCondition": "seasonal_feast_day",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_110",
    "name": "St. Josephine Bakhita",
    "patronage": "Sudan, Victims of Slavery",
    "feast_day": "February 8",
    "short_blurb": "From slavery to religious sisterhood.",
    "extra_fact": "Known for her gentle spirit.",
    "icon_asset": "assets/saints/saint_bakhita.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_111",
    "name": "St. Andrew Kim Taegon",
    "patronage": "Korea, Martyrs",
    "feast_day": "September 20",
    "short_blurb": "First Korean priest.",
    "extra_fact": "Martyred for spreading the faith.",
    "icon_asset": "assets/saints/saint_kim.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_112",
    "name": "St. Paul Miki",
    "patronage": "Japan, Martyrs",
    "feast_day": "February 6",
    "short_blurb": "Jesuit missionary to Japan.",
    "extra_fact": "Crucified with companions.",
    "icon_asset": "assets/saints/saint_miki.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_113",
    "name": "St. Charles Lwanga",
    "patronage": "Africa, Youth",
    "feast_day": "June 3",
    "short_blurb": "Martyred in Uganda for faith.",
    "extra_fact": "Led a group of young martyrs.",
    "icon_asset": "assets/saints/saint_lwanga.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_114",
    "name": "St. Barbara Yi",
    "patronage": "Korea, Martyrs",
    "feast_day": "December 27",
    "short_blurb": "Courageously professed her faith.",
    "extra_fact": "Part of Korean Martyrs.",
    "icon_asset": "assets/saints/saint_barbarayi.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_115",
    "name": "St. Lorenzo Ruiz",
    "patronage": "Philippines, Martyrs",
    "feast_day": "September 28",
    "short_blurb": "First Filipino saint.",
    "extra_fact": "Martyred in Japan.",
    "icon_asset": "assets/saints/saint_lorenzo.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_116",
    "name": "St. José Sánchez del Río",
    "patronage": "Youth, Mexico",
    "feast_day": "February 10",
    "short_blurb": "Martyred at age 14 during Cristero War.",
    "extra_fact": "Declared a saint in 2016.",
    "icon_asset": "assets/saints/saint_jose.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_117",
    "name": "St. Tarcisius",
    "patronage": "First Communion",
    "feast_day": "August 15",
    "short_blurb": "Young boy martyred protecting the Eucharist.",
    "extra_fact": "Patron of First Communicants.",
    "icon_asset": "assets/saints/saint_tarcisius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_118",
    "name": "St. Pier Giorgio Frassati",
    "patronage": "Young Adults",
    "feast_day": "July 4",
    "short_blurb": "Loved hiking, service, and Eucharist.",
    "extra_fact": "Died young of polio.",
    "icon_asset": "assets/saints/saint_frassati.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_119",
    "name": "St. Stephen of Hungary",
    "patronage": "Kings",
    "feast_day": "August 16",
    "short_blurb": "First king of Hungary.",
    "extra_fact": "Brought his people to Christianity.",
    "icon_asset": "assets/saints/saint_stephenhungary.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_120",
    "name": "St. Olga of Kiev",
    "patronage": "Conversion",
    "feast_day": "July 11",
    "short_blurb": "Grandmother of St. Vladimir.",
    "extra_fact": "Helped bring Christianity to Russia.",
    "icon_asset": "assets/saints/saint_olga.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_121",
    "name": "St. Vladimir of Kiev",
    "patronage": "Baptism of Rus",
    "feast_day": "July 15",
    "short_blurb": "Converted Eastern Europe to Christianity.",
    "extra_fact": "Baptized Kiev in 988.",
    "icon_asset": "assets/saints/saint_vladimir.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_122",
    "name": "St. Genevieve",
    "patronage": "Paris",
    "feast_day": "January 3",
    "short_blurb": "Protected Paris through prayer.",
    "extra_fact": "Trusted by kings and peasants alike.",
    "icon_asset": "assets/saints/saint_genevieve.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_123",
    "name": "St. Marina the Monk",
    "patronage": "Hidden Saints",
    "feast_day": "July 17",
    "short_blurb": "Disguised herself to enter monastery.",
    "extra_fact": "Known for humility and holiness.",
    "icon_asset": "assets/saints/saint_marina.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_124",
    "name": "St. Hildegard of Bingen",
    "patronage": "Musicians, Scientists, Philosophers",
    "feast_day": "September 17",
    "short_blurb": "Brilliant medieval abbess who composed music, studied medicine, and received divine visions.",
    "extra_fact": "Doctor of the Church who wrote about everything from astronomy to herbal medicine.",
    "icon_asset": "assets/saints/saint_hildegard.png",
    "rarity": "grade_exclusive_7",
    "unlockCondition": "first_book_grade_7",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_125",
    "name": "St. Louis Martin",
    "patronage": "Fathers, Watchmakers",
    "feast_day": "July 12",
    "short_blurb": "Father of St. Thérèse, canonized with his wife Zélie.",
    "extra_fact": "Supported his family through his watchmaking while encouraging his wife's business.",
    "icon_asset": "assets/saints/saint_louis.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Faithful Families"
  },
  {
    "id": "saint_126",
    "name": "St. Vincent Ferrer",
    "patronage": "Preachers",
    "feast_day": "April 5",
    "short_blurb": "Preached across Europe.",
    "extra_fact": "Known for many miracles.",
    "icon_asset": "assets/saints/saint_ferrer.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_127",
    "name": "St. Paul of the Cross",
    "patronage": "Passionists",
    "feast_day": "October 20",
    "short_blurb": "Founded the Passionist Order.",
    "extra_fact": "Emphasized Christ's suffering.",
    "icon_asset": "assets/saints/saint_paulcross.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_128",
    "name": "St. Frances Xavier Cabrini",
    "patronage": "Immigrants",
    "feast_day": "November 13",
    "short_blurb": "First U.S. citizen saint.",
    "extra_fact": "Founded schools and hospitals for immigrants.",
    "icon_asset": "assets/saints/saint_cabrini.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_129",
    "name": "St. Margaret Clitherow",
    "patronage": "England, Converts",
    "feast_day": "March 26",
    "short_blurb": "Hid Catholic priests during persecution.",
    "extra_fact": "Martyred for protecting the Eucharist.",
    "icon_asset": "assets/saints/saint_clitherow.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_130",
    "name": "St. Isaac Jogues",
    "patronage": "North American Martyrs",
    "feast_day": "October 19",
    "short_blurb": "Evangelized Native Americans.",
    "extra_fact": "Martyred in Canada.",
    "icon_asset": "assets/saints/saint_jogues.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_131",
    "name": "St. René Goupil",
    "patronage": "North American Martyrs",
    "feast_day": "September 29",
    "short_blurb": "First Jesuit martyr in North America.",
    "extra_fact": "Killed while assisting Fr. Jogues.",
    "icon_asset": "assets/saints/saint_goupil.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_132",
    "name": "Our Lady of Lourdes",
    "patronage": "Healing, Miracles",
    "feast_day": "February 11",
    "short_blurb": "Appeared to St. Bernadette in France.",
    "extra_fact": "Spring of healing water flows at Lourdes.",
    "icon_asset": "assets/saints/mary_lourdes.png",
    "rarity": "legendary",
    "unlockCondition": "april_grade_5",
    "luxlings_series": "Mini Marians"
  },
  {
    "id": "saint_133",
    "name": "Our Lady of Fatima",
    "patronage": "Peace, Rosary",
    "feast_day": "May 13",
    "short_blurb": "Appeared to three children in Portugal.",
    "extra_fact": "Gave three secrets and calls for prayer.",
    "icon_asset": "assets/saints/mary_fatima.png",
    "rarity": "legendary",
    "unlockCondition": "april_grade_6",
    "luxlings_series": "Mini Marians"
  },
  {
    "id": "saint_134",
    "name": "Our Lady of Guadalupe",
    "patronage": "Americas, Indigenous Peoples",
    "feast_day": "December 12",
    "short_blurb": "Appeared to St. Juan Diego in Mexico.",
    "extra_fact": "Image miraculously imprinted on tilma.",
    "icon_asset": "assets/saints/mary_guadalupe.png",
    "rarity": "legendary",
    "unlockCondition": "april_grade_4",
    "luxlings_series": "Mini Marians"
  },
  {
    "id": "saint_135",
    "name": "Our Lady of Sorrows",
    "patronage": "Comfort in Suffering",
    "feast_day": "September 15",
    "short_blurb": "Honors Mary's sorrows at Jesus' death.",
    "extra_fact": "Seven sorrows devotion developed.",
    "icon_asset": "assets/saints/mary_sorrows.png",
    "rarity": "legendary",
    "unlockCondition": "april_grade_7",
    "luxlings_series": "Mini Marians"
  },
  {
    "id": "saint_136",
    "name": "Our Lady of the Rosary",
    "patronage": "Rosary",
    "feast_day": "October 7",
    "short_blurb": "Mary's intercession won the Battle of Lepanto.",
    "extra_fact": "Title emphasizes power of prayer.",
    "icon_asset": "assets/saints/mary_rosary.png",
    "rarity": "seasonal",
    "unlockCondition": "seasonal_feast_day",
    "luxlings_series": "Mini Marians"
  },
  {
    "id": "saint_137",
    "name": "St. James the Greater",
    "patronage": "Spain, Pilgrims",
    "feast_day": "July 25",
    "short_blurb": "Apostle whose shrine at Santiago de Compostela draws millions of pilgrims.",
    "extra_fact": "First apostle to be martyred, his pilgrimage route is one of Christianity's most famous.",
    "icon_asset": "assets/saints/saint_jamesgreater.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_138",
    "name": "St. Denis",
    "patronage": "France, Headaches",
    "feast_day": "October 9",
    "short_blurb": "First bishop of Paris who was martyred and became patron of France.",
    "extra_fact": "Legend says he carried his own head after beheading, walking for miles while preaching.",
    "icon_asset": "assets/saints/saint_denis.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_139",
    "name": "St. David",
    "patronage": "Wales, Poets",
    "feast_day": "March 1",
    "short_blurb": "Archbishop of Wales who founded many monasteries and churches.",
    "extra_fact": "His final words were 'Be joyful, brothers and sisters, keep your faith and do the little things.'",
    "icon_asset": "assets/saints/saint_david.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_140",
    "name": "St. Wenceslaus",
    "patronage": "Czech Republic, Bohemia",
    "feast_day": "September 28",
    "short_blurb": "Duke of Bohemia who promoted Christianity and was martyred by his brother.",
    "extra_fact": "Subject of the famous Christmas carol 'Good King Wenceslas.'",
    "icon_asset": "assets/saints/saint_wenceslaus.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_141",
    "name": "St. Casimir",
    "patronage": "Poland, Lithuania",
    "feast_day": "March 4",
    "short_blurb": "Prince of Poland known for his deep piety and care for the poor.",
    "extra_fact": "Refused to marry to maintain his vow of chastity, died young at 25.",
    "icon_asset": "assets/saints/saint_casimir.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_142",
    "name": "St. Olaf",
    "patronage": "Norway, Kings",
    "feast_day": "July 29",
    "short_blurb": "King of Norway who Christianized his country and died in battle.",
    "extra_fact": "Became a saint despite his violent past, showing God's mercy to all who repent.",
    "icon_asset": "assets/saints/saint_olaf.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_143",
    "name": "St. Canute",
    "patronage": "Denmark, Kings",
    "feast_day": "July 10",
    "short_blurb": "King of Denmark who supported the Church and was martyred.",
    "extra_fact": "Tried to invade England but was killed by rebels in church while praying.",
    "icon_asset": "assets/saints/saint_canute.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_144",
    "name": "St. Eric",
    "patronage": "Sweden, Kings",
    "feast_day": "May 18",
    "short_blurb": "King of Sweden who spread Christianity and was martyred.",
    "extra_fact": "Heard Mass every morning and was killed by Danish nobles after attending church.",
    "icon_asset": "assets/saints/saint_eric.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_145",
    "name": "St. Stanislaus",
    "patronage": "Poland, Bishops",
    "feast_day": "May 8",
    "short_blurb": "Bishop of Kraków who stood up to a corrupt king and was martyred.",
    "extra_fact": "Excommunicated King Bolesław II and was killed by the king himself at the altar.",
    "icon_asset": "assets/saints/saint_stanislaus.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_146",
    "name": "St. Louis IX",
    "patronage": "France, Kings",
    "feast_day": "August 25",
    "short_blurb": "King of France who led two crusades and was known for his justice and charity.",
    "extra_fact": "Only French king to be canonized, died of plague while on crusade.",
    "icon_asset": "assets/saints/saint_louisix.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_147",
    "name": "St. Edward the Confessor",
    "patronage": "England, Kings",
    "feast_day": "October 13",
    "short_blurb": "King of England known for his piety and establishment of Westminster Abbey.",
    "extra_fact": "Remained celibate throughout his marriage and was known for his healing touch.",
    "icon_asset": "assets/saints/saint_edward.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_148",
    "name": "St. Ferdinand",
    "patronage": "Spain, Kings",
    "feast_day": "May 30",
    "short_blurb": "King of Castile and León who reconquered much of Spain from the Moors.",
    "extra_fact": "Never lost a battle but was known for his mercy to defeated enemies.",
    "icon_asset": "assets/saints/saint_ferdinand.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_149",
    "name": "St. Hedwig",
    "patronage": "Poland, Queens",
    "feast_day": "October 16",
    "short_blurb": "Queen of Poland who founded the University of Kraków and helped the poor.",
    "extra_fact": "Gave away her royal jewels to build hospitals and churches.",
    "icon_asset": "assets/saints/saint_hedwig.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_150",
    "name": "St. Isabel of Portugal",
    "patronage": "Portugal, Queens",
    "feast_day": "July 4",
    "short_blurb": "Queen who made peace between warring kingdoms and cared for the poor.",
    "extra_fact": "Miracle of roses - bread for the poor turned into roses when questioned by her husband.",
    "icon_asset": "assets/saints/saint_isabel.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_151",
    "name": "St. Gemma Galgani",
    "patronage": "Students, Mystics",
    "feast_day": "April 11",
    "short_blurb": "Young Italian mystic who received the stigmata and had visions of Jesus.",
    "extra_fact": "Experienced ecstasies and received the wounds of Christ every Thursday and Friday.",
    "icon_asset": "assets/saints/saint_gemma.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_152",
    "name": "St. Rita of Cascia",
    "patronage": "Impossible Cases, Abuse Victims",
    "feast_day": "May 22",
    "short_blurb": "Endured an abusive marriage, became a nun, and is invoked for impossible situations.",
    "extra_fact": "Received a thorn wound on her forehead from a crucifix that lasted 15 years.",
    "icon_asset": "assets/saints/saint_rita.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_153",
    "name": "St. Margaret of Cortona",
    "patronage": "Reformed Prostitutes, Mystics",
    "feast_day": "May 16",
    "short_blurb": "Lived as a mistress before converting and becoming a Franciscan tertiary.",
    "extra_fact": "Called the 'Second Magdalene' for her dramatic conversion and penance.",
    "icon_asset": "assets/saints/saint_margaretcortona.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_154",
    "name": "St. Gianna Molla",
    "patronage": "Mothers, Physicians",
    "feast_day": "April 28",
    "short_blurb": "Doctor and mother who chose to save her unborn child's life over her own.",
    "extra_fact": "Canonized in 2004 with her husband and children present at the ceremony.",
    "icon_asset": "assets/saints/saint_gianna.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_155",
    "name": "St. Philip Neri",
    "patronage": "Joy, Young People",
    "feast_day": "May 26",
    "short_blurb": "The 'Laughing Saint' who brought joy to Rome and founded the Oratory.",
    "extra_fact": "Known for his practical jokes and sense of humor while being deeply holy.",
    "icon_asset": "assets/saints/saint_philipneri.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_156",
    "name": "St. Francis de Sales",
    "patronage": "Writers, Journalists",
    "feast_day": "January 24",
    "short_blurb": "Bishop known for his gentle approach to conversion and spiritual direction.",
    "extra_fact": "Wrote 'Introduction to the Devout Life' and never lost his temper in 40 years.",
    "icon_asset": "assets/saints/saint_francisdesales.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_157",
    "name": "St. Jean-Baptiste de La Salle",
    "patronage": "Teachers, Educators",
    "feast_day": "April 7",
    "short_blurb": "Founded the Brothers of the Christian Schools and revolutionized education.",
    "extra_fact": "Patron of teachers, he established the first teacher training college.",
    "icon_asset": "assets/saints/saint_lasalle.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_158",
    "name": "St. Agnes",
    "patronage": "Young Girls, Purity",
    "feast_day": "January 21",
    "short_blurb": "Young Roman martyr who died at 13 rather than renounce her faith.",
    "extra_fact": "Her hair miraculously grew to cover her when stripped of clothing.",
    "icon_asset": "assets/saints/saint_agnes.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_159",
    "name": "St. Pancras",
    "patronage": "Young People, Oaths",
    "feast_day": "May 12",
    "short_blurb": "Young Roman martyr who died at 14 for refusing to worship Roman gods.",
    "extra_fact": "One of the 'Ice Saints' whose feast day marks the end of late frosts.",
    "icon_asset": "assets/saints/saint_pancras.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_160",
    "name": "St. Stanislaus Kostka",
    "patronage": "Young Jesuits, Poland",
    "feast_day": "November 13",
    "short_blurb": "Young Jesuit novice who died at 18 after a life of extraordinary devotion.",
    "extra_fact": "Walked 350 miles to Rome to join the Jesuits after his family opposed his vocation.",
    "icon_asset": "assets/saints/saint_stanislaukostka.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_161",
    "name": "St. John Berchmans",
    "patronage": "Young Jesuits, Students",
    "feast_day": "November 26",
    "short_blurb": "Young Jesuit scholastic who died at 22 while studying in Rome.",
    "extra_fact": "Said 'I will pay the greatest attention to the smallest things.'",
    "icon_asset": "assets/saints/saint_berchmans.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_162",
    "name": "St. Gabriel Possenti",
    "patronage": "Young People, Handguns",
    "feast_day": "February 27",
    "short_blurb": "Young Passionist who died at 24 and is known for his devotion to Our Lady.",
    "extra_fact": "Patron of handgunners after reportedly disarming a soldier with a single shot.",
    "icon_asset": "assets/saints/saint_gabriel.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Halo Hatchlings"
  },
  {
    "id": "saint_163",
    "name": "St. Paul the Hermit",
    "patronage": "Hermits, Weavers",
    "feast_day": "January 15",
    "short_blurb": "First Christian hermit who lived alone in the Egyptian desert for over 60 years.",
    "extra_fact": "A raven brought him half a loaf of bread daily for 60 years.",
    "icon_asset": "assets/saints/saint_paulhermit.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_164",
    "name": "St. Mary of Egypt",
    "patronage": "Repentant Sinners, Desert Mothers",
    "feast_day": "April 1",
    "short_blurb": "Former prostitute who became a hermit in the desert for 47 years.",
    "extra_fact": "Lived on only three loaves of bread and desert plants for nearly five decades.",
    "icon_asset": "assets/saints/saint_maryegypt.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_165",
    "name": "St. Macarius",
    "patronage": "Desert Fathers, Confessors",
    "feast_day": "January 19",
    "short_blurb": "Great Desert Father known for his wisdom and spiritual guidance.",
    "extra_fact": "Founded two monasteries and was known for his humility and miracles.",
    "icon_asset": "assets/saints/saint_macarius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_166",
    "name": "St. John Climacus",
    "patronage": "Spiritual Directors, Monks",
    "feast_day": "March 30",
    "short_blurb": "Wrote 'The Ladder of Divine Ascent,' a classic of Christian spirituality.",
    "extra_fact": "Spent 40 years as a hermit before becoming abbot of St. Catherine's Monastery.",
    "icon_asset": "assets/saints/saint_climacus.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_167",
    "name": "St. Philip",
    "patronage": "Pastry Chefs, Hatters",
    "feast_day": "May 3",
    "short_blurb": "Apostle who brought Nathanael to Jesus and asked 'Show us the Father.'",
    "extra_fact": "Preached the Gospel in Greece and was crucified upside down.",
    "icon_asset": "assets/saints/saint_philip.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_168",
    "name": "St. Bartholomew",
    "patronage": "Tanners, Plasterers",
    "feast_day": "August 24",
    "short_blurb": "Apostle also known as Nathanael, who Jesus called 'a true Israelite.'",
    "extra_fact": "Martyred by being flayed alive, often depicted holding his own skin.",
    "icon_asset": "assets/saints/saint_bartholomew.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_169",
    "name": "St. Thomas",
    "patronage": "Architects, India",
    "feast_day": "July 3",
    "short_blurb": "Apostle known as 'Doubting Thomas' who touched Jesus' wounds.",
    "extra_fact": "Traveled to India to spread the Gospel and was martyred there.",
    "icon_asset": "assets/saints/saint_thomas.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_170",
    "name": "St. James the Lesser",
    "patronage": "Fullers, Pharmacists",
    "feast_day": "May 3",
    "short_blurb": "Apostle and first bishop of Jerusalem, author of the Letter of James.",
    "extra_fact": "Thrown from the temple and beaten to death for preaching about Jesus.",
    "icon_asset": "assets/saints/saint_jameslesser.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_171",
    "name": "St. Simon the Zealot",
    "patronage": "Curriers, Tanners",
    "feast_day": "October 28",
    "short_blurb": "Apostle who was part of the Zealot political movement before following Jesus.",
    "extra_fact": "Preached the Gospel in Persia and was martyred by being sawn in half.",
    "icon_asset": "assets/saints/saint_simonzealot.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_172",
    "name": "St. Mary Magdalene",
    "patronage": "Repentant Sinners, Perfumers",
    "feast_day": "July 22",
    "short_blurb": "First witness to Jesus' resurrection, called 'Apostle to the Apostles.'",
    "extra_fact": "Jesus cast seven demons out of her, and she became his devoted follower.",
    "icon_asset": "assets/saints/saint_magdalene.png",
    "rarity": "legendary",
    "unlockCondition": "streak_90_days",
    "luxlings_series": "Sacred Circle"
  },
  {
    "id": "saint_173",
    "name": "Our Lady of Grace",
    "patronage": "Grace, Favors",
    "feast_day": "May 31",
    "short_blurb": "Mary as the Mediatrix of All Graces, distributing God's favors to humanity.",
    "extra_fact": "All graces come through Mary's intercession as Mother of God.",
    "icon_asset": "assets/saints/mary_grace.png",
    "rarity": "legendary",
    "unlockCondition": "april_grade_8",
    "luxlings_series": "Mini Marians"
  },
  {
    "id": "saint_174",
    "name": "St. Adalbert",
    "patronage": "Bohemia, Prussia",
    "feast_day": "April 23",
    "short_blurb": "Bishop and missionary martyred while evangelizing Prussia.",
    "extra_fact": "Patron saint of Poland, Czech Republic, and Hungary.",
    "icon_asset": "assets/saints/saint_adalbert.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_175",
    "name": "St. Aelred of Rievaulx",
    "patronage": "Friendship, Spiritual Directors",
    "feast_day": "January 12",
    "short_blurb": "Cistercian abbot known for his writings on friendship.",
    "extra_fact": "Wrote 'Spiritual Friendship,' a classic on Christian friendship.",
    "icon_asset": "assets/saints/saint_aelred.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_176",
    "name": "St. Agapitus",
    "patronage": "Popes, Against Colic",
    "feast_day": "April 22",
    "short_blurb": "Pope who defended orthodox teaching against heresy.",
    "extra_fact": "Died in Constantinople while on a diplomatic mission.",
    "icon_asset": "assets/saints/saint_agapitus.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_177",
    "name": "St. Aidan of Lindisfarne",
    "patronage": "Ireland, Firefighters",
    "feast_day": "August 31",
    "short_blurb": "Irish monk who brought Christianity to northern England.",
    "extra_fact": "Founded monastery on Holy Island of Lindisfarne.",
    "icon_asset": "assets/saints/saint_aidan.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_178",
    "name": "St. Alban",
    "patronage": "England, Refugees",
    "feast_day": "June 22",
    "short_blurb": "First British martyr who sheltered a Christian priest.",
    "extra_fact": "Converted after hiding a priest from Roman persecution.",
    "icon_asset": "assets/saints/saint_alban.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_179",
    "name": "St. Albert the Great",
    "patronage": "Scientists, Philosophers",
    "feast_day": "November 15",
    "short_blurb": "Doctor of the Church, teacher of St. Thomas Aquinas.",
    "extra_fact": "Called 'Universal Doctor' for his vast knowledge.",
    "icon_asset": "assets/saints/saint_albertgreat.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_180",
    "name": "St. Alexius",
    "patronage": "Beggars, Pilgrims",
    "feast_day": "July 17",
    "short_blurb": "Roman nobleman who lived as a beggar for holiness.",
    "extra_fact": "Lived unknown under his father's staircase for 17 years.",
    "icon_asset": "assets/saints/saint_alexius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_181",
    "name": "St. Alphonsus Liguori",
    "patronage": "Moral Theologians, Confessors",
    "feast_day": "August 1",
    "short_blurb": "Doctor of the Church, founder of Redemptorists.",
    "extra_fact": "Wrote more than 100 books on theology and spirituality.",
    "icon_asset": "assets/saints/saint_alphonsus.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_182",
    "name": "St. Anastasia",
    "patronage": "Martyrs, Weavers",
    "feast_day": "December 25",
    "short_blurb": "Roman martyr who aided Christians in prison.",
    "extra_fact": "Commemorated in the Christmas Mass.",
    "icon_asset": "assets/saints/saint_anastasia.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_183",
    "name": "St. Ansgar",
    "patronage": "Scandinavia, Denmark",
    "feast_day": "February 3",
    "short_blurb": "Apostle of the North, brought Christianity to Scandinavia.",
    "extra_fact": "Founded first Christian school in Denmark.",
    "icon_asset": "assets/saints/saint_ansgar.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_184",
    "name": "St. Antoninus",
    "patronage": "Florence, Confessors",
    "feast_day": "May 10",
    "short_blurb": "Archbishop of Florence known for reform and charity.",
    "extra_fact": "Wrote influential works on moral theology and economics.",
    "icon_asset": "assets/saints/saint_antoninus.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_185",
    "name": "St. Apollinaris",
    "patronage": "Ravenna, Epilepsy",
    "feast_day": "July 23",
    "short_blurb": "First bishop of Ravenna, disciple of St. Peter.",
    "extra_fact": "Performed many miraculous healings.",
    "icon_asset": "assets/saints/saint_apollinaris.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_186",
    "name": "St. Athanasius",
    "patronage": "Orthodox Teaching, Theologians",
    "feast_day": "May 2",
    "short_blurb": "Doctor of the Church who defended against Arianism.",
    "extra_fact": "Called 'Father of Orthodoxy' for defending the Trinity.",
    "icon_asset": "assets/saints/saint_athanasius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_187",
    "name": "St. Barnabas",
    "patronage": "Cyprus, Peacemakers",
    "feast_day": "June 11",
    "short_blurb": "Apostle who traveled with St. Paul on mission trips.",
    "extra_fact": "Name means 'son of encouragement.'",
    "icon_asset": "assets/saints/saint_barnabas.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_188",
    "name": "St. Bede the Venerable",
    "patronage": "Historians, Students",
    "feast_day": "May 25",
    "short_blurb": "English monk and scholar, Doctor of the Church.",
    "extra_fact": "Wrote 'Ecclesiastical History of the English People.'",
    "icon_asset": "assets/saints/saint_bede.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_189",
    "name": "St. Bonaventure",
    "patronage": "Theologians, Franciscans",
    "feast_day": "July 15",
    "short_blurb": "Doctor of the Church, 'Seraphic Doctor.'",
    "extra_fact": "Minister General of Franciscans, friend of St. Thomas Aquinas.",
    "icon_asset": "assets/saints/saint_bonaventure.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_190",
    "name": "St. Brigid of Sweden",
    "patronage": "Europe, Pilgrims",
    "feast_day": "July 23",
    "short_blurb": "Mystic who founded the Bridgettines.",
    "extra_fact": "Received revelations about Christ's Passion.",
    "icon_asset": "assets/saints/saint_brigidsweden.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_191",
    "name": "St. Camillus de Lellis",
    "patronage": "Hospitals, Nurses",
    "feast_day": "July 14",
    "short_blurb": "Founded order to care for the sick and dying.",
    "extra_fact": "Former soldier and gambler who converted to serve the sick.",
    "icon_asset": "assets/saints/saint_camillus.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_192",
    "name": "St. Casimir of Poland",
    "patronage": "Poland, Lithuania",
    "feast_day": "March 4",
    "short_blurb": "Prince known for piety and care for the poor.",
    "extra_fact": "Refused marriage to maintain celibacy.",
    "icon_asset": "assets/saints/saint_casimirpoland.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_193",
    "name": "St. Clement of Rome",
    "patronage": "Popes, Sailors",
    "feast_day": "November 23",
    "short_blurb": "Fourth Pope, wrote important letter to Corinthians.",
    "extra_fact": "Martyred by being thrown into sea with anchor.",
    "icon_asset": "assets/saints/saint_clement.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_194",
    "name": "St. Columba",
    "patronage": "Scotland, Ireland",
    "feast_day": "June 9",
    "short_blurb": "Irish missionary who evangelized Scotland.",
    "extra_fact": "Founded monastery on the island of Iona.",
    "icon_asset": "assets/saints/saint_columba.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_195",
    "name": "St. Cornelius",
    "patronage": "Popes, Cattle",
    "feast_day": "September 16",
    "short_blurb": "Pope who dealt with persecution and schism.",
    "extra_fact": "Martyred during the Decian persecution.",
    "icon_asset": "assets/saints/saint_cornelius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_196",
    "name": "St. Cosmas",
    "patronage": "Doctors, Pharmacists",
    "feast_day": "September 26",
    "short_blurb": "Physician who treated patients without payment.",
    "extra_fact": "Twin brother of St. Damian, martyred together.",
    "icon_asset": "assets/saints/saint_cosmas.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_197",
    "name": "St. Damian",
    "patronage": "Doctors, Pharmacists",
    "feast_day": "September 26",
    "short_blurb": "Physician who treated patients without payment.",
    "extra_fact": "Twin brother of St. Cosmas, martyred together.",
    "icon_asset": "assets/saints/saint_damianphysician.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_198",
    "name": "St. Demetrius",
    "patronage": "Soldiers, Thessalonica",
    "feast_day": "October 26",
    "short_blurb": "Roman soldier martyred for his Christian faith.",
    "extra_fact": "Great veneration in Eastern Orthodox Church.",
    "icon_asset": "assets/saints/saint_demetrius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_199",
    "name": "St. Dorothy",
    "patronage": "Gardeners, Florists",
    "feast_day": "February 6",
    "short_blurb": "Martyr who sent roses from heaven.",
    "extra_fact": "Miraculously sent flowers and fruit from paradise.",
    "icon_asset": "assets/saints/saint_dorothy.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Heavenly Helpers"
  },
  {
    "id": "saint_200",
    "name": "St. Dunstan",
    "patronage": "Goldsmiths, Musicians",
    "feast_day": "May 19",
    "short_blurb": "Archbishop of Canterbury, reformer and craftsman.",
    "extra_fact": "Legend says he grabbed the devil's nose with hot tongs.",
    "icon_asset": "assets/saints/saint_dunstan.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_201",
    "name": "St. Edmund",
    "patronage": "England, Torture Victims",
    "feast_day": "November 20",
    "short_blurb": "King of East Anglia martyred by Vikings.",
    "extra_fact": "Shot with arrows and beheaded for refusing to deny Christ.",
    "icon_asset": "assets/saints/saint_edmund.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Regal Royals"
  },
  {
    "id": "saint_202",
    "name": "St. Eligius",
    "patronage": "Metalworkers, Horses",
    "feast_day": "December 1",
    "short_blurb": "Bishop and skilled goldsmith.",
    "extra_fact": "Made crowns for French kings before becoming bishop.",
    "icon_asset": "assets/saints/saint_eligius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_203",
    "name": "St. Erasmus",
    "patronage": "Sailors, Intestinal Disease",
    "feast_day": "June 2",
    "short_blurb": "Bishop and martyr, protector of sailors.",
    "extra_fact": "Also known as St. Elmo, patron of sailors.",
    "icon_asset": "assets/saints/saint_erasmus.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_204",
    "name": "St. Euphrasia",
    "patronage": "Widows, Good Works",
    "feast_day": "March 13",
    "short_blurb": "Abbess known for extreme asceticism.",
    "extra_fact": "Fled to Egypt to avoid arranged marriage.",
    "icon_asset": "assets/saints/saint_euphrasia.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_205",
    "name": "St. Eusebius",
    "patronage": "Church Historians",
    "feast_day": "August 2",
    "short_blurb": "Bishop who wrote first history of the Church.",
    "extra_fact": "Father of Church History.",
    "icon_asset": "assets/saints/saint_eusebius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_206",
    "name": "St. Fabian",
    "patronage": "Popes, Potters",
    "feast_day": "January 20",
    "short_blurb": "Pope chosen when dove landed on his head.",
    "extra_fact": "Martyred during Decian persecution.",
    "icon_asset": "assets/saints/saint_fabian.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_207",
    "name": "St. Fiacre",
    "patronage": "Gardeners, Hemorrhoids",
    "feast_day": "August 30",
    "short_blurb": "Irish hermit who became patron of gardeners.",
    "extra_fact": "Cleared land for his hermitage with miraculous speed.",
    "icon_asset": "assets/saints/saint_fiacre.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_208",
    "name": "St. Fidelis of Sigmaringen",
    "patronage": "Lawyers, Missions",
    "feast_day": "April 24",
    "short_blurb": "Lawyer turned Capuchin missionary.",
    "extra_fact": "Martyred while preaching to Swiss Protestants.",
    "icon_asset": "assets/saints/saint_fidelis.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_209",
    "name": "St. Finnian",
    "patronage": "Ireland, Learning",
    "feast_day": "December 12",
    "short_blurb": "Irish monk and teacher of many saints.",
    "extra_fact": "Founded monastery that educated numerous Irish saints.",
    "icon_asset": "assets/saints/saint_finnian.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_210",
    "name": "St. Florian",
    "patronage": "Firefighters, Poland",
    "feast_day": "May 4",
    "short_blurb": "Roman soldier martyred for refusing to sacrifice to gods.",
    "extra_fact": "Drowned with millstone around neck.",
    "icon_asset": "assets/saints/saint_florian.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Pocket Patrons"
  },
  {
    "id": "saint_211",
    "name": "St. Gall",
    "patronage": "Switzerland, Birds",
    "feast_day": "October 16",
    "short_blurb": "Irish missionary to Switzerland.",
    "extra_fact": "Founded abbey that became important cultural center.",
    "icon_asset": "assets/saints/saint_gall.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_212",
    "name": "St. Genesius",
    "patronage": "Actors, Comedians",
    "feast_day": "August 25",
    "short_blurb": "Actor who converted while mocking baptism on stage.",
    "extra_fact": "Martyred after refusing to renounce newfound faith.",
    "icon_asset": "assets/saints/saint_genesius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_213",
    "name": "St. Germanus",
    "patronage": "France, Against Plague",
    "feast_day": "May 28",
    "short_blurb": "Bishop of Paris known for miracles.",
    "extra_fact": "Stopped Attila the Hun from sacking Paris.",
    "icon_asset": "assets/saints/saint_germanus.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Culture Carriers"
  },
  {
    "id": "saint_214",
    "name": "St. Giles",
    "patronage": "Beggars, Blacksmiths",
    "feast_day": "September 1",
    "short_blurb": "Hermit who lived with a deer in French forest.",
    "extra_fact": "Accidentally shot by arrow meant for the deer.",
    "icon_asset": "assets/saints/saint_giles.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Desert Disciples"
  },
  {
    "id": "saint_215",
    "name": "St. Gordius",
    "patronage": "Soldiers, Centurions",
    "feast_day": "January 3",
    "short_blurb": "Roman centurion martyred for faith.",
    "extra_fact": "Left army, became hermit, then publicly proclaimed faith.",
    "icon_asset": "assets/saints/saint_gordius.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_216",
    "name": "St. Gregory Nazianzen",
    "patronage": "Poets, Theologians",
    "feast_day": "January 2",
    "short_blurb": "Doctor of the Church, 'The Theologian.'",
    "extra_fact": "One of the three Cappadocian Fathers.",
    "icon_asset": "assets/saints/saint_gregorynazianzen.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_217",
    "name": "St. Gregory of Nyssa",
    "patronage": "Theologians, Mystics",
    "feast_day": "January 10",
    "short_blurb": "Doctor of the Church, brother of St. Basil.",
    "extra_fact": "Defender of orthodox teaching on the Trinity.",
    "icon_asset": "assets/saints/saint_gregorynyssa.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_218",
    "name": "St. Hippolytus",
    "patronage": "Horses, Prison Guards",
    "feast_day": "August 13",
    "short_blurb": "Roman priest and theologian, anti-pope turned martyr.",
    "extra_fact": "Reconciled with Pope before martyrdom.",
    "icon_asset": "assets/saints/saint_hippolytus.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_219",
    "name": "St. Hubert",
    "patronage": "Hunters, Dogs",
    "feast_day": "November 3",
    "short_blurb": "Converted while hunting after seeing crucifix between stag's antlers.",
    "extra_fact": "Became bishop and evangelized Belgium.",
    "icon_asset": "assets/saints/saint_hubert.png",
    "rarity": "common",
    "unlockCondition": "streak_14_days",
    "luxlings_series": "Virtue Vignettes"
  },
  {
    "id": "saint_220",
    "name": "St. Enda",
    "patronage": "Aran Islands, Ireland",
    "feast_day": "March 21",
    "short_blurb": "Irish abbot who founded monastery on Aran Islands.",
    "extra_fact": "Called 'Patriarch of Irish Monasticism.'",
    "icon_asset": "assets/saints/saint_enda.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_221",
    "name": "St. Ephrem the Syrian",
    "patronage": "Spiritual Directors, Syria",
    "feast_day": "June 9",
    "short_blurb": "Deacon and Doctor of the Church, great hymn writer.",
    "extra_fact": "Called 'Harp of the Holy Spirit' for beautiful hymns.",
    "icon_asset": "assets/saints/saint_ephrem.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_222",
    "name": "St. Eucherius",
    "patronage": "Lyon, Bishops",
    "feast_day": "November 16",
    "short_blurb": "Bishop and theological writer.",
    "extra_fact": "Retired to monastery of Lérins before becoming bishop.",
    "icon_asset": "assets/saints/saint_eucherius.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Learning Legends"
  },
  {
    "id": "saint_223",
    "name": "St. Evaristus",
    "patronage": "Popes, Early Church",
    "feast_day": "October 26",
    "short_blurb": "Fifth Pope, organized parishes in Rome.",
    "extra_fact": "Established seven deacons to assist bishop.",
    "icon_asset": "assets/saints/saint_evaristus.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Apostolic All-Stars"
  },
  {
    "id": "saint_224",
    "name": "St. Flavian",
    "patronage": "Constantinople, Orthodox Faith",
    "feast_day": "February 18",
    "short_blurb": "Patriarch who defended orthodox teaching.",
    "extra_fact": "Beaten to death at heretical Council of Ephesus.",
    "icon_asset": "assets/saints/saint_flavian.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Super Sancti"
  },
  {
    "id": "saint_225",
    "name": "St. Fructuosus",
    "patronage": "Braga, Bishops",
    "feast_day": "April 16",
    "short_blurb": "Spanish bishop and monastic founder.",
    "extra_fact": "Founded many monasteries and wrote monastic rule.",
    "icon_asset": "assets/saints/saint_fructuosus.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Founder Flames"
  },
  {
    "id": "saint_226",
    "name": "St. Fursey",
    "patronage": "Visions, East Anglia",
    "feast_day": "January 16",
    "short_blurb": "Irish monk famous for mystical visions.",
    "extra_fact": "His visions influenced Dante's Divine Comedy.",
    "icon_asset": "assets/saints/saint_fursey.png",
    "rarity": "rare",
    "unlockCondition": "streak_30_days",
    "luxlings_series": "Contemplative Cuties"
  },
  {
    "id": "saint_ultimate_001",
    "name": "Jesus Christ",
    "patronage": "Savior, Redeemer",
    "feast_day": "Every Day",
    "short_blurb": "Son of God, who gave His life for us and rose again.",
    "extra_fact": "The center of all Christian faith and the goal of our journey.",
    "icon_asset": "assets/saints/ultimate_redeemer.png",
    "rarity": "unique_super_legendary",
    "unlockCondition": "collected_all_marians",
    "luxlings_series": "Ultimate Redeemer"
  }
]

// NEW SAINTS TO ADD (easily expandable!)
const NEW_SAINTS_TO_ADD = [
  // Add more saints here as needed!
]

// COMBINED CATALOG (for bulk operations)
const COMPLETE_SAINTS_CATALOG = [...EXISTING_SAINTS_CATALOG, ...NEW_SAINTS_TO_ADD]

// BULK SETUP FUNCTION (your current system)
const setupAllSaints = async () => {
  try {
    console.log('🚀 Setting up ALL saints (bulk operation)...')
    
    const saintsRef = collection(db, 'saints')
    const existingSaints = await getDocs(saintsRef)
    
    if (!existingSaints.empty) {
      const overwrite = window.confirm(`Saints collection exists with ${existingSaints.size} saints. Overwrite with complete catalog of ${COMPLETE_SAINTS_CATALOG.length} saints?`)
      if (!overwrite) {
        return { success: false, message: 'Bulk setup cancelled' }
      }
    }
    
    let processedCount = 0
    for (const saint of COMPLETE_SAINTS_CATALOG) {
      await setDoc(doc(db, 'saints', saint.id), saint)
      console.log(`✅ Processed: ${saint.name}`)
      processedCount++
    }
    
    console.log(`🎉 Bulk setup complete! Processed ${processedCount} saints`)
    return {
      success: true,
      message: `Successfully processed ${processedCount} saints`,
      stats: { total: processedCount, operation: 'bulk' }
    }
    
  } catch (error) {
    console.error('❌ Bulk setup error:', error)
    return { success: false, message: 'Bulk setup failed: ' + error.message }
  }
}

// ADD NEW SAINTS ONLY (smart addition)
const addNewSaintsOnly = async () => {
  try {
    console.log('➕ Adding new saints only...')
    
    let addedCount = 0
    let skippedCount = 0
    
    for (const newSaint of NEW_SAINTS_TO_ADD) {
      // Check if saint already exists
      const saintRef = doc(db, 'saints', newSaint.id)
      const existingSaint = await getDoc(saintRef)
      
      if (existingSaint.exists()) {
        console.log(`⏭️ Skipped (already exists): ${newSaint.name}`)
        skippedCount++
      } else {
        await setDoc(saintRef, newSaint)
        console.log(`✅ Added new saint: ${newSaint.name}`)
        addedCount++
      }
    }
    
    console.log(`🎉 New saints addition complete! Added ${addedCount}, Skipped ${skippedCount}`)
    return {
      success: true,
      message: `Successfully added ${addedCount} new saints (${skippedCount} already existed)`,
      stats: { added: addedCount, skipped: skippedCount, operation: 'add_new' }
    }
    
  } catch (error) {
    console.error('❌ Add new saints error:', error)
    return { success: false, message: 'Add new saints failed: ' + error.message }
  }
}

// ADD SINGLE SAINT (for one-off additions)
const addSingleSaint = async (saintData) => {
  try {
    console.log(`➕ Adding single saint: ${saintData.name}...`)
    
    // Validate required fields
    const requiredFields = ['id', 'name', 'patronage', 'feast_day', 'short_blurb', 'rarity', 'unlockCondition']
    for (const field of requiredFields) {
      if (!saintData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    // Check if saint already exists
    const saintRef = doc(db, 'saints', saintData.id)
    const existingSaint = await getDoc(saintRef)
    
    if (existingSaint.exists()) {
      const overwrite = window.confirm(`Saint ${saintData.name} already exists. Overwrite?`)
      if (!overwrite) {
        return { success: false, message: 'Single saint addition cancelled' }
      }
    }
    
    // Add default fields if missing
    const saintWithDefaults = {
      extra_fact: "A holy example for all Catholics.",
      icon_asset: `assets/saints/saint_${saintData.id.split('_')[1]}.png`,
      luxlings_series: "Super Sancti",
      ...saintData
    }
    
    await setDoc(saintRef, saintWithDefaults)
    console.log(`✅ Successfully added: ${saintData.name}`)
    
    return {
      success: true,
      message: `Successfully added ${saintData.name}`,
      stats: { added: 1, operation: 'single_add' }
    }
    
  } catch (error) {
    console.error('❌ Add single saint error:', error)
    return { success: false, message: 'Add single saint failed: ' + error.message }
  }
}

// UPDATE EXISTING SAINT (for modifications)
const updateExistingSaint = async (saintId, updateData) => {
  try {
    console.log(`🔄 Updating saint: ${saintId}...`)
    
    const saintRef = doc(db, 'saints', saintId)
    const existingSaint = await getDoc(saintRef)
    
    if (!existingSaint.exists()) {
      throw new Error(`Saint ${saintId} does not exist`)
    }
    
    const currentData = existingSaint.data()
    const updatedData = { ...currentData, ...updateData }
    
    await setDoc(saintRef, updatedData)
    console.log(`✅ Successfully updated: ${currentData.name}`)
    
    return {
      success: true,
      message: `Successfully updated ${currentData.name}`,
      stats: { updated: 1, operation: 'update' }
    }
    
  } catch (error) {
    console.error('❌ Update saint error:', error)
    return { success: false, message: 'Update saint failed: ' + error.message }
  }
}

// GET SAINTS STATISTICS
const getSaintsStats = async () => {
  try {
    const saintsRef = collection(db, 'saints')
    const saintsSnapshot = await getDocs(saintsRef)
    
    const stats = {
      total: saintsSnapshot.size,
      byRarity: {},
      byUnlockCondition: {},
      bySeries: {}
    }
    
    saintsSnapshot.forEach((doc) => {
      const saint = doc.data()
      
      // Count by rarity
      stats.byRarity[saint.rarity] = (stats.byRarity[saint.rarity] || 0) + 1
      
      // Count by unlock condition
      stats.byUnlockCondition[saint.unlockCondition] = (stats.byUnlockCondition[saint.unlockCondition] || 0) + 1
      
      // Count by series
      stats.bySeries[saint.luxlings_series] = (stats.bySeries[saint.luxlings_series] || 0) + 1
    })
    
    return stats
  } catch (error) {
    console.error('Error getting saints stats:', error)
    return null
  }
}

// HELPER: Generate next saint ID
const getNextSaintId = async () => {
  try {
    const saintsRef = collection(db, 'saints')
    const saintsSnapshot = await getDocs(saintsRef)
    
    let maxNumber = 0
    saintsSnapshot.forEach((doc) => {
      const saintId = doc.id
      if (saintId.startsWith('saint_')) {
        const number = parseInt(saintId.split('_')[1])
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number
        }
      }
    })
    
    return `saint_${String(maxNumber + 1).padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating next saint ID:', error)
    return 'saint_999'
  }
}

// HELPER: Validate unlock condition
const validateUnlockCondition = (unlockCondition) => {
  const validConditions = [
    'streak_7_days',
    'streak_30_days', 
    'streak_90_days',
    'first_book_grade_4',
    'first_book_grade_5',
    'first_book_grade_6',
    'first_book_grade_7',
    'first_book_grade_8',
    'milestone_20_books',
    'milestone_100_books',
    'seasonal_feast_day'
  ]
  
  return validConditions.includes(unlockCondition)
}

// EXPORTS
export { 
  setupAllSaints,           // Bulk setup (your current system)
  addNewSaintsOnly,         // Add only new saints from NEW_SAINTS_TO_ADD
  addSingleSaint,           // Add one saint with data
  updateExistingSaint,      // Update existing saint
  getSaintsStats,           // Get collection statistics
  getNextSaintId,           // Helper for new IDs
  validateUnlockCondition,  // Validation helper
  NEW_SAINTS_TO_ADD,        // Easy to modify for new saints
  COMPLETE_SAINTS_CATALOG   // Full catalog
}

export default {
  setupAllSaints,
  addNewSaintsOnly,
  addSingleSaint,
  updateExistingSaint,
  getSaintsStats,
  getNextSaintId,
  validateUnlockCondition
}