import { openai } from '@ai-sdk/openai'
import {
  convertToModelMessages,
  streamText,
  TypeValidationError,
  validateUIMessages,
  type UIMessage
} from 'ai'
import { data } from 'react-router'

import type { Route } from './+types/messages'
import { ChatService } from '~/services/chat.server'

export async function action({ request }: Route.ActionArgs) {
  const { id, messages } = await request.json()

  const chatService = new ChatService()
  const chat = await chatService.find(id)

  if (!chat) {
    return data({ error: 'Chat not found.' }, { status: 404 })
  }

  console.dir({ chat })

  const validatedMessages = await validateMessages(messages)

  console.dir({ messages, validatedMessages })

  const result = streamText({
    model: openai('gpt-4.1'),
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(validatedMessages)
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages }) => {
      await chatService.updateMessages(chat.id, messages)
    }
  })
}

async function validateMessages(messages: any[]) {
  try {
    const validatedMessages = await validateUIMessages({
      messages,
      tools: {}
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
