-- DischargeGuard — Seed Data
-- Paste into Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: clears existing data first

delete from call_history;
delete from discharge_checklists;
delete from visits;
delete from prescriptions;
delete from patients;

-- ── Patients ─────────────────────────────────────────────────
insert into patients (id, mrn, name, dob, language, language_code, diagnosis, phone) values
  ('a1000000-0000-0000-0000-000000000001', '847291', 'Maria Garcia',  '1955-03-15', 'Spanish',  'es', 'Post-cholecystectomy, Type 2 Diabetes, Hypertension',       '+18135550142'),
  ('a1000000-0000-0000-0000-000000000002', '392847', 'Wei Chen',      '1962-07-22', 'Mandarin', 'zh', 'Post-cardiac stent, Hypertension, Atrial Fibrillation',     '+14085550198'),
  ('a1000000-0000-0000-0000-000000000003', '571034', 'James Wilson',  '1948-11-03', 'English',  'en', 'Post-hip replacement, COPD, Type 2 Diabetes',               '+17135550267');

-- ── Prescriptions — Maria Garcia ─────────────────────────────
insert into prescriptions (patient_id, name, purpose, status, prescribed_by, prescribed_date, refills) values
  ('a1000000-0000-0000-0000-000000000001', 'Metformin 500mg',       'Type 2 Diabetes',                  'active',       'Dr. Chen',     '2026-01-12', 3),
  ('a1000000-0000-0000-0000-000000000001', 'Lisinopril 10mg',       'Hypertension',                     'active',       'Dr. Chen',     '2025-11-04', 5),
  ('a1000000-0000-0000-0000-000000000001', 'Omeprazole 20mg',       'Stomach protection post-op',       'new',          'Dr. Thompson', '2026-03-27', 1),
  ('a1000000-0000-0000-0000-000000000001', 'Acetaminophen 500mg',   'Post-surgical pain',               'new',          'Dr. Thompson', '2026-03-27', 0),
  ('a1000000-0000-0000-0000-000000000001', 'Atorvastatin 20mg',     'Cholesterol',                      'active',       'Dr. Chen',     '2025-08-18', 6),
  ('a1000000-0000-0000-0000-000000000001', 'Aspirin 81mg',          'Cardiovascular prevention',        'active',       'Dr. Chen',     '2025-08-18', 11),
  ('a1000000-0000-0000-0000-000000000001', 'Warfarin 2.5mg',        'Blood clot prevention',            'discontinued', 'Dr. Patel',    '2025-02-02', 0);

-- ── Prescriptions — Wei Chen ─────────────────────────────────
insert into prescriptions (patient_id, name, purpose, status, prescribed_by, prescribed_date, refills) values
  ('a1000000-0000-0000-0000-000000000002', 'Aspirin 81mg',          'Anti-platelet therapy',            'active',       'Dr. Patel',    '2026-03-20', 11),
  ('a1000000-0000-0000-0000-000000000002', 'Clopidogrel 75mg',      'Prevent stent clotting',           'new',          'Dr. Patel',    '2026-03-20', 2),
  ('a1000000-0000-0000-0000-000000000002', 'Metoprolol 25mg',       'Heart rate control',               'active',       'Dr. Patel',    '2026-03-20', 4),
  ('a1000000-0000-0000-0000-000000000002', 'Atorvastatin 40mg',     'Cholesterol',                      'active',       'Dr. Patel',    '2025-09-10', 6),
  ('a1000000-0000-0000-0000-000000000002', 'Ramipril 5mg',          'Blood pressure post-stent',        'new',          'Dr. Patel',    '2026-03-20', 3);

-- ── Prescriptions — James Wilson ─────────────────────────────
insert into prescriptions (patient_id, name, purpose, status, prescribed_by, prescribed_date, refills) values
  ('a1000000-0000-0000-0000-000000000003', 'Oxycodone 5mg',         'Post-op pain',                     'new',          'Dr. Nguyen',   '2026-03-25', 0),
  ('a1000000-0000-0000-0000-000000000003', 'Celecoxib 200mg',       'Inflammation',                     'new',          'Dr. Nguyen',   '2026-03-25', 1),
  ('a1000000-0000-0000-0000-000000000003', 'Warfarin 5mg',          'DVT prevention post-surgery',      'new',          'Dr. Nguyen',   '2026-03-25', 0),
  ('a1000000-0000-0000-0000-000000000003', 'Salbutamol Inhaler',    'COPD rescue',                      'active',       'Dr. Morris',   '2025-06-14', 5),
  ('a1000000-0000-0000-0000-000000000003', 'Metformin 1000mg',      'Type 2 Diabetes',                  'active',       'Dr. Morris',   '2025-06-14', 4),
  ('a1000000-0000-0000-0000-000000000003', 'Tiotropium Inhaler',    'COPD maintenance',                 'active',       'Dr. Morris',   '2025-06-14', 6);

-- ── Visits — Maria Garcia ─────────────────────────────────────
insert into visits (patient_id, date, type, provider, department, notes) values
  ('a1000000-0000-0000-0000-000000000001', '2026-03-27', 'Discharge',          'Dr. Thompson', 'Surgery',      'Post-cholecystectomy discharge. Stable. Discharge instructions provided in Spanish.'),
  ('a1000000-0000-0000-0000-000000000001', '2026-03-25', 'Surgery',            'Dr. Thompson', 'Surgery',      'Laparoscopic cholecystectomy — uncomplicated. Estimated blood loss minimal.'),
  ('a1000000-0000-0000-0000-000000000001', '2026-03-24', 'Pre-op',             'Dr. Thompson', 'Surgery',      'Pre-surgical assessment. Cleared for procedure. NPO after midnight.'),
  ('a1000000-0000-0000-0000-000000000001', '2026-02-10', 'Follow-up',          'Dr. Chen',     'Primary Care', 'HbA1c 7.2 — diabetes management on track. BP 132/84.'),
  ('a1000000-0000-0000-0000-000000000001', '2025-11-04', 'Annual Physical',    'Dr. Chen',     'Primary Care', 'BP 138/88. Lisinopril dose maintained. Cholesterol within range.'),
  ('a1000000-0000-0000-0000-000000000001', '2025-08-18', 'Cardiology Consult', 'Dr. Patel',    'Cardiology',   'Lipid panel reviewed. Statin therapy initiated. EKG normal.');

-- ── Visits — Wei Chen ────────────────────────────────────────
insert into visits (patient_id, date, type, provider, department, notes) values
  ('a1000000-0000-0000-0000-000000000002', '2026-03-20', 'Discharge',          'Dr. Patel',    'Cardiology',   'Post-stent discharge. Dual antiplatelet therapy initiated. Follow-up in 2 weeks.'),
  ('a1000000-0000-0000-0000-000000000002', '2026-03-18', 'Cardiac Procedure',  'Dr. Patel',    'Cardiology',   'Percutaneous coronary intervention. Drug-eluting stent placed in LAD. Successful.'),
  ('a1000000-0000-0000-0000-000000000002', '2026-03-17', 'Emergency Admit',    'Dr. Patel',    'Cardiology',   'Admitted with chest pain. NSTEMI confirmed. Cath lab scheduled.'),
  ('a1000000-0000-0000-0000-000000000002', '2025-09-10', 'Annual Physical',    'Dr. Morris',   'Primary Care', 'BP 148/92. Statin added. Referred to cardiology for stress test.');

-- ── Visits — James Wilson ────────────────────────────────────
insert into visits (patient_id, date, type, provider, department, notes) values
  ('a1000000-0000-0000-0000-000000000003', '2026-03-25', 'Discharge',          'Dr. Nguyen',   'Orthopedics',  'Post-hip replacement discharge. Walker required. PT referral placed.'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-23', 'Surgery',            'Dr. Nguyen',   'Orthopedics',  'Right total hip arthroplasty. Uncomplicated. Spinal anesthesia used.'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-22', 'Pre-op',             'Dr. Nguyen',   'Orthopedics',  'Pre-surgical clearance. Pulmonology consulted re: COPD. Cleared.'),
  ('a1000000-0000-0000-0000-000000000003', '2025-12-01', 'COPD Review',        'Dr. Morris',   'Pulmonology',  'FEV1 62% predicted. Inhaler technique reviewed. Stable.'),
  ('a1000000-0000-0000-0000-000000000003', '2025-06-14', 'Annual Physical',    'Dr. Morris',   'Primary Care', 'HbA1c 7.8. COPD stable. Hip pain worsening — ortho referral placed.');

-- ── Call History — Maria Garcia ──────────────────────────────
insert into call_history (patient_id, date, time, duration, type, status, agent, language_code, comprehension_score, flags, summary, elevenlabs_conversation_id) values
  ('a1000000-0000-0000-0000-000000000001', '2026-03-27', '2:14 PM', '1:05', 'Post-discharge',      'completed',  'ElevenLabs VoiceCoach', 'es', 78,
   array['Persistent headache flagged', 'Nurse callback scheduled'],
   'Patient understood 7/9 discharge items. Confused Metformin with BP medication — re-explained successfully. Headache symptom escalated to care team.',
   'conv_maria_20260327'),
  ('a1000000-0000-0000-0000-000000000001', '2026-02-10', '10:30 AM', '0:48', 'Medication check-in', 'completed',  'ElevenLabs VoiceCoach', 'es', 92,
   array[]::text[],
   'Patient confirmed taking all medications correctly. No concerns raised. Follow-up appointment confirmed.',
   'conv_maria_20260210'),
  ('a1000000-0000-0000-0000-000000000001', '2025-11-06', '9:05 AM',  '0:32', 'Post-discharge',      'completed',  'ElevenLabs VoiceCoach', 'es', 65,
   array['Missed dose reported'],
   'Patient reported missing Lisinopril dose twice. Nurse notified. Medication adherence counseling scheduled.',
   'conv_maria_20251106'),
  ('a1000000-0000-0000-0000-000000000001', '2025-08-20', '3:45 PM',  '0:00', 'Medication check-in', 'no-answer',  'ElevenLabs VoiceCoach', 'es', 0,
   array[]::text[],
   'No answer. Voicemail left. Retry scheduled.',
   null);

-- ── Call History — Wei Chen ───────────────────────────────────
insert into call_history (patient_id, date, time, duration, type, status, agent, language_code, comprehension_score, flags, summary, elevenlabs_conversation_id) values
  ('a1000000-0000-0000-0000-000000000002', '2026-03-21', '11:00 AM', '1:12', 'Post-discharge',      'completed',  'ElevenLabs VoiceCoach', 'zh', 71,
   array['Persistent headache reported', 'Chest tightness mentioned', 'Urgent nurse callback'],
   'Patient reported headache and mild chest tightness. Escalated immediately. Nurse callback within 30 minutes. Clopidogrel instructions re-explained.',
   'conv_wei_20260321'),
  ('a1000000-0000-0000-0000-000000000002', '2026-03-22', '2:30 PM',  '0:55', 'Symptom follow-up',   'completed',  'ElevenLabs VoiceCoach', 'zh', 88,
   array[]::text[],
   'Follow-up after escalation. Symptoms resolved. Patient confirmed taking dual antiplatelet therapy correctly.',
   'conv_wei_20260322');

-- ── Call History — James Wilson ───────────────────────────────
insert into call_history (patient_id, date, time, duration, type, status, agent, language_code, comprehension_score, flags, summary, elevenlabs_conversation_id) values
  ('a1000000-0000-0000-0000-000000000003', '2026-03-26', '10:15 AM', '1:22', 'Post-discharge',      'completed',  'ElevenLabs VoiceCoach', 'en', 83,
   array['Warfarin INR monitoring confusion'],
   'Patient understood most discharge items. Needed extra explanation on Warfarin INR monitoring schedule. Walker use and PT exercises confirmed.',
   'conv_james_20260326'),
  ('a1000000-0000-0000-0000-000000000003', '2026-03-27', '9:00 AM',  '0:00', 'Medication check-in', 'no-answer',  'ElevenLabs VoiceCoach', 'en', 0,
   array[]::text[],
   'No answer. Retry scheduled for afternoon.',
   null);

-- ── Discharge checklists ──────────────────────────────────────
-- Maria Garcia
insert into discharge_checklists (patient_id, item_id, name, detail, category) values
  ('a1000000-0000-0000-0000-000000000001', 'met',   'Metformin 500mg',        'Twice daily with meals · Diabetes',       'medication'),
  ('a1000000-0000-0000-0000-000000000001', 'lis',   'Lisinopril 10mg',        'Once daily morning · Hypertension',       'medication'),
  ('a1000000-0000-0000-0000-000000000001', 'ome',   'Omeprazole 20mg',        'Once daily before breakfast · Stomach',   'medication'),
  ('a1000000-0000-0000-0000-000000000001', 'ace',   'Acetaminophen 500mg',    'Every 6 hrs as needed · Surgical pain',   'medication'),
  ('a1000000-0000-0000-0000-000000000001', 'wound', 'Wound Care',             'Change dressing · Keep dry 48hr',         'care'),
  ('a1000000-0000-0000-0000-000000000001', 'warn',  'Warning Signs',          'Fever >101°F · Bleeding · Chest pain',    'safety'),
  ('a1000000-0000-0000-0000-000000000001', 'fu1',   'Follow-up: Dr. Thompson','April 3 at 10:00 AM · Surgeon',           'appointment'),
  ('a1000000-0000-0000-0000-000000000001', 'fu2',   'Follow-up: Dr. Chen',    'April 10 at 2:30 PM · PCP',               'appointment'),
  ('a1000000-0000-0000-0000-000000000001', 'act',   'Activity Limits',        'No lifting >10 lbs · No driving 1 wk',   'restriction');
