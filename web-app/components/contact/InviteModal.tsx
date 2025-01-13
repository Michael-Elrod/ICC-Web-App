// components/InviteModal.tsx
import { useState, useEffect } from "react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const fetchCurrentCode = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/invite");
      if (!response.ok) throw new Error("Failed to fetch code");
      const data = await response.json();
      setInviteCode(data.code);
    } catch (err) {
      setError("Failed to fetch invite code");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewCode = async () => {
    setIsGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/invite", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate code");
      const data = await response.json();
      setInviteCode(data.code);
    } catch (err) {
      setError("Failed to generate new code");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCurrentCode();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-[400px]">
        <h2 className="text-xl font-bold mb-4">Invitation Code</h2>

        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-[42px] bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-4"></div>
              <div className="h-[42px] bg-zinc-200 dark:bg-zinc-700 rounded w-full"></div>
            </div>
          </div>
        ) : (
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
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md 
                hover:bg-blue-600 transition-colors disabled:bg-blue-400
                disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
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
