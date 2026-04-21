import { Request, Response } from 'express';
import * as VehiclesService from './vehicles.service';
import { sendSuccess, sendError } from '../../utils/response.util';

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicle_name, type, registration_number, daily_rent_price } = req.body;

    if (!vehicle_name || !type || !registration_number || daily_rent_price === undefined) {
      return sendError(res, 'Missing required fields.', 400);
    }

    const allowed = ['car', 'bike', 'van', 'SUV'];
    if (!allowed.includes(type)) {
      return sendError(res, 'Invalid vehicle type.', 400);
    }

    const vehicle = await VehiclesService.createVehicle(req.body);

    return sendSuccess(res, 'Vehicle created successfully.', vehicle, 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed.', err.status || 500);
  }
};

export const getAllVehicles = async (_req: Request, res: Response) => {
  try {
    const data = await VehiclesService.getAllVehicles();
    return sendSuccess(res, 'Vehicles retrieved successfully.', data);
  } catch (err: any) {
    return sendError(res, err.message, 500);
  }
};

export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const data = await VehiclesService.getVehicleById(Number(req.params.vehicleId));
    return sendSuccess(res, 'Vehicle retrieved successfully.', data);
  } catch (err: any) {
    return sendError(res, err.message, err.status || 500);
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const data = await VehiclesService.updateVehicle(
      Number(req.params.vehicleId),
      req.body
    );

    return sendSuccess(res, 'Vehicle updated successfully.', data);
  } catch (err: any) {
    return sendError(res, err.message, err.status || 500);
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    await VehiclesService.deleteVehicle(Number(req.params.vehicleId));
    return sendSuccess(res, 'Vehicle deleted successfully.', null);
  } catch (err: any) {
    return sendError(res, err.message, err.status || 500);
  }
};