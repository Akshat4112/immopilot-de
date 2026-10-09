import type { ReactNode } from 'react'

interface PageLayoutProps {
  eyebrow: string
  title: string
  summary: string
  wide?: boolean
  children?: ReactNode
}

export function PageLayout({ eyebrow, title, summary, wide = false, children }: PageLayoutProps) {
  return (
    <section className="route-page" aria-labelledby="route-page-title">
      <div className={`route-page-copy${wide ? ' route-page-copy--wide' : ''}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="route-page-title">{title}</h1>
        <p className="route-page-summary">{summary}</p>
        {children}
      </div>
    </section>
  )
}
