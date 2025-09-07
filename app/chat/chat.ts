export interface ChatDto {
  id: string
  title: string
  messages: {
    createdAt: number
    parts: {
      text: string
      type: string
    }[]
    role: 'user' | 'assistant' | 'system'
  }[]
}
