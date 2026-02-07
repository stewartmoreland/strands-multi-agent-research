import { describe, it, expect, vi, beforeEach } from "vitest";
import { listFoundationModels } from "./listModels";

vi.mock("@aws-sdk/client-bedrock", () => ({
  BedrockClient: vi.fn(),
  ListFoundationModelsCommand: vi.fn(),
}));

const mockSend = vi.fn();

beforeEach(async () => {
  vi.resetModules();
  mockSend.mockReset();
  const { BedrockClient } = await import("@aws-sdk/client-bedrock");
  vi.mocked(BedrockClient).mockImplementation(
    () =>
      ({
        send: mockSend,
      }) as unknown as InstanceType<typeof BedrockClient>,
  );
});

describe("listFoundationModels", () => {
  it("returns mapped summaries and filters LEGACY", async () => {
    mockSend.mockResolvedValue({
      modelSummaries: [
        {
          modelId: "id-1",
          modelName: "Model 1",
          providerName: "Provider",
          modelLifecycle: { status: "ACTIVE" },
          outputModalities: ["TEXT"],
          responseStreamingSupported: true,
          inferenceTypesSupported: ["ON_DEMAND"],
        },
        {
          modelId: "id-2",
          modelName: "Legacy",
          modelLifecycle: { status: "LEGACY" },
        },
      ],
    });

    const result = await listFoundationModels();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      modelId: "id-1",
      modelName: "Model 1",
      providerName: "Provider",
    });
  });

  it("returns empty array when no summaries", async () => {
    mockSend.mockResolvedValue({ modelSummaries: [] });
    const result = await listFoundationModels();
    expect(result).toEqual([]);
  });
});
