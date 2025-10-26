import { Search, Bell, Users, Vote, UserPlus, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "poll" | "group" | "invite" | "message";
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  related_id: string | null;
}

export const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Subscribe to realtime notifications
      const channel = supabase
        .channel(`user-${user.id}-notifications`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error: any) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleAcceptInvite = async (notification: Notification) => {
    try {
      // Update invite status
      const { error } = await supabase
        .from('group_invites')
        .update({ status: 'accepted' })
        .eq('group_id', notification.related_id)
        .eq('invited_user', user?.id);

      if (error) throw error;

      // Remove notification
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      setNotifications(notifications.filter(n => n.id !== notification.id));
      
      toast.success("Group invite accepted!");
      setOpen(false);
      navigate('/');
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      toast.error("Failed to accept invite");
    }
  };

  const handleDeclineInvite = async (notification: Notification) => {
    try {
      // Update invite status
      await supabase
        .from('group_invites')
        .update({ status: 'declined' })
        .eq('group_id', notification.related_id)
        .eq('invited_user', user?.id);

      // Remove notification
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      setNotifications(notifications.filter(n => n.id !== notification.id));
      toast.success("Group invite declined");
    } catch (error: any) {
      console.error('Error declining invite:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    if (notification.type === "poll" && notification.related_id) {
      // Need to get the group_id from the poll
      const { data: poll } = await supabase
        .from('polls')
        .select('group_id')
        .eq('id', notification.related_id)
        .single();

      if (poll) {
        navigate(`/group/${poll.group_id}`);
      }
      setOpen(false);
    } else if (notification.type === "invite" && notification.related_id) {
      // For invites, related_id is the group_id
      navigate(`/group/${notification.related_id}`);
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

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
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
                                {formatTimestamp(notification.created_at)}
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
