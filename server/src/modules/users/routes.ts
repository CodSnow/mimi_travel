import { Router } from 'express';
import type { ProviderProfile, UserProfile, VehicleProfile } from '@mimi/shared';

import { getLastPythonUser } from '../auth/routes.js';
import { DomainStore } from '../../services/domain-store.js';
import {
  PythonClient,
  PythonClientError,
  type PythonLoginResponse,
  type PythonProviderProfile,
  type PythonVehicleProfile,
} from '../../services/python-client.js';
import { handleDomainError } from '../../utils/domain-errors.js';

export function createUsersRouter(domainStore: DomainStore, pythonClient: PythonClient): Router {
  const router = Router();

  router.get('/api/users/me', async (_req, res) => {
    const lastPythonUser = getLastPythonUser();
    if (lastPythonUser) return res.json(toUserProfile(lastPythonUser));
    try {
      const user = await domainStore.getCurrentUser();
      return res.json(user);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected user error');
    }
  });

  router.put('/api/users/me', async (req, res) => {
    try {
      const user = await domainStore.updateCurrentUser(req.body || {});
      return res.json(user);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected user error');
    }
  });

  router.get('/api/pets', async (req, res) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : getLastPythonUser()?.id;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    try {
      return res.json({ items: await pythonClient.listPets(userId) });
    } catch (error) {
      return handlePythonOrDomainError(error, res, 'unexpected pet error');
    }
  });

  router.post('/api/pets', async (req, res) => {
    const userId = req.body?.userId || getLastPythonUser()?.id;
    if (!userId || !req.body?.name) return res.status(400).json({ error: 'userId and name are required' });
    try {
      const pet = await pythonClient.createPet({ ...req.body, userId });
      return res.status(201).json(pet);
    } catch (error) {
      return handlePythonOrDomainError(error, res, 'unexpected pet error');
    }
  });

  router.get('/api/addresses', async (req, res) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : getLastPythonUser()?.id;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    try {
      return res.json({ items: await pythonClient.listAddresses(userId) });
    } catch (error) {
      return handlePythonOrDomainError(error, res, 'unexpected address error');
    }
  });

  router.post('/api/addresses', async (req, res) => {
    const userId = req.body?.userId || getLastPythonUser()?.id;
    if (!userId || !req.body?.label || !req.body?.address) {
      return res.status(400).json({ error: 'userId, label and address are required' });
    }
    try {
      const address = await pythonClient.createAddress({ ...req.body, userId });
      return res.status(201).json(address);
    } catch (error) {
      return handlePythonOrDomainError(error, res, 'unexpected address error');
    }
  });

  router.get('/api/providers/:userId', async (req, res) => {
    try {
      const bundle = await pythonClient.getProvider(req.params.userId);
      return res.json({
        user: toUserProfile(bundle.user),
        provider: toProviderProfile(bundle.provider),
        vehicles: bundle.vehicles.map(toVehicleProfile),
      });
    } catch (error) {
      if (error instanceof PythonClientError && error.statusCode === 503) {
        try {
          const bundle = await domainStore.getProvider(req.params.userId);
          if (!bundle.provider) return res.status(404).json({ error: 'provider not found' });
          return res.json(bundle);
        } catch (fallbackError) {
          return handleDomainError(fallbackError, res, 'unexpected provider error');
        }
      }
      return handlePythonOrDomainError(error, res, 'unexpected provider error');
    }
  });

  router.get('/api/providers', async (req, res) => {
    const query = {
      serviceType: typeof req.query.serviceType === 'string' ? req.query.serviceType : undefined,
      district: typeof req.query.district === 'string' ? req.query.district : undefined,
    };
    try {
      const providers = await pythonClient.listProviders(query);
      return res.json({ items: providers.items.map(toProviderProfile) });
    } catch (error) {
      if (error instanceof PythonClientError && error.statusCode === 503) {
        try {
          const providers = await domainStore.listProviders(query);
          return res.json({ items: providers });
        } catch (fallbackError) {
          return handleDomainError(fallbackError, res, 'unexpected provider error');
        }
      }
      return handlePythonOrDomainError(error, res, 'unexpected provider error');
    }
  });

  router.post('/api/providers/apply', async (req, res) => {
    try {
      const userId = req.body?.userId || getLastPythonUser()?.id;
      if (!userId) return res.status(400).json({ error: 'userId is required' });
      const application = await pythonClient.createProviderApplication({
        userId,
        services: req.body?.services || ['buddy'],
        baseDistrict: req.body?.baseDistrict,
        intro: req.body?.intro,
        experience: req.body?.experience,
        credentialUrls: req.body?.credentialUrls || [],
      });
      return res.status(201).json({ application });
    } catch (error) {
      if (error instanceof PythonClientError && error.statusCode === 503) {
        try {
          const result = await domainStore.applyProvider(req.body || {});
          return res.status(201).json(result);
        } catch (fallbackError) {
          return handleDomainError(fallbackError, res, 'unexpected provider error');
        }
      }
      return handlePythonOrDomainError(error, res, 'unexpected provider error');
    }
  });

  router.put('/api/providers/me', async (req, res) => {
    try {
      const result = await domainStore.updateProvider(req.body || {});
      return res.json(result);
    } catch (error) {
      return handleDomainError(error, res, 'unexpected provider error');
    }
  });

  return router;
}

function toUserProfile(user: PythonLoginResponse['user']): UserProfile {
  return {
    id: user.id,
    nickname: user.nickname,
    phone: user.phone,
    avatar: user.avatar || '🐾',
    role: user.role as UserProfile['role'],
    verified: user.verified,
    createdAt: user.createdAt,
  };
}

function toProviderProfile(provider: PythonProviderProfile): ProviderProfile {
  return {
    userId: provider.userId,
    status: provider.status as ProviderProfile['status'],
    services: provider.services as ProviderProfile['services'],
    intro: provider.intro || '',
    serviceRadiusKm: provider.serviceRadiusKm,
    baseDistrict: provider.baseDistrict || '',
    score: provider.score || 0,
    completedOrderCount: provider.completedOrderCount,
    catCareScore: provider.catCareScore ?? undefined,
    communicationScore: provider.communicationScore ?? undefined,
    punctualityScore: provider.punctualityScore ?? undefined,
    emergencyHandlingScore: provider.emergencyHandlingScore ?? undefined,
    petFriendlyScore: provider.petFriendlyScore ?? undefined,
    drivingStabilityScore: provider.drivingStabilityScore ?? undefined,
    cleanlinessScore: provider.cleanlinessScore ?? undefined,
    supportsHomeVisit: provider.supportsHomeVisit ?? undefined,
    supportsMedication: provider.supportsMedication ?? undefined,
    supportsMultiDayCare: provider.supportsMultiDayCare ?? undefined,
    supportsEmergencyOrder: provider.supportsEmergencyOrder ?? undefined,
    catCareTags: provider.catCareTags,
  };
}

function toVehicleProfile(vehicle: PythonVehicleProfile): VehicleProfile {
  return {
    id: vehicle.id,
    userId: vehicle.userId,
    vehicleType: vehicle.vehicleType as VehicleProfile['vehicleType'],
    plateMasked: vehicle.plateMasked,
    seats: vehicle.seats,
    trunkLevel: (vehicle.trunkLevel || 'medium') as VehicleProfile['trunkLevel'],
    supportsCatBag: vehicle.supportsCatBag,
    supportsCrate: vehicle.supportsCrate,
    supportsStroller: vehicle.supportsStroller,
    supportsMultiPet: vehicle.supportsMultiPet,
    petFriendly: vehicle.petFriendly,
    petFriendlyTags: vehicle.petFriendlyTags,
  };
}

function handlePythonOrDomainError(error: unknown, res: import('express').Response, fallback: string) {
  if (error instanceof PythonClientError) {
    return res.status(error.statusCode).json({
      error: pythonErrorMessage(error),
      details: error.details,
    });
  }
  return handleDomainError(error, res, fallback);
}

function pythonErrorMessage(error: PythonClientError): string {
  const details = error.details as { detail?: unknown } | undefined;
  return typeof details?.detail === 'string' ? details.detail : error.message;
}
