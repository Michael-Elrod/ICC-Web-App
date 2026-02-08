// handlers.ts

import { http, HttpResponse } from "msw";

// Sample mock data
export const mockJobs = [
  {
    id: 1,
    job_name: "Test Job 1",
    job_status: "Active",
    job_startdate: "2024-01-15",
    job_client: "Test Client",
  },
  {
    id: 2,
    job_name: "Test Job 2",
    job_status: "Pending",
    job_startdate: "2024-02-01",
    job_client: "Another Client",
  },
];

export const mockUsers = [
  {
    id: 1,
    user_name: "Test User",
    user_email: "test@example.com",
    user_role: "Admin",
  },
  {
    id: 2,
    user_name: "Regular User",
    user_email: "user@example.com",
    user_role: "User",
  },
];

export const mockTasks = [
  {
    task_id: 1,
    task_name: "Test Task 1",
    task_status: "Pending",
    task_startdate: "2024-01-15",
    task_duration: 5,
  },
];

export const mockMaterials = [
  {
    material_id: 1,
    material_name: "Test Material",
    material_status: "Ordered",
    material_duedate: "2024-01-20",
  },
];

// MSW handlers for API mocking
export const handlers = [
  // Jobs API
  http.get("/api/jobs", () => {
    return HttpResponse.json(mockJobs);
  }),

  http.get("/api/jobs/:id", ({ params }) => {
    const job = mockJobs.find((j) => j.id === Number(params.id));
    if (job) {
      return HttpResponse.json(job);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.post("/api/jobs", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),

  // Users API
  http.get("/api/users", () => {
    return HttpResponse.json(mockUsers);
  }),

  http.get("/api/users/:id", ({ params }) => {
    const user = mockUsers.find((u) => u.id === Number(params.id));
    if (user) {
      return HttpResponse.json(user);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Tasks API
  http.get("/api/tasks", () => {
    return HttpResponse.json(mockTasks);
  }),

  http.patch("/api/tasks/:id", async ({ params, request }) => {
    const body = await request.json();
    const task = mockTasks.find((t) => t.task_id === Number(params.id));
    if (task) {
      return HttpResponse.json({ ...task, ...body });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Materials API
  http.get("/api/materials", () => {
    return HttpResponse.json(mockMaterials);
  }),

  // Auth API
  http.get("/api/auth/session", () => {
    return HttpResponse.json({
      user: {
        id: "1",
        name: "Test User",
        email: "test@example.com",
        role: "Admin",
      },
      expires: "2099-01-01",
    });
  }),
];
