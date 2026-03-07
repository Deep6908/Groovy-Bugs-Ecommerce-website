import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

// Get your Clerk Publishable Key from environment variables
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// ClerkProvider requires a valid key - undefined causes black screen. Show setup message if missing.
if (!clerkPubKey) {
  const root = document.getElementById('root')
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:monospace;padding:2rem;text-align:center">
      <h1 style="font-size:1.5rem;margin-bottom:1rem">Groovy Bugs</h1>
      <p style="color:#6c4f8c;margin-bottom:1rem">Clerk publishable key is missing.</p>
      <p style="font-size:0.9rem;color:#888;max-width:480px">
        Create a <code style="background:#1a1a1a;padding:2px 6px;border-radius:4px">.env</code> file in the project root with:<br>
        <code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;display:inline-block;margin-top:8px">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</code>
      </p>
      <p style="font-size:0.85rem;color:#666;margin-top:1.5rem">Get your key from <a href="https://dashboard.clerk.com" target="_blank" rel="noopener" style="color:#6c4f8c">clerk.com</a></p>
    </div>
  `
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkPubKey}>
        <App />
      </ClerkProvider>
    </React.StrictMode>,
  )
}