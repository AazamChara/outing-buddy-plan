import { Users, Camera, UserPlus, UserMinus, LogOut, X } from "lucide-react";
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
}

interface GroupSettingsProps {
  groupName: string;
  groupPhoto?: string;
  members: Member[];
  onUpdateGroupName: (name: string) => void;
  onUpdateGroupPhoto: (photo: string | null) => void;
  onAddMembers: (members: string[]) => void;
  onRemoveMember: (memberId: string) => void;
  onExitGroup: () => void;
}

export const GroupSettings = ({
  groupName,
  groupPhoto,
  members,
  onUpdateGroupName,
  onUpdateGroupPhoto,
  onAddMembers,
  onRemoveMember,
  onExitGroup,
}: GroupSettingsProps) => {
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupName);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

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
            <Button variant="outline" size="sm" onClick={() => setEditingName(true)}>
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Members ({members.length})
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddMembers(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Members
          </Button>
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
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.phone}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMemberToRemove(member.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Exit Group Section */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="destructive"
          className="w-full"
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
    </div>
  );
};
