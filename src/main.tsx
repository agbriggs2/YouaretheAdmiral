import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Label stacked table cells on narrow screens.
new MutationObserver(() => {
  for (const c of document.querySelectorAll<HTMLTableCellElement>('.stack td:not([data-l])')) {
    let i = 0
    let p: Element | null = c
    while ((p = p.previousElementSibling)) i += (p as HTMLTableCellElement).colSpan
    c.dataset.l = c.closest('table')?.rows[0].cells[i]?.textContent || ''
  }
}).observe(document, { childList: true, subtree: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
