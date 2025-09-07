import { redirect } from 'react-router'

import type { Route } from './+types/new-chat'
import { ChatService } from '~/chat/chat-service.server'

export async function loader({ request }: Route.LoaderArgs) {
  const searchParams = new URL(request.url).searchParams

  const chatService = new ChatService()

  const chat = await chatService.create()

  return redirect(`/chats/${chat.id}?${searchParams.toString()}`)
}
