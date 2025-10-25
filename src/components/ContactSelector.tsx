import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus } from "lucide-react";

interface Contact {
  name: string;
  phone: string;
  email: string;
}

interface ContactSelectorProps {
  onContactsSelected: (contacts: Contact[]) => void;
}

export const ContactSelector = ({ onContactsSelected }: ContactSelectorProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load synced contacts from localStorage
    const syncedContacts = localStorage.getItem("syncedContacts");
    if (syncedContacts) {
      try {
        const parsed = JSON.parse(syncedContacts);
        setContacts(parsed);
      } catch (error) {
        console.error("Error loading contacts:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Notify parent of selected contacts
    const selected = contacts.filter(contact => 
      selectedContacts.has(contact.phone || contact.email)
    );
    onContactsSelected(selected);
  }, [selectedContacts, contacts, onContactsSelected]);

  const toggleContact = (contact: Contact) => {
    const key = contact.phone || contact.email;
    const newSelected = new Set(selectedContacts);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedContacts(newSelected);
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No contacts synced yet</p>
        <p className="text-xs mt-1">Sync contacts from settings to add friends easily</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px] rounded-md border p-4">
      <div className="space-y-3">
        {contacts.map((contact, index) => {
          const key = contact.phone || contact.email;
          const isSelected = selectedContacts.has(key);
          
          return (
            <div key={index} className="flex items-start gap-3">
              <Checkbox
                id={`contact-${index}`}
                checked={isSelected}
                onCheckedChange={() => toggleContact(contact)}
              />
              <Label
                htmlFor={`contact-${index}`}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-muted-foreground">
                  {contact.phone || contact.email}
                </div>
              </Label>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
