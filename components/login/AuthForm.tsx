"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { isEmailValid } from "@/app/utils";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    signupEmail: "",
    phone: "",
    signupPassword: "",
    retypePassword: "",
    inviteCode: "",
  });

  const areAllFieldsFilled =
    !isLogin && Object.values(formData).every((field) => field.trim() !== "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setEmailError("");
    setPasswordError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");
  
    if (isLogin) {
      setIsLoading(true);
      try {
        // First try the test endpoint
        console.log("Testing direct login...");
        const loginTest = await fetch('/api/login-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: e.currentTarget.email.value,
            password: e.currentTarget.password.value,
          })
        });
        
        const testResult = await loginTest.json();
        console.log('Login test result:', testResult);
  
        // Then try the normal NextAuth login
        console.log("Attempting NextAuth login...");
        const result = await signIn("credentials", {
          email: e.currentTarget.email.value,
          password: e.currentTarget.password.value,
          redirect: false,
        });
        console.log("SignIn response:", result);
  
        if (result?.error) {
          console.log("Result has error:", result.error);
          if (result.error.includes("No account found")) {
            setEmailError(result.error);
          } else if (result.error.includes("Incorrect password")) {
            setPasswordError(result.error);
          } else {
            setError(result.error);
          }
        } else if (result?.ok) {
          console.log("Login successful, redirecting...");
          router.replace("/jobs");
        }
      } catch (error) {
        console.error("Detailed login error:", error);
        console.log("Error type:", typeof error);
        console.log("Error stringified:", JSON.stringify(error));
        setError("An error occurred during login");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Validate passwords match
      if (formData.signupPassword !== formData.retypePassword) {
        setError("Passwords do not match");
        return;
      }
  
      // Validate email format
      if (!isEmailValid(formData.signupEmail)) {
        setError("Please enter a valid email address");
        return;
      }
  
      setIsLoading(true);
  
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.signupEmail,
            password: formData.signupPassword,
            phone: formData.phone,
            inviteCode: formData.inviteCode,
          }),
        });
  
        const data = await res.json();
  
        // Immediately handle any non-200 response
        if (res.status === 400) {
          setEmailError(data.message);
          setIsLoading(false);
          return;
        }
  
        if (!res.ok) {
          setError(data.message || "Registration failed");
          setIsLoading(false);
          return;
        }
  
        // Only proceed with sign in if registration was successful
        const result = await signIn("credentials", {
          email: formData.signupEmail,
          password: formData.signupPassword,
          redirect: false,
        });
  
        if (result?.error) {
          setError(result.error);
        } else if (result?.ok) {
          router.replace("/jobs");
        }
      } catch (error) {
        console.error("Registration error:", error);
        setError("An error occurred during registration");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmailError("");
    setPasswordError("");
  };

  return (
    <div
      className={`bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
        isLogin ? "w-96" : "w-96 h-auto"
      }`}
    >
      <h2 className="text-3xl font-extrabold mb-6 text-center">
        {isLogin ? "Login" : "Register"}
      </h2>
      {error && (
        <div className="mb-4 text-red-500 text-sm text-center">{error}</div>
      )}
      <form
        onSubmit={handleSubmit}
        className={`transition-all duration-300 ease-in-out ${
          isLogin ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
        }`}
      >
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            disabled={isLoading}
            className={`w-full px-3 py-2 border ${
              emailError ? "border-red-500" : "border-zinc-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-500">{emailError}</p>
          )}
        </div>
        <div className="mb-2">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
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
          {passwordError && (
            <p className="mt-1 text-sm text-red-500">{passwordError}</p>
          )}
        </div>
        <div className="flex items-center justify-end mb-4">
          <a href="#" className="text-sm text-blue-600 hover:underline">
            Forgot Password?
          </a>
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
            "Login"
          )}
        </button>
      </form>

      <form
        onSubmit={handleSubmit}
        className={`transition-all duration-300 ease-in-out ${
          isLogin ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
        }`}
      >
        <div className="mb-4">
          <label htmlFor="firstName" className="block text-sm font-medium mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="lastName" className="block text-sm font-medium mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="signupEmail"
            className="block text-sm font-medium mb-1"
          >
            Email
          </label>
          <input
            type="email"
            id="signupEmail"
            name="signupEmail"
            value={formData.signupEmail}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className={`w-full px-3 py-2 border ${
              emailError ? "border-red-500" : "border-zinc-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-500">{emailError}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="signupPassword"
            className="block text-sm font-medium mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="signupPassword"
            name="signupPassword"
            value={formData.signupPassword}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="retypePassword"
            className="block text-sm font-medium mb-1"
          >
            Retype Password
          </label>
          <input
            type="password"
            id="retypePassword"
            name="retypePassword"
            value={formData.retypePassword}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="inviteCode"
            className="block text-sm font-medium mb-1"
          >
            Invite Code
          </label>
          <input
            type="text"
            id="inviteCode"
            name="inviteCode"
            value={formData.inviteCode}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || (!isLogin && !areAllFieldsFilled)}
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
            "Register"
          )}
        </button>
      </form>

      <div className="text-center my-2 text-sm text-zinc-500">or</div>
      <button
        onClick={toggleForm}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isLogin ? "Register" : "Login"}
      </button>
    </div>
  );
}
