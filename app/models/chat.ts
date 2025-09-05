import { BaseModel } from 'esix'

interface Message {
  content: string
  createdAt: number
  role: 'user' | 'assistant' | 'system'
}

export class Chat extends BaseModel {
  messages: Message[] = []
  title: string = 'New Chat'
}
