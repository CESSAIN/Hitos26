
export enum UserRole {
  ADMIN = 1,
  SUPERVISOR = 2,
  AGENT = 3
}

export type FunctionType = 'COT' | 'Embarque' | 'Supervisor' | 'Limpieza' | 'Catering' | 'Ventas' | 'Arribos';

export interface Agent {
  id: string;
  name: string;
  lastName: string;
  role: UserRole;
  function: FunctionType;
  base: string;
  password?: string;
}

export interface Flight {
  id: string;
  number: string;
  vueloArribo: string;
  vueloSalida: string;
  fechaArribo: string;
  fechaSalida: string;
  origin: string;
  destination: string;
  eta: string;
  etd: string;
  registration: string;
  type: string;
  position: string;
  gate: string;
  status: 'Scheduled' | 'On Time' | 'Delayed' | 'Departed' | 'Arrived';
  country: string;
  airport: string;
  milestones: Record<string, string>;
  tatTeorico?: string;
  etdReal?: string;
  inBlock?: string;
  rawFechaArribo?: string;
  rawFechaSalida?: string;
}

export interface MilestoneDefinition {
  key: string;
  label: string;
  roles: FunctionType[];
  color: string;
}

export interface BusinessRule {
  id: string;
  category: 'Gantt' | 'Operaciones' | 'General';
  text: string;
}
