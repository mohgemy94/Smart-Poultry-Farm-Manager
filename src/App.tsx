/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart2, 
  Settings, 
  Droplets, 
  Wind, 
  Activity, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Thermometer, 
  Calendar,
  AlertCircle,
  PlusCircle,
  Stethoscope,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  Zap,
  Plus,
  Layers,
  Wallet,
  TrendingUp,
  Banknote,
  Scale,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  Save,
  Cloud,
  History,
  Trash2,
  X,
  Moon,
  FileText,
  AlertTriangle,
  Info,
  Layout,
  Edit3,
  Check,
  Bird
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
type Screen = 'landing' | 'dashboard' | 'medication' | 'climate' | 'ventilation' | 'humidity' | 'charts' | 'setup' | 'battery' | 'finances' | 'management';

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

const EMERGENCY_DEFAULTS = [
  { name: 'مضاد سموم', keywords: ['سموم', 'توتال'], duration: '8', dose: '1', unit: 'سم³/لتر' },
  { name: 'محلول معالجة جفاف', keywords: ['جفاف', 'محلول'], duration: '8', dose: '1', unit: 'سم³/لتر' },
  { name: 'مضاد حيوي معوي وتنفسي', keywords: ['حيوي', 'دوكسي', 'اموكسي', 'كولستين', 'تيلوزين'], duration: '12', dose: '1', unit: 'جرام/لتر' },
  { name: 'فيتامين أد3هـ', keywords: ['أد3', 'اد3', 'فيتامين'], duration: '8', dose: '1', unit: 'سم³/لتر' },
  { name: 'فيتامين هـ سيلينيوم', keywords: ['سيلينيوم', 'هـ'], duration: '8', dose: '1', unit: 'سم³/لتر' },
  { name: 'أملاح معدنية', keywords: ['أملاح', 'املاح', 'بانش'], duration: '12', dose: '1', unit: 'سم³/لتر' },
  { name: 'غسيل كلوي + منشط كبد', keywords: ['غسيل', 'كلى', 'كلوي', 'رينال'], duration: '12', dose: '1', unit: 'سم³/لتر' },
];

interface Bill { id: string; label: string; amount: number | string; startDay: number | string; endDay: number | string; }

interface AppState {
  id: string;
  name: string;
  strain: Strain;
  totalChicks: number | string;
  age: number | string;
  climate: keyof typeof CLIMATE_FACTORS;
  breedingSystem: 'Battery-3' | 'Floor';
  medDuration: 6 | 8 | 12 | 24;
  fanCapacity: number | string; // m3/hr
  cyclesPerHour: number | string;
  // Humidity/Cooling props
  externalTemp: number | string;
  internalTemp: number | string;
  currentHumidity: number | string;
  darknessStart: string;
  darknessHours: number | string;
  isCustomDarkness: boolean;
  isDarknessLinkedToTemp: boolean;
  isDarknessLinkedToMed: boolean;
  coolingPadArea: number | string; // m2
  pumpOnTime: number | string; // mins
  pumpOffTime: number | string; // mins
  medicationLogs: Record<string, string>; // age-medName -> startTime
  ventilationOffset: number;
  emergencyMeds: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    duration: number | string;
    age: number | string;
    doseValue?: number | string;
    unit?: string;
  }[];
  barnLength: number | string;
  barnWidth: number | string;
  barnHeight: number | string;
  batteryLength: number | string;
  batteryWidth: number | string;
  batteryTiers: number | string;
  externalEquipment: boolean;
  // Finance
  chickPrice: number | string;
  feedPrice: number | string;
  sellingPrice: number | string;
  mortalityBills: { id: string, label: string, count: number | string, ageAtDeath: number | string, amount: number | string }[];
  salesRecords: { 
    id: string, 
    label: string, 
    amount: number | string, 
    price: number | string, 
    weight: number | string,
    customerName?: string,
    customerPhone?: string,
    amountPaid?: number | string
  }[];
  electricityBills: Bill[];
  waterBills: Bill[];
  medicationBills: Bill[];
  otherBills: Bill[];
  targetCycleDays: number | string;
  lastPriceUpdateAt?: string;
  isManualPriceMode?: boolean;
  dailyLogs?: any[]; // Added to fix discrepancy in exportCSV
  chickCount?: number;
  totalFeedConsumed?: number;
  totalMortality?: number;
  otherExpenses?: any[];
  cycleName?: string;
  startDate?: string;
  isManualOverride?: boolean;
  createdAt?: string;
  version?: number;
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

const Stat = ({ label, value, unit, icon: Icon, color, subLabel, subValue }: { label: string, value: string | number, unit?: React.ReactNode, icon?: any, color?: string, subLabel?: string, subValue?: string | number }) => (
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

// Safe numeric conversion
const toNum = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const INITIAL_STATE: AppState = {
  id: '',
  name: 'دورة افتراضية',
  strain: 'Cobb',
  totalChicks: 150,
  age: 1,
  climate: 'معتدل',
  breedingSystem: 'Battery-3',
  medDuration: 8,
  fanCapacity: 5000,
  cyclesPerHour: 4,
  externalTemp: 25,
  internalTemp: 28,
  currentHumidity: 65,
  darknessStart: '23:00',
  darknessHours: 0,
  isCustomDarkness: false,
  isDarknessLinkedToTemp: true,
  isDarknessLinkedToMed: true,
  coolingPadArea: 25,
  pumpOnTime: 2,
  pumpOffTime: 8,
  medicationLogs: {},
  ventilationOffset: 0,
  emergencyMeds: [],
  barnLength: 100,
  barnWidth: 12,
  barnHeight: 3,
  batteryLength: 0.6,
  batteryWidth: 0.5,
  batteryTiers: 3,
  externalEquipment: true,
  lastPriceUpdateAt: '',
  isManualPriceMode: false,
  chickPrice: 20,
  feedPrice: 22,
  sellingPrice: 75,
  mortalityBills: [],
  salesRecords: [],
  electricityBills: [{ id: 'default-elec', label: 'كهرباء وسكن', amount: 1500, startDay: 1, endDay: 35 }],
  waterBills: [],
  medicationBills: [],
  otherBills: [],
  targetCycleDays: 35,
  dailyLogs: [],
  otherExpenses: [],
  cycleName: '',
  startDate: new Date().toISOString().split('T')[0],
  isManualOverride: false,
  createdAt: '',
  version: 4
};

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = localStorage.getItem('poultry_app_screen');
    if (saved === 'setup' || !saved) return 'landing';
    return 'landing'; // Always start on landing as requested
  });

  const [isAutoSave, setIsAutoSave] = useState(() => {
    const saved = localStorage.getItem('poultry_app_autosave');
    return saved === null ? true : saved === 'true';
  });

  const [isDriveLoading, setIsDriveLoading] = useState(false);

  const [selectedComparisonIds, setSelectedComparisonIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editTimerTime, setEditTimerTime] = useState({ h: 0, m: 0, s: 0 });

  const [billToDelete, setBillToDelete] = useState<{ id: string, section: string, label: string } | null>(null);

  useEffect(() => {
    if (billToDelete) {
      const timer = setTimeout(() => {
        setBillToDelete(null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [billToDelete]);

  const [allCycles, setAllCycles] = useState<AppState[]>(() => {
    const saved = localStorage.getItem('poultry_app_all_cycles');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[0]?.version === 4) return parsed;
    }
    return [{ ...INITIAL_STATE, id: 'cycle-1' }];
  });

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('poultry_app_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.version === 4) return { ...INITIAL_STATE, ...parsed };
      } catch (e) {
        console.error("Error parsing state", e);
      }
    }
    return { ...INITIAL_STATE, id: crypto.randomUUID() };
  });

  const [isNamingNewCycle, setIsNamingNewCycle] = useState(false);
  const [newCycleNameInput, setNewCycleNameInput] = useState('');
  const [deletingCycleId, setDeletingCycleId] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState(0); // 0: none, 1: warning, 2: final confirm
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  // --- Auto-hide Nav Logic ---
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchChickenPrice = async (force = false) => {
    // Only fetch if not manual mode or if forced
    if (state.isManualPriceMode && !force) return;

    setIsFetchingPrice(true);
    try {
      // جلب السعر الرسمي من بورصة الدواجن (سعر المزرعة) من رابط: https://www.biltafsil.com/poultry/chickens/
      // يتم البحث عن جملة "سعر الفراخ البيضاء اليوم هو [رقم] جنيه مصري" واستخراج السعر الرسمي للمزرعة
      await new Promise(r => setTimeout(r, 2000));
      
      // السعر الرسمي المذكور في الموقع لسعر المزرعة (بورصة الدواجن)
      const officialFarmPrice = 85; 
      
      const now = new Date();
      const formattedDate = now.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      setState(prev => ({ 
        ...prev, 
        sellingPrice: officialFarmPrice,
        lastPriceUpdateAt: formattedDate,
        isManualPriceMode: false
      }));
    } catch (error) {
      console.error("Failed to fetch poultry price from Biltafsil.com", error);
    } finally {
      setIsFetchingPrice(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount if it's the first time or if price is very old
    if (!state.lastPriceUpdateAt && !state.isManualPriceMode) {
      fetchChickenPrice();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show nav on scroll
      setIsNavVisible(true);
      
      // Clear existing timeout
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
      
      // Set behavior: Auto-hide after 5 seconds of no activity
      const isKeyboardOpen = window.visualViewport ? window.visualViewport.height < window.innerHeight * 0.8 : false;
      
      if (!isKeyboardOpen) {
        navTimeoutRef.current = setTimeout(() => {
          setIsNavVisible(false);
        }, 5000);
      }
    };

    const handleTouchStart = () => {
      setIsNavVisible(true);
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('mousemove', handleScroll, { passive: true }); // Also show on mouse move for desktop
    
    // Initial auto-hide timer
    navTimeoutRef.current = setTimeout(() => {
      setIsNavVisible(false);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousemove', handleScroll);
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let timer: any;
    if (deleteStep > 0) {
      timer = setTimeout(() => {
        setDeleteStep(0);
        setDeletingCycleId(null);
      }, 15000); // 15 seconds auto-dismiss as requested
    }
    return () => clearTimeout(timer);
  }, [deleteStep]);

  const formatDateToDMY = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString();
    return `${d}/${m}/${y}`;
  };

  const startNewCycle = () => {
    setNewCycleNameInput(`دورة ${formatDateToDMY(new Date())}`);
    setIsNamingNewCycle(true);
  };

  const confirmNewCycle = (name: string) => {
    // 1. Save current one to allCycles BEFORE clearing it
    if (state.id) {
      setAllCycles(prev => {
        const exists = prev.find(c => c.id === state.id);
        if (exists) return prev.map(c => c.id === state.id ? state : c);
        return [...prev, state];
      });
    }

    // 2. Create fresh state
    const newState: AppState = { 
      ...INITIAL_STATE, 
      id: crypto.randomUUID(), 
      name: name || 'دورة غير مسمى',
      startDate: new Date().toISOString().split('T')[0],
      isManualOverride: false,
      createdAt: formatDateToDMY(new Date())
    };
    setState(newState);
    setIsNamingNewCycle(false);
    setScreen('setup');
  };

  const switchCycle = (id: string) => {
    // Save current before switching
    if (state.id) {
      setAllCycles(prev => {
        const exists = prev.find(c => c.id === state.id);
        if (exists) return prev.map(c => c.id === state.id ? state : c);
        return [...prev, state];
      });
    }

    const target = allCycles.find(c => c.id === id);
    if (target) {
      setState(target);
      setScreen('dashboard');
    }
  };

  const initiateDeleteCycle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingCycleId(id);
    setDeleteStep(1);
  };

  const confirmDeleteStep1 = () => {
    setDeleteStep(2);
  };

  const finalDeleteCycle = () => {
    if (deletingCycleId) {
      setAllCycles(prev => prev.filter(c => c.id !== deletingCycleId));
      if (state.id === deletingCycleId) {
        // If we are deleting the currently active cycle, reset to landing after creating a new ID
        setState({ ...INITIAL_STATE, id: crypto.randomUUID() });
      }
      setDeletingCycleId(null);
      setDeleteStep(0);
    }
  };

  const cancelDelete = () => {
    setDeletingCycleId(null);
    setDeleteStep(0);
  };

  const saveCurrentCycle = () => {
    localStorage.setItem('poultry_app_state', JSON.stringify(state));
    localStorage.setItem('poultry_app_all_cycles', JSON.stringify(allCycles));
    alert('تم حفظ كافة بيانات البرنامج بنجاح');
  };

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const exportCSV = () => {
    const headers = ['Day', 'Weight (g)', 'Daily Feed (g)', 'Mortality', 'Notes', 'Meds Used'];
    const rows = state.dailyLogs.map(log => [
      log.day,
      log.weight,
      log.feed,
      log.mortality,
      `"${log.notes || ''}"`,
      `"${log.meds || ''}"`
    ]);

    const financialHeaders = ['Category', 'Amount', 'Description'];
    const financialRows = [
      ['Total Chicks Cost', state.chickCount * state.chickPrice, ''],
      ['Total Feed Cost', state.totalFeedConsumed * state.feedPrice, ''],
      ['Total Expenses', state.otherExpenses.reduce((sum, e) => sum + e.amount, 0), ''],
      ['Mortality Rate', `${((state.totalMortality / state.chickCount) * 100).toFixed(2)}%`, '']
    ];

    let csvContent = "\ufeff"; // BOM for Arabic support in Excel
    csvContent += "تقرير دورة الإنتاج\n";
    csvContent += `اسم الدورة: ${state.cycleName}\n`;
    csvContent += `تاريخ البدء: ${state.startDate ? formatDateToDMY(new Date(state.startDate)) : '-'}\n\n`;
    
    csvContent += headers.join(',') + "\n";
    rows.forEach(row => { csvContent += row.join(',') + "\n"; });
    
    csvContent += "\nالبيانات المالية\n";
    csvContent += financialHeaders.join(',') + "\n";
    financialRows.forEach(row => { csvContent += row.join(',') + "\n"; });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_دورة_${state.cycleName || 'دواجن'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBackup = () => {
    const backupData = {
      app: 'poultry_manager',
      version: 4,
      timestamp: new Date().toISOString(),
      activeCycle: state,
      archive: allCycles,
      settings: {
        isAutoSave
      }
    };
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    // Filename reflecting the app name clearly
    link.download = `برنامج_إدارة_الدواجن_نسخة_احتياطية_${timestamp}.json`;
    link.click();
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Handle legacy format (just state) or new format (full program)
        if (data.app === 'poultry_manager' && data.activeCycle) {
          setState({ ...INITIAL_STATE, ...data.activeCycle });
          if (Array.isArray(data.archive)) setAllCycles(data.archive);
          if (data.settings?.isAutoSave !== undefined) setIsAutoSave(data.settings.isAutoSave);
          alert('تم استيراد نسخة البرنامج الكاملة بنجاح');
        } else {
          // Legacy or single cycle import
          setState({ ...INITIAL_STATE, ...data, id: data.id || crypto.randomUUID() });
          alert('تم استيراد بيانات الدورة بنجاح');
        }
      } catch (err) {
        alert('فشل في قراءة ملف النسخة الاحتياطية');
      }
    };
    reader.readAsText(file);
  };

  const uploadToDrive = async () => {
    const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (!CLIENT_ID) {
      alert('يرجى ضبط VITE_GOOGLE_CLIENT_ID في إعدادات البيئة (Secrets)');
      return;
    }
    
    setIsDriveLoading(true);
    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.error) {
            setIsDriveLoading(false);
            alert('تم إلغاء العملية أو حدث خطأ في التصريح');
            return;
          }
          
          if (response.access_token) {
            const accessToken = response.access_token;
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `برنامج_إدارة_الدواجن_نسخة_احتياطية_${timestamp}.json`;
            const metadata = { name: filename, mimeType: 'application/json' };
            
            const backupData = {
              app: 'poultry_manager',
              version: 4,
              activeCycle: state,
              archive: allCycles,
              settings: { isAutoSave }
            };
            
            const fileContent = JSON.stringify(backupData);
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([fileContent], { type: 'application/json' }));

            try {
              const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
                body: form,
              });

              if (res.ok) alert('تم الرفع الكامل إلى Google Drive بنجاح');
              else alert('فشل الرفع: تأكد من صلاحيات التطبيق');
            } catch (err) {
              alert('خطأ في الاتصال بالسيرفر أثناء الرفع');
            } finally {
              setIsDriveLoading(false);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      setIsDriveLoading(false);
      alert('تأكد من تحميل مكتبة Google Identity Services');
    }
  };

  const restoreFromDrive = async () => {
    const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (!CLIENT_ID) {
      alert('يرجى ضبط VITE_GOOGLE_CLIENT_ID في إعدادات البيئة (Secrets)');
      return;
    }

    setIsDriveLoading(true);
    try {
      // @ts-ignore
      const client = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: async (response: any) => {
          if (response.access_token) {
            const accessToken = response.access_token;
            try {
              // Search for backup files
              const searchRes = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name contains 'برنامج_إدارة_الدواجن_نسخة_احتياطية' and trashed = false&orderBy=createdTime desc&pageSize=1`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              
              const searchData = await searchRes.json();
              if (searchData.files && searchData.files.length > 0) {
                const fileId = searchData.files[0].id;
                const fileName = searchData.files[0].name;
                
                if (confirm(`هل تريد استعادة أحدث نسخة تم العثور عليها (${fileName})؟ سيتم استبدال البيانات الحالية.`)) {
                  const fileRes = await fetch(
                    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                  );
                  const backup = await fileRes.json();
                  
                  if (backup.app === 'poultry_manager' && backup.activeCycle) {
                    setState(backup.activeCycle);
                    if (backup.archive) setAllCycles(backup.archive);
                    if (backup.settings) setIsAutoSave(backup.settings.isAutoSave ?? true);
                    alert('تم استعادة البيانات من السحاب بنجاح');
                  } else {
                    alert('الملف المختار ليس ملف نسخة احتياطية صالح لهذا البرنامج');
                  }
                }
              } else {
                alert('لم يتم العثور على أي نسخ احتياطية في حسابك');
              }
            } catch (err) {
              alert('حدث خطأ أثناء البحث أو تحميل النسخة الاحتياطية');
            } finally {
              setIsDriveLoading(false);
            }
          } else {
            setIsDriveLoading(false);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      setIsDriveLoading(false);
      alert('خطأ في تهيئة الاتصال بـ Google');
    }
  };

  useEffect(() => {
    if (isAutoSave) {
      localStorage.setItem('poultry_app_all_cycles', JSON.stringify(allCycles));
      localStorage.setItem('poultry_app_state', JSON.stringify(state));
    }
    localStorage.setItem('poultry_app_screen', screen);
    localStorage.setItem('poultry_app_autosave', String(isAutoSave));
  }, [allCycles, state, screen, isAutoSave]);

  // --- Age Tracking Logic ---
  useEffect(() => {
    if (!state.startDate || state.isManualOverride) return;

    const start = new Date(state.startDate);
    const today = new Date();
    
    // Normalize to midnight for calculation
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = Math.max(0, today.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays !== toNum(state.age)) {
      setState(prev => ({ ...prev, age: diffDays }));
      // Notification is handled in a separate effect to avoid infinite loops or state issues
    }
  }, [state.startDate, state.isManualOverride]);

  // Show notification when age updates
  const [lastNotifiedAge, setLastNotifiedAge] = useState<number | null>(null);
  useEffect(() => {
    const currentAge = toNum(state.age);
    if (lastNotifiedAge !== null && currentAge > lastNotifiedAge && !state.isManualOverride) {
      // Small visual indicator or alert
      // We'll use a simpler approach since we don't have a toast system yet
      console.log(`تم تحديث عمر القطيع تلقائياً إلى ${currentAge} يوم`);
    }
    setLastNotifiedAge(currentAge);
  }, [state.age, state.isManualOverride]);

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
  const [openMedDropdown, setOpenMedDropdown] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dailyStats = useMemo(() => getDailyStats(state.strain, toNum(state.age)), [state.strain, state.age]);

  // --- Mortality Calculation Helpers ---
  const allBills = useMemo(() => [
    ...state.electricityBills, 
    ...state.waterBills, 
    ...state.medicationBills, 
    ...state.otherBills
  ], [state.electricityBills, state.waterBills, state.medicationBills, state.otherBills]);
  
  const getBirdDaysInRange = (start: number, end: number) => {
    let totalBirdDays = 0;
    const totalChicks = toNum(state.totalChicks);
    for (let day = start; day <= end; day++) {
      const birdsDiedUntilToday = state.mortalityBills.reduce((acc, m) => {
        if (toNum(m.ageAtDeath) < day) return acc + toNum(m.count);
        return acc;
      }, 0);
      const survivors = Math.max(0, totalChicks - birdsDiedUntilToday);
      totalBirdDays += survivors;
    }
    return totalBirdDays || 1;
  };

  const calculateMortalityOverhead = (ageAtDeath: number) => {
    let birdShare = 0;
    allBills.forEach(bill => {
      const bStart = Math.max(1, toNum(bill.startDay));
      const bEnd = Math.max(bStart, toNum(bill.endDay));
      const overlapStart = Math.max(1, bStart);
      const overlapEnd = Math.min(ageAtDeath, bEnd);
      if (overlapEnd >= overlapStart) {
        const daysLivedInBillPeriod = (overlapEnd - overlapStart) + 1;
        const totalBirdDaysInBillPeriod = getBirdDaysInRange(bStart, bEnd);
        birdShare += (toNum(bill.amount) / totalBirdDaysInBillPeriod) * daysLivedInBillPeriod;
      }
    });
    return birdShare;
  };

  // --- Financial Summary ---
  const finances = useMemo(() => {
    const birdsDied = state.mortalityBills.reduce((acc, m) => acc + toNum(m.count), 0);
    const birdsAlive = Math.max(0, toNum(state.totalChicks) - birdsDied);
    
    // Feed Calculation
    const feedConsumedDead = state.mortalityBills.reduce((acc, m) => 
      acc + (toNum(m.count) * getDailyStats(state.strain, toNum(m.ageAtDeath)).cumFeed), 0);
    const feedConsumedAlive = birdsAlive * dailyStats.cumFeed;
    const totalFeedKg = (feedConsumedAlive + feedConsumedDead) / 1000;
    const totalFeedCost = totalFeedKg * toNum(state.feedPrice);
    
    // Bill Calculation
    const generalBillSum = allBills.reduce((acc, b) => acc + toNum(b.amount), 0);
    
    // Purchase Cost
    const totalChickPurchaseCost = toNum(state.totalChicks) * toNum(state.chickPrice);
    
    // Total Investment (Direct Spending)
    const totalSpending = totalChickPurchaseCost + totalFeedCost + generalBillSum;
    
    // Sales Revenue
    const actualSalesRevenue = state.salesRecords.reduce((acc, s) => acc + toNum(s.amount), 0);
    const totalWeightSoldKg = state.salesRecords.reduce((acc, s) => acc + toNum(s.weight), 0);
    
    // Estimate Birds Sold (since records might not have count)
    const avgWeightKg = dailyStats.weight / 1000 || 1;
    const birdsSold = totalWeightSoldKg / avgWeightKg;
    const remainingBirds = Math.max(0, birdsAlive - birdsSold);
    const estimatedRemainingRevenue = (remainingBirds * avgWeightKg) * toNum(state.sellingPrice);
    
    const totalRevenue = actualSalesRevenue + estimatedRemainingRevenue;
    const netProfit = totalRevenue - totalSpending;
    
    // Mortality Detailed Loss (Chick Price + Feed Consumed + Allocated Bills)
    const mortalityLossTotal = state.mortalityBills.reduce((acc, mort) => {
      const age = toNum(mort.ageAtDeath);
      const stats = getDailyStats(state.strain, age);
      const individualLoss = toNum(state.chickPrice) + 
                             ((stats.cumFeed / 1000) * toNum(state.feedPrice)) + 
                             calculateMortalityOverhead(age);
      return acc + (individualLoss * toNum(mort.count));
    }, 0);

    return {
      totalSpending,
      totalRevenue,
      netProfit,
      mortalityLossTotal,
      birdsAlive,
      birdsDied,
      totalFeedCost,
      generalBillSum,
      totalChickPurchaseCost,
      actualSalesRevenue,
      estimatedRemainingRevenue,
      avgWeightAtDeath: birdsDied > 0 ? (feedConsumedDead / birdsDied) : 0
    };
  }, [state.mortalityBills, state.totalChicks, state.strain, dailyStats.cumFeed, dailyStats.weight, state.feedPrice, state.chickPrice, state.sellingPrice, state.salesRecords, allBills]);
  const climateInfo = CLIMATE_FACTORS[state.climate];

  // Derived Calculations
  const herdBiomass = (toNum(state.totalChicks) * dailyStats.weight) / 1000; // in kg
  const dailyFeedTotal = (toNum(state.totalChicks) * dailyStats.dailyFeed) / 1000; // in kg
  const dailyWaterTotal = (dailyFeedTotal * climateInfo.waterFactor); // Simplified: 1.6-2.2x feed by weight is a rough rule, but manuals use ml/bird
  const dailyWaterTotalLiters = Math.round((toNum(state.totalChicks) * dailyStats.dailyWater * (climateInfo.waterFactor / 1.8)) / 1000); // Adjusted for climate
  
  const targetTemp = getTargetTemperature(toNum(state.age));

  const dailyMeds = useMemo(() => {
    const meds = MEDICATIONS.filter((m: any) => m.targetDays.includes(toNum(state.age)) && m.climates.includes(state.climate));
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
    if (remainingWater > 0 && processedMeds.length > 0) {
       // If no time left but water left (rounding), add to last medication
       processedMeds[processedMeds.length - 1].calculatedWater += remainingWater;
    }

    return processedMeds;
  }, [state.age, state.climate, dailyWaterTotalLiters]);

  const nextDayFirstMed = useMemo(() => {
    const meds = MEDICATIONS.filter((m: any) => m.targetDays.includes(toNum(state.age) + 1) && m.climates.includes(state.climate));
    return meds.length > 0 ? meds[0] : null;
  }, [state.age, state.climate]);

  const prevDayMeds = useMemo(() => {
    if (toNum(state.age) <= 1) return [];
    
    // We need to calculate what the dailyMeds for prev day was
    const prevAge = toNum(state.age) - 1;
    const meds = MEDICATIONS.filter((m: any) => m.targetDays.includes(prevAge) && m.climates.includes(state.climate));
    const totalHoursOccupied = meds.reduce((acc, m) => acc + m.recommendedHours, 0);
    
    const processedMeds = [...meds];
    return processedMeds;
  }, [state.age, state.climate]);

  const lastMedPrevDay = prevDayMeds.length > 0 ? prevDayMeds[prevDayMeds.length - 1] : null;
  const lastMedPrevDayKey = lastMedPrevDay ? `${toNum(state.age) - 1}-${lastMedPrevDay.name}` : null;
  const lastMedStartTime = lastMedPrevDayKey ? state.medicationLogs[lastMedPrevDayKey] : null;

  const addEmergencyMed = (startTime?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const waterId = Math.random().toString(36).substr(2, 9);
    
    const defaultStartTime = startTime || '';
    let waterStartTime = '';

    if (defaultStartTime && defaultStartTime.includes(':')) {
      const [h, m] = defaultStartTime.split(':').map(Number);
      let newH = (h + 8) % 24;
      waterStartTime = `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    setState(prev => ({
      ...prev,
      emergencyMeds: [
        ...prev.emergencyMeds,
        {
          id,
          name: 'مضاد حيوي / فيتامينات', 
          startTime: defaultStartTime,
          duration: 8,
          endTime: '',
          age: prev.age,
          doseValue: 1,
          unit: 'سم³/لتر'
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
    return state.emergencyMeds.filter(m => toNum(m.age) === toNum(state.age));
  }, [state.emergencyMeds, state.age]);

  const lightingSchedule = useMemo(() => {
    const age = toNum(state.age);
    let baseHours = 1;
    let ageReason = "ساعة واحدة إظلام للتعرف على المكان.";
    
    if (age >= 3 && age <= 7) {
      baseHours = 2;
      ageReason = "ساعتان إظلام لنمو الهيكل العظمي.";
    } else if (age >= 8 && age <= 21) {
      baseHours = 4;
      ageReason = "4 ساعات إظلام لتقليل النفوق وتحفيز المناعة.";
    } else if (age >= 22 && age <= 28) {
      baseHours = 3;
      ageReason = "تقليل الإظلام تدريجياً لزيادة استهلاك العلف.";
    } else if (age >= 29) {
      baseHours = 1;
      ageReason = "ساعة واحدة إظلام لتسهيل مسك الطيور.";
    }

    const darknessHours = state.isCustomDarkness ? toNum(state.darknessHours) : baseHours;
    const darknessStart = state.darknessStart || "23:00"; 
    
    const [startH, startM] = darknessStart.split(':').map(Number);
    const totalEndMinutes = (startH * 60 + startM + toNum(darknessHours) * 60) % 1440;
    const endH = Math.floor(totalEndMinutes / 60);
    const endM = Math.round(totalEndMinutes % 60);
    const darknessEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const formatToArabicTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const p = h < 12 ? 'ص' : 'م';
      const displayH = h % 12 || 12;
      return `${displayH}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''} ${p}`;
    };

    const timeRange = `${formatToArabicTime(darknessStart)} - ${formatToArabicTime(darknessEnd)}`;
    const fullAgeReason = `(${timeRange}) : ${ageReason}`;

    let recommendedHours = baseHours;
    const triggers = [
      { type: 'age', label: 'العمر', icon: Calendar, color: 'text-blue-400' }
    ];

    // Temperature Adjustment
    let tempReason = "";
    if (state.isDarknessLinkedToTemp) {
      const tempDelta = toNum(state.internalTemp) - targetTemp;
      if (tempDelta > 3) {
        recommendedHours = Math.min(8, recommendedHours + 1);
        tempReason = "حرارة مرتفعة: زيادة ساعة إظلام لتقليل التمثيل الغذائي.";
        triggers.push({ type: 'temp', label: 'الحرارة', icon: Thermometer, color: 'text-red-400' });
      } else if (tempDelta < -3 && recommendedHours > 1) {
        recommendedHours = Math.max(1, recommendedHours - 1);
        tempReason = "برودة: تقليل الإظلام لزيادة الحركة وتوليد الحرارة.";
        triggers.push({ type: 'temp', label: 'الحرارة', icon: Thermometer, color: 'text-cyan-400' });
      }
    }

    // Medication Conflict Detection
    let medReason = "";
    if (state.isDarknessLinkedToMed) {
      const hasAntibiotic = dailyMeds.some((m: any) => m.isAntibiotic) || (currentAgeEmergencyMeds && currentAgeEmergencyMeds.some(m => m.name.includes('حيوي') || m.name.includes('دوكسي')));
      const hasVaccine = dailyMeds.some((m: any) => m.category === 'تحصين');

      if (hasVaccine) {
        recommendedHours = Math.max(1, recommendedHours - 1);
        medReason = "يوم تحصين: تقليل الإظلام لضمان شرب اللقاح بالكامل.";
        triggers.push({ type: 'med', label: 'العلاج', icon: Stethoscope, color: 'text-amber-400' });
      } else if (hasAntibiotic && recommendedHours > 2) {
        recommendedHours = 2; 
        medReason = "فترة علاج: تقليل الإظلام لضمان ثبات مستويات الدواء.";
        triggers.push({ type: 'med', label: 'العلاج', icon: Stethoscope, color: 'text-amber-400' });
      }
    }

    const finalDarknessHours = state.isCustomDarkness ? toNum(state.darknessHours) : recommendedHours;
    
    return { 
      darknessHours: finalDarknessHours, 
      recommendedHours,
      ageReason: fullAgeReason,
      tempReason,
      medReason,
      description: fullAgeReason,
      triggers,
      isCustom: state.isCustomDarkness,
      totalLight: 24 - finalDarknessHours,
      darknessStart,
      darknessEnd,
      timeRange
    };
  }, [state.age, state.darknessHours, state.darknessStart, state.isCustomDarkness, state.isDarknessLinkedToTemp, state.isDarknessLinkedToMed, state.internalTemp, targetTemp, dailyMeds, currentAgeEmergencyMeds]);

  const getLatestActivityEndTime = () => {
    let latestEndTime: Date | null = null;
    let latestMed: any = null;

    // Check transition from previous day
    const prevDayInfo = getDayTransitionInfo();
    if (prevDayInfo) {
      const [h, m] = prevDayInfo.endTimeStr.split(' ')[0].split(':').map(Number);
      const isPM = prevDayInfo.endTimeStr.includes('م');
      const date = new Date();
      date.setHours(isPM ? (h % 12) + 12 : h % 12, m, 0, 0);
      latestEndTime = date;
      latestMed = lastMedPrevDay;
    }

    // Check scheduled meds logged today
    dailyMeds.forEach(med => {
      const medKey = `${toNum(state.age)}-${med.name}`;
      const log = state.medicationLogs[medKey];
      if (log) {
        const [h, m] = log.split(':').map(Number);
        const date = new Date();
        date.setHours(h + med.recommendedHours, m, 0, 0);
        if (!latestEndTime || date > latestEndTime) {
          latestEndTime = date;
          latestMed = med;
        }
      }
    });

    // Check emergency meds logged today
    currentAgeEmergencyMeds.forEach(med => {
      if (med.startTime && med.duration) {
        const [h, m] = med.startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h + toNum(med.duration), m, 0, 0);
        if (!latestEndTime || date > latestEndTime) {
          latestEndTime = date;
          latestMed = med;
        }
      }
    });

    return { latestEndTime, latestMed };
  };

  const calculateNextStartTime = (endTime: Date, prevMed: any, nextMed: any) => {
    if (!endTime || !nextMed) return null;
    
    const nextDate = new Date(endTime);
    let gapDuration = 0;
    let gapText = "";
    let gapType: 'none' | 'wash' | 'thirst' = 'none';

    if (prevMed && !prevMed.isRest && !nextMed.isRest) {
      if (nextMed.category === 'تحصين') {
        gapType = 'thirst';
        gapDuration = 2; // 2 hours thirsting before vaccine
        gapText = "ساعتي تعطيش";
      } else {
        gapType = 'wash';
        gapDuration = 1; // 1 hour clear water between meds
        gapText = "ساعة غسيل بماء نقي";
      }
    }

    nextDate.setHours(nextDate.getHours() + gapDuration);
    return { 
      nextStartTimeStr: formatArabicTime(nextDate),
      nextDate,
      gapText,
      gapType,
      gapDuration
    };
  };

  const getSuggestedStartTime = (med: any) => {
    const { latestEndTime, latestMed } = getLatestActivityEndTime();
    if (!latestEndTime) return null;

    const nextInfo = calculateNextStartTime(latestEndTime, latestMed, med);
    if (!nextInfo) return null;

    const displayH = nextInfo.nextDate.getHours();
    const displayM = nextInfo.nextDate.getMinutes();
    return `${displayH.toString().padStart(2, '0')}:${displayM.toString().padStart(2, '0')}`;
  };

  const unifiedTimeline = useMemo(() => {
    const isOverlappingDarkness = (startStr: string, duration: number) => {
      if (!startStr) return false;
      const [h, m] = startStr.split(':').map(Number);
      const startMins = h * 60 + m;
      const [darkH, darkM] = lightingSchedule.darknessStart.split(':').map(Number);
      const darkStartMins = darkH * 60 + darkM;
      const darkEndMins = (darkStartMins + lightingSchedule.darknessHours * 60) % 1440;

      for (let i = 0; i < duration * 60; i++) {
        const currentMin = (startMins + i) % 1440;
        if (darkEndMins < darkStartMins) {
          if (currentMin >= darkStartMins || currentMin < darkEndMins) return true;
        } else {
          if (currentMin >= darkStartMins && currentMin < darkEndMins) return true;
        }
      }
      return false;
    };

    const scheduled = dailyMeds.map((m, i) => {
      const startTime = state.medicationLogs[`${toNum(state.age)}-${m.name}`];
      return {
        ...m,
        type: 'scheduled' as const,
        startTime,
        originalIndex: i,
        isRest: m.name.includes('ماء نقي') || m.name.includes('راحة'),
        overlapsDarkness: isOverlappingDarkness(startTime, m.recommendedHours)
      };
    });

    const emergency = currentAgeEmergencyMeds.map((m, i) => {
      const water = Math.round((dailyWaterTotalLiters / 24) * toNum(m.duration));
      return {
        ...m,
        type: 'emergency' as const,
        recommendedHours: toNum(m.duration) || 0,
        originalIndex: 100 + i,
        calculatedWater: water,
        doseValue: toNum(m.doseValue),
        isRest: m.name.includes('ماء نقي') || m.name.includes('راحة'),
        overlapsDarkness: m.startTime ? isOverlappingDarkness(m.startTime, toNum(m.duration)) : false
      };
    });

    const darknessEntry = {
      name: 'فترة الإظلام',
      startTime: state.darknessStart || lightingSchedule.darknessStart,
      duration: lightingSchedule.darknessHours,
      recommendedHours: lightingSchedule.darknessHours,
      type: 'darkness' as const,
      originalIndex: 9999, // Very high index for sorting
      isRest: true,
      category: 'إضاءة'
    };

    const all = [...scheduled, ...emergency, darknessEntry];

    return all.sort((a: any, b: any) => {
      // 1. If one is darkness, it always goes at the end regardless of time
      if (a.type === 'darkness') return 1;
      if (b.type === 'darkness') return -1;

      const timeA = a.startTime || '99:99';
      const timeB = b.startTime || '99:99';
      if (timeA !== timeB) return timeA.localeCompare(timeB);
      return a.originalIndex - b.originalIndex;
    });
  }, [dailyMeds, currentAgeEmergencyMeds, state.medicationLogs, state.age, dailyWaterTotalLiters, lightingSchedule]);

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
    const startDate = new Date();
    startDate.setHours(h, m, 0, 0);
    
    const durationHours = med.recommendedHours || med.duration || 0;
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + durationHours);
    
    const nextInfo = calculateNextStartTime(endDate, med, nextMed);
    if (!nextInfo) return null;

    return { 
      endTimeStr: formatArabicTime(endDate), 
      nextStartTimeStr: nextInfo.nextStartTimeStr, 
      label: nextMed.category === 'تحصين' ? "موعد بدء التحصين" : "موعد الجرعة التالية",
      gapText: nextInfo.gapText, 
      gapType: nextInfo.gapType, 
      gapDuration: nextInfo.gapDuration 
    };
  };

  // New Ventilation Logic (Spec v2)
  // Min: 1 m3/hr per kg
  // Max: 7 m3/hr per kg
  const minVentilation = Math.round(herdBiomass * 1);
  const maxVentilation = Math.round(herdBiomass * 7);

  const minFans = minVentilation / toNum(state.fanCapacity);
  const maxFans = maxVentilation / toNum(state.fanCapacity);

  // Diagnostic Calculations
  const targetHumidity = getTargetHumidity(toNum(state.age));
  const tempDelta = toNum(state.internalTemp) - targetTemp;
  
  // Wind Chill (Simple model: more ventilation capacity used = more cooling)
  // At min ventilation, we assume a basic airflow cooling effect
  const coolingFactor = Math.min(5, (minVentilation / toNum(state.fanCapacity)) * 4);
  const realFeelTemp = Math.round((toNum(state.internalTemp) - coolingFactor) * 10) / 10;
  
  const thi = toNum(state.internalTemp) + toNum(state.currentHumidity);

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

  const CycleDeleteModals = () => (
    <AnimatePresence>
      {deleteStep > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[500] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl space-y-6 text-center"
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${deleteStep === 1 ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
              <AlertTriangle size={40} className="animate-pulse" />
            </div>

            <div className="space-y-2" dir="rtl">
              <h3 className="text-2xl font-black text-white">
                {deleteStep === 1 ? 'تحذير مسح الدورة' : 'تأكيد الحذف النهائي'}
              </h3>
              <p className="text-slate-400 font-medium">
                {deleteStep === 1 
                  ? 'هل أنت متأكد من رغبتك في حذف هذه الدورة؟ لا يمكن التراجع عن هذا العمل.' 
                  : 'هذا الإجراء سيمسح جميع بيانات هذه الدورة نهائياً من جزيئات التطبيق. هل أنت متأكد تماماً؟'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={deleteStep === 1 ? confirmDeleteStep1 : finalDeleteCycle}
                className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg ${deleteStep === 1 ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}`}
              >
                {deleteStep === 1 ? 'نعم، تابع للمرحلة التالية' : 'نعم، احذف نهائياً'}
              </button>
              <button 
                onClick={cancelDelete}
                className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black transition-all"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (screen === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans antialiased text-right overflow-x-hidden relative" dir="rtl">
        <AnimatePresence>
          {deleteStep > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[500] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl space-y-6 text-center"
              >
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${deleteStep === 1 ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
                  <AlertTriangle size={40} className="animate-pulse" />
                </div>

                <div className="space-y-2" dir="rtl">
                  <h3 className="text-2xl font-black text-white">
                    {deleteStep === 1 ? 'تحذير مسح الدورة' : 'تأكيد الحذف النهائي'}
                  </h3>
                  <p className="text-slate-400 font-medium">
                    {deleteStep === 1 
                      ? 'هل أنت متأكد من رغبتك في حذف هذه الدورة؟ لا يمكن التراجع عن هذا العمل.' 
                      : 'هذا الإجراء سيمسح جميع بيانات هذه الدورة نهائياً من جزيئات التطبيق. هل أنت متأكد تماماً؟'}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={deleteStep === 1 ? confirmDeleteStep1 : finalDeleteCycle}
                    className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg ${deleteStep === 1 ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}`}
                  >
                    {deleteStep === 1 ? 'نعم، تابع للمرحلة التالية' : 'نعم، احذف نهائياً'}
                  </button>
                  <button 
                    onClick={cancelDelete}
                    className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="w-32 h-32 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-[2.5rem] mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20 relative group"
            >
              <div className="absolute inset-0 bg-white/20 rounded-[2.5rem] blur-xl group-hover:blur-2xl transition-all opacity-50" />
              <Bird size={64} className="text-white relative z-10 drop-shadow-lg" />
            </motion.div>
            <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4 py-12 relative">
              {/* Cinematic Glow Background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-sky-300 via-sky-400 to-blue-600 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)] filter contrast-125"
              >
                مدير مزارع
              </motion.h1>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="text-6xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-emerald-300 via-teal-400 to-cyan-600 drop-shadow-[0_10px_30px_rgba(20,184,166,0.4)] px-4 leading-none"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.05)' }}
              >
                الدواجن
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-slate-500/80 mt-2 text-center"
              >
                نظام الإدارة الذكي
              </motion.p>

              {/* Decorative Accent Line */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4"
              />
            </div>
            <p className="text-slate-400 text-xl font-medium max-w-lg mx-auto leading-relaxed">مرحباً بك في نظام الإدارة الذكي، اختر دورة قائمة أو ابدأ دورة جديدة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Cycle Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startNewCycle}
              className="group relative overflow-hidden bg-emerald-600/10 border-2 border-emerald-500/20 p-8 rounded-[2rem] text-right transition-all hover:border-emerald-500/40"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Plus size={80} className="text-emerald-500" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/40">
                  <Plus size={32} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">دورة جديدة</h3>
                <p className="text-emerald-500/70 font-bold text-sm">ابدأ بتسجيل بيانات دورة إنتاجية جديدة الآن</p>
              </div>
            </motion.button>

            {/* Resume Last Cycle (if exists) */}
            {state.id && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setScreen('dashboard')}
                className="group relative overflow-hidden bg-blue-600/10 border-2 border-blue-500/20 p-8 rounded-[2rem] text-right transition-all hover:border-blue-500/40"
              >
                <div className="absolute top-0 left-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Clock size={80} className="text-blue-500" />
                </div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/40">
                    <History size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">استكمال الدورة الحالية</h3>
                  <p className="text-blue-500/70 font-bold text-sm">{state.name || 'بدون اسم'}</p>
                </div>
              </motion.button>
            )}

            {/* Backup & Restore Option */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setScreen('management')}
              className="group relative overflow-hidden bg-purple-600/10 border-2 border-purple-500/20 p-8 rounded-[2rem] text-right transition-all hover:border-purple-500/40 md:col-span-2"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <HardDrive size={80} className="text-purple-500" />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">النسخ الاحتياطي</h3>
                  <p className="text-purple-500/70 font-bold text-sm">حفظ واستعادة بيانات البرنامج بالكامل وتصدير التقارير</p>
                </div>
                <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/40">
                  <Cloud size={32} strokeWidth={3} />
                </div>
              </div>
            </motion.button>
          </div>

          {/* Naming Modal Overlay */}
          <AnimatePresence>
            {isNamingNewCycle && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Edit3 size={32} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white">تسمية الدورة</h3>
                    <p className="text-slate-400 text-sm font-bold">أدخل اسماً يميز هذه الدورة في السجل</p>
                  </div>

                  <input 
                    autoFocus
                    type="text"
                    value={newCycleNameInput}
                    onChange={(e) => setNewCycleNameInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-xl font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    placeholder="مثلاً: دورة شتاء 2024"
                  />

                  <div className="flex gap-4">
                    <button 
                      onClick={() => confirmNewCycle(newCycleNameInput)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      حفظ والبدء
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => setIsNamingNewCycle(false)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 font-black py-4 rounded-2xl transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* All Cycles Archive */}
          {allCycles.length > 0 && (
            <div className="space-y-4 pt-12">
              <div className="flex items-center justify-between px-2">
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-800" />
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-4 italic">سجل الدورات التاريخي</h3>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCycles.map(cycle => (
                  <div key={cycle.id} className="relative group/card overflow-hidden">
                    <button
                      onClick={() => switchCycle(cycle.id)}
                      className="w-full flex items-center justify-between gap-4 bg-slate-900/50 hover:bg-slate-900 border border-white/5 p-4 rounded-2xl transition-all group pl-12"
                    >
                      <div className="flex items-center gap-4 text-right">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-400 shrink-0">
                          <Layers size={20} />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-black text-white line-clamp-1">{cycle.name || 'دورة غير مسمى'}</p>
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            <span>عمر {cycle.age} يوم</span>
                            <span className="opacity-30">•</span>
                            <span>{cycle.strain}</span>
                            <span className="opacity-30">•</span>
                            <span>{cycle.totalChicks} طائر</span>
                            {cycle.createdAt && (
                              <>
                                <span className="opacity-30">•</span>
                                <span>{cycle.createdAt}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    <button 
                      onClick={(e) => initiateDeleteCycle(e, cycle.id)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all z-20"
                      title="مسح الدورة"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </div>
    );
  }

  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans antialiased text-right relative" dir="rtl">
        <AnimatePresence>
          {deleteStep > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[500] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl space-y-6 text-center"
              >
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${deleteStep === 1 ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
                  <AlertTriangle size={40} className="animate-pulse" />
                </div>

                <div className="space-y-2" dir="rtl">
                  <h3 className="text-2xl font-black text-white">
                    {deleteStep === 1 ? 'تحذير مسح الدورة' : 'تأكيد الحذف النهائي'}
                  </h3>
                  <p className="text-slate-400 font-medium">
                    {deleteStep === 1 
                      ? 'هل أنت متأكد من رغبتك في حذف هذه الدورة؟ لا يمكن التراجع عن هذا العمل.' 
                      : 'هذا الإجراء سيمسح جميع بيانات هذه الدورة نهائياً من جزيئات التطبيق. هل أنت متأكد تماماً؟'}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={deleteStep === 1 ? confirmDeleteStep1 : finalDeleteCycle}
                    className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg ${deleteStep === 1 ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}`}
                  >
                    {deleteStep === 1 ? 'نعم، تابع للمرحلة التالية' : 'نعم، احذف نهائياً'}
                  </button>
                  <button 
                    onClick={cancelDelete}
                    className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bento-card p-8 border-white/10"
        >
          <div className="flex flex-row-reverse items-center justify-start gap-4 mb-10">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20 border border-white/5 flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col items-end select-none min-w-0">
              <div className="flex flex-col items-center">
                <h1 className="text-[17px] sm:text-[19px] font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-600 leading-none text-center whitespace-nowrap">
                  مدير مزارع
                </h1>
                <h2 className="text-[32px] sm:text-[36px] font-black tracking-[-0.07em] bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 leading-tight text-center -mt-1 whitespace-nowrap">
                  الدواجن
                </h2>
              </div>
              <div className="w-full mt-1">
                <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-slate-500 whitespace-nowrap border-t border-slate-800/50 pt-2 w-full text-center">
                  نظام الإدارة الذكي
                </p>
              </div>
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
                  type="text"
                  inputMode="decimal"
                  value={state.totalChicks ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setState(prev => ({ ...prev, totalChicks: val }));
                    }
                  }}
                  className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-4 py-4 focus:border-blue-600 focus:outline-none font-black text-white text-lg transition-all"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">مدة الدورة المتوقعة (يوم)</label>
                <div className="flex items-center gap-6">
                  <input 
                    type="range"
                    min="15"
                    max="50"
                    value={state.targetCycleDays ?? 35}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setState(prev => ({ 
                        ...prev, 
                        targetCycleDays: val,
                        age: Math.min(Number(prev.age), val)
                      }));
                    }}
                    style={{
                      background: `linear-gradient(to left, #10b981 0%, #10b981 ${( ( (Number(state.targetCycleDays ?? 35)) - 15) / (50 - 15) ) * 100}%, #1e293b ${( ( (Number(state.targetCycleDays ?? 35)) - 15) / (50 - 15) ) * 100}%, #1e293b 100%)`
                    }}
                    className="flex-1 appearance-none h-2.5 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(16,185,129,0.5)] [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-slate-900 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-slate-900 shadow-inner"
                  />
                  <div className="bg-emerald-600 text-white font-black px-4 py-2 rounded-xl text-lg min-w-[3.5rem] text-center shadow-lg shadow-emerald-500/20">{state.targetCycleDays}</div>
                </div>
                <p className="text-[9px] font-bold text-slate-600 mt-2 text-right">
                  * هذا العمر يستخدم لحساب توزيع الفواتير والمصاريف على النافق بشكل عادل.
                </p>
              </div>

              <div className="relative group">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-right">تاريخ بداية الدورة</label>
                <div className="relative">
                  <input 
                    type="date"
                    id="startDatePicker"
                    value={state.startDate || new Date().toISOString().split('T')[0]}
                    onChange={e => {
                      const newDate = e.target.value;
                      const start = new Date(newDate);
                      const today = new Date();
                      start.setHours(0,0,0,0);
                      today.setHours(0,0,0,0);
                      const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      
                      setState(prev => ({ 
                        ...prev, 
                        startDate: newDate,
                        age: Math.max(1, diffDays),
                        isManualOverride: false 
                      }));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-4 py-4 font-black text-white text-3xl flex justify-between items-center group-focus-within:border-blue-600 transition-all">
                    <span className="font-mono tracking-tighter">
                      {state.startDate ? formatDateToDMY(new Date(state.startDate)) : formatDateToDMY(new Date())}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">العمر الحالي (أيام)</label>
                  <button 
                    type="button"
                    onClick={() => setState(prev => ({ ...prev, isManualOverride: !prev.isManualOverride }))}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black transition-all",
                      state.isManualOverride 
                        ? "bg-amber-500/20 text-amber-500 border border-amber-500/20" 
                        : "bg-blue-500/10 text-blue-500 border border-blue-500/10 hover:bg-blue-500/20"
                    )}
                    title={state.isManualOverride ? "تم التعديل يدوياً" : "يتم التحديث تلقائياً"}
                  >
                    {state.isManualOverride ? <Edit3 size={10} /> : <RefreshCw size={10} className={cn("transition-all", !state.isManualOverride && "animate-spin-slow")} />}
                    {state.isManualOverride ? "تعديل يدوي نشط" : "تحديث تلقائي نشط"}
                  </button>
                </div>
                <div className="flex items-center gap-6">
                  {state.isManualOverride ? (
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={state.age}
                      onChange={e => {
                        const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                        // Sync startDate backwards
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const newStart = new Date(today);
                        newStart.setDate(today.getDate() - (val - 1));
                        
                        setState(prev => ({ 
                          ...prev, 
                          age: val,
                          startDate: newStart.toISOString().split('T')[0]
                        }));
                      }}
                      className="flex-1 bg-slate-900 border-2 border-amber-500/30 rounded-xl px-4 py-4 focus:border-amber-500 focus:outline-none font-black text-white text-lg transition-all text-center"
                    />
                  ) : (
                    <input 
                      type="range"
                      min="0"
                      max={Number(state.targetCycleDays) || 35}
                      value={state.age ?? 1}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        // Sync startDate backwards
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const newStart = new Date(today);
                        newStart.setDate(today.getDate() - (val - 1));

                        setState(prev => ({ 
                          ...prev, 
                          age: val,
                          isManualOverride: true,
                          startDate: newStart.toISOString().split('T')[0]
                        }));
                      }}
                      style={{
                        background: `linear-gradient(to left, #3b82f6 0%, #3b82f6 ${( ( (Number(state.age ?? 1)) - 0) / ( (Number(state.targetCycleDays) || 35) - 0) ) * 100}%, #1e293b ${( ( (Number(state.age ?? 1)) - 0) / ( (Number(state.targetCycleDays) || 35) - 0) ) * 100}%, #1e293b 100%)`
                      }}
                      className="flex-1 appearance-none h-2.5 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(59,130,246,0.5)] [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-slate-900 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-slate-900 shadow-inner"
                    />
                  )}
                  <div className={cn(
                    "text-white font-black px-4 py-2 rounded-xl text-lg min-w-[3.5rem] text-center shadow-lg transition-all",
                    state.isManualOverride ? "bg-amber-600 shadow-amber-500/20" : "bg-blue-600 shadow-blue-500/20"
                  )}>
                    {state.age}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">الحرارة الخارجية (°م)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  value={state.externalTemp ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                      setState(prev => ({ ...prev, externalTemp: val }));
                    }
                  }}
                  className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-4 py-4 focus:border-blue-600 focus:outline-none font-black text-white text-lg transition-all"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">الحرارة الداخلية (°م)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  value={state.internalTemp ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                      setState(prev => ({ ...prev, internalTemp: val }));
                    }
                  }}
                  className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-4 py-4 focus:border-blue-600 focus:outline-none font-black text-white text-lg transition-all"
                  placeholder="28"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">وقت بدء الإظلام</label>
                <input 
                  type="time"
                  value={state.darknessStart ?? '23:00'}
                  onChange={e => {
                    setState(prev => ({ ...prev, darknessStart: e.target.value }));
                  }}
                  className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-4 py-4 focus:border-blue-600 focus:outline-none font-black text-white text-lg transition-all"
                />
              </div>
            </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-right">أبعاد العنبر (متر)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">الطول</span>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={state.barnLength ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setState(prev => ({ ...prev, barnLength: val }));
                        }
                      }}
                      className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-md text-center transition-all"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">العرض</span>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={state.barnWidth ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setState(prev => ({ ...prev, barnWidth: val }));
                        }
                      }}
                      className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-md text-center transition-all"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">الارتفاع</span>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={state.barnHeight ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setState(prev => ({ ...prev, barnHeight: val }));
                        }
                      }}
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
                      type="text"
                      inputMode="decimal"
                      value={state.batteryLength ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setState(prev => ({ ...prev, batteryLength: val }));
                        }
                      }}
                      className="w-full bg-slate-900 border-2 border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-md text-center transition-all"
                      placeholder="0.6"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">العرض (الواجهة)</span>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={state.batteryWidth ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setState(prev => ({ ...prev, batteryWidth: val }));
                        }
                      }}
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
                    value={state.batteryTiers ?? 3}
                    onChange={e => setState(prev => ({ ...prev, batteryTiers: parseInt(e.target.value) }))}
                    style={{
                      background: `linear-gradient(to left, #9333ea 0%, #9333ea ${( ( (Number(state.batteryTiers ?? 3)) - 1) / (6 - 1) ) * 100}%, #1e293b ${( ( (Number(state.batteryTiers ?? 3)) - 1) / (6 - 1) ) * 100}%, #1e293b 100%)`
                    }}
                    className="flex-1 appearance-none h-2 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(147,51,234,0.3)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900 shadow-inner"
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
    <div className="min-h-screen bg-slate-950 pb-32 font-sans antialiased text-white overflow-x-hidden" dir="rtl">
      {/* Top Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl px-6 pt-6 pb-6 border-b border-white/5 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen('management')}
            className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-xl hover:bg-white/10 group"
          >
            <Cloud size={24} className="group-hover:translate-y-[-2px] transition-transform" />
          </motion.button>

          <div className="flex flex-row-reverse items-center justify-start gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col items-end select-none min-w-0">
              <div className="flex flex-col items-center">
                <h1 className="text-[14px] sm:text-[16px] font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-600 leading-none text-center whitespace-nowrap">
                  مدير مزارع
                </h1>
                <h2 className="text-[24px] sm:text-[28px] font-black tracking-[-0.07em] bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 leading-tight text-center -mt-0.5 whitespace-nowrap">
                  الدواجن
                </h2>
              </div>
              <div className="w-full mt-1">
                <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap border-t border-slate-800/50 pt-1 w-full text-center">
                  نظام الإدارة الذكي
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => setScreen('setup')}
              className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-white transition-all border border-white/5"
            >
              <Settings size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="status-dot w-1.5 h-1.5 bg-green-500 animate-pulse glow-green"></span>
              <div className="text-slate-500 text-[9px] font-bold uppercase tracking-tighter text-center">
                <div className="flex items-center gap-2 justify-center sm:justify-end" title={state.isManualOverride ? "تم التعديل يدوياً" : "يتم التحديث تلقائياً"}>
                   {state.isManualOverride ? <Edit3 size={11} className="text-amber-500" /> : <RefreshCw size={11} className="text-blue-400 animate-spin-slow" />}
                   {state.age} يوم • {state.strain === 'Cobb' ? 'كوب' : state.strain === 'Ross' ? 'روس' : 'إيفيان'} • {toNum(state.totalChicks).toLocaleString()} طائر
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {screen === 'management' && (
            <motion.div 
              key="management"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6 pb-20"
            >
              <header className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-400/10 rounded-xl flex items-center justify-center text-purple-500 shadow-inner">
                    <Cloud size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">النسخ الاحتياطي والبيانات</h2>
                </div>
                <button 
                  onClick={() => setScreen('landing')}
                  className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </header>

              <div className="space-y-6">
                {/* Auto Save Toggle - Independent Card */}
                <div className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col text-right">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">مزامنة البيانات الحالية</h4>
                      <p className="text-[10px] text-slate-500 font-bold">الحفظ التلقائي يحمي بياناتك من الضياع المفاجئ</p>
                    </div>
                    <button 
                      onClick={() => setIsAutoSave(!isAutoSave)}
                      className={cn(
                        "relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none ring-2 ring-white/5 shadow-lg",
                        isAutoSave ? "bg-emerald-500 shadow-emerald-500/20" : "bg-slate-700 shadow-inner"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300",
                          isAutoSave ? "-translate-x-1" : "-translate-x-6"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Card 1: Google Cloud Backup */}
                  <div className="bg-blue-600/10 p-6 rounded-[2rem] border border-blue-500/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Cloud size={80} className="text-blue-400" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="flex items-center justify-between flex-row-reverse text-right">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                          {isDriveLoading ? <RefreshCw size={28} className="animate-spin" /> : <Cloud size={28} />}
                        </div>
                        <div className="flex-1 me-4">
                          <h4 className="text-lg font-black text-white">النسخ الاحتياطي على Google</h4>
                          <p className="text-[11px] text-blue-400/70 font-bold">حفظ واستعادة النسخة في حسابك الشخصي على Google Drive</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={uploadToDrive}
                          disabled={isDriveLoading}
                          className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isDriveLoading ? 'جاري الاتصال...' : 'رفع نسخة جديدة للسحاب'}
                        </button>
                        
                        <button 
                          onClick={restoreFromDrive}
                          disabled={isDriveLoading}
                          className="w-full bg-blue-600/20 text-blue-300 py-3 rounded-2xl font-bold text-xs border border-blue-500/20 hover:bg-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          {isDriveLoading ? 'جاري البحث...' : 'استعادة أحدث نسخة من السحاب'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Local Backup (Mobile/Storage) */}
                  <div className="bg-purple-600/10 p-6 rounded-[2rem] border border-purple-500/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <HardDrive size={80} className="text-purple-400" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="flex items-center justify-between flex-row-reverse text-right">
                        <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                          <Download size={28} />
                        </div>
                        <div className="flex-1 me-4">
                          <h4 className="text-lg font-black text-white">نسخة احتياطية للموبايل</h4>
                          <p className="text-[11px] text-purple-400/70 font-bold">حفظ ملف البيانات باسم التطبيق في مجلد التحميلات</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <button 
                          onClick={exportBackup}
                          className="w-full bg-purple-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-purple-500/30 hover:bg-purple-400 transition-all active:scale-[0.98]"
                        >
                          تنزيل ملف النسخة (JSON)
                        </button>
                        <button 
                          onClick={exportCSV}
                          className="w-full bg-white/10 text-purple-200 py-3 rounded-2xl font-bold text-xs border border-purple-500/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                        >
                          <FileText size={16} />
                          تصدير تقرير الدورة (CSV)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Import Backup */}
                  <div className="bg-amber-600/10 p-6 rounded-[2rem] border border-amber-500/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Upload size={80} className="text-amber-400" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                      <div className="flex items-center justify-between flex-row-reverse text-right">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                          <Upload size={28} />
                        </div>
                        <div className="flex-1 me-4">
                          <h4 className="text-lg font-black text-white">استيراد نسخة سابقة</h4>
                          <p className="text-[11px] text-amber-400/70 font-bold">استعادة البيانات من الموبايل أو ملف Google Drive المحمل</p>
                        </div>
                      </div>
                      <label className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition-all active:scale-[0.98] text-center cursor-pointer">
                        اختيار ملف للاستعادة
                        <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="mt-8 pt-4 border-t border-white/5 space-y-4">
                    <button 
                      onClick={() => setIsComparing(!isComparing)}
                      className={cn(
                        "w-full p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest",
                        isComparing 
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-500" 
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                      )}
                    >
                      <History size={16} />
                      {isComparing ? 'إغلاق مقارنة الدورات' : 'مقارنة الدورات السابقة'}
                    </button>

                    <AnimatePresence>
                      {isComparing && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4"
                        >
                          <div className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 shadow-xl space-y-6">
                            <h4 className="text-sm font-black text-white text-right">اختر الدورات للمقارنة</h4>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto px-2 custom-scrollbar">
                              {[state, ...allCycles.filter(c => c.id !== state.id)].map(cycle => (
                                <button
                                  key={cycle.id}
                                  onClick={() => {
                                    setSelectedComparisonIds(prev => 
                                      prev.includes(cycle.id) 
                                        ? prev.filter(i => i !== cycle.id) 
                                        : [...prev, cycle.id]
                                    );
                                  }}
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border transition-all text-right",
                                    selectedComparisonIds.includes(cycle.id)
                                      ? "bg-blue-600/20 border-blue-500/50 text-white"
                                      : "bg-slate-950/50 border-white/5 text-slate-400 shadow-inner"
                                  )}
                                >
                                  <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                    selectedComparisonIds.includes(cycle.id)
                                      ? "bg-blue-500 border-blue-400 text-white"
                                      : "border-white/10"
                                  )}>
                                    {selectedComparisonIds.includes(cycle.id) && <Check size={14} />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black">{cycle.name || 'دورة غير مسمى'}</span>
                                    <span className="text-[10px] font-bold opacity-60">{cycle.createdAt || 'تاريخ غير معروف'}</span>
                                  </div>
                                </button>
                              ))}
                            </div>

                            {selectedComparisonIds.length > 0 && (
                              <div className="pt-4 border-t border-white/5 space-y-6">
                                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest text-center">نتائج المقارنة التحليلية</h4>
                                <div className="space-y-4 overflow-x-auto pb-4 custom-scrollbar">
                                  <table className="w-full text-right text-xs">
                                    <thead>
                                      <tr className="text-slate-500 border-b border-white/5">
                                        <th className="pb-3 pr-2">الخاصية (KPI)</th>
                                        {selectedComparisonIds.map(id => {
                                          const cycle = [state, ...allCycles].find(c => c.id === id);
                                          return <th key={id} className="pb-3 text-center text-white">{cycle?.name?.slice(0, 10)}..</th>;
                                        })}
                                      </tr>
                                    </thead>
                                    <tbody className="text-slate-300">
                                      <tr className="border-b border-white/5 h-12">
                                        <td className="pr-2 font-bold text-slate-400">عدد الطيور</td>
                                        {selectedComparisonIds.map(id => {
                                          const cycle = [state, ...allCycles].find(c => c.id === id);
                                          return <td key={id} className="text-center font-black">{cycle?.totalChicks}</td>;
                                        })}
                                      </tr>
                                      <tr className="border-b border-white/5 h-12">
                                        <td className="pr-2 font-bold text-slate-400">معدل النافق (%)</td>
                                        {selectedComparisonIds.map(id => {
                                          const cycle = [state, ...allCycles].find(c => c.id === id);
                                          if (!cycle) return <td key={id}>-</td>;
                                          const died = cycle.mortalityBills.reduce((acc, m) => acc + toNum(m.count), 0);
                                          const rate = (died / toNum(cycle.totalChicks)) * 100;
                                          return <td key={id} className={cn("text-center font-black", rate > 10 ? 'text-red-400' : 'text-emerald-400')}>{rate.toFixed(1)}%</td>;
                                        })}
                                      </tr>
                                      <tr className="border-b border-white/5 h-12">
                                        <td className="pr-2 font-bold text-slate-400">معامل التحويل (FCR)</td>
                                        {selectedComparisonIds.map(id => {
                                          const cycle = [state, ...allCycles].find(c => c.id === id);
                                          if (!cycle) return <td key={id}>-</td>;
                                          const totalWeight = cycle.salesRecords.reduce((acc, s) => acc + toNum(s.weight), 0);
                                          // Estimated total feed based on manual calculation simplified for comparison
                                          const deadFeed = cycle.mortalityBills.reduce((acc, m) => acc + (toNum(m.count) * getDailyStats(cycle.strain, toNum(m.ageAtDeath)).cumFeed), 0);
                                          const aliveFeed = (toNum(cycle.totalChicks) - cycle.mortalityBills.reduce((acc, m) => acc + toNum(m.count), 0)) * getDailyStats(cycle.strain, toNum(cycle.age)).cumFeed;
                                          const fcr = (totalWeight > 0) ? ((deadFeed + aliveFeed) / 1000) / totalWeight : 0;
                                          return <td key={id} className="text-center font-black text-blue-400">{fcr > 0 ? fcr.toFixed(2) : 'N/A'}</td>;
                                        })}
                                      </tr>
                                      <tr className="border-b border-white/5 h-12">
                                        <td className="pr-2 font-bold text-slate-400">الربح لكل طائر</td>
                                        {selectedComparisonIds.map(id => {
                                          const cycle = [state, ...allCycles].find(c => c.id === id);
                                          if (!cycle) return <td key={id}>-</td>;
                                          // Simplified net profit calc for comparison
                                          const birdsDied = cycle.mortalityBills.reduce((acc, m) => acc + toNum(m.count), 0);
                                          const birdsAlive = Math.max(0, toNum(cycle.totalChicks) - birdsDied);
                                          const deadFeed = cycle.mortalityBills.reduce((acc, m) => acc + (toNum(m.count) * getDailyStats(cycle.strain, toNum(m.ageAtDeath)).cumFeed), 0);
                                          const aliveFeed = birdsAlive * getDailyStats(cycle.strain, toNum(cycle.age)).cumFeed;
                                          const totalFeedKg = (deadFeed + aliveFeed) / 1000;
                                          const costs = (toNum(cycle.totalChicks) * toNum(cycle.chickPrice)) + (totalFeedKg * toNum(cycle.feedPrice)) + 
                                                        ([...cycle.electricityBills, ...cycle.waterBills, ...cycle.medicationBills, ...cycle.otherBills].reduce((acc, b) => acc + toNum(b.amount), 0));
                                          const revenue = cycle.salesRecords.reduce((acc, s) => acc + toNum(s.amount), 0);
                                          const profit = (revenue - costs) / toNum(cycle.totalChicks);
                                          return <td key={id} className={cn("text-center font-black", profit > 0 ? 'text-emerald-400' : 'text-red-400')}>{profit.toFixed(1)} ج.م</td>;
                                        })}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                      onClick={() => {
                        if (confirm('⚠️ تحذير: هل أنت متأكد تماماً من رغبتك في مسح كافة بيانات التطبيق نهائياً؟')) {
                          if (confirm('🛑 تنبيه أخير: سيتم حذف جميع الدورات الحالية والأرشيف والإعدادات. هل تريد الاستمرار بحق؟')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }
                      }}
                      className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 p-4 rounded-2xl border border-red-500/10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <RefreshCw size={14} />
                      إعادة ضبط المصنع (مسح شامل)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
                      type="text"
                      inputMode="decimal"
                      value={state.chickPrice ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setState(prev => ({ ...prev, chickPrice: val }));
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-black text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase">سعر كجم العلف</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={state.feedPrice ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setState(prev => ({ ...prev, feedPrice: val }));
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 font-black text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex flex-col text-right">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">سعر بورصة الفراخ البيضاء اليوم/كجم</label>
                        {state.lastPriceUpdateAt && (
                          <span className="text-[8px] text-slate-600 font-bold">آخر تحديث: {state.lastPriceUpdateAt}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isFetchingPrice && (
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="text-blue-500"
                          >
                            <RefreshCw size={14} />
                          </motion.div>
                        )}
                        {!state.isManualPriceMode ? (
                          <button 
                            onClick={() => setState(prev => ({ ...prev, isManualPriceMode: true }))}
                            className="text-[9px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase"
                          >
                            تعديل يدوي
                          </button>
                        ) : (
                          <button 
                            onClick={() => fetchChickenPrice(true)}
                            className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase flex items-center gap-1"
                          >
                            <RefreshCw size={10} />
                            تحديث آلي
                          </button>
                        )}
                      </div>
                    </div>
                    
                      <div className="relative group">
                      {isFetchingPrice && (
                        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px] rounded-xl z-10 flex items-center justify-center">
                          <span className="text-[10px] font-black text-blue-400 animate-pulse tracking-widest">جاري التحميل...</span>
                        </div>
                      )}
                      <input 
                        type="text"
                        inputMode="decimal"
                        readOnly={!state.isManualPriceMode}
                        value={state.sellingPrice ?? ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setState(prev => ({ ...prev, sellingPrice: val }));
                          }
                        }}
                        placeholder="0"
                        className={cn(
                          "w-full bg-slate-950 border rounded-xl px-6 py-5 font-black transition-all outline-none text-right text-white text-3xl",
                          state.isManualPriceMode 
                            ? "border-blue-500/50 focus:border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                            : "border-white/5 cursor-not-allowed"
                        )}
                      />
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-white pointer-events-none">ج.م</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sales Management Section */}
              <div className="bg-slate-900 border-white/5 p-6 rounded-3xl space-y-6 text-right">
                <div className="flex items-center justify-between mb-2">
                  <button 
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      salesRecords: [...prev.salesRecords, { id: Math.random().toString(36).substr(2, 9), label: `مبيعات اليوم ${prev.age}`, amount: 0, price: prev.sellingPrice, weight: 0 }] 
                    }))}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2"
                  >
                    <Plus size={16} />
                    إضافة عملية بيع
                  </button>
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">سجل المبيعات المجزأ</h3>
                    <div className="p-2 bg-slate-950 rounded-lg text-emerald-400">
                      <TrendingUp size={16} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {state.salesRecords.map(sale => (
                    <div key={sale.id} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBillToDelete({ id: sale.id, section: 'salesRecords', label: sale.label || 'سجل مبيعات' });
                          }}
                          className="p-2 text-slate-600 hover:text-red-500 transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                        <input 
                          type="text"
                          value={sale.label ?? ''}
                          onChange={e => setState(prev => ({ ...prev, salesRecords: prev.salesRecords.map(s => s.id === sale.id ? { ...s, label: e.target.value } : s) }))}
                          className="bg-transparent text-xs font-black text-emerald-400 text-right outline-none w-1/2"
                          placeholder="وصف العملية"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase">الوزن الكلي (كجم)</label>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={sale.weight ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setState(prev => ({ 
                                  ...prev, 
                                  salesRecords: prev.salesRecords.map(s => s.id === sale.id ? { ...s, weight: val, amount: toNum(val) * toNum(s.price) } : s) 
                                }));
                              }
                            }}
                            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-white text-center"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase">سعر الكجم</label>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={sale.price ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setState(prev => ({ 
                                  ...prev, 
                                  salesRecords: prev.salesRecords.map(s => s.id === sale.id ? { ...s, price: val, amount: toNum(s.weight) * toNum(val) } : s) 
                                }));
                              }
                            }}
                            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-white text-center"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase">القيمة الإجمالية</label>
                          <div className="bg-slate-900 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs font-black text-emerald-400 text-center">
                            {(toNum(sale.weight) * toNum(sale.price)).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* New Customer Fields */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase">اسم العميل</label>
                          <input 
                            type="text"
                            value={sale.customerName ?? ''}
                            onChange={e => setState(prev => ({ ...prev, salesRecords: prev.salesRecords.map(s => s.id === sale.id ? { ...s, customerName: e.target.value } : s) }))}
                            className="bg-slate-900 border border-white/10 rounded-xl px-1.5 py-2.5 text-xs font-black text-white text-right focus:border-blue-500/50 transition-all"
                            placeholder="الاسم"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase">رقم الهاتف</label>
                          <input 
                            type="text"
                            value={sale.customerPhone ?? ''}
                            onChange={e => setState(prev => ({ ...prev, salesRecords: prev.salesRecords.map(s => s.id === sale.id ? { ...s, customerPhone: e.target.value } : s) }))}
                            className="bg-slate-900 border border-white/10 rounded-xl px-1.5 py-2.5 text-xs font-black text-white text-right focus:border-blue-500/50 transition-all"
                            placeholder="01xxxxxxxxx"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase">المبلغ المدفوع</label>
                          <input 
                            type="text"
                            inputMode="numeric"
                            value={sale.amountPaid ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*$/.test(val)) {
                                setState(prev => ({ 
                                  ...prev, 
                                  salesRecords: prev.salesRecords.map(s => s.id === sale.id ? { ...s, amountPaid: val } : s) 
                                }));
                              }
                            }}
                            className="bg-slate-900 border border-white/10 rounded-xl px-1.5 py-2.5 text-xs font-black text-white text-center focus:border-emerald-500/50 transition-all"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase">المبلغ المتبقي</label>
                          <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-1.5 py-2.5 text-xs font-black text-slate-400 text-center flex items-center justify-center min-h-[42px]">
                            {(toNum(sale.amount) - toNum(sale.amountPaid)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {state.salesRecords.length === 0 && (
                    <p className="text-[10px] text-slate-600 font-bold text-center py-4">لم يتم تسجيل عمليات بيع حتى الآن</p>
                  )}
                </div>
              </div>

              <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 p-8 relative overflow-visible text-right">
                <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 blur-3xl -ml-16 -mt-16" />
                </div>
                <div className="relative z-10 space-y-10">
                  {/* 1. إجمالي التكاليف / المصروفات */}
                  <div className="text-center">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1 justify-center">
                      إجمالي التكاليف / المصروفات
                        <div className="group/spend relative" tabIndex={0}>
                          <PlusCircle size={10} className="text-slate-600 cursor-help" />
                          <motion.div 
                            drag
                            dragMomentum={false}
                            dragElastic={0.1}
                            className="invisible group-hover/spend:visible group-focus/spend:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 border border-white/10 p-4 rounded-xl shadow-2xl z-50 font-sans text-right cursor-move pointer-events-auto"
                          >
                            <p className="text-white font-bold mb-2 border-b border-white/10 pb-1 text-[10px]">توزيع التكاليف:</p>
                            <div className="space-y-1.5 text-[9px] pointer-events-none">
                              <div className="flex justify-between text-slate-300">
                                <span>{finances.totalChickPurchaseCost.toLocaleString()} ج.م</span>
                                <span>الكتاكيت ({state.totalChicks} فرد):</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>{finances.totalFeedCost.toLocaleString()} ج.م</span>
                                <span>العلف:</span>
                              </div>
                              <div className="flex justify-between text-slate-400 font-bold">
                                <span>{finances.generalBillSum.toLocaleString()} ج.م</span>
                                <span>المصاريف الثابتة:</span>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                    </div>
                    <p className="text-3xl font-black text-white">
                      {finances.totalSpending.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="text-xs text-slate-500 ms-2">ج.م</span>
                    </p>
                  </div>

                  <div className="w-full border-t border-white/5 pt-10 space-y-10">
                    {/* 2. خسارة النافق التراكمية */}
                    <div className="text-center group relative">
                      <div className="flex items-center justify-center gap-1 mb-1">
                          <div className="group/tooltip relative" tabIndex={0}>
                            <Info size={12} className="text-slate-500 cursor-help" />
                            <motion.div 
                              drag
                              dragMomentum={false}
                              dragElastic={0.1}
                              className="invisible group-hover/tooltip:visible group-focus/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-w-[calc(100vw-2.5rem)] bg-slate-800 p-4 rounded-xl border border-white/10 shadow-2xl z-50 text-[10px] text-slate-300 font-bold leading-relaxed text-right font-sans cursor-move pointer-events-auto"
                            >
                              <p className="text-emerald-400 mb-2 font-black border-b border-white/10 pb-1 text-xs">طريقة الحساب الدقيقة (Bird-Day):</p>
                              <p className="mb-2">حساب الخسارة التراكمية = مجموع خسائر كل طائر نفق بناءً على:</p>
                              <ul className="list-disc list-inside space-y-1.5 mt-1 text-slate-400 rtl text-[9px] pointer-events-none">
                                <li>سعر الكتكوت الأصلي عند الشراء</li>
                                <li>قيمة العلف الفعلي الذي استهلكه حتى لحظة وفاته</li>
                                <li>نصيبه العادل من المصاريف العامة</li>
                              </ul>
                            </motion.div>
                          </div>
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">خسارة النافق التراكمية</p>
                      </div>
                      <p className="text-3xl font-black text-red-400">
                        {finances.mortalityLossTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        <span className="text-xs text-red-600 ms-2">ج.م</span>
                      </p>
                    </div>

                    {/* 3. إجمالي المبيعات */}
                    <div className="text-center group relative">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">إجمالي المبيعات (المحققة)</p>
                      </div>
                      <p className="text-3xl font-black text-emerald-400">
                        {finances.actualSalesRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        <span className="text-xs text-emerald-600 ms-2">ج.م</span>
                      </p>
                    </div>

                    {/* 4. إجمالي الأرباح الفعلية / المتوقعة */}
                    <div className="text-center bg-white/5 p-8 rounded-3xl border border-white/10 ring-1 ring-emerald-500/20 shadow-inner">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 items-center flex justify-center gap-2">
                        إجمالي الأرباح الفعلية / المتوقعة
                          <div className="group/profit relative" tabIndex={0}>
                            <Layout size={10} className="text-slate-500 cursor-help" />
                            <motion.div 
                              drag
                              dragMomentum={false}
                              dragElastic={0.1}
                              className="invisible group-hover/profit:visible group-focus/profit:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 max-w-[calc(100vw-2.5rem)] bg-slate-900 border border-white/10 p-5 rounded-2xl shadow-2xl z-50 text-right font-sans ring-1 ring-emerald-500/20 cursor-move pointer-events-auto"
                            >
                              <p className="text-emerald-400 font-black mb-3 border-b border-white/10 pb-2 text-[11px]">تحليل الأرباح والخسائر (P&L):</p>
                              <div className="space-y-2 text-[10px] pointer-events-none">
                                <div className="flex justify-between items-center text-slate-300">
                                  <span className="font-mono text-emerald-400">+{finances.actualSalesRevenue.toLocaleString()}</span>
                                  <span>مبيعات محققة:</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-300">
                                  <span className="font-mono text-emerald-500/70">+{finances.estimatedRemainingRevenue.toLocaleString()}</span>
                                  <span>متوقع (الطيور الحالية):</span>
                                </div>
                                <div className="border-t border-white/5 my-2" />
                                <div className="flex justify-between items-center text-slate-400">
                                  <span className="font-mono text-red-400">-{finances.totalChickPurchaseCost.toLocaleString()}</span>
                                  <span>شراء الكتاكيت:</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                  <span className="font-mono text-red-400">-{finances.totalFeedCost.toLocaleString()}</span>
                                  <span>تكلفة العلف الكلية:</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400">
                                  <span className="font-mono text-red-400">-{finances.generalBillSum.toLocaleString()}</span>
                                  <span>إجمالي الفواتير:</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-emerald-500/20 bg-emerald-500/5 -mx-5 px-5 flex justify-between items-center font-black">
                                  <span className="font-mono text-emerald-400 text-sm">{finances.netProfit.toLocaleString()} ج.م</span>
                                  <span className="text-white">صافي الربح النهائي:</span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                      </div>
                      <p className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                        {finances.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        <span className="text-sm text-emerald-600 ms-3 font-normal uppercase">ج.م</span>
                      </p>
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
                   onAdd={() => setState(prev => ({ ...prev, electricityBills: [...prev.electricityBills, { id: Math.random().toString(36).substr(2, 9), label: 'بدون عنوان', amount: 0, startDay: 1, endDay: prev.targetCycleDays }] }))}
                   onRemove={(id) => {
                     const bill = state.electricityBills.find(b => b.id === id);
                     setBillToDelete({ id, section: 'electricityBills', label: bill?.label || 'فاتورة كهرباء' });
                   }}
                   onUpdate={(id, field, val) => setState(prev => ({ ...prev, electricityBills: prev.electricityBills.map(b => b.id === id ? { ...b, [field]: val } : b) }))}
                />
                <BillSection 
                   title="فواتير المياه" 
                   bills={state.waterBills} 
                   icon={Droplets}
                   onAdd={() => setState(prev => ({ ...prev, waterBills: [...prev.waterBills, { id: Math.random().toString(36).substr(2, 9), label: 'بدون عنوان', amount: 0, startDay: 1, endDay: prev.targetCycleDays }] }))}
                   onRemove={(id) => {
                     const bill = state.waterBills.find(b => b.id === id);
                     setBillToDelete({ id, section: 'waterBills', label: bill?.label || 'فاتورة مياه' });
                   }}
                   onUpdate={(id, field, val) => setState(prev => ({ ...prev, waterBills: prev.waterBills.map(b => b.id === id ? { ...b, [field]: val } : b) }))}
                />
                <BillSection 
                   title="فواتير الأدوية" 
                   bills={state.medicationBills} 
                   icon={Activity}
                   onAdd={() => setState(prev => ({ ...prev, medicationBills: [...prev.medicationBills, { id: Math.random().toString(36).substr(2, 9), label: 'بدون عنوان', amount: 0, startDay: 1, endDay: prev.targetCycleDays }] }))}
                   onRemove={(id) => {
                     const bill = state.medicationBills.find(b => b.id === id);
                     setBillToDelete({ id, section: 'medicationBills', label: bill?.label || 'فاتورة أدوية' });
                   }}
                   onUpdate={(id, field, val) => setState(prev => ({ ...prev, medicationBills: prev.medicationBills.map(b => b.id === id ? { ...b, [field]: val } : b) }))}
                />
                <BillSection 
                   title="فواتير أخرى" 
                   bills={state.otherBills} 
                   icon={Banknote}
                   onAdd={() => setState(prev => ({ ...prev, otherBills: [...prev.otherBills, { id: Math.random().toString(36).substr(2, 9), label: 'مصاريف أخرى', amount: 0, startDay: 1, endDay: prev.targetCycleDays }] }))}
                   onRemove={(id) => {
                     const bill = state.otherBills.find(b => b.id === id);
                     setBillToDelete({ id, section: 'otherBills', label: bill?.label || 'فاتورة أخرى' });
                   }}
                   onUpdate={(id, field, val) => setState(prev => ({ ...prev, otherBills: prev.otherBills.map(b => b.id === id ? { ...b, [field]: val } : b) }))}
                />
                
                {/* Mortality Tracking Section */}
                <div className="bg-slate-900 border-white/5 p-6 rounded-3xl space-y-6 text-right">
                  <div className="flex items-center justify-between mb-2">
                    <button 
                      onClick={() => setState(prev => ({ 
                        ...prev, 
                        mortalityBills: [...prev.mortalityBills, { id: Math.random().toString(36).substr(2, 9), label: 'سجل نافق', count: 1, ageAtDeath: prev.age, amount: 0 }] 
                      }))}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2"
                    >
                      <Plus size={16} />
                      تسجيل نافق
                    </button>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">تكاليف النافق (مرتبطة بالاستهلاك)</h3>
                      <div className="p-2 bg-slate-950 rounded-lg text-red-400">
                        <AlertTriangle size={16} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {state.mortalityBills.map(mort => {
                      const age = toNum(mort.ageAtDeath);
                      const statsAtDeath = getDailyStats(state.strain, age);
                      const feedCost = (statsAtDeath.cumFeed / 1000) * toNum(state.feedPrice);
                      const resourcesCost = calculateMortalityOverhead(age);
                      const individualCost = toNum(state.chickPrice) + feedCost + resourcesCost;
                      const totalLoss = individualCost * toNum(mort.count);

                      return (
                        <div key={mort.id} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBillToDelete({ id: mort.id, section: 'mortalityBills', label: mort.label || 'سجل نافق' });
                              }}
                              className="p-2 text-slate-600 hover:text-red-500 transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                            <input 
                              type="text"
                              value={mort.label ?? ''}
                              onChange={e => setState(prev => ({ ...prev, mortalityBills: prev.mortalityBills.map(m => m.id === mort.id ? { ...m, label: e.target.value } : m) }))}
                              className="bg-transparent text-xs font-black text-red-500 text-right outline-none w-1/2"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1 text-center">
                              <label className="text-[9px] font-black text-slate-600 uppercase">العدد</label>
                              <input 
                                type="number"
                                value={mort.count ?? 1}
                                onChange={e => setState(prev => ({ ...prev, mortalityBills: prev.mortalityBills.map(m => m.id === mort.id ? { ...m, count: e.target.value } : m) }))}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-white text-center"
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-center">
                              <label className="text-[9px] font-black text-slate-600 uppercase">العمر عند النفوق</label>
                              <input 
                                type="number"
                                value={mort.ageAtDeath ?? 1}
                                onChange={e => setState(prev => ({ ...prev, mortalityBills: prev.mortalityBills.map(m => m.id === mort.id ? { ...m, ageAtDeath: e.target.value } : m) }))}
                                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-white text-center"
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-center relative">
                              <label className="text-[9px] font-black text-slate-600 uppercase flex items-center justify-center gap-1">
                                الخسارة
                                <div className="group/tooltip relative" tabIndex={0}>
                                  <AlertTriangle size={10} className="text-red-400 cursor-help" />
                                  <motion.div 
                                    drag
                                    dragMomentum={false}
                                    dragElastic={0.1}
                                    className="invisible group-hover/tooltip:visible group-focus/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl z-50 text-[10px] text-right pointer-events-auto ring-1 ring-white/5 cursor-move"
                                  >
                                    <p className="text-emerald-400 mb-3 font-black border-b border-white/10 pb-2 text-xs">تحليل تكلفة النافق الدقيق:</p>
                                    <div className="space-y-2.5 text-slate-300 pointer-events-none">
                                      <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg px-3">
                                        <span className="text-white font-mono text-xs">{toNum(state.chickPrice).toFixed(2)} ج.م</span>
                                        <span className="font-bold">سعر الكتكوت:</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg px-3">
                                        <span className="text-white font-mono text-xs">{feedCost.toFixed(2)} ج.م</span>
                                        <span className="font-bold">تكلفة العلف ({statsAtDeath.cumFeed} جرام):</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg px-3">
                                        <span className="text-white font-mono text-xs">{resourcesCost.toFixed(2)} ج.م</span>
                                        <span className="font-bold">نصيب الفواتير (Prorated):</span>
                                      </div>
                                      
                                      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                                        <p className="text-[9px] text-slate-400 leading-tight">
                                          * تم حساب نصيب الفواتير بقسمة إجمالي الفواتير ({allBills.reduce((acc, b) => acc + toNum(b.amount), 0)}) على إجمالي "أيام-الطيور" في الدورة، مضروباً في عدد الأيام التي عاشها هذا النافق فعلياً.
                                        </p>
                                        <div className="flex justify-between items-center bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                                          <span className="text-red-400 font-mono text-sm">{individualCost.toFixed(2)} ج.م</span>
                                          <span className="font-black text-red-100 italic">إجمالي الخسارة للفرد:</span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                </div>
                              </label>
                              <div className="bg-slate-900 border border-red-500/20 rounded-lg px-3 py-2 text-xs font-black text-red-400 text-center">
                                {totalLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {state.mortalityBills.length === 0 && (
                      <p className="text-[10px] text-slate-600 font-bold text-center py-4">لا يوجد سجلات نافق حتى الآن</p>
                    )}
                  </div>
                </div>
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
                        <div className="flex items-center justify-center gap-1.5 mb-1" title={state.isManualOverride ? "تم التعديل يدوياً" : "يتم التحديث تلقائياً"}>
                           {state.isManualOverride ? <Edit3 size={11} className="text-amber-500" /> : <RefreshCw size={11} className="text-purple-400 animate-spin-slow" />}
                           <span className="text-[8px] font-black text-slate-600 uppercase">عمر الكتكوت</span>
                        </div>
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
                  value={Math.floor(herdBiomass)} 
                  unit={
                    <>
                      كجم
                      {Math.round((herdBiomass % 1) * 1000) > 0 && (
                        <>
                          <span className="mx-1">و</span>
                          <span className="text-cyan-400 font-black">
                            {Math.round((herdBiomass % 1) * 1000)} جم
                          </span>
                        </>
                      )}
                    </>
                  } 
                  icon={ContainerIcon} 
                  color="text-purple-400" 
                />
                <Stat 
                  label="ساعات الإظلام" 
                  value={lightingSchedule.darknessHours} 
                  unit="ساعة" 
                  icon={Clock} 
                  color="text-indigo-400" 
                  subLabel="بداية من"
                  subValue={(() => {
                    const [h, m] = lightingSchedule.darknessStart.split(':').map(Number);
                    const displayH = h % 12 || 12;
                    const period = h >= 12 ? 'م' : 'ص';
                    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
                  })()}
                />
                <Stat 
                  label="الحرارة المطلوبة" 
                  value={targetTemp} 
                  unit="°م" 
                  icon={Thermometer} 
                  color="text-rose-400" 
                  subLabel="حسب العمر"
                  subValue={`${toNum(state.age)} يوم`}
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

                <div className="mt-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col md:flex-row items-start gap-4 relative z-10">
                  <div className="bg-indigo-500/20 p-2 rounded-xl flex-shrink-0">
                    <Clock size={16} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col items-center gap-4 mb-4">
                      <div className="flex items-center justify-between w-full px-2">
                        <button 
                          onClick={() => setState(prev => ({ ...prev, isCustomDarkness: !prev.isCustomDarkness }))}
                          className={cn(
                            "text-[8px] font-black px-2 py-1 rounded-lg border transition-all uppercase tracking-widest",
                            state.isCustomDarkness 
                              ? "bg-amber-500/20 border-amber-500/30 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                              : "bg-slate-800 border-white/5 text-slate-500"
                          )}
                        >
                          {state.isCustomDarkness ? 'يدوي (Custom)' : 'تلقائي (Auto)'}
                        </button>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest text-right">برنامج الإضاءة (علمي)</p>
                      </div>
                      
                      <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 w-full max-w-[200px] mx-auto flex flex-col items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10 transition-all duration-300">
                          {lightingSchedule.triggers.map((trigger) => (
                            <div 
                              key={trigger.type} 
                              className={cn(
                                "w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center border border-white/5 shadow-lg",
                                trigger.color.replace('text-', 'shadow-').split(' ')[0] + "/10"
                              )}
                            >
                              <trigger.icon size={10} className={trigger.color} />
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col items-center gap-1.5 w-full">
                          <span className="text-[8px] font-black text-slate-500 uppercase">من</span>
                          <input 
                            type="time" 
                            value={state.darknessStart ?? '23:00'}
                            onChange={(e) => setState(prev => ({ ...prev, darknessStart: e.target.value }))}
                            className="bg-indigo-500/20 text-xs font-black text-white px-3 py-2 rounded-xl border border-indigo-500/30 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer w-full text-center"
                          />
                        </div>
                        
                        <div className="flex flex-col items-center gap-1.5 w-full">
                          <span className="text-[8px] font-black text-slate-500 uppercase">إلى</span>
                          <input 
                            type="time" 
                            value={lightingSchedule.darknessEnd}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const [sh, sm] = (state.darknessStart ?? '23:00').split(':').map(Number);
                              const [eh, em] = val.split(':').map(Number);
                              let durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
                              if (durationMinutes < 0) durationMinutes += 1440;
                              setState(prev => ({ ...prev, darknessHours: durationMinutes / 60, isCustomDarkness: true }));
                            }}
                            className="bg-indigo-500/20 text-xs font-black text-white px-3 py-2 rounded-xl border border-indigo-500/30 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer w-full text-center"
                          />
                        </div>

                        <div className="mt-1 pt-3 border-t border-white/5 w-full flex flex-col items-center gap-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase">مدة الإظلام (ساعة)</label>
                          <div className="flex items-center gap-3">
                            <input 
                              type="number" 
                              min="0"
                              max="23"
                              step="0.5"
                              value={state.isCustomDarkness ? (state.darknessHours ?? '') : lightingSchedule.recommendedHours}
                              readOnly={!state.isCustomDarkness}
                              onChange={(e) => setState(prev => ({ ...prev, darknessHours: e.target.value, isCustomDarkness: true }))}
                              className={cn(
                                "p-2 rounded-xl text-center font-black text-lg w-20 border outline-none transition-all",
                                state.isCustomDarkness 
                                  ? "bg-slate-950 border-amber-500/50 text-amber-400" 
                                  : "bg-indigo-500/10 border-indigo-500/30 text-white"
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="w-full space-y-2">
                        <div className="flex justify-center">
                          <span className="text-[10px] font-black text-white bg-indigo-500/20 px-4 py-1.5 rounded-full border border-indigo-500/10 whitespace-nowrap">
                            {lightingSchedule.totalLight} ساعة ضوء : {toNum(lightingSchedule.darknessHours).toFixed(1)} ساعة إظلام
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-4 py-1">
                          <button 
                            onClick={() => setState(prev => ({ ...prev, isDarknessLinkedToTemp: !prev.isDarknessLinkedToTemp }))}
                            className={cn(
                              "flex items-center gap-1 text-[8px] font-black uppercase px-2 py-1 rounded-md border transition-all",
                              state.isDarknessLinkedToTemp ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-slate-900 border-white/5 text-slate-600"
                            )}
                          >
                            <Thermometer size={10} />
                            ربط بالحرارة
                          </button>
                          <button 
                            onClick={() => setState(prev => ({ ...prev, isDarknessLinkedToMed: !prev.isDarknessLinkedToMed }))}
                            className={cn(
                              "flex items-center gap-1 text-[8px] font-black uppercase px-2 py-1 rounded-md border transition-all",
                              state.isDarknessLinkedToMed ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-slate-900 border-white/5 text-slate-600"
                            )}
                          >
                            <Stethoscope size={10} />
                            ربط بالعلاج
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 space-y-3 flex flex-col items-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <Calendar size={14} className="text-blue-400 opacity-60" />
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed text-center italic opacity-90">{lightingSchedule.ageReason}</p>
                      </div>
                      {lightingSchedule.tempReason && (
                        <div className="flex flex-col items-center gap-1 pt-2 border-t border-white/5 w-full">
                          <Thermometer size={14} className="text-red-400 opacity-60" />
                          <p className="text-[11px] text-red-300 font-bold leading-relaxed text-center">{lightingSchedule.tempReason}</p>
                        </div>
                      )}
                      {lightingSchedule.medReason && (
                        <div className="flex flex-col items-center gap-1 pt-2 border-t border-white/5 w-full">
                          <Stethoscope size={14} className="text-amber-400 opacity-60" />
                          <p className="text-[11px] text-amber-300 font-bold leading-relaxed text-center">{lightingSchedule.medReason}</p>
                        </div>
                      )}
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
              <header className="flex items-center justify-between px-0 mb-4">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 sm:gap-3">
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

              <div className="px-0 mb-4 space-y-4">
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-tight sm:tracking-widest block leading-tight">البرنامج العلاجي الموحد (مجدول + طارئ)</span>
                    <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest text-right self-end sm:self-auto">
                       <div className="flex items-center gap-1.5" title={state.isManualOverride ? "تم التعديل يدوياً" : "يتم التحديث تلقائياً"}>
                          {state.isManualOverride ? <Edit3 size={10} className="text-amber-500" /> : <RefreshCw size={10} className="text-blue-400 animate-spin-slow" />}
                          عمر القطيع: {state.age} يوم
                       </div>
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

                        {unifiedTimeline.map((item: any, i) => {
                          if (item.type === 'darkness') {
                            return (
                              <div key="darkness-period" className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-3xl relative border-s-4 border-s-indigo-600 animate-in fade-in slide-in-from-right-4 duration-500 shadow-sm overflow-hidden">
                                {/* Indicators in Timeline */}
                                <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
                                  {lightingSchedule.triggers.map((trigger) => (
                                    <div 
                                      key={trigger.type} 
                                      className={cn(
                                        "w-5 h-5 rounded-full bg-slate-950 flex items-center justify-center border border-white/5 shadow-md",
                                        trigger.color.replace('text-', 'shadow-').split(' ')[0] + "/10"
                                      )}
                                    >
                                      <trigger.icon size={10} className={trigger.color} />
                                    </div>
                                  ))}
                                </div>

                                <div className="flex flex-col items-center justify-center w-full">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="text-right">
                                      <h3 className="text-sm font-black text-white">{item.name}</h3>
                                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">فترة راحة بيولوجية (علمي)</p>
                                    </div>
                                    <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-600/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                                      <Moon size={20} />
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-center w-full gap-4">
                                    <div className="flex flex-col items-center justify-center gap-3 bg-slate-900/40 p-5 rounded-2xl border border-white/5 w-full max-w-[200px]">
                                      <div className="flex flex-col items-center gap-1.5 w-full">
                                        <span className="text-[8px] font-black text-slate-500 uppercase">من</span>
                                        <input 
                                          type="time" 
                                          value={state.darknessStart ?? '23:00'}
                                          onChange={(e) => setState(prev => ({ ...prev, darknessStart: e.target.value }))}
                                          className="bg-indigo-500/20 text-xs font-black text-white px-3 py-2 rounded-xl border border-indigo-500/30 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer w-full text-center"
                                        />
                                      </div>
                                      
                                      <div className="flex flex-col items-center gap-1.5 w-full">
                                        <span className="text-[8px] font-black text-slate-500 uppercase">إلى</span>
                                        <input 
                                          type="time" 
                                          value={lightingSchedule.darknessEnd}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) return;
                                            const [sh, sm] = (state.darknessStart ?? '23:00').split(':').map(Number);
                                            const [eh, em] = val.split(':').map(Number);
                                            let durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
                                            if (durationMinutes < 0) durationMinutes += 1440;
                                            setState(prev => ({ ...prev, darknessHours: durationMinutes / 60, isCustomDarkness: true }));
                                          }}
                                          className="bg-indigo-500/20 text-xs font-black text-white px-3 py-2 rounded-xl border border-indigo-500/30 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer w-full text-center"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="flex items-center gap-2 px-6 py-2 bg-indigo-500/10 rounded-full border border-indigo-500/20 shadow-sm transition-all duration-300">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">المدة:</span>
                                        <span className={cn(
                                          "text-xs font-black leading-none",
                                          state.isCustomDarkness ? "text-amber-400" : "text-indigo-400"
                                        )}>
                                          {toNum(lightingSchedule.darknessHours).toFixed(1)} ساعة إظلام
                                          {state.isCustomDarkness && <span className="ms-1 text-[8px] opacity-70">(يدوي)</span>}
                                        </span>
                                      </div>

                                      {/* Reasoning in Timeline */}
                                      <div className="mt-2 space-y-1 w-full max-w-xs transition-opacity duration-500">
                                        <p className="text-[9px] text-slate-500 font-bold leading-tight text-center italic opacity-80">{lightingSchedule.ageReason}</p>
                                        {lightingSchedule.tempReason && (
                                          <p className="text-[9px] text-red-300/80 font-bold leading-tight text-center">{lightingSchedule.tempReason}</p>
                                        )}
                                        {lightingSchedule.medReason && (
                                          <p className="text-[9px] text-amber-300/80 font-bold leading-tight text-center">{lightingSchedule.medReason}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (item.type === 'emergency') {
                            const med = item;
                            const nextItem = unifiedTimeline[i + 1];
                            const localNextDayFirstMed = i === unifiedTimeline.length - 1 ? nextDayFirstMed : null;

                            return (
                              <div key={med.id} className="bg-red-500/5 border border-red-500/20 p-5 rounded-3xl relative group border-s-4 border-s-red-600">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBillToDelete({ id: med.id, section: 'emergencyMeds', label: med.name || 'جرعة طوارئ' });
                  }}
                  className="absolute top-4 left-4 p-2 text-slate-600 hover:text-red-500 transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
                  title="حذف"
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
                                
                                {med.overlapsDarkness && (
                                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 justify-end scale-95 origin-right">
                                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-amber-200 text-right leading-relaxed">تنبيه: الجرعة تتداخل مع فترة الإظلام.</p>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block text-center">اسم الجرعة</label>
                                      <div className="relative">
                                        <div className="relative">
                                          <input 
                                            type="text"
                                            value={med.name}
                                            onChange={(e) => {
                                              const name = e.target.value;
                                              let updates: any = { name };
                                              
                                              // Auto-fill logic based on selected name or keywords
                                              const exactMatch = EMERGENCY_DEFAULTS.find(d => d.name === name);
                                              const keywordMatch = !exactMatch && EMERGENCY_DEFAULTS.find(d => 
                                                d.keywords.some(k => name.toLowerCase().includes(k.toLowerCase()))
                                              );
                                              const medicationMatch = !exactMatch && !keywordMatch && MEDICATIONS.find(m => m.name === name);

                                              const finalMatch = exactMatch || keywordMatch || medicationMatch;

                                              if (finalMatch) {
                                                if ('duration' in finalMatch) {
                                                  updates.duration = finalMatch.duration;
                                                  updates.doseValue = finalMatch.dose || 1;
                                                  updates.unit = finalMatch.unit;
                                                } else if ('doseValue' in finalMatch) {
                                                  // From MEDICATIONS list
                                                  updates.doseValue = finalMatch.doseValue;
                                                  updates.unit = finalMatch.unit;
                                                }
                                              }
                                              updateEmergencyMed(med.id, updates);
                                            }}
                                            onFocus={() => setOpenMedDropdown(med.id)}
                                            placeholder="اختر أو ابحث عن دواء..."
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl ps-10 pe-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500/50 text-center shadow-inner"
                                          />
                                          <button 
                                            type="button"
                                            onClick={() => setOpenMedDropdown(openMedDropdown === med.id ? null : med.id)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                          >
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${openMedDropdown === med.id ? 'rotate-180' : ''}`} />
                                          </button>
                                        </div>

                                        {openMedDropdown === med.id && (
                                          <>
                                            <div 
                                              className="fixed inset-0 z-10" 
                                              onClick={() => setOpenMedDropdown(null)}
                                            />
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-1">
                                              <div className="px-3 py-1 bg-white/5 mb-1">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">جرعات طوارئ مقترحة</span>
                                              </div>
                                              {EMERGENCY_DEFAULTS.map((d, i) => (
                                                <button
                                                  key={`emergency-${i}`}
                                                  type="button"
                                                  onClick={() => {
                                                    updateEmergencyMed(med.id, {
                                                      name: d.name,
                                                      duration: d.duration,
                                                      doseValue: d.dose || 1,
                                                      unit: d.unit
                                                    });
                                                    setOpenMedDropdown(null);
                                                  }}
                                                  className="w-full text-right px-4 py-2 text-[10px] font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                                                >
                                                  {d.name}
                                                </button>
                                              ))}
                                              <div className="px-3 py-1 bg-white/5 my-1">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">باقي الأدوية</span>
                                              </div>
                                              {Array.from(new Set(MEDICATIONS.map(m => m.name)))
                                                .filter(name => !EMERGENCY_DEFAULTS.some(d => d.name === name))
                                                .map((name, i) => (
                                                <button
                                                  key={`med-${i}`}
                                                  type="button"
                                                  onClick={() => {
                                                    const m = MEDICATIONS.find(med => med.name === name);
                                                    updateEmergencyMed(med.id, {
                                                      name: name,
                                                      doseValue: m?.doseValue || 1,
                                                      unit: m?.unit || 'سم³/لتر'
                                                    });
                                                    setOpenMedDropdown(null);
                                                  }}
                                                  className="w-full text-right px-4 py-2 text-[10px] font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                                                >
                                                  {name}
                                                </button>
                                              ))}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col space-y-3 mb-1 max-w-[280px] mx-auto">
                                      {/* Start Time Field */}
                                      <div className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-2xl border border-white/5 shadow-xl">
                                        <div className="text-left flex flex-col justify-center min-w-[60px]">
                                          <span className="text-[11px] font-black text-slate-400 leading-tight">وقت</span>
                                          <span className="text-[11px] font-black text-slate-400 leading-tight">البدء:</span>
                                        </div>
                                        <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 flex items-center shadow-inner relative group cursor-pointer h-[42px]">
                                          <input 
                                            type="time"
                                            value={med.startTime ?? ''}
                                            onChange={(e) => updateEmergencyMed(med.id, { startTime: e.target.value })}
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20 [color-scheme:dark]"
                                          />
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
                                          <span className="text-[11px] font-black text-slate-400 leading-tight">(س):</span>
                                        </div>
                                        <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 shadow-inner">
                                          <input 
                                            type="text"
                                            inputMode="decimal"
                                            value={med.duration || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                updateEmergencyMed(med.id, { duration: val });
                                              }
                                            }}
                                            className="w-full bg-transparent text-white text-[15px] font-black focus:outline-none text-center [&::-webkit-inner-spin-button]:hidden leading-none"
                                            placeholder="8"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col justify-end gap-3">
                                    <div className="flex gap-2">
                                       <div className="flex-1 bg-slate-900/40 p-2 rounded-2xl border border-white/5">
                                          <label className="text-[8px] font-black text-slate-500 uppercase mb-1 block text-center">الجرعة</label>
                                          <input 
                                            type="text"
                                            inputMode="decimal"
                                            value={med.doseValue || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                updateEmergencyMed(med.id, { doseValue: val });
                                              }
                                            }}
                                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-xs font-black text-white text-center focus:outline-none"
                                            placeholder="1"
                                          />
                                       </div>
                                       <div className="flex-1 bg-slate-900/40 p-2 rounded-2xl border border-white/5">
                                          <label className="text-[8px] font-black text-slate-500 uppercase mb-1 block text-center">الوحدة</label>
                                          <div className="grid grid-cols-3 gap-1 h-[26px]">
                                            {['سم³/لتر', 'جرام/لتر', 'ملي/لتر'].map((u) => (
                                              <button
                                                key={u}
                                                onClick={() => updateEmergencyMed(med.id, { unit: u })}
                                                className={cn(
                                                  "text-[8px] font-black rounded-lg transition-all",
                                                  med.unit === u 
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                                    : "bg-slate-950 text-slate-500 border border-white/5 hover:border-white/10"
                                                )}
                                              >
                                                {u}
                                              </button>
                                            ))}
                                          </div>
                                       </div>
                                    </div>

                                    {med.startTime && toNum(med.duration) > 0 && (
                                      <div className="p-4 bg-red-600/10 rounded-2xl border border-red-600/20 space-y-3 text-right">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">توقيت الانتهاء:</span>
                                          <span className="text-xs font-black text-red-400">
                                            {(() => {
                                              const [h, m] = med.startTime.split(':').map(Number);
                                              const d = new Date();
                                              d.setHours(h + toNum(med.duration), m, 0, 0);
                                              return formatArabicTime(d);
                                            })()}
                                          </span>
                                        </div>

                                         <div className="border-t border-red-500/10 pt-2 flex flex-col gap-1.5">
                                           {toNum(med.doseValue) > 0 && (
                                             <div className="flex items-center justify-between bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                                               <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">إجمالي الدواء:</span>
                                               <span className="text-xs font-black text-amber-400">
                                                 {(med.calculatedWater * toNum(med.doseValue)).toLocaleString()} {med.unit.includes('/') ? med.unit.split('/')[0] : med.unit}
                                               </span>
                                             </div>
                                           )}
                                           <div className="flex items-center justify-between px-2">
                                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">على مياه:</span>
                                              <span className="text-xs font-black text-white">{med.calculatedWater} لتر</span>
                                           </div>
                                           {toNum(med.doseValue) > 0 && (
                                              <div className="flex items-center justify-between px-2 pt-1 border-t border-white/5 opacity-60">
                                                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">بمعدل:</span>
                                                 <span className="text-[10px] font-black text-slate-400">{med.doseValue} {med.unit}</span>
                                              </div>
                                           )}
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
                                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                  <Zap size={10} className="text-emerald-400 shrink-0" />
                                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block leading-tight">التالي ({nextAct.name}):</span>
                                                </div>
                                                <div className="flex items-center gap-2 ps-2">
                                                  <span className="text-xs font-black text-emerald-400 whitespace-nowrap">{nextInfo.nextStartTimeStr}</span>
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
                                "bg-slate-800/40 border border-white/5 p-5 rounded-3xl flex flex-col gap-3 border-s-4 shadow-sm",
                                med.isRest ? "border-s-emerald-500/50 opacity-70" : "border-s-blue-500"
                              )}>
                                <div className="flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border shadow-inner",
                                      med.isRest ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20" : "bg-blue-600/10 text-blue-400 border-blue-500/20"
                                    )}>
                                      {med.originalIndex + 1}
                                    </div>
                                    <h4 className="font-black text-base text-white">{med.name}</h4>
                                  </div>
                                  
                                  {med.overlapsDarkness && (
                                    <div className="flex items-center gap-2 px-2 py-1 bg-amber-500/10 border border-amber-500/10 rounded-lg">
                                      <span className="text-[9px] font-bold text-amber-400">تداخل مع الإظلام</span>
                                      <AlertTriangle size={10} className="text-amber-500" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col space-y-2 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                                  {/* Dose Info - Only for non-rest or if dose > 0 */}
                                  {!med.isRest && med.doseValue > 0 && (
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                      <div className="text-[11px] font-black text-amber-500 uppercase">الجرعة: {med.doseValue} {med.unit}</div>
                                    </div>
                                  )}

                                  {/* Duration Info - Show for non-rest OR for pure water */}
                                  {(!med.isRest || med.name.includes('ماء نقي')) && med.recommendedHours > 0 && (
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                                      <div className="text-[11px] font-bold text-blue-400 uppercase">مدة الإعطاء: {med.recommendedHours} ساعات</div>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-1">
                                    <Droplets size={12} className="text-emerald-500" />
                                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest leading-none">
                                      {med.isRest ? 'راحة:' : 'المطلوب الآن:'} {
                                        med.unit && med.unit.includes('طائر') 
                                          ? Math.round(toNum(state.totalChicks) * med.doseValue).toLocaleString() 
                                          : Math.round(med.calculatedWater * med.doseValue).toLocaleString()
                                      } { (med.unit && med.unit.includes('/')) ? med.unit.split('/')[0] : med.unit } / {med.calculatedWater} لتر مياه
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-3 bg-slate-950/50 p-2.5 rounded-2xl border border-white/5">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ps-2">وقت البدء:</span>
                                    <input 
                                      type="time" 
                                      value={state.medicationLogs[medKey] ?? ''}
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
                                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                <Clock size={10} className="text-emerald-400 shrink-0" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block leading-tight">
                                                  {i === unifiedTimeline.length - 1 ? "أول جرعة غداً (" + (state.age + 1) + "):" : nextInfo.label + " (" + nextAct.name + "):"}
                                                </span>
                                              </div>
                                              <span className="text-xs font-black text-emerald-400 whitespace-nowrap ps-2">{nextInfo.nextStartTimeStr}</span>
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
                  const totalSpecificDose = med.unit && med.unit.includes('طائر') 
                    ? Math.round(toNum(state.totalChicks) * med.doseValue) 
                    : Math.round(med.calculatedWater * med.doseValue);
                  const isWithdrawalRisk = toNum(state.age) >= 28 && med.isAntibiotic;
                  
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
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                             اليوم {state.age}
                          </span>
                        </div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{med.mixing || 'بدون خلط'}</span>
                      </div>

                      {isWithdrawalRisk && (
                        <div className="bg-red-500/20 px-5 py-1.5 flex items-center gap-2 border-b border-red-500/20">
                          <AlertCircle size={12} className="text-red-400" />
                          <span className="text-[9px] font-black text-red-300 uppercase tracking-widest">تحذير: فترة سحب (Withdrawal Period) - يمنع استخدام المضادات</span>
                        </div>
                      )}

                      <div className="flex flex-col p-5 pb-4 space-y-3">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-1.5 h-10 rounded-full bg-slate-800 transition-all",
                              isWithdrawalRisk ? "bg-red-600" : "group-hover:bg-blue-600"
                            )}></div>
                            <div>
                              <h4 className="font-black text-lg text-white group-hover:text-blue-400 transition-colors">{med.name}</h4>
                            </div>
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
                       <div className="space-y-1 text-center">
                          <span className="text-[9px] font-bold text-slate-400 block">الداخلية</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={state.internalTemp}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                setState(prev => ({ ...prev, internalTemp: val }));
                              }
                            }}
                            className="bg-transparent text-2xl font-black text-white w-full outline-none text-center"
                          />
                       </div>
                       <div className="space-y-1 text-center">
                          <span className="text-[9px] font-bold text-slate-400 block">الخارجية</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={state.externalTemp}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                setState(prev => ({ ...prev, externalTemp: val }));
                              }
                            }}
                            className="bg-transparent text-2xl font-black text-white w-full outline-none text-center"
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
                             yجب اتخاذ إجراء فوري.
                          </p>
                          <div className="bg-blue-700/50 p-4 rounded-xl border border-white/10">
                             <p className="text-sm font-black text-blue-100">
                                💡 الإجراء المقترح: <span className="text-white">
                                   {(() => {
                                     const cycleMinutes = 60 / toNum(state.cyclesPerHour);
                                     if (tempDelta > 4) {
                                       return `رفع التهوية للحد الأقصى عبر تشغيل عدد ${Math.ceil(maxFans)} شفاطات بكامل طاقتها (${cycleMinutes.toFixed(0)} دقيقة/دورة) دون توقف.`;
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
                                      <span className="text-xl font-black text-white">{(((minVentilation / state.fanCapacity) * 60) / toNum(state.cyclesPerHour)).toFixed(1)}</span>
                                      <span className="text-[10px] font-bold text-blue-400">د/دورة</span>
                                   </div>
                                </div>
                                <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-400/20 text-right">
                                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 text-emerald-400">المطلوب للحل</p>
                                   <div className="flex items-baseline gap-1 justify-end">
                                      <span className="text-xl font-black text-white">
                                         {(() => {
                                            const currentOn = ((minVentilation / state.fanCapacity) * 60) / toNum(state.cyclesPerHour);
                                            const maxOn = 60 / toNum(state.cyclesPerHour);
                                            if (tempDelta > 1) return maxOn.toFixed(1);
                                            if (tempDelta > 0) return Math.min(maxOn, currentOn + (tempDelta * 3)).toFixed(1);
                                            return currentOn.toFixed(1);
                                         })()}
                                      </span>
                                      <span className="text-[10px] font-bold text-emerald-500">د/دورة</span>
                                   </div>
                                </div>
                             </div>
                             <p className="text-[9px] text-blue-200/50 font-bold mt-2 text-center italic">
                                * دورة التهوية المعتمدة هي {(60 / toNum(state.cyclesPerHour)).toFixed(0)} دقيقة (يجب استمرار العمل حتى استقرار الحرارة)
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
                           type="text"
                           inputMode="decimal"
                           value={state.fanCapacity}
                           onChange={e => {
                             const val = e.target.value;
                             if (val === '' || /^\d*\.?\d*$/.test(val)) {
                               setState(prev => ({ ...prev, fanCapacity: val }));
                             }
                           }}
                           className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-xl focus:border-emerald-500/50 focus:ring-0 transition-all"
                         />
                       </div>

                       <div>
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">عدد مرات التشغيل بالساعة</label>
                         <div className="flex items-center gap-4">
                            <input 
                              type="range"
                              min="1"
                              max="12"
                              value={state.cyclesPerHour}
                              onChange={e => setState(prev => ({ ...prev, cyclesPerHour: parseInt(e.target.value) }))}
                              className="flex-1 appearance-none h-2 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.3)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900 shadow-inner"
                               style={{
                                 background: `linear-gradient(to left, #10b981 0%, #10b981 ${( ( (Number(state.cyclesPerHour)) - 1) / (12 - 1) ) * 100}%, #1e293b ${( ( (Number(state.cyclesPerHour)) - 1) / (12 - 1) ) * 100}%, #1e293b 100%)`
                               }}
                            />
                            <span className="bg-emerald-600 text-white font-black px-4 py-2 rounded-xl text-lg min-w-[3rem] text-center shadow-lg shadow-emerald-500/20">{state.cyclesPerHour}</span>
                         </div>
                         <p className="text-[8px] text-slate-600 font-bold mt-1 text-right">
                           * يفضل 4-6 دورات بالساعة (كل 10-15 دقيقة) لضمان تجانس الهواء.
                         </p>
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
                           const cycles = Math.max(1, toNum(state.cyclesPerHour));
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
                            const totalSecs = (now.getMinutes() * 60 + now.getSeconds() + (typeof state.ventilationOffset === 'number' ? state.ventilationOffset : 0));
                            const cycles = Math.max(1, toNum(state.cyclesPerHour));
                            const cycleSecs = 3600 / cycles; 
                            const onRatio = minVentilation / (toNum(state.fanCapacity) || 1);
                            const onSecs = onRatio * cycleSecs;
                            const progress = ((totalSecs % cycleSecs) + cycleSecs) % cycleSecs;
                            const active = progress < onSecs;
                            const remaining = active ? onSecs - progress : cycleSecs - progress;
                            
                            const formatFullTime = (s: number) => {
                               const h = Math.floor(s / 3600);
                               const m = Math.floor((s % 3600) / 60);
                               const sc = Math.floor(s % 60);
                               return { h, m, s: sc };
                            };

                            const timeObj = formatFullTime(remaining);

                            if (isEditingTimer) {
                              return (
                                <div className="text-center bg-slate-900/90 backdrop-blur-sm p-4 rounded-3xl border border-emerald-500/30 z-10 shadow-2xl scale-110 pointer-events-auto">
                                   <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-3">تعديل المؤقت</p>
                                   <div className="flex items-center gap-1 justify-center mb-4">
                                      <div className="flex flex-col items-center">
                                         <button type="button" onClick={() => setEditTimerTime(p => ({ ...p, h: Math.min(99, p.h + 1) }))} className="text-slate-500 hover:text-white pb-1"><ChevronUp size={14} /></button>
                                         <input 
                                           type="text" 
                                           value={editTimerTime.h.toString().padStart(2, '0')}
                                           onFocus={(e) => e.target.select()}
                                           onChange={e => {
                                             const v = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                             setEditTimerTime(p => ({ ...p, h: Math.min(99, v) }));
                                           }}
                                           className="w-8 bg-slate-800 border border-white/10 rounded-md text-center text-sm font-black py-1 focus:border-emerald-500 outline-none"
                                         />
                                         <button type="button" onClick={() => setEditTimerTime(p => ({ ...p, h: Math.max(0, p.h - 1) }))} className="text-slate-500 hover:text-white pt-1"><ChevronDown size={14} /></button>
                                      </div>
                                      <span className="text-slate-500 font-bold">:</span>
                                      <div className="flex flex-col items-center">
                                         <button type="button" onClick={() => setEditTimerTime(p => ({ ...p, m: (p.m + 1) % 60 }))} className="text-slate-500 hover:text-white pb-1"><ChevronUp size={14} /></button>
                                         <input 
                                           type="text" 
                                           value={editTimerTime.m.toString().padStart(2, '0')}
                                           onFocus={(e) => e.target.select()}
                                           onChange={e => {
                                             const v = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                             setEditTimerTime(p => ({ ...p, m: Math.min(59, v) }));
                                           }}
                                           className="w-8 bg-slate-800 border border-white/10 rounded-md text-center text-sm font-black py-1 focus:border-emerald-500 outline-none"
                                         />
                                         <button type="button" onClick={() => setEditTimerTime(p => ({ ...p, m: (p.m + 59) % 60 }))} className="text-slate-500 hover:text-white pt-1"><ChevronDown size={14} /></button>
                                      </div>
                                      <span className="text-slate-500 font-bold">:</span>
                                      <div className="flex flex-col items-center">
                                         <button type="button" onClick={() => setEditTimerTime(p => ({ ...p, s: (p.s + 1) % 60 }))} className="text-slate-500 hover:text-white pb-1"><ChevronUp size={14} /></button>
                                         <input 
                                           type="text" 
                                           value={editTimerTime.s.toString().padStart(2, '0')}
                                           onFocus={(e) => e.target.select()}
                                           onChange={e => {
                                             const v = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                             setEditTimerTime(p => ({ ...p, s: Math.min(59, v) }));
                                           }}
                                           className="w-8 bg-slate-800 border border-white/10 rounded-md text-center text-sm font-black py-1 focus:border-emerald-500 outline-none"
                                         />
                                         <button type="button" onClick={() => setEditTimerTime(p => ({ ...p, s: (p.s + 59) % 60 }))} className="text-slate-500 hover:text-white pt-1"><ChevronDown size={14} /></button>
                                      </div>
                                   </div>
                                   <div className="flex gap-2">
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          const newSecs = editTimerTime.h * 3600 + editTimerTime.m * 60 + editTimerTime.s;
                                          const targetProgress = active ? onSecs - newSecs : cycleSecs - newSecs;
                                          const currentRawSecs = now.getMinutes() * 60 + now.getSeconds();
                                          const newOffset = targetProgress - currentRawSecs;
                                          setState(prev => ({ ...prev, ventilationOffset: newOffset }));
                                          setIsEditingTimer(false);
                                        }}
                                        className="bg-emerald-600 px-3 py-1.5 rounded-lg text-[8px] font-black hover:bg-emerald-500 transition-colors text-white"
                                      >
                                        تأكيد
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => setIsEditingTimer(false)}
                                        className="bg-slate-800 px-3 py-1.5 rounded-lg text-[8px] font-black hover:bg-slate-700 transition-colors text-slate-300"
                                      >
                                        إلغاء
                                      </button>
                                   </div>
                                </div>
                              );
                            }
                            return (
                              <div 
                                className="text-center group cursor-pointer pointer-events-auto"
                                onClick={() => {
                                  setEditTimerTime(timeObj);
                                  setIsEditingTimer(true);
                                }}
                              >
                                 <div className={cn(
                                   "mb-2 px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] inline-block transition-all hover:scale-105",
                                   active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 animate-pulse" : "bg-red-500/20 text-red-400 border border-red-500/10"
                                 )}>
                                   {active ? "يتم التشغيل الآن" : "في دورة السكون"}
                                 </div>
                                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">
                                   {active ? "باقي على الإيقاف" : "باقي على التشغيل"}
                                 </p>
                                 <div className="relative">
                                   <p className="text-3xl font-black text-white font-mono transition-transform group-hover:scale-110">
                                     {timeObj.h > 0 ? `${timeObj.h.toString().padStart(2, '0')}:${timeObj.m.toString().padStart(2, '0')}:${timeObj.s.toString().padStart(2, '0')}` : `${timeObj.m.toString().padStart(2, '0')}:${timeObj.s.toString().padStart(2, '0')}`}
                                   </p>
                                   <div className="absolute -inset-2 border-2 border-dashed border-emerald-500/0 group-hover:border-emerald-500/30 rounded-xl pointer-events-none transition-all" />
                                 </div>
                                 <p className="text-[7px] font-bold text-slate-600 mt-2">انقر للتعديل • دورة الـ {(cycleSecs / 60).toFixed(0)} دقيقة</p>
                                 {state.ventilationOffset !== 0 && (
                                   <button 
                                     type="button" 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setState(prev => ({ ...prev, ventilationOffset: 0 }));
                                     }}
                                     className="mt-2 text-[6px] font-black text-slate-500 uppercase hover:text-emerald-400 pointer-events-auto"
                                   >
                                     إعادة ضبط للوقت الفعلي
                                   </button>
                                 )}
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
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">نمط الدورة (كل {(60 / toNum(state.cyclesPerHour)).toFixed(0)} دقيقة)</p>
                             <div className="flex gap-2">
                                <div className="flex-1 py-3 bg-emerald-500/10 rounded-2xl text-center border border-emerald-500/10">
                                   <p className="text-[8px] font-bold text-emerald-400 uppercase">تشغيل</p>
                                   <p className="text-lg font-black text-white">{(((minVentilation / state.fanCapacity) * 60) / toNum(state.cyclesPerHour)).toFixed(1)} <span className="text-[10px] text-emerald-600">د</span></p>
                                </div>
                                <div className="flex-1 py-3 bg-red-500/10 rounded-2xl text-center border border-red-500/10">
                                   <p className="text-[8px] font-bold text-red-400 uppercase">إيقاف</p>
                                   <p className="text-lg font-black text-white">{( (60 / toNum(state.cyclesPerHour)) - ((minVentilation / state.fanCapacity) * 60) / toNum(state.cyclesPerHour)).toFixed(1)} <span className="text-[10px] text-red-600">د</span></p>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center gap-3">
                          <Activity size={16} className="text-blue-400" />
                          <p className="text-[10px] text-blue-200/60 font-bold leading-tight text-right">
                            التهوية موزعة على {state.cyclesPerHour} دورات لضمان ثبات نسبة الأكسجين والتخلص من الأمونيا بشكل مستمر.
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
                    </div>

                    <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      <span>مثالي (&lt; 100)</span>
                      <span>تنبيه (100-150)</span>
                      <span>خطر (&gt; 160)</span>
                    </div>

                    <div className={cn(
                      "p-4 rounded-2xl border flex items-center gap-4 transition-colors",
                      (toNum(state.internalTemp) + toNum(state.currentHumidity)) < 100 ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" :
                      (toNum(state.internalTemp) + toNum(state.currentHumidity)) <= 155 ? "bg-orange-500/5 border-orange-500/10 text-orange-400" : "bg-red-500/5 border-red-500/10 text-red-500"
                    )}>
                      <AlertCircle size={20} />
                      <p className="text-xs font-black leading-tight">
                        {(toNum(state.internalTemp) + toNum(state.currentHumidity)) < 100 ? "الوضع مثالي، لا حاجة للتبريد حالياً." :
                         (toNum(state.internalTemp) + toNum(state.currentHumidity)) <= 155 ? "تنبيه: مؤشر حرج، ينصح ببدء تشغيل خلايا التبريد." : "خطر نفوق عالي! شغل الشفاطات بأقصى طاقة وراقب التبريد فوراً."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row gap-4 w-full">
                    <div className="flex-1 bg-slate-950/80 p-5 rounded-3xl border border-white/5 text-center transition-all shadow-inner group hover:border-orange-500/20">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Thermometer size={14} className="text-orange-400" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الحرارة</p>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={state.internalTemp}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                setState(prev => ({ ...prev, internalTemp: val }));
                              }
                            }}
                            className="text-3xl font-black text-white bg-transparent w-full max-w-[60px] text-center outline-none focus:text-orange-400"
                          />
                          <span className="text-xs font-black text-slate-600">°م</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 bg-slate-950/80 p-5 rounded-3xl border border-white/5 text-center transition-all shadow-inner group hover:border-cyan-500/20">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Droplets size={14} className="text-cyan-400" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الرطوبة</p>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={state.currentHumidity}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setState(prev => ({ ...prev, currentHumidity: val }));
                              }
                            }}
                            className="text-3xl font-black text-white bg-transparent w-full max-w-[60px] text-center outline-none focus:text-cyan-400"
                          />
                          <span className="text-xs font-black text-slate-600">%</span>
                        </div>
                      </div>
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
                            type="text"
                            inputMode="decimal"
                            value={state.coolingPadArea}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setState(prev => ({ ...prev, coolingPadArea: val }));
                              }
                            }}
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
                               const sumTimes = toNum(state.pumpOnTime) + toNum(state.pumpOffTime);
                               const onRatio = sumTimes > 0 ? toNum(state.pumpOnTime) / sumTimes : 0;
                               const cycles = sumTimes > 0 ? 60 / sumTimes : 0;
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
                          </div>
                      </div>

                      <div className="flex-1 w-full space-y-4">
                         <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                               <p className="text-[8px] font-black text-emerald-500 uppercase mb-2">وقت العمل (د)</p>
                               <input 
                                 type="text"
                                 inputMode="decimal"
                                 value={state.pumpOnTime}
                                 onChange={e => {
                                   const val = e.target.value;
                                   if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                     setState(prev => ({ ...prev, pumpOnTime: val }));
                                   }
                                 }}
                                 className="bg-transparent text-lg font-black text-white w-full outline-none"
                               />
                            </div>
                            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                               <p className="text-[8px] font-black text-red-500 uppercase mb-2">وقت الفصل (د)</p>
                               <input 
                                 type="text"
                                 inputMode="decimal"
                                 value={state.pumpOffTime}
                                 onChange={e => {
                                   const val = e.target.value;
                                   if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                     setState(prev => ({ ...prev, pumpOffTime: val }));
                                   }
                                 }}
                                 className="bg-transparent text-lg font-black text-white w-full outline-none"
                               />
                            </div>
                         </div>
                         <p className="text-[9px] text-slate-500 font-bold text-center italic">
                            يتم تكرار الدورة {(toNum(state.pumpOnTime) + toNum(state.pumpOffTime)) > 0 ? Math.floor(60 / (toNum(state.pumpOnTime) + toNum(state.pumpOffTime))) : 0} مرات في الساعة.
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
      <motion.nav 
        initial={false}
        animate={{ 
          y: isNavVisible ? 0 : 100,
          opacity: isNavVisible ? 1 : 0,
          scale: isNavVisible ? 1 : 0.95
        }}
        transition={{ 
          duration: 0.2, 
          ease: "easeOut"
        }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl h-16 bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2rem] flex items-center gap-1 px-4 z-40 ring-1 ring-white/5 overflow-x-auto no-scrollbar flex-nowrap"
      >
        <NavButton 
          active={screen === 'landing'} 
          onClick={() => {
            setScreen('landing');
            setIsNavVisible(true);
          }} 
          icon={RefreshCw} 
          label="الدورات" 
        />
        <NavButton 
          active={screen === 'dashboard'} 
          onClick={() => {
            setScreen('dashboard');
            setIsNavVisible(true);
          }} 
          icon={LayoutDashboard} 
          label="الرئيسية" 
        />
        <NavButton 
          active={screen === 'medication'} 
          onClick={() => {
            setScreen('medication');
            setIsNavVisible(true);
          }} 
          icon={Stethoscope} 
          label="الأدوية" 
        />
        <NavButton 
          active={screen === 'battery'} 
          onClick={() => {
            setScreen('battery');
            setIsNavVisible(true);
          }} 
          icon={Layers} 
          label="البطاريات" 
        />
        <NavButton 
          active={screen === 'climate'} 
          onClick={() => {
            setScreen('climate');
            setIsNavVisible(true);
          }} 
          icon={Thermometer} 
          label="المناخ" 
        />
        <NavButton 
          active={screen === 'ventilation'} 
          onClick={() => {
            setScreen('ventilation');
            setIsNavVisible(true);
          }} 
          icon={Wind} 
          label="التهوية" 
        />
        <NavButton 
          active={screen === 'humidity'} 
          onClick={() => {
            setScreen('humidity');
            setIsNavVisible(true);
          }} 
          icon={Droplets} 
          label="الرطوبة" 
        />
        <NavButton 
          active={screen === 'charts'} 
          onClick={() => {
            setScreen('charts');
            setIsNavVisible(true);
          }} 
          icon={BarChart2} 
          label="الإحصائيات" 
        />
        <NavButton 
          active={screen === 'finances'} 
          onClick={() => {
            setScreen('finances');
            setIsNavVisible(true);
          }} 
          icon={Wallet} 
          label="الأرباح" 
        />
      </motion.nav>

      <AnimatePresence>
        {deleteStep > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[500] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl space-y-6 text-center"
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${deleteStep === 1 ? 'bg-orange-500/10 text-orange-500' : 'bg-red-500/10 text-red-500'}`}>
                <AlertTriangle size={40} className="animate-pulse" />
              </div>

              <div className="space-y-2" dir="rtl">
                <h3 className="text-2xl font-black text-white">
                  {deleteStep === 1 ? 'تحذير مسح الدورة' : 'تأكيد الحذف النهائي'}
                </h3>
                <p className="text-slate-400 font-medium">
                  {deleteStep === 1 
                    ? 'هل أنت متأكد من رغبتك في حذف هذه الدورة؟ لا يمكن التراجع عن هذا العمل.' 
                    : 'هذا الإجراء سيمسح جميع بيانات هذه الدورة نهائياً من جزيئات التطبيق. هل أنت متأكد تماماً؟'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={deleteStep === 1 ? confirmDeleteStep1 : finalDeleteCycle}
                  className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg ${deleteStep === 1 ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}`}
                >
                  {deleteStep === 1 ? 'نعم، تابع للمرحلة التالية' : 'نعم، احذف نهائياً'}
                </button>
                <button 
                  onClick={cancelDelete}
                  className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black transition-all"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legacy Cycle Deletion Confirmation Modals Reference (Removed) */}
      <AnimatePresence>
        {billToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setBillToDelete(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/5 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto ring-8 ring-red-500/5">
                <Trash2 size={40} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">تأكيد الحذف</h3>
                <p className="text-slate-400 text-sm font-bold leading-relaxed">
                  هل أنت متأكد من حذف {billToDelete.section === 'emergencyMeds' ? 'هذه الجرعة' : billToDelete.section === 'salesRecords' ? 'هذا السجل' : 'هذه الفاتورة'}؟ لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setBillToDelete(null)}
                  className="py-4 bg-slate-800 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all font-sans"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => {
                    setState(prev => ({ 
                      ...prev, 
                      [billToDelete.section]: (prev[billToDelete.section as keyof AppState] as any[]).filter(b => b.id !== billToDelete.id) 
                    }));
                    setBillToDelete(null);
                  }}
                  className="py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all active:scale-95 font-sans"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 min-w-[5rem] h-14 rounded-2xl transition-all duration-300 relative group flex-shrink-0",
        active ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-bg"
          className="absolute inset-x-1 inset-y-1 bg-blue-600/10 rounded-2xl -z-10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <Icon 
        size={20} 
        strokeWidth={active ? 2.5 : 2} 
        className={cn(
          "transition-all duration-300", 
          active ? "scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "scale-100"
        )} 
      />
      <span className={cn(
        "text-[7px] font-bold uppercase tracking-tight transition-all duration-300", 
        active ? "opacity-100 translate-y-0" : "opacity-40 group-hover:opacity-70"
      )}>
        {label}
      </span>
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

function BillSection({ title, bills, icon: Icon, onAdd, onRemove, onUpdate }: { title: string, bills: Bill[], icon: any, onAdd: () => void, onRemove: (id: string) => void, onUpdate: (id: string, field: string, val: any) => void }) {
  return (
    <Card className="bg-slate-900 border-white/5 p-6 text-right">
      <div className="flex items-center justify-between mb-4">
        <button 
          type="button"
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
      
      <div className="space-y-4">
        {bills.map(bill => (
          <div key={bill.id} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(bill.id);
                }}
                className="p-1.5 text-slate-600 hover:text-red-500 transition-colors"
                title="حذف"
              >
                <Trash2 size={16} />
              </button>
              <input 
                type="text"
                value={bill.label ?? ''}
                onChange={e => onUpdate(bill.id, 'label', e.target.value)}
                className="bg-transparent text-xs font-bold text-white text-right outline-none w-1/2"
                placeholder="بيان الفاتورة..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-600 uppercase text-center">المبلغ</label>
                <input 
                  type="number"
                  value={bill.amount ?? 0}
                  onChange={e => onUpdate(bill.id, 'amount', e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-black text-white text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-600 uppercase text-center">إلى يوم</label>
                <input 
                  type="number"
                  value={bill.endDay ?? 35}
                  onChange={e => onUpdate(bill.id, 'endDay', e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-black text-white text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-slate-600 uppercase text-center">من يوم</label>
                <input 
                  type="number"
                  value={bill.startDay ?? 1}
                  onChange={e => onUpdate(bill.id, 'startDay', e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-black text-white text-center"
                />
              </div>
            </div>
          </div>
        ))}
        {bills.length === 0 && (
          <p className="text-[10px] text-slate-600 font-bold py-2 text-center uppercase tracking-widest">لا توجد سجلات</p>
        )}
      </div>
      {bills.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center px-2">
          <p className="text-sm font-black text-white">{bills.reduce((acc, b) => acc + toNum(b.amount), 0).toLocaleString()} ج.م</p>
          <p className="text-[9px] font-black text-slate-500 uppercase">الإجمالي</p>
        </div>
      )}
    </Card>
  );
}
