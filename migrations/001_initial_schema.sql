-- 001_initial_schema.sql

-- Section 1: Table Creation
-- ==========================

-- tenants: Stores top-level information for each tenant.
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    company_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- users: Stores login information for all users.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- roles: Defines the roles that can be assigned to users.
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, name)
);

-- capabilities: A master list of all possible permissions.
CREATE TABLE capabilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

-- user_roles: Assigns roles to users (junction table).
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- role_capabilities: Assigns capabilities to roles (junction table).
CREATE TABLE role_capabilities (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    capability_id INTEGER NOT NULL REFERENCES capabilities(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, capability_id)
);


-- Section 2: Initial Data Seeding
-- ================================

-- Step 1: Populate the 'capabilities' table
INSERT INTO capabilities (name, description) VALUES
('users:create', 'Allows creating new users.'),
('users:list', 'Allows listing users.'),
('users:update', 'Allows updating existing users.'),
('users:delete', 'Allows deleting users.'),
('roles:create', 'Allows creating new roles.'),
('roles:list', 'Allows listing roles.'),
('roles:update', 'Allows updating existing roles.'),
('roles:delete', 'Allows deleting roles.'),
('tenants:create', 'Allows creating new tenants.'),
('tenants:list', 'Allows listing tenants.'),
('tenants:update', 'Allows updating existing tenants.'),
('tenants:delete', 'Allows deleting tenants.'),
('tenants:manage', 'Allows managing tenants (a super-admin capability).'),
('inventory:list', 'Allows listing inventory.'),
('sales_orders:delete', 'Allows deleting sales orders.');

-- Step 2: Create global role templates (tenant_id is NULL)
INSERT INTO roles (name, description, tenant_id) VALUES
('Super Administrator', 'Has all permissions across all tenants.', NULL),
('Tenant Administrator', 'Has all permissions for a specific tenant, except tenant management.', NULL);

-- Step 3: Assign capabilities to roles
DO $$
DECLARE
    super_admin_role_id INT;
    tenant_admin_role_id INT;
BEGIN
    -- Get the IDs of the roles we just created
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super Administrator' AND tenant_id IS NULL;
    SELECT id INTO tenant_admin_role_id FROM roles WHERE name = 'Tenant Administrator' AND tenant_id IS NULL;

    -- Assign ALL capabilities to 'Super Administrator'
    INSERT INTO role_capabilities (role_id, capability_id)
    SELECT super_admin_role_id, id FROM capabilities;

    -- Assign all capabilities EXCEPT 'tenants:*' to 'Tenant Administrator'
    INSERT INTO role_capabilities (role_id, capability_id)
    SELECT tenant_admin_role_id, id FROM capabilities WHERE name NOT LIKE 'tenants:%';
END $$;


-- Step 4: Create the initial Super Administrator user
-- Password for this user is "password"
INSERT INTO users (name, email, password_hash, tenant_id)
VALUES ('Jaime', 'jaime@aiq5.com', '$2a$10$JLfIW8Hc9PwbZ3DpM.VSWeY0JoPaOBuI1Wq7gcQxE42MCL7ApiLK6', NULL);

-- Step 5: Assign the 'Super Administrator' role to the new user
DO $$
DECLARE
    user_id_val INT;
    role_id_val INT;
BEGIN
    -- Get the ID of the user we just created
    SELECT id INTO user_id_val FROM users WHERE email = 'jaime@aiq5.com';

    -- Get the ID of the 'Super Administrator' role
    SELECT id INTO role_id_val FROM roles WHERE name = 'Super Administrator' AND tenant_id IS NULL;

    -- Assign the role to the user
    INSERT INTO user_roles (user_id, role_id)
    VALUES (user_id_val, role_id_val);
END $$;
