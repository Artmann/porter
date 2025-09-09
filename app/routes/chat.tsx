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
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '~/lib/utils'
import type { Route } from './+types/chat'
import { ArrowBigUp, Clock, CheckCircle, XCircle, Loader2, ListTodo, X } from 'lucide-react'
import type { ChatDto } from '~/chat/chat'
import type { Task } from '~/models/chat'

export async function loader({ params, request }: Route.LoaderArgs) {
  const chatId = params.chatId

  invariant(chatId, 'Chat ID is required.')

  const searchParams = new URL(request.url).searchParams
  const initialPrompt = searchParams.get('prompt') || undefined

  const chatService = new ChatService()
  const chat = await chatService.find(chatId)

  return { chat, initialPrompt }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    {
      title: data?.chat?.title ? `${data.chat.title} - Porter` : 'Porter'
    }
  ]
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

  const [tasks, setTasks] = useState<ChatDto['tasks']>(loaderData?.chat?.tasks || [])
  const [isMobileTasksOpen, setIsMobileTasksOpen] = useState(false)

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

  useEffect(() => {
    if (!loaderData?.chat?.id) {
      return
    }

    const pollInterval = 1_000
    
    let intervalId: NodeJS.Timeout

    const pollForUpdates = async () => {
      try {
        const response = await fetch(`/api/chats/${loaderData.chat!.id}`)
        
        if (response.ok) {
          const data = await response.json()
        
          if (data.chat.title !== loaderData.chat!.title) {
            document.title = `${data.chat.title} - Porter`
          }

          setTasks(data.chat.tasks || [])
        }
      } catch (error) {
        console.warn('Failed to poll for chat updates:', error)
      }
    }

    intervalId = setInterval(pollForUpdates, pollInterval)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [loaderData?.chat?.id, loaderData?.chat?.title, loaderData.chat])

  if (!loaderData?.chat) {
    return (
      <div className="p-8">
        <div>Chat not found</div>
      </div>
    )
  }

  return (
    <div className="w-full text-sm h-screen overflow-hidden relative">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-full">
        {/* Chat Section */}
        <div className="flex flex-col w-full h-full overflow-hidden">
          <div
            className="w-full flex-1 min-h-0 overflow-y-auto"
            ref={chatMessagesRef}
          >
            <div className="w-full max-w-4xl mx-auto p-4">
              <ChatMessages messages={messages} />
            </div>
          </div>

          <div className="w-full max-w-4xl mx-auto p-4">
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
                  <div className="lg:hidden">
                    {tasks.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMobileTasksOpen(true)}
                        className="gap-2"
                      >
                        <ListTodo className="h-4 w-4" />
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
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

        {/* Desktop Task Sidebar */}
        <div className="hidden lg:flex flex-col border-l bg-gray-50/50 h-full">
          <TaskList tasks={tasks} />
        </div>
      </div>

      {/* Mobile Task Overlay */}
      {isMobileTasksOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMobileTasksOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-gray-50/50 border-l flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-white">
              <div>
                <h2 className="font-semibold text-lg">Tasks</h2>
                <p className="text-sm text-muted-foreground">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileTasksOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <TaskList tasks={tasks} isMobile />
            </div>
          </div>
        </div>
      )}
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

function TaskList({ tasks, isMobile = false }: { tasks: Task[]; isMobile?: boolean }): ReactElement {
  return (
    <div className="flex flex-col h-full min-h-0">
      {!isMobile && (
        <div className="flex-shrink-0 p-4 border-b bg-white">
          <h2 className="font-semibold text-lg">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">No tasks yet</p>
                <p className="text-xs">Tasks will appear here as work begins</p>
              </div>
            ) : (
              <>
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
                {/* Add some bottom padding for mobile */}
                {isMobile && <div className="pb-4" />}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function TaskItem({ task }: { task: Task }): ReactElement {
  const getTaskIcon = () => {
    if (task.isRunning) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    
    switch (task.state) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'failure':
        return <XCircle className="h-4 w-4" />
      case 'pending':
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTaskBadgeVariant = () => {
    if (task.isRunning) return 'secondary'
    
    switch (task.state) {
      case 'success':
        return 'default' // Green
      case 'failure':
        return 'destructive' // Red
      case 'pending':
      default:
        return 'outline' // Gray
    }
  }

  const getTaskStatus = () => {
    if (task.isRunning) return 'Running'
    
    switch (task.state) {
      case 'success':
        return 'Complete'
      case 'failure':
        return 'Failed'
      case 'pending':
      default:
        return 'Pending'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="bg-white rounded-lg border p-3 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-2">
        <div className={cn(
          "mt-0.5 flex-shrink-0",
          task.isRunning && "text-blue-600",
          task.state === 'success' && "text-green-600",
          task.state === 'failure' && "text-red-600",
          task.state === 'pending' && "text-gray-400"
        )}>
          {getTaskIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed break-words">
            {task.text}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <Badge variant={getTaskBadgeVariant()} className="text-xs">
          {getTaskStatus()}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatTime(task.updatedAt)}
        </span>
      </div>
    </div>
  )
}
