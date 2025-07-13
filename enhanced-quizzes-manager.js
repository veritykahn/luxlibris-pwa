// enhanced-quizzes-manager.js - Flexible quiz management system
import { db } from './lib/firebase'
import { collection, doc, setDoc, getDocs, getDoc, addDoc } from 'firebase/firestore'

// SAINTS QUIZZES DATA (from your saint quizzes.txt file)
const SAINTS_QUIZZES_DATA = [
{
  "quiz_id": "halo_hatchlings",
  "title": "Which Halo Hatchlings Saint Are You?",
  "description": "Discover which young saint from our Halo Hatchlings series matches your personality!",
  "series": "Halo Hatchlings",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"carlo": 5, "tarcisius": 5, "dominic": 5, "jose": 5, "pancras": 5, "stanislaus": 5, "john_berchmans": 5, "gabriel": 5}},
        {"text": "Girl", "points": {"maria": 5, "agnes": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What's your favorite way to spend free time?",
      "answers": [
        {"text": "Playing video games or using technology", "points": {"carlo": 3, "gabriel": 2}},
        {"text": "Playing sports or hiking outdoors", "points": {"jose": 3, "pancras": 2, "gabriel": 1}},
        {"text": "Reading or studying", "points": {"dominic": 3, "john_berchmans": 2, "stanislaus": 1}},
        {"text": "Helping others or volunteering", "points": {"maria": 2, "tarcisius": 1, "dominic": 1}},
        {"text": "Praying or going to church", "points": {"tarcisius": 3, "agnes": 2, "stanislaus": 2}}
      ]
    },
    {
      "id": 3,
      "question": "How do you handle it when someone is mean to you?",
      "answers": [
        {"text": "I forgive them and try to understand why they're upset", "points": {"maria": 3, "agnes": 2}},
        {"text": "I stand up for what's right, even if it's scary", "points": {"jose": 3, "tarcisius": 2, "pancras": 2}},
        {"text": "I try to make peace and help everyone get along", "points": {"dominic": 2, "john_berchmans": 2}},
        {"text": "I pray for them and ask God to help the situation", "points": {"stanislaus": 3, "agnes": 1}},
        {"text": "I focus on doing the right thing no matter what", "points": {"carlo": 2, "gabriel": 1}}
      ]
    },
    {
      "id": 4,
      "question": "What's most important to you?",
      "answers": [
        {"text": "Protecting and helping younger kids", "points": {"tarcisius": 3, "dominic": 2}},
        {"text": "Sharing my faith with others", "points": {"carlo": 3, "jose": 2, "agnes": 1}},
        {"text": "Being the best student I can be", "points": {"john_berchmans": 3, "dominic": 2, "stanislaus": 1}},
        {"text": "Standing up for what I believe in", "points": {"jose": 3, "pancras": 2, "maria": 1}},
        {"text": "Staying close to Jesus", "points": {"agnes": 3, "stanislaus": 2, "tarcisius": 1}}
      ]
    },
    {
      "id": 5,
      "question": "What kind of student are you?",
      "answers": [
        {"text": "I love learning and always do my homework", "points": {"john_berchmans": 3, "dominic": 2}},
        {"text": "I'm good at helping classmates understand things", "points": {"dominic": 3, "carlo": 2}},
        {"text": "I ask lots of questions about faith and God", "points": {"stanislaus": 3, "agnes": 2}},
        {"text": "I try to be a good example for others", "points": {"maria": 2, "tarcisius": 2, "pancras": 1}},
        {"text": "I use technology to learn and share cool things", "points": {"carlo": 3, "gabriel": 1}}
      ]
    },
    {
      "id": 6,
      "question": "How do you like to pray?",
      "answers": [
        {"text": "At Mass, especially during the Eucharist", "points": {"tarcisius": 3, "carlo": 2}},
        {"text": "Quietly by myself, talking to God", "points": {"agnes": 3, "stanislaus": 2}},
        {"text": "With my family or friends", "points": {"maria": 2, "dominic": 2}},
        {"text": "When I'm outside in nature", "points": {"gabriel": 2, "jose": 1}},
        {"text": "I sometimes struggle with prayer but keep trying", "points": {"john_berchmans": 2, "pancras": 1}}
      ]
    },
    {
      "id": 7,
      "question": "What would your friends say is your best quality?",
      "answers": [
        {"text": "I'm really forgiving and kind", "points": {"maria": 3, "agnes": 2}},
        {"text": "I'm brave and stand up for others", "points": {"jose": 3, "pancras": 2, "tarcisius": 1}},
        {"text": "I'm smart and love to learn", "points": {"carlo": 3, "john_berchmans": 2, "dominic": 1}},
        {"text": "I'm really holy and close to God", "points": {"agnes": 3, "stanislaus": 2}},
        {"text": "I'm fun and help others feel included", "points": {"dominic": 2, "gabriel": 2}}
      ]
    },
    {
      "id": 8,
      "question": "If you could have a special mission from God, what would it be?",
      "answers": [
        {"text": "To help people learn about Jesus online", "points": {"carlo": 3}},
        {"text": "To protect the Eucharist and help at Mass", "points": {"tarcisius": 3, "agnes": 1}},
        {"text": "To help other kids become saints", "points": {"dominic": 3, "john_berchmans": 2}},
        {"text": "To show people how to forgive", "points": {"maria": 3, "agnes": 1}},
        {"text": "To be brave for my faith even when it's hard", "points": {"jose": 3, "pancras": 2, "stanislaus": 1}}
      ]
    }
  ],
  "results": {
    "carlo": {
      "saint_id": "saint_101",
      "name": "Bl. Carlo Acutis",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_carlo.png",
      "description": "Like Carlo, you love using technology and modern tools to share your faith! You're curious, smart, and always looking for ways to help others discover how amazing God is. Carlo used computers to create a website about Eucharistic miracles before he died at 15. Keep using your gifts to spread God's love!",
      "fun_fact": "Carlo built an online database of Eucharistic miracles and loved playing video games!"
    },
    "tarcisius": {
      "saint_id": "saint_117", 
      "name": "St. Tarcisius",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_tarcisius.png",
      "description": "Like Tarcisius, you have a special love for the Eucharist and aren't afraid to protect what's sacred! You're brave, faithful, and willing to stand up for Jesus even when others don't understand. Tarcisius died protecting the Eucharist when he was just a young boy. Your courage inspires others!",
      "fun_fact": "Tarcisius is the patron saint of First Communion because he died protecting the Eucharist!"
    },
    "dominic": {
      "saint_id": "saint_082",
      "name": "St. Dominic Savio", 
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_dominicsavio.png",
      "description": "Like Dominic, you're a natural peacemaker who loves helping others become better! You're smart, kind, and always trying to do the right thing. Dominic was a student of St. John Bosco and lived a holy life even though he was only 14 when he died. Keep spreading peace and joy!",
      "fun_fact": "Dominic Savio once stopped a fight by holding up a crucifix and asking the boys to look at how Jesus suffered!"
    },
    "maria": {
      "saint_id": "saint_049",
      "name": "St. Maria Goretti",
      "series": "Halo Hatchlings", 
      "icon_asset": "assets/saints/saint_goretti.png",
      "description": "Like Maria, you have an incredibly forgiving heart and pure spirit! You choose kindness even when others are mean to you, and you show everyone what real love looks like. Maria forgave the person who hurt her before she died at 11. Your forgiveness can change the world!",
      "fun_fact": "Maria Goretti forgave her attacker and he later became her friend - even attending her canonization!"
    },
    "jose": {
      "saint_id": "saint_116",
      "name": "St. José Sánchez del Río",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_jose.png",
      "description": "Like José, you're incredibly brave and willing to stand up for your faith no matter what! You have a warrior's heart but also love God deeply. José died at 14 defending religious freedom in Mexico, shouting 'Viva Cristo Rey!' Your courage inspires others to be brave too!",
      "fun_fact": "José was so determined to fight for religious freedom that he convinced his parents to let him join the Cristero army at just 13!"
    },
    "agnes": {
      "saint_id": "saint_158",
      "name": "St. Agnes",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_agnes.png",
      "description": "Like Agnes, you have a pure heart and deep love for Jesus that nothing can shake! You're gentle but incredibly strong in your faith. Agnes chose to die rather than give up her faith when she was only 13. Your faithfulness shows others how beautiful it is to love God completely!",
      "fun_fact": "When Agnes was brought to be executed, her hair miraculously grew long enough to cover her completely!"
    },
    "pancras": {
      "saint_id": "saint_159",
      "name": "St. Pancras",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_pancras.png",
      "description": "Like Pancras, you're determined and won't compromise on what's right! You might be young, but you have the heart of a warrior for God. Pancras died at 14 rather than worship false gods. Your determination helps others stay strong in their faith too!",
      "fun_fact": "St. Pancras is one of the 'Ice Saints' - his feast day marks when the last frosts of winter end!"
    },
    "stanislaus": {
      "saint_id": "saint_160",
      "name": "St. Stanislaus Kostka", 
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_stanislaukostka.png",
      "description": "Like Stanislaus, you have an incredibly deep prayer life and strong devotion to God! You're willing to work hard and sacrifice for your faith. Stanislaus walked 350 miles to Rome to become a Jesuit when his family said no! Your dedication to God inspires everyone around you!",
      "fun_fact": "Stanislaus was so devoted that he would get up early every morning to pray, even when it was freezing cold!"
    },
    "john_berchmans": {
      "saint_id": "saint_161",
      "name": "St. John Berchmans",
      "series": "Halo Hatchlings", 
      "icon_asset": "assets/saints/saint_berchmans.png",
      "description": "Like John, you believe that small things done with great love matter most! You're a great student who pays attention to details and tries to do everything well. John said he would 'pay the greatest attention to the smallest things.' Your careful love makes a big difference!",
      "fun_fact": "John Berchmans carried his rosary, crucifix, and book of rules everywhere - they were found in his hands when he died!"
    },
    "gabriel": {
      "saint_id": "saint_162",
      "name": "St. Gabriel Possenti",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_gabriel.png",
      "description": "Like Gabriel, you're fun-loving but also deeply devoted to God and Mary! You know how to enjoy life while still being holy. Gabriel loved dancing and nice clothes before becoming a Passionist brother. Your joyful faith shows others that following God is the best adventure!",
      "fun_fact": "Gabriel is the patron saint of handgunners because he once disarmed a soldier with a perfect shot!"
    }
  }
},
{
  "quiz_id": "contemplative_cuties",
  "title": "Which Contemplative Cuties Saint Are You?",
  "description": "Discover which mystical prayer warrior from our Contemplative Cuties series matches your spiritual style!",
  "series": "Contemplative Cuties",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"john_cross": 5, "aelred": 5}},
        {"text": "Girl", "points": {"therese": 5, "catherine_siena": 5, "teresa_avila": 5, "brigid_sweden": 5, "gemma": 5, "rita": 5, "margaret_cortona": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What's your favorite way to pray?",
      "answers": [
        {"text": "Simple, childlike prayers talking to God like a friend", "points": {"therese": 3, "gemma": 2}},
        {"text": "Deep, intense prayer where I really focus", "points": {"teresa_avila": 3, "john_cross": 2, "catherine_siena": 1}},
        {"text": "Praying for other people's needs", "points": {"catherine_siena": 3, "brigid_sweden": 2, "rita": 2}},
        {"text": "Quiet prayer where I just sit with God", "points": {"john_cross": 3, "aelred": 2, "teresa_avila": 1}},
        {"text": "Asking God to help me with impossible problems", "points": {"rita": 3, "margaret_cortona": 2}}
      ]
    },
    {
      "id": 3,
      "question": "How do you handle really difficult situations?",
      "answers": [
        {"text": "I trust that God has a plan, even when I don't understand", "points": {"therese": 3, "rita": 2}},
        {"text": "I pray even harder and ask for God's strength", "points": {"teresa_avila": 2, "catherine_siena": 2, "john_cross": 2}},
        {"text": "I try to help others who are going through the same thing", "points": {"margaret_cortona": 3, "brigid_sweden": 2}},
        {"text": "I look for God's presence in the darkness", "points": {"john_cross": 3, "gemma": 2}},
        {"text": "I write or talk about my feelings with God", "points": {"aelred": 2, "teresa_avila": 1, "brigid_sweden": 1}}
      ]
    },
    {
      "id": 4,
      "question": "What do you think is the most important thing about following Jesus?",
      "answers": [
        {"text": "Loving God with a simple, trusting heart", "points": {"therese": 3, "gemma": 2}},
        {"text": "Working to make the world a better place", "points": {"catherine_siena": 3, "brigid_sweden": 2}},
        {"text": "Growing closer to God through prayer", "points": {"teresa_avila": 3, "john_cross": 2}},
        {"text": "Helping people who have made mistakes find God's love", "points": {"margaret_cortona": 3, "rita": 2}},
        {"text": "Building deep friendships based on faith", "points": {"aelred": 3, "therese": 1}}
      ]
    },
    {
      "id": 5,
      "question": "If you wrote a book, what would it be about?",
      "answers": [
        {"text": "How God loves us like a parent loves their child", "points": {"therese": 3, "gemma": 1}},
        {"text": "How to have conversations with God in prayer", "points": {"teresa_avila": 3, "aelred": 2}},
        {"text": "How Christians should help fix problems in the world", "points": {"catherine_siena": 3, "brigid_sweden": 2}},
        {"text": "How to find God even when life is really hard", "points": {"john_cross": 3, "rita": 2}},
        {"text": "How God can change anyone's life completely", "points": {"margaret_cortona": 3, "rita": 1}}
      ]
    },
    {
      "id": 6,
      "question": "What kind of friend are you?",
      "answers": [
        {"text": "The one who always sees the good in people", "points": {"therese": 2, "aelred": 2, "gemma": 1}},
        {"text": "The one who gives great advice and helps solve problems", "points": {"catherine_siena": 3, "teresa_avila": 2}},
        {"text": "The one who prays for friends and helps them spiritually", "points": {"brigid_sweden": 2, "rita": 2, "john_cross": 1}},
        {"text": "The one who's always there during tough times", "points": {"rita": 3, "margaret_cortona": 2}},
        {"text": "The one who helps friends become better people", "points": {"margaret_cortona": 2, "aelred": 3}}
      ]
    },
    {
      "id": 7,
      "question": "How do you deal with your own mistakes?",
      "answers": [
        {"text": "I trust that God loves me no matter what", "points": {"therese": 3, "rita": 2}},
        {"text": "I work really hard to do better next time", "points": {"catherine_siena": 2, "teresa_avila": 2}},
        {"text": "I use my mistakes to help others not make the same ones", "points": {"margaret_cortona": 3, "brigid_sweden": 1}},
        {"text": "I spend extra time in prayer asking for forgiveness", "points": {"gemma": 2, "john_cross": 2}},
        {"text": "I remember that God can bring good out of anything", "points": {"rita": 2, "aelred": 1, "therese": 1}}
      ]
    },
    {
      "id": 8,
      "question": "What draws you most to God?",
      "answers": [
        {"text": "God's incredible love and mercy", "points": {"therese": 3, "rita": 2, "margaret_cortona": 1}},
        {"text": "The mystery and beauty of who God is", "points": {"john_cross": 3, "teresa_avila": 2}},
        {"text": "How God calls us to help change the world", "points": {"catherine_siena": 3, "brigid_sweden": 2}},
        {"text": "The peace I feel when I pray", "points": {"gemma": 2, "aelred": 2, "teresa_avila": 1}},
        {"text": "How God never gives up on anyone", "points": {"margaret_cortona": 2, "rita": 3}}
      ]
    }
  ],
  "results": {
    "therese": {
      "saint_id": "saint_001",
      "name": "St. Therese of Lisieux",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_therese.png",
      "description": "Like Therese, you have a 'little way' of loving God with simple trust and childlike faith! You believe that God loves you completely just as you are, and you try to do small things with great love. Therese became a Doctor of the Church even though she died young at 24. Your simple faith is actually incredibly powerful!",
      "fun_fact": "Therese said she would 'spend her heaven doing good on earth' and promised to let fall a shower of roses!"
    },
    "catherine_siena": {
      "saint_id": "saint_012",
      "name": "St. Catherine of Siena",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_catherine.png",
      "description": "Like Catherine, you're a prayer warrior who also wants to change the world! You're not afraid to speak up for what's right, and you believe God wants you to help fix problems in the Church and society. Catherine advised popes and helped heal divisions. Your bold faith can move mountains!",
      "fun_fact": "Catherine never learned to write but dictated amazing letters - sometimes dictating to three different scribes at once!"
    },
    "teresa_avila": {
      "saint_id": "saint_073",
      "name": "St. Teresa of Avila", 
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_teresaavila.png",
      "description": "Like Teresa, you're a master of prayer who loves to teach others how to talk with God! You have deep spiritual experiences but also a very practical side. Teresa reformed the Carmelite order and wrote amazing books about prayer. Your prayer life is like a beautiful garden that inspires others!",
      "fun_fact": "Teresa was so practical that she said 'God walks among the pots and pans' - meaning you can find God even while doing chores!"
    },
    "john_cross": {
      "saint_id": "saint_072",
      "name": "St. John of the Cross",
      "series": "Contemplative Cuties", 
      "icon_asset": "assets/saints/saint_johncross.png",
      "description": "Like John, you're drawn to the mysterious, deep side of faith and aren't afraid of difficult spiritual journeys! You understand that sometimes we grow closest to God during hard times. John wrote 'Dark Night of the Soul' about finding God in difficulties. Your depth helps others not give up when faith gets challenging!",
      "fun_fact": "John was so short that when he worked with St. Teresa of Avila, she joked that she needed 'half a friar' and got a whole one!"
    },
    "brigid_sweden": {
      "saint_id": "saint_190",
      "name": "St. Brigid of Sweden",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_brigidsweden.png",
      "description": "Like Brigid, you have amazing spiritual visions and use them to help guide others! You care deeply about making the Church and world better. Brigid founded the Bridgettines and received revelations about Christ's Passion. Your spiritual insights help others understand God's plan!",
      "fun_fact": "Brigid received over 700 revelations from God and used them to advise kings and popes!"
    },
    "gemma": {
      "saint_id": "saint_151", 
      "name": "St. Gemma Galgani",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_gemma.png",
      "description": "Like Gemma, you have intense spiritual experiences and a deep love for Jesus's suffering! You're drawn to mystical prayer and feel things very deeply. Gemma received the stigmata and had visions of Jesus. Your passionate faith shows others how much God loves us!",
      "fun_fact": "Gemma experienced ecstasies every Thursday and Friday, reliving Jesus's passion with the wounds of Christ appearing on her body!"
    },
    "rita": {
      "saint_id": "saint_152",
      "name": "St. Rita of Cascia",
      "series": "Contemplative Cuties", 
      "icon_asset": "assets/saints/saint_rita.png",
      "description": "Like Rita, you're the person everyone turns to when they have impossible problems! You never give up praying, even when situations seem hopeless. Rita endured an abusive marriage but kept loving and praying. She's called the saint of impossible cases because nothing is too hard for God through her prayers!",
      "fun_fact": "Rita received a thorn wound on her forehead from a crucifix that lasted 15 years - showing her union with Christ's suffering!"
    },
    "margaret_cortona": {
      "saint_id": "saint_153",
      "name": "St. Margaret of Cortona",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_margaretcortona.png",
      "description": "Like Margaret, you understand that God can completely transform anyone's life! You might have made mistakes, but you know that makes God's love even more amazing. Margaret went from living in sin to becoming a great mystic. Your story of conversion inspires others to never give up on God's mercy!",
      "fun_fact": "Margaret was called the 'Second Magdalene' because of her dramatic conversion from a sinful life to extraordinary holiness!"
    },
    "aelred": {
      "saint_id": "saint_175",
      "name": "St. Aelred of Rievaulx",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_aelred.png",
      "description": "Like Aelred, you understand that friendship is one of God's greatest gifts! You know how to build deep, spiritual friendships that help everyone grow closer to God. Aelred wrote 'Spiritual Friendship' about how friends can help each other become saints. Your friendships are a reflection of God's love!",
      "fun_fact": "Aelred wrote that 'friendship is the most sacred thing' and believed that true friends help each other get to heaven!"
    }
  }
},
{
  "quiz_id": "founder_flames",
  "title": "Which Founder Flames Saint Are You?",
  "description": "Discover which entrepreneurial saint from our Founder Flames series matches your leadership style!",
  "series": "Founder Flames", 
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"francis": 5, "dominic": 5, "ignatius": 5, "john_bosco": 5, "jerome": 5, "vincent": 5, "bruno": 5, "paul_cross": 5, "enda": 5, "fructuosus": 5}},
        {"text": "Girl", "points": {"clare": 5, "angela": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What kind of leader are you?",
      "answers": [
        {"text": "I lead by example and inspire others to follow", "points": {"francis": 3, "clare": 2, "john_bosco": 1}},
        {"text": "I organize things well and make detailed plans", "points": {"ignatius": 3, "dominic": 2, "angela": 2}},
        {"text": "I see what people need and create solutions", "points": {"vincent": 3, "jerome": 2, "john_bosco": 1}},
        {"text": "I help others discover their gifts and use them", "points": {"john_bosco": 3, "angela": 2, "enda": 1}},
        {"text": "I prefer leading small groups in quiet ways", "points": {"bruno": 3, "paul_cross": 2, "fructuosus": 1}}
      ]
    },
    {
      "id": 3,
      "question": "What problem would you most want to solve?",
      "answers": [
        {"text": "Helping poor people get what they need", "points": {"francis": 3, "vincent": 3, "clare": 2}},
        {"text": "Making sure everyone learns about God", "points": {"dominic": 3, "ignatius": 2, "angela": 2}},
        {"text": "Helping kids who don't have families or homes", "points": {"jerome": 3, "john_bosco": 3}},
        {"text": "Teaching people how to pray and grow closer to God", "points": {"bruno": 2, "paul_cross": 2, "enda": 2}},
        {"text": "Giving girls and women better opportunities", "points": {"angela": 3, "clare": 2}}
      ]
    },
    {
      "id": 4,
      "question": "How do you like to spend your time?",
      "answers": [
        {"text": "Outside in nature, feeling close to God's creation", "points": {"francis": 3, "bruno": 2}},
        {"text": "Reading, studying, and learning new things", "points": {"dominic": 3, "ignatius": 2, "angela": 1}},
        {"text": "Playing with kids and helping them have fun", "points": {"john_bosco": 3, "jerome": 2}},
        {"text": "Helping people solve their problems", "points": {"vincent": 3, "jerome": 1}},
        {"text": "In quiet places where I can think and pray", "points": {"bruno": 3, "paul_cross": 2, "clare": 1}}
      ]
    },
    {
      "id": 5,
      "question": "What's your approach to following Jesus?",
      "answers": [
        {"text": "Living simply and sharing everything with others", "points": {"francis": 3, "clare": 3, "vincent": 1}},
        {"text": "Using my mind to understand and teach the faith", "points": {"dominic": 3, "ignatius": 2, "angela": 1}},
        {"text": "Being joyful and showing others that faith is fun", "points": {"john_bosco": 3, "francis": 1}},
        {"text": "Focusing on prayer and spiritual practices", "points": {"bruno": 3, "paul_cross": 3, "enda": 2}},
        {"text": "Working hard to help people in practical ways", "points": {"vincent": 3, "jerome": 2, "angela": 1}}
      ]
    },
    {
      "id": 6,
      "question": "If you started a club at school, what would it be?",
      "answers": [
        {"text": "An environmental club to care for creation", "points": {"francis": 3, "bruno": 1}},
        {"text": "A debate team or academic club", "points": {"dominic": 3, "ignatius": 2}},
        {"text": "A service club helping younger students", "points": {"john_bosco": 3, "jerome": 2, "angela": 1}},
        {"text": "A prayer or meditation group", "points": {"bruno": 2, "paul_cross": 2, "clare": 2, "enda": 1}},
        {"text": "A club that raises money for charity", "points": {"vincent": 3, "angela": 1}}
      ]
    },
    {
      "id": 7,
      "question": "What would motivate you to start something new?",
      "answers": [
        {"text": "Seeing people who are suffering and need help", "points": {"vincent": 3, "francis": 2, "jerome": 2}},
        {"text": "Realizing people don't understand something important", "points": {"dominic": 3, "ignatius": 2, "angela": 2}},
        {"text": "Wanting to give kids better opportunities", "points": {"john_bosco": 3, "jerome": 2, "angela": 1}},
        {"text": "Feeling called by God to do something specific", "points": {"paul_cross": 2, "clare": 2, "enda": 2, "ignatius": 1}},
        {"text": "Seeing that people need a place for quiet and prayer", "points": {"bruno": 3, "fructuosus": 2}}
      ]
    },
    {
      "id": 8,
      "question": "How do you handle obstacles and setbacks?",
      "answers": [
        {"text": "I trust that God will provide what's needed", "points": {"francis": 3, "clare": 2, "vincent": 1}},
        {"text": "I make a new plan and try a different approach", "points": {"ignatius": 3, "dominic": 2, "angela": 1}},
        {"text": "I keep my sense of humor and stay positive", "points": {"john_bosco": 3, "jerome": 1}},
        {"text": "I spend more time in prayer asking for guidance", "points": {"bruno": 2, "paul_cross": 2, "enda": 2}},
        {"text": "I work even harder to find solutions", "points": {"vincent": 2, "angela": 2, "fructuosus": 1}}
      ]
    }
  ],
  "results": {
    "francis": {
      "saint_id": "saint_002",
      "name": "St. Francis of Assisi",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_francis.png",
      "description": "Like Francis, you're a natural leader who inspires others through joy, simplicity, and love for all creation! You see God everywhere - in people, animals, and nature. Francis founded the Franciscans and was the first person to receive the stigmata. Your enthusiasm for God's goodness lights up everyone around you!",
      "fun_fact": "Francis was so connected to creation that birds would gather to listen when he preached to them!"
    },
    "dominic": {
      "saint_id": "saint_017", 
      "name": "St. Dominic",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_dominic.png",
      "description": "Like Dominic, you're a brilliant teacher and organizer who loves helping people understand their faith! You use your mind to serve God and aren't afraid to study hard. Dominic founded the Dominicans and promoted the Rosary. Your love of learning and teaching helps others grow closer to God!",
      "fun_fact": "Dominic received the Rosary from Mary herself in a vision and spread this powerful prayer everywhere!"
    },
    "ignatius": {
      "saint_id": "saint_020",
      "name": "St. Ignatius of Loyola", 
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_ignatius.png",
      "description": "Like Ignatius, you're a strategic thinker who turned your life completely around for God! You're great at making plans and helping others discern God's will. Ignatius founded the Jesuits after converting from military life and created the Spiritual Exercises. Your leadership helps others find their mission!",
      "fun_fact": "Ignatius was a soldier who converted while reading about saints during recovery from a battle injury!"
    },
    "clare": {
      "saint_id": "saint_022",
      "name": "St. Clare of Assisi",
      "series": "Founder Flames", 
      "icon_asset": "assets/saints/saint_clare.png",
      "description": "Like Clare, you're a courageous leader who follows God's call even when it's radical! You're willing to give up comfort to serve God and others. Clare founded the Poor Clares and once held up the Eucharist to stop an invading army. Your bold faith protects and inspires others!",
      "fun_fact": "Clare is the patron saint of television because she once saw Mass projected on her cell wall when she was too sick to attend!"
    },
    "john_bosco": {
      "saint_id": "saint_048",
      "name": "St. John Bosco",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_bosco.png",
      "description": "Like John Bosco, you love working with young people and believe in using fun to teach important lessons! You have a gift for making learning enjoyable and helping kids discover their potential. Don Bosco founded schools for poor boys and had prophetic dreams. Your joyful approach helps others want to be good!",
      "fun_fact": "John Bosco could do amazing magic tricks and acrobatics to get kids' attention before teaching them about God!"
    },
    "jerome": {
      "saint_id": "saint_062", 
      "name": "St. Jerome Emiliani",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_emiliani.png",
      "description": "Like Jerome, you have a special heart for kids who need extra help and protection! You see potential in everyone, especially those others might overlook. Jerome founded orphanages after converting from military life. Your caring leadership gives hope to those who need it most!",
      "fun_fact": "Jerome went from being a party-loving soldier to dedicating his life to caring for orphans and abandoned children!"
    },
    "vincent": {
      "saint_id": "saint_071",
      "name": "St. Vincent de Paul",
      "series": "Founder Flames", 
      "icon_asset": "assets/saints/saint_vincent.png",
      "description": "Like Vincent, you're amazing at organizing help for people in need! You see problems and immediately start thinking of practical solutions. Vincent founded the Daughters of Charity and organized care for the poor. Your compassionate leadership makes the world a more caring place!",
      "fun_fact": "Vincent was once captured by pirates and sold as a slave, but he converted his master to Christianity and escaped!"
    },
    "bruno": {
      "saint_id": "saint_089",
      "name": "St. Bruno",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_bruno.png",
      "description": "Like Bruno, you're a thoughtful leader who values deep prayer and contemplation! You prefer leading smaller groups and creating spaces for spiritual growth. Bruno founded the Carthusians, who live in silence and prayer. Your quiet leadership helps others find peace and focus!",
      "fun_fact": "Bruno founded an order so focused on silence that they rarely speak - they communicate mostly through hand signals!"
    },
    "angela": {
      "saint_id": "saint_102",
      "name": "St. Angela Merici",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_angela.png",
      "description": "Like Angela, you're passionate about education and empowering others, especially girls and women! You believe everyone deserves the chance to learn and grow. Angela founded the Ursuline Sisters to educate girls when few schools existed for them. Your leadership opens doors for others!",
      "fun_fact": "Angela was one of the first people to create schools specifically for girls, pioneering women's education!"
    },
    "paul_cross": {
      "saint_id": "saint_127",
      "name": "St. Paul of the Cross",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_paulcross.png",
      "description": "Like Paul, you're drawn to deep spiritual experiences and want to help others understand God's love through suffering! You're a contemplative leader who emphasizes prayer and reflection. Paul founded the Passionists and emphasized Christ's passion. Your spiritual leadership helps others find meaning in difficulties!",
      "fun_fact": "Paul had such intense prayer experiences that he would sometimes be found levitating during prayer!"
    },
    "enda": {
      "saint_id": "saint_231",
      "name": "St. Enda", 
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_enda.png",
      "description": "Like Enda, you're a pioneering leader who isn't afraid to start something completely new in challenging circumstances! You have the vision to see what could be and the courage to make it happen. Enda founded the first monastery on the Aran Islands. Your innovative leadership creates new possibilities!",
      "fun_fact": "Enda is called the 'Patriarch of Irish Monasticism' because he started the movement that produced so many Irish saints!"
    },
    "fructuosus": {
      "saint_id": "saint_236",
      "name": "St. Fructuosus",
      "series": "Founder Flames", 
      "icon_asset": "assets/saints/saint_fructuosus.png",
      "description": "Like Fructuosus, you're a dedicated leader who loves creating communities where people can grow spiritually! You're committed to the long-term work of building something that lasts. Fructuosus founded many monasteries and wrote rules for monastic life. Your steady leadership creates lasting positive change!",
      "fun_fact": "Fructuosus founded so many monasteries across Spain that he earned the nickname 'Father of Spanish Monasticism'!"
    }
  }
},
{
  "quiz_id": "pocket_patrons",
  "title": "Which Pocket Patrons Saint Are You?",
  "description": "Discover which helpful everyday saint from our Pocket Patrons series matches your practical, caring personality!",
  "series": "Pocket Patrons",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender", 
      "answers": [
        {"text": "Boy", "points": {"blaise": 5, "joseph": 5, "anthony": 5, "nicholas": 5, "lawrence": 5, "lazarus": 5, "isidore": 5, "felix": 5, "christopher": 5, "eligius": 5, "erasmus": 5, "fiacre": 5, "florian": 5}},
        {"text": "Girl", "points": {"martha": 5, "zita": 5, "apollonia": 5, "genevieve": 5}}
      ]
    },
    {
      "id": 2,
      "question": "How do you like to help people?",
      "answers": [
        {"text": "By finding things they've lost", "points": {"anthony": 3, "christopher": 1}},
        {"text": "By taking care of them when they're sick", "points": {"blaise": 3, "lazarus": 2, "apollonia": 1}},
        {"text": "By making sure they have food and shelter", "points": {"martha": 3, "lawrence": 2, "nicholas": 2}},
        {"text": "By working hard to provide for my family", "points": {"joseph": 3, "isidore": 2, "zita": 2}},
        {"text": "By keeping them safe during travels or dangers", "points": {"christopher": 3, "genevieve": 2, "florian": 1}}
      ]
    },
    {
      "id": 3,
      "question": "What's your favorite type of work or activity?",
      "answers": [
        {"text": "Cooking or making things with my hands", "points": {"martha": 3, "lawrence": 2, "eligius": 2}},
        {"text": "Taking care of animals or plants", "points": {"blaise": 2, "isidore": 3, "fiacre": 3}},
        {"text": "Helping people solve problems", "points": {"anthony": 3, "joseph": 2, "felix": 1}},
        {"text": "Cleaning and organizing spaces", "points": {"zita": 3, "martha": 1}},
        {"text": "Protecting people and keeping them safe", "points": {"florian": 3, "christopher": 2, "genevieve": 2}}
      ]
    },
    {
      "id": 4,
      "question": "When someone has a problem, what do you do first?",
      "answers": [
        {"text": "Listen carefully and try to understand exactly what they need", "points": {"martha": 2, "blaise": 2, "joseph": 1}},
        {"text": "Jump in immediately to help fix the situation", "points": {"florian": 3, "christopher": 2, "lawrence": 1}},
        {"text": "Help them find what they're looking for", "points": {"anthony": 3, "felix": 1}},
        {"text": "Offer them food, comfort, or a place to rest", "points": {"nicholas": 3, "martha": 2, "lazarus": 1}},
        {"text": "Share something I've learned from my own experience", "points": {"apollonia": 2, "zita": 2, "isidore": 1}}
      ]
    },
    {
      "id": 5,
      "question": "What kind of gifts do you like to give?",
      "answers": [
        {"text": "Practical things people really need", "points": {"nicholas": 3, "joseph": 2, "zita": 1}},
        {"text": "Homemade food or crafts", "points": {"martha": 3, "lawrence": 2, "eligius": 1}},
        {"text": "Something that helps them with their health", "points": {"blaise": 2, "apollonia": 2, "lazarus": 1}},
        {"text": "Tools or supplies for their work or hobbies", "points": {"isidore": 2, "fiacre": 2, "eligius": 2}},
        {"text": "Something that keeps them safe or protected", "points": {"christopher": 2, "florian": 2, "felix": 1}}
      ]
    },
    {
      "id": 6,
      "question": "What's your approach to solving everyday problems?",
      "answers": [
        {"text": "I pray to God and trust that help will come", "points": {"anthony": 3, "genevieve": 2, "felix": 1}},
        {"text": "I use practical skills and common sense", "points": {"martha": 3, "joseph": 2, "zita": 2}},
        {"text": "I work extra hard until the problem is solved", "points": {"isidore": 3, "florian": 2, "lawrence": 1}},
        {"text": "I focus on taking care of people's immediate needs first", "points": {"blaise": 2, "lazarus": 2, "nicholas": 2}},
        {"text": "I try to prevent the problem from happening again", "points": {"christopher": 2, "apollonia": 2, "genevieve": 1}}
      ]
    },
    {
      "id": 7,
      "question": "What motivates you most?",
      "answers": [
        {"text": "Seeing people reunited with what they've lost", "points": {"anthony": 3, "felix": 1}},
        {"text": "Knowing that families are taken care of", "points": {"joseph": 3, "martha": 2, "nicholas": 1}},
        {"text": "Helping people feel better when they're hurting", "points": {"blaise": 3, "apollonia": 2, "lazarus": 2}},
        {"text": "Making sure no one goes hungry or homeless", "points": {"lawrence": 3, "nicholas": 2, "zita": 1}},
        {"text": "Keeping people safe from harm", "points": {"florian": 3, "christopher": 2, "genevieve": 2}}
      ]
    },
    {
      "id": 8,
      "question": "How do others describe you?",
      "answers": [
        {"text": "The person who always knows where to find things", "points": {"anthony": 3, "felix": 1}},
        {"text": "Someone who takes great care of their family and home", "points": {"martha": 3, "joseph": 2, "zita": 2}},
        {"text": "A person who's great in emergencies", "points": {"florian": 3, "blaise": 2, "christopher": 1}},
        {"text": "Someone who's generous and always sharing", "points": {"lawrence": 3, "nicholas": 2, "lazarus": 1}},
        {"text": "A hard worker who never gives up", "points": {"isidore": 3, "eligius": 2, "fiacre": 1}}
      ]
    }
  ],
  "results": {
    "anthony": {
      "saint_id": "saint_016",
      "name": "St. Anthony of Padua", 
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_anthony.png",
      "description": "Like Anthony, you're the go-to person when something is lost or missing! You have a gift for helping people find what they're looking for - whether it's lost objects, lost hope, or lost faith. Anthony is famous for his powerful preaching and miracles. People pray 'Tony, Tony, turn around, something's lost and must be found!'",
      "fun_fact": "St. Anthony is often pictured holding Baby Jesus and lilies because Jesus appeared to him as a child during prayer!"
    },
    "blaise": {
      "saint_id": "saint_004",
      "name": "St. Blaise of Sebaste",
      "series": "Pocket Patrons", 
      "icon_asset": "assets/saints/saint_blaise.png",
      "description": "Like Blaise, you're a natural healer who cares deeply about people's health and wellbeing! You might be drawn to medicine, veterinary care, or just helping people feel better. Blaise was a bishop and doctor who healed people and animals. Catholics still get their throats blessed with candles on his feast day!",
      "fun_fact": "St. Blaise lived in a cave and wild animals would come to him for healing - he was like a holy veterinarian!"
    },
    "joseph": {
      "saint_id": "saint_007",
      "name": "St. Joseph",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_joseph.png",
      "description": "Like Joseph, you're incredibly reliable and hardworking, always putting your family first! You're the person everyone can count on to get things done. Joseph was Jesus's foster father and worked as a carpenter to provide for the Holy Family. You show God's love through faithful service and protection of others!",
      "fun_fact": "St. Joseph is honored twice a year - March 19 as the patron of fathers and May 1 as the patron of workers!"
    },
    "martha": {
      "saint_id": "saint_043",
      "name": "St. Martha",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_martha.png",
      "description": "Like Martha, you're amazing at hospitality and making people feel welcome and cared for! You love cooking, cleaning, and creating comfortable spaces for others. Martha served Jesus and trusted in His power, and she was also the sister of Mary and Lazarus. Your service makes everyone feel at home!",
      "fun_fact": "When Martha complained that Mary wasn't helping with dinner, Jesus gently reminded her that 'Mary has chosen the better part' - but He still appreciated Martha's service!"
    },
    "nicholas": {
      "saint_id": "saint_028",
      "name": "St. Nicholas",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_nicholas.png",
      "description": "Like Nicholas, you love giving gifts and helping people in secret! You have a generous heart and special care for children and those in need. Nicholas secretly gave gifts to help the poor and inspired the Santa Claus tradition. Your generous spirit brings joy to everyone around you!",
      "fun_fact": "St. Nicholas once threw bags of gold through a poor man's window at night to provide dowries for his three daughters!"
    },
    "lawrence": {
      "saint_id": "saint_040",
      "name": "St. Lawrence",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_lawrence.png",
      "description": "Like Lawrence, you believe in sharing with others and have an amazing sense of humor even in tough situations! You love cooking and feeding people, and you stand up for those who have less. Lawrence gave Church treasures to the poor and kept his sense of humor even during martyrdom. Your joy and generosity inspire everyone!",
      "fun_fact": "When being martyred on a gridiron, St. Lawrence joked to his executioners: 'Turn me over, I'm done on this side!'"
    },
    "lazarus": {
      "saint_id": "saint_044",
      "name": "St. Lazarus", 
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_lazarus.png",
      "description": "Like Lazarus, you understand suffering and have special compassion for people who are sick or struggling! You might have experienced difficult times yourself, which makes you even more caring toward others. Lazarus was raised from the dead by Jesus and shows us God's power over death. Your empathy brings hope to others!",
      "fun_fact": "Lazarus was such a good friend to Jesus that when he died, 'Jesus wept' - the shortest verse in the Bible!"
    },
    "isidore": {
      "saint_id": "saint_046",
      "name": "St. Isidore the Farmer",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_isidore.png",
      "description": "Like Isidore, you're an incredibly hard worker who finds God in everyday tasks! You understand that all honest work is valuable and you love being outdoors or working with your hands. Isidore was a farmer who loved prayer so much that angels were said to help him plow. Your work ethic and faithfulness inspire others!",
      "fun_fact": "Angels were reportedly seen helping St. Isidore plow his fields while he was at Mass - showing that God rewards those who put Him first!"
    },
    "zita": {
      "saint_id": "saint_047",
      "name": "St. Zita",
      "series": "Pocket Patrons", 
      "icon_asset": "assets/saints/saint_zita.png",
      "description": "Like Zita, you find dignity and purpose in serving others through everyday tasks! You understand that no job is too small when it's done with love. Zita was a domestic worker known for her charity and service to others. Your humble service shows everyone that all work done with love is holy!",
      "fun_fact": "St. Zita worked for the same family for 48 years and was so trusted and beloved that they treated her like family!"
    },
    "apollonia": {
      "saint_id": "saint_092",
      "name": "St. Apollonia",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_apollonia.png",
      "description": "Like Apollonia, you help people deal with pain and discomfort, always trying to make things better! You might be drawn to healthcare or just have a gift for comforting people when they're hurting. Apollonia was martyred by having her teeth broken, so people pray to her for dental problems. Your caring presence helps others through difficult times!",
      "fun_fact": "St. Apollonia is the patron saint of dentists and people pray to her when they have toothaches!"
    },
    "felix": {
      "saint_id": "saint_093",
      "name": "St. Felix of Nola",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_felix.png",
      "description": "Like Felix, you have a gift for helping people who are falsely accused or misunderstood! You stand up for truth and help protect people from unfair treatment. Felix was protected by spiders who wove webs to hide him from persecutors. Your integrity and protection of others shows God's justice!",
      "fun_fact": "Spiders spun webs over St. Felix's hiding place so quickly that his persecutors thought no one could be there!"
    },
    "christopher": {
      "saint_id": "saint_109", 
      "name": "St. Christopher",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_christopher.png",
      "description": "Like Christopher, you're always ready to help people get where they need to go safely! You might love traveling, or you're just someone others turn to for protection and guidance. Christopher carried travelers across a dangerous river and once carried the Christ child. Your protective spirit keeps others safe on their journeys!",
      "fun_fact": "St. Christopher's name means 'Christ-bearer' because he carried Jesus (disguised as a child) across a river!"
    },
    "genevieve": {
      "saint_id": "saint_122",
      "name": "St. Genevieve",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_genevieve.png",
      "description": "Like Genevieve, you're a protector who keeps entire communities safe through your prayers and actions! You have a gift for bringing people together and organizing help when it's needed. Genevieve protected Paris through prayer and was trusted by both kings and common people. Your leadership protects and unifies others!",
      "fun_fact": "St. Genevieve's prayers saved Paris from Attila the Hun - the barbarian army turned away without attacking the city!"
    },
    "eligius": {
      "saint_id": "saint_202",
      "name": "St. Eligius",
      "series": "Pocket Patrons", 
      "icon_asset": "assets/saints/saint_eligius.png",
      "description": "Like Eligius, you're skilled with your hands and love creating beautiful, useful things! You might enjoy art, crafts, or working with tools and machines. Eligius was a goldsmith who made crowns for kings before becoming a bishop. Your craftsmanship and creativity reflect God's own creative nature!",
      "fun_fact": "St. Eligius was so skilled that he made crowns and religious artifacts for French kings before God called him to be a bishop!"
    },
    "erasmus": {
      "saint_id": "saint_203",
      "name": "St. Erasmus",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_erasmus.png",
      "description": "Like Erasmus (also called St. Elmo), you're a protector of people who face dangerous situations! You might be drawn to helping sailors, travelers, or anyone dealing with storms - both literal and metaphorical. Erasmus protected sailors and is invoked during intestinal problems. Your protective prayers keep others safe in turbulent times!",
      "fun_fact": "St. Elmo's fire - the electrical phenomenon that appears on ships' masts during storms - is named after St. Erasmus!"
    },
    "fiacre": {
      "saint_id": "saint_207",
      "name": "St. Fiacre",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_fiacre.png",
      "description": "Like Fiacre, you have green thumbs and love working in gardens or with plants! You find peace in nature and have a gift for making things grow. Fiacre was an Irish hermit who became the patron of gardeners after clearing land for his hermitage with miraculous speed. Your connection to creation helps others see God's beauty!",
      "fun_fact": "St. Fiacre cleared land for his hermitage so quickly that people thought it was miraculous - he just turned over the soil with his staff!"
    },
    "florian": {
      "saint_id": "saint_210",
      "name": "St. Florian",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_florian.png",
      "description": "Like Florian, you're brave in the face of danger and always ready to help in emergencies! You might be drawn to firefighting, rescue work, or just being the person others turn to in crisis situations. Florian was a Roman soldier martyred for his faith and is now the patron of firefighters. Your courage saves others from harm!",
      "fun_fact": "St. Florian was martyred by being drowned with a millstone around his neck, but now he protects people from drowning and fires!"
    }
  }
},
{
  "quiz_id": "super_sancti",
  "title": "Which Super Sancti Saint Are You?",
  "description": "Discover which miracle-working powerhouse from our Super Sancti series matches your amazing spirit!",
  "series": "Super Sancti",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"boniface": 5, "cyril": 5, "methodius": 5, "francis_xavier": 5, "sebastian": 5, "martin": 5, "juan_diego": 5, "longinus": 5, "dismas": 5, "maximilian": 5, "oscar": 5, "vincent_ferrer": 5, "peter_chanel": 5, "kim": 5, "miki": 5, "lwanga": 5, "lorenzo": 5, "demetrius": 5, "edmund": 5}},
        {"text": "Girl", "points": {"joan": 5, "cecilia": 5, "lucy": 5, "kateri": 5, "rose": 5, "barbara_saint": 5, "perpetua": 5, "agatha": 5, "edith": 5, "damian_molokai": 5, "teresa_calcutta": 5, "jp2": 5, "barbara_yi": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What kind of 'superpower' would you most want?",
      "answers": [
        {"text": "Leading armies and being incredibly brave", "points": {"joan": 3, "sebastian": 2, "maximilian": 1}},
        {"text": "Healing people and performing miracles", "points": {"damian_molokai": 3, "teresa_calcutta": 2, "peter_chanel": 1}},
        {"text": "Converting entire countries to faith", "points": {"boniface": 3, "francis_xavier": 2, "cyril": 2, "methodius": 2}},
        {"text": "Protecting people from harm and evil", "points": {"barbara_saint": 2, "longinus": 2, "demetrius": 2}},
        {"text": "Inspiring people through music and art", "points": {"cecilia": 3, "lucy": 2}}
      ]
    },
    {
      "id": 3,
      "question": "How do you handle really scary situations?",
      "answers": [
        {"text": "I trust God completely and fear nothing", "points": {"joan": 3, "maximilian": 3, "oscar": 2}},
        {"text": "I use my courage to protect others", "points": {"sebastian": 3, "demetrius": 2, "lwanga": 1}},
        {"text": "I stay calm and pray for guidance", "points": {"kateri": 2, "teresa_calcutta": 2, "jp2": 1}},
        {"text": "I speak the truth no matter the cost", "points": {"oscar": 3, "dismas": 2, "edmund": 1}},
        {"text": "I rely on God's strength to get through", "points": {"lucy": 2, "agatha": 2, "barbara_yi": 1}}
      ]
    },
    {
      "id": 4,
      "question": "What's your approach to helping others?",
      "answers": [
        {"text": "I work with the poorest and most forgotten people", "points": {"teresa_calcutta": 3, "damian_molokai": 3, "martin": 2}},
        {"text": "I travel far to bring people the Gospel", "points": {"francis_xavier": 3, "boniface": 2, "peter_chanel": 2}},
        {"text": "I stand up for those who are oppressed", "points": {"oscar": 3, "maximilian": 2, "joan": 1}},
        {"text": "I help people connect with their culture and faith", "points": {"kateri": 2, "juan_diego": 2, "cyril": 1, "methodius": 1}},
        {"text": "I use my talents to inspire and uplift others", "points": {"cecilia": 3, "vincent_ferrer": 2}}
      ]
    },
    {
      "id": 5,
      "question": "What motivates you most?",
      "answers": [
        {"text": "Love for my country and people", "points": {"joan": 3, "kim": 2, "lorenzo": 2}},
        {"text": "Desire to serve the suffering", "points": {"damian_molokai": 3, "teresa_calcutta": 2, "agatha": 1}},
        {"text": "Passion for spreading God's word", "points": {"francis_xavier": 2, "boniface": 2, "vincent_ferrer": 2}},
        {"text": "Protecting the innocent and weak", "points": {"maximilian": 3, "lwanga": 2, "barbara_saint": 1}},
        {"text": "Living my faith authentically", "points": {"kateri": 2, "rose": 2, "edith": 2}}
      ]
    },
    {
      "id": 6,
      "question": "How do you deal with persecution or bullying?",
      "answers": [
        {"text": "I stand firm and never back down", "points": {"joan": 3, "sebastian": 2, "perpetua": 2}},
        {"text": "I forgive my enemies and pray for them", "points": {"dismas": 3, "longinus": 2, "martin": 1}},
        {"text": "I continue my mission no matter what", "points": {"oscar": 3, "maximilian": 2, "damian_molokai": 1}},
        {"text": "I find strength in my cultural identity", "points": {"kateri": 2, "juan_diego": 2, "kim": 1}},
        {"text": "I use my gifts to rise above the negativity", "points": {"cecilia": 2, "lucy": 2, "teresa_calcutta": 1}}
      ]
    },
    {
      "id": 7,
      "question": "What kind of legacy do you want to leave?",
      "answers": [
        {"text": "Being remembered as incredibly brave", "points": {"joan": 3, "lwanga": 2, "miki": 2}},
        {"text": "Bringing entire nations to God", "points": {"boniface": 3, "francis_xavier": 2, "cyril": 1, "methodius": 1}},
        {"text": "Showing that God's love reaches everyone", "points": {"teresa_calcutta": 3, "martin": 2, "damian_molokai": 1}},
        {"text": "Inspiring people through beauty and art", "points": {"cecilia": 3, "lucy": 2}},
        {"text": "Proving that young people can be heroes too", "points": {"sebastian": 2, "lwanga": 2, "lorenzo": 2}}
      ]
    },
    {
      "id": 8,
      "question": "What's your greatest strength?",
      "answers": [
        {"text": "Unshakeable courage in the face of danger", "points": {"joan": 3, "maximilian": 2, "oscar": 2}},
        {"text": "Ability to see God in everyone, especially outcasts", "points": {"damian_molokai": 3, "teresa_calcutta": 2, "martin": 2}},
        {"text": "Gift for bringing different cultures together", "points": {"cyril": 2, "methodius": 2, "kateri": 2, "francis_xavier": 1}},
        {"text": "Talent for inspiring others through my example", "points": {"cecilia": 2, "vincent_ferrer": 2, "jp2": 2}},
        {"text": "Willingness to sacrifice everything for others", "points": {"maximilian": 3, "lwanga": 2, "peter_chanel": 1}}
      ]
    }
  ],
  "results": {
    "joan": {
      "saint_id": "saint_003",
      "name": "St. Joan of Arc",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_joan.png",
      "description": "Like Joan, you're a fearless leader with incredible courage! You trust God completely and aren't afraid to stand up for what's right, even when everyone doubts you. Joan led French armies at 17 and was later canonized as a saint. Your warrior spirit inspires others to be brave for God!",
      "fun_fact": "Joan convinced the French court she was sent by God by revealing royal secrets that only heaven could know!"
    },
    "cecilia": {
      "saint_id": "saint_005",
      "name": "St. Cecilia",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_cecilia.png",
      "description": "Like Cecilia, you have amazing artistic gifts and use them to praise God! You find beauty everywhere and help others experience the divine through music, art, or creativity. Cecilia sang to God even while facing martyrdom. Your artistic spirit lifts others' hearts to heaven!",
      "fun_fact": "St. Cecilia is often shown with musical instruments because she sang hymns to God in her heart!"
    },
    "lucy": {
      "saint_id": "saint_009",
      "name": "St. Lucy",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_lucy.png",
      "description": "Like Lucy, you're a bright light in the darkness who helps others see clearly! You have a gift for bringing hope and illuminating truth. Lucy's name means 'light' and she was martyred for her faith. Your light guides others to God!",
      "fun_fact": "St. Lucy is often depicted holding her eyes on a plate because her name means 'light'!"
    },
    "kateri": {
      "saint_id": "saint_010",
      "name": "St. Kateri Tekakwitha",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_kateri.png",
      "description": "Like Kateri, you bridge different worlds and cultures with grace! You have a deep prayer life and special connection to nature. Kateri was the first Native American saint and is called the 'Lily of the Mohawks.' Your cultural pride and faith inspire others!",
      "fun_fact": "Kateri's face was scarred by smallpox, but when she died, witnesses said her face became beautiful and radiant!"
    },
    "maximilian": {
      "saint_id": "saint_013",
      "name": "St. Maximilian Kolbe",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_kolbe.png",
      "description": "Like Maximilian, you have incredible love and are willing to sacrifice everything for others! You see each person as precious and worth saving. Maximilian gave his life for another man in Auschwitz. Your sacrificial love shows others God's heart!",
      "fun_fact": "Maximilian volunteered to die in place of a stranger with a family, showing the ultimate act of love!"
    },
    "rose": {
      "saint_id": "saint_021",
      "name": "St. Rose of Lima",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_rose.png",
      "description": "Like Rose, you have incredible dedication and aren't afraid of doing difficult things for God! You understand that beauty comes from sacrifice and love. Rose was the first saint of the Americas and known for her piety. Your commitment inspires others to go deeper!",
      "fun_fact": "Rose wore a crown of thorns as penance, showing her total dedication to following Jesus!"
    },
    "sebastian": {
      "saint_id": "saint_029",
      "name": "St. Sebastian",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_sebastian.png",
      "description": "Like Sebastian, you're incredibly resilient and bounce back from anything! You have amazing physical and spiritual strength. Sebastian survived being shot with arrows and became a symbol of courage. Your resilience helps others never give up!",
      "fun_fact": "Sebastian survived being shot with arrows but was later beaten to death - he's a symbol of never giving up!"
    },
    "martin": {
      "saint_id": "saint_031",
      "name": "St. Martin de Porres",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_martin.png",
      "description": "Like Martin, you see beyond skin color and social differences to the person inside! You have a special gift for healing and helping the sick. Martin was the first Black saint of the Americas and known for his humility. Your inclusive love breaks down barriers!",
      "fun_fact": "Martin de Porres could reportedly fly and bilocate (be in two places at once) while helping the sick!"
    },
    "juan_diego": {
      "saint_id": "saint_032",
      "name": "St. Juan Diego",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_juan.png",
      "description": "Like Juan Diego, you're humble but chosen for amazing things! You have a special relationship with Mary and help bring different cultures together. Juan Diego received the miraculous image of Our Lady of Guadalupe. Your humility makes you perfect for God's big plans!",
      "fun_fact": "The miraculous image of Our Lady of Guadalupe on Juan Diego's tilma has lasted over 500 years without decay!"
    },
    "perpetua": {
      "saint_id": "saint_039",
      "name": "St. Perpetua & St. Felicity",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_perpetua.png",
      "description": "Like Perpetua and Felicity, you're incredibly brave and loyal to your friends! You face challenges together and support each other through everything. These two women were martyred together and their courage inspired many. Your friendship is a powerful force for good!",
      "fun_fact": "Perpetua wrote her own account of her imprisonment, making her one of the first Christian women authors!"
    },
    "barbara_saint": {
      "saint_id": "saint_055",
      "name": "St. Barbara",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_barbara.png",
      "description": "Like Barbara, you're a protector who keeps others safe from danger! You might be drawn to emergency services or just helping people in crisis. Barbara is the patron of firefighters and those in dangerous work. Your protective spirit saves lives!",
      "fun_fact": "St. Barbara is invoked during thunderstorms because her father was struck by lightning after martyring her!"
    },
    "boniface": {
      "saint_id": "saint_079",
      "name": "St. Boniface",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_boniface.png",
      "description": "Like Boniface, you're fearless about challenging false beliefs and showing God's power! You're not afraid to confront what's wrong and demonstrate the truth. Boniface chopped down a pagan tree to prove God's power. Your bold faith converts hearts!",
      "fun_fact": "Boniface chopped down Thor's sacred oak tree and when nothing bad happened, the pagans converted to Christianity!"
    },
    "cyril": {
      "saint_id": "saint_080",
      "name": "St. Cyril",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_cyril.png",
      "description": "Like Cyril, you're brilliant at communication and helping people understand important things! You might be great with languages or technology. Cyril created the Cyrillic alphabet to help evangelize Eastern Europe. Your communication gifts spread God's word!",
      "fun_fact": "Cyril invented the Cyrillic alphabet that's still used by millions of people today in Russia and Eastern Europe!"
    },
    "methodius": {
      "saint_id": "saint_081",
      "name": "St. Methodius",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_methodius.png",
      "description": "Like Methodius, you're an amazing teammate who works perfectly with others! You and your partners accomplish incredible things together. Methodius worked with his brother Cyril to bring Christianity to Slavic peoples. Your teamwork multiplies God's impact!",
      "fun_fact": "Methodius and Cyril worked so well together that they're called the 'Apostles to the Slavs' and are celebrated together!"
    },
    "francis_xavier": {
      "saint_id": "saint_083",
      "name": "St. Francis Xavier",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_francisxavier.png",
      "description": "Like Francis Xavier, you're an incredible traveler and adventurer for God! You love exploring new places and meeting new people to share your faith. Francis spread Christianity in India and Japan. Your missionary spirit brings God to the ends of the earth!",
      "fun_fact": "Francis Xavier traveled over 100,000 miles and baptized over 100,000 people in just 10 years!"
    },
    "agatha": {
      "saint_id": "saint_091",
      "name": "St. Agatha",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_agatha.png",
      "description": "Like Agatha, you're incredibly strong and help protect other women and girls! You refuse to compromise your values no matter what. Agatha was martyred for refusing to deny Christ and is a protector of women. Your strength empowers others!",
      "fun_fact": "St. Agatha's veil was carried in procession during volcanic eruptions and reportedly stopped the lava flow!"
    },
    "longinus": {
      "saint_id": "saint_095",
      "name": "St. Longinus",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_longinus.png",
      "description": "Like Longinus, you have an amazing conversion story and understand God's mercy! You might have made mistakes in the past, but God transformed you completely. Longinus was the Roman soldier who pierced Christ's side but became a saint. Your transformation inspires others!",
      "fun_fact": "Longinus was converted instantly when Jesus's blood touched his eyes and healed his vision problems!"
    },
    "dismas": {
      "saint_id": "saint_097",
      "name": "St. Dismas (Good Thief)",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_dismas.png",
      "description": "Like Dismas, you understand that it's never too late to turn to God! You have a gift for recognizing Jesus even in difficult circumstances. Dismas was crucified beside Jesus and was the first person canonized by Christ Himself. Your last-minute faith gives hope to everyone!",
      "fun_fact": "Dismas was the first saint canonized by Jesus Himself when He said 'Today you will be with me in Paradise'!"
    },
    "edith": {
      "saint_id": "saint_060",
      "name": "St. Edith Stein",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_stein.png",
      "description": "Like Edith, you're incredibly brilliant and use your mind to serve God! You bridge different worlds - perhaps faith and science, or different cultures. Edith was a Jewish philosopher who converted and died in Auschwitz. Your intellectual gifts defend the faith!",
      "fun_fact": "Edith Stein was a brilliant philosopher who went from atheism to Judaism to Catholicism to martyrdom!"
    },
    "damian_molokai": {
      "saint_id": "saint_061",
      "name": "St. Damian of Molokai",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_damianmolokai.png",
      "description": "Like Damian, you have incredible compassion for people others are afraid to help! You're willing to risk everything to serve the forgotten and rejected. Damian served lepers in Hawaii until he contracted the disease himself. Your fearless love reaches the untouchable!",
      "fun_fact": "Damian called the lepers 'my people' and eventually said 'we lepers' when he contracted the disease himself!"
    },
    "oscar": {
      "saint_id": "saint_069",
      "name": "St. Oscar Romero",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_romero.png",
      "description": "Like Oscar, you speak truth to power and defend the oppressed fearlessly! You use your voice to fight injustice even when it's dangerous. Oscar spoke out against injustice in El Salvador and was martyred while saying Mass. Your prophetic voice demands justice!",
      "fun_fact": "Oscar Romero was shot while consecrating the Eucharist, giving his life for justice and the poor!"
    },
    "teresa_calcutta": {
      "saint_id": "saint_100",
      "name": "St. Teresa of Calcutta",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_teresa.png",
      "description": "Like Mother Teresa, you see Jesus in the poorest of the poor and serve with incredible love! You're drawn to help people others overlook. Teresa served in India's slums and won the Nobel Peace Prize. Your compassionate service transforms the world!",
      "fun_fact": "Mother Teresa said she saw Jesus in every poor person she served and treated each one as Christ himself!"
    },
    "jp2": {
      "saint_id": "saint_099",
      "name": "St. John Paul II",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_jp2.png",
      "description": "Like John Paul II, you're a dynamic leader who inspires young people everywhere! You have charisma and energy that draws others to God. JP2 was the first Polish pope and beloved by youth worldwide. Your enthusiasm makes faith exciting and attractive!",
      "fun_fact": "John Paul II attracted the largest crowds in human history and started World Youth Day for young Catholics!"
    },
    "kim": {
      "saint_id": "saint_111",
      "name": "St. Andrew Kim Taegon",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_kim.png",
      "description": "Like Andrew Kim, you're a trailblazer who opens new paths for others to follow! You're willing to be first and face the unknown. Kim was the first Korean priest and was martyred for spreading the faith. Your pioneering spirit creates opportunities for others!",
      "fun_fact": "Andrew Kim was the first Korean Catholic priest and paved the way for Christianity in Korea!"
    },
    "miki": {
      "saint_id": "saint_112",
      "name": "St. Paul Miki",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_miki.png",
      "description": "Like Paul Miki, you're incredibly brave about sharing your faith even in hostile environments! You don't back down when others pressure you to be quiet about God. Miki was a Jesuit missionary crucified in Japan. Your bold witness converts hearts!",
      "fun_fact": "Paul Miki preached from the cross as he was being crucified, converting people with his final sermon!"
    },
    "lwanga": {
      "saint_id": "saint_113",
      "name": "St. Charles Lwanga",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_lwanga.png",
      "description": "Like Charles Lwanga, you're a natural leader who protects young people and leads them to holiness! You stand up to authority when it asks you to do wrong. Lwanga led a group of young martyrs in Uganda. Your leadership saves souls!",
      "fun_fact": "Charles Lwanga led 22 young men to martyrdom rather than participate in the king's immoral demands!"
    },
    "barbara_yi": {
      "saint_id": "saint_114",
      "name": "St. Barbara Yi",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_barbarayi.png",
      "description": "Like Barbara Yi, you're courageously faithful even when it costs you everything! You don't hide your beliefs even when it's dangerous. Barbara was part of the Korean Martyrs who died for their faith. Your courageous witness inspires others to stand firm!",
      "fun_fact": "Barbara Yi was one of 103 Korean martyrs who chose death rather than renounce their Catholic faith!"
    },
    "lorenzo": {
      "saint_id": "saint_115",
      "name": "St. Lorenzo Ruiz",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_lorenzo.png",
      "description": "Like Lorenzo, you represent the faith of your people with pride and courage! You bridge cultures and show that saints come from everywhere. Lorenzo was the first Filipino saint and was martyred in Japan. Your cultural witness shows God's universal love!",
      "fun_fact": "Lorenzo Ruiz was a family man who accidentally became a missionary and then a martyr in Japan!"
    },
    "demetrius": {
      "saint_id": "saint_198",
      "name": "St. Demetrius",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_demetrius.png",
      "description": "Like Demetrius, you're a spiritual warrior who fights against evil with faith as your weapon! You protect your community from spiritual and physical threats. Demetrius was a Roman soldier martyred for his Christian faith. Your warrior spirit defends the innocent!",
      "fun_fact": "St. Demetrius is so revered in the Eastern Church that he's called the 'Great Martyr' and 'Myrrh-streamer'!"
    },
    "edmund": {
      "saint_id": "saint_201",
      "name": "St. Edmund",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_edmund.png",
      "description": "Like Edmund, you're a noble leader who never compromises your faith for earthly power! You choose to suffer rather than deny Christ. Edmund was a king martyred by Vikings for refusing to deny his faith. Your royal faithfulness inspires loyalty to God!",
      "fun_fact": "King Edmund was shot with arrows and beheaded by Vikings but refused to deny Christ to save his kingdom!"
    },
    "vincent_ferrer": {
      "saint_id": "saint_126",
      "name": "St. Vincent Ferrer",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_ferrer.png",
      "description": "Like Vincent Ferrer, you're an incredible preacher who can move hearts and convert souls! You have a gift for speaking truth that changes lives. Vincent preached across Europe and performed many miracles. Your words have supernatural power to transform!",
      "fun_fact": "Vincent Ferrer could speak in his native language but people of different countries understood him perfectly!"
    },
    "peter_chanel": {
      "saint_id": "saint_108",
      "name": "St. Peter Chanel",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_chanel.png",
      "description": "Like Peter Chanel, you're willing to go to the ends of the earth to share God's love! You don't give up even when your mission seems impossible. Peter was the first martyr of Oceania and evangelized in the Pacific Islands. Your perseverance plants seeds that bloom after you're gone!",
      "fun_fact": "Peter Chanel was killed by the chief whose son he converted, but the chief later converted and the whole island became Christian!"
    }
  }
},
{
  "quiz_id": "sacred_circle",
  "title": "Which Sacred Circle Saint Are You?",
  "description": "Discover which apostle or close disciple from Jesus's Sacred Circle matches your faithful heart!",
  "series": "Sacred Circle",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "How would you have reacted when Jesus first called you to follow Him?",
      "answers": [
        {"text": "I would drop everything immediately and follow", "points": {"peter": 3, "andrew": 3, "john_baptist": 2}},
        {"text": "I would ask lots of questions first", "points": {"thomas": 3, "philip": 2, "matthew": 1}},
        {"text": "I would be excited to bring my friends too", "points": {"andrew": 3, "philip": 3, "bartholomew": 2}},
        {"text": "I would feel unworthy but say yes anyway", "points": {"matthew": 3, "peter": 2, "jude": 1}},
        {"text": "I would want to know if Jesus was really the Messiah", "points": {"thomas": 2, "john_baptist": 2, "simon_zealot": 1}}
      ]
    },
    {
      "id": 2,
      "question": "What role would you naturally take in Jesus's group?",
      "answers": [
        {"text": "The leader who speaks for everyone", "points": {"peter": 3, "james_greater": 2}},
        {"text": "The one who brings new people to meet Jesus", "points": {"andrew": 3, "philip": 3}},
        {"text": "The practical one who handles money and details", "points": {"matthew": 3, "bartholomew": 2}},
        {"text": "Jesus's closest friend and confidant", "points": {"john_evangelist": 3, "james_lesser": 1}},
        {"text": "The one who asks the hard questions", "points": {"thomas": 3, "jude": 2}}
      ]
    },
    {
      "id": 3,
      "question": "How do you handle it when you make mistakes?",
      "answers": [
        {"text": "I feel terrible but ask for forgiveness", "points": {"peter": 3, "matthew": 2}},
        {"text": "I learn from it and try to do better", "points": {"thomas": 2, "philip": 2, "bartholomew": 2}},
        {"text": "I help others not make the same mistake", "points": {"andrew": 2, "james_lesser": 2}},
        {"text": "I trust that God can use even my mistakes for good", "points": {"john_evangelist": 2, "jude": 2}},
        {"text": "I work extra hard to make up for it", "points": {"matthew": 3, "simon_zealot": 2}}
      ]
    },
    {
      "id": 4,
      "question": "What's your approach to sharing your faith?",
      "answers": [
        {"text": "I'm passionate and sometimes speak before thinking", "points": {"peter": 3, "james_greater": 2}},
        {"text": "I love introducing people to Jesus personally", "points": {"andrew": 3, "philip": 2}},
        {"text": "I share through my changed life and example", "points": {"matthew": 3, "bartholomew": 2}},
        {"text": "I write or tell stories about Jesus's love", "points": {"john_evangelist": 3, "james_lesser": 1}},
        {"text": "I make sure people understand exactly what I mean", "points": {"thomas": 3, "jude": 2}}
      ]
    },
    {
      "id": 5,
      "question": "How do you prefer to pray or worship?",
      "answers": [
        {"text": "I like to pray out loud and with energy", "points": {"peter": 3, "john_baptist": 2}},
        {"text": "I prefer quiet, personal time with God", "points": {"john_evangelist": 3, "andrew": 2}},
        {"text": "I like to pray with others in community", "points": {"philip": 2, "bartholomew": 2, "james_lesser": 2}},
        {"text": "I need to understand what I'm praying about", "points": {"thomas": 3, "matthew": 2}},
        {"text": "I like traditional prayers and rituals", "points": {"simon_zealot": 2, "jude": 2}}
      ]
    },
    {
      "id": 6,
      "question": "What would be your biggest strength as a disciple?",
      "answers": [
        {"text": "My enthusiasm and willingness to take risks", "points": {"peter": 3, "james_greater": 2}},
        {"text": "My ability to connect people with Jesus", "points": {"andrew": 3, "philip": 3}},
        {"text": "My complete transformation and gratitude", "points": {"matthew": 3, "mary_magdalene": 2}},
        {"text": "My deep love and loyalty to Jesus", "points": {"john_evangelist": 3, "mary_magdalene": 2}},
        {"text": "My honest questions that help others understand", "points": {"thomas": 3, "jude": 1}}
      ]
    },
    {
      "id": 7,
      "question": "How would you want to serve Jesus after His resurrection?",
      "answers": [
        {"text": "Leading the Church and preaching boldly", "points": {"peter": 3, "james_greater": 2}},
        {"text": "Traveling to share the Gospel with new people", "points": {"andrew": 2, "thomas": 2, "bartholomew": 2}},
        {"text": "Writing down Jesus's teachings so they're preserved", "points": {"matthew": 3, "john_evangelist": 3}},
        {"text": "Helping people who feel far from God", "points": {"matthew": 2, "jude": 2}},
        {"text": "Making sure people really understand the truth", "points": {"thomas": 3, "philip": 2}}
      ]
    },
    {
      "id": 8,
      "question": "What drew you most to Jesus?",
      "answers": [
        {"text": "His powerful personality and leadership", "points": {"peter": 3, "james_greater": 2}},
        {"text": "The way He cared for ordinary people", "points": {"andrew": 2, "matthew": 2, "philip": 2}},
        {"text": "His incredible love and mercy", "points": {"john_evangelist": 3, "mary_magdalene": 3}},
        {"text": "His wisdom and ability to answer every question", "points": {"thomas": 3, "bartholomew": 2}},
        {"text": "His call to radical change and justice", "points": {"simon_zealot": 3, "john_baptist": 2}}
      ]
    }
  ],
  "results": {
    "peter": {
      "saint_id": "saint_024",
      "name": "St. Peter",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_peter.png",
      "description": "Like Peter, you're a natural leader with a big heart and sometimes an even bigger mouth! You love Jesus passionately, even though you sometimes mess up. Peter was the first pope and the rock on which Jesus built His Church. Your enthusiastic faith leads others to Jesus!",
      "fun_fact": "Peter was the only apostle brave enough to try walking on water with Jesus!"
    },
    "andrew": {
      "saint_id": "saint_026",
      "name": "St. Andrew",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_andrew.png",
      "description": "Like Andrew, you're the ultimate friend-maker who loves introducing people to Jesus! You were one of the first to follow Jesus and immediately brought your brother Peter. Andrew is the patron of Scotland and was martyred on an X-shaped cross. Your friendship evangelizes the world!",
      "fun_fact": "Andrew was the first apostle called by Jesus and immediately went to find his brother Peter!"
    },
    "john_evangelist": {
      "saint_id": "saint_087",
      "name": "St. John the Evangelist",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_evangelist.png",
      "description": "Like John, you're the beloved disciple with a heart full of love! You have a special closeness to Jesus and understand His love deeply. John wrote the Gospel of John and is called the 'beloved disciple.' Your loving heart draws others to God's love!",
      "fun_fact": "John was so close to Jesus that he leaned on Jesus's chest at the Last Supper!"
    },
    "james_greater": {
      "saint_id": "saint_137",
      "name": "St. James the Greater",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_jamesgreater.png",
      "description": "Like James, you're adventurous and ready for anything Jesus asks! You're one of the inner circle and not afraid of challenges. James was the first apostle to be martyred and his shrine at Santiago draws millions of pilgrims. Your adventurous faith inspires epic journeys!",
      "fun_fact": "James's pilgrimage route to Santiago de Compostela is one of Christianity's most famous spiritual journeys!"
    },
    "john_baptist": {
      "saint_id": "saint_057",
      "name": "St. John the Baptist",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_baptist.png",
      "description": "Like John the Baptist, you're bold and uncompromising about preparing people for Jesus! You're not afraid to challenge others to change their lives. John baptized Jesus and prepared the way for His ministry. Your prophetic voice calls people to conversion!",
      "fun_fact": "John the Baptist was Jesus's cousin and leaped for joy in his mother's womb when Mary visited!"
    },
    "matthew": {
      "saint_id": "saint_075",
      "name": "St. Matthew the Evangelist",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_matthew.png",
      "description": "Like Matthew, you understand what it's like to be transformed by Jesus's call! You left your old life completely behind to follow Jesus. Matthew was a tax collector who became an evangelist and wrote the first Gospel. Your conversion story gives hope to everyone!",
      "fun_fact": "Matthew left his tax booth immediately when Jesus called him and threw a party to introduce his friends to Jesus!"
    },
    "thomas": {
      "saint_id": "saint_169",
      "name": "St. Thomas",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_thomas.png",
      "description": "Like Thomas, you ask the important questions and want to understand your faith deeply! You're honest about your doubts, which actually makes your faith stronger. Thomas touched Jesus's wounds and then believed completely. Your thoughtful faith helps others who struggle with doubt!",
      "fun_fact": "Thomas traveled all the way to India to spread the Gospel and was the first to bring Christianity there!"
    },
    "philip": {
      "saint_id": "saint_167",
      "name": "St. Philip",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_philip.png",
      "description": "Like Philip, you're great at bringing people to Jesus and helping them understand who He is! You ask practical questions and care about people's needs. Philip brought Nathanael to Jesus and helped with feeding the 5,000. Your practical faith makes Jesus accessible to everyone!",
      "fun_fact": "Philip was the one who brought Nathanael to Jesus, saying 'Come and see' when Nathanael had doubts!"
    },
    "bartholomew": {
      "saint_id": "saint_168",
      "name": "St. Bartholomew",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_bartholomew.png",
      "description": "Like Bartholomew (also called Nathanael), you're honest and straightforward! Jesus called you 'a true Israelite in whom there is no deceit.' You might be skeptical at first, but once you believe, you're totally committed. Your authentic faith inspires trust!",
      "fun_fact": "Jesus praised Bartholomew as 'a true Israelite in whom there is no deceit' - the ultimate compliment!"
    },
    "james_lesser": {
      "saint_id": "saint_170",
      "name": "St. James the Lesser",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_jameslesser.png",
      "description": "Like James the Lesser, you might not be the loudest person in the group, but you're incredibly faithful and steady! You became the first bishop of Jerusalem and wrote the Letter of James. Your quiet faithfulness provides stability for others!",
      "fun_fact": "James the Lesser led the Jerusalem church and wrote the practical Letter of James about faith in action!"
    },
    "simon_zealot": {
      "saint_id": "saint_171",
      "name": "St. Simon the Zealot",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_simonzealot.png",
      "description": "Like Simon, you're passionate about justice and making the world better! You might have strong political views, but Jesus transformed your passion into spiritual zeal. Simon was part of the Zealot movement before following Jesus. Your passion for justice serves God's kingdom!",
      "fun_fact": "Simon was a Zealot (political revolutionary) before Jesus transformed his passion into spiritual zeal!"
    },
    "jude": {
      "saint_id": "saint_058",
      "name": "St. Jude Thaddeus",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_jude.png",
      "description": "Like Jude, you're the one people turn to when they have impossible problems! You might feel overlooked sometimes, but you're incredibly powerful in prayer. Jude is called on for desperate situations and hopeless cases. Your faithfulness in small things leads to big miracles!",
      "fun_fact": "St. Jude is called the patron of impossible cases because people pray to him when situations seem hopeless!"
    },
    "mary_magdalene": {
      "saint_id": "saint_172",
      "name": "St. Mary Magdalene",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_magdalene.png",
      "description": "Like Mary Magdalene, you have incredible gratitude for Jesus's love and forgiveness! You were the first to see the risen Jesus and were called 'Apostle to the Apostles.' Your love for Jesus is passionate and your witness is powerful. Your grateful heart proclaims the resurrection!",
      "fun_fact": "Mary Magdalene was the first person to see the risen Jesus and was sent to tell the apostles - making her the 'Apostle to the Apostles'!"
    }
  }
},
{
  "quiz_id": "learning_legends",
  "title": "Which Learning Legends Saint Are You?",
  "description": "Discover which brilliant scholar or educator from our Learning Legends series matches your love of learning!",
  "series": "Learning Legends",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"aquinas": 5, "anselm": 5, "neumann": 5, "albert": 5, "bede": 5, "charles": 5, "newman": 5, "serra": 5, "finnian": 5, "eucherius": 5, "eusebius": 5}},
        {"text": "Girl", "points": {"elizabeth_seton": 5, "hildegard": 5, "duchesne": 5, "drexel": 5, "cabrini": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What's your favorite way to learn?",
      "answers": [
        {"text": "Reading lots of books and doing research", "points": {"aquinas": 3, "albert": 2, "bede": 2}},
        {"text": "Asking deep questions and thinking things through", "points": {"anselm": 3, "newman": 2, "hildegard": 1}},
        {"text": "Teaching others what I've learned", "points": {"elizabeth_seton": 3, "neumann": 2, "cabrini": 2}},
        {"text": "Hands-on experiments and trying new things", "points": {"albert": 3, "hildegard": 2, "drexel": 1}},
        {"text": "Learning different languages and cultures", "points": {"neumann": 3, "duchesne": 2, "serra": 2}}
      ]
    },
    {
      "id": 3,
      "question": "What subject would you most want to master?",
      "answers": [
        {"text": "Theology and understanding God", "points": {"aquinas": 3, "anselm": 3, "newman": 2}},
        {"text": "Science and how the world works", "points": {"albert": 3, "hildegard": 2}},
        {"text": "History and learning from the past", "points": {"bede": 3, "eusebius": 2, "eucherius": 1}},
        {"text": "Education and helping people learn", "points": {"elizabeth_seton": 3, "neumann": 2, "drexel": 2}},
        {"text": "Languages and different cultures", "points": {"serra": 2, "duchesne": 2, "cabrini": 2}}
      ]
    },
    {
      "id": 4,
      "question": "How do you like to share your knowledge?",
      "answers": [
        {"text": "Writing detailed books and explanations", "points": {"aquinas": 3, "bede": 2, "newman": 2}},
        {"text": "Starting schools and educational programs", "points": {"elizabeth_seton": 3, "neumann": 3, "drexel": 2}},
        {"text": "Having conversations and debates", "points": {"anselm": 2, "charles": 2, "newman": 2}},
        {"text": "Creating art, music, or creative works", "points": {"hildegard": 3, "cabrini": 1}},
        {"text": "Teaching people who haven't had opportunities to learn", "points": {"duchesne": 3, "serra": 2, "drexel": 2}}
      ]
    },
    {
      "id": 5,
      "question": "What motivates you to keep learning?",
      "answers": [
        {"text": "I want to understand God and faith better", "points": {"aquinas": 3, "anselm": 2, "newman": 2}},
        {"text": "I love discovering how everything connects", "points": {"albert": 3, "hildegard": 2, "bede": 1}},
        {"text": "I want to help kids get a good education", "points": {"elizabeth_seton": 3, "neumann": 2, "drexel": 2}},
        {"text": "Knowledge is power to help others", "points": {"drexel": 3, "duchesne": 2, "cabrini": 2}},
        {"text": "Learning helps me serve God better", "points": {"serra": 2, "charles": 2, "finnian": 2}}
      ]
    },
    {
      "id": 6,
      "question": "What's your approach to difficult questions?",
      "answers": [
        {"text": "I research thoroughly until I find the answer", "points": {"aquinas": 3, "albert": 2, "bede": 2}},
        {"text": "I think logically through each step", "points": {"anselm": 3, "newman": 2}},
        {"text": "I ask teachers and experts for help", "points": {"elizabeth_seton": 2, "neumann": 2, "charles": 1}},
        {"text": "I try different creative approaches", "points": {"hildegard": 3, "albert": 1}},
        {"text": "I pray for wisdom and guidance", "points": {"serra": 2, "duchesne": 2, "finnian": 2}}
      ]
    },
    {
      "id": 7,
      "question": "How do you want to use your education?",
      "answers": [
        {"text": "To write books that help people understand faith", "points": {"aquinas": 3, "newman": 3, "bede": 1}},
        {"text": "To discover new things about the natural world", "points": {"albert": 3, "hildegard": 2}},
        {"text": "To make sure everyone has access to good schools", "points": {"elizabeth_seton": 3, "drexel": 3, "neumann": 2}},
        {"text": "To help people who are poor or overlooked", "points": {"drexel": 2, "cabrini": 2, "duchesne": 2}},
        {"text": "To spread the Gospel to new places", "points": {"serra": 3, "duchesne": 2, "cabrini": 1}}
      ]
    },
    {
      "id": 8,
      "question": "What would be your ideal learning environment?",
      "answers": [
        {"text": "A quiet library with lots of books", "points": {"aquinas": 3, "bede": 2, "anselm": 2}},
        {"text": "A laboratory where I can experiment", "points": {"albert": 3, "hildegard": 2}},
        {"text": "A classroom full of eager students", "points": {"elizabeth_seton": 3, "neumann": 2, "charles": 2}},
        {"text": "Traveling to learn about different cultures", "points": {"duchesne": 3, "serra": 2, "cabrini": 2}},
        {"text": "A place where I can help solve real problems", "points": {"drexel": 3, "newman": 1, "cabrini": 1}}
      ]
    }
  ],
  "results": {
    "aquinas": {
      "saint_id": "saint_018",
      "name": "St. Thomas Aquinas",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_aquinas.png",
      "description": "Like Aquinas, you're a brilliant thinker who loves using reason to understand faith! You ask deep questions and aren't satisfied with simple answers. Thomas wrote the Summa Theologica and is called the 'Angelic Doctor.' Your logical mind helps others understand God better!",
      "fun_fact": "Thomas Aquinas was so smart that his classmates called him the 'Dumb Ox' because he was quiet, but his teacher said 'This ox will fill the world with his bellowing!'"
    },
    "elizabeth_seton": {
      "saint_id": "saint_015",
      "name": "St. Elizabeth Ann Seton",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_elizabeth.png",
      "description": "Like Elizabeth, you're passionate about making sure everyone gets a great education! You believe learning should be available to all kids, not just the wealthy. Elizabeth was the first American-born saint and founded Catholic schools. Your educational vision transforms lives!",
      "fun_fact": "Elizabeth Ann Seton started the Catholic school system in America after converting to Catholicism following her husband's death!"
    },
    "anselm": {
      "saint_id": "saint_065",
      "name": "St. Anselm",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_anselm.png",
      "description": "Like Anselm, you love the motto 'faith seeking understanding'! You believe that thinking deeply about God actually strengthens your faith. Anselm was Archbishop of Canterbury and a brilliant philosopher. Your thoughtful questions lead to deeper faith!",
      "fun_fact": "Anselm invented the famous ontological argument for God's existence and believed that reason could prove faith!"
    },
    "neumann": {
      "saint_id": "saint_066",
      "name": "St. John Neumann",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_neumann.png",
      "description": "Like John Neumann, you're amazing with languages and love learning about different cultures! You believe education should be practical and useful. Neumann spoke 6 languages and started the Catholic school system in America. Your multicultural gifts unite people through learning!",
      "fun_fact": "John Neumann could speak 6 different languages and used this gift to minister to immigrants from many countries!"
    },
    "hildegard": {
      "saint_id": "saint_124",
      "name": "St. Hildegard of Bingen",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_hildegard.png",
      "description": "Like Hildegard, you're a Renaissance person who loves learning about everything! You're interested in music, science, medicine, and art. Hildegard was a Doctor of the Church who composed music and studied herbal medicine. Your curiosity about everything makes learning an adventure!",
      "fun_fact": "Hildegard wrote about astronomy, medicine, music, and theology - she was like a medieval scientist-saint who studied everything!"
    },
    "albert": {
      "saint_id": "saint_179",
      "name": "St. Albert the Great",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_albertgreat.png",
      "description": "Like Albert, you're fascinated by science and how the natural world works! You believe that studying creation helps you understand the Creator better. Albert was called the 'Universal Doctor' and was Thomas Aquinas's teacher. Your scientific mind reveals God's wonders!",
      "fun_fact": "Albert the Great was so smart in so many subjects that he was called the 'Universal Doctor' - he knew about everything!"
    },
    "bede": {
      "saint_id": "saint_188",
      "name": "St. Bede the Venerable",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_bede.png",
      "description": "Like Bede, you love history and recording important events! You believe we can learn from the past to make better decisions today. Bede wrote the first history of England and is called 'Father of English History.' Your love of history preserves wisdom for future generations!",
      "fun_fact": "Bede wrote the first comprehensive history of England and created the dating system we still use today (A.D.)!"
    },
    "charles": {
      "saint_id": "saint_103",
      "name": "St. Charles Borromeo",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_charles.png",
      "description": "Like Charles, you believe education should include both learning and character formation! You want schools to help kids become not just smart, but good. Charles led church reform and started seminaries to train priests. Your educational vision builds both minds and hearts!",
      "fun_fact": "Charles Borromeo reformed education by creating the first catechism classes and making sure priests were well-educated!"
    },
    "newman": {
      "saint_id": "saint_104",
      "name": "St. John Henry Newman",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_newman.png",
      "description": "Like Newman, you're incredibly articulate and love to write and speak about important ideas! You might have questions about faith, but you work through them thoughtfully. Newman was a convert who became a cardinal and great educator. Your intellectual journey inspires others!",
      "fun_fact": "John Henry Newman was a brilliant Anglican scholar who converted to Catholicism and wrote amazing sermons and books!"
    },
    "duchesne": {
      "saint_id": "saint_105",
      "name": "St. Rose Philippine Duchesne",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_duchesne.png",
      "description": "Like Rose, you're passionate about bringing education to people who haven't had the chance to learn! You especially care about Native Americans and other overlooked groups. Rose was nicknamed 'Woman Who Prays Always' by Native Americans. Your educational mission serves the marginalized!",
      "fun_fact": "Rose Philippine Duchesne was so dedicated to prayer that Native Americans called her 'Woman Who Prays Always'!"
    },
    "serra": {
      "saint_id": "saint_106",
      "name": "St. Junípero Serra",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_serra.png",
      "description": "Like Junípero, you love adventure and bringing education to frontier places! You're willing to go wherever learning is needed most. Serra founded missions and schools throughout California. Your pioneering spirit brings education to new frontiers!",
      "fun_fact": "Junípero Serra walked thousands of miles founding 21 missions in California, each with schools to educate Native Americans!"
    },
    "drexel": {
      "saint_id": "saint_107",
      "name": "St. Catherine Drexel",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_drexel.png",
      "description": "Like Catherine, you believe education can fight injustice and create equality! You gave away your fortune to support schools for African Americans and Native Americans. Catherine founded Xavier University and many schools. Your educational mission promotes racial justice!",
      "fun_fact": "Catherine Drexel inherited millions of dollars and spent it all building schools for African Americans and Native Americans!"
    },
    "cabrini": {
      "saint_id": "saint_128",
      "name": "St. Frances Xavier Cabrini",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_cabrini.png",
      "description": "Like Frances, you have a special heart for immigrants and refugees who need education! You founded schools and hospitals for people far from home. Frances was the first U.S. citizen saint and helped Italian immigrants. Your global vision brings education across borders!",
      "fun_fact": "Mother Cabrini founded 67 institutions including schools, hospitals, and orphanages across America and beyond!"
    },
    "finnian": {
      "saint_id": "saint_209",
      "name": "St. Finnian",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_finnian.png",
      "description": "Like Finnian, you're an amazing teacher who inspires students to become great leaders! You founded a monastery school that educated numerous Irish saints. Finnian was called a teacher of saints because so many of his students became holy. Your teaching creates other teachers!",
      "fun_fact": "Finnian's monastery school was so good that it educated many future Irish saints - he was literally a teacher of saints!"
    },
    "eucherius": {
      "saint_id": "saint_233",
      "name": "St. Eucherius",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_eucherius.png",
      "description": "Like Eucherius, you balance contemplation with scholarship! You spent time in a monastery learning before becoming a bishop and theological writer. Eucherius believed in deep study combined with prayer. Your scholarly spirituality shows that learning and holiness go together!",
      "fun_fact": "Eucherius retired to the famous monastery of Lérins to study and pray before becoming a bishop and writer!"
    },
    "eusebius": {
      "saint_id": "saint_205",
      "name": "St. Eusebius",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_eusebius.png",
      "description": "Like Eusebius, you're fascinated by Church history and want to preserve important stories! You wrote the first comprehensive history of Christianity. Eusebius is called the 'Father of Church History' because he documented the early Church. Your historical work preserves faith for future generations!",
      "fun_fact": "Eusebius wrote the first complete history of the Christian Church and is called the 'Father of Church History'!"
    }
  }
},
{
  "quiz_id": "culture_carriers",
  "title": "Which Culture Carriers Saint Are You?",
  "description": "Discover which patron saint of countries and cultures from our Culture Carriers series matches your cultural spirit!",
  "series": "Culture Carriers",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"patrick": 5, "george": 5, "james": 5, "denis": 5, "david": 5, "wenceslaus": 5, "casimir": 5, "olaf": 5, "canute": 5, "eric": 5, "stanislaus": 5, "adalbert": 5, "alban": 5, "ansgar": 5, "columba": 5, "stephen": 5}},
        {"text": "Girl", "points": {"brigid": 5, "margaret_scotland": 5, "elizabeth_hungary": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What's your approach to bringing people together?",
      "answers": [
        {"text": "Through celebration, storytelling, and traditions", "points": {"patrick": 3, "brigid": 3, "columba": 2}},
        {"text": "By being brave and standing up for what's right", "points": {"george": 3, "james": 2, "wenceslaus": 2}},
        {"text": "Through acts of charity and caring for the poor", "points": {"elizabeth_hungary": 3, "margaret_scotland": 2, "david": 1}},
        {"text": "By defending my country and people", "points": {"denis": 2, "stanislaus": 2, "olaf": 2}},
        {"text": "Through education and preserving culture", "points": {"ansgar": 2, "adalbert": 2, "alban": 1}}
      ]
    },
    {
      "id": 3,
      "question": "How do you show pride in your heritage?",
      "answers": [
        {"text": "I celebrate traditional holidays and customs", "points": {"patrick": 3, "brigid": 2, "stephen": 2}},
        {"text": "I tell stories about brave heroes from my culture", "points": {"george": 2, "james": 2, "denis": 2}},
        {"text": "I help preserve my language and traditions", "points": {"david": 3, "columba": 2, "ansgar": 1}},
        {"text": "I work to make my country/community better", "points": {"wenceslaus": 3, "casimir": 2, "margaret_scotland": 2}},
        {"text": "I share my culture's gifts with others", "points": {"elizabeth_hungary": 2, "adalbert": 2, "alban": 1}}
      ]
    },
    {
      "id": 4,
      "question": "What role would you want in your community?",
      "answers": [
        {"text": "The storyteller who keeps traditions alive", "points": {"patrick": 3, "brigid": 2, "columba": 2}},
        {"text": "The protector who defends against enemies", "points": {"george": 3, "denis": 2, "olaf": 2}},
        {"text": "The peacemaker who solves conflicts", "points": {"wenceslaus": 3, "david": 2, "margaret_scotland": 1}},
        {"text": "The generous leader who helps the poor", "points": {"elizabeth_hungary": 3, "casimir": 2, "stephen": 1}},
        {"text": "The missionary who spreads faith to new places", "points": {"ansgar": 3, "adalbert": 2, "columba": 1}}
      ]
    },
    {
      "id": 5,
      "question": "How do you handle conflicts with neighboring groups?",
      "answers": [
        {"text": "I try to find common ground and make peace", "points": {"david": 3, "margaret_scotland": 3, "casimir": 2}},
        {"text": "I stand firm but fight fairly and honorably", "points": {"george": 3, "james": 2, "olaf": 2}},
        {"text": "I use diplomacy and try to convert through example", "points": {"wenceslaus": 2, "stephen": 2, "ansgar": 2}},
        {"text": "I defend my people fiercely when necessary", "points": {"denis": 3, "stanislaus": 2, "eric": 2}},
        {"text": "I focus on building bridges through culture and faith", "points": {"patrick": 2, "adalbert": 2, "alban": 1}}
      ]
    },
    {
      "id": 6,
      "question": "What's most important for your country or culture?",
      "answers": [
        {"text": "Keeping our unique traditions and customs alive", "points": {"brigid": 3, "patrick": 2, "columba": 2}},
        {"text": "Being known for courage and honor", "points": {"george": 3, "james": 2, "canute": 2}},
        {"text": "Taking care of everyone, especially the poor", "points": {"elizabeth_hungary": 3, "margaret_scotland": 2, "david": 1}},
        {"text": "Having strong, just leadership", "points": {"wenceslaus": 3, "stephen": 2, "casimir": 2}},
        {"text": "Spreading our faith to others", "points": {"ansgar": 3, "adalbert": 2, "columba": 1}}
      ]
    },
    {
      "id": 7,
      "question": "How do you want to be remembered by future generations?",
      "answers": [
        {"text": "As someone who made their culture famous worldwide", "points": {"patrick": 3, "george": 2, "james": 2}},
        {"text": "As a brave defender who never gave up", "points": {"denis": 3, "stanislaus": 2, "eric": 2}},
        {"text": "As a generous leader who cared for everyone", "points": {"elizabeth_hungary": 3, "margaret_scotland": 2, "stephen": 1}},
        {"text": "As someone who brought peace and unity", "points": {"david": 3, "wenceslaus": 2, "casimir": 2}},
        {"text": "As a bridge-builder who connected different peoples", "points": {"ansgar": 3, "adalbert": 2, "alban": 1}}
      ]
    },
    {
      "id": 8,
      "question": "What's your greatest strength as a cultural leader?",
      "answers": [
        {"text": "My ability to inspire people with stories and traditions", "points": {"patrick": 3, "brigid": 2, "columba": 2}},
        {"text": "My courage in fighting for what's right", "points": {"george": 3, "james": 2, "stanislaus": 2}},
        {"text": "My wisdom in making fair decisions", "points": {"wenceslaus": 3, "david": 2, "margaret_scotland": 1}},
        {"text": "My generous heart that puts others first", "points": {"elizabeth_hungary": 3, "casimir": 2, "stephen": 1}},
        {"text": "My vision for bringing different cultures together", "points": {"ansgar": 3, "adalbert": 2, "alban": 1}}
      ]
    }
  ],
  "results": {
    "patrick": {
      "saint_id": "saint_030",
      "name": "St. Patrick",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_patrick.png",
      "description": "Like Patrick, you're amazing at sharing your culture and making it famous around the world! You have a gift for storytelling and making traditions come alive. Patrick brought Christianity to Ireland and used the shamrock to explain the Trinity. Your cultural pride spreads joy everywhere!",
      "fun_fact": "St. Patrick used the three-leaf shamrock to explain the Trinity to the Irish - one plant, three leaves, one God in three persons!"
    },
    "george": {
      "saint_id": "saint_088",
      "name": "St. George",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_george.png",
      "description": "Like George, you're a legendary hero known for incredible courage! You face down 'dragons' (big problems) to protect innocent people. George is the patron of England and famous for slaying a dragon. Your brave spirit inspires epic stories that last forever!",
      "fun_fact": "St. George's dragon-slaying story represents the victory of good over evil and has inspired countless tales of heroism!"
    },
    "brigid": {
      "saint_id": "saint_090",
      "name": "St. Brigid of Kildare",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_brigid.png",
      "description": "Like Brigid, you're an amazing hostess who creates abundance and welcomes everyone! You have a special gift for making people feel at home. Brigid was an Irish abbess famous for miraculous generosity. Your hospitality reflects your culture's warm heart!",
      "fun_fact": "St. Brigid could supposedly turn water into ale and make butter from a single cow's milk - she was the ultimate hostess!"
    },
    "james": {
      "saint_id": "saint_137",
      "name": "St. James the Greater",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_jamesgreater.png",
      "description": "Like James, you're a spiritual warrior whose pilgrimage route becomes legendary! You inspire people to go on amazing journeys of faith. James is the patron of Spain and his shrine at Santiago draws millions. Your spiritual adventures create paths others follow!",
      "fun_fact": "The Camino de Santiago pilgrimage to St. James's shrine is over 1,000 years old and still draws hundreds of thousands of pilgrims yearly!"
    },
    "denis": {
      "saint_id": "saint_138",
      "name": "St. Denis",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_denis.png",
      "description": "Like Denis, you're incredibly determined and never let setbacks stop you! You're willing to go to extreme lengths for your people and faith. Denis was the first bishop of Paris and patron of France. Your unstoppable determination inspires legends!",
      "fun_fact": "According to legend, St. Denis carried his own head for miles after being beheaded, preaching the whole way!"
    },
    "david": {
      "saint_id": "saint_139",
      "name": "St. David",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_david.png",
      "description": "Like David, you believe in doing 'little things' with great love and finding joy in simple acts! You're the patron of Wales and known for practical wisdom. David's final words were about being joyful and doing little things. Your gentle leadership changes hearts quietly!",
      "fun_fact": "St. David's last words were 'Be joyful, brothers and sisters, keep your faith and do the little things!'"
    },
    "wenceslaus": {
      "saint_id": "saint_140",
      "name": "St. Wenceslaus",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_wenceslaus.png",
      "description": "Like Wenceslaus, you're a 'good king' who cares for your people during difficult times! You're generous and brave, especially in helping the poor. Wenceslaus is the subject of the Christmas carol 'Good King Wenceslas.' Your royal generosity warms hearts like a Christmas story!",
      "fun_fact": "The Christmas carol 'Good King Wenceslas' tells the story of St. Wenceslaus bringing food to the poor on a snowy night!"
    },
    "casimir": {
      "saint_id": "saint_141",
      "name": "St. Casimir",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_casimir.png",
      "description": "Like Casimir, you're a pure-hearted prince who chooses holiness over worldly power! You care deeply for the poor and maintain your principles. Casimir was a Polish prince who refused marriage to keep his vow of chastity. Your integrity inspires others to choose what's right over what's easy!",
      "fun_fact": "Prince Casimir refused to marry to maintain his vow of chastity and spent his wealth caring for the poor!"
    },
    "olaf": {
      "saint_id": "saint_142",
      "name": "St. Olaf",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_olaf.png",
      "description": "Like Olaf, you understand that people can change dramatically when they find God! You went from a fierce warrior to a holy king who Christianized Norway. Your conversion story shows God's mercy can transform anyone. Your dramatic transformation gives hope to everyone!",
      "fun_fact": "King Olaf went from being a fierce Viking warrior to a holy king who brought Christianity to all of Norway!"
    },
    "canute": {
      "saint_id": "saint_143",
      "name": "St. Canute",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_canute.png",
      "description": "Like Canute, you're a strong king who supports the Church and isn't afraid to make tough decisions! You died while praying in church. Canute was king of Denmark who was martyred by rebels. Your faithful leadership serves God even when it's dangerous!",
      "fun_fact": "King Canute was killed by rebels while he was praying in church - he died as he lived, faithful to God!"
    },
    "eric": {
      "saint_id": "saint_144",
      "name": "St. Eric",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_eric.png",
      "description": "Like Eric, you're a devout king who puts God first every single day! You attended Mass every morning before ruling your kingdom. Eric was king of Sweden who was martyred after attending church. Your daily faithfulness makes you a holy leader!",
      "fun_fact": "King Eric attended Mass every single morning before doing any royal duties and was killed by enemies right after church!"
    },
    "stanislaus": {
      "saint_id": "saint_145",
      "name": "St. Stanislaus",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_stanislaus.png",
      "description": "Like Stanislaus, you're brave enough to stand up to corrupt leaders, even kings! You speak truth to power when others are afraid. Stanislaus was a bishop who excommunicated a wicked king and was killed at the altar. Your prophetic courage defends justice!",
      "fun_fact": "Bishop Stanislaus was so brave that he excommunicated the corrupt King Bolesław II and was martyred by the king himself!"
    },
    "margaret_scotland": {
      "saint_id": "saint_084",
      "name": "St. Margaret of Scotland",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_margaretscotland.png",
      "description": "Like Margaret, you're a queen who uses your position to help the poor and reform the Church! You're known for charity and kindness to everyone. Margaret was queen of Scotland who helped the poor and reformed the Church. Your royal compassion transforms your kingdom!",
      "fun_fact": "Queen Margaret of Scotland was so charitable that she personally fed orphans and washed the feet of the poor!"
    },
    "elizabeth_hungary": {
      "saint_id": "saint_052",
      "name": "St. Elizabeth of Hungary",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_hungary.png",
      "description": "Like Elizabeth, you're incredibly generous and give away your wealth to help the poor! You believe your privilege should be used to serve others. Elizabeth gave generously to the poor and became a Franciscan after her husband's death. Your sacrificial generosity amazes everyone!",
      "fun_fact": "St. Elizabeth of Hungary gave away so much to the poor that when her husband found bread in her cloak, it miraculously turned into roses!"
    },
    "adalbert": {
      "saint_id": "saint_174",
      "name": "St. Adalbert",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_adalbert.png",
      "description": "Like Adalbert, you're a missionary bridge-builder who connects different cultures through faith! You're willing to travel to dangerous places to spread the Gospel. Adalbert was martyred while evangelizing Prussia and is patron of multiple countries. Your cross-cultural mission unites nations!",
      "fun_fact": "St. Adalbert is the patron saint of Poland, Czech Republic, and Hungary - he brought these nations together through faith!"
    },
    "alban": {
      "saint_id": "saint_178",
      "name": "St. Alban",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_alban.png",
      "description": "Like Alban, you welcome strangers and protect refugees even when it's dangerous! You were the first British martyr who sheltered a Christian priest. Your hospitality to those in need shows true British character - welcoming and brave!",
      "fun_fact": "St. Alban was the first British martyr and died protecting a Christian priest he had sheltered from Roman persecution!"
    },
    "ansgar": {
      "saint_id": "saint_183",
      "name": "St. Ansgar",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_ansgar.png",
      "description": "Like Ansgar, you're the 'Apostle of the North' who brings Christianity to challenging, cold places! You founded the first Christian school in Denmark and evangelized Scandinavia. Your pioneering mission work opens new frontiers for faith!",
      "fun_fact": "St. Ansgar is called the 'Apostle of the North' and founded the first Christian school in Denmark!"
    },
    "columba": {
      "saint_id": "saint_194",
      "name": "St. Columba",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_columba.png",
      "description": "Like Columba, you're an Irish missionary who creates island communities of faith! You founded the monastery on Iona that became a center for evangelizing Scotland. Your Celtic spirituality creates holy places that last for centuries!",
      "fun_fact": "St. Columba founded the famous monastery on the island of Iona, which became the center for evangelizing Scotland!"
    },
    "stephen": {
      "saint_id": "saint_119",
      "name": "St. Stephen of Hungary",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_stephenhungary.png",
      "description": "Like Stephen, you're a founding father who brings your entire people to Christianity! You were the first king of Hungary who united your nation under the Christian faith. Your leadership legacy creates a Christian nation that lasts for centuries!",
      "fun_fact": "St. Stephen was the first king of Hungary and is credited with bringing the entire Hungarian nation to Christianity!"
    }
  }
},
{
  "quiz_id": "regal_royals",
  "title": "Which Regal Royals Saint Are You?",
  "description": "Discover which holy king or queen from our Regal Royals series matches your royal heart!",
  "series": "Regal Royals",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"louis_ix": 5, "edward": 5, "ferdinand": 5, "casimir_poland": 5}},
        {"text": "Girl", "points": {"helena": 5, "edith_wilton": 5, "hedwig": 5, "isabel": 5, "olga": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What kind of ruler would you be?",
      "answers": [
        {"text": "A warrior king/queen who protects the kingdom", "points": {"louis_ix": 3, "ferdinand": 3, "edward": 2}},
        {"text": "A wise ruler who makes fair laws and decisions", "points": {"edward": 3, "hedwig": 2, "helena": 2}},
        {"text": "A generous monarch who helps the poor", "points": {"hedwig": 3, "isabel": 3, "casimir_poland": 2}},
        {"text": "A pious ruler who builds churches and supports faith", "points": {"helena": 3, "edith_wilton": 2, "olga": 2}},
        {"text": "A peaceful ruler who avoids war whenever possible", "points": {"isabel": 3, "casimir_poland": 3, "edith_wilton": 1}}
      ]
    },
    {
      "id": 3,
      "question": "How would you use your royal wealth?",
      "answers": [
        {"text": "Build beautiful churches and monasteries", "points": {"helena": 3, "edward": 2, "olga": 2}},
        {"text": "Create hospitals and schools for everyone", "points": {"hedwig": 3, "isabel": 2, "louis_ix": 1}},
        {"text": "Fund crusades and holy wars", "points": {"louis_ix": 3, "ferdinand": 2}},
        {"text": "Give directly to the poor and needy", "points": {"isabel": 3, "hedwig": 2, "casimir_poland": 2}},
        {"text": "Support scholars and preserve learning", "points": {"edith_wilton": 3, "helena": 2, "edward": 1}}
      ]
    },
    {
      "id": 4,
      "question": "What's your approach to conflicts with other kingdoms?",
      "answers": [
        {"text": "Fight bravely but fairly for what's right", "points": {"louis_ix": 3, "ferdinand": 3}},
        {"text": "Try diplomacy and negotiation first", "points": {"edward": 3, "isabel": 2, "hedwig": 1}},
        {"text": "Make peace through marriage alliances", "points": {"helena": 2, "hedwig": 2, "olga": 1}},
        {"text": "Avoid conflict and focus on internal peace", "points": {"casimir_poland": 3, "edith_wilton": 2}},
        {"text": "Use wisdom to resolve disputes justly", "points": {"isabel": 3, "edward": 2, "hedwig": 1}}
      ]
    },
    {
      "id": 5,
      "question": "What's most important for your kingdom?",
      "answers": [
        {"text": "Strong Christian faith throughout the land", "points": {"helena": 3, "olga": 3, "louis_ix": 2}},
        {"text": "Justice and fair treatment for all subjects", "points": {"edward": 3, "louis_ix": 2, "isabel": 2}},
        {"text": "Prosperity and good education for everyone", "points": {"hedwig": 3, "edith_wilton": 2, "helena": 1}},
        {"text": "Peace and harmony among all people", "points": {"isabel": 3, "casimir_poland": 2, "edith_wilton": 1}},
        {"text": "Strong defenses and military might", "points": {"ferdinand": 3, "louis_ix": 1}}
      ]
    },
    {
      "id": 6,
      "question": "How do you handle pressure from nobles or advisors?",
      "answers": [
        {"text": "I listen to wisdom but follow my conscience", "points": {"edward": 3, "helena": 2, "hedwig": 1}},
        {"text": "I pray for guidance and do what God wants", "points": {"louis_ix": 3, "casimir_poland": 2, "olga": 2}},
        {"text": "I consider what's best for my people first", "points": {"isabel": 3, "hedwig": 2, "edith_wilton": 1}},
        {"text": "I make decisions based on justice and fairness", "points": {"ferdinand": 2, "edward": 2, "hedwig": 1}},
        {"text": "I stay true to my values no matter what", "points": {"casimir_poland": 3, "edith_wilton": 2}}
      ]
    },
    {
      "id": 7,
      "question": "What would be your greatest royal achievement?",
      "answers": [
        {"text": "Leading successful crusades for the faith", "points": {"louis_ix": 3, "ferdinand": 2}},
        {"text": "Establishing lasting peace in my kingdom", "points": {"edward": 3, "isabel": 3, "casimir_poland": 2}},
        {"text": "Building institutions that help the poor", "points": {"hedwig": 3, "isabel": 2, "helena": 1}},
        {"text": "Spreading Christianity to new territories", "points": {"helena": 3, "olga": 3, "ferdinand": 1}},
        {"text": "Creating a center of learning and culture", "points": {"edith_wilton": 3, "hedwig": 2, "helena": 1}}
      ]
    },
    {
      "id": 8,
      "question": "How do you want to be remembered as a ruler?",
      "answers": [
        {"text": "As a holy warrior who fought for God", "points": {"louis_ix": 3, "ferdinand": 2}},
        {"text": "As a wise and just monarch who was fair to all", "points": {"edward": 3, "hedwig": 2, "isabel": 1}},
        {"text": "As a generous ruler who cared for the poor", "points": {"hedwig": 3, "isabel": 3, "casimir_poland": 1}},
        {"text": "As someone who brought faith to their people", "points": {"helena": 3, "olga": 3, "edith_wilton": 1}},
        {"text": "As a peaceful ruler who avoided unnecessary wars", "points": {"casimir_poland": 3, "isabel": 2, "edith_wilton": 2}}
      ]
    }
  ],
  "results": {
    "louis_ix": {
      "saint_id": "saint_146",
      "name": "St. Louis IX",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_louisix.png",
      "description": "Like Louis IX, you're a warrior king with a heart for God and justice! You believe in fighting for what's right and caring for your people. Louis led two crusades and was known for his fairness and charity. You're the only French king to become a saint! Your holy leadership inspires loyalty and devotion!",
      "fun_fact": "St. Louis IX is the only French king to be canonized a saint and died of plague while on crusade!"
    },
    "edward": {
      "saint_id": "saint_147",
      "name": "St. Edward the Confessor",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_edward.png",
      "description": "Like Edward, you're a wise and peaceful king known for your piety and justice! You established Westminster Abbey and were known for your healing touch. Edward remained celibate throughout his marriage and ruled with great wisdom. Your gentle leadership brings peace and stability to your kingdom!",
      "fun_fact": "St. Edward the Confessor remained celibate throughout his marriage and was known for his miraculous healing touch!"
    },
    "ferdinand": {
      "saint_id": "saint_148",
      "name": "St. Ferdinand",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_ferdinand.png",
      "description": "Like Ferdinand, you're an undefeated warrior king who shows mercy to your enemies! You never lost a battle but were known for your kindness to defeated foes. Ferdinand reconquered much of Spain from the Moors. Your combination of military might and Christian mercy makes you legendary!",
      "fun_fact": "St. Ferdinand never lost a single battle but was famous for showing mercy and kindness to his defeated enemies!"
    },
    "helena": {
      "saint_id": "saint_086",
      "name": "St. Helena",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_helena.png",
      "description": "Like Helena, you're an archaeologist queen who makes amazing discoveries for faith! You found the True Cross in Jerusalem and were the mother of Emperor Constantine. Helena's conversion story shows that it's never too late to find God. Your royal discoveries treasure the faith!",
      "fun_fact": "St. Helena found the True Cross of Jesus in Jerusalem and is the patron saint of archaeologists!"
    },
    "edith_wilton": {
      "saint_id": "saint_085",
      "name": "St. Edith of Wilton",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_edithwilton.png",
      "description": "Like Edith, you're a princess who chose the convent over the crown! You loved learning and prayer more than royal power. Edith was a princess who became a nun and was known for her scholarship. Your royal humility chooses wisdom over worldly glory!",
      "fun_fact": "Princess Edith of Wilton chose to become a nun instead of claiming her royal throne because she loved learning and prayer!"
    },
    "hedwig": {
      "saint_id": "saint_149",
      "name": "St. Hedwig",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_hedwig.png",
      "description": "Like Hedwig, you're a generous queen who gives away your royal jewels to build hospitals and churches! You founded the University of Kraków and helped the poor constantly. Your royal generosity knows no bounds and transforms your kingdom into a place of learning and care!",
      "fun_fact": "Queen Hedwig gave away her royal jewels to build hospitals and churches and founded the University of Kraków!"
    },
    "isabel": {
      "saint_id": "saint_150",
      "name": "St. Isabel of Portugal",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_isabel.png",
      "description": "Like Isabel, you're a peacemaking queen who stops wars between kingdoms! You're famous for the miracle of roses when bread for the poor turned into flowers. Isabel made peace between warring kingdoms and cared for the poor. Your royal diplomacy brings harmony to the world!",
      "fun_fact": "St. Isabel's bread for the poor miraculously turned into roses when her husband questioned her charity - the famous 'miracle of roses'!"
    },
    "olga": {
      "saint_id": "saint_120",
      "name": "St. Olga of Kiev",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_olga.png",
      "description": "Like Olga, you're a pioneering queen who brings Christianity to your entire people! You were the grandmother of St. Vladimir and helped convert Russia to Christianity. Olga's conversion story paved the way for all of Eastern Christianity. Your royal faith changes the course of history!",
      "fun_fact": "St. Olga was the grandmother of St. Vladimir and helped bring Christianity to all of Russia - changing the course of history!"
    },
    "casimir_poland": {
      "saint_id": "saint_192",
      "name": "St. Casimir of Poland",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_casimirpoland.png",
      "description": "Like Casimir, you're a prince who chooses holiness over political power! You refused marriage to maintain your vow of chastity and cared deeply for the poor. Casimir died young at 25 but left a legacy of purity and generosity. Your royal integrity inspires others to choose what's right!",
      "fun_fact": "Prince Casimir refused to marry to keep his vow of chastity and spent his royal wealth caring for the poor instead of pursuing power!"
    }
  }
},
{
  "quiz_id": "heavenly_helpers",
  "title": "Which Heavenly Helpers Saint Are You?",
  "description": "Discover which healing and miracle-working saint from our Heavenly Helpers series matches your caring heart!",
  "series": "Heavenly Helpers",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"padre_pio": 5, "andre": 5, "simon_stock": 5, "cosmas": 5, "damian": 5, "camillus": 5}},
        {"text": "Girl", "points": {"bernadette": 5, "faustina": 5, "philomena": 5, "catherine_laboure": 5, "margaret_mary": 5, "dorothy": 5}}
      ]
    },
    {
      "id": 2,
      "question": "How do you like to help people who are hurting?",
      "answers": [
        {"text": "I pray intensely for their healing", "points": {"padre_pio": 3, "andre": 3, "faustina": 2}},
        {"text": "I provide practical medical care and comfort", "points": {"cosmas": 3, "damian": 3, "camillus": 2}},
        {"text": "I bring them to special holy places for healing", "points": {"bernadette": 3, "andre": 2}},
        {"text": "I share God's mercy and forgiveness with them", "points": {"faustina": 3, "margaret_mary": 2, "padre_pio": 1}},
        {"text": "I create beautiful things to lift their spirits", "points": {"dorothy": 3, "philomena": 2}}
      ]
    },
    {
      "id": 3,
      "question": "What kind of problems do you feel most called to help with?",
      "answers": [
        {"text": "Serious illnesses and physical suffering", "points": {"bernadette": 3, "andre": 2, "camillus": 2}},
        {"text": "Spiritual problems and need for confession", "points": {"padre_pio": 3, "faustina": 2}},
        {"text": "Hopeless situations that seem impossible", "points": {"philomena": 3, "faustina": 2, "andre": 1}},
        {"text": "People who need to feel God's love", "points": {"margaret_mary": 3, "catherine_laboure": 2, "dorothy": 1}},
        {"text": "Everyday health problems and minor illnesses", "points": {"cosmas": 2, "damian": 2, "simon_stock": 1}}
      ]
    },
    {
      "id": 4,
      "question": "How do you experience God's power working through you?",
      "answers": [
        {"text": "Through intense prayer and mystical experiences", "points": {"padre_pio": 3, "margaret_mary": 2, "faustina": 2}},
        {"text": "Through visions and special messages from heaven", "points": {"bernadette": 3, "faustina": 2, "catherine_laboure": 2}},
        {"text": "Through practical skills combined with faith", "points": {"cosmas": 3, "damian": 3, "camillus": 1}},
        {"text": "Through simple prayer and trust in God", "points": {"andre": 3, "philomena": 2, "simon_stock": 1}},
        {"text": "Through creating beauty that points to God", "points": {"dorothy": 3, "catherine_laboure": 1}}
      ]
    },
    {
      "id": 5,
      "question": "What's your approach to prayer for others?",
      "answers": [
        {"text": "I pray the rosary and traditional prayers", "points": {"bernadette": 3, "simon_stock": 2, "andre": 1}},
        {"text": "I spend hours in front of the Blessed Sacrament", "points": {"padre_pio": 3, "margaret_mary": 2}},
        {"text": "I pray the Divine Mercy chaplet and trust prayers", "points": {"faustina": 3, "philomena": 1}},
        {"text": "I combine prayer with hands-on care", "points": {"camillus": 3, "cosmas": 2, "damian": 2}},
        {"text": "I ask Mary and the saints to intercede", "points": {"catherine_laboure": 3, "simon_stock": 2, "dorothy": 1}}
      ]
    },
    {
      "id": 6,
      "question": "How do you want people to remember your help?",
      "answers": [
        {"text": "As someone who brought them closer to Jesus's Sacred Heart", "points": {"margaret_mary": 3, "faustina": 2}},
        {"text": "As someone who showed them God's infinite mercy", "points": {"faustina": 3, "padre_pio": 2}},
        {"text": "As someone who provided excellent medical care with love", "points": {"cosmas": 3, "damian": 3, "camillus": 1}},
        {"text": "As someone who helped them find healing in holy places", "points": {"bernadette": 3, "andre": 2}},
        {"text": "As someone who gave them hope when all seemed lost", "points": {"philomena": 3, "andre": 1, "dorothy": 1}}
      ]
    },
    {
      "id": 7,
      "question": "What kind of miracle would you most want to perform?",
      "answers": [
        {"text": "Healing someone's terminal illness", "points": {"andre": 3, "bernadette": 2, "padre_pio": 1}},
        {"text": "Helping someone have a deep conversion experience", "points": {"padre_pio": 3, "faustina": 2, "margaret_mary": 1}},
        {"text": "Saving someone's life through medical knowledge", "points": {"cosmas": 3, "damian": 3, "camillus": 2}},
        {"text": "Solving an absolutely impossible situation", "points": {"philomena": 3, "faustina": 1}},
        {"text": "Bringing comfort and peace to someone suffering", "points": {"margaret_mary": 2, "catherine_laboure": 2, "dorothy": 2}}
      ]
    },
    {
      "id": 8,
      "question": "How do you stay close to God while helping others?",
      "answers": [
        {"text": "Through daily Mass and frequent confession", "points": {"padre_pio": 3, "andre": 2}},
        {"text": "Through special devotions and prayer practices", "points": {"faustina": 3, "margaret_mary": 2, "simon_stock": 2}},
        {"text": "Through caring for the sick as if they were Jesus", "points": {"camillus": 3, "cosmas": 2, "damian": 2}},
        {"text": "Through visiting holy places and shrines", "points": {"bernadette": 3, "andre": 1}},
        {"text": "Through wearing or sharing blessed objects", "points": {"catherine_laboure": 3, "simon_stock": 2, "dorothy": 1}}
      ]
    }
  ],
  "results": {
    "padre_pio": {
      "saint_id": "saint_006",
      "name": "St. Padre Pio",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_padrepio.png",
      "description": "Like Padre Pio, you're a powerful prayer warrior with amazing spiritual gifts! You have deep mystical experiences and people come to you for confession and healing. Padre Pio bore the stigmata for over 50 years and performed countless miracles. Your intense prayer life channels God's healing power!",
      "fun_fact": "Padre Pio could reportedly smell people's sins during confession and had the stigmata (wounds of Christ) for over 50 years!"
    },
    "bernadette": {
      "saint_id": "saint_019",
      "name": "St. Bernadette",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_bernadette.png",
      "description": "Like Bernadette, you're chosen to receive special visions that create healing places for millions! Mary appeared to you at Lourdes, and the spring there still brings healing to pilgrims. Your simple faith opens channels of miraculous healing that last forever!",
      "fun_fact": "The spring at Lourdes where Mary appeared to Bernadette has brought healing to millions of pilgrims for over 150 years!"
    },
    "faustina": {
      "saint_id": "saint_027",
      "name": "St. Faustina Kowalska",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_faustina.png",
      "description": "Like Faustina, you're all about Divine Mercy and helping people trust in God's forgiveness! You received visions of Jesus and spread the 'Jesus, I Trust in You' prayer. Your message of God's infinite mercy heals hearts that are broken by sin and guilt!",
      "fun_fact": "Faustina's vision of Jesus gave us the famous Divine Mercy image and the prayer 'Jesus, I Trust in You'!"
    },
    "philomena": {
      "saint_id": "saint_050",
      "name": "St. Philomena",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_philomena.png",
      "description": "Like Philomena, you're the go-to helper for impossible situations! You're a young martyr known for countless miracles and helping with hopeless cases. People pray to you when doctors say there's no hope. Your powerful intercession makes the impossible possible!",
      "fun_fact": "St. Philomena is called the 'Wonder Worker' because of the countless miracles attributed to her intercession!"
    },
    "catherine_laboure": {
      "saint_id": "saint_051",
      "name": "St. Catherine Labouré",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_laboure.png",
      "description": "Like Catherine, you help spread Mary's love through special blessed objects! You received visions of Mary in Paris and gave us the Miraculous Medal. Your devotion to Mary creates sacramentals that protect and heal people worldwide!",
      "fun_fact": "Catherine Labouré's vision of Mary gave us the Miraculous Medal, which has been worn by millions for protection and healing!"
    },
    "margaret_mary": {
      "saint_id": "saint_056",
      "name": "St. Margaret Mary Alacoque",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_margaretmary.png",
      "description": "Like Margaret Mary, you help people understand Jesus's burning love for them! You received visions of Jesus's Sacred Heart and spread this beautiful devotion. Your mission helps people feel how much Jesus loves them personally!",
      "fun_fact": "Margaret Mary received visions of Jesus's Sacred Heart and spread devotion to His burning love for humanity!"
    },
    "andre": {
      "saint_id": "saint_070",
      "name": "St. André Bessette",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_andre.png",
      "description": "Like André, you're a humble healer who performs amazing miracles through simple faith! You built St. Joseph's Oratory in Canada and were known for countless healings. Your simple trust in St. Joseph brings miraculous help to the sick!",
      "fun_fact": "Brother André performed so many healings that he's called the 'Miracle Man of Montreal' and built a huge shrine to St. Joseph!"
    },
    "simon_stock": {
      "saint_id": "saint_098",
      "name": "St. Simon Stock",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_simonstock.png",
      "description": "Like Simon, you help people through special devotions and blessed objects! You received the Brown Scapular from Our Lady and spread this powerful devotion. Your Carmelite spirituality gives people wearable protection and grace!",
      "fun_fact": "St. Simon Stock received the Brown Scapular from Our Lady with the promise that whoever wears it will be saved!"
    },
    "cosmas": {
      "saint_id": "saint_196",
      "name": "St. Cosmas",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_cosmas.png",
      "description": "Like Cosmas, you're a skilled healer who combines medical knowledge with deep faith! You and your twin brother Damian treated patients without payment and were known as 'Holy Unmercenaries.' Your medical skills serve God by healing bodies and souls!",
      "fun_fact": "Saints Cosmas and Damian were twin doctors who never charged for their medical services - they were called 'Holy Unmercenaries'!"
    },
    "damian": {
      "saint_id": "saint_197",
      "name": "St. Damian",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_damianphysician.png",
      "description": "Like Damian, you're a compassionate physician who sees healing as a holy calling! You and your twin brother Cosmas were known for miraculous cures and never charging patients. Your medical mission shows that healing is cooperation with God's power!",
      "fun_fact": "Saints Cosmas and Damian performed many miraculous healings and are patron saints of doctors, pharmacists, and surgeons!"
    },
    "dorothy": {
      "saint_id": "saint_199",
      "name": "St. Dorothy",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_dorothy.png",
      "description": "Like Dorothy, you bring heavenly beauty and hope to people through flowers and nature! You miraculously sent roses and fruit from paradise to convince doubters. Your gift is showing people glimpses of heaven's beauty right here on earth!",
      "fun_fact": "St. Dorothy miraculously sent flowers and fruit from heaven to earth, showing people the beauty of paradise!"
    },
    "camillus": {
      "saint_id": "saint_191",
      "name": "St. Camillus de Lellis",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_camillus.png",
      "description": "Like Camillus, you're dedicated to caring for the sick and dying with incredible compassion! You founded an order specifically to care for the sick and revolutionized hospital care. Your nursing skills combined with deep faith comfort people in their greatest need!",
      "fun_fact": "Camillus de Lellis was a former soldier and gambler who converted and revolutionized hospital care for the sick and dying!"
    }
  }
},
{
  "quiz_id": "desert_disciples",
  "title": "Which Desert Disciples Saint Are You?",
  "description": "Discover which contemplative hermit or monk from our Desert Disciples series matches your spiritual journey!",
  "series": "Desert Disciples",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"benedict": 5, "anthony_great": 5, "cuthbert": 5, "aidan": 5, "paul_hermit": 5, "macarius": 5, "john_climacus": 5, "moses": 5}},
        {"text": "Girl", "points": {"scholastica": 5, "marina": 5, "mary_egypt": 5, "euphrasia": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What draws you to quiet, solitary places?",
      "answers": [
        {"text": "I can hear God's voice better in silence", "points": {"paul_hermit": 3, "mary_egypt": 3, "john_climacus": 2}},
        {"text": "I want to focus completely on prayer", "points": {"anthony_great": 3, "macarius": 2, "benedict": 2}},
        {"text": "I need to escape from worldly distractions", "points": {"mary_egypt": 3, "moses": 2, "euphrasia": 2}},
        {"text": "I feel closest to God in nature", "points": {"cuthbert": 3, "aidan": 2, "paul_hermit": 1}},
        {"text": "I want to create a peaceful community for others", "points": {"benedict": 3, "scholastica": 2, "aidan": 1}}
      ]
    },
    {
      "id": 3,
      "question": "What's your approach to dealing with past mistakes?",
      "answers": [
        {"text": "I do intense penance and pray for forgiveness", "points": {"mary_egypt": 3, "moses": 3, "euphrasia": 2}},
        {"text": "I use my experience to help others avoid my mistakes", "points": {"moses": 3, "mary_egypt": 2, "macarius": 1}},
        {"text": "I focus on building a better future through good works", "points": {"benedict": 3, "scholastica": 2, "aidan": 1}},
        {"text": "I trust in God's mercy and start fresh", "points": {"anthony_great": 2, "cuthbert": 2, "marina": 2}},
        {"text": "I study spiritual wisdom to grow in holiness", "points": {"john_climacus": 3, "macarius": 2, "paul_hermit": 1}}
      ]
    },
    {
      "id": 4,
      "question": "How do you like to spend your day in solitude?",
      "answers": [
        {"text": "Following a structured schedule of prayer and work", "points": {"benedict": 3, "scholastica": 3, "aidan": 1}},
        {"text": "In constant prayer and meditation", "points": {"paul_hermit": 3, "mary_egypt": 2, "john_climacus": 2}},
        {"text": "Studying spiritual books and writings", "points": {"john_climacus": 3, "macarius": 2, "benedict": 1}},
        {"text": "Working with my hands while praying", "points": {"anthony_great": 2, "cuthbert": 2, "marina": 2}},
        {"text": "Caring for animals and enjoying nature", "points": {"cuthbert": 3, "aidan": 2, "paul_hermit": 1}}
      ]
    },
    {
      "id": 5,
      "question": "What's your biggest motivation for choosing a contemplative life?",
      "answers": [
        {"text": "I want to make up for my past sins", "points": {"mary_egypt": 3, "moses": 3, "euphrasia": 1}},
        {"text": "I want to help others find God through my example", "points": {"benedict": 3, "aidan": 2, "macarius": 2}},
        {"text": "I want to reach the highest levels of prayer", "points": {"john_climacus": 3, "anthony_great": 2, "paul_hermit": 2}},
        {"text": "I want to escape the dangers of the world", "points": {"marina": 3, "euphrasia": 2, "cuthbert": 1}},
        {"text": "I feel called to this special way of life", "points": {"scholastica": 3, "anthony_great": 2, "cuthbert": 1}}
      ]
    },
    {
      "id": 6,
      "question": "How do you handle temptations and spiritual battles?",
      "answers": [
        {"text": "I fight them head-on with prayer and fasting", "points": {"anthony_great": 3, "mary_egypt": 2, "moses": 2}},
        {"text": "I follow a wise spiritual rule or guide", "points": {"benedict": 3, "john_climacus": 2, "scholastica": 2}},
        {"text": "I seek advice from other holy people", "points": {"macarius": 3, "aidan": 2, "benedict": 1}},
        {"text": "I increase my penance and self-discipline", "points": {"euphrasia": 3, "mary_egypt": 2, "paul_hermit": 1}},
        {"text": "I trust in God's protection and stay focused on Him", "points": {"cuthbert": 2, "marina": 2, "paul_hermit": 2}}
      ]
    },
    {
      "id": 7,
      "question": "What kind of legacy do you want to leave?",
      "answers": [
        {"text": "A practical rule for living that helps others", "points": {"benedict": 3, "scholastica": 2, "aidan": 1}},
        {"text": "Proof that anyone can change their life completely", "points": {"moses": 3, "mary_egypt": 3, "marina": 1}},
        {"text": "Deep spiritual writings about prayer", "points": {"john_climacus": 3, "macarius": 2, "anthony_great": 1}},
        {"text": "Example that extreme holiness is possible", "points": {"paul_hermit": 3, "euphrasia": 2, "mary_egypt": 1}},
        {"text": "A community that continues after I'm gone", "points": {"aidan": 3, "benedict": 2, "cuthbert": 1}}
      ]
    },
    {
      "id": 8,
      "question": "How do you balance solitude with helping others?",
      "answers": [
        {"text": "I create monasteries where others can join me", "points": {"benedict": 3, "scholastica": 3, "aidan": 2}},
        {"text": "I teach through my example more than words", "points": {"anthony_great": 3, "paul_hermit": 2, "cuthbert": 1}},
        {"text": "I counsel people who come seeking spiritual advice", "points": {"macarius": 3, "john_climacus": 2, "moses": 1}},
        {"text": "I focus completely on my own spiritual journey", "points": {"mary_egypt": 3, "euphrasia": 2, "paul_hermit": 1}},
        {"text": "I find creative ways to serve while staying hidden", "points": {"marina": 3, "cuthbert": 2}}
      ]
    }
  ],
  "results": {
    "benedict": {
      "saint_id": "saint_014",
      "name": "St. Benedict",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_benedict.png",
      "description": "Like Benedict, you're the ultimate organizer of monastic life! You wrote the Rule of St. Benedict with the motto 'Ora et Labora' (Pray and Work). You're the Father of Western monasticism and your balanced approach to spiritual life has guided monks for 1,500 years. Your practical holiness creates lasting communities!",
      "fun_fact": "St. Benedict's Rule has been followed by monks for over 1,500 years and his motto 'Ora et Labora' means 'Pray and Work'!"
    },
    "anthony_great": {
      "saint_id": "saint_045",
      "name": "St. Anthony the Great",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_anthonygreat.png",
      "description": "Like Anthony, you're the original Desert Father who started the whole hermit movement! You lived in the Egyptian desert and fought spiritual battles with demons. Anthony is the Father of Christian monasticism and inspired thousands to follow your example. Your pioneering spirit creates new paths to holiness!",
      "fun_fact": "St. Anthony the Great is called the 'Father of Christian Monasticism' and lived over 100 years, mostly in the Egyptian desert!"
    },
    "scholastica": {
      "saint_id": "saint_042",
      "name": "St. Scholastica",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_scholastica.png",
      "description": "Like Scholastica, you're a powerful prayer warrior whose prayers can even change the weather! You're the twin sister of St. Benedict and founded communities for religious women. Your prayers once stopped a storm so you could keep talking about God with your brother. Your prayer power amazes everyone!",
      "fun_fact": "St. Scholastica's prayers once caused such a powerful storm that her brother Benedict couldn't leave and had to spend the night discussing God!"
    },
    "cuthbert": {
      "saint_id": "saint_094",
      "name": "St. Cuthbert of Lindisfarne",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_cuthbert.png",
      "description": "Like Cuthbert, you love living on islands and caring for animals! You're a monk who finds God especially in nature and has a special connection with wildlife. Cuthbert lived on Holy Island and was known for his love of creation. Your island spirituality shows God's presence in all of nature!",
      "fun_fact": "St. Cuthbert lived on the Holy Island of Lindisfarne and had such a connection with nature that seals and birds would come to him!"
    },
    "aidan": {
      "saint_id": "saint_177",
      "name": "St. Aidan of Lindisfarne",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_aidan.png",
      "description": "Like Aidan, you're an Irish monk who brings Christianity to new places through gentle mission work! You founded the monastery on Lindisfarne and evangelized northern England. Your Celtic spirituality combines deep prayer with active ministry. Your missionary monasticism spreads faith to new frontiers!",
      "fun_fact": "St. Aidan brought Celtic Christianity from Ireland to northern England and founded the famous monastery at Lindisfarne!"
    },
    "marina": {
      "saint_id": "saint_123",
      "name": "St. Marina the Monk",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_marina.png",
      "description": "Like Marina, you're creative and determined in following your calling! You disguised yourself as a man to enter a monastery because you felt so called to monastic life. Your unusual path shows that God calls people in unexpected ways. Your determination breaks down barriers to serve God!",
      "fun_fact": "St. Marina disguised herself as a man named Marinus to enter a monastery and lived this hidden life for years!"
    },
    "paul_hermit": {
      "saint_id": "saint_163",
      "name": "St. Paul the Hermit",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_paulhermit.png",
      "description": "Like Paul, you're the original hermit who lived alone in the desert for over 60 years! A raven brought you half a loaf of bread daily for six decades. You're the first Christian hermit and showed that complete solitude with God is possible. Your extreme hermit life proves God provides for those who trust completely!",
      "fun_fact": "St. Paul the Hermit lived alone in the desert for over 60 years, and a raven brought him half a loaf of bread every single day!"
    },
    "mary_egypt": {
      "saint_id": "saint_164",
      "name": "St. Mary of Egypt",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_maryegypt.png",
      "description": "Like Mary, you understand that dramatic conversion is possible for anyone! You went from a life of sin to 47 years as a hermit in the desert, living on only three loaves of bread and desert plants. Your conversion story gives hope to everyone that it's never too late to change. Your radical penance inspires total transformation!",
      "fun_fact": "St. Mary of Egypt lived in the desert for 47 years surviving on only three loaves of bread and whatever plants she could find!"
    },
    "macarius": {
      "saint_id": "saint_165",
      "name": "St. Macarius",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_macarius.png",
      "description": "Like Macarius, you're a wise Desert Father who gives amazing spiritual advice! You founded two monasteries and were known for your humility and miracles. Other monks came to you for guidance because of your wisdom. Your desert wisdom helps others navigate their spiritual journeys!",
      "fun_fact": "St. Macarius was such a wise spiritual director that monks traveled across the desert just to get his advice!"
    },
    "john_climacus": {
      "saint_id": "saint_166",
      "name": "St. John Climacus",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_climacus.png",
      "description": "Like John, you're a brilliant spiritual writer who maps out the journey to God! You wrote 'The Ladder of Divine Ascent,' one of Christianity's greatest spiritual classics. You spent 40 years as a hermit before becoming abbot. Your spiritual ladder helps others climb step by step to heaven!",
      "fun_fact": "St. John Climacus wrote 'The Ladder of Divine Ascent' after spending 40 years as a hermit at St. Catherine's Monastery!"
    },
    "moses": {
      "saint_id": "saint_068",
      "name": "St. Moses the Black",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_moses.png",
      "description": "Like Moses, you show that anyone can change from a life of violence to incredible holiness! You went from leading a gang of robbers to leading monks in prayer in the Egyptian desert. Your conversion story proves God's mercy can transform the most unlikely people. Your dramatic change gives hope to everyone!",
      "fun_fact": "St. Moses the Black went from being a gang leader and robber to becoming one of the most respected Desert Fathers!"
    },
    "euphrasia": {
      "saint_id": "saint_204",
      "name": "St. Euphrasia",
      "series": "Desert Disciples",
      "icon_asset": "assets/saints/saint_euphrasia.png",
      "description": "Like Euphrasia, you're willing to go to extremes for God! You fled to Egypt to avoid an arranged marriage and became an abbess known for extreme asceticism. Your dedication to spiritual discipline amazes everyone. Your total commitment shows what's possible when someone gives everything to God!",
      "fun_fact": "St. Euphrasia fled to Egypt to avoid an arranged marriage and became famous for her extremely disciplined spiritual life!"
    }
  }
},
{
  "quiz_id": "virtue_vignettes",
  "title": "Which Virtue Vignettes Saint Are You?",
  "description": "Discover which saint known for specific virtues from our Virtue Vignettes series matches your character!",
  "series": "Virtue Vignettes",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"simon_cyrene": 5, "john_vianney": 5, "philip_neri": 5, "francis_sales": 5, "lasalle": 5, "hubert": 5, "hippolytus": 5, "genesius": 5, "alexius": 5}},
        {"text": "Girl", "points": {"monica": 5, "bakhita": 5, "gianna": 5, "veronica": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What virtue do you most want to be known for?",
      "answers": [
        {"text": "Patience and never giving up on people", "points": {"monica": 3, "bakhita": 2, "john_vianney": 1}},
        {"text": "Joy and making others laugh", "points": {"philip_neri": 3, "francis_sales": 2}},
        {"text": "Gentleness and never losing my temper", "points": {"francis_sales": 3, "bakhita": 2, "lasalle": 1}},
        {"text": "Compassion for people who are suffering", "points": {"veronica": 3, "simon_cyrene": 2, "gianna": 1}},
        {"text": "Humility and serving without recognition", "points": {"alexius": 3, "john_vianney": 2, "simon_cyrene": 1}}
      ]
    },
    {
      "id": 3,
      "question": "How do you handle it when people disappoint you?",
      "answers": [
        {"text": "I keep praying for them and never give up hope", "points": {"monica": 3, "bakhita": 2}},
        {"text": "I try to see the good in them and stay positive", "points": {"philip_neri": 3, "francis_sales": 2}},
        {"text": "I look for ways to help them without judging", "points": {"simon_cyrene": 3, "veronica": 2, "lasalle": 1}},
        {"text": "I forgive them and try to reconcile", "points": {"hippolytus": 3, "genesius": 2, "francis_sales": 1}},
        {"text": "I stay humble and work on my own flaws first", "points": {"john_vianney": 3, "alexius": 2}}
      ]
    },
    {
      "id": 4,
      "question": "What's your approach to helping others?",
      "answers": [
        {"text": "I sacrifice my own comfort for their needs", "points": {"gianna": 3, "simon_cyrene": 2, "monica": 1}},
        {"text": "I use humor and joy to lift their spirits", "points": {"philip_neri": 3, "francis_sales": 2}},
        {"text": "I patiently teach them what they need to know", "points": {"lasalle": 3, "john_vianney": 2, "francis_sales": 1}},
        {"text": "I offer comfort during their painful times", "points": {"veronica": 3, "bakhita": 2, "simon_cyrene": 1}},
        {"text": "I help quietly without seeking credit", "points": {"alexius": 3, "john_vianney": 1}}
      ]
    },
    {
      "id": 5,
      "question": "How do you handle your own suffering or difficulties?",
      "answers": [
        {"text": "I trust God's plan and stay gentle", "points": {"bakhita": 3, "monica": 2, "francis_sales": 1}},
        {"text": "I keep my sense of humor and try to stay joyful", "points": {"philip_neri": 3, "francis_sales": 2}},
        {"text": "I offer it up for others who need help", "points": {"gianna": 3, "simon_cyrene": 2, "veronica": 1}},
        {"text": "I see it as a chance to grow in virtue", "points": {"john_vianney": 3, "alexius": 2, "hubert": 1}},
        {"text": "I look for the lesson God wants to teach me", "points": {"hubert": 3, "hippolytus": 2, "genesius": 1}}
      ]
    },
    {
      "id": 6,
      "question": "What motivates you to keep trying when things get hard?",
      "answers": [
        {"text": "Love for my family and their eternal salvation", "points": {"monica": 3, "gianna": 3}},
        {"text": "Knowing that joy and laughter heal people", "points": {"philip_neri": 3, "francis_sales": 1}},
        {"text": "Wanting to share Jesus's compassion", "points": {"veronica": 3, "simon_cyrene": 2, "bakhita": 1}},
        {"text": "Believing that education changes lives", "points": {"lasalle": 3, "francis_sales": 1}},
        {"text": "Understanding that hidden service pleases God most", "points": {"alexius": 3, "john_vianney": 2}}
      ]
    },
    {
      "id": 7,
      "question": "How do you deal with your own mistakes and shortcomings?",
      "answers": [
        {"text": "I ask for forgiveness and try to make amends", "points": {"hippolytus": 3, "genesius": 3, "monica": 1}},
        {"text": "I don't take myself too seriously and learn from them", "points": {"philip_neri": 3, "francis_sales": 2}},
        {"text": "I use my experience to help others avoid similar mistakes", "points": {"genesius": 2, "hubert": 2, "bakhita": 1}},
        {"text": "I focus on being better tomorrow than today", "points": {"john_vianney": 3, "lasalle": 2, "alexius": 1}},
        {"text": "I trust in God's mercy and keep trying", "points": {"monica": 2, "bakhita": 2, "francis_sales": 1}}
      ]
    },
    {
      "id": 8,
      "question": "What legacy do you want to leave?",
      "answers": [
        {"text": "Proof that persistent prayer changes everything", "points": {"monica": 3, "bakhita": 1}},
        {"text": "That following God should be joyful and fun", "points": {"philip_neri": 3, "francis_sales": 2}},
        {"text": "That gentleness is stronger than force", "points": {"francis_sales": 3, "bakhita": 2, "lasalle": 1}},
        {"text": "That small acts of kindness matter infinitely", "points": {"veronica": 3, "simon_cyrene": 2, "alexius": 1}},
        {"text": "That anyone can change with God's grace", "points": {"genesius": 3, "hubert": 2, "hippolytus": 2}}
      ]
    }
  ],
  "results": {
    "monica": {
      "saint_id": "saint_041",
      "name": "St. Monica",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_monica.png",
      "description": "Like Monica, you have incredible patience and never give up praying for the people you love! You prayed for years for your son's conversion and he became St. Augustine. Monica shows that persistent, patient prayer can change anyone's heart. Your patient love transforms families!",
      "fun_fact": "St. Monica prayed for her son Augustine's conversion for 17 years, and he became one of the greatest saints!"
    },
    "simon_cyrene": {
      "saint_id": "saint_059",
      "name": "St. Simon of Cyrene",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_simon.png",
      "description": "Like Simon, you're always ready to help carry other people's burdens! You helped Jesus carry His cross and show that small acts of service can be part of salvation history. Your willingness to help when others struggle makes you a true cross-bearer for Christ!",
      "fun_fact": "St. Simon of Cyrene is mentioned in all three Synoptic Gospels for helping Jesus carry the cross - a simple act that became part of salvation history!"
    },
    "bakhita": {
      "saint_id": "saint_110",
      "name": "St. Josephine Bakhita",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_bakhita.png",
      "description": "Like Bakhita, you have incredible gentleness despite experiencing terrible suffering! You went from slavery to religious sisterhood and were known for your sweet spirit. Bakhita shows that suffering can create beautiful souls instead of bitter ones. Your gentle spirit heals wounded hearts!",
      "fun_fact": "St. Josephine Bakhita endured slavery and torture but became famous for her incredibly gentle and forgiving spirit!"
    },
    "john_vianney": {
      "saint_id": "saint_077",
      "name": "St. John Vianney",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_vianney.png",
      "description": "Like John Vianney, you're incredibly humble and dedicated to serving others! You spent hours hearing confessions and were known for your deep holiness despite feeling unworthy. The Curé of Ars shows that humility attracts God's grace. Your humble service draws people to God!",
      "fun_fact": "St. John Vianney spent up to 18 hours a day hearing confessions and always felt unworthy of his calling as a priest!"
    },
    "gianna": {
      "saint_id": "saint_154",
      "name": "St. Gianna Molla",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_gianna.png",
      "description": "Like Gianna, you're willing to sacrifice everything for your family! You chose to save your unborn child's life over your own as a doctor and mother. Gianna shows that heroic love happens in ordinary families. Your sacrificial love puts others first and shows Christ's heart!",
      "fun_fact": "St. Gianna Molla was canonized in 2004 with her husband and children present at the ceremony - showing holiness in family life!"
    },
    "philip_neri": {
      "saint_id": "saint_155",
      "name": "St. Philip Neri",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_philipneri.png",
      "description": "Like Philip, you're the 'Laughing Saint' who shows that following God should be joyful! You used practical jokes and humor while being deeply holy. Philip founded the Oratory and brought joy to Rome. Your joyful faith proves that sanctity and fun go together perfectly!",
      "fun_fact": "St. Philip Neri was known for his practical jokes and sense of humor - he once shaved off half his beard to practice humility!"
    },
    "francis_sales": {
      "saint_id": "saint_156",
      "name": "St. Francis de Sales",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_francisdesales.png",
      "description": "Like Francis de Sales, you have incredible gentleness and never lose your temper! You wrote 'Introduction to the Devout Life' and were known for your patient approach to conversion. Francis never lost his temper in 40 years. Your gentle strength wins hearts for God!",
      "fun_fact": "St. Francis de Sales never lost his temper once in 40 years of ministry and converted thousands through his gentle approach!"
    },
    "lasalle": {
      "saint_id": "saint_157",
      "name": "St. Jean-Baptiste de La Salle",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_lasalle.png",
      "description": "Like La Salle, you're dedicated to education and believe every child deserves to learn! You founded the Brothers of the Christian Schools and revolutionized education. La Salle established the first teacher training college. Your educational dedication lifts up the poor and forgotten!",
      "fun_fact": "St. Jean-Baptiste de La Salle founded the first teacher training college and revolutionized education for poor children!"
    },
    "veronica": {
      "saint_id": "saint_096",
      "name": "St. Veronica",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_veronica.png",
      "description": "Like Veronica, you have incredible compassion and aren't afraid to comfort people who are suffering! You wiped Jesus's face on the way to Calvary and His image appeared on your cloth. Your simple act of kindness becomes a precious relic. Your compassionate heart sees Jesus in all who suffer!",
      "fun_fact": "St. Veronica's act of wiping Jesus's face during His passion resulted in His image being miraculously imprinted on her cloth!"
    },
    "hubert": {
      "saint_id": "saint_219",
      "name": "St. Hubert",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_hubert.png",
      "description": "Like Hubert, you found God through an amazing conversion experience in nature! You saw a crucifix between a stag's antlers while hunting and completely changed your life. Hubert became a bishop and evangelized Belgium. Your dramatic conversion shows God can reach anyone anywhere!",
      "fun_fact": "St. Hubert converted when he saw a crucifix between a stag's antlers while hunting - one of the most famous conversion stories!"
    },
    "hippolytus": {
      "saint_id": "saint_218",
      "name": "St. Hippolytus",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_hippolytus.png",
      "description": "Like Hippolytus, you understand the power of reconciliation and second chances! You were an anti-pope who opposed the Church but reconciled before martyrdom. Hippolytus shows that even the most broken relationships can be healed. Your story of reconciliation heals divisions!",
      "fun_fact": "St. Hippolytus was an anti-pope who opposed the Church but reconciled with the Pope before they were both martyred together!"
    },
    "genesius": {
      "saint_id": "saint_212",
      "name": "St. Genesius",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_genesius.png",
      "description": "Like Genesius, you had a dramatic conversion that completely changed your life! You were an actor mocking baptism on stage but converted during the performance and was martyred for your newfound faith. Your sudden conversion shows God can reach hearts in unexpected moments!",
      "fun_fact": "St. Genesius was an actor who converted to Christianity while mocking baptism on stage and was immediately martyred for his new faith!"
    },
    "alexius": {
      "saint_id": "saint_180",
      "name": "St. Alexius",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_alexius.png",
      "description": "Like Alexius, you believe the most beautiful service is done in secret! You were a Roman nobleman who lived as a beggar for holiness, even living unknown under your father's staircase for 17 years. Your hidden holiness shows that God values humble service more than fame!",
      "fun_fact": "St. Alexius lived as a beggar under his own father's staircase for 17 years without being recognized - the ultimate hidden saint!"
    }
  }
},
{
  "quiz_id": "apostolic_allstars",
  "title": "Which Apostolic All-Stars Saint Are You?",
  "description": "Discover which Church father or early Christian leader from our Apostolic All-Stars series matches your ministerial heart!",
  "series": "Apostolic All-Stars",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "What's your favorite way to serve the Church?",
      "answers": [
        {"text": "Writing books and teaching about God", "points": {"augustine": 3, "aquinas": 3, "jerome": 2}},
        {"text": "Traveling to spread the Gospel to new places", "points": {"paul": 3, "barnabas": 2, "mark": 2}},
        {"text": "Leading and organizing Church communities", "points": {"gregory_great": 3, "ambrose": 2, "clement": 2}},
        {"text": "Helping people understand the Bible", "points": {"jerome": 3, "luke": 2, "mark": 1}},
        {"text": "Standing up for correct Church teaching", "points": {"athanasius": 3, "polycarp": 2, "ignatius": 2}}
      ]
    },
    {
      "id": 2,
      "question": "How do you like to communicate important ideas?",
      "answers": [
        {"text": "Through detailed writing and scholarly books", "points": {"augustine": 3, "aquinas": 2, "bonaventure": 2}},
        {"text": "Through personal letters and correspondence", "points": {"paul": 3, "ignatius": 2, "polycarp": 1}},
        {"text": "Through beautiful poetry and hymns", "points": {"ephrem": 3, "gregory_nazianzen": 2, "ambrose": 1}},
        {"text": "Through careful translation and explanation", "points": {"jerome": 3, "luke": 2}},
        {"text": "Through preaching and public speaking", "points": {"stephen": 2, "antoninus": 2, "apollinaris": 1}}
      ]
    },
    {
      "id": 3,
      "question": "What's your approach to handling disagreements in the Church?",
      "answers": [
        {"text": "I use logic and reason to prove what's true", "points": {"aquinas": 3, "augustine": 2, "athanasius": 2}},
        {"text": "I appeal to Scripture and Church tradition", "points": {"jerome": 3, "polycarp": 2, "clement": 2}},
        {"text": "I try to make peace and bring people together", "points": {"barnabas": 3, "gregory_great": 2, "ambrose": 1}},
        {"text": "I stand firm on important principles", "points": {"athanasius": 3, "ignatius": 2, "stephen": 2}},
        {"text": "I organize councils and meetings to discuss issues", "points": {"gregory_great": 2, "cornelius": 2, "fabian": 1}}
      ]
    },
    {
      "id": 4,
      "question": "What motivates you most in your ministry?",
      "answers": [
        {"text": "Love for learning and understanding God better", "points": {"augustine": 3, "aquinas": 2, "bede": 2}},
        {"text": "Passion for sharing the Gospel with everyone", "points": {"paul": 3, "mark": 2, "luke": 2}},
        {"text": "Desire to protect the Church from false teaching", "points": {"athanasius": 3, "polycarp": 2, "ignatius": 2}},
        {"text": "Joy in helping others grow in faith", "points": {"barnabas": 2, "ambrose": 2, "antoninus": 2}},
        {"text": "Calling to serve as a shepherd for God's people", "points": {"gregory_great": 3, "clement": 2, "cornelius": 1}}
      ]
    },
    {
      "id": 5,
      "question": "How do you handle persecution or opposition?",
      "answers": [
        {"text": "I use it as an opportunity to teach and witness", "points": {"stephen": 3, "polycarp": 3, "ignatius": 2}},
        {"text": "I keep traveling and preaching despite the dangers", "points": {"paul": 3, "apollinaris": 2, "barnabas": 1}},
        {"text": "I write even more to defend the truth", "points": {"athanasius": 3, "jerome": 2, "augustine": 1}},
        {"text": "I rely on prayer and trust in God's protection", "points": {"ephrem": 2, "gregory_nazianzen": 2, "bonaventure": 2}},
        {"text": "I continue my duties faithfully no matter what", "points": {"clement": 2, "fabian": 2, "cornelius": 2}}
      ]
    },
    {
      "id": 6,
      "question": "What's your greatest strength as a Church leader?",
      "answers": [
        {"text": "My ability to explain complicated ideas simply", "points": {"aquinas": 3, "augustine": 2, "luke": 2}},
        {"text": "My courage in defending what's right", "points": {"athanasius": 3, "stephen": 2, "polycarp": 2}},
        {"text": "My skill in organizing and administration", "points": {"gregory_great": 3, "ambrose": 2, "clement": 1}},
        {"text": "My gift for inspiring and encouraging others", "points": {"barnabas": 3, "paul": 2, "ephrem": 1}},
        {"text": "My dedication to accurate scholarship", "points": {"jerome": 3, "bede": 2, "evaristus": 1}}
      ]
    },
    {
      "id": 7,
      "question": "How do you want to help future generations of Christians?",
      "answers": [
        {"text": "By leaving behind great theological writings", "points": {"augustine": 3, "aquinas": 3, "bonaventure": 2}},
        {"text": "By creating accurate translations of the Bible", "points": {"jerome": 3, "luke": 1}},
        {"text": "By establishing strong Church structures", "points": {"gregory_great": 3, "clement": 2, "fabian": 1}},
        {"text": "By showing how to stay faithful under pressure", "points": {"polycarp": 3, "ignatius": 2, "stephen": 2}},
        {"text": "By preserving important historical records", "points": {"bede": 3, "mark": 2, "evaristus": 1}}
      ]
    },
    {
      "id": 8,
      "question": "What aspect of Church life do you most want to strengthen?",
      "answers": [
        {"text": "Theological education and understanding", "points": {"aquinas": 3, "augustine": 2, "ambrose": 2}},
        {"text": "Missionary work and evangelization", "points": {"paul": 3, "barnabas": 2, "mark": 2}},
        {"text": "Worship and liturgical life", "points": {"gregory_great": 3, "ephrem": 2, "gregory_nazianzen": 1}},
        {"text": "Biblical scholarship and translation", "points": {"jerome": 3, "luke": 2, "bede": 1}},
        {"text": "Church unity and orthodoxy", "points": {"athanasius": 3, "clement": 2, "cornelius": 1}}
      ]
    }
  ],
  "results": {
    "augustine": {
      "saint_id": "saint_008",
      "name": "St. Augustine",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_augustine.png",
      "description": "Like Augustine, you're a brilliant thinker who converted after years of searching and became one of the greatest theologians ever! You wrote 'The Confessions' and 'The City of God' and are a Doctor of the Church. Your intellectual journey from doubt to faith helps others who struggle with questions!",
      "fun_fact": "St. Augustine wrote over 5 million words in his lifetime and his 'Confessions' was the first autobiography ever written!"
    },
    "aquinas": {
      "saint_id": "saint_018",
      "name": "St. Thomas Aquinas",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_aquinas.png",
      "description": "Like Aquinas, you're the 'Angelic Doctor' who uses reason and logic to explain faith perfectly! You wrote the 'Summa Theologica' which is still studied today. Your systematic approach to theology helps people understand that faith and reason work together beautifully!",
      "fun_fact": "St. Thomas Aquinas's 'Summa Theologica' contains over 3,000 articles and is still considered one of the greatest works of theology ever written!"
    },
    "jerome": {
      "saint_id": "saint_023",
      "name": "St. Jerome",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_jerome.png",
      "description": "Like Jerome, you're passionate about Scripture and getting every word exactly right! You translated the Bible into Latin (the Vulgate) and were known for your fiery debates. Your scholarly dedication gives the Church accurate access to God's Word!",
      "fun_fact": "St. Jerome's Latin Vulgate translation of the Bible was used by the Catholic Church for over 1,000 years!"
    },
    "paul": {
      "saint_id": "saint_025",
      "name": "St. Paul",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_paul.png",
      "description": "Like Paul, you're the ultimate missionary who travels everywhere spreading the Gospel! You wrote many letters that became part of the New Testament and converted after seeing Jesus in a vision. Your missionary zeal brings the Gospel to the ends of the earth!",
      "fun_fact": "St. Paul traveled over 10,000 miles on foot and by ship, and 13 books of the New Testament are attributed to him!"
    },
    "stephen": {
      "saint_id": "saint_037",
      "name": "St. Stephen",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_stephen.png",
      "description": "Like Stephen, you're the first Christian martyr who died forgiving his attackers! You were chosen as one of the first deacons and gave powerful speeches defending the faith. Your courage in the face of death inspires all future martyrs!",
      "fun_fact": "St. Stephen was the first Christian martyr and died praying for his attackers, just like Jesus did on the cross!"
    },
    "polycarp": {
      "saint_id": "saint_038",
      "name": "St. Polycarp",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_polycarp.png",
      "description": "Like Polycarp, you're a bridge between the apostles and later generations! You were a disciple of St. John the Apostle and became a great bishop and martyr. Your direct connection to the apostles makes you a living link to Jesus himself!",
      "fun_fact": "St. Polycarp was personally taught by St. John the Apostle, making him a direct link between Jesus and the early Church!"
    },
    "ignatius": {
      "saint_id": "saint_054",
      "name": "St. Ignatius of Antioch",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_antioch.png",
      "description": "Like Ignatius, you're an early Church Father who wrote powerful letters while facing martyrdom! You wrote to Christians while being taken to Rome to be fed to lions. Your letters about Church unity and the Eucharist still guide the Church today!",
      "fun_fact": "St. Ignatius wrote seven letters to different churches while being transported to Rome for martyrdom - they're still treasured today!"
    },
    "mark": {
      "saint_id": "saint_074",
      "name": "St. Mark the Evangelist",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_mark.png",
      "description": "Like Mark, you're a Gospel writer who traveled with the great apostles! You wrote the shortest Gospel and traveled with both St. Paul and St. Peter. Your Gospel captures Jesus's actions and energy, and you founded the Church in Alexandria!",
      "fun_fact": "St. Mark's Gospel is the shortest but most action-packed, and his symbol is the winged lion representing courage!"
    },
    "luke": {
      "saint_id": "saint_076",
      "name": "St. Luke the Evangelist",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_luke.png",
      "description": "Like Luke, you're a doctor-evangelist who combines healing with preaching! You wrote the Gospel of Luke and Acts of the Apostles, and traveled with St. Paul as a missionary. Your medical background and artistic gifts make the Gospel accessible to everyone!",
      "fun_fact": "St. Luke was the only Gospel writer who was also a doctor and artist, bringing both healing and beauty to his ministry!"
    },
    "gregory_great": {
      "saint_id": "saint_067",
      "name": "St. Gregory the Great",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_gregorygreat.png",
      "description": "Like Gregory, you're an organizational genius who strengthens the whole Church! You organized Church music (Gregorian chant) and sent missionaries to England. Your administrative skills and spiritual wisdom make the Church more effective worldwide!",
      "fun_fact": "St. Gregory the Great organized the beautiful Gregorian chant we still hear today and sent missionaries to convert England!"
    },
    "ambrose": {
      "saint_id": "saint_064",
      "name": "St. Ambrose",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_ambrose.png",
      "description": "Like Ambrose, you're a powerful bishop and teacher who influenced great saints! You were the teacher and baptizer of St. Augustine and were known for beautiful hymns and fearless preaching. Your teaching creates other great saints and leaders!",
      "fun_fact": "St. Ambrose baptized St. Augustine and was so influential that he's considered one of the four great Western Church Fathers!"
    },
    "athanasius": {
      "saint_id": "saint_186",
      "name": "St. Athanasius",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_athanasius.png",
      "description": "Like Athanasius, you're the fearless defender of orthodox teaching! You fought against Arianism and defended the Trinity when almost the whole world opposed you. You're called the 'Father of Orthodoxy' because your courage saved the Church from heresy!",
      "fun_fact": "St. Athanasius was exiled five times for defending the Trinity but never gave up - he literally saved Church teaching!"
    },
    "barnabas": {
      "saint_id": "saint_187",
      "name": "St. Barnabas",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_barnabas.png",
      "description": "Like Barnabas, you're the 'son of encouragement' who brings out the best in others! You traveled with St. Paul on mission trips and were known for being a peacemaker. Your encouraging spirit helps other leaders succeed and grow!",
      "fun_fact": "St. Barnabas's name literally means 'son of encouragement' and he was the one who first trusted and mentored St. Paul!"
    },
    "bede": {
      "saint_id": "saint_188",
      "name": "St. Bede the Venerable",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_bede.png",
      "description": "Like Bede, you're a scholarly monk who preserves important history for future generations! You wrote 'Ecclesiastical History of the English People' and are called the Father of English History. Your careful scholarship keeps the Church's story alive!",
      "fun_fact": "St. Bede wrote the first comprehensive history of English Christianity and created the dating system (A.D.) we still use today!"
    },
    "bonaventure": {
      "saint_id": "saint_189",
      "name": "St. Bonaventure",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_bonaventure.png",
      "description": "Like Bonaventure, you're the 'Seraphic Doctor' who combines deep theology with Franciscan spirituality! You were Minister General of the Franciscans and a friend of St. Thomas Aquinas. Your mystical theology shows the loving heart behind scholarly study!",
      "fun_fact": "St. Bonaventure was called the 'Seraphic Doctor' and was such good friends with Thomas Aquinas that they studied together!"
    },
    "clement": {
      "saint_id": "saint_193",
      "name": "St. Clement of Rome",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_clement.png",
      "description": "Like Clement, you're one of the first popes who wrote important letters to guide the early Church! You wrote to the Corinthians about unity and order in the Church. Your early papal leadership helped establish how the Church should be organized!",
      "fun_fact": "St. Clement was the fourth Pope and his letter to the Corinthians is one of the oldest Christian documents outside the New Testament!"
    },
    "ephrem": {
      "saint_id": "saint_232",
      "name": "St. Ephrem the Syrian",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_ephrem.png",
      "description": "Like Ephrem, you're the 'Harp of the Holy Spirit' who writes beautiful hymns that teach the faith! You were a deacon and Doctor of the Church famous for your spiritual poetry. Your hymns make theology singable and help people remember important truths!",
      "fun_fact": "St. Ephrem was called the 'Harp of the Holy Spirit' because his beautiful hymns taught theology through music!"
    },
    "cornelius": {
      "saint_id": "saint_195",
      "name": "St. Cornelius",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_cornelius.png",
      "description": "Like Cornelius, you're a pope who handled persecution and schism with wisdom! You dealt with difficult situations in the early Church and were martyred during the Decian persecution. Your steady leadership guides the Church through crisis!",
      "fun_fact": "St. Cornelius was Pope during one of the worst persecutions and had to deal with the Novatian schism while facing martyrdom!"
    },
    "fabian": {
      "saint_id": "saint_206",
      "name": "St. Fabian",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_fabian.png",
      "description": "Like Fabian, you were chosen by God in an unexpected way! You became pope when a dove landed on your head during the papal election. Your surprising election shows that God chooses leaders in mysterious ways!",
      "fun_fact": "St. Fabian was chosen as Pope when a dove landed on his head during the election - everyone took it as a sign from God!"
    },
    "gregory_nazianzen": {
      "saint_id": "saint_216",
      "name": "St. Gregory Nazianzen",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_gregorynazianzen.png",
      "description": "Like Gregory Nazianzen, you're 'The Theologian' who combines beautiful poetry with deep doctrine! You're one of the three Cappadocian Fathers and a Doctor of the Church. Your poetic theology shows that truth and beauty belong together!",
      "fun_fact": "St. Gregory Nazianzen is called simply 'The Theologian' in the Eastern Church - one of only three people given this title!"
    },
    "antoninus": {
      "saint_id": "saint_184",
      "name": "St. Antoninus",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_antoninus.png",
      "description": "Like Antoninus, you're an archbishop known for practical reform and charity! You wrote influential works on moral theology and economics and led reform in Florence. Your practical holiness shows how faith applies to everyday life!",
      "fun_fact": "St. Antoninus was one of the first theologians to write about economics and business ethics from a Christian perspective!"
    },
    "apollinaris": {
      "saint_id": "saint_185",
      "name": "St. Apollinaris",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_apollinaris.png",
      "description": "Like Apollinaris, you're a first bishop who performed many miraculous healings! You were the first bishop of Ravenna and a disciple of St. Peter. Your episcopal ministry combines administrative leadership with miraculous power!",
      "fun_fact": "St. Apollinaris was the first bishop of Ravenna and a direct disciple of St. Peter who performed many miraculous healings!"
    },
    "evaristus": {
      "saint_id": "saint_234",
      "name": "St. Evaristus",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_evaristus.png",
      "description": "Like Evaristus, you're an organizing pope who helped structure the early Church! You were the fifth Pope and established seven deacons to assist bishops and organized parishes in Rome. Your administrative vision creates lasting Church structures!",
      "fun_fact": "St. Evaristus organized the first parishes in Rome and established the system of seven deacons that's still used today!"
    }
  }
},
{
  "quiz_id": "mini_marians",
  "title": "Which Mini Marians Saint Are You?",
  "description": "Discover which beautiful appearance of Our Lady from our Mini Marians series matches your devotion to Mary!",
  "series": "Mini Marians",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "What draws you most to Mary?",
      "answers": [
        {"text": "Her healing power and miracles", "points": {"lourdes": 3, "grace": 2}},
        {"text": "Her messages about peace and prayer", "points": {"fatima": 3, "rosary": 2}},
        {"text": "Her love for all cultures and peoples", "points": {"guadalupe": 3, "grace": 1}},
        {"text": "Her understanding of suffering and pain", "points": {"sorrows": 3, "lourdes": 1}},
        {"text": "Her power in the Rosary", "points": {"rosary": 3, "fatima": 2}}
      ]
    },
    {
      "id": 2,
      "question": "How do you like to pray to Mary?",
      "answers": [
        {"text": "By saying the Rosary daily", "points": {"fatima": 3, "rosary": 3, "sorrows": 1}},
        {"text": "By asking for healing for myself or others", "points": {"lourdes": 3, "grace": 2}},
        {"text": "By praying for peace in the world", "points": {"fatima": 3, "rosary": 2}},
        {"text": "By asking Mary to understand my pain", "points": {"sorrows": 3, "lourdes": 1}},
        {"text": "By asking for special graces and favors", "points": {"grace": 3, "guadalupe": 2}}
      ]
    },
    {
      "id": 3,
      "question": "What kind of help do you most often ask Mary for?",
      "answers": [
        {"text": "Physical healing for sickness", "points": {"lourdes": 3, "grace": 1}},
        {"text": "Help with family problems and peace", "points": {"fatima": 3, "sorrows": 2}},
        {"text": "Protection of my culture and identity", "points": {"guadalupe": 3, "grace": 1}},
        {"text": "Comfort during really hard times", "points": {"sorrows": 3, "lourdes": 2}},
        {"text": "Strength to pray more and be better", "points": {"rosary": 3, "fatima": 2}}
      ]
    },
    {
      "id": 4,
      "question": "How do you see Mary's role in your life?",
      "answers": [
        {"text": "As a powerful healer who performs miracles", "points": {"lourdes": 3, "grace": 2}},
        {"text": "As a mother who gives important warnings and advice", "points": {"fatima": 3, "rosary": 1}},
        {"text": "As someone who understands different cultures", "points": {"guadalupe": 3, "grace": 1}},
        {"text": "As a companion who shares in suffering", "points": {"sorrows": 3, "lourdes": 1}},
        {"text": "As the one who gives out all God's graces", "points": {"grace": 3, "rosary": 2}}
      ]
    },
    {
      "id": 5,
      "question": "What Mary story speaks to you most?",
      "answers": [
        {"text": "Mary appearing to a young girl who was poor and unknown", "points": {"lourdes": 3, "guadalupe": 2}},
        {"text": "Mary asking children to pray the Rosary for peace", "points": {"fatima": 3, "rosary": 2}},
        {"text": "Mary appearing as an indigenous woman to unite cultures", "points": {"guadalupe": 3, "grace": 1}},
        {"text": "Mary standing by the cross sharing Jesus's pain", "points": {"sorrows": 3, "lourdes": 1}},
        {"text": "Mary crushing evil and bringing victory", "points": {"rosary": 3, "fatima": 1}}
      ]
    },
    {
      "id": 6,
      "question": "How do you want to respond to Mary's call?",
      "answers": [
        {"text": "By bringing people to places of healing", "points": {"lourdes": 3, "grace": 1}},
        {"text": "By spreading devotion to the Rosary", "points": {"fatima": 3, "rosary": 3}},
        {"text": "By helping different cultures respect each other", "points": {"guadalupe": 3, "grace": 1}},
        {"text": "By comforting people who are suffering", "points": {"sorrows": 3, "lourdes": 2}},
        {"text": "By asking Mary for all my needs", "points": {"grace": 3, "rosary": 1}}
      ]
    },
    {
      "id": 7,
      "question": "What do you hope Mary will do in today's world?",
      "answers": [
        {"text": "Heal the sick and perform more miracles", "points": {"lourdes": 3, "grace": 2}},
        {"text": "Bring peace between countries and families", "points": {"fatima": 3, "rosary": 2}},
        {"text": "Help different races and cultures get along", "points": {"guadalupe": 3, "grace": 1}},
        {"text": "Comfort people who are depressed or hurting", "points": {"sorrows": 3, "lourdes": 1}},
        {"text": "Help people pray more and love God better", "points": {"rosary": 3, "fatima": 2}}
      ]
    },
    {
      "id": 8,
      "question": "How do you want to honor Mary?",
      "answers": [
        {"text": "By going on pilgrimages to her shrines", "points": {"lourdes": 3, "guadalupe": 2}},
        {"text": "By praying the Rosary every day", "points": {"fatima": 3, "rosary": 3}},
        {"text": "By respecting all cultures as God's children", "points": {"guadalupe": 3, "grace": 1}},
        {"text": "By offering my sufferings with hers", "points": {"sorrows": 3, "lourdes": 1}},
        {"text": "By asking for her intercession in everything", "points": {"grace": 3, "rosary": 1}}
      ]
    }
  ],
  "results": {
    "lourdes": {
      "saint_id": "saint_132",
      "name": "Our Lady of Lourdes",
      "series": "Mini Marians",
      "icon_asset": "assets/saints/mary_lourdes.png",
      "description": "Like Our Lady of Lourdes, you believe in Mary's incredible healing power! Mary appeared to St. Bernadette in France and created a spring of healing water that still brings miracles today. You're drawn to Mary as the powerful healer who cares for the sick and suffering. Your faith in Mary's healing brings hope to the world!",
      "fun_fact": "The spring at Lourdes has flowed continuously since Mary appeared to Bernadette, and millions of pilgrims come seeking healing every year!"
    },
    "fatima": {
      "saint_id": "saint_133", 
      "name": "Our Lady of Fatima",
      "series": "Mini Marians",
      "icon_asset": "assets/saints/mary_fatima.png",
      "description": "Like Our Lady of Fatima, you're passionate about peace and the power of the Rosary! Mary appeared to three children in Portugal with messages about prayer and penance for world peace. You understand that the Rosary can change the world and that Mary's warnings help us avoid disaster. Your devotion to the Rosary brings peace!",
      "fun_fact": "Mary appeared at Fatima with prophecies about world events and performed the Miracle of the Sun witnessed by 70,000 people!"
    },
    "guadalupe": {
      "saint_id": "saint_134",
      "name": "Our Lady of Guadalupe",
      "series": "Mini Marians", 
      "icon_asset": "assets/saints/mary_guadalupe.png",
      "description": "Like Our Lady of Guadalupe, you believe Mary loves all cultures and brings unity! Mary appeared to St. Juan Diego as an indigenous woman and left her miraculous image on his tilma. You see Mary as the mother who bridges different peoples and shows that God loves every culture. Your devotion unites all God's children!",
      "fun_fact": "The miraculous image of Our Lady of Guadalupe on Juan Diego's tilma has lasted over 500 years without any preservation and contains mysteries scientists still can't explain!"
    },
    "sorrows": {
      "saint_id": "saint_135",
      "name": "Our Lady of Sorrows", 
      "series": "Mini Marians",
      "icon_asset": "assets/saints/mary_sorrows.png",
      "description": "Like Our Lady of Sorrows, you understand that Mary shares in all our pain and suffering! This devotion honors Mary's seven sorrows, especially watching Jesus die on the cross. You know that Mary understands what it's like to hurt deeply and can comfort anyone who suffers. Your compassion reflects Mary's suffering heart!",
      "fun_fact": "The Seven Sorrows of Mary include the prophecy of Simeon, the flight into Egypt, losing Jesus in the temple, and watching Him die on the cross!"
    },
    "rosary": {
      "saint_id": "saint_136",
      "name": "Our Lady of the Rosary",
      "series": "Mini Marians",
      "icon_asset": "assets/saints/mary_rosary.png", 
      "description": "Like Our Lady of the Rosary, you believe in the incredible power of Rosary prayer! This title celebrates Mary's intercession that won the Battle of Lepanto through Rosary prayers. You know that the Rosary is Mary's favorite prayer and her weapon against evil. Your Rosary devotion protects the Church and brings victory!",
      "fun_fact": "The feast of Our Lady of the Rosary was established after Christians won the Battle of Lepanto through the power of Rosary prayers!"
    },
    "grace": {
      "saint_id": "saint_173",
      "name": "Our Lady of Grace", 
      "series": "Mini Marians",
      "icon_asset": "assets/saints/mary_grace.png",
      "description": "Like Our Lady of Grace, you believe Mary is the Mediatrix of All Graces who distributes God's favors! You understand that all graces come through Mary's intercession as Mother of God. You turn to Mary for every need because you know she has the power to obtain anything from God. Your trust in Mary's intercession opens heaven's treasures!",
      "fun_fact": "Catholic teaching says that all graces come through Mary's intercession because she is the Mother of God and our spiritual mother too!"
    }
  }
},
{
  "quiz_id": "faithful_families",
  "title": "Which Faithful Families Saint Are You?",
  "description": "Discover which holy family member from our Faithful Families series matches your approach to family life!",
  "series": "Faithful Families",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"joachim": 5, "louis": 5}},
        {"text": "Girl", "points": {"anne": 5, "zelie": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What's your role in your family?",
      "answers": [
        {"text": "I'm a parent or older sibling who takes care of others", "points": {"anne": 3, "joachim": 3, "zelie": 2, "louis": 2}},
        {"text": "I'm a child or younger sibling who looks up to others", "points": {"anne": 1, "joachim": 1, "zelie": 1, "louis": 1}},
        {"text": "I'm a grandparent or someone who loves family history", "points": {"anne": 3, "joachim": 3}},
        {"text": "I try to support everyone and keep peace", "points": {"louis": 3, "zelie": 2}},
        {"text": "I help my family grow closer to God", "points": {"zelie": 3, "anne": 2, "joachim": 2, "louis": 2}}
      ]
    },
    {
      "id": 3,
      "question": "How do you help your family pray together?",
      "answers": [
        {"text": "I make sure we pray before meals and bedtime", "points": {"anne": 3, "zelie": 3}},
        {"text": "I lead family rosary or Bible reading", "points": {"joachim": 3, "louis": 3}},
        {"text": "I share stories about saints and holy people", "points": {"anne": 3, "joachim": 2}},
        {"text": "I encourage everyone to go to Mass together", "points": {"louis": 3, "zelie": 2}},
        {"text": "I pray quietly for each family member", "points": {"zelie": 3, "anne": 2}}
      ]
    },
    {
      "id": 4,
      "question": "How do you handle difficult times in your family?",
      "answers": [
        {"text": "I trust that God has a plan for our family", "points": {"anne": 3, "joachim": 3}},
        {"text": "I work extra hard to provide and protect", "points": {"joachim": 3, "louis": 2}},
        {"text": "I keep the family together through prayer", "points": {"zelie": 3, "anne": 2}},
        {"text": "I try to find the positive and stay hopeful", "points": {"louis": 3, "zelie": 2}},
        {"text": "I lean on my faith and trust in God's goodness", "points": {"anne": 2, "joachim": 2, "zelie": 2, "louis": 2}}
      ]
    },
    {
      "id": 5,
      "question": "What's most important for your family's spiritual life?",
      "answers": [
        {"text": "Teaching children to love God from an early age", "points": {"anne": 3, "zelie": 3}},
        {"text": "Being a good example of faithfulness", "points": {"joachim": 3, "louis": 3}},
        {"text": "Creating traditions that bring the family closer to God", "points": {"zelie": 3, "anne": 2}},
        {"text": "Supporting each family member's individual calling", "points": {"louis": 3, "zelie": 2}},
        {"text": "Trusting God with your family's future", "points": {"anne": 3, "joachim": 3}}
      ]
    },
    {
      "id": 6,
      "question": "How do you support family members who want to serve God?",
      "answers": [
        {"text": "I encourage them even if it means sacrifice", "points": {"anne": 3, "joachim": 3}},
        {"text": "I pray for their vocation and trust God's will", "points": {"zelie": 3, "louis": 3}},
        {"text": "I give them practical support and encouragement", "points": {"louis": 3, "joachim": 2}},
        {"text": "I help them discern God's call through prayer", "points": {"zelie": 3, "anne": 2}},
        {"text": "I trust that God knows what's best for them", "points": {"anne": 2, "joachim": 2, "zelie": 2, "louis": 2}}
      ]
    },
    {
      "id": 7,
      "question": "What's your approach to raising holy children?",
      "answers": [
        {"text": "I focus on teaching them to trust God completely", "points": {"anne": 3, "joachim": 2}},
        {"text": "I show them how to work hard and pray hard", "points": {"louis": 3, "zelie": 2}},
        {"text": "I help them see God in everyday life", "points": {"zelie": 3, "anne": 2}},
        {"text": "I encourage their individual gifts and talents", "points": {"louis": 3, "zelie": 2}},
        {"text": "I prepare them for whatever God calls them to do", "points": {"anne": 3, "joachim": 3}}
      ]
    },
    {
      "id": 8,
      "question": "What legacy do you want to leave your family?",
      "answers": [
        {"text": "A foundation of deep faith that lasts generations", "points": {"anne": 3, "joachim": 3}},
        {"text": "Example of how to balance work and family with God", "points": {"louis": 3, "zelie": 2}},
        {"text": "Proof that ordinary families can become extraordinary", "points": {"zelie": 3, "louis": 3}},
        {"text": "Trust that God's plans are always better than ours", "points": {"anne": 3, "joachim": 2}},
        {"text": "Love that puts God first but includes everyone", "points": {"zelie": 2, "louis": 2, "anne": 2, "joachim": 2}}
      ]
    }
  ],
  "results": {
    "anne": {
      "saint_id": "saint_033",
      "name": "St. Anne",
      "series": "Faithful Families",
      "icon_asset": "assets/saints/saint_anne.png",
      "description": "Like St. Anne, you're the wise matriarch who teaches faith to future generations! You're the mother of the Virgin Mary and grandmother of Jesus - the ultimate holy family leader. Your patient guidance and deep faith create saints in your family line. Your motherly wisdom shapes the Church for centuries!",
      "fun_fact": "St. Anne was the mother of Mary and grandmother of Jesus - making her the ultimate holy grandmother in Christian history!"
    },
    "joachim": {
      "saint_id": "saint_034", 
      "name": "St. Joachim",
      "series": "Faithful Families",
      "icon_asset": "assets/saints/saint_joachim.png",
      "description": "Like St. Joachim, you're the faithful patriarch who provides spiritual leadership for your family! You're the father of the Virgin Mary and grandfather of Jesus. Your quiet strength and dedication to God's will creates the foundation for the Holy Family. Your fatherly example guides families to holiness!",
      "fun_fact": "St. Joachim was the father of Mary and grandfather of Jesus - the holy patriarch who helped raise the Mother of God!"
    },
    "zelie": {
      "saint_id": "saint_078",
      "name": "St. Zélie Martin", 
      "series": "Faithful Families",
      "icon_asset": "assets/saints/saint_zelie.png",
      "description": "Like Zélie, you're an amazing mother who balances work and family while raising saints! You were the mother of St. Thérèse and were canonized with your husband Louis. You show that ordinary families can become extraordinary through love and faith. Your family life proves that holiness happens at home!",
      "fun_fact": "St. Zélie and her husband Louis were the first married couple to be canonized together in modern times - both parents of St. Thérèse!"
    },
    "louis": {
      "saint_id": "saint_125",
      "name": "St. Louis Martin",
      "series": "Faithful Families", 
      "icon_asset": "assets/saints/saint_louis.png",
      "description": "Like Louis, you're a devoted father who supports your family through honest work and deep prayer! You were the father of St. Thérèse and were canonized with your wife Zélie. You show that working fathers can be saints too by putting family and faith first. Your fatherly love creates an atmosphere where saints can grow!",
      "fun_fact": "St. Louis Martin was a skilled watchmaker who supported his wife's lace business and helped raise five daughters who all became nuns!"
    }
  }
},
{
  "quiz_id": "cherub_chibis",
  "title": "Which Cherub Chibis Saint Are You?",
  "description": "Discover which mighty archangel from our Cherub Chibis series matches your angelic mission!",
  "series": "Cherub Chibis",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "What kind of mission would you most want as an angel?",
      "answers": [
        {"text": "Fighting evil and protecting people from danger", "points": {"michael": 3, "raphael": 1}},
        {"text": "Delivering important messages from God", "points": {"gabriel": 3, "michael": 1}},
        {"text": "Helping people heal and guiding them safely", "points": {"raphael": 3, "gabriel": 1}},
        {"text": "Leading God's army against Satan", "points": {"michael": 3}},
        {"text": "Announcing God's amazing plans to people", "points": {"gabriel": 3, "raphael": 1}}
      ]
    },
    {
      "id": 2,
      "question": "How would you want to help people who are scared?",
      "answers": [
        {"text": "By fighting off whatever is threatening them", "points": {"michael": 3, "raphael": 1}},
        {"text": "By bringing them a message of hope from God", "points": {"gabriel": 3, "michael": 1}},
        {"text": "By healing their wounds and guiding them to safety", "points": {"raphael": 3, "gabriel": 1}},
        {"text": "By standing guard and protecting them", "points": {"michael": 3}},
        {"text": "By telling them 'Do not be afraid!'", "points": {"gabriel": 3, "raphael": 1}}
      ]
    },
    {
      "id": 3,
      "question": "What's your greatest strength as a heavenly warrior?",
      "answers": [
        {"text": "My courage in fighting against evil", "points": {"michael": 3}},
        {"text": "My ability to communicate clearly", "points": {"gabriel": 3, "raphael": 1}},
        {"text": "My healing power and wisdom", "points": {"raphael": 3, "gabriel": 1}},
        {"text": "My leadership in spiritual battles", "points": {"michael": 3, "gabriel": 1}},
        {"text": "My gentle guidance and care", "points": {"raphael": 3, "michael": 1}}
      ]
    },
    {
      "id": 4,
      "question": "How do you serve God best?",
      "answers": [
        {"text": "By defending His people from all harm", "points": {"michael": 3, "raphael": 1}},
        {"text": "By delivering His most important announcements", "points": {"gabriel": 3}},
        {"text": "By bringing His healing to those who need it", "points": {"raphael": 3, "gabriel": 1}},
        {"text": "By leading the fight against Satan and demons", "points": {"michael": 3}},
        {"text": "By helping people understand God's will", "points": {"gabriel": 3, "raphael": 2}}
      ]
    },
    {
      "id": 5,
      "question": "What kind of people do you feel most called to help?",
      "answers": [
        {"text": "Soldiers, police, and others who fight evil", "points": {"michael": 3}},
        {"text": "People who need to hear important news from God", "points": {"gabriel": 3, "michael": 1}},
        {"text": "Travelers, sick people, and those who need healing", "points": {"raphael": 3}},
        {"text": "Anyone who is being attacked by evil forces", "points": {"michael": 3, "raphael": 1}},
        {"text": "People who are confused and need guidance", "points": {"gabriel": 2, "raphael": 2}}
      ]
    },
    {
      "id": 6,
      "question": "How do you want people to pray to you?",
      "answers": [
        {"text": "For protection from evil and spiritual warfare", "points": {"michael": 3}},
        {"text": "For help understanding God's messages", "points": {"gabriel": 3, "raphael": 1}},
        {"text": "For healing and safe travels", "points": {"raphael": 3}},
        {"text": "For courage in fighting temptation", "points": {"michael": 3, "gabriel": 1}},
        {"text": "For clear communication and wisdom", "points": {"gabriel": 3, "raphael": 2}}
      ]
    },
    {
      "id": 7,
      "question": "What's your favorite way to show God's power?",
      "answers": [
        {"text": "By defeating demons and evil spirits", "points": {"michael": 3}},
        {"text": "By delivering miraculous announcements", "points": {"gabriel": 3}},
        {"text": "By performing amazing healings", "points": {"raphael": 3}},
        {"text": "By protecting people from danger", "points": {"michael": 3, "raphael": 1}},
        {"text": "By helping people understand God's plan", "points": {"gabriel": 3, "raphael": 1}}
      ]
    },
    {
      "id": 8,
      "question": "What's your battle cry or motto?",
      "answers": [
        {"text": "'Who is like God?' - ready to fight for God's honor", "points": {"michael": 3}},
        {"text": "'Fear not!' - bringing God's messages of hope", "points": {"gabriel": 3}},
        {"text": "'God heals!' - bringing restoration and wellness", "points": {"raphael": 3}},
        {"text": "'Stand firm!' - encouraging others in spiritual battle", "points": {"michael": 3, "gabriel": 1}},
        {"text": "'God is with you!' - bringing comfort and guidance", "points": {"gabriel": 2, "raphael": 2}}
      ]
    }
  ],
  "results": {
    "michael": {
      "saint_id": "saint_011",
      "name": "St. Michael the Archangel",
      "series": "Cherub Chibis",
      "icon_asset": "assets/saints/saint_michael.png",
      "description": "Like St. Michael, you're the ultimate warrior angel who leads God's army against evil! Your name means 'Who is like God?' and you're mentioned in the Book of Revelation as the leader of the heavenly army. You're the protector of soldiers, police, and all who fight against evil. Your courage in spiritual warfare defends the Church!",
      "fun_fact": "St. Michael's name means 'Who is like God?' and he's the archangel who cast Satan out of heaven in the great spiritual battle!"
    },
    "gabriel": {
      "saint_id": "saint_035",
      "name": "St. Gabriel the Archangel", 
      "series": "Cherub Chibis",
      "icon_asset": "assets/saints/saint_gabriel.png",
      "description": "Like St. Gabriel, you're God's special messenger who delivers the most important announcements! Your name means 'God is my strength' and you announced to Mary that she would be Jesus's mother. You're the patron of messengers and communication. Your clear messages from heaven change the course of history!",
      "fun_fact": "St. Gabriel announced to Mary that she would be the Mother of Jesus - the most important message in human history!"
    },
    "raphael": {
      "saint_id": "saint_036",
      "name": "St. Raphael the Archangel",
      "series": "Cherub Chibis", 
      "icon_asset": "assets/saints/saint_raphael.png",
      "description": "Like St. Raphael, you're the healing angel who guides travelers and brings God's restoration! Your name means 'God heals' and you helped guide Tobias in the Bible. You're the patron of travelers and healing, bringing both physical and spiritual wellness. Your gentle guidance leads people safely to their destination!",
      "fun_fact": "St. Raphael's name means 'God heals' and he guided Tobias on his journey while disguised as a human companion!"
    }
  }
},
{
  "quiz_id": "saint_superpowers",
  "title": "Which Saint Has Your Superpower?",
  "description": "Discover which saint's amazing 'superpower' matches your special gifts and calling!",
  "series": "Cross-Series Special",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"anthony_lost": 5, "blaise_healing": 5, "padre_pio_prayer": 5, "francis_nature": 5, "joseph_protection": 5, "michael_warrior": 5, "patrick_culture": 5, "aquinas_wisdom": 5}},
        {"text": "Girl", "points": {"rita_impossible": 5, "bernadette_visions": 5, "joan_courage": 5, "therese_simplicity": 5, "margaret_mary_love": 5, "helena_discovery": 5, "gianna_sacrifice": 5, "cecilia_music": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What kind of 'superpower' would you most want?",
      "answers": [
        {"text": "The ability to find anything that's lost", "points": {"anthony_lost": 3, "helena_discovery": 2}},
        {"text": "The power to heal people instantly", "points": {"blaise_healing": 3, "bernadette_visions": 2}},
        {"text": "Super courage that fears nothing", "points": {"joan_courage": 3, "michael_warrior": 2}},
        {"text": "The ability to make impossible things happen", "points": {"rita_impossible": 3, "padre_pio_prayer": 2}},
        {"text": "Mind-reading powers to understand everything", "points": {"aquinas_wisdom": 3, "therese_simplicity": 2}}
      ]
    },
    {
      "id": 3,
      "question": "How would you use your superpower to help people?",
      "answers": [
        {"text": "Help them find lost hope, faith, or direction", "points": {"anthony_lost": 3, "therese_simplicity": 2}},
        {"text": "Heal their physical and emotional wounds", "points": {"blaise_healing": 3, "margaret_mary_love": 2}},
        {"text": "Protect them from danger and evil", "points": {"michael_warrior": 3, "joseph_protection": 2}},
        {"text": "Solve their absolutely impossible problems", "points": {"rita_impossible": 3, "padre_pio_prayer": 2}},
        {"text": "Help them connect with nature and creation", "points": {"francis_nature": 3, "patrick_culture": 1}}
      ]
    },
    {
      "id": 4,
      "question": "What's your superhero origin story?",
      "answers": [
        {"text": "I discovered my gift through simple, daily prayer", "points": {"therese_simplicity": 3, "anthony_lost": 2}},
        {"text": "I received special visions or messages from heaven", "points": {"bernadette_visions": 3, "margaret_mary_love": 2}},
        {"text": "I was chosen by God for a dangerous mission", "points": {"joan_courage": 3, "michael_warrior": 2}},
        {"text": "I learned to channel God's power through study", "points": {"aquinas_wisdom": 3, "blaise_healing": 1}},
        {"text": "I developed my gift through years of patient practice", "points": {"padre_pio_prayer": 3, "joseph_protection": 2}}
      ]
    },
    {
      "id": 5,
      "question": "What's your superhero weakness or challenge?",
      "answers": [
        {"text": "People don't always believe in my abilities", "points": {"bernadette_visions": 3, "joan_courage": 2}},
        {"text": "My power works better with simple faith than complex problems", "points": {"therese_simplicity": 3, "anthony_lost": 2}},
        {"text": "I sometimes feel overwhelmed by how much people need help", "points": {"rita_impossible": 3, "blaise_healing": 2}},
        {"text": "My gifts are often misunderstood by others", "points": {"aquinas_wisdom": 2, "francis_nature": 2, "cecilia_music": 2}},
        {"text": "Evil forces try extra hard to stop me", "points": {"michael_warrior": 3, "padre_pio_prayer": 2}}
      ]
    },
    {
      "id": 6,
      "question": "What's your superhero team role?",
      "answers": [
        {"text": "The detective who finds clues and missing pieces", "points": {"anthony_lost": 3, "helena_discovery": 3}},
        {"text": "The healer who patches everyone up", "points": {"blaise_healing": 3, "margaret_mary_love": 2}},
        {"text": "The fearless leader who charges into battle", "points": {"joan_courage": 3, "michael_warrior": 3}},
        {"text": "The strategist who figures out the master plan", "points": {"aquinas_wisdom": 3, "joseph_protection": 2}},
        {"text": "The heart of the team who keeps everyone united", "points": {"therese_simplicity": 3, "francis_nature": 2}}
      ]
    },
    {
      "id": 7,
      "question": "What's your secret superhero identity like?",
      "answers": [
        {"text": "I'm just an ordinary person who trusts God completely", "points": {"therese_simplicity": 3, "bernadette_visions": 2}},
        {"text": "I have a normal job but help people on the side", "points": {"joseph_protection": 3, "blaise_healing": 2}},
        {"text": "I'm known for being really smart or talented", "points": {"aquinas_wisdom": 3, "cecilia_music": 2}},
        {"text": "I seem quiet but I'm actually incredibly powerful", "points": {"rita_impossible": 3, "padre_pio_prayer": 2}},
        {"text": "I'm famous for being brave and speaking up", "points": {"joan_courage": 3, "patrick_culture": 2}}
      ]
    },
    {
      "id": 8,
      "question": "How do you want people to call on your superpower?",
      "answers": [
        {"text": "When they've lost something important and can't find it", "points": {"anthony_lost": 3, "helena_discovery": 1}},
        {"text": "When they're sick or hurt and need healing", "points": {"blaise_healing": 3, "bernadette_visions": 2}},
        {"text": "When they face impossible situations", "points": {"rita_impossible": 3, "padre_pio_prayer": 2}},
        {"text": "When they need courage for something scary", "points": {"joan_courage": 3, "michael_warrior": 2}},
        {"text": "When they want to understand God better", "points": {"aquinas_wisdom": 3, "therese_simplicity": 2}}
      ]
    }
  ],
  "results": {
    "anthony_lost": {
      "saint_id": "saint_016",
      "name": "St. Anthony of Padua",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_anthony.png",
      "superpower": "Lost & Found Detection",
      "description": "Your superpower is finding lost things! Like St. Anthony, you have an amazing ability to locate what's missing - whether it's lost objects, lost hope, or lost faith. People pray 'Tony, Tony, turn around, something's lost and must be found!' Your gift helps people rediscover what they thought was gone forever!",
      "fun_fact": "St. Anthony's superpower of finding lost things is so famous that people still pray to him whenever they lose something!"
    },
    "blaise_healing": {
      "saint_id": "saint_004",
      "name": "St. Blaise of Sebaste",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_blaise.png",
      "superpower": "Divine Healing Touch",
      "description": "Your superpower is healing! Like St. Blaise, you have the ability to cure illnesses and injuries through God's power. You're especially good with throat problems and animal care. Catholics still get their throats blessed on your feast day. Your healing touch brings God's restoration to a hurting world!",
      "fun_fact": "St. Blaise's healing superpower was so strong that wild animals would come to him for healing when he lived in a cave!"
    },
    "rita_impossible": {
      "saint_id": "saint_152",
      "name": "St. Rita of Cascia",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_rita.png",
      "superpower": "Impossible Mission Solver",
      "description": "Your superpower is making impossible things possible! Like St. Rita, you specialize in hopeless cases and situations that seem impossible to fix. You're the saint people turn to when doctors say there's no hope or when problems seem unsolvable. Your prayer power makes miracles happen!",
      "fun_fact": "St. Rita is called the 'Saint of Impossible Cases' because her intercession helps with problems that seem totally hopeless!"
    },
    "bernadette_visions": {
      "saint_id": "saint_019",
      "name": "St. Bernadette",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_bernadette.png",
      "superpower": "Heavenly Vision Reception",
      "description": "Your superpower is receiving visions and messages from heaven! Like St. Bernadette, you can see and hear things from the spiritual realm that others can't. Mary appeared to you at Lourdes and created a healing spring. Your vision gift creates holy places that help millions of people!",
      "fun_fact": "St. Bernadette's vision superpower brought us the healing waters of Lourdes where millions of pilgrims still come for miracles!"
    },
    "joan_courage": {
      "saint_id": "saint_003",
      "name": "St. Joan of Arc",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_joan.png",
      "superpower": "Unshakeable Divine Courage",
      "description": "Your superpower is supernatural courage! Like St. Joan, you fear absolutely nothing when you're doing God's will. You led armies at 17 and never backed down from any challenge. Your courage comes directly from heaven and inspires others to be brave for God too!",
      "fun_fact": "St. Joan's courage superpower was so strong that she convinced the king of France she was sent by God and led his armies to victory!"
    },
    "padre_pio_prayer": {
      "saint_id": "saint_006",
      "name": "St. Padre Pio",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_padrepio.png",
      "superpower": "Miraculous Prayer Power",
      "description": "Your superpower is incredibly powerful prayer! Like Padre Pio, your prayers can perform amazing miracles and you have mystical gifts like reading hearts. You bore the stigmata for 50 years and could reportedly bilocate. Your prayer power channels divine grace directly from heaven!",
      "fun_fact": "Padre Pio's prayer superpower was so strong that he could reportedly be in two places at once (bilocation) while praying!"
    },
    "therese_simplicity": {
      "saint_id": "saint_001",
      "name": "St. Therese of Lisieux",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_therese.png",
      "superpower": "Little Way Transformation",
      "description": "Your superpower is making small things incredibly powerful! Like St. Thérèse, you prove that 'little ways' of love can change the world. You became a Doctor of the Church despite dying young at 24. Your simple approach to holiness makes sainthood accessible to everyone!",
      "fun_fact": "St. Thérèse's 'Little Way' superpower made her a Doctor of the Church even though she never wrote a theology book - just loved God simply!"
    },
    "francis_nature": {
      "saint_id": "saint_002",
      "name": "St. Francis of Assisi", 
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_francis.png",
      "superpower": "Creation Communication",
      "description": "Your superpower is communicating with all creation! Like St. Francis, you can talk to birds, tame wolves, and see God in every creature. You received the stigmata and founded the Franciscans. Your nature superpower shows everyone that all creation is connected in God's love!",
      "fun_fact": "St. Francis's nature superpower was so strong that birds would gather to listen when he preached to them!"
    },
    "joseph_protection": {
      "saint_id": "saint_007",
      "name": "St. Joseph",
      "series": "Pocket Patrons",
      "icon_asset": "assets/saints/saint_joseph.png",
      "superpower": "Ultimate Protection Shield",
      "description": "Your superpower is protecting families and workers! Like St. Joseph, you're the ultimate guardian who keeps people safe from harm. You protected the Holy Family and are honored as patron of fathers and workers. Your protective power creates safe spaces for families to grow and thrive!",
      "fun_fact": "St. Joseph's protection superpower was so strong that he saved Jesus and Mary from King Herod by following God's warning in a dream!"
    },
    "michael_warrior": {
      "saint_id": "saint_011",
      "name": "St. Michael the Archangel",
      "series": "Cherub Chibis",
      "icon_asset": "assets/saints/saint_michael.png",
      "superpower": "Spiritual Warfare Mastery",
      "description": "Your superpower is leading the battle against evil! Like St. Michael, you're the ultimate spiritual warrior who fights demons and protects God's people. Your name means 'Who is like God?' and you cast Satan out of heaven. Your warrior power defends the Church from all spiritual attacks!",
      "fun_fact": "St. Michael's warrior superpower is so legendary that he's depicted in art defeating Satan and leading all the angels in the ultimate battle between good and evil!"
    },
    "margaret_mary_love": {
      "saint_id": "saint_056",
      "name": "St. Margaret Mary Alacoque",
      "series": "Heavenly Helpers", 
      "icon_asset": "assets/saints/saint_margaretmary.png",
      "superpower": "Sacred Heart Love Radiation",
      "description": "Your superpower is radiating Jesus's infinite love! Like St. Margaret Mary, you received visions of Jesus's Sacred Heart and help people understand how much He loves them. Your love superpower melts even the hardest hearts and brings people back to God's embrace!",
      "fun_fact": "St. Margaret Mary's love superpower came from visions of Jesus's Sacred Heart, and she spread devotion to His burning love for humanity!"
    },
    "helena_discovery": {
      "saint_id": "saint_086",
      "name": "St. Helena",
      "series": "Regal Royals",
      "icon_asset": "assets/saints/saint_helena.png",
      "superpower": "Holy Archaeology Vision",
      "description": "Your superpower is discovering lost holy treasures! Like St. Helena, you have the ability to find important religious artifacts and places. You found the True Cross in Jerusalem and are the patron of archaeologists. Your discovery power uncovers God's presence in history!",
      "fun_fact": "St. Helena's discovery superpower led her to find the True Cross of Jesus buried in Jerusalem - one of Christianity's greatest archaeological finds!"
    },
    "patrick_culture": {
      "saint_id": "saint_030",
      "name": "St. Patrick",
      "series": "Culture Carriers",
      "icon_asset": "assets/saints/saint_patrick.png",
      "superpower": "Cultural Transformation Beam",
      "description": "Your superpower is transforming entire cultures for God! Like St. Patrick, you can take pagan traditions and transform them into beautiful Christian celebrations. You used the shamrock to explain the Trinity and made Ireland famous for faith. Your cultural power bridges differences and unites people!",
      "fun_fact": "St. Patrick's cultural superpower was so strong that he transformed all of Ireland and used their own shamrock symbol to teach about the Trinity!"
    },
    "aquinas_wisdom": {
      "saint_id": "saint_018",
      "name": "St. Thomas Aquinas",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_aquinas.png",
      "superpower": "Ultimate Wisdom Processing",
      "description": "Your superpower is understanding everything perfectly! Like St. Thomas Aquinas, you can use logic and reason to explain the deepest mysteries of faith. You're called the 'Angelic Doctor' and wrote the Summa Theologica. Your wisdom superpower makes complicated truths simple to understand!",
      "fun_fact": "St. Thomas Aquinas's wisdom superpower was so vast that his massive 'Summa Theologica' is still studied 800 years later!"
    },
    "gianna_sacrifice": {
      "saint_id": "saint_154",
      "name": "St. Gianna Molla",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_gianna.png",
      "superpower": "Heroic Love Sacrifice",
      "description": "Your superpower is sacrificial love that saves others! Like St. Gianna, you're willing to give up your life to protect those you love. You chose to save your unborn child's life over your own as a doctor and mother. Your sacrifice superpower shows the ultimate power of love!",
      "fun_fact": "St. Gianna's sacrifice superpower inspired the whole world when she chose to save her baby's life instead of her own - the ultimate act of motherly love!"
    },
    "cecilia_music": {
      "saint_id": "saint_005",
      "name": "St. Cecilia",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_cecilia.png",
      "superpower": "Divine Music Harmony",
      "description": "Your superpower is creating music that lifts souls to heaven! Like St. Cecilia, you can sing and play music that touches people's hearts and brings them closer to God. You sang to God even while facing martyrdom. Your musical superpower turns everyday moments into worship!",
      "fun_fact": "St. Cecilia's music superpower was so beautiful that she's the patron saint of musicians and is always shown with musical instruments!"
    }
  }
},
{
  "quiz_id": "saint_bestfriend",
  "title": "Which Saint Would Be Your Best Friend?",
  "description": "Discover which saint would be your perfect best friend based on personality and friendship style!",
  "series": "Cross-Series Special",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"francis": 5, "john_bosco": 5, "philip_neri": 5, "andrew": 5, "john_evangelist": 5, "carlo": 5, "dominic_savio": 5, "pier_giorgio": 5}},
        {"text": "Girl", "points": {"therese": 5, "gianna": 5, "maria": 5, "bernadette": 5, "joan": 5, "kateri": 5, "margaret_mary": 5, "clare": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What kind of friend are you?",
      "answers": [
        {"text": "The loyal friend who's always there for you", "points": {"john_evangelist": 3, "andrew": 3, "maria": 2}},
        {"text": "The fun friend who makes everything an adventure", "points": {"francis": 3, "john_bosco": 3, "philip_neri": 2}},
        {"text": "The encouraging friend who believes in your dreams", "points": {"andrew": 3, "pier_giorgio": 2, "margaret_mary": 2}},
        {"text": "The wise friend who gives great advice", "points": {"bernadette": 2, "therese": 2, "clare": 2}},
        {"text": "The tech-savvy friend who shares cool discoveries", "points": {"carlo": 3, "pier_giorgio": 2}}
      ]
    },
    {
      "id": 3,
      "question": "What would you and your saint best friend do for fun?",
      "answers": [
        {"text": "Go on outdoor adventures and explore nature", "points": {"francis": 3, "kateri": 3, "pier_giorgio": 2}},
        {"text": "Play games, do magic tricks, and laugh together", "points": {"john_bosco": 3, "philip_neri": 3, "dominic_savio": 1}},
        {"text": "Have deep conversations about God and life", "points": {"john_evangelist": 3, "therese": 2, "margaret_mary": 2}},
        {"text": "Help other kids and do service projects", "points": {"maria": 2, "clare": 2, "gianna": 2}},
        {"text": "Create websites or learn about technology", "points": {"carlo": 3, "pier_giorgio": 1}}
      ]
    },
    {
      "id": 4,
      "question": "How would your saint friend help you when you're sad?",
      "answers": [
        {"text": "By making me laugh and reminding me life is good", "points": {"philip_neri": 3, "john_bosco": 2, "francis": 2}},
        {"text": "By listening carefully and giving wise advice", "points": {"therese": 3, "bernadette": 2, "margaret_mary": 2}},
        {"text": "By staying close and showing loyal friendship", "points": {"john_evangelist": 3, "andrew": 2, "maria": 2}},
        {"text": "By praying with me and helping me trust God", "points": {"bernadette": 3, "kateri": 2, "clare": 2}},
        {"text": "By planning fun activities to cheer me up", "points": {"carlo": 2, "pier_giorgio": 2, "dominic_savio": 2}}
      ]
    },
    {
      "id": 5,
      "question": "What would you learn from your saint best friend?",
      "answers": [
        {"text": "How to find God in all of creation", "points": {"francis": 3, "kateri": 2}},
        {"text": "How to make learning and growing fun", "points": {"john_bosco": 3, "dominic_savio": 2, "carlo": 1}},
        {"text": "How to love God with a simple, trusting heart", "points": {"therese": 3, "bernadette": 2, "maria": 2}},
        {"text": "How to be brave and stand up for what's right", "points": {"joan": 3, "maria": 2, "clare": 1}},
        {"text": "How to bring people together and make peace", "points": {"andrew": 3, "margaret_mary": 2, "gianna": 1}}
      ]
    },
    {
      "id": 6,
      "question": "How do you and your saint friend like to pray together?",
      "answers": [
        {"text": "Outside in nature, feeling close to God's creation", "points": {"francis": 3, "kateri": 3, "pier_giorgio": 1}},
        {"text": "Simply and from the heart, like talking to a friend", "points": {"therese": 3, "bernadette": 2, "dominic_savio": 2}},
        {"text": "At Mass and in front of the Blessed Sacrament", "points": {"carlo": 3, "john_evangelist": 2, "margaret_mary": 2}},
        {"text": "While doing fun activities and daily life", "points": {"john_bosco": 3, "philip_neri": 2, "andrew": 1}},
        {"text": "By asking for courage to do the right thing", "points": {"joan": 3, "maria": 2, "clare": 2}}
      ]
    },
    {
      "id": 7,
      "question": "What kind of adventures would you have with your saint friend?",
      "answers": [
        {"text": "Helping animals and protecting the environment", "points": {"francis": 3, "kateri": 2}},
        {"text": "Building schools or helping other kids learn", "points": {"john_bosco": 3, "clare": 2, "gianna": 1}},
        {"text": "Going on missions to help people in need", "points": {"andrew": 2, "pier_giorgio": 2, "margaret_mary": 1}},
        {"text": "Standing up to bullies and protecting the weak", "points": {"joan": 3, "maria": 3, "dominic_savio": 1}},
        {"text": "Creating cool projects to share faith with others", "points": {"carlo": 3, "philip_neri": 1}}
      ]
    },
    {
      "id": 8,
      "question": "How would your friendship with your saint make you a better person?",
      "answers": [
        {"text": "I'd learn to see God's goodness in everything", "points": {"francis": 3, "therese": 2, "kateri": 1}},
        {"text": "I'd become more joyful and optimistic", "points": {"philip_neri": 3, "john_bosco": 2, "pier_giorgio": 2}},
        {"text": "I'd grow in love and loyalty to others", "points": {"john_evangelist": 3, "andrew": 2, "margaret_mary": 2}},
        {"text": "I'd become braver about standing up for what's right", "points": {"joan": 3, "maria": 2, "carlo": 1}},
        {"text": "I'd learn to trust God's plan even when it's hard", "points": {"bernadette": 3, "therese": 2, "gianna": 2}}
      ]
    }
  ],
  "results": {
    "francis": {
      "saint_id": "saint_002",
      "name": "St. Francis of Assisi",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_francis.png",
      "friendship_style": "The Nature Adventure Buddy",
      "description": "St. Francis would be your perfect nature-loving best friend! You'd spend time outdoors, talk to birds together, and see God in every sunset and flower. Francis would teach you that all creation is connected and that God speaks through nature. Your friendship would be filled with joy, simplicity, and wonder at God's beautiful world!",
      "fun_fact": "As your best friend, Francis would probably convince you to adopt every stray animal you meet - and somehow make it work!"
    },
    "john_bosco": {
      "saint_id": "saint_048",
      "name": "St. John Bosco",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_bosco.png",
      "friendship_style": "The Fun Teacher Friend",
      "description": "St. John Bosco would be your most fun best friend who makes learning awesome! He'd teach you magic tricks, play games with you, and make every lesson an adventure. Don Bosco would help you discover your talents while keeping everything light and joyful. Your friendship would prove that holiness and fun go perfectly together!",
      "fun_fact": "As your best friend, John Bosco would amaze you with acrobatics and magic tricks, then use them to teach you about God!"
    },
    "therese": {
      "saint_id": "saint_001",
      "name": "St. Therese of Lisieux",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_therese.png",
      "friendship_style": "The Simple Heart Friend",
      "description": "St. Thérèse would be your sweetest, most understanding best friend! She'd listen to all your worries and remind you that God loves you just as you are. Thérèse would teach you her 'Little Way' of doing small things with great love. Your friendship would be built on trust, simplicity, and the knowledge that you're both God's beloved children!",
      "fun_fact": "As your best friend, Thérèse would probably leave you little notes and flowers as surprises, just to remind you how much God loves you!"
    },
    "philip_neri": {
      "saint_id": "saint_155",
      "name": "St. Philip Neri",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_philipneri.png",
      "friendship_style": "The Laughing Saint Friend",
      "description": "St. Philip Neri would be your most hilarious best friend who proves that saints love to laugh! He'd pull harmless pranks, tell funny stories, and help you see the joy in everything. Philip would teach you that God wants us to be happy and that laughter is a form of prayer. Your friendship would be full of giggles and good times!",
      "fun_fact": "As your best friend, Philip might show up to school with half his beard shaved off just to make you laugh and practice humility!"
    },
    "andrew": {
      "saint_id": "saint_026",
      "name": "St. Andrew",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_andrew.png",
      "friendship_style": "The Ultimate Wing-Man Friend",
      "description": "St. Andrew would be your most loyal best friend who's always introducing you to cool people! He's the friend who brought his brother Peter to Jesus and would help you make new friends too. Andrew would be supportive, encouraging, and always believing in your potential. Your friendship would help both of you grow in amazing ways!",
      "fun_fact": "As your best friend, Andrew would be the one who says 'You HAVE to meet this person!' and introduces you to all your other friends!"
    },
    "john_evangelist": {
      "saint_id": "saint_087",
      "name": "St. John the Evangelist",
      "series": "Sacred Circle",
      "icon_asset": "assets/saints/saint_evangelist.png",
      "friendship_style": "The Beloved Bestie",
      "description": "St. John would be your deepest, most loyal best friend ever! Like how he was Jesus's 'beloved disciple,' you'd have that special friendship where you understand each other perfectly. John would listen to all your thoughts and feelings and help you grow in love. Your friendship would be based on deep affection and understanding!",
      "fun_fact": "As your best friend, John would be the one you could tell absolutely anything to, and he'd always understand and support you!"
    },
    "carlo": {
      "saint_id": "saint_101",
      "name": "Bl. Carlo Acutis",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_carlo.png",
      "friendship_style": "The Tech-Savvy Saint Friend",
      "description": "Bl. Carlo would be your coolest tech-savvy best friend who uses computers and games to grow closer to God! You'd build websites together, play video games, and create awesome projects to share your faith. Carlo would show you how to use technology to bring people to Jesus. Your friendship would be totally modern but deeply holy!",
      "fun_fact": "As your best friend, Carlo would help you create the most amazing school projects using technology and always give God the credit!"
    },
    "gianna": {
      "saint_id": "saint_154",
      "name": "St. Gianna Molla",
      "series": "Virtue Vignettes",
      "icon_asset": "assets/saints/saint_gianna.png",
      "friendship_style": "The Caring Big Sister Friend",
      "description": "St. Gianna would be your most caring, protective best friend! As a doctor and mother, she'd always look out for your health and happiness. Gianna would teach you about sacrificial love and putting others first. Your friendship would be built on genuine care and the desire to help each other become the best versions of yourselves!",
      "fun_fact": "As your best friend, Gianna would probably always have band-aids ready and would take care of you whenever you're hurt or sad!"
    },
    "maria": {
      "saint_id": "saint_049",
      "name": "St. Maria Goretti",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_goretti.png",
      "friendship_style": "The Forgiving Heart Friend",
      "description": "St. Maria would be your most forgiving and pure-hearted best friend! She'd help you learn to forgive others and see the good in everyone. Maria would stand up for what's right and help you stay strong in difficult situations. Your friendship would be built on purity, forgiveness, and incredible kindness!",
      "fun_fact": "As your best friend, Maria would never hold grudges and would always help you forgive others, even when it's really hard!"
    },
    "bernadette": {
      "saint_id": "saint_019",
      "name": "St. Bernadette",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_bernadette.png",
      "friendship_style": "The Humble Visionary Friend",
      "description": "St. Bernadette would be your most humble and wise best friend! She'd help you stay grounded despite amazing experiences and teach you to trust God completely. Bernadette would share deep spiritual insights while staying simple and down-to-earth. Your friendship would help you see God in ordinary moments!",
      "fun_fact": "As your best friend, Bernadette would help you recognize when God is trying to tell you something important, even in small ways!"
    },
    "joan": {
      "saint_id": "saint_003",
      "name": "St. Joan of Arc",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_joan.png",
      "friendship_style": "The Fearless Leader Friend",
      "description": "St. Joan would be your most courageous best friend who helps you be brave! She'd stand up to bullies, encourage you to follow your dreams, and never let you give up. Joan would teach you that God can use anyone, even teenagers, to do amazing things. Your friendship would give you courage to face any challenge!",
      "fun_fact": "As your best friend, Joan would be the one who says 'Come on, we can do this!' and gives you courage to try new things!"
    },
    "kateri": {
      "saint_id": "saint_010",
      "name": "St. Kateri Tekakwitha",
      "series": "Super Sancti",
      "icon_asset": "assets/saints/saint_kateri.png",
      "friendship_style": "The Nature Mystic Friend",
      "description": "St. Kateri would be your most spiritually deep best friend who finds God in nature! You'd pray together outdoors, learn about different cultures, and develop a beautiful prayer life. Kateri would help you appreciate your heritage while growing closer to God. Your friendship would bridge different worlds with grace!",
      "fun_fact": "As your best friend, Kateri would teach you to pray while hiking and help you see God's presence in every tree and stream!"
    },
    "margaret_mary": {
      "saint_id": "saint_056",
      "name": "St. Margaret Mary Alacoque",
      "series": "Heavenly Helpers",
      "icon_asset": "assets/saints/saint_margaretmary.png",
      "friendship_style": "The Heart-Centered Friend",
      "description": "St. Margaret Mary would be your most loving, heart-centered best friend! She'd help you understand how much Jesus loves you and teach you to love others deeply. Margaret Mary would encourage your spiritual experiences and help you share God's love with everyone. Your friendship would be all about spreading love!",
      "fun_fact": "As your best friend, Margaret Mary would always remind you how much Jesus loves you personally and help you feel His presence!"
    },
    "clare": {
      "saint_id": "saint_022",
      "name": "St. Clare of Assisi",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_clare.png",
      "friendship_style": "The Bold Vision Friend",
      "description": "St. Clare would be your most inspiring best friend who encourages big dreams! She'd help you follow God's call even when it's difficult and teach you to trust in God's protection. Clare would show you that girls can be strong leaders and change the world. Your friendship would be built on faith and courage!",
      "fun_fact": "As your best friend, Clare would help you stand up for your beliefs and follow your dreams, even when others don't understand!"
    },
    "dominic_savio": {
      "saint_id": "saint_082",
      "name": "St. Dominic Savio",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_dominicsavio.png",
      "friendship_style": "The Peacemaker Friend",
      "description": "St. Dominic would be your most peaceful best friend who helps solve problems! He'd stop fights before they start and help everyone get along. Dominic would teach you to choose holiness in small daily decisions and be a positive influence on others. Your friendship would bring peace wherever you go!",
      "fun_fact": "As your best friend, Dominic would be the one who steps in when friends are fighting and helps everyone make up!"
    },
    "pier_giorgio": {
      "saint_id": "saint_118",
      "name": "St. Pier Giorgio Frassati",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_frassati.png",
      "friendship_style": "The Adventure Sports Friend",
      "description": "St. Pier Giorgio would be your most energetic best friend who loves outdoor adventures! You'd go hiking, skiing, and mountain climbing together while talking about God and life. Pier Giorgio would show you that you can love sports, have fun, and be deeply holy all at the same time. Your friendship would be full of adventure and joy!",
      "fun_fact": "As your best friend, Pier Giorgio would plan the most epic hiking trips and somehow manage to pray the Rosary while climbing mountains!"
    }
  }
},
{
  "quiz_id": "study_buddy",
  "title": "Which Saint Would Be Your Study Buddy?",
  "description": "Discover which saint would be the perfect study partner to help you succeed in school!",
  "series": "Cross-Series Special",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "Are you a boy or a girl?",
      "type": "gender",
      "answers": [
        {"text": "Boy", "points": {"aquinas": 5, "albert": 5, "bede": 5, "john_bosco": 5, "jerome": 5, "dominic_savio": 5, "aloysius": 5, "john_berchmans": 5}},
        {"text": "Girl", "points": {"catherine_alexandria": 5, "elizabeth_seton": 5, "hildegard": 5, "teresa_avila": 5, "gemma": 5, "therese": 5}}
      ]
    },
    {
      "id": 2,
      "question": "What's your biggest challenge when studying?",
      "answers": [
        {"text": "I get distracted easily and can't focus", "points": {"john_berchmans": 3, "dominic_savio": 2, "gemma": 2}},
        {"text": "I don't understand the material", "points": {"aquinas": 3, "albert": 2, "john_bosco": 2}},
        {"text": "I get overwhelmed by how much I have to learn", "points": {"therese": 3, "elizabeth_seton": 2, "teresa_avila": 1}},
        {"text": "I get nervous about tests and presentations", "points": {"aloysius": 3, "gemma": 2, "catherine_alexandria": 1}},
        {"text": "I find it boring and hard to stay motivated", "points": {"john_bosco": 3, "hildegard": 2, "jerome": 1}}
      ]
    },
    {
      "id": 3,
      "question": "What subject do you need the most help with?",
      "answers": [
        {"text": "Religion/Theology - understanding faith", "points": {"aquinas": 3, "teresa_avila": 3, "therese": 2}},
        {"text": "Science - experiments and how things work", "points": {"albert": 3, "hildegard": 2}},
        {"text": "History - remembering dates and events", "points": {"bede": 3, "catherine_alexandria": 2}},
        {"text": "Language Arts - reading and writing", "points": {"jerome": 3, "elizabeth_seton": 2, "therese": 1}},
        {"text": "Math - numbers and problem solving", "points": {"albert": 2, "john_berchmans": 2, "aquinas": 1}}
      ]
    },
    {
      "id": 4,
      "question": "How do you learn best?",
      "answers": [
        {"text": "By reading books and taking detailed notes", "points": {"aquinas": 3, "bede": 3, "jerome": 2}},
        {"text": "Through hands-on activities and experiments", "points": {"albert": 3, "hildegard": 2, "john_bosco": 2}},
        {"text": "By discussing and debating ideas", "points": {"catherine_alexandria": 3, "aquinas": 2, "teresa_avila": 1}},
        {"text": "With games, songs, and fun activities", "points": {"john_bosco": 3, "elizabeth_seton": 2}},
        {"text": "In quiet, peaceful environments", "points": {"therese": 3, "gemma": 2, "aloysius": 2}}
      ]
    },
    {
      "id": 5,
      "question": "What kind of study buddy do you need?",
      "answers": [
        {"text": "Someone who's incredibly smart and can explain anything", "points": {"aquinas": 3, "albert": 3, "catherine_alexandria": 2}},
        {"text": "Someone who makes learning fun and interesting", "points": {"john_bosco": 3, "hildegard": 2, "elizabeth_seton": 1}},
        {"text": "Someone patient who won't judge my mistakes", "points": {"therese": 3, "elizabeth_seton": 2, "teresa_avila": 2}},
        {"text": "Someone organized who helps me stay on track", "points": {"john_berchmans": 3, "dominic_savio": 2, "bede": 1}},
        {"text": "Someone encouraging who believes I can succeed", "points": {"aloysius": 3, "gemma": 2, "therese": 1}}
      ]
    },
    {
      "id": 6,
      "question": "When do you study best?",
      "answers": [
        {"text": "Early in the morning when my mind is fresh", "points": {"aquinas": 2, "john_berchmans": 2, "aloysius": 2}},
        {"text": "After school with breaks for snacks and fun", "points": {"john_bosco": 3, "dominic_savio": 2}},
        {"text": "Late at night when it's quiet and peaceful", "points": {"therese": 3, "gemma": 2, "teresa_avila": 2}},
        {"text": "Anytime, as long as I'm with friends", "points": {"elizabeth_seton": 2, "catherine_alexandria": 2}},
        {"text": "In short bursts throughout the day", "points": {"hildegard": 2, "bede": 2, "jerome": 1}}
      ]
    },
    {
      "id": 7,
      "question": "How do you want your study buddy to motivate you?",
      "answers": [
        {"text": "By showing me how awesome learning can be", "points": {"albert": 3, "hildegard": 3, "john_bosco": 2}},
        {"text": "By reminding me that small steps lead to big success", "points": {"therese": 3, "john_berchmans": 2}},
        {"text": "By challenging me to think deeper and do better", "points": {"aquinas": 3, "catherine_alexandria": 3, "teresa_avila": 1}},
        {"text": "By helping me see how studies connect to my faith", "points": {"elizabeth_seton": 3, "dominic_savio": 2, "aloysius": 2}},
        {"text": "By being patient and encouraging when I struggle", "points": {"gemma": 3, "therese": 2, "elizabeth_seton": 1}}
      ]
    },
    {
      "id": 8,
      "question": "What's your study goal?",
      "answers": [
        {"text": "To become really wise and understand deep truths", "points": {"aquinas": 3, "teresa_avila": 2, "catherine_alexandria": 2}},
        {"text": "To discover amazing things about God's creation", "points": {"albert": 3, "hildegard": 3}},
        {"text": "To do well enough to make my family proud", "points": {"aloysius": 3, "john_berchmans": 2, "dominic_savio": 2}},
        {"text": "To learn skills that will help me serve others", "points": {"elizabeth_seton": 3, "john_bosco": 2, "gemma": 1}},
        {"text": "To grow closer to God through learning", "points": {"therese": 3, "dominic_savio": 2, "aloysius": 1}}
      ]
    }
  ],
  "results": {
    "aquinas": {
      "saint_id": "saint_018",
      "name": "St. Thomas Aquinas",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_aquinas.png",
      "study_style": "The Brilliant Explainer",
      "description": "St. Thomas Aquinas would be your ultimate study buddy for deep thinking! He's the 'Angelic Doctor' who can explain the most complicated ideas in ways that make perfect sense. Thomas would help you understand theology, philosophy, and how faith and reason work together. With him as your study buddy, no question is too hard to answer!",
      "study_tip": "Thomas would teach you to break big ideas into smaller parts and always ask 'Why?' until you really understand.",
      "fun_fact": "St. Thomas was so smart that his 'Summa Theologica' is still used as a textbook 800 years later!"
    },
    "albert": {
      "saint_id": "saint_179",
      "name": "St. Albert the Great",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_albertgreat.png",
      "study_style": "The Science Genius",
      "description": "St. Albert the Great would be your perfect study buddy for science and discovery! He was called the 'Universal Doctor' because he knew about everything - from biology to chemistry to astronomy. Albert would make every experiment exciting and show you how science proves God's amazing design. Learning with him would be like having your own personal science museum!",
      "study_tip": "Albert would encourage you to observe everything carefully and ask questions about how God's creation works.",
      "fun_fact": "St. Albert the Great was one of the first people to study chemistry scientifically and was Thomas Aquinas's teacher!"
    },
    "catherine_alexandria": {
      "saint_id": "saint_catherine_alexandria",
      "name": "St. Catherine of Alexandria",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_catherine_alexandria.png",
      "study_style": "The Debate Champion",
      "description": "St. Catherine of Alexandria would be your most brilliant study buddy who loves discussions and debates! She was so smart that she could out-argue 50 philosophers at once. Catherine would help you think critically, ask great questions, and defend your ideas. With her as your study buddy, you'd become confident in any classroom discussion!",
      "study_tip": "Catherine would teach you to research thoroughly and practice explaining your ideas clearly and confidently.",
      "fun_fact": "St. Catherine of Alexandria was so smart that when the emperor brought 50 philosophers to debate her, she converted them all to Christianity instead!"
    },
    "john_bosco": {
      "saint_id": "saint_048",
      "name": "St. John Bosco",
      "series": "Founder Flames",
      "icon_asset": "assets/saints/saint_bosco.png",
      "study_style": "The Fun Learning Coach",
      "description": "St. John Bosco would be your most fun study buddy who makes every lesson an adventure! Don Bosco believed learning should be joyful, so he'd use games, magic tricks, and activities to help you remember everything. With him as your study buddy, you'd never be bored and would actually look forward to homework time!",
      "study_tip": "John Bosco would turn your study sessions into games and help you find the fun in every subject.",
      "fun_fact": "St. John Bosco used magic tricks and acrobatics to get students' attention before teaching them - making learning unforgettable!"
    },
    "elizabeth_seton": {
      "saint_id": "saint_015",
      "name": "St. Elizabeth Ann Seton",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_elizabeth.png",
      "study_style": "The Patient Teacher",
      "description": "St. Elizabeth Ann Seton would be your most patient and encouraging study buddy! As the founder of Catholic schools in America, she knows exactly how to help students succeed. Elizabeth would never make you feel bad about mistakes and would help you learn at your own pace. With her as your study buddy, you'd feel confident and supported!",
      "study_tip": "Elizabeth would remind you that every student learns differently and help you find your own special way to succeed.",
      "fun_fact": "St. Elizabeth Ann Seton started the Catholic school system in America and believed every child deserves a great education!"
    },
    "therese": {
      "saint_id": "saint_001",
      "name": "St. Therese of Lisieux",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_therese.png",
      "study_style": "The Little Way Learner",
      "description": "St. Thérèse would be your sweetest study buddy who shows you that small efforts lead to big success! She'd help you not get overwhelmed and remind you that God loves you whether you get A's or C's. Thérèse would teach you to do your best with love and trust that God will help you learn what you need to know!",
      "study_tip": "Thérèse would help you take studying one small step at a time and trust that God gives you the grace you need.",
      "fun_fact": "St. Thérèse became a Doctor of the Church even though she was simple and young - proving that littleness can be great!"
    },
    "bede": {
      "saint_id": "saint_188",
      "name": "St. Bede the Venerable",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_bede.png",
      "study_style": "The History Master",
      "description": "St. Bede would be your perfect study buddy for history and research! He wrote the first history of England and loved preserving important stories. Bede would help you remember dates by connecting them to exciting stories and show you how history helps us understand today. With him, history would come alive!",
      "study_tip": "Bede would teach you to connect historical events to stories and help you see patterns that make everything easier to remember.",
      "fun_fact": "St. Bede the Venerable wrote the first comprehensive history of English Christianity and invented the dating system (A.D.) we still use!"
    },
    "jerome": {
      "saint_id": "saint_023",
      "name": "St. Jerome",
      "series": "Apostolic All-Stars",
      "icon_asset": "assets/saints/saint_jerome.png",
      "study_style": "The Language Expert",
      "description": "St. Jerome would be your best study buddy for languages and writing! He translated the entire Bible into Latin and was passionate about getting every word exactly right. Jerome would help you with grammar, vocabulary, and writing skills. With him as your study buddy, you'd become amazing at communication!",
      "study_tip": "Jerome would help you break down difficult words and teach you that careful attention to language helps you express ideas clearly.",
      "fun_fact": "St. Jerome could speak Hebrew, Greek, and Latin fluently and spent 30 years creating the perfect Bible translation!"
    },
    "hildegard": {
      "saint_id": "saint_124",
      "name": "St. Hildegard of Bingen",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_hildegard.png",
      "study_style": "The Creative Genius",
      "description": "St. Hildegard would be your most creative study buddy who connects everything together! She studied music, medicine, astronomy, and theology all at once. Hildegard would help you see how different subjects connect and use art, music, and creativity to help you learn. With her, studying would be like exploring a fascinating puzzle!",
      "study_tip": "Hildegard would encourage you to draw pictures, make up songs, and use creative methods to remember what you learn.",
      "fun_fact": "St. Hildegard composed beautiful music, studied herbal medicine, and wrote about astronomy - she was like a medieval Renaissance woman!"
    },
    "dominic_savio": {
      "saint_id": "saint_082",
      "name": "St. Dominic Savio",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_dominicsavio.png",
      "study_style": "The Focused Achiever",
      "description": "St. Dominic Savio would be your most focused study buddy who helps you stay on task! Even as a young student, Dominic was disciplined and determined to do his best in everything. He'd help you develop good study habits and remind you that doing well in school is a way to serve God. With him, you'd become super organized!",
      "study_tip": "Dominic would help you create a study schedule and remind you that small daily efforts lead to big achievements.",
      "fun_fact": "St. Dominic Savio was such a good student that St. John Bosco said he was a model for all young people!"
    },
    "aloysius": {
      "saint_id": "saint_053",
      "name": "St. Aloysius Gonzaga",
      "series": "Learning Legends",
      "icon_asset": "assets/saints/saint_aloysius.png",
      "study_style": "The Gentle Encourager",
      "description": "St. Aloysius would be your most encouraging study buddy who helps with test anxiety and pressure! He gave up wealth to become a Jesuit and knew how to handle high expectations. Aloysius would remind you that your worth isn't based on grades and help you study with peace instead of stress. With him, you'd feel calm and confident!",
      "study_tip": "Aloysius would teach you breathing exercises before tests and remind you that God loves you no matter what grades you get.",
      "fun_fact": "St. Aloysius gave up being a prince to study theology and serve others - showing that true success comes from following God!"
    },
    "john_berchmans": {
      "saint_id": "saint_161",
      "name": "St. John Berchmans",
      "series": "Halo Hatchlings",
      "icon_asset": "assets/saints/saint_berchmans.png",
      "study_style": "The Detail Master",
      "description": "St. John Berchmans would be your most organized study buddy who helps you pay attention to details! He said he would 'pay the greatest attention to the smallest things.' John would help you organize your notes, keep track of assignments, and make sure you don't miss any important details. With him, you'd become super thorough!",
      "study_tip": "John would help you create detailed study guides and checklists to make sure you're prepared for everything.",
      "fun_fact": "St. John Berchmans carried his rosary, crucifix, and book of rules everywhere - he was the ultimate organized student!"
    },
    "teresa_avila": {
      "saint_id": "saint_073",
      "name": "St. Teresa of Avila",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_teresaavila.png",
      "study_style": "The Deep Thinker",
      "description": "St. Teresa of Avila would be your study buddy for really understanding complex ideas! She was both mystical and practical, and could think deeply while staying grounded. Teresa would help you not just memorize facts but truly understand what they mean. With her as your study buddy, you'd develop wisdom, not just knowledge!",
      "study_tip": "Teresa would encourage you to reflect on what you learn and ask how it connects to your life and faith.",
      "fun_fact": "St. Teresa of Avila was both a great mystic and a practical reformer - proving you can be deep and smart at the same time!"
    },
    "gemma": {
      "saint_id": "saint_151",
      "name": "St. Gemma Galgani",
      "series": "Contemplative Cuties",
      "icon_asset": "assets/saints/saint_gemma.png",
      "study_style": "The Gentle Supporter",
      "description": "St. Gemma would be your most understanding study buddy who helps when school feels overwhelming! She faced many challenges but stayed close to God through everything. Gemma would remind you that it's okay to struggle and that God gives you strength for each day. With her support, you'd feel less anxious about school!",
      "study_tip": "Gemma would remind you to pray before studying and trust that God will help you learn what you need to know.",
      "fun_fact": "St. Gemma faced many difficulties but always trusted in God's love - she'd help you stay peaceful during stressful school times!"
    }
  }
},
{
  "quiz_id": "saint_type",
  "title": "What Type of Saint Would You Be?",
  "description": "Discover which Luxling series represents your saintly calling and spiritual path!",
  "series": "Cross-Series Special",
  "target_grades": [4, 5, 6, 7, 8],
  "questions": [
    {
      "id": 1,
      "question": "How do you feel most called to serve God?",
      "answers": [
        {"text": "Through deep prayer and mystical experiences", "points": {"contemplative_cuties": 3, "desert_disciples": 2, "mini_marians": 1}},
        {"text": "By performing amazing miracles and dramatic acts", "points": {"super_sancti": 3, "heavenly_helpers": 2, "cherub_chibis": 1}},
        {"text": "By starting new movements and leading others", "points": {"founder_flames": 3, "apostolic_allstars": 2, "regal_royals": 1}},
        {"text": "Through simple, everyday acts of kindness", "points": {"pocket_patrons": 3, "virtue_vignettes": 2, "faithful_families": 1}},
        {"text": "By learning, teaching, and growing in wisdom", "points": {"learning_legends": 3, "halo_hatchlings": 2}}
      ]
    },
    {
      "id": 2,
      "question": "What's your approach to prayer and spirituality?",
      "answers": [
        {"text": "I love quiet, deep prayer and feeling close to God", "points": {"contemplative_cuties": 3, "desert_disciples": 3}},
        {"text": "I pray especially to Mary and love Marian devotions", "points": {"mini_marians": 3, "contemplative_cuties": 1}},
        {"text": "I pray for big miracles and amazing interventions", "points": {"super_sancti": 3, "heavenly_helpers": 2}},
        {"text": "I like simple prayers while doing daily tasks", "points": {"pocket_patrons": 3, "virtue_vignettes": 2, "faithful_families": 2}},
        {"text": "I'm still learning how to pray as I grow up", "points": {"halo_hatchlings": 3, "learning_legends": 1}}
      ]
    },
    {
      "id": 3,
      "question": "How do you handle big challenges in your life?",
      "answers": [
        {"text": "I retreat to quiet places and pray for guidance", "points": {"desert_disciples": 3, "contemplative_cuties": 2}},
        {"text": "I face them head-on with supernatural courage", "points": {"super_sancti": 3, "cherub_chibis": 2, "regal_royals": 1}},
        {"text": "I organize others and create solutions together", "points": {"founder_flames": 3, "apostolic_allstars": 2}},
        {"text": "I trust God and do small things with great love", "points": {"virtue_vignettes": 3, "pocket_patrons": 2}},
        {"text": "I ask for help from family and mentors", "points": {"faithful_families": 3, "halo_hatchlings": 2}}
      ]
    },
    {
      "id": 4,
      "question": "What kind of legacy do you want to leave?",
      "answers": [
        {"text": "Deep spiritual writings and mystical insights", "points": {"contemplative_cuties": 3, "apostolic_allstars": 1}},
        {"text": "Amazing miracle stories that inspire faith", "points": {"super_sancti": 3, "heavenly_helpers": 2}},
        {"text": "Organizations and movements that continue after me", "points": {"founder_flames": 3, "learning_legends": 1}},
        {"text": "A reputation for being helpful and reliable", "points": {"pocket_patrons": 3, "virtue_vignettes": 2}},
        {"text": "Bringing my culture and people closer to God", "points": {"culture_carriers": 3, "apostolic_allstars": 1}}
      ]
    },
    {
      "id": 5,
      "question": "How do you relate to other people?",
      "answers": [
        {"text": "I prefer small groups or one-on-one conversations", "points": {"contemplative_cuties": 2, "desert_disciples": 3, "faithful_families": 1}},
        {"text": "I love being the center of attention with amazing stories", "points": {"super_sancti": 3, "culture_carriers": 2}},
        {"text": "I naturally become a leader that others follow", "points": {"founder_flames": 3, "regal_royals": 3, "apostolic_allstars": 1}},
        {"text": "I'm the friend everyone turns to for help", "points": {"pocket_patrons": 3, "heavenly_helpers": 2, "virtue_vignettes": 1}},
        {"text": "I'm still figuring out who I am and where I fit", "points": {"halo_hatchlings": 3, "learning_legends": 1}}
      ]
    },
    {
      "id": 6,
      "question": "What motivates you most?",
      "answers": [
        {"text": "Growing closer to God through prayer and silence", "points": {"contemplative_cuties": 3, "desert_disciples": 2}},
        {"text": "Performing incredible feats that amaze people", "points": {"super_sancti": 3, "cherub_chibis": 1}},
        {"text": "Building something lasting that helps many people", "points": {"founder_flames": 3, "learning_legends": 2, "apostolic_allstars": 1}},
        {"text": "Being genuinely helpful in practical, everyday ways", "points": {"pocket_patrons": 3, "virtue_vignettes": 2}},
        {"text": "Honoring my family and cultural heritage", "points": {"culture_carriers": 3, "faithful_families": 2}}
      ]
    },
    {
      "id": 7,
      "question": "How do you want to be remembered?",
      "answers": [
        {"text": "As someone who had beautiful mystical experiences", "points": {"contemplative_cuties": 3, "mini_marians": 2}},
        {"text": "As someone who performed impossible miracles", "points": {"super_sancti": 3, "heavenly_helpers": 1}},
        {"text": "As a wise leader who changed the world", "points": {"founder_flames": 2, "regal_royals": 3, "apostolic_allstars": 2}},
        {"text": "As someone who was always there when people needed help", "points": {"pocket_patrons": 3, "virtue_vignettes": 2}},
        {"text": "As a young person who inspired other kids", "points": {"halo_hatchlings": 3, "learning_legends": 1}}
      ]
    },
    {
      "id": 8,
      "question": "What's your ideal way to spend a day?",
      "answers": [
        {"text": "In quiet prayer, reading spiritual books, and meditation", "points": {"contemplative_cuties": 3, "desert_disciples": 2}},
        {"text": "Helping heal people and working miraculous solutions", "points": {"heavenly_helpers": 3, "super_sancti": 2}},
        {"text": "Planning projects and organizing people to help", "points": {"founder_flames": 3, "apostolic_allstars": 1}},
        {"text": "Doing small acts of service and being helpful", "points": {"pocket_patrons": 3, "virtue_vignettes": 2}},
        {"text": "Learning new things and discovering God's truth", "points": {"learning_legends": 3, "halo_hatchlings": 1}}
      ]
    },
    {
      "id": 9,
      "question": "How do you see your relationship with Jesus?",
      "answers": [
        {"text": "As a mystical union through deep contemplative prayer", "points": {"contemplative_cuties": 3, "mini_marians": 1}},
        {"text": "As a powerful partnership for performing miracles", "points": {"super_sancti": 3, "heavenly_helpers": 2}},
        {"text": "As being part of His closest circle of leaders", "points": {"sacred_circle": 3, "apostolic_allstars": 2}},
        {"text": "As a simple, trusting friendship", "points": {"pocket_patrons": 2, "virtue_vignettes": 2, "halo_hatchlings": 2}},
        {"text": "As a growing relationship that's still developing", "points": {"halo_hatchlings": 3, "learning_legends": 2}}
      ]
    },
    {
      "id": 10,
      "question": "What's your spiritual 'superpower'?",
      "answers": [
        {"text": "Deep insight into God's mysteries through prayer", "points": {"contemplative_cuties": 3, "desert_disciples": 1}},
        {"text": "Performing amazing miracles and supernatural feats", "points": {"super_sancti": 3, "cherub_chibis": 2}},
        {"text": "Inspiring and organizing others to follow God", "points": {"founder_flames": 3, "regal_royals": 2}},
        {"text": "Being incredibly helpful with everyday problems", "points": {"pocket_patrons": 3, "heavenly_helpers": 1}},
        {"text": "Connecting different peoples through faith", "points": {"culture_carriers": 3, "sacred_circle": 1}}
      ]
    }
  ],
  "results": {
    "halo_hatchlings": {
      "series_name": "Halo Hatchlings",
      "icon_asset": "assets/luxlings_series/halo_hatchlings.png",
      "description": "You're a Halo Hatchling! You represent the young saints who show that age is no barrier to holiness. Like Carlo Acutis, Dominic Savio, and Maria Goretti, you have a pure heart and are still growing in your faith. You inspire other young people to live saintly lives and prove that kids can be heroes too! Your youthful energy and innocent love for God light up the world!",
      "traits": ["Young at heart", "Pure and innocent", "Still learning and growing", "Inspiring to peers", "Full of potential"],
      "mission": "To show other young people that saints come in all ages and that you can be holy right now, not just when you grow up!",
      "fun_fact": "The youngest saints in this series prove that God doesn't wait until you're older to call you to greatness!"
    },
    "contemplative_cuties": {
      "series_name": "Contemplative Cuties",
      "icon_asset": "assets/luxlings_series/contemplative_cuties.png",
      "description": "You're a Contemplative Cutie! You're drawn to deep prayer, mystical experiences, and quiet time with God. Like Thérèse, Teresa of Avila, and Catherine of Siena, you find God in the silence and have profound spiritual insights. You're the prayer warrior who knows that time spent with God changes everything. Your contemplative heart brings heaven closer to earth!",
      "traits": ["Deep prayer life", "Mystical experiences", "Loves silence and solitude", "Spiritual wisdom", "Inner peace"],
      "mission": "To show the world that prayer is powerful and that intimate friendship with God can transform everything!",
      "fun_fact": "Contemplative saints often had visions and mystical experiences that guided the whole Church!"
    },
    "founder_flames": {
      "series_name": "Founder Flames",
      "icon_asset": "assets/luxlings_series/founder_flames.png",
      "description": "You're a Founder Flame! You're a natural-born leader and entrepreneur for God's kingdom. Like Francis, Dominic, and Ignatius, you see needs and create solutions that last for centuries. You don't just follow - you blaze new trails and start movements that help countless people. Your leadership creates lasting change in the world!",
      "traits": ["Natural leader", "Visionary", "Entrepreneurial spirit", "Creates lasting change", "Inspires others"],
      "mission": "To start new movements and organizations that serve God's people and last long after you're gone!",
      "fun_fact": "Many religious orders founded by these saints are still active today, centuries later!"
    },
    "pocket_patrons": {
      "series_name": "Pocket Patrons",
      "icon_asset": "assets/luxlings_series/pocket_patrons.png",
      "description": "You're a Pocket Patron! You're the go-to saint for everyday problems and practical help. Like Anthony (lost things), Blaise (throat problems), and Joseph (workers), you specialize in the daily struggles people face. You're reliable, helpful, and always there when people need you most. Your practical holiness makes faith accessible to everyone!",
      "traits": ["Practical and helpful", "Reliable", "Solves everyday problems", "Down-to-earth", "Always available"],
      "mission": "To be God's helper for all the small but important problems people face every single day!",
      "fun_fact": "People still pray to Pocket Patron saints for help with specific needs like lost items, sore throats, and work problems!"
    },
    "super_sancti": {
      "series_name": "Super Sancti",
      "icon_asset": "assets/luxlings_series/super_sancti.png",
      "description": "You're a Super Sancti! You're destined for amazing, dramatic feats that inspire awe and wonder. Like Joan of Arc, Maximilian Kolbe, and Oscar Romero, you perform incredible acts of courage, sacrifice, and miraculous power. You're the superhero saint whose story seems almost too amazing to believe. Your extraordinary life shows God's power!",
      "traits": ["Heroic courage", "Miraculous powers", "Dramatic story", "Inspires awe", "Extraordinary faith"],
      "mission": "To perform amazing feats that show God's power and inspire people to believe in the impossible!",
      "fun_fact": "Super Sancti saints often have the most dramatic conversion stories and incredible miracles!"
    },
    "sacred_circle": {
      "series_name": "Sacred Circle",
      "icon_asset": "assets/luxlings_series/sacred_circle.png",
      "description": "You're part of the Sacred Circle! You're called to be in Jesus's inner circle like the apostles and closest disciples. Like Peter, John, and Mary Magdalene, you have a special intimacy with Jesus and help lay the foundation for others. You're a foundational saint whose faithfulness supports the whole Church. Your close relationship with Jesus is your greatest treasure!",
      "traits": ["Close to Jesus", "Foundational role", "Deep faithfulness", "Apostolic calling", "Supports others"],
      "mission": "To be part of Jesus's closest circle and help build the foundation that supports all other saints!",
      "fun_fact": "The Sacred Circle saints were literally there with Jesus or were among the very first Christians!"
    },
    "learning_legends": {
      "series_name": "Learning Legends",
      "icon_asset": "assets/luxlings_series/learning_legends.png",
      "description": "You're a Learning Legend! You're passionate about education, wisdom, and understanding God through study. Like Thomas Aquinas, Hildegard, and Elizabeth Seton, you believe that learning is a form of worship and that education can change the world. You're the scholar-saint whose mind serves God. Your love of learning lights up minds and hearts!",
      "traits": ["Love of learning", "Intellectual gifts", "Teaching ability", "Scholarly wisdom", "Educational vision"],
      "mission": "To use your mind to serve God and help others discover truth through education and wisdom!",
      "fun_fact": "Many Learning Legends founded schools and universities that are still educating students today!"
    },
    "culture_carriers": {
      "series_name": "Culture Carriers",
      "icon_asset": "assets/luxlings_series/culture_carriers.png",
      "description": "You're a Culture Carrier! You're the patron saint of your people, culture, or nation. Like Patrick (Ireland), George (England), and Guadalupe (Americas), you bridge different cultures and help entire peoples find God. You understand that God speaks through every culture and that diversity is beautiful. Your cultural pride serves God's universal love!",
      "traits": ["Cultural bridge-builder", "National pride", "Unites peoples", "Celebrates diversity", "Evangelizes cultures"],
      "mission": "To help entire cultures and nations discover God while celebrating what makes each people unique!",
      "fun_fact": "Culture Carrier saints often appeared to indigenous peoples in their own cultural dress and language!"
    },
    "regal_royals": {
      "series_name": "Regal Royals",
      "icon_asset": "assets/luxlings_series/regal_royals.png",
      "description": "You're a Regal Royal! You're called to holy leadership and noble service. Like Louis IX, Helena, and Edward the Confessor, you use power and privilege to serve God and help others. You understand that true nobility comes from virtue, not birth. You're the king or queen whose crown is really a halo! Your royal example shows how to lead with holiness!",
      "traits": ["Noble leadership", "Servant's heart", "Uses privilege for good", "Virtuous example", "Moral authority"],
      "mission": "To show that true royalty comes from serving God and using any power or privilege to help others!",
      "fun_fact": "Many Regal Royal saints gave up earthly crowns for heavenly ones, choosing holiness over political power!"
    },
    "heavenly_helpers": {
      "series_name": "Heavenly Helpers",
      "icon_asset": "assets/luxlings_series/heavenly_helpers.png",
      "description": "You're a Heavenly Helper! You specialize in healing, miracles, and helping people with specific problems. Like Padre Pio, Bernadette, and Rita, you channel God's power to bring healing and hope to desperate situations. You're the miracle worker whose prayers make the impossible possible. Your heavenly help brings God's power to earth!",
      "traits": ["Healing power", "Miraculous intercession", "Helps desperate cases", "Channels divine power", "Brings hope"],
      "mission": "To be God's instrument for healing and help, especially for people facing impossible situations!",
      "fun_fact": "Heavenly Helper saints are often invoked for specific needs and are famous for miraculous answers to prayer!"
    },
    "desert_disciples": {
      "series_name": "Desert Disciples",
      "icon_asset": "assets/luxlings_series/desert_disciples.png",
      "description": "You're a Desert Disciple! You're called to the hermit life of solitude, silence, and extreme devotion to God. Like Anthony the Great, Benedict, and Mary of Egypt, you find God in the wilderness and show that sometimes you have to leave everything behind to find everything in God. Your desert spirituality creates oases of holiness!",
      "traits": ["Loves solitude", "Extreme devotion", "Desert spirituality", "Seeks God alone", "Contemplative warrior"],
      "mission": "To show that sometimes the path to God requires leaving everything behind and finding Him in the wilderness!",
      "fun_fact": "Desert Disciple saints often lived for decades in complete solitude but influenced thousands through their example!"
    },
    "virtue_vignettes": {
      "series_name": "Virtue Vignettes",
      "icon_asset": "assets/luxlings_series/virtue_vignettes.png",
      "description": "You're a Virtue Vignette! You're known for mastering specific virtues and character traits. Like Monica (patience), Philip Neri (joy), and Gianna Molla (sacrifice), you show what it looks like to perfect particular aspects of Christian character. You're the specialty saint whose virtue shines so brightly it inspires everyone. Your character is your superpower!",
      "traits": ["Master of specific virtues", "Character excellence", "Moral example", "Inspires good behavior", "Shows virtue in action"],
      "mission": "To perfect specific virtues and show others exactly what Christian character looks like in real life!",
      "fun_fact": "Virtue Vignette saints are often remembered for one particular virtue that they practiced to an extraordinary degree!"
    },
    "apostolic_allstars": {
      "series_name": "Apostolic All-Stars",
      "icon_asset": "assets/luxlings_series/apostolic_allstars.png",
      "description": "You're an Apostolic All-Star! You're called to build up the Church through leadership, teaching, and evangelization. Like Augustine, Jerome, and Gregory the Great, you're a Church Father whose work shapes Christianity for centuries. You're the theologian, pope, or church builder whose contributions become foundational. Your apostolic work builds the kingdom!",
      "traits": ["Church builder", "Theological insight", "Leadership gifts", "Evangelistic zeal", "Foundational contributions"],
      "mission": "To build up Christ's Church through teaching, leadership, and creating structures that help others grow in faith!",
      "fun_fact": "Apostolic All-Star saints wrote many of the books and created many of the practices that Christians still use today!"
    },
    "mini_marians": {
      "series_name": "Mini Marians",
      "icon_asset": "assets/luxlings_series/mini_marians.png",
      "description": "You're a Mini Marian! Your spirituality centers around devotion to Mary and spreading her messages. Like the apparitions at Lourdes, Fatima, and Guadalupe, you help people understand Mary's role as mother and intercessor. You're the Marian devotee whose love for Mary draws others to Jesus. Your Marian heart reflects Mary's own loving spirit!",
      "traits": ["Deep Marian devotion", "Spreads Mary's messages", "Draws others to Jesus through Mary", "Promotes prayer", "Maternal love"],
      "mission": "To help people discover Mary's love and let her lead them closer to her son Jesus!",
      "fun_fact": "Mini Marian saints and apparitions often emphasize the Rosary and prayer as powerful weapons against evil!"
    },
    "faithful_families": {
      "series_name": "Faithful Families",
      "icon_asset": "assets/luxlings_series/faithful_families.png",
      "description": "You're part of the Faithful Families! Your path to holiness goes through family life and helping loved ones become saints too. Like Sts. Louis and Zélie Martin or Anne and Joachim, you show that families can be schools of holiness where everyone helps everyone else get to heaven. Your family love reflects God's own family love!",
      "traits": ["Family-centered holiness", "Helps others become saints", "Domestic spirituality", "Generational faith", "Love-centered approach"],
      "mission": "To show that families are meant to be little churches where everyone helps everyone else become a saint!",
      "fun_fact": "Faithful Family saints often have multiple family members who become saints - holiness runs in the family!"
    },
    "cherub_chibis": {
      "series_name": "Cherub Chibis",
      "icon_asset": "assets/luxlings_series/cherub_chibis.png",
      "description": "You're a Cherub Chibi! You're called to be God's warrior and messenger like the mighty archangels. Like Michael, Gabriel, and Raphael, you're a spiritual warrior who fights evil, delivers God's messages, and protects His people. You're the angelic saint whose mission comes directly from heaven's throne room. Your warrior spirit defends God's kingdom!",
      "traits": ["Spiritual warrior", "God's messenger", "Protects others", "Fights evil", "Heavenly mission"],
      "mission": "To be God's warrior and messenger, fighting spiritual battles and delivering heaven's messages to earth!",
      "fun_fact": "Cherub Chibi saints have missions that come directly from God's throne and often involve cosmic battles between good and evil!"
    }
  }
  }
];

// PLACEHOLDER for future book quizzes
const BOOK_QUIZZES_DATA = [
  // Will be populated when book quizzes are created
];

// BULK SETUP FUNCTION - Saints Quizzes
const setupAllSaintsQuizzes = async () => {
  try {
    console.log('🚀 Setting up ALL saints quizzes (bulk operation)...')
    
    const quizzesRef = collection(db, 'saints-quizzes')
    const existingQuizzes = await getDocs(quizzesRef)
    
    if (!existingQuizzes.empty) {
      const overwrite = window.confirm(`Saints quizzes collection exists with ${existingQuizzes.size} quizzes. Overwrite with complete catalog of ${SAINTS_QUIZZES_DATA.length} quizzes?`)
      if (!overwrite) {
        return { success: false, message: 'Bulk setup cancelled' }
      }
    }
    
    let processedCount = 0
    for (const quiz of SAINTS_QUIZZES_DATA) {
      await setDoc(doc(db, 'saints-quizzes', quiz.quiz_id), quiz)
      console.log(`✅ Processed: ${quiz.title}`)
      processedCount++
    }
    
    console.log(`🎉 Saints quizzes bulk setup complete! Processed ${processedCount} quizzes`)
    return {
      success: true,
      message: `Successfully processed ${processedCount} saints quizzes`,
      stats: { total: processedCount, operation: 'bulk' }
    }
    
  } catch (error) {
    console.error('❌ Saints quizzes bulk setup error:', error)
    return { success: false, message: 'Bulk setup failed: ' + error.message }
  }
}

// BULK SETUP FUNCTION - Book Quizzes (placeholder)
const setupAllBookQuizzes = async () => {
  try {
    console.log('🚀 Setting up ALL book quizzes (bulk operation)...')
    
    if (BOOK_QUIZZES_DATA.length === 0) {
      return { 
        success: false, 
        message: 'No book quizzes data available yet. This feature will be enabled when book quizzes are created.' 
      }
    }
    
    const quizzesRef = collection(db, 'book-quizzes')
    const existingQuizzes = await getDocs(quizzesRef)
    
    if (!existingQuizzes.empty) {
      const overwrite = window.confirm(`Book quizzes collection exists with ${existingQuizzes.size} quizzes. Overwrite with complete catalog of ${BOOK_QUIZZES_DATA.length} quizzes?`)
      if (!overwrite) {
        return { success: false, message: 'Bulk setup cancelled' }
      }
    }
    
    let processedCount = 0
    for (const quiz of BOOK_QUIZZES_DATA) {
      await setDoc(doc(db, 'book-quizzes', quiz.quiz_id), quiz)
      console.log(`✅ Processed: ${quiz.title}`)
      processedCount++
    }
    
    console.log(`🎉 Book quizzes bulk setup complete! Processed ${processedCount} quizzes`)
    return {
      success: true,
      message: `Successfully processed ${processedCount} book quizzes`,
      stats: { total: processedCount, operation: 'bulk' }
    }
    
  } catch (error) {
    console.error('❌ Book quizzes bulk setup error:', error)
    return { success: false, message: 'Bulk setup failed: ' + error.message }
  }
}

// ADD NEW QUIZZES ONLY (saints)
const addNewSaintsQuizzesOnly = async () => {
  try {
    console.log('➕ Adding new saints quizzes only...')
    
    let addedCount = 0
    let skippedCount = 0
    
    for (const newQuiz of SAINTS_QUIZZES_DATA) {
      // Check if quiz already exists
      const quizRef = doc(db, 'saints-quizzes', newQuiz.quiz_id)
      const existingQuiz = await getDoc(quizRef)
      
      if (existingQuiz.exists()) {
        console.log(`⏭️ Skipped (already exists): ${newQuiz.title}`)
        skippedCount++
      } else {
        await setDoc(quizRef, newQuiz)
        console.log(`✅ Added new quiz: ${newQuiz.title}`)
        addedCount++
      }
    }
    
    console.log(`🎉 New saints quizzes addition complete! Added ${addedCount}, Skipped ${skippedCount}`)
    return {
      success: true,
      message: `Successfully added ${addedCount} new saints quizzes (${skippedCount} already existed)`,
      stats: { added: addedCount, skipped: skippedCount, operation: 'add_new' }
    }
    
  } catch (error) {
    console.error('❌ Add new saints quizzes error:', error)
    return { success: false, message: 'Add new saints quizzes failed: ' + error.message }
  }
}

// ADD SINGLE QUIZ (saints)
const addSingleSaintsQuiz = async (quizData) => {
  try {
    console.log(`➕ Adding single saints quiz: ${quizData.title}...`)
    
    // Validate required fields
    const requiredFields = ['quiz_id', 'title', 'description', 'series', 'target_grades', 'questions', 'results']
    for (const field of requiredFields) {
      if (!quizData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    // Check if quiz already exists
    const quizRef = doc(db, 'saints-quizzes', quizData.quiz_id)
    const existingQuiz = await getDoc(quizRef)
    
    if (existingQuiz.exists()) {
      const overwrite = window.confirm(`Quiz ${quizData.title} already exists. Overwrite?`)
      if (!overwrite) {
        return { success: false, message: 'Single quiz addition cancelled' }
      }
    }
    
    await setDoc(quizRef, quizData)
    console.log(`✅ Successfully added: ${quizData.title}`)
    
    return {
      success: true,
      message: `Successfully added ${quizData.title}`,
      stats: { added: 1, operation: 'single_add' }
    }
    
  } catch (error) {
    console.error('❌ Add single saints quiz error:', error)
    return { success: false, message: 'Add single saints quiz failed: ' + error.message }
  }
}

// ADD SINGLE QUIZ (books) - placeholder
const addSingleBookQuiz = async (quizData) => {
  try {
    console.log(`➕ Adding single book quiz: ${quizData.title}...`)
    
    // Validate required fields
    const requiredFields = ['quiz_id', 'title', 'description', 'target_grades', 'questions', 'results']
    for (const field of requiredFields) {
      if (!quizData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    // Check if quiz already exists
    const quizRef = doc(db, 'book-quizzes', quizData.quiz_id)
    const existingQuiz = await getDoc(quizRef)
    
    if (existingQuiz.exists()) {
      const overwrite = window.confirm(`Quiz ${quizData.title} already exists. Overwrite?`)
      if (!overwrite) {
        return { success: false, message: 'Single quiz addition cancelled' }
      }
    }
    
    await setDoc(quizRef, quizData)
    console.log(`✅ Successfully added: ${quizData.title}`)
    
    return {
      success: true,
      message: `Successfully added ${quizData.title}`,
      stats: { added: 1, operation: 'single_add' }
    }
    
  } catch (error) {
    console.error('❌ Add single book quiz error:', error)
    return { success: false, message: 'Add single book quiz failed: ' + error.message }
  }
}

// GET QUIZZES STATISTICS
const getQuizzesStats = async (type = 'saints') => {
  try {
    const collectionPath = type === 'saints' ? 'saints-quizzes' : 'book-quizzes'
    const quizzesRef = collection(db, collectionPath)
    const quizzesSnapshot = await getDocs(quizzesRef)
    
    const stats = {
      total: quizzesSnapshot.size,
      bySeries: {},
      byGradeLevel: {},
      byQuestionCount: {}
    }
    
    quizzesSnapshot.forEach((doc) => {
      const quiz = doc.data()
      
      // Count by series (for saints) or category (for books)
      const seriesKey = quiz.series || quiz.category || 'Unknown'
      stats.bySeries[seriesKey] = (stats.bySeries[seriesKey] || 0) + 1
      
      // Count by target grades
      const gradeRange = `Grades ${Math.min(...quiz.target_grades)}-${Math.max(...quiz.target_grades)}`
      stats.byGradeLevel[gradeRange] = (stats.byGradeLevel[gradeRange] || 0) + 1
      
      // Count by question count
      const questionCount = quiz.questions?.length || 0
      const questionRange = `${questionCount} questions`
      stats.byQuestionCount[questionRange] = (stats.byQuestionCount[questionRange] || 0) + 1
    })
    
    return stats
  } catch (error) {
    console.error('Error getting quizzes stats:', error)
    return {
      total: 0,
      bySeries: {},
      byGradeLevel: {},
      byQuestionCount: {}
    }
  }
}

// HELPER: Generate next quiz ID
const getNextQuizId = async (type = 'saints', prefix = '') => {
  try {
    const collectionPath = type === 'saints' ? 'saints-quizzes' : 'book-quizzes'
    const quizzesRef = collection(db, collectionPath)
    const quizzesSnapshot = await getDocs(quizzesRef)
    
    let maxNumber = 0
    const searchPrefix = prefix || (type === 'saints' ? 'saints_quiz_' : 'book_quiz_')
    
    quizzesSnapshot.forEach((doc) => {
      const quizId = doc.id
      if (quizId.startsWith(searchPrefix)) {
        const number = parseInt(quizId.split('_').pop())
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number
        }
      }
    })
    
    return `${searchPrefix}${String(maxNumber + 1).padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating next quiz ID:', error)
    return `${type}_quiz_999`
  }
}

// HELPER: Validate quiz data
const validateQuizData = (quizData, type = 'saints') => {
  const errors = []
  
  // Required fields
  const requiredFields = ['quiz_id', 'title', 'description', 'target_grades', 'questions', 'results']
  if (type === 'saints') {
    requiredFields.push('series')
  }
  
  for (const field of requiredFields) {
    if (!quizData[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  }
  
  // Validate target_grades is array
  if (quizData.target_grades && !Array.isArray(quizData.target_grades)) {
    errors.push('target_grades must be an array')
  }
  
  // Validate questions structure
  if (quizData.questions && Array.isArray(quizData.questions)) {
    quizData.questions.forEach((question, index) => {
      if (!question.id || !question.question || !question.answers) {
        errors.push(`Question ${index + 1} is missing required fields (id, question, answers)`)
      }
    })
  }
  
  // Validate results structure
  if (quizData.results && typeof quizData.results === 'object') {
    const resultKeys = Object.keys(quizData.results)
    if (resultKeys.length === 0) {
      errors.push('Results object cannot be empty')
    }
  }
  
  return errors
}

// EXPORTS
export { 
  setupAllSaintsQuizzes,     // Bulk setup saints quizzes
  setupAllBookQuizzes,       // Bulk setup book quizzes (placeholder)
  addNewSaintsQuizzesOnly,   // Add only new saints quizzes
  addSingleSaintsQuiz,       // Add one saints quiz
  addSingleBookQuiz,         // Add one book quiz
  getQuizzesStats,           // Get collection statistics
  getNextQuizId,             // Helper for new IDs
  validateQuizData,          // Validation helper
  SAINTS_QUIZZES_DATA,       // Current saints quizzes data
  BOOK_QUIZZES_DATA          // Placeholder for book quizzes
}

export default {
  setupAllSaintsQuizzes,
  setupAllBookQuizzes,
  addNewSaintsQuizzesOnly,
  addSingleSaintsQuiz,
  addSingleBookQuiz,
  getQuizzesStats,
  getNextQuizId,
  validateQuizData
}