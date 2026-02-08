// CopyJobModal.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CopyJobModal from "@/app/jobs/[id]/_components/CopyJobModal";

// Mock react-datepicker
vi.mock("react-datepicker", () => ({
  default: ({ onChange, placeholderText, selected }: any) => (
    <input
      data-testid="datepicker"
      placeholder={placeholderText}
      value={selected ? selected.toISOString().split("T")[0] : ""}
      onChange={(e) => {
        if (e.target.value) {
          onChange(new Date(e.target.value));
        }
      }}
    />
  ),
}));

// Mock CSS import
vi.mock("react-datepicker/dist/react-datepicker.css", () => ({}));

describe("CopyJobModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <CopyJobModal isOpen={false} onClose={vi.fn()} jobName="Test Job" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows confirm step with job name", () => {
    render(
      <CopyJobModal
        isOpen={true}
        onClose={vi.fn()}
        jobName="Kitchen Remodel"
      />,
    );
    expect(screen.getByText(/Kitchen Remodel/)).toBeInTheDocument();
  });

  it("Cancel on confirm step closes modal", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CopyJobModal isOpen={true} onClose={onClose} jobName="Test Job" />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Continue advances to date selection step", async () => {
    const user = userEvent.setup();
    render(<CopyJobModal isOpen={true} onClose={vi.fn()} jobName="Test Job" />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByPlaceholderText("Choose Start Date"),
    ).toBeInTheDocument();
  });

  it("all copy options default to checked", async () => {
    const user = userEvent.setup();
    render(<CopyJobModal isOpen={true} onClose={vi.fn()} jobName="Test Job" />);

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText(/Worker Assignments/)).toBeChecked();
    expect(screen.getByLabelText(/Floor Plans/)).toBeChecked();
    expect(screen.getByLabelText(/Notes/)).toBeChecked();
  });

  it("toggling checkbox updates copy options", async () => {
    const user = userEvent.setup();
    render(<CopyJobModal isOpen={true} onClose={vi.fn()} jobName="Test Job" />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText(/Worker Assignments/));

    expect(screen.getByLabelText(/Worker Assignments/)).not.toBeChecked();
  });

  it('"Copy Job" button disabled until date selected', async () => {
    const user = userEvent.setup();
    render(<CopyJobModal isOpen={true} onClose={vi.fn()} jobName="Test Job" />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("button", { name: "Copy Job" })).toBeDisabled();
  });

  it("clicking backdrop closes and resets", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CopyJobModal isOpen={true} onClose={onClose} jobName="Test Job" />);

    const overlay = screen
      .getByText(/Are you sure you want to copy this job/)
      .closest(".fixed")!;
    await user.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });

  it("Cancel on date step closes and resets", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CopyJobModal isOpen={true} onClose={onClose} jobName="Test Job" />);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
