import { Request, Response } from 'express';
import * as VehiclesService from './vehicles.service';
import { sendSuccess, sendError } from '../../utils/response.util';

export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = req.body;

    if (!vehicle_name || !type || !registration_number || !daily_rent_price) {
      sendError(res, 'vehicle_name, type, registration_number and daily_rent_price are required.', 400);
      return;
    }

    const validTypes = ['car', 'bike', 'van', 'SUV'];
    if (!validTypes.includes(type)) {
      sendError(res, `type must be one of: ${validTypes.join(', ')}.`, 400);
      return;
    }

    const vehicle = await VehiclesService.createVehicle({
      vehicle_name, type, registration_number,
      daily_rent_price: Number(daily_rent_price),
      availability_status,
    });
    sendSuccess(res, 'Vehicle created successfully.', vehicle, 201);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create vehicle.', err.status || 500);
  }
};

export const getAllVehicles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await VehiclesService.getAllVehicles();
    sendSuccess(res, 'Vehicles retrieved successfully.', vehicles);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch vehicles.', err.status || 500);
  }
};

export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await VehiclesService.getVehicleById(Number(req.params.vehicleId));
    sendSuccess(res, 'Vehicle retrieved successfully.', vehicle);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch vehicle.', err.status || 500);
  }
};

export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await VehiclesService.updateVehicle(Number(req.params.vehicleId), req.body);
    sendSuccess(res, 'Vehicle updated successfully.', updated);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update vehicle.', err.status || 500);
  }
};

export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    await VehiclesService.deleteVehicle(Number(req.params.vehicleId));
    sendSuccess(res, 'Vehicle deleted successfully.', null);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete vehicle.', err.status || 500);
  }
};