import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  GraphQLClient,
  GraphQLError,
  UnauthorizedError,
  RateLimitError,
  RequestError
} from './graphql-client'

describe('GraphQLClient', () => {
  let client: GraphQLClient
  const mockEndpoint = 'https://api.example.com/graphql'
  const mockToken = 'test-token-123'

  beforeEach(() => {
    client = new GraphQLClient(mockEndpoint, mockToken)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('request', () => {
    it('should make a successful GraphQL request', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            name: 'Test User'
          }
        }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
          }
        }
      `
      const variables = { id: '1' }

      const result = await client.request(query, variables)

      expect(result).toEqual(mockResponse.data)
      expect(fetch).toHaveBeenCalledWith(mockEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${mockToken}`
        },
        body: JSON.stringify({ query, variables }, null, 2)
      })
    })

    it('should handle GraphQL errors in successful response', async () => {
      const mockResponse = {
        errors: [
          {
            message: 'Field not found'
          }
        ]
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const query = `query { test }`

      await expect(client.request(query)).rejects.toThrow(GraphQLError)
      await expect(client.request(query)).rejects.toThrow('Field not found')
    })

    it('should handle 400 Bad Request with errors', async () => {
      const mockResponse = {
        errors: [
          {
            message: 'Invalid query syntax'
          }
        ]
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => mockResponse
      })

      const query = `query { test }`

      await expect(client.request(query)).rejects.toThrow(GraphQLError)
      await expect(client.request(query)).rejects.toThrow(
        'Invalid query syntax'
      )
    })

    it('should handle 401 Unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      })

      const query = `query { test }`

      await expect(client.request(query)).rejects.toThrow(UnauthorizedError)
      await expect(client.request(query)).rejects.toThrow(
        'You are not authorized to access this resource. Make sure that you pass a valid token.'
      )
    })

    it('should handle 429 Rate Limit', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429
      })

      const query = `query { test }`

      await expect(client.request(query)).rejects.toThrow(RateLimitError)
      await expect(client.request(query)).rejects.toThrow(
        'You have reached the rate limit. Please try again later.'
      )
    })

    it('should handle 503 Service Unavailable', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      })

      const query = `query { test }`

      await expect(client.request(query)).rejects.toThrow(
        'Service unavailable. Please try again later.'
      )
    })

    it('should handle other HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const query = `query { test }`

      await expect(client.request(query)).rejects.toThrow(RequestError)
      await expect(client.request(query)).rejects.toThrow(
        'GraphQL request failed with status 500: Internal Server Error'
      )
    })

    it('should handle response without data field', async () => {
      const mockResponse = {
        // No data field
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const query = `query { test }`

      await expect(client.request(query)).rejects.toThrow(
        'There is no data in the response.'
      )
    })

    it('should work with empty variables', async () => {
      const mockResponse = {
        data: {
          test: 'value'
        }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const query = `query { test }`

      const result = await client.request(query)

      expect(result).toEqual(mockResponse.data)
      expect(fetch).toHaveBeenCalledWith(mockEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${mockToken}`
        },
        body: JSON.stringify({ query, variables: {} }, null, 2)
      })
    })
  })
})
