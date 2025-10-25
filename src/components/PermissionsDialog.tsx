import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const PermissionsDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [contactsAttempted, setContactsAttempted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has already seen this dialog
    const hasSeenPermissions = localStorage.getItem("hasSeenPermissions");
    if (!hasSeenPermissions) {
      setIsOpen(true);
    }
  }, []);

  const requestLocation = async () => {
    try {
      const result = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      
      if (result.state === "granted" || result.state === "prompt") {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocationGranted(true);
            localStorage.setItem("userLocation", JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }));
            toast({
              title: "Location enabled",
              description: "We can now suggest nearby places!",
            });
          },
          (error) => {
            toast({
              title: "Location access denied",
              description: "You can enable it later in your browser settings.",
              variant: "destructive"
            });
          }
        );
      }
    } catch (error) {
      console.error("Location permission error:", error);
      toast({
        title: "Location not available",
        description: "Your browser doesn't support location access.",
        variant: "destructive"
      });
    }
  };

  const handleContactsPicker = async () => {
    // Check if Contact Picker API is supported
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'email', 'tel'];
        // @ts-ignore - Contacts API is not in TypeScript types yet
        const contacts = await navigator.contacts.select(props, { multiple: true });
        
        // Store contacts in localStorage for later use
        const formattedContacts = contacts.map((contact: any) => ({
          name: contact.name?.[0] || 'Unknown',
          phone: contact.tel?.[0] || '',
          email: contact.email?.[0] || ''
        }));
        
        localStorage.setItem("syncedContacts", JSON.stringify(formattedContacts));
        setContactsAttempted(true);
        
        toast({
          title: "Contacts synced",
          description: `${formattedContacts.length} contact(s) synced successfully!`,
        });
      } catch (error) {
        console.error("Contact picker error:", error);
        toast({
          title: "Contact access cancelled",
          description: "You can sync contacts later from settings.",
        });
      }
    } else {
      setContactsAttempted(true);
      toast({
        title: "Contacts not supported",
        description: "Your browser doesn't support contact syncing. You can add friends manually!",
      });
    }
  };

  const handleContinue = () => {
    localStorage.setItem("hasSeenPermissions", "true");
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenPermissions", "true");
    setIsOpen(false);
    toast({
      title: "Permissions skipped",
      description: "You can enable these later in settings.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Welcome! 🎉</DialogTitle>
          <DialogDescription className="text-center">
            Let's personalize your experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Location Permission */}
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
            <div className="mt-1">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Enable Location</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Discover nearby places and events for your group outings
              </p>
              {locationGranted ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Location enabled</span>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={requestLocation}
                >
                  Enable Location
                </Button>
              )}
            </div>
          </div>

          {/* Contacts Permission */}
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
            <div className="mt-1">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Sync Contacts</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Sync your contacts to easily add friends to groups
              </p>
              {contactsAttempted ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Contacts synced</span>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleContactsPicker}
                >
                  Sync Contacts
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can change these permissions anytime in your browser settings
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleSkip}
          >
            Skip for now
          </Button>
          <Button 
            className="flex-1"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
