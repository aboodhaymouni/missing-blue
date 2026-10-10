import clsx from 'clsx'
import { Fragment, useMemo } from 'react'
import { Quote } from 'lucide-react'
import { useLang } from '../i18n/lang'
import { FIELD_ORDER, type Extraction, type Field } from '../lib/extract/rules'

export type FieldKey = (typeof FIELD_ORDER)[number]['key']

export const FIELD_COLOR: Record<string, string> = {
  outcome: '#ff6a4d',
  asset: '#7c8cd6',
  lineName: '#7c8cd6',
  material: '#a777ff',
  diameter: '#2a9bff',
  location: '#1fb672',
  depth: '#e29a12',
  count: '#ec5b8f',
  flow: '#19b3d8',
  missingFromMap: '#ff6a4d',
}

function fieldsOf(x: Extraction) {
  return FIELD_ORDER.map(({ key, label }) => ({ key, label, f: x[key] as Field<unknown> | null }))
}

/** The crew's original words, with each extracted field's source span marked in the field's colour. */
export function ReportHighlighter({ text, extraction, active, onHover, className }: { text: string; extraction: Extraction | null; active?: string | null; onHover?: (k: string | null) => void; className?: string }) {
  const runs = useMemo(() => {
    const owner: (string | null)[] = Array.from({ length: text.length }, () => null)
    if (extraction) {
      for (const { key, f } of fieldsOf(extraction)) {
        if (!f) continue
        for (const e of f.evidence) for (let i = e.start; i < Math.min(e.end, text.length); i++) if (!owner[i]) owner[i] = key
      }
    }
    const out: { key: string | null; s: string }[] = []
    for (let i = 0; i < text.length; i++) {
      const k = owner[i]
      if (out.length && out[out.length - 1].key === k) out[out.length - 1].s += text[i]
      else out.push({ key: k, s: text[i] })
    }
    return out
  }, [text, extraction])

  return (
    <p className={clsx('whitespace-pre-wrap text-[17px] leading-[2.05]', className)} dir="rtl" lang="ar">
      {runs.map((r, i) =>
        r.key ? (
          <mark
            key={i}
            onMouseEnter={() => onHover?.(r.key)}
            onMouseLeave={() => onHover?.(null)}
            className="px-0.5 text-inherit transition-[background,box-shadow] duration-200"
            style={{
              background: `color-mix(in oklab, ${FIELD_COLOR[r.key]} ${active === r.key ? 30 : active ? 6 : 16}%, transparent)`,
              boxShadow: `inset 0 -2px 0 ${FIELD_COLOR[r.key]}${active && active !== r.key ? '40' : ''}`,
            }}
          >
            {r.s}
          </mark>
        ) : (
          <Fragment key={i}>{r.s}</Fragment>
        ),
      )}
    </p>
  )
}

/** Extracted fields. Empty fields are shown as empty — never guessed. */
export function FieldsTable({ extraction, active, onHover, compact = false, className }: { extraction: Extraction; active?: string | null; onHover?: (k: string | null) => void; compact?: boolean; className?: string }) {
  const { t, lang } = useLang()
  return (
    <dl className={clsx('divide-y divide-line', className)}>
      {fieldsOf(extraction).map(({ key, label, f }) => {
        const empty = !f
        return (
          <div
            key={key}
            onMouseEnter={() => !empty && onHover?.(key)}
            onMouseLeave={() => onHover?.(null)}
            className={clsx('grid grid-cols-[7.5rem_1fr] items-start gap-3 py-2.5 transition-colors sm:grid-cols-[8.5rem_1fr]', active === key && 'bg-ink/[0.03]', compact && 'py-2')}
          >
            <dt className="flex items-center gap-2 text-[13px] text-ink-soft">
              <span className="size-2 shrink-0" style={{ background: empty ? 'transparent' : FIELD_COLOR[key], border: empty ? '1px dashed var(--color-unconfirmed)' : 'none' }} aria-hidden />
              {t(label)}
            </dt>
            <dd className="min-w-0">
              {empty ? (
                <span className="inline-flex items-center gap-1.5 border border-dashed border-line-strong px-2 py-0.5 text-[12.5px] text-ink-soft">
                  {lang === 'ar' ? 'فارغ — لم يُذكر' : 'Empty — not mentioned'}
                </span>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx('text-[14.5px] font-semibold', f!.uncertain ? 'text-ink-2' : 'text-ink')}>{t(f!.label)}</span>
                    {f!.uncertain && (
                      <span className="border border-dashed border-candidate px-1.5 text-[11px] font-semibold text-candidate-ink">{lang === 'ar' ? 'يحتاج تأكيد' : 'to confirm'}</span>
                    )}
                    {f!.candidates?.length ? <span className="font-mono text-[11.5px] text-ink-soft" dir="ltr">{f!.candidates.join(' / ')}</span> : null}
                  </div>
                  {!compact && (
                    <div className="flex flex-wrap gap-1.5">
                      {f!.evidence.slice(0, 3).map((e, i) => (
                        <span key={i} className="inline-flex max-w-full items-center gap-1 truncate bg-canvas px-1.5 py-0.5 text-[12px] text-ink-2" lang="ar" dir="rtl">
                          <Quote className="size-3 shrink-0 opacity-50" aria-hidden />«{e.text}»
                        </span>
                      ))}
                    </div>
                  )}
                  {f!.note && !compact && <p className="text-[12.5px] leading-relaxed text-ink-soft">{t(f!.note)}</p>}
                </div>
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
