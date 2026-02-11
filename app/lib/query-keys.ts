// query-keys.ts

export const queryKeys = {
  jobs: {
    all: ["jobs"] as const,
    overview: () => [...queryKeys.jobs.all, "overview"] as const,
    list: (status: string) => [...queryKeys.jobs.all, "list", status] as const,
    detail: (id: string | number) =>
      [...queryKeys.jobs.all, "detail", String(id)] as const,
  },
  users: {
    all: ["users"] as const,
    list: () => [...queryKeys.users.all, "list"] as const,
    nonClients: () => [...queryKeys.users.all, "non-clients"] as const,
    clients: () => [...queryKeys.users.all, "clients"] as const,
  },
  calendar: {
    all: ["calendar"] as const,
    jobs: () => [...queryKeys.calendar.all, "jobs"] as const,
    jobDetail: (jobId: number) =>
      [...queryKeys.calendar.all, "jobDetail", jobId] as const,
  },
  templates: {
    all: ["templates"] as const,
    list: () => [...queryKeys.templates.all, "list"] as const,
    detail: (id: string | number) =>
      [...queryKeys.templates.all, "detail", String(id)] as const,
  },
  invite: {
    code: ["invite", "code"] as const,
  },
};
