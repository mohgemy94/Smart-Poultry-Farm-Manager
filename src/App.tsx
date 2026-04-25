/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart2, 
  Settings, 
  Droplets, 
  Wind, 
  Activity, 
  ChevronRight, 
  ChevronDown,
  Thermometer, 
  Calendar,
  AlertCircle,
  PlusCircle,
  Stethoscope,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  Trash2,
  Zap,
  Plus,
  Layers,
  Wallet,
  TrendingUp,
  Banknote,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import { 
  Strain, 
  getDailyStats, 
  getTargetTemperature,
  getTargetHumidity,
  CLIMATE_FACTORS, 
  MEDICATIONS, 
  DailyData 
} from '@/src/lib/data';
import { cn } from '@/src/lib/utils';

// --- Types ---
type Screen = 'dashboard' | 'medication' | 'climate' | 'ventilation' | 'humidity' | 'charts' | 'setup' | 'battery' | 'finances';

// --- Utils ---
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "L", x, y, "Z"].join(" ");
};

interface AppState {
  strain: Strain;
  totalChicks: number;
  age: number;
  climate: keyof typeof CLIMATE_FACTORS;
  breedingSystem: 'Battery-3' | 'Floor';
  medDuration: 6 | 8 | 12 | 24;
  fanCapacity: number; // m3/hr
  cyclesPerHour: number;
  // Humidity/Cooling props
  externalTemp: number;
  internalTemp: number;
  currentHumidity: number;
  coolingPadArea: number; // m2
  pumpOnTime: number; // mins
  pumpOffTime: number; // mins
  medicationLogs: Record<string, string>; // age-medName -> startTime
  emergencyMeds: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    duration: number;
    age: number;
  }[];
  barnLength: number;
  barnWidth: number;
  barnHeight: number;
  batteryLength: number;
  batteryWidth: number;
  batteryTiers: number;
  externalEquipment: boolean;
  // Finance
  chickPrice: number;
  feedPrice: number;
  sellingPrice: number;
  electricityBills: { id: string, label: string, amount: number }[];
  waterBills: { id: string, label: string, amount: number }[];
  medicationBills: { id: string, label: string, amount: number }[];
  otherBills: { id: string, label: string, amount: number }[];
}

// --- Components ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const Card: React.FC<CardProps> = ({ children, className, id }) => (
  <div id={id} className={cn("bento-card", className)}>
    {children}
  </div>
);

const Stat = ({ label, value, unit, icon: Icon, color, subLabel, subValue }: { label: string, value: string | number, unit?: string, icon?: any, color?: string, subLabel?: string, subValue?: string | number }) => (
  <Card className="flex flex-col gap-1 hover:border-white/20">
    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
      {Icon && <Icon size={14} className={color} />}
      {label}
    </div>
    <div className="flex items-baseline gap-1 mt-2">
      <span className="text-3xl font-black text-white tracking-tight">{value}</span>
      {unit && <span className="text-slate-500 text-xs font-bold uppercase">{unit}</span>}
    </div>
    {subValue !== undefined && (
      <div className="flex items-center gap-1 mt-1 border-t border-white/5 pt-1">
        <span className="text-[9px] font-bold text-slate-500 uppercase pb-0.5">{subLabel}:</span>
        <span className={cn("text-[10px] font-black", color)}>{subValue}</span>
      </div>
    )}
  </Card>
);

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = localStorage.getItem('poultry_app_screen');
    return (saved as Screen) || 'setup';
  });

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('poultry_app_state');
    const defaultState: AppState = {
      strain: 'Cobb',
      totalChicks: 1000,
      age: 1,
      climate: 'معتدل',
      breedingSystem: 'Battery-3',
      medDuration: 8,
      fanCapacity: 5000,
      cyclesPerHour: 4,
      externalTemp: 25,
      internalTemp: 28,
      currentHumidity: 65,
      coolingPadArea: 25,
      pumpOnTime: 2,
      pumpOffTime: 8,
      medicationLogs: {},
      emergencyMeds: [],
      barnLength: 100,
      barnWidth: 12,
      barnHeight: 3,
      batteryLength: 0.6,
      batteryWidth: 0.5,
      batteryTiers: 3,
      externalEquipment: true,
      chickPrice: 30,
      feedPrice: 22,
      sellingPrice: 75,
      electricityBills: [],
      waterBills: [],
      medicationBills: [],
      otherBills: []
    };
    if (saved) {
      try {
        return { ...defaultState, ...JSON.parse(saved) };
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('poultry_app_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('poultry_app_screen', screen);
  }, [screen]);

  const getClimateFromTemp = (temp: number): keyof typeof CLIMATE_FACTORS => {
    if (temp <= 10) return 'بارد جدا';
    if (temp <= 22) return 'بارد';
    if (temp <= 30) return 'معتدل';
    if (temp <= 38) return 'حار';
    return 'حار جدا';
  };

  React.useEffect(() => {
    setState(prev => ({ 
      ...prev, 
      climate: getClimateFromTemp(prev.externalTemp) 
    }));
  }, [state.externalTemp]);

  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dailyStats = useMemo(() => getDailyStats(state.strain, state.age), [state.strain, state.age]);
  const climateInfo = CLIMATE_FACTORS[state.climate];

  // Derived Calculations
  const herdBiomass = (state.totalChicks * dailyStats.weight) / 1000; // in kg
  const dailyFeedTotal = (state.totalChicks * dailyStats.dailyFeed) / 1000; // in kg
  const dailyWaterTotal = (dailyFeedTotal * climateInfo.waterFactor); // Simplified: 1.6-2.2x feed by weight is a rough rule, but manuals use ml/bird
  const dailyWaterTotalLiters = Math.round((state.totalChicks * dailyStats.dailyWater * (climateInfo.waterFactor / 1.8)) / 1000); // Adjusted for climate
  
  const dailyMeds = useMemo(() => {
    const meds = MEDICATIONS.filter((m: any) => m.targetDays.includes(state.age) && m.climates.includes(state.climate));
    const totalHoursOccupied = meds.reduce((acc, m) => acc + m.recommendedHours, 0);
    
    let remainingWater = dailyWaterTotalLiters;
    const processedMeds = [];

    // First, handle all actual medications
    for (let i = 0; i < meds.length; i++) {
       const m = meds[i];
       let medWater = 0;
       
       // Standard industry weights for water distribution:
       // 2h (Vaccination) = 20% of daily intake
       // 8h = 45%
       // 12h = 65%
       // If it's the only med and it's 24h = 100%
       
       if (m.recommendedHours >= 24) {
          medWater = dailyWaterTotalLiters;
       } else if (m.recommendedHours >= 12) {
          medWater = Math.round(dailyWaterTotalLiters * 0.65);
       } else if (m.recommendedHours >= 8) {
          medWater = Math.round(dailyWaterTotalLiters * 0.45);
       } else if (m.recommendedHours <= 2) {
          medWater = Math.round(dailyWaterTotalLiters * 0.20);
       } else {
          medWater = Math.round(dailyWaterTotalLiters * (m.recommendedHours / 24));
       }

       // Clamp and track
       medWater = Math.min(medWater, remainingWater);
       remainingWater -= medWater;
       
       processedMeds.push({ ...m, calculatedWater: medWater });
    }

    // Then, handle the rest period if any hours or water remain
    if (totalHoursOccupied < 24) {
      processedMeds.push({
        name: 'ماء نقي (فترة راحة)',
        description: 'غسيل للمواسير وراحة فسيولوجية للطائر.',
        category: 'أمان',
        timing: 'ما تبقى من اليوم',
        mixing: 'ماء نظيف فقط بدون إضافات',
        sequence: 'ضروري بين الجرعات المختلفة',
        recommendedHours: 24 - totalHoursOccupied,
        benefits: 'يسمح للكبد والكلى بمعالجة الجرعات السابقة ويمنع الترسيب.',
        isRest: true,
        doseValue: 0,
        unit: 'لتر',
        calculatedWater: remainingWater // Take the rest of the water
      } as any);
      remainingWater = 0;
    } else if (remainingWater > 0 && processedMeds.length > 0) {
       // If no time left but water left (rounding), add to last medication
       processedMeds[processedMeds.length - 1].calculatedWater += remainingWater;
    }

    return processedMeds;
  }, [state.age, state.climate, dailyWaterTotalLiters]);

  const nextDayFirstMed = useMemo(() => {
    const meds = MEDICATIONS.filter((m: any) => m.targetDays.includes(state.age + 1) && m.climates.includes(state.climate));
    return meds.length > 0 ? meds[0] : null;
  }, [state.age, state.climate]);

  const prevDayMeds = useMemo(() => {
    if (state.age <= 1) return [];
    
    // We need to calculate what the dailyMeds for prev day was
    const prevAge = state.age - 1;
    const meds = MEDICATIONS.filter((m: any) => m.targetDays.includes(prevAge) && m.climates.includes(state.climate));
    const totalHoursOccupied = meds.reduce((acc, m) => acc + m.recommendedHours, 0);
    
    const processedMeds = [...meds];
    if (totalHoursOccupied < 24) {
      processedMeds.push({
        name: 'ماء نقي (فترة راحة)',
        recommendedHours: 24 - totalHoursOccupied,
        isRest: true
      } as any);
    }
    return processedMeds;
  }, [state.age, state.climate]);

  const lastMedPrevDay = prevDayMeds.length > 0 ? prevDayMeds[prevDayMeds.length - 1] : null;
  const lastMedPrevDayKey = lastMedPrevDay ? `${state.age - 1}-${lastMedPrevDay.name}` : null;
  const lastMedStartTime = lastMedPrevDayKey ? state.medicationLogs[lastMedPrevDayKey] : null;

  const addEmergencyMed = (startTime?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      emergencyMeds: [
        ...prev.emergencyMeds,
        {
          id,
          name: '',
          startTime: startTime || '',
          duration: 0,
          endTime: '',
          age: prev.age
        }
      ]
    }));
  };

  const updateEmergencyMed = (id: string, updates: any) => {
    setState(prev => ({
      ...prev,
      emergencyMeds: prev.emergencyMeds.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  };

  const removeEmergencyMed = (id: string) => {
    setState(prev => ({
      ...prev,
      emergencyMeds: prev.emergencyMeds.filter(m => m.id !== id)
    }));
  };

  const getDayTransitionInfo = () => {
    if (!lastMedStartTime || !lastMedPrevDay) return null;
    const nextMed = dailyMeds[0];
    const info = getNextTime(lastMedStartTime, lastMedPrevDay, nextMed);
    return info;
  };

  const currentAgeEmergencyMeds = useMemo(() => {
    return state.emergencyMeds.filter(m => m.age === state.age);
  }, [state.emergencyMeds, state.age]);

  const getLatestActivityEndTime = () => {
    let latestTime: Date | null = null;
    let latestMed: any = null;

    // Check transition from previous day
    const prevDayInfo = getDayTransitionInfo();
    if (prevDayInfo) {
      const [h, m] = prevDayInfo.endTimeStr.split(' ')[0].split(':').map(Number);
      const isPM = prevDayInfo.endTimeStr.includes('م');
      const date = new Date();
      date.setHours(isPM ? (h % 12) + 12 : h % 12, m, 0, 0);
      latestTime = date;
      latestMed = lastMedPrevDay;
    }

    // Check scheduled meds logged today
    dailyMeds.forEach(med => {
      const medKey = `${state.age}-${med.name}`;
      const log = state.medicationLogs[medKey];
      if (log) {
        const [h, m] = log.split(':').map(Number);
        const date = new Date();
        date.setHours(h + med.recommendedHours, m, 0, 0);
        if (!latestTime || date > latestTime) {
          latestTime = date;
          latestMed = med;
        }
      }
    });

    // Check emergency meds logged today
    currentAgeEmergencyMeds.forEach(med => {
      if (med.startTime && med.duration) {
        const [h, m] = med.startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h + med.duration, m, 0, 0);
        if (!latestTime || date > latestTime) {
          latestTime = date;
          latestMed = med;
        }
      }
    });

    return { latestTime, latestMed };
  };

  const getSuggestedStartTime = (med: any) => {
    const { latestTime, latestMed } = getLatestActivityEndTime();
    if (!latestTime) return null;

    // Calculate gap
    const nextInfo = getNextTime(
      `${latestTime.getHours().toString().padStart(2, '0')}:${latestTime.getMinutes().toString().padStart(2, '0')}`,
      latestMed,
      med
    );

    if (nextInfo) {
      const [hPart, mPart] = nextInfo.nextStartTimeStr.split(' ')[0].split(':').map(Number);
      const isPM = nextInfo.nextStartTimeStr.includes('م');
      const displayH = isPM ? (hPart % 12) + 12 : hPart % 12;
      return `${displayH.toString().padStart(2, '0')}:${mPart.toString().padStart(2, '0')}`;
    }

    return null;
  };

  const unifiedTimeline = useMemo(() => {
    const scheduled = dailyMeds.map((m, i) => ({
      ...m,
      type: 'scheduled' as const,
      startTime: state.medicationLogs[`${state.age}-${m.name}`],
      originalIndex: i
    }));

    const emergency = currentAgeEmergencyMeds.map(m => ({
      ...m,
      type: 'emergency' as const,
      recommendedHours: m.duration || 0,
      originalIndex: 100 // High enough to be after scheduled by default if unlogged
    }));

    const all = [...scheduled, ...emergency];

    return all.sort((a, b) => {
      // 1. Both have startTime - sort chronologically
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      
      // 2. One has startTime - the one with startTime goes relative to others
      // This is the hard part without more data.
      // Let's assume if an item has startTime, it's 'active' in the timeline.
      // If it doesn't, it stays in its slot.
      
      if (a.startTime && !b.startTime) {
        // If a is before a later scheduled med, it should be before it.
        // But b doesn't have a time. Let's just use original order for unlogged.
        return -1; 
      }
      if (!a.startTime && b.startTime) return 1;

      // 3. Both unlogged - original order
      return a.originalIndex - b.originalIndex;
    });
  }, [dailyMeds, currentAgeEmergencyMeds, state.medicationLogs, state.age]);

  const calculateMedWater = (hours: number, totalDaily: number) => {
    // Legacy helper - kept for backward compatibility if needed elsewhere
    if (hours >= 24) return totalDaily;
    if (hours >= 12) return Math.round(totalDaily * 0.65);
    if (hours >= 8) return Math.round(totalDaily * 0.45);
    if (hours <= 2) return Math.round(totalDaily * 0.20); 
    return Math.round(totalDaily * (hours / 24));
  };

  const formatArabicTime = (date: Date) => {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const period = h >= 12 ? 'م' : 'ص';
    const displayH = h % 12 || 12;
    return `${displayH}:${m} ${period}`;
  };

  const getNextTime = (startTime: string, med: any, nextMed: any) => {
    if (!startTime || !nextMed) return null;
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    
    // 1. Current medication finishes
    const endDate = new Date(date);
    const durationHours = med.recommendedHours || med.duration || 0;
    endDate.setHours(endDate.getHours() + durationHours);
    const endTimeStr = formatArabicTime(endDate);

    let label = "موعد الجرعة التالية";
    let gapText = "";
    let gapDuration = 0;
    let gapType: 'none' | 'wash' | 'thirst' = 'none';
    
    // 2. Logic for Gap/Thirsting
    const nextDate = new Date(endDate);
    if (!med.isRest && !nextMed.isRest) {
      if (nextMed.category === 'تحصين') {
        // Before vaccination: 2 hours of thirsting (no water)
        gapType = 'thirst';
        gapDuration = 2;
        label = "موعد بدء التحصين";
        nextDate.setHours(nextDate.getHours() + gapDuration);
        gapText = "ساعتي تعطيش";
      } else {
        // Between two meds: 1 hour of clear water
        gapType = 'wash';
        gapDuration = 1;
        label = "موعد الجرعة التالية";
        nextDate.setHours(nextDate.getHours() + gapDuration);
        gapText = "ساعة غسيل بماء نقي";
      }
    }
    
    const nextStartTimeStr = formatArabicTime(nextDate);
    return { endTimeStr, nextStartTimeStr, label, gapText, gapType, gapDuration };
  };

  // New Ventilation Logic (Spec v2)
  // Min: 1 m3/hr per kg
  // Max: 7 m3/hr per kg
  const minVentilation = Math.round(herdBiomass * 1);
  const maxVentilation = Math.round(herdBiomass * 7);

  const minFans = minVentilation / state.fanCapacity;
  const maxFans = maxVentilation / state.fanCapacity;

  // Diagnostic Calculations
  const targetTemp = getTargetTemperature(state.age);
  const targetHumidity = getTargetHumidity(state.age);
  const tempDelta = state.internalTemp - targetTemp;
  
  // Wind Chill (Simple model: more ventilation capacity used = more cooling)
  // At min ventilation, we assume a basic airflow cooling effect
  const coolingFactor = Math.min(5, (minVentilation / state.fanCapacity) * 4);
  const realFeelTemp = Math.round((state.internalTemp - coolingFactor) * 10) / 10;
  
  const thi = state.internalTemp + state.currentHumidity;

  const chartData = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const stats = getDailyStats(state.strain, i + 1);
      return {
        day: i + 1,
        weight: stats.weight,
        feed: stats.dailyFeed,
        water: stats.dailyWater
      };
    });
  }, [state.strain]);

  // Medication Doses
  const medDoses = MEDICATIONS.map(med => ({
    ...med,
    totalAmout: Math.round(dailyWaterTotalLiters * 1), // Assuming 1 unit per liter standard for calculation display
  }));

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScreen('dashboard');
  };

  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans antialiased">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bento-card p-8 border-white/10"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
              <Activity size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white leading-none">بولتري برو</h1>
              <p className="text-blue-400 font-bold text-[10px] uppercase tracking-widest mt-1">نظام الإدارة الذكي</p>
            </div>
          </div>

          <form onSubmit={handleSetupSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">نوع السلالة</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Cobb', 'Ross', 'Avian'] as Strain[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, strain: s }))}
                      className={cn(
                        "py-3 px-4 rounded-xl text-xs font-black transition-all border-2",
                        state.strain === s 
                          ? "bg-blue-600/20 border-blue-600 text-blue-400" 
                          : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      {s === 'Cobb' ? 'كوب' : s === 'Ross' ? 'روس' : 'إيفيان'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">العدد الكلي للكتاكيت</label>
                <input 
                  type="number"
                  value={state.totalChicks}
                  onChange={e => setState(prev => ({ ...prev, totalChicks: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-4 py-4 focus:border-blue-600 focus:outline-none font-black text-white text-lg transition-all"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">العمر الحالي (أيام)</label>
                <div className="flex items-center gap-6">
                  <input 
                    type="range"
                    min="1"
                    max="40"
                    value={state.age}
                    onChange={e => setState(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                    className="flex-1 accent-blue-600 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="bg-blue-600 text-white font-black px-4 py-2 rounded-xl text-lg min-w-[3.5rem] text-center shadow-lg shadow-blue-500/20">{state.age}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">الحرارة الخارجية (°م)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={state.externalTemp}
                  onChange={e => setState(prev => ({ ...prev, externalTemp: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-4 py-4 focus:border-blue-600 focus:outline-none font-black text-white text-lg transition-all"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">الحرارة الداخلية (°م)</label>
                <input 
                  type="number"
                  step="0.1"
                  value={state.internalTemp}
                  onChange={e => setState(prev => ({ ...prev, internalTemp: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-4 py-4 focus:border-blue-600 focus:outline-none font-black text-white text-lg transition-all"
                  placeholder="28"
                />
              </div>
            </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-right">أبعاد العنبر (متر)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">الطول</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={state.barnLength}
                      onChange={e => setState(prev => ({ ...prev, barnLength: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-md text-center transition-all"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">العرض</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={state.barnWidth}
                      onChange={e => setState(prev => ({ ...prev, barnWidth: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-md text-center transition-all"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">الارتفاع</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={state.barnHeight}
                      onChange={e => setState(prev => ({ ...prev, barnHeight: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-md text-center transition-all"
                      placeholder="3"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-right">مساحة الدور الواحد في البطارية (متر)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">الطول (العمق)</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={state.batteryLength}
                      onChange={e => setState(prev => ({ ...prev, batteryLength: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-md text-center transition-all"
                      placeholder="0.6"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">العرض (الواجهة)</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={state.batteryWidth}
                      onChange={e => setState(prev => ({ ...prev, batteryWidth: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-md text-center transition-all"
                      placeholder="0.5"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-right">عدد أدوار (طوابق) البطارية</label>
                <div className="flex items-center gap-6">
                  <input 
                    type="range"
                    min="1"
                    max="6"
                    value={state.batteryTiers}
                    onChange={e => setState(prev => ({ ...prev, batteryTiers: parseInt(e.target.value) }))}
                    className="flex-1 accent-purple-600 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="bg-purple-600 text-white font-black px-4 py-2 rounded-xl text-lg min-w-[3.5rem] text-center shadow-lg shadow-purple-500/20">{state.batteryTiers}</span>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
              >
                بدء الدورة
                <ChevronRight size={18} className="rotate-180" />
              </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32 font-sans antialiased text-white overflow-x-hidden">
      {/* Top Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl px-6 pt-10 pb-8 border-b border-white/5 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">بولتري برو</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="status-dot bg-green-500 animate-pulse glow-green"></span>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  اليوم {state.age} • {state.strain === 'Cobb' ? 'كوب' : state.strain === 'Ross' ? 'روس' : 'إيفيان'} • {state.totalChicks} طائر
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setScreen('setup')}
            className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-white transition-all border border-white/5"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-6 py-8 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {screen === 'finances' && (
            <motion.div 
              key="finances"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6 pb-20"
            >
              <header className="flex items-center gap-3 px-2 mb-2">
                <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-inner">
                  <Wallet size={24} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">الإدارة المالية</h2>
              </header>

              {/* Input Prices Card */}
              <Card className="bg-slate-900 border-white/5 p-6 space-y-6 text-right">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 justify-end">
                  <Settings size={16} className="text-blue-400" />
                  مدخلات الأسعار
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">سعر الكتكوت الواحد</label>
                    <input 
                      type="number"
                      value={state.chickPrice}
                      onChange={e => setState(prev => ({ ...prev, chickPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-black text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">سعر كجم العلف</label>
                    <input 
                      type="number"
                      value={state.feedPrice}
                      onChange={e => setState(prev => ({ ...prev, feedPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-black text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">سعر بيع اللحم (كجم)</label>
                    <input 
                      type="number"
                      value={state.sellingPrice}
                      onChange={e => setState(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-black text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </Card>

              {/* Main Summary Card */}
              <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 p-8 relative overflow-hidden text-right">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl -ml-16 -mt-16" />
                <div className="relative z-10 space-y-8">
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">إجمالي الأرباح المتوقعة</p>
                       <p className="text-4xl font-black text-emerald-400">
                         {(() => {
                           const costs = state.totalChicks * state.chickPrice + (state.totalChicks * dailyStats.cumFeed / 1000) * state.feedPrice + 
                                       [...state.electricityBills, ...state.waterBills, ...state.medicationBills, ...state.otherBills].reduce((acc, b) => acc + b.amount, 0);
                           const revenue = (state.totalChicks * dailyStats.weight / 1000) * state.sellingPrice;
                           return (revenue - costs).toLocaleString();
                         })()}
                         <span className="text-sm text-emerald-600 ms-3">ج.م</span>
                       </p>
                    </div>
                    <div className="w-full border-t border-white/5 pt-6">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">إجمالي التكلفة الحالية</p>
                       <p className="text-2xl font-black text-white py-1">
                         {(state.totalChicks * state.chickPrice + (state.totalChicks * dailyStats.cumFeed / 1000) * state.feedPrice + 
                           [...state.electricityBills, ...state.waterBills, ...state.medicationBills, ...state.otherBills].reduce((acc, b) => acc + b.amount, 0)).toLocaleString()}
                         <span className="text-xs text-slate-500 ms-2">ج.م</span>
                       </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">تكلفة الكتاكيت</p>
                      <p className="text-lg font-black text-white">{(state.totalChicks * state.chickPrice).toLocaleString()} ج.م</p>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">تكلفة العلف المستهلك</p>
                      <p className="text-lg font-black text-white">{Math.round((state.totalChicks * dailyStats.cumFeed / 1000) * state.feedPrice).toLocaleString()} ج.م</p>
                      <p className="text-[9px] text-slate-600 font-bold mt-1">الكمية: {Math.round(state.totalChicks * dailyStats.cumFeed / 1000)} كجم</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Bills Management */}
              <div className="space-y-4">
                <BillSection 
                   title="فواتير الكهرباء" 
                   bills={state.electricityBills} 
                   icon={Zap}
                   onAdd={() => setState(prev => ({ ...prev, electricityBills: [...prev.electricityBills, { id: Math.random().toString(36).substr(2, 9), label: 'فاتورة جديدة', amount: 0 }] }))}
                   onRemove={(id) => setState(prev => ({ ...prev, electricityBills: prev.electricityBills.filter(b => b.id !== id) }))}
                   onUpdate={(id, field, val) => setState(prev => ({ ...prev, electricityBills: prev.electricityBills.map(b => b.id === id ? { ...b, [field]: val } : b) }))}
                />
                <BillSection 
                   title="فواتير المياه" 
                   bills={state.waterBills} 
                   icon={Droplets}
                   onAdd={() => setState(prev => ({ ...prev, waterBills: [...prev.waterBills, { id: Math.random().toString(36).substr(2, 9), label: 'نثرية مياه', amount: 0 }] }))}
                   onRemove={(id) => setState(prev => ({ ...prev, waterBills: prev.waterBills.filter(b => b.id !== id) }))}
                   onUpdate={(id, field, val) => setState(prev => ({ ...prev, waterBills: prev.waterBills.map(b => b.id === id ? { ...b, [field]: val } : b) }))}
                />
                <BillSection 
                   title="فواتير الأدوية" 
                   bills={state.medicationBills} 
                   icon={Stethoscope}
                   onAdd={() => setState(prev => ({ ...prev, medicationBills: [...prev.medicationBills, { id: Math.random().toString(36).substr(2, 9), label: 'دواء إضافي', amount: 0 }] }))}
                   onRemove={(id) => setState(prev => ({ ...prev, medicationBills: prev.medicationBills.filter(b => b.id !== id) }))}
                   onUpdate={(id, field, val) => setState(prev => ({ ...prev, medicationBills: prev.medicationBills.map(b => b.id === id ? { ...b, [field]: val } : b) }))}
                />
                <BillSection 
                   title="فواتير أخرى" 
                   bills={state.otherBills} 
                   icon={Banknote}
                   onAdd={() => setState(prev => ({ ...prev, otherBills: [...prev.otherBills, { id: Math.random().toString(36).substr(2, 9), label: 'مصاريف أخرى', amount: 0 }] }))}
                   onRemove={(id) => setState(prev => ({ ...prev, otherBills: prev.otherBills.filter(b => b.id !== id) }))}
                   onUpdate={(id, field, val) => setState(prev => ({ ...prev, otherBills: prev.otherBills.map(b => b.id === id ? { ...b, [field]: val } : b) }))}
                />
              </div>
            </motion.div>
          )}
          {screen === 'battery' && (
            <motion.div 
              key="battery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <header className="flex items-center gap-3 px-2 mb-2">
                <div className="w-10 h-10 bg-purple-400/10 rounded-xl flex items-center justify-center text-purple-500 shadow-inner">
                  <Layers size={24} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">نظام البطاريات</h2>
              </header>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-900/60 border border-purple-500/20 p-5 rounded-3xl flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                        state.externalEquipment ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-slate-800 text-slate-500"
                      )}>
                        <Wind size={24} />
                      </div>
                      <div className="text-right">
                         <h4 className="text-sm font-black text-white">تجهيز خارجي متطور</h4>
                         <p className="text-[10px] text-slate-500 font-bold">معالف خارجية + خطوط نبل معلقة</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setState(prev => ({ ...prev, externalEquipment: !prev.externalEquipment }))}
                     className={cn(
                       "w-14 h-8 rounded-full relative transition-all duration-300",
                       state.externalEquipment ? "bg-emerald-500" : "bg-slate-700"
                     )}
                   >
                     <div className={cn(
                       "absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg",
                       state.externalEquipment ? "left-7" : "left-1"
                     )} />
                   </button>
                </div>

                <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 shadow-2xl relative overflow-hidden p-8">
                   <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 blur-3xl -ml-16 -mt-16" />
                   
                   <div className="flex items-center justify-between mb-8 relative z-10 text-right">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">أبعاد الدور الواحد</span>
                        <h3 className="text-xl font-black text-white">{state.batteryLength}م × {state.batteryWidth}م</h3>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 text-purple-400 shadow-inner">
                        <LayoutDashboard size={24} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-center">
                         <span className="text-[8px] font-black text-slate-600 uppercase mb-1 block">المساحة السطحية</span>
                         <p className="text-2xl font-black text-white">{(state.batteryLength * state.batteryWidth).toFixed(3)} <span className="text-xs text-slate-500">م²</span></p>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 text-center">
                         <span className="text-[8px] font-black text-slate-600 uppercase mb-1 block">عمر الكتكوت</span>
                         <p className="text-2xl font-black text-purple-400">{state.age} <span className="text-xs text-slate-500">يوم</span></p>
                      </div>
                   </div>

                   <div className="p-6 bg-purple-600/10 border border-purple-500/20 rounded-3xl text-center relative z-10 shadow-[0_0_20px_rgba(168,85,247,0.05)]">
                      <span className="text-[10px] font-black text-purple-300 uppercase tracking-[0.2em] mb-3 block">السعة الاستيعابية الموصى بها</span>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-4xl font-black text-white">
                            {Math.floor((state.batteryLength * state.batteryWidth) * (
                              state.age <= 7 ? 100 :
                              state.age <= 14 ? 60 :
                              state.age <= 21 ? 40 :
                              state.age <= 28 ? 25 : 15
                            ) * (state.externalEquipment ? 1.15 : 1))}
                          </p>
                          <span className="text-[10px] font-black text-purple-500 uppercase">كتكوت / للدور الواحد</span>
                        </div>
                        <div className="space-y-1 border-r border-purple-500/20">
                          <p className="text-4xl font-black text-emerald-400">
                            {state.batteryTiers * Math.floor((state.batteryLength * state.batteryWidth) * (
                              state.age <= 7 ? 100 :
                              state.age <= 14 ? 60 :
                              state.age <= 21 ? 40 :
                              state.age <= 28 ? 25 : 15
                            ) * (state.externalEquipment ? 1.15 : 1))}
                          </p>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">لإجمالي الأدوار ({state.batteryTiers})</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-purple-500/10">
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                          تم حساب الكثافة بناءً على المعايير العالمية لتربية الدواجن في البطاريات، حيث تتغير المساحة المخصصة لكل طائر مع زيادة العمر والوزن.
                        </p>
                      </div>
                   </div>
                </Card>

                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 flex gap-4 items-start">
                   <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                      <AlertCircle size={20} />
                   </div>
                   <div className="text-right">
                      <h4 className="text-xs font-black text-white mb-1">توجيهات التسكين</h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        في حالة التربية الأرضية (Floor) يتم تجاهل هذا القسم. هذا الحساب مخصص فقط لأنظمة البطاريات والأقفاص الحديثة. 
                        يجب مراعاة توزيع المشارب والمعالف لضمان وصول جميع الطيور للغذاء.
                      </p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <Stat 
                  label="إجمالي العلف" 
                  value={dailyFeedTotal.toFixed(0)} 
                  unit="كجم" 
                  icon={PieChartIcon} 
                  color="text-amber-400" 
                  subLabel="للطائر الواحد"
                  subValue={`${dailyStats.dailyFeed} جم`}
                />
                <Stat 
                  label="إجمالي الماء" 
                  value={dailyWaterTotalLiters} 
                  unit="لتر" 
                  icon={Droplets} 
                  color="text-blue-400" 
                  subLabel="للطائر الواحد"
                  subValue={`${Math.round(dailyStats.dailyWater * (climateInfo.waterFactor / 1.8))} مل`}
                />
                <Stat 
                  label="متوسط الوزن" 
                  value={dailyStats.weight} 
                  unit="جم" 
                  icon={ScaleIcon} 
                  color="text-emerald-400" 
                />
                <Stat 
                  label="الكتلة الحيوية" 
                  value={herdBiomass.toFixed(0)} 
                  unit="كجم" 
                  icon={ContainerIcon} 
                  color="text-purple-400" 
                />
              </div>

              <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-3xl -ml-16 -mb-16" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <Thermometer size={16} className="text-orange-400" />
                      المناخ المستهدف (حيوي)
                    </h3>
                    <div className="flex">
                      <span className="text-[9px] font-black text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-lg border border-blue-400/20 uppercase tracking-[0.1em]">
                        الوضع الحالي: {state.climate}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">عمر الطائر: {state.age} يوم</span>
                    <span className="text-[9px] font-bold text-blue-400">حمولة اللحم: {Math.round(herdBiomass).toLocaleString()} كجم</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">حرارة الهدف</p>
                      <Thermometer size={12} className="text-orange-400" />
                    </div>
                    <p className="text-3xl font-black text-white">{targetTemp}°م</p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 w-[75%]" />
                      </div>
                      <span className="text-[9px] font-black text-slate-500">مثالي</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">رطوبة الهدف</p>
                      <Droplets size={12} className="text-blue-400" />
                    </div>
                    <p className="text-3xl font-black text-white">{targetHumidity.min}-{targetHumidity.max}%</p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[60%]" />
                      </div>
                      <span className="text-[9px] font-black text-slate-500">متوازن</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">تحليل الأداء وفقاً للوزن الحالي</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900/40 border-slate-800 overflow-hidden relative group text-right">
                <div className="absolute top-0 left-0 p-8 text-slate-800 group-hover:text-slate-700 transition-colors">
                  <LayoutDashboard size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6 opacity-60">
                    <LayoutDashboard size={16} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">أبعاد العنبر</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">الطول</p>
                      <p className="text-xl font-black text-white">{state.barnLength}م</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">العرض</p>
                      <p className="text-xl font-black text-white">{state.barnWidth}م</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">الارتفاع</p>
                      <p className="text-xl font-black text-white">{state.barnHeight}م</p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[12px] font-black text-white">{(state.barnLength * state.barnWidth * state.barnHeight).toLocaleString()} م³</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">حجم الهواء الكلي</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900/40 border-slate-800 overflow-hidden relative group text-right">
                <div className="absolute top-0 left-0 p-8 text-slate-800 group-hover:text-slate-700 transition-colors">
                  <Wind size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6 opacity-60">
                    <Wind size={16} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">إجمالي الاحتياج</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-black tracking-tighter text-white">{minVentilation.toLocaleString()}</span>
                    <span className="text-slate-500 font-black text-sm uppercase">م³/ساعة</span>
                  </div>
                  <div className="mt-8 flex gap-2">
                    <div className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest">حمولة اللحم: {Math.round(herdBiomass).toLocaleString()} كجم</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {screen === 'medication' && (
            <motion.div 
              key="medication"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <header className="flex items-center justify-between px-2 mb-2">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-400/10 rounded-xl flex items-center justify-center text-red-500 shadow-inner">
                    <Stethoscope size={24} />
                  </div>
                  برنامج الأدوية
                </h2>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-[14px] font-black text-white bg-blue-600 px-5 py-2.5 rounded-2xl shadow-lg border border-white/10 flex items-center gap-2">
                    <Droplets size={16} />
                    {dailyWaterTotalLiters} لتر (إجمالي اليوم)
                  </div>
                </div>
              </header>

              <div className="px-2 mb-4 space-y-3">
                {/* Unified Timeline Header */}
                <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-3xl mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Zap size={18} className="text-red-500" />
                       <span className="text-sm font-black text-white">إدارة الجرعات والبرنامج العلاجي</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSuggestedStartTime({ isRest: false, category: 'عام' }) && (
                        <button 
                          onClick={() => addEmergencyMed(getSuggestedStartTime({ isRest: false, category: 'عام' }) || undefined)}
                          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-black px-3 py-1.5 rounded-xl transition-colors border border-white/5"
                        >
                          <Clock size={12} className="text-amber-400" />
                          بدء بعد آخر نشاط
                        </button>
                      )}
                      <button 
                        onClick={() => addEmergencyMed()}
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-colors shadow-lg shadow-red-900/20"
                      >
                        <Plus size={14} />
                        إضافة جرعة طارئة
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-white/5 p-5 rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">البرنامج العلاجي الموحد (مجدول + طارئ)</span>
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest text-right">
                       عمر القطيع: {state.age} يوم
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {unifiedTimeline.length > 0 ? (
                      <>
                        {getDayTransitionInfo() && (
                          <div className="bg-slate-800/40 border border-slate-700/50 px-4 py-3 rounded-2xl mb-2 border-s-4 border-s-slate-500 text-right">
                             <div className="flex items-center gap-2 mb-1 justify-end">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">متابعة من اليوم السابق:</span>
                               <Clock size={12} className="text-slate-400" />
                             </div>
                             <div className="space-y-1">
                               <p className="text-[11px] font-black text-white/90">
                                 آخر جرعة أمس: 
                                 <span className="mx-1 text-sky-400 font-bold">
                                   {lastMedPrevDay?.name}
                                 </span>
                               </p>
                               <p className="text-[11px] font-black text-white/90">
                                 انتهت الساعة: 
                                 <span className="mx-1 text-blue-400">
                                   {getDayTransitionInfo()?.endTimeStr}
                                 </span>
                               </p>
                             </div>
                             <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-white/5 items-end">
                               {getDayTransitionInfo()?.gapType !== 'none' && (
                                 <div className="flex items-center gap-1.5">
                                   <p className="text-[9px] font-bold text-slate-400">
                                     فاصل زمني: {getDayTransitionInfo()?.gapText} ({getDayTransitionInfo()?.gapDuration} ساعة)
                                   </p>
                                   <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                 </div>
                               )}
                               <div className="flex items-center gap-1.5">
                                 <p className="text-[10px] font-black text-amber-500">
                                   {getDayTransitionInfo()?.label}: 
                                   <span className="ms-1 text-white">الساعة {getDayTransitionInfo()?.nextStartTimeStr}</span>
                                 </p>
                                 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                               </div>
                             </div>
                          </div>
                        )}

                        {unifiedTimeline.map((item, i) => {
                          if (item.type === 'emergency') {
                            const med = item;
                            const nextItem = unifiedTimeline[i + 1];
                            const localNextDayFirstMed = i === unifiedTimeline.length - 1 ? nextDayFirstMed : null;

                            return (
                              <div key={med.id} className="bg-red-500/5 border border-red-500/20 p-5 rounded-3xl relative group border-s-4 border-s-red-600">
                                <button 
                                  onClick={() => removeEmergencyMed(med.id)}
                                  className="absolute top-4 left-4 text-slate-600 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>

                                <div className="flex items-center gap-3 mb-4 justify-end">
                                  <div className="text-right">
                                    <h3 className="text-sm font-black text-white">جرعة طوارئ</h3>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">تلقائي الترتيب ضمن المواعيد</p>
                                  </div>
                                  <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-500 border border-red-600/20 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                                    <Zap size={20} />
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block text-center">اسم الجرعة</label>
                                      <input 
                                        type="text"
                                        value={med.name}
                                        onChange={(e) => updateEmergencyMed(med.id, { name: e.target.value })}
                                        placeholder="مثال: مضاد سموم طارئ"
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500/50 text-center shadow-inner"
                                      />
                                    </div>
                                    <div className="flex flex-col space-y-3 mb-1 max-w-[280px] mx-auto">
                                      {/* Start Time Field */}
                                      <div className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-2xl border border-white/5 shadow-xl">
                                        <div className="text-left flex flex-col justify-center min-w-[60px]">
                                          <span className="text-[11px] font-black text-slate-400 leading-tight">وقت</span>
                                          <span className="text-[11px] font-black text-slate-400 leading-tight">البدء:</span>
                                        </div>
                                        <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 flex items-center shadow-inner relative group cursor-pointer h-[42px]">
                                          {/* Native Input - Invisible but covers the whole area to trigger picker */}
                                          <input 
                                            type="time"
                                            value={med.startTime}
                                            onChange={(e) => updateEmergencyMed(med.id, { startTime: e.target.value })}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20 [color-scheme:dark]"
                                          />
                                          
                                          {/* Custom Display - This is what the user actually sees */}
                                          <div className="flex items-center justify-between w-full z-10 pointer-events-none">
                                            <ChevronDown size={14} className="text-slate-500" />
                                            
                                            <div className="flex items-center gap-2">
                                              {med.startTime && (
                                                <span className="text-[15px] font-black text-white leading-none">
                                                  {(() => {
                                                    const [h, m] = med.startTime.split(':').map(Number);
                                                    const displayH = h % 12 || 12;
                                                    const displayM = m.toString().padStart(2, '0');
                                                    return `${displayH}:${displayM}`;
                                                  })()}
                                                </span>
                                              )}
                                              {med.startTime && (
                                                <span className="text-[15px] font-black text-white leading-none min-w-[15px]">
                                                  {(() => {
                                                    const [h] = med.startTime.split(':').map(Number);
                                                    return h >= 12 ? 'م' : 'ص';
                                                  })()}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Duration Field */}
                                      <div className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-2xl border border-white/5 shadow-xl">
                                        <div className="text-left flex flex-col justify-center min-w-[60px]">
                                          <span className="text-[11px] font-black text-slate-400 leading-tight">المدة</span>
                                          <span className="text-[11px] font-black text-slate-400 leading-tight">(ساعات):</span>
                                        </div>
                                        <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 shadow-inner">
                                          <input 
                                            type="number"
                                            value={med.duration || ''}
                                            onChange={(e) => updateEmergencyMed(med.id, { duration: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-transparent text-white text-[15px] font-black focus:outline-none text-center [&::-webkit-inner-spin-button]:hidden leading-none"
                                            placeholder="8"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col justify-end">
                                    {med.startTime && med.duration > 0 && (
                                      <div className="p-4 bg-red-600/10 rounded-2xl border border-red-600/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">توقيت الانتهاء:</span>
                                          <span className="text-xs font-black text-red-400">
                                            {(() => {
                                              const [h, m] = med.startTime.split(':').map(Number);
                                              const d = new Date();
                                              d.setHours(h + med.duration, m, 0, 0);
                                              return formatArabicTime(d);
                                            })()}
                                          </span>
                                        </div>

                                        {(() => {
                                          const nextAct = nextItem || localNextDayFirstMed;
                                          if (!nextAct) return null;

                                          const nextInfo = getNextTime(med.startTime, med, nextAct);
                                          if (!nextInfo) return null;

                                          return (
                                            <>
                                              <div className="flex items-center gap-2 py-1.5 px-3 bg-amber-500/10 rounded-lg border border-amber-500/20 justify-end">
                                                <span className="text-[9px] font-black text-amber-200">{nextInfo.gapText}</span>
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">:الفاصل المطلوب</span>
                                              </div>
                                              <div className="flex items-center justify-between border-t border-red-500/20 pt-2 text-right">
                                                <div className="flex items-center gap-1.5">
                                                  <Zap size={10} className="text-emerald-400 shrink-0" />
                                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">التالي ({nextAct.name}):</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-xs font-black text-emerald-400 whitespace-nowrap">{nextInfo.nextStartTimeStr}</span>
                                                  {nextItem && nextItem.type === 'scheduled' && (
                                                    <button 
                                                      onClick={() => {
                                                        const medKey = `${state.age}-${nextItem.name}`;
                                                        const [hPart, mPart] = nextInfo.nextStartTimeStr.split(' ')[0].split(':').map(Number);
                                                        const isPM = nextInfo.nextStartTimeStr.includes('م');
                                                        const displayH = isPM ? (hPart % 12) + 12 : hPart % 12;
                                                        const rawTime = `${displayH.toString().padStart(2, '0')}:${mPart.toString().padStart(2, '0')}`;
                                                        
                                                        setState(prev => ({
                                                          ...prev,
                                                          medicationLogs: {
                                                            ...prev.medicationLogs,
                                                            [medKey]: rawTime
                                                          }
                                                        }));
                                                      }}
                                                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] font-black px-2 py-1 rounded-lg transition-colors active:scale-95 shadow-lg shadow-emerald-500/20"
                                                    >
                                                      تطبيق
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          } else {
                            const med = item;
                            const medKey = `${state.age}-${med.name}`;
                            const nextItem = unifiedTimeline[i + 1];
                            const localNextDayFirstMed = i === unifiedTimeline.length - 1 ? nextDayFirstMed : null;

                            return (
                              <div key={i} className={cn(
                                "bg-slate-800/40 border border-white/5 p-4 rounded-3xl flex flex-col gap-4 border-s-4 shadow-sm",
                                med.isRest ? "border-s-emerald-500/50 opacity-70" : "border-s-blue-500"
                              )}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border shadow-inner",
                                      med.isRest ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20" : "bg-blue-600/10 text-blue-400 border-blue-500/20"
                                    )}>
                                      {med.originalIndex + 1}
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-white text-right">{med.name}</p>
                                      <div className="flex items-center gap-2 mt-1 justify-end">
                                        <span className="text-[10px] font-bold text-blue-400">مدة الإعطاء: {med.recommendedHours} ساعات</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                          {med.timing}
                                          <Clock size={10} className="text-slate-500" />
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-black text-white">{med.calculatedWater} <span className="text-[10px] text-slate-500 uppercase">لتر</span></div>
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest ps-1">
                                      {med.isRest ? 'مياه نقية' : 'مياه الجرعة'}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ps-2">وقت البدء:</span>
                                    <input 
                                      type="time" 
                                      value={state.medicationLogs[medKey] || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setState(prev => ({
                                          ...prev,
                                          medicationLogs: {
                                            ...prev.medicationLogs,
                                            [medKey]: val
                                          }
                                        }));
                                      }}
                                      className="bg-slate-950 text-white text-xs font-black border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50 transition-colors w-32 shadow-inner"
                                    />
                                    {!state.medicationLogs[medKey] && getSuggestedStartTime(med) && (
                                      <button 
                                        onClick={() => {
                                          const suggested = getSuggestedStartTime(med);
                                          if (suggested) {
                                            setState(prev => ({
                                              ...prev,
                                              medicationLogs: {
                                                ...prev.medicationLogs,
                                                [medKey]: suggested
                                              }
                                            }));
                                          }
                                        }}
                                        className="text-[9px] font-black text-amber-500 hover:text-white hover:bg-amber-500 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 transition-all active:scale-95"
                                      >
                                        <Clock size={10} />
                                        ربط (بعد النشاط السابق): {formatArabicTime((() => {
                                          const s = getSuggestedStartTime(med);
                                          const [h, m] = s!.split(':').map(Number);
                                          const d = new Date();
                                          d.setHours(h, m, 0, 0);
                                          return d;
                                        })())}
                                      </button>
                                    )}
                                    {state.medicationLogs[medKey] && (
                                      <div className="text-[9px] font-bold text-emerald-400 bg-emerald-400/5 px-2.5 py-1 rounded-lg border border-emerald-400/10 flex items-center gap-1.5">
                                        <CheckCircle2 size={12} />
                                        تم التسجيل
                                      </div>
                                    )}
                                  </div>

                                  {state.medicationLogs[medKey] && (i < unifiedTimeline.length - 1 || localNextDayFirstMed) && (
                                    <div className="px-4 py-3 bg-white/5 rounded-2xl flex flex-col gap-2.5 border border-white/5">
                                      {(() => {
                                        const nextAct = nextItem || localNextDayFirstMed;
                                        const nextInfo = getNextTime(state.medicationLogs[medKey], med, nextAct);
                                        if (!nextInfo) return null;
                                        
                                        return (
                                          <>
                                            <div className="flex items-center justify-between">
                                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">موعد الانتهاء:</span>
                                              <span className="text-xs font-black text-blue-400">{nextInfo.endTimeStr}</span>
                                            </div>

                                            {nextInfo.gapType !== 'none' && (
                                              <div className="flex items-center gap-2 py-1.5 px-3 bg-amber-500/10 rounded-lg border border-amber-500/20 justify-end">
                                                <span className="text-[9px] font-black text-amber-200">{nextInfo.gapText}</span>
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">:الفاصل المطلوب</span>
                                              </div>
                                            )}

                                            <div className="flex items-center justify-between border-t border-white/5 pt-2 text-right">
                                              <div className="flex items-center gap-1.5">
                                                <Clock size={10} className="text-emerald-400 shrink-0" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">
                                                  {i === unifiedTimeline.length - 1 ? "أول جرعة غداً (" + (state.age + 1) + "):" : nextInfo.label + " (" + nextAct.name + "):"}
                                                </span>
                                              </div>
                                              <span className="text-xs font-black text-emerald-400 whitespace-nowrap">{nextInfo.nextStartTimeStr}</span>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        })}
                      </>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                           <Activity size={32} className="mb-4" />
                           <p className="text-xs font-bold uppercase tracking-widest">لا توجد جرعات مجدولة لهذا العمر</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {dailyMeds.map((med: any, idx) => {
                  const totalSpecificDose = Math.round(med.calculatedWater * med.doseValue);
                  const isWithdrawalRisk = state.age >= 28 && med.isAntibiotic;
                  
                  return (
                    <Card key={idx} className={cn(
                      "hover:bg-slate-800/80 transition-all cursor-pointer group border-white/5 overflow-hidden p-0",
                      isWithdrawalRisk ? "border-red-500/50 bg-red-500/5" : "hover:border-blue-400/30"
                    )}>
                      <div className="bg-slate-950/30 px-5 py-2 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                            med.category === 'تأسيس' ? "bg-emerald-500/10 text-emerald-400" :
                            med.category === 'وقائي' ? "bg-red-500/10 text-red-400" :
                            med.category === 'تحصين' ? "bg-purple-500/10 text-purple-400" : "bg-amber-500/10 text-amber-400"
                          )}>
                            {med.category}
                          </span>
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={8} />
                            الموصى به: {med.recommendedHours} ساعات
                          </span>
                        </div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">اليوم {state.age}</span>
                      </div>

                      {isWithdrawalRisk && (
                        <div className="bg-red-500/20 px-5 py-1.5 flex items-center gap-2 border-b border-red-500/20">
                          <AlertCircle size={12} className="text-red-400" />
                          <span className="text-[9px] font-black text-red-300 uppercase tracking-widest">تحذير: فترة سحب (Withdrawal Period) - يمنع استخدام المضادات</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-5 pb-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-1.5 h-10 rounded-full bg-slate-800 transition-all",
                            isWithdrawalRisk ? "bg-red-600" : "group-hover:bg-blue-600"
                          )}></div>
                          <div>
                            <h4 className="font-black text-lg text-white group-hover:text-blue-400 transition-colors ps-4">{med.name}</h4>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5 ps-4">{med.description}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-2xl font-black text-white tracking-tight">
                            {totalSpecificDose} <span className="text-[10px] font-black text-slate-600 uppercase">{med.unit.split('/')[0]}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <Droplets size={10} className="text-blue-500" />
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">على {med.calculatedWater} لتر ماء</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-950/50 px-5 py-3 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">التفسير العلمي</span>
                          <p className="text-[10px] font-bold text-slate-300 leading-relaxed italic">
                            {med.benefits}
                          </p>
                        </div>
                        <div className="space-y-2">
                           <div>
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">قواعد الخلط</span>
                              <p className="text-[10px] font-bold text-white flex items-center gap-1.5">
                                <Droplets size={10} className="text-cyan-500" />
                                {med.mixing}
                              </p>
                           </div>
                           <div>
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block">التتابع الفني</span>
                              <p className="text-[10px] font-bold text-slate-400">
                                {med.sequence}
                              </p>
                           </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {MEDICATIONS.filter((m: any) => m.targetDays.includes(state.age) && m.climates.includes(state.climate)).length === 0 && (
                  <Card className="p-10 border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-slate-700 mb-4">
                      <Stethoscope size={32} />
                    </div>
                    <p className="text-sm font-black text-slate-500">لا توجد أدوية مجدولة لهذا اليوم (عمر {state.age} يوم)</p>
                    <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest">استمر في المتابعة البيئية والتغذية الجيدة</p>
                  </Card>
                )}
              </div>

               <div className="px-2">
                  {state.age >= 30 ? (
                    <Card className="bg-red-600 p-6 border-none flex items-start gap-4 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0">
                        <AlertCircle size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-lg">فترة الأمان (Withdrawal Period)</h4>
                        <p className="text-xs text-red-100 font-bold mt-1 leading-relaxed">
                          أنت الآن في مرحلة التسويق. يمنع منعاً باتاً استخدام أي أدوية أو كيماويات لضمان خلو اللحم من المتبقيات الدوائية. اعتمد على الماء النقي فقط.
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <Card className="bg-blue-600/5 border-blue-500/10 p-5 flex gap-4">
                      <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                        <Activity size={22} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300 leading-relaxed font-bold">
                          بناءً على العمر الحالي ({state.age} يوم)، يتم عرض التوصيات الدوائية والتحصينات المعتمدة لسلالة {state.strain} في نظام البطاريات.
                        </p>
                      </div>
                    </Card>
                  )}
               </div>
            </motion.div>
          )}

          {screen === 'charts' && (
            <motion.div 
              key="charts"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
               <h2 className="text-2xl font-black text-white tracking-tight px-2">بيانات النمو والاحترافية</h2>
               
               <Card className="h-72 border-white/5 pt-8">
                <div className="flex items-center justify-between mb-8 px-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">هدف النمو (جم)</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[9px] font-black text-emerald-500 uppercase">الفعلي</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">المعياري</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="75%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="day" reversed hide />
                    <YAxis hide />
                    <Tooltip 
                      isAnimationActive={false}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', textAlign: 'right' }}
                      labelFormatter={(value) => `اليوم: ${value}`}
                      labelClassName="font-black text-slate-500 text-[10px] uppercase mb-1"
                      itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}
                    />
                    <Area type="monotone" name="الوزن" dataKey="weight" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
               </Card>

               <Card className="h-70 border-white/5 pt-8">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-8 px-2 tracking-[0.2em]">العلف اليومي (جم/طائر)</p>
                <ResponsiveContainer width="100%" height="75%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="day" reversed hide />
                    <YAxis hide />
                    <Tooltip 
                      isAnimationActive={false}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', textAlign: 'right' }}
                      labelFormatter={(value) => `اليوم: ${value}`}
                      labelClassName="font-black text-slate-500 text-[10px] uppercase mb-1"
                      itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '900' }}
                    />
                    <Line type="monotone" name="العلف" dataKey="feed" stroke="#f59e0b" strokeWidth={4} dot={false} animationDuration={2000} />
                  </LineChart>
                </ResponsiveContainer>
               </Card>
            </motion.div>
          )}

          {screen === 'climate' && (
             <motion.div 
             key="climate"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="space-y-6"
           >
              <header className="px-2">
                <h2 className="text-2xl font-black text-white tracking-tight">إدارة الحرارة والتشخيص الذكي</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">عقل العنبر: ربط الحرارة بالحالة الفسيولوجية</p>
              </header>

              {/* Input Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">درجات الحرارة المقاسة</p>
                       <Thermometer size={16} className="text-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 block">الداخلية</span>
                          <input 
                            type="number"
                            value={state.internalTemp}
                            onChange={e => setState(prev => ({ ...prev, internalTemp: Number(e.target.value) }))}
                            className="bg-transparent text-2xl font-black text-white w-full outline-none"
                          />
                       </div>
                       <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 block">الخارجية</span>
                          <input 
                            type="number"
                            value={state.externalTemp}
                            onChange={e => setState(prev => ({ ...prev, externalTemp: Number(e.target.value) }))}
                            className="bg-transparent text-2xl font-black text-white w-full outline-none"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">بيانات الطائر الآلية</p>
                       <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-white">{state.age}</span>
                          <span className="text-[10px] font-bold text-slate-500">يوم</span>
                       </div>
                       <p className="text-[9px] text-emerald-400 font-bold">الوزن: {Math.round(dailyStats.weight)} جرام</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">حمولة اللحم</p>
                       <p className="text-md font-black text-white">{Math.round(herdBiomass).toLocaleString()} <span className="text-[9px] opacity-40">كجم</span></p>
                    </div>
                 </div>
              </div>

              {/* Diagnostic Engine Table */}
              <Card className="bg-slate-900/80 border-white/5 overflow-hidden">
                 <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                          <Activity size={18} />
                       </div>
                       <h3 className="font-black text-white text-sm">محرك التشخيص اللحظي</h3>
                    </div>
                    <div className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                       المستهدف: {targetTemp}°م
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                       <thead>
                          <tr className="bg-slate-950/50">
                             <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">العنصر</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-x border-white/5">القيمة الحالية</th>
                             <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">الحالة والتشخيص</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          <tr>
                             <td className="px-6 py-5 font-black text-white text-sm flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                الحرارة الداخلية
                             </td>
                             <td className="px-6 py-5 border-x border-white/5">
                                <span className={cn(
                                   "text-lg font-black",
                                   tempDelta > 4 ? "text-red-500" : tempDelta > 1 ? "text-orange-400" : "text-emerald-400"
                                )}>{state.internalTemp}°م</span>
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                   {tempDelta > 0 ? (
                                      <>
                                         <span className="w-6 h-6 bg-red-500/10 rounded flex items-center justify-center text-red-500"><AlertCircle size={14} /></span>
                                         <p className="text-xs font-bold text-red-400">⚠️ <span className="font-black">+{tempDelta.toFixed(1)} درجة</span> عن المثالي لعمر {state.age} يوم</p>
                                      </>
                                   ) : (
                                      <>
                                         <span className="w-6 h-6 bg-emerald-500/10 rounded flex items-center justify-center text-emerald-400"><Activity size={14} /></span>
                                         <p className="text-xs font-bold text-emerald-400">🟢 درجة حرارة مثالية لطائر في هذا العمر</p>
                                      </>
                                   )}
                                </div>
                             </td>
                          </tr>
                          <tr>
                             <td className="px-6 py-5 font-black text-white text-sm flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                الحرارة الخارجية
                             </td>
                             <td className="px-6 py-5 border-x border-white/5">
                                <span className="text-lg font-black text-white">{state.externalTemp}°م</span>
                             </td>
                             <td className="px-6 py-5">
                                <p className={cn(
                                   "text-xs font-bold",
                                   state.externalTemp < targetTemp ? "text-emerald-400" : "text-orange-400"
                                )}>
                                   {state.externalTemp < targetTemp ? "🟢 مناسبة جداً لعمليات التبريد والتهوية" : "🟡 ضغط حراري خارجي مرتفع؛ اعتمد على الخلايا"}
                                </p>
                             </td>
                          </tr>
                          <tr>
                             <td className="px-6 py-5 font-black text-white text-sm flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                                الحرارة المحسوسة
                             </td>
                             <td className="px-6 py-5 border-x border-white/5">
                                <span className={cn(
                                   "text-lg font-black",
                                   realFeelTemp > targetTemp + 3 ? "text-red-500" : "text-emerald-400"
                                )}>{realFeelTemp}°م</span>
                             </td>
                             <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                   <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                                      Wind Chill: -{coolingFactor.toFixed(1)}°م
                                   </div>
                                   <p className="text-xs font-bold text-slate-400 italic">✅ وضع مستقر بفضل سرعة الهواء</p>
                                </div>
                             </td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
              </Card>

              {/* Dynamic Alerts Section */}
              <div className="space-y-4">
                 <AnimatePresence>
                    {thi > 155 && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="p-5 bg-red-600/10 border border-red-500/20 rounded-3xl flex items-start gap-5"
                       >
                          <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                             <AlertCircle size={28} />
                          </div>
                          <div>
                             <h5 className="font-black text-red-400 text-sm">حالة إجهاد حراري مؤكدة!</h5>
                             <p className="text-xs text-slate-300 font-bold mt-1 leading-relaxed">
                                انتباه: خطر إجهاد حراري؛ كتلة اللحم الحالية ({Math.round(herdBiomass)} كجم) تنتج حرارة ذاتية عالية جداً. ارفع سرعة الهواء فوراً لتخفيف العبء الحراري.
                             </p>
                          </div>
                       </motion.div>
                    )}

                    {state.internalTemp < targetTemp - 2 && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="p-5 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-start gap-5"
                       >
                          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                             <Droplets size={28} />
                          </div>
                          <div>
                             <h5 className="font-black text-blue-400 text-sm">خطر برودة (Cold Risk)</h5>
                             <p className="text-xs text-slate-300 font-bold mt-1 leading-relaxed">
                                الكتكوت في هذا العمر ({state.age} يوم) يحتاج لتدفئة إضافية؛ درجة الحرارة المستهدفة هي {targetTemp}°م. أغلق فتحات التهوية الزائدة فوراً.
                             </p>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              {/* Action Plan */}
              <Card className="bg-blue-600 p-8 border-none relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                 
                 <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] mb-4">التوصية التشغيلية (Action Plan)</h4>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                       <div className="flex-1 space-y-4">
                          <p className="text-2xl font-black text-white leading-tight">
                             بناءً على الفارق بين الحرارة الداخلية ({state.internalTemp}) والمستهدفة ({targetTemp})، 
                             يجب اتخاذ إجراء فوري.
                          </p>
                          <div className="bg-blue-700/50 p-4 rounded-xl border border-white/10">
                             <p className="text-sm font-black text-blue-100">
                                💡 الإجراء المقترح: <span className="text-white">
                                   {(() => {
                                     if (tempDelta > 4) {
                                       return `رفع التهوية للحد الأقصى عبر تشغيل عدد ${Math.ceil(maxFans)} شفاطات بكامل طاقتها (15 دقيقة/دورة) دون توقف.`;
                                     }
                                     if (tempDelta > 1) {
                                       if (minFans < 0.9) {
                                         return "حول الشفاط الحالي لوضع التشغيل المستمر (إلغاء المؤقت) بدلاً من الدورات المتقطعة لتخفيف الحرارة.";
                                       }
                                       return `تشغيل شفاط إضافي (بإجمالي ${Math.ceil(minFans + 1)} شفاط) وتفعيل نظام التبريد لمدة 3 دقائق كل دورة.`;
                                     }
                                     return "الحفاظ على وضع التهوية الحالي ومراقبة الرطوبة.";
                                   })()}
                                </span>
                             </p>

                             {/* Timing Comparison Section */}
                             <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                                <div className="bg-blue-900/40 p-3 rounded-xl border border-white/5 text-right">
                                   <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">التشغيل الحالي</p>
                                   <div className="flex items-baseline gap-1 justify-end">
                                      <span className="text-xl font-black text-white">{(((minVentilation / state.fanCapacity) * 60) / 4).toFixed(1)}</span>
                                      <span className="text-[10px] font-bold text-blue-400">د/دورة</span>
                                   </div>
                                </div>
                                <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-400/20 text-right">
                                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 text-emerald-400">المطلوب للحل</p>
                                   <div className="flex items-baseline gap-1 justify-end">
                                      <span className="text-xl font-black text-white">
                                         {(() => {
                                            const currentOn = ((minVentilation / state.fanCapacity) * 60) / 4;
                                            if (tempDelta > 1) return "15.0";
                                            if (tempDelta > 0) return Math.min(15, currentOn + (tempDelta * 3)).toFixed(1);
                                            return currentOn.toFixed(1);
                                         })()}
                                      </span>
                                      <span className="text-[10px] font-bold text-emerald-500">د/دورة</span>
                                   </div>
                                </div>
                             </div>
                             <p className="text-[9px] text-blue-200/50 font-bold mt-2 text-center italic">
                                * دورة التهوية المعتمدة هي 15 دقيقة (يجب استمرار العمل حتى استقرار الحرارة)
                             </p>
                          </div>
                       </div>
                       
                          
                    </div>
                 </div>
              </Card>
            </motion.div>
          )}

          {screen === 'ventilation' && (
             <motion.div 
             key="ventilation"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="space-y-6"
           >
              <header className="px-2">
                <h2 className="text-2xl font-black text-white tracking-tight">نظام التهوية الذكي</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">إحصائيات وقدرات الشفاطات وإدارة التوزيع المتقطع</p>
              </header>
              
              <Card className="border-s-4 border-s-blue-600 bg-slate-900/60 border-white/5">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-white">إحصائيات التهوية لكل طائر</h4>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">الاحتياج الفردي في عمر {state.age} يوم</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-950/50 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">احتياج الكتكوت الواحد</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">{(dailyStats.weight / 1000 * 0.7).toFixed(3)}</span>
                      <span className="text-[8px] font-black text-slate-600 uppercase">م³/ساعة</span>
                    </div>
                    <p className="text-[8px] text-blue-400 font-bold mt-1">تهوية صغرى</p>
                  </div>
                  <div className="p-5 bg-slate-950/50 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">إجمالي احتياج القطيع</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-blue-400">{((dailyStats.weight / 1000 * 0.7) * state.totalChicks).toFixed(0)}</span>
                      <span className="text-[8px] font-black text-slate-600 uppercase">م³/ساعة</span>
                    </div>
                    <p className="text-[8px] text-slate-500 font-bold mt-1">لعدد {state.totalChicks.toLocaleString()} طائر</p>
                  </div>
                </div>
              </Card>

              <Card className="border-s-4 border-s-emerald-600 bg-slate-900/60 border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-500">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-white">ساعة التهوية المتقطعة (Spec v2)</h4>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">توزيع زمن التشغيل لضمان استقرار جودة الهواء</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Input Side */}
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-950/50 rounded-3xl border border-white/5 space-y-4">
                       <div>
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">قدرة الشفاط (م³/ساعة)</label>
                         <input 
                           type="number"
                           value={state.fanCapacity}
                           onChange={(e) => setState(prev => ({ ...prev, fanCapacity: Number(e.target.value) }))}
                           className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-xl focus:border-emerald-500/50 focus:ring-0 transition-all"
                         />
                       </div>

                       <div className="pt-4 border-t border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">الاحتياج (Min):</span>
                            <span className="text-sm font-black text-white">{minVentilation.toLocaleString()} <span className="text-[9px] opacity-40">م³/س</span></span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">الاحتياج (Max):</span>
                            <span className="text-sm font-black text-white">{maxVentilation.toLocaleString()} <span className="text-[9px] opacity-40">م³/س</span></span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Visual Clock */}
                  <div className="lg:col-span-2 bg-slate-950/80 p-8 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                    <div className="relative w-64 h-64 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="58" fill="#020617" />
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        
                        {(() => {
                           const onRatio = Math.min(1, minVentilation / state.fanCapacity);
                           const cycles = 4; // Hardcoded per spec
                           const cycleDeg = 360 / cycles;
                           const onDeg = cycleDeg * onRatio;
                           
                           return Array.from({ length: cycles }).map((_, i) => {
                             const startAngle = i * cycleDeg;
                             const splitAngle = startAngle + onDeg;
                             return (
                               <g key={i}>
                                 <path 
                                   d={describeArc(60, 60, 48, splitAngle, startAngle + cycleDeg)} 
                                   className="fill-red-500/10 stroke-red-500/20" 
                                   strokeWidth="0.5"
                                 />
                                 {onRatio > 0 && (
                                   <path 
                                     d={describeArc(60, 60, 48, startAngle, splitAngle)} 
                                     className="fill-emerald-500 stroke-emerald-400 font-bold" 
                                     strokeWidth="0.5"
                                   />
                                 )}
                               </g>
                             );
                           });
                        })()}
                      </svg>
                      
                      {/* Hour labels */}
                      <div className="absolute inset-0 pointer-events-none">
                        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
                          const angle = (i * 30 - 90) * (Math.PI / 180);
                          const r = 40;
                          return (
                            <div 
                              key={h}
                              className="absolute text-[9px] font-black text-slate-700 transform -translate-x-1/2 -translate-y-1/2"
                              style={{ left: `${50 + r * Math.cos(angle)}%`, top: `${50 + r * Math.sin(angle)}%` }}
                            >
                              {h}
                            </div>
                          );
                        })}
                      </div>

                      {/* CENTER COUNTDOWN */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         {(() => {
                            const now = currentTime;
                            const totalSecs = now.getMinutes() * 60 + now.getSeconds();
                            const cycleSecs = 900; // 15 mins (4 cycles per hour)
                            const onSecs = (minVentilation / state.fanCapacity) * cycleSecs;
                            const progress = totalSecs % cycleSecs;
                            const active = progress < onSecs;
                            const remaining = active ? onSecs - progress : cycleSecs - progress;
                            const formatTime = (s: number) => {
                               const m = Math.floor(s / 60);
                               const sc = Math.floor(s % 60);
                               return `${m.toString().padStart(2, '0')}:${sc.toString().padStart(2, '0')}`;
                            };
                            return (
                              <div className="text-center group">
                                 <div className={cn(
                                   "mb-2 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] inline-block",
                                   active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 animate-pulse" : "bg-red-500/20 text-red-400 border border-red-500/10"
                                 )}>
                                   {active ? "يتم التشغيل الآن" : "في دورة السكون"}
                                 </div>
                                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                   {active ? "باقي على الإيقاف" : "باقي على التشغيل"}
                                 </p>
                                 <p className="text-3xl font-black text-white font-mono">{formatTime(remaining)}</p>
                                 <p className="text-[7px] font-bold text-slate-600 mt-2">دورة الـ 15 دقيقة</p>
                              </div>
                            );
                         })()}
                      </div>
                    </div>

                    <div className="flex-1 space-y-6 w-full">
                       <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 space-y-4">
                          <div className="flex justify-between items-center text-center">
                             <div className="flex-1">
                                <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">صافي التشغيل/س</p>
                                <p className="text-xl font-black text-white">{((minVentilation / state.fanCapacity) * 60).toFixed(1)} <span className="text-[10px] text-slate-500">دقيقة</span></p>
                             </div>
                             <div className="w-px h-10 bg-white/5" />
                             <div className="flex-1">
                                <p className="text-[10px] font-black text-red-500 uppercase mb-1">صافي الإيقاف/س</p>
                                <p className="text-xl font-black text-white">{(60 - (minVentilation / state.fanCapacity) * 60).toFixed(1)} <span className="text-[10px] text-slate-500">دقيقة</span></p>
                             </div>
                          </div>
                          
                          <div className="pt-4 border-t border-white/5">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">نمط الدورة (كل 15 دقيقة)</p>
                             <div className="flex gap-2">
                                <div className="flex-1 py-3 bg-emerald-500/10 rounded-2xl text-center border border-emerald-500/10">
                                   <p className="text-[8px] font-bold text-emerald-400 uppercase">تشغيل</p>
                                   <p className="text-lg font-black text-white">{(((minVentilation / state.fanCapacity) * 60) / 4).toFixed(1)} <span className="text-[10px] text-emerald-600">د</span></p>
                                </div>
                                <div className="flex-1 py-3 bg-red-500/10 rounded-2xl text-center border border-red-500/10">
                                   <p className="text-[8px] font-bold text-red-400 uppercase">إيقاف</p>
                                   <p className="text-lg font-black text-white">{(15 - ((minVentilation / state.fanCapacity) * 60) / 4).toFixed(1)} <span className="text-[10px] text-red-600">د</span></p>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center gap-3">
                          <Activity size={16} className="text-blue-400" />
                          <p className="text-[10px] text-blue-200/60 font-bold leading-tight">
                            التهوية موزعة على 4 دورات لضمان ثبات نسبة الأكسجين والتخلص من الأمونيا بشكل مستمر.
                          </p>
                       </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {screen === 'humidity' && (
             <motion.div 
             key="humidity"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="space-y-6"
           >
              <header className="flex items-center justify-between px-2">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">إدارة الرطوبة والتبريد</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">التحكم في أنظمة التبريد التبخيري</p>
                </div>
                <Droplets size={24} className="text-cyan-500" />
              </header>

              {/* THI SECTION */}
              <Card className="bg-slate-900 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl -z-10" />
                <div className="flex flex-col md:flex-row gap-8 items-center p-6">
                  <div className="flex-1 w-full space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <h4 className="text-xl font-black text-white flex items-center gap-2">
                          مؤشر الإجهاد الحراري (THI)
                        </h4>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">المعادلة: الحرارة + الرطوبة</p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-4xl font-black",
                          (state.internalTemp + state.currentHumidity) < 100 ? "text-emerald-400" :
                          (state.internalTemp + state.currentHumidity) <= 155 ? "text-orange-400" : "text-red-500 underline decoration-2 underline-offset-8"
                        )}>
                          {state.internalTemp + state.currentHumidity}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 bg-slate-950 rounded-full overflow-hidden flex shadow-inner">
                      <div className="h-full bg-emerald-500" style={{ width: '33%' }} />
                      <div className="h-full bg-orange-500" style={{ width: '33%' }} />
                      <div className="h-full bg-red-600" style={{ width: '34%' }} />
                      <motion.div 
                        initial={{ left: 0 }}
                        animate={{ left: `${Math.min(100, ((state.internalTemp + state.currentHumidity) / 180) * 100)}%` }}
                        className="absolute top-0 h-full w-1 bg-white shadow-[0_0_10px_white] transition-all" 
                      />
                    </div>

                    <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      <span>مثالي (&lt; 100)</span>
                      <span>تنبيه (100-150)</span>
                      <span>خطر (&gt; 160)</span>
                    </div>

                    <div className={cn(
                      "p-4 rounded-2xl border flex items-center gap-4 transition-colors",
                      (state.internalTemp + state.currentHumidity) < 100 ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" :
                      (state.internalTemp + state.currentHumidity) <= 155 ? "bg-orange-500/5 border-orange-500/10 text-orange-400" : "bg-red-500/5 border-red-500/10 text-red-500"
                    )}>
                      <AlertCircle size={20} />
                      <p className="text-xs font-black leading-tight">
                        {(state.internalTemp + state.currentHumidity) < 100 ? "الوضع مثالي، لا حاجة للتبريد حالياً." :
                         (state.internalTemp + state.currentHumidity) <= 155 ? "تنبيه: مؤشر حرج، ينصح ببدء تشغيل خلايا التبريد." : "خطر نفوق عالي! شغل الشفاطات بأقصى طاقة وراقب التبريد فوراً."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-center min-w-[120px]">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">الحرارة</p>
                      <input 
                        type="number" 
                        value={state.internalTemp}
                        onChange={e => setState(prev => ({ ...prev, internalTemp: Number(e.target.value) }))}
                        className="text-2xl font-black text-white bg-transparent w-full text-center outline-none focus:text-blue-400"
                      />
                      <p className="text-[8px] text-slate-600 font-bold">درجة مئوية</p>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-center min-w-[120px]">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">الرطوبة</p>
                      <input 
                        type="number" 
                        value={state.currentHumidity}
                        onChange={e => setState(prev => ({ ...prev, currentHumidity: Number(e.target.value) }))}
                        className="text-2xl font-black text-white bg-transparent w-full text-center outline-none focus:text-blue-400"
                      />
                      <p className="text-[8px] text-slate-600 font-bold">نسبة مئوية %</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COOLING PAD LOGIC */}
                <Card className="bg-slate-900 border-white/5 border-t-4 border-t-blue-500 p-6 flex flex-col justify-between">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 shadow-inner">
                        <ScaleIcon size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-lg text-white">كفاءة خلايا التبريد</h4>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">مطابقة المساحة مع قوة السحب</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">مساحة الخلايا الإجمالية (م²)</label>
                          <input 
                            type="number"
                            value={state.coolingPadArea}
                            onChange={e => setState(prev => ({ ...prev, coolingPadArea: Number(e.target.value) }))}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-xl focus:border-blue-500/50 outline-none"
                          />
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">القدرة المطلوبة</p>
                           <p className="text-xl font-black text-white">{(state.fanCapacity / 5000).toFixed(1)} <span className="text-[10px] text-slate-600 uppercase">م²</span></p>
                        </div>
                      </div>

                      {(() => {
                        const requiredArea = state.fanCapacity / 5000;
                        const sufficiency = state.coolingPadArea >= requiredArea;
                        return (
                          <div className={cn(
                            "p-4 rounded-2xl flex items-center gap-3 border",
                            sufficiency ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" : "bg-red-500/5 border-red-500/10 text-red-500"
                          )}>
                             {sufficiency ? <Activity size={18} /> : <AlertCircle size={18} />}
                             <p className="text-xs font-black">
                                {sufficiency 
                                  ? "✅ مساحة الخلايا كافية لسحب الشفاطات الحالي." 
                                  : "❌ المساحة صغيرة جداً! سيحدث ضغط سالب عالٍ مما يقلل كفاءة الشفاطات."}
                             </p>
                          </div>
                        );
                      })()}
                   </div>
                </Card>

                {/* PUMP TIMER */}
                <Card className="bg-slate-900 border-white/5 border-t-4 border-t-cyan-500 p-6">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-cyan-600/10 rounded-xl flex items-center justify-center text-cyan-500 shadow-inner">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-lg text-white">مؤقت الطلمبة المتقطع</h4>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">منع زيادة الرطوبة الناتجة عن التبخير</p>
                        </div>
                      </div>
                   </div>

                   <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="relative w-36 h-36 flex-shrink-0">
                         <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            {(() => {
                               const cycleMins = 60;
                               const onRatio = state.pumpOnTime / (state.pumpOnTime + state.pumpOffTime);
                               const cycles = 60 / (state.pumpOnTime + state.pumpOffTime);
                               const cycleDeg = 360 / cycles;
                               const onDeg = cycleDeg * onRatio;
                               
                               return Array.from({ length: Math.floor(cycles) }).map((_, i) => {
                                 const startAngle = i * cycleDeg;
                                 const splitAngle = startAngle + onDeg;
                                 return (
                                   <g key={i}>
                                     <path 
                                       d={describeArc(60, 60, 48, splitAngle, startAngle + cycleDeg)} 
                                       className="fill-red-500/5 stroke-red-500/10" 
                                       strokeWidth="0.5"
                                     />
                                     <path 
                                       d={describeArc(60, 60, 48, startAngle, splitAngle)} 
                                       className="fill-cyan-500 stroke-cyan-400 shadow-lg" 
                                       strokeWidth="0.5"
                                     />
                                   </g>
                                 );
                               });
                            })()}
                            {/* Inner countdown for pump */}
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">الوضع</p>
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse mb-1" />
                            <p className="text-xs font-black text-white">دورة {state.pumpOnTime + state.pumpOffTime} د</p>
                         </div>
                      </div>

                      <div className="flex-1 w-full space-y-4">
                         <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                               <p className="text-[8px] font-black text-emerald-500 uppercase mb-2">وقت العمل (د)</p>
                               <input 
                                 type="number"
                                 value={state.pumpOnTime}
                                 onChange={e => setState(prev => ({ ...prev, pumpOnTime: Number(e.target.value) }))}
                                 className="bg-transparent text-lg font-black text-white w-full outline-none"
                               />
                            </div>
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                               <p className="text-[8px] font-black text-red-500 uppercase mb-2">وقت الفصل (د)</p>
                               <input 
                                 type="number"
                                 value={state.pumpOffTime}
                                 onChange={e => setState(prev => ({ ...prev, pumpOffTime: Number(e.target.value) }))}
                                 className="bg-transparent text-lg font-black text-white w-full outline-none"
                               />
                            </div>
                         </div>
                         <p className="text-[9px] text-slate-500 font-bold text-center italic">
                            يتم تكرار الدورة {Math.floor(60 / (state.pumpOnTime + state.pumpOffTime))} مرات في الساعة.
                         </p>
                      </div>
                   </div>
                </Card>
              </div>

              {/* WIND CHILL & SMART ALERTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-white/5 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Wind size={20} className="text-orange-400" />
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">معدل سرعة الهواء المطلوب (Wind Chill)</h4>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-4xl font-black text-white">
                        {state.currentHumidity > 75 ? "2.5" : state.currentHumidity > 60 ? "2.0" : "1.5"}
                        <span className="text-sm text-slate-500 ms-2">م/ثانية</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">التبريد المتوقع</p>
                      <p className="text-sm font-black text-orange-400">-4.5 °م</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed border-t border-white/5 pt-3">
                    {state.currentHumidity > 75 
                      ? "⚠️ الرطوبة مرتفعة جداً، التبريد بالماء غير فعال. يجب رفع سرعة الهواء فوق الطيور لتعويض الحرارة."
                      : "نظراً لاستقرار الرطوبة، سرعة هواء متوسطة كافية لإحساس الطائر بالراحة الحرارية."}
                  </p>
                </Card>

                <div className="space-y-4">
                   <div className="flex items-center gap-3 px-2">
                     <AlertCircle size={18} className="text-red-500" />
                     <h4 className="text-[10px] font-black text-white uppercase tracking-widest">تنبيهات النظام الذكية</h4>
                   </div>
                   
                   <AnimatePresence>
                     {state.currentHumidity > 75 && (
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4"
                       >
                          <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                             <Droplets size={16} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-red-400">تنبيه الرطوبة العالية (Critical)</p>
                             <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase">أوقف طلمبات التبريد فوراً واعتمد على قوة سحب الشفاطات فقط.</p>
                          </div>
                       </motion.div>
                     )}

                     {state.internalTemp > 33 && (
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-4"
                       >
                          <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
                             <Thermometer size={16} />
                          </div>
                          <div>
                             <p className="text-xs font-black text-orange-400">خطر التكثف وتبلل الفرشة</p>
                             <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase">ارفع درجة حرارة مستشعر التبريد درجتين لمنع التبلل.</p>
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>

                   <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4">
                      <Settings size={18} className="text-blue-400" />
                      <p className="text-[10px] text-blue-200/60 font-bold uppercase tracking-widest leading-tight">
                         يتم تحديث التوصيات تلقائياً بناءً على حساسات الحرارة والرطوبة الافتراضية.
                      </p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-8 left-8 right-8 h-20 bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl flex items-center justify-around px-4 z-30 ring-1 ring-white/5">
        <NavButton 
          active={screen === 'dashboard'} 
          onClick={() => setScreen('dashboard')} 
          icon={LayoutDashboard} 
          label="الرئيسية" 
        />
        <NavButton 
          active={screen === 'medication'} 
          onClick={() => setScreen('medication')} 
          icon={Stethoscope} 
          label="الأدوية" 
        />
        <NavButton 
          active={screen === 'battery'} 
          onClick={() => setScreen('battery')} 
          icon={Layers} 
          label="البطاريات" 
        />
        <NavButton 
          active={screen === 'climate'} 
          onClick={() => setScreen('climate')} 
          icon={Thermometer} 
          label="المناخ" 
        />
        <NavButton 
          active={screen === 'ventilation'} 
          onClick={() => setScreen('ventilation')} 
          icon={Wind} 
          label="التهوية" 
        />
        <NavButton 
          active={screen === 'humidity'} 
          onClick={() => setScreen('humidity')} 
          icon={Droplets} 
          label="الرطوبة" 
        />
        <NavButton 
          active={screen === 'charts'} 
          onClick={() => setScreen('charts')} 
          icon={BarChart2} 
          label="الإحصائيات" 
        />
        <NavButton 
          active={screen === 'finances'} 
          onClick={() => setScreen('finances')} 
          icon={Wallet} 
          label="الأرباح" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all duration-500 relative group text-slate-500 hover:text-slate-300",
        active && "text-blue-400"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-bg"
          className="absolute inset-0 bg-blue-600/10 rounded-2xl -z-10 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
        />
      )}
      <Icon size={22} strokeWidth={active ? 2.5 : 2} className={cn("transition-transform duration-300", active && "scale-110")} />
      <span className={cn("text-[8px] font-black uppercase tracking-widest transition-all", active ? "opacity-100 mt-1" : "opacity-0 invisible h-0")}>{label}</span>
    </button>
  );
}

// Missing Lucide icons shim
function PieChartIcon(props: any) {
  return <BarChart2 {...props} />
}

function ScaleIcon(props: any) {
  return <Activity {...props} />
}

function ContainerIcon(props: any) {
  return <LayoutDashboard {...props} />
}

function BillSection({ title, bills, icon: Icon, onAdd, onRemove, onUpdate }: { title: string, bills: any[], icon: any, onAdd: () => void, onRemove: (id: string) => void, onUpdate: (id: string, field: string, val: any) => void }) {
  return (
    <Card className="bg-slate-900 border-white/5 p-6 text-right">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onAdd}
          className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95"
        >
          <Plus size={16} />
        </button>
        <div className="flex items-center gap-3">
          <h4 className="text-xs font-black text-white uppercase tracking-widest">{title}</h4>
          <div className="p-2 bg-slate-950 rounded-lg text-slate-400">
            <Icon size={16} />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {bills.map(bill => (
          <div key={bill.id} className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-2xl border border-white/5">
            <button 
              onClick={() => onRemove(bill.id)}
              className="p-1.5 text-slate-600 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <input 
              type="number"
              value={bill.amount}
              onChange={e => onUpdate(bill.id, 'amount', parseFloat(e.target.value) || 0)}
              className="w-24 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-black text-white text-center"
              placeholder="المبلغ"
            />
            <input 
              type="text"
              value={bill.label}
              onChange={e => onUpdate(bill.id, 'label', e.target.value)}
              className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white text-right"
              placeholder="وصف الفاتورة"
            />
          </div>
        ))}
        {bills.length === 0 && (
          <p className="text-[10px] text-slate-600 font-bold py-2">لا توجد فواتير مضافة</p>
        )}
      </div>
      {bills.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center px-2">
          <p className="text-sm font-black text-white">{bills.reduce((acc, b) => acc + b.amount, 0).toLocaleString()} ج.م</p>
          <p className="text-[9px] font-black text-slate-500 uppercase">الإجمالي</p>
        </div>
      )}
    </Card>
  );
}
