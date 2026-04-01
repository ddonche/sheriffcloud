import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './themes/spur/spur.css'
import './themes/spur/blog.css'
import './themes/spur/serial.css'
import App from './App'

const router = createBrowserRouter([
  { path: '*', element: <App /> }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
