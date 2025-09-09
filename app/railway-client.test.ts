import { describe, expect, it, vi, beforeEach } from 'vitest'
import { RailwayClient } from './railway-client'
import type { GraphQLClient } from './graphql-client'

describe('RailwayClient', () => {
  let railwayClient: RailwayClient
  let mockGraphQLClient: GraphQLClient

  beforeEach(() => {
    mockGraphQLClient = {
      request: vi.fn()
    } as unknown as GraphQLClient

    railwayClient = new RailwayClient(mockGraphQLClient)
  })

  describe('listProjects', () => {
    it('should list all projects across workspaces', async () => {
      const mockResponse = {
        me: {
          workspaces: [
            {
              team: {
                projects: {
                  edges: [
                    {
                      node: {
                        id: 'project-1',
                        name: 'Project 1',
                        createdAt: '2024-01-01T00:00:00Z',
                        deletedAt: null,
                        description: 'First project',
                        isPublic: false
                      }
                    },
                    {
                      node: {
                        id: 'project-2',
                        name: 'Project 2',
                        createdAt: '2024-01-02T00:00:00Z',
                        deletedAt: null,
                        description: null,
                        isPublic: true
                      }
                    }
                  ]
                }
              }
            },
            {
              team: {
                projects: {
                  edges: [
                    {
                      node: {
                        id: 'project-3',
                        name: 'Project 3',
                        createdAt: '2024-01-03T00:00:00Z',
                        deletedAt: null,
                        description: 'Third project',
                        isPublic: false
                      }
                    }
                  ]
                }
              }
            }
          ]
        }
      }

      vi.mocked(mockGraphQLClient.request).mockResolvedValue(mockResponse)

      const projects = await railwayClient.listProjects()

      expect(projects).toHaveLength(3)
      expect(projects[0]).toEqual({
        id: 'project-1',
        name: 'Project 1',
        createdAt: '2024-01-01T00:00:00Z',
        deletedAt: null,
        description: 'First project',
        isPublic: false
      })
      expect(projects[1].id).toBe('project-2')
      expect(projects[2].id).toBe('project-3')

      expect(mockGraphQLClient.request).toHaveBeenCalledTimes(1)
      expect(mockGraphQLClient.request).toHaveBeenCalledWith(
        expect.stringContaining('query')
      )
    })

    it('should handle empty workspaces', async () => {
      const mockResponse = {
        me: {
          workspaces: []
        }
      }

      vi.mocked(mockGraphQLClient.request).mockResolvedValue(mockResponse)

      const projects = await railwayClient.listProjects()

      expect(projects).toHaveLength(0)
      expect(projects).toEqual([])
    })

    it('should handle workspaces with no projects', async () => {
      const mockResponse = {
        me: {
          workspaces: [
            {
              team: {
                projects: {
                  edges: []
                }
              }
            }
          ]
        }
      }

      vi.mocked(mockGraphQLClient.request).mockResolvedValue(mockResponse)

      const projects = await railwayClient.listProjects()

      expect(projects).toHaveLength(0)
      expect(projects).toEqual([])
    })
  })

  describe('listServices', () => {
    it('should list services for a project with deployments', async () => {
      const projectId = 'test-project-id'
      const mockResponse = {
        project: {
          services: {
            edges: [
              {
                node: {
                  id: 'service-1',
                  name: 'API Service',
                  createdAt: '2024-01-01T00:00:00Z',
                  deletedAt: null,
                  projectId: projectId,
                  updatedAt: '2024-01-02T00:00:00Z',
                  deployments: {
                    edges: [
                      {
                        node: {
                          id: 'deploy-1',
                          canRedeploy: true,
                          canRollback: false,
                          createdAt: '2024-01-01T10:00:00Z',
                          deploymentStopped: false,
                          projectId: projectId,
                          snapshotId: 'snapshot-1',
                          staticUrl: null,
                          status: 'SUCCESS',
                          statusUpdatedAt: '2024-01-01T10:05:00Z',
                          suggestAddServiceDomain: true,
                          updatedAt: '2024-01-01T10:05:00Z',
                          url: 'https://api.example.com'
                        }
                      },
                      {
                        node: {
                          id: 'deploy-2',
                          canRedeploy: true,
                          canRollback: true,
                          createdAt: '2024-01-02T10:00:00Z',
                          deploymentStopped: false,
                          projectId: projectId,
                          snapshotId: 'snapshot-2',
                          staticUrl: null,
                          status: 'BUILDING',
                          statusUpdatedAt: '2024-01-02T10:01:00Z',
                          suggestAddServiceDomain: false,
                          updatedAt: '2024-01-02T10:01:00Z',
                          url: null
                        }
                      }
                    ]
                  }
                }
              },
              {
                node: {
                  id: 'service-2',
                  name: 'Database',
                  createdAt: '2024-01-01T00:00:00Z',
                  deletedAt: null,
                  projectId: projectId,
                  updatedAt: '2024-01-01T00:00:00Z',
                  deployments: {
                    edges: []
                  }
                }
              }
            ]
          }
        }
      }

      vi.mocked(mockGraphQLClient.request).mockResolvedValue(mockResponse)

      const services = await railwayClient.listServices(projectId)

      expect(services).toHaveLength(2)
      expect(services[0]).toEqual({
        id: 'service-1',
        name: 'API Service',
        createdAt: '2024-01-01T00:00:00Z',
        deletedAt: null,
        projectId: projectId,
        updatedAt: '2024-01-02T00:00:00Z',
        deployments: [
          {
            id: 'deploy-1',
            canRedeploy: true,
            canRollback: false,
            createdAt: '2024-01-01T10:00:00Z',
            deploymentStopped: false,
            projectId: projectId,
            snapshotId: 'snapshot-1',
            staticUrl: null,
            status: 'SUCCESS',
            statusUpdatedAt: '2024-01-01T10:05:00Z',
            suggestAddServiceDomain: true,
            updatedAt: '2024-01-01T10:05:00Z',
            url: 'https://api.example.com'
          },
          {
            id: 'deploy-2',
            canRedeploy: true,
            canRollback: true,
            createdAt: '2024-01-02T10:00:00Z',
            deploymentStopped: false,
            projectId: projectId,
            snapshotId: 'snapshot-2',
            staticUrl: null,
            status: 'BUILDING',
            statusUpdatedAt: '2024-01-02T10:01:00Z',
            suggestAddServiceDomain: false,
            updatedAt: '2024-01-02T10:01:00Z',
            url: null
          }
        ]
      })

      expect(services[1].deployments).toEqual([])

      expect(mockGraphQLClient.request).toHaveBeenCalledWith(
        expect.stringContaining('query listServices'),
        { projectId }
      )
    })

    it('should handle project with no services', async () => {
      const projectId = 'empty-project'
      const mockResponse = {
        project: {
          services: {
            edges: []
          }
        }
      }

      vi.mocked(mockGraphQLClient.request).mockResolvedValue(mockResponse)

      const services = await railwayClient.listServices(projectId)

      expect(services).toHaveLength(0)
      expect(services).toEqual([])
    })
  })

  describe('createService', () => {
    it('should create a service with repo source', async () => {
      const projectId = 'test-project-id'
      const source = { repo: 'railwayapp-templates/django' }

      const mockResponse = {
        serviceCreate: {
          id: 'new-service-id',
          name: 'django-service',
          createdAt: '2024-01-01T00:00:00Z',
          deletedAt: null,
          projectId: projectId,
          updatedAt: '2024-01-01T00:00:00Z'
        }
      }

      vi.mocked(mockGraphQLClient.request).mockResolvedValue(mockResponse)

      const service = await railwayClient.createService(projectId, source)

      expect(service).toEqual({
        id: 'new-service-id',
        name: 'django-service',
        createdAt: '2024-01-01T00:00:00Z',
        deletedAt: null,
        projectId: projectId,
        updatedAt: '2024-01-01T00:00:00Z',
        deployments: []
      })

      expect(mockGraphQLClient.request).toHaveBeenCalledWith(
        expect.stringContaining('mutation createService'),
        { projectId, source }
      )
    })

    it('should create a service with image source', async () => {
      const projectId = 'test-project-id'
      const source = { image: 'nginx:latest' }

      const mockResponse = {
        serviceCreate: {
          id: 'nginx-service-id',
          name: 'nginx-service',
          createdAt: '2024-01-01T00:00:00Z',
          deletedAt: null,
          projectId: projectId,
          updatedAt: '2024-01-01T00:00:00Z'
        }
      }

      vi.mocked(mockGraphQLClient.request).mockResolvedValue(mockResponse)

      const service = await railwayClient.createService(projectId, source)

      expect(service).toEqual({
        id: 'nginx-service-id',
        name: 'nginx-service',
        createdAt: '2024-01-01T00:00:00Z',
        deletedAt: null,
        projectId: projectId,
        updatedAt: '2024-01-01T00:00:00Z',
        deployments: []
      })

      expect(mockGraphQLClient.request).toHaveBeenCalledWith(
        expect.stringContaining('mutation createService'),
        { projectId, source }
      )
    })

    it('should handle service creation errors', async () => {
      const projectId = 'test-project-id'
      const source = { repo: 'invalid-repo' }

      const error = new Error('Repository not found')
      vi.mocked(mockGraphQLClient.request).mockRejectedValue(error)

      await expect(
        railwayClient.createService(projectId, source)
      ).rejects.toThrow('Repository not found')
    })
  })
})
