# Phase 09 — Space Academy & Gamification

## Goal
Interactive education platform with kids zone (4 mini-games) and adults zone (8 course tracks + XP/badge gamification system).

## Page Routes
```
/academy               → Hub (kids / adults choice)
/academy/kids          → Games + beginner lessons
/academy/adults        → 8 course tracks
/academy/courses/:id   → Course detail + lesson list
/academy/lesson/:id    → Lesson view + quiz
/academy/progress      → Personal XP, badges, rank
/academy/leaderboard   → XP leaderboard (cadets only)
/academy/manage        → Educator CMS (educator role)
```

## XP & Rank System
```
XP Sources: lesson complete (+10–50), quiz pass (+20), mini-game (+5–15), badge earn (+50)

Ranks (cumulative XP thresholds):
  0    → Cadet
  100  → Specialist
  300  → Pilot
  600  → Commander
  1000 → Flight Surgeon
  2000 → Mission Director
```

## 4 Kids Mini-Games
1. **Zero-G Organ Puzzle** — drag organs to correct body position in zero-gravity
2. **Heart Rate Simulator** — tap-rhythm game to maintain safe BPM
3. **SpO2 Breathing** — breathing rhythm game (hold/release)
4. **Mission Prep Checklist** — interactive pre-flight checklist memory game

## 8 Adults Course Tracks
1. Space Cardiovascular Medicine
2. Microgravity Physiology
3. Radiation Medicine in Space
4. Cognitive Performance & Sleep
5. Nutritional Medicine in Orbit
6. Emergency Medical Procedures
7. EVA Medical Protocols
8. Mars Mission Medicine

## Key API Endpoints
```
GET  /api/academy/courses            → Public course list (filterable)
GET  /api/academy/courses/:id        → Course detail + lessons
GET  /api/academy/courses/:id/lessons/:lid → Lesson detail
POST /api/academy/progress           → Mark lesson complete, record XP
GET  /api/academy/my-progress        → User's progress summary
GET  /api/academy/badges             → All badges
GET  /api/academy/my-badges          → User's earned badges
GET  /api/academy/leaderboard        → XP ranking (cadet/student only)
POST /api/academy/courses            → Create course (educator+)
PUT  /api/academy/courses/:id        → Update course
```

## Badge Awarding (Observer Pattern)
```php
class UserAcademyProgressObserver
{
    public function updated(UserAcademyProgress $progress): void
    {
        if ($progress->status === 'completed') {
            app(BadgeService::class)->checkAndAward($progress->user);
        }
    }
}
```
