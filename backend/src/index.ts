import express from 'express';
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import pool from './config/database';
import { auditLog } from './middleware/audit';

// Import routes
import authRoutes from './routes/auth';
import villagesRoutes from './routes/villages';
import projectsRoutes from './routes/projects';
import checkpointsRoutes from './routes/checkpoints';
import syncRoutes from './routes/sync';
import analyticsRoutes from './routes/analytics';
import villagePlanRoutes from './routes/villagePlanRoutes';
import fundsRoutes from './routes/funds';
import employeesRoutes from './routes/employees';
import volunteersRoutes from './routes/volunteers';
import mobileRoutes from './routes/mobile';
import issuesRoutes from './routes/issues';
import publicRoutes from './routes/public';
import workspaceRoutes from './routes/workspace';
import skillsRoutes from './routes/skills';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Audit logging middleware
app.use(auditLog);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/villages', villagesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/checkpoints', checkpointsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/funds', fundsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/village-plan', villagePlanRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/skills', skillsRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
// Start server
app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Listening on 0.0.0.0:${PORT}`);
});
