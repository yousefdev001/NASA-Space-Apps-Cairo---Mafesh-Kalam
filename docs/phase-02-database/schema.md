# Phase 02 — Full Database Schema (56 Tables)

## Goal
Design and implement a complete, normalized, fully-indexed MySQL database with correct relationships, audit timestamps, and zero N+1 vulnerabilities baked into the ORM layer.

---

## Timestamp Convention
Every table uses **4 audit timestamps** where applicable:
- `created_at` — record creation
- `updated_at` — last update
- `measured_at` — when the measurement was taken (telemetry)
- `processed_at` — when backend processed the record
- `analyzed_at` — when AI/clinical analyzed it
- `received_at` — when backend received synced data from mobile

---

## Table Groups

### Group A: Users & Authentication (5 tables)
### Group B: Roles & Permissions — Spatie (4 tables, managed by package)
### Group C: Astronauts & Profiles (5 tables)
### Group D: Missions (6 tables)
### Group E: Telemetry & Vitals (12 tables)
### Group F: Organ Systems (3 tables)
### Group G: AI Insights & Clinical Review (5 tables)
### Group H: Alerts & Triage (4 tables)
### Group I: Reports (4 tables)
### Group J: Academy & Gamification (8 tables)
### Group K: Articles (4 tables)
### Group L: Audit & Security (3 tables)

---

## Full Schema Definitions

### A. Users & Authentication

#### `users`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | PK |
| uuid | CHAR(36) | UNIQUE, NOT NULL | UQ |
| name | VARCHAR(255) | NOT NULL | - |
| email | VARCHAR(255) | UNIQUE, NOT NULL | UQ |
| email_verified_at | TIMESTAMP | NULLABLE | - |
| password | VARCHAR(255) | NOT NULL | - |
| avatar_path | VARCHAR(500) | NULLABLE | - |
| is_active | BOOLEAN | DEFAULT TRUE | IDX |
| last_login_at | TIMESTAMP | NULLABLE | - |
| remember_token | VARCHAR(100) | NULLABLE | - |
| created_at | TIMESTAMP | NULLABLE | - |
| updated_at | TIMESTAMP | NULLABLE | - |

#### `personal_access_tokens` (Sanctum — auto-managed)

#### `user_profiles`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| user_id | BIGINT UNSIGNED | FK→users, UNIQUE | UQ, FK |
| employee_id | VARCHAR(50) | NULLABLE, UNIQUE | UQ |
| department | VARCHAR(100) | NULLABLE | IDX |
| title | VARCHAR(150) | NULLABLE | - |
| phone | VARCHAR(30) | NULLABLE | - |
| bio | TEXT | NULLABLE | - |
| timezone | VARCHAR(50) | DEFAULT 'UTC' | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

#### `password_reset_tokens` (Laravel default)

#### `sessions` (if DB session driver)

---

### B. Roles & Permissions (Spatie — 4 tables)
`roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`

**10 Defined Roles:**
1. `flight_surgeon`
2. `mission_director`
3. `medical_officer`
4. `biomedical_engineer`
5. `astronaut_crew`
6. `ground_controller`
7. `cadet_student`
8. `educator_content_creator`
9. `system_administrator`
10. `auditor_compliance`

---

### C. Astronauts & Profiles

#### `astronauts`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| uuid | CHAR(36) | UNIQUE | UQ |
| user_id | BIGINT UNSIGNED | FK→users, NULLABLE | FK, IDX |
| callsign | VARCHAR(20) | UNIQUE, NOT NULL | UQ |
| full_name | VARCHAR(255) | NOT NULL | IDX |
| nationality | VARCHAR(100) | NOT NULL | IDX |
| date_of_birth | DATE | NOT NULL | - |
| blood_type | ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') | NOT NULL | - |
| gender | ENUM('male','female','other') | NOT NULL | - |
| rank | VARCHAR(100) | NULLABLE | - |
| specialization | VARCHAR(200) | NULLABLE | - |
| photo_path | VARCHAR(500) | NULLABLE | - |
| bio | TEXT | NULLABLE | - |
| is_active | BOOLEAN | DEFAULT TRUE | IDX |
| eva_certified | BOOLEAN | DEFAULT FALSE | IDX |
| total_eva_hours | DECIMAL(8,2) | DEFAULT 0 | - |
| total_space_days | INT UNSIGNED | DEFAULT 0 | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Composite Index:** `(is_active, eva_certified)`

#### `astronaut_medical_baselines`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| measured_at | TIMESTAMP | NOT NULL | IDX |
| heart_rate_bpm | SMALLINT UNSIGNED | NOT NULL | - |
| spo2_percent | DECIMAL(5,2) | NOT NULL | - |
| core_temp_celsius | DECIMAL(5,2) | NOT NULL | - |
| systolic_bp | SMALLINT UNSIGNED | NULLABLE | - |
| diastolic_bp | SMALLINT UNSIGNED | NULLABLE | - |
| respiratory_rate | SMALLINT UNSIGNED | NULLABLE | - |
| weight_kg | DECIMAL(6,2) | NULLABLE | - |
| height_cm | DECIMAL(6,2) | NULLABLE | - |
| vo2_max | DECIMAL(6,2) | NULLABLE | - |
| notes | TEXT | NULLABLE | - |
| recorded_by | BIGINT UNSIGNED | FK→users | FK |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Index:** `(astronaut_id, measured_at DESC)` — for baseline history queries

#### `astronaut_medical_records`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| record_type | ENUM('pre_flight','in_flight','post_flight','annual') | NOT NULL | IDX |
| title | VARCHAR(255) | NOT NULL | - |
| encrypted_notes | TEXT | NOT NULL | - |  
| file_path | VARCHAR(500) | NULLABLE | - |
| is_confidential | BOOLEAN | DEFAULT TRUE | IDX |
| recorded_by | BIGINT UNSIGNED | FK→users | FK |
| recorded_at | TIMESTAMP | NOT NULL | IDX |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Note:** `encrypted_notes` encrypted at application layer (AES-256)  
> **Index:** `(astronaut_id, record_type, recorded_at DESC)`

#### `astronaut_certifications`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| certification_name | VARCHAR(255) | NOT NULL | - |
| issued_at | DATE | NOT NULL | - |
| expires_at | DATE | NULLABLE | IDX |
| issuing_body | VARCHAR(255) | NOT NULL | - |
| is_valid | BOOLEAN | DEFAULT TRUE | IDX |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

---

### D. Missions

#### `missions`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| uuid | CHAR(36) | UNIQUE | UQ |
| mission_code | VARCHAR(50) | UNIQUE, NOT NULL | UQ |
| name | VARCHAR(255) | NOT NULL | IDX |
| description | TEXT | NULLABLE | - |
| mission_type | ENUM('ISS','LUNAR','MARS','DEEP_SPACE','SUBORBITAL') | NOT NULL | IDX |
| status | ENUM('planned','active','completed','aborted') | NOT NULL | IDX |
| launch_date | DATETIME | NULLABLE | IDX |
| expected_return_date | DATETIME | NULLABLE | - |
| actual_return_date | DATETIME | NULLABLE | - |
| vehicle_name | VARCHAR(100) | NULLABLE | - |
| destination | VARCHAR(255) | NULLABLE | - |
| mission_elapsed_seconds | BIGINT UNSIGNED | DEFAULT 0 | - |
| is_primary | BOOLEAN | DEFAULT FALSE | IDX |
| thumbnail_path | VARCHAR(500) | NULLABLE | - |
| created_by | BIGINT UNSIGNED | FK→users | FK |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Composite Index:** `(status, mission_type)`, `(status, launch_date DESC)`

#### `mission_crew_assignments`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| mission_id | BIGINT UNSIGNED | FK→missions | FK, IDX |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| crew_role | VARCHAR(100) | NOT NULL | - |
| assigned_at | TIMESTAMP | NOT NULL | IDX |
| removed_at | TIMESTAMP | NULLABLE | - |
| is_primary_crew | BOOLEAN | DEFAULT TRUE | IDX |
| notes | TEXT | NULLABLE | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Unique Index:** `(mission_id, astronaut_id)` — one assignment per astronaut per mission  
> **Composite Index:** `(mission_id, is_primary_crew)`

#### `mission_phases`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| mission_id | BIGINT UNSIGNED | FK→missions | FK, IDX |
| phase_name | VARCHAR(100) | NOT NULL | - |
| phase_order | TINYINT UNSIGNED | NOT NULL | - |
| status | ENUM('pending','active','completed','skipped') | NOT NULL | IDX |
| started_at | TIMESTAMP | NULLABLE | IDX |
| completed_at | TIMESTAMP | NULLABLE | - |
| description | TEXT | NULLABLE | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Index:** `(mission_id, phase_order)`

#### `mission_media`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| mission_id | BIGINT UNSIGNED | FK→missions | FK, IDX |
| media_type | ENUM('photo','video','document') | NOT NULL | IDX |
| title | VARCHAR(255) | NULLABLE | - |
| file_path | VARCHAR(500) | NOT NULL | - |
| file_size_bytes | BIGINT UNSIGNED | NULLABLE | - |
| taken_at | TIMESTAMP | NULLABLE | IDX |
| uploaded_by | BIGINT UNSIGNED | FK→users | FK |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

#### `mission_notes`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| mission_id | BIGINT UNSIGNED | FK→missions | FK, IDX |
| author_id | BIGINT UNSIGNED | FK→users | FK |
| content | TEXT | NOT NULL | - |
| is_flagged | BOOLEAN | DEFAULT FALSE | IDX |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

---

### E. Telemetry & Vitals

#### `telemetry_sessions`
> Represents one sync batch from the mobile app

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| uuid | CHAR(36) | UNIQUE | UQ |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| mission_id | BIGINT UNSIGNED | FK→missions, NULLABLE | FK, IDX |
| device_id | VARCHAR(100) | NULLABLE | IDX |
| session_type | ENUM('realtime','sync','manual') | NOT NULL | IDX |
| connection_quality | ENUM('excellent','good','fair','poor','offline') | NULLABLE | - |
| started_at | TIMESTAMP | NOT NULL | IDX |
| ended_at | TIMESTAMP | NULLABLE | - |
| received_at | TIMESTAMP | NOT NULL | IDX |
| packet_count | INT UNSIGNED | DEFAULT 0 | - |
| is_complete | BOOLEAN | DEFAULT FALSE | IDX |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Composite Index:** `(astronaut_id, started_at DESC)`, `(mission_id, started_at DESC)`

#### `vital_readings`
> Core vitals — one row per reading packet

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| session_id | BIGINT UNSIGNED | FK→telemetry_sessions | FK, IDX |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| measured_at | TIMESTAMP(3) | NOT NULL | IDX |
| received_at | TIMESTAMP | NOT NULL | - |
| heart_rate_bpm | SMALLINT UNSIGNED | NULLABLE | - |
| spo2_percent | DECIMAL(5,2) | NULLABLE | - |
| core_temp_celsius | DECIMAL(5,2) | NULLABLE | - |
| respiratory_rate_bpm | DECIMAL(5,2) | NULLABLE | - |
| systolic_bp | SMALLINT UNSIGNED | NULLABLE | - |
| diastolic_bp | SMALLINT UNSIGNED | NULLABLE | - |
| hrv_rmssd_ms | DECIMAL(8,3) | NULLABLE | - |
| stress_index | DECIMAL(5,2) | NULLABLE | - |
| sleep_quality_score | DECIMAL(5,2) | NULLABLE | - |
| mood_score | TINYINT | NULLABLE | - |
| blood_glucose_mgdl | DECIMAL(6,2) | NULLABLE | - |
| status | ENUM('nominal','warning','critical') | NOT NULL | IDX |
| raw_payload | JSON | NULLABLE | - |
| created_at | TIMESTAMP | - | - |

> **Composite Index:** `(astronaut_id, measured_at DESC)`, `(session_id, measured_at)`, `(status, measured_at DESC)`  
> **Note:** `measured_at` uses TIMESTAMP(3) for millisecond precision. No `updated_at` — readings are immutable.

#### `organ_telemetry_readings`
> Per-organ health scores from mobile app (matches the uploaded screenshot)

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| session_id | BIGINT UNSIGNED | FK→telemetry_sessions | FK, IDX |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| measured_at | TIMESTAMP | NOT NULL | IDX |
| organ_system_id | BIGINT UNSIGNED | FK→organ_systems | FK, IDX |
| health_score_percent | DECIMAL(5,2) | NOT NULL | IDX |
| primary_metric_value | VARCHAR(100) | NOT NULL | - |
| primary_metric_unit | VARCHAR(50) | NULLABLE | - |
| status | ENUM('nominal','warning','critical') | NOT NULL | IDX |
| raw_data | JSON | NULLABLE | - |
| created_at | TIMESTAMP | - | - |

> **Composite Index:** `(astronaut_id, organ_system_id, measured_at DESC)`

#### `ecg_recordings`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| session_id | BIGINT UNSIGNED | FK→telemetry_sessions | FK, IDX |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| measured_at | TIMESTAMP | NOT NULL | IDX |
| duration_seconds | SMALLINT UNSIGNED | NOT NULL | - |
| sample_rate_hz | SMALLINT UNSIGNED | DEFAULT 500 | - |
| waveform_data | LONGTEXT | NULLABLE | - |
| file_path | VARCHAR(500) | NULLABLE | - |
| interpretation | TEXT | NULLABLE | - |
| rhythm | VARCHAR(100) | NULLABLE | - |
| is_flagged | BOOLEAN | DEFAULT FALSE | IDX |
| created_at | TIMESTAMP | - | - |

#### `eeg_recordings`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| session_id | BIGINT UNSIGNED | FK→telemetry_sessions | FK, IDX |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| measured_at | TIMESTAMP | NOT NULL | IDX |
| alpha_hz | DECIMAL(6,3) | NULLABLE | - |
| beta_hz | DECIMAL(6,3) | NULLABLE | - |
| theta_hz | DECIMAL(6,3) | NULLABLE | - |
| delta_hz | DECIMAL(6,3) | NULLABLE | - |
| cognitive_load_index | DECIMAL(5,2) | NULLABLE | - |
| is_flagged | BOOLEAN | DEFAULT FALSE | IDX |
| created_at | TIMESTAMP | - | - |

#### `radiation_readings`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| session_id | BIGINT UNSIGNED | FK→telemetry_sessions | FK, IDX |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| measured_at | TIMESTAMP | NOT NULL | IDX |
| dose_rate_msv_hr | DECIMAL(10,6) | NOT NULL | - |
| cumulative_dose_msv | DECIMAL(12,6) | NOT NULL | - |
| particle_type | VARCHAR(50) | NULLABLE | - |
| energy_spectra | JSON | NULLABLE | - |
| shelter_recommended | BOOLEAN | DEFAULT FALSE | IDX |
| created_at | TIMESTAMP | - | - |

#### `suit_telemetry`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| session_id | BIGINT UNSIGNED | FK→telemetry_sessions | FK, IDX |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| measured_at | TIMESTAMP | NOT NULL | IDX |
| suit_pressure_kpa | DECIMAL(8,3) | NULLABLE | - |
| o2_partial_pressure_kpa | DECIMAL(8,3) | NULLABLE | - |
| co2_scrubber_efficiency | DECIMAL(5,2) | NULLABLE | - |
| suit_temp_inner_celsius | DECIMAL(5,2) | NULLABLE | - |
| battery_percent | DECIMAL(5,2) | NULLABLE | - |
| eva_duration_minutes | SMALLINT UNSIGNED | NULLABLE | - |
| status | ENUM('nominal','warning','critical') | NOT NULL | IDX |
| created_at | TIMESTAMP | - | - |

#### `environment_telemetry`
> Cabin / station environment data

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| mission_id | BIGINT UNSIGNED | FK→missions | FK, IDX |
| measured_at | TIMESTAMP | NOT NULL | IDX |
| cabin_pressure_kpa | DECIMAL(8,3) | NULLABLE | - |
| o2_percent | DECIMAL(5,2) | NULLABLE | - |
| co2_ppm | DECIMAL(8,2) | NULLABLE | - |
| humidity_percent | DECIMAL(5,2) | NULLABLE | - |
| temperature_celsius | DECIMAL(5,2) | NULLABLE | - |
| noise_db | DECIMAL(5,2) | NULLABLE | - |
| created_at | TIMESTAMP | - | - |

#### `telemetry_thresholds`
> Configurable alert thresholds per metric per astronaut

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts, NULLABLE | FK, IDX |
| metric_name | VARCHAR(100) | NOT NULL | IDX |
| warning_min | DECIMAL(12,4) | NULLABLE | - |
| warning_max | DECIMAL(12,4) | NULLABLE | - |
| critical_min | DECIMAL(12,4) | NULLABLE | - |
| critical_max | DECIMAL(12,4) | NULLABLE | - |
| unit | VARCHAR(30) | NULLABLE | - |
| is_global | BOOLEAN | DEFAULT FALSE | IDX |
| set_by | BIGINT UNSIGNED | FK→users | FK |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Unique Index:** `(astronaut_id, metric_name)` — one threshold per metric per astronaut  
> **Note:** `astronaut_id = NULL` + `is_global = TRUE` = global default threshold

#### `telemetry_aggregates`
> Pre-computed hourly/daily aggregates to avoid expensive GROUP BY at runtime

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| period_type | ENUM('hourly','daily','weekly') | NOT NULL | IDX |
| period_start | TIMESTAMP | NOT NULL | IDX |
| metric_name | VARCHAR(100) | NOT NULL | IDX |
| avg_value | DECIMAL(12,4) | NULLABLE | - |
| min_value | DECIMAL(12,4) | NULLABLE | - |
| max_value | DECIMAL(12,4) | NULLABLE | - |
| reading_count | INT UNSIGNED | DEFAULT 0 | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Composite Index:** `(astronaut_id, period_type, period_start, metric_name)` UNIQUE

#### `mission_elapsed_time_logs`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| mission_id | BIGINT UNSIGNED | FK→missions | FK, IDX |
| event_type | VARCHAR(100) | NOT NULL | - |
| event_description | TEXT | NULLABLE | - |
| met_seconds | BIGINT UNSIGNED | NOT NULL | IDX |
| logged_at | TIMESTAMP | NOT NULL | IDX |
| logged_by | BIGINT UNSIGNED | FK→users | FK |
| created_at | TIMESTAMP | - | - |

---

### F. Organ Systems

#### `organ_systems`
> Reference table for the 6 organ systems tracked by the mobile app

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| slug | VARCHAR(50) | UNIQUE | UQ |
| name | VARCHAR(100) | NOT NULL | - |
| category | VARCHAR(100) | NOT NULL | - |
| primary_metric | VARCHAR(100) | NOT NULL | - |
| primary_unit | VARCHAR(50) | NULLABLE | - |
| icon_name | VARCHAR(50) | NULLABLE | - |
| description | TEXT | NULLABLE | - |
| nominal_range_min | DECIMAL(10,4) | NULLABLE | - |
| nominal_range_max | DECIMAL(10,4) | NULLABLE | - |
| warning_range_min | DECIMAL(10,4) | NULLABLE | - |
| warning_range_max | DECIMAL(10,4) | NULLABLE | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

**Seeded records:**
1. `heart` / Cardiovascular / Heart Rate / BPM
2. `lungs` / Respiratory / SpO2 / %
3. `brain` / Central Nervous / Alpha Waves / Hz
4. `liver` / Hepatic-Metabolic / ALT/AST / U/L
5. `kidneys` / Renal System / Hydration / %
6. `whole-body` / Systemic Bio-Scan / Core Temperature / °C

#### `organ_system_notes`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| organ_telemetry_reading_id | BIGINT UNSIGNED | FK→organ_telemetry_readings | FK, IDX |
| author_id | BIGINT UNSIGNED | FK→users | FK |
| note | TEXT | NOT NULL | - |
| created_at | TIMESTAMP | - | - |

---

### G. AI Insights & Clinical Review

#### `ai_analysis_jobs`
> Records of AI analysis requests received from the mobile/AI pipeline

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| uuid | CHAR(36) | UNIQUE | UQ |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| session_id | BIGINT UNSIGNED | FK→telemetry_sessions, NULLABLE | FK, IDX |
| model_name | VARCHAR(100) | NOT NULL | IDX |
| model_version | VARCHAR(50) | NULLABLE | - |
| analysis_type | ENUM('rhythm','stress','hypoxia','inflammation','cognitive','metabolic','comprehensive') | NOT NULL | IDX |
| status | ENUM('pending','processing','completed','failed') | NOT NULL | IDX |
| input_data_hash | VARCHAR(64) | NULLABLE | - |
| received_at | TIMESTAMP | NOT NULL | IDX |
| processed_at | TIMESTAMP | NULLABLE | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Composite Index:** `(astronaut_id, analysis_type, received_at DESC)`, `(status, received_at DESC)`

#### `ai_insights`
> Individual findings from an AI analysis job

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| job_id | BIGINT UNSIGNED | FK→ai_analysis_jobs | FK, IDX |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts | FK, IDX |
| insight_type | VARCHAR(100) | NOT NULL | IDX |
| title | VARCHAR(255) | NOT NULL | - |
| description | TEXT | NOT NULL | - |
| confidence_score | DECIMAL(5,4) | NOT NULL | IDX |
| severity | ENUM('info','low','medium','high','critical') | NOT NULL | IDX |
| recommended_action | TEXT | NULLABLE | - |
| raw_output | JSON | NULLABLE | - |
| analyzed_at | TIMESTAMP | NOT NULL | IDX |
| review_status | ENUM('pending_review','approved','rejected','modified') | NOT NULL | IDX |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Composite Index:** `(astronaut_id, severity, review_status)`, `(review_status, analyzed_at DESC)`

#### `clinical_reviews`
> Flight Surgeon's human-in-the-loop review of AI insights

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| insight_id | BIGINT UNSIGNED | FK→ai_insights, UNIQUE | UQ, FK |
| reviewer_id | BIGINT UNSIGNED | FK→users | FK, IDX |
| decision | ENUM('approved','rejected','modified') | NOT NULL | IDX |
| modified_description | TEXT | NULLABLE | - |
| reviewer_notes | TEXT | NULLABLE | - |
| reviewed_at | TIMESTAMP | NOT NULL | IDX |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Index:** `(reviewer_id, reviewed_at DESC)`

#### `ai_model_registry`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| model_name | VARCHAR(100) | UNIQUE, NOT NULL | UQ |
| version | VARCHAR(50) | NOT NULL | - |
| description | TEXT | NULLABLE | - |
| is_active | BOOLEAN | DEFAULT TRUE | IDX |
| accuracy_score | DECIMAL(5,4) | NULLABLE | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

---

### H. Alerts & Triage

#### `alerts`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| uuid | CHAR(36) | UNIQUE | UQ |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts, NULLABLE | FK, IDX |
| mission_id | BIGINT UNSIGNED | FK→missions, NULLABLE | FK, IDX |
| source_type | ENUM('vital_reading','organ_telemetry','ai_insight','manual','environment') | NOT NULL | IDX |
| source_id | BIGINT UNSIGNED | NULLABLE | IDX |
| alert_code | VARCHAR(50) | NOT NULL | IDX |
| title | VARCHAR(255) | NOT NULL | - |
| description | TEXT | NOT NULL | - |
| severity | ENUM('info','low','medium','high','critical') | NOT NULL | IDX |
| status | ENUM('triggered','acknowledged','escalated','resolved','dismissed') | NOT NULL | IDX |
| triggered_at | TIMESTAMP | NOT NULL | IDX |
| acknowledged_at | TIMESTAMP | NULLABLE | - |
| resolved_at | TIMESTAMP | NULLABLE | - |
| is_duplicate | BOOLEAN | DEFAULT FALSE | IDX |
| dedup_hash | VARCHAR(64) | NULLABLE | IDX |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Composite Index:** `(status, severity, triggered_at DESC)`, `(astronaut_id, status)`, `(dedup_hash)` for deduplication

#### `alert_acknowledgements`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| alert_id | BIGINT UNSIGNED | FK→alerts | FK, IDX |
| acknowledged_by | BIGINT UNSIGNED | FK→users | FK |
| action_taken | TEXT | NULLABLE | - |
| acknowledged_at | TIMESTAMP | NOT NULL | IDX |
| created_at | TIMESTAMP | - | - |

#### `alert_escalations`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| alert_id | BIGINT UNSIGNED | FK→alerts | FK, IDX |
| escalated_by | BIGINT UNSIGNED | FK→users, NULLABLE | FK |
| escalated_to_role | VARCHAR(50) | NOT NULL | IDX |
| reason | TEXT | NULLABLE | - |
| escalated_at | TIMESTAMP | NOT NULL | IDX |
| created_at | TIMESTAMP | - | - |

#### `alert_notification_logs`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| alert_id | BIGINT UNSIGNED | FK→alerts | FK, IDX |
| notified_user_id | BIGINT UNSIGNED | FK→users | FK |
| channel | ENUM('in_app','email','sms') | NOT NULL | - |
| sent_at | TIMESTAMP | NOT NULL | IDX |
| delivered | BOOLEAN | DEFAULT FALSE | IDX |

---

### I. Reports

#### `reports`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| uuid | CHAR(36) | UNIQUE | UQ |
| report_code | VARCHAR(20) | NOT NULL | IDX |
| title | VARCHAR(255) | NOT NULL | - |
| report_type | ENUM('crew_health_summary','equipment_performance','mission_analysis','forensic_timeline','ai_validation','alert_summary','medication_log','eva_debrief','post_mission') | NOT NULL | IDX |
| astronaut_id | BIGINT UNSIGNED | FK→astronauts, NULLABLE | FK, IDX |
| mission_id | BIGINT UNSIGNED | FK→missions, NULLABLE | FK, IDX |
| generated_by | BIGINT UNSIGNED | FK→users | FK |
| period_start | TIMESTAMP | NULLABLE | IDX |
| period_end | TIMESTAMP | NULLABLE | - |
| status | ENUM('draft','pending_review','approved','published','archived') | NOT NULL | IDX |
| approved_by | BIGINT UNSIGNED | FK→users, NULLABLE | FK |
| approved_at | TIMESTAMP | NULLABLE | - |
| file_path_pdf | VARCHAR(500) | NULLABLE | - |
| file_path_csv | VARCHAR(500) | NULLABLE | - |
| summary | TEXT | NULLABLE | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Index:** `(report_type, status, created_at DESC)`, `(generated_by, created_at DESC)`

#### `report_forensic_events`
> Individual events plotted on the forensic timeline

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| report_id | BIGINT UNSIGNED | FK→reports | FK, IDX |
| event_time | TIMESTAMP | NOT NULL | IDX |
| event_type | VARCHAR(100) | NOT NULL | IDX |
| title | VARCHAR(255) | NOT NULL | - |
| description | TEXT | NULLABLE | - |
| related_metric | VARCHAR(100) | NULLABLE | - |
| metric_value | VARCHAR(100) | NULLABLE | - |
| severity | ENUM('info','low','medium','high','critical') | NULLABLE | IDX |
| sort_order | INT UNSIGNED | DEFAULT 0 | - |
| created_at | TIMESTAMP | - | - |

---

### J. Academy & Gamification

#### `academy_courses`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| uuid | CHAR(36) | UNIQUE | UQ |
| title | VARCHAR(255) | NOT NULL | IDX |
| slug | VARCHAR(255) | UNIQUE | UQ |
| target_audience | ENUM('kids','adults','both') | NOT NULL | IDX |
| category | VARCHAR(100) | NOT NULL | IDX |
| difficulty | ENUM('beginner','intermediate','advanced') | NOT NULL | IDX |
| description | TEXT | NULLABLE | - |
| thumbnail_path | VARCHAR(500) | NULLABLE | - |
| xp_reward | SMALLINT UNSIGNED | DEFAULT 0 | - |
| is_published | BOOLEAN | DEFAULT FALSE | IDX |
| sort_order | SMALLINT UNSIGNED | DEFAULT 0 | IDX |
| created_by | BIGINT UNSIGNED | FK→users | FK |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

#### `academy_lessons`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| course_id | BIGINT UNSIGNED | FK→academy_courses | FK, IDX |
| title | VARCHAR(255) | NOT NULL | - |
| content | LONGTEXT | NOT NULL | - |
| lesson_type | ENUM('text','video','quiz','game') | NOT NULL | IDX |
| sort_order | SMALLINT UNSIGNED | DEFAULT 0 | - |
| xp_reward | SMALLINT UNSIGNED | DEFAULT 0 | - |
| duration_minutes | SMALLINT UNSIGNED | NULLABLE | - |
| is_published | BOOLEAN | DEFAULT FALSE | IDX |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

#### `academy_quizzes`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| lesson_id | BIGINT UNSIGNED | FK→academy_lessons | FK, IDX |
| question | TEXT | NOT NULL | - |
| options | JSON | NOT NULL | - |
| correct_option_index | TINYINT UNSIGNED | NOT NULL | - |
| explanation | TEXT | NULLABLE | - |
| sort_order | TINYINT UNSIGNED | DEFAULT 0 | - |
| created_at | TIMESTAMP | - | - |

#### `academy_mini_games`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| title | VARCHAR(255) | NOT NULL | - |
| slug | VARCHAR(100) | UNIQUE | UQ |
| game_type | VARCHAR(100) | NOT NULL | - |
| target_audience | ENUM('kids','all') | NOT NULL | IDX |
| description | TEXT | NULLABLE | - |
| xp_reward | SMALLINT UNSIGNED | DEFAULT 0 | - |
| is_active | BOOLEAN | DEFAULT TRUE | IDX |
| created_at | TIMESTAMP | - | - |

#### `user_academy_progress`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| user_id | BIGINT UNSIGNED | FK→users | FK, IDX |
| course_id | BIGINT UNSIGNED | FK→academy_courses | FK, IDX |
| lesson_id | BIGINT UNSIGNED | FK→academy_lessons, NULLABLE | FK, IDX |
| status | ENUM('not_started','in_progress','completed') | NOT NULL | IDX |
| completed_at | TIMESTAMP | NULLABLE | IDX |
| score_percent | DECIMAL(5,2) | NULLABLE | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Unique Index:** `(user_id, course_id, lesson_id)`

#### `user_xp_records`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| user_id | BIGINT UNSIGNED | FK→users | FK, IDX |
| source_type | ENUM('lesson','quiz','game','badge','report') | NOT NULL | IDX |
| source_id | BIGINT UNSIGNED | NULLABLE | - |
| xp_earned | SMALLINT UNSIGNED | NOT NULL | - |
| earned_at | TIMESTAMP | NOT NULL | IDX |
| created_at | TIMESTAMP | - | - |

#### `badges`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| slug | VARCHAR(100) | UNIQUE | UQ |
| name | VARCHAR(255) | NOT NULL | - |
| description | TEXT | NULLABLE | - |
| icon_path | VARCHAR(500) | NULLABLE | - |
| xp_required | INT UNSIGNED | DEFAULT 0 | IDX |
| category | VARCHAR(100) | NULLABLE | IDX |
| created_at | TIMESTAMP | - | - |

#### `user_badges`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| user_id | BIGINT UNSIGNED | FK→users | FK, IDX |
| badge_id | BIGINT UNSIGNED | FK→badges | FK, IDX |
| earned_at | TIMESTAMP | NOT NULL | IDX |

> **Unique Index:** `(user_id, badge_id)`

---

### K. Articles

#### `articles`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| uuid | CHAR(36) | UNIQUE | UQ |
| author_id | BIGINT UNSIGNED | FK→users | FK, IDX |
| title | VARCHAR(255) | NOT NULL | IDX |
| slug | VARCHAR(255) | UNIQUE | UQ |
| excerpt | TEXT | NULLABLE | - |
| content | LONGTEXT | NOT NULL | - |
| target_audience | ENUM('kids','adults') | NOT NULL | IDX |
| category | VARCHAR(100) | NULLABLE | IDX |
| thumbnail_path | VARCHAR(500) | NULLABLE | - |
| reading_time_minutes | TINYINT UNSIGNED | NULLABLE | - |
| is_published | BOOLEAN | DEFAULT FALSE | IDX |
| published_at | TIMESTAMP | NULLABLE | IDX |
| views_count | INT UNSIGNED | DEFAULT 0 | - |
| created_at | TIMESTAMP | - | - |
| updated_at | TIMESTAMP | - | - |

> **Composite Index:** `(target_audience, is_published, published_at DESC)`

#### `article_tags`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| name | VARCHAR(100) | UNIQUE | UQ |
| slug | VARCHAR(100) | UNIQUE | UQ |
| created_at | TIMESTAMP | - | - |

#### `article_tag_pivot`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| article_id | BIGINT UNSIGNED | FK→articles | FK, IDX |
| tag_id | BIGINT UNSIGNED | FK→article_tags | FK, IDX |

> **Primary Key:** `(article_id, tag_id)`

---

### L. Audit & Security

#### `audit_logs`
> Hash-chained, immutable audit trail

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| user_id | BIGINT UNSIGNED | FK→users, NULLABLE | FK, IDX |
| event_type | VARCHAR(100) | NOT NULL | IDX |
| auditable_type | VARCHAR(100) | NOT NULL | IDX |
| auditable_id | BIGINT UNSIGNED | NULLABLE | IDX |
| description | TEXT | NOT NULL | - |
| old_values | JSON | NULLABLE | - |
| new_values | JSON | NULLABLE | - |
| ip_address | VARCHAR(45) | NULLABLE | IDX |
| user_agent | VARCHAR(500) | NULLABLE | - |
| previous_hash | CHAR(64) | NULLABLE | - |
| current_hash | CHAR(64) | NOT NULL | IDX |
| created_at | TIMESTAMP | NOT NULL | IDX |

> **Composite Index:** `(event_type, created_at DESC)`, `(user_id, created_at DESC)`, `(auditable_type, auditable_id)`  
> **Note:** No `updated_at` — audit logs are NEVER updated or deleted (immutable). Hash chain: `SHA256(previous_hash + user_id + event_type + description + created_at)`

#### `login_history`
| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| user_id | BIGINT UNSIGNED | FK→users | FK, IDX |
| ip_address | VARCHAR(45) | NOT NULL | IDX |
| user_agent | VARCHAR(500) | NULLABLE | - |
| status | ENUM('success','failed','blocked') | NOT NULL | IDX |
| logged_at | TIMESTAMP | NOT NULL | IDX |

> **Composite Index:** `(user_id, logged_at DESC)`, `(ip_address, logged_at DESC)`

#### `encryption_keys`
> Tracks encryption key rotation (medical notes encryption)

| Column | Type | Constraints | Index |
|--------|------|-------------|-------|
| id | BIGINT UNSIGNED | PK | PK |
| key_identifier | VARCHAR(100) | UNIQUE | UQ |
| is_active | BOOLEAN | DEFAULT TRUE | IDX |
| activated_at | TIMESTAMP | NOT NULL | - |
| retired_at | TIMESTAMP | NULLABLE | - |
| created_at | TIMESTAMP | - | - |

---

## Table Count Summary

| Group | Tables |
|-------|--------|
| A — Users | 3 |
| B — Spatie RBAC | 5 |
| C — Astronauts | 4 |
| D — Missions | 5 |
| E — Telemetry | 11 |
| F — Organ Systems | 2 |
| G — AI Insights | 4 |
| H — Alerts | 4 |
| I — Reports | 2 |
| J — Academy | 8 |
| K — Articles | 3 |
| L — Audit | 3 |
| **Total** | **54** |

---

## Model Relationships Summary

```
User
  ├── hasOne: UserProfile
  ├── hasMany: PersonalAccessTokens (Sanctum)
  ├── morphToMany: Roles (Spatie)
  ├── hasMany: AuditLogs
  ├── hasMany: LoginHistory
  └── hasOne: Astronaut (nullable)

Astronaut
  ├── belongsTo: User (nullable)
  ├── hasMany: MedicalBaselines
  ├── hasMany: MedicalRecords
  ├── hasMany: Certifications
  ├── belongsToMany: Missions (via MissionCrewAssignments)
  ├── hasMany: TelemetrySessions
  ├── hasMany: VitalReadings
  ├── hasMany: OrganTelemetryReadings
  ├── hasMany: EcgRecordings
  ├── hasMany: EegRecordings
  ├── hasMany: RadiationReadings
  ├── hasMany: SuitTelemetry
  ├── hasMany: AiAnalysisJobs
  ├── hasMany: AiInsights
  ├── hasMany: Alerts
  └── hasMany: Reports

Mission
  ├── belongsToMany: Astronauts (via MissionCrewAssignments)
  ├── hasMany: MissionPhases
  ├── hasMany: MissionMedia
  ├── hasMany: MissionNotes
  ├── hasMany: TelemetrySessions
  ├── hasMany: EnvironmentTelemetry
  ├── hasMany: Alerts
  ├── hasMany: Reports
  └── hasMany: MissionElapsedTimeLogs

TelemetrySession
  ├── belongsTo: Astronaut
  ├── belongsTo: Mission (nullable)
  ├── hasMany: VitalReadings
  ├── hasMany: OrganTelemetryReadings
  ├── hasMany: EcgRecordings
  ├── hasMany: EegRecordings
  ├── hasMany: RadiationReadings
  └── hasMany: SuitTelemetry

AiInsight
  ├── belongsTo: AiAnalysisJob
  ├── belongsTo: Astronaut
  └── hasOne: ClinicalReview

Alert
  ├── belongsTo: Astronaut (nullable)
  ├── belongsTo: Mission (nullable)
  ├── hasMany: AlertAcknowledgements
  ├── hasMany: AlertEscalations
  └── hasMany: AlertNotificationLogs

AcademyCourse
  ├── hasMany: AcademyLessons
  └── belongsToMany: Users (via UserAcademyProgress)

AcademyLesson
  ├── belongsTo: AcademyCourse
  └── hasMany: AcademyQuizzes

Article
  ├── belongsTo: User (author)
  └── belongsToMany: ArticleTags (via ArticleTagPivot)
```

---

## N+1 Prevention Strategy

### Eager Loading Rules
```php
// ALWAYS eager load in controllers:
Astronaut::with(['user', 'missionCrewAssignments.mission', 'latestVitals'])->get()

// Use scoped relationships for "latest" queries:
public function latestVitals(): HasOne
{
    return $this->hasOne(VitalReading::class)->latestOfMany();
}

// Use withCount() instead of count() in loops:
Mission::withCount(['crewAssignments', 'alerts'])->get()
```

### Query Scopes for Common Patterns
```php
// VitalReading scope
scopeLatestPerAstronaut() // Uses subquery, not N+1
scopeInTimeRange($start, $end)
scopeCritical() // where status = 'critical'

// Alert scope
scopeUnresolved()
scopeForRole($role) // filter by role-visible alerts
```

### Pagination Policy
- All list endpoints: paginate (default 15, max 100)
- Telemetry streams: paginate (default 50, max 500)
- Never return unbounded collections

---

## Deliverables for Phase 02
- [ ] All 54 migrations created and working
- [ ] All models with correct fillable, casts, relationships
- [ ] All indexes created (composite + single)
- [ ] Seeders: organ_systems (6 records), roles + permissions (10 roles, 50+ permissions), telemetry_thresholds defaults
- [ ] Factories for all major models (for testing)
- [ ] Zero N+1 queries confirmed by Laravel Debugbar/Telescope
- [ ] Query builder scopes defined on all major models
