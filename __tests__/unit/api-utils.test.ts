// api-utils.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// Mock pool
const mockRelease = vi.fn();
const mockExecute = vi.fn();
const mockBeginTransaction = vi.fn();
const mockCommit = vi.fn();
const mockRollback = vi.fn();
const mockConnection = {
  release: mockRelease,
  execute: mockExecute,
  beginTransaction: mockBeginTransaction,
  commit: mockCommit,
  rollback: mockRollback,
};

vi.mock("@/app/lib/db", () => ({
  default: {
    getConnection: vi.fn(() => Promise.resolve(mockConnection)),
  },
}));

// Mock getServerSession
const mockGetServerSession = vi.fn();
vi.mock("next-auth/next", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

// Mock authOptions
vi.mock("@/app/lib/auth", () => ({
  authOptions: {},
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  hash: vi.fn(() => Promise.resolve("hashed-password")),
}));

import {
  withDb,
  withAuth,
  withRole,
  withTransaction,
  generateRandomPasswordHash,
  checkEmailExists,
} from "@/app/lib/api-utils";

describe("withDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides connection and releases it after success", async () => {
    const handler = vi.fn(async (connection) => {
      expect(connection).toBe(mockConnection);
      return NextResponse.json({ ok: true });
    });

    const wrappedHandler = withDb(handler);
    await wrappedHandler(new Request("http://localhost"));

    expect(handler).toHaveBeenCalledOnce();
    expect(mockRelease).toHaveBeenCalledOnce();
  });

  it("releases connection on handler error and returns 500", async () => {
    const handler = vi.fn(async () => {
      throw new Error("Handler failed");
    });

    const wrappedHandler = withDb(handler);
    const response = await wrappedHandler(new Request("http://localhost"));

    expect(response.status).toBe(500);
    expect(mockRelease).toHaveBeenCalledOnce();
  });

  it("returns the handler response", async () => {
    const expectedResponse = NextResponse.json(
      { data: "test" },
      { status: 200 },
    );
    const handler = vi.fn(async () => expectedResponse);

    const wrappedHandler = withDb(handler);
    const response = await wrappedHandler(new Request("http://localhost"));

    expect(response).toBe(expectedResponse);
  });
});

describe("withAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const handler = vi.fn();
    const wrappedHandler = withAuth(handler);
    const response = await wrappedHandler(new Request("http://localhost"));

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 when session has no user id", async () => {
    mockGetServerSession.mockResolvedValueOnce({ user: {} });

    const handler = vi.fn();
    const wrappedHandler = withAuth(handler);
    const response = await wrappedHandler(new Request("http://localhost"));

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes session and connection to handler", async () => {
    const session = { user: { id: "1", type: "Owner" } };
    mockGetServerSession.mockResolvedValueOnce(session);

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const wrappedHandler = withAuth(handler);
    await wrappedHandler(new Request("http://localhost"));

    expect(handler).toHaveBeenCalledWith(
      mockConnection,
      session,
      expect.any(Request),
      expect.anything(),
    );
  });
});

describe("withRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows matching role", async () => {
    const session = { user: { id: "1", type: "Owner" } };
    mockGetServerSession.mockResolvedValueOnce(session);

    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const wrappedHandler = withRole(["Owner", "Admin"], handler);
    const response = await wrappedHandler(new Request("http://localhost"));

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it("returns 403 for non-matching role", async () => {
    const session = { user: { id: "1", type: "User" } };
    mockGetServerSession.mockResolvedValueOnce(session);

    const handler = vi.fn();
    const wrappedHandler = withRole(["Owner"], handler);
    const response = await wrappedHandler(new Request("http://localhost"));

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("checks role from session, not from request", async () => {
    const session = { user: { id: "1", type: "Admin" } };
    mockGetServerSession.mockResolvedValueOnce(session);

    const handler = vi.fn(async (_conn, sess) => {
      expect(sess.user.type).toBe("Admin");
      return NextResponse.json({ ok: true });
    });
    const wrappedHandler = withRole(["Admin"], handler);
    await wrappedHandler(new Request("http://localhost"));

    expect(handler).toHaveBeenCalled();
  });
});

describe("withTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("commits on success", async () => {
    const result = await withTransaction(
      mockConnection as any,
      async () => "result",
    );
    expect(result).toBe("result");
    expect(mockBeginTransaction).toHaveBeenCalledOnce();
    expect(mockCommit).toHaveBeenCalledOnce();
    expect(mockRollback).not.toHaveBeenCalled();
  });

  it("rolls back on error", async () => {
    await expect(
      withTransaction(mockConnection as any, async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow("fail");

    expect(mockBeginTransaction).toHaveBeenCalledOnce();
    expect(mockRollback).toHaveBeenCalledOnce();
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it("does not commit after rollback", async () => {
    try {
      await withTransaction(mockConnection as any, async () => {
        throw new Error("fail");
      });
    } catch {
      // expected
    }

    expect(mockCommit).not.toHaveBeenCalled();
    expect(mockRollback).toHaveBeenCalledOnce();
  });
});

describe("generateRandomPasswordHash", () => {
  it("returns a string", async () => {
    const result = await generateRandomPasswordHash();
    expect(typeof result).toBe("string");
  });

  it("returns consistent mock hash", async () => {
    const result = await generateRandomPasswordHash();
    expect(result).toBe("hashed-password");
  });
});

describe("checkEmailExists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when email exists", async () => {
    mockExecute.mockResolvedValueOnce([[{ user_id: 1 }]]);
    const result = await checkEmailExists(
      mockConnection as any,
      "test@example.com",
    );
    expect(result).toBe(true);
  });

  it("returns false when email not found", async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const result = await checkEmailExists(
      mockConnection as any,
      "unknown@example.com",
    );
    expect(result).toBe(false);
  });

  it("excludes specified userId from check", async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    await checkEmailExists(mockConnection as any, "test@example.com", "5");
    expect(mockExecute).toHaveBeenCalledWith(
      "SELECT user_id FROM app_user WHERE user_email = ? AND user_id != ?",
      ["test@example.com", "5"],
    );
  });

  it("uses simple query when no excludeUserId", async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    await checkEmailExists(mockConnection as any, "test@example.com");
    expect(mockExecute).toHaveBeenCalledWith(
      "SELECT user_id FROM app_user WHERE user_email = ?",
      ["test@example.com"],
    );
  });
});
