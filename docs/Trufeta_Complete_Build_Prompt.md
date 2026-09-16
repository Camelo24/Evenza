# Trufeta — Complete Build Prompt

## 1. Project Overview

Build **Trufeta** ("Trust" + "Fête"), a full-stack event marketplace platform
for the Cameroonian market. Trufeta connects **Clients** (including organisers) with **Service providers**, with
**escrow-protected payments**, **digital ticketing** for public events, and an
**Admin**-moderated trust layer (client self-registration open; service providers require approval).

Roles: **Admin, Client, Service provider**. Organizer is a capability of the Client role.

## 2. Monorepo layout

```
trufeta/
├── backend/          # NestJS-shaped domain modules (Drizzle + server actions adapter)
├── frontend/         # Next.js App Router UI
├── docs/
│   └── Trufeta_Complete_Build_Prompt.md
└── README.md
```

See root `README.md` for the full tree and run instructions.

## 3. Access model

- **Client**: open self-registration via "Create Account".
- **Service provider**: entry via "Request Access" flow; admin approves, credentials emailed.
- **Admin**: reviews access requests and organizer upgrade requests.

## 4. Module roadmap (status)

1. Project setup — done (monorepo)
2. Authentication — done
3. User profiles — done
4. Landing page — done
5. Service provider module — done (many-to-many categories + map view)
6. Event module — done (CRUD + service provider assignment)
7. Booking module — done
8. Payment module — done (Campay provider abstraction)
9. Escrow module — done (full/deposit, evidence, 5-day cron auto-release)
10. Ticketing — done (QR codes)
11. Reviews — done (unlock after escrow release)
12. Notifications — done (in-app + email log)
13. Admin — done
14. Access request flow — done
15. Booking chat — done (gated on confirmed booking)

## 5. Escrow rules

- Full escrow or agreed deposit at booking.
- Timestamped photo/video evidence required for completion; GPS/QR optional.
- 5-day review window auto-releases via scheduled job (`/api/cron/escrow-release`).
- Disputes freeze escrow; every action is immutably logged.

## 6. Design system

- Fonts: Fraunces, Inter, IBM Plex Mono
- Palette: ink, paper, marigold, berry
- Motion: Framer Motion scroll-reveal on marketing; subtle app interactions
