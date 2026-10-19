const TITLES = [
  'Leadership Development Masterclass',
  'GMP Inspection Advanced Training',
  'Pharmacovigilance Programme',
  'Bioequivalence Workshop',
  'Dossier Assessment Certification Course',
  'Laboratory Quality Fundamentals',
  'Risk-Based Inspection Essentials',
  'Post-Market Surveillance Masterclass',
  'Leadership Development Advanced Training',
  'GMP Inspection Programme',
];

const DESCRIPTIONS = [
  'AI-extracted training record covering leadership & governance topics for national regulatory authority staff.',
  'AI-extracted training record covering quality assurance topics for national regulatory authority staff.',
  'AI-extracted training record covering pharmacovigilance topics for national regulatory authority staff.',
  'AI-extracted training record covering bioavailability / bioequivalence topics for national regulatory authority staff.',
  'AI-extracted training record covering regulatory inspection topics for national regulatory authority staff.',
];

const COMPETENCY_POOL = [
  'Leadership and change management in NRAs',
  'Regulatory and scientific guidelines relevant to assessment of medicines',
  'Competency 6: Leadership and governance',
  'Relationship between stability data and shelf life',
  'Risk-based inspection planning',
  'Competency 1: Regulatory oversight of manufacturing',
  'Case assessment: (a) causality of the adverse event: purpose, criteria and problems of the assessment; and (b) causality of the adverse event: common general and specific assessment methods, outcome ratings and shortcomings',
  'Systems and tools for spontaneous ADR/AEFI reporting',
  'Principles of Good Manufacturing Practice',
  'Strengths and weaknesses of different data mining methods (e.g. vulnerability to low and high numbers)',
  'Competency 7: Other / Not specified',
  'Competency 4: Regulatory science',
  'Role of container closure system in product quality',
];

const ACTIVITY_POOL = [
  'Performing quality review of ICSR',
  'Performing quality assurance of ICSR database: duplicate-, syntax- and coherence-check; tracking facilitation; and follow-up',
  'Validating a signal by checking report quality, duplicates, plausibility, consistency, other information and biases',
  'Review Clinical Trial Applications',
  'Performing data transmission and entry for spontaneous reporting systems: (a) code diseases and ADRs/AEFIs using terminologies from WHO-ART, ICD and MedDRA; (b) code medicines using classifications and dictionaries (Anatomical Therapeutic Chemical code, WHO-Drug Dictionary [enhanced], EudraVigilance Medicinal Product Dictionary); (c) perform quality checks, anonymization, case identifications, lab data tables, narratives and language; and (d) communicate with reporters, confirm receipt, and request additional data as necessary',
  'Performing data retrieval, descriptive statistics, access and confidentiality: (a) electronic techniques of data retrieval: formats, networks, browsers and other tools, and standard generalized markup language; (b) format of retrieval results: line listings, summary tabulations, profiles and sometimes ICSRs; and (c) important accessible databases and terms of access: WHO/Uppsala Monitoring Centre and others',
  'Regulatory Dossier Review',
  'Post-Market Surveillance',
  'Signal Detection & Analysis',
  'Conduct GMP Inspections',
];

const MODES = ['Virtual', 'Classroom On-demand Live Webcast', 'Classroom', 'Blended', 'In-person', 'On-demand', 'Live Webcast Classroom', 'Hybrid', ''];
const LANGUAGES = ['English', 'English, Chinese', 'Portuguese, English', 'English, German, Spanish, Chinese, Portuguese', 'English, Portuguese, Chinese, Spanish', 'Chinese', ''];
const DOMAINS = ['Leadership & Governance', 'Quality Assurance', 'Pharmacovigilance', 'Bioavailability / Bioequivalence', 'Regulatory Inspection', 'Post-market surveillance', 'cGMP', ''];
const SUB_DOMAINS = ['GMP Compliance', 'Signal Management', 'Signal detection', 'Signal validation', 'Risk Management', 'Laboratory QMS', 'ICSRs', ''];
const APPROACHES = ['Course', 'Self-paced online course', 'Workshop', 'Instructor-led live online course', 'Webinar', ''];
const PRODUCT_TYPES = ['Medicines', 'Vaccines', 'Medical Devices', 'Biological Products', 'Other Health Products', ''];
const COSTS = ['Free', '$200', '$300', '$400', '$600', ''];
const PROVIDERS = ['UMC', 'USP', 'WHO', 'SEARN Secretariat', ''];
const MATURITY = ['Level 1 - Foundational', 'Level 2 - Intermediate', 'Level 3 - Established', ''];

const pick = (list, index) => list[index % list.length];

const scored = (name, score) => ({ name, score });

const suggestionsFor = (pool, index, count) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const name = pick(pool, index + i);
    if (!items.some((row) => row.name === name)) {
      items.push(scored(name, 98 - ((index + i) % 28)));
    }
  }
  return items;
};

/**
 * Build ~50 review records with mixed empty fields and mappings.
 * @param {string} jobId
 * @param {number} count
 */
export const buildReviewExtracted = (jobId, count = 50) => (
  Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const skipActivities = n % 9 === 0;
    const skipCompetencies = n % 11 === 0;
    const competencySuggestions = skipCompetencies ? suggestionsFor(COMPETENCY_POOL, i, 2) : suggestionsFor(COMPETENCY_POOL, i, 3 + (i % 2));
    const activitySuggestions = skipActivities ? suggestionsFor(ACTIVITY_POOL, i, 2) : suggestionsFor(ACTIVITY_POOL, i + 2, 2 + (i % 2));
    const competencies = skipCompetencies ? [] : competencySuggestions.filter((_, idx) => idx === 0 || n % 5 !== 0).map((row) => row.name);
    const activities = skipActivities ? [] : activitySuggestions.filter((_, idx) => idx === 0 || n % 6 !== 0).map((row) => row.name);
    const emptyDescription = n % 13 === 0;
    const duration = n % 7 === 0 ? '' : `${(n % 10) + 1} days`;
    const confidenceBucket = n % 5;
    const confidence = confidenceBucket === 0
      ? 0.32 + ((i % 12) / 100)
      : (confidenceBucket === 1 || confidenceBucket === 2)
        ? 0.52 + ((i % 18) / 100)
        : 0.78 + ((i % 16) / 100);
    const created = n % 8 === 0;

    return {
      id: `${jobId}_t${n}`,
      training_name: `${pick(TITLES, i)} ${n}`,
      description: emptyDescription ? '' : pick(DESCRIPTIONS, i),
      domain: pick(DOMAINS, i),
      sub_domain: pick(SUB_DOMAINS, i),
      language: pick(LANGUAGES, i),
      duration,
      cost: pick(COSTS, i),
      training_mode: pick(MODES, i),
      approach: pick(APPROACHES, i),
      evaluation: n % 8 === 0 ? '' : 'Quiz',
      outcome: n % 10 === 0 ? '' : 'Apply regulatory concepts in national authority practice.',
      product_type: pick(PRODUCT_TYPES, i),
      registration_by: 'URL',
      registration_value: n % 6 === 0 ? '' : 'https://example.org/training',
      nra_objectives: n % 8 === 0 ? [] : ['Strengthen national regulatory systems'],
      competencies,
      activities,
      competency_suggestions: competencySuggestions,
      activity_suggestions: activitySuggestions,
      status: created ? 'created' : 'needs_review',
      confidence,
      created,
      edited: !created && n % 6 === 0,
      provider: pick(PROVIDERS, i),
      maturity_level: pick(MATURITY, i),
      target_audience: n % 7 === 0 ? '' : 'National regulatory authority staff',
      source_id: `AI-${String(n).padStart(3, '0')}`,
      source_file: 'SEARN_Capacity_building_catalogue.pdf',
    };
  })
);

export default buildReviewExtracted;
