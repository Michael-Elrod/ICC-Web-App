// components/ForgotPasswordForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setIsLoading(true);
    setError("");
    setEmailSent(false);
  
    const email = form.email.value;
  
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        if (res.status === 400 && data.message === "Invalid email format") {
          setError(data.message);
        } else if (res.status === 500) {
          setError("An error occurred. Please try again later.");
        }
        setIsLoading(false);
        return;
      }
  
      form.reset();
      setEmailSent(true);
    } catch (error) {
      console.error("Reset request error:", error);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out w-full max-w-sm mx-auto">
      <h2 className="text-3xl font-extrabold mb-6 text-center">
        Forgot Password
      </h2>
      {error ? (
        <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
      ) : emailSent ? (
        <div className="text-center">
          <div className="mb-4 text-green-500 text-sm">
            If an account exists with this email address, you will receive password reset instructions shortly.
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue-600 text-white py-2 rounded-md shadow-sm hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
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
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700"
          >
            Back to Login
          </button>
        </form>
      )}
    </div>
  );
}