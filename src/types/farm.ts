export type FieldUnit = 'Acres' | 'Hectares' | 'Gunthas' | 'Sq. Meters';

export interface FarmDetails {
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  fieldDimension: string;
  fieldUnit: FieldUnit;
  irrigationType: string;
  soilType: string;
  cropGrown: string;
  deviceStatus?: 'Online' | 'Offline' | 'Connecting';
  deviceId?: string;
  soilMoisture?: number;
  timeUntilStressHours?: number;
  confidence?: number;
  configuredAt?: string;
}

export interface CropOption {
  id: string;
  name: string;
  localName: string;
  description: string;
  baseLowCritical: number;
  baseLowWarn: number;
  baseHighWarn: number;
  icon: string;
}

export interface SoilOption {
  id: string;
  name: string;
  localName: string;
  description: string;
  offset: number;
  drainage: string;
  icon: string;
}

export interface IrrigationOption {
  id: string;
  name: string;
  localName: string;
  description: string;
  efficiency: string;
  icon: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'critical' | 'warning' | 'info';
  read: boolean;
}
