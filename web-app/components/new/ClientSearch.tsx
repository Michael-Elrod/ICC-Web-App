// components/new/ClientSearch.tsx
import React, { useState, useEffect } from "react";
import { User } from "../../app/types/database";

interface Props {
  onClientSelect: (client: User | null) => void;
  selectedClient: User | null;
}

export default function ClientSearchSelect({
  onClientSelect,
  selectedClient,
}: Props) {
  const [search, setSearch] = useState("");
  const [allClients, setAllClients] = useState<User[]>([]);
  const [filteredClients, setFilteredClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getInputClassName = (fieldName: string) => {
    const baseClass = "mt-1 block w-full border rounded-md shadow-sm p-2";
    const normalClass = "border-zinc-300";
    const darkModeClass =
      "dark:bg-zinc-800 dark:text-white dark:border-zinc-600";

    return `${baseClass} ${normalClass} ${darkModeClass}`;
  };

  const fetchAllClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/clients");
      const data = await response.json();
      setAllClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all clients on component mount or when selectedClient changes
  useEffect(() => {
    fetchAllClients();
  }, [selectedClient]);

  // Update search field when selectedClient changes
  useEffect(() => {
    if (selectedClient) {
      setSearch(
        `${selectedClient.user_first_name} ${selectedClient.user_last_name}`
      );
    }
  }, [selectedClient]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const searchContainer = document.getElementById(
        "client-search-container"
      );
      if (searchContainer && !searchContainer.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter clients based on search input
  useEffect(() => {
    if (search.trim()) {
      const filtered = allClients.filter((client) => {
        const fullName =
          `${client.user_first_name} ${client.user_last_name}`.toLowerCase();
        const searchTerm = search.toLowerCase();

        return (
          fullName.includes(searchTerm) ||
          client.user_email.toLowerCase().includes(searchTerm) ||
          (client.user_phone && client.user_phone.includes(searchTerm))
        );
      });
      setFilteredClients(filtered);
    } else {
      setFilteredClients(allClients);
    }
  }, [search, allClients]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div id="client-search-container" className="flex-grow h-[64px] relative">
      <label className="block text-sm font-medium text-zinc-700 dark:text-white">
        Select Client{selectedClient && " - Selected"}
      </label>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!e.target.value) {
              onClientSelect(null);
            }
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={getInputClassName("clientSearch")}
          placeholder="Search clients..."
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />

        {loading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400">
            Loading...
          </div>
        )}

        {isOpen && (
          <div
            className="absolute w-full mt-1 bg-white dark:bg-zinc-800 border 
                       border-zinc-300 dark:border-zinc-600 rounded-md shadow-lg 
                       max-h-32 overflow-auto z-50"
            role="listbox"
          >
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <div
                  key={client.user_id}
                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 
                           cursor-pointer text-zinc-900 dark:text-white"
                  onClick={() => {
                    onClientSelect(client);
                    setSearch(
                      `${client.user_first_name} ${client.user_last_name}`
                    );
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={
                    search ===
                    `${client.user_first_name} ${client.user_last_name}`
                  }
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {`${client.user_first_name} ${client.user_last_name}`}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {client.user_email}
                    </span>
                    {client.user_phone && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {client.user_phone}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-zinc-500 dark:text-zinc-400">
                No clients found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
