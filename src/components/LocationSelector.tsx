import { useState, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";

interface LocationSelectorProps {
  onLocationChange: (location: { latitude: number; longitude: number; name: string }) => void;
}

export const LocationSelector = ({ onLocationChange }: LocationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [locationName, setLocationName] = useState("Getting location...");
  const [customLocation, setCustomLocation] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Save to localStorage
          localStorage.setItem("location_permission", "granted");
          localStorage.setItem("user_latitude", latitude.toString());
          localStorage.setItem("user_longitude", longitude.toString());
          
          reverseGeocode(latitude, longitude);
          onLocationChange({ latitude, longitude, name: locationName });
        },
        (error) => {
          setLocationName("Location unavailable");
          toast({
            title: "Location Error",
            description: "Could not get your location. Using default.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    // Simple location name based on coordinates
    setLocationName(`${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
  };

  const handleLocationSearch = async () => {
    if (!customLocation.trim()) return;

    // Parse city name or coordinates from input
    const coordinatesMatch = customLocation.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    
    if (coordinatesMatch) {
      // User entered coordinates
      const lat = parseFloat(coordinatesMatch[1]);
      const lng = parseFloat(coordinatesMatch[2]);
      
      setLocationName(customLocation);
      onLocationChange({ latitude: lat, longitude: lng, name: customLocation });
      setOpen(false);
      
      toast({
        title: "Location Updated",
        description: `Now showing activities near ${customLocation}`,
      });
    } else {
      // Use city name directly
      // Default coordinates for common cities (can be extended)
      const cityCoordinates: Record<string, { lat: number; lng: number }> = {
        'indore': { lat: 22.7196, lng: 75.8577 },
        'mumbai': { lat: 19.0760, lng: 72.8777 },
        'delhi': { lat: 28.7041, lng: 77.1025 },
        'bangalore': { lat: 12.9716, lng: 77.5946 },
        'pune': { lat: 18.5204, lng: 73.8567 },
      };
      
      const cityKey = customLocation.toLowerCase().trim();
      const coords = cityCoordinates[cityKey];
      
      if (coords) {
        // Save to localStorage
        localStorage.setItem("user_latitude", coords.lat.toString());
        localStorage.setItem("user_longitude", coords.lng.toString());
        
        setLocationName(customLocation);
        onLocationChange({ latitude: coords.lat, longitude: coords.lng, name: customLocation });
        setOpen(false);
        
        toast({
          title: "Location Updated",
          description: `Now showing activities near ${customLocation}`,
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Please enter coordinates (lat, lng) or try: Indore, Mumbai, Delhi, Bangalore, Pune",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-3 h-auto py-2"
        >
          <MapPin className="h-5 w-5 text-primary" />
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">Location</span>
            <span className="text-sm font-medium flex items-center gap-1">
              {locationName.length > 20 ? locationName.substring(0, 20) + '...' : locationName}
              <ChevronDown className="h-3 w-3" />
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Location</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter city, area or pincode"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
            />
            <Button onClick={handleLocationSearch}>Search</Button>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              getCurrentLocation();
              setOpen(false);
            }}
            className="w-full"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Use Current Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
