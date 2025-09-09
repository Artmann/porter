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
import { createTools } from '~/chat/tools'

export async function loader() {
  return data({ error: 'Method not allowed. Use POST to send messages.' }, { status: 405 })
}

export async function action({ request }: Route.ActionArgs) {
  const { id, messages } = await request.json()

  const chatService = new ChatService()
  const chat = await chatService.find(id)

  if (!chat) {
    return data({ error: 'Chat not found.' }, { status: 404 })
  }

  const validatedMessages = await validateMessages(messages)
  const toolsWithChatId = createTools(id)

  const result = streamText({
    messages: convertToModelMessages(validatedMessages),
    model: openai('gpt-4.1'),
    system: createSystemPrompt(toolsWithChatId),
    stopWhen: stepCountIs(30),
    tools: toolsWithChatId
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
  - Use existing public Docker images if they are suitable.
  - Don't ask questions unless absolutely necessary. Bias towards action.
  - Use existing projects when possible.
  - When deploying a service from a Docker image, use the following format: "alexwhen/docker-2048".
  - When deploying a service from a repository, use the following format: "railwayapp-templates/django".
  - When deploying a service, wait for it to be deployed before sharing the URL with the user.
  - Be concise and to the point.
  - Only ask for confirmation for destructive actions.

  CRITICAL TASK WORKFLOW - Follow this exact process for all work:

  1. **INITIAL SETUP:**
     - IMMEDIATELY update the chat title using updateChatTitle tool with a descriptive title like "Deploy Django App" or "Create 2048 Game Service"
     - Break down the user's request into specific, actionable tasks
     - Use createTask tool to create each task in the order they need to be completed
     - Tell the user: "I've created a task list to track our progress. Let me start working on this step by step."

  2. **FOR EACH TASK:**
     a) Tell the user: "Starting task: [task description]"
     b) Use updateTask tool to set the task to isRunning: true
     c) Perform the actual work using the appropriate tools
     d) Use completeTask tool to mark the task as 'success' or 'failure'
     e) Tell the user: "Completed task: [task description] - [success/failure]"
     f) If failure, explain what went wrong and how you'll handle it

  3. **AFTER ALL TASKS:**
     - Give the user a comprehensive summary of what was accomplished
     - List all completed tasks with their outcomes
     - Provide any important URLs, IDs, or next steps
     - Ask if there's anything else they need help with

  COMMUNICATION RULES:
  - Always keep the user informed about what you're doing
  - Explain your progress in simple terms
  - Show enthusiasm and confidence
  - Be conversational but professional

  You have access to the following tools:
  ${Object.keys(tools)
    .map((toolName) => `- ${toolName}`)
    .join('\n')}

  Remember: The user can see the task list updating in real-time in their sidebar, so make sure to properly manage task states!
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
