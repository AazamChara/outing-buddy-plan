import { ArrowLeft, MessageCircle, Plus, Search, Clock, Calendar as CalendarIcon, MapPin, Settings, MoreVertical, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GroupSettings } from "@/components/GroupSettings";
import { CreatePollForm } from "@/components/CreatePollForm";
import { toast } from "sonner";
import placeholderImage from "@/assets/group-placeholder.jpg";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PollOption {
  id: number;
  text: string;
  votes: number;
  voted?: boolean;
  reactions?: { emoji: string; count: number }[];
}

const availableReactions = ["👍", "❤️", "🎉", "🔥", "😍", "👏"];

interface Poll {
  id: number;
  title: string;
  eventDate?: Date;
  eventTime?: string;
  location?: string;
  options: PollOption[];
  totalVotes: number;
  anonymousVoting: boolean;
  reactions?: { emoji: string; count: number }[];
  pinned?: boolean;
}

const mockPolls: Poll[] = [
  {
    id: 1,
    title: "Weekend Vibes?",
    eventDate: new Date(2025, 9, 27),
    eventTime: "14:00",
    location: "Central Park, NYC",
    options: [
      { id: 1, text: "Café Crawl", votes: 3 },
      { id: 2, text: "Hiking", votes: 4, voted: true },
      { id: 3, text: "Movie Marathon", votes: 2 },
    ],
    totalVotes: 9,
    anonymousVoting: false,
    reactions: [{ emoji: "👍", count: 3 }, { emoji: "❤️", count: 2 }, { emoji: "🎉", count: 1 }],
  },
];

interface Member {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

const GroupDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [polls, setPolls] = useState<Poll[]>(mockPolls);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", "", ""]);
  const [eventDate, setEventDate] = useState<Date>();
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [anonymousVoting, setAnonymousVoting] = useState(false);
  const [showReactions, setShowReactions] = useState<Record<string, boolean>>({});
  
  const [groupName, setGroupName] = useState("Adventure Squad");
  const [groupPhoto, setGroupPhoto] = useState<string>();
  const [members, setMembers] = useState<Member[]>([
    { id: "1", name: "John Doe", phone: "+1 234 567 8900" },
    { id: "2", name: "Jane Smith", phone: "+1 234 567 8901" },
    { id: "3", name: "Mike Johnson", phone: "+1 234 567 8902" },
  ]);

  // Load group data from localStorage
  useEffect(() => {
    const savedGroups = localStorage.getItem('groups');
    if (savedGroups) {
      const groups = JSON.parse(savedGroups);
      const currentGroup = groups.find((g: any) => g.id === parseInt(id || '0'));
      if (currentGroup) {
        setGroupName(currentGroup.name);
      }
    }
  }, [id]);

  // Load shared polls from localStorage
  useEffect(() => {
    const sharedPolls = localStorage.getItem(`group_polls_${id}`);
    if (sharedPolls) {
      const parsedPolls = JSON.parse(sharedPolls);
      setPolls(prev => [...parsedPolls, ...prev]);
      localStorage.removeItem(`group_polls_${id}`); // Clear after loading
    }
  }, [id]);

  // Scroll to specific poll if needed
  useEffect(() => {
    const scrollToPollId = localStorage.getItem('scroll_to_poll');
    if (scrollToPollId) {
      setTimeout(() => {
        const element = document.getElementById(`poll-${scrollToPollId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('animate-pulse');
          setTimeout(() => element.classList.remove('animate-pulse'), 2000);
        }
        localStorage.removeItem('scroll_to_poll');
      }, 300);
    }
  }, []);

  const toggleReactions = (pollId: number) => {
    const key = `${pollId}`;
    setShowReactions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVote = (pollId: number, optionId: number) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        return {
          ...poll,
          options: poll.options.map(opt => ({
            ...opt,
            voted: opt.id === optionId,
            votes: opt.id === optionId ? opt.votes + 1 : opt.votes - (opt.voted ? 1 : 0),
          })),
          totalVotes: poll.totalVotes + 1,
        };
      }
      return poll;
    }));
  };

  const handleReaction = (pollId: number, emoji: string) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        const reactions = poll.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          return {
            ...poll,
            reactions: reactions.map(r =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            ),
          };
        } else {
          return {
            ...poll,
            reactions: [...reactions, { emoji, count: 1 }],
          };
        }
      }
      return poll;
    }));
  };

  const handleCreatePoll = () => {
    const validOptions = pollOptions.filter(opt => opt.trim());
    if (!pollTitle.trim() || validOptions.length < 2) return;

    const newPoll: Poll = {
      id: polls.length + 1,
      title: pollTitle,
      eventDate,
      eventTime,
      location,
      options: validOptions.map((text, idx) => ({
        id: idx + 1,
        text,
        votes: 0,
      })),
      totalVotes: 0,
      anonymousVoting,
    };

    setPolls([newPoll, ...polls]);
    setIsCreatePollOpen(false);
    setPollTitle("");
    setPollOptions(["", "", ""]);
    setEventDate(undefined);
    setEventTime("");
    setLocation("");
    setAnonymousVoting(false);
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const handleUpdateGroupName = (name: string) => {
    setGroupName(name);
    // Update in localStorage as well
    const savedGroups = localStorage.getItem('groups');
    if (savedGroups) {
      const groups = JSON.parse(savedGroups);
      const updatedGroups = groups.map((g: any) => 
        g.id === parseInt(id || '0') ? { ...g, name } : g
      );
      localStorage.setItem('groups', JSON.stringify(updatedGroups));
    }
    toast.success("Group name updated");
  };

  const handleUpdateGroupPhoto = (photo: string | null) => {
    setGroupPhoto(photo || undefined);
    toast.success(photo ? "Group photo updated" : "Group photo removed");
  };

  const handleAddMembers = (newMembers: string[]) => {
    const contacts = JSON.parse(localStorage.getItem("syncedContacts") || "[]");
    const membersToAdd = contacts
      .filter((c: any) => newMembers.includes(c.phone))
      .map((c: any) => ({
        id: Math.random().toString(),
        name: c.name,
        phone: c.phone,
      }));
    setMembers([...members, ...membersToAdd]);
    toast.success(`${membersToAdd.length} member(s) added`);
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
    toast.success("Member removed");
  };

  const handleExitGroup = () => {
    // Remove group from localStorage
    const savedGroups = localStorage.getItem('groups');
    if (savedGroups) {
      const groups = JSON.parse(savedGroups);
      const updatedGroups = groups.filter((g: any) => g.id !== parseInt(id || '0'));
      localStorage.setItem('groups', JSON.stringify(updatedGroups));
    }
    
    toast.success("You've left the group");
    setTimeout(() => navigate("/"), 1000);
  };

  const handleTogglePin = (pollId: number) => {
    setPolls(polls.map(poll => 
      poll.id === pollId ? { ...poll, pinned: !poll.pinned } : poll
    ));
    const poll = polls.find(p => p.id === pollId);
    toast.success(poll?.pinned ? "Poll unpinned" : "Poll pinned to top");
  };

  const handleDeletePoll = (pollId: number) => {
    setPolls(polls.filter(poll => poll.id !== pollId));
    toast.success("Poll deleted");
  };

  const handleReplyInChat = (poll: Poll) => {
    const votedOption = poll.options.find(opt => opt.voted);
    const replyData = {
      pollTitle: poll.title,
      votedOption: votedOption?.text || "No vote yet",
      pollId: poll.id,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('chat_reply_poll', JSON.stringify(replyData));
    navigate(`/group/${id}/chat`);
  };

  // Sort polls: pinned ones first
  const sortedPolls = [...polls].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });


  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => navigate(`/group/${id}/chat`)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-left w-full group mb-4"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-primary group-hover:text-[hsl(var(--teal))] transition-colors">
                {groupName}
              </h1>
              <Settings className="h-5 w-5 text-muted-foreground group-hover:text-[hsl(var(--teal))] transition-colors" />
            </div>
          </button>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Active Polls Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[hsl(var(--teal))]">Active Polls</h2>
          <Button
            size="sm"
            className="bg-[hsl(var(--peach))] hover:bg-[hsl(var(--peach-dark))] text-foreground"
            onClick={() => setIsCreatePollOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Poll
          </Button>
        </div>

        {/* Polls List */}
        <div className="space-y-4">
          {sortedPolls.map((poll) => (
            <Card
              key={poll.id}
              id={`poll-${poll.id}`}
              className={cn(
                "p-5 border-border/50 shadow-sm hover:shadow-md transition-shadow relative",
                poll.pinned && "border-[hsl(var(--teal))] border-2"
              )}
            >
              {/* Three-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleReplyInChat(poll)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Reply in chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleTogglePin(poll.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {poll.pinned ? "Unpin poll" : "Pin to top"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeletePoll(poll.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete poll
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="mb-4 pr-8">
                {poll.pinned && (
                  <div className="flex items-center gap-1 text-xs text-[hsl(var(--teal))] font-semibold mb-2">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </div>
                )}
                <h3 className="font-semibold text-foreground mb-2">{poll.title}</h3>
                {(poll.eventDate || poll.eventTime || poll.location) && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {poll.eventDate && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{format(poll.eventDate, "dd MMM yyyy")}</span>
                        {poll.eventTime && <span className="ml-1">at {poll.eventTime}</span>}
                      </div>
                    )}
                    {poll.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{poll.location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-4">
                {poll.options.map((option) => {
                  const percentage = poll.totalVotes > 0 
                    ? (option.votes / poll.totalVotes) * 100 
                    : 0;
                  
                  return (
                    <div key={option.id}>
                      <button
                        onClick={() => handleVote(poll.id, option.id)}
                        className={`
                          w-full p-3 rounded-lg border text-left transition-all
                          ${option.voted 
                            ? 'border-[hsl(var(--teal))] bg-[hsl(var(--teal))]/10' 
                            : 'border-border hover:border-[hsl(var(--teal))]/50 hover:bg-secondary/50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-medium text-sm">{option.text}</span>
                            <span className="text-xs text-muted-foreground">
                              ({option.votes} {option.votes === 1 ? 'vote' : 'votes'})
                            </span>
                          </div>
                          {option.voted && (
                            <span className="text-xs text-[hsl(var(--teal))] font-semibold">✓</span>
                          )}
                        </div>
                        {poll.totalVotes > 0 && (
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[hsl(var(--teal))] transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Poll-level reactions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">{poll.totalVotes} total votes</p>
                <button
                  onClick={() => toggleReactions(poll.id)}
                  className="text-lg hover:scale-125 transition-transform"
                >
                  😊
                </button>
              </div>

              {/* Poll Reactions Display */}
              {poll.reactions && poll.reactions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                  {poll.reactions.map((reaction, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-full text-xs animate-bounce-in"
                    >
                      <span className="text-base">{reaction.emoji}</span>
                      <span className="text-muted-foreground">{reaction.count}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Reaction Picker */}
              {showReactions[`${poll.id}`] && (
                <div className="flex gap-2 px-3 py-2 bg-card border border-border rounded-lg mt-2 animate-fade-in">
                  {availableReactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleReaction(poll.id, emoji);
                        toggleReactions(poll.id);
                      }}
                      className="text-2xl hover:scale-150 transition-transform active:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}

          {polls.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No active polls</h3>
              <p className="text-muted-foreground mb-4">Create your first poll to get started!</p>
              <Button
                className="bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white"
                onClick={() => setIsCreatePollOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Poll
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create Poll Dialog/Sheet */}
      {isMobile ? (
        <Sheet open={isCreatePollOpen} onOpenChange={setIsCreatePollOpen}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-center">Create New Poll</SheetTitle>
            </SheetHeader>
            <CreatePollForm
              pollTitle={pollTitle}
              setPollTitle={setPollTitle}
              eventDate={eventDate}
              setEventDate={setEventDate}
              eventTime={eventTime}
              setEventTime={setEventTime}
              location={location}
              setLocation={setLocation}
              pollOptions={pollOptions}
              updatePollOption={updatePollOption}
              addPollOption={addPollOption}
              anonymousVoting={anonymousVoting}
              setAnonymousVoting={setAnonymousVoting}
              onCancel={() => setIsCreatePollOpen(false)}
              onCreatePoll={handleCreatePoll}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isCreatePollOpen} onOpenChange={setIsCreatePollOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Poll</DialogTitle>
            </DialogHeader>
            <CreatePollForm
              pollTitle={pollTitle}
              setPollTitle={setPollTitle}
              eventDate={eventDate}
              setEventDate={setEventDate}
              eventTime={eventTime}
              setEventTime={setEventTime}
              location={location}
              setLocation={setLocation}
              pollOptions={pollOptions}
              updatePollOption={updatePollOption}
              addPollOption={addPollOption}
              anonymousVoting={anonymousVoting}
              setAnonymousVoting={setAnonymousVoting}
              onCancel={() => setIsCreatePollOpen(false)}
              onCreatePoll={handleCreatePoll}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Group Settings Dialog/Sheet */}
      {isMobile ? (
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-center">Group Settings</SheetTitle>
            </SheetHeader>
            <GroupSettings
              groupName={groupName}
              groupPhoto={groupPhoto}
              members={members}
              onUpdateGroupName={handleUpdateGroupName}
              onUpdateGroupPhoto={handleUpdateGroupPhoto}
              onAddMembers={handleAddMembers}
              onRemoveMember={handleRemoveMember}
              onExitGroup={handleExitGroup}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetContent side="right" className="w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Group Settings</SheetTitle>
            </SheetHeader>
            <GroupSettings
              groupName={groupName}
              groupPhoto={groupPhoto}
              members={members}
              onUpdateGroupName={handleUpdateGroupName}
              onUpdateGroupPhoto={handleUpdateGroupPhoto}
              onAddMembers={handleAddMembers}
              onRemoveMember={handleRemoveMember}
              onExitGroup={handleExitGroup}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default GroupDetail;
