import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/GroupCard";
import groupPlaceholder from "@/assets/group-placeholder.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { ContactSelector } from "@/components/ContactSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Group {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const isMobile = useIsMobile();

  // Check if onboarding is needed
  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    if (!onboardingCompleted && user) {
      setShowWelcome(true);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();

    // Subscribe to realtime group updates
    const channel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups'
        },
        () => {
          fetchGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGroups = async () => {
    try {
      if (!user || !session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members!inner(user_id)
        `)
        .eq('group_members.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          return {
            ...group,
            member_count: count || 0
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error loading groups",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    
    setIsCreating(true);
    
    try {
      // Ensure we have a valid authenticated session
      if (!user || !session) {
        throw new Error("Please sign in to create a group");
      }

      // Double-check the session is still valid and get fresh session
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !currentSession) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      // Verify user profile exists (needed for foreign key constraint)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Your profile is still being set up. Please wait a moment and try again.");
      }

      // Upload photo if exists
      let photoUrl = null;
      if (groupPhoto) {
        const fileExt = groupPhoto.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('group-photos')
          .upload(filePath, groupPhoto);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('group-photos')
          .getPublicUrl(filePath);
        
        photoUrl = publicUrl;
      }

      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          description: description || null,
          photo_url: photoUrl,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Invite selected friends
      if (selectedFriends.length > 0) {
        const phoneNumbers = selectedFriends.map(f => f.phone);
        
        // Find users by phone
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .in('phone', phoneNumbers);

        if (profiles && profiles.length > 0) {
          await supabase
            .from('group_invites')
            .insert(
              profiles.map(profile => ({
                group_id: groupData.id,
                invited_by: user.id,
                invited_user: profile.id
              }))
            );
        }
      }

      toast({
        title: "Group created!",
        description: "Your group has been created successfully.",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      navigate(`/group/${groupData.id}`);
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: "Error creating group",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setSelectedFriends([]);
    setGroupPhoto(null);
    setGroupPhotoPreview(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupPhoto(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <WelcomeDialog 
        open={showWelcome} 
        onComplete={() => {
          setShowWelcome(false);
          fetchGroups();
        }} 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Groups Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your Groups</h2>
              <p className="text-muted-foreground">Manage and plan with your crews</p>
            </div>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {groups.map((group, index) => (
              <div key={group.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <GroupCard
                  name={group.name}
                  memberCount={group.member_count || 0}
                  lastActivity={group.description || "No description"}
                  imageUrl={group.photo_url || groupPlaceholder}
                  hasNotifications={false}
                  onClick={() => navigate(`/group/${group.id}`)}
                />
              </div>
            ))}
          </div>

          {/* Empty State / CTA */}
          {groups.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
                <Plus className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-6">Gather your crew! Create your first group to start planning.</p>
              <Button variant="hero" size="lg" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Group
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Floating Action Button */}
      <Button
        variant="fab"
        size="icon"
        className="fixed bottom-24 md:bottom-8 right-6 h-14 w-14 shadow-[var(--shadow-card)] animate-float z-40"
        onClick={() => setIsCreateDialogOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Group Dialog/Sheet */}
      {isMobile ? (
        <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-center text-xl">Create Your Group</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4 pb-8">
              {/* Group Photo */}
              <div className="space-y-2">
                <Label>Group Photo</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload-mobile"
                  />
                  <label htmlFor="photo-upload-mobile" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {groupPhoto ? groupPhoto.name : "Tap to upload"}
                    </p>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-name-mobile">Group Name</Label>
                <Input
                  id="group-name-mobile"
                  placeholder="e.g., Adventure Squad"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description-mobile">Description (Optional)</Label>
                <Textarea
                  id="description-mobile"
                  placeholder="What brings your crew together?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Add Friends</Label>
                <ContactSelector onContactsSelected={setSelectedFriends} />
                {selectedFriends.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFriends.length} friend(s) selected
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-background pb-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Create Your Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Group Photo */}
              <div className="space-y-2">
                <Label>Group Photo</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {groupPhoto ? groupPhoto.name : "Drag & drop or click to upload"}
                    </p>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g., Adventure Squad"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What brings your crew together?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Add Friends</Label>
                <ContactSelector onContactsSelected={setSelectedFriends} />
                {selectedFriends.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFriends.length} friend(s) selected
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Index;
