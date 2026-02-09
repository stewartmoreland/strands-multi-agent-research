import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listFoundationModels } from './listModels'

const mockSend = vi.fn()

vi.mock('@aws-sdk/client-bedrock', () => ({
  BedrockClient: class {
    send = mockSend
  },
  ListFoundationModelsCommand: class {
    constructor(public args?: unknown) {}
  },
}))

beforeEach(() => {
  mockSend.mockReset()
})

describe('listFoundationModels', () => {
  it('returns mapped summaries and filters LEGACY', async () => {
    mockSend.mockResolvedValue({
      modelSummaries: [
        {
          modelId: 'id-1',
          modelName: 'Model 1',
          providerName: 'Provider',
          modelLifecycle: { status: 'ACTIVE' },
          outputModalities: ['TEXT'],
          responseStreamingSupported: true,
          inferenceTypesSupported: ['ON_DEMAND'],
        },
        {
          modelId: 'id-2',
          modelName: 'Legacy',
          modelLifecycle: { status: 'LEGACY' },
        },
      ],
    })

    const result = await listFoundationModels()
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      modelId: 'id-1',
      modelName: 'Model 1',
      providerName: 'Provider',
    })
  })

  it('returns empty array when no summaries', async () => {
    mockSend.mockResolvedValue({ modelSummaries: [] })
    const result = await listFoundationModels()
    expect(result).toEqual([])
  })
})
