import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AppContextProvider } from './context/AppContextProvider.tsx'

import { ToastContainer } from 'react-toastify'

import { UserContextProvider } from './context/UserContextProvider.tsx'
import { LoadingContextProvider } from './context/LoadingContextProvider.tsx'

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>     
      <LoadingContextProvider>
        <AppContextProvider>
          <UserContextProvider>   
            <App/>
            <ToastContainer position="top-right" autoClose={3000} />
          </UserContextProvider>
        </AppContextProvider>
      </LoadingContextProvider>
    </BrowserRouter>
  </StrictMode>,
)
