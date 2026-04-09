
import { MilestoneDefinition } from './types';

export interface MilestoneMeta extends MilestoneDefinition {
  isTheoretical?: boolean;
  sheetColumn?: string;
  process?: string;
  boundary?: 'start' | 'end';
}

export const MILESTONES: MilestoneMeta[] = [
  // Hitos de Posición y Puerta
  { key: 'POS', label: 'Posición', roles: ['COT', 'Supervisor'], color: '#64748b', sheetColumn: 'O' },
  { key: 'GATE', label: 'Puerta', roles: ['COT', 'Supervisor'], color: '#64748b', sheetColumn: 'P' },

  // Hito Crítico DQ -> AB
  { key: 'ETD REAL', label: 'ETD Real', roles: ['COT', 'Supervisor'], color: '#f59e0b', sheetColumn: 'AA' },
  { key: 'IN', label: 'IN (In-Block)', roles: ['COT', 'Arribos'], color: '#ef4444', sheetColumn: 'AB' },

  // Bloque 1: Desembarque y Limpieza
  { key: 'APERTURA PUERTA TEORICO', label: 'Apertura Puerta Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AE' },
  { key: 'APERTURA PUERTA', label: 'Apertura Puerta', roles: ['COT', 'Arribos'], color: '#3b82f6', sheetColumn: 'AF' },
  
  { key: 'DESEMBARQUE TEORICO', label: 'Desembarque Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AG' },
  { key: 'DESEMBARQUE', label: 'Inicio Desembarque', roles: ['Arribos'], color: '#3b82f6', sheetColumn: 'AH', process: 'desembarque', boundary: 'start' },
  { key: 'FIN DESEMBARQUE TEORICO', label: 'Fin Desembarque Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AI' },
  { key: 'FIN DESEMBARQUE', label: 'Fin Desembarque', roles: ['Arribos'], color: '#3b82f6', sheetColumn: 'AJ', process: 'desembarque', boundary: 'end' },
  
  { key: 'IN LIMPIEZA TEORICO', label: 'In Limpieza Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AK' },
  { key: 'IN LIMPIEZA', label: 'Inicio Limpieza', roles: ['Limpieza', 'Supervisor'], color: '#8b5cf6', sheetColumn: 'AL', process: 'limpieza', boundary: 'start' },
  { key: 'FIN LIMPIEZA TEORICO', label: 'Fin Limpieza Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AM' },
  { key: 'FIN LIMPIEZA', label: 'Fin Limpieza', roles: ['Limpieza', 'Supervisor'], color: '#8b5cf6', sheetColumn: 'AN', process: 'limpieza', boundary: 'end' },

  // Bloque 2: Embarque y Puerta
  { key: 'INICIO EMBARQUE TEORICO', label: 'Inicio Embarque Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AO' },
  { key: 'INICIO EMBARQUE', label: 'Inicio Embarque', roles: ['Embarque', 'Supervisor'], color: '#ec4899', sheetColumn: 'AP', process: 'embarque', boundary: 'start' },
  { key: 'FIN EMBARQUE TEORICO', label: 'Fin Embarque Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AQ' },
  { key: 'FIN EMBARQUE', label: 'Fin Embarque', roles: ['Embarque', 'Supervisor'], color: '#ec4899', sheetColumn: 'AR', process: 'embarque', boundary: 'end' },
  { key: 'CIERRE PUERTA TEORICO', label: 'Cierre Puerta Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AS' },
  { key: 'CIERRE PUERTA', label: 'Cierre Puerta', roles: ['Embarque', 'COT'], color: '#f43f5e', sheetColumn: 'AT' },
  
  // Bloque 3: Rampa y Fuel
  { key: 'CALZA REAL', label: 'Calza Real', roles: ['COT'], color: '#10b981', sheetColumn: 'AU' },
  { key: 'APERTURA BODEGAS TEORICO', label: 'Apertura Bodegas Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AV' },
  { key: 'APERTURA BODEGAS', label: 'Apertura Bodegas', roles: ['COT'], color: '#14b8a6', sheetColumn: 'AW' },
  { key: 'INICIO FUEL TEORICO', label: 'Inicio Fuel Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AX' },
  { key: 'INICIO FUEL', label: 'Inicio Fuel', roles: ['COT'], color: '#14b8a6', sheetColumn: 'AY', process: 'fuel', boundary: 'start' },
  { key: 'FIN FUEL TEORICO', label: 'Fin Fuel Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'AZ' },
  { key: 'FIN FUEL', label: 'Fin Fuel', roles: ['COT'], color: '#14b8a6', sheetColumn: 'BA', process: 'fuel', boundary: 'end' },

  // Bloque 4: Carguio y Equipaje
  { key: 'INICIO CARGUIO TEORICO', label: 'Inicio Carguio Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'BB' },
  { key: 'INICIO CARGUIO', label: 'Inicio Carguio', roles: ['COT'], color: '#f59e0b', sheetColumn: 'BC', process: 'carguio', boundary: 'start' },
  { key: 'FIN CARGUIO TEORICO', label: 'Fin Carguio Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'BD' },
  { key: 'FIN CARGUIO', label: 'Fin Carguio', roles: ['COT'], color: '#f59e0b', sheetColumn: 'BE', process: 'carguio', boundary: 'end' },
  
  { key: 'BÚSQUEDA EQUIPAJE TEORICO', label: 'Búsqueda Equipaje Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'BF' },
  { key: 'BÚSQUEDA EQUIPAJE', label: 'Inicio Búsqueda Equipaje', roles: ['Embarque', 'COT'], color: '#6366f1', sheetColumn: 'BG', process: 'busqueda', boundary: 'start' },
  { key: 'FIN BÚSQUEDA EQUIPAJE TEORICO', label: 'Fin Búsqueda Equipaje Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'BH' },
  { key: 'FIN BÚSQUEDA EQUIPAJE', label: 'Fin Búsqueda Equipaje', roles: ['Embarque', 'COT'], color: '#6366f1', sheetColumn: 'BI', process: 'busqueda', boundary: 'end' },

  { key: 'RAMP CLEARENCE TEORICO', label: 'Ramp Clearence Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'BJ' },
  { key: 'RAMP CLEARENCE', label: 'Ramp Clearence', roles: ['COT', 'Supervisor'], color: '#0ea5e9', sheetColumn: 'BK' },
  { key: 'CIERRE BODEGA TEORICO', label: 'Cierre Bodega Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'BL' },
  { key: 'CIERRE BODEGA', label: 'Cierre Bodega', roles: ['COT'], color: '#0ea5e9', sheetColumn: 'BM' },
  { key: 'PUSH BACK TEORICO', label: 'Push Back Teorico', roles: [], color: '#94a3b8', isTheoretical: true, sheetColumn: 'BN' },
  { key: 'PUSH BACK', label: 'Push Back', roles: ['COT', 'Supervisor'], color: '#111827', sheetColumn: 'BO' },
];

export const COUNTRIES = ['Argentina', 'Bolivia', 'Uruguay', 'Paraguay', 'Venezuela', 'Cuba'];

export const COUNTRY_AIRPORTS: Record<string, string[]> = {
  'Argentina': ['EZE', 'AEP', 'ROS', 'SLA', 'TUC', 'NQN', 'BRC', 'RGL', 'USH', 'MDZ', 'COR', 'IGR', 'FTE', 'REL', 'CRD'],
  'Uruguay': ['PDP', 'MVD'],
  'Paraguay': ['ASU'],
  'Bolivia': ['LPB', 'VVI'],
  'Venezuela': ['CCS']
};
