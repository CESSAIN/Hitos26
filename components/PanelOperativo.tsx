import React, { useState, useMemo } from 'react';
import { Flight } from '../types';
import { MILESTONES, COUNTRY_AIRPORTS } from '../constants';

interface PanelOperativoProps {
  flights: Flight[];
}

const PanelOperativo: React.FC<PanelOperativoProps> = ({ flights }) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const statuses = useMemo(() => Array.from(new Set(flights.map(f => f.status))).filter(Boolean).sort(), [flights]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      return !filterStatus || f.status === filterStatus;
    });
  }, [flights, filterStatus]);

  const sortedFlights = useMemo(() => {
    const sorted = [...filteredFlights];
    if (!sortConfig) return sorted;

    const { key, direction } = sortConfig;
    sorted.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (key) {
        case 'number':
          valA = a.number;
          valB = b.number;
          break;
        case 'ruta':
          valA = a.origin + a.destination;
          valB = b.origin + b.destination;
          break;
        case 'aeronave':
          valA = a.registration;
          valB = b.registration;
          break;
        case 'eta':
          valA = a.eta;
          valB = b.eta;
          break;
        case 'hitos':
          valA = Object.keys(a.milestones).length;
          valB = Object.keys(b.milestones).length;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'fecha':
          valA = a.fechaArribo;
          valB = b.fechaArribo;
          break;
        default:
          return 0;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredFlights, sortConfig]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <i className="fa-solid fa-sort ml-1 text-gray-300"></i>;
    return sortConfig.direction === 'asc' ? 
      <i className="fa-solid fa-sort-up ml-1 text-blue-600"></i> : 
      <i className="fa-solid fa-sort-down ml-1 text-blue-600"></i>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Panel de Operaciones</h2>
            <p className="text-sm text-gray-500">Estado general de la base en tiempo real</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex bg-white border border-gray-300 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <i className="fa-solid fa-table-list mr-1"></i> Tabla
              </button>
              <button 
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <i className="fa-solid fa-grip mr-1"></i> Tarjetas
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Estado</label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                >
                  <option value="">Todos los Estados</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    onClick={() => handleSort('number')}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    Vuelo <SortIcon column="number" />
                  </th>
                  <th 
                    onClick={() => handleSort('fecha')}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    Fecha <SortIcon column="fecha" />
                  </th>
                  <th 
                    onClick={() => handleSort('ruta')}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    Ruta <SortIcon column="ruta" />
                  </th>
                  <th 
                    onClick={() => handleSort('aeronave')}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    Aeronave <SortIcon column="aeronave" />
                  </th>
                  <th 
                    onClick={() => handleSort('eta')}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    ETA/ETD <SortIcon column="eta" />
                  </th>
                  <th 
                    onClick={() => handleSort('hitos')}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    Hitos <SortIcon column="hitos" />
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    Estado <SortIcon column="status" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedFlights.length > 0 ? (
                  sortedFlights.map(flight => (
                    <tr key={flight.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-700">{flight.number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">{flight.fechaArribo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{flight.origin} → {flight.destination}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{flight.registration} ({flight.type})</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{flight.eta}</div>
                        <div className="text-xs text-gray-400 font-medium">Out: {flight.etd}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(Object.keys(flight.milestones).length / MILESTONES.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 mt-1 block">{Object.keys(flight.milestones).length} de {MILESTONES.length} hitos</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                          flight.status?.toUpperCase().includes('HORARIO') || flight.status?.toUpperCase().includes('TIME') ? 'bg-green-100 text-green-700' : 
                          flight.status?.toUpperCase().includes('DEMORA') || flight.status?.toUpperCase().includes('DELAY') ? 'bg-red-100 text-red-700' :
                          flight.status?.toUpperCase().includes('PARTIDO') || flight.status?.toUpperCase().includes('DEPART') ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {flight.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                      No se encontraron vuelos con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFlights.length > 0 ? (
            sortedFlights.map(flight => (
              <div key={flight.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full animate-pulse ${flight.status === 'On Time' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{flight.fechaArribo}</span>
                  </div>
                  <span className="text-lg font-black text-blue-800">{flight.number}</span>
                </div>
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-center text-center">
                    <div>
                      <p className="text-2xl font-bold">{flight.origin}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase">{flight.eta}</p>
                    </div>
                    <div className="flex-1 px-4 flex flex-col items-center">
                      <div className="w-full h-[1px] bg-gray-200 relative">
                        <i className="fa-solid fa-plane absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-200 text-xs"></i>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{flight.destination}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase">{flight.etd}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                    <div>
                      <p className="text-[10px] text-blue-400 font-bold uppercase">Matrícula</p>
                      <p className="font-bold text-blue-900">{flight.registration}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-400 font-bold uppercase">Puerta/Pos</p>
                      <p className="font-bold text-blue-900">{flight.gate} / {flight.position}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">Hitos Operativos</span>
                        <span className="text-xs font-black text-blue-600">{Math.round((Object.keys(flight.milestones).length / MILESTONES.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000" 
                        style={{ width: `${(Object.keys(flight.milestones).length / MILESTONES.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <button className="text-xs font-bold py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                    <i className="fa-solid fa-eye mr-1"></i> Ver Gantt
                  </button>
                  <button className="text-xs font-bold py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    <i className="fa-solid fa-pen-to-square mr-1"></i> Operar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-white rounded-2xl border border-dashed border-gray-300">
              No se encontraron vuelos con los filtros seleccionados
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PanelOperativo;
