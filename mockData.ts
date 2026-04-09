
import { Flight, Agent, UserRole } from './types';

export const MOCK_AGENTS: Agent[] = [
  { id: '1', name: 'Carlos', lastName: 'Essain', role: UserRole.ADMIN, function: 'Supervisor', base: 'EZE' },
  { id: '2', name: 'Maria', lastName: 'Gomez', role: UserRole.SUPERVISOR, function: 'Embarque', base: 'AEP' },
  { id: '3', name: 'Juan', lastName: 'Perez', role: UserRole.AGENT, function: 'COT', base: 'EZE' },
  { id: '4', name: 'Ana', lastName: 'Lopez', role: UserRole.AGENT, function: 'Embarque', base: 'SCL' },
];

export const MOCK_FLIGHTS: Flight[] = [
  {
    id: 'LA1234',
    number: 'LA1234',
    // Added missing properties to satisfy Flight interface
    vueloArribo: 'LA1234',
    vueloSalida: 'LA1234',
    fechaArribo: '2024-10-27',
    fechaSalida: '2024-10-27',
    origin: 'SCL',
    destination: 'EZE',
    eta: '14:30',
    etd: '15:20',
    registration: 'LV-BRB',
    type: 'A320',
    position: '5',
    gate: '12',
    status: 'On Time',
    country: 'Argentina',
    airport: 'EZE',
    milestones: { 'in_vuelo': '14:28' }
  },
  {
    id: 'LA1235',
    number: 'LA1235',
    // Added missing properties to satisfy Flight interface
    vueloArribo: 'LA1235',
    vueloSalida: 'LA1235',
    fechaArribo: '2024-10-27',
    fechaSalida: '2024-10-27',
    origin: 'EZE',
    destination: 'SCL',
    eta: '16:00',
    etd: '17:00',
    registration: 'LV-BRC',
    type: 'B787',
    position: '8',
    gate: '15',
    status: 'Scheduled',
    country: 'Argentina',
    airport: 'EZE',
    milestones: {}
  },
  {
    id: 'LA2420',
    number: 'LA2420',
    // Added missing properties to satisfy Flight interface
    vueloArribo: 'LA2420',
    vueloSalida: 'LA2420',
    fechaArribo: '2024-10-27',
    fechaSalida: '2024-10-27',
    origin: 'LIM',
    destination: 'MVD',
    eta: '18:20',
    etd: '19:15',
    registration: 'CC-BAZ',
    type: 'A321',
    position: '3',
    gate: '4',
    status: 'Scheduled',
    country: 'Uruguay',
    airport: 'MVD',
    milestones: {}
  }
];
