import { registerGlobalHeader } from '@playground/global-header'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import { queryClient } from './lib/queryClient'

registerGlobalHeader()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
