-- migrations/001_initial_schema.sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants Table: Core of the multitenant system
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table: Stores user credentials and links to a tenant
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles Table: Defines roles within the system
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for global roles
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, name)
);

-- Capabilities Table: Defines granular permissions
CREATE TABLE capabilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT
);

-- User-Roles Junction Table
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Role-Capabilities Junction Table
CREATE TABLE role_capabilities (
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    capability_id INTEGER REFERENCES capabilities(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, capability_id)
);

-- Seed Data

-- Insert a default tenant
INSERT INTO tenants (company_name) VALUES ('Default Company');

-- Insert users
-- Super Admin (password: "superpassword")
INSERT INTO users (id, name, email, password_hash) VALUES
(1, 'Super Admin', 'superadmin@example.com', '$2a$10$cK/6NrvFa76DMsxkeMj3XeArAuizYQI25gf1iFXeMltY6yqtZNEBO');
-- Regular User (password: "password")
INSERT INTO users (id, tenant_id, name, email, password_hash) VALUES
(2, 1, 'Test User', 'user@example.com', '$2a$10$cK/6NrvFa76DMsxkeMj3XeArAuizYQI25gf1iFXeMltY6yqtZNEBO');

-- Insert capabilities
INSERT INTO capabilities (name, description) VALUES
('users:create', 'Can create new users'),
('users:read', 'Can read user information'),
('users:update', 'Can update user information'),
('users:delete', 'Can delete users'),
('tenants:create', 'Can create new tenants'),
('tenants:read', 'Can read tenant information');


-- Insert roles
INSERT INTO roles (id, name, description, is_global) VALUES
(1, 'Super Administrator', 'Has all permissions across all tenants', TRUE),
(2, 'Tenant Admin', 'Administrator for a specific tenant', FALSE);

-- Assign capabilities to roles
-- Super Admin gets all capabilities
INSERT INTO role_capabilities (role_id, capability_id)
SELECT 1, id FROM capabilities;
-- Tenant Admin gets user management capabilities
INSERT INTO role_capabilities (role_id, capability_id)
SELECT 2, id FROM capabilities WHERE name LIKE 'users:%';


-- Assign roles to users
-- Super Admin user gets the Super Administrator role
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
-- Regular user gets the Tenant Admin role
INSERT INTO user_roles (user_id, role_id) VALUES (2, 2);