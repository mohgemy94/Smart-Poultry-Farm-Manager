
export type Strain = 'Cobb' | 'Ross' | 'Avian';

export interface DailyData {
  age: number;
  weight: number; // in grams
  dailyFeed: number; // grams per bird
  cumFeed: number; // cumulative grams per bird
  dailyWater: number; // ml per bird (usually 1.6 - 2.0x feed)
}

export const POULTRY_DATA: Record<Strain, DailyData[]> = {
  Cobb: [
    { age: 1, weight: 42, dailyFeed: 13, cumFeed: 13, dailyWater: 24 },
    { age: 2, weight: 57, dailyFeed: 16, cumFeed: 29, dailyWater: 29 },
    { age: 3, weight: 75, dailyFeed: 19, cumFeed: 48, dailyWater: 34 },
    { age: 4, weight: 97, dailyFeed: 23, cumFeed: 71, dailyWater: 41 },
    { age: 5, weight: 125, dailyFeed: 27, cumFeed: 98, dailyWater: 49 },
    { age: 6, weight: 158, dailyFeed: 32, cumFeed: 130, dailyWater: 58 },
    { age: 7, weight: 198, dailyFeed: 37, cumFeed: 167, dailyWater: 67 },
    { age: 10, weight: 334, dailyFeed: 54, cumFeed: 301, dailyWater: 97 },
    { age: 14, weight: 525, dailyFeed: 72, cumFeed: 542, dailyWater: 130 },
    { age: 21, weight: 1056, dailyFeed: 121, cumFeed: 1211, dailyWater: 218 },
    { age: 28, weight: 1756, dailyFeed: 168, cumFeed: 2178, dailyWater: 302 },
    { age: 35, weight: 2548, dailyFeed: 205, cumFeed: 3450, dailyWater: 369 },
    { age: 40, weight: 3125, dailyFeed: 228, cumFeed: 4500, dailyWater: 410 },
  ],
  Ross: [
    { age: 1, weight: 42, dailyFeed: 13, cumFeed: 13, dailyWater: 23 },
    { age: 2, weight: 58, dailyFeed: 16, cumFeed: 29, dailyWater: 28 },
    { age: 3, weight: 77, dailyFeed: 20, cumFeed: 49, dailyWater: 34 },
    { age: 4, weight: 100, dailyFeed: 24, cumFeed: 73, dailyWater: 41 },
    { age: 5, weight: 128, dailyFeed: 28, cumFeed: 101, dailyWater: 48 },
    { age: 6, weight: 161, dailyFeed: 32, cumFeed: 133, dailyWater: 55 },
    { age: 7, weight: 198, dailyFeed: 36, cumFeed: 161, dailyWater: 65 },
    { age: 10, weight: 325, dailyFeed: 52, cumFeed: 290, dailyWater: 94 },
    { age: 14, weight: 526, dailyFeed: 70, cumFeed: 520, dailyWater: 126 },
    { age: 21, weight: 1059, dailyFeed: 118, cumFeed: 1160, dailyWater: 212 },
    { age: 28, weight: 1741, dailyFeed: 163, cumFeed: 2090, dailyWater: 293 },
    { age: 35, weight: 2524, dailyFeed: 198, cumFeed: 3310, dailyWater: 356 },
    { age: 40, weight: 3083, dailyFeed: 220, cumFeed: 4320, dailyWater: 396 },
  ],
  Avian: [
    { age: 1, weight: 42, dailyFeed: 12, cumFeed: 12, dailyWater: 22 },
    { age: 7, weight: 180, dailyFeed: 35, cumFeed: 154, dailyWater: 63 },
    { age: 10, weight: 312, dailyFeed: 50, cumFeed: 280, dailyWater: 90 },
    { age: 14, weight: 520, dailyFeed: 68, cumFeed: 500, dailyWater: 122 },
    { age: 21, weight: 1000, dailyFeed: 115, cumFeed: 1130, dailyWater: 207 },
    { age: 28, weight: 1600, dailyFeed: 160, cumFeed: 2050, dailyWater: 288 },
    { age: 35, weight: 2280, dailyFeed: 195, cumFeed: 3250, dailyWater: 351 },
    { age: 40, weight: 2750, dailyFeed: 215, cumFeed: 4250, dailyWater: 387 },
  ],
};

// Interpolation function to get data for any day between 1 and 40
export function getDailyStats(strain: Strain, age: number): DailyData {
  const data = POULTRY_DATA[strain];
  if (age <= 1) return data[0];
  if (age >= 40) return data[data.length - 1];

  let lower = data[0];
  let upper = data[data.length - 1];

  for (let i = 0; i < data.length - 1; i++) {
    if (age >= data[i].age && age <= data[i + 1].age) {
      lower = data[i];
      upper = data[i + 1];
      break;
    }
  }

  const factor = (age - lower.age) / (upper.age - lower.age);
  return {
    age,
    weight: Math.round(lower.weight + (upper.weight - lower.weight) * factor),
    dailyFeed: Math.round(lower.dailyFeed + (upper.dailyFeed - lower.dailyFeed) * factor),
    cumFeed: Math.round(lower.cumFeed + (upper.cumFeed - lower.cumFeed) * factor),
    dailyWater: Math.round(lower.dailyWater + (upper.dailyWater - lower.dailyWater) * factor),
  };
}

// Scientific target temperature profile for industrial broiler management
export function getTargetTemperature(age: number): number {
  const profile = [
    { age: 1, temp: 33 },
    { age: 3, temp: 31 },
    { age: 7, temp: 29 },
    { age: 14, temp: 26 },
    { age: 21, temp: 23 },
    { age: 28, temp: 21 },
    { age: 35, temp: 20 },
    { age: 40, temp: 20 }
  ];

  if (age <= 1) return profile[0].temp;
  if (age >= 40) return profile[profile.length - 1].temp;

  let lower = profile[0];
  let upper = profile[profile.length - 1];

  for (let i = 0; i < profile.length - 1; i++) {
    if (age >= profile[i].age && age <= profile[i + 1].age) {
      lower = profile[i];
      upper = profile[i + 1];
      break;
    }
  }

  const factor = (age - lower.age) / (upper.age - lower.age);
  return Math.round((lower.temp + (upper.temp - lower.temp) * factor) * 10) / 10;
}

export function getTargetHumidity(age: number): { min: number, max: number } {
  if (age <= 7) return { min: 60, max: 70 };
  if (age <= 14) return { min: 55, max: 65 };
  if (age <= 28) return { min: 50, max: 60 };
  return { min: 45, max: 55 };
}

export const CLIMATE_FACTORS = {
  'بارد جدا': { temp: 5, waterFactor: 1.4, ventilationFactor: 0.7 },
  'بارد': { temp: 15, waterFactor: 1.6, ventilationFactor: 0.9 },
  'معتدل': { temp: 25, waterFactor: 1.8, ventilationFactor: 1.2 },
  'حار': { temp: 32, waterFactor: 2.2, ventilationFactor: 1.5 },
  'حار جدا': { temp: 38, waterFactor: 2.8, ventilationFactor: 2.0 },
};

export const MEDICATIONS = [
  // Day 1: التأسيس
  { 
    id: 'd1-ors', 
    name: 'محلول معالجة جفاف', 
    unit: 'جرام/لتر', 
    doseValue: 5, 
    category: 'تأسيس', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [1], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تعويض الفقد في السوائل والشوارد الناتجة عن إجهاد النقل، وتنشيط حيوية الكتكوت لبدء استهلاك العلف.',
    mixingRules: 'يذاب في كمية قليلة من ماء دافئ أولاً ثم يضاف لخزان المياه لضمان التجانس التام.',
    technicalSequence: 'يقدم في الـ 6 ساعات الأولى من وصول الكتاكيت قبل أي إضافات أخرى.'
  },
  { 
    id: 'd1-water1', 
    name: 'ماء نقي', 
    unit: 'لتر', 
    doseValue: 0, 
    category: 'راحة', 
    usageType: 'ضروري', 
    recommendedHours: 6, 
    targetDays: [1], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'راحة للكلى والكبد من الإضافات الدوائية، وضمان غسيل طبيعي للأمعاء لتجهيزها للجرعة التالية.',
    mixingRules: 'يجب أن يكون الماء خالياً من الكلور المضاف حديثاً (يفضل تركه 12 ساعة لتطاير الكلور).',
    technicalSequence: 'يقدم كفااص بين جرعتين مختلفتين لمنع أي تداخلات كيميائية غير مرغوبة.'
  },
  { 
    id: 'd1-vitc', 
    name: 'فيتامين C', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 4, 
    targetDays: [1], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'مضاد إجهاد حراري قوي، يعمل على تثبيت درجة حرارة الجسم وتقوية جدران الشعيرات الدموية.',
    mixingRules: 'لا يخلط مع المضادات الحيوية القوية التي تتأثر بالحموضة؛ يفضل تقديمه منفرداً.',
    technicalSequence: 'يقدم في ساعات الذروة (الحرارة العالية) أو بعد التحصينات لتقليل رد الفعل.'
  },
  { 
    id: 'd1-water2', 
    name: 'ماء نقي', 
    unit: 'لتر', 
    doseValue: 0, 
    category: 'راحة', 
    usageType: 'ضروري', 
    recommendedHours: 6, 
    targetDays: [1], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'فترة راحة لتأمين قدرة الامتصاص المعوي بشكل طبيعي بدون مجهود كيميائي إضافي.',
    mixingRules: 'مياه شرب نظيفة ومبردة بدرجة حرارة الجو الطبيعية.',
    technicalSequence: 'تأمين استقرار الحالة الصحية بين جرعة التأسيس الأولى وجرعة اليوم الثاني.'
  },

  // Day 2: فيتامين + مضاد حيوي (بان فلور)
  { 
    id: 'd2-vitc', 
    name: 'فيتامين C', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 4, 
    targetDays: [2], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'دعم الجهاز التنفسي والقلب تحت ضغط الإجهاد البيئى الأول.',
    mixingRules: 'يضاف للماء مباشرة؛ مع مراعاة عدم وجود رواسب كلسية في الخزان.',
    technicalSequence: 'يقدم قبل جرعة المضاد الحيوي لتهيئة الجسم.'
  },
  { 
    id: 'd2-water1', 
    name: 'ماء نقي', 
    unit: 'لتر', 
    doseValue: 0, 
    category: 'راحة', 
    usageType: 'ضروري', 
    recommendedHours: 6, 
    targetDays: [2], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تنظيف خطوط النيبل من بقايا الفيتامينات السكرية لمنع نمو الفطريات.',
    mixingRules: 'مياه بيضاء عذبة.',
    technicalSequence: 'فاصل إلزامي قبل الدخول في كورس المضاد الحيوي.'
  },
  { 
    id: 'd2-panflor', 
    name: 'مضاد حيوي (بان فلور)', 
    unit: 'سم³/لتر', 
    doseValue: 0.5, 
    category: 'وقائي', 
    usageType: 'ضروري', 
    recommendedHours: 6, 
    targetDays: [2, 3, 4], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], 
    isAntibiotic: true,
    scientificExplanation: 'مضاد حيوي واسع المدى فعال ضد الميكوبلازما والسالمونيلا، يستخدم للوقاية من العدوى المبكرة.',
    mixingRules: 'يرج جيداً قبل الاستخدام؛ يضاف بمعدل 0.5 سم لكل لتر ماء شرب.',
    technicalSequence: 'يقدم لمدة 3 أيام متتالية كجرعة وقائية أولية في الأسبوع الأول.'
  },
  { 
    id: 'd2-water2', 
    name: 'ماء نقي', 
    unit: 'لتر', 
    doseValue: 0, 
    category: 'راحة', 
    usageType: 'ضروري', 
    recommendedHours: 6, 
    targetDays: [2], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تقليل التركيز الدوائي في كلى الطائر أثناء فترة النوم.',
    mixingRules: 'مياه عذبة خالية من الإضافات.',
    technicalSequence: 'ختام اليوم لضمان امتصاص الجرعة السابقة بهدوء.'
  },

  // Days 3 & 4: أد3هـ + بان فلور
  { 
    id: 'd34-ad3e', 
    name: 'فيتامينات أد3هـ', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [3, 4], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'أساسي لتكوين الهيكل العظمي، تقوية المناعة، وتحفيز الغدد الصماء للنمو السريع.',
    mixingRules: 'يضاف للماء البارد؛ لا يعرض لأشعة الشمس المباشرة (الفيتامينات تتأكسد بالضوء والحرارة).',
    technicalSequence: 'يقدم في فترات التأسيس (الأسبوع الأول) لتعزيز حيوية الطيور.'
  },
  { 
    id: 'd34-water1', 
    name: 'ماء نقي', 
    unit: 'لتر', 
    doseValue: 0, 
    category: 'راحة', 
    usageType: 'ضروري', 
    recommendedHours: 6, 
    targetDays: [3, 4], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'غسيل طبيعي للكبد من نواتج تمثيل الفيتامينات الزيتية.',
    mixingRules: 'مياه شرب معتمدة.',
    technicalSequence: 'متابعة استهلاك المياه الطبيعي للتأكد من حيوية القطيع.'
  },
  { 
    id: 'd34-water2', 
    name: 'ماء نقي', 
    unit: 'لتر', 
    doseValue: 0, 
    category: 'راحة', 
    usageType: 'ضروري', 
    recommendedHours: 6, 
    targetDays: [3, 4], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'فترة استراحة هضمية قبل جرعة المضاد الحيوي الليلية.',
    mixingRules: 'مروقة ونظيفة.',
    technicalSequence: 'تجهيز القطيع للجرعة العلاجية الوقائية.'
  },

  // Day 5: بروبيوتك + أد3هـ + إليكتروليت
  { 
    id: 'd5-pro', 
    name: 'بروبيوتك', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'تأسيس', 
    usageType: 'ضروري', 
    recommendedHours: 4, 
    targetDays: [5], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'بكتيريا نافعة تعمل على استعمار الأمعاء ومنع نمو البكتيريا الضارة وتطوير المناعة المعوية.',
    mixingRules: 'لا يخلط مع أي مضادات حيوية أو مطهرات في الماء (تقتل البكتيريا النافعة).',
    technicalSequence: 'يقدم بعد انتهاء جرعة المضادات الحيوية لإعادة التوازن الميكروبي.'
  },
  { id: 'd5-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [5], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تطهير الامعاء من بقايا المضاد الحيوي.', mixingRules: 'مياه نظيفة.', technicalSequence: 'فاصل بيولوجي.' },
  { 
    id: 'd5-ad3e', 
    name: 'فيتامينات أد3هـ', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [5], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تحفيز النمو الطولي للعظام (العمود الفقري والأرجل) في نهاية الأسبوع الأول.',
    mixingRules: 'يقلب جيداً في جردل خارجي قبل إضافته للخزان الرئيسي.',
    technicalSequence: 'جرعة تكميلية للنمو السريع.'
  },
  { id: 'd5-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [5], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة عضوية.', mixingRules: 'مياه شرب.', technicalSequence: 'تجهيز لجرعة الأملاح.' },
  { 
    id: 'd5-elec', 
    name: 'إليكتروليت (أملاح)', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'داعم', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [5], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'الحفاظ على التوازن الأسموزي للخلايا ومنع الجفاف وتحفيز شرب الماء بكثافة.',
    mixingRules: 'يذاب جيداً لضمان عدم ترسب الأملاح في نهاية خطوط الشرب (النيبل).',
    technicalSequence: 'يعطى في الساعات المتأخرة لتثبيت السوائل في الجسم.'
  },
  { id: 'd5-water3', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [5], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل للأمعاء.', mixingRules: 'مياه عذبة.', technicalSequence: 'ختام اليوم.' },

  // Day 6: بروبيوتك + هـ سيلينيوم + إليكتروليت
  { 
    id: 'd6-pro', 
    name: 'بروبيوتك', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'تأسيس', 
    usageType: 'ضروري', 
    recommendedHours: 4, 
    targetDays: [6], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'إكمال دورة استعمار البكتيريا النافعة قبل يوم التحصين لرفع الاستجابة المناعية الموضعية.',
    mixingRules: 'يستخدم ماء مقطر أو مفلتر لضمان حيوية مستعمرات البكتيريا.',
    technicalSequence: 'مهم جداً قبل تحصين اليوم السابع لتهيئة الأمعاء.'
  },
  { id: 'd6-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [6], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'فترة استراحة هضمية.', mixingRules: 'مياه نظيفة.', technicalSequence: 'فاصل قبل الفيتامينات.' },
  { 
    id: 'd6-ese', 
    name: 'فيتامينات هـ + سيلينيوم', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [6], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'مضاد أكسدة قوي جداً يعمل على حماية الخلايا من التلف ورفع كفاءة الجهاز المناعي قبل التحصين.',
    mixingRules: 'يفضل خلطه مع ماء ذو درجة حموضة معتدلة؛ لا يوضع مع أحماض قوية.',
    technicalSequence: 'يقدم قبل التحصينات بـ 24 ساعة لتحقيق أقصى استجابة مناعية لللقاح.'
  },
  { id: 'd6-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [6], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تأمين استقرار حيوي قبل جرعة الأملاح.', mixingRules: 'مياه عذبة.', technicalSequence: 'فاصل راحة.' },
  { 
    id: 'd6-elec', 
    name: 'إليكتروليت (أملاح)', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'داعم', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [6], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تعويض الفقد في المعادن الأساسية وتنشيط مراكز الشرب فى المخ.',
    mixingRules: 'يذاب تماماً في كمية ماء صغيرة قبل وضعه فى التانك.',
    technicalSequence: 'يقدم لضمان شرب مياه كافية قبل يوم التحصين المجهد.'
  },
  { id: 'd6-water3', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [6], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل للأمعاء.', mixingRules: 'مياه عذبة.', technicalSequence: 'ختام اليوم.' },

  // Day 7: التحصين الأول (هيتشنر + أي بي)
  { 
    id: 'd7-thirst', 
    name: 'تعطيش (ما قبل التحصين)', 
    unit: 'لتر', 
    doseValue: 0, 
    category: 'راحة', 
    usageType: 'ضروري', 
    recommendedHours: 2, 
    targetDays: [7], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تحفيز حاجة الطائر للشرب لضمان استهلاك محلول اللقاح في أسرع وقت ممكن قبل تلفه.',
    mixingRules: 'رفع المساقي أو تفريغ الخطوط تماماً من المياه.',
    technicalSequence: 'يستمر لمدة ساعتين (صيفاً) إلى 3 ساعات (شتاءً) حسب درجة الحرارة.'
  },
  { 
    id: 'd7-milk', 
    name: 'مثبت لقاح (حليب)', 
    unit: 'جرام/لتر', 
    doseValue: 2, 
    category: 'تحصين', 
    usageType: 'ضروري', 
    recommendedHours: 0.5, 
    targetDays: [7], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'معادلة الكلور والأملاح الثقيلة في الماء وحماية الفيروس المضعف من التكسر.',
    mixingRules: 'يذاب في مياه باردة جداً؛ يفضل لبن بودرة منزوع الدسم بنسبة 2 جم لكل لتر.',
    technicalSequence: 'يقدم قبل إضافة اللقاح بـ 15-20 دقيقة لضمان حماية المياه.'
  },
  { 
    id: 'd7-vac', 
    name: 'تحصين هيتشنر ب1 + أي بي', 
    unit: 'أمبول', 
    doseValue: 1, 
    category: 'تحصين', 
    usageType: 'ضروري', 
    recommendedHours: 2, 
    targetDays: [7], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تعريض الطائر لنسخة مضعفة من فيروسات النيوكاسل والآي بي لتحفيز الأجسام المضادة.',
    mixingRules: 'يفتح الأمبول تحت سطح الماء المبرد (5-10 درجة)؛ يمنع لمس اللقاح باليد مباشرة.',
    technicalSequence: 'يجب أن يشرب منه 100% من الطيور خلال ساعة واحدة من التقديم.'
  },
  { id: 'd7-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4.5, targetDays: [7], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تأمين استقرار الفيروس في الجهاز الهضمي.', mixingRules: 'مياه نظيفة.', technicalSequence: 'راحة ما بعد التحصين.' },
  { 
    id: 'd7-ad3e', 
    name: 'فيتامينات أد3هـ', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [7], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'رفع الإجهاد الناتج عن عملية التحصين ودعم الأغشية المخاطية للقصبة الهوائية.',
    mixingRules: 'يضاف للخزان بعد غسيل الخطوط من بقايا اللقاح والحليب.',
    technicalSequence: 'جرعة ليلية طويلة لدعم القطيع بعد يوم مجهد.'
  },
  { id: 'd7-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 6, targetDays: [7], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة عضوية.', mixingRules: 'مياه عذبة.', technicalSequence: 'ختام اليوم.' },

  // Day 8: غسيل ومنشط
  { 
    id: 'd8-renal', 
    name: 'جرعة غسيل كلوي', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'كلوي/كبد', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [8], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'التخلص من اليوريا والأملاح الزائدة الناتجة عن تمثيل بروتين العلف البادي لتنشيط الكلى.',
    mixingRules: 'يفضل تقديمه في ساعات الصباح الباكر؛ لا يتعارض مع معظم الفيتامينات.',
    technicalSequence: 'جرعة أساسية في بداية الأسبوع الثاني لمواجهة زيادة سحب العلف.'
  },
  { id: 'd8-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [8], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة للكلى.', mixingRules: 'مياه شرب.', technicalSequence: 'فاصل راحة.' },
  { id: 'd8-ad3e', name: 'فيتامين أد3هـ', unit: 'سم³/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 6, targetDays: [8], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'دعم الهيكل العظمي.', mixingRules: 'خلط جيد.', technicalSequence: 'جرعة نمو.' },
  { id: 'd8-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [8], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل خطوط.', mixingRules: 'مياه عذبة.', technicalSequence: 'فاصل قبل الكبد.' },
  { 
    id: 'd8-hepato', 
    name: 'جرعة منشط كبد', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'كلوي/كبد', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [8], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تنشيط خلايا الكبد للتخلص من السموم وتحفيز إنتاج العصارة الصفراوية لهضم الدهون فى العلف.',
    mixingRules: 'يضاف بمعدل 1 سم لكل لتر؛ يمكن خلطه مع مدرات البول.',
    technicalSequence: 'يقدم بانتظام للحفاظ على كفاءة التحويل الغذائي (FCR).'
  },

  // Day 9: ب.ك كولين (12 ساعة)
  { 
    id: 'd9-bk', 
    name: 'فيتامين B-K (ب.ك كولين)', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [9], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'ضروري للوقاية من النزيف المعوي (فيتامين K) وتنشيط التمثيل الغذائي للدهون والبروتين بوجود الكولين.',
    mixingRules: 'لا يتأثر كثيراً بالحرارة؛ يفضل استخدامه في مياه الشرب العذبة.',
    technicalSequence: 'يضاف في الأسبوع الثاني كجرعة روتينية لتأمين صحة الأمعاء والكبد.'
  },
  { id: 'd9-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [9], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة هضمية.', mixingRules: 'مياه نظيفة.', technicalSequence: 'فاصل قبل الأملاح.' },
  { id: 'd9-elec', name: 'جرعة إليكتروليت (أملاح)', unit: 'جرام/لتر', doseValue: 1, category: 'داعم', usageType: 'ضروري', recommendedHours: 8, targetDays: [9], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'منع الجفاف.', mixingRules: 'إذابة تامة.', technicalSequence: 'جرعة داعمة.' },
  { id: 'd9-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [9], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل خطوط.', mixingRules: 'مياه عذبة.', technicalSequence: 'ختام اليوم.' },

  // Day 10
  { 
    id: 'd10-bk', 
    name: 'فيتامين B-K (ب.ك كولين)', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [10], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'متابعة كورس الفيتامينات لرفع معدلات التحويل وزيادة الاستيعاب البروتيني.',
    mixingRules: 'يستخدم نفس معدل اليوم السابق (1 سم/لتر).',
    technicalSequence: 'جرعة ثابتة فى منتصف دورة التحول الهرموني للكتكوت.'
  },
  { id: 'd10-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 12, targetDays: [10], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'يوم راحة معوية.', mixingRules: 'مياه عذبة فقط.', technicalSequence: 'راحة طويلة.' },

  // Day 11: هـ سيلينيوم (12 ساعة)
  { 
    id: 'd11-ese', 
    name: 'فيتامين هـ + سيلينيوم', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [11], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تحفيز الجهاز المناعي وتقوية عضلة القلب والأجهزة الحيوية قبل الدخول في الأسبوع الثالث.',
    mixingRules: 'يضاف للخزان مباشرة؛ ويفضل عدم وجود مطهرات قوية في الماء.',
    technicalSequence: 'جرعة ليلية هادئة لدعم النمو العضلي.'
  },
  { id: 'd11-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [11], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل للأمعاء.', mixingRules: 'مياه نظيفة.', technicalSequence: 'فاصل قبل فيتامين C.' },
  { id: 'd11-vitc', name: 'فيتامين C', unit: 'جرام/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 4, targetDays: [11], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تخفيف حدة الإجهاد الزحامى.', mixingRules: 'إذابة تامة.', technicalSequence: 'جرعة نهارية.' },
  { id: 'd11-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [11], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة عضوية.', mixingRules: 'مياه عذبة.', technicalSequence: 'ختام اليوم.' },

  // Day 12: تحصين جمبورو
  { 
    id: 'd12-thirst', 
    name: 'تعطيش التحصين', 
    unit: 'لتر', 
    doseValue: 0, 
    category: 'راحة', 
    usageType: 'ضروري', 
    recommendedHours: 2, 
    targetDays: [12], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'التأكد من خلو الحوصلة من الماء لاستيعاب محلول اللقاح فوراً.',
    mixingRules: 'منع وصول المياه للطيور تماماً.',
    technicalSequence: 'متابعة حركة الطيور للتأكد من الرغبة فى الشرب.'
  },
  { 
    id: 'd12-vac', 
    name: 'تحصين جمبورو', 
    unit: 'أمبول', 
    doseValue: 1, 
    category: 'تحصين', 
    usageType: 'ضروري', 
    recommendedHours: 2, 
    targetDays: [12], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تحصين ضد مرض غدة فابريشيوس (الجمبورو) لحماية الجهاز المناعي للطائر.',
    mixingRules: 'مياه مبردة + لبن منزوع الدسم؛ إذابة الأمبول داخل الماء.',
    technicalSequence: 'مهم جداً الالتزام بالساعة الواحدة للانتهاء من الشرب.'
  },
  { id: 'd12-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 3, targetDays: [12], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'استقرار معوي.', mixingRules: 'مياه عذبة.', technicalSequence: 'راحة ما بعد التحصين.' },
  { id: 'd12-ad3e', name: 'فيتامينات أد3هـ (لرفع الإجهاد)', unit: 'سم³/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 8, targetDays: [12], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'دعم المناعة المخاطية.', mixingRules: 'خلط جيد.', technicalSequence: 'جرعة رفع إجهاد ليلية.' },
  { id: 'd12-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 6, targetDays: [12], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة عضوية.', mixingRules: 'مياه نظيفة.', technicalSequence: 'ختام اليوم.' },

  // Day 13
  { id: 'd13-vitc', name: 'جرعة فيتامين C', unit: 'جرام/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 4, targetDays: [13], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'مضاد إجهاد حراري نهارى.', mixingRules: 'إذابة كلية.', technicalSequence: 'جرعة صباحية نهارية.' },
  { id: 'd13-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [13], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل كلوي طبيعي.', mixingRules: 'مياه عذبة.', technicalSequence: 'فاصل راحة.' },
  { id: 'd13-elec', name: 'جرعة إليكتروليت', unit: 'جرام/لتر', doseValue: 1, category: 'داعم', usageType: 'ضروري', recommendedHours: 8, targetDays: [13], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'توازن أسموزي للخلايا.', mixingRules: 'إذابة تامة.', technicalSequence: 'تجهيز لليوم الرابع عشر.' },
  { id: 'd13-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [13], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة هضمية.', mixingRules: 'مياه نظيفة.', technicalSequence: 'ختام اليوم.' },

  // Day 14: غسيل ومنشط
  { 
    id: 'd14-renal', 
    name: 'جرعة غسيل كلوي', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'كلوي/كبد', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [14], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'التخلص من تراكمات الأدوية واللقاحات السابقة لإزالة العبء عن الكلى.',
    mixingRules: 'يضاف للخزان بمعدل 1 سم / لتر.',
    technicalSequence: 'جرعة ختام الأسبوع الثاني لتنظيف الجسم.'
  },
  { id: 'd14-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [14], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'فترة غسيل خطوط.', mixingRules: 'مياه ناصعة.', technicalSequence: 'فاصل قبل المنشط.' },
  { id: 'd14-hepato', name: 'جرعة منشط كبد', unit: 'سم³/لتر', doseValue: 1, category: 'كلوي/كبد', usageType: 'ضروري', recommendedHours: 8, targetDays: [14], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تجديد خلايا الكبد التالفة.', mixingRules: 'يقلب جيداً.', technicalSequence: 'جرعة مسائية.' },
  { id: 'd14-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [14], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة هضمية.', mixingRules: 'مياه شرب.', technicalSequence: 'ختام الأسبوع الثاني.' },

  // Day 15
  { id: 'd15-ese', name: 'فيتامين هـ + سيلينيوم', unit: 'سم³/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 8, targetDays: [15], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تقوية عضلات الصدر.', mixingRules: 'خلط متجانس.', technicalSequence: 'جرعة صباحية.' },
  { id: 'd15-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 6, targetDays: [15], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة للكبد.', mixingRules: 'مياه مفلترة.', technicalSequence: 'فاصل راحة.' },
  { id: 'd15-vitc', name: 'فيتامين C', unit: 'جرام/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 4, targetDays: [15], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تخفيف حدة الإجهاد الزحامى المتزايد.', mixingRules: 'إذابة تامة.', technicalSequence: 'جرعة مسائية.' },
  { id: 'd15-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 6, targetDays: [15], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل طبيعي للأمعاء.', mixingRules: 'مياه عذبة.', technicalSequence: 'ختام اليوم.' },

  // Days 16, 17, 18: كوكسيديا وكلوستريديا
  { 
    id: 'd1618-cox', 
    name: 'مضاد كوكسيديا', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'وقائي', 
    usageType: 'ضروري', 
    recommendedHours: 12, 
    targetDays: [16, 17, 18], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'القضاء على بويضات الكوكسيديا في الأمعاء لمنع النزيف وتأمين امتصاص العلف.',
    mixingRules: 'يذاب تماماً لضمان وصول الجرعة الفعالة لكل طائر.',
    technicalSequence: 'كورس علاجي وقائي مكثف لمدة 3 أيام لضمان سلامة الأمعاء.'
  },
  { id: 'd1618-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [16, 17, 18], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'فاصل كيميائي.', mixingRules: 'مياه نظيفة.', technicalSequence: 'راحة بين الدوائين.' },
  { 
    id: 'd1618-clos', 
    name: 'مضاد كلوستريديا', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'وقائي', 
    usageType: 'ضروري', 
    recommendedHours: 12, 
    targetDays: [16, 17, 18], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'منع نمو بكتيريا الكلوستريديا اللاهوائية التي تسبب التهاب الأمعاء وتآكلها.',
    mixingRules: 'يمكن استخدامه بالتبادل مع مضاد الكوكسيديا.',
    technicalSequence: 'جرعة ليلية لمنع الانقلاب المعوي المفاجئ.'
  },
  { id: 'd1618-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [16, 17, 18], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل خطوط.', mixingRules: 'مياه عذبة.', technicalSequence: 'ختام أيام الكورس.' },

  // Day 19
  { id: 'd19-renal', name: 'جرعة غسيل كلوي', unit: 'سم³/لتر', doseValue: 1, category: 'كلوي/كبد', usageType: 'ضروري', recommendedHours: 8, targetDays: [19], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'إزالة نواتج كورس الكوكسيديا.', mixingRules: 'خلط جيد.', technicalSequence: 'جرعة تنظيف صباحية.' },
  { id: 'd19-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [19], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة هضمية.', mixingRules: 'مياه ناصعة.', technicalSequence: 'فاصل راحة.' },
  { id: 'd19-hepato', name: 'جرعة منشط كبد', unit: 'سم³/لتر', doseValue: 1, category: 'كلوي/كبد', usageType: 'ضروري', recommendedHours: 8, targetDays: [19], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تنشيط الكبد بعد الأدوية.', mixingRules: 'يقلب جيداً.', technicalSequence: 'جرعة مسائية.' },
  { id: 'd19-pro', name: 'جرعة بروبيوتك', unit: 'جرام/لتر', doseValue: 1, category: 'تأسيس', usageType: 'ضروري', recommendedHours: 6, targetDays: [19], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تعويض البكتيريا النافعة المفقودة.', mixingRules: 'استخدام ماء خالي من الكلور.', technicalSequence: 'جرعة ليلية لإعادة التوازن الميكروبي.' },
  { id: 'd19-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [19], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة عضوية.', mixingRules: 'مياه نظيفة.', technicalSequence: 'ختام اليوم.' },

  // Day 20
  { 
    id: 'd20-pro', 
    name: 'جرعة بروبيوتيك', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'تأسيس', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [20], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تدعيم مستعمرات البكتيريا النافعة لزيادة قدرة الامتصاص في ذروة النمو.',
    mixingRules: 'يضاف للماء مباشرة؛ مع مراعاة برودة المياه.',
    technicalSequence: 'جرعة صباحية لتنشيط الهضم طوال اليوم.'
  },
  { id: 'd20-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [20], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'فترة ترويق.', mixingRules: 'مياه عذبة.', technicalSequence: 'فاصل راحة.' },
  { id: 'd20-bk', name: 'جرعة فيتامين B-K كولين', unit: 'سم³/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 8, targetDays: [20], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'حماية جدران الأمعاء.', mixingRules: 'خلط متوازن.', technicalSequence: 'جرعة مسائية هادئة.' },
  { id: 'd20-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [20], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل خطوط.', mixingRules: 'مياه شرب.', technicalSequence: 'ختام الأسبوع الثالث.' },

  // Day 21
  { 
    id: 'd21-bk', 
    name: 'فيتامين B-K (ب.ك كولين)', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [21], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'دعم تكوين الأنسجة الحيوية ومنع حالات النزيف الداخلي مع زيادة الوزن السريعة.',
    mixingRules: 'يذاب في التانك مباشرة.',
    technicalSequence: 'جرعة صباحية طويلة.'
  },
  { id: 'd21-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 12, targetDays: [21], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'يوم راحة معوية.', mixingRules: 'مياه شرب فقط.', technicalSequence: 'راحة ليلية.' },

  // Day 22 & 23: غسيل + منشط + ب.ك كولين
  { 
    id: 'd2223-renal', 
    name: 'جرعة غسيل كلوي', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'كلوي/كبد', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [22, 23], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'التخلص من نواتج التمثيل الغذائي الزائدة لتنشيط الكلى في ذروة استهلاك العلف.',
    mixingRules: 'يضاف للخزان مباشرة.',
    technicalSequence: 'جرعة صباحية مبكرة.'
  },
  { id: 'd2223-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [22, 23], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة معوية.', mixingRules: 'مياه نظيفة.', technicalSequence: 'فاصل راحة.' },
  { 
    id: 'd2223-hepato', 
    name: 'منشط كبد', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'كلوي/كبد', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [22, 23], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تحفيز الكبد لإنتاج العصارة الصفراوية لزيادة كفاءة هضم الدهون.',
    mixingRules: 'يرج جيداً قبل الاستخدام.',
    technicalSequence: 'جرعة مسائية.'
  },
  { id: 'd2223-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [22, 23], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل خطوط.', mixingRules: 'مياه عذبة.', technicalSequence: 'فاصل راحة.' },
  { 
    id: 'd2223-bk', 
    name: 'فيتامين B-K (ب.ك كولين)', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [22, 23], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'حماية جدران الأمعاء من التهتك الناتج عن سرعة مرور العلف.',
    mixingRules: 'خلط متجانس.',
    technicalSequence: 'جرعة ليلية.'
  },
  { id: 'd2223-water3', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [22, 23], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة عضوية.', mixingRules: 'مياه شرب.', technicalSequence: 'ختام اليوم.' },

  // Day 24 & 25
  { 
    id: 'd2425-ese', 
    name: 'فيتامين هـ سيلينيوم', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'فيتامينات', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [24, 25], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'منع حالات الاستسقاء وتقوية القلب لمواجهة الوزن الكفيل.',
    mixingRules: 'إذابة تامة فى الماء.',
    technicalSequence: 'جرعة نهارية طويلة.'
  },
  { id: 'd2425-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 12, targetDays: [24, 25], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة معوية ليلية.', mixingRules: 'مياه عذبة.', technicalSequence: 'راحة راحة.' },

  // Day 26
  { 
    id: 'd26-elec', 
    name: 'إليكتروليت (أملاح معدنية)', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    category: 'داعم', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [26], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'موازنة الضغط الأسموزي للخلايا ومنع الجفاف المفاجئ.',
    mixingRules: 'يذاب تماماً.',
    technicalSequence: 'جرعة صباحية نهارية.'
  },
  { id: 'd26-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 12, targetDays: [26], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة ليلية.', mixingRules: 'مياه شرب.', technicalSequence: 'راحة.' },

  // Day 27
  { 
    id: 'd27-tox', 
    name: 'مضاد سموم فطرية بيولوجي (علف)', 
    unit: 'جرام/كجم', 
    doseValue: 1, 
    category: 'سموم', 
    usageType: 'إختياري', 
    recommendedHours: 24, 
    targetDays: [27], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تحييد السموم الفطرية في العلف النهائي.',
    mixingRules: 'يخلط مع العلف بمعدل 1 كجم للطن.',
    technicalSequence: 'حماية مستمرة طوال الـ 24 ساعة.'
  },
  { id: 'd27-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 24, targetDays: [27], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'مياه بيضاء عذبة.', mixingRules: 'نظيفة جداً.', technicalSequence: 'يوم راحة مائية.' },

  // Day 28
  { id: 'd28-ad3e', name: 'فيتامينات أد3هـ', unit: 'سم³/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 12, targetDays: [28], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'دعم الهيكل العظمي للأوزان الثقيلة.', mixingRules: 'خلط متجانس.', technicalSequence: 'جرعة صباحية.' },
  { id: 'd28-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 12, targetDays: [28], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة ليلية.', mixingRules: 'مياه عذبة.', technicalSequence: 'راحة.' },

  // Day 29
  { id: 'd29-tox', name: 'مضاد سموم فطرية بيولوجي (علف)', unit: 'جرام/كجم', doseValue: 1, category: 'سموم', usageType: 'إختياري', recommendedHours: 24, targetDays: [29], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'حماية متجددة للأمعاء.', mixingRules: 'يخلط بالعلف.', technicalSequence: 'حماية علفية.' },
  { id: 'd29-ad3e', name: 'فيتامينات أد3هـ', unit: 'سم³/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 12, targetDays: [29], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تحفيز القوة البدنية للطيور.', mixingRules: 'إذابة كلية.', technicalSequence: 'جرعة نهارية.' },
  { id: 'd29-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 12, targetDays: [29], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة ليلية.', mixingRules: 'مياه شرب.', technicalSequence: 'راحة.' },

  // Day 30
  { 
    id: 'd30-renal', 
    name: 'غسيل كلوي', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'كلوي/كبد', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [30], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'إزالة رواسب البروتين من الكلى لتجنب الفشل الكلوي.',
    mixingRules: 'يضاف للخزان.',
    technicalSequence: 'جرعة صباحية.'
  },
  { id: 'd30-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [30], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة عضوية.', mixingRules: 'مياه نظيفة.', technicalSequence: 'فاصل راحة.' },
  { 
    id: 'd30-hepato', 
    name: 'منشط كبد', 
    unit: 'سم³/لتر', 
    doseValue: 1, 
    category: 'كلوي/كبد', 
    usageType: 'ضروري', 
    recommendedHours: 8, 
    targetDays: [30], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'تنشيط الكبد لهضم علف النهاية عالي السعرات.',
    mixingRules: 'يرج جيداً.',
    technicalSequence: 'جرعة مسائية.'
  },
  { id: 'd30-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 4, targetDays: [30], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل خطوط.', mixingRules: 'مياه شرب.', technicalSequence: 'ختام اليوم.' },

  // Day 31
  { id: 'd31-tox', name: 'مضاد سموم فطرية بيولوجي (علف)', unit: 'جرام/كجم', doseValue: 1, category: 'سموم', usageType: 'إختياري', recommendedHours: 24, targetDays: [31], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'حماية الأمعاء قبل مرحلة سحب الأدوية.', mixingRules: 'خلط علفي.', technicalSequence: 'حماية مستمرة.' },
  { id: 'd31-vitc', name: 'فيتامين C', unit: 'جرام/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 4, targetDays: [31], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تثبيت الحالة الصحية العامة.', mixingRules: 'إذابة تامة.', technicalSequence: 'جرعة نهارية.' },
  { id: 'd31-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 12, targetDays: [31], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة عضوية.', mixingRules: 'مياه عذبة.', technicalSequence: 'ختام اليوم.' },

  // Day 32
  { id: 'd32-renal', name: 'غسيل كلوي', unit: 'سم³/لتر', doseValue: 1, category: 'كلوي/كبد', usageType: 'ضروري', recommendedHours: 8, targetDays: [32], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تنظيف نهائي للكلى.', mixingRules: '1 سم/لتر.', technicalSequence: 'جرعة صباحية.' },
  { id: 'd32-water1', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [32], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة معوية.', mixingRules: 'مياه نظيفة.', technicalSequence: 'فاصل راحة.' },
  { id: 'd32-hepato', name: 'منشط كبد', unit: 'سم³/لتر', doseValue: 1, category: 'كلوي/كبد', usageType: 'ضروري', recommendedHours: 8, targetDays: [32], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تنشيط الكبد لرفع جودة التصافي.', mixingRules: 'يرج جيداً.', technicalSequence: 'جرعة نهارية.' },
  { id: 'd32-water2', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [32], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'غسيل خطوط.', mixingRules: 'مياه عذب.', technicalSequence: 'فاصل راحة.' },
  { id: 'd32-bk', name: 'فيتامين B-K كولين', unit: 'سم³/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 8, targetDays: [32], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'منع النزيف قبل الشحن ونهاية الدورة.', mixingRules: 'خلط متجانس.', technicalSequence: 'جرعة مسائية.' },
  { id: 'd32-water3', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 2, targetDays: [32], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة عضوية.', mixingRules: 'مياه شرب.', technicalSequence: 'ختام اليوم.' },

  // Day 33
  { id: 'd33-tox', name: 'مضاد سموم فطرية بيولوجي (علف)', unit: 'جرام/كجم', doseValue: 1, category: 'سموم', usageType: 'إختياري', recommendedHours: 24, targetDays: [33], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'حماية الأمعاء في المرحلة النهائية.', mixingRules: 'خلط علفي.', technicalSequence: 'حماية علفية مستمرة.' },
  { id: 'd33-bk', name: 'فيتامين B-K كولين', unit: 'سم³/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 8, targetDays: [33], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'تأمين صحة الأمعاء.', mixingRules: 'إذابة تامة.', technicalSequence: 'جرعة نهارية.' },
  { id: 'd33-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 12, targetDays: [33], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'راحة ليلية.', mixingRules: 'مياه عذبة.', technicalSequence: 'راحة.' },

  // Day 34
  { id: 'd34-bk', name: 'فيتامين B-K كولين', unit: 'سم³/لتر', doseValue: 1, category: 'فيتامينات', usageType: 'ضروري', recommendedHours: 8, targetDays: [34], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'آخر جرعة فيتامينات لضمان جودة الجلد واللحم.', mixingRules: 'خلط متجانس.', technicalSequence: 'جرعة نهارية.' },
  { id: 'd34-water', name: 'ماء نقي', unit: 'لتر', doseValue: 0, category: 'راحة', usageType: 'ضروري', recommendedHours: 12, targetDays: [34], climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'], scientificExplanation: 'بدء فترة السحب الحيوية.', mixingRules: 'مياه شرب نظيفة.', technicalSequence: 'راحة ليلية.' },

  // Day 35
  { 
    id: 'd35-water', 
    name: 'مياه فقط (فترة سحب)', 
    unit: 'لتر', 
    doseValue: 0, 
    category: 'راحة', 
    usageType: 'ضروري', 
    recommendedHours: 24, 
    targetDays: [35], 
    climates: ['بارد جدا', 'بارد', 'معتدل', 'حار', 'حار جدا'],
    scientificExplanation: 'فترة أمان حيوية لضمان خروج متبقيات الأدوية من جسم الطائر قبل البيع والاستهلاك الآدمي.',
    mixingRules: 'مياه عذبة تماماً خالية من أي إضافات كيميائية.',
    technicalSequence: 'تسكين القطيع وتوفير مياه وفيرة ونظيفة حتى موعد التحميل.'
  },
];

