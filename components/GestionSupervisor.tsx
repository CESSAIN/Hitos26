
import React, { useState } from 'react';
import { Agent, Flight, FunctionType } from '../types';

interface GestionSupervisorProps {
  agents: Agent[];
  flights: Flight[];
  assignments: Record<string, Record<string, string>>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>;
  personalList?: string[];
}

const GestionSupervisor: React.FC<GestionSupervisorProps> = ({ agents, flights, assignments, setAssignments, personalList = [] }) => {

  const taskTypes: FunctionType[] = ['Embarque', 'Embarque', 'Ventas', 'Arribos', 'COT', 'COT', 'Supervisor'];
  const taskLabels = ['Sobre el ala 1', 'Sobre el ala 2', 'Ventas', 'Arribos', 'Bajo el ala (COT)', 'Bajo el ala (Arribo)', 'Supervisor Rampa'];

  const handleAssign = (flightId: string, taskIndex: number, agentId: string) => {
    setAssignments(prev => ({
      ...prev,
      [flightId]: {
        ...(prev[flightId] || {}),
        [taskIndex]: agentId
      }
    }));
  };

  const displayAgentsCount = personalList.length > 0 ? personalList.length : agents.length;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#16163f]">Gestión de Personal</h2>
          <p className="text-sm text-gray-500">Asignación de tareas y programación por vuelo</p>
        </div>
        <div className="bg-[#16163f]/5 px-4 py-2 rounded-lg border border-[#16163f]/10">
          <span className="text-sm font-bold text-[#16163f]">Personal Disponible: {displayAgentsCount}</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#16163f]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider sticky left-0 bg-[#16163f] z-10">Vuelo / Datos</th>
              {taskLabels.map((label, i) => (
                <th key={i} className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[180px]">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flights.map(flight => (
              <tr key={flight.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-100">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#16163f]">{flight.number}</span>
                    <span className="text-[10px] text-gray-500">{flight.registration} • {flight.destination}</span>
                    <span className="text-[10px] bg-[#e0296c]/10 text-[#e0296c] px-1 rounded inline-block mt-1 w-fit font-bold">{flight.etd}</span>
                  </div>
                </td>
                {taskTypes.map((taskType, i) => (
                  <td key={i} className="px-4 py-4 whitespace-nowrap">
                    <select
                      value={assignments[flight.id]?.[i] || ""}
                      onChange={(e) => handleAssign(flight.id, i, e.target.value)}
                      className={`w-full text-xs font-medium border-2 rounded-lg p-2 focus:ring-[#e0296c] transition-colors outline-none ${
                        assignments[flight.id]?.[i] ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-dashed border-gray-300 bg-white text-gray-400'
                      }`}
                    >
                      <option value="">Sin asignar</option>
                      {agents.length > 0 ? (
                        agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>{agent.name} {agent.lastName}</option>
                        ))
                      ) : (
                        <option value="" disabled>No hay agentes</option>
                      )}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-3 cursor-pointer hover:border-[#16163f] transition-colors group">
          <div className="p-3 bg-[#16163f]/10 text-[#16163f] rounded-full group-hover:bg-[#16163f] group-hover:text-white transition-colors">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Horarios Hoy</p>
            <p className="text-sm font-bold text-[#16163f]">Ver Planificación <i className="fa-solid fa-external-link ml-1 text-xs"></i></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionSupervisor;
