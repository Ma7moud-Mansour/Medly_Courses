export const DEMO_COURSE_SLUGS = [
  "clinical-anatomy-essentials",
  "cardiovascular-physiology",
  "practical-pharmacology",
  "general-pathology-foundations",
  "cardiac-emergency-acls",
  "usmle-step-1-plan",
  "osce-history-examination",
  "neuroanatomy-made-clear",
  "respiratory-physiology-crash-course",
  "antibiotics-smart-review",
  "inflammation-and-healing",
  "trauma-primary-survey",
  "mcq-bank-strategy",
  "clinical-communication",
  "upper-limb-anatomy-review",
  "renal-physiology-masterclass",
  "endocrine-drugs-explained",
  "lab-interpretation-essentials",
];

const DEMO_COURSE_SLUG_SET = new Set(DEMO_COURSE_SLUGS);

export function isDemoCourseSlug(slug?: string | null) {
  return Boolean(slug && DEMO_COURSE_SLUG_SET.has(slug));
}
