import React from 'react';
import { Agent, UserRole } from '../types';

interface BottomNavProps {
  user: Agent;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ user, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'hitos', label: 'HITOS', icon: 'fa-plane' },
    { id: 'gantt', label: 'GANTT', icon: 'fa-clock' }, // Or fa-chart-pie, but image shows a clock with a notification
    { id: 'gestion', label: 'GESTIÓN', icon: 'fa-users', level: UserRole.SUPERVISOR },
    { id: 'panel', label: 'PANEL', icon: 'fa-satellite-dish' },
    { id: 'kpis', label: 'KPIS', icon: 'fa-chart-simple' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto flex justify-around items-center px-2 py-2">
        {tabs.map(tab => (
          (!tab.level || user.role <= tab.level) && (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-16 h-14 relative transition-colors ${
                activeTab === tab.id ? 'text-[#1b2e91]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {/* Top indicator line for active tab */}
              {activeTab === tab.id && (
                <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-8 h-1 bg-[#1b2e91] rounded-b-full"></div>
              )}
              
              <div className="relative mb-1">
                <i className={`fa-solid ${tab.icon} text-xl ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`}></i>
                {/* Example notification badge for GANTT as seen in the image */}
                {tab.id === 'gantt' && (
                  <div className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    3
                  </div>
                )}
              </div>
              <span className="text-[9px] font-black tracking-wider uppercase">{tab.label}</span>
            </button>
          )
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
