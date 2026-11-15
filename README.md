
# ANALOG ATLAS

A multi-page educational planetary analog explorer for the NASA Space Apps Challenge.

## Pages
- `/` — cinematic landing page, planetary destinations, featured analogs and live NASA archive imagery
- `/explorer` — searchable NASA-documented analog profiles, filters, evidence, limitations and source links
- `/worlds` — Earth, Moon and Mars educational profiles
- `/imagery` — live NASA Image and Video Library search
- `/map` — interactive Earth analog-site map and schematic Mars comparison map
- `/gallery` — Earth landscape and Mars terrain comparison gallery
- `/research` — source register, provenance, scientific-integrity rules and project limitations

## Run locally
Requirements: Node.js 18+ and internet access.

```bash
npm install
npm start
```
Open http://localhost:3000

## Backend
- `GET /api/health`
- `GET /api/nasa/search?q=<terms>&page=1&media_type=image|video`

The backend proxies NASA's public Image and Video Library API at `https://images-api.nasa.gov/search`, validates query length and page range, and caches successful responses in memory for 10 minutes. Ordinary NASA image searches do not require an API key.

## Scientific provenance
The analog profiles are editorial summaries based on NASA's:
- https://science.nasa.gov/solar-system/analog-explorer/
- https://science.nasa.gov/solar-system/planetary-analogs/

The curated profiles are not a complete inventory and do not update automatically. Each entry links to its NASA source. Read the source record before using details in a formal presentation.

The live API feature is NASA's public media archive. It is not live spacecraft telemetry, not a direct integration with NASA Space Apps event systems, and not a raw Planetary Data System (PDS) data client. The Research Desk says this explicitly.

## Image handling
NASA image previews are retrieved from the NASA Image and Video Library API at runtime. The project does not bundle NASA images. Open each original NASA record to inspect its credit, metadata and applicable usage terms.

## Deployment notes
For a public production deployment, add rate limiting, request logging, security headers, persistent caching, monitoring, and a deployment platform. The current in-memory cache resets when the server restarts.


## Updated features (November 2026)
- Replaced the former Science Lab navigation item with an interactive Site Map.
- Added an Earth field-site map with approximate regional pins and a Mars comparison-region coordinate view.
- Added an Earth ↔ Mars Comparison Gallery. Image previews are queried live from the NASA Image and Video Library; each preview opens its NASA record.
- Earth, Moon and Mars profile imagery is fetched from NASA's image archive rather than relying on the original CSS illustrations.
- Map markers are approximate regional references, not exact field sampling coordinates. The Mars map is a schematic latitude/longitude plot, not a navigational basemap.
- Core analog descriptions are linked to NASA Planetary Analog Explorer and NASA Planetary Analogs pages. Similarity is limited to the stated research process; analogs are not exact replicas.
