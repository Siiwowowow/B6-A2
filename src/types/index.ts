import { Request } from 'express';

export type UserRole      = 'admin' | 'customer';
export type VehicleType   = 'car' | 'bike' | 'van' | 'SUV';
export type VehicleStatus = 'available' | 'booked';
export type BookingStatus = 'active' | 'cancelled' | 'returned';

export interface IUser {
  id:         number;
  name:       string;
  email:      string;
  password:   string;
  phone:      string;
  role:       UserRole;
  created_at?: Date;
}

export interface IVehicle {
  id:                  number;
  vehicle_name:        string;
  type:                VehicleType;
  registration_number: string;
  daily_rent_price:    number;
  availability_status: VehicleStatus;
  created_at?:         Date;
}

export interface IBooking {
  id:              number;
  customer_id:     number;
  vehicle_id:      number;
  rent_start_date: string;
  rent_end_date:   string;
  total_price:     number;
  status:          BookingStatus;
  created_at?:     Date;
}

export interface JwtPayload {
  userId: number;
  email:  string;
  role:   UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}