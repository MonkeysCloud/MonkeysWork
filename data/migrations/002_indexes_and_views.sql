-- Additional indexes and materialized views
-- Migration: 002_indexes_and_views

BEGIN;

-- Materialized view for match leaderboard
CREATE MATERIALIZED VIEW mv_freelancer_ranking AS
SELECT
    fp.user_id,
    u.display_name,
    fp.skills,
    fp.hourly_rate,
    fp.avg_rating,
    fp.total_jobs_completed,
    fp.verification_level,
    fp.response_rate,
    fp.availability_status,
    (fp.avg_rating * 0.4 + fp.response_rate * 0.3 + LEAST(fp.total_jobs_completed::decimal / 50, 1) * 0.3) AS quality_score
FROM freelancer_profiles fp
JOIN users u ON u.id = fp.user_id
WHERE u.status = 'active'
ORDER BY quality_score DESC;

CREATE UNIQUE INDEX idx_mv_freelancer_ranking ON mv_freelancer_ranking(user_id);

-- Full text search on jobs
ALTER TABLE jobs ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION update_job_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_job_search_vector
    BEFORE INSERT OR UPDATE OF title, description ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_job_search_vector();

CREATE INDEX idx_jobs_search ON jobs USING GIN(search_vector);

COMMIT;
