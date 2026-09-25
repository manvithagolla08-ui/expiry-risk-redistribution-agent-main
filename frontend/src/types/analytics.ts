export interface Warehouse {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  created_at: string;
}

export interface InventoryBatch {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  received_date: string;
  expiry_date: string;
  created_at: string;
}

export interface RiskScoreResponse {
  batch_id: string;
  product_id: string;
  warehouse_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  days_to_expiry: number;
  expected_demand_before_expiry: number;
  potential_excess: number;
}

export interface ForecastResponse {
  product_id: string;
  warehouse_id: string;
  forecast_daily_demand: number;
  method: string;
  historical_period_used_days: number;
}

export interface RedistributionRecommendation {
  product_id: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  recommended_quantity: number;
  source_risk_level: string;
  destination_demand: number;
  distance_km: number;
  reason: string;
}

export interface RedistributionResponse {
  recommendations: RedistributionRecommendation[];
}

export interface WhatIfSimulationRequest {
  recommendation: RedistributionRecommendation;
}

export interface WhatIfSimulationResponse {
  waste_before_transfer: number;
  waste_after_transfer: number;
  waste_avoided: number;
}

// Gemini Explanation
export interface ExplainInventoryRequest {
  product_name: string;
  warehouse_name: string;
  quantity?: number;
  days_to_expiry: number;
  risk_score: number;
  risk_level: string;
  potential_excess?: number;
  forecast_daily_demand?: number;
  recommended_transfer?: number;
  destination_warehouse?: string;
  destination_demand?: number;
  transfer_distance_km?: number;
}

export interface ExplainInventoryResponse {
  explanation: string;
}
