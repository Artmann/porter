import { tool, type ToolSet } from 'ai'
import invariant from 'tiny-invariant'
import { log } from 'tiny-typescript-logger'
import { z } from 'zod'

import { GraphQLClient } from '~/graphql-client'
import { RailwayClient } from '~/railway-client'

function createRailwayClient(): RailwayClient {
  const apiEndpoint = 'https://backboard.railway.app/graphql/v2'
  const apiToken = process.env.RAILWAY_API_TOKEN

  invariant(apiToken, 'RAILWAY_API_TOKEN is not set.')

  const graphQLClient = new GraphQLClient(apiEndpoint, apiToken)
  const railwayClient = new RailwayClient(graphQLClient)

  return railwayClient
}

const createService = tool({
  description: 'Create a new Railway service in a given project.',
  inputSchema: z.object({
    dockerImage: z.string().optional(),
    projectId: z.string().min(1, 'Project ID is required.'),
    repository: z.string().optional()
  }),
  execute: async ({ dockerImage, projectId, repository }) => {
    log.info('[Tool] Create Service', {
      dockerImage,
      projectId,
      repository
    })

    try {
      if (!repository && !dockerImage) {
        return {
          error: 'Either repository or dockerImage must be provided.'
        }
      }

      const source = {
        image: dockerImage,
        repo: repository
      }

      const service = await createRailwayClient().createService(
        projectId,
        source
      )

      return service
    } catch (error) {
      console.error('Error creating service:', error)

      return { error: 'Failed to create service. Please try again later.' }
    }
  }
})

const listProjects = tool({
  description: 'List all your Railway projects.',
  inputSchema: z.object({}),
  execute: async () => {
    log.info('[Tool] List Projects')

    try {
      const projects = await createRailwayClient().listProjects()

      return projects
    } catch (error) {
      console.error('Error listing projects:', error)

      return { error: 'Failed to fetch projects. Please try again later.' }
    }
  }
})

const listServices = tool({
  description: 'List all services for a given Railway project.',
  inputSchema: z.object({
    projectId: z.string().min(1, 'Project ID is required.')
  }),
  execute: async ({ projectId }) => {
    log.info('[Tool] List Services', { projectId })

    try {
      const services = await createRailwayClient().listServices(projectId)

      return services
    } catch (error) {
      console.error('Error listing services:', error)

      return { error: 'Failed to fetch services. Please try again later.' }
    }
  }
})

export const tools: ToolSet = {
  createService,
  listProjects,
  listServices
}
