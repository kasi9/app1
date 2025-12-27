import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AppContextProvider } from './context/AppContext.tsx'
import { UserProvider } from './context/UserContext.tsx'
import { ToastContainer } from 'react-toastify'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter>
      <AppContextProvider>
        <UserProvider>   
          <ToastContainer position="top-right" autoClose={3000} />
          <App/>
        </UserProvider>
      </AppContextProvider>
      </BrowserRouter>
  </StrictMode>,
)
