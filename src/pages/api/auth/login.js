import { getDbPool } from '../../../lib/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const pool = getDbPool();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await pool.query('SELECT id, tenant_id, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const capabilitiesRes = await pool.query(
      `SELECT DISTINCT c.name FROM capabilities c
       JOIN role_capabilities rc ON c.id = rc.capability_id
       JOIN user_roles ur ON rc.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    const capabilities = capabilitiesRes.rows.map(row => row.name);

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: email,
        capabilities: capabilities
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
}