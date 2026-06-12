import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { editMemory } from "./api";
import { MemoryDetail } from "./components/MemoryDetail";
import type { AgentConfig, MemoryRecord } from "./types";

vi.mock("./api", () => ({
  deleteMemory: vi.fn(),
  editMemory: vi.fn(async () => ({ memory: {} })),
  reviewMemory: vi.fn()
}));

const agent: AgentConfig = {
  id: "sam",
  name: "Sam",
  workspaceId: "agent-sam",
  family: "Hermes",
  provider: "hermes-0brain-memory",
  expected: true
};

const memory: MemoryRecord = {
  memory_id: "memory-123",
  summary: "Old summary",
  content: "Old content",
  metadata: {},
  scope: { workspace_id: "agent-sam" }
};

describe("MemoryDetail actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires exact memory id before saving edits", async () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("wrong-id");
    const onChanged = vi.fn();

    render(<MemoryDetail agent={agent} memory={memory} onChanged={onChanged} />);
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByDisplayValue("Old content"), { target: { value: "New content" } });
    fireEvent.click(screen.getByText("Save"));

    expect(promptSpy).toHaveBeenCalled();
    expect(editMemory).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("saves edited summary and content after confirmation", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("memory-123");
    const onChanged = vi.fn();

    render(<MemoryDetail agent={agent} memory={memory} onChanged={onChanged} />);
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByDisplayValue("Old summary"), { target: { value: "New summary" } });
    fireEvent.change(screen.getByDisplayValue("Old content"), { target: { value: "New content" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(editMemory).toHaveBeenCalledWith("memory-123", "New summary", "New content"));
    expect(onChanged).toHaveBeenCalled();
  });
});
