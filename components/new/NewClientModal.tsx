import { useState } from "react";
import { User, UserType } from "@/app/types/database";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: User) => void;
}

export default function NewClientModal({ isOpen, onClose, onClientCreated }: NewClientModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateClientForm = () => {
    const errors: { [key: string]: string } = {};
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!clientEmail.trim()) errors.clientEmail = "Client email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      errors.clientEmail = "Please enter a valid email address";
    }
    return errors;
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    if (numbers.length <= 3) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const handleSubmit = async () => {
    const newErrors = validateClientForm();
    setErrors(newErrors);
    setAttempted(true);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/users/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email: clientEmail,
            phone: clientPhone.replace(/\D/g, ""),
          }),
        });

        const newClient = await response.json();

        if (!response.ok) {
          throw new Error(newClient.error || "Failed to create client");
        }

        const formattedClient: User = {
          user_id: newClient.user_id,
          user_first_name: newClient.user_first_name,
          user_last_name: newClient.user_last_name,
          user_email: newClient.user_email,
          user_phone: newClient.user_phone,
          user_type: "Client" as UserType,
          created_at: newClient.created_at,
          updated_at: newClient.updated_at,
        };

        onClientCreated(formattedClient);
        handleClose();
      } catch (error) {
        setErrors({
          submit: error instanceof Error ? error.message : "Failed to create client",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setFirstName("");
    setLastName("");
    setClientPhone("");
    setClientEmail("");
    setErrors({});
    setAttempted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-[500px]">
        <h2 className="text-xl font-bold mb-4">Add New Client</h2>
        {errors.submit && (
          <p className="text-red-500 text-sm mb-4">{errors.submit}</p>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-white">
                First Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600 ${
                  attempted && errors.firstName
                    ? "border-red-500"
                    : "border-zinc-300"
                }`}
                placeholder="First Name"
                required
              />
              {attempted && errors.firstName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-white">
                Last Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600 ${
                  attempted && errors.lastName
                    ? "border-red-500"
                    : "border-zinc-300"
                }`}
                placeholder="Last Name"
                required
              />
              {attempted && errors.lastName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-white">
              Client Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className={`mt-1 block w-full border rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600 ${
                attempted && errors.clientEmail
                  ? "border-red-500"
                  : "border-zinc-300"
              }`}
              placeholder="client@gmail.com"
              required
            />
            {attempted && errors.clientEmail && (
              <p className="text-red-500 text-xs mt-1">
                {errors.clientEmail}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-white">
              Client Phone Number
            </label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                if (formatted.length <= 14) {
                  setClientPhone(formatted);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && clientPhone.length === 1) {
                  setClientPhone("");
                }
              }}
              className="mt-1 block w-full border border-zinc-300 rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
              placeholder="(999) 999-9999"
              maxLength={14}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-red-500 text-white font-bold rounded-md hover:bg-red-700 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-700 transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}