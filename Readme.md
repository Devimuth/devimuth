🛠️ Devimuth Tools (Static GIS & Dev Suite)
A comprehensive, client-side collection of Geographic Information System (GIS) and Software Development utilities. Built as a high-performance static site, all processing happens in your browser—no data is sent to a server.


🚀 Tech Stack
Framework: React 18 + Vite

Styling: Tailwind CSS

Maps: Leaflet & React-Leaflet

Spatial Logic: Proj4js (Projections) & Turf.js (Analysis)

Data Handling: PapaParse (CSV) & Lucide-React (Icons)

🧰 Featured Tools
🌍 GIS & Geospatial Tools
Coordinate Converter: Convert between WGS84 (Lat/Lon) and UTM zones or local grids.

GeoJSON Visualizer: Paste and validate GeoJSON to render it instantly on a map.

BBOX Selector: Draw on a map to capture Bounding Box coordinates (MinX, MinY, MaxX, MaxY).

WKT <-> GeoJSON: Seamlessly convert between Well-Known Text and GeoJSON formats.

DMS to Decimal Degrees: Convert Degrees, Minutes, Seconds to web-friendly coordinates.

Distance & Area: Calculate geodesic measurements using Turf.js.

💻 Developer & Data Utilities
JSON <-> CSV Converter: Quickly swap between data formats for spreadsheets or APIs.

UUID & Hash Generator: Generate secure v4 UUIDs and SHA/MD5 hashes.

JWT Decoder: Inspect JSON Web Tokens (JWT) locally and securely.

JSON Formatter/Minifier: Prettify messy JSON strings for better readability.

Base64 & URL Encoder: Standard encoding utilities for web development.

Diff Viewer: Compare two blocks of text or code to identify changes.

⚙️ Local Development
Clone & Install

Bash

git clone "github url"
cd ----
npm install
Start Dev Server

Bash

npm run dev
📦 Deployment
This project is optimized for GitHub Pages.

Update base in vite.config.js to your repository name.

Deploy with one command:

Bash

npm run deploy
📝 Project Roadmap
[x] Initial Project Setup

[ ] Phase 1: Core GIS Tools (Converter, GeoJSON Viewer)

[ ] Phase 2: Advanced Data Tools (CSV/JSON, JWT Decoder)

[ ] Phase 3: Interactive Map Utilities (BBOX, Distance)

[ ] Phase 4: UI/UX Polish & Dark Mode Support

👤 Author
Devimuth Software & GIS Developer | VA

GitHub: @yourusername
