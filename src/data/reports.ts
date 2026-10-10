/**
 * SYNTHETIC crew reports, written for the demo in Jordanian field Arabic. They are labelled
 * synthetic everywhere they appear. `expected` is the hand-labelled answer used for evaluation.
 */
import type { Text } from '../i18n/lang'

export type SampleReport = {
  id: string
  title: Text
  text: string
  channel: 'voice' | 'text' | 'photo'
  crew: string
  expected: {
    outcome: 'illegal_connection' | 'leak' | 'licensed_use' | 'nothing_found' | null
    material: string | null // code, 'PLASTIC?' for ambiguous plastic, or null
    diameter: number | null
    depth: number | null
    distance: number | null
  }
}

export const SAMPLE_REPORTS: SampleReport[] = [
  {
    id: 'R-01',
    title: { ar: 'وصلة 2 إنش', en: '2-inch tap' },
    text: 'لقينا وصلة غير مرخصة 2 إنش بلاستيك على الخط الرئيسي، على بعد 15 متر من الشارع',
    channel: 'voice',
    crew: 'C3',
    expected: { outcome: 'illegal_connection', material: 'PLASTIC?', diameter: 63, depth: null, distance: 15 },
  },
  {
    id: 'R-02',
    title: { ar: 'محبس هواء', en: 'Air valve' },
    text: 'في تسريب من محبس الهوا، المي طالعة بقوة وعاملة بركة كبيرة، على بعد 40 متر من الطريق الصحراوي',
    channel: 'voice',
    crew: 'C1',
    expected: { outcome: 'leak', material: null, diameter: null, depth: null, distance: 40 },
  },
  {
    id: 'R-03',
    title: { ar: 'مزرعة مرخّصة', en: 'Licensed farm' },
    text: 'المزرعة مرخصة واشتراكها نظامي، ما في اعتداء',
    channel: 'text',
    crew: 'C2',
    expected: { outcome: 'licensed_use', material: null, diameter: null, depth: null, distance: null },
  },
  {
    id: 'R-04',
    title: { ar: 'لا شيء', en: 'Nothing found' },
    text: 'ما لقينا اشي، المنطقة ناشفة وكل اشي سليم',
    channel: 'text',
    crew: 'C1',
    expected: { outcome: 'nothing_found', material: null, diameter: null, depth: null, distance: null },
  },
  {
    id: 'R-05',
    title: { ar: 'بربيش مسحوب', en: 'Hose tap' },
    text: 'لقينا بربيش اسود 1 انش مسحوب من الخط الناقل لخزان قريب، على عمق نص متر تقريبا',
    channel: 'voice',
    crew: 'C3',
    expected: { outcome: 'illegal_connection', material: 'PLASTIC?', diameter: 32, depth: 0.5, distance: null },
  },
  {
    id: 'R-06',
    title: { ar: 'كسر حديد', en: 'Steel break' },
    text: 'كسر بخط حديد 4 انش، بتنقط شوي، جنب العداد',
    channel: 'text',
    crew: 'C4',
    expected: { outcome: 'leak', material: 'SP', diameter: 100, depth: null, distance: null },
  },
  {
    id: 'R-07',
    title: { ar: 'وصلتان مخالفتان', en: 'Two taps' },
    text: 'وصلتين مخالفات بي في سي 3/4 انش على الخط الفرعي، الخط مش مرسوم على الخريطة',
    channel: 'photo',
    crew: 'C2',
    expected: { outcome: 'illegal_connection', material: 'PVC', diameter: 25, depth: null, distance: null },
  },
  {
    id: 'R-08',
    title: { ar: 'رطوبة في الصحراء', en: 'Wet desert' },
    text: 'ريحة رطوبة وأعشاب خضرا بنص الصحرا، حفرنا لقينا خط ٦ انش مجلفن مكسور على عمق 80 سم',
    channel: 'voice',
    crew: 'C1',
    expected: { outcome: 'leak', material: 'GP', diameter: 150, depth: 0.8, distance: null },
  },
  {
    id: 'R-09',
    title: { ar: 'عدّاد سليم', en: 'Meter fine' },
    text: 'ما في تسريب، العداد شغال تمام',
    channel: 'text',
    crew: 'C4',
    expected: { outcome: 'nothing_found', material: null, diameter: null, depth: null, distance: null },
  },
  {
    id: 'R-10',
    title: { ar: 'خط الديسي', en: 'Disi valve' },
    text: 'اعتداء على محبس هوا خط الديسي قرب القطرانة، المي نافورة، في تنك ماء واقف جنبه',
    channel: 'voice',
    crew: 'C1',
    expected: { outcome: 'illegal_connection', material: null, diameter: null, depth: null, distance: null },
  },
]

export const CHANNEL_LABEL: Record<SampleReport['channel'], Text> = {
  voice: { ar: 'صوت', en: 'Voice' },
  text: { ar: 'نص', en: 'Text' },
  photo: { ar: 'صورة + نص', en: 'Photo + text' },
}
