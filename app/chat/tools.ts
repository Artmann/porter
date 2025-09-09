import { type ToolSet, tool } from 'ai'
import invariant from 'tiny-invariant'
import { log } from 'tiny-typescript-logger'
import { z } from 'zod'

import { ChatService } from '~/chat/chat-service.server'
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

      // Extract the latest deployment ID if available
      let latestDeploymentId = null
      if (service.deployments.length > 0) {
        latestDeploymentId = service.deployments[0].id
      }

      return {
        ...service,
        latestDeploymentId,
        message: latestDeploymentId
          ? `Service created successfully. Latest deployment ID: ${latestDeploymentId}`
          : 'Service created successfully. No deployment initiated yet.'
      }
    } catch (error) {
      console.error('Error creating service:', error)

      return { error: 'Failed to create service. Please try again later.' }
    }
  }
})

const createTaskTool = (chatId: string) =>
  tool({
    description: 'Create a new task in the current chat conversation.',
    inputSchema: z.object({
      text: z
        .string()
        .min(1, 'Task text is required.')
        .max(200, 'Task text must be 200 characters or less.')
    }),
    execute: async ({ text }) => {
      log.info('[Tool] Create Task', { chatId, text })

      try {
        const chatService = new ChatService()
        const updatedChat = await chatService.addTask(chatId, text)

        return {
          chat: updatedChat,
          message: `Task created: "${text}"`
        }
      } catch (error) {
        console.error('Error creating task:', error)
        return { error: 'Failed to create task. Please try again later.' }
      }
    }
  })

const createUpdateChatTitleTool = (chatId: string) =>
  tool({
    description: 'Update the title of the current chat conversation.',
    inputSchema: z.object({
      title: z
        .string()
        .min(1, 'Title is required.')
        .max(100, 'Title must be 100 characters or less.')
    }),
    execute: async ({ title }) => {
      log.info('[Tool] Update Chat Title', { chatId, title })

      try {
        const chatService = new ChatService()
        const updatedChat = await chatService.updateTitle(chatId, title)

        return {
          chat: updatedChat,
          message: `Chat title updated to: "${title}"`
        }
      } catch (error) {
        console.error('Error updating chat title:', error)
        return { error: 'Failed to update chat title. Please try again later.' }
      }
    }
  })

const createUpdateTaskTool = (chatId: string) =>
  tool({
    description: 'Update a task in the current chat conversation.',
    inputSchema: z.object({
      taskId: z.string().min(1, 'Task ID is required.'),
      text: z.string().optional(),
      isRunning: z.boolean().optional(),
      state: z.enum(['pending', 'failure', 'success']).optional()
    }),
    execute: async ({ taskId, text, isRunning, state }) => {
      log.info('[Tool] Update Task', { chatId, taskId, text, isRunning, state })

      try {
        const chatService = new ChatService()
        const updates: any = {}
        if (text !== undefined) updates.text = text
        if (isRunning !== undefined) updates.isRunning = isRunning
        if (state !== undefined) updates.state = state

        const updatedChat = await chatService.updateTask(chatId, taskId, updates)

        return {
          chat: updatedChat,
          message: `Task updated successfully`
        }
      } catch (error) {
        console.error('Error updating task:', error)
        return { error: 'Failed to update task. Please try again later.' }
      }
    }
  })

const createCompleteTaskTool = (chatId: string) =>
  tool({
    description: 'Complete a task in the current chat conversation with success or failure state.',
    inputSchema: z.object({
      taskId: z.string().min(1, 'Task ID is required.'),
      state: z.enum(['success', 'failure'])
    }),
    execute: async ({ taskId, state }) => {
      log.info('[Tool] Complete Task', { chatId, taskId, state })

      try {
        const chatService = new ChatService()
        const updatedChat = await chatService.completeTask(chatId, taskId, state)

        return {
          chat: updatedChat,
          message: `Task completed with state: ${state}`
        }
      } catch (error) {
        console.error('Error completing task:', error)
        return { error: 'Failed to complete task. Please try again later.' }
      }
    }
  })

const createListTasksTool = (chatId: string) =>
  tool({
    description: 'List all tasks in the current chat conversation.',
    inputSchema: z.object({}),
    execute: async () => {
      log.info('[Tool] List Tasks', { chatId })

      try {
        const chatService = new ChatService()
        const chat = await chatService.find(chatId)

        if (!chat) {
          return { error: 'Chat not found. Please try again later.' }
        }

        return {
          tasks: chat.tasks,
          message: `Found ${chat.tasks.length} task(s) in chat`
        }
      } catch (error) {
        console.error('Error listing tasks:', error)
        return { error: 'Failed to list tasks. Please try again later.' }
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

const getServiceDeployment = tool({
  description: 'Get the latest deployment ID for a Railway service.',
  inputSchema: z.object({
    serviceId: z.string().min(1, 'Service ID is required.')
  }),
  execute: async ({ serviceId }) => {
    log.info('[Tool] Get Service Deployment', { serviceId })

    try {
      const deploymentId =
        await createRailwayClient().getLatestDeploymentForService(serviceId)

      if (!deploymentId) {
        return {
          error:
            'No deployments found for this service yet. Deployments may take a moment to initiate after service creation.'
        }
      }

      return {
        deploymentId,
        message: `Latest deployment ID for service: ${deploymentId}`
      }
    } catch (error) {
      console.error('Error getting service deployment:', error)
      return {
        error: 'Failed to get service deployment. Please try again later.'
      }
    }
  }
})

const generateDomain = tool({
  description: 'Generate a public domain for a Railway service.',
  inputSchema: z.object({
    environmentId: z.string().min(1, 'Environment ID is required.'),
    serviceId: z.string().min(1, 'Service ID is required.'),
    targetPort: z
      .number()
      .int()
      .min(1)
      .max(65535, 'Target port must be between 1 and 65535.')
  }),
  execute: async ({ environmentId, serviceId, targetPort }) => {
    log.info('[Tool] Generate Domain', { environmentId, serviceId, targetPort })

    try {
      const domain = await createRailwayClient().createServiceDomain(
        environmentId,
        serviceId,
        targetPort
      )

      return {
        domain,
        message: `Domain created successfully: ${domain.domain || 'Domain is being generated'}`
      }
    } catch (error) {
      console.error('Error creating domain:', error)
      return { error: 'Failed to create domain. Please try again later.' }
    }
  }
})

const listEnvironments = tool({
  description: 'List all environments for a Railway project.',
  inputSchema: z.object({
    projectId: z.string().min(1, 'Project ID is required.')
  }),
  execute: async ({ projectId }) => {
    log.info('[Tool] List Environments', { projectId })

    try {
      const environments =
        await createRailwayClient().listEnvironments(projectId)

      return {
        environments,
        message: `Found ${environments.length} environment(s) for project`
      }
    } catch (error) {
      console.error('Error listing environments:', error)
      return { error: 'Failed to list environments. Please try again later.' }
    }
  }
})

const waitForDeployment = tool({
  description:
    'Wait for a Railway deployment to finish and return its final status.',
  inputSchema: z.object({
    deploymentId: z.string().min(1, 'Deployment ID is required.'),
    maxWaitTime: z.number().optional().default(300) // 5 minutes default
  }),
  execute: async ({ deploymentId, maxWaitTime }) => {
    log.info('[Tool] Wait for Deployment', { deploymentId, maxWaitTime })

    try {
      const startTime = Date.now()
      const maxWaitMs = maxWaitTime * 1000
      const pollInterval = 5000 // Poll every 5 seconds

      while (Date.now() - startTime < maxWaitMs) {
        const deployment =
          await createRailwayClient().findDeployment(deploymentId)

        if (!deployment) {
          return { error: 'Deployment not found.' }
        }

        // Check if deployment is in a terminal state
        const terminalStates = [
          'SUCCESS',
          'FAILED',
          'CANCELLED',
          'CRASHED',
          'REMOVED'
        ]
        if (terminalStates.includes(deployment.status)) {
          log.info('[Tool] Deployment finished', {
            deploymentId,
            status: deployment.status,
            url: deployment.url
          })

          return {
            deployment,
            success: deployment.status === 'SUCCESS',
            message:
              deployment.status === 'SUCCESS'
                ? `Deployment completed successfully. URL: ${deployment.url || 'No URL available yet'}`
                : `Deployment failed with status: ${deployment.status}`
          }
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      }

      return {
        error: `Deployment did not complete within ${maxWaitTime} seconds.`,
        timeout: true
      }
    } catch (error) {
      console.error('Error waiting for deployment:', error)
      return {
        error: 'Failed to check deployment status. Please try again later.'
      }
    }
  }
})

export const createTools = (chatId: string): ToolSet => ({
  completeTask: createCompleteTaskTool(chatId),
  createService,
  createTask: createTaskTool(chatId),
  generateDomain,
  getServiceDeployment,
  listEnvironments,
  listProjects,
  listServices,
  listTasks: createListTasksTool(chatId),
  updateChatTitle: createUpdateChatTitleTool(chatId),
  updateTask: createUpdateTaskTool(chatId),
  waitForDeployment
})

export const tools: ToolSet = {
  createService,
  generateDomain,
  getServiceDeployment,
  listEnvironments,
  listProjects,
  listServices,
  waitForDeployment
}
