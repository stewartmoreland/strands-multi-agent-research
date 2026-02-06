/**
 * Specialist Agents Module
 *
 * This module exports specialist agents wrapped as tools for the orchestrator.
 * Each specialist is designed for a specific type of task:
 *
 * - Research Specialist: Web research using AgentCore Browser
 * - Analysis Specialist: Data analysis using AgentCore Code Interpreter
 * - Writing Specialist: Content synthesis using LLM inference
 *
 * These tools use the Strands Agents SDK tool() helper with Zod schemas
 * for type-safe input validation.
 */

// Export specialist tools
export { analysisTool } from "./analysis";
export { researchTool } from "./research";
export { writingTool } from "./writing";

// Export types for consumers who need them
export type {
  AnalysisInput,
  OutputFormat,
  ResearchInput,
  SpecialistConfig,
  SpecialistResult,
  WritingInput,
} from "./types";

export { getSpecialistConfig } from "./types";
