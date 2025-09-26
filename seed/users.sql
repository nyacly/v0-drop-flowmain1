-- Seed data for users table
-- This creates test users for development and testing

INSERT INTO users (id, email, password_hash, is_verified, created_at, updated_at, subscription_type, stripe_customer_id) VALUES
(
  1,
  'driver@dropflow.com',
  '8a4d4f3a7b2c1e9d8e6f5a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2.1a2b3c4d5e6f7a8b',
  true,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '1 day',
  'free',
  NULL
),
(
  2,
  'admin@dropflow.com',
  '9b5e5f4a8c3d2f0e9f7a6b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d.2b3c4d5e6f7a8b9c',
  true,
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '2 days',
  'pro_monthly',
  'cus_test_admin_customer_id'
),
(
  3,
  'pro.driver@dropflow.com',
  'ac6f6f5a9d4e3f1faf8b7c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e.3c4d5e6f7a8b9c0d',
  true,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '3 days',
  'pro_yearly',
  'cus_test_pro_customer_id'
),
(
  4,
  'newbie@dropflow.com',
  'bd7a7a6bae5f4f2fbf9c8d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f.4d5e6f7a8b9c0d1e',
  true,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 hour',
  'free',
  NULL
),
(
  5,
  'tester@dropflow.com',
  'ce8b8b7cbf6a5a3aca0d9e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a.5e6f7a8b9c0d1e2f',
  false,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour',
  'free',
  NULL
);

-- Add test verification codes for unverified users
INSERT INTO verification_codes (user_id, code, expires_at, created_at) VALUES
(5, '123456', NOW() + INTERVAL '15 minutes', NOW());

-- Set the sequence to continue from the highest ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
