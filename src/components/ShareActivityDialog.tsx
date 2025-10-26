import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Vote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import groupPlaceholder from "@/assets/group-placeholder.jpg";

interface Activity {
  id: string;
  title: string;
  type: string;
  venue?: string;
  date?: string;
  price?: string;
  image?: string;
  rating?: number;
}

interface Group {
  id: number;
  name: string;
  memberCount: number;
  imageUrl: string;
}

interface ShareActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
}

// Mock groups - in production, this would come from backend
const mockGroups: Group[] = [
  {
    id: 1,
    name: "Adventure Squad",
    memberCount: 5,
    imageUrl: groupPlaceholder,
  },
  {
    id: 2,
    name: "Foodie Friends",
    memberCount: 8,
    imageUrl: groupPlaceholder,
  },
  {
    id: 3,
    name: "Weekend Warriors",
    memberCount: 6,
    imageUrl: groupPlaceholder,
  },
];

export const ShareActivityDialog = ({ open, onOpenChange, activity }: ShareActivityDialogProps) => {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleShareToChat = () => {
    if (!selectedGroup || !activity) return;
    
    const group = mockGroups.find(g => g.id === selectedGroup);
    
    // Create a rich activity card message
    const activityMessage = {
      id: Date.now(),
      text: "Check out this activity!",
      sender: "You",
      timestamp: new Date(),
      isOwn: true,
      type: "activity",
      activityData: {
        id: activity.id,
        title: activity.title,
        type: activity.type,
        venue: activity.venue,
        date: activity.date,
        price: activity.price,
        image: activity.image,
        rating: activity.rating
      }
    };
    
    // Store the message to be picked up by the chat component
    const existingMessages = JSON.parse(localStorage.getItem(`chat_messages_${selectedGroup}`) || '[]');
    localStorage.setItem(`chat_messages_${selectedGroup}`, JSON.stringify([...existingMessages, activityMessage]));
    
    toast.success(`Activity shared to ${group?.name}`);
    onOpenChange(false);
    navigate(`/group/${selectedGroup}/chat`);
  };

  const handleCreatePoll = () => {
    if (!selectedGroup || !activity) return;
    
    const group = mockGroups.find(g => g.id === selectedGroup);
    
    // Create a new poll with the activity
    const newPoll = {
      id: Date.now(),
      title: `${activity.title}${activity.venue ? ` at ${activity.venue}` : ''}`,
      eventDate: activity.date ? new Date(activity.date) : undefined,
      location: activity.venue,
      options: [
        { id: 1, text: "I'm interested! ✅", votes: 0 },
        { id: 2, text: "Maybe later 🤔", votes: 0 },
        { id: 3, text: "Not this time ❌", votes: 0 }
      ],
      totalVotes: 0,
      anonymousVoting: false,
      activityData: activity
    };
    
    // Store the poll to be picked up by the group detail component
    const existingPolls = JSON.parse(localStorage.getItem(`group_polls_${selectedGroup}`) || '[]');
    localStorage.setItem(`group_polls_${selectedGroup}`, JSON.stringify([newPoll, ...existingPolls]));
    
    toast.success(`Poll created in ${group?.name}`);
    onOpenChange(false);
    navigate(`/group/${selectedGroup}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Activity</DialogTitle>
        </DialogHeader>
        
        {activity && (
          <div className="mb-4 p-3 bg-secondary rounded-lg">
            <div className="flex gap-3">
              {activity.image && (
                <img 
                  src={activity.image} 
                  alt={activity.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-1">{activity.title}</h4>
                {activity.venue && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{activity.venue}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Select a group:</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {mockGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  selectedGroup === group.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[hsl(var(--teal))]/10 text-[hsl(var(--teal))]">
                    {group.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{group.memberCount} members</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1 border-2 hover:bg-secondary"
            onClick={handleShareToChat}
            disabled={!selectedGroup}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Share to Chat
          </Button>
          <Button
            className="flex-1 bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white shadow-md"
            onClick={handleCreatePoll}
            disabled={!selectedGroup}
          >
            <Vote className="mr-2 h-4 w-4" />
            Create Poll
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
