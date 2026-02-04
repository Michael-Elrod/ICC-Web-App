import { useState, useEffect } from "react";
import { User, UserType } from "@/app/types/database";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentUserId?: string;
  onUserUpdated: (updatedUser: User) => void;
  onUserDeleted?: () => void;
}

export default function EditUserModal({
  isOpen,
  onClose,
  user,
  currentUserId,
  onUserUpdated,
  onUserDeleted,
}: EditUserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType>("Client");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const canDelete = user && user.user_id.toString() !== currentUserId;

  useEffect(() => {
    if (user) {
      setFirstName(user.user_first_name);
      setLastName(user.user_last_name);
      setPhone(user.user_phone || "");
      setEmail(user.user_email);
      setUserType(user.user_type);
    }
  }, [user]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    return errors;
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    if (numbers.length <= 3) return `(${numbers}`;
    if (numbers.length <= 6)
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(
      6,
      10
    )}`;
  };

  const handleDelete = async () => {
    if (!canDelete) {
      setErrors({
        submit: "You cannot delete your own account",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user?.user_id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      onClose();
      onUserDeleted?.();
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error ? error.message : "Failed to delete user",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0 && user) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/${user.user_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phone: phone.replace(/\D/g, ""),
            userType,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update user");
        }

        const updatedUser = await response.json();
        onUserUpdated(updatedUser);
        handleClose();
      } catch (error) {
        setErrors({
          submit:
            error instanceof Error ? error.message : "Failed to update user",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-[500px] relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit User</h2>
          {user?.user_id?.toString() !== currentUserId && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-md hover:bg-red-700 transition-colors"
              disabled={isLoading}
            >
              Delete Contact
            </button>
          )}
        </div>

        {errors.submit && (
          <p className="text-red-500 text-sm mb-4">{errors.submit}</p>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-white">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600 ${
                  errors.firstName ? "border-red-500" : "border-zinc-300"
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-white">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600 ${
                  errors.lastName ? "border-red-500" : "border-zinc-300"
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-white">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full border rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600 ${
                errors.email ? "border-red-500" : "border-zinc-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-white">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                if (formatted.length <= 14) setPhone(formatted);
              }}
              className="mt-1 block w-full border border-zinc-300 rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
              placeholder="(999) 999-9999"
              maxLength={14}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-white">
              User Type
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
              className="mt-1 block w-full border border-zinc-300 rounded-md shadow-sm p-2 dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
            >
              <option value="Client">Client</option>
              <option value="User">User</option>
              <option value="Admin">Admin</option>
              <option value="Owner">Owner</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-zinc-500 text-white font-bold rounded-md hover:bg-zinc-700 transition-colors"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-[400px] shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
              <p className="mb-6">
                Are you sure you want to delete {user?.user_first_name}{" "}
                {user?.user_last_name}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-zinc-500 text-white font-bold rounded-md hover:bg-zinc-700 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white font-bold rounded-md hover:bg-red-700 transition-colors flex items-center"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
