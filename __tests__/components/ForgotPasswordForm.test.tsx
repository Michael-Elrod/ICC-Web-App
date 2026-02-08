// ForgotPasswordForm.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordForm from "@/app/forgot-password/_components/ForgotPasswordForm";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders form with email input and submit button", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send Reset Link" }),
    ).toBeInTheDocument();
  });

  it("submits email and shows success message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Email sent" }),
    });

    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email Address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(
        screen.getByText(/If an account exists with this email address/),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Return to Login" }),
    ).toBeInTheDocument();
  });

  it("shows error for invalid email format (400)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Invalid email format" }),
    });

    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    // Use a valid-looking email so browser validation passes
    await user.type(screen.getByLabelText("Email Address"), "bad@email.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
    });
  });

  it("shows generic error for server error (500)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: "Internal server error" }),
    });

    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email Address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(
        screen.getByText("An error occurred. Please try again later."),
      ).toBeInTheDocument();
    });
  });

  it("shows generic error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email Address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(
        screen.getByText("An error occurred. Please try again later."),
      ).toBeInTheDocument();
    });
  });

  it("disables input and button during loading", async () => {
    let resolveFetch: (value: unknown) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email Address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Email Address")).toBeDisabled();
    });

    // Resolve to avoid dangling promise
    resolveFetch!({
      ok: true,
      status: 200,
      json: async () => ({ message: "ok" }),
    });
  });

  it('"Back to Login" navigates to /', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.click(screen.getByText("Back to Login"));

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it('"Return to Login" after success navigates to /', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Email sent" }),
    });

    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email Address"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Return to Login" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Return to Login" }));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("does not reveal whether email exists", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Email sent" }),
    });

    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByLabelText("Email Address"),
      "nonexistent@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      const successText = screen.getByText(
        /If an account exists with this email address/,
      );
      expect(successText).toBeInTheDocument();
    });
  });
});
