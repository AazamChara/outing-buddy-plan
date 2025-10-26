import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, Search, Share2 } from "lucide-react";
import { LocationSelector } from "@/components/LocationSelector";
import { ShareActivityDialog } from "@/components/ShareActivityDialog";

interface Activity {
  id: string;
  title: string;
  type: string;
  venue: string;
  date: string;
  price: string;
  image: string;
  rating?: number;
  user_ratings_total?: number;
}

const Activities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("For You");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { toast } = useToast();

  const handleShareActivity = (activity: Activity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedActivity(activity);
    setShareDialogOpen(true);
  };

  const handleActivityClick = (activity: Activity) => {
    // Save activity to localStorage for detail page
    localStorage.setItem(`activity_${activity.id}`, JSON.stringify(activity));
    navigate(`/activity/${activity.id}`);
  };

  const filters = ["For You", "Dining", "Events", "Movies"];

  // Initialize with stored location if available
  useEffect(() => {
    const savedLat = localStorage.getItem("user_latitude");
    const savedLng = localStorage.getItem("user_longitude");
    const permission = localStorage.getItem("location_permission");
    
    if (permission === "granted" && savedLat && savedLng) {
      setUserLocation({
        latitude: parseFloat(savedLat),
        longitude: parseFloat(savedLng),
        name: `${parseFloat(savedLat).toFixed(2)}°, ${parseFloat(savedLng).toFixed(2)}°`
      });
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchActivities();
    }
  }, [activeFilter, userLocation]);

  const fetchActivities = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const typeMap: Record<string, string> = {
        "For You": "All",
        "Dining": "Food",
        "Events": "Music",
        "Movies": "Entertainment",
      };

      const { data, error } = await supabase.functions.invoke('fetch-places', {
        body: {
          type: typeMap[activeFilter] === "All" ? null : typeMap[activeFilter],
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
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

  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.venue?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 space-y-3">
          {/* Location Selector */}
          <div className="flex items-center justify-between">
            <LocationSelector onLocationChange={setUserLocation} />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for activities, restaurants, movies..."
              className="pl-10 bg-secondary/50 border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-6 border-b -mb-px">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                  activeFilter === filter
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter.toUpperCase()}
                {activeFilter === filter && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6 mt-4">
        {/* Section Header */}
        {!loading && filteredActivities.length > 0 && (
          <div className="text-center">
            <h2 className="text-xl font-bold uppercase tracking-wider">
              {activeFilter === "Movies" ? "In The Spotlight" : "In Your District"}
            </h2>
            <div className="h-px bg-border my-4" />
          </div>
        )}

        {/* Activities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-56 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No results found" : userLocation ? "No activities found for this category" : "Please set your location to see activities"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured Card - Larger first item for Movies */}
            {activeFilter === "Movies" && filteredActivities[0] && (
              <Card 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleActivityClick(filteredActivities[0])}
              >
                <div className="relative h-80 bg-muted">
                  <img
                    src={filteredActivities[0].image || "/placeholder.svg"}
                    alt={filteredActivities[0].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="font-bold text-2xl text-white mb-2">
                      {filteredActivities[0].title}
                    </h3>
                    <p className="text-white/80 text-sm mb-4">
                      {filteredActivities[0].venue || "UA16+ | Hindi"}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 bg-transparent border-white text-white hover:bg-white hover:text-black"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivityClick(filteredActivities[0]);
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="bg-transparent border-white text-white hover:bg-white hover:text-black"
                        onClick={(e) => handleShareActivity(filteredActivities[0], e)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Regular Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeFilter === "Movies" ? filteredActivities.slice(1) : filteredActivities).map((activity) => (
                <Card 
                  key={activity.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="relative">
                    <div className="h-48 bg-muted">
                      <img
                        src={activity.image || "/placeholder.svg"}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {activity.price && activity.price.includes("OFF") && (
                      <div className="absolute top-0 left-0 right-0 bg-primary px-3 py-1">
                        <p className="text-white text-xs font-medium flex items-center gap-1">
                          <Star className="h-3 w-3 fill-white" />
                          {activity.price}
                        </p>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg line-clamp-1">{activity.title}</h3>
                        {activity.rating && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-medium">
                              {activity.rating} ★
                            </span>
                            {activity.venue && (
                              <span className="text-sm text-muted-foreground line-clamp-1">
                                {activity.venue}
                              </span>
                            )}
                          </div>
                        )}
                        {!activity.rating && activity.venue && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.venue}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => handleShareActivity(activity, e)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {activity.date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <ShareActivityDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        activity={selectedActivity}
      />
    </div>
  );
};

export default Activities;
