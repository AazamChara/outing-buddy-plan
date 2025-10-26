import { Users, Camera, UserPlus, UserMinus, LogOut, X, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { ContactSelector } from "./ContactSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Member {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  role?: 'admin' | 'member';
}

interface GroupSettingsProps {
  groupName: string;
  groupPhoto?: string;
  members: Member[];
  currentUserRole: 'admin' | 'member';
  onUpdateGroupName: (name: string) => void;
  onUpdateGroupPhoto: (photo: string | null) => void;
  onAddMembers: (members: string[]) => void;
  onRemoveMember: (memberId: string) => void;
  onPromoteToAdmin: (memberId: string) => void;
  onExitGroup: () => void;
  onDeleteGroup: () => void;
}

export const GroupSettings = ({
  groupName,
  groupPhoto,
  members,
  currentUserRole,
  onUpdateGroupName,
  onUpdateGroupPhoto,
  onAddMembers,
  onRemoveMember,
  onPromoteToAdmin,
  onExitGroup,
  onDeleteGroup,
}: GroupSettingsProps) => {
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupName);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [memberToPromote, setMemberToPromote] = useState<string | null>(null);

  const isAdmin = currentUserRole === 'admin';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateGroupPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    if (newGroupName.trim()) {
      onUpdateGroupName(newGroupName.trim());
      setEditingName(false);
    }
  };

  const handleAddMembers = (selectedMembers: string[]) => {
    onAddMembers(selectedMembers);
    setShowAddMembers(false);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Group Photo Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Group Photo</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={groupPhoto} />
            <AvatarFallback className="bg-[hsl(var(--teal))]/10 text-[hsl(var(--teal))] text-xl">
              {groupName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <label htmlFor="group-photo-upload">
              <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                <span>
                  <Camera className="h-4 w-4 mr-2" />
                  {groupPhoto ? "Change Photo" : "Add Photo"}
                </span>
              </Button>
            </label>
            <input
              id="group-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            {groupPhoto && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateGroupPhoto(null)}
                className="text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Photo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Group Name Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Group Name</Label>
        {editingName ? (
          <div className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name"
              maxLength={50}
            />
            <Button onClick={handleSaveName} size="sm">
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewGroupName(groupName);
                setEditingName(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-foreground font-medium">{groupName}</p>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setEditingName(true)}>
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Members ({members.length})
          </Label>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMembers(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Members
            </Button>
          )}
        </div>

        {/* Add Members View */}
        {showAddMembers ? (
          <Card className="p-4 border-border">
            <ContactSelector
              onContactsSelected={(contacts) => {
                const phoneNumbers = contacts.map(c => c.phone || c.email);
                handleAddMembers(phoneNumbers);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddMembers(false)}
              className="w-full mt-3"
            >
              Cancel
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <Card key={member.id} className="p-3 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-secondary">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{member.name}</p>
                        {member.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && member.role !== 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToPromote(member.id)}
                        className="text-primary hover:text-primary"
                        title="Make Admin"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Exit/Delete Group Section */}
      <div className="pt-4 border-t border-border space-y-3">
        {isAdmin && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Group
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => setShowExitDialog(true)}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Exit Group
        </Button>
      </div>

      {/* Remove Member Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the group? They will no longer be able to participate in polls.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToRemove) {
                  onRemoveMember(memberToRemove);
                  setMemberToRemove(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote to Admin Dialog */}
      <AlertDialog open={!!memberToPromote} onOpenChange={() => setMemberToPromote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make this member an admin? They will have full control over the group including the ability to delete it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToPromote) {
                  onPromoteToAdmin(memberToPromote);
                  setMemberToPromote(null);
                }
              }}
            >
              Make Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Group Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit this group? You will no longer receive updates or be able to participate in polls.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onExitGroup();
                setShowExitDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Exit Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this group? This action cannot be undone. All polls, messages, and group data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteGroup();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
