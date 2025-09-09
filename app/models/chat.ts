import { BaseModel } from 'esix'

export interface Message {
  content: string
  createdAt: number
  id: string
  parts: any[]
  role: 'user' | 'assistant' | 'system'
}

export interface Task {
  createdAt: number
  id: string
  isRunning: boolean
  state: 'pending' | 'failure' | 'success'
  text: string
  updatedAt: number
}

export class Chat extends BaseModel {
  messages: Message[] = []
  tasks: Task[] = []
  title: string = 'New Chat'
}
