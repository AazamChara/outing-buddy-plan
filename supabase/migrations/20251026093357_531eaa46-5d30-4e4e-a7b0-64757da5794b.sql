-- Create function to automatically set created_by from auth.uid()
CREATE OR REPLACE FUNCTION public.set_group_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

-- Create BEFORE INSERT trigger on groups to set created_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_group_creator_trigger'
  ) THEN
    CREATE TRIGGER set_group_creator_trigger
      BEFORE INSERT ON public.groups
      FOR EACH ROW EXECUTE FUNCTION public.set_group_creator();
  END IF;
END $$;

-- Add an additional permissive policy for insert that relies on the trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'groups' AND policyname = 'Users can create groups (trigger sets creator)'
  ) THEN
    CREATE POLICY "Users can create groups (trigger sets creator)"
      ON public.groups
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;