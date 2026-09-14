import axios from 'axios';
import { INITIAL_MOCK_INCIDENTS } from '../mock/mockData.js';

export const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches historical incident logs from the backend.
 * Falls back to initial mock incidents if the backend server is unreachable.
 *
 * @returns {Promise<Array<{
 *   id: string,
 *   timestamp: string,
 *   peak_rps: number,
 *   duration_seconds: number,
 *   severity: 'CRITICAL' | 'WARNING',
 *   ai_explanation: string
 * }>>}
 */
export const getIncidents = async () => {
  try {
    const response = await apiClient.get('/api/incidents');
    return response.data;
  } catch (error) {
    console.warn(
      '[API Service] Backend at /api/incidents unavailable. Operating in mock fallback mode.',
      error.message
    );
    return INITIAL_MOCK_INCIDENTS;
  }
};

export default {
  getIncidents,
};
