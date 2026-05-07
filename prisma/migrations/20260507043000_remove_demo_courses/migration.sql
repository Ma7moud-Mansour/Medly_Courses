DELETE FROM "Course"
WHERE "slug" IN (
  'clinical-anatomy-essentials',
  'cardiovascular-physiology',
  'practical-pharmacology',
  'general-pathology-foundations',
  'cardiac-emergency-acls',
  'usmle-step-1-plan',
  'osce-history-examination',
  'neuroanatomy-made-clear',
  'respiratory-physiology-crash-course',
  'antibiotics-smart-review',
  'inflammation-and-healing',
  'trauma-primary-survey',
  'mcq-bank-strategy',
  'clinical-communication',
  'upper-limb-anatomy-review',
  'renal-physiology-masterclass',
  'endocrine-drugs-explained',
  'lab-interpretation-essentials'
);

UPDATE "Instructor"
SET "name" = U&'\064A\0648\0633\0641\0020\0632\064A\0627\062F\0629'
WHERE "slug" = 'dr-youssef-ziadeh'
   OR "name" = U&'\064A\0648\0633\0641\0020\0639\0628\062F\0020\0627\0644\0631\062D\0645\0646'
   OR "name" = U&'\064A\0648\0633\0641\0020\0632\064A\0627\062F\0647';
