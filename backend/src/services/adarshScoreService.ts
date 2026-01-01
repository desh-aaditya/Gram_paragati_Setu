import pool from '../config/database';

interface ScoreBreakdown {
  infrastructure: number;
  completion_rate: number;
  social_indicators: number;
  feedback: number;
  fund_utilization: number;
}

interface ScoreWeights {
  infrastructure: number;
  completion_rate: number;
  social_indicators: number;
  feedback: number;
  fund_utilization: number;
}

// Default weights as per requirements
const DEFAULT_WEIGHTS: ScoreWeights = {
  infrastructure: 0.30,
  completion_rate: 0.30,
  social_indicators: 0.20,
  feedback: 0.10,
  fund_utilization: 0.10,
};

const ADARSH_THRESHOLD = 85;

/**
 * Calculate Adarsh score for a village
 */
export async function calculateAdarshScore(villageId: number): Promise<{
  overallScore: number;
  breakdown: ScoreBreakdown;
  isAdarshCandidate: boolean;
}> {
  // Get village baseline metrics
  const villageResult = await pool.query(
    'SELECT baseline_metrics FROM villages WHERE id = $1',
    [villageId]
  );

  if (villageResult.rows.length === 0) {
    throw new Error('Village not found');
  }

  const baselineMetrics = villageResult.rows[0].baseline_metrics || {};

  // 1. Infrastructure Score (30%)
  const infrastructureScore = calculateInfrastructureScore(baselineMetrics);

  // 2. Project Completion Rate (30%)
  const completionRateScore = await calculateCompletionRateScore(villageId);

  // 3. Social Indicators (20%)
  const socialIndicatorsScore = calculateSocialIndicatorsScore(baselineMetrics);

  // 4. Community Feedback (10%)
  const feedbackScore = await calculateFeedbackScore(villageId);

  // 5. Fund Utilization Efficiency (10%)
  const fundUtilizationScore = await calculateFundUtilizationScore(villageId);

  const breakdown: ScoreBreakdown = {
    infrastructure: infrastructureScore,
    completion_rate: completionRateScore,
    social_indicators: socialIndicatorsScore,
    feedback: feedbackScore,
    fund_utilization: fundUtilizationScore,
  };

  // Calculate weighted overall score
  const overallScore =
    infrastructureScore * DEFAULT_WEIGHTS.infrastructure +
    completionRateScore * DEFAULT_WEIGHTS.completion_rate +
    socialIndicatorsScore * DEFAULT_WEIGHTS.social_indicators +
    feedbackScore * DEFAULT_WEIGHTS.feedback +
    fundUtilizationScore * DEFAULT_WEIGHTS.fund_utilization;

  const isAdarshCandidate = overallScore >= ADARSH_THRESHOLD;

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    breakdown,
    isAdarshCandidate,
  };
}

/**
 * Infrastructure availability score (0-100)
 */
function calculateInfrastructureScore(metrics: any): number {
  const infrastructureScore = metrics.infrastructure_score || 0;
  const healthcareFacilities = metrics.healthcare_facilities || 0;
  const schools = metrics.schools || 0;

  // Normalize to 0-100 scale
  let score = infrastructureScore;

  // Bonus for healthcare facilities (max 10 points)
  if (healthcareFacilities >= 3) score += 10;
  else if (healthcareFacilities >= 2) score += 5;

  // Bonus for schools (max 10 points)
  if (schools >= 4) score += 10;
  else if (schools >= 2) score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Project completion rate score (0-100)
 */
async function calculateCompletionRateScore(villageId: number): Promise<number> {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_projects,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
      COUNT(DISTINCT c.id) as total_checkpoints,
      COUNT(DISTINCT CASE WHEN cs.status = 'approved' THEN cs.id END) as approved_checkpoints
    FROM projects p
    LEFT JOIN checkpoints c ON c.project_id = p.id
    LEFT JOIN checkpoint_submissions cs ON cs.checkpoint_id = c.id
    WHERE p.village_id = $1`,
    [villageId]
  );

  const { total_projects, completed_projects, total_checkpoints, approved_checkpoints } = result.rows[0];

  if (total_projects === 0 || total_projects === '0') return 0;

  const projectCompletionRate = (parseInt(completed_projects) / parseInt(total_projects)) * 100;
  const checkpointApprovalRate = total_checkpoints > 0 
    ? (parseInt(approved_checkpoints || '0') / parseInt(total_checkpoints)) * 100 
    : 0;

  // Weighted average: 70% project completion, 30% checkpoint approval
  return (projectCompletionRate * 0.7) + (checkpointApprovalRate * 0.3);
}

/**
 * Social indicators score (0-100)
 */
function calculateSocialIndicatorsScore(metrics: any): number {
  const literacyRate = metrics.literacy_rate || 0;
  const employmentRate = metrics.employment_rate || 0;

  // Average of literacy and employment rates
  return (literacyRate + employmentRate) / 2;
}

/**
 * Community feedback score (0-100)
 */
async function calculateFeedbackScore(villageId: number): Promise<number> {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_submissions,
      AVG(CASE WHEN cs.status = 'approved' THEN 1 ELSE 0 END) * 100 as approval_rate
    FROM projects p
    JOIN checkpoints c ON c.project_id = p.id
    JOIN checkpoint_submissions cs ON cs.checkpoint_id = c.id
    WHERE p.village_id = $1 AND cs.status IN ('approved', 'rejected')`,
    [villageId]
  );

  if (result.rows[0].total_submissions === 0 || result.rows[0].total_submissions === '0') {
    return 50; // Default neutral score
  }

  return parseFloat(result.rows[0].approval_rate || '50');
}

/**
 * Fund utilization efficiency score (0-100)
 */
async function calculateFundUtilizationScore(villageId: number): Promise<number> {
  const result = await pool.query(
    `SELECT 
      COALESCE(SUM(allocated_amount), 0) as total_allocated,
      COALESCE(SUM(utilized_amount), 0) as total_utilized
    FROM projects
    WHERE village_id = $1`,
    [villageId]
  );

  const totalAllocated = parseFloat(result.rows[0].total_allocated || '0');
  const totalUtilized = parseFloat(result.rows[0].total_utilized || '0');

  if (totalAllocated === 0) return 0;

  const utilizationRate = (totalUtilized / totalAllocated) * 100;

  // Consider efficiency: timely utilization is better
  // This is simplified - in production, factor in timeline adherence
  return Math.min(100, utilizationRate);
}

/**
 * Update Adarsh score for a village
 */
export async function updateAdarshScore(villageId: number): Promise<void> {
  const { overallScore, breakdown, isAdarshCandidate } = await calculateAdarshScore(villageId);

  await pool.query(
    `INSERT INTO adarsh_scores 
      (village_id, overall_score, infrastructure_score, completion_rate_score, 
       social_indicators_score, feedback_score, fund_utilization_score, 
       is_adarsh_candidate, score_breakdown)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (village_id) 
     DO UPDATE SET
       overall_score = EXCLUDED.overall_score,
       infrastructure_score = EXCLUDED.infrastructure_score,
       completion_rate_score = EXCLUDED.completion_rate_score,
       social_indicators_score = EXCLUDED.social_indicators_score,
       feedback_score = EXCLUDED.feedback_score,
       fund_utilization_score = EXCLUDED.fund_utilization_score,
       is_adarsh_candidate = EXCLUDED.is_adarsh_candidate,
       score_breakdown = EXCLUDED.score_breakdown,
       updated_at = CURRENT_TIMESTAMP`,
    [
      villageId,
      overallScore,
      breakdown.infrastructure,
      breakdown.completion_rate,
      breakdown.social_indicators,
      breakdown.feedback,
      breakdown.fund_utilization,
      isAdarshCandidate,
      JSON.stringify(breakdown),
    ]
  );
}
