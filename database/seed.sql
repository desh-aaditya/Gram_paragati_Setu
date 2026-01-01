-- Seed data for development and testing
-- 
-- IMPORTANT: The password hashes below are PLACEHOLDERS.
-- Before using this seed file, generate proper bcrypt hashes:
-- 
-- Using Bun/Node.js:
--   const bcrypt = require('bcrypt');
--   const hash = await bcrypt.hash('admin123', 10);
-- 
-- Or use the helper script: bun run database/generate-hashes.js
-- 
-- Default passwords:
--   officer1: admin123
--   employee1: emp123
--   employee2: emp123

-- Insert sample users
INSERT INTO users (username, email, password_hash, role, full_name, phone, department) VALUES
-- Password: admin123 (NOTE: Replace with proper bcrypt hash)
('officer1', 'officer1@gov.in', '$2b$10$rK9QxJ5H8yZ7pJxL4M5N6eK9QxJ5H8yZ7pJxL4M5N6eK9QxJ5H8yZ7pC', 'officer', 'Officer Admin', '+91-9876543210', 'Department of Social Justice and Empowerment'),
-- Password: emp123 (NOTE: Replace with proper bcrypt hash)
('employee1', 'emp1@gov.in', '$2b$10$rK9QxJ5H8yZ7pJxL4M5N6eK9QxJ5H8yZ7pJxL4M5N6eK9QxJ5H8yZ7pD', 'employee', 'Employee Test', '+91-9876543211', 'Department of Social Justice and Empowerment'),
-- Password: emp123 (NOTE: Replace with proper bcrypt hash)
('employee2', 'emp2@gov.in', '$2b$10$rK9QxJ5H8yZ7pJxL4M5N6eK9QxJ5H8yZ7pJxL4M5N6eK9QxJ5H8yZ7pE', 'employee', 'Employee Demo', '+91-9876543212', 'Department of Social Justice and Empowerment');

-- Insert sample villages with PostGIS geometries
INSERT INTO villages (name, state, district, block, population, latitude, longitude, geometry, baseline_metrics) VALUES
('Village A', 'Maharashtra', 'Pune', 'Baramati', 2500, 18.5204, 73.8567,
 ST_GeogFromText('POLYGON((73.8567 18.5204, 73.8577 18.5204, 73.8577 18.5214, 73.8567 18.5214, 73.8567 18.5204))'),
 '{"literacy_rate": 75, "employment_rate": 65, "infrastructure_score": 70, "healthcare_facilities": 2, "schools": 3}'::jsonb),

('Village B', 'Tamil Nadu', 'Chennai', 'Tambaram', 3200, 12.9716, 80.2206,
 ST_GeogFromText('POLYGON((80.2206 12.9716, 80.2216 12.9716, 80.2216 12.9726, 80.2206 12.9726, 80.2206 12.9716))'),
 '{"literacy_rate": 82, "employment_rate": 72, "infrastructure_score": 85, "healthcare_facilities": 3, "schools": 4}'::jsonb),

('Village C', 'Uttar Pradesh', 'Lucknow', 'Mohaanlalganj', 1800, 26.8467, 80.9462,
 ST_GeogFromText('POLYGON((80.9462 26.8467, 80.9472 26.8467, 80.9472 26.8477, 80.9462 26.8477, 80.9462 26.8467))'),
 '{"literacy_rate": 68, "employment_rate": 58, "infrastructure_score": 60, "healthcare_facilities": 1, "schools": 2}'::jsonb),

('Village D', 'Maharashtra', 'Mumbai', 'Andheri', 4500, 19.1136, 72.8697,
 ST_GeogFromText('POLYGON((72.8697 19.1136, 72.8707 19.1136, 72.8707 19.1146, 72.8697 19.1146, 72.8697 19.1136))'),
 '{"literacy_rate": 88, "employment_rate": 78, "infrastructure_score": 90, "healthcare_facilities": 4, "schools": 5}'::jsonb);

-- Assign villages to employees
INSERT INTO employee_villages (employee_id, village_id) VALUES
(2, 1), -- employee1 assigned to Village A
(2, 2), -- employee1 assigned to Village B
(3, 3); -- employee2 assigned to Village C

-- Insert sample projects
INSERT INTO projects (village_id, title, description, project_type, allocated_amount, utilized_amount, status, start_date, end_date, created_by) VALUES
(1, 'Road Construction', 'Construction of 5km road connecting village to highway', 'infrastructure', 500000.00, 250000.00, 'in_progress', '2024-01-01', '2024-06-30', 1),
(1, 'School Building', 'New school building with 4 classrooms', 'education', 800000.00, 400000.00, 'in_progress', '2024-02-01', '2024-08-31', 1),
(2, 'Water Supply', 'Clean water supply system installation', 'infrastructure', 1200000.00, 600000.00, 'in_progress', '2024-01-15', '2024-07-15', 1),
(3, 'Healthcare Center', 'Primary healthcare center construction', 'healthcare', 900000.00, 200000.00, 'planned', '2024-03-01', '2024-09-30', 1),
(4, 'Solar Power Plant', 'Solar panels for village electrification', 'energy', 1500000.00, 750000.00, 'in_progress', '2024-01-10', '2024-12-31', 1);

-- Insert checkpoints for projects
INSERT INTO checkpoints (project_id, name, description, checkpoint_order, is_mandatory, estimated_date) VALUES
(1, 'Land Survey', 'Complete land survey and marking', 1, true, '2024-01-15'),
(1, 'Foundation Laid', 'Foundation work completed', 2, true, '2024-02-15'),
(1, '50% Completion', 'Road construction 50% complete', 3, true, '2024-04-01'),
(1, 'Final Inspection', 'Final quality inspection and approval', 4, true, '2024-06-15'),

(2, 'Site Preparation', 'Site cleared and leveled', 1, true, '2024-02-15'),
(2, 'Foundation', 'Foundation completed', 2, true, '2024-03-15'),
(2, 'Structure Complete', 'Building structure completed', 3, true, '2024-06-30'),

(3, 'Survey', 'Water source survey completed', 1, true, '2024-02-01'),
(3, 'Pipeline Installation', 'Pipeline installation in progress', 2, true, '2024-04-01'),
(3, 'Testing', 'Water quality testing and system check', 3, true, '2024-06-30');

-- Insert sample checkpoint submissions (from volunteers)
INSERT INTO checkpoint_submissions (checkpoint_id, volunteer_id, submitted_at, status, client_id) VALUES
(1, 'vol_001', '2024-01-20 10:00:00', 'approved', 'client_001'),
(2, 'vol_001', '2024-02-20 14:30:00', 'pending', 'client_002'),
(3, 'vol_002', '2024-04-05 09:15:00', 'pending', 'client_003'),
(5, 'vol_003', '2024-02-20 11:00:00', 'approved', 'client_004'),
(6, 'vol_003', '2024-03-20 15:45:00', 'pending', 'client_005');

-- Insert sample media
INSERT INTO media (submission_id, media_type, file_url, file_name, file_size, mime_type, metadata) VALUES
(1, 'photo', '/uploads/photos/checkpoint_1_photo1.jpg', 'checkpoint_1_photo1.jpg', 245678, 'image/jpeg', '{"location": {"lat": 18.5204, "lng": 73.8567}, "timestamp": "2024-01-20T10:00:00Z"}'::jsonb),
(1, 'photo', '/uploads/photos/checkpoint_1_photo2.jpg', 'checkpoint_1_photo2.jpg', 198234, 'image/jpeg', '{}'::jsonb),
(2, 'photo', '/uploads/photos/checkpoint_2_photo1.jpg', 'checkpoint_2_photo1.jpg', 312456, 'image/jpeg', '{}'::jsonb),
(2, 'audio', '/uploads/audio/checkpoint_2_voice1.mp3', 'checkpoint_2_voice1.mp3', 1256789, 'audio/mpeg', '{"duration": 45}'::jsonb),
(3, 'photo', '/uploads/photos/checkpoint_3_photo1.jpg', 'checkpoint_3_photo1.jpg', 287654, 'image/jpeg', '{}'::jsonb);

-- Insert fund transactions
INSERT INTO fund_transactions (project_id, transaction_type, amount, description, approved_by, created_by) VALUES
(1, 'allocation', 500000.00, 'Initial fund allocation for road construction', 1, 1),
(1, 'release', 250000.00, 'First phase fund release', 1, 1),
(2, 'allocation', 800000.00, 'Allocation for school building', 1, 1),
(2, 'release', 400000.00, 'Foundation phase release', 1, 1),
(3, 'allocation', 1200000.00, 'Water supply project allocation', 1, 1),
(3, 'release', 600000.00, 'Pipeline installation release', 1, 1);

-- Insert initial Adarsh scores (will be computed by algorithm)
INSERT INTO adarsh_scores (village_id, overall_score, infrastructure_score, completion_rate_score, social_indicators_score, feedback_score, fund_utilization_score, is_adarsh_candidate, score_breakdown) VALUES
(1, 72.5, 70.0, 50.0, 75.0, 65.0, 50.0, false, '{"details": "Infrastructure: 70%, Completion: 50%, Social: 75%, Feedback: 65%, Funds: 50%"}'::jsonb),
(2, 85.5, 85.0, 75.0, 82.0, 80.0, 75.0, true, '{"details": "Infrastructure: 85%, Completion: 75%, Social: 82%, Feedback: 80%, Funds: 75%"}'::jsonb),
(3, 62.0, 60.0, 40.0, 68.0, 55.0, 40.0, false, '{"details": "Infrastructure: 60%, Completion: 40%, Social: 68%, Feedback: 55%, Funds: 40%"}'::jsonb),
(4, 90.0, 90.0, 80.0, 88.0, 85.0, 85.0, true, '{"details": "Infrastructure: 90%, Completion: 80%, Social: 88%, Feedback: 85%, Funds: 85%"}'::jsonb);
