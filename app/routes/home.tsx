import { ArrowBigUpDash } from 'lucide-react'
import { useRef } from 'react'

import { Textarea } from '~/components/ui/textarea'
import type { Route } from './+types/home'
import { Button } from '~/components/ui/button'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Porter' },
    { name: 'description', content: 'Talk to me about your containers.' }
  ]
}

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault()

        formRef.current?.requestSubmit()
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="w-full max-w-4xl p-8 pt-16 md:pt-32 mx-auto text-foreground flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">What Do You Want to Deploy?</h1>
          <p className="text-foreground-muted mt-3 max-w-lg mx-auto text-xl">
            All aboard. Just tell me what you need
          </p>
        </div>

        <div>
          <form
            ref={formRef}
            action="chat"
            method="GET"
          >
            <div className="relative">
              <Button
                className="absolute right-2 bottom-2"
                size="icon"
                type="submit"
              >
                <ArrowBigUpDash />
              </Button>

              <Textarea
                className="text-sm h-40"
                name="prompt"
                placeholder="Describe your project"
                onKeyDown={handleKeyDown}
              ></Textarea>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
