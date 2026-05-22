<table>
<tr>
<td>

```

███████╗██╗      ██████╗ ██╗    ██╗███████╗
██╔════╝██║     ██╔═══██╗██║    ██║██╔════╝
█████╗  ██║     ██║   ██║██║ █╗ ██║███████╗
██╔══╝  ██║     ██║   ██║██║███╗██║╚════██║
██║     ███████╗╚██████╔╝╚███╔███╔╝███████║
╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚══════╝

```

</td>
<td>

```
 Food Observation and Warning System
 ─────────────────────────────────────────────────────────────────────────────────
 Project    │ FLOWS
 Purpose    │ AI-driven flood forecasting and evacuation shelter/s management
 Target     │ Barangay Rizal residents, LGU, & MDRRMC
 Access     │ Web Application · Android APK (Expo)
 Data       │ Real-time rainfall · Static topographical data
 ─────────────────────────────────────────────────────────────────────────────────
```

</td>
</tr>
</table>

## About

This system uses a machine learning model to predict optimal run-off coefficients for a physics-based flood simulation, combining forecasted rainfall and static topography data. FLOWS addresses the community’s limited disaster preparation time by improving flood forecasting, enabling residents to prepare earlier, and supporting local authorities in Pre-Disaster Risk Assessment and Disaster Risk Reduction and Management.

**Current Features:**

* Real-time Data Collection
* AI-Driven Flood Simulation and Prediction
* Evacuation Shelter Allocation and Management
* Map and Alert Generation

---

## Tech Stack

### 🖥️  Backend

```
 Language      │ Python 3.11+          Core language for all ML and simulation logic
 Framework     │ FastAPI               REST API + WebSocket for real-time flood updates
 ML Model      │ XGBoost               Sponge coefficient prediction
 Scheduler     │ APScheduler           1-hour timer trigger for automated data fetching
 HTTP Client   │ httpx/aiohttp         Async API calls to PAGASA and NOAH
 Messaging     │ Apache Kafka          Event-driven message broker
 Database      │ TimescaleDB           Time-series flood prediction storage (PostgreSQL)
 Cache         │ Redis                 Latest 24hr rainfall context caching
 Validation    │ Pydantic              Data validation for incoming API payloads
 Reporting     │ ReportLab/WeasyPrint  PDF report generation for MDRRMC officers
 VCS           │ Git + GitHub          Version control and system maintenance
```

### 🌐  Frontend

```
 UI Framework  │ React 18+TypeScript    Component-based dashboard UI (Next.js)
 Build Tool    │ Vite                   Fast build tool for the React app
 Styling       │ Tailwind CSS           Utility-first responsive, mobile-friendly UI
 Charts        │ Recharts/Chart.js      Flood prediction charts and analytics
 Maps          │ Leaflet.js/MapLibreGL  Interactive flood zone maps
 Real-time     │ Socket.IO (client)     WebSocket updates from FastAPI
 i18n          │ i18next                English / Filipino language switching
 Mobile        │ React Native (Expo)    Android app reusing the same API backend
```

---

## Access and Installation

```
 Web  │ Accessible via web application through any modern browser
 APK  │ Installable as a direct APK download for Android devices only
```

> FLOWS is currently still under active development. Deployment links will be available upon release.

---

## Contributors

```
─────────────────────────────────────────────────────────────────
 Marc Botis        │ AI/ML Engineer & Full Stack Developer
 Aldrin Danila     │ Full Stack Developer
 Crisler Padrinao  │ Project Manager & Full Stack Developer
 Troy Bagasina     │ Full Stack Developer
─────────────────────────────────────────────────────────────────
```