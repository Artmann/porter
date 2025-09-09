import uniqueId from 'lodash/uniqueId'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ChatService } from './chat-service.server'
import { Chat } from '~/models/chat'

describe('ChatService', () => {
  let chatService: ChatService

  beforeEach(() => {
    Object.assign(process.env, {
      DB_ADAPTER: 'mock',
      DB_DATABASE: `test-${uniqueId('db-')}`
    })
    chatService = new ChatService()
  })

  afterEach(() => {
    // Clean up is handled automatically by the mock adapter
  })

  describe('updateTitle', () => {
    it('should update chat title successfully', async () => {
      const chat = await Chat.create({
        title: 'Original Title',
        messages: []
      })

      const updatedTitle = 'Deploy Django App'
      const result = await chatService.updateTitle(chat.id, updatedTitle)

      expect(result).toEqual({
        id: chat.id,
        messages: [],
        tasks: [],
        title: updatedTitle
      })

      // Verify the chat was actually updated in the database
      const updatedChat = await Chat.find(chat.id)
      expect(updatedChat?.title).toBe(updatedTitle)
    })

    it('should throw error when chat not found', async () => {
      await expect(
        chatService.updateTitle('nonexistent-chat', 'New Title')
      ).rejects.toThrow('Chat not found')
    })

    it('should throw error when chat ID is not provided', async () => {
      await expect(chatService.updateTitle('', 'New Title')).rejects.toThrow()
    })

    it('should throw error when title is not provided', async () => {
      const chat = await Chat.create({
        title: 'Original Title',
        messages: []
      })

      await expect(chatService.updateTitle(chat.id, '')).rejects.toThrow()
    })

    it('should handle chat with existing messages', async () => {
      const messages = [
        {
          id: 'msg-1',
          createdAt: 1234567890,
          content: 'Hello',
          parts: [{ text: 'Hello', type: 'text' }],
          role: 'user' as const
        }
      ]

      const chat = await Chat.create({
        title: 'Original Title',
        messages
      })

      const updatedTitle = 'Updated Title'
      const result = await chatService.updateTitle(chat.id, updatedTitle)

      expect(result).toEqual({
        id: chat.id,
        messages,
        tasks: [],
        title: updatedTitle
      })
    })
  })

  describe('create', () => {
    it('should create a new chat', async () => {
      const result = await chatService.create()

      expect(result).toEqual({
        id: expect.any(String),
        messages: [],
        tasks: [],
        title: 'New Chat'
      })

      // Verify the chat exists in database
      const chat = await Chat.find(result.id)
      expect(chat).toBeDefined()
      expect(chat?.title).toBe('New Chat')
    })
  })

  describe('find', () => {
    it('should find an existing chat', async () => {
      const chat = await Chat.create({
        title: 'Test Chat',
        messages: []
      })

      const result = await chatService.find(chat.id)

      expect(result).toEqual({
        id: chat.id,
        messages: [],
        tasks: [],
        title: 'Test Chat'
      })
    })

    it('should return undefined for nonexistent chat', async () => {
      const result = await chatService.find('nonexistent-id')
      expect(result).toBeUndefined()
    })
  })

  describe('updateMessages', () => {
    it('should update chat messages', async () => {
      const chat = await Chat.create({
        title: 'Test Chat',
        messages: []
      })

      const messages = [
        {
          id: 'msg-1',
          createdAt: Date.now(),
          content: 'Hello world',
          parts: [{ text: 'Hello world', type: 'text' }],
          role: 'user' as const
        }
      ]

      const result = await chatService.updateMessages(chat.id, messages)

      expect(result).toEqual({
        id: chat.id,
        messages,
        tasks: [],
        title: 'Test Chat'
      })

      // Verify messages were saved
      const updatedChat = await Chat.find(chat.id)
      expect(updatedChat?.messages).toEqual(messages)
    })

    it('should throw error when chat not found', async () => {
      const messages = [
        {
          id: 'msg-1',
          createdAt: Date.now(),
          content: 'Hello',
          parts: [{ text: 'Hello', type: 'text' }],
          role: 'user' as const
        }
      ]

      await expect(
        chatService.updateMessages('nonexistent-chat', messages)
      ).rejects.toThrow('Chat not found')
    })
  })

  describe('addTask', () => {
    it('should add a new task to the chat', async () => {
      const chat = await Chat.create({
        title: 'Test Chat',
        messages: []
      })

      const taskText = 'Deploy to production'
      const result = await chatService.addTask(chat.id, taskText)

      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0]).toEqual({
        id: expect.any(String),
        text: taskText,
        isRunning: false,
        state: 'pending',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      })

      // Verify task was saved to database
      const updatedChat = await Chat.find(chat.id)
      expect(updatedChat?.tasks).toHaveLength(1)
      expect(updatedChat?.tasks[0].text).toBe(taskText)
    })

    it('should throw error when chat not found', async () => {
      await expect(
        chatService.addTask('nonexistent-chat', 'Test task')
      ).rejects.toThrow('Chat not found')
    })

    it('should throw error when task text is empty', async () => {
      const chat = await Chat.create({
        title: 'Test Chat',
        messages: []
      })

      await expect(chatService.addTask(chat.id, '')).rejects.toThrow()
    })
  })

  describe('updateTask', () => {
    it('should update task properties', async () => {
      const chat = await Chat.create({
        title: 'Test Chat',
        messages: [],
        tasks: []
      })

      // Add a task first
      const taskResult = await chatService.addTask(chat.id, 'Original task')
      const taskId = taskResult.tasks[0].id

      // Update the task
      const updates = {
        text: 'Updated task text',
        isRunning: true,
        state: 'success' as const
      }
      const result = await chatService.updateTask(chat.id, taskId, updates)

      const updatedTask = result.tasks.find((t) => t.id === taskId)
      expect(updatedTask).toEqual({
        id: taskId,
        text: 'Updated task text',
        isRunning: true,
        state: 'success',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      })
    })

    it('should throw error when chat not found', async () => {
      await expect(
        chatService.updateTask('nonexistent-chat', 'task-id', {})
      ).rejects.toThrow('Chat not found')
    })

    it('should throw error when task not found', async () => {
      const chat = await Chat.create({
        title: 'Test Chat',
        messages: [],
        tasks: []
      })

      await expect(
        chatService.updateTask(chat.id, 'nonexistent-task', {})
      ).rejects.toThrow('Task not found')
    })
  })

  describe('completeTask', () => {
    it('should complete task with success state', async () => {
      const chat = await Chat.create({
        title: 'Test Chat',
        messages: [],
        tasks: []
      })

      // Add a task first
      const taskResult = await chatService.addTask(chat.id, 'Test task')
      const taskId = taskResult.tasks[0].id

      const result = await chatService.completeTask(chat.id, taskId, 'success')

      const completedTask = result.tasks.find((t) => t.id === taskId)
      expect(completedTask).toEqual({
        id: taskId,
        text: 'Test task',
        isRunning: false,
        state: 'success',
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      })
    })

    it('should complete task with failure state', async () => {
      const chat = await Chat.create({
        title: 'Test Chat',
        messages: [],
        tasks: []
      })

      // Add a task first
      const taskResult = await chatService.addTask(chat.id, 'Test task')
      const taskId = taskResult.tasks[0].id

      const result = await chatService.completeTask(chat.id, taskId, 'failure')

      const completedTask = result.tasks.find((t) => t.id === taskId)
      expect(completedTask?.state).toBe('failure')
      expect(completedTask?.isRunning).toBe(false)
    })

    it('should throw error when chat not found', async () => {
      await expect(
        chatService.completeTask('nonexistent-chat', 'task-id', 'success')
      ).rejects.toThrow('Chat not found')
    })

    it('should throw error when task not found', async () => {
      const chat = await Chat.create({
        title: 'Test Chat',
        messages: [],
        tasks: []
      })

      await expect(
        chatService.completeTask(chat.id, 'nonexistent-task', 'success')
      ).rejects.toThrow('Task not found')
    })
  })
})
