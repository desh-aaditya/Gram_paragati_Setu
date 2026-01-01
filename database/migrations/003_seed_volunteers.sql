-- Seed a volunteer user
-- Password: emp123
INSERT INTO volunteers (username, password_hash, full_name, phone, email, employee_id, assigned_villages, is_active)
VALUES (
    'volunteer1',
    '$2b$10$rK9QxJ5H8yZ7pJxL4M5N6eK9QxJ5H8yZ7pJxL4M5N6eK9QxJ5H8yZ7pD',
    'Volunteer One',
    '+91-9876543220',
    'vol1@gramsetu.in',
    2, -- Assigned by employee1
    ARRAY[1, 2], -- Assigned to Village A and Village B
    true
) ON CONFLICT (username) DO NOTHING;
