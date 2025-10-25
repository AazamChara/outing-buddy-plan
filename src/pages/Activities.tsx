import { MapPin, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const activities = [
  {
    id: 1,
    title: "Jazz Night at Blue Note",
    type: "Music",
    venue: "Blue Note Jazz Club",
    distance: "1.2mi",
    date: "Tonight, 8:00 PM",
    price: "$$",
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=250&fit=crop",
  },
  {
    id: 2,
    title: "Weekend Brunch Special",
    type: "Food",
    venue: "The Garden Café",
    distance: "0.8mi",
    date: "Tomorrow, 10:00 AM",
    price: "$",
    image: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&h=250&fit=crop",
  },
  {
    id: 3,
    title: "Indie Film Festival",
    type: "Entertainment",
    venue: "Riverside Cinema",
    distance: "2.5mi",
    date: "This Weekend",
    price: "$$$",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=250&fit=crop",
  },
];

const Activities = () => {
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto p-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Activities</h1>
          <p className="text-muted-foreground">Find exciting events and outings near you</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="secondary" size="sm">All</Button>
          <Button variant="outline" size="sm">Food</Button>
          <Button variant="outline" size="sm">Fun</Button>
          <Button variant="outline" size="sm">Adventure</Button>
          <Button variant="outline" size="sm">Entertainment</Button>
        </div>

        {/* Activities Grid */}
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
