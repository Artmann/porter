import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('/chat', 'routes/new-chat.tsx'),
  route('/chats/:chatId', 'routes/chat.tsx')
] satisfies RouteConfig
