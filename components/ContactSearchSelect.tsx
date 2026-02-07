import React, { useState, useEffect, useRef } from "react";
import { UserView } from "@/app/types/views";

interface ContactSearchSelectProps {
  contacts: UserView[];
  selectedContacts: UserView[];
  onSelect: (contact: UserView) => void;
}

export default function ContactSearchSelect({
  contacts,
  selectedContacts,
  onSelect,
}: ContactSearchSelectProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableContacts = contacts.filter(
    (contact) =>
      !selectedContacts.some(
        (selected) => selected.user_id === contact.user_id
      )
  );

  const filteredContacts = search.trim()
    ? availableContacts.filter((contact) => {
        const fullName =
          `${contact.first_name} ${contact.last_name}`.toLowerCase();
        return fullName.includes(search.toLowerCase());
      })
    : availableContacts;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded dark:bg-zinc-800 dark:text-white"
        placeholder="Search..."
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="contact-search-listbox"
      />

      {isOpen && (
        <div
          id="contact-search-listbox"
          className="absolute w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-lg max-h-48 overflow-auto z-50"
          role="listbox"
        >
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <div
                key={contact.user_id}
                className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-zinc-900 dark:text-white"
                onClick={() => {
                  onSelect(contact);
                  setSearch("");
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={false}
              >
                {`${contact.first_name} ${contact.last_name}`}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-zinc-500 dark:text-zinc-400">
              No people found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
