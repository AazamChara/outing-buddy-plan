import { ArrowLeft, Send, Smile, Paperclip, Video, Phone, Image, MapPin, User, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { toast } from "sonner";

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
  type?: "text" | "image" | "video" | "location" | "contact" | "activity";
  mediaUrl?: string;
  activityData?: {
    id: string;
    title: string;
    type: string;
    venue?: string;
    date?: string;
    price?: string;
    image?: string;
    rating?: number;
  };
}

const mockMessages: Message[] = [
  {
    id: 1,
    text: "Hey everyone! Ready for this weekend?",
    sender: "John",
    timestamp: new Date(2025, 9, 20, 10, 30),
    isOwn: false,
  },
  {
    id: 2,
    text: "Yes! I voted for hiking 🏔️",
    sender: "You",
    timestamp: new Date(2025, 9, 20, 10, 35),
    isOwn: true,
  },
  {
    id: 3,
    text: "Sounds great! What time should we meet?",
    sender: "Jane",
    timestamp: new Date(2025, 9, 20, 10, 40),
    isOwn: false,
  },
];

const GroupChat = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [groupName, setGroupName] = useState<string>("Adventure Squad");
  const [memberCount, setMemberCount] = useState<number>(0);

  // Load group header data (name, memberCount) from saved groups
  useEffect(() => {
    const savedGroups = localStorage.getItem('groups');
    if (savedGroups) {
      const groups = JSON.parse(savedGroups);
      const currentGroup = groups.find((g: any) => g.id === parseInt(id || '0'));
      if (currentGroup) {
        setGroupName(currentGroup.name || "Group");
        setMemberCount(currentGroup.memberCount || 0);
      }
    }
  }, [id]);

  // Load shared activities from localStorage
  useEffect(() => {
    const sharedMessages = localStorage.getItem(`chat_messages_${id}`);
    if (sharedMessages) {
      const parsedMessages = JSON.parse(sharedMessages).map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp), // Convert string back to Date object
      }));
      setMessages(prev => [...prev, ...parsedMessages]);
      localStorage.removeItem(`chat_messages_${id}`); // Clear after loading
    }
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "You",
      timestamp: new Date(),
      isOwn: true,
      type: "text",
    };

    setMessages([...messages, message]);
    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(newMessage + emojiData.emoji);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const message: Message = {
          id: messages.length + 1,
          text: "Image shared",
          sender: "You",
          timestamp: new Date(),
          isOwn: true,
          type: "image",
          mediaUrl: reader.result as string,
        };
        setMessages([...messages, message]);
        toast.success("Image shared");
      };
      reader.readAsDataURL(file);
      setShowAttachments(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success("Video shared");
      setShowAttachments(false);
    }
  };

  const handleShareLocation = () => {
    const message: Message = {
      id: messages.length + 1,
      text: "📍 Location shared",
      sender: "You",
      timestamp: new Date(),
      isOwn: true,
      type: "location",
    };
    setMessages([...messages, message]);
    toast.success("Location shared");
    setShowAttachments(false);
  };

  const handleShareContact = () => {
    const message: Message = {
      id: messages.length + 1,
      text: "👤 Contact shared",
      sender: "You",
      timestamp: new Date(),
      isOwn: true,
      type: "contact",
    };
    setMessages([...messages, message]);
    toast.success("Contact shared");
    setShowAttachments(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/group/${id}`)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-[hsl(var(--teal))]/10 text-[hsl(var(--teal))]">
              {groupName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground">{groupName}</h1>
            <p className="text-xs text-muted-foreground">{memberCount} {memberCount === 1 ? 'member' : 'members'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toast.info("Video call feature coming soon")}
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toast.info("Voice call feature coming soon")}
          >
            <Phone className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`${
                  message.type === "activity" ? "max-w-[85%]" : "max-w-[70%]"
                } rounded-2xl ${
                  message.isOwn
                    ? "bg-[hsl(var(--teal))] text-white rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                } ${message.type === "activity" ? "" : "px-4 py-2"}`}
              >
                {!message.isOwn && message.type !== "activity" && (
                  <p className="text-xs font-semibold mb-1 text-[hsl(var(--teal))]">
                    {message.sender}
                  </p>
                )}
                
                {/* Activity Card */}
                {message.type === "activity" && message.activityData && (
                  <div className="overflow-hidden">
                    {message.activityData.image && (
                      <img
                        src={message.activityData.image}
                        alt={message.activityData.title}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-2xl">🎉</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold mb-1 text-[hsl(var(--teal))]">
                            Check out this activity!
                          </p>
                          <h4 className="font-bold text-base mb-1">
                            {message.activityData.title}
                          </h4>
                          {message.activityData.venue && (
                            <p className="text-sm flex items-center gap-1 mb-1">
                              📍 {message.activityData.venue}
                            </p>
                          )}
                          {message.activityData.date && (
                            <p className="text-sm flex items-center gap-1 mb-1">
                              📅 {new Date(message.activityData.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                          {message.activityData.price && (
                            <p className="text-sm flex items-center gap-1">
                              💰 {message.activityData.price}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Image Message */}
                {message.type === "image" && message.mediaUrl && (
                  <img
                    src={message.mediaUrl}
                    alt="Shared"
                    className="rounded-lg mb-2 max-w-full"
                  />
                )}
                
                {/* Text/Other Messages */}
                {message.type !== "activity" && (
                  <>
                    <p className="text-sm break-words">{message.text}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        message.isOwn ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 flex items-end gap-2 bg-secondary rounded-3xl px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachments(false);
              }}
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={() => {
                setShowAttachments(!showAttachments);
                setShowEmojiPicker(false);
              }}
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-transparent"
              onClick={() => toast.info("Camera feature coming soon")}
            >
              <Camera className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white"
            onClick={handleSendMessage}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Emoji Picker Sheet */}
      <Sheet open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <SheetContent side="bottom" className="h-[400px] p-0">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width="100%"
            height="100%"
            searchDisabled
            skinTonesDisabled
          />
        </SheetContent>
      </Sheet>

      {/* Attachments Sheet */}
      <Sheet open={showAttachments} onOpenChange={setShowAttachments}>
        <SheetContent side="bottom" className="h-auto">
          <div className="grid grid-cols-3 gap-4 py-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-[hsl(var(--teal))]/10 flex items-center justify-center">
                <Image className="h-6 w-6 text-[hsl(var(--teal))]" />
              </div>
              <span className="text-xs text-center">Image</span>
            </button>

            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-[hsl(var(--peach))]/30 flex items-center justify-center">
                <Video className="h-6 w-6 text-[hsl(var(--peach-dark))]" />
              </div>
              <span className="text-xs text-center">Video</span>
            </button>

            <button
              onClick={handleShareLocation}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xs text-center">Location</span>
            </button>

            <button
              onClick={handleShareContact}
              className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-center">Contact</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoUpload}
      />
    </div>
  );
};

export default GroupChat;
