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
import { PermissionsDialog } from "@/components/PermissionsDialog";
import { ContactSelector } from "@/components/ContactSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface Group {
  id: string;
  name: string;
  memberCount: number;
  photo_url: string | null;
  description: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const isMobile = useIsMobile();

  // Check auth and redirect to login if not authenticated
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch groups
  useEffect(() => {
    if (!user) return;
    
    const fetchGroups = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('groups')
          .select(`
            id,
            name,
            description,
            photo_url,
            group_members (count)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedGroups = data?.map((group: any) => ({
          id: group.id,
          name: group.name,
          memberCount: group.group_members?.[0]?.count || 1,
          photo_url: group.photo_url,
          description: group.description,
        })) || [];

        setGroups(formattedGroups);
      } catch (error: any) {
        console.error('Error fetching groups:', error);
        toast.error('Failed to load groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  const handleCreateGroup = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let photoUrl = null;

      // Upload photo if selected
      if (groupPhoto) {
        const fileExt = groupPhoto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('group-photos')
          .upload(fileName, groupPhoto);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('group-photos')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Create group
      const { data: newGroup, error: groupError } = await (supabase as any)
        .from('groups')
        .insert({
          name: groupName,
          description: description || null,
          photo_url: photoUrl,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      toast.success('Group created successfully!');
      
      // Refresh groups list
      const { data: groupsData, error: fetchError } = await (supabase as any)
        .from('groups')
        .select(`
          id,
          name,
          description,
          photo_url,
          group_members (count)
        `)
        .order('created_at', { ascending: false });

      if (!fetchError && groupsData) {
        const formattedGroups = groupsData.map((group: any) => ({
          id: group.id,
          name: group.name,
          memberCount: group.group_members?.[0]?.count || 1,
          photo_url: group.photo_url,
          description: group.description,
        }));
        setGroups(formattedGroups);
      }

      setIsCreateDialogOpen(false);
      
      // Reset form
      setGroupName("");
      setDescription("");
      setSelectedFriends([]);
      setGroupPhoto(null);
      setGroupPhotoPreview(null);
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupPhoto(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <PermissionsDialog />
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
          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading groups...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {groups.map((group, index) => (
                <div key={group.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <GroupCard 
                    name={group.name}
                    memberCount={group.memberCount}
                    lastActivity={group.description || "Just created"}
                    imageUrl={group.photo_url || groupPlaceholder}
                    hasNotifications={false}
                    onClick={() => navigate(`/group/${group.id}`)} 
                  />
                </div>
              ))}
            </div>
          )}

          {/* Empty State / CTA */}
          {groups.length === 0 && !loading && (
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

              {/* Group Name */}
              <div className="space-y-2">
                <Label htmlFor="group-name-mobile">Group Name</Label>
                <Input
                  id="group-name-mobile"
                  placeholder="e.g., Adventure Squad"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              {/* Description */}
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

              {/* Add Friends from Contacts */}
              <div className="space-y-2">
                <Label>Add Friends</Label>
                <ContactSelector onContactsSelected={setSelectedFriends} />
                {selectedFriends.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFriends.length} friend(s) selected
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-background pb-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || loading}
                >
                  {loading ? "Creating..." : "Create Group"}
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

              {/* Group Name */}
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g., Adventure Squad"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              {/* Description */}
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

              {/* Add Friends from Contacts */}
              <div className="space-y-2">
                <Label>Add Friends</Label>
                <ContactSelector onContactsSelected={setSelectedFriends} />
                {selectedFriends.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFriends.length} friend(s) selected
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || loading}
                >
                  {loading ? "Creating..." : "Create Group"}
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
