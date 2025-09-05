import { ChatService } from '~/services/chat.server'
import type { Route } from './+types/chat'

export async function loader({ params }: Route.LoaderArgs) {
  const chatId = params.chatId

  const chatService = new ChatService()
  const chat = await chatService.find(chatId)

  return { chat }
}

export default function ChatRoute({ loaderData }: Route.ComponentProps) {
  if (!loaderData?.chat) {
    return (
      <div className="p-8">
        <div>Chat not found</div>
      </div>
    )
  }

  return <div>Chat Route</div>
}
