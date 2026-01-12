-- ============================================
-- ADMIN SETUP SCRIPT
-- ============================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qdszmhqmnviywaakefgi/sql

-- Step 1: First, sign up a user through your app at http://localhost:8080/auth
-- Step 2: Copy the user's email below and run this script

-- Replace 'your-email@example.com' with the actual email you registered with
DO $$
DECLARE
  user_email TEXT := 'your-email@example.com';  -- CHANGE THIS!
  user_uuid UUID;
BEGIN
  -- Get the user ID from the email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please sign up first at http://localhost:8080/auth', user_email;
  END IF;
  
  -- Check if already admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  ) THEN
    RAISE NOTICE 'User % is already an admin!', user_email;
  ELSE
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_uuid, 'admin');
    
    RAISE NOTICE 'Successfully granted admin role to %', user_email;
  END IF;
END $$;

-- Verify the admin user
SELECT 
  u.email,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE ur.role = 'admin';
