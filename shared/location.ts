export type CoordSystem = 'gcj02' | 'wgs84' | 'bd09ll';

export interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
  district?: string;
  adcode?: string;
  coordSystem?: CoordSystem;
}

export interface LocationSnapshot {
  id: string;
  orderId?: string;
  userId?: string;
  lat: number;
  lng: number;
  address?: string;
  coordSystem: CoordSystem;
  createdAt: string;
}
