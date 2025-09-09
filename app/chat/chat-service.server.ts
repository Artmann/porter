import { randomUUID } from 'crypto'
import invariant from 'tiny-invariant'
import { log } from 'tiny-typescript-logger'

import type { ChatDto } from './chat'
import { Chat, type Message, type Task } from '~/models/chat'

export class ChatService {
  async addTask(id: string, text: string): Promise<ChatDto> {
    log.info(`Adding task to chat ${id}: "${text}"`)

    invariant(id, 'Chat ID is required')
    invariant(text, 'Task text is required')

    const chat = await Chat.find(id)

    if (!chat) {
      throw new Error('Chat not found')
    }

    const now = Date.now()
    const task: Task = {
      createdAt: now,
      id: randomUUID(),
      isRunning: false,
      state: 'pending',
      text,
      updatedAt: now
    }

    chat.tasks.push(task)
    await chat.save()

    return this.transformChat(chat)
  }

  async completeTask(
    id: string,
    taskId: string,
    state: 'success' | 'failure'
  ): Promise<ChatDto> {
    log.info(`Completing task ${taskId} in chat ${id} with state: ${state}`)

    invariant(id, 'Chat ID is required')
    invariant(taskId, 'Task ID is required')
    invariant(state, 'Task state is required')

    const chat = await Chat.find(id)

    if (!chat) {
      throw new Error('Chat not found')
    }

    const task = chat.tasks.find((t) => t.id === taskId)

    if (!task) {
      throw new Error('Task not found')
    }

    task.isRunning = false
    task.state = state
    task.updatedAt = Date.now()

    await chat.save()

    return this.transformChat(chat)
  }

  async create(): Promise<ChatDto> {
    const chat = await Chat.create({
      messages: [],
      tasks: [],
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

  async updateTitle(id: string, title: string): Promise<ChatDto> {
    log.info(`Updating the title for chat ${id} to "${title}".`)

    invariant(id, 'Chat ID is required')
    invariant(title, 'Title is required')

    const chat = await Chat.find(id)

    if (!chat) {
      throw new Error('Chat not found')
    }

    chat.title = title

    await chat.save()

    return this.transformChat(chat)
  }

  async updateTask(
    id: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<ChatDto> {
    log.info(`Updating task ${taskId} in chat ${id}`, { updates })

    invariant(id, 'Chat ID is required')
    invariant(taskId, 'Task ID is required')

    const chat = await Chat.find(id)

    if (!chat) {
      throw new Error('Chat not found')
    }

    const task = chat.tasks.find((t) => t.id === taskId)

    if (!task) {
      throw new Error('Task not found')
    }

    if (updates.isRunning !== undefined) {
      task.isRunning = updates.isRunning
    }
   
    if (updates.state !== undefined) {
      task.state = updates.state
    }
   
    if (updates.text !== undefined) {
      task.text = updates.text
    }

    task.updatedAt = Date.now()

    await chat.save()

    return this.transformChat(chat)
  }

  private transformChat(chat: Chat): ChatDto {
    return {
      id: chat.id,
      messages: chat.messages,
      tasks: chat.tasks,
      title: chat.title
    }
  }
}
