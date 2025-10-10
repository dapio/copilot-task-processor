/**
 * Quick Smoke Test for ThinkCode AI Platform
 * Rapid validation of core functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Platform Smoke Tests', () => {
  test('Homepage loads and is accessible', async ({ page }) => {
    test.setTimeout(15000);

    console.log('🔄 Testing homepage...');
    await page.goto('http://localhost:3000');

    // Check if page loads
    await expect(page).toHaveTitle(/ThinkCode|Copilot|Task/);
    console.log('✅ Homepage loaded successfully');

    // Check for main navigation or content
    const hasContent = await page
      .locator('main, .main, .container, .content')
      .first()
      .isVisible();
    expect(hasContent).toBeTruthy();
    console.log('✅ Main content visible');
  });

  test('Backend API health check', async ({ page }) => {
    test.setTimeout(10000);

    console.log('🔄 Testing backend API...');
    const response = await page.request.get('http://localhost:3002/api/health');

    expect(response.status()).toBe(200);
    const healthData = await response.json().catch(() => ({}));
    console.log('✅ Backend API responding:', healthData);
  });

  test('Agents API health check', async ({ page }) => {
    test.setTimeout(10000);

    console.log('🔄 Testing agents API...');
    const response = await page.request.get('http://localhost:3006/api/health');

    expect(response.status()).toBe(200);
    const healthData = await response.json().catch(() => ({}));
    console.log('✅ Agents API responding:', healthData);
  });

  test('WebSocket connection test', async ({ page }) => {
    test.setTimeout(15000);

    console.log('🔄 Testing WebSocket connection...');
    await page.goto('http://localhost:3000');

    // Wait for potential WebSocket connection
    await page.waitForTimeout(3000);

    // Check for WebSocket connection indicator
    const wsIndicator = page
      .locator('.connectionStatus, .statusIndicator, [data-testid="ws-status"]')
      .first();

    if (await wsIndicator.isVisible()) {
      console.log('✅ WebSocket indicator found');

      const isConnected = await wsIndicator
        .locator('.connected, .online')
        .isVisible();
      console.log(
        `WebSocket status: ${isConnected ? 'Connected' : 'Disconnected'}`
      );
    } else {
      console.log('⚠️ WebSocket indicator not found (may be expected)');
    }
  });

  test('Basic workflow component loading', async ({ page }) => {
    test.setTimeout(20000);

    console.log('🔄 Testing workflow component...');
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Look for workflow-related elements
    const workflowElements = page.locator(
      '.workflow, .enhanced-workflow, [data-testid*="workflow"], .workflowContainer'
    );

    const workflowCount = await workflowElements.count();
    console.log(`Found ${workflowCount} workflow-related elements`);

    if (workflowCount > 0) {
      console.log('✅ Workflow components detected');
    } else {
      // Check if we need to navigate to a specific workflow page
      const workflowLinks = page.locator(
        'a:has-text("Workflow"), a:has-text("Dashboard")'
      );
      const linkCount = await workflowLinks.count();
      console.log(`Found ${linkCount} workflow navigation links`);
    }
  });

  test('Platform service integration', async ({ page }) => {
    test.setTimeout(20000);

    console.log('🔄 Testing platform service integration...');

    // Test multiple endpoints
    const endpoints = [
      'http://localhost:3002/api/health',
      'http://localhost:3006/api/health',
    ];

    let workingServices = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(endpoint);
        if (response.status() === 200) {
          workingServices++;
          console.log(`✅ Service responding: ${endpoint}`);
        }
      } catch (error) {
        console.log(`❌ Service not responding: ${endpoint}`);
      }
    }

    expect(workingServices).toBeGreaterThan(0);
    console.log(
      `✅ ${workingServices}/${endpoints.length} services operational`
    );
  });
});
