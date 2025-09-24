import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

let pool;

function getDbPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export const authenticateToken = (handler) => async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    return handler(req, res);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const authorize = (requiredCapability) => (handler) => async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const pool = getDbPool();
  try {
    const capabilitiesRes = await pool.query(
      `SELECT DISTINCT c.name FROM capabilities c
       JOIN role_capabilities rc ON c.id = rc.capability_id
       JOIN user_roles ur ON rc.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [req.userId]
    );
    const userCapabilities = capabilitiesRes.rows.map(row => row.name);

    if (!userCapabilities.includes(requiredCapability)) {
      return res.status(403).json({ message: 'Forbidden: You do not have the required permission.' });
    }

    return handler(req, res);
  } catch (error) {
    console.error('Authorization Error:', error);
    return res.status(500).json({ message: 'Internal Server Error during authorization.' });
  }
};

export { getDbPool };