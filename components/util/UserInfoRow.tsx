import { formatPhoneNumber } from "@/app/utils";

interface UserInfoRowProps {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  size?: "sm" | "lg";
}

export default function UserInfoRow({
  firstName,
  lastName,
  phone,
  email,
  size = "sm",
}: UserInfoRowProps) {
  const textClass = size === "lg" ? "text-lg" : "text-sm";
  const nameClass = size === "lg" ? textClass : `${textClass} font-medium`;
  const secondaryClass = size === "lg" ? textClass : `${textClass} text-gray-600 dark:text-white`;

  return (
    <div className="flex flex-col sm:grid sm:grid-cols-3 sm:items-center gap-1 sm:gap-0">
      <span className={`${nameClass} ${size === "lg" ? "text-center sm:text-left" : ""}`}>
        {`${firstName} ${lastName}`}
      </span>
      <span className={`${secondaryClass} ${size === "lg" ? "text-center" : "sm:text-center"}`}>
        {formatPhoneNumber(phone)}
      </span>
      <span className={`${secondaryClass} ${size === "lg" ? "text-center sm:text-right" : "sm:text-right"} break-all`}>
        {email}
      </span>
    </div>
  );
}
