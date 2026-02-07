-- Seed: Job categories
INSERT INTO feature_flags (key, value, description) VALUES
    ('job_categories', '["Web Development", "Mobile Development", "Data Science", "Machine Learning", "DevOps", "Cloud Architecture", "UI/UX Design", "Technical Writing", "QA/Testing", "Blockchain", "Security", "Embedded Systems"]', 'Available job categories')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
