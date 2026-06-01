require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Group = require('./models/Group');
const Expense = require('./models/Expense');
const Settlement = require('./models/Settlement');

const Q = {
  pet:      "What was your first pet's name?",
  maiden:   "What is your mother's maiden name?",
  born:     "What city were you born in?",
  school:   "What was the name of your first school?",
  movie:    "What is your favourite movie?",
  sibling:  "What is your oldest sibling's name?",
  street:   "What street did you grow up on?",
  nickname: "What was your childhood nickname?",
};

const sq = (q, a) => ({ question: q, answer: a });

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Expense.deleteMany({}),
    Settlement.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // ─── USERS ────────────────────────────────────────────────────────────────
  const [
    billu, meowzart, purrito, clawdia, pawl,
    bark, sherlock, woofgang, tails, ruffalo,
    beakonce, tweetie, feather, gill, fin,
  ] = await Promise.all([

    // ── Cats ──────────────────────────────────────────────────────────────
    User.create({
      name: 'Billu Bhayankar', email: 'billu@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.pet,      'Muffin the Menace'),
        sq(Q.street,   'Whisker Lane'),
        sq(Q.movie,    'The Purrfather'),
      ],
    }),
    User.create({
      name: 'Meowzart Mewndel', email: 'meowzart@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.maiden,   'Tabby Tiffin'),
        sq(Q.born,     'Mew Delhi'),
        sq(Q.nickname, 'Sir Hissalot'),
      ],
    }),
    User.create({
      name: 'Purrito Singh', email: 'purrito@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.school,   'St. Pawl Academy'),
        sq(Q.pet,      'Chonk Chonk'),
        sq(Q.born,     'Paw-nagar'),
      ],
    }),
    User.create({
      name: 'Clawdia Purrington', email: 'clawdia@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.movie,    'Cats and the City'),
        sq(Q.sibling,  'Mittens'),
        sq(Q.street,   'Scratch Crescent'),
      ],
    }),
    User.create({
      name: 'Pawl McCartney', email: 'pawl@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.nickname, 'Biscuit Bandit'),
        sq(Q.maiden,   'Chewberry'),
        sq(Q.born,     'Barkalore'),
      ],
    }),

    // ── Dogs ──────────────────────────────────────────────────────────────
    User.create({
      name: 'Bark Twain', email: 'bark@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.pet,      'Chewbacca Jr.'),
        sq(Q.school,   'Howl Hall'),
        sq(Q.street,   'Sniff Street'),
      ],
    }),
    User.create({
      name: 'Sherlock Bones', email: 'sherlock@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.movie,    'The Hound of the Baskervilles'),
        sq(Q.sibling,  'Watson'),
        sq(Q.nickname, 'Detectipaws'),
      ],
    }),
    User.create({
      name: 'Woofgang', email: 'woofgang@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.born,     'Tailchester'),
        sq(Q.maiden,   'Bonewell'),
        sq(Q.pet,      'Rex with a Remix'),
      ],
    }),
    User.create({
      name: 'Tails Swift', email: 'tails@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.street,   'Leash Lane'),
        sq(Q.movie,    'Furrest Gump'),
        sq(Q.school,   'Pawsworth High'),
      ],
    }),
    User.create({
      name: 'Ruffalo', email: 'ruffalo@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.sibling,  'Woofie'),
        sq(Q.nickname, 'Snoutie'),
        sq(Q.born,     'Barkham'),
      ],
    }),

    // ── Birds ─────────────────────────────────────────────────────────────
    User.create({
      name: 'Beakoncé', email: 'beakonce@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.pet,      'Polly Pocket'),
        sq(Q.movie,    'The Little Mermail'),
        sq(Q.street,   'Feather Avenue'),
      ],
    }),
    User.create({
      name: 'Tweetie Pie', email: 'tweetie@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.school,   'Nestlington Primary'),
        sq(Q.maiden,   'Skylar'),
        sq(Q.nickname, 'Chirpster'),
      ],
    }),
    User.create({
      name: 'Feather Locklear', email: 'feather@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.born,     'Cloud City'),
        sq(Q.movie,    'Birds of a Feather'),
        sq(Q.street,   'Perch Parade'),
      ],
    }),

    // ── Fish ──────────────────────────────────────────────────────────────
    User.create({
      name: 'Gill Gates', email: 'gill@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.pet,      'Bubbles the Brave'),
        sq(Q.maiden,   'Coralline'),
        sq(Q.nickname, 'Finfluencer'),
      ],
    }),
    User.create({
      name: 'Fin Diesel', email: 'fin@fairshare.pet', password: '@1FairShare',
      securityQuestions: [
        sq(Q.movie,    'Fast & the Finious'),
        sq(Q.sibling,  'Splash'),
        sq(Q.street,   'Current Court'),
      ],
    }),
  ]);
  console.log('Created 15 users');

  // ─── FRIENDS ──────────────────────────────────────────────────────────────
  await Promise.all([
    User.findByIdAndUpdate(billu._id,    { friends: [meowzart._id, purrito._id, clawdia._id, bark._id, beakonce._id, tweetie._id] }),
    User.findByIdAndUpdate(meowzart._id, { friends: [billu._id, clawdia._id, tweetie._id, feather._id, pawl._id, tails._id] }),
    User.findByIdAndUpdate(purrito._id,  { friends: [billu._id, clawdia._id, pawl._id, ruffalo._id, fin._id, woofgang._id] }),
    User.findByIdAndUpdate(clawdia._id,  { friends: [billu._id, meowzart._id, purrito._id, woofgang._id, ruffalo._id, pawl._id] }),
    User.findByIdAndUpdate(pawl._id,     { friends: [meowzart._id, purrito._id, sherlock._id, tails._id, tweetie._id, fin._id, clawdia._id] }),
    User.findByIdAndUpdate(bark._id,     { friends: [billu._id, clawdia._id, sherlock._id, woofgang._id, gill._id, ruffalo._id] }),
    User.findByIdAndUpdate(sherlock._id, { friends: [bark._id, pawl._id, ruffalo._id, fin._id, tails._id, woofgang._id] }),
    User.findByIdAndUpdate(woofgang._id, { friends: [clawdia._id, bark._id, tails._id, beakonce._id, purrito._id, sherlock._id] }),
    User.findByIdAndUpdate(tails._id,    { friends: [meowzart._id, pawl._id, woofgang._id, beakonce._id, fin._id, sherlock._id] }),
    User.findByIdAndUpdate(ruffalo._id,  { friends: [purrito._id, clawdia._id, sherlock._id, gill._id, fin._id, bark._id] }),
    User.findByIdAndUpdate(beakonce._id, { friends: [billu._id, woofgang._id, tails._id, tweetie._id, feather._id, gill._id] }),
    User.findByIdAndUpdate(tweetie._id,  { friends: [meowzart._id, beakonce._id, feather._id, pawl._id, billu._id, tails._id] }),
    User.findByIdAndUpdate(feather._id,  { friends: [meowzart._id, tweetie._id, beakonce._id, gill._id, tails._id, purrito._id] }),
    User.findByIdAndUpdate(gill._id,     { friends: [bark._id, ruffalo._id, beakonce._id, fin._id, feather._id, sherlock._id] }),
    User.findByIdAndUpdate(fin._id,      { friends: [purrito._id, pawl._id, sherlock._id, ruffalo._id, gill._id, tails._id] }),
  ]);
  console.log('Set up friends');

  // ─── GROUPS ───────────────────────────────────────────────────────────────

  const purrliamentPantry = await Group.create({
    name: 'Purrliament Pantry', category: 'food', createdBy: billu._id,
    members: [
      { user: billu._id,    role: 'admin'  },
      { user: meowzart._id, role: 'member' },
      { user: purrito._id,  role: 'member' },
      { user: clawdia._id,  role: 'member' },
      { user: pawl._id,     role: 'member' },
      { user: tweetie._id,  role: 'member' },
      { user: beakonce._id, role: 'member' },
    ],
  });

  const barkinghamBoardingHouse = await Group.create({
    name: 'Barkingham Boarding House', category: 'house', createdBy: bark._id,
    members: [
      { user: bark._id,     role: 'admin'  },
      { user: sherlock._id, role: 'member' },
      { user: woofgang._id, role: 'member' },
      { user: ruffalo._id,  role: 'member' },
      { user: billu._id,    role: 'member' },
      { user: purrito._id,  role: 'member' },
      { user: clawdia._id,  role: 'member' },
      { user: tails._id,    role: 'member' },
    ],
  });

  const barkSideRoadtrip = await Group.create({
    name: 'The Bark Side Roadtrip', category: 'trip', createdBy: beakonce._id,
    members: [
      { user: billu._id,    role: 'member' },
      { user: meowzart._id, role: 'member' },
      { user: bark._id,     role: 'member' },
      { user: beakonce._id, role: 'admin'  },
      { user: feather._id,  role: 'member' },
      { user: gill._id,     role: 'member' },
      { user: fin._id,      role: 'member' },
    ],
  });

  const featherForecastFestival = await Group.create({
    name: 'Feather Forecast Festival', category: 'event', createdBy: meowzart._id,
    members: [
      { user: meowzart._id, role: 'admin'  },
      { user: pawl._id,     role: 'member' },
      { user: sherlock._id, role: 'member' },
      { user: woofgang._id, role: 'member' },
      { user: tails._id,    role: 'member' },
      { user: beakonce._id, role: 'member' },
      { user: tweetie._id,  role: 'member' },
      { user: feather._id,  role: 'member' },
    ],
  });

  const fintasticClubhouse = await Group.create({
    name: 'Fin-tastic Clubhouse', category: 'other', createdBy: gill._id,
    members: [
      { user: purrito._id,  role: 'member' },
      { user: clawdia._id,  role: 'member' },
      { user: bark._id,     role: 'member' },
      { user: sherlock._id, role: 'member' },
      { user: ruffalo._id,  role: 'member' },
      { user: gill._id,     role: 'admin'  },
      { user: fin._id,      role: 'member' },
      { user: billu._id,    role: 'member' },
      { user: tails._id,    role: 'member' },
    ],
  });

  // ── New group 6 ───────────────────────────────────────────────────────────
  const pawlidayGoa = await Group.create({
    name: 'Paw-liday Goa', category: 'trip', createdBy: sherlock._id,
    members: [
      { user: sherlock._id, role: 'admin'  },
      { user: tails._id,    role: 'member' },
      { user: ruffalo._id,  role: 'member' },
      { user: pawl._id,     role: 'member' },
      { user: feather._id,  role: 'member' },
      { user: tweetie._id,  role: 'member' },
      { user: clawdia._id,  role: 'member' },
    ],
  });

  // ── New group 7 ───────────────────────────────────────────────────────────
  const meowvelousMarket = await Group.create({
    name: 'The Meow-velous Market', category: 'food', createdBy: clawdia._id,
    members: [
      { user: clawdia._id,  role: 'admin'  },
      { user: purrito._id,  role: 'member' },
      { user: pawl._id,     role: 'member' },
      { user: meowzart._id, role: 'member' },
      { user: woofgang._id, role: 'member' },
      { user: tails._id,    role: 'member' },
      { user: beakonce._id, role: 'member' },
    ],
  });

  console.log('Created 7 groups');

  // ─── EXPENSES ─────────────────────────────────────────────────────────────

  // ══ PURRLIAMENT PANTRY (food group — cats + birds) ════════════════════════
  await Expense.insertMany([
    {
      // billu pays — heavy spender — equal split among 4 cats
      group: purrliamentPantry._id,
      description: 'Miso Meowth soup tasting',
      amount: 252000, category: 'food', paidBy: billu._id, splitType: 'equal',
      splits: [
        { user: billu._id, amount: 63000 }, { user: meowzart._id, amount: 63000 },
        { user: purrito._id, amount: 63000 }, { user: clawdia._id, amount: 63000 },
      ],
      createdBy: billu._id, date: new Date('2025-11-03'),
    },
    {
      // meowzart pays — exact split, billu eats the most
      group: purrliamentPantry._id,
      description: 'Purrito platter night',
      amount: 216000, category: 'food', paidBy: meowzart._id, splitType: 'exact',
      splits: [
        { user: billu._id, amount: 60000 }, { user: meowzart._id, amount: 54000 },
        { user: purrito._id, amount: 48000 }, { user: clawdia._id, amount: 54000 },
      ],
      createdBy: meowzart._id, date: new Date('2025-12-14'),
    },
    {
      // billu pays — percentage split, billu has VIP portion
      group: purrliamentPantry._id,
      description: 'Catnip curry caravan',
      amount: 360000, category: 'food', paidBy: billu._id, splitType: 'percentage',
      splits: [
        { user: billu._id, amount: 144000, percentage: 40 },
        { user: meowzart._id, amount: 108000, percentage: 30 },
        { user: purrito._id, amount: 72000, percentage: 20 },
        { user: clawdia._id, amount: 36000, percentage: 10 },
      ],
      createdBy: billu._id, date: new Date('2026-01-18'),
    },
    {
      // purrito pays — share split
      group: purrliamentPantry._id,
      description: 'Whisker wok dessert dash',
      amount: 280000, category: 'food', paidBy: purrito._id, splitType: 'share',
      splits: [
        { user: billu._id, amount: 112000, shares: 4 }, { user: meowzart._id, amount: 84000, shares: 3 },
        { user: purrito._id, amount: 56000, shares: 2 }, { user: clawdia._id, amount: 28000, shares: 1 },
      ],
      createdBy: purrito._id, date: new Date('2026-03-05'),
    },
    {
      // pawl pays — all 7 members, equal (pawl being balanced)
      // 196000 / 7 = 28000 each
      group: purrliamentPantry._id,
      description: "Pawl's pancake parade",
      amount: 196000, category: 'food', paidBy: pawl._id, splitType: 'equal',
      splits: [
        { user: billu._id, amount: 28000 }, { user: meowzart._id, amount: 28000 },
        { user: purrito._id, amount: 28000 }, { user: clawdia._id, amount: 28000 },
        { user: pawl._id, amount: 28000 }, { user: tweetie._id, amount: 28000 },
        { user: beakonce._id, amount: 28000 },
      ],
      createdBy: pawl._id, date: new Date('2026-02-22'),
    },
    {
      // tweetie pays — share split, billu eats 3x as much
      // 270000 / 10 shares = 27000 per share
      group: purrliamentPantry._id,
      description: "Tweetie's tuna toast tower",
      amount: 270000, category: 'food', paidBy: tweetie._id, splitType: 'share',
      splits: [
        { user: billu._id, amount: 81000, shares: 3 }, { user: clawdia._id, amount: 54000, shares: 2 },
        { user: tweetie._id, amount: 54000, shares: 2 }, { user: beakonce._id, amount: 54000, shares: 2 },
        { user: pawl._id, amount: 27000, shares: 1 },
      ],
      createdBy: tweetie._id, date: new Date('2026-04-11'),
    },
  ]);

  // ══ BARKINGHAM BOARDING HOUSE (house group — dogs + cats) ═════════════════
  // FIX: expense category was 'house' → must be 'other'
  await Expense.insertMany([
    {
      group: barkinghamBoardingHouse._id,
      description: 'Barkingham rent pawment',
      amount: 480000, category: 'other', paidBy: bark._id, splitType: 'equal',
      splits: [
        { user: bark._id, amount: 120000 }, { user: sherlock._id, amount: 120000 },
        { user: woofgang._id, amount: 120000 }, { user: ruffalo._id, amount: 120000 },
      ],
      createdBy: bark._id, date: new Date('2025-11-22'),
    },
    {
      group: barkinghamBoardingHouse._id,
      description: 'Scratch-post repairs',
      amount: 180000, category: 'other', paidBy: sherlock._id, splitType: 'exact',
      splits: [
        { user: bark._id, amount: 70000 }, { user: sherlock._id, amount: 50000 },
        { user: woofgang._id, amount: 30000 }, { user: ruffalo._id, amount: 30000 },
      ],
      createdBy: sherlock._id, date: new Date('2026-01-07'),
    },
    {
      // clawdia pays for the house (non-dog paying is realistic)
      group: barkinghamBoardingHouse._id,
      description: 'Cushion fur-niture fund',
      amount: 300000, category: 'shopping', paidBy: clawdia._id, splitType: 'percentage',
      splits: [
        { user: bark._id, amount: 105000, percentage: 35 },
        { user: sherlock._id, amount: 75000, percentage: 25 },
        { user: woofgang._id, amount: 60000, percentage: 20 },
        { user: ruffalo._id, amount: 60000, percentage: 20 },
      ],
      createdBy: clawdia._id, date: new Date('2026-02-16'),
    },
    {
      group: barkinghamBoardingHouse._id,
      description: 'Lint roller league',
      amount: 240000, category: 'other', paidBy: bark._id, splitType: 'share',
      splits: [
        { user: bark._id, amount: 90000, shares: 3 }, { user: sherlock._id, amount: 60000, shares: 2 },
        { user: woofgang._id, amount: 60000, shares: 2 }, { user: ruffalo._id, amount: 30000, shares: 1 },
      ],
      createdBy: bark._id, date: new Date('2026-04-09'),
    },
    {
      // purrito pays — balanced persona
      group: barkinghamBoardingHouse._id,
      description: 'Paw-ternity leave sofa fund',
      amount: 320000, category: 'other', paidBy: purrito._id, splitType: 'percentage',
      splits: [
        { user: bark._id, amount: 96000, percentage: 30 },
        { user: billu._id, amount: 80000, percentage: 25 },
        { user: purrito._id, amount: 80000, percentage: 25 },
        { user: clawdia._id, amount: 64000, percentage: 20 },
      ],
      createdBy: purrito._id, date: new Date('2026-03-18'),
    },
    {
      // tails pays — 8-way equal split for heating
      // 210000 / 8 = 26250 each
      group: barkinghamBoardingHouse._id,
      description: 'Midnight fur-oil heating bill',
      amount: 210000, category: 'other', paidBy: tails._id, splitType: 'equal',
      splits: [
        { user: bark._id, amount: 26250 }, { user: sherlock._id, amount: 26250 },
        { user: woofgang._id, amount: 26250 }, { user: ruffalo._id, amount: 26250 },
        { user: billu._id, amount: 26250 }, { user: purrito._id, amount: 26250 },
        { user: clawdia._id, amount: 26250 }, { user: tails._id, amount: 26250 },
      ],
      createdBy: tails._id, date: new Date('2026-04-25'),
    },
  ]);

  // ══ THE BARK SIDE ROADTRIP (trip group — mixed) ═══════════════════════════
  // FIX: expense category was 'trip' → must be 'travel'
  await Expense.insertMany([
    {
      group: barkSideRoadtrip._id,
      description: 'Tailgate express tickets',
      amount: 420000, category: 'travel', paidBy: bark._id, splitType: 'equal',
      splits: [
        { user: billu._id, amount: 105000 }, { user: meowzart._id, amount: 105000 },
        { user: bark._id, amount: 105000 }, { user: beakonce._id, amount: 105000 },
      ],
      createdBy: bark._id, date: new Date('2025-12-05'),
    },
    {
      // billu is a spender — takes 50% of the bill
      group: barkSideRoadtrip._id,
      description: 'Barkside boarding passes',
      amount: 560000, category: 'hotel', paidBy: beakonce._id, splitType: 'percentage',
      splits: [
        { user: billu._id, amount: 280000, percentage: 50 },
        { user: meowzart._id, amount: 112000, percentage: 20 },
        { user: bark._id, amount: 112000, percentage: 20 },
        { user: beakonce._id, amount: 56000, percentage: 10 },
      ],
      createdBy: beakonce._id, date: new Date('2026-01-25'),
    },
    {
      group: barkSideRoadtrip._id,
      description: 'Nap-stop noodle station',
      amount: 195000, category: 'food', paidBy: fin._id, splitType: 'exact',
      splits: [
        { user: bark._id, amount: 70000 }, { user: beakonce._id, amount: 65000 },
        { user: fin._id, amount: 60000 },
      ],
      createdBy: fin._id, date: new Date('2026-03-14'),
    },
    {
      group: barkSideRoadtrip._id,
      description: 'Paw-sport photo fees',
      amount: 350000, category: 'entertainment', paidBy: billu._id, splitType: 'share',
      splits: [
        { user: billu._id, amount: 140000, shares: 4 }, { user: bark._id, amount: 105000, shares: 3 },
        { user: beakonce._id, amount: 70000, shares: 2 }, { user: fin._id, amount: 35000, shares: 1 },
      ],
      createdBy: billu._id, date: new Date('2026-04-20'),
    },
    {
      // feather, gill, fin join — all 7 members on flight upgrade
      // 490000 / 7 = 70000 each
      group: barkSideRoadtrip._id,
      description: 'Flap-flap flight upgrade',
      amount: 490000, category: 'travel', paidBy: feather._id, splitType: 'equal',
      splits: [
        { user: billu._id, amount: 70000 }, { user: meowzart._id, amount: 70000 },
        { user: bark._id, amount: 70000 }, { user: beakonce._id, amount: 70000 },
        { user: feather._id, amount: 70000 }, { user: gill._id, amount: 70000 },
        { user: fin._id, amount: 70000 },
      ],
      createdBy: feather._id, date: new Date('2026-02-12'),
    },
    {
      // poolside lunch with aquatic crew
      group: barkSideRoadtrip._id,
      description: 'Poolside pawcation lunch',
      amount: 315000, category: 'food', paidBy: gill._id, splitType: 'exact',
      splits: [
        { user: feather._id, amount: 90000 }, { user: gill._id, amount: 85000 },
        { user: fin._id, amount: 80000 }, { user: bark._id, amount: 60000 },
      ],
      createdBy: gill._id, date: new Date('2026-03-28'),
    },
  ]);

  // ══ FEATHER FORECAST FESTIVAL (event group — birds + dogs) ════════════════
  // FIX: expense category was 'event' → must be 'entertainment'
  await Expense.insertMany([
    {
      group: featherForecastFestival._id,
      description: 'Tweet & greet ticketing',
      amount: 240000, category: 'entertainment', paidBy: beakonce._id, splitType: 'equal',
      splits: [
        { user: meowzart._id, amount: 60000 }, { user: pawl._id, amount: 60000 },
        { user: sherlock._id, amount: 60000 }, { user: woofgang._id, amount: 60000 },
      ],
      createdBy: beakonce._id, date: new Date('2025-11-18'),
    },
    {
      group: featherForecastFestival._id,
      description: 'Feather forecast fair lights',
      amount: 310000, category: 'entertainment', paidBy: meowzart._id, splitType: 'exact',
      splits: [
        { user: meowzart._id, amount: 95000 }, { user: pawl._id, amount: 80000 },
        { user: sherlock._id, amount: 70000 }, { user: beakonce._id, amount: 65000 },
      ],
      createdBy: meowzart._id, date: new Date('2026-01-30'),
    },
    {
      group: featherForecastFestival._id,
      description: 'Beak-end gala garlands',
      amount: 460000, category: 'shopping', paidBy: tweetie._id, splitType: 'percentage',
      splits: [
        { user: beakonce._id, amount: 138000, percentage: 30 },
        { user: pawl._id, amount: 138000, percentage: 30 },
        { user: sherlock._id, amount: 115000, percentage: 25 },
        { user: tweetie._id, amount: 69000, percentage: 15 },
      ],
      createdBy: tweetie._id, date: new Date('2026-03-22'),
    },
    {
      // 525000 / 15 shares = 35000 per share
      group: featherForecastFestival._id,
      description: 'Paws and applause stage rental',
      amount: 525000, category: 'entertainment', paidBy: beakonce._id, splitType: 'share',
      splits: [
        { user: beakonce._id, amount: 175000, shares: 5 }, { user: meowzart._id, amount: 140000, shares: 4 },
        { user: pawl._id, amount: 105000, shares: 3 }, { user: tails._id, amount: 105000, shares: 3 },
      ],
      createdBy: beakonce._id, date: new Date('2026-04-27'),
    },
    {
      // woofgang pays — share split including feather and tweetie
      // 240000 / 10 shares = 24000 per share
      group: featherForecastFestival._id,
      description: "Coo-stume contest fabric",
      amount: 240000, category: 'shopping', paidBy: woofgang._id, splitType: 'share',
      splits: [
        { user: woofgang._id, amount: 96000, shares: 4 }, { user: tails._id, amount: 72000, shares: 3 },
        { user: feather._id, amount: 48000, shares: 2 }, { user: tweetie._id, amount: 24000, shares: 1 },
      ],
      createdBy: woofgang._id, date: new Date('2026-02-08'),
    },
    {
      // feather pays — equal split, workshop day
      // 150000 / 5 = 30000 each
      group: featherForecastFestival._id,
      description: 'Wing-span workshop supplies',
      amount: 150000, category: 'other', paidBy: feather._id, splitType: 'equal',
      splits: [
        { user: pawl._id, amount: 30000 }, { user: sherlock._id, amount: 30000 },
        { user: woofgang._id, amount: 30000 }, { user: tails._id, amount: 30000 },
        { user: feather._id, amount: 30000 },
      ],
      createdBy: feather._id, date: new Date('2026-04-14'),
    },
  ]);

  // ══ FIN-TASTIC CLUBHOUSE (misc — fish + dogs + cats) ═════════════════════
  await Expense.insertMany([
    {
      group: fintasticClubhouse._id,
      description: 'Tank you very much filters',
      amount: 150000, category: 'other', paidBy: gill._id, splitType: 'equal',
      splits: [
        { user: gill._id, amount: 50000 }, { user: fin._id, amount: 50000 },
        { user: ruffalo._id, amount: 50000 },
      ],
      createdBy: gill._id, date: new Date('2025-12-28'),
    },
    {
      group: fintasticClubhouse._id,
      description: 'Gill-ty pleasure toy haul',
      amount: 210000, category: 'other', paidBy: fin._id, splitType: 'exact',
      splits: [
        { user: purrito._id, amount: 90000 }, { user: gill._id, amount: 50000 },
        { user: ruffalo._id, amount: 40000 }, { user: fin._id, amount: 30000 },
      ],
      createdBy: fin._id, date: new Date('2026-02-08'),
    },
    {
      group: fintasticClubhouse._id,
      description: 'Fin-ish line cleanup kit',
      amount: 280000, category: 'other', paidBy: gill._id, splitType: 'percentage',
      splits: [
        { user: gill._id, amount: 112000, percentage: 40 },
        { user: fin._id, amount: 84000, percentage: 30 },
        { user: billu._id, amount: 56000, percentage: 20 },
        { user: tails._id, amount: 28000, percentage: 10 },
      ],
      createdBy: gill._id, date: new Date('2026-03-29'),
    },
    {
      // 360000 / 10 shares = 36000 per share
      group: fintasticClubhouse._id,
      description: 'Bubble economics seminar',
      amount: 360000, category: 'other', paidBy: ruffalo._id, splitType: 'share',
      splits: [
        { user: ruffalo._id, amount: 144000, shares: 4 }, { user: gill._id, amount: 108000, shares: 3 },
        { user: fin._id, amount: 72000, shares: 2 }, { user: tails._id, amount: 36000, shares: 1 },
      ],
      createdBy: ruffalo._id, date: new Date('2026-04-18'),
    },
    {
      // bark pays — bark + sherlock + purrito + clawdia deep-dive
      group: fintasticClubhouse._id,
      description: 'Current affairs deep-dive kit',
      amount: 280000, category: 'other', paidBy: bark._id, splitType: 'percentage',
      splits: [
        { user: bark._id, amount: 98000, percentage: 35 },
        { user: sherlock._id, amount: 70000, percentage: 25 },
        { user: purrito._id, amount: 70000, percentage: 25 },
        { user: clawdia._id, amount: 42000, percentage: 15 },
      ],
      createdBy: bark._id, date: new Date('2026-01-15'),
    },
    {
      // sherlock pays — exact split
      group: fintasticClubhouse._id,
      description: 'Coral coworking desk rental',
      amount: 360000, category: 'other', paidBy: sherlock._id, splitType: 'exact',
      splits: [
        { user: gill._id, amount: 120000 }, { user: fin._id, amount: 90000 },
        { user: ruffalo._id, amount: 80000 }, { user: billu._id, amount: 70000 },
      ],
      createdBy: sherlock._id, date: new Date('2026-04-02'),
    },
  ]);

  // ══ PAW-LIDAY GOA (trip — dogs + birds + cats) ════════════════════════════
  await Expense.insertMany([
    {
      // sherlock pays — all 7 equal
      // 350000 / 7 = 50000 each
      group: pawlidayGoa._id,
      description: 'Goa-ing places train tickets',
      amount: 350000, category: 'travel', paidBy: sherlock._id, splitType: 'equal',
      splits: [
        { user: sherlock._id, amount: 50000 }, { user: tails._id, amount: 50000 },
        { user: ruffalo._id, amount: 50000 }, { user: pawl._id, amount: 50000 },
        { user: feather._id, amount: 50000 }, { user: tweetie._id, amount: 50000 },
        { user: clawdia._id, amount: 50000 },
      ],
      createdBy: sherlock._id, date: new Date('2025-12-20'),
    },
    {
      // clawdia pays hotel — percentage split
      group: pawlidayGoa._id,
      description: 'Sandy paws resort booking',
      amount: 560000, category: 'hotel', paidBy: clawdia._id, splitType: 'percentage',
      splits: [
        { user: sherlock._id, amount: 112000, percentage: 20 },
        { user: tails._id, amount: 112000, percentage: 20 },
        { user: ruffalo._id, amount: 112000, percentage: 20 },
        { user: pawl._id, amount: 84000, percentage: 15 },
        { user: feather._id, amount: 56000, percentage: 10 },
        { user: tweetie._id, amount: 56000, percentage: 10 },
        { user: clawdia._id, amount: 28000, percentage: 5 },
      ],
      createdBy: clawdia._id, date: new Date('2025-12-21'),
    },
    {
      // tails pays — equal bar tab, all 7
      // 196000 / 7 = 28000 each
      group: pawlidayGoa._id,
      description: 'Coconut milk meow-tai bar tab',
      amount: 196000, category: 'food', paidBy: tails._id, splitType: 'equal',
      splits: [
        { user: sherlock._id, amount: 28000 }, { user: tails._id, amount: 28000 },
        { user: ruffalo._id, amount: 28000 }, { user: pawl._id, amount: 28000 },
        { user: feather._id, amount: 28000 }, { user: tweetie._id, amount: 28000 },
        { user: clawdia._id, amount: 28000 },
      ],
      createdBy: tails._id, date: new Date('2025-12-22'),
    },
    {
      // ruffalo pays — share split for sunscreen
      // 126000 / 10 shares = 12600 per share
      group: pawlidayGoa._id,
      description: 'Sunscreen for sunburnt snouts',
      amount: 126000, category: 'shopping', paidBy: ruffalo._id, splitType: 'share',
      splits: [
        { user: sherlock._id, amount: 37800, shares: 3 }, { user: tails._id, amount: 25200, shares: 2 },
        { user: ruffalo._id, amount: 25200, shares: 2 }, { user: clawdia._id, amount: 12600, shares: 1 },
        { user: feather._id, amount: 12600, shares: 1 }, { user: pawl._id, amount: 12600, shares: 1 },
      ],
      createdBy: ruffalo._id, date: new Date('2025-12-23'),
    },
  ]);

  // ══ THE MEOW-VELOUS MARKET (food — cats + dog + bird) ════════════════════
  await Expense.insertMany([
    {
      // clawdia pays — all 7 equal
      // 245000 / 7 = 35000 each
      group: meowvelousMarket._id,
      description: 'Fancy fur food haul',
      amount: 245000, category: 'food', paidBy: clawdia._id, splitType: 'equal',
      splits: [
        { user: clawdia._id, amount: 35000 }, { user: purrito._id, amount: 35000 },
        { user: pawl._id, amount: 35000 }, { user: meowzart._id, amount: 35000 },
        { user: woofgang._id, amount: 35000 }, { user: tails._id, amount: 35000 },
        { user: beakonce._id, amount: 35000 },
      ],
      createdBy: clawdia._id, date: new Date('2026-01-10'),
    },
    {
      // meowzart pays — percentage, meowzart is the big eater
      group: meowvelousMarket._id,
      description: 'Truffle sniff tasting session',
      amount: 480000, category: 'food', paidBy: meowzart._id, splitType: 'percentage',
      splits: [
        { user: meowzart._id, amount: 144000, percentage: 30 },
        { user: clawdia._id, amount: 120000, percentage: 25 },
        { user: purrito._id, amount: 96000, percentage: 20 },
        { user: woofgang._id, amount: 72000, percentage: 15 },
        { user: tails._id, amount: 48000, percentage: 10 },
      ],
      createdBy: meowzart._id, date: new Date('2026-02-19'),
    },
    {
      // woofgang pays — exact split for pasta night
      group: meowvelousMarket._id,
      description: 'Paw-sta and cheese night',
      amount: 336000, category: 'food', paidBy: woofgang._id, splitType: 'exact',
      splits: [
        { user: clawdia._id, amount: 84000 }, { user: purrito._id, amount: 70000 },
        { user: pawl._id, amount: 56000 }, { user: meowzart._id, amount: 56000 },
        { user: woofgang._id, amount: 42000 }, { user: tails._id, amount: 28000 },
      ],
      createdBy: woofgang._id, date: new Date('2026-03-16'),
    },
    {
      // beakonce pays — share split, clawdia takes home the most
      // 280000 / 10 shares = 28000 per share
      group: meowvelousMarket._id,
      description: 'Market day munchies madness',
      amount: 280000, category: 'food', paidBy: beakonce._id, splitType: 'share',
      splits: [
        { user: clawdia._id, amount: 112000, shares: 4 }, { user: meowzart._id, amount: 84000, shares: 3 },
        { user: purrito._id, amount: 56000, shares: 2 }, { user: beakonce._id, amount: 28000, shares: 1 },
      ],
      createdBy: beakonce._id, date: new Date('2026-04-06'),
    },
  ]);

  console.log('Created 38 expenses');

  // ─── SETTLEMENTS ──────────────────────────────────────────────────────────
  await Settlement.insertMany([

    // ── Purrliament Pantry ─────────────────────────────────────────────────
    { group: purrliamentPantry._id, paidBy: meowzart._id, paidTo: billu._id,   amount: 54000,  note: 'Catnip cash-up',           date: new Date('2025-12-20') },
    { group: purrliamentPantry._id, paidBy: purrito._id,  paidTo: billu._id,   amount: 72000,  note: 'Purrito pocket truce',      date: new Date('2026-03-10') },
    { group: purrliamentPantry._id, paidBy: clawdia._id,  paidTo: billu._id,   amount: 63000,  note: 'Claw-back coins',           date: new Date('2026-02-01') },
    { group: purrliamentPantry._id, paidBy: beakonce._id, paidTo: tweetie._id, amount: 54000,  note: 'Beak-settle with tweet',    date: new Date('2026-04-15') },

    // ── Barkingham Boarding House ──────────────────────────────────────────
    { group: barkinghamBoardingHouse._id, paidBy: sherlock._id, paidTo: bark._id,  amount: 95000,  note: 'Hound harmony transfer', date: new Date('2026-01-12') },
    { group: barkinghamBoardingHouse._id, paidBy: woofgang._id, paidTo: bark._id,  amount: 65000,  note: 'Bone fide settlement',   date: new Date('2026-04-12') },
    { group: barkinghamBoardingHouse._id, paidBy: ruffalo._id,  paidTo: bark._id,  amount: 80000,  note: 'Rough-and-settled',      date: new Date('2026-02-22') },
    { group: barkinghamBoardingHouse._id, paidBy: clawdia._id,  paidTo: tails._id, amount: 26250,  note: 'Heating bill handled',   date: new Date('2026-04-28') },

    // ── The Bark Side Roadtrip ─────────────────────────────────────────────
    { group: barkSideRoadtrip._id, paidBy: fin._id,      paidTo: beakonce._id, amount: 110000, note: 'Fin-ished via fish pay',    date: new Date('2026-03-18') },
    { group: barkSideRoadtrip._id, paidBy: meowzart._id, paidTo: beakonce._id, amount: 112000, note: 'Meow-tual settlement',      date: new Date('2026-02-08') },
    { group: barkSideRoadtrip._id, paidBy: billu._id,    paidTo: feather._id,  amount: 70000,  note: 'Billu clears flight debt',  date: new Date('2026-02-20') },

    // ── Feather Forecast Festival ──────────────────────────────────────────
    { group: featherForecastFestival._id, paidBy: pawl._id,     paidTo: beakonce._id, amount: 78000, note: 'Perch-perfect payout',   date: new Date('2026-02-04') },
    { group: featherForecastFestival._id, paidBy: tails._id,    paidTo: tweetie._id,  amount: 50000, note: 'Tailspin tidying',        date: new Date('2026-04-30') },
    { group: featherForecastFestival._id, paidBy: sherlock._id, paidTo: meowzart._id, amount: 60000, note: 'Case closed payment',     date: new Date('2026-03-28') },
    { group: featherForecastFestival._id, paidBy: woofgang._id, paidTo: tweetie._id,  amount: 24000, note: 'Woof warrant cleared',    date: new Date('2026-04-29') },

    // ── Fin-tastic Clubhouse ───────────────────────────────────────────────
    { group: fintasticClubhouse._id, paidBy: ruffalo._id, paidTo: gill._id,     amount: 70000,  note: 'Ripple effect repayment',   date: new Date('2026-03-31') },
    { group: fintasticClubhouse._id, paidBy: fin._id,     paidTo: sherlock._id, amount: 90000,  note: 'Fin-ally square',           date: new Date('2026-04-19') },
    { group: fintasticClubhouse._id, paidBy: purrito._id, paidTo: gill._id,     amount: 70000,  note: 'Purr-fect payment',         date: new Date('2026-04-12') },

    // ── Paw-liday Goa ──────────────────────────────────────────────────────
    { group: pawlidayGoa._id, paidBy: tweetie._id, paidTo: sherlock._id, amount: 50000, note: 'Tweet receipt settled',   date: new Date('2026-01-08') },
    { group: pawlidayGoa._id, paidBy: pawl._id,    paidTo: clawdia._id,  amount: 84000, note: 'Pawl clears hotel share', date: new Date('2026-01-09') },
    { group: pawlidayGoa._id, paidBy: feather._id, paidTo: clawdia._id,  amount: 56000, note: 'Feather settles resort',  date: new Date('2026-01-10') },

    // ── The Meow-velous Market ─────────────────────────────────────────────
    { group: meowvelousMarket._id, paidBy: tails._id,  paidTo: clawdia._id,  amount: 35000, note: 'Tail-end tally',         date: new Date('2026-04-08') },
    { group: meowvelousMarket._id, paidBy: purrito._id, paidTo: meowzart._id, amount: 96000, note: 'Purrito clears truffle', date: new Date('2026-03-01') },
    { group: meowvelousMarket._id, paidBy: tails._id,  paidTo: woofgang._id, amount: 28000, note: 'Pasta paid at last',     date: new Date('2026-04-10') },

  ]);

  console.log('Created 23 settlements');

  console.log('\n✅ Seed complete!');
  console.log('\nAll 15 accounts — password: @1FairShare');
  console.log('  Cats:  billu@fairshare.pet  meowzart@fairshare.pet  purrito@fairshare.pet  clawdia@fairshare.pet  pawl@fairshare.pet');
  console.log('  Dogs:  bark@fairshare.pet   sherlock@fairshare.pet  woofgang@fairshare.pet tails@fairshare.pet    ruffalo@fairshare.pet');
  console.log('  Birds: beakonce@fairshare.pet  tweetie@fairshare.pet  feather@fairshare.pet');
  console.log('  Fish:  gill@fairshare.pet   fin@fairshare.pet');
  console.log('\n7 groups — Purrliament Pantry · Barkingham Boarding House · The Bark Side Roadtrip · Feather Forecast Festival · Fin-tastic Clubhouse · Paw-liday Goa · The Meow-velous Market');
  console.log('38 expenses · 23 settlements · spread Nov 2025 → Apr 2026');

  await mongoose.connection.close();
};

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.connection.close();
  process.exit(1);
});
