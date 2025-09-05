export interface ChatDto {
  id: string
  title: string
  messages: {
    content: string
    createdAt: number
    role: 'user' | 'assistant' | 'system'
  }[]
}
