import { config } from "@/lib/config";
import type { FoundationModelSummary } from "@repo/shared";
import type { ModelOption } from "@repo/ui";
import { useCallback, useEffect, useState } from "react";

function toModelOption(summary: FoundationModelSummary): ModelOption {
  return {
    id: summary.modelId,
    name: summary.modelName ?? summary.modelId,
    description: summary.providerName,
    responseStreamingSupported: summary.responseStreamingSupported,
    outputModalities: summary.outputModalities,
    inferenceTypesSupported: summary.inferenceTypesSupported,
  };
}

interface UseBedrockModelsReturn {
  models: ModelOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches the list of available Bedrock foundation models from the agent's GET /models endpoint.
 * Models are filtered to TEXT modality and non-legacy; used to populate the model selector.
 */
export function useBedrockModels(): UseBedrockModelsReturn {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(config.agent.modelsUrl);
      if (!res.ok) {
        throw new Error(
          res.status === 401 ? "Authentication required" : `HTTP ${res.status}`,
        );
      }
      const data = (await res.json()) as { models?: FoundationModelSummary[] };
      const list = data.models ?? [];
      setModels(list.map(toModelOption));
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the Research API. Is the API server running? (Start with `yarn workspace api dev` or `yarn dev` from the repo root.)"
          : err instanceof Error
            ? err.message
            : "Failed to load models";
      setError(message);
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, isLoading, error, refetch: fetchModels };
}
