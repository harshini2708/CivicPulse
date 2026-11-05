# CivicPulse Frontend Prototype

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract this ZIP.
2. Open the extracted `civicpulse_frontend` folder in VS Code.
3. Open Terminal > New Terminal.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open the local URL printed in the terminal (usually http://localhost:5173).

## Included
- Landing page with Citizen, Worker and Admin portals
- Citizen issue report, nearby issues and complaint tracking
- Worker assigned-complaint lookup and repair-evidence submission
- Admin dashboard, complaint management, civic intelligence and resolution review
- Responsive styling inspired by the supplied Stitch landing-page screenshot

## Important prototype limitations
This is a frontend prototype with in-memory sample data. Refreshing the page resets demo changes.
The photo input is a browser file/camera capture control, but production-grade live-camera capture is not enforced yet.
Microphone recording, live GPS, authentication, database, file storage, Gemini AI, maps and secure server-side role permissions are not connected.
Do not use sample statistics or sample complaint data as real municipal data.
