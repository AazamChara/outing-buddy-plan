import { Bell, Users } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  name: string;
  memberCount: number;
  lastActivity: string;
  imageUrl: string;
  hasNotifications?: boolean;
  className?: string;
  onClick?: () => void;
}

export const GroupCard = ({
  name,
  memberCount,
  lastActivity,
  imageUrl,
  hasNotifications = false,
  className,
  onClick,
}: GroupCardProps) => {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300",
        "hover:shadow-[var(--shadow-card)] hover:-translate-y-1",
        "bg-gradient-to-br from-[hsl(var(--lavender))] to-[hsl(var(--secondary))]",
        "border-border/50",
        className
      )}
      onClick={onClick}
      style={{ borderRadius: "20px" }}
    >
      {/* Background Image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[hsl(var(--lavender))]" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-[hsl(var(--teal-light))] transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {memberCount} members
          </span>
          <span className="text-xs">•</span>
          <span className="truncate">{lastActivity}</span>
        </div>

        {/* Notification Bell */}
        {hasNotifications && (
          <div className="flex items-center gap-2 text-sm">
            <div className="relative inline-flex">
              <Bell className="h-4 w-4 text-accent-foreground animate-bounce-in" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
            </div>
            <span className="text-accent-foreground font-medium">New activity!</span>
          </div>
        )}
      </div>
    </Card>
  );
};
