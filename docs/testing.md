# Testing

Unit tests are implemented across apps and packages using **Vitest** (and Vitest-based CDK stack tests in `packages/infra`). Coverage thresholds do not fail builds; the target is **at least 85% code coverage** per app and package.

## Running tests

From the repo root:

- `yarn test` – run all workspace tests (Turbo)
- `yarn test:coverage` – run all tests with coverage reports

Per workspace (e.g. `yarn workspace @repo/shared test`):

- `yarn test` – run tests once
- `yarn test:watch` – watch mode (where supported)
- `yarn test:coverage` – run with coverage

## Workspaces and frameworks

| Workspace       | Framework | Notes                                    |
| --------------- | --------- | ---------------------------------------- |
| packages/shared | Vitest    | Node; type guards and pure logic         |
| packages/ui     | Vitest    | jsdom + React Testing Library            |
| packages/infra  | Vitest    | Node; CDK stack assertions (Template)    |
| apps/agent      | Vitest    | Node; server helpers, listModels, memory |
| apps/api        | Vitest    | Node; supertest for routes, jwt          |
| apps/web        | Vitest    | jsdom + React Testing Library            |

## CI

The **Build and Deploy** workflow (`.github/workflows/deploy.yml`) runs `yarn test` after install and before build. Tests must pass for deployment to proceed.
