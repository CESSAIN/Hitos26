
import React, { useState, useEffect } from 'react';
import { BusinessRule } from '../types';
import { SCRIPT_WEB_APP_URL } from '../App';

const INITIAL_RULES: BusinessRule[] = [
  { id: 'UX1', category: 'General', text: 'IDENTIDAD VISUAL: Se establece el uso obligatorio de la paleta LATAM: Navy (#1b2e91), Pink/Red (#eb0045) y fondo corporativo (#f3f6f9).' },
  { id: 'UX2', category: 'General', text: 'TIPOGRAFÍA: Uso de fuente Inter con pesos bold/black para datos críticos y regular para etiquetas. Escala tipográfica compacta pero legible.' },
  { id: 'UX3', category: 'General', text: 'COMPONENTES: Los botones de acción principal siempre deben ser Magenta/Pink con sombra difuminada y bordes redondeados de 16px-24px.' },
  { id: 'G1', category: 'Gantt', text: 'Los hitos teóricos son traídos desde el Google Sheets y no se pueden editar desde la aplicación.' },
  { id: 'G2', category: 'Gantt', text: 'La vista de itinerario en operación debe seguir el flujo vertical conectado por una línea de tiempo (estilo app corporativa).' },
  { id: 'O1', category: 'Operaciones', text: 'El cálculo de Losa Real se basa estrictamente en la diferencia entre ETD_Real (DP) e IN-BLOCK (DQ).' }
];

const Reglas: React.FC = () => {
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [activeCategory, setActiveCategory] = useState<BusinessRule['category']>('Gantt');

  useEffect(() => {
    const saved = localStorage.getItem('cch_business_rules');
    if (saved) {
      setRules(JSON.parse(saved));
    } else {
      setRules(INITIAL_RULES);
    }
  }, []);

  const filteredRules = rules.filter(r => r.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-20">
      <div>
        <h2 className="text-4xl font-black text-[#16163f] tracking-tighter uppercase leading-none">Reglas y Estándares</h2>
        <p className="text-sm text-gray-500 font-bold mt-4 italic">Protocolos de operación y diseño de la interfaz</p>
      </div>

      <div className="flex space-x-3 bg-white p-2 rounded-full border border-gray-100 w-fit shadow-sm">
        {(['General', 'Gantt', 'Operaciones'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeCategory === cat ? 'bg-[#16163f] text-white shadow-md' : 'text-gray-400 hover:text-[#16163f]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredRules.map((rule, index) => (
          <div key={rule.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex items-start space-x-6 hover:shadow-xl transition-all">
            <div className="w-12 h-12 bg-[#16163f]/5 rounded-2xl flex items-center justify-center text-[#16163f] font-black text-xl shrink-0">
              {index + 1}
            </div>
            <div className="pt-1">
              <p className="text-[#16163f] font-bold leading-relaxed text-sm">{rule.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reglas;
