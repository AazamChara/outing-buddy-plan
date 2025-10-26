import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Phone, Globe, Navigation, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShareActivityDialog } from "@/components/ShareActivityDialog";
import { useToast } from "@/hooks/use-toast";

interface ActivityDetail {
  id: string;
  title: string;
  type: string;
  venue: string;
  date?: string;
  price?: string;
  image: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
  }>;
  photos?: Array<{
    photo_reference: string;
  }>;
  location?: {
    lat: number;
    lng: number;
  };
}

const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    // Load activity from localStorage (passed from Activities page)
    const savedActivity = localStorage.getItem(`activity_${id}`);
    if (savedActivity) {
      const parsedActivity = JSON.parse(savedActivity);
      setActivity(parsedActivity);
      setLoading(false);
    } else {
      // If not found, redirect back
      toast({
        title: "Activity not found",
        description: "Redirecting to activities page...",
        variant: "destructive",
      });
      setTimeout(() => navigate("/activities"), 2000);
    }
  }, [id, navigate, toast]);

  const handleGetDirections = () => {
    if (activity?.location) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${activity.location.lat},${activity.location.lng}`;
      window.open(url, '_blank');
    } else if (activity?.formatted_address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.formatted_address)}`;
      window.open(url, '_blank');
    }
  };

  const handleCallPhone = () => {
    if (activity?.formatted_phone_number) {
      window.location.href = `tel:${activity.formatted_phone_number}`;
    }
  };

  const handleVisitWebsite = () => {
    if (activity?.website) {
      window.open(activity.website, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container px-4 py-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <Skeleton className="h-80 w-full" />
        <div className="container px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!activity) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/activities")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg line-clamp-1">{activity.title}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-80 bg-muted">
        <img
          src={activity.image || "/placeholder.svg"}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        {activity.rating && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 font-semibold">
            <Star className="h-4 w-4 fill-white" />
            {activity.rating}
          </div>
        )}
      </div>

      <div className="container px-4 py-6 space-y-6">
        {/* Title & Basic Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{activity.title}</h2>
              {activity.type && (
                <Badge variant="secondary" className="mb-2">
                  {activity.type}
                </Badge>
              )}
            </div>
          </div>

          {activity.rating && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{activity.rating}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(activity.rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              {activity.user_ratings_total && (
                <span className="text-sm text-muted-foreground">
                  ({activity.user_ratings_total.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGetDirections}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Directions
          </Button>
          {activity.formatted_phone_number && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCallPhone}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
          )}
        </div>

        {/* Details Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Address */}
            {(activity.formatted_address || activity.venue) && (
              <Card>
                <CardContent className="p-4 flex gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.formatted_address || activity.venue}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Opening Hours */}
            {activity.opening_hours && (
              <Card>
                <CardContent className="p-4 flex gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Hours</p>
                      {activity.opening_hours.open_now !== undefined && (
                        <Badge variant={activity.opening_hours.open_now ? "default" : "destructive"}>
                          {activity.opening_hours.open_now ? "Open Now" : "Closed"}
                        </Badge>
                      )}
                    </div>
                    {activity.opening_hours.weekday_text && (
                      <div className="space-y-1">
                        {activity.opening_hours.weekday_text.map((day, idx) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            {day}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Phone */}
            {activity.formatted_phone_number && (
              <Card>
                <CardContent className="p-4 flex gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.formatted_phone_number}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Website */}
            {activity.website && (
              <Card className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={handleVisitWebsite}>
                <CardContent className="p-4 flex gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Website</p>
                    <p className="text-sm text-primary hover:underline truncate">
                      {activity.website}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Price */}
            {activity.price && (
              <Card>
                <CardContent className="p-4">
                  <p className="font-medium mb-1">Price Range</p>
                  <p className="text-sm text-muted-foreground">{activity.price}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-4">
            {activity.reviews && activity.reviews.length > 0 ? (
              activity.reviews.map((review, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {review.profile_photo_url && (
                        <img
                          src={review.profile_photo_url}
                          alt={review.author_name}
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{review.author_name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(review.time * 1000).toLocaleDateString()}
                        </p>
                        <p className="text-sm">{review.text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No reviews available yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            {activity.photos && activity.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {activity.photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`}
                      alt={`${activity.title} - Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No additional photos available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ShareActivityDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        activity={activity}
      />
    </div>
  );
};

export default ActivityDetail;
