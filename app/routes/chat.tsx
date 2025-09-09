import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement
} from 'react'
import Markdown from 'react-markdown'
import invariant from 'tiny-invariant'

import { ChatService } from '~/chat/chat-service.server'
import { Textarea } from '~/components/ui/textarea'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import type { Route } from './+types/chat'
import { ArrowBigUp } from 'lucide-react'

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
  const { messages, sendMessage, status } = useChat({
    id: loaderData?.chat?.id,
    messages:
      loaderData?.chat?.messages?.map((msg: any) => ({
        id: msg.id || crypto.randomUUID(),
        role: msg.role,
        content: msg.content,
        parts: msg.parts || [{ type: 'text', text: msg.content }]
      })) || [],
    transport: new DefaultChatTransport({
      api: `/api/messages`
    })
  })

  const [input, setInput] = useState('')

  const formRef = useRef<HTMLFormElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  const scrollToTheBottomOfTheMessages = useCallback(() => {
    chatMessagesRef.current?.scrollTo({
      top: chatMessagesRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          return
        }

        e.preventDefault()

        formRef.current?.requestSubmit()
      }
    },
    []
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (input.trim()) {
        sendMessage({ text: input })
        setInput('')

        scrollToTheBottomOfTheMessages()
      }
    },
    [input, sendMessage, scrollToTheBottomOfTheMessages]
  )

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

  useEffect(() => {
    scrollToTheBottomOfTheMessages()
  }, [scrollToTheBottomOfTheMessages])

  if (!loaderData?.chat) {
    return (
      <div className="p-8">
        <div>Chat not found</div>
      </div>
    )
  }

  return (
    <div className="w-full text-sm">
      <div className="flex flex-col w-full h-screen overflow-hidden">
        <div
          className="w-full flex-1 min-h-0 overflow-y-auto"
          ref={chatMessagesRef}
        >
          <div
            className={`
            w-full max-w-4xl
            mx-auto p-4
          `}
          >
            <ChatMessages messages={messages} />
          </div>
        </div>

        <div
          className={`
            w-full max-w-4xl
            mx-auto p-4
          `}
        >
          <form
            ref={formRef}
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-2">
              <div>
                <Textarea
                  className="max-h-[10rem]"
                  disabled={status !== 'ready'}
                  placeholder="Ask anything"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div className="flex justify-between items-center">
                <div></div>
                <div>
                  <Button
                    disabled={status !== 'ready' || input.trim().length === 0}
                    size="icon"
                    type="submit"
                  >
                    <ArrowBigUp />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const ChatMessages = memo(function ChatMessages({
  messages
}: {
  messages: UIMessage[]
}): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            'w-auto max-w-2/3',
            message.role === 'user' ? 'ml-auto' : 'mr-auto'
          )}
        >
          {message.role === 'user' ? (
            <UserMessage message={message} />
          ) : (
            <AssistantMessage message={message} />
          )}
        </div>
      ))}
    </div>
  )
})

function UserMessage({ message }: { message: UIMessage }): ReactElement {
  return (
    <div className="bg-gray-50 px-4 py-2 rounded-md prose prose-sm">
      <Markdown>
        {(message.parts || [])
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('\n')}
      </Markdown>
    </div>
  )
}

function AssistantMessage({ message }: { message: UIMessage }): ReactElement {
  return (
    <div className="px-4 py-2 rounded-md prose prose-sm">
      <Markdown>
        {(message.parts || [])
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('\n')}
      </Markdown>
    </div>
  )
}
