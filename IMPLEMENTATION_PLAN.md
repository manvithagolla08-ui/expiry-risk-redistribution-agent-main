# SH-204 Expiry Risk & Redistribution Agent - Implementation Plan

## Development Phases

### Phase 0: Architecture & Project Rules

- Finalize system architecture and technology stack.
- Establish frontend/backend folder structure.
- Define database entities and relationships.
- Define API contracts.
- Define analytics inputs and outputs.
- Define expiry-risk scoring methodology.
- Define demand forecasting methodology.
- Define redistribution recommendation rules.
- Define Gemini's role as an explanation/insight layer only.
- Define environment-variable and secret-management rules.
- Create sample data specifications for warehouses, products,
  inventory batches, and demand history.

### Phase 1: Foundation & Setup
- Initialize Git repository and structure.
- Set up the Supabase PostgreSQL project and prepare the initial database schema for implementation.
- Initialize the Python FastAPI backend project structure and install core dependencies.
- Initialize the React Vite frontend project with Tailwind CSS and TypeScript.

### Phase 2: Backend Core & Database Integration
- Develop database models and connection logic in FastAPI.
- Implement CRUD endpoints for Warehouses, Products, and InventoryBatches.
- Generate and seed realistic dummy data for testing (inventory, warehouses, demand history).

### Phase 3: Analytics & Intelligence Layer
- Implement the Expiry-Risk scoring algorithm using pandas.
- Develop the initial Demand Forecasting module using a moving-average / weighted-moving-average approach based on historical demand data. Calculate expected demand during the remaining shelf life. Keep the forecasting module modular so that scikit-learn ML models can be added later if sufficient historical data is available.
- Build the Redistribution Recommendation engine.
- Expose these analytical components via FastAPI endpoints.

### Phase 4: Frontend Development
- Build the main Dashboard layout.
- Implement data fetching from the backend API.
- Create Recharts visualizations for risk, demand, and inventory levels.
- Develop the redistribution recommendation UI.

### Phase 5: Gemini AI Integration
- Integrate the Gemini API in the FastAPI backend.
- Create the endpoint for generating AI explanations.
- Update the frontend to display Gemini insights on recommendations.

### Phase 6: Testing & Polish
- Write unit tests and integration tests.
- Perform end-to-end testing.
- Polish UI/UX, add loading states, and error handling.
- Write final project documentation.

## Testing Strategy

- **Backend:** 
  - `pytest` for unit testing FastAPI endpoints, Pydantic models, and utility functions.
  - Test the analytics algorithms with deterministic mock data to ensure correct mathematical outputs.
- **Frontend:**
  - `vitest` and React Testing Library for component testing.
  - Focus testing on data rendering and user interactions.
- **Integration:**
  - End-to-end testing of the complete flow (data generation -> risk calculation -> recommendation -> UI display).

## Deployment Strategy

- **Database:** Supabase hosted PostgreSQL.
- **Backend:** Deployed on a platform like Render, Railway, or Heroku as a Dockerized FastAPI application or standard Python app.
- **Frontend:** Built via Vite and deployed to Vercel or Netlify.
- **Environment Management:** Use `.env.example` files to manage API keys (Gemini, Supabase) and database URLs.
