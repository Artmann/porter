import { redirect } from 'react-router'

import type { Route } from './+types/new-chat'
import { ChatService } from '~/services/chat.server'

export async function loader({ request }: Route.LoaderArgs) {
  const searchParams = new URL(request.url).searchParams
  const prompt = searchParams.get('prompt') || undefined

  if (!prompt) {
    return redirect('/')
  }

  const chatService = new ChatService()

  const chat = await chatService.create(prompt)

  return redirect(`/chat/${chat.id}`)
}
