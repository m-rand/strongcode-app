'use client'

import { useTranslations } from 'next-intl'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SubpageHeader } from '@/components/SubpageHeader'

type TextBlock = { type: 'text'; content: string; bold?: boolean; accent?: boolean }
type ListBlock = { type: 'list'; items: string[] }
type TitledListBlock = { type: 'titled-list'; items: { title: string; content: string }[] }
type MarkdownBlock = { type: 'markdown'; content: string }
type ImageBlock = {
  type: 'image'
  src: string
  alt: string
  caption?: string
}
type TableBlock = {
  type: 'table'
  caption?: string
  description?: string
  headers: string[]
  rows: string[][]
}
type QuoteBlock = {
  type: 'quote'
  text: string
  author?: string
}
type CalloutBlock = {
  type: 'callout'
  content: string
  tone?: 'default' | 'accent'
}
type ContentBlock =
  | TextBlock
  | ListBlock
  | TitledListBlock
  | MarkdownBlock
  | ImageBlock
  | TableBlock
  | QuoteBlock
  | CalloutBlock

type Section = {
  title: string
  blocks: ContentBlock[]
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="content-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-body">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="font-semibold underline underline-offset-4"
              style={{ color: 'var(--accent-primary)' }}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="content-markdown-list">{children}</ul>,
          ol: ({ children }) => <ol className="content-markdown-ordered-list">{children}</ol>,
          li: ({ children }) => <li className="text-body">{children}</li>,
          table: ({ children }) => (
            <div className="content-table-wrap">
              <table className="content-table">{children}</table>
            </div>
          ),
          th: ({ children }) => <th>{children}</th>,
          td: ({ children }) => {
            const text = String(children).trim()
            const isFilled = text.length > 0
            return <td className={isFilled ? 'is-filled' : undefined}>{children}</td>
          },
          blockquote: ({ children }) => (
            <blockquote className="content-blockquote">{children}</blockquote>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src ?? ''}
              alt={alt ?? ''}
              className="content-image"
            />
          ),
          hr: () => <hr className="content-divider" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'text':
      if (block.accent) {
        return (
          <p className="text-body font-semibold italic" style={{ color: 'var(--accent-primary)' }}>
            {block.content}
          </p>
        )
      }
      if (block.bold) {
        return (
          <p className="text-body font-semibold" style={{ color: 'var(--text-primary)' }}>
            {block.content}
          </p>
        )
      }
      return <p className="text-body">{block.content}</p>

    case 'list':
      return (
        <ul className="space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-body">
              <span
                className="mt-2 w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: 'var(--accent-primary)' }}
              />
              {item}
            </li>
          ))}
        </ul>
      )

    case 'titled-list':
      return (
        <ul className="space-y-4">
          {block.items.map((item, i) => (
            <li key={i} className="text-body">
              <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {item.title}
              </strong>{' '}
              {item.content}
            </li>
          ))}
        </ul>
      )

    case 'markdown':
      return <MarkdownContent content={block.content} />

    case 'image':
      return (
        <figure className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.src}
            alt={block.alt}
            className="content-image"
          />
          {block.caption ? (
            <figcaption className="text-meta">{block.caption}</figcaption>
          ) : null}
        </figure>
      )

    case 'table':
      return (
        <figure className="space-y-4">
          {block.caption ? (
            <figcaption className="space-y-1">
              <div className="text-sm font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--text-primary)' }}>
                {block.caption}
              </div>
              {block.description ? (
                <p className="text-meta">{block.description}</p>
              ) : null}
            </figcaption>
          ) : block.description ? (
            <figcaption className="text-meta">{block.description}</figcaption>
          ) : null}

          <div className="content-table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  {block.headers.map((header, i) => (
                    <th key={i} className={i === 0 ? 'is-row-header' : undefined}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={[
                          j === 0 ? 'is-row-header' : '',
                          cell.trim().length > 0 ? 'is-filled' : '',
                        ].filter(Boolean).join(' ') || undefined}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      )

    case 'quote':
      return (
        <figure
          className="rounded-lg px-6 py-6 md:px-8"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <blockquote className="text-body italic" style={{ color: 'var(--text-primary)' }}>
            &ldquo;{block.text}&rdquo;
          </blockquote>
          {block.author ? (
            <figcaption className="text-meta mt-3">{block.author}</figcaption>
          ) : null}
        </figure>
      )

    case 'callout':
      return (
        <div
          className="rounded-lg border px-6 py-5"
          style={{
            background: block.tone === 'accent' ? 'rgba(246, 93, 46, 0.08)' : 'var(--bg-secondary)',
            borderColor: block.tone === 'accent' ? 'var(--accent-primary)' : 'var(--border-color)',
          }}
        >
          <MarkdownContent content={block.content} />
        </div>
      )
  }
}

export default function ContentPage({ pageKey }: { pageKey: string }) {
  const t = useTranslations(pageKey)
  const sections = t.raw('sections') as Section[]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <SubpageHeader />

      <main className="py-20 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">

          <div className="mb-12 md:mb-16">
            <h1 className="page-title uppercase mb-8" style={{ color: 'var(--text-primary)' }}>
              {t('titleLine1')}<br />
              <span style={{ color: 'var(--accent-primary)' }}>{t('titleLine2')}.</span>
            </h1>
            <p className="text-subtitle max-w-2xl">{t('subtitle')}</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {sections.map((section, i) => (
              <section key={i} className="mb-16 md:mb-24">
                <h2 className="subsection-title mb-6">{section.title}</h2>
                <div className="space-y-5 max-w-2xl">
                  {section.blocks.map((block, j) => (
                    <BlockRenderer key={j} block={block} />
                  ))}
                </div>
              </section>
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}
