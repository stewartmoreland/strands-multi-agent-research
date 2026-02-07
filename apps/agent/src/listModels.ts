/**
 * List Bedrock foundation models via the control plane API.
 * Used to populate the web app's model selector with currently available models.
 *
 * @see https://docs.aws.amazon.com/bedrock/latest/APIReference/API_ListFoundationModels.html
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

/**
 * List foundation models that support text output (suitable for chat).
 * Excludes deprecated/legacy when possible.
 * Note: ListFoundationModels in this SDK version returns one page; no nextToken in request/response.
 */
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
