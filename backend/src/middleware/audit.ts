import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { AuthRequest } from './auth';

export const auditLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalSend = res.json;
  
  res.json = function(data: any) {
    // Log after response is sent
    const userId = req.user?.userId || null;
    const action = `${req.method} ${req.path}`;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, action, null, JSON.stringify({ body: req.body, params: req.params, query: req.query }), ipAddress, userAgent]
    ).catch(console.error);

    return originalSend.call(this, data);
  };

  next();
};
