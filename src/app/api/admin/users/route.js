import { NextResponse } from 'next/server';
import { withAuth, getDbPool } from '../../../../lib/auth';

// This is the raw handler function for GET requests
async function userListHandler(req, { auth }) {
  // The `auth` object, containing { userId, tenantId }, is passed from the withAuth wrapper
  const { tenantId } = auth;

  const pool = getDbPool();
  try {
    let query;
    let params;

    // Super Admin (tenantId is NULL) can see all users from all tenants.
    // A Tenant Admin (tenantId is not NULL) can only see users within their own tenant.
    if (tenantId) {
      query = 'SELECT id, name, email, tenant_id FROM users WHERE tenant_id = $1 ORDER BY name';
      params = [tenantId];
    } else {
      // This is the Super Admin case
      query = 'SELECT id, name, email, tenant_id FROM users ORDER BY name';
      params = [];
    }

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ message: 'Failed to fetch users due to a server error.' }, { status: 500 });
  }
}

// Wrap the handler with the withAuth HOF.
// This ensures that only authenticated users with the 'users:list' capability can access this route.
export const GET = withAuth(userListHandler, 'users:list');
