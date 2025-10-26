-- 1) Clean up conflicting INSERT policies on groups and keep a single permissive policy relying on trigger
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups (auth check)" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups (trigger sets creator)" ON public.groups;

-- Recreate the single INSERT policy that works with the BEFORE INSERT trigger
CREATE POLICY "Users can create groups (trigger sets creator)"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 2) Ensure triggers exist exactly once
-- Drop any legacy/duplicate trigger if present
DROP TRIGGER IF EXISTS on_group_created ON public.groups;

-- Create set_group_creator_trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_group_creator_trigger'
  ) THEN
    CREATE TRIGGER set_group_creator_trigger
    BEFORE INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_group_creator();
  END IF;
END $$;

-- Create add_creator_as_admin_trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'add_creator_as_admin_trigger'
  ) THEN
    CREATE TRIGGER add_creator_as_admin_trigger
    AFTER INSERT ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.add_creator_as_admin();
  END IF;
END $$;

-- 3) Add unique constraint to group_members (group_id, user_id) to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_members_group_user_unique'
  ) THEN
    ALTER TABLE public.group_members
      ADD CONSTRAINT group_members_group_user_unique UNIQUE (group_id, user_id);
  END IF;
END $$;
