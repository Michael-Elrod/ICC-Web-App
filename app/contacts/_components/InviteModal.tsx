// InviteModal.tsx

import { useState } from "react";
import {
  useInviteCode,
  useGenerateInviteCode,
  useSendInviteEmail,
} from "@/app/hooks/use-invite";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [activeTab, setActiveTab] = useState<"code" | "email">("code");

  const {
    data: inviteData,
    isLoading,
    error: fetchError,
  } = useInviteCode(isOpen);
  const generateCode = useGenerateInviteCode();
  const sendEmail = useSendInviteEmail();

  const inviteCode = inviteData?.code || "";
  const error = fetchError ? "Failed to fetch invite code" : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const generateNewCode = async () => {
    try {
      await generateCode.mutateAsync();
    } catch (err) {
      console.error(err);
    }
  };

  const sendInviteEmail = async () => {
    if (!emailInput) {
      setEmailError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");
    try {
      await sendEmail.mutateAsync(emailInput);
      setEmailSuccess(true);
      setEmailInput("");
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err: any) {
      setEmailError(err.message || "Failed to send invitation email");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-[450px]">
        <h2 className="text-xl font-bold mb-4">Invitation Management</h2>

        <div className="flex border-b border-zinc-300 dark:border-zinc-700 mb-4">
          <button
            className={`py-2 px-4 ${
              activeTab === "code"
                ? "border-b-2 border-blue-500 font-medium"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            onClick={() => setActiveTab("code")}
          >
            Invite Code
          </button>
          <button
            className={`py-2 px-4 ${
              activeTab === "email"
                ? "border-b-2 border-blue-500 font-medium"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
            onClick={() => setActiveTab("email")}
          >
            Send Email Invite
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-[42px] bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-4"></div>
              <div className="h-[42px] bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "code" && (
              <div className="space-y-4">
                {error ? (
                  <div className="text-red-500 p-2 rounded bg-red-100 dark:bg-red-900/20">
                    {error}
                  </div>
                ) : (
                  <div className="relative">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-white mb-2">
                      Current Invite Code
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={inviteCode}
                        readOnly
                        className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600
                          rounded-l-md bg-zinc-50 dark:bg-zinc-900"
                      />
                      <button
                        onClick={copyToClipboard}
                        className={`px-4 py-2 text-white rounded-r-md transition-colors
                        ${
                          copySuccess
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {copySuccess ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={generateNewCode}
                  disabled={generateCode.isPending}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md
                    hover:bg-blue-600 transition-colors disabled:bg-blue-400
                    disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {generateCode.isPending ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate New Code"
                  )}
                </button>
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-4">
                {emailSuccess && (
                  <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded text-green-700 dark:text-green-300">
                    Invitation email sent successfully!
                  </div>
                )}

                {emailError && (
                  <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded text-red-700 dark:text-red-300">
                    {emailError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-white mb-2">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Email address to invite"
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600
                      rounded-md bg-white dark:bg-zinc-800 focus:outline-none
                      focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-white mb-2">
                    Code to be sent
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    readOnly
                    className="w-full p-2 border border-zinc-300 dark:border-zinc-600
                      rounded-md bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
                  />
                </div>

                <button
                  onClick={sendInviteEmail}
                  disabled={sendEmail.isPending || !emailInput}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md
                    hover:bg-blue-600 transition-colors disabled:bg-blue-400
                    disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sendEmail.isPending ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Invitation Email"
                  )}
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-md
              hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
