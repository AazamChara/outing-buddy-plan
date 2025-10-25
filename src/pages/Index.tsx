import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/GroupCard";
import groupPlaceholder from "@/assets/group-placeholder.jpg";

const mockGroups = [
  {
    id: 1,
    name: "Adventure Squad",
    memberCount: 5,
    lastActivity: "Last outing: Movie Night",
    imageUrl: groupPlaceholder,
    hasNotifications: true,
  },
  {
    id: 2,
    name: "Foodie Friends",
    memberCount: 8,
    lastActivity: "Planning: Restaurant Week",
    imageUrl: groupPlaceholder,
    hasNotifications: false,
  },
  {
    id: 3,
    name: "Weekend Warriors",
    memberCount: 6,
    lastActivity: "Last outing: Hiking Trail",
    imageUrl: groupPlaceholder,
    hasNotifications: true,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Groups Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Your Groups</h2>
              <p className="text-muted-foreground">Manage and plan with your crews</p>
            </div>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {mockGroups.map((group, index) => (
              <div key={group.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <GroupCard {...group} />
              </div>
            ))}
          </div>

          {/* Empty State / CTA */}
          {mockGroups.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
                <Plus className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
              <p className="text-muted-foreground mb-6">Gather your crew! Create your first group to start planning.</p>
              <Button variant="hero" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Group
              </Button>
            </div>
          )}
        </section>

      </div>

      {/* Floating Action Button */}
      <Button
        variant="fab"
        size="icon"
        className="fixed bottom-24 md:bottom-8 right-6 h-14 w-14 shadow-[var(--shadow-card)] animate-float z-40"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Index;
