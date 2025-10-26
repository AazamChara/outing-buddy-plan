-- Create messages table for group chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'location', 'contact', 'activity')),
  media_url text,
  activity_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create polls table
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  event_date timestamptz,
  event_time text,
  location text,
  anonymous_voting boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create poll_options table
CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Create poll_reactions table
CREATE TABLE public.poll_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(option_id, user_id, emoji)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('poll', 'invite', 'group', 'message')),
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create group_invites table
CREATE TABLE public.group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invited_user uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, invited_user)
);

-- Enable RLS on all new tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their groups"
  ON public.messages FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can insert messages in their groups"
  ON public.messages FOR INSERT
  WITH CHECK (is_group_member(auth.uid(), group_id) AND auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);

-- RLS Policies for polls
CREATE POLICY "Users can view polls from their groups"
  ON public.polls FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can create polls in their groups"
  ON public.polls FOR INSERT
  WITH CHECK (is_group_member(auth.uid(), group_id) AND auth.uid() = created_by);

CREATE POLICY "Poll creators can update their polls"
  ON public.polls FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Poll creators can delete their polls"
  ON public.polls FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for poll_options
CREATE POLICY "Users can view poll options from their groups"
  ON public.poll_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.polls
    WHERE polls.id = poll_options.poll_id
    AND is_group_member(auth.uid(), polls.group_id)
  ));

CREATE POLICY "Poll creators can insert options"
  ON public.poll_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.polls
    WHERE polls.id = poll_options.poll_id
    AND polls.created_by = auth.uid()
  ));

CREATE POLICY "Poll creators can update options"
  ON public.poll_options FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.polls
    WHERE polls.id = poll_options.poll_id
    AND polls.created_by = auth.uid()
  ));

CREATE POLICY "Poll creators can delete options"
  ON public.poll_options FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.polls
    WHERE polls.id = poll_options.poll_id
    AND polls.created_by = auth.uid()
  ));

-- RLS Policies for poll_votes
CREATE POLICY "Users can view votes from their group polls"
  ON public.poll_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.polls
    WHERE polls.id = poll_votes.poll_id
    AND is_group_member(auth.uid(), polls.group_id)
  ));

CREATE POLICY "Users can vote in their group polls"
  ON public.poll_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls
      WHERE polls.id = poll_votes.poll_id
      AND is_group_member(auth.uid(), polls.group_id)
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own votes"
  ON public.poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for poll_reactions
CREATE POLICY "Users can view reactions from their group polls"
  ON public.poll_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.poll_options
    JOIN public.polls ON polls.id = poll_options.poll_id
    WHERE poll_options.id = poll_reactions.option_id
    AND is_group_member(auth.uid(), polls.group_id)
  ));

CREATE POLICY "Users can add reactions in their group polls"
  ON public.poll_reactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.poll_options
      JOIN public.polls ON polls.id = poll_options.poll_id
      WHERE poll_options.id = poll_reactions.option_id
      AND is_group_member(auth.uid(), polls.group_id)
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own reactions"
  ON public.poll_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for group_invites
CREATE POLICY "Users can view invites they sent or received"
  ON public.group_invites FOR SELECT
  USING (auth.uid() = invited_by OR auth.uid() = invited_user);

CREATE POLICY "Group admins can invite users"
  ON public.group_invites FOR INSERT
  WITH CHECK (is_group_admin(auth.uid(), group_id) AND auth.uid() = invited_by);

CREATE POLICY "Invited users can update their invite status"
  ON public.group_invites FOR UPDATE
  USING (auth.uid() = invited_user);

-- Create notification function for polls
CREATE OR REPLACE FUNCTION public.notify_on_poll()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record record;
BEGIN
  FOR member_record IN 
    SELECT user_id FROM public.group_members 
    WHERE group_id = NEW.group_id AND user_id != NEW.created_by
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      member_record.user_id,
      'poll',
      'New Poll',
      'A new poll was created: ' || NEW.title,
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- Create notification function for invites
CREATE OR REPLACE FUNCTION public.notify_on_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  group_name text;
  inviter_name text;
BEGIN
  SELECT name INTO group_name FROM public.groups WHERE id = NEW.group_id;
  SELECT full_name INTO inviter_name FROM public.profiles WHERE id = NEW.invited_by;
  
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (
    NEW.invited_user,
    'invite',
    'Group Invitation',
    inviter_name || ' invited you to join ' || group_name,
    NEW.group_id
  );
  RETURN NEW;
END;
$$;

-- Create function to auto-accept invites and add to group
CREATE OR REPLACE FUNCTION public.accept_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.group_id, NEW.invited_user, 'member')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_poll_created
  AFTER INSERT ON public.polls
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_poll();

CREATE TRIGGER on_invite_created
  AFTER INSERT ON public.group_invites
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_invite();

CREATE TRIGGER on_invite_accepted
  AFTER UPDATE ON public.group_invites
  FOR EACH ROW EXECUTE FUNCTION public.accept_invite();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_invites;

-- Create indexes for performance
CREATE INDEX idx_messages_group_id ON public.messages(group_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_polls_group_id ON public.polls(group_id);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON public.poll_votes(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_group_invites_invited_user ON public.group_invites(invited_user);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-photos', 'group-photos', true),
       ('chat-media', 'chat-media', true),
       ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for group photos
CREATE POLICY "Group photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'group-photos');

CREATE POLICY "Users can upload group photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'group-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update group photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'group-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete group photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'group-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for chat media
CREATE POLICY "Chat media is accessible to group members"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

CREATE POLICY "Users can upload chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their chat media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);