import { useAuth } from '@/contexts/AuthContext'
import { ChatPage } from './ChatPage'

export function ChatPageRoute() {
  const { user } = useAuth()
  if (!user) return null
  return <ChatPage key={user.id} userId={user.id} userEmail={user.email} />
}
