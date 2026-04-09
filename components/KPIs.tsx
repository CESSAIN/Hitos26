import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Flight, Agent } from '../types';

interface KPIsProps {
  flights: Flight[];
  agents: Agent[];
  assignments: Record<string, Record<number, string>>;
  selectedDate: Date;
  dateFilter: 'day' | 'week' | 'month';
}

const getMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getDuration = (start: string | undefined, end: string | undefined) => {
  if (!start || !end) return null;
  let s = getMinutes(start);
  let e = getMinutes(end);
  if (e < s) e += 24 * 60; // next day
  return e - s;
};

const KpiCard = ({ title, value, subtitle, icon, color }: { title: string, value: string | number, subtitle?: string, icon: string, color: string }) => {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    teal: 'text-teal-600 bg-teal-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    pink: 'text-pink-600 bg-pink-50',
  };
  
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight w-2/3">{title}</p>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses[color] || colorClasses.blue}`}>
          <i className={`fa-solid ${icon} text-sm`}></i>
        </div>
      </div>
      <div className="mt-auto">
        <span className="text-2xl font-black text-gray-800">{value}</span>
        {subtitle && <p className="text-[10px] font-bold text-gray-400 mt-1 truncate" title={subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
};

const KPIs: React.FC<KPIsProps> = ({ flights, agents, assignments, selectedDate, dateFilter }) => {
  const [filterType, setFilterType] = useState('All');
  const [filterAirport, setFilterAirport] = useState('All');
  const [filterAgent, setFilterAgent] = useState('All');
  const [filterRoute, setFilterRoute] = useState('All');

  const uniqueTypes = Array.from(new Set(flights.map(f => f.type))).filter(Boolean);
  const uniqueAirports = Array.from(new Set(flights.map(f => f.airport))).filter(Boolean);
  const uniqueRoutes = Array.from(new Set(flights.map(f => `${f.origin}-${f.destination}`))).filter(Boolean);
  const uniqueAgents = agents.map(a => `${a.name} ${a.lastName}`);

  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      if (filterType !== 'All' && f.type !== filterType) return false;
      if (filterAirport !== 'All' && f.airport !== filterAirport) return false;
      if (filterRoute !== 'All' && `${f.origin}-${f.destination}` !== filterRoute) return false;
      
      if (filterAgent !== 'All') {
        const flightAssignments = assignments[f.id] || {};
        const agentIds = Object.values(flightAssignments);
        const agentNames = agentIds.map(id => {
          const a = agents.find(ag => ag.id === id);
          return a ? `${a.name} ${a.lastName}` : '';
        });
        if (!agentNames.includes(filterAgent)) return false;
      }
      return true;
    });
  }, [flights, filterType, filterAirport, filterRoute, filterAgent, assignments, agents]);

  const kpis = useMemo(() => {
    let totalTat = 0;
    let tatCount = 0;
    let minTat = Infinity;
    let minTatFlight = '';
    let maxTat = -Infinity;
    let maxTatFlight = '';

    let totalBoarding = 0;
    let boardingCount = 0;
    let minBoarding = Infinity;
    let minBoardingFlight = '';
    let maxBoarding = -Infinity;
    let maxBoardingFlight = '';

    let totalCleaning = 0;
    let cleaningCount = 0;
    let minCleaning = Infinity;
    let minCleaningFlight = '';
    let maxCleaning = -Infinity;
    let maxCleaningFlight = '';

    let totalCatering = 0;
    let cateringCount = 0;

    let baggageSearches = 0;

    let totalLosa = 0;
    let losaCount = 0;
    let minLosa = Infinity;
    let minLosaFlight = '';
    let maxLosa = -Infinity;
    let maxLosaFlight = '';

    let totalDelay = 0;
    let delayCount = 0;
    let maxDelay = -Infinity;
    let maxDelayFlight = '';

    const agentTat: Record<string, number[]> = {};
    const agentBoarding: Record<string, number[]> = {};

    const routeCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const airportCounts: Record<string, number> = {};

    let delayedFlights = 0;
    let onTimeFlights = 0;
    let departedFlights = 0;

    const tatChartData: any[] = [];

    filteredFlights.forEach(f => {
      const flightName = f.vueloSalida || f.number;

      if (f.status === 'Delayed') delayedFlights++;
      if (f.status === 'On Time') onTimeFlights++;
      if (f.status === 'Departed') departedFlights++;

      const route = `${f.origin}-${f.destination}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
      typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
      airportCounts[f.airport] = (airportCounts[f.airport] || 0) + 1;

      const tat = getDuration(f.milestones['IN'], f.milestones['OUT']);
      if (tat !== null) {
        totalTat += tat;
        tatCount++;
        if (tat < minTat) { minTat = tat; minTatFlight = flightName; }
        if (tat > maxTat) { maxTat = tat; maxTatFlight = flightName; }
        tatChartData.push({ name: flightName, TAT: tat });

        const cotId = assignments[f.id]?.[4];
        if (cotId) {
          const agent = agents.find(a => a.id === cotId);
          if (agent) {
            const name = `${agent.name} ${agent.lastName}`;
            if (!agentTat[name]) agentTat[name] = [];
            agentTat[name].push(tat);
          }
        }
      }

      const boarding = getDuration(f.milestones['INICIO EMBARQUE'], f.milestones['FIN EMBARQUE']);
      if (boarding !== null) {
        totalBoarding += boarding;
        boardingCount++;
        if (boarding < minBoarding) { minBoarding = boarding; minBoardingFlight = flightName; }
        if (boarding > maxBoarding) { maxBoarding = boarding; maxBoardingFlight = flightName; }

        const embId = assignments[f.id]?.[0];
        if (embId) {
          const agent = agents.find(a => a.id === embId);
          if (agent) {
            const name = `${agent.name} ${agent.lastName}`;
            if (!agentBoarding[name]) agentBoarding[name] = [];
            agentBoarding[name].push(boarding);
          }
        }
      }

      const cleaning = getDuration(f.milestones['INICIO LIMPIEZA'], f.milestones['FIN LIMPIEZA']);
      if (cleaning !== null) {
        totalCleaning += cleaning;
        cleaningCount++;
        if (cleaning < minCleaning) { minCleaning = cleaning; minCleaningFlight = flightName; }
        if (cleaning > maxCleaning) { maxCleaning = cleaning; maxCleaningFlight = flightName; }
      }

      const catering = getDuration(f.milestones['INICIO CATERING'], f.milestones['FIN CATERING']);
      if (catering !== null) {
        totalCatering += catering;
        cateringCount++;
      }

      if (f.milestones['BÚSQUEDA EQUIPAJE']) {
        baggageSearches++;
      }

      const inTime = f.inBlock || f.milestones['IN'];
      const losa = getDuration(inTime, f.etdReal || f.etd);
      if (losa !== null) {
        totalLosa += losa;
        losaCount++;
        if (losa < minLosa) { minLosa = losa; minLosaFlight = flightName; }
        if (losa > maxLosa) { maxLosa = losa; maxLosaFlight = flightName; }
      }

      const delay = getDuration(f.etd, f.etdReal || f.milestones['OUT']);
      if (delay !== null && delay > 0) {
        totalDelay += delay;
        delayCount++;
        if (delay > maxDelay) { maxDelay = delay; maxDelayFlight = flightName; }
      }
    });

    let bestCot = 'N/A';
    let bestCotTat = Infinity;
    Object.entries(agentTat).forEach(([name, tats]) => {
      const avg = tats.reduce((a, b) => a + b, 0) / tats.length;
      if (avg < bestCotTat) { bestCotTat = avg; bestCot = name; }
    });

    let bestEmb = 'N/A';
    let bestEmbTime = Infinity;
    Object.entries(agentBoarding).forEach(([name, times]) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      if (avg < bestEmbTime) { bestEmbTime = avg; bestEmb = name; }
    });

    const getMostFrequent = (counts: Record<string, number>) => {
      let max = 0;
      let res = 'N/A';
      Object.entries(counts).forEach(([k, v]) => {
        if (v > max) { max = v; res = k; }
      });
      return res;
    };

    return {
      totalFlights: filteredFlights.length,
      otp: filteredFlights.length ? Math.round((onTimeFlights / filteredFlights.length) * 100) : 0,
      avgTat: tatCount ? Math.round(totalTat / tatCount) : 0,
      minTat: minTat === Infinity ? 0 : minTat,
      minTatFlight,
      maxTat: maxTat === -Infinity ? 0 : maxTat,
      maxTatFlight,
      avgBoarding: boardingCount ? Math.round(totalBoarding / boardingCount) : 0,
      minBoarding: minBoarding === Infinity ? 0 : minBoarding,
      minBoardingFlight,
      maxBoarding: maxBoarding === -Infinity ? 0 : maxBoarding,
      maxBoardingFlight,
      avgCleaning: cleaningCount ? Math.round(totalCleaning / cleaningCount) : 0,
      minCleaning: minCleaning === Infinity ? 0 : minCleaning,
      minCleaningFlight,
      maxCleaning: maxCleaning === -Infinity ? 0 : maxCleaning,
      maxCleaningFlight,
      avgCatering: cateringCount ? Math.round(totalCatering / cateringCount) : 0,
      baggageSearches,
      avgLosa: losaCount ? Math.round(totalLosa / losaCount) : 0,
      minLosa: minLosa === Infinity ? 0 : minLosa,
      minLosaFlight,
      maxLosa: maxLosa === -Infinity ? 0 : maxLosa,
      maxLosaFlight,
      avgDelay: delayCount ? Math.round(totalDelay / delayCount) : 0,
      maxDelay: maxDelay === -Infinity ? 0 : maxDelay,
      maxDelayFlight,
      bestCot,
      bestCotTat: bestCotTat === Infinity ? 0 : Math.round(bestCotTat),
      bestEmb,
      bestEmbTime: bestEmbTime === Infinity ? 0 : Math.round(bestEmbTime),
      topRoute: getMostFrequent(routeCounts),
      topType: getMostFrequent(typeCounts),
      topAirport: getMostFrequent(airportCounts),
      delayedFlights,
      onTimeFlights,
      departedFlights,
      tatChartData
    };
  }, [filteredFlights, assignments, agents]);

  const statusData = [
    { name: 'A Tiempo', value: kpis.onTimeFlights, color: '#10b981' },
    { name: 'Retrasados', value: kpis.delayedFlights, color: '#ef4444' },
    { name: 'Salidos', value: kpis.departedFlights, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#1b2e91] tracking-tighter">Módulo de KPIs</h2>
          <p className="text-sm font-bold text-[#5e6e89] uppercase tracking-widest opacity-60">Análisis Exagerado de Rendimiento</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select 
            className="bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            value={filterType} onChange={e => setFilterType(e.target.value)}
          >
            <option value="All">Todos los Aviones</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          
          <select 
            className="bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            value={filterAirport} onChange={e => setFilterAirport(e.target.value)}
          >
            <option value="All">Todos los Aeropuertos</option>
            {uniqueAirports.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select 
            className="bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            value={filterRoute} onChange={e => setFilterRoute(e.target.value)}
          >
            <option value="All">Todas las Rutas</option>
            {uniqueRoutes.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select 
            className="bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
            value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
          >
            <option value="All">Todos los Agentes</option>
            {uniqueAgents.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* General */}
        <KpiCard title="Total Vuelos" value={kpis.totalFlights} icon="fa-plane" color="blue" />
        <KpiCard title="Puntualidad (OTP)" value={`${kpis.otp}%`} icon="fa-clock" color="green" />
        <KpiCard title="Vuelos a Tiempo" value={kpis.onTimeFlights} icon="fa-check-circle" color="green" />
        <KpiCard title="Vuelos Retrasados" value={kpis.delayedFlights} icon="fa-exclamation-circle" color="red" />
        <KpiCard title="Vuelos Salidos" value={kpis.departedFlights} icon="fa-plane-departure" color="indigo" />
        
        {/* TAT */}
        <KpiCard title="TAT Promedio" value={`${kpis.avgTat}m`} icon="fa-stopwatch" color="purple" />
        <KpiCard title="TAT Más Rápido" value={`${kpis.minTat}m`} subtitle={`Vuelo: ${kpis.minTatFlight}`} icon="fa-bolt" color="green" />
        <KpiCard title="TAT Más Lento" value={`${kpis.maxTat}m`} subtitle={`Vuelo: ${kpis.maxTatFlight}`} icon="fa-turtle" color="red" />
        
        {/* Embarque */}
        <KpiCard title="Embarque Promedio" value={`${kpis.avgBoarding}m`} icon="fa-users" color="orange" />
        <KpiCard title="Embarque Más Rápido" value={`${kpis.minBoarding}m`} subtitle={`Vuelo: ${kpis.minBoardingFlight}`} icon="fa-person-running" color="green" />
        <KpiCard title="Embarque Más Lento" value={`${kpis.maxBoarding}m`} subtitle={`Vuelo: ${kpis.maxBoardingFlight}`} icon="fa-person-walking" color="red" />
        
        {/* Limpieza */}
        <KpiCard title="Limpieza Promedio" value={`${kpis.avgCleaning}m`} icon="fa-broom" color="teal" />
        <KpiCard title="Limpieza Más Rápida" value={`${kpis.minCleaning}m`} subtitle={`Vuelo: ${kpis.minCleaningFlight}`} icon="fa-sparkles" color="green" />
        <KpiCard title="Limpieza Más Lenta" value={`${kpis.maxCleaning}m`} subtitle={`Vuelo: ${kpis.maxCleaningFlight}`} icon="fa-trash" color="red" />
        
        {/* Otros Tiempos */}
        <KpiCard title="Catering Promedio" value={`${kpis.avgCatering}m`} icon="fa-utensils" color="pink" />
        <KpiCard title="Búsquedas Equipaje" value={kpis.baggageSearches} icon="fa-suitcase" color="red" />
        
        {/* Losa Real */}
        <KpiCard title="Losa Real Promedio" value={`${kpis.avgLosa}m`} icon="fa-road" color="indigo" />
        <KpiCard title="Losa Más Corta" value={`${kpis.minLosa}m`} subtitle={`Vuelo: ${kpis.minLosaFlight}`} icon="fa-compress" color="green" />
        <KpiCard title="Losa Más Larga" value={`${kpis.maxLosa}m`} subtitle={`Vuelo: ${kpis.maxLosaFlight}`} icon="fa-expand" color="red" />
        
        {/* Retrasos */}
        <KpiCard title="Retraso Promedio" value={`${kpis.avgDelay}m`} icon="fa-hourglass-half" color="orange" />
        <KpiCard title="Mayor Retraso" value={`${kpis.maxDelay}m`} subtitle={`Vuelo: ${kpis.maxDelayFlight}`} icon="fa-triangle-exclamation" color="red" />
        
        {/* Agentes */}
        <KpiCard title="Mejor Agente COT" value={kpis.bestCot} subtitle={`TAT Promedio: ${kpis.bestCotTat}m`} icon="fa-user-tie" color="blue" />
        <KpiCard title="Mejor Ag. Embarque" value={kpis.bestEmb} subtitle={`Emb Promedio: ${kpis.bestEmbTime}m`} icon="fa-user-check" color="blue" />
        
        {/* Frecuencias */}
        <KpiCard title="Ruta Frecuente" value={kpis.topRoute} icon="fa-route" color="purple" />
        <KpiCard title="Equipo Frecuente" value={kpis.topType} icon="fa-plane" color="teal" />
        <KpiCard title="Aeropuerto Ppal" value={kpis.topAirport} icon="fa-building" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Distribución de TAT por Vuelo (mins)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.tatChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="TAT" fill="#1b2e91" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Estado de Vuelos</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm font-bold">Sin datos suficientes</p>
            )}
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIs;
