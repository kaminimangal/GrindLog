import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { CategoryProvider } from './context/CategoryContext'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/*
          CategoryProvider sits inside AuthProvider because it calls useAuth().
          It sits outside App so every page in the router can access categories
          without fetching them individually.
        */}
        <CategoryProvider>
          <App />
        </CategoryProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)