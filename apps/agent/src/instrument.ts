/**
 * OpenTelemetry instrumentation for AgentCore Observability.
 * Must be loaded before any other application code so the tracer provider is registered.
 * Traces are exported to AWS X-Ray via OTLP HTTP (GenAI Observability / Transaction Search).
 */
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes } from "@opentelemetry/resources";

const region = process.env.AWS_REGION ?? "us-east-1";
const serviceName =
  process.env.OTEL_SERVICE_NAME ??
  process.env.OTEL_RESOURCE_ATTRIBUTES?.split(",")
    .find((a) => a.startsWith("service.name="))
    ?.split("=")[1] ??
  "research_agent";

const traceExporter = new OTLPTraceExporter({
  url: `https://xray.${region}.amazonaws.com/v1/traces`,
  headers: {},
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    "service.name": serviceName,
  }),
  traceExporter,
});

sdk.start();
