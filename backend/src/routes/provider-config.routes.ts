/**
 * Provider Configuration Routes
 * API endpoints dla zarządzania konfiguracją AI providerów
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProviderConfigurationService } from '../services/provider-configuration.service';

const router = Router();
const prisma = new PrismaClient();
const providerConfigService = new ProviderConfigurationService(prisma);

/**
 * GET /api/provider-config
 * Pobiera wszystkie konfiguracje providerów
 */
router.get('/', async (req, res) => {
  try {
    const configs = await providerConfigService.getAllProviderConfigs();
    res.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('Error fetching provider configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider configurations',
    });
  }
});

/**
 * GET /api/provider-config/active
 * Pobiera aktywne konfiguracje providerów
 */
router.get('/active', async (req, res) => {
  try {
    const configs = await providerConfigService.getActiveProviderConfigs();
    res.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('Error fetching active provider configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active provider configurations',
    });
  }
});

/**
 * GET /api/provider-config/:providerId
 * Pobiera konfigurację konkretnego providera
 */
router.get('/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const config = await providerConfigService.getProviderConfig(providerId);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Provider configuration not found',
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching provider config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider configuration',
    });
  }
});

/**
 * POST /api/provider-config
 * Tworzy nową konfigurację providera
 */
router.post('/', async (req, res) => {
  try {
    const config = await providerConfigService.createProviderConfig(req.body);
    res.status(201).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error creating provider config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create provider configuration',
    });
  }
});

/**
 * PUT /api/provider-config/:id
 * Aktualizuje konfigurację providera
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await providerConfigService.updateProviderConfig({
      id,
      ...req.body,
    });
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error updating provider config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update provider configuration',
    });
  }
});

/**
 * DELETE /api/provider-config/:id
 * Usuwa konfigurację providera
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await providerConfigService.deleteProviderConfig(id);
    res.json({
      success: true,
      message: 'Provider configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting provider config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete provider configuration',
    });
  }
});

/**
 * POST /api/provider-config/init-defaults
 * Inicjalizuje defaultowe konfiguracje
 */
router.post('/init-defaults', async (req, res) => {
  try {
    await providerConfigService.initializeDefaultConfigs();
    res.json({
      success: true,
      message: 'Default provider configurations initialized',
    });
  } catch (error) {
    console.error('Error initializing default configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize default configurations',
    });
  }
});

export default router;
