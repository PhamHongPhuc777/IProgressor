import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ShadcnDemo } from './components/ShadcnDemo.tsx'
// import App from './App.tsx' // swapped out for the disposable shadcn demo below

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShadcnDemo />
  </StrictMode>,
)
