# Phase 02 — Database Notes

## Critical Design Decisions

### Why TIMESTAMP(3) for vital_readings.measured_at?
Vitals can be sampled at high frequency (up to 500Hz ECG). Millisecond precision avoids timestamp collisions within the same second. MySQL 8.0+ supports fractional seconds in indexes.

### Encrypted Medical Records
`astronaut_medical_records.encrypted_notes` is encrypted at the **application layer** using Laravel's built-in encryption (`Crypt::encryptString()`). The database stores ciphertext. Only authenticated users with `view_medical_records` permission can decrypt.

**Model cast:**
```php
protected $casts = [
    'encrypted_notes' => 'encrypted', // Laravel built-in
];
```

### Hash-Chained Audit Logs
The `audit_logs` table forms a cryptographic chain:
```
current_hash = SHA256(
    previous_log.current_hash 
    + user_id 
    + event_type 
    + created_at.unix_timestamp
)
```
- First record: `previous_hash = NULL`, `current_hash = SHA256('GENESIS' + ...)`
- Auditor role can verify chain integrity via dedicated API endpoint
- Logs are NEVER deleted or updated — only INSERT is allowed

### Telemetry Aggregates Table
`telemetry_aggregates` is populated by a scheduled Laravel command:
- **Hourly job**: computes hourly stats for all active astronauts
- **Daily job**: computes daily stats
- Dashboard queries hit aggregates, not raw `vital_readings`
- Raw readings are for forensic/detailed drill-down only

### Deduplication for Alerts
```php
$dedupHash = sha1($astronautId . $alertCode . $metric . $hour);
Alert::firstOrCreate(['dedup_hash' => $dedupHash], [...]);
```
Prevents spam alerts for the same condition within the same hour window.

### Soft Deletes Policy
- `users`: use `SoftDeletes` (account deactivation)
- `astronauts`: use `SoftDeletes` (retired astronauts)
- `missions`: NO soft deletes — missions are archived (status = 'completed/aborted')
- `vital_readings`: NO soft deletes — immutable telemetry data
- `audit_logs`: NO soft deletes — EVER
- `alerts`: NO soft deletes — `status = 'dismissed'` instead
- All other models: use `SoftDeletes` where user-generated content

### JSON Columns
MySQL 8.0 supports JSON columns with indexing. Used for:
- `vital_readings.raw_payload` — full original packet
- `organ_telemetry_readings.raw_data` — full organ data
- `ecg_recordings.waveform_data` — ECG samples
- `ai_insights.raw_output` — full AI model output
- `academy_quizzes.options` — quiz answer options

### Index Strategy Summary
1. All foreign keys have indexes (MySQL doesn't auto-create these on FK definition)
2. All `created_at` on high-write tables indexed for time-range queries
3. Composite indexes always ordered: (high-cardinality, low-cardinality) — e.g., `(astronaut_id, status)` not `(status, astronaut_id)`
4. `uuid` columns indexed as UNIQUE but not used as PK (use BIGINT PK for join performance)

## Open Issues
- [ ] Decide on waveform storage: JSON column vs binary file on disk with `file_path`
- [ ] Confirm whether to add `deleted_at` to `astronaut_medical_records`
- [ ] MySQL 8.0 `FULLTEXT` index on `articles.content` for search?
