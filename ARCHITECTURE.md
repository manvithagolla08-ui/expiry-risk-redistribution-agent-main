# SH-204 Expiry Risk & Redistribution Agent - Architecture

## System Architecture

The SH-204 project follows a modern, decoupled architecture separating the frontend client from the backend API and data storage, leveraging Python for advanced analytics.

- **Frontend:** React (TypeScript, Vite, Tailwind CSS, Recharts) providing a responsive and interactive dashboard.
- **Backend:** Python (FastAPI, Pydantic) handling RESTful API requests, validation, and orchestrating analytical tasks.
- **Data & Analytics Layer:** Python (pandas, NumPy, scikit-learn) responsible for demand forecasting, expiry risk scoring, and redistribution optimization.
- **Database:** Supabase (PostgreSQL) for relational data storage of inventory, warehouses, products, and batches.
- **Generative AI:** Gemini API integration for generating human-readable explanations of recommendations and inventory insights. It operates outside the core deterministic calculation path.

## Folder Structure

```
expiry-risk-redistribution-agent/
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route components
│   │   ├── services/          # API client calls
│   │   ├── utils/             # Helper functions
│   │   ├── types/             # TypeScript interfaces
│   │   └── App.tsx            # Main application component
│   ├── package.json
│   └── vite.config.ts
├── backend/                   # FastAPI application
│   ├── app/
│   │   ├── api/               # API endpoints/routers
│   │   ├── core/              # Configuration and security
│   │   ├── models/            # Pydantic and DB models
│   │   ├── services/          # Business logic and external services
│   │   ├── analytics/         # Data/AI layer (pandas, scikit-learn)
│   │   │   ├── forecasting/   # Demand forecasting models
│   │   │   ├── risk/          # Expiry risk scoring logic
│   │   │   └── redistribution/# Redistribution engine
│   │   └── main.py            # FastAPI application entry point
│   ├── requirements.txt
│   └── .env.example
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md
│   └── IMPLEMENTATION_PLAN.md
└── README.md
```

## Database Entities

- **Warehouse:** `id`, `name`, `location`, `capacity`,`latitude`,`longitude`, `created_at`
- **Product:** `id`, `sku`, `name`, `category`, `unit_price`, `shelf_life_days`, `created_at`
- **InventoryBatch:** `id`, `product_id`, `warehouse_id`, `quantity`, `manufacture_date`, `expiry_date`, `batch_number`, `created_at`
- **TransferRecommendation:** `id`, `source_warehouse_id`, `destination_warehouse_id`, `product_id`, `batch_id`, `recommended_quantity`, `reasoning`, `status`, `created_at`
- **DemandHistory:** `id`, `product_id`, `warehouse_id`, `date`, `quantity_sold`, `created_at`


## API Design

The FastAPI backend will expose the following key endpoints:

- `GET /api/inventory`: Retrieve inventory batches with filtering.
- `GET /api/warehouses`: List all warehouses.
- `GET /api/products`: List products.
- `GET /api/analytics/risk-scores`: Get expiry risk scores for inventory batches.
- `GET /api/analytics/forecast/{product_id}`: Get demand forecast for a product across warehouses.
- `POST /api/analytics/recommend-redistribution`: Trigger the redistribution recommendation engine.
- `GET /api/recommendations`: Retrieve active transfer recommendations.
- `POST /api/insights/explain`: Get a Gemini-generated explanation for a specific recommendation or inventory scenario.

## Analytics & Algorithms

### Expiry-Risk Algorithm
Calculates a risk score (0-100) for each batch based on:
1. **Time to Expiry:** Days remaining until `expiry_date`.
2. **Current Stock Level:** High stock levels increase risk if demand is low.
3. **Historical Sell-Through Rate:** Rate at which the product typically sells in the specific warehouse.
*Implementation:* Python script using pandas to merge inventory data with historical sales and calculate the weighted risk score.

### Demand Forecasting Approach
The initial system will use a transparent moving-average / weighted-moving-average approach based on historical sales data to estimate daily demand. The forecast will then be combined with the remaining shelf life to calculate expected demand before expiry.

For example, if the forecasted daily demand is 40 units and 4 days of shelf life remain, expected demand before expiry is 160 units. Inventory above this amount can be considered potential excess stock.

The forecasting module will be designed independently so that more advanced machine-learning models using scikit-learn can be added later when sufficient historical data is available.

### Redistribution Algorithm
Identifies optimal inventory transfers to minimize waste.
1. **Identify Excess:** Find warehouses with high expiry risk for a product.
2. **Identify Deficit:** Find warehouses with high forecasted demand and low stock for the same product.
3. **Optimize Transfer:** Recommend transfers balancing transport costs (distance) against the cost of expired goods.
*Implementation:* Python logic utilizing NumPy/pandas to matrix match excesses with deficits and output ranked recommendations.

### Gemini's Role
- **Actionable Insights:** Translates raw numerical data (risk scores, transfer quantities) into natural language summaries for warehouse managers.
- **Explanation:** Explains *why* a redistribution is recommended (e.g., "Warehouse A has 500 units expiring in 30 days, while Warehouse B's demand is expected to spike...").
- *Constraint:* Core calculations (forecasting, risk, redistribution) are strictly numerical and Python-based. Gemini is used purely for interpretation and presentation.
