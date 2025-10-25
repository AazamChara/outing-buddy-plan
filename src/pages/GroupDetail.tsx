import { ArrowLeft, MessageCircle, Plus, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";

interface PollOption {
  id: number;
  text: string;
  votes: number;
  voted?: boolean;
}

interface Poll {
  id: number;
  title: string;
  daysLeft: number;
  options: PollOption[];
  totalVotes: number;
}

const mockPolls: Poll[] = [
  {
    id: 1,
    title: "Weekend Vibes?",
    daysLeft: 2,
    options: [
      { id: 1, text: "Café Crawl", votes: 3 },
      { id: 2, text: "Hiking", votes: 4, voted: true },
      { id: 3, text: "Movie Marathon", votes: 2 },
    ],
    totalVotes: 9,
  },
];

const GroupDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [polls, setPolls] = useState<Poll[]>(mockPolls);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", "", ""]);
  const [pollDuration, setPollDuration] = useState("2");

  const groupName = "Adventure Squad";

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

  const handleCreatePoll = () => {
    const validOptions = pollOptions.filter(opt => opt.trim());
    if (!pollTitle.trim() || validOptions.length < 2) return;

    const newPoll: Poll = {
      id: polls.length + 1,
      title: pollTitle,
      daysLeft: parseInt(pollDuration),
      options: validOptions.map((text, idx) => ({
        id: idx + 1,
        text,
        votes: 0,
      })),
      totalVotes: 0,
    };

    setPolls([newPoll, ...polls]);
    setIsCreatePollOpen(false);
    setPollTitle("");
    setPollOptions(["", "", ""]);
    setPollDuration("2");
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const CreatePollForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Poll Question</Label>
        <Input
          placeholder="What should we do this weekend?"
          value={pollTitle}
          onChange={(e) => setPollTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        {pollOptions.map((option, idx) => (
          <Input
            key={idx}
            placeholder={`Option ${idx + 1}`}
            value={option}
            onChange={(e) => updatePollOption(idx, e.target.value)}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addPollOption}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Duration (days)</Label>
        <Input
          type="number"
          min="1"
          max="30"
          value={pollDuration}
          onChange={(e) => setPollDuration(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setIsCreatePollOpen(false)}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white"
          onClick={handleCreatePoll}
          disabled={!pollTitle.trim() || pollOptions.filter(opt => opt.trim()).length < 2}
        >
          Create Poll
        </Button>
      </div>
    </div>
  );

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
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-primary mb-1">{groupName}</h1>
          <p className="text-sm text-muted-foreground mb-4">Decide together, faster.</p>

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
              className="p-5 border-border/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-foreground">{poll.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {poll.daysLeft} days left
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {poll.options.map((option) => {
                  const percentage = poll.totalVotes > 0 
                    ? (option.votes / poll.totalVotes) * 100 
                    : 0;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleVote(poll.id, option.id)}
                      className={`
                        w-full p-3 rounded-lg border text-left transition-all
                        ${option.voted 
                          ? 'border-[hsl(var(--teal))] bg-[hsl(var(--teal))]/10' 
                          : 'border-border hover:border-[hsl(var(--teal))]/50 hover:bg-secondary/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{option.text}</span>
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
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">{poll.totalVotes} total votes</p>
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
            <CreatePollForm />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isCreatePollOpen} onOpenChange={setIsCreatePollOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Poll</DialogTitle>
            </DialogHeader>
            <CreatePollForm />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GroupDetail;
