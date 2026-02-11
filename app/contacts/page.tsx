// page.tsx

"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import EditUserModal from "./_components/EditUserModal";
import ContactCard from "@/components/ContactCard";
import InviteModal from "./_components/InviteModal";
import ContactsSkeleton from "./_components/ContactsSkeleton";
import { User } from "@/app/types/database";
import { useUsers } from "@/app/hooks/use-users";

type FilterType = "all" | "workers" | "clients";

export default function ContactsPage() {
  const { data: session } = useSession();
  const { data: users = [], isLoading, error } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const filteredUsers = users.filter((user) => {
    const fullName =
      `${user.user_first_name} ${user.user_last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      user.user_email.toLowerCase().includes(searchQuery.toLowerCase());

    switch (activeFilter) {
      case "clients":
        return user.user_type === "Client" && matchesSearch;
      case "workers":
        return user.user_type !== "Client" && matchesSearch;
      default:
        return matchesSearch;
    }
  });

  if (isLoading) return <ContactsSkeleton />;

  if (error)
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200">
              {error instanceof Error
                ? error.message
                : "Failed to load contacts"}
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="flex-1">
      <header className="sticky top-0 z-10 transition-all bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-3">Contacts</h1>
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-auto sm:flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 bg-white dark:bg-zinc-800"
            />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as FilterType)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-md font-medium border border-zinc-300
                dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none
                focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="workers">Workers</option>
              <option value="clients">Clients</option>
            </select>
            {(session?.user?.type === "Owner" ||
              session?.user?.type === "Admin") && (
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md
                  hover:bg-blue-600 transition-colors"
              >
                Invite
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 pb-6 sm:px-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No contacts found matching your search.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  onClick={() => {
                    if (
                      session?.user?.type === "Owner" ||
                      session?.user?.type === "Admin"
                    ) {
                      setSelectedUser(user);
                    }
                  }}
                  className={`${
                    session?.user?.type === "Owner" ||
                    session?.user?.type === "Admin"
                      ? "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md dark:hover:shadow-zinc-900 hover:scale-[1.01] hover:border-blue-200 dark:hover:border-blue-800"
                      : ""
                  } transition-all rounded-lg border border-transparent transform-gpu`}
                >
                  <ContactCard
                    user_id={user.user_id}
                    user_first_name={user.user_first_name}
                    user_last_name={user.user_last_name}
                    user_email={user.user_email}
                    user_phone={user.user_phone || ""}
                    showCheckbox={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <EditUserModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
        currentUserId={session?.user?.id}
      />
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}
