export interface User {
  nickname: string;
  phone: string;
  avatar: string;
}

export interface Pet {
  name: string;
  breed: string;
  weight: string;
  vaccine: string;
  certificate: string;
  avatar: string;
}

export interface LegacyOrder {
  id: string;
  title: string;
  desc: string;
  tab: 'pending' | 'booked' | 'done' | 'cancelled';
  type: 'ride' | 'buddy' | 'idle';
  time?: string;
}

export type Order = LegacyOrder;

export interface IdleApplication {
  status: 'not_applied' | 'pending' | 'approved';
  permissions: string[];
  area: string;
  intro: string;
}

export interface AppState {
  district: string;
  pickup: string;
  destination: string;
  user: User;
  pets: Pet[];
  bookedRoutes: string[];
  bookedBuddies: number[];
  orders: LegacyOrder[];
  favorites: string[];
  idleApplication: IdleApplication;
}
