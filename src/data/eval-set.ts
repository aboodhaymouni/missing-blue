/**
 * Evaluation set for report extraction. Every report is SYNTHETIC (written by the team in
 * Jordanian field Arabic) and hand-labelled for all ten fields.
 *
 * - DEV (10): the demo reports. The rules engine was written while looking at these.
 * - HELD_OUT (25): written on 2026-10-10 after the rules engine was frozen. No rule was changed
 *   after seeing how it scores here, and the AI prompt does not contain any of these texts.
 *
 * Label conventions (the same ones the rules and the AI prompt use):
 *   material   Miyahuna code, or 'PLASTIC' when the crew says plastic without the type
 *   diameter   mm as Miyahuna records it (plastic by outside diameter, metal by nominal bore),
 *              or 'UNRESOLVED' when an inch size is given without the material
 *   location   metres from a stated reference, or 'LANDMARK' when only a landmark is given
 *   count      only when the crew states a number
 *   null       the report does not state it
 */
import type { Asset, Flow, Outcome } from '../lib/extract/rules'
import { SAMPLE_REPORTS } from './reports'

export type Expected = {
  outcome: Outcome | null
  asset: Asset | null
  lineName: 'Disi' | 'KAC' | 'Zara-Maain' | null
  material: string | null
  diameter: number | 'UNRESOLVED' | null
  location: number | 'LANDMARK' | null
  depth: number | null
  count: number | null
  flow: Flow | null
  missingFromMap: true | null
}

export type EvalItem = { id: string; text: string; expected: Expected }

const E = (x: Partial<Expected>): Expected => ({
  outcome: null, asset: null, lineName: null, material: null, diameter: null,
  location: null, depth: null, count: null, flow: null, missingFromMap: null, ...x,
})

const devLabels: Record<string, Expected> = {
  'R-01': E({ outcome: 'illegal_connection', asset: 'main_line', material: 'PLASTIC', diameter: 63, location: 15 }),
  'R-02': E({ outcome: 'leak', asset: 'air_valve', location: 40, flow: 'gush' }),
  'R-03': E({ outcome: 'licensed_use' }),
  'R-04': E({ outcome: 'nothing_found' }),
  'R-05': E({ outcome: 'illegal_connection', asset: 'main_line', material: 'PLASTIC', diameter: 32, depth: 0.5 }),
  'R-06': E({ outcome: 'leak', material: 'SP', diameter: 100, location: 'LANDMARK', flow: 'drip' }),
  'R-07': E({ outcome: 'illegal_connection', asset: 'service_line', material: 'PVC', diameter: 25, count: 2, missingFromMap: true }),
  'R-08': E({ outcome: 'leak', material: 'GP', diameter: 150, depth: 0.8, flow: 'wet_ground' }),
  'R-09': E({ outcome: 'nothing_found', asset: 'meter' }),
  'R-10': E({ outcome: 'illegal_connection', asset: 'air_valve', lineName: 'Disi', location: 'LANDMARK', flow: 'gush' }),
}

export const DEV: EvalItem[] = SAMPLE_REPORTS.map((r) => ({ id: r.id, text: r.text, expected: devLabels[r.id] }))

export const HELD_OUT: EvalItem[] = [
  { id: 'EV-01', text: 'لقينا وصلة مخالفة بولي 1 انش على خط الديسي، رايحة لمزرعة، ومش مرسومة ع الخريطة', expected: E({ outcome: 'illegal_connection', asset: 'main_line', lineName: 'Disi', material: 'PE', diameter: 32, missingFromMap: true }) },
  { id: 'EV-02', text: 'في كسر بماسورة حديد ٦ انش والمي بتسيل ع الشارع، العمق تقريبا متر ونص، جنب محطة المحروقات', expected: E({ outcome: 'leak', material: 'SP', diameter: 150, location: 'LANDMARK', depth: 1.5, flow: 'stream' }) },
  { id: 'EV-03', text: 'فحصنا المزرعة، عندهم اشتراك نظامي ومعهم رخصة، كل اشي قانوني', expected: E({ outcome: 'licensed_use' }) },
  { id: 'EV-04', text: 'مشينا على المسار 3 كيلو، ما في ولا تسريب، الارض ناشفة', expected: E({ outcome: 'nothing_found' }) },
  { id: 'EV-05', text: 'ثلاث وصلات غير مرخصة PVC ثلاث ارباع انش، مدفونات على عمق 50 سم', expected: E({ outcome: 'illegal_connection', material: 'PVC', diameter: 25, depth: 0.5, count: 3 }) },
  { id: 'EV-06', text: 'محبس الهوا مضروب والمي طالعة نافورة، على بعد 120 متر من الجسر', expected: E({ outcome: 'leak', asset: 'air_valve', location: 120, flow: 'gush' }) },
  { id: 'EV-07', text: 'لقينا بربيش مسحوب من الخط الرئيسي، ومكان الوصلة في تسريب بسيط بتنقط', expected: E({ outcome: 'illegal_connection', asset: 'main_line', material: 'PLASTIC', flow: 'drip' }) },
  { id: 'EV-08', text: 'الحمد لله الوضع سليم ما لقينا اي اشي غريب بالمنطقة', expected: E({ outcome: 'nothing_found' }) },
  { id: 'EV-09', text: 'الارض مبلولة وفي طين، حفرنا ولقينا خط مجلفن انشين مشروخ على عمق 60 سم', expected: E({ outcome: 'leak', material: 'GP', diameter: 50, depth: 0.6, flow: 'wet_ground' }) },
  { id: 'EV-10', text: 'وصلتين اعتداء على خط الزارا، الضغط عالي والمي بتطلع بقوة من وحدة منهم', expected: E({ outcome: 'illegal_connection', asset: 'main_line', lineName: 'Zara-Maain', count: 2, flow: 'gush' }) },
  { id: 'EV-11', text: 'الخط اللي شفناه بالصورة طلع مرخص، ما في وصلات مخالفة', expected: E({ outcome: 'licensed_use' }) },
  { id: 'EV-12', text: 'تسريب من ماسورة 110 ملم، على بعد 30 متر من دوار القطرانة، المي بتشرشر', expected: E({ outcome: 'leak', diameter: 110, location: 30, flow: 'stream' }) },
  { id: 'EV-13', text: 'العداد معكوس والزلمة ساحب مي قبل العداد بوصلة غير قانونية', expected: E({ outcome: 'illegal_connection', asset: 'meter' }) },
  { id: 'EV-14', text: 'فحصنا النقطة اللي على بعد ٢٠٠ متر من الطريق الصحراوي، ما في اشي', expected: E({ outcome: 'nothing_found', location: 200 }) },
  { id: 'EV-15', text: 'في ماسورة 2 انش مركبة على الخط الرئيسي بدون ترخيص، داخلة على بركة زراعية', expected: E({ outcome: 'illegal_connection', asset: 'main_line', diameter: 'UNRESOLVED' }) },
  { id: 'EV-16', text: 'في نزيز من جدار قناة الملك عبدالله قرب الجسر، المية بتنقط', expected: E({ outcome: 'leak', asset: 'canal', lineName: 'KAC', location: 'LANDMARK', flow: 'drip' }) },
  { id: 'EV-17', text: 'illegal connection HDPE 63 ملم على الخط الناقل، مش موجودة عالسيستم', expected: E({ outcome: 'illegal_connection', asset: 'main_line', material: 'HDPE', diameter: 63, missingFromMap: true }) },
  { id: 'EV-18', text: 'ما في تعدي ولا تسريب، كله تمام', expected: E({ outcome: 'nothing_found' }) },
  { id: 'EV-19', text: 'الخط الفرعي للبيوت بنقط من الوصلة، عمقه 40 سم', expected: E({ outcome: 'leak', asset: 'service_line', depth: 0.4, flow: 'drip' }) },
  { id: 'EV-20', text: 'تنك ماء بعبي من محبس هوا خط الديسي بدون رخصة', expected: E({ outcome: 'illegal_connection', asset: 'air_valve', lineName: 'Disi' }) },
  { id: 'EV-21', text: 'كسر بخط دكتايل 4 انش على بعد 75 متر من المسجد، والمي بتسيل', expected: E({ outcome: 'leak', material: 'DIP', diameter: 100, location: 75, flow: 'stream' }) },
  { id: 'EV-22', text: 'الوصلة بولي 2 انش بس مرخصة ولها اشتراك نظامي', expected: E({ outcome: 'licensed_use', material: 'PE', diameter: 63 }) },
  { id: 'EV-23', text: 'الرطوبة اللي بالصورة من المطر، ما لقينا تسريب', expected: E({ outcome: 'nothing_found' }) },
  { id: 'EV-24', text: '4 وصلات مخالفة على خط فرعي جديد، والخط كله مش مرسوم على الخارطة', expected: E({ outcome: 'illegal_connection', asset: 'service_line', count: 4, missingFromMap: true }) },
  { id: 'EV-25', text: 'ماسورة اسبست قديمة مكسورة على عمق متر، المي نازلة ع الوادي', expected: E({ outcome: 'leak', material: 'AC', depth: 1, flow: 'stream' }) },
]
