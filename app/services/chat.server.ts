import invariant from 'tiny-invariant'
import type { ChatDto } from '~/glue/chat'
import { Chat } from '~/models/chat'

export class ChatService {
  async create(prompt: string): Promise<ChatDto> {
    const chat = await Chat.create({
      messages: [
        {
          createdAt: Date.now(),
          content: prompt,
          role: 'user'
        }
      ],
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

  private transformChat(chat: Chat): ChatDto {
    return {
      id: chat.id,
      title: chat.title,
      messages: chat.messages
    }
  }
}
