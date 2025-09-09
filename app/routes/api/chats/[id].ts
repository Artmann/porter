import { data } from 'react-router'

import { ChatService } from '~/chat/chat-service.server'

export async function loader({ params }: { params: { id: string } }) {
  const { id } = params

  if (!id) {
    return data({ error: 'Chat ID is required.' }, { status: 400 })
  }

  const chatService = new ChatService()
  const chat = await chatService.find(id)

  if (!chat) {
    return data({ error: 'Chat not found.' }, { status: 404 })
  }

  return data({ chat })
}
