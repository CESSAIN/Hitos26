
import React, { useState, useMemo } from 'react';
import { Flight, Agent } from '../types';
import { MILESTONES, COUNTRIES } from '../constants';

interface OperarVueloProps {
  flights: Flight[];
  user: Agent;
  agents: Agent[];
  assignments: Record<string, Record<string, string>>;
  contacts: Record<string, Record<string, string>>;
  setContacts: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  onUpdateMilestone: (flightId: string, milestoneKey: string, time: string) => void;
  isRefreshingTheoretics?: boolean;
  selectedFlightId: string | null;
  setSelectedFlightId: (id: string | null) => void;
}

const SPAX_KEYS = [
  'APERTURA PUERTA', 'DESEMBARQUE', 'FIN DESEMBARQUE', 
  'IN LIMPIEZA', 'FIN LIMPIEZA', 'INICIO EMBARQUE', 'FIN EMBARQUE', 'CIERRE PUERTA'
];

const RAMPA_KEYS = [
  'IN', 'APERTURA BODEGAS', 'INICIO FUEL', 'FIN FUEL', 
  'INICIO CARGUIO', 'FIN CARGUIO', 'RAMP CLEARENCE', 'CIERRE BODEGA', 'PUSH BACK'
];

const OperarVuelo: React.FC<OperarVueloProps> = ({ 
  flights, 
  user, 
  agents,
  assignments,
  contacts,
  setContacts,
  onUpdateMilestone, 
  isRefreshingTheoretics = false,
  selectedFlightId,
  setSelectedFlightId
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'SPAX' | 'RAMPA'>('RAMPA');
  const [syncingKeys, setSyncingKeys] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [manualTime, setManualTime] = useState('');
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [editingHeaderField, setEditingHeaderField] = useState<string | null>(null);
  const [headerManualValue, setHeaderManualValue] = useState('');

  const rampaContacts = ['Rampa 1', 'Rampa 2', 'Rampa 3', 'Rampa 4', 'Rampa 5'];
  const spaxContacts = Array.from({ length: 10 }, (_, i) => `Embarque ${i + 1}`);

  const currentFlight = useMemo(() => 
    flights.find(f => f.id === selectedFlightId) || null
  , [flights, selectedFlightId]);

  const formatTimeHHMM = (timeStr: string | undefined | null) => {
    if (!timeStr || timeStr === '--:--' || timeStr === '') return '--:--';
    if (timeStr === 'SIN DATOS') return 'SIN DATOS';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const hh = parts[0].toString().padStart(2, '0');
      const mm = parts[1].toString().padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return timeStr;
  };

  const isLate = (real: string | undefined, theoretical: string | undefined) => {
    if (!real || !theoretical || real === '--:--' || theoretical === '--:--' || theoretical === 'SIN DATOS') return false;
    const toMinutes = (time: string) => {
      const parts = time.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return 0;
      return h * 60 + m;
    };
    return toMinutes(real) > toMinutes(theoretical);
  };

  const calculateLosaReal = (inBlock: string | undefined, etdReal: string | undefined | null) => {
    if (!inBlock || !etdReal || inBlock === '--:--' || etdReal === '--:--' || inBlock === 'SIN DATOS') return '--:--';
    try {
      const [hIn, mIn] = inBlock.split(':').map(Number);
      const [hOut, mOut] = etdReal.split(':').map(Number);
      if (isNaN(hIn) || isNaN(mIn) || isNaN(hOut) || isNaN(mOut)) return '--:--';
      let diff = (hOut * 60 + mOut) - (hIn * 60 + mIn);
      if (diff < 0) diff += 1440; 
      const h = Math.floor(diff / 60).toString().padStart(2, '0');
      const m = (diff % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    } catch (e) { return '--:--'; }
  };

  const handleMilestoneClick = async (key: string) => {
    if (!selectedFlightId) return;
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    
    setSyncingKeys(prev => new Set(prev).add(key));
    onUpdateMilestone(selectedFlightId, key, timeStr);
    
    setTimeout(() => {
      setSyncingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 1500);
  };

  const handleManualSave = (key: string) => {
    if (!selectedFlightId || !manualTime) return;
    onUpdateMilestone(selectedFlightId, key, manualTime);
    setEditingKey(null);
    setManualTime('');
  };

  const handleSelectContact = (contact: string) => {
    if (!selectedFlightId) return;
    setContacts(prev => ({
      ...prev,
      [selectedFlightId]: {
        ...(prev[selectedFlightId] || {}),
        [activeSubTab]: contact
      }
    }));
    setShowContactPopup(false);
  };

  const handleHeaderSave = () => {
    if (!selectedFlightId || !editingHeaderField) return;
    const milestoneKey = editingHeaderField === 'ETD' ? 'ETD REAL' : editingHeaderField;
    onUpdateMilestone(selectedFlightId, milestoneKey, headerManualValue);
    setEditingHeaderField(null);
  };

  const currentCategoryKeys = activeSubTab === 'SPAX' ? SPAX_KEYS : RAMPA_KEYS;
  const filteredMilestones = MILESTONES.filter(m => 
    currentCategoryKeys.includes(m.key) && 
    !('isTheoretical' in m && m.isTheoretical) && 
    (user.role === 1 || m.roles.includes(user.function))
  );

  if (currentFlight) {
    const posValue = currentFlight.milestones['POS'] || currentFlight.position;
    const gateValue = currentFlight.milestones['GATE'] || currentFlight.gate;
    const etdRealValue = currentFlight.milestones['ETD REAL'] || currentFlight.etdReal;
    const losaRealValue = calculateLosaReal(currentFlight.inBlock || currentFlight.milestones['IN'], etdRealValue);

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-24 px-2 sm:px-4">
        {/* Detail Header */}
        <div className="bg-[#1b2e91] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-[#00000020]">
          <button 
            onClick={() => setSelectedFlightId(null)} 
            className="absolute top-4 left-4 sm:top-8 sm:left-8 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-20"
          >
            <i className="fa-solid fa-chevron-left text-[10px] sm:text-xs"></i>
          </button>
          
          <div className="text-center relative z-10 mt-4 sm:mt-0">
             <div className="mb-4 sm:mb-6">
                <span className="text-[9px] sm:text-[11px] font-black text-white/50 uppercase tracking-[0.2em] block mb-1">Aeronave</span>
                <span className="text-xs sm:text-sm font-black text-white">{currentFlight.type} <span className="text-[#ffd500]">[{currentFlight.registration}]</span></span>
             </div>

             <div className="flex justify-center items-center space-x-4 sm:space-x-12 mb-6 sm:mb-8">
                <div className="text-right flex-1">
                  <h1 className="text-2xl sm:text-5xl font-black tracking-tighter">{currentFlight.origin}</h1>
                </div>
                <div className="flex flex-col items-center">
                   <div className="w-16 sm:w-32 h-[1px] bg-white/20 relative">
                     <i className="fa-solid fa-plane absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-sm sm:text-lg"></i>
                   </div>
                   <div className="mt-2 sm:mt-3 bg-[#eb0045] px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg">
                     <span className="text-[10px] sm:text-xs font-black tracking-tight">{currentFlight.vueloSalida || currentFlight.number}</span>
                   </div>
                </div>
                <div className="text-left flex-1">
                  <h1 className="text-2xl sm:text-5xl font-black tracking-tighter">{currentFlight.destination}</h1>
                </div>
             </div>

              <div className="bg-black/20 rounded-2xl py-3 px-2 sm:px-8 inline-flex items-center border border-white/5 backdrop-blur-sm w-full sm:w-auto overflow-x-auto">
                <div className="flex items-center justify-between sm:justify-center w-full space-x-2 sm:space-x-8 min-w-max">
                   <div className="flex flex-col items-center group/item relative">
                      <span className="text-[7px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">POS</span>
                      {editingHeaderField === 'POS' ? (
                        <div className="flex items-center space-x-1">
                          <input 
                            autoFocus
                            className="bg-white/10 border border-white/20 rounded px-1 text-[10px] sm:text-xs w-10 sm:w-12 text-center outline-none"
                            value={headerManualValue}
                            onChange={(e) => setHeaderManualValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleHeaderSave()}
                          />
                          <button onClick={handleHeaderSave} className="text-[10px] text-green-400"><i className="fa-solid fa-check"></i></button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm sm:text-xl font-black text-white">{posValue}</span>
                          <button 
                            onClick={() => { setEditingHeaderField('POS'); setHeaderManualValue(posValue); }}
                            className="opacity-0 group-hover/item:opacity-100 text-[10px] text-white/30 hover:text-white transition-all"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                        </div>
                      )}
                   </div>
                   <div className="w-[1px] h-6 sm:h-10 bg-white/10"></div>
                   <div className="flex flex-col items-center group/item relative">
                      <span className="text-[7px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">GATE</span>
                      {editingHeaderField === 'GATE' ? (
                        <div className="flex items-center space-x-1">
                          <input 
                            autoFocus
                            className="bg-white/10 border border-white/20 rounded px-1 text-[10px] sm:text-xs w-10 sm:w-12 text-center outline-none"
                            value={headerManualValue}
                            onChange={(e) => setHeaderManualValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleHeaderSave()}
                          />
                          <button onClick={handleHeaderSave} className="text-[10px] text-green-400"><i className="fa-solid fa-check"></i></button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm sm:text-xl font-black text-white">{gateValue}</span>
                          <button 
                            onClick={() => { setEditingHeaderField('GATE'); setHeaderManualValue(gateValue); }}
                            className="opacity-0 group-hover/item:opacity-100 text-[10px] text-white/30 hover:text-white transition-all"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                        </div>
                      )}
                   </div>
                   <div className="w-[1px] h-6 sm:h-10 bg-white/10"></div>
                   <div className="flex flex-col items-center">
                      <span className="text-[7px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">TAT</span>
                      <span className="text-sm sm:text-xl font-black text-white">{formatTimeHHMM(currentFlight.tatTeorico)}</span>
                   </div>
                   <div className="w-[1px] h-6 sm:h-10 bg-white/10"></div>
                   <div className="flex flex-col items-center group/item relative">
                      <span className="text-[7px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">ETD</span>
                      {editingHeaderField === 'ETD' ? (
                        <div className="flex items-center space-x-1">
                          <input 
                            autoFocus
                            type="time"
                            className="bg-white/10 border border-white/20 rounded px-1 text-[10px] sm:text-xs w-16 sm:w-20 text-center outline-none"
                            value={headerManualValue}
                            onChange={(e) => setHeaderManualValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleHeaderSave()}
                          />
                          <button onClick={handleHeaderSave} className="text-[10px] text-green-400"><i className="fa-solid fa-check"></i></button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm sm:text-xl font-black text-[#ffd500]">{formatTimeHHMM(etdRealValue)}</span>
                          <button 
                            onClick={() => { setEditingHeaderField('ETD'); setHeaderManualValue(formatTimeHHMM(etdRealValue)); }}
                            className="opacity-0 group-hover/item:opacity-100 text-[10px] text-white/30 hover:text-white transition-all"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                        </div>
                      )}
                   </div>
                   <div className="w-[1px] h-6 sm:h-10 bg-white/10"></div>
                   <div className="flex flex-col items-center">
                      <span className="text-[7px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Losa real</span>
                      <span className="text-sm sm:text-xl font-black text-white">{losaRealValue}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* SUB-TABS SELECTOR */}
        <div className="flex p-1.5 sm:p-2 bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 gap-1 sm:gap-2">
           <button 
             onClick={() => setActiveSubTab('RAMPA')}
             className={`flex-1 py-3 sm:py-4 rounded-[1rem] sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all flex flex-col sm:flex-row items-center justify-center sm:space-x-3 ${activeSubTab === 'RAMPA' ? 'bg-[#1b2e91] text-white shadow-lg' : 'bg-transparent text-[#1b2e91] hover:bg-slate-50'}`}
           >
             <i className="fa-solid fa-truck-ramp-box mb-1 sm:mb-0"></i>
             <span>RAMPA</span>
           </button>
           <button 
             onClick={() => setActiveSubTab('SPAX')}
             className={`flex-1 py-3 sm:py-4 rounded-[1rem] sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all flex flex-col sm:flex-row items-center justify-center sm:space-x-3 ${activeSubTab === 'SPAX' ? 'bg-[#1b2e91] text-white shadow-lg' : 'bg-transparent text-[#1b2e91] hover:bg-slate-50'}`}
           >
             <i className="fa-solid fa-users mb-1 sm:mb-0"></i>
             <span>SPAX</span>
           </button>
        </div>

        {/* MILESTONE LIST */}
        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-slate-100 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 ml-2 gap-4">
            <div>
               <h3 className="text-lg sm:text-xl font-black text-[#1b2e91] uppercase leading-none">Carga de Hitos</h3>
               <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                 Control de flujo <span className="text-[#eb0045]">{activeSubTab}</span>
               </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
              {/* Cuadro 1: Agente Asignado */}
              <div className="bg-slate-50 px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-100 w-full sm:min-w-[180px]">
                <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {activeSubTab === 'RAMPA' ? 'Agente COT' : 'Sobre el Ala 1'}
                </p>
                <p className="text-[10px] sm:text-xs font-black text-[#1b2e91] truncate">
                  {(() => {
                    const taskIdx = activeSubTab === 'RAMPA' ? 4 : 0;
                    const agentId = assignments[selectedFlightId!]?.[taskIdx];
                    const agent = agents.find(a => a.id === agentId);
                    return agent ? `${agent.name} ${agent.lastName}` : '--';
                  })()}
                </p>
              </div>

              {/* Cuadro 2: Contacto */}
              <div 
                onClick={() => setShowContactPopup(true)}
                className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl border cursor-pointer transition-all w-full sm:min-w-[150px] ${
                  contacts[selectedFlightId!]?.[activeSubTab] 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-slate-50 border-slate-100 hover:border-[#1b2e91]/30'
                }`}
              >
                <p className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest mb-1 ${
                  contacts[selectedFlightId!]?.[activeSubTab] ? 'text-green-600' : 'text-slate-400'
                }`}>
                  Contacto
                </p>
                <p className={`text-[10px] sm:text-xs font-black truncate ${
                  contacts[selectedFlightId!]?.[activeSubTab] ? 'text-green-700' : 'text-[#1b2e91]'
                }`}>
                  {contacts[selectedFlightId!]?.[activeSubTab] || 'Seleccionar...'}
                </p>
              </div>

              {/* Alerta/Botón Buscar Bags */}
              <div className="flex items-center w-full sm:w-auto sm:pl-2 space-x-2">
                {currentFlight.milestones['BÚSQUEDA EQUIPAJE'] ? (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        {/* El anillo de expansión solo si no ha terminado */}
                        {!currentFlight.milestones['FIN BÚSQUEDA EQUIPAJE'] && (
                          <div className="absolute -inset-2 bg-red-500/30 rounded-full animate-ping"></div>
                        )}
                        <div className={`relative w-14 h-14 rounded-t-2xl border-b-4 border-slate-900 flex items-center justify-center shadow-xl overflow-hidden ${
                          currentFlight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent to-white/20"></div>
                          <div className="absolute top-2 left-2 w-3 h-3 bg-white/40 rounded-full blur-[1px]"></div>
                          <i className={`fa-solid fa-light-emergency text-white text-2xl ${
                            !currentFlight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'animate-pulse' : ''
                          }`}></i>
                        </div>
                      </div>
                      <span className={`text-[7px] font-black uppercase tracking-widest mt-1 ${
                        currentFlight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'text-green-600' : 'text-red-600 animate-pulse'
                      }`}>
                        {currentFlight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'Bags OK' : 'Bags Warning'}
                      </span>
                    </div>

                    {/* Botón Cancelar (Solo en SPAX y si no ha terminado) */}
                    {activeSubTab === 'SPAX' && !currentFlight.milestones['FIN BÚSQUEDA EQUIPAJE'] && (
                      <button
                        onClick={() => onUpdateMilestone(selectedFlightId!, 'BÚSQUEDA EQUIPAJE', '')}
                        className="bg-slate-800 hover:bg-black text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
                      >
                        Cancelar Búsqueda
                      </button>
                    )}

                    {/* Botón Equipaje Desembarcado (Solo en RAMPA y si no ha terminado) */}
                    {activeSubTab === 'RAMPA' && !currentFlight.milestones['FIN BÚSQUEDA EQUIPAJE'] && (
                      <button
                        onClick={() => handleMilestoneClick('FIN BÚSQUEDA EQUIPAJE')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all active:scale-95"
                      >
                        Equipaje Desembarcado
                      </button>
                    )}
                  </>
                ) : activeSubTab === 'SPAX' && (
                  <button
                    onClick={() => handleMilestoneClick('BÚSQUEDA EQUIPAJE')}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95"
                  >
                    Buscar Bags
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contact Popup */}
          {showContactPopup && (
            <div className="absolute top-24 right-8 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-64 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                <span className="text-[10px] font-black text-[#1b2e91] uppercase tracking-widest">Seleccionar Contacto</span>
                <button onClick={() => setShowContactPopup(false)} className="text-slate-400 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {(activeSubTab === 'RAMPA' ? rampaContacts : spaxContacts).map(contact => (
                  <button
                    key={contact}
                    onClick={() => handleSelectContact(contact)}
                    className="text-left px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-[#1b2e91] transition-colors"
                  >
                    {contact}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="relative space-y-4 px-2">
            {filteredMilestones.map((m) => {
              const registeredTime = currentFlight.milestones[m.key];
              const theoreticalKey = `${m.key} TEORICO`;
              const theoreticalTime = currentFlight.milestones[theoreticalKey];
              const isSyncing = syncingKeys.has(m.key);
              const isEditing = editingKey === m.key;
              const isDelayed = isLate(registeredTime, theoreticalTime);

              return (
                <div key={m.key} className="relative group flex items-stretch space-x-4 animate-in slide-in-from-right-4 duration-300">
                  {/* Teórico */}
                  <div className="flex-1 bg-slate-50/50 rounded-2xl p-4 border border-slate-50 flex flex-col justify-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label} Teórico</p>
                    <p className={`text-lg font-black tracking-tighter ${theoreticalTime === 'SIN DATOS' ? 'text-slate-200' : 'text-slate-400'}`}>
                      {formatTimeHHMM(theoreticalTime)}
                    </p>
                  </div>

                  {/* Icono central - Tilde Condicional */}
                  <div className="flex flex-col items-center justify-center relative px-2">
                    <div className="w-[2px] h-full bg-slate-100 absolute left-1/2 -translate-x-1/2 z-0"></div>
                    <div className={`w-10 h-10 rounded-full border-4 transition-all z-10 flex items-center justify-center ${
                      registeredTime 
                        ? (isDelayed ? 'bg-[#eb0045] border-white text-white shadow-lg' : 'bg-[#10b981] border-white text-white shadow-lg') 
                        : 'bg-white border-slate-100 text-transparent'
                    }`}>
                      {registeredTime && <i className="fa-solid fa-check text-xs"></i>}
                    </div>
                  </div>

                  {/* Real */}
                  <div className={`flex-1 rounded-2xl p-4 border transition-all shadow-sm flex flex-col justify-center ${
                    registeredTime 
                      ? (isDelayed ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100') 
                      : 'bg-white border-slate-100 group-hover:border-[#1b2e91]/20'
                  }`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${registeredTime ? (isDelayed ? 'text-[#eb0045]' : 'text-[#10b981]') : 'text-[#1b2e91]'}`}>
                      {m.label} Real
                    </p>
                    <div className="flex items-center justify-between">
                      {isEditing ? (
                        <div className="flex items-center space-x-2 animate-in zoom-in w-full">
                          <input 
                            type="time" 
                            value={manualTime} 
                            onChange={(e) => setManualTime(e.target.value)} 
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-black text-[#1b2e91] outline-none w-full shadow-inner"
                          />
                          <button onClick={() => handleManualSave(m.key)} className="bg-[#1b2e91] text-white p-2 rounded-lg"><i className="fa-solid fa-check text-[10px]"></i></button>
                        </div>
                      ) : registeredTime ? (
                        <div className="flex items-center justify-between w-full">
                           <span className={`text-2xl font-black tracking-tighter leading-none ${isDelayed ? 'text-[#eb0045]' : 'text-[#10b981]'}`}>
                             {formatTimeHHMM(registeredTime)}
                           </span>
                           <button onClick={() => {setEditingKey(m.key); setManualTime(formatTimeHHMM(registeredTime));}} className="text-slate-300 hover:text-[#1b2e91] transition-colors"><i className="fa-solid fa-pen text-[10px]"></i></button>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between space-x-2">
                           <button 
                             onClick={() => handleMilestoneClick(m.key)}
                             disabled={isSyncing}
                             className="flex-1 bg-[#1b2e91] hover:bg-[#eb0045] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                           >
                             {isSyncing ? <i className="fa-solid fa-sync fa-spin"></i> : 'Cargar'}
                           </button>
                           <button onClick={() => {setEditingKey(m.key); setManualTime('');}} className="bg-slate-50 text-slate-400 p-2 rounded-xl"><i className="fa-solid fa-keyboard text-[10px]"></i></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
        <div>
          <div className="flex items-center space-x-3 mb-3">
             <h2 className="text-5xl font-black text-[#1b2e91] tracking-tighter leading-none">Vuelos</h2>
             <div className="flex space-x-2">
               <span className="text-sm font-black text-[#eb0045] uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full shadow-sm">RAMPA</span>
               <span className="text-sm font-black text-[#eb0045] uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full shadow-sm">SPAX</span>
             </div>
          </div>
          <p className="text-sm font-bold text-[#5e6e89] uppercase tracking-widest opacity-60">Control de Hitos Operativos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
        {flights.length > 0 ? flights.map(flight => {
          const losaReal = calculateLosaReal(flight.milestones['IN'], flight.etdReal);
          return (
            <div 
              key={flight.id} 
              className="bg-white rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-50 flex flex-col group relative overflow-hidden"
            >
              {/* Alerta de Búsqueda de Equipaje en la Card */}
              {flight.milestones['BÚSQUEDA EQUIPAJE'] && (
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                   <div className="relative">
                      {!flight.milestones['FIN BÚSQUEDA EQUIPAJE'] && (
                        <div className="absolute -inset-1 bg-red-500/30 rounded-full animate-ping"></div>
                      )}
                      <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-t-xl border-b-2 border-slate-900 flex items-center justify-center shadow-lg overflow-hidden ${
                        flight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent to-white/20"></div>
                        <i className={`fa-solid fa-light-emergency text-white text-[10px] sm:text-xs ${
                          !flight.milestones['FIN BÚSQUEDA EQUIPAJE'] ? 'animate-pulse' : ''
                        }`}></i>
                      </div>
                   </div>
                </div>
              )}

              <div className="flex justify-between items-start mb-4 sm:mb-10 relative z-10">
                <div className="flex flex-col space-y-2 sm:space-y-3 w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="bg-[#1b2e91] text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-2xl font-black text-[10px] sm:text-base tracking-tighter shadow-lg shadow-blue-500/20">
                        {flight.vueloSalida || flight.number}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[6px] sm:text-[10px] font-black text-[#5e6e89] uppercase tracking-widest">{flight.type}</span>
                        <span className="text-[5px] sm:text-[9px] font-bold text-[#eb0045] uppercase tracking-widest">{flight.registration}</span>
                      </div>
                    </div>
                    <div className="flex flex-col border-l-2 border-slate-100 pl-2 sm:pl-3">
                       <span className="text-[5px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">COT 1</span>
                       <span className="text-[7px] sm:text-[10px] font-bold text-[#1b2e91] truncate max-w-[60px] sm:max-w-[120px]">
                         {(() => {
                           const cot1Id = assignments[flight.id]?.[4];
                           const cot1Agent = agents.find(a => a.id === cot1Id);
                           return cot1Agent ? `${cot1Agent.name} ${cot1Agent.lastName}` : 'Sin asignar';
                         })()}
                       </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-50 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-slate-100 w-fit">
                     <span className="text-[5px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">EMBARQUE 1:</span>
                     <span className="text-[7px] sm:text-[10px] font-bold text-[#1b2e91] truncate max-w-[80px] sm:max-w-[150px]">
                       {(() => {
                         const embarque1Id = assignments[flight.id]?.[0];
                         const embarque1Agent = agents.find(a => a.id === embarque1Id);
                         return embarque1Agent ? `${embarque1Agent.name} ${embarque1Agent.lastName}` : 'Sin asignar';
                       })()}
                     </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center relative mb-4 sm:mb-12 z-10">
                <div className="text-left w-1/3">
                   <p className="text-lg sm:text-3xl font-black text-[#1b2e91] tracking-tighter">{formatTimeHHMM(flight.eta)}</p>
                   <p className="text-[7px] sm:text-[11px] font-bold text-[#5e6e89] uppercase tracking-widest opacity-50 truncate">{flight.origin}</p>
                </div>
                <div className="flex-1 px-2 sm:px-6 flex flex-col items-center">
                   <div className="w-full h-[1px] sm:h-[2px] bg-slate-50 relative rounded-full">
                     <i className="fa-solid fa-plane absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-100 text-xs sm:text-lg group-hover:text-blue-100 transition-colors"></i>
                   </div>
                </div>
                <div className="text-right w-1/3">
                   <p className="text-lg sm:text-3xl font-black text-[#1b2e91] tracking-tighter">{formatTimeHHMM(flight.etd)}</p>
                   <p className="text-[7px] sm:text-[11px] font-bold text-[#5e6e89] uppercase tracking-widest opacity-50 truncate">{flight.destination}</p>
                </div>
              </div>

              {/* POS y GATE */}
              <div className="flex justify-around items-center mb-4 sm:mb-6 -mt-2 sm:-mt-4 bg-slate-50/30 py-1.5 sm:py-2 rounded-xl border border-slate-100/50">
                <div className="flex flex-col items-center">
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">POS</span>
                  <span className="text-[10px] sm:text-xs font-black text-[#1b2e91]">{flight.position}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">GATE</span>
                  <span className="text-[10px] sm:text-xs font-black text-[#1b2e91]">{flight.gate}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 sm:gap-3 border-t border-slate-50 pt-4 sm:pt-8 mb-6 sm:mb-10 z-10">
                 <div className="bg-slate-50/50 p-1 sm:p-3 rounded-lg sm:rounded-2xl border border-slate-50 flex flex-col items-center justify-center text-center">
                    <p className="text-[5px] sm:text-[9px] font-black text-[#5e6e89] uppercase tracking-widest mb-0.5 sm:mb-1 opacity-60">TAT</p>
                    <p className="text-[9px] sm:text-sm font-black text-[#1b2e91] tracking-tight">{formatTimeHHMM(flight.tatTeorico)}</p>
                 </div>
                 <div className="bg-slate-50/50 p-1 sm:p-3 rounded-lg sm:rounded-2xl border border-slate-50 flex flex-col items-center justify-center text-center">
                    <p className="text-[5px] sm:text-[9px] font-black text-[#5e6e89] uppercase tracking-widest mb-0.5 sm:mb-1 opacity-60">ETD</p>
                    <p className="text-[9px] sm:text-sm font-black text-[#eb0045] tracking-tight">{formatTimeHHMM(flight.etdReal)}</p>
                 </div>
                 <div className="bg-slate-50/50 p-1 sm:p-3 rounded-lg sm:rounded-2xl border border-slate-50 flex flex-col items-center justify-center text-center">
                    <p className="text-[5px] sm:text-[9px] font-black text-[#5e6e89] uppercase tracking-widest mb-0.5 sm:mb-1 opacity-60">Losa</p>
                    <p className={`text-[9px] sm:text-sm font-black tracking-tight ${losaReal !== '--:--' ? 'text-slate-900' : 'text-slate-200'}`}>{losaReal}</p>
                 </div>
              </div>

              <button 
                onClick={() => setSelectedFlightId(flight.id)}
                className="w-full bg-[#1b2e91] group-hover:bg-[#eb0045] text-white py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95 z-10"
              >
                Operar Vuelo
              </button>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 sm:py-32 text-center bg-white rounded-[2rem] sm:rounded-[4rem] border-2 border-dashed border-slate-100">
             <i className="fa-solid fa-plane-slash text-3xl sm:text-4xl text-slate-100 mb-6"></i>
             <p className="text-[#5e6e89] font-black uppercase text-xs sm:text-sm tracking-[0.4em]">Sin vuelos programados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperarVuelo;
