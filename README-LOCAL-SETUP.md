# 🚀 Local PostgreSQL Setup Guide

This guide will help you set up Jaan Connect with a local PostgreSQL database instead of Supabase.

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- npm or bun package manager

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `pg` - PostgreSQL client for Node.js
- `express` - Backend API server
- `cors` - Enable CORS for API
- `cookie-parser` - Handle authentication cookies
- `tsx` - TypeScript execution
- `concurrently` - Run multiple processes

### 2. Setup PostgreSQL Database

Run the database setup script:

```bash
chmod +x database/setup-db.sh
npm run db:setup
```

This will:
- Create database: `jaan_connect`
- Create user: `jaan_admin` with password: `jaan_password_2026`
- Grant necessary privileges

**Note:** If you get permission errors, you may need to run parts of the script manually:

```bash
sudo -u postgres psql -c "CREATE USER jaan_admin WITH PASSWORD 'jaan_password_2026';"
sudo -u postgres psql -c "CREATE DATABASE jaan_connect OWNER jaan_admin;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jaan_connect TO jaan_admin;"
```

### 3. Run Database Migrations

Apply the schema and create tables:

```bash
npm run db:migrate
```

Or manually:

```bash
psql -U jaan_admin -d jaan_connect -f database/migration.sql
```

Enter password when prompted: `jaan_password_2026`

This will:
- Create all necessary tables (users, profiles, user_roles, sessions)
- Set up triggers and functions
- Create a default admin user:
  - Email: `admin@jaanconnect.com`
  - Password: `admin123`

### 4. Environment Variables

The `.env` file has been updated to use local PostgreSQL:

```env
VITE_DATABASE_URL="postgresql://jaan_admin:jaan_password_2026@localhost:5432/jaan_connect"
VITE_API_URL="http://localhost:3001"
```

### 5. Start the Application

Run both frontend and backend together:

```bash
npm run dev:all
```

Or run them separately in different terminals:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend API:**
```bash
npm run server
```

The application will be available at:
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3001

## Access Admin Portal

### Option 1: Use Default Admin Account

1. Go to http://localhost:8080/auth
2. Sign in with:
   - Email: `admin@jaanconnect.com`
   - Password: `admin123`
3. Navigate to http://localhost:8080/admin

**⚠️ Important:** Change this password after first login!

### Option 2: Create Your Own Admin Account

1. Sign up at http://localhost:8080/auth
2. Connect to PostgreSQL:
   ```bash
   psql -U jaan_admin -d jaan_connect
   ```
3. Make yourself admin:
   ```sql
   INSERT INTO user_roles (user_id, role)
   SELECT id, 'admin'
   FROM users
   WHERE email = 'your-email@example.com';
   ```
4. Sign out and sign in again
5. Access http://localhost:8080/admin

## Database Management

### View All Users

```bash
psql -U jaan_admin -d jaan_connect -c "SELECT u.email, ur.role FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id;"
```

### Reset Database

```bash
psql -U jaan_admin -d jaan_connect -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:migrate
```

### Backup Database

```bash
pg_dump -U jaan_admin jaan_connect > backup.sql
```

### Restore Database

```bash
psql -U jaan_admin jaan_connect < backup.sql
```

## API Endpoints

The backend server provides these authentication endpoints:

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/user` - Get current user (requires auth)
- `GET /api/health` - Health check

## Troubleshooting

### PostgreSQL Connection Errors

1. Check if PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Start PostgreSQL if needed:
   ```bash
   sudo systemctl start postgresql
   ```

3. Verify connection:
   ```bash
   psql -U jaan_admin -d jaan_connect -c "SELECT 1;"
   ```

### Migration Errors

If you get "relation already exists" errors, the tables are already created. You can:

1. Drop and recreate:
   ```bash
   psql -U jaan_admin -d jaan_connect -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
   npm run db:migrate
   ```

2. Or skip the error if tables are already set up correctly.

### Authentication Not Working

1. Check if backend server is running on port 3001
2. Check browser console for CORS errors
3. Clear cookies and try again
4. Verify session in database:
   ```bash
   psql -U jaan_admin -d jaan_connect -c "SELECT * FROM sessions;"
   ```

## Next Steps

- Update the default admin password
- Customize the database schema as needed
- Add product tables and other business logic
- Configure production environment variables
- Set up SSL for production PostgreSQL connection

## Reverting to Supabase

To switch back to Supabase, uncomment the Supabase config in `.env`:

```env
VITE_SUPABASE_PROJECT_ID="qdszmhqmnviywaakefgi"
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="https://qdszmhqmnviywaakefgi.supabase.co"
```

And comment out the PostgreSQL config.
