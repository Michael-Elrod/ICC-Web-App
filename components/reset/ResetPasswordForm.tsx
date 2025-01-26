// components/reset/ResetPasswordForm.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}

function ResetPasswordFormContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setPasswordError("");

    const password = e.currentTarget.password.value;
    const confirmPassword = e.currentTarget.confirmPassword.value;

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Password reset failed");
        return;
      }

      router.replace("/");
    } catch (error) {
      console.error("Reset error:", error);
      setError("An error occurred during password reset");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out w-full max-w-sm mx-auto">
        <h2 className="text-3xl font-extrabold mb-6 text-center">
          Invalid Reset Link
        </h2>
        <p className="text-center mb-4">
          This password reset link is invalid or has expired.
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full bg-blue-600 text-white py-2 rounded-md shadow-sm hover:bg-blue-700"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out w-full max-w-sm mx-auto">
      <h2 className="text-3xl font-extrabold mb-6 text-center">
        Reset Password
      </h2>
      {error && (
        <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            disabled={isLoading}
            className={`w-full px-3 py-2 border ${
              passwordError ? "border-red-500" : "border-zinc-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            disabled={isLoading}
            className={`w-full px-3 py-2 border ${
              passwordError ? "border-red-500" : "border-zinc-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
          />
          {passwordError && (
            <p className="mt-1 text-sm text-red-500">{passwordError}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
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
              Loading...
            </span>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
}