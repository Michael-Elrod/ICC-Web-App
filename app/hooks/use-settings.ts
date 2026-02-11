// use-settings.ts

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-fetch";

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (data: {
      firstName: FormDataEntryValue | null;
      lastName: FormDataEntryValue | null;
      phone: FormDataEntryValue | null;
      email: FormDataEntryValue | null;
      notificationPref: FormDataEntryValue | null;
    }) =>
      apiFetch<any>("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiFetch<any>("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}
