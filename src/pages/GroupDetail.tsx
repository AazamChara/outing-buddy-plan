import { ArrowLeft, MessageCircle, Plus, Search, Clock, Calendar as CalendarIcon, MapPin, Settings } from "lucide-react";
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

interface PollOption {
  id: number;
  text: string;
  votes: number;
  voted?: boolean;
  voters?: string[]; // Member IDs who voted for this option
  reactions?: { emoji: string; count: number }[];
}

const availableReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏", "💯"];

interface Poll {
  id: number;
  title: string;
  eventDate?: Date;
  eventTime?: string;
  location?: string;
  options: PollOption[];
  totalVotes: number;
  anonymousVoting: boolean;
}

const mockPolls: Poll[] = [
  {
    id: 1,
    title: "Weekend Vibes?",
    eventDate: new Date(2025, 9, 27),
    eventTime: "14:00",
    location: "Central Park, NYC",
    options: [
      { id: 1, text: "Café Crawl", votes: 3, voters: ["1", "2", "3"], reactions: [{ emoji: "☕", count: 2 }, { emoji: "😋", count: 1 }] },
      { id: 2, text: "Hiking", votes: 4, voters: ["1", "2", "3"], voted: true, reactions: [{ emoji: "🏔️", count: 3 }, { emoji: "💪", count: 2 }] },
      { id: 3, text: "Movie Marathon", votes: 2, voters: ["1", "3"], reactions: [{ emoji: "🍿", count: 1 }] },
    ],
    totalVotes: 9,
    anonymousVoting: false,
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

  const toggleReactions = (pollId: number, optionId: number) => {
    const key = `${pollId}-${optionId}`;
    setShowReactions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVote = (pollId: number, optionId: number) => {
    const currentUserId = "1"; // Mock current user - in real app this would come from auth
    
    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        return {
          ...poll,
          options: poll.options.map(opt => {
            // Remove current user from all options first
            const cleanedVoters = (opt.voters || []).filter(v => v !== currentUserId);
            
            // If this is the option being voted for, add current user
            if (opt.id === optionId) {
              return {
                ...opt,
                voted: true,
                votes: opt.voted ? opt.votes : opt.votes + 1,
                voters: [...cleanedVoters, currentUserId],
              };
            } else {
              return {
                ...opt,
                voted: false,
                votes: opt.voted ? opt.votes - 1 : opt.votes,
                voters: cleanedVoters,
              };
            }
          }),
          totalVotes: poll.options.find(opt => opt.voted) ? poll.totalVotes : poll.totalVotes + 1,
        };
      }
      return poll;
    }));
  };

  const handleReaction = (pollId: number, optionId: number, emoji: string) => {
    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        return {
          ...poll,
          options: poll.options.map(opt => {
            if (opt.id === optionId) {
              const reactions = opt.reactions || [];
              const existingReaction = reactions.find(r => r.emoji === emoji);
              
              if (existingReaction) {
                return {
                  ...opt,
                  reactions: reactions.map(r =>
                    r.emoji === emoji ? { ...r, count: r.count + 1 } : r
                  ),
                };
              } else {
                return {
                  ...opt,
                  reactions: [...reactions, { emoji, count: 1 }],
                };
              }
            }
            return opt;
          }),
        };
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
        voters: [],
        reactions: [],
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
          {polls.map((poll) => (
            <Card
              key={poll.id}
              id={`poll-${poll.id}`}
              className="p-0 border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-[hsl(120,60%,95%)]"
            >
              {/* Emoji Reactions Bar at Top */}
              <div className="px-5 pt-4 pb-3 bg-white/80 backdrop-blur-sm border-b border-border/30">
                <div className="flex items-center gap-2 flex-wrap">
                  {availableReactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(poll.id, poll.options[0].id, emoji)}
                      className="text-3xl hover:scale-125 transition-transform hover:rotate-12 active:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button 
                    className="w-8 h-8 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Poll Content */}
              <div className="p-5">
                {/* Poll Title and Details */}
                <div className="mb-4">
                  <h3 className="font-bold text-2xl text-foreground mb-3">{poll.title}</h3>
                  
                  {/* Select instruction */}
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Select one or more</span>
                  </div>

                  {(poll.eventDate || poll.eventTime || poll.location) && (
                    <div className="space-y-1 text-xs text-muted-foreground mb-3">
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

                {/* Poll Options */}
                <div className="space-y-3 mb-4">
                  {poll.options.map((option) => {
                    const percentage = poll.totalVotes > 0 
                      ? (option.votes / poll.totalVotes) * 100 
                      : 0;
                    
                    return (
                      <div key={option.id} className="relative">
                        <button
                          onClick={() => handleVote(poll.id, option.id)}
                          className="w-full text-left transition-all group"
                        >
                          {/* Option Header with Checkbox */}
                          <div className="flex items-center gap-3 mb-2">
                            {/* Large Circular Checkbox */}
                            <div className={`
                              w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                              ${option.voted 
                                ? 'bg-[hsl(var(--teal))] border-[hsl(var(--teal))]' 
                                : 'border-muted-foreground/40 bg-white group-hover:border-[hsl(var(--teal))]/50'
                              }
                            `}>
                              {option.voted && (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            
                            {/* Option Text */}
                            <span className="font-semibold text-lg text-foreground flex-1">{option.text}</span>
                            
                            {/* Vote Count and Voters */}
                            <div className="flex items-center gap-2">
                              {!poll.anonymousVoting && option.voters && option.voters.length > 0 && (
                                <div className="flex -space-x-2">
                                  {option.voters.slice(0, 3).map((voterId) => {
                                    const voter = members.find(m => m.id === voterId);
                                    if (!voter) return null;
                                    return (
                                      <div
                                        key={voterId}
                                        className="w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(var(--teal))] to-[hsl(var(--peach))] border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                                        title={voter.name}
                                      >
                                        {voter.name.charAt(0)}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              <span className="text-lg font-bold text-foreground">{option.votes}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                option.voted 
                                  ? 'bg-[hsl(var(--teal))]' 
                                  : 'bg-muted-foreground/40'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          {/* Voter Names (if not anonymous) */}
                          {!poll.anonymousVoting && option.voters && option.voters.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {option.voters.map((voterId) => {
                                const voter = members.find(m => m.id === voterId);
                                if (!voter) return null;
                                return (
                                  <span
                                    key={voterId}
                                    className="text-xs px-2 py-0.5 bg-white/60 rounded-full text-muted-foreground font-medium"
                                  >
                                    {voter.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Timestamp */}
                <div className="flex justify-end items-center gap-1 text-xs text-muted-foreground mb-3">
                  <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* View Votes Button */}
                <button className="w-full py-3 text-center text-[hsl(var(--teal))] font-semibold hover:bg-white/50 transition-colors rounded-lg">
                  View votes
                </button>
              </div>
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
