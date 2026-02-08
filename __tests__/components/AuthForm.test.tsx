// AuthForm.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/app/_components/AuthForm";

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
}));

// Mock next-auth/react
const mockSignIn = vi.fn();
vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

// Mock fetch for registration
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("login form", () => {
    it("renders login form by default", () => {
      render(<AuthForm />);

      expect(
        screen.getByRole("heading", { name: "Login" }),
      ).toBeInTheDocument();
      // Use getAllByLabelText since there are two forms with Email labels
      const emailInputs = screen.getAllByLabelText("Email");
      expect(emailInputs.length).toBeGreaterThan(0);
      const passwordInputs = screen.getAllByLabelText("Password");
      expect(passwordInputs.length).toBeGreaterThan(0);
    });

    it("has forgot password link", () => {
      render(<AuthForm />);
      expect(screen.getByText("Forgot Password?")).toBeInTheDocument();
    });

    it("submits login form with valid credentials", async () => {
      mockSignIn.mockResolvedValueOnce({ ok: true, error: null });

      const user = userEvent.setup();
      render(<AuthForm />);

      // Get the first (login form) email and password inputs
      const emailInputs = screen.getAllByLabelText("Email");
      const passwordInputs = screen.getAllByLabelText("Password");

      await user.type(emailInputs[0], "test@example.com");
      await user.type(passwordInputs[0], "password123");
      await user.click(screen.getAllByRole("button", { name: "Login" })[0]);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "test@example.com",
          password: "password123",
          redirect: false,
        });
      });
    });

    it("redirects to /jobs on successful login", async () => {
      mockSignIn.mockResolvedValueOnce({ ok: true, error: null });

      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInputs = screen.getAllByLabelText("Email");
      const passwordInputs = screen.getAllByLabelText("Password");

      await user.type(emailInputs[0], "test@example.com");
      await user.type(passwordInputs[0], "password123");
      await user.click(screen.getAllByRole("button", { name: "Login" })[0]);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/jobs");
      });
    });

    it("shows email error for invalid account", async () => {
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "No account found with this email",
      });

      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInputs = screen.getAllByLabelText("Email");
      const passwordInputs = screen.getAllByLabelText("Password");

      await user.type(emailInputs[0], "wrong@example.com");
      await user.type(passwordInputs[0], "password123");
      await user.click(screen.getAllByRole("button", { name: "Login" })[0]);

      await waitFor(() => {
        // Use getAllByText since error may appear in both forms
        const errorMessages = screen.getAllByText(
          "No account found with this email",
        );
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("shows generic error when login throws a network error", async () => {
      mockSignIn.mockRejectedValueOnce(new Error("Network failure"));

      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInputs = screen.getAllByLabelText("Email");
      const passwordInputs = screen.getAllByLabelText("Password");

      await user.type(emailInputs[0], "test@example.com");
      await user.type(passwordInputs[0], "password123");
      await user.click(screen.getAllByRole("button", { name: "Login" })[0]);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred during login"),
        ).toBeInTheDocument();
      });
    });

    it("shows password error for incorrect password", async () => {
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "Incorrect password",
      });

      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInputs = screen.getAllByLabelText("Email");
      const passwordInputs = screen.getAllByLabelText("Password");

      await user.type(emailInputs[0], "test@example.com");
      await user.type(passwordInputs[0], "wrongpassword");
      await user.click(screen.getAllByRole("button", { name: "Login" })[0]);

      await waitFor(() => {
        expect(screen.getByText("Incorrect password")).toBeInTheDocument();
      });
    });

    it("toggles password visibility", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      const passwordInputs = screen.getAllByLabelText("Password");
      const passwordInput = passwordInputs[0];
      expect(passwordInput).toHaveAttribute("type", "password");

      // Find the toggle button in the login form (first form section)
      const allButtons = screen.getAllByRole("button");
      // The visibility toggle buttons have SVG children
      const toggleButton = allButtons.find(
        (btn) =>
          btn.querySelector("svg") && btn.getAttribute("type") === "button",
      );

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "text");

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "password");
      }
    });
  });

  describe("registration form", () => {
    it("switches to registration form when Register button is clicked", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      // Click the toggle button at the bottom to switch to registration
      const buttons = screen.getAllByRole("button", { name: "Register" });
      // The last Register button is the toggle
      await user.click(buttons[buttons.length - 1]);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Register" }),
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Phone Number")).toBeInTheDocument();
      expect(screen.getByLabelText("Invite Code")).toBeInTheDocument();
    });

    it("validates password match on registration", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      // Switch to registration
      const toggleButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(toggleButtons[toggleButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      });

      // Fill in the form with mismatched passwords
      await user.type(screen.getByLabelText("First Name"), "John");
      await user.type(screen.getByLabelText("Last Name"), "Doe");
      // Get email inputs and use the visible one (signup email) - index 1 when in register mode
      const emailInputs = screen.getAllByLabelText("Email");
      await user.type(emailInputs[1], "john@example.com");
      await user.type(screen.getByLabelText("Phone Number"), "5551234567");
      // Get all password inputs and use the signup ones
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(passwordInputs[1], "password123"); // Second password input is in register form
      await user.type(
        screen.getByLabelText("Retype Password"),
        "differentpassword",
      );
      await user.type(screen.getByLabelText("Invite Code"), "INVITE123");

      // Submit the form - first Register button is the submit
      const submitButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });
    });

    it("validates email format on registration", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      // Switch to registration
      const toggleButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(toggleButtons[toggleButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      });

      // Fill in with invalid email - isEmailValid checks for @ and . in specific pattern
      // 'test@' will fail isEmailValid but pass browser's basic validation
      await user.type(screen.getByLabelText("First Name"), "John");
      await user.type(screen.getByLabelText("Last Name"), "Doe");
      const emailInputs = screen.getAllByLabelText("Email");
      // Type an email that looks valid to browser but fails our regex (missing TLD)
      await user.type(emailInputs[1], "test@domain");
      await user.type(screen.getByLabelText("Phone Number"), "5551234567");
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(passwordInputs[1], "password123");
      await user.type(screen.getByLabelText("Retype Password"), "password123");
      await user.type(screen.getByLabelText("Invite Code"), "TESTCODE");

      const submitButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid email address"),
        ).toBeInTheDocument();
      });
    });

    it("submits registration and signs in on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "User created" }),
      });
      mockSignIn.mockResolvedValueOnce({ ok: true, error: null });

      const user = userEvent.setup();
      render(<AuthForm />);

      // Switch to registration
      const toggleButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(toggleButtons[toggleButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText("First Name"), "John");
      await user.type(screen.getByLabelText("Last Name"), "Doe");
      const emailInputs = screen.getAllByLabelText("Email");
      await user.type(emailInputs[1], "john@example.com");
      await user.type(screen.getByLabelText("Phone Number"), "5551234567");
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(passwordInputs[1], "password123");
      await user.type(screen.getByLabelText("Retype Password"), "password123");
      await user.type(screen.getByLabelText("Invite Code"), "INVITE123");

      const submitButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/register",
          expect.any(Object),
        );
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });

    it("shows email error when registration returns 400", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Email already exists" }),
      });

      const user = userEvent.setup();
      render(<AuthForm />);

      const toggleButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(toggleButtons[toggleButtons.length - 1]);
      await waitFor(() => {
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText("First Name"), "John");
      await user.type(screen.getByLabelText("Last Name"), "Doe");
      const emailInputs = screen.getAllByLabelText("Email");
      await user.type(emailInputs[1], "john@example.com");
      await user.type(screen.getByLabelText("Phone Number"), "5551234567");
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(passwordInputs[1], "password123");
      await user.type(screen.getByLabelText("Retype Password"), "password123");
      await user.type(screen.getByLabelText("Invite Code"), "INVITE123");

      const submitButtons = screen.getAllByRole("button", { name: "Register" });
      expect(submitButtons[0]).not.toBeDisabled();
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      await waitFor(() => {
        const errorMessages = screen.getAllByText("Email already exists");
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("shows generic error when registration returns non-400 failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server error" }),
      });

      const user = userEvent.setup();
      render(<AuthForm />);

      const toggleButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(toggleButtons[toggleButtons.length - 1]);
      await waitFor(() => {
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText("First Name"), "John");
      await user.type(screen.getByLabelText("Last Name"), "Doe");
      const emailInputs = screen.getAllByLabelText("Email");
      await user.type(emailInputs[1], "john@example.com");
      await user.type(screen.getByLabelText("Phone Number"), "5551234567");
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(passwordInputs[1], "password123");
      await user.type(screen.getByLabelText("Retype Password"), "password123");
      await user.type(screen.getByLabelText("Invite Code"), "INVITE123");

      const submitButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Server error")).toBeInTheDocument();
      });
    });

    it("shows error when registration succeeds but auto-login fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "User created" }),
      });
      mockSignIn.mockResolvedValueOnce({ ok: false, error: "Auth failed" });

      const user = userEvent.setup();
      render(<AuthForm />);

      const toggleButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(toggleButtons[toggleButtons.length - 1]);
      await waitFor(() => {
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText("First Name"), "John");
      await user.type(screen.getByLabelText("Last Name"), "Doe");
      const emailInputs = screen.getAllByLabelText("Email");
      await user.type(emailInputs[1], "john@example.com");
      await user.type(screen.getByLabelText("Phone Number"), "5551234567");
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(passwordInputs[1], "password123");
      await user.type(screen.getByLabelText("Retype Password"), "password123");
      await user.type(screen.getByLabelText("Invite Code"), "INVITE123");

      const submitButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Auth failed")).toBeInTheDocument();
      });
    });

    it("shows generic error on registration network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const user = userEvent.setup();
      render(<AuthForm />);

      const toggleButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(toggleButtons[toggleButtons.length - 1]);
      await waitFor(() => {
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText("First Name"), "John");
      await user.type(screen.getByLabelText("Last Name"), "Doe");
      const emailInputs = screen.getAllByLabelText("Email");
      await user.type(emailInputs[1], "john@example.com");
      await user.type(screen.getByLabelText("Phone Number"), "5551234567");
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(passwordInputs[1], "password123");
      await user.type(screen.getByLabelText("Retype Password"), "password123");
      await user.type(screen.getByLabelText("Invite Code"), "INVITE123");

      const submitButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(submitButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred during registration"),
        ).toBeInTheDocument();
      });
    });

    it("disables register button when fields are empty", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      // Toggle to register form so isLogin is false
      const toggleButtons = screen.getAllByRole("button", { name: "Register" });
      await user.click(toggleButtons[toggleButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
      });

      // The register submit button should be disabled because fields are empty
      const submitButtons = screen.getAllByRole("button", { name: "Register" });
      expect(submitButtons[0]).toBeDisabled();
    });
  });

  describe("form toggle", () => {
    it("toggles between login and register forms", async () => {
      const user = userEvent.setup();
      render(<AuthForm />);

      // Initial state is login
      expect(
        screen.getByRole("heading", { name: "Login" }),
      ).toBeInTheDocument();

      // Toggle to register (last button with name Register)
      const registerButtons = screen.getAllByRole("button", {
        name: "Register",
      });
      await user.click(registerButtons[registerButtons.length - 1]);
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Register" }),
        ).toBeInTheDocument();
      });

      // Toggle back to login - now there should be a Login button visible
      const loginButtons = screen.getAllByRole("button", { name: "Login" });
      await user.click(loginButtons[loginButtons.length - 1]);
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Login" }),
        ).toBeInTheDocument();
      });
    });

    it("clears errors when toggling forms", async () => {
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "Some error",
      });

      const user = userEvent.setup();
      render(<AuthForm />);

      // Trigger an error
      const emailInputs = screen.getAllByLabelText("Email");
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(emailInputs[0], "test@example.com");
      await user.type(passwordInputs[0], "password");
      await user.click(screen.getAllByRole("button", { name: "Login" })[0]);

      await waitFor(() => {
        expect(screen.getByText("Some error")).toBeInTheDocument();
      });

      // Toggle to register - error should be cleared
      const registerButtons = screen.getAllByRole("button", {
        name: "Register",
      });
      await user.click(registerButtons[registerButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText("Some error")).not.toBeInTheDocument();
      });
    });
  });

  describe("loading state", () => {
    it("shows loading state during login submission", async () => {
      // Create a promise that doesn't resolve immediately
      let resolveSignIn: (value: unknown) => void;
      mockSignIn.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
      );

      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInputs = screen.getAllByLabelText("Email");
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(emailInputs[0], "test@example.com");
      await user.type(passwordInputs[0], "password123");
      await user.click(screen.getAllByRole("button", { name: "Login" })[0]);

      await waitFor(() => {
        // Loading text appears in the button
        const loadingElements = screen.getAllByText("Loading...");
        expect(loadingElements.length).toBeGreaterThan(0);
      });

      // Resolve the promise and wait for the resulting state update
      await waitFor(() => {
        resolveSignIn!({ ok: true, error: null });
      });
    });

    it("disables inputs during loading", async () => {
      let resolveSignIn: (value: unknown) => void;
      mockSignIn.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
      );

      const user = userEvent.setup();
      render(<AuthForm />);

      const emailInputs = screen.getAllByLabelText("Email");
      const passwordInputs = screen.getAllByLabelText("Password");
      await user.type(emailInputs[0], "test@example.com");
      await user.type(passwordInputs[0], "password123");
      await user.click(screen.getAllByRole("button", { name: "Login" })[0]);

      await waitFor(() => {
        expect(emailInputs[0]).toBeDisabled();
        expect(passwordInputs[0]).toBeDisabled();
      });

      // Resolve the promise and wait for the resulting state update
      await waitFor(() => {
        resolveSignIn!({ ok: true, error: null });
      });
    });
  });
});
