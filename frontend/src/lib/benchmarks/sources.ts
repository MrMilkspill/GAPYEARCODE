export type BenchmarkSource = {
  id: string;
  category: string;
  title: string;
  organization: string;
  url: string;
  publishedLabel: string;
  verifiedOn: string;
  usedFor: string[];
  keyStats: string[];
  note?: string;
};

export type BenchmarkDerivationNote = {
  category: string;
  currentBands: string;
  rationale: string;
};

export const benchmarkMethodNotes = [
  {
    title: "Official national data comes first",
    detail:
      "MD academic anchors come from current AAMC applicant and matriculant data plus the AAMC 2026 MCAT/GPA selection guide. DO adjustments come from current AACOM entering-student averages and AACOM trend reports.",
  },
  {
    title: "Experience-hour cutoffs are planning heuristics",
    detail:
      "AAMC and AACOM do not publish one universal national cutoff for clinical, research, service, or shadowing hours. Those bands are intentionally transparent heuristics informed by AAMC guidance, AMCAS activity categories, and respected university prehealth advising pages.",
  },
  {
    title: "Clinical volunteering and paid clinical work are separated",
    detail:
      "AMCAS separates volunteer medical/clinical work from paid medical/clinical work. In this version of the app, volunteer clinical hours set the core clinical benchmark, while paid clinical work adds smaller contextual support instead of inflating the main hour total.",
  },
  {
    title: "Weights follow a stricter importance order",
    detail:
      "The current model leans most heavily on academics, then clinical volunteering and non-clinical service. Shadowing and research stay lighter because AAMC guidance treats shadowing as substitutable and research expectations as mission-dependent.",
  },
  {
    title: "The backend keeps these values configurable",
    detail:
      "The app stores its thresholds centrally so they can be revised as new AAMC or AACOM releases arrive, or if an advisor wants to calibrate the model differently.",
  },
  {
    title: "Letter grading uses a common baseline, not a fake universal rule",
    detail:
      "AAMC says letter requirements vary by school. This version therefore uses a conservative common baseline: a committee letter or about two science-faculty letters plus one to two added letters from non-science, research, or clinical/service supervisors.",
  },
] as const;

export const benchmarkDerivationNotes: BenchmarkDerivationNote[] = [
  {
    category: "MD academics",
    currentBands:
      "Cumulative GPA 3.80+ excellent / 3.65+ strong / 3.45+ moderate; MCAT 515+ / 510+ / 505+.",
    rationale:
      "These bands stay close to current AAMC matriculant means while still preserving a middle planning tier below the mean instead of treating every sub-mean score as weak.",
  },
  {
    category: "DO interpretation",
    currentBands:
      "DO-focused applicants receive a meaningfully lighter GPA and MCAT interpretation than MD-focused applicants.",
    rationale:
      "That adjustment is anchored to AACOM's recent entering-student averages rather than a token one-point MCAT shift.",
  },
  {
    category: "Clinical and service",
    currentBands:
      "Clinical volunteering is benchmarked separately from paid clinical work, with a strong planning band around 150 hours, while non-clinical service uses a strong planning band around 250 hours.",
    rationale:
      "This is an inference from sources, not an official national cutoff. UVA advising suggests roughly 100 to 200 hours of clinical volunteering or work, AMCAS separates volunteer medical/clinical activity from paid medical/clinical employment, and AAMC's 2025 MD matriculant data reports 717 average community-service hours. The app uses those facts to keep the model demanding without treating the matriculant average itself as a minimum target.",
  },
  {
    category: "Shadowing and research",
    currentBands:
      "Shadowing stays low-weight, peaks in roughly the 40 to 80 hour range, and research weight increases only for research-heavy school preferences.",
    rationale:
      "AAMC guidance makes clear that shadowing can be supplemented by other clinical exposure, respected university advising pages usually cluster shadowing around roughly 20 to 50 hours, and research expectations vary by school mission. The app therefore treats shadowing as a bounded planning band instead of a category where more hours always help.",
  },
  {
    category: "Category weighting",
    currentBands:
      "Academics carry the most weight, followed by clinical volunteering and non-clinical service, while research and shadowing are intentionally lighter.",
    rationale:
      "This is an inference from sources, not an official AAMC weight table. AAMC admissions-officer survey data keeps GPA and MCAT among the strongest admissions inputs, AAMC shadowing guidance says alternate activities are often accepted in place of shadowing, and AAMC research guidance says research expectations vary by school mission.",
  },
  {
    category: "Letters of recommendation",
    currentBands:
      "Committee letter or packet is strongest. Without that, the model looks for about 2 science-faculty letters plus at least 1 to 2 additional letters from non-science faculty, research mentors, or clinical/service supervisors.",
    rationale:
      "AAMC says letter requirements vary by school, so the app does not claim one universal formula. Instead it uses AAMC guidance plus multiple advising sources that converge on two science letters as the core baseline, then treats additional academic or supervisor letters as the next layer of strength.",
  },
];

export const benchmarkSources: BenchmarkSource[] = [
  {
    id: "amcas-letters-types",
    category: "Application guidance",
    title: "AMCAS: Types of Letters of Evaluation",
    organization: "AAMC",
    url: "https://students-residents.aamc.org/applying-medical-school-amcas/publication-chapters/types-letters-evaluation",
    publishedLabel: "AMCAS application guidance",
    verifiedOn: "2026-04-03",
    usedFor: [
      "Explaining that letter requirements vary by school",
      "Grounding committee-letter and letter-packet logic in AMCAS terminology",
    ],
    keyStats: [
      "AAMC says each medical school determines the letters it will accept and require.",
      "AMCAS supports committee letters, letter packets, and individual letters, with up to 10 letters assigned to a school.",
    ],
  },
  {
    id: "aamc-choosing-letter-writers",
    category: "Application guidance",
    title: "Advisor Corner: Choosing the Right Letter Writers",
    organization: "AAMC",
    url: "https://students-residents.aamc.org/applying-medical-school/advisor-corner-choosing-right-letter-writers",
    publishedLabel: "AAMC advisor guidance",
    verifiedOn: "2026-04-03",
    usedFor: [
      "Setting the academic baseline for recommendation letters",
      "Justifying why science-faculty letters matter more than a generic self-rating",
    ],
    keyStats: [
      "AAMC advises that recommendations from several instructors are helpful, with two science instructors identified as very important.",
      "AAMC also suggests additional letters can come from research, service, employment, or medical mentors who know the applicant well.",
    ],
  },
  {
    id: "louisville-letters-brochure",
    category: "University advising heuristic",
    title: "Admissions Policies and Procedures Brochure",
    organization: "University of Louisville School of Medicine",
    url: "https://louisville.edu/medicine/admissions/files/admissions-policies-and-procedures-brochure.pdf",
    publishedLabel: "School-level admissions brochure",
    verifiedOn: "2026-04-03",
    usedFor: [
      "Common-baseline heuristic for structured letter packages",
    ],
    keyStats: [
      "The brochure notes that most medical schools require at least two science-professor letters and one non-science-professor letter.",
      "It also recommends additional letters from a physician, advisor, or volunteer supervisor when those relationships are substantive.",
    ],
    note:
      "This is a school-level or advising-style example, not a universal national requirement. The app labels it as a heuristic rather than official across-the-board policy.",
  },
  {
    id: "aamc-facts-2025",
    category: "MD national data",
    title: "2025 FACTS: Applicants and Matriculants Data",
    organization: "AAMC",
    url: "https://www.aamc.org/data-reports/students-residents/data/facts-applicants-and-matriculants",
    publishedLabel: "2025 FACTS data release",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Primary official table set for MD applicant and matriculant benchmarking",
      "Underlying reference for MCAT/GPA and applicant volume context",
    ],
    keyStats: [
      "Official AAMC applicant and matriculant table set for the 2025-2026 cycle.",
      "Used as the main national MD source behind academic anchor values.",
    ],
  },
  {
    id: "aamc-enrollment-2025",
    category: "MD national data",
    title: "U.S. medical schools enroll record number of students in 2025",
    organization: "AAMC",
    url: "https://www.aamc.org/news/us-medical-schools-enroll-record-number-students-2025",
    publishedLabel: "AAMC news release using 2025 data",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Recent MD GPA and MCAT anchor values",
      "Service-context anchor value",
    ],
    keyStats: [
      "Mean GPA: applicants 3.67, matriculants 3.81.",
      "Mean MCAT: applicants 506.3, matriculants 512.1.",
      "Average community service per matriculant: 717 hours.",
      "Median undergraduate GPA for matriculants: 3.87.",
    ],
  },
  {
    id: "aamc-mcat-selection-2026",
    category: "MD academic interpretation",
    title: "Using MCAT Data in 2026 Medical Student Selection",
    organization: "AAMC",
    url: "https://www.aamc.org/media/77326/download",
    publishedLabel: "2026 admissions cycle guidance",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Banding GPA and MCAT into moderate, strong, and excellent planning ranges",
      "Grounding the academics model in official MCAT/GPA outcome grids",
      "Checking which experience categories admissions officers rate highly",
    ],
    keyStats: [
      "AAMC still presents GPA in 3.80-4.00, 3.60-3.79, and 3.40-3.59 style ranges for outcome interpretation.",
      "AAMC still presents MCAT in 514-517, 510-513, 506-509, and 502-505 style ranges for outcome interpretation.",
      "In AAMC's 2023 admissions-officer survey, both community service/volunteer: medical-clinical and paid employment: medical-clinical fall in the highest-importance experience group.",
    ],
  },
  {
    id: "amcas-work-activities-2027",
    category: "Application structure",
    title: "2027 AMCAS Application Worksheet",
    organization: "AAMC",
    url: "https://students-residents.aamc.org/media/14376/download",
    publishedLabel: "2027 AMCAS worksheet",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Separating volunteer medical-clinical activity from paid medical-clinical employment in the scoring model",
      "Explaining why paid clinical work is displayed as context rather than merged into the volunteer clinical benchmark",
    ],
    keyStats: [
      "AMCAS lists Community Service/Volunteer - Medical/Clinical and Paid Employment - Medical/Clinical as separate experience types.",
      "AMCAS records completed and anticipated hours for each experience entry separately rather than collapsing paid and volunteer experience into one bucket.",
    ],
    note:
      "This separation does not prove that paid clinical work is unimportant. It supports the app's stricter decision to track volunteer clinical hours as the core benchmark and paid clinical work as supporting context.",
  },
  {
    id: "aacom-admissions-2024",
    category: "DO national data",
    title: "Admissions Requirements",
    organization: "AACOM",
    url: "https://www.aacom.org/become-a-doctor/apply-to-medical-school/admissions-requirements",
    publishedLabel: "2024 entering-student averages",
    verifiedOn: "2026-04-02",
    usedFor: [
      "DO GPA and MCAT adjustment calibration",
      "Entering-student academic anchor values",
    ],
    keyStats: [
      "2024 entering-student total MCAT: 502.97.",
      "2024 entering-student overall GPA: 3.60.",
      "2024 entering-student science GPA: 3.52.",
    ],
  },
  {
    id: "aacom-gpa-2024",
    category: "DO national data",
    title: "Applicants & Matriculants Average GPA 2016-2024",
    organization: "AACOM",
    url: "https://www.aacom.org/searches/reports/report/aacomas-applicants-and-matriculants-average-gpa-2016-2023",
    publishedLabel: "November 21, 2024",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Checking DO GPA trend stability over time",
      "Avoiding overreaction to a single-year snapshot",
    ],
    keyStats: [
      "2024 undergraduate mean GPA: applicants 3.56, matriculants 3.59.",
      "2024 undergraduate mean science GPA: applicants 3.44, matriculants 3.49.",
      "2024 undergraduate mean non-science GPA: applicants 3.68, matriculants 3.71.",
    ],
  },
  {
    id: "aacom-mcat-2024",
    category: "DO national data",
    title: "Applicant & Matriculant Average MCAT 2016-2024",
    organization: "AACOM",
    url: "https://www.aacom.org/searches/reports/report/applicant-and-matriculant-average-mcat-2016-2023",
    publishedLabel: "November 21, 2024",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Checking DO MCAT trend stability over time",
      "Supporting the DO-specific MCAT interpretation shift",
    ],
    keyStats: [
      "AACOM reports that 2024 mean MCAT scores declined from 2023 for both applicants and matriculants.",
      "AACOM also reports that 2024 matriculant MCAT remains 0.90 points higher than 2016.",
    ],
  },
  {
    id: "aamc-shadowing",
    category: "Experience guidance",
    title: "Shadowing a Doctor",
    organization: "AAMC",
    url: "https://students-residents.aamc.org/aspiring-docs-fact-sheets-get-experience/shadowing-doctor",
    publishedLabel: "AAMC Aspiring Docs guidance",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Keeping shadowing as a low-weight category",
      "Avoiding an artificially rigid shadowing requirement",
    ],
    keyStats: [
      "AAMC notes that 87% of surveyed admissions officers accepted an alternate activity instead of clinical shadowing.",
      "AAMC explicitly says strong clinical experience does not have to include shadowing.",
    ],
  },
  {
    id: "aamc-research",
    category: "Experience guidance",
    title: "How to Get Research Experience",
    organization: "AAMC",
    url: "https://students-residents.aamc.org/choosing-medical-career/how-get-research-experience",
    publishedLabel: "AAMC Aspiring Docs guidance",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Making research weight school-preference dependent",
      "Explaining why research is not treated as equally important for every applicant",
    ],
    keyStats: [
      "AAMC states that research expectations depend on school mission.",
      "AAMC states that the majority of accepted applicants have some form of research experience.",
    ],
  },
  {
    id: "aamc-volunteer",
    category: "Experience guidance",
    title: "Finding Health Care Related Volunteer Opportunities",
    organization: "AAMC",
    url: "https://students-residents.aamc.org/getting-experience/finding-health-care-related-volunteer-opportunities",
    publishedLabel: "AAMC Aspiring Docs guidance",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Framing longitudinal service and health-care volunteering as sustained commitments rather than one-off checkboxes",
    ],
    keyStats: [
      "AAMC recommends at least one solid health care-related experience plus nonmedical volunteer work.",
      "AAMC emphasizes sustained commitment and growing responsibility over random short-term activities.",
    ],
  },
  {
    id: "harvard-experience",
    category: "University advising heuristic",
    title: "Getting Experience - Premed",
    organization: "Harvard FAS Mignone Center for Career Success",
    url: "https://careerservices.fas.harvard.edu/getting-experience-premed/",
    publishedLabel: "University prehealth advising guidance",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Conservative shadowing planning bands",
    ],
    keyStats: [
      "Harvard suggests aiming for about 40 to 50 hours of shadowing over college.",
    ],
    note:
      "This is not a national rule. It is a respected advising benchmark used only to keep the shadowing bands realistic.",
  },
  {
    id: "uva-clinical-experiences",
    category: "University advising heuristic",
    title: "Clinical Experiences",
    organization: "University of Virginia Career Center",
    url: "https://career.virginia.edu/sites/g/files/jsddwu971/files/2025-09/Pre-Health%20Clinical%20Experiences%20%281%29_0.pdf",
    publishedLabel: "University prehealth advising sheet",
    verifiedOn: "2026-04-02",
    usedFor: [
      "Reality-checking clinical and shadowing hour bands",
    ],
    keyStats: [
      "UVA suggests roughly 100 to 200 hours of clinical volunteering or work and about 20 to 40 shadowing hours for medicine.",
    ],
    note:
      "This is an advising heuristic, not an AAMC-published national average.",
  },
];
