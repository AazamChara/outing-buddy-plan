import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreatePollFormProps {
  pollTitle: string;
  setPollTitle: (value: string) => void;
  eventDate: Date | undefined;
  setEventDate: (date: Date | undefined) => void;
  eventTime: string;
  setEventTime: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  pollOptions: string[];
  updatePollOption: (idx: number, value: string) => void;
  addPollOption: () => void;
  anonymousVoting: boolean;
  setAnonymousVoting: (value: boolean) => void;
  onCancel: () => void;
  onCreatePoll: () => void;
}

export const CreatePollForm = ({
  pollTitle,
  setPollTitle,
  eventDate,
  setEventDate,
  eventTime,
  setEventTime,
  location,
  setLocation,
  pollOptions,
  updatePollOption,
  addPollOption,
  anonymousVoting,
  setAnonymousVoting,
  onCancel,
  onCreatePoll,
}: CreatePollFormProps) => {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Poll Question</Label>
        <Input
          placeholder="e.g., Weekend Vibes?"
          value={pollTitle}
          onChange={(e) => setPollTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !eventDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {eventDate ? format(eventDate, "dd-MM-yyyy") : "dd-mm-yyyy"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={eventDate}
              onSelect={setEventDate}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Time</Label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="e.g., Central Park, NYC"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-10"
          />
        </div>
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

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Anonymous Voting</Label>
          <p className="text-xs text-muted-foreground">Hide who voted for what</p>
        </div>
        <Switch
          checked={anonymousVoting}
          onCheckedChange={setAnonymousVoting}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          className="flex-1 bg-[hsl(var(--peach))] hover:bg-[hsl(var(--peach-dark))] text-foreground"
          onClick={onCreatePoll}
          disabled={!pollTitle.trim() || pollOptions.filter(opt => opt.trim()).length < 2}
        >
          Create Poll
        </Button>
      </div>
    </div>
  );
};
