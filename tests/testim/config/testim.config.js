/**
 * Testim.io Configuration for SocialOps Agency Management System
 * Handles Testim CLI arguments, environment bindings, and report paths.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const testimConfig = {
  // Testim SaaS Cloud Configuration
  projectId: process.env.TESTIM_PROJECT_ID || 'usw24R6pnE3OMtY5aq0fVuYs',
  token: process.env.TESTIM_TOKEN || 'yAEVBgyTANcNEL3aQsBKJ59Qh1SvB5ywowlQCfjZ9obGX51fvz',
  
  // Execution Target
  baseUrl: process.env.TESTIM_BASE_URL || 'http://localhost:5173',
  apiUrl: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  
  // Grid and Browser
  grid: process.env.TESTIM_GRID || 'Testim-HA-Grid',
  browser: process.env.TESTIM_BROWSER || 'chrome',
  mode: process.env.TESTIM_MODE || 'selenium',
  headless: process.env.TESTIM_HEADLESS !== 'false',
  tunnel: true,
  tunnelPort: 5173,
  
  // Timeouts & Execution Options
  timeout: 45000,
  retries: 1,
  
  // Reporting Artifacts
  reportsDir: path.resolve(__dirname, '../reports'),
  junitReportFile: path.resolve(__dirname, '../reports/test-results.xml'),
  jsonReportFile: path.resolve(__dirname, '../reports/results.json'),
  
  // Validation Helper
  validateConfig() {
    const errors = [];
    if (!this.projectId) {
      errors.push('Missing TESTIM_PROJECT_ID environment variable or CLI parameter --project.');
    }
    if (!this.token) {
      errors.push('Missing TESTIM_TOKEN environment variable or CLI parameter --token.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default testimConfig;
