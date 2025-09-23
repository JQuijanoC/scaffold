// src/lib/auth.js
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Memoized pool instance
let pool;

function getDbPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

/**
 * Verifies the JWT from the Authorization header.
 * This is designed to be called from within an API Route or Server Component.
 * @returns {object | null} The decoded token payload { userId, tenantId } or null if invalid.
 */
export async function verifyToken() {
  const authHeader = headers().get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set.');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error.message);
    return null;
  }
}

/**
 * Checks if a user has a specific capability.
 * @param {number} userId - The ID of the user.
 * @param {string} requiredCapability - The capability string to check for.
 * @returns {Promise<boolean>} - True if the user has the capability, false otherwise.
 */
export async function hasCapability(userId, requiredCapability) {
  if (!userId) return false;

  const pool = getDbPool();
  // No need for a client here, pool can query directly
  try {
    const capabilitiesRes = await pool.query(
      `SELECT 1 FROM capabilities c
       JOIN role_capabilities rc ON c.id = rc.capability_id
       JOIN user_roles ur ON rc.role_id = ur.role_id
       WHERE ur.user_id = $1 AND c.name = $2
       LIMIT 1`,
      [userId, requiredCapability]
    );
    return capabilitiesRes.rows.length > 0;
  } catch (error) {
    console.error('Authorization check error:', error);
    return false;
  }
}

/**
 * A higher-order function to protect API routes.
 * It checks for a valid token and, optionally, a required capability.
 * @param {function} handler - The API route handler function (e.g., GET, POST).
 * @param {string} [requiredCapability] - The capability required to access the route.
 * @returns {function} The wrapped handler which can be exported from a route.js file.
 */
export function withAuth(handler, requiredCapability) {
  return async (req, context) => {
    const decodedToken = await verifyToken();

    if (!decodedToken) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    if (requiredCapability) {
      const authorized = await hasCapability(decodedToken.userId, requiredCapability);
      if (!authorized) {
        return NextResponse.json({ message: 'Forbidden: You do not have the required permission.' }, { status: 403 });
      }
    }

    // Add auth context to the request context for the handler
    context.auth = decodedToken;

    return handler(req, context);
  };
}

// Export the pool function for use in other parts of the backend
export { getDbPool };
