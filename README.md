# SnapLink - Premium URL Shortener & Analytics Platform

SnapLink is a high-performance, full-stack link management and analytics platform. Featuring a modern, premium dark SaaS design system, SnapLink offers secure user authentication, custom link creation, bulk url shortening, and real-time geolocation analytics.

Live Backend API: [https://snaplink-backend-7s7p.onrender.com](https://snaplink-backend-7s7p.onrender.com)  
Live Redirection URL: [https://snaplink-backend-7s7p.onrender.com/:shortCode](https://snaplink-backend-7s7p.onrender.com/:shortCode)

---

## Key Features

*   **Secure Authentication & Session Management**:
    *   Full sign-up and login capabilities with encrypted passwords via `BcryptJS`.
    *   Secure stateless session tracking using JSON Web Tokens (`JWT`) injected via Axios interceptors.
    *   Stunning, interactive authentication pages containing dynamic animated background floating glow blobs.
*   **Dynamic URL Shortening & Customization**:
    *   Generate secure, unique short links instantly using `nanoid`.
    *   Supports custom short aliases (e.g. `snap.lk/custom-tag`) with database-level uniqueness collision protection.
    *   Attach custom titles/labels for quick link identification.
    *   Set custom expiration dates (`expiresAt`) to automatically disable links in the future.
*   **Enterprise Bulk Shortener**:
    *   Shorten multiple links at once.
    *   Accepts raw multi-line URL pastes or drag-and-drop uploads of `.csv` or `.txt` files containing absolute URLs.
    *   Generates a structured result table with quick one-click copies and shares for the entire batch.
*   **Real-time Analytics Dashboard**:
    *   Real-time tracker for clicks, active links, and average clicks performance metrics.
    *   Automatic geolocation capture (resolves Country, Region, City, and Location using `geoip-lite`).
    *   Automated user agent parsing for Device classification (Desktop, Mobile, Tablet) and Browser tracking (Chrome, Firefox, Safari, Edge, Opera, Brave).
    *   Interactive charts powered by `Recharts` for visualizing click trends over time.
    *   Detailed visit logs detailing specific IP addresses, locations, and system configurations.
*   **QR Code & Native Sharing**:
    *   Instantly generate and render customizable high-definition QR codes for every shortened URL.
    *   Download QR codes directly as `.png` files.
    *   Supports mobile native sharing using `navigator.share()` or automated clipboard copies as fallbacks.
*   **Active Expiry Redirection**:
    *   Short links containing expiration parameters are validated on the backend.
    *   Expired links automatically route users to a custom, beautifully styled `/expired` front-end page rather than throwing generic errors.

---

## Tech Stack

### Frontend
*   **Core**: React 19 (Vite), JavaScript (ES Modules)
*   **Styling**: Vanilla CSS featuring a premium dark SaaS theme, translucent cards, glows, and sub-pixel borders.
*   **Routing**: React Router DOM (v7)
*   **Analytics Visualization**: Recharts
*   **Icons**: React Icons & Lucide React
*   **Integration**: Axios (with custom auth headers request interceptor)

### Backend
*   **Core**: Node.js, Express (v5)
*   **Database**: MongoDB (configured via Mongoose v9)
*   **Security**: JWT, BcryptJS, CORS
*   **Utilities**: geoip-lite, nanoid, dotenv

---

## Setup Instructions

### Prerequisites
*   Node.js (v18 or higher)
*   MongoDB (Running locally on default port `27017` or a MongoDB Atlas cloud cluster URI)

### Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `server` folder and specify the configuration:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/snaplink
   JWT_SECRET=your_super_secret_jwt_key
   BASE_URL=http://localhost:5000
   FRONTEND_URL=http://localhost:5173
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Point the client API baseURL to your local server. In `client/src/services/api.js`:
   ```javascript
   const API = axios.create({
     baseURL: "http://localhost:5000/api", // local dev server
   });
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and go to `http://localhost:5173`.

---

## Assumptions Made

1. **Redirection Routing Domain**: Redirect links are generated relative to the backend server URL (`BASE_URL` in `.env`), handling incoming hits and sending redirections.
2. **Client IP Address**: In local development, loopback IPs (`::1` or `127.0.0.1`) are simulated using standard public IPs (like `8.8.8.8`) to ensure that `geoip-lite` correctly demonstrates geolocation tracking.
3. **Data Compliance**: Client analytics capture user browser agents and IP addresses for analytical charting. Regions and countries are mapped statically via database triggers.

---

## AI Planning Document & Project Flow

SnapLink was designed and implemented using an iterative, AI-assisted software development cycle. AI prompts and suggestions were utilized to enforce security best practices, design premium user experiences, and structure queries for optimal performance:

### 1. Requirement Analysis & Data Modeling
We collaborated with AI to model high-performance URL redirection database constraints. We settled on splitting core URL metadata (`Url.js`) from high-volume analytical records (`Analytics.js`). By avoiding nested schemas inside URL documents and utilizing index fields (`urlId: 1`, `visitedAt: -1`), we ensured the database scales seamlessly with click logs.

### 2. Backend API Scaffolding
We prompted AI to construct standard RESTful route handlers for user authentication and link configuration. The resulting code includes custom alias collision protection (checking unique aliases before insertion), validation checks for expiration times, and custom middleware handlers (`authMiddleware.js`) to secure APIs using JWT headers.

### 3. Frontend UI/UX & Component Design
To design the premium visual aesthetic, we consulted AI on implementing responsive layout components using CSS variables. We implemented animated floating blobs (`InteractiveAuthBg.jsx`) for auth overlays, created modular tables (`UrlTable.jsx`), generated stats counters (`StatsCard.jsx`), and styled modals to download and share generated QR codes.

### 4. Analytical Visualization Integration
We utilized AI to integrate `Recharts` graphs into the dashboard workspace. AI-guided implementation helped us transform flat analytics logs from the database into distinct groupings for trend lines, browser percentages, and device types, adapting smoothly to dark mode layouts.

### 5. Debugging & Performance Optimization
Throughout testing, we leveraged AI tools to debug reactive intervals in the dashboard (ensuring list updates occur without UI stutter), resolve CSS overflow behaviors in mobile viewports, and handle date parsing parameters securely across timezone differences.
