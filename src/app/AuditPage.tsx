import { useLang } from '../i18n/lang'
import { Card, Page } from './AppShell'
import { AuditPanel } from './Panels'

export default function AuditPage() {
  const { lang } = useLang()
  const ar = lang === 'ar'
  return (
    <Page title={ar ? 'سجل التدقيق' : 'Audit trail'} subtitle={ar ? 'كل خطوة مسجّلة: من أرسل الفريق، ومن أبلغ، وماذا قال، ومن اعتمد، ومتى.' : 'Every step on record: who sent the crew, who reported, what they said, who approved, and when.'}>
      <Card pad={false}>
        <AuditPanel />
      </Card>
    </Page>
  )
}
