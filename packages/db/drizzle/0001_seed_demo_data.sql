-- Seed demo data (idempotent)

-- Users
INSERT INTO public.users (id, email, password_hash, role, created_at)
VALUES
  ('429e2c08-5912-4547-a339-9717f56bb18c','admin@tasktimer.app','$2a$10$QCd77/5tENhiZSDHXtMneOo93NVqsIdNNKjqkRF389.j4I.MpSQAi','admin','2026-05-18T17:46:49.763801+00:00'),
  ('3a26150f-eeb4-4b7f-8ebe-d7ad31c35a7d','demo@tasktimer.app','$2a$10$RmsjOVo4dfxvoQC/uCWaguOVaecVro0Vz64Z.545CBqvPUZw7Eyom','user','2026-05-18T17:46:49.853998+00:00'),
  ('64b2024a-0c7b-461d-a3a0-4811f4ff07b8','maker@tasktimer.app','$2a$10$zih01PmBu.ZWJv145BPoYODuRLZOiVcWcMILI/ceVldQtRL8wC66S','user','2026-05-18T17:46:49.939574+00:00'),
  ('4f5c7ae3-2d2b-4e42-bed9-f1c9855b87ea','ops@tasktimer.app','$2a$10$ncEDBzNyZA26dS4qRDdAfuSfAftf5FJ6gxWRoCdij18HxRjLTDHO6','user','2026-05-18T17:46:50.110952+00:00'),
  ('df0a7cce-1aed-45de-a0e0-a52eb3121519','studio@tasktimer.app','$2a$10$8LuiAeCJp8McTD638aavIu6b.OJ7TfHxYStTT34A9.Zg4MUutVgXW','user','2026-05-18T17:46:50.025035+00:00')
ON CONFLICT (email) DO NOTHING;

-- Task types
INSERT INTO public.task_types (id, name, icon)
VALUES
  ('8e221f8c-e62b-4d39-b17c-a4fc77fa4dba','3D Modelling','cube'),
  ('a61487ef-9a1e-4dcc-bd42-0821ebfec496','3D Printing','printer'),
  ('5b23fc3d-8db5-438c-beea-000598876161','3D Scanning','scan'),
  ('2a78c83f-22a4-457f-8c1c-6ef696566cb3','CAD Design','pen-tool'),
  ('c12af6fb-453e-446d-866e-c44d732eb0a0','Client review','messages'),
  ('7ad6a727-6360-47ac-9cf5-a836207a4815','Post-processing','sparkles'),
  ('f59d88cb-eb29-4661-848d-0c5e0ba19aa5','Rendering','image'),
  ('900e1299-05b8-4715-b161-2ac486127d2d','Research','search')
ON CONFLICT (name) DO NOTHING;

-- Projects
INSERT INTO public.projects (id, user_id, name, color, description, archived, created_at)
VALUES
  ('ab640ba8-0b9f-42e6-9640-5bf5367cbaee','429e2c08-5912-4547-a339-9717f56bb18c','Demo Production Line','#6366f1','Default admin project',false,'2026-05-18T17:46:50.150944+00:00'),
  ('314fd796-16a3-4690-b69e-bb75ec7a5802','3a26150f-eeb4-4b7f-8ebe-d7ad31c35a7d','Architectural Model','#0ea5e9','House and interior work',false,'2026-05-18T17:46:50.194315+00:00'),
  ('c55f523d-f843-4df7-940e-90ab64d8622e','64b2024a-0c7b-461d-a3a0-4811f4ff07b8','Prototype Lab','#14b8a6','Hardware concepts and prints',false,'2026-05-18T17:46:50.233286+00:00'),
  ('a0913940-1c0b-4905-96ee-12dd63709375','df0a7cce-1aed-45de-a0e0-a52eb3121519','Client Review Queue','#f97316','Feedback and revisions',false,'2026-05-18T17:46:50.272543+00:00'),
  ('856d9513-d07c-483b-a365-1060a6d0b533','4f5c7ae3-2d2b-4e42-bed9-f1c9855b87ea','Research Sprint','#8b5cf6','Materials and process experiments',true,'2026-05-18T17:46:50.312459+00:00')
ON CONFLICT (id) DO NOTHING;

-- Time entries
INSERT INTO public.time_entries (id, user_id, project_id, task_type_id, started_at, ended_at, duration_minutes, note, created_at)
VALUES
  ('b5a71f23-42f2-40f7-92bf-055ec3e8f929','429e2c08-5912-4547-a339-9717f56bb18c','ab640ba8-0b9f-42e6-9640-5bf5367cbaee','5b23fc3d-8db5-438c-beea-000598876161','2026-05-18T15:46:55.539+00:00','2026-05-18T17:21:55.539+00:00',95,'Morning scan prep','2026-05-18T17:46:50.354047+00:00'),
  ('6845ddf0-6429-4652-828f-30d22b4918e7','3a26150f-eeb4-4b7f-8ebe-d7ad31c35a7d','314fd796-16a3-4690-b69e-bb75ec7a5802','a61487ef-9a1e-4dcc-bd42-0821ebfec496','2026-05-18T11:46:55.587+00:00','2026-05-18T13:46:55.587+00:00',120,'Print started successfully','2026-05-18T17:46:50.400249+00:00'),
  ('df30b6eb-76fa-4c51-adce-f23abd2329a2','64b2024a-0c7b-461d-a3a0-4811f4ff07b8','c55f523d-f843-4df7-940e-90ab64d8622e','8e221f8c-e62b-4d39-b17c-a4fc77fa4dba','2026-05-18T07:46:55.626+00:00',NULL,NULL,'Modeling session still running','2026-05-18T17:46:50.439373+00:00'),
  ('b5b6116f-56fd-432c-b706-f7a0ba4e59ab','df0a7cce-1aed-45de-a0e0-a52eb3121519','a0913940-1c0b-4905-96ee-12dd63709375','c12af6fb-453e-446d-866e-c44d732eb0a0','2026-05-17T23:46:55.665+00:00','2026-05-18T00:31:55.665+00:00',45,'Client feedback review','2026-05-18T17:46:50.478415+00:00'),
  ('3a0286a0-57fc-430b-b6c9-c2a8ab625d1a','4f5c7ae3-2d2b-4e42-bed9-f1c9855b87ea','856d9513-d07c-483b-a365-1060a6d0b533','900e1299-05b8-4715-b161-2ac486127d2d','2026-05-17T17:46:55.705+00:00','2026-05-17T19:01:55.705+00:00',75,'Research on resin settings','2026-05-18T17:46:50.517635+00:00'),
  ('03a36784-420d-47d0-aa57-8b3b5dca92fa','429e2c08-5912-4547-a339-9717f56bb18c','314fd796-16a3-4690-b69e-bb75ec7a5802','7ad6a727-6360-47ac-9cf5-a836207a4815','2026-05-17T09:46:55.744+00:00','2026-05-17T10:46:55.744+00:00',60,'Post-processing cleanup','2026-05-18T17:46:50.556883+00:00'),
  ('94aeea0f-d2bd-4fd6-af1e-2e937d3044bf','3a26150f-eeb4-4b7f-8ebe-d7ad31c35a7d','c55f523d-f843-4df7-940e-90ab64d8622e','2a78c83f-22a4-457f-8c1c-6ef696566cb3','2026-05-17T01:46:55.783+00:00','2026-05-17T03:36:55.783+00:00',110,'CAD redesign pass','2026-05-18T17:46:50.596561+00:00'),
  ('7380146d-cae5-40eb-8eb4-c0578c9d329e','64b2024a-0c7b-461d-a3a0-4811f4ff07b8','ab640ba8-0b9f-42e6-9640-5bf5367cbaee','f59d88cb-eb29-4661-848d-0c5e0ba19aa5','2026-05-16T13:46:55.823+00:00','2026-05-16T14:36:55.823+00:00',50,'Render preview export','2026-05-18T17:46:50.636974+00:00')
ON CONFLICT (id) DO NOTHING;

-- Entry files
INSERT INTO public.entry_files (id, time_entry_id, file_type, storage_key, original_name, mime_type, file_size_bytes, uploaded_at)
VALUES
  ('cd1ff9a4-cfc9-4208-919e-e2530d1e0b82','b5a71f23-42f2-40f7-92bf-055ec3e8f929','image','uploads/scan-prep-001.png','scan-prep-001.png','image/png',245678,'2026-05-18T17:46:50.677086+00:00'),
  ('be1f5e79-3179-486f-8077-5c83ce8f76af','6845ddf0-6429-4652-828f-30d22b4918e7','document','uploads/print-job-001.pdf','print-job-001.pdf','application/pdf',145223,'2026-05-18T17:46:50.677086+00:00'),
  ('9ba5308b-a29b-476b-9261-2da159c56bfb','df30b6eb-76fa-4c51-adce-f23abd2329a2','model','uploads/model-v2.step','model-v2.step','application/step',982341,'2026-05-18T17:46:50.677086+00:00'),
  ('f3b09f4c-8bc9-4351-aaf5-d377a064dce4','b5b6116f-56fd-432c-b706-f7a0ba4e59ab','document','uploads/review-notes.docx','review-notes.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',56342,'2026-05-18T17:46:50.677086+00:00'),
  ('980f4db9-95b9-4a57-a582-e3367b1b21ae','3a0286a0-57fc-430b-b6c9-c2a8ab625d1a','other','uploads/research-log.txt','research-log.txt','text/plain',8421,'2026-05-18T17:46:50.677086+00:00')
ON CONFLICT (id) DO NOTHING;

-- Done
