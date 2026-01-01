import express from 'express';
import pool from '../config/database';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, TokenPayload } from '../config/auth';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query(
      'SELECT id, username, email, password_hash, role, full_name, is_active FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const isValid = await comparePassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { verifyRefreshToken } = await import('../config/auth');
    const decoded = verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const result = await pool.query(
      'SELECT id, username, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = result.rows[0];
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(payload);

    res.json({ accessToken: newAccessToken });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, full_name, phone, department FROM users WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { full_name, username, password } = req.body;
    const userId = req.user!.userId;

    if (!username || !full_name) {
      return res.status(400).json({ error: 'Username and full name are required' });
    }

    // Check if username is taken by another user
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, userId]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    let query = 'UPDATE users SET full_name = $1, username = $2';
    const params: any[] = [full_name, username];
    let paramCount = 3;

    if (password) {
      const hashedPassword = await hashPassword(password);
      query += `, password_hash = $${paramCount}`;
      params.push(hashedPassword);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING id, username, email, role, full_name, is_active`;
    params.push(userId);

    const result = await pool.query(query, params);

    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
