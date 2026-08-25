import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SCHEMA } from './schema';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'wald.db');

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db: DatabaseType = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema — split on statement boundaries and execute each
const statements = SCHEMA.split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  db.prepare(stmt).run();
}

// ─────────────────────────────────────────────
//  Seed data
// ─────────────────────────────────────────────

function isEmpty(table: string): boolean {
  const row = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as { cnt: number };
  return row.cnt === 0;
}

function seedTerritories(): void {
  if (!isEmpty('territories')) return;

  const insertTerritory = db.prepare(`
    INSERT INTO territories (id, name, zone, seek_question, tech_tool, pipeline, tagline, land_type, real_estate_status)
    VALUES (@id, @name, @zone, @seek_question, @tech_tool, @pipeline, @tagline, @land_type, @real_estate_status)
  `);

  const insertCard = db.prepare(`
    INSERT INTO epistemic_cards (id, territory_id, position, claim, evidence, possible_worlds_note, challenge_question, required_action, waldconsistency_precheck, created_by, status)
    VALUES (@id, @territory_id, @position, @claim, @evidence, @possible_worlds_note, @challenge_question, @required_action, @waldconsistency_precheck, @created_by, @status)
  `);

  const territories = [
    {
      id: uuidv4(),
      name: 'Busyness Park',
      zone: 'arrivals_departures',
      seek_question: 'What is work worth?',
      tech_tool: 'Labour Market Simulator',
      pipeline: JSON.stringify(['observe', 'analyse', 'propose']),
      tagline: 'Work, value, and the future of employment',
      land_type: 'landscape',
      real_estate_status: 'active',
    },
    {
      id: uuidv4(),
      name: 'Parentown',
      zone: 'civic_centre',
      seek_question: 'What do we owe the next generation?',
      tech_tool: 'Family Systems Mapper',
      pipeline: JSON.stringify(['listen', 'understand', 'act']),
      tagline: 'Raising humans, not consumers',
      land_type: 'landscape',
      real_estate_status: 'active',
    },
    {
      id: uuidv4(),
      name: 'Space Agency',
      zone: 'science_fair',
      seek_question: 'How far should humanity reach?',
      tech_tool: 'Planetary Futures Calculator',
      pipeline: JSON.stringify(['imagine', 'model', 'commit']),
      tagline: 'Planetary futures and the ethics of scale',
      land_type: 'landscape',
      real_estate_status: 'active',
    },
    {
      id: uuidv4(),
      name: 'Bond Street',
      zone: 'arrivals_departures',
      seek_question: 'What gives something value?',
      tech_tool: 'Value Exchange Modeller',
      pipeline: JSON.stringify(['trace', 'question', 'renegotiate']),
      tagline: 'Wealth, exchange, and the price of things',
      land_type: 'landscape',
      real_estate_status: 'active',
    },
    {
      id: uuidv4(),
      name: 'Assembly',
      zone: 'civic_centre',
      seek_question: 'How do we reason together?',
      tech_tool: 'Deliberation Engine',
      pipeline: JSON.stringify(['speak', 'listen', 'decide']),
      tagline: 'The space of reasons',
      land_type: 'landscape',
      real_estate_status: 'active',
    },
    {
      id: uuidv4(),
      name: 'Studio City',
      zone: 'commonwealth',
      seek_question: 'Who owns what we make together?',
      tech_tool: 'Authorship Auditor',
      pipeline: JSON.stringify(['create', 'attribute', 'share']),
      tagline: 'Creativity, authorship, and the politics of making',
      land_type: 'landscape',
      real_estate_status: 'active',
    },
  ];

  // Seed each territory and its cards
  const seedAll = db.transaction(() => {
    for (const territory of territories) {
      insertTerritory.run(territory);
    }

    // Busyness Park cards
    const bp = territories[0];
    insertCard.run({
      id: uuidv4(),
      territory_id: bp.id,
      position: 1,
      claim: 'Automation will eliminate more jobs than it creates within the next two decades.',
      evidence: JSON.stringify([{ source: 'McKinsey Global Institute', url: '#', credibility_score: 85 }]),
      possible_worlds_note: 'In worlds where human creativity is valued as a commodity, this may be false.',
      challenge_question: 'Name one category of work that automation cannot meaningfully perform.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Interview someone whose job has changed due to automation and document what changed.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: bp.id,
      position: 2,
      claim: 'A universal basic income is a prerequisite for a humane post-work economy.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In worlds where work is constitutive of identity, UBI alone may be insufficient.',
      challenge_question: 'What social structures would UBI need to preserve in order to be sufficient?',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Read one peer-reviewed paper on UBI pilot outcomes and summarise the key finding.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: bp.id,
      position: 3,
      claim: 'The gig economy redistributes risk from corporations to individuals without redistributing reward.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In a world where gig workers collectively bargain, this relationship could invert.',
      challenge_question: 'Identify a case where gig work genuinely increased a worker\'s autonomy.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Speak to a gig worker and ask them to describe the trade-offs of their arrangement.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });

    // Parentown cards
    const pt = territories[1];
    insertCard.run({
      id: uuidv4(),
      territory_id: pt.id,
      position: 1,
      claim: 'Children\'s development is shaped more by peer relationships than by parental instruction.',
      evidence: JSON.stringify([{ source: 'Judith Rich Harris, The Nurture Assumption', url: '#', credibility_score: 78 }]),
      possible_worlds_note: 'In small, isolated communities, parental influence may dominate.',
      challenge_question: 'Describe a situation where parental values overrode peer influence in your experience.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Observe a group of children interacting without adult guidance and note what norms emerge.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: pt.id,
      position: 2,
      claim: 'Screens are not inherently harmful to children; the content and context of use determine their effect.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In environments where digital literacy is taught alongside screen use, harms are minimised.',
      challenge_question: 'What conditions would need to hold for screen use to be categorically harmful?',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Track your own screen use for one week and assess whether the content shaped your thinking.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: pt.id,
      position: 3,
      claim: 'The nuclear family is a historically recent and culturally specific arrangement, not a natural unit.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In worlds where extended kinship networks persist, the nuclear family is an aberration.',
      challenge_question: 'What functions does the nuclear family perform that other arrangements struggle to replicate?',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Research one non-nuclear family structure from history or another culture and describe how child-rearing was organised.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });

    // Space Agency cards
    const sa = territories[2];
    insertCard.run({
      id: uuidv4(),
      territory_id: sa.id,
      position: 1,
      claim: 'Mars colonisation is a hedge against existential risk, not an escape from terrestrial responsibility.',
      evidence: JSON.stringify([{ source: 'Elon Musk, SpaceX', url: '#', credibility_score: 60 }]),
      possible_worlds_note: 'In worlds where Earth governance fails completely, this framing becomes a self-fulfilling prophecy.',
      challenge_question: 'At what point does planetary backup become abandonment?',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Identify one terrestrial problem that the resources allocated to Mars colonisation could address.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: sa.id,
      position: 2,
      claim: 'Climate change is an epistemic crisis before it is a technological one.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In a world where technology solutions exist but political will is absent, both crises coexist.',
      challenge_question: 'Identify one piece of evidence that would change your position on this claim.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Find and read a scientific paper on climate tipping points and write a one-paragraph summary.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: sa.id,
      position: 3,
      claim: 'The Outer Space Treaty of 1967 is inadequate for governing an era of commercial space exploitation.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In a world with strong multilateral institutions, treaty revision remains possible.',
      challenge_question: 'Draft a single principle that should govern resource extraction in space.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Read the text of the Outer Space Treaty and identify one clause that is ambiguous in the commercial era.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });

    // Bond Street cards
    const bs = territories[3];
    insertCard.run({
      id: uuidv4(),
      territory_id: bs.id,
      position: 1,
      claim: 'Markets are social contracts, not natural phenomena — and they can be renegotiated.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In worlds where markets are treated as laws of nature, renegotiation becomes unthinkable.',
      challenge_question: 'Name one market rule that has been successfully changed in your lifetime.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Research one historical example of a market being deliberately restructured and describe the outcome.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: bs.id,
      position: 2,
      claim: 'Compound interest is a mechanism for concentrating wealth, not creating it.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In worlds with robust wealth redistribution, compound interest effects are dampened.',
      challenge_question: 'Describe a scenario where compound interest genuinely created rather than transferred value.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Calculate the effect of compound interest on a hypothetical £1000 investment over 40 years and compare it to wage growth over the same period.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });

    // Assembly cards
    const asm = territories[4];
    insertCard.run({
      id: uuidv4(),
      territory_id: asm.id,
      position: 1,
      claim: 'A democracy that cannot distinguish between opinion and knowledge will collapse into opinion.',
      evidence: JSON.stringify([{ source: 'Plato, Republic', url: '#', credibility_score: 70 }]),
      possible_worlds_note: 'In worlds with robust epistemic institutions, this collapse can be indefinitely deferred.',
      challenge_question: 'Propose one institutional mechanism for distinguishing knowledge from mere opinion in public deliberation.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Attend or watch a public debate and identify three moments where opinion was presented as fact.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: asm.id,
      position: 2,
      claim: 'Epistemic injustice — the systematic silencing of certain knowers — is a political problem, not merely a social one.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In worlds with strong individual rights but no collective epistemic norms, this injustice persists.',
      challenge_question: 'Name a domain where knowers are systematically discredited and describe the mechanism.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Find one example of testimony being dismissed because of the speaker\'s identity rather than the content and document the case.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: asm.id,
      position: 3,
      claim: 'Good deliberation requires not just free speech, but the cultivation of epistemic virtues.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In a world that prioritises epistemic virtues in education, democratic quality improves measurably.',
      challenge_question: 'What is one epistemic virtue that current democratic culture actively discourages?',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Practise intellectual humility in one conversation this week: genuinely change your view based on new information and record what changed.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });

    // Studio City cards
    const sc = territories[5];
    insertCard.run({
      id: uuidv4(),
      territory_id: sc.id,
      position: 1,
      claim: 'The death of the author is not the liberation of the reader — it is the ascendancy of the algorithm.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In worlds where algorithmic curation is governed democratically, this outcome is not inevitable.',
      challenge_question: 'Describe a reading practice that resists algorithmic mediation.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Read something you discovered through a non-algorithmic means (a friend, a bookshop, a library) and describe the difference in the experience.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
    insertCard.run({
      id: uuidv4(),
      territory_id: sc.id,
      position: 2,
      claim: 'Intellectual property law protects the interests of publishers and platforms, not creators.',
      evidence: JSON.stringify([]),
      possible_worlds_note: 'In worlds with creator-controlled licensing, IP law could serve its stated purpose.',
      challenge_question: 'Propose one reform to copyright law that would genuinely benefit working artists.',
      required_action: JSON.stringify({
        id: uuidv4(),
        description: 'Find out how much a musician earns per stream on a major platform and calculate how many streams they need to match minimum wage for one month.',
        verification: 'self_reported',
        reward: { train_station_unlock: true, citizenship_points: 10 },
      }),
      waldconsistency_precheck: null,
      created_by: 'system',
      status: 'published',
    });
  });

  seedAll();
}

function territoryIdByName(name: string): string | null {
  const row = db.prepare('SELECT id FROM territories WHERE name = @name').get({ name }) as
    | { id: string }
    | undefined;
  return row?.id ?? null;
}

function seedStationResources(): void {
  if (!isEmpty('train_station_resources')) return;

  const insert = db.prepare(`
    INSERT INTO train_station_resources (id, territory_id, title, type, url, waldconsistency_level, description, is_locked)
    VALUES (@id, @territory_id, @title, @type, @url, @waldconsistency_level, @description, @is_locked)
  `);

  const resources = [
    ['Busyness Park', 'The Second Machine Age', 'ebook', 'K', 'Brynjolfsson & McAfee on automation and employment.', 0],
    ['Busyness Park', 'Bullshit Jobs (Graeber)', 'ebook', 'CR', 'A theory of the proliferation of pointless work.', 0],
    ['Busyness Park', '99% Invisible — Future of Work', 'audio', 'S', 'Podcast episode on redesigning labour.', 1],
    ['Assembly', 'Epistemic Injustice (Fricker)', 'ebook', 'CE', 'The foundational text on epistemic injustice.', 0],
    ['Assembly', 'The Enigma of Reason (Mercier & Sperber)', 'ebook', 'L', 'Why humans reason and when they do it well.', 0],
    ['Assembly', 'Philosophy Bites — Deliberative Democracy', 'audio', 'CN', 'Short interview on the theory of deliberative democracy.', 0],
    ['Space Agency', 'The Uninhabitable Earth (Wallace-Wells)', 'ebook', 'CR', 'A detailed account of climate futures.', 0],
    ['Space Agency', 'Lunar — Tim Peake', 'ebook', 'K', 'Astronaut memoir with reflections on planetary scale.', 1],
    ['Parentown', 'The Whole-Brain Child', 'ebook', 'K', 'Neuroscience of child development.', 0],
    ['Bond Street', 'Capital in the 21st Century (Piketty)', 'ebook', 'CR', 'The definitive study of wealth concentration.', 0],
    ['Studio City', 'Ways of Seeing (Berger)', 'video', 'CE', 'BBC series on image and value in art.', 0],
    ['Studio City', 'Steal Like an Artist (Kleon)', 'ebook', 'S', 'On creative influence and authorship.', 0],
  ] as const;

  const seedAll = db.transaction(() => {
    for (const [territoryName, title, type, level, description, isLocked] of resources) {
      const territory_id = territoryIdByName(territoryName);
      if (!territory_id) continue;
      insert.run({
        id: uuidv4(),
        territory_id,
        title,
        type,
        url: '#',
        waldconsistency_level: level,
        description,
        is_locked: isLocked,
      });
    }
  });

  seedAll();
}

function seedFutures(): void {
  if (!isEmpty('possible_worlds_futures')) return;

  const insert = db.prepare(`
    INSERT INTO possible_worlds_futures
      (id, author_id, title, description, territory_id, stakes, currency_value, shares, options, arrow_failure_flag, status)
    VALUES
      (@id, @author_id, @title, @description, @territory_id, @stakes, @currency_value, @shares, @options, @arrow_failure_flag, @status)
  `);

  const futures = [
    {
      title: 'Universal Epistemic Infrastructure',
      description:
        'A world in which every school teaches the Waldconsistency framework as a core literacy, alongside reading, writing, and arithmetic.',
      territoryName: 'Assembly',
      stakes: [{ user_id: null, what_they_risk: 'My belief that institutions can self-reform', magnitude: 80 }],
      currency_value: 80,
      options: [
        { condition: 'If one country adopts epistemic literacy by 2030', action_if_triggered: 'Double currency value' },
      ],
      arrow_failure_flag: 0,
    },
    {
      title: 'Post-Employment Compact',
      description:
        'A social contract in which employment is optional and social contribution is the currency of citizenship.',
      territoryName: 'Busyness Park',
      stakes: [{ user_id: null, what_they_risk: 'My career identity', magnitude: 95 }],
      currency_value: 95,
      options: [],
      arrow_failure_flag: 1,
    },
  ];

  const seedAll = db.transaction(() => {
    for (const f of futures) {
      insert.run({
        id: uuidv4(),
        author_id: null,
        title: f.title,
        description: f.description,
        territory_id: territoryIdByName(f.territoryName),
        stakes: JSON.stringify(f.stakes),
        currency_value: f.currency_value,
        shares: JSON.stringify([]),
        options: JSON.stringify(f.options),
        arrow_failure_flag: f.arrow_failure_flag,
        status: 'open',
      });
    }
  });

  seedAll();
}

// Run seed
try {
  seedTerritories();
  seedStationResources();
  seedFutures();
} catch (err) {
  console.error('Seed error (non-fatal):', err);
}

export default db;
