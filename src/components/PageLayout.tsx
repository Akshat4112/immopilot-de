import type { ReactNode } from 'react'

interface PageLayoutProps {
  eyebrow: string
  title: string
  summary: string
  children?: ReactNode
}

export function PageLayout({ eyebrow, title, summary, children }: PageLayoutProps) {
  return (
    <section className="route-page" aria-labelledby="route-page-title">
      <div className="route-page-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="route-page-title">{title}</h1>
        <p className="route-page-summary">{summary}</p>
        {children}
      </div>
    </section>
  )
}
