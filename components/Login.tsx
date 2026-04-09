
import React, { useState } from 'react';
import { Agent } from '../types';

interface LoginProps {
  agents: Agent[];
  onLogin: (agent: Agent) => void;
}

const Login: React.FC<LoginProps> = ({ agents, onLogin }) => {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedAgent) {
      if (selectedAgent.password && selectedAgent.password !== password) {
        setError('Contraseña incorrecta');
        return;
      }
      onLogin(selectedAgent);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1b2e91] px-4 relative overflow-hidden">
      {/* Círculos decorativos sutiles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full"></div>
      
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 space-y-10 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-[#eb0045] rounded-2xl flex items-center justify-center text-white text-3xl font-black rotate-3 shadow-lg">
              CCH
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-[#1b2e91] tracking-tight">Centro Control Hitos</h2>
          <p className="mt-3 text-sm text-[#5e6e89] font-medium">Inicie sesión para gestionar la operación</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="agent" className="block text-xs font-bold text-[#1b2e91] uppercase tracking-widest mb-3 ml-1">
              Usuario de Base
            </label>
            <div className="relative">
              <select
                id="agent"
                value={selectedAgentId}
                onChange={(e) => {
                  setSelectedAgentId(e.target.value);
                  setPassword('');
                  setError('');
                }}
                className="block w-full px-5 py-4 border-2 border-[#f3f6f9] bg-[#f8fafc] rounded-2xl text-[#1b2e91] font-bold appearance-none focus:border-[#1b2e91] focus:ring-0 transition-all outline-none"
                required
              >
                <option value="">Seleccione su nombre...</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name} {a.lastName} ({a.function})</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#1b2e91]">
                <i className="fa-solid fa-chevron-down"></i>
              </div>
            </div>
          </div>

          {selectedAgent?.password && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label htmlFor="password" className="block text-xs font-bold text-[#1b2e91] uppercase tracking-widest mb-3 ml-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-5 py-4 border-2 border-[#f3f6f9] bg-[#f8fafc] rounded-2xl text-[#1b2e91] font-bold focus:border-[#1b2e91] focus:ring-0 transition-all outline-none"
                placeholder="Ingrese su contraseña"
                required
              />
              {error && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{error}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedAgentId}
            className="w-full bg-[#eb0045] hover:bg-[#c4003a] text-white py-4 px-6 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none mt-4"
          >
            Ingresar al Sistema
          </button>
        </form>
        
        <div className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
          LATAM Airlines Group • 2024
        </div>
      </div>
    </div>
  );
};

export default Login;
