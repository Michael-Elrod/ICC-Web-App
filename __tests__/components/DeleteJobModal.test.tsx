// DeleteJobModal.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteJobModal from "@/app/jobs/[id]/_components/DeleteJobModal";

describe("DeleteJobModal", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <DeleteJobModal isOpen={false} onClose={vi.fn()} onDeleteJob={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders modal content when open", () => {
    render(
      <DeleteJobModal isOpen={true} onClose={vi.fn()} onDeleteJob={vi.fn()} />,
    );
    expect(
      screen.getByRole("heading", { name: "Delete Job" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to permanently delete/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Job" }),
    ).toBeInTheDocument();
  });

  it("calls onClose when Cancel clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteJobModal isOpen={true} onClose={onClose} onDeleteJob={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onDeleteJob when Delete clicked", async () => {
    const onDeleteJob = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteJobModal
        isOpen={true}
        onClose={vi.fn()}
        onDeleteJob={onDeleteJob}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete Job" }));
    expect(onDeleteJob).toHaveBeenCalledOnce();
  });

  it("does not call onDeleteJob when Cancel clicked", async () => {
    const onDeleteJob = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteJobModal
        isOpen={true}
        onClose={vi.fn()}
        onDeleteJob={onDeleteJob}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDeleteJob).not.toHaveBeenCalled();
  });
});
