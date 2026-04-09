
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Agent, Flight, UserRole } from './types';
import { MOCK_AGENTS } from './mockData';
import { MILESTONES, COUNTRY_AIRPORTS } from './constants';
import Login from './components/Login';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import OperarVuelo from './components/OperarVuelo';
import HitosGantt from './components/HitosGantt';
import GestionSupervisor from './components/GestionSupervisor';
import PanelOperativo from './components/PanelOperativo';
import KPIs from './components/KPIs';
import Reglas from './components/Reglas';

const SHEET_ID = "1EHaaQ4WqhbNqTW_oSMXyNHR7jyd8BHbfBx14TRLv5Ig";
const READ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1050865846`;

export const SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz06UlozjJ80mqE9IH_fg0zi2V1bmpPTJECBAaBa88xfXh4i-LS7p_4FJRPLM0LPS7J/exec"; 

const COUNTRY_CODE_MAP: Record<string, string> = {
  'ARG': 'Argentina',
  'BOL': 'Bolivia',
  'URY': 'Uruguay',
  'PRY': 'Paraguay',
  'VEN': 'Venezuela',
  'CUB': 'Cuba'
};

const App: React.FC = () => {
  const [user, setUser] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState<string>('hitos');
  const [globalSelectedFlightId, setGlobalSelectedFlightId] = useState<string | null>(null);
  const [globalCountryFilter, setGlobalCountryFilter] = useState<string>('');
  const [globalAirportFilter, setGlobalAirportFilter] = useState<string>('');
  const [globalSelectedDate, setGlobalSelectedDate] = useState(() => {
    const d = new Date();
    // Adjust for local timezone to avoid UTC date shift issues
    const offset = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - offset);
    return localDate.toISOString().split('T')[0];
  });
  const [globalDateFilter, setGlobalDateFilter] = useState<'all' | 'specific'>('specific');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [personalList, setPersonalList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState<boolean>(true);
  const [lastSyncStatus, setLastSyncStatus] = useState<{msg: string, type: 'success' | 'error' | 'syncing'} | null>(null);
  const [isRefreshingTheoretics, setIsRefreshingTheoretics] = useState<boolean>(false);
  const [assignments, setAssignments] = useState<Record<string, Record<string, string>>>({});
  const [contacts, setContacts] = useState<Record<string, Record<string, string>>>({});
  
  const localMilestoneCache = useRef<Record<string, Record<string, string>>>({});
  const prevFlightsRef = useRef<Flight[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const columnLetterToIndex = (letter: string) => {
    let column = 0;
    const cleanLetter = letter.toUpperCase().trim();
    for (let i = 0; i < cleanLetter.length; i++) {
      column = column * 26 + (cleanLetter.charCodeAt(i) - 64);
    }
    return column - 1;
  };

  const parseCSV = (text: string) => {
    const result: string[][] = [];
    let currentLine: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentLine.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        currentLine.push(currentCell.trim());
        result.push(currentLine);
        currentLine = [];
        currentCell = '';
        if (char === '\r') i++; // Skip \n of \r\n
      } else {
        currentCell += char;
      }
    }
    
    if (currentCell || currentLine.length > 0) {
      currentLine.push(currentCell.trim());
      result.push(currentLine);
    }
    
    return result.map(row => row.map(val => val.replace(/^"|"$/g, '')));
  };

  const formatFlightNum = (val: string) => {
    if (!val) return '';
    const clean = val.toString().trim().toUpperCase();
    return clean.startsWith('LA') ? clean : `LA${clean}`;
  };

  const isValidTimeValue = (val: string) => {
    if (!val) return false;
    const clean = val.trim().toUpperCase();
    const blackList = ['LIM', '-', '#N/A', '', 'ERROR', 'VALUE!', '#REF!', '#VALOR!', 'NAN', 'UNDEFINED', 'NULL', 'SIN DATOS'];
    if (blackList.includes(clean)) return false;
    return /[:\d]/.test(clean);
  };

  const parseCSVDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const fetchFlightsFromSheet = async (isQuiet = false) => {
    if (!isQuiet) setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substring(7);
      const response = await fetch(`${READ_URL}&t=${timestamp}&cb=${randomId}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        console.error(`Error de red: ${response.status} ${response.statusText}`);
        throw new Error(`Status: ${response.status}`);
      }

      const csvText = await response.text();
      
      // LOG DE DEPURACIÓN: Ver las primeras líneas del CSV
      console.log("CSV Headers:", csvText.split('\n')[0]);
      console.log("CSV First Data Row:", csvText.split('\n')[1]);

      if (!csvText || csvText.length < 10) {
        console.warn("El CSV recibido está vacío o es demasiado corto.");
        return;
      }

      const rows = parseCSV(csvText);
      if (rows.length < 2) {
        console.warn("No hay suficientes filas en el CSV para procesar.");
        return;
      }

      const dataRows = rows.slice(1);
      
      const idx = {
        vArr: columnLetterToIndex('C'), 
        vSal: columnLetterToIndex('I'),
        mat: columnLetterToIndex('G'), 
        eta: columnLetterToIndex('E'),
        etd: columnLetterToIndex('K'), 
        ato: columnLetterToIndex('H'), 
        dest: columnLetterToIndex('L'), 
        type: columnLetterToIndex('N'),
        pos: columnLetterToIndex('O'), 
        gate: columnLetterToIndex('P'),
        status: columnLetterToIndex('Q'), 
        country: columnLetterToIndex('CL'), 
        tatTeorico: columnLetterToIndex('Z'),
        etdReal: columnLetterToIndex('AA'),
        inBlock: columnLetterToIndex('AB')
      };

      const parsedFlights: Flight[] = dataRows
        .filter(row => row.length > 5 && (row[idx.vArr] || row[idx.vSal] || row[idx.mat]))
        .map((row, rIndex) => {
          const vArr = formatFlightNum(row[idx.vArr]);
          const vSal = formatFlightNum(row[idx.vSal]);
          let mat = (row[idx.mat] || 'NA').trim();
          if (mat.length > 2 && !mat.includes('-')) {
            mat = mat.substring(0, 2) + '-' + mat.substring(2);
          }
          const flightKey = `R${rIndex}-${vArr || 'X'}-${vSal || 'X'}-${mat}`;
          const rawCountryCode = (row[idx.country] || '').trim().toUpperCase();
          const airport = (row[idx.ato] || '').trim().toUpperCase();
          
          let countryValue = COUNTRY_CODE_MAP[rawCountryCode] || '';
          
          // If country code is missing or not mapped, try to infer from airport
          if (!countryValue && airport) {
            for (const [country, airports] of Object.entries(COUNTRY_AIRPORTS)) {
              if (airports.includes(airport)) {
                countryValue = country;
                break;
              }
            }
          }
          
          // Final fallback
          if (!countryValue) countryValue = 'Argentina'; 

          const milestonesData: Record<string, string> = {};
          MILESTONES.forEach(m => {
            const colIdx = m.sheetColumn ? columnLetterToIndex(m.sheetColumn) : -1;
            const rawVal = (colIdx !== -1 && row[colIdx]) ? row[colIdx].trim() : '';

            if (!m.isTheoretical) {
              const sheetValue = isValidTimeValue(rawVal) ? rawVal : '';
              const cachedVal = localMilestoneCache.current[flightKey]?.[m.key];
              
              // Preferimos el valor cacheado (el más reciente del usuario) sobre el del sheet
              // para evitar que la UI revierta mientras el sheet se actualiza.
              const finalVal = (cachedVal !== undefined) ? cachedVal : sheetValue;
              
              if (finalVal !== undefined && finalVal !== null) {
                milestonesData[m.key] = finalVal;
              }
            } else {
              const validTime = isValidTimeValue(rawVal);
              milestonesData[m.key] = validTime ? rawVal : "SIN DATOS";
            }
          });

          return {
            id: flightKey, 
            number: vSal || vArr || '---', 
            vueloArribo: vArr, 
            vueloSalida: vSal,
            fechaArribo: parseCSVDate(row[columnLetterToIndex('D')] || ''), 
            fechaSalida: parseCSVDate(row[columnLetterToIndex('J')] || ''),
            rawFechaArribo: row[columnLetterToIndex('D')] || '',
            rawFechaSalida: row[columnLetterToIndex('J')] || '',
            origin: row[idx.ato] || '---', 
            destination: row[idx.dest] || '---',
            eta: row[idx.eta] || '--:--', 
            etd: row[idx.etd] || '--:--',
            registration: mat, 
            type: row[idx.type] || 'N/A',
            position: row[idx.pos] || '--', 
            gate: row[idx.gate] || '--',
            status: (row[idx.status] as any) || 'Scheduled', 
            country: countryValue,
            airport: row[idx.ato] || 'EZE', 
            milestones: milestonesData,
            tatTeorico: row[idx.tatTeorico] || '--:--',
            etdReal: row[idx.etdReal] || null,
            inBlock: row[idx.inBlock] || null
          };
        });

      if (parsedFlights.length === 0) {
        console.warn("No se pudieron parsear vuelos válidos de las filas recibidas.");
      }

      prevFlightsRef.current = parsedFlights;
      setFlights(parsedFlights);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      if (!isQuiet) setIsLoading(false);
    }
  };

  const fetchPersonalFromSheet = async () => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Personal`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error fetching personal");
      const csvText = await response.text();
      const rows = parseCSV(csvText);
      
      const parsedAgents: Agent[] = [];
      const names: string[] = [];

      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const bp = row[0]?.trim();
        const fullName = row[1]?.trim();
        if (!fullName || fullName.toLowerCase() === 'nombre') continue;

        names.push(fullName);

        // Parse Role
        const rawRole = row[11]?.trim().toLowerCase() || '';
        let role = UserRole.AGENT;
        if (rawRole.includes('admin')) role = UserRole.ADMIN;
        else if (rawRole.includes('super')) role = UserRole.SUPERVISOR;

        // Parse Function
        const rawFunction = row[4]?.trim() || 'COT';
        let functionType: any = 'COT';
        if (rawFunction.toLowerCase().includes('embarque')) functionType = 'Embarque';
        else if (rawFunction.toLowerCase().includes('limpieza')) functionType = 'Limpieza';
        else if (rawFunction.toLowerCase().includes('catering')) functionType = 'Catering';
        else if (rawFunction.toLowerCase().includes('ventas')) functionType = 'Ventas';
        else if (rawFunction.toLowerCase().includes('arribos')) functionType = 'Arribos';
        else if (rawFunction.toLowerCase().includes('super')) functionType = 'Supervisor';

        // Parse Base
        const base = row[7]?.trim() || 'EZE';

        // Parse Password
        const password = row[12]?.trim() || undefined;

        // Split name into first and last
        const nameParts = fullName.split(' ');
        const name = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        parsedAgents.push({
          id: bp || `agent-${i}`,
          name,
          lastName,
          role,
          function: functionType,
          base,
          password
        });
      }
      
      setPersonalList(names);
      setAgentsList(parsedAgents);
    } catch (err) {
      console.error("Error fetching personal:", err);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const startRapidPolling = (durationMs = 15000) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const startTime = Date.now();
    
    pollingRef.current = setInterval(() => {
      fetchFlightsFromSheet(true);
      if (Date.now() - startTime >= durationMs) { 
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setIsRefreshingTheoretics(false);
      }
    }, 2000); 
  };

  const handleUpdateMilestone = async (flightId: string, milestoneKey: string, time: string) => {
    setLastSyncStatus({ msg: 'ENVIANDO...', type: 'syncing' });
    
    if (milestoneKey === 'IN') setIsRefreshingTheoretics(true);

    setFlights(prev => prev.map(f => {
      if (f.id === flightId) {
        if (!localMilestoneCache.current[flightId]) localMilestoneCache.current[flightId] = {};
        localMilestoneCache.current[flightId][milestoneKey] = time;
        return { ...f, milestones: { ...f.milestones, [milestoneKey]: time } };
      }
      return f;
    }));

    try {
      const flight = flights.find(f => f.id === flightId);
      const mDef = MILESTONES.find(m => m.key === milestoneKey);
      
      const payload = {
        vuelo: flight?.vueloSalida || flight?.number || "",
        vueloArribo: flight?.vueloArribo || "",
        vueloSalida: flight?.vueloSalida || "",
        fecha: flight?.rawFechaSalida || flight?.fechaSalida || flight?.rawFechaArribo || flight?.fechaArribo || "",
        fechaArribo: flight?.rawFechaArribo || flight?.fechaArribo || "",
        fechaSalida: flight?.rawFechaSalida || flight?.fechaSalida || "",
        milestone: milestoneKey,
        sheetColumn: mDef?.sheetColumn || "",
        time: time,
        agent: `${user?.name} ${user?.lastName}`
      };

      await fetch(SCRIPT_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      setLastSyncStatus({ msg: 'RECIBIDO', type: 'success' });
      
      const syncDelay = milestoneKey === 'IN' ? 2200 : 800;
      
      setTimeout(() => {
        setLastSyncStatus(null);
        fetchFlightsFromSheet(true); 
        startRapidPolling(milestoneKey === 'IN' ? 20000 : 5000); 
      }, syncDelay);
      
    } catch (e) {
      console.error("Error de red:", e);
      setLastSyncStatus({ msg: 'ERROR DE CONEXIÓN', type: 'error' });
      setIsRefreshingTheoretics(false);
      setTimeout(() => setLastSyncStatus(null), 5000);
    }
  };

  useEffect(() => {
    fetchFlightsFromSheet();
    fetchPersonalFromSheet();
    const interval = setInterval(() => fetchFlightsFromSheet(true), 45000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (agent: Agent) => setUser(agent);
  const handleLogout = () => setUser(null);

  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      let dateMatch = true;
      if (globalDateFilter !== 'all') {
        dateMatch = f.fechaArribo === globalSelectedDate || f.fechaSalida === globalSelectedDate;
      }
      
      let countryMatch = true;
      if (globalCountryFilter) {
        countryMatch = f.country === globalCountryFilter;
      }

      let airportMatch = true;
      if (globalAirportFilter) {
        airportMatch = f.airport === globalAirportFilter;
      }

      return dateMatch && countryMatch && airportMatch;
    });
  }, [flights, globalSelectedDate, globalDateFilter, globalCountryFilter, globalAirportFilter]);

  if (isLoadingAgents) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1b2e91] px-4">
        <div className="h-16 w-16 bg-[#eb0045] rounded-2xl flex items-center justify-center text-white text-3xl font-black rotate-3 shadow-lg mb-6 animate-pulse">
          CCH
        </div>
        <p className="text-white font-bold tracking-widest uppercase text-sm animate-pulse">Cargando usuarios...</p>
      </div>
    );
  }

  if (!user) return <Login onLogin={handleLogin} agents={agentsList.length > 0 ? agentsList : MOCK_AGENTS} />;

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        selectedDate={globalSelectedDate}
        setSelectedDate={setGlobalSelectedDate}
        dateFilter={globalDateFilter}
        setDateFilter={setGlobalDateFilter}
        flights={flights}
        countryFilter={globalCountryFilter}
        setCountryFilter={setGlobalCountryFilter}
        airportFilter={globalAirportFilter}
        setAirportFilter={setGlobalAirportFilter}
      />
      
      {lastSyncStatus && (
        <div className={`fixed top-20 right-4 z-50 text-white px-5 py-3 rounded-2xl shadow-2xl border-b-4 transform transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
          lastSyncStatus.type === 'error' ? 'bg-rose-600 border-rose-900' : 'bg-slate-900 border-blue-500'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${lastSyncStatus.type === 'error' ? 'bg-rose-500' : 'bg-blue-600'}`}>
               <i className={`fa-solid ${lastSyncStatus.type === 'syncing' ? 'fa-sync fa-spin' : (lastSyncStatus.type === 'error' ? 'fa-xmark' : 'fa-check')} text-[10px]`}></i>
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase">{lastSyncStatus.msg}</span>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'hitos' && (
            <OperarVuelo 
              flights={filteredFlights} 
              user={user} 
              agents={agentsList.length > 0 ? agentsList : MOCK_AGENTS}
              assignments={assignments}
              contacts={contacts}
              setContacts={setContacts}
              onUpdateMilestone={handleUpdateMilestone}
              isRefreshingTheoretics={isRefreshingTheoretics}
              selectedFlightId={globalSelectedFlightId}
              setSelectedFlightId={setGlobalSelectedFlightId}
            />
          )}
          {activeTab === 'gantt' && (
            <HitosGantt 
              flights={filteredFlights} 
              agents={agentsList.length > 0 ? agentsList : MOCK_AGENTS} 
              assignments={assignments} 
              selectedFlightId={globalSelectedFlightId}
              setSelectedFlightId={setGlobalSelectedFlightId}
            />
          )}
          {activeTab === 'gestion' && (
            <GestionSupervisor 
              agents={agentsList.length > 0 ? agentsList : MOCK_AGENTS} 
              flights={filteredFlights} 
              assignments={assignments} 
              setAssignments={setAssignments} 
              personalList={personalList}
            />
          )}
          {activeTab === 'panel' && (
            <PanelOperativo 
              flights={filteredFlights} 
              selectedDate={globalSelectedDate}
              dateFilter={globalDateFilter}
            />
          )}
          {activeTab === 'kpis' && (
            <KPIs 
              flights={filteredFlights} 
              agents={agents}
              assignments={assignments}
              selectedDate={globalSelectedDate}
              dateFilter={globalDateFilter}
            />
          )}
          {activeTab === 'reglas' && <Reglas />}
        </div>
      </main>
      
      <BottomNav user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
