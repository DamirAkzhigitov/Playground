import { RouterProvider } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'
import { AppRouter } from './router'

function App() {
  return (
    <>
      <RouterProvider router={AppRouter} />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
