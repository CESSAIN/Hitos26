
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { Flight, Agent } from '../types';
import { MILESTONES } from '../constants';
import { analyzeFlightOperation } from '../src/services/aiService';

interface HitosGanttProps {
  flights: Flight[];
  agents: Agent[];
  assignments: Record<string, Record<string, string>>;
  selectedFlightId: string | null;
  setSelectedFlightId: (id: string | null) => void;
}

const TASK_LABELS = ['Sobre el ala 1', 'Sobre el ala 2', 'Ventas', 'Arribos', 'Bajo el ala (COT)', 'Bajo el ala (Arribo)', 'Supervisor Rampa'];

const SOBRE_EL_ALA_KEYS = [
  'IN', 'APERTURA PUERTA', 'DESEMBARQUE', 'FIN DESEMBARQUE', 
  'IN LIMPIEZA', 'FIN LIMPIEZA', 'INICIO EMBARQUE', 'FIN EMBARQUE', 'CIERRE PUERTA'
];

const BAJO_EL_ALA_KEYS = [
  'CALZA REAL', 'APERTURA BODEGAS', 'INICIO FUEL', 'FIN FUEL', 
  'INICIO CARGUIO', 'FIN CARGUIO', 'BÚSQUEDA EQUIPAJE', 
  'FIN BÚSQUEDA EQUIPAJE', 'RAMP CLEARENCE', 'CIERRE BODEGA', 'PUSH BACK'
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data.active) return null;
    return (
      <div className="bg-[#1b2e91] text-white px-4 py-2 rounded-xl shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-100 origin-center">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{data.label}</p>
        <p className="text-sm font-black tracking-tighter">{data.time}</p>
      </div>
    );
  }
  return null;
};

const HitosGantt: React.FC<HitosGanttProps> = ({ flights, agents, assignments, selectedFlightId, setSelectedFlightId }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiAnalysis, setAiAnalysis] = useState<{ [flightId: string]: { analysis: string; isPositive: boolean } }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analyzedFlightsRef = useRef<Set<string>>(new Set());

  // Auto-select first flight if none selected
  useEffect(() => {
    if (!selectedFlightId && flights.length > 0) {
      setSelectedFlightId(flights[0].id);
    }
  }, [flights, selectedFlightId, setSelectedFlightId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const flight = flights.find(f => f.id === selectedFlightId);

  // AI Analysis Trigger
  useEffect(() => {
    if (flight && flight.milestones['PUSH BACK'] && !analyzedFlightsRef.current.has(flight.id)) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
          const result = await analyzeFlightOperation(flight);
          setAiAnalysis(prev => ({ ...prev, [flight.id]: result }));
          analyzedFlightsRef.current.add(flight.id);
        } catch (error) {
          console.error("AI Trigger Error:", error);
        } finally {
          setIsAnalyzing(false);
        }
      };
      runAnalysis();
    }
  }, [flight?.milestones['PUSH BACK'], flight?.id]);

  const getMinutesFromTime = (timeStr: string | undefined | null) => {
    if (!timeStr || !timeStr.includes(':')) return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  const calculateDuration = (startKey: string, endKey: string) => {
    if (!flight) return null;
    const start = getMinutesFromTime(flight.milestones[startKey]);
    const end = getMinutesFromTime(flight.milestones[endKey]);
    if (start === null || end === null) return null;
    let diff = end - start;
    if (diff < 0) diff += 1440;
    return diff;
  };

  const generateRingData = (keysToInclude: string[]) => {
    if (!flight) return [];
    
    const inTimeStr = flight.milestones['IN'];
    const etdRealStr = flight.etdReal;
    
    if (!inTimeStr || !etdRealStr) {
      return Array.from({ length: 60 }, (_, i) => ({ value: 1, color: '#f1f5f9', active: false, label: '', time: '' }));
    }
    
    const inMinutes = getMinutesFromTime(inTimeStr);
    const etdRealMinutes = getMinutesFromTime(etdRealStr);
    const currentTotalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    if (inMinutes === null || etdRealMinutes === null) {
      return Array.from({ length: 60 }, (_, i) => ({ value: 1, color: '#f1f5f9', active: false, label: '', time: '' }));
    }

    let losaTotalMins = etdRealMinutes - inMinutes;
    if (losaTotalMins < 0) losaTotalMins += 1440;
    if (losaTotalMins === 0) losaTotalMins = 60;

    const slots = Array.from({ length: 60 }, (_, i) => ({
      minute: i,
      color: '#f8fafc', 
      active: false,
      label: '',
      time: ''
    }));

    const normalizeToSlotFromMinutes = (mins: number) => {
      let diff = mins - inMinutes;
      if (diff < 0) diff += 1440;
      const slot = (diff / losaTotalMins) * 60;
      return Math.min(59, Math.max(0, Math.floor(slot)));
    };

    const normalizeToSlot = (realTimeStr: string) => {
      const realMins = getMinutesFromTime(realTimeStr);
      if (realMins === null) return null;
      return normalizeToSlotFromMinutes(realMins);
    };

    const relevantMilestones = MILESTONES.filter(m => keysToInclude.includes(m.key) && !m.isTheoretical);
    const processes = Array.from(new Set(relevantMilestones.filter(m => m.process).map(m => m.process!)));

    processes.forEach(procId => {
      const startMilestone = MILESTONES.find(m => m.process === procId && m.boundary === 'start' && !m.isTheoretical);
      const endMilestone = MILESTONES.find(m => m.process === procId && m.boundary === 'end' && !m.isTheoretical);
      
      const startTimeStr = startMilestone ? flight.milestones[startMilestone.key] : null;
      const endTimeStr = endMilestone ? flight.milestones[endMilestone.key] : null;

      if (startTimeStr) {
        const startSlot = normalizeToSlot(startTimeStr);
        let endSlot: number | null = null;
        let timeLabel = startTimeStr;

        if (endTimeStr) {
          endSlot = normalizeToSlot(endTimeStr);
          timeLabel = `${startTimeStr} - ${endTimeStr}`;
        } else {
          const nowSlot = normalizeToSlotFromMinutes(currentTotalMinutes);
          if (nowSlot >= (startSlot || 0)) {
            endSlot = nowSlot;
            timeLabel = `${startTimeStr} - EN CURSO`;
          }
        }
        
        if (startSlot !== null && endSlot !== null) {
          const color = startMilestone?.color || '#3b82f6';
          for (let s = startSlot; s <= endSlot; s++) {
            slots[s].color = color;
            slots[s].active = true;
            slots[s].label = `${startMilestone?.label.replace('Inicio ', '')}`;
            slots[s].time = timeLabel;
          }
        }
      }
    });

    relevantMilestones.forEach(m => {
      if (!m.process && flight.milestones[m.key] && m.key !== 'IN') {
        const slotIdx = normalizeToSlot(flight.milestones[m.key]);
        if (slotIdx !== null) {
          slots[slotIdx].color = m.color;
          slots[slotIdx].active = true;
          slots[slotIdx].label = m.label;
          slots[slotIdx].time = flight.milestones[m.key];
        }
      }
    });

    return slots.map(s => ({ value: 1, ...s }));
  };

  const sobreAlaData = useMemo(() => generateRingData(SOBRE_EL_ALA_KEYS), [flight, currentTime.getHours(), currentTime.getMinutes()]);
  const bajoAlaData = useMemo(() => generateRingData(BAJO_EL_ALA_KEYS), [flight, currentTime.getHours(), currentTime.getMinutes()]);

  const processTimes = useMemo(() => {
    return [
      { label: 'Tiempo de Desembarque', value: calculateDuration('DESEMBARQUE', 'FIN DESEMBARQUE'), icon: 'fa-person-walking-arrow-right', color: '#3b82f6' },
      { label: 'Tiempo de Limpieza', value: calculateDuration('IN LIMPIEZA', 'FIN LIMPIEZA'), icon: 'fa-broom', color: '#8b5cf6' },
      { label: 'Carguío de Fuel', value: calculateDuration('INICIO FUEL', 'FIN FUEL'), icon: 'fa-gas-pump', color: '#14b8a6' },
      { label: 'Tiempo de Embarque', value: calculateDuration('INICIO EMBARQUE', 'FIN EMBARQUE'), icon: 'fa-users-line', color: '#ec4899' },
      { label: 'Tiempo de TA (Push-IN)', value: calculateDuration('IN', 'PUSH BACK'), icon: 'fa-plane-departure', color: '#1b2e91' }
    ];
  }, [flight]);

  const losaTotalStr = useMemo(() => {
    if (!flight) return '--:--';
    const inMinutes = getMinutesFromTime(flight.milestones['IN']);
    const etdRealMinutes = getMinutesFromTime(flight.etdReal);
    if (inMinutes === null || etdRealMinutes === null) return '--:--';
    let diff = etdRealMinutes - inMinutes;
    if (diff < 0) diff += 1440;
    const h = Math.floor(diff / 60).toString().padStart(2, '0');
    const m = (diff % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }, [flight]);

  const countdown = useMemo(() => {
    if (!flight || !flight.milestones['IN'] || !flight.etdReal) {
      return { time: '--:--:--', color: 'text-[#1b2e91]', bg: 'bg-transparent', isElapsed: false };
    }
    
    const [etdH, etdM] = flight.etdReal.split(':').map(Number);
    const targetDate = new Date(currentTime);
    targetDate.setHours(etdH, etdM, 0, 0);
    
    const pushBackDone = !!flight.milestones['PUSH BACK'];
    let diffMs = targetDate.getTime() - currentTime.getTime();
    
    if (diffMs < -43200000) { 
      targetDate.setDate(targetDate.getDate() + 1); 
      diffMs = targetDate.getTime() - currentTime.getTime(); 
    }

    if (pushBackDone) {
      return { time: '00:00:00', color: 'text-[#10b981]', bg: 'bg-transparent', isElapsed: false };
    }

    const isElapsed = diffMs <= 0;
    const absDiffMs = Math.abs(diffMs);
    
    if (isElapsed && absDiffMs > 18000000) {
       return { time: '05:00:00', color: 'text-[#eb0045]', bg: 'bg-red-50', isElapsed: true };
    }

    const totalSeconds = Math.floor(absDiffMs / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;

    let color = 'text-[#1b2e91]';
    let bg = 'bg-transparent';

    if (isElapsed) {
      color = 'text-[#eb0045]';
      bg = 'bg-red-50';
    } else if (totalSeconds <= 180) {
      color = 'text-[#1b2e91]';
      bg = 'bg-yellow-100';
    }

    return { time: timeStr, color, bg, isElapsed };
  }, [flight, currentTime]);

  const completionPercentage = flight 
    ? Math.round((Object.keys(flight.milestones).filter(k => !k.includes('TEORICO')).length / MILESTONES.filter(m => !m.isTheoretical).length) * 100) 
    : 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 animate-fade-in px-2 sm:px-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="w-full lg:w-auto">
           <h2 className="text-3xl sm:text-4xl font-black text-[#1b2e91] tracking-tighter uppercase leading-none">Monitor GANT</h2>
           <p className="text-[10px] sm:text-xs font-black text-slate-400 mt-2 uppercase tracking-widest">Vista concéntrica de hitos reales ({losaTotalStr})</p>
           <div className="mt-4">
             <select 
               value={selectedFlightId || ''}
               onChange={(e) => setSelectedFlightId(e.target.value)}
               className="w-full lg:w-auto bg-white border-2 border-slate-100 rounded-2xl px-4 sm:px-6 py-2 sm:py-3 font-black text-xs sm:text-sm text-[#1b2e91] shadow-sm focus:ring-0 focus:border-[#eb0045]"
             >
               {flights.map(f => <option key={f.id} value={f.id}>{f.vueloArribo}/{f.vueloSalida} - {f.registration}</option>)}
             </select>
           </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-slate-50 flex-1 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-2 h-full bg-[#1b2e91] opacity-20 group-hover:opacity-100 transition-opacity"></div>
           <div className="flex items-center space-x-3 mb-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-[#1b2e91] flex items-center justify-center text-xs sm:text-sm">
                 <i className="fa-solid fa-users-gear"></i>
              </div>
              <h3 className="text-[9px] sm:text-[10px] font-black text-[#1b2e91] uppercase tracking-widest">Agentes en la Operación</h3>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3">
              {TASK_LABELS.map((label, idx) => {
                const agentId = selectedFlightId ? assignments[selectedFlightId]?.[idx] : undefined;
                const agent = agents.find(a => a.id === agentId);
                return (
                  <div key={idx} className="flex flex-col border-l-2 border-slate-50 pl-2">
                    <span className="text-[6px] sm:text-[7px] font-black text-slate-400 uppercase tracking-widest truncate mb-0.5">{label}</span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#1b2e91] truncate">
                      {agent ? `${agent.name} ${agent.lastName}` : '--'}
                    </span>
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {flight && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* RELOJ A LA IZQUIERDA */}
          <div className={`bg-white p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl border border-slate-50 flex flex-col items-center relative overflow-hidden transition-colors duration-500 ${countdown.bg}`}>
            <div className={`absolute top-0 left-0 w-full h-2 ${countdown.isElapsed ? 'bg-[#eb0045]' : 'bg-[#1b2e91]'}`}></div>
            <div className="flex flex-col items-center mb-6 sm:mb-10">
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {countdown.isElapsed ? 'Tiempo de Demora' : 'Tiempo Restante para Salida'}
              </p>
              <div className="flex items-center space-x-4 sm:space-x-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <span className="text-4xl sm:text-6xl font-black text-[#eb0045] mr-2">{flight.vueloSalida}</span>
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${countdown.isElapsed ? 'bg-[#eb0045] animate-pulse' : 'bg-[#10b981]'}`}></div>
                  <p className={`text-3xl sm:text-5xl font-black tracking-tighter tabular-nums ${countdown.color}`}>
                    {countdown.time}
                  </p>
                </div>

                {/* Sirena de Alerta de Equipaje */}
                {flight.milestones['BÚSQUEDA EQUIPAJE'] && (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {!flight.milestones['FIN BÚSQUEDA EQUIPAJE'] && (
                        <div className="absolute -inset-1 sm:-inset-2 bg-red-500/30 rounded-full animate-ping"></div>
                      )}
                      <div className={`relative w-8 h-8 sm:w-12 sm:h-12 rounded-t-xl sm:rounded-t-2xl border-b-2 sm:border-b-4 border-slate-900 flex items-center justify-center shadow-lg overflow-hidden ${
                        flight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent to-white/20"></div>
                        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full blur-[1px]"></div>
                        <i className={`fa-solid fa-light-emergency text-white text-sm sm:text-lg ${
                          !flight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'animate-pulse' : ''
                        }`}></i>
                      </div>
                    </div>
                    <span className={`text-[6px] sm:text-[7px] font-black uppercase tracking-widest mt-1 ${
                      flight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'text-green-600' : 'text-red-600 animate-pulse'
                    }`}>
                      {flight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'Bags OK' : 'Bags Warning'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative w-full aspect-square max-w-[350px] sm:max-w-[600px] lg:max-w-[700px] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                  <Pie
                    data={sobreAlaData}
                    cx="50%" cy="50%"
                    innerRadius="75%"
                    outerRadius="95%"
                    paddingAngle={1}
                    dataKey="value"
                    startAngle={90} endAngle={-270}
                    isAnimationActive={false}
                  >
                    {sobreAlaData.map((entry, index) => (
                      <Cell key={`sobre-${index}`} fill={entry.color} stroke={entry.active ? 'none' : '#f8fafc'} strokeWidth={1} />
                    ))}
                  </Pie>
                  <Pie
                    data={bajoAlaData}
                    cx="50%" cy="50%"
                    innerRadius="45%"
                    outerRadius="65%"
                    paddingAngle={1}
                    dataKey="value"
                    startAngle={90} endAngle={-270}
                    isAnimationActive={false}
                  >
                    {bajoAlaData.map((entry, index) => (
                      <Cell key={`bajo-${index}`} fill={entry.color} stroke={entry.active ? 'none' : '#f8fafc'} strokeWidth={1} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-5xl sm:text-7xl font-black text-[#1b2e91] tracking-tighter tabular-nums">{completionPercentage}%</span>
                <span className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Status Global</span>
              </div>

              {/* Etiquetas de los anillos */}
              <div className="absolute -top-2 sm:-top-4 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] pointer-events-none bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm">Sobre el Ala</div>
              <div className="absolute top-[32%] sm:top-[32%] left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] pointer-events-none bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm">Bajo el Ala</div>
            </div>

            {/* AI Analysis Box */}
            <div className="w-full mt-8">
              <div className={`min-h-[200px] rounded-[2rem] p-6 border transition-all duration-500 ${
                !flight?.milestones['PUSH BACK'] 
                  ? 'bg-white border-slate-100 border-dashed' 
                  : isAnalyzing 
                    ? 'bg-slate-50 border-blue-200 animate-pulse'
                    : (selectedFlightId && aiAnalysis[selectedFlightId]?.isPositive)
                      ? 'bg-emerald-50/50 border-emerald-100' 
                      : 'bg-rose-50/50 border-rose-100'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-[#1b2e91] uppercase tracking-widest flex items-center">
                    <i className={`fa-solid fa-wand-magic-sparkles mr-2 ${isAnalyzing ? 'animate-spin' : ''}`}></i>
                    Análisis IA del vuelo
                  </h4>
                  {flight?.milestones['PUSH BACK'] && !isAnalyzing && selectedFlightId && aiAnalysis[selectedFlightId] && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      aiAnalysis[selectedFlightId]?.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {aiAnalysis[selectedFlightId]?.isPositive ? 'Eficiente' : 'Crítico'}
                    </span>
                  )}
                </div>

                {!flight?.milestones['PUSH BACK'] ? (
                  <div className="flex flex-col items-center justify-center h-full py-10">
                    {/* Empty state as requested */}
                  </div>
                ) : isAnalyzing ? (
                  <div className="space-y-3">
                    <div className="h-3 bg-slate-200 rounded-full w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded-full w-full"></div>
                    <div className="h-3 bg-slate-200 rounded-full w-5/6"></div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest animate-pulse mt-4">La IA está analizando la operación...</p>
                  </div>
                ) : (selectedFlightId && aiAnalysis[selectedFlightId]) ? (
                  <div className="prose prose-sm max-w-none text-[#1b2e91]">
                    <div className="text-xs font-medium leading-relaxed ai-analysis-content">
                      <ReactMarkdown>{aiAnalysis[selectedFlightId].analysis}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No hay análisis disponible.</p>
                )}
              </div>
            </div>
          </div>

          {/* TIEMPO DE PROCESOS A LA DERECHA */}
          <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-xl border border-slate-50">
            <h3 className="text-lg sm:text-xl font-black mb-6 sm:mb-10 text-[#1b2e91] uppercase tracking-tight flex items-center">
              <i className="fa-solid fa-clock-rotate-left mr-3 text-[#eb0045]"></i>
              Tiempos de Proceso (Real)
            </h3>
            
            <div className="space-y-4 sm:space-y-6">
              {processTimes.map((proc, idx) => (
                <div key={idx} className="bg-slate-50/50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-3 sm:space-x-5">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: `${proc.color}15`, color: proc.color }}>
                      <i className={`fa-solid ${proc.icon} text-base sm:text-xl`}></i>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black text-[#1b2e91] uppercase tracking-tight mb-0.5">{proc.label}</p>
                      <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 tracking-widest">Cálculo en base a hitos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {proc.value !== null ? (
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl sm:text-4xl font-black text-[#1b2e91] tracking-tighter">{proc.value}</span>
                        <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase">min</span>
                      </div>
                    ) : (
                      <span className="text-lg sm:text-2xl font-black text-slate-200 uppercase tracking-tighter">--:--</span>
                    )}
                  </div>
                </div>
              ))}

              <div className="mt-6 sm:mt-10 p-6 sm:p-8 bg-[#1b2e91] rounded-[2rem] sm:rounded-[2.5rem] text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:rotate-12 transition-transform">
                   <i className="fa-solid fa-stopwatch text-[60px] sm:text-[100px]"></i>
                 </div>
                 <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-2 sm:mb-4">Eficiencia Operativa</h4>
                 <div className="flex items-baseline space-x-2">
                    <span className="text-3xl sm:text-5xl font-black tracking-tighter">{losaTotalStr}</span>
                    <span className="text-xs font-bold uppercase text-white/40">Total Losa</span>
                 </div>
                 <p className="mt-3 sm:mt-4 text-[9px] sm:text-[11px] font-bold text-white/60 leading-relaxed uppercase tracking-widest">Turnaround monitoreado en tiempo real.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HitosGantt;
