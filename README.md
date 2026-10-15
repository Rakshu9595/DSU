# VisionTwin — AI-Powered Computer Vision Energy Optimization & 3D Digital Twin Platform

VisionTwin is an end-to-end, full-stack energy intelligence and spatial optimization platform. It utilizes Computer Vision to detect electrical appliances and wall fittings from room videos, derives exact energy and electricity cost metrics, renders an interactive Three.js 3D Digital Twin, and leverages Generative AI to provide grounded, evidence-based recommendations for carbon reduction and cost savings.

---

## 🌟 Key Features

1. **Computer Vision Inference (FastAPI YOLO Integration)**:
   - Integrates with an active FastAPI YOLO model server (`http://127.0.0.1:8000`) for frame-by-frame object detection.
   - Detects appliances (fans, AC units, TVs, refrigerators, laptops) and electrical fittings (switches, sockets).
   - Distinguishes active energy-consuming loads from passive circuit fittings (switches/sockets draw 0 W; detecting a switch does not claim circuit energization).

2. **User-Editable Electrical Power Ratings (Section 4.C)**:
   - Allows users to enter, edit, and save the rated input power of each appliance in **Watts (W)**.
   - Replaces AI reference estimates with user-verified nameplate ratings.
   - Strict validation: rejects non-numeric input, negative values, 0 W for active appliances, and unreasonable ratings (>25,000 W).
   - Tracks audit metadata: `powerRatingSource` (`user_entered`, `manufacturer_specification`, `reference_estimate`, `unknown`), `powerRatingVerified`, `ratingUpdatedAt`, and `ratingUpdatedBy`.
   - Instant mathematical recalculation of daily energy, monthly energy, and electricity costs.

3. **Interactive 3D Digital Twin (Three.js)**:
   - Dynamic 3D room canvas rendering floor, walls, lighting, soft shadows, and procedural appliance meshes.
   - Real-time rotating fan blades, glowing screens, and status LED indicators.
   - Orbit controls with camera presets: Isometric, Top-Down Floorplan, and Front Elevation.
   - Visualization modes: **Realistic**, **Energy Heatmap** (color-coded by wattage load), and **Scenario Mode**.
   - Raycasting device inspector: click any 3D appliance to view details, adjust coordinates, and edit power rating (W) with direct MongoDB persistence.
   - Editable room physical dimensions (Length, Width, Height in meters).

4. **Energy Calculation Engine**:
   - Backend JavaScript mathematical derivations (never hallucinated by Generative AI):
     - $\text{Daily Energy (kWh)} = \frac{\text{Power (W)} \times \text{Daily Hours}}{1000}$
     - $\text{Monthly Energy (kWh)} = \text{Daily Energy} \times \text{Days/Month}$
     - $\text{Monthly Cost (₹)} = \text{Monthly Energy} \times \text{Tariff (₹/kWh)}$
     - $\text{Emissions (kg CO}_2\text{)} = \text{Monthly Energy} \times 0.82\text{ kg CO}_2\text{/kWh}$

5. **What-If Scenario Simulation**:
   - Side-by-side comparison of baseline consumption vs. proposed operational schedules.
   - Interactive sliders to simulate operating hour reductions and instant monthly financial and carbon savings.

6. **Grounded Generative AI Recommendations**:
   - Synthesizes detected device inventory, user-entered wattages, and backend calculations.
   - Recommends actionable schedules, maintenance checks, and behavioral changes.
   - Formatted with priority tiers, target appliances, and calculated financial savings.

7. **Audit Reports & Exports**:
   - Compiles downloadable **PDF** audit documents via PDFKit.
   - Exports raw **CSV** spreadsheet datasets for offline utility analysis.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Dark Cyber-Emerald Design System), Vanilla JavaScript (ES Modules), Bootstrap 5.3, Three.js (r128), Chart.js (4.4).
- **Backend**: Node.js (v20+), Express.js (v5), MongoDB & Mongoose (v8) with resilient embedded database fallback.
- **Security & Session**: Session-based cookie authentication (`express-session`), bcrypt password hashing, input validation via Zod, Helmet security headers, CORS protection.
- **AI & Computer Vision**: YOLOv8 Appliance & Fitting Models running on FastAPI (`http://127.0.0.1:8000`).

---

## 📁 Repository Structure

```
visiontwin/
├── backend/
│   ├── app.js                      # Express application setup & middleware
│   ├── server.js                   # Server bootstrap & port listener (5000)
│   ├── config/                     # Environment, constants, database, logger, upload
│   ├── controllers/                # Auth, Device, Project, Analysis, Energy, Twin, etc.
│   ├── middleware/                 # Auth guard, error handler, request validator
│   ├── models/                     # Mongoose schemas (User, Project, Device, Scene, etc.)
│   ├── repositories/               # Data access layer repositories
│   ├── routes/                     # Express REST routes
│   ├── services/                   # Business logic (Energy, Normalizer, Twin, Reports)
│   ├── utils/                      # Energy math formulas, API response helper, AppError
│   ├── validators/                 # Zod validation schemas
│   └── tests/                      # Unit & integration test suites (9 suites, 28 tests)
├── frontend/
│   ├── index.html                  # Landing page
│   ├── login.html & register.html  # Authentication pages
│   ├── dashboard.html              # Energy & project KPI dashboard
│   ├── devices.html                # Device inventory & manual power rating editor
│   ├── digital-twin.html           # 3D Three.js Digital Twin Studio
│   ├── energy-analysis.html        # Chart.js analytics & what-if scenario simulator
│   ├── upload.html                 # Video upload drag-and-drop
│   ├── analysis.html               # Real-time YOLO job monitor & detection review
│   ├── projects.html               # Project workspace management
│   ├── recommendations.html        # Generative AI optimization strategies
│   ├── reports.html                # PDF and CSV audit report archive
│   ├── settings.html               # User preferences & model diagnostic health
│   ├── css/                        # Variables, main, dashboard, devices, digital-twin
│   └── js/                         # Core API client, auth, UI, components, pages
├── shared/                         # Canonical device labels & reference ratings
├── data/                           # Uploaded videos, prediction cache, reports
└── scripts/                        # Database seeding and verification scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: 3.9+ with FastAPI & YOLO dependencies (running on port 8000)
- **MongoDB**: Local MongoDB instance (or automatic fallback to embedded in-memory MongoDB)

### 2. Environment Configuration
Create or verify `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/visiontwin
SESSION_SECRET=visiontwin-production-secure-session-key-2026
MODEL_SERVER_URL=http://127.0.0.1:8000
DEFAULT_TARIFF=8.0
DEFAULT_EMISSION_FACTOR=0.82
UPLOAD_MAX_SIZE_MB=200
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Test Suite
```bash
npm test
```
*Validates energy calculation formulas, prediction normalization, scenario simulation, and API endpoints (28 tests passing).*

### 5. Start the Application
```bash
npm start
```
The VisionTwin platform will be accessible at:
👉 **`http://127.0.0.1:5000`**

### 6. Default Demo Account
- **Email**: `demo@visiontwin.io`
- **Password**: `Password123!`

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Session login |
| `GET` | `/api/auth/me` | Current session user |
| `GET` | `/api/projects` | List user projects |
| `POST` | `/api/projects` | Create new room workspace |
| `GET` | `/api/devices?projectId=:id` | List appliances and fittings |
| `PATCH`| `/api/devices/:id/power-rating` | **Update user-verified wattage (W)** |
| `POST` | `/api/devices/:id/power-rating/reset` | Reset rating to baseline estimate |
| `POST` | `/api/devices` | Manually add an appliance |
| `GET` | `/api/digital-twin/project/:id` | Get 3D scene data and object coordinates |
| `PUT` | `/api/digital-twin/project/:id` | Save 3D scene layout and room dimensions |
| `GET` | `/api/energy/project/:id` | Calculate energy, cost, and carbon metrics |
| `POST` | `/api/scenarios/project/:id` | Simulate what-if usage schedule reduction |
| `POST` | `/api/recommendations/project/:id/generate` | Generate AI optimization strategy |
| `POST` | `/api/reports/project/:id/generate` | Generate PDF or CSV audit report |
| `GET` | `/api/reports/:id/download` | Download generated report file |
