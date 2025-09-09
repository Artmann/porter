import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { tools, createTools } from './tools'
import invariant from 'tiny-invariant'

const mockRailwayClient = {
  createService: vi.fn(),
  listProjects: vi.fn(),
  listServices: vi.fn(),
  findDeployment: vi.fn(),
  createServiceDomain: vi.fn()
}

const mockChatService = {
  updateTitle: vi.fn()
}

vi.mock('~/railway-client', () => ({
  RailwayClient: vi.fn().mockImplementation(() => mockRailwayClient)
}))

vi.mock('~/chat/chat-service.server', () => ({
  ChatService: vi.fn().mockImplementation(() => mockChatService)
}))

describe('Chat Tools', () => {
  const mockToolCallOptions = {
    toolCallId: 'test-call-id',
    messages: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RAILWAY_API_TOKEN', 'test-token')
  })

  describe('createService tool', () => {
    it('should create service with repository source', async () => {
      const mockService = {
        id: 'service-123',
        name: 'test-service',
        projectId: 'project-123',
        deployments: []
      }

      vi.mocked(mockRailwayClient.createService).mockResolvedValue(mockService)

      invariant(
        tools.createService.execute,
        'createService tool is not defined'
      )

      const result = await tools.createService.execute(
        {
          projectId: 'project-123',
          repository: 'user/repo'
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        ...mockService,
        latestDeploymentId: null,
        message: 'Service created successfully. No deployment initiated yet.'
      })
      expect(mockRailwayClient.createService).toHaveBeenCalledWith(
        'project-123',
        { image: undefined, repo: 'user/repo' }
      )
    })

    it('should create service with docker image source', async () => {
      const mockService = {
        id: 'service-456',
        name: 'nginx-service',
        projectId: 'project-123',
        deployments: []
      }

      vi.mocked(mockRailwayClient.createService).mockResolvedValue(mockService)

      invariant(
        tools.createService.execute,
        'createService tool is not defined'
      )

      const result = await tools.createService.execute(
        {
          projectId: 'project-123',
          dockerImage: 'nginx:latest'
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        ...mockService,
        latestDeploymentId: null,
        message: 'Service created successfully. No deployment initiated yet.'
      })
      expect(mockRailwayClient.createService).toHaveBeenCalledWith(
        'project-123',
        { image: 'nginx:latest', repo: undefined }
      )
    })

    it('should return error when neither repository nor dockerImage provided', async () => {
      invariant(
        tools.createService.execute,
        'createService tool is not defined'
      )

      const result = await tools.createService.execute(
        {
          projectId: 'project-123'
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        error: 'Either repository or dockerImage must be provided.'
      })
      expect(mockRailwayClient.createService).not.toHaveBeenCalled()
    })

    it('should handle Railway API errors', async () => {
      vi.mocked(mockRailwayClient.createService).mockRejectedValue(
        new Error('API Error')
      )

      invariant(
        tools.createService.execute,
        'createService tool is not defined'
      )

      const result = await tools.createService.execute(
        {
          projectId: 'project-123',
          repository: 'user/repo'
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        error: 'Failed to create service. Please try again later.'
      })
    })

    it('should validate projectId is required', async () => {
      invariant(
        tools.createService.execute,
        'createService tool is not defined'
      )

      const result = await tools.createService.execute(
        {
          projectId: '',
          repository: 'user/repo'
        },
        mockToolCallOptions
      )

      // Should return error object for validation failure
      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Failed to create service')
    })
  })

  describe('listProjects tool', () => {
    it('should list projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project 1',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'project-2',
          name: 'Test Project 2',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ]

      vi.mocked(mockRailwayClient.listProjects).mockResolvedValue(mockProjects)

      invariant(tools.listProjects.execute, 'listProjects tool is not defined')

      const result = await tools.listProjects.execute({}, mockToolCallOptions)

      expect(result).toEqual(mockProjects)
      expect(mockRailwayClient.listProjects).toHaveBeenCalledTimes(1)
    })

    it('should handle empty project list', async () => {
      vi.mocked(mockRailwayClient.listProjects).mockResolvedValue([])

      invariant(tools.listProjects.execute, 'listProjects tool is not defined')

      const result = await tools.listProjects.execute({}, mockToolCallOptions)

      expect(result).toEqual([])
    })

    it('should handle Railway API errors', async () => {
      vi.mocked(mockRailwayClient.listProjects).mockRejectedValue(
        new Error('Network error')
      )

      invariant(tools.listProjects.execute, 'listProjects tool is not defined')

      const result = await tools.listProjects.execute({}, mockToolCallOptions)

      expect(result).toEqual({
        error: 'Failed to fetch projects. Please try again later.'
      })
    })
  })

  describe('listServices tool', () => {
    it('should list services for a project', async () => {
      const mockServices = [
        {
          id: 'service-1',
          name: 'API Service',
          projectId: 'project-123',
          deployments: [
            {
              id: 'deploy-1',
              status: 'SUCCESS',
              url: 'https://api.example.com'
            }
          ]
        },
        {
          id: 'service-2',
          name: 'Database',
          projectId: 'project-123',
          deployments: []
        }
      ]

      vi.mocked(mockRailwayClient.listServices).mockResolvedValue(mockServices)

      invariant(tools.listServices.execute, 'listServices tool is not defined')

      const result = await tools.listServices.execute(
        {
          projectId: 'project-123'
        },
        mockToolCallOptions
      )

      expect(result).toEqual(mockServices)
      expect(mockRailwayClient.listServices).toHaveBeenCalledWith('project-123')
    })

    it('should handle empty service list', async () => {
      vi.mocked(mockRailwayClient.listServices).mockResolvedValue([])

      invariant(tools.listServices.execute, 'listServices tool is not defined')

      const result = await tools.listServices.execute(
        {
          projectId: 'project-123'
        },
        mockToolCallOptions
      )

      expect(result).toEqual([])
    })

    it('should handle Railway API errors', async () => {
      vi.mocked(mockRailwayClient.listServices).mockRejectedValue(
        new Error('Project not found')
      )

      invariant(tools.listServices.execute, 'listServices tool is not defined')

      const result = await tools.listServices.execute(
        {
          projectId: 'invalid-project'
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        error: 'Failed to fetch services. Please try again later.'
      })
    })

    it('should validate projectId is required', async () => {
      invariant(tools.listServices.execute, 'listServices tool is not defined')

      const result = await tools.listServices.execute(
        {
          projectId: ''
        },
        mockToolCallOptions
      )

      // Should return error object for validation failure
      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Failed to fetch services')
    })
  })

  describe('waitForDeployment tool', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return successful deployment', async () => {
      const mockDeployment = {
        id: 'deploy-123',
        status: 'SUCCESS',
        url: 'https://app.example.com'
      }

      mockRailwayClient.findDeployment.mockResolvedValue(mockDeployment)

      invariant(
        tools.waitForDeployment.execute,
        'waitForDeployment tool is not defined'
      )

      const result = await tools.waitForDeployment.execute(
        {
          deploymentId: 'deploy-123',
          maxWaitTime: 300
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        deployment: mockDeployment,
        success: true,
        message:
          'Deployment completed successfully. URL: https://app.example.com'
      })
    })

    it('should return failed deployment', async () => {
      const mockDeployment = {
        id: 'deploy-123',
        status: 'FAILED',
        url: null
      }

      mockRailwayClient.findDeployment.mockResolvedValue(mockDeployment)

      invariant(
        tools.waitForDeployment.execute,
        'waitForDeployment tool is not defined'
      )

      const result = await tools.waitForDeployment.execute(
        {
          deploymentId: 'deploy-123',
          maxWaitTime: 300
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        deployment: mockDeployment,
        success: false,
        message: 'Deployment failed with status: FAILED'
      })
    })

    it('should handle deployment not found', async () => {
      mockRailwayClient.findDeployment.mockResolvedValue(null)

      invariant(
        tools.waitForDeployment.execute,
        'waitForDeployment tool is not defined'
      )

      const result = await tools.waitForDeployment.execute(
        {
          deploymentId: 'nonexistent-deploy',
          maxWaitTime: 300
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        error: 'Deployment not found.'
      })
    })

    it('should timeout when deployment takes too long', async () => {
      const mockDeployment = {
        id: 'deploy-123',
        status: 'BUILDING',
        url: null
      }

      mockRailwayClient.findDeployment.mockResolvedValue(mockDeployment)

      invariant(
        tools.waitForDeployment.execute,
        'waitForDeployment tool is not defined'
      )

      const executePromise = tools.waitForDeployment.execute(
        {
          deploymentId: 'deploy-123',
          maxWaitTime: 10 // 10 seconds
        },
        mockToolCallOptions
      )

      // Fast-forward time to trigger timeout
      await vi.advanceTimersByTimeAsync(15000) // 15 seconds

      const result = await executePromise

      expect(result).toEqual({
        error: 'Deployment did not complete within 10 seconds.',
        timeout: true
      })
    }, 10000) // Increase test timeout

    it('should poll until deployment completes', async () => {
      const buildingDeployment = {
        id: 'deploy-123',
        status: 'BUILDING',
        url: null
      }
      const successDeployment = {
        id: 'deploy-123',
        status: 'SUCCESS',
        url: 'https://app.example.com'
      }

      mockRailwayClient.findDeployment
        .mockResolvedValueOnce(buildingDeployment)
        .mockResolvedValueOnce(buildingDeployment)
        .mockResolvedValueOnce(successDeployment)

      invariant(
        tools.waitForDeployment.execute,
        'waitForDeployment tool is not defined'
      )

      const executePromise = tools.waitForDeployment.execute(
        {
          deploymentId: 'deploy-123',
          maxWaitTime: 300
        },
        mockToolCallOptions
      )

      // Advance timers to simulate polling intervals
      await vi.advanceTimersByTimeAsync(5000) // First poll
      await vi.advanceTimersByTimeAsync(5000) // Second poll
      await vi.advanceTimersByTimeAsync(5000) // Third poll - success

      const result = await executePromise

      expect(result).toEqual({
        deployment: successDeployment,
        success: true,
        message:
          'Deployment completed successfully. URL: https://app.example.com'
      })
      expect(mockRailwayClient.findDeployment).toHaveBeenCalledTimes(3)
    })

    it('should handle Railway API errors during polling', async () => {
      mockRailwayClient.findDeployment.mockRejectedValue(new Error('API Error'))

      invariant(
        tools.waitForDeployment.execute,
        'waitForDeployment tool is not defined'
      )

      const result = await tools.waitForDeployment.execute(
        {
          deploymentId: 'deploy-123',
          maxWaitTime: 300
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        error: 'Failed to check deployment status. Please try again later.'
      })
    })

    it('should validate deploymentId is required', async () => {
      invariant(
        tools.waitForDeployment.execute,
        'waitForDeployment tool is not defined'
      )

      const result = await tools.waitForDeployment.execute(
        {
          deploymentId: ''
        },
        mockToolCallOptions
      )

      // Should return error object for validation failure
      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Deployment did not complete')
    })

    it('should use default maxWaitTime when not provided', async () => {
      const mockDeployment = {
        id: 'deploy-123',
        status: 'SUCCESS',
        url: 'https://app.example.com'
      }

      mockRailwayClient.findDeployment.mockResolvedValue(mockDeployment)

      invariant(
        tools.waitForDeployment.execute,
        'waitForDeployment tool is not defined'
      )

      const result = await tools.waitForDeployment.execute(
        {
          deploymentId: 'deploy-123',
          maxWaitTime: 300 // Explicitly provide the default to test the logic
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        deployment: mockDeployment,
        success: true,
        message:
          'Deployment completed successfully. URL: https://app.example.com'
      })
    })
  })

  describe('generateDomain tool', () => {
    it('should create domain successfully', async () => {
      const mockDomain = {
        id: 'domain-123',
        domain: 'app-abc123.railway.app'
      }

      vi.mocked(mockRailwayClient.createServiceDomain).mockResolvedValue(
        mockDomain
      )

      invariant(
        tools.generateDomain.execute,
        'generateDomain tool is not defined'
      )

      const result = await tools.generateDomain.execute(
        {
          environmentId: 'env-123',
          serviceId: 'service-123',
          targetPort: 8080
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        domain: mockDomain,
        message: 'Domain created successfully: app-abc123.railway.app'
      })
      expect(mockRailwayClient.createServiceDomain).toHaveBeenCalledWith(
        'env-123',
        'service-123',
        8080
      )
    })

    it('should handle domain creation without domain field', async () => {
      const mockDomain = {
        id: 'domain-456'
      }

      vi.mocked(mockRailwayClient.createServiceDomain).mockResolvedValue(
        mockDomain
      )

      invariant(
        tools.generateDomain.execute,
        'generateDomain tool is not defined'
      )

      const result = await tools.generateDomain.execute(
        {
          environmentId: 'env-123',
          serviceId: 'service-123',
          targetPort: 3000
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        domain: mockDomain,
        message: 'Domain created successfully: Domain is being generated'
      })
    })

    it('should handle Railway API errors', async () => {
      vi.mocked(mockRailwayClient.createServiceDomain).mockRejectedValue(
        new Error('Service not found')
      )

      invariant(
        tools.generateDomain.execute,
        'generateDomain tool is not defined'
      )

      const result = await tools.generateDomain.execute(
        {
          environmentId: 'env-invalid',
          serviceId: 'service-invalid',
          targetPort: 8080
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        error: 'Failed to create domain. Please try again later.'
      })
    })

    it('should validate required parameters', async () => {
      invariant(
        tools.generateDomain.execute,
        'generateDomain tool is not defined'
      )

      const result = await tools.generateDomain.execute(
        {
          environmentId: '',
          serviceId: 'service-123',
          targetPort: 8080
        },
        mockToolCallOptions
      )

      expect(result).toHaveProperty('error')
    })

    it('should validate port range', async () => {
      invariant(
        tools.generateDomain.execute,
        'generateDomain tool is not defined'
      )

      const result = await tools.generateDomain.execute(
        {
          environmentId: 'env-123',
          serviceId: 'service-123',
          targetPort: 70000 // Invalid port number
        },
        mockToolCallOptions
      )

      expect(result).toHaveProperty('error')
    })
  })

  describe('environment variable validation', () => {
    it('should throw error when RAILWAY_API_TOKEN is not set', async () => {
      vi.unstubAllEnvs()

      invariant(tools.listProjects.execute, 'listProjects tool is not defined')

      const result = await tools.listProjects.execute({}, mockToolCallOptions)

      // Should return error object when env var is missing
      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Failed to fetch projects')
    })
  })

  describe('updateChatTitle tool', () => {
    it('should update chat title successfully', async () => {
      const mockUpdatedChat = {
        id: 'chat-123',
        title: 'Deploy Django App',
        messages: []
      }

      vi.mocked(mockChatService.updateTitle).mockResolvedValue(mockUpdatedChat)

      const toolsWithChatId = createTools('chat-123')

      invariant(
        toolsWithChatId.updateChatTitle.execute,
        'updateChatTitle tool is not defined'
      )

      const result = await toolsWithChatId.updateChatTitle.execute(
        {
          title: 'Deploy Django App'
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        chat: mockUpdatedChat,
        message: 'Chat title updated to: "Deploy Django App"'
      })
      expect(mockChatService.updateTitle).toHaveBeenCalledWith(
        'chat-123',
        'Deploy Django App'
      )
    })

    it('should handle ChatService errors', async () => {
      vi.mocked(mockChatService.updateTitle).mockRejectedValue(
        new Error('Chat not found')
      )

      const toolsWithChatId = createTools('invalid-chat-id')

      invariant(
        toolsWithChatId.updateChatTitle.execute,
        'updateChatTitle tool is not defined'
      )

      const result = await toolsWithChatId.updateChatTitle.execute(
        {
          title: 'New Title'
        },
        mockToolCallOptions
      )

      expect(result).toEqual({
        error: 'Failed to update chat title. Please try again later.'
      })
    })

    it('should validate title is required', async () => {
      const toolsWithChatId = createTools('chat-123')

      invariant(
        toolsWithChatId.updateChatTitle.execute,
        'updateChatTitle tool is not defined'
      )

      const result = await toolsWithChatId.updateChatTitle.execute(
        {
          title: ''
        },
        mockToolCallOptions
      )

      expect(result).toHaveProperty('error')
    })

    it('should validate title length limit', async () => {
      const toolsWithChatId = createTools('chat-123')

      invariant(
        toolsWithChatId.updateChatTitle.execute,
        'updateChatTitle tool is not defined'
      )

      const longTitle = 'a'.repeat(101) // 101 characters, exceeding 100 char limit

      const result = await toolsWithChatId.updateChatTitle.execute(
        {
          title: longTitle
        },
        mockToolCallOptions
      )

      expect(result).toHaveProperty('error')
    })
  })
})
