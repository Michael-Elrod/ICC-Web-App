// use-users.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-fetch";
import { queryKeys } from "@/app/lib/query-keys";
import { User } from "@/app/types/database";
import { UserView } from "@/app/types/views";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () => apiFetch<User[]>("/api/users"),
    refetchInterval: 5_000,
  });
}

export function useNonClients() {
  return useQuery({
    queryKey: queryKeys.users.nonClients(),
    queryFn: () => apiFetch<UserView[]>("/api/users/non-clients"),
    staleTime: 60_000,
  });
}

export function useClients() {
  return useQuery({
    queryKey: queryKeys.users.clients(),
    queryFn: () => apiFetch<User[]>("/api/users/clients"),
    staleTime: 60_000,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number;
      data: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        userType: string;
      };
    }) =>
      apiFetch<User>(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      apiFetch<void>(`/api/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }) =>
      apiFetch<any>("/api/users/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.clients() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
