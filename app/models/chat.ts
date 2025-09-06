import { BaseModel } from 'esix'

interface Message {
  createdAt: number
  parts: {
    text: string
    type: string
  }[]
  role: 'user' | 'assistant' | 'system'
}

export class Chat extends BaseModel {
  messages: Message[] = []
  title: string = 'New Chat'
}
