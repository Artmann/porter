import { BaseModel } from 'esix'

export interface Message {
  id: string
  createdAt: number
  content: string
  parts: any[]
  role: 'user' | 'assistant' | 'system'
}

export class Chat extends BaseModel {
  messages: Message[] = []
  title: string = 'New Chat'
}
