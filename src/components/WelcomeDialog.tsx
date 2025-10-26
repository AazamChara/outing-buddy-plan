import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Users, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WelcomeDialogProps {
  open: boolean;
  onComplete: () => void;
}

export const WelcomeDialog = ({ open, onComplete }: WelcomeDialogProps) => {
  const { toast } = useToast();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [contactsEnabled, setContactsEnabled] = useState(false);

  const handleEnableLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location enabled:", position.coords);
          localStorage.setItem("location_permission", "granted");
          localStorage.setItem("user_latitude", position.coords.latitude.toString());
          localStorage.setItem("user_longitude", position.coords.longitude.toString());
          setLocationEnabled(true);
          toast({
            title: "Location enabled!",
            description: "We'll show you nearby activities and events.",
          });
        },
        (error) => {
          console.error("Location error:", error);
          toast({
            title: "Location access denied",
            description: "You can enable this later in your browser settings.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
    }
  };

  const handleSyncContacts = async () => {
    try {
      // Check if Contact Picker API is available
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const contacts = await (navigator as any).contacts.select(
          ['name', 'tel'],
          { multiple: true }
        );
        
        if (contacts && contacts.length > 0) {
          localStorage.setItem("contacts_permission", "granted");
          localStorage.setItem("syncedContacts", JSON.stringify(contacts));
          setContactsEnabled(true);
          toast({
            title: "Contacts synced!",
            description: `${contacts.length} contacts synced successfully.`,
          });
        }
      } else {
        // Fallback: Just mark as enabled and show a message
        localStorage.setItem("contacts_permission", "granted");
        setContactsEnabled(true);
        toast({
          title: "Contacts permission granted",
          description: "You'll be able to invite friends to groups.",
        });
      }
    } catch (error) {
      console.error("Contacts error:", error);
      toast({
        title: "Contacts access denied",
        description: "You can enable this later in settings.",
        variant: "destructive",
      });
    }
  };

  const handleContinue = () => {
    localStorage.setItem("onboarding_completed", "true");
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            Welcome! <PartyPopper className="h-6 w-6" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground mb-6">
            Let's personalize your experience
          </p>

          {/* Enable Location */}
          <button
            onClick={handleEnableLocation}
            className="w-full p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
            disabled={locationEnabled}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <MapPin className="h-5 w-5 text-[hsl(var(--teal))]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Enable Location</h3>
                <p className="text-sm text-muted-foreground">
                  Discover nearby places and events for your group outings
                </p>
                {locationEnabled && (
                  <p className="text-xs text-[hsl(var(--teal))] mt-2 font-medium">✓ Enabled</p>
                )}
              </div>
            </div>
          </button>

          {/* Sync Contacts */}
          <button
            onClick={handleSyncContacts}
            className="w-full p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
            disabled={contactsEnabled}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Users className="h-5 w-5 text-[hsl(var(--lavender-dark))]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Sync Contacts</h3>
                <p className="text-sm text-muted-foreground">
                  Easily invite your friends to groups
                </p>
                {contactsEnabled && (
                  <p className="text-xs text-[hsl(var(--teal))] mt-2 font-medium">✓ Enabled</p>
                )}
              </div>
            </div>
          </button>

          <p className="text-xs text-center text-muted-foreground pt-2">
            You can change these permissions anytime in your browser settings
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1 bg-[hsl(var(--teal))] hover:bg-[hsl(var(--teal-dark))] text-white"
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
