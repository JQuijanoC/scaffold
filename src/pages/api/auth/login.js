import pool from '../../../lib/db';
import { verifyPassword, createToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const capabilitiesQuery = await pool.query(
      `SELECT c.name
       FROM capabilities c
       JOIN role_capabilities rc ON c.id = rc.capability_id
       JOIN user_roles ur ON rc.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const capabilities = capabilitiesQuery.rows.map(row => row.name);

    const token = createToken({
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      capabilities,
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}