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
        title: updatedTitle,
        messages: []
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
        title: updatedTitle,
        messages
      })
    })
  })

  describe('create', () => {
    it('should create a new chat', async () => {
      const result = await chatService.create()

      expect(result).toEqual({
        id: expect.any(String),
        title: 'New Chat',
        messages: []
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
        title: 'Test Chat',
        messages: []
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
        title: 'Test Chat',
        messages
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
})
