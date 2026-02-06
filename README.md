# Multi-Agent Research System

[Multi-Agent Research Tutorial](https://stewmore.dev/blog/multi-agent-research-system-with-strands-agents-typescript)

A multi-agent research system built with the Strands Agents TypeScript SDK and AWS Bedrock AgentCore. Features a React frontend with real-time streaming, thinking visualization, and a modular agent architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (apps/web)                         │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │  Chat UI    │  │ Thinking Panel  │  │ Tool Execution Timeline  │ │
│  └─────────────┘  └─────────────────┘  └──────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ SSE Stream
┌─────────────────────────────▼───────────────────────────────────────┐
│                    Agent Runtime (apps/agent)                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      Orchestrator Agent                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │  Researcher │  │   Analyst   │  │   Writer    │          │   │
│  │  │  Specialist │  │  Specialist │  │  Specialist │          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐   │
│  │ Memory Adapter   │  │ Gateway MCP Client                   │   │
│  └──────────────────┘  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                  AWS Bedrock AgentCore (packages/infra)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Runtime  │  │  Memory  │  │ Gateway  │  │ Browser/Code Interp│  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
├── apps/
│   ├── agent/           # Agent runtime server (TypeScript)
│   │   ├── src/
│   │   │   ├── server.ts         # HTTP server with SSE streaming
│   │   │   ├── orchestrator.ts   # Main orchestrator agent
│   │   │   ├── specialists.ts    # Specialist agents (research, analysis, writing)
│   │   │   ├── memoryAdapter.ts  # AgentCore Memory integration
│   │   │   └── gatewayClient.ts  # AgentCore Gateway MCP client
│   │   └── Dockerfile
│   └── web/             # React frontend (Vite)
│       └── src/
│           ├── App.tsx           # Main research interface
│           └── hooks/
│               └── useAgentStream.ts  # SSE streaming hook
├── packages/
│   ├── infra/           # AWS CDK infrastructure
│   │   └── lib/
│   │       └── stack.ts          # AgentCore resources
│   ├── shared/          # Shared TypeScript types
│   │   └── src/
│   │       ├── events.ts         # UI event types
│   │       └── types.ts          # Common types
│   ├── ui/              # React component library (shadcn/ui)
│   │   └── src/
│   │       ├── components/       # UI components
│   │       ├── lib/              # Utilities (cn)
│   │       └── styles/           # Tailwind CSS
│   ├── eslint-config/   # Shared ESLint config
│   └── typescript-config/  # Shared TypeScript config
├── turbo.json           # Turborepo configuration
└── package.json         # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn (v4)
- AWS CLI configured with credentials
- Access to Amazon Bedrock models

### Installation

```bash
# Install dependencies
yarn install

# Build all packages
yarn build
```

### Development

```bash
# Start all apps in development mode
yarn dev

# Or start individually:
# Start the agent server (port 8080)
yarn workspace agent dev

# Start the web frontend (port 5173)
yarn workspace web dev
```

### Deployment

#### Deploy Infrastructure

```bash
cd packages/infra

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Deploy the stack
npx cdk deploy
```

#### Build and Push Agent Container

```bash
# Build the agent container
docker build -f apps/agent/Dockerfile -t research-agent .

# Tag and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag research-agent:latest <account>.dkr.ecr.us-east-1.amazonaws.com/research-agent:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/research-agent:latest
```

## Features

### Multi-Agent Architecture

The system uses an "Agents-as-Tools" pattern where:

- **Orchestrator Agent**: Decides which specialists to invoke based on the user's query
- **Research Specialist**: Handles web research, API calls through Gateway
- **Analysis Specialist**: Performs data analysis using Code Interpreter
- **Writing Specialist**: Synthesizes findings into coherent responses

### Real-time Streaming

- SSE (Server-Sent Events) for real-time updates
- Separate event streams for:
  - Message content (assistant responses)
  - Thinking content (reasoning traces)
  - Tool executions (start/end events)

### UI Components

Built with shadcn/ui and Tailwind CSS v4:

- **ChatTranscript**: Scrollable message history
- **ChatInput**: Input with send button
- **ThinkingTimeline**: Visual timeline of tool executions
- **ThinkingPanel**: Collapsible reasoning display

## Observability and Evaluations

The agent is instrumented with OpenTelemetry and exports traces to AWS X-Ray so you can use **AgentCore Observability** (GenAI dashboard in CloudWatch) and **AgentCore Evaluations** (online evaluation of agent performance).

### One-time: Enable CloudWatch Transaction Search

AgentCore Observability and Evaluations require **Transaction Search** to be enabled once per AWS account so spans are ingested and queryable.

**Option 1 – CloudWatch Console**

1. Open the [CloudWatch console](https://console.aws.amazon.com/cloudwatch/).
2. Under **Setup**, choose **Settings**.
3. Select **Account** and the **X-Ray traces** tab.
4. In **Transaction Search**, choose **View settings** → **Edit** → **Enable Transaction Search**.
5. Choose a sampling percentage (e.g. 1% at no extra cost) and save.

**Option 2 – AWS CLI**

```bash
# 1. Allow X-Ray to write to CloudWatch Logs (replace region and account-id)
aws logs put-resource-policy --policy-name AgentCoreTransactionSearch \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "TransactionSearchXRayAccess",
      "Effect": "Allow",
      "Principal": { "Service": "xray.amazonaws.com" },
      "Action": "logs:PutLogEvents",
      "Resource": [
        "arn:aws:logs:REGION:ACCOUNT-ID:log-group:aws/spans:*",
        "arn:aws:logs:REGION:ACCOUNT-ID:log-group:/aws/application-signals/data:*"
      ],
      "Condition": {
        "ArnLike": { "aws:SourceArn": "arn:aws:xray:REGION:ACCOUNT-ID:*" },
        "StringEquals": { "aws:SourceAccount": "ACCOUNT-ID" }
      }
    }]
  }'

# 2. Send trace segments to CloudWatch Logs
aws xray update-trace-segment-destination --destination CloudWatchLogs
```

After enabling, allow up to ~10 minutes for spans to appear in Transaction Search.

### Post-deploy: Create an online evaluation config

Evaluators and online evaluation configs are created via the Control Plane (CLI, SDK, or Console), not CDK. After deploying the stack, use the exported **Evaluation Role ARN** and **Agent Runtime ID**:

- **AgentCore CLI:** `agentcore eval online create --name research_agent_eval --agent-id <AgentRuntimeId> --evaluator Builtin.GoalSuccessRate --evaluator Builtin.Helpfulness --evaluation-execution-role-arn <ResearchAgentEvaluationRoleArn>`
- **Console:** AgentCore → Evaluation → Create evaluation configuration → choose agent endpoint, select evaluators, set the execution role to the stack output role ARN.
- **AWS SDK:** Use `bedrock-agentcore-control` `CreateOnlineEvaluationConfig` with `dataSourceConfig` (agent endpoint or log groups + `serviceNames`: `research_agent`), `evaluators`, and `evaluationExecutionRoleArn`.

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id

# AgentCore Configuration (after deployment)
AGENTCORE_MEMORY_ID=memory-id-from-deployment
AGENTCORE_GATEWAY_URL=gateway-url-from-deployment
```

## Scripts

| Command       | Description                |
| ------------- | -------------------------- |
| `yarn build`  | Build all packages         |
| `yarn dev`    | Start development servers  |
| `yarn lint`   | Run ESLint on all packages |
| `yarn format` | Format code with Prettier  |
| `yarn clean`  | Clean build artifacts      |

## Technology Stack

- **Runtime**: Node.js 20+, TypeScript
- **Frontend**: React 18, Vite, Tailwind CSS v4
- **Components**: shadcn/ui, Lucide React icons
- **Infrastructure**: AWS CDK, Amazon Bedrock AgentCore
- **Monorepo**: Turborepo, Yarn Workspaces

## References

- [Strands Agents TypeScript SDK](https://github.com/aws/bedrock-agentcore-sdk-typescript)
- [Amazon Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore.html)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Turborepo Documentation](https://turbo.build/repo/docs)

## License

MIT
