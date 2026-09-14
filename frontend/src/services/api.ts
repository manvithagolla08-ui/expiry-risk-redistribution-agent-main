import type {
  Warehouse,
  Product,
  InventoryBatch,
  RiskScoreResponse,
  ForecastResponse,
  RedistributionResponse,
  WhatIfSimulationRequest,
  WhatIfSimulationResponse
} from '../types/analytics';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, options);
  if (!response.ok) {
    let message = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch (e) {
      // ignore JSON parse error
    }
    throw new Error(message);
  }
  return response.json();
}

export const api = {
  // Base Entities
  getWarehouses: () => fetchJson<Warehouse[]>('/warehouses'),
  getProducts: () => fetchJson<Product[]>('/products'),
  getInventory: () => fetchJson<InventoryBatch[]>('/inventory'),

  // Analytics
  getRiskScores: () => fetchJson<RiskScoreResponse[]>('/analytics/risk-scores'),
  
  getForecast: (productId: string, warehouseId: string) => 
    fetchJson<ForecastResponse>(`/analytics/forecast/${productId}/${warehouseId}`),
  
  getRecommendations: () => 
    fetchJson<RedistributionResponse>('/analytics/recommend-redistribution', { method: 'POST' }),
  
  simulateTransfer: (request: WhatIfSimulationRequest) => 
    fetchJson<WhatIfSimulationResponse>('/analytics/simulate-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    }),
};
