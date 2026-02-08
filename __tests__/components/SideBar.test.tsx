// SideBar.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SideBar from "@/components/SideBar";

// Mock useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock useSession with different user types
const mockUseSession = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

describe("SideBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("navigation links", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "User", type: "User" } },
        status: "authenticated",
      });
    });

    it("renders jobs link", () => {
      render(<SideBar />);
      const jobsLinks = screen.getAllByRole("link", { name: "" });
      const jobsLink = jobsLinks.find(
        (link) => link.getAttribute("href") === "/jobs",
      );
      expect(jobsLink).toBeDefined();
    });

    it("renders calendar link", () => {
      render(<SideBar />);
      const links = screen.getAllByRole("link");
      const calendarLink = links.find(
        (link) => link.getAttribute("href") === "/calendar",
      );
      expect(calendarLink).toBeDefined();
    });

    it("renders contacts link", () => {
      render(<SideBar />);
      const links = screen.getAllByRole("link");
      const contactsLink = links.find(
        (link) => link.getAttribute("href") === "/contacts",
      );
      expect(contactsLink).toBeDefined();
    });

    it("renders settings button", () => {
      render(<SideBar />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("settings navigation", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "User", type: "User" } },
        status: "authenticated",
      });
    });

    it("navigates to settings on button click", async () => {
      const user = userEvent.setup();
      render(<SideBar />);

      const settingsButtons = screen.getAllByRole("button");
      // Click the first settings button (desktop version)
      await user.click(settingsButtons[0]);

      expect(mockPush).toHaveBeenCalledWith("/settings");
    });
  });

  describe("role-based access", () => {
    it("shows create job link for Owner users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "Owner User", type: "Owner" } },
        status: "authenticated",
      });

      render(<SideBar />);
      const links = screen.getAllByRole("link");
      const newJobLink = links.find(
        (link) => link.getAttribute("href") === "/jobs/new",
      );
      expect(newJobLink).toBeDefined();
    });

    it("shows create job link for Admin users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "Admin User", type: "Admin" } },
        status: "authenticated",
      });

      render(<SideBar />);
      const links = screen.getAllByRole("link");
      const newJobLink = links.find(
        (link) => link.getAttribute("href") === "/jobs/new",
      );
      expect(newJobLink).toBeDefined();
    });

    it("hides create job link for regular users", () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "Regular User", type: "User" } },
        status: "authenticated",
      });

      render(<SideBar />);
      const links = screen.getAllByRole("link");
      const newJobLink = links.find(
        (link) => link.getAttribute("href") === "/jobs/new",
      );
      expect(newJobLink).toBeUndefined();
    });

    it("hides create job link when session has no user", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      render(<SideBar />);
      const links = screen.getAllByRole("link");
      const newJobLink = links.find(
        (link) => link.getAttribute("href") === "/jobs/new",
      );
      expect(newJobLink).toBeUndefined();
    });
  });

  describe("responsive layout", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "User", type: "Admin" } },
        status: "authenticated",
      });
    });

    it("renders both desktop sidebar and mobile bottom bar", () => {
      render(<SideBar />);
      const navElements = screen.getAllByRole("navigation");
      // Should have 2 nav elements - desktop sidebar and mobile bottom bar
      expect(navElements).toHaveLength(2);
    });

    it("mobile settings button navigates to /settings", async () => {
      const user = userEvent.setup();
      render(<SideBar />);

      const settingsButtons = screen.getAllByRole("button");
      // Click the second settings button (mobile version)
      await user.click(settingsButtons[1]);

      expect(mockPush).toHaveBeenCalledWith("/settings");
    });
  });

  describe("hover behavior", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "User", type: "User" } },
        status: "authenticated",
      });
    });

    it("expands labels on hover and collapses on mouse leave", () => {
      render(<SideBar />);
      const desktopNav = screen.getAllByRole("navigation")[0];

      // Before hover, labels should have opacity-0
      const labelsBefore = desktopNav.querySelectorAll("span");
      labelsBefore.forEach((label) => {
        expect(label.className).toContain("opacity-0");
      });

      // Hover to expand
      fireEvent.mouseEnter(desktopNav);
      const labelsAfterEnter = desktopNav.querySelectorAll("span");
      labelsAfterEnter.forEach((label) => {
        expect(label.className).toContain("opacity-100");
      });

      // Leave to collapse
      fireEvent.mouseLeave(desktopNav);
      const labelsAfterLeave = desktopNav.querySelectorAll("span");
      labelsAfterLeave.forEach((label) => {
        expect(label.className).toContain("opacity-0");
      });
    });
  });
});
