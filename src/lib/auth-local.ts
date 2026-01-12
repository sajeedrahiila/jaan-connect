import { query } from './db';
import { randomBytes } from 'crypto';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  email_confirmed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface UserWithRole extends User {
  role?: 'admin' | 'moderator' | 'user';
}

// Hash password using bcrypt (PostgreSQL pgcrypto extension)
export async function hashPassword(password: string): Promise<string> {
  const result = await query(
    "SELECT crypt($1, gen_salt('bf')) as hash",
    [password]
  );
  return result.rows[0].hash;
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const result = await query(
    'SELECT (crypt($1, $2) = $2) as match',
    [password, hash]
  );
  return result.rows[0].match;
}

// Create a new user
export async function createUser(email: string, password: string, fullName: string): Promise<User> {
  const hashedPassword = await hashPassword(password);
  
  const result = await query(
    `INSERT INTO users (email, encrypted_password, full_name, email_confirmed_at)
     VALUES ($1, $2, $3, now())
     RETURNING id, email, full_name, email_confirmed_at, created_at, updated_at`,
    [email, hashedPassword, fullName]
  );
  
  return result.rows[0];
}

// Sign in user and create session
export async function signIn(email: string, password: string): Promise<{ user: UserWithRole; session: Session } | null> {
  // Get user with password hash
  const userResult = await query(
    'SELECT id, email, full_name, encrypted_password, email_confirmed_at, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  
  if (userResult.rows.length === 0) {
    return null;
  }
  
  const user = userResult.rows[0];
  
  // Verify password
  const isValid = await verifyPassword(password, user.encrypted_password);
  if (!isValid) {
    return null;
  }
  
  // Get user role
  const roleResult = await query(
    'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY CASE role WHEN \'admin\' THEN 1 WHEN \'moderator\' THEN 2 ELSE 3 END LIMIT 1',
    [user.id]
  );
  
  const role = roleResult.rows[0]?.role || 'user';
  
  // Create session token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const sessionResult = await query(
    `INSERT INTO sessions (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token, expires_at, created_at`,
    [user.id, token, expiresAt]
  );
  
  const { encrypted_password, ...userWithoutPassword } = user;
  
  return {
    user: { ...userWithoutPassword, role },
    session: sessionResult.rows[0]
  };
}

// Verify session token
export async function verifySession(token: string): Promise<UserWithRole | null> {
  const result = await query(
    `SELECT u.id, u.email, u.full_name, u.email_confirmed_at, u.created_at, u.updated_at,
            ur.role
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     WHERE s.token = $1 AND s.expires_at > now()
     ORDER BY CASE ur.role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
     LIMIT 1`,
    [token]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

// Sign out (delete session)
export async function signOut(token: string): Promise<void> {
  await query('DELETE FROM sessions WHERE token = $1', [token]);
}

// Check if user has admin role
export async function isUserAdmin(userId: string): Promise<boolean> {
  const result = await query(
    'SELECT has_role($1, $2) as is_admin',
    [userId, 'admin']
  );
  return result.rows[0].is_admin;
}

// Get user by ID
export async function getUserById(userId: string): Promise<UserWithRole | null> {
  const result = await query(
    `SELECT u.id, u.email, u.full_name, u.email_confirmed_at, u.created_at, u.updated_at,
            ur.role
     FROM users u
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     WHERE u.id = $1
     ORDER BY CASE ur.role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
     LIMIT 1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}
