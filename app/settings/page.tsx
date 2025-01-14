// app/settings/page.tsx
"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import PasswordChangeModal from "@/components/util/PasswordModal";

const SettingsHeader: React.FC<{ title: string }> = ({ title }) => {
  return (
    <header className="sticky top-0 z-10">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
    </header>
  );
};

const SettingsForm: React.FC = () => {
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const getInputClassName = (fieldName: string) => {
    const baseClass = "mt-1 block w-full border rounded-md shadow-sm p-2";
    const normalClass = "border-zinc-300";
    const darkModeClass =
      "dark:bg-zinc-800 dark:text-white dark:border-zinc-600";

    return `${baseClass} ${normalClass} ${darkModeClass}`.trim();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          phone: formData.get('phone'),
          email: formData.get('email'),
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
  
      // Force a complete session refresh
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          firstName: formData.get('firstName') as string,
          lastName: formData.get('lastName') as string,
          phone: formData.get('phone') as string,
          email: formData.get('email') as string,
        }
      });
  
      setSuccessMessage('Profile updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch('/api/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setSuccessMessage('Password updated successfully');
    } catch (error) {
      throw error;
    }
  };
  
  return (
    <>
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-zinc-700 dark:text-white">
          Contact Information
        </h2>
  
        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
        )}
  
        {successMessage && (
          <div className="mb-4 text-green-500 text-sm text-center">
            {successMessage}
          </div>
        )}
  
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-zinc-700 dark:text-white mb-1"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              defaultValue={session?.user.firstName ?? ""}
              required
              className={getInputClassName("firstName")}
            />
          </div>
  
          <div className="mb-4">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-zinc-700 dark:text-white mb-1"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              defaultValue={session?.user.lastName ?? ""}
              required
              className={getInputClassName("lastName")}
            />
          </div>
  
          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-zinc-700 dark:text-white mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              defaultValue={session?.user.phone ?? ""}
              className={getInputClassName("phone")}
            />
          </div>
  
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-white mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={session?.user.email ?? ""}
              required
              className={getInputClassName("email")}
            />
          </div>
  
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-white py-2 rounded-md shadow-sm hover:bg-green-600 transition duration-300 mb-3 font-bold disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Updating...
              </span>
            ) : (
              "Update"
            )}
          </button>
  
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full bg-blue-600 text-white py-2 rounded-md shadow-sm hover:bg-blue-700 transition duration-300 mb-3 font-bold"
          >
            Change Password
          </button>
  
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 rounded-md shadow-sm hover:bg-red-600 transition duration-300 font-bold"
          >
            Logout
          </button>
        </form>
      </div>
  
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
      />
    </>
  );
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SettingsHeader title="Settings" />
      <main className="flex-1 flex justify-center items-center">
        <SettingsForm />
      </main>
    </div>
  );
}
