import clsx from 'clsx'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { CircleCheck, FileText, ListChecks, ShieldCheck } from 'lucide-react'
import { Fwd } from '../components/ui'
import { CARD, CHIP, LIFT } from './kit'
import { useLang, type Text } from '../i18n/lang'
import { HELD_OUT } from '../data/eval-set'
import { extractRules, type Extraction } from '../lib/extract/rules'
import { scoreItem, summarise, type Summary } from '../lib/extract/score'

const ICONS = [FileText, CircleCheck, ListChecks, ShieldCheck]

/** Claude's last evaluation run on this machine, if the team ran one (see the evaluation page). */
function cachedClaude(): { model: string; summary: Summary } | null {
  try {
    const raw = localStorage.getItem('mb.eval.ai.v1')
    if (!raw) return null
    const run = JSON.parse(raw) as { model: string; items: { id: string; extraction: Extraction | null }[] }
    const scored = HELD_OUT.flatMap((it) => {
      const x = run.items.find((r) => r?.id === it.id)?.extraction
      return x ? [scoreItem(it, x)] : []
    })
    return scored.length === HELD_OUT.length ? { model: run.model, summary: summarise(scored) } : null
  } catch {
    return null
  }
}

/** The evaluation's headline numbers, computed live from the held-out reports. */
export function EvalStrip() {
  const { lang, t, n } = useLang()
  const ar = lang === 'ar'
  const rules = useMemo(() => summarise(HELD_OUT.map((it) => scoreItem(it, extractRules(it.text)))), [])
  const claude = useMemo(cachedClaude, [])
  const pct = (s: Summary) => `${Math.round((s.fieldsCorrect / s.fieldsTotal) * 100)}%`

  const figs: { value: string; label: Text; sub?: string }[] = [
    { value: n(HELD_OUT.length), label: { ar: 'بلاغًا محجوزًا كُتبت بعد تجميد القواعد', en: 'held-out reports, written after the rules were frozen' } },
    {
      value: claude ? `${n(claude.summary.outcomeCorrect)}/${n(claude.summary.n)}` : `${n(rules.outcomeCorrect)}/${n(rules.n)}`,
      label: claude ? { ar: 'نتيجة الزيارة صحيحة مع Claude', en: 'visit outcomes right with Claude' } : { ar: 'نتيجة الزيارة صحيحة بالقواعد وحدها', en: 'visit outcomes right with rules alone' },
      sub: claude ? (ar ? `القواعد: ${n(rules.outcomeCorrect)}/${n(rules.n)}` : `Rules: ${n(rules.outcomeCorrect)}/${n(rules.n)}`) : undefined,
    },
    {
      value: claude ? pct(claude.summary) : pct(rules),
      label: claude ? { ar: 'من الحقول العشرة صحيحة مع Claude', en: 'of all ten fields right with Claude' } : { ar: 'من الحقول العشرة صحيحة بالقواعد', en: 'of all ten fields right with rules' },
      sub: claude ? (ar ? `القواعد: ${pct(rules)}` : `Rules: ${pct(rules)}`) : undefined,
    },
    { value: n((claude?.summary.unsupported ?? 0) + rules.unsupported), label: { ar: 'حقل ظهر دون كلمات الطاقم', en: 'fields shown without the crew’s words' } },
  ]

  return (
    <figure className="mt-6">
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {figs.map((f, i) => {
          const Icon = ICONS[i]
          return (
          <div key={i} className={clsx(CARD, LIFT, 'flex min-w-0 flex-col p-4 sm:p-5')}>
            <span className={clsx(CHIP, 'mb-4 size-9 sm:size-10')}><Icon className="size-[18px]" aria-hidden /></span>
            <dd className="num font-display text-[clamp(1.9rem,3.3vw,2.9rem)] font-semibold leading-none text-navy-900" dir="ltr" data-num="">{f.value}</dd>
            <dt className="mt-3 max-w-[26ch] text-[13.5px] leading-snug text-ink-2 sm:text-[14.5px]">{t(f.label)}</dt>
            {f.sub && <p className="mt-2.5 w-fit rounded-full bg-canvas px-2.5 py-0.5 font-mono text-[11.5px] text-ink-soft ring-1 ring-hair">{f.sub}</p>}
          </div>
          )
        })}
      </dl>
      <figcaption className="caption mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <span>
          {claude
            ? ar ? `آخر تشغيل على هذا الجهاز: ${claude.model}. البلاغات اصطناعية، والإجابات كتبناها بأيدينا.` : `Last run on this machine: ${claude.model}. Reports are synthetic; the answers were written by hand.`
            : ar ? 'البلاغات اصطناعية والإجابات كتبناها بأيدينا. أرقام Claude تظهر هنا بعد تشغيل التقييم بمفتاح.' : 'Reports are synthetic; the answers were written by hand. Claude’s numbers appear here once the evaluation is run with a key.'}
        </span>
        <Link to="/app/eval" className="inline-flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 font-semibold text-signal-700 shadow-[0_1px_2px_rgb(1_28_71/0.06)] ring-1 ring-signal-100 transition-colors hover:bg-signal-50">
          {ar ? 'التقييم كاملًا، بلاغًا بلاغًا' : 'The full evaluation, report by report'} <Fwd className="size-3.5" />
        </Link>
      </figcaption>
    </figure>
  )
}
