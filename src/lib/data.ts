
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
    { age: 2, weight: 56, dailyFeed: 16, cumFeed: 29, dailyWater: 29 },
    { age: 3, weight: 74, dailyFeed: 19, cumFeed: 48, dailyWater: 34 },
    { age: 4, weight: 95, dailyFeed: 23, cumFeed: 71, dailyWater: 41 },
    { age: 5, weight: 120, dailyFeed: 27, cumFeed: 98, dailyWater: 49 },
    { age: 6, weight: 151, dailyFeed: 32, cumFeed: 130, dailyWater: 58 },
    { age: 7, weight: 188, dailyFeed: 37, cumFeed: 167, dailyWater: 67 },
    { age: 10, weight: 324, dailyFeed: 54, cumFeed: 301, dailyWater: 97 },
    { age: 14, weight: 541, dailyFeed: 72, cumFeed: 542, dailyWater: 130 },
    { age: 21, weight: 1047, dailyFeed: 121, cumFeed: 1211, dailyWater: 218 },
    { age: 28, weight: 1682, dailyFeed: 168, cumFeed: 2178, dailyWater: 302 },
    { age: 35, weight: 2378, dailyFeed: 205, cumFeed: 3450, dailyWater: 369 },
    { age: 40, weight: 2885, dailyFeed: 228, cumFeed: 4500, dailyWater: 410 },
  ],
  Ross: [
    { age: 1, weight: 42, dailyFeed: 13, cumFeed: 13, dailyWater: 23 },
    { age: 2, weight: 55, dailyFeed: 15, cumFeed: 28, dailyWater: 27 },
    { age: 3, weight: 72, dailyFeed: 18, cumFeed: 46, dailyWater: 32 },
    { age: 4, weight: 92, dailyFeed: 22, cumFeed: 68, dailyWater: 40 },
    { age: 5, weight: 118, dailyFeed: 26, cumFeed: 94, dailyWater: 47 },
    { age: 6, weight: 148, dailyFeed: 31, cumFeed: 125, dailyWater: 56 },
    { age: 7, weight: 184, dailyFeed: 36, cumFeed: 161, dailyWater: 65 },
    { age: 10, weight: 315, dailyFeed: 52, cumFeed: 290, dailyWater: 94 },
    { age: 14, weight: 525, dailyFeed: 70, cumFeed: 520, dailyWater: 126 },
    { age: 21, weight: 1015, dailyFeed: 118, cumFeed: 1160, dailyWater: 212 },
    { age: 28, weight: 1630, dailyFeed: 163, cumFeed: 2090, dailyWater: 293 },
    { age: 35, weight: 2305, dailyFeed: 198, cumFeed: 3310, dailyWater: 356 },
    { age: 40, weight: 2795, dailyFeed: 220, cumFeed: 4320, dailyWater: 396 },
  ],
  Avian: [
    { age: 1, weight: 42, dailyFeed: 12, cumFeed: 12, dailyWater: 22 },
    { age: 2, weight: 54, dailyFeed: 14, cumFeed: 26, dailyWater: 25 },
    { age: 3, weight: 70, dailyFeed: 17, cumFeed: 43, dailyWater: 31 },
    { age: 4, weight: 90, dailyFeed: 21, cumFeed: 64, dailyWater: 38 },
    { age: 5, weight: 115, dailyFeed: 25, cumFeed: 89, dailyWater: 45 },
    { age: 6, weight: 145, dailyFeed: 30, cumFeed: 119, dailyWater: 54 },
    { age: 7, weight: 180, dailyFeed: 35, cumFeed: 154, dailyWater: 63 },
    { age: 10, weight: 310, dailyFeed: 50, cumFeed: 280, dailyWater: 90 },
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
  // Phase 1: Hatching and Reception (Days 1-7)
  { 
    name: 'محلول معالجة جفاف', 
    unit: 'سم³/لتر',
    doseValue: 1,
    description: 'استعادة التوازن الأسموزي للخلايا بعد إجهاد النقل.', 
    category: 'تأسيس',
    timing: '6 ساعات',
    mixing: 'يمكن خلطه مع الفيتامينات',
    sequence: 'الجرعة الأولى عند الوصول',
    usageType: 'ضروري',
    recommendedHours: 6,
    benefits: 'يعوض السوائل المفقودة ويمنع الجفاف المبكر.',
    targetDays: [1],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'فيتامين أد3هـ (جرعة أولى)', 
    unit: 'سم³/لتر', 
    doseValue: 1,
    description: 'دعم الأغشية المخاطية وتأسيس الهيكل العظمي.', 
    category: 'فيتامينات',
    timing: '6 ساعات',
    mixing: 'لا يخلط مع المضادات الحيوية',
    sequence: 'الجرعة الثانية في اليوم الأول',
    usageType: 'ضروري',
    recommendedHours: 6,
    benefits: 'بناء الهيكل العظمي وقوة التحمل.',
    targetDays: [1],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'ماء نقي (راحة أولى)', 
    unit: 'لتر', 
    doseValue: 0,
    description: 'فترة راحة للجهاز الهضمي بعد الفيتامينات.', 
    category: 'راحة',
    timing: 'ساعة واحدة',
    mixing: 'ماء فقط',
    sequence: 'بين الفيتامينات والمضاد الحيوي',
    usageType: 'ضروري',
    recommendedHours: 1,
    benefits: 'تحسين امتصاص العلاج القادم.',
    targetDays: [1],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'مضاد حيوي (جرعة أولى)', 
    unit: 'جرام/لتر', 
    doseValue: 1,
    description: 'القضاء على الميكوبلازما والسالمونيلا إن وجدت.', 
    category: 'وقائي',
    timing: '6 ساعات',
    mixing: 'منفرداً',
    sequence: 'الجرعة الثالثة في اليوم الأول',
    usageType: 'وقائي/ضروري',
    recommendedHours: 6,
    benefits: 'درع حماية ضد العدوى البكتيرية الموروثة.',
    targetDays: [1],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص'],
    isAntibiotic: true
  },
  { 
    name: 'ماء نقي (راحة ثانية)', 
    unit: 'لتر', 
    doseValue: 0,
    description: 'فترة راحة بعد المضاد الحيوي.', 
    category: 'راحة',
    timing: 'ساعة واحدة',
    mixing: 'ماء فقط',
    sequence: 'ختام اليوم الأول',
    usageType: 'ضروري',
    recommendedHours: 1,
    benefits: 'تنشيط الكلى.',
    targetDays: [1],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'مضاد حيوي (تنفسي + معوي)', 
    unit: 'جرام/لتر', 
    doseValue: 1, 
    description: 'القضاء على الميكوبلازما والسالمونيلا إن وجدت.', 
    category: 'وقائي',
    timing: '12 ساعة',
    mixing: 'منفرداً',
    sequence: 'تبادلي مع الفيتامينات (لا يُخلط)',
    usageType: 'وقائي/ضروري',
    recommendedHours: 12,
    benefits: 'درع حماية ضد العدوى البكتيرية الموروثة.',
    targetDays: [2, 3],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص'],
    isAntibiotic: true
  },
  { 
    name: 'فيتامين أد3هـ', 
    unit: 'سم³/لتر', 
    doseValue: 1,
    description: 'دعم الأغشية المخاطية وتأسيس الهيكل العظمي.', 
    category: 'فيتامينات',
    timing: '12 ساعة',
    mixing: 'لا يخلط مع المضادات الحيوية',
    sequence: 'تأسيس النمو السريع',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'بناء الهيكل العظمي وقوة التحمل.',
    targetDays: [2, 3],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'أملاح معدنية (فوسفور، كالسيوم)', 
    unit: 'سم³/لتر', 
    doseValue: 1.5,
    description: 'منع الكساح وتطوير العظام لتحمل الوزن المستقبلي.', 
    category: 'فيتامينات',
    timing: '12 ساعة',
    mixing: 'منفرداً',
    sequence: 'في مراحل بناء الوزن الأولى',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'تجنب حالات الكساح المفاجئة في الأعمار المتقدمة.',
    targetDays: [4, 5],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'منشط كبد + غسيل كلوي', 
    unit: 'سم³/لتر', 
    doseValue: 1,
    description: 'تنظيف الكلى من بقايا المضادات الحيوية قبل التحصين.', 
    category: 'داعم',
    timing: '12 ساعة',
    mixing: 'يمكن خلطهما معاً',
    sequence: 'قبل التحصين بـ 24 ساعة',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'تجهيز أجهزة الطائر لاستقبال اللقاح بكفاءة.',
    targetDays: [6],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'تحصين (Hitchner B1 + IB)', 
    unit: 'جرعة/طائر', 
    doseValue: 1,
    description: 'تحصين فيروسي وقائي.', 
    category: 'تحصين',
    timing: 'ساعتان (يفضل تقطير أو رش)',
    mixing: 'ماء خالي من الكلور والمطهرات',
    sequence: 'تحصينة الاستقبال الأساسية',
    usageType: 'ضروري',
    recommendedHours: 2,
    benefits: 'بناء خط الدفاع الأول ضد النيوكاسل والآي بي.',
    targetDays: [7],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },

  // Phase 2: Immunity Building and Growth (Days 8-14)
  { 
    name: 'رافع مناعة (بيتا جلوكان) + فيتامين سي', 
    unit: 'سم³/لتر', 
    doseValue: 1,
    description: 'تقليل رد الفعل الناجم عن تحصين اليوم السابع.', 
    category: 'وقائي',
    timing: '12 ساعة',
    mixing: 'منفرداً',
    sequence: 'بعد التحصين مباشرة',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'دعم الطائر لتجاوز صدمة اللقاح دون خسائر وزن.',
    targetDays: [8],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'فيتامين هـ سيلينيوم', 
    unit: 'سم³/لتر', 
    doseValue: 1,
    description: 'مضاد أكسدة قوي، يحمي الخلايا ويرفع الحيوية.', 
    category: 'فيتامينات',
    timing: '12 ساعة',
    mixing: 'يمكن خلطه مع الفيتامينات الأخرى',
    sequence: 'دعم الجهاز التناسلي والمناعي',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'رفع جودة الاستجابة لللقاحات القادمة.',
    targetDays: [9, 10, 11],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'تحصين جمبورو (عترة متوسطة)', 
    unit: 'جرعة/طائر', 
    doseValue: 1,
    description: 'حماية غدة فابريشيا المسؤولة عن المناعة.', 
    category: 'تحصين',
    timing: 'ساعتان (في ماء الشرب)',
    mixing: 'ماء مع لبن منزوع الدسم',
    sequence: 'ممنوع إعطاء مطهرات قبلها بـ 48 ساعة',
    usageType: 'ضروري',
    recommendedHours: 2,
    benefits: 'الوقاية من الفيروس المدمر للمناعة.',
    targetDays: [12],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'مضاد كلوستريديا (أموكسيسيلين)', 
    unit: 'جرام/لتر', 
    doseValue: 1,
    description: 'التهاب الأمعاء النخري ينشط في هذا العمر.', 
    category: 'وقائي',
    timing: '12 ساعة',
    mixing: 'منفرداً',
    sequence: 'وقاية من بكتيريا الزرق المحتبس',
    usageType: 'وقائي/ضروري',
    recommendedHours: 12,
    benefits: 'حماية الأمعاء في نظام البطاريات المكثف.',
    targetDays: [13, 14],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص'],
    isAntibiotic: true
  },

  // Phase 3: Metabolic Stress and Feed Change (Days 15-24)
  { 
    name: 'مضاد سموم فطرية (بيولوجي)', 
    unit: 'سم³/لتر', 
    doseValue: 1,
    description: 'حماية الكبد عند تغيير العلف من بادي لنامي.', 
    category: 'وقائي',
    timing: '12 ساعة',
    mixing: 'لا يخلط مع المضادات الحيوية',
    sequence: 'مع تغيير العلف',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'منع تأثير السموم المخزنة في العلف المركز.',
    targetDays: [15, 16, 17],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'تحصين نيوكاسل (La Sota)', 
    unit: 'جرعة/طائر', 
    doseValue: 1,
    description: 'التنشيط النهائي للمناعة ضد النيوكاسل.', 
    category: 'تحصين',
    timing: 'ساعتان',
    mixing: 'ماء شرب بارد ونقي',
    sequence: 'التحصين الدوري لزيادة الأجسام المضادة',
    usageType: 'ضروري',
    recommendedHours: 2,
    benefits: 'تثبيت المناعة في مرحلة ما قبل التسويق.',
    targetDays: [18],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'غسيل كلوي + منشط كبد', 
    unit: 'سم³/لتر', 
    doseValue: 1,
    description: 'دعم الكلى والكبد لهضم البروتين العالي.', 
    category: 'داعم',
    timing: '12 ساعة',
    mixing: 'يمكن الخلط',
    sequence: 'خلال ذروة تحويل البروتين',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'الحفاظ على سرعة النمو القصوى دون إجهاد عضوي.',
    targetDays: [19, 20, 21],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'أحماض عضوية (Organic Acids)', 
    unit: 'سم³/لتر', 
    doseValue: 1,
    description: 'خفض قلوية الأمعاء (pH) لمنع نمو البكتيريا الضارة.', 
    category: 'داعم',
    timing: '12 ساعة',
    mixing: 'يمكن خلطها مع أحماض أمينية',
    sequence: 'تعقيم الأمعاء تنمية البكتيريا النافعة',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'تحسين كفاءة الهضم ومنع النشاط البكتيري المعوي.',
    targetDays: [22, 23, 24],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },

  // Phase 4: Final Fattening and Withdrawal Period (Days 25-35)
  { 
    name: 'مضاد سموم + غسيل كلوي', 
    unit: 'سم³/لتر', 
    doseValue: 1,
    description: 'الحفاظ على لون الكبد فاتحاً وصحياً استعداداً للبيع.', 
    category: 'داعم',
    timing: '12 ساعة',
    mixing: 'الخلط متاح',
    sequence: 'التنظيف النهائي للقطيع',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'رفع حيوية الطيور في مرحلة التزاحم النهائي.',
    targetDays: [25, 26, 27],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'فيتامين سي + إلكتروليت', 
    unit: 'جرام/لتر', 
    doseValue: 1,
    description: 'لتقليل الإجهاد الحراري الناتج عن التزاحم.', 
    category: 'فيتامينات',
    timing: '12 ساعة',
    mixing: 'منفرداً',
    sequence: 'إسعاف سريع في الأعمار الكبيرة',
    usageType: 'ضروري',
    recommendedHours: 12,
    benefits: 'منع الموت المفاجئ (القلب) الناتج عن الوزن الثقيل.',
    targetDays: [28, 29],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
  { 
    name: 'ماء نقي (بدون أدوية نهائياً)', 
    unit: 'لتر', 
    doseValue: 0,
    description: 'فترة الأمان: تنظيف اللحم من أي متبقيات كيماوية.', 
    category: 'أمان',
    timing: '24 ساعة',
    mixing: 'ماء فقط',
    sequence: 'ممنوع أي مدخل دوائي',
    usageType: 'وقائي/ضروري',
    recommendedHours: 24,
    benefits: 'ضمان أن اللحم صالح للاستهلاك البشري (صفر متبقيات).',
    targetDays: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
    climates: ['شتاء', 'صيف', 'معتدل', 'برد قارص']
  },
];
