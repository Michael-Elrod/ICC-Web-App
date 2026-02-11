// page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import PasswordChangeModal from "./_components/PasswordModal";
import SettingsSkeleton from "./_components/SettingsSkeleton";
import { formatPhoneNumberInput } from "@/app/utils";
import { useUpdateSettings, useChangePassword } from "@/app/hooks/use-settings";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <SettingsSkeleton />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 flex flex-col items-center">
            <SettingsForm />
          </div>
        </main>
      </div>
    </div>
  );
}

const SettingsForm: React.FC = () => {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [firstName, setFirstName] = useState(session?.user.firstName ?? "");
  const [lastName, setLastName] = useState(session?.user.lastName ?? "");
  const [phone, setPhone] = useState(
    formatPhoneNumberInput(session?.user.phone ?? ""),
  );
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [notificationPref, setNotificationPref] = useState(
    session?.user.notificationPref ?? "email",
  );

  const updateSettings = useUpdateSettings();
  const changePassword = useChangePassword();

  const hasChanges =
    firstName !== (session?.user.firstName ?? "") ||
    lastName !== (session?.user.lastName ?? "") ||
    phone !== formatPhoneNumberInput(session?.user.phone ?? "") ||
    email !== (session?.user.email ?? "") ||
    notificationPref !== (session?.user.notificationPref ?? "email");

  const getInputClassName = (fieldName: string) => {
    const baseClass = "mt-1 block w-full border rounded-md shadow-sm p-2";
    const normalClass = "border-zinc-300";
    const darkModeClass =
      "dark:bg-zinc-800 dark:text-white dark:border-zinc-600";

    return `${baseClass} ${normalClass} ${darkModeClass}`.trim();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const updatedData = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        notificationPref: formData.get("notificationPref"),
      };

      await updateSettings.mutateAsync(updatedData);

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          ...updatedData,
        },
      });

      setSuccessMessage("Profile updated successfully");
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({
        callbackUrl: "/",
        redirect: false,
      });

      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handlePasswordChange = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      });

      setSuccessMessage("Password updated successfully");
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg w-full max-w-md mb-6">
        <h2 className="text-2xl font-bold mb-1 text-center text-zinc-700 dark:text-white">
          Settings
        </h2>
        <p className="text-sm text-zinc-600 dark:text-white/70 text-center mb-6">
          Edit contact info
        </p>

        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
        )}

        {successMessage && (
          <div className="mb-4 text-green-500 text-sm text-center">
            {successMessage}
          </div>
        )}

        <form id="settingsForm" onSubmit={handleSubmit}>
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
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
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
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumberInput(e.target.value))}
              className={getInputClassName("phone")}
            />
          </div>

          <div className="mb-4">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={getInputClassName("email")}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="notificationPref"
              className="block text-sm font-medium text-zinc-700 dark:text-white mb-1"
            >
              Notification Preference
            </label>
            <select
              id="notificationPref"
              name="notificationPref"
              value={notificationPref}
              onChange={(e) => setNotificationPref(e.target.value)}
              className={getInputClassName("notifications")}
            >
              <option value="email">Email</option>
              <option value="none">None</option>
            </select>
          </div>
        </form>
      </div>

      <div className="w-full max-w-md space-y-3">
        <button
          type="submit"
          form="settingsForm"
          disabled={isUpdating || !hasChanges}
          className={`w-full text-white py-2 rounded-md shadow-sm transition duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
            hasChanges ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"
          }`}
        >
          {isUpdating ? (
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
              Saving...
            </span>
          ) : (
            "Save"
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          className="w-full bg-blue-600 text-white py-2 rounded-md shadow-sm hover:bg-blue-700 transition duration-300 font-bold"
        >
          Change Password
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full bg-red-500 text-white py-2 rounded-md shadow-sm hover:bg-red-600 transition duration-300 font-bold disabled:opacity-50"
        >
          {isLoggingOut ? (
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
              Logging out...
            </span>
          ) : (
            "Logout"
          )}
        </button>
      </div>

      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
      />
    </>
  );
};
