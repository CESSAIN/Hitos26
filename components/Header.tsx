
import React, { useState, useMemo } from 'react';
import { Agent, UserRole, Flight } from '../types';
import { COUNTRIES } from '../constants';

interface HeaderProps {
  user: Agent;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  dateFilter: 'all' | 'specific';
  setDateFilter: (filter: 'all' | 'specific') => void;
  flights: Flight[];
  countryFilter: string;
  setCountryFilter: (country: string) => void;
  airportFilter: string;
  setAirportFilter: (airport: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout,
  selectedDate,
  setSelectedDate,
  dateFilter,
  setDateFilter,
  flights,
  countryFilter,
  setCountryFilter,
  airportFilter,
  setAirportFilter
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const todayDate = new Date(now.getTime() - offset);
  
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const handleQuickDate = (type: 'yesterday' | 'today' | 'tomorrow') => {
    setDateFilter('specific');
    if (type === 'yesterday') setSelectedDate(formatDate(yesterdayDate));
    if (type === 'today') setSelectedDate(formatDate(todayDate));
    if (type === 'tomorrow') setSelectedDate(formatDate(tomorrowDate));
  };

  const countries = useMemo(() => {
    const c = new Set(flights.map(f => f.country).filter(Boolean));
    return Array.from(c).sort();
  }, [flights]);

  const availableAirports = useMemo(() => {
    const airports = flights
      .filter(f => !countryFilter || f.country === countryFilter)
      .map(f => f.airport)
      .filter(Boolean);
    return Array.from(new Set(airports)).sort();
  }, [flights, countryFilter]);

  const handleCountryChange = (val: string) => {
    setCountryFilter(val);
    setAirportFilter('');
  };

  return (
    <div className="flex flex-col w-full sticky top-0 z-50 shadow-md">
      {/* Top Profile Bar */}
      <div className="bg-[#1b2e91] text-white px-4 py-3 sm:px-8 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 20px)' }}></div>
        
        <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-3xl font-black tracking-tighter leading-none">CCH</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Centro Control Hitos</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">En Vivo</span>
            </div>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Hamburger Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-b border-slate-200 z-50 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-2">
                <div>
                  <p className="text-sm font-bold text-[#1b2e91]">{user.name} {user.lastName}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user.function} • {user.base}</p>
                </div>
                <button onClick={onLogout} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
              </div>
              
              <button 
                onClick={() => { setActiveTab('reglas'); setIsMenuOpen(false); }}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-colors ${activeTab === 'reglas' ? 'bg-blue-50 text-[#1b2e91]' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'reglas' ? 'bg-[#1b2e91] text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <i className="fa-solid fa-book-open"></i>
                </div>
                <span className="font-bold text-sm">Reglas de Negocio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Date Filter UI */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100 w-full md:w-auto overflow-x-auto">
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-0.5 min-w-max">
              <button 
                onClick={() => handleQuickDate('yesterday')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${dateFilter === 'specific' && selectedDate === formatDate(yesterdayDate) ? 'bg-[#1b2e91] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Ayer
              </button>
              <button 
                onClick={() => handleQuickDate('today')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${dateFilter === 'specific' && selectedDate === formatDate(todayDate) ? 'bg-[#1b2e91] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Hoy
              </button>
              <button 
                onClick={() => handleQuickDate('tomorrow')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${dateFilter === 'specific' && selectedDate === formatDate(tomorrowDate) ? 'bg-[#1b2e91] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Mañana
              </button>
              <button 
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${dateFilter === 'all' ? 'bg-[#1b2e91] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Todos
              </button>
            </div>

            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm hover:border-blue-300 transition-colors group min-w-max">
              <i className="fa-solid fa-calendar-days text-[#1b2e91] text-xs group-hover:scale-110 transition-transform"></i>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateFilter('specific');
                }}
                className="bg-transparent text-[11px] font-black outline-none text-[#1b2e91] cursor-pointer uppercase"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto overflow-x-auto no-scrollbar">
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm hover:border-blue-300 transition-colors min-w-max">
              <i className="fa-solid fa-globe text-[#1b2e91] text-xs"></i>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">País</span>
                <select 
                  value={countryFilter}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="bg-transparent text-[11px] font-black outline-none text-[#1b2e91] cursor-pointer uppercase leading-none"
                >
                  <option value="">Todos los Países</option>
                  {countries.map(c => <option key={c} value={c}>{COUNTRIES[c as keyof typeof COUNTRIES] || c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm hover:border-blue-300 transition-colors min-w-max">
              <i className="fa-solid fa-plane-arrival text-[#1b2e91] text-xs"></i>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Aeropuerto</span>
                <select 
                  value={airportFilter}
                  onChange={(e) => setAirportFilter(e.target.value)}
                  className="bg-transparent text-[11px] font-black outline-none text-[#1b2e91] cursor-pointer uppercase leading-none"
                >
                  <option value="">Todos los Aeropuertos</option>
                  {availableAirports.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
