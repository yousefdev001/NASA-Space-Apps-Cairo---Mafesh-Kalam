# Phase 10 — Public Landing Page & Article System

## Goal
Build the public-facing landing page (no auth required) with platform overview, plus a full article system with kids/adults audiences.

## Landing Page Sections

### Section 1: Hero
- Platform name: **AURAMED** (animated glow)
- Tagline: "Space Health, Telemetry & Bio-Astronautics Platform"
- Animated HUD background (radial gradients, faint grid lines)
- CTA buttons: "Mission Control Login" → `/login` | "Explore Academy" → `/academy`

### Section 2: Stats Banner
```
[ 6 Organ Systems ] [ 10 Specialized Roles ] [ 60 Permissions ] [ 9 Report Types ]
```

### Section 3: Platform Features (6 cards)
Animated cards for each module: Mission Control | Astronaut Management | AI Insights | Alerts | Reports | Academy

### Section 4: Telemetry Preview
Static demo showing the organ telemetry grid (6 organs, all NOMINAL, animated health scores)

### Section 5: Latest Articles
- 3 kids articles + 3 adults articles
- Two columns: Kids (colorful) | Adults (professional)
- "Read More" link to `/articles`

### Section 6: Roles Overview
Cards for each of the 10 roles showing what they do

### Section 7: Footer CTA
"Join the Mission" → login | "Learn More" → academy

---

## Article System

### API Endpoints
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/public/articles` | No | Public article list |
| GET | `/api/public/articles/:slug` | No | Public article detail (+view_count) |
| GET | `/api/articles` | Auth | Full article list (editors) |
| POST | `/api/articles` | `create_articles` | Create article |
| PUT | `/api/articles/:id` | `update_articles` | Update |
| DELETE | `/api/articles/:id` | `delete_articles` | Delete |
| POST | `/api/articles/:id/publish` | `publish_articles` | Publish |

### Article Design: Kids vs Adults
| Aspect | Kids | Adults |
|--------|------|--------|
| Font | Large, rounded (2xl+) | Standard (base–lg) |
| Colors | Bright hud-cyan, hud-emerald accents | Muted HUD palette |
| Images | Illustrations, emoji, friendly | Diagrams, real photos |
| Vocabulary | Simple, fun | Technical, precise |
| Read time badge | "5 min read 🚀" | "12 min — Intermediate" |
| Structure | Short paragraphs, fun facts boxes | H2/H3 hierarchy, numbered lists |

### Article Slug Generation
```php
$slug = Str::slug($article->title) . '-' . Str::random(6);
// Ensures uniqueness without collision
```

## Design Tokens on Landing
The landing page uses the same dark HUD design system but with more decorative elements inspired by the reference UI (subtle paper-texture-ish scan lines, faint grid overlay). **All colors still from CSS variables.**
