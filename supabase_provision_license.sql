-- ============================================================
-- BisnisUrang: Auto-Provision License for New Users
-- Jalankan script ini di Supabase SQL Editor
-- Project: BisnisUrang (jeydktowldsduarptsur)
-- ============================================================

-- STEP 1: Tambah kolom plan & trial_expires_at ke tabel licenses
-- (IF NOT EXISTS aman untuk existing DB)
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'TRIAL';
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- Update existing TRIAL_14_DAYS licenses ke plan='TRIAL'
UPDATE licenses
SET plan = 'TRIAL'
WHERE tier = 'TRIAL_14_DAYS' AND plan IS NULL;

-- Update existing PRO licenses ke plan='PRO'
UPDATE licenses
SET plan = 'PRO'
WHERE tier != 'TRIAL_14_DAYS' AND (plan IS NULL OR plan = 'TRIAL');

-- STEP 2: Buat RPC function provision_new_user
-- Fungsi ini dipanggil setelah signup berhasil.
-- IDEMPOTENT: aman dipanggil berkali-kali untuk user yang sama.
CREATE OR REPLACE FUNCTION provision_new_user(
  p_user_id UUID,
  p_display_name TEXT DEFAULT 'Owner'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license_key TEXT;
  v_existing_key TEXT;
  v_existing_plan TEXT;
  v_existing_expires TIMESTAMPTZ;
  v_trial_expires TIMESTAMPTZ;
BEGIN
  -- Idempotent: return existing license jika sudah pernah di-provision
  SELECT license_key, plan, COALESCE(trial_expires_at, expires_at)
  INTO v_existing_key, v_existing_plan, v_existing_expires
  FROM licenses
  WHERE user_id = p_user_id AND status = 'ACTIVE'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_existing_key IS NOT NULL THEN
    RETURN json_build_object(
      'license_key', v_existing_key,
      'plan', COALESCE(v_existing_plan, 'TRIAL'),
      'trial_expires_at', v_existing_expires,
      'created', false
    );
  END IF;
  
  -- Generate unique license key format: BU-XXXX-XXXX using postgres core gen_random_uuid
  LOOP
    v_license_key := 'BU-' || 
      upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 4)) || '-' ||
      upper(substring(replace(gen_random_uuid()::text, '-', ''), 5, 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM licenses WHERE license_key = v_license_key);
  END LOOP;
  
  v_trial_expires := NOW() + INTERVAL '14 days';
  
  INSERT INTO licenses (
    license_key,
    user_id,
    status,
    tier,
    plan,
    registered_name,
    max_devices,
    registered_devices,
    duration_days,
    activated_at,
    expires_at,
    trial_expires_at,
    created_at,
    updated_at
  ) VALUES (
    v_license_key,
    p_user_id,
    'ACTIVE',
    'TRIAL_14_DAYS',
    'TRIAL',
    p_display_name,
    999,
    '[]'::jsonb,
    14,
    NOW(),
    v_trial_expires,
    v_trial_expires,
    NOW(),
    NOW()
  );
  
  RETURN json_build_object(
    'license_key', v_license_key,
    'plan', 'TRIAL',
    'trial_expires_at', v_trial_expires,
    'created', true
  );
END;
$$;

-- STEP 3: Grant permission ke authenticated, anon, dan service_role
GRANT EXECUTE ON FUNCTION provision_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION provision_new_user TO anon;
GRANT EXECUTE ON FUNCTION provision_new_user TO service_role;
