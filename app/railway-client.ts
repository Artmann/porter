import type { GraphQLClient } from './graphql-client'

export interface RailwayProject {
  createdAt: string
  deletedAt: string | null
  description: string | null
  id: string
  isPublic: boolean
  name: string
}

export interface RailwayService {
  createdAt: string
  deletedAt: string | null
  deployments: RailwayDeployment[]
  id: string
  name: string
  projectId: string
  updatedAt: string
}

export interface RailwayDeployment {
  canRedeploy: boolean
  canRollback: boolean
  createdAt: string
  deploymentStopped: boolean
  id: string
  projectId: string
  snapshotId: string | null
  staticUrl: string | null
  status: string
  statusUpdatedAt: string | null
  suggestAddServiceDomain: boolean
  updatedAt: string
  url: string | null
}

export interface ServiceCreateInput {
  projectId: string
  source?: {
    repo?: string
    image?: string
  }
  name?: string
  branch?: string
}

export class RailwayClient {
  constructor(protected readonly graphQlClient: GraphQLClient) {}

  async createService(
    projectId: string,
    source: { repo?: string; image?: string }
  ): Promise<RailwayService> {
    const data = await this.graphQlClient.request<any>(createServiceMutation, {
      projectId,
      source
    })

    return data.serviceCreate as RailwayService
  }

  async listProjects(): Promise<RailwayProject[]> {
    const data = await this.graphQlClient.request<any>(listProjectsQuery)

    const workspaces = data.me.workspaces

    const projects = workspaces.flatMap((workspace: any) =>
      workspace.team.projects.edges.map((e: any) => e.node)
    )

    return projects as RailwayProject[]
  }

  async listServices(projectId: string): Promise<RailwayService[]> {
    const data = await this.graphQlClient.request<any>(listServicesQuery, {
      projectId
    })

    const services = data.project.services.edges.map((edge: any) => {
      const node = edge.node
      return {
        ...node,
        deployments: node.deployments.edges.map((e: any) => e.node)
      }
    })

    return services as RailwayService[]
  }

  async findDeployment(deploymentId: string): Promise<RailwayDeployment | null> {
    const data = await this.graphQlClient.request<any>(findDeploymentQuery, {
      deploymentId
    })

    if (!data.deployment) {
      return null
    }

    return data.deployment as RailwayDeployment
  }
}

const createServiceMutation = `
  mutation createService($projectId: String!, $source: ServiceSourceInput!) {
    serviceCreate(
      input: {
        projectId: $projectId
        source: $source
      }
    ) {
      createdAt
      deletedAt
      id
      name
      projectId
      updatedAt
    }
  }
`

const listProjectsQuery = `
  query {
    me {
      workspaces {
        team {
          projects {
            edges {
              node {
                createdAt
                deletedAt
                description
                id
                isPublic
                name
              }
            }
          }
        }
      }
    }
  }
`

const listServicesQuery = `
  query listServices($projectId: String!) {
    project(id: $projectId) {
      services {
        edges {
          node {
            createdAt
            deletedAt
            id
            name
            projectId
            updatedAt
            deployments {
              edges {
                node {
                  canRedeploy
                  canRollback
                  createdAt
                  deploymentStopped
                  id
                  projectId
                  snapshotId
                  staticUrl
                  status
                  statusUpdatedAt
                  suggestAddServiceDomain
                  updatedAt
                  url
                }
              }
            }
          }
        }
      }
    }
  }
`

const findDeploymentQuery = `
  query findDeployment($deploymentId: String!) {
    deployment(id: $deploymentId) {
      canRedeploy
      canRollback
      createdAt
      deploymentStopped
      id
      projectId
      snapshotId
      staticUrl
      status
      statusUpdatedAt
      suggestAddServiceDomain
      updatedAt
      url
    }
  }
`
