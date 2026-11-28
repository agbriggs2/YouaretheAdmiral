import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@fontsource/antonio/latin-400.css";
import "@fontsource/antonio/latin-600.css";
import "@fontsource/antonio/latin-700.css";
import "@fontsource/roboto-condensed/latin-400.css";
import "@fontsource/roboto-condensed/latin-400-italic.css";
import "@fontsource/roboto-condensed/latin-500.css";
import "@fontsource/roboto-condensed/latin-600.css";
import './index.css'
import Root from './Root.tsx'

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
    <Root />
  </StrictMode>,
)
