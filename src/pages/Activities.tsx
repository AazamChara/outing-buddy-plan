import { MapPin, Calendar, DollarSign, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  title: string;
  type: string;
  venue: string;
  distance: string;
  date: string;
  price: string;
  image: string;
  rating?: number;
  user_ratings_total?: number;
}

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, [activeFilter]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-places', {
        body: {
          type: activeFilter === "All" ? null : activeFilter,
          latitude: null,
          longitude: null,
        },
      });

      if (error) throw error;

      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto p-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Activities</h1>
          <p className="text-muted-foreground">Find exciting events and outings near you</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["All", "Food", "Fun", "Adventure", "Entertainment", "Music"].map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "secondary" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No activities found. Try a different filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity, index) => (
            <Card
              key={activity.id}
              className="overflow-hidden hover:shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={activity.image}
                  alt={activity.title}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                  {activity.type}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{activity.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {activity.venue} • {activity.distance}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {activity.date}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    {activity.price}
                  </span>
                </div>
                {activity.rating && activity.rating > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{activity.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({activity.user_ratings_total} reviews)
                    </span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="hero" className="flex-1">
                    Suggest to Group
                  </Button>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {/* Map Toggle CTA */}
        <div className="mt-8 text-center">
          <Button variant="outline" size="lg">
            <MapPin className="mr-2 h-5 w-5" />
            View on Map
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Activities;
