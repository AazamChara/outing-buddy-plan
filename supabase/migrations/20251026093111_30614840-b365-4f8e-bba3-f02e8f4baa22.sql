-- Ensure trigger to create profile on user signup exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Ensure trigger to add creator as admin on group creation exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'add_creator_as_admin_trigger'
  ) THEN
    CREATE TRIGGER add_creator_as_admin_trigger
      AFTER INSERT ON public.groups
      FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_admin();
  END IF;
END $$;

-- Add an explicit policy allowing authenticated users to create groups (in case it's missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'groups' 
      AND policyname = 'Users can create groups (auth check)'
  ) THEN
    CREATE POLICY "Users can create groups (auth check)"
      ON public.groups
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;