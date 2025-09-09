import { openai } from '@ai-sdk/openai'
import {
  TypeValidationError,
  convertToModelMessages,
  stepCountIs,
  streamText,
  validateUIMessages,
  type ToolSet
} from 'ai'
import { data } from 'react-router'

import type { Route } from './+types/messages'
import { ChatService } from '~/chat/chat-service.server'
import { tools } from '~/chat/tools'

export async function action({ request }: Route.ActionArgs) {
  const { id, messages } = await request.json()

  const chatService = new ChatService()
  const chat = await chatService.find(id)

  if (!chat) {
    return data({ error: 'Chat not found.' }, { status: 404 })
  }

  const validatedMessages = await validateMessages(messages)

  const result = streamText({
    messages: convertToModelMessages(validatedMessages),
    model: openai('gpt-4.1'),
    system: createSystemPrompt(tools),
    stopWhen: stepCountIs(10),
    tools
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages }) => {
      const messagesToSave = messages.map((msg: any) => ({
        id: msg.id || crypto.randomUUID(),
        createdAt: Date.now(),
        content: msg.parts?.find((p: any) => p.type === 'text')?.text || '',
        parts: msg.parts || [],
        role: msg.role
      }))

      await chatService.updateMessages(chat.id, messagesToSave)
    }
  })
}

const createSystemPrompt = (tools: ToolSet) => `
  You are Porter, an AI assistant that helps users manage their Railway projects and services.

  - Try to help the user by deploying Railway services.
  - Use existing public Docker images if the are suitable.
  - Don't ask questions unless absolutely necessary. Bias towards action.
  - Use existing an existing project.
  - When deploying a service from a Docker image, use the following format: "alexwhen/docker-2048".
  - When deploying a service from a repository, use the following format: "railwayapp-templates/django".
  - When deploying a service, wait for it to be deployed before sharing the URL with the user.
  - Before starting, create a todo list of steps you need to take to complete the user's request.
  - Be concise and to the point.
  - Only ask for confirmation for destructive actions.

  You have access to the following tools:
  ${Object.keys(tools)
    .map((toolName) => `- ${toolName}`)
    .join('\n')}
`

async function validateMessages(messages: any[]) {
  try {
    const validatedMessages = await validateUIMessages({
      messages
    })

    return validatedMessages
  } catch (error) {
    if (error instanceof TypeValidationError) {
      console.error('Database messages validation failed:', error)

      return []
    }

    throw error
  }
}
