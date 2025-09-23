import { NextResponse } from 'next/server';
import { getDbPool } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  const pool = getDbPool();

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // Use pool directly for query
    const result = await pool.query('SELECT id, tenant_id, password_hash FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      // Use a generic message to prevent email enumeration attacks
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // Fetch user capabilities
    const capabilitiesRes = await pool.query(
      `SELECT DISTINCT c.name FROM capabilities c
       JOIN role_capabilities rc ON c.id = rc.capability_id
       JOIN user_roles ur ON rc.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    const capabilities = capabilitiesRes.rows.map(row => row.name);

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d', // Token expires in 1 day
      }
    );

    // Return token and user info (without password hash)
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: email, // we can get it from the request
        capabilities: capabilities
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
