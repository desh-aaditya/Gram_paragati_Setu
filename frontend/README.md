# Gram Pragati Setu - Frontend

React TypeScript frontend application for the Gram Pragati Setu portal.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Start development server:
```bash
bun dev
```

Frontend will be available at `http://localhost:3000`

## Features

- Government branding on every page
- Multi-lingual support (English, Hindi, Tamil)
- Accessibility toolbar
- Role-based routing (Officer/Employee)
- Interactive GIS map (Leaflet)
- Responsive design
- Modern, card-based dashboards for villages, projects, funds, and analytics
- Integrated checkpoints timeline from village and employee views

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── AccessibilityToolbar.tsx
│   └── VillageMap.tsx
├── pages/            # Page components
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── ...
├── context/          # React context
│   └── AuthContext.tsx
├── i18n/             # Internationalization
│   ├── config.ts
│   └── locales/
├── utils/            # Utility functions
│   └── api.ts
└── App.tsx           # Main app component
```

## Building

```bash
bun build    # Build for production
bun preview  # Preview production build
```

## Configuration

The frontend automatically proxies API requests to `http://localhost:5000` (configured in `vite.config.ts`).

### UI Notes

- Top-level sections (Dashboard, Villages, Projects, Funds, Analytics) use card-based layouts with soft shadows and rounded corners to keep government branding while improving readability.
- Village details now include:
  - Adarsh score card and gap analysis
  - Project cards with **View Details**, **Checkpoints**, and **Funds** actions
  - Officer-only **Edit** and **Delete** (soft-delete) controls
- The Employee portal reuses the same village details view and checkpoints timeline, with employee-only actions (Approve / Reject / Request Rework) on submissions.

