import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useState } from 'react'
import invariant from 'tiny-invariant'

import { ChatService } from '~/services/chat.server'
import type { Route } from './+types/chat'
import { ScrollArea } from '~/components/ui/scroll-area'

export async function loader({ params, request }: Route.LoaderArgs) {
  const chatId = params.chatId

  invariant(chatId, 'Chat ID is required.')

  const searchParams = new URL(request.url).searchParams
  const initialPrompt = searchParams.get('prompt') || undefined

  const chatService = new ChatService()
  const chat = await chatService.find(chatId)

  return { chat, initialPrompt }
}

export default function ChatRoute({ loaderData }: Route.ComponentProps) {
  console.log(loaderData)

  const { messages, sendMessage, status } = useChat({
    id: loaderData?.chat?.id,
    messages: loaderData?.chat?.messages || [],
    transport: new DefaultChatTransport({
      api: `/api/messages`
    })
  })

  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (input.trim()) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  useEffect(
    function sendInitialPrompt() {
      if (
        loaderData?.initialPrompt &&
        messages.length === 0 &&
        status === 'ready'
      ) {
        sendMessage({ text: loaderData.initialPrompt })
      }
    },
    [loaderData?.initialPrompt, messages, sendMessage, status]
  )

  if (!loaderData?.chat) {
    return (
      <div className="p-8">
        <div>Chat not found</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col w-full h-screen">
        <div className="flex-1 min-h-0 p-4">
          <ScrollArea>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'user' ? 'User: ' : 'AI: '}
                {message.parts.map((part, index) =>
                  part.type === 'text' ? (
                    <span key={index}>{part.text}</span>
                  ) : null
                )}
              </div>
            ))}
          </ScrollArea>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== 'ready'}
              placeholder="Say something..."
            />
            <button
              type="submit"
              disabled={status !== 'ready'}
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
