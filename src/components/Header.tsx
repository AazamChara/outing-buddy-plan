import { Search, Bell, Users, Vote, UserPlus, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: number;
  type: "poll" | "group" | "invite";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  groupId?: number;
  pollId?: number;
  groupData?: {
    id: number;
    name: string;
    memberCount: number;
    imageUrl: string;
  };
}

export const Header = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "poll",
      title: "New Poll",
      message: "John created a new poll in Adventure Squad",
      timestamp: new Date(2025, 9, 25, 14, 30),
      read: false,
      groupId: 1,
      pollId: 1,
    },
    {
      id: 2,
      type: "invite",
      title: "Group Invite",
      message: "Jane invited you to join Foodie Friends",
      timestamp: new Date(2025, 9, 25, 10, 15),
      read: false,
      groupData: {
        id: 10,
        name: "Foodie Friends",
        memberCount: 8,
        imageUrl: "/placeholder.svg",
      },
    },
    {
      id: 3,
      type: "group",
      title: "New Group",
      message: "You were added to Weekend Warriors",
      timestamp: new Date(2025, 9, 24, 16, 45),
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleAcceptInvite = (notification: Notification) => {
    if (notification.groupData) {
      // Add group to user's groups
      const savedGroups = localStorage.getItem('groups');
      const groups = savedGroups ? JSON.parse(savedGroups) : [];
      
      groups.push({
        ...notification.groupData,
        lastActivity: "Just joined",
        hasNotifications: false,
      });
      
      localStorage.setItem('groups', JSON.stringify(groups));
      
      // Remove notification
      setNotifications(notifications.filter(n => n.id !== notification.id));
      
      toast.success(`You've joined ${notification.groupData.name}!`);
      setOpen(false);
      navigate('/');
    }
  };

  const handleDeclineInvite = (notification: Notification) => {
    setNotifications(notifications.filter(n => n.id !== notification.id));
    toast.success("Group invite declined");
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.type === "poll" && notification.groupId) {
      // Store poll ID to scroll to it
      if (notification.pollId) {
        localStorage.setItem('scroll_to_poll', notification.pollId.toString());
      }
      navigate(`/group/${notification.groupId}`);
      setOpen(false);
    } else if (notification.type === "group" && notification.groupId) {
      navigate(`/group/${notification.groupId}`);
      setOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "poll":
        return <Vote className="h-4 w-4 text-[hsl(var(--teal))]" />;
      case "group":
        return <Users className="h-4 w-4 text-[hsl(var(--peach))]" />;
      case "invite":
        return <UserPlus className="h-4 w-4 text-[hsl(var(--lavender-dark))]" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 md:ml-60">
        {/* Mobile logo */}
        <div className="md:hidden">
          <h1 className="font-script text-2xl drop-shadow-sm" style={{ 
            background: 'var(--gradient-brand)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Plan My Outings
          </h1>
        </div>

        {/* Search bar - hidden on mobile, visible on tablet+ */}
        <div className="hidden sm:flex items-center flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search groups, activities..."
              className="pl-10 bg-secondary/50 border-border focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-0 bg-background border-border shadow-lg z-[60]" 
              align="end"
              sideOffset={8}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 text-xs text-[hsl(var(--teal))] hover:text-[hsl(var(--teal-dark))]"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 transition-colors",
                          !notification.read && "bg-secondary/30"
                        )}
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left hover:bg-secondary/50 transition-colors -m-4 p-4"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-semibold text-sm text-foreground">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="flex-shrink-0 h-2 w-2 bg-[hsl(var(--teal))] rounded-full mt-1" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </button>
                        
                        {/* Accept/Decline buttons for invites */}
                        {notification.type === "invite" && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="flex-1 bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptInvite(notification);
                              }}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeclineInvite(notification);
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
};
