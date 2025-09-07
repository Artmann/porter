import invariant from 'tiny-invariant'
import { log } from 'tiny-typescript-logger'

import { Chat, type Message } from '~/models/chat'
import type { ChatDto } from './chat'

export class ChatService {
  async create(): Promise<ChatDto> {
    const chat = await Chat.create({
      messages: [],
      title: 'New Chat'
    })

    return this.transformChat(chat)
  }

  async find(id: string): Promise<ChatDto | undefined> {
    invariant(id, 'Chat ID is required')

    const chat = await Chat.find(id)

    if (!chat) {
      return
    }

    return this.transformChat(chat)
  }

  async updateMessages(id: string, messages: Message[]): Promise<ChatDto> {
    log.info(`Updating the messages for chat ${id}.`)

    invariant(id, 'Chat ID is required')
    invariant(messages, 'Messages are required')

    const chat = await Chat.find(id)

    if (!chat) {
      throw new Error('Chat not found')
    }

    chat.messages = messages

    await chat.save()

    return this.transformChat(chat)
  }

  private transformChat(chat: Chat): ChatDto {
    return {
      id: chat.id,
      title: chat.title,
      messages: chat.messages
    }
  }
}
