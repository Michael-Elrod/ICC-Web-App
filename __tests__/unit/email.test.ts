// email.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-ses", () => ({
  SESClient: class MockSESClient {
    send = mockSend;
  },
  SendEmailCommand: class MockSendEmailCommand {
    constructor(public params: any) {}
  },
}));

import { sendPasswordResetEmail, sendInvitationEmail } from "@/app/lib/email";

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    mockSend.mockReset();
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    process.env.SES_FROM_EMAIL = "noreply@example.com";
  });

  it("sends email with correct recipient", async () => {
    mockSend.mockResolvedValueOnce({});
    await sendPasswordResetEmail("user@test.com", "token123");

    expect(mockSend).toHaveBeenCalledOnce();
    const sentCommand = mockSend.mock.calls[0][0].params;
    expect(sentCommand.Destination.ToAddresses).toEqual(["user@test.com"]);
  });

  it("includes reset link with token in body", async () => {
    mockSend.mockResolvedValueOnce({});
    await sendPasswordResetEmail("user@test.com", "abc123");

    const sentCommand = mockSend.mock.calls[0][0].params;
    expect(sentCommand.Message.Body.Html.Data).toContain(
      "/reset-password?token=abc123",
    );
  });

  it("uses configured FROM email", async () => {
    mockSend.mockResolvedValueOnce({});
    await sendPasswordResetEmail("user@test.com", "token");

    const sentCommand = mockSend.mock.calls[0][0].params;
    expect(sentCommand.Source).toBe("noreply@example.com");
  });

  it("propagates SES errors", async () => {
    mockSend.mockRejectedValueOnce(new Error("SES failure"));
    await expect(
      sendPasswordResetEmail("user@test.com", "token"),
    ).rejects.toThrow("SES failure");
  });
});

describe("sendInvitationEmail", () => {
  beforeEach(() => {
    mockSend.mockReset();
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    process.env.SES_FROM_EMAIL = "noreply@example.com";
  });

  it("sends email with correct recipient", async () => {
    mockSend.mockResolvedValueOnce({});
    await sendInvitationEmail("new@test.com", "INVITE123", "John");

    expect(mockSend).toHaveBeenCalledOnce();
    const sentCommand = mockSend.mock.calls[0][0].params;
    expect(sentCommand.Destination.ToAddresses).toEqual(["new@test.com"]);
  });

  it("includes invite code in body", async () => {
    mockSend.mockResolvedValueOnce({});
    await sendInvitationEmail("new@test.com", "INVITE123", "John");

    const sentCommand = mockSend.mock.calls[0][0].params;
    expect(sentCommand.Message.Body.Html.Data).toContain("INVITE123");
  });

  it("includes sender name in body", async () => {
    mockSend.mockResolvedValueOnce({});
    await sendInvitationEmail("new@test.com", "CODE", "John");

    const sentCommand = mockSend.mock.calls[0][0].params;
    expect(sentCommand.Message.Body.Html.Data).toContain(
      "John has invited you",
    );
  });

  it("returns success on success", async () => {
    mockSend.mockResolvedValueOnce({});
    const result = await sendInvitationEmail("new@test.com", "CODE", "John");
    expect(result).toEqual({ success: true });
  });

  it("propagates SES errors", async () => {
    mockSend.mockRejectedValueOnce(new Error("SES failure"));
    await expect(
      sendInvitationEmail("new@test.com", "CODE", "John"),
    ).rejects.toThrow("SES failure");
  });
});
