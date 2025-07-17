const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/init');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email and password are required' }
      });
    }
    
    // Find user
    const result = await client.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: { message: 'Invalid credentials' }
      });
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({
        error: { message: 'Account is inactive' }
      });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: { message: 'Invalid credentials' }
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'Login failed' }
    });
  } finally {
    client.release();
  }
});

// Register (admin only for now)
router.post('/register', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password, first_name, last_name, role = 'user' } = req.body;
    
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        error: { message: 'All fields are required' }
      });
    }
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: { message: 'User already exists' }
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, created_at
    `, [email.toLowerCase(), hashedPassword, first_name, last_name, role]);
    
    const newUser = result.rows[0];
    
    res.status(201).json({
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role,
          created_at: newUser.created_at
        }
      },
      message: 'User created successfully'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: { message: 'Registration failed' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;