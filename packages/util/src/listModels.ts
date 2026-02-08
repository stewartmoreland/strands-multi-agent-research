/**
 * List Bedrock foundation models via the control plane API.
 * Same logic as apps/agent/src/listModels.ts for API package.
 */

import {
  BedrockClient,
  ListFoundationModelsCommand,
  type FoundationModelSummary as AwsSummary,
} from "@aws-sdk/client-bedrock";
import type { FoundationModelSummary } from "@repo/shared";

const region = process.env.AWS_REGION || "us-east-1";

function toSummary(s: AwsSummary): FoundationModelSummary {
  return {
    modelId: s.modelId ?? "",
    modelName: s.modelName,
    providerName: s.providerName,
    modelLifecycle: s.modelLifecycle,
    outputModalities: s.outputModalities,
    responseStreamingSupported: s.responseStreamingSupported,
    inferenceTypesSupported: s.inferenceTypesSupported,
  };
}

export async function listFoundationModels(): Promise<FoundationModelSummary[]> {
  const client = new BedrockClient({ region });
  const response = await client.send(
    new ListFoundationModelsCommand({
      byOutputModality: "TEXT",
    }),
  );
  const summaries = response.modelSummaries ?? [];
  const results: FoundationModelSummary[] = [];
  for (const s of summaries) {
    const status = s.modelLifecycle?.status;
    if (status === "LEGACY") continue;
    results.push(toSummary(s));
  }
  return results;
}
