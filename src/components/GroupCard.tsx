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
      <div className="relative h-24 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[hsl(var(--lavender))]" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-primary mb-1.5 group-hover:text-[hsl(var(--teal-light))] transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {memberCount} members
          </span>
          <span className="text-xs">•</span>
          <span className="truncate">{lastActivity}</span>
        </div>

        {/* Notification Bell */}
        {hasNotifications && (
          <div className="flex items-center gap-1.5 text-xs">
            <div className="relative inline-flex">
              <Bell className="h-3 w-3 text-accent-foreground animate-bounce-in" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-destructive rounded-full animate-pulse" />
            </div>
            <span className="text-accent-foreground font-medium">New activity!</span>
          </div>
        )}
      </div>
    </Card>
  );
};
