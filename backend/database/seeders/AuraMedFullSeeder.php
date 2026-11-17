<?php

namespace Database\Seeders;

use App\Models\AcademyCourse;
use App\Models\AcademyLesson;
use App\Models\AcademyMiniGame;
use App\Models\AcademyQuiz;
use App\Models\AiAnalysisJob;
use App\Models\AiInsight;
use App\Models\Alert;
use App\Models\AlertAcknowledgement;
use App\Models\AlertEscalation;
use App\Models\Article;
use App\Models\ArticleTag;
use App\Models\Astronaut;
use App\Models\AuditLog;
use App\Models\Badge;
use App\Models\ClinicalReview;
use App\Models\Mission;
use App\Models\Report;
use App\Models\ReportForensicEvent;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserXpRecord;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AuraMedFullSeeder extends Seeder
{
    public function run(): void
    {
        $surgeon = User::where('email', 'flight_surgeon@auramed.nasa.gov')->first() ?? User::first();
        $director = User::where('email', 'mission_director@auramed.nasa.gov')->first() ?? $surgeon;
        $cadet = User::where('email', 'cadet_student@auramed.nasa.gov')->first() ?? $surgeon;
        $astronaut = Astronaut::first();
        $mission = Mission::first();

        // 1. AI Insights & Jobs
        if (AiInsight::count() === 0 && $astronaut) {
            $job = AiAnalysisJob::create([
                'uuid' => (string) Str::uuid(),
                'astronaut_id' => $astronaut->id,
                'model_name' => 'CardiacBio-DeepRhythm',
                'model_version' => 'v3.2.1',
                'analysis_type' => 'rhythm',
                'status' => 'completed',
                'input_data_hash' => hash('sha256', 'ecg-500hz-window-01'),
                'received_at' => now()->subHours(2),
                'processed_at' => now()->subHours(2)->addSeconds(4),
            ]);

            $insight1 = AiInsight::create([
                'job_id' => $job->id,
                'astronaut_id' => $astronaut->id,
                'insight_type' => 'ventricular_ectopy',
                'title' => 'Transient Premature Ventricular Contractions (PVC)',
                'description' => 'Detected 3 isolated unifocal PVCs during post-EVA repressurization cycle. QT interval within acceptable threshold (410ms).',
                'confidence_score' => 0.9420,
                'severity' => 'medium',
                'recommended_action' => 'Continuous telemetry observation for 6 hours; verify serum potassium and magnesium baselines.',
                'analyzed_at' => now()->subHours(2),
                'review_status' => 'approved',
            ]);

            ClinicalReview::create([
                'insight_id' => $insight1->id,
                'reviewer_id' => $surgeon->id,
                'decision' => 'approved',
                'reviewer_notes' => 'Reviewed 12-lead telemetry stream. Benign post-exertion finding consistent with previous microgravity adaptions.',
                'reviewed_at' => now()->subHour(),
            ]);

            AiInsight::create([
                'job_id' => $job->id,
                'astronaut_id' => $astronaut->id,
                'insight_type' => 'hypoxia_early_warning',
                'title' => 'Nocturnal Peripheral Oxygen Desaturation Warning',
                'description' => 'SpO2 dipped to 94% for 110 seconds during REM phase sleep cycle. Correlates with slight increase in cabin CO2 partial pressure (3.8 mmHg).',
                'confidence_score' => 0.9150,
                'severity' => 'high',
                'recommended_action' => 'Increase cabin ventilation fan flow rate by 15%; verify sleep quarters scrubbers.',
                'analyzed_at' => now()->subHours(1),
                'review_status' => 'pending_review',
            ]);
        }

        // 2. Alerts Triage
        if (Alert::count() === 0 && $astronaut && $mission) {
            $alert1 = Alert::create([
                'uuid' => (string) Str::uuid(),
                'astronaut_id' => $astronaut->id,
                'mission_id' => $mission->id,
                'source_type' => 'vital_reading',
                'alert_code' => 'ALT-SPO2-01',
                'title' => 'Slight Hypoxic Drift (SpO2 93%)',
                'description' => 'Sustained pulse oximetry dip below standard baseline during EVA training exercise.',
                'severity' => 'high',
                'status' => 'acknowledged',
                'triggered_at' => now()->subHours(3),
                'acknowledged_at' => now()->subHours(2),
                'dedup_hash' => hash('sha256', "{$astronaut->id}-ALT-SPO2-01"),
            ]);

            AlertAcknowledgement::create([
                'alert_id' => $alert1->id,
                'acknowledged_by' => $surgeon->id,
                'action_taken' => 'Oxygen booster regulator adjusted +2 PSI. SpO2 recovered to 98%.',
                'acknowledged_at' => now()->subHours(2),
                'created_at' => now()->subHours(2),
            ]);

            $alert2 = Alert::create([
                'uuid' => (string) Str::uuid(),
                'astronaut_id' => $astronaut->id,
                'mission_id' => $mission->id,
                'source_type' => 'environment',
                'alert_code' => 'ALT-RAD-04',
                'title' => 'Elevated Solar Energetic Particle (SEP) Dose Rate',
                'description' => 'Lunar transit dosimeter recorded spike reaching 0.45 mSv/h during solar flare coronal mass ejection.',
                'severity' => 'critical',
                'status' => 'escalated',
                'triggered_at' => now()->subMinutes(45),
                'dedup_hash' => hash('sha256', "{$astronaut->id}-ALT-RAD-04"),
            ]);

            AlertEscalation::create([
                'alert_id' => $alert2->id,
                'escalated_by' => $surgeon->id,
                'escalated_to_role' => 'mission_director',
                'reason' => 'Radiation threshold exceeded Tier 2 advisory. Crew shelter protocol advised.',
                'escalated_at' => now()->subMinutes(30),
                'created_at' => now()->subMinutes(30),
            ]);
        }

        // 3. Reports & Forensic Events
        if (Report::count() === 0 && $astronaut && $mission) {
            $report = Report::create([
                'uuid' => (string) Str::uuid(),
                'report_code' => 'RPT-01-HLTH',
                'title' => 'Comprehensive Crew Health & Bio-Telemetry Summary',
                'report_type' => 'crew_health_summary',
                'astronaut_id' => $astronaut->id,
                'mission_id' => $mission->id,
                'generated_by' => $surgeon->id,
                'period_start' => now()->subDays(14),
                'period_end' => now(),
                'status' => 'approved',
                'approved_by' => $director->id,
                'approved_at' => now()->subHours(5),
                'summary' => 'Astronaut Elena Vance maintains exceptional cardiovascular, pulmonary, and hepatic endurance throughout Artemis III transit phase. All six primary organ systems operating strictly within nominal mission tolerances.',
            ]);

            ReportForensicEvent::create([
                'report_id' => $report->id,
                'event_time' => now()->subDays(3),
                'event_type' => 'EVA Ingress / Repress',
                'title' => 'Airway & Pulmonary Pressure Equilibrium',
                'description' => 'SpO2 stabilized to 98% within 4 minutes of suit umbilical air-feed connection.',
                'related_metric' => 'SpO2 / Respiration',
                'metric_value' => '98% / 14 bpm',
                'severity' => 'info',
                'sort_order' => 1,
                'created_at' => now(),
            ]);

            ReportForensicEvent::create([
                'report_id' => $report->id,
                'event_time' => now()->subDays(1),
                'event_type' => 'Radiation Encounter',
                'title' => 'Van Allen Belt Crossing Dosimetry Spike',
                'description' => 'Total cumulative radiation reached 14.2 mSv, fully compliant with NASA 30-day limits.',
                'related_metric' => 'Cumulative Dose',
                'metric_value' => '14.2 mSv',
                'severity' => 'medium',
                'sort_order' => 2,
                'created_at' => now(),
            ]);
        }

        // 4. Academy Courses, Lessons & Gamification
        if (AcademyCourse::count() === 0) {
            // Adults Course
            $c1 = AcademyCourse::create([
                'uuid' => (string) Str::uuid(),
                'title' => 'Space Cardiovascular Physiology & Microgravity Hemodynamics',
                'slug' => 'space-cardiovascular-physiology',
                'target_audience' => 'adults',
                'category' => 'Cardiology',
                'difficulty' => 'intermediate',
                'description' => 'Study cephalad fluid shifts, baroreflex resetting, stroke volume alterations, and post-flight orthostatic intolerance in microgravity.',
                'xp_reward' => 150,
                'is_published' => true,
                'sort_order' => 1,
            ]);

            $l1 = AcademyLesson::create([
                'course_id' => $c1->id,
                'title' => 'Fluid Redistribution & Puffy Head Syndrome',
                'content' => 'In 1G terrestrial gravity, hydrostatic pressure pulls approximately 2 liters of blood and interstitial fluid toward the lower extremities. In orbit, the absence of gravity eliminates this gradient, causing an immediate headward shift.',
                'lesson_type' => 'text',
                'sort_order' => 1,
                'xp_reward' => 50,
                'duration_minutes' => 12,
                'is_published' => true,
            ]);

            AcademyQuiz::create([
                'lesson_id' => $l1->id,
                'question' => 'How much fluid approximately shifts from the lower extremities toward the head in microgravity?',
                'options' => ['500 mL', '1 to 2 Liters', '5 Liters', 'Zero Liters'],
                'correct_option_index' => 1,
                'explanation' => 'Microgravity eliminates the terrestrial hydrostatic gradient, relocating ~1.5 to 2 liters of venous fluid headward.',
                'sort_order' => 1,
            ]);

            // Kids Course
            $c2 = AcademyCourse::create([
                'uuid' => (string) Str::uuid(),
                'title' => 'Astronaut Doctor: Junior Space Medic Academy',
                'slug' => 'junior-space-medic-academy',
                'target_audience' => 'kids',
                'category' => 'Space Basics',
                'difficulty' => 'beginner',
                'description' => 'Discover how your heart beats in space, why astronauts float, and how space food keeps your body strong!',
                'xp_reward' => 100,
                'is_published' => true,
                'sort_order' => 2,
            ]);

            $l2 = AcademyLesson::create([
                'course_id' => $c2->id,
                'title' => 'Floating Hearts: How Blood Moves in Zero Gravity',
                'content' => 'When you do a handstand, all the blood goes to your head, right? In space, your body feels like it is doing a fun handstand all day long! That is why astronauts have rosy red cheeks in orbit!',
                'lesson_type' => 'text',
                'sort_order' => 1,
                'xp_reward' => 40,
                'duration_minutes' => 6,
                'is_published' => true,
            ]);

            AcademyQuiz::create([
                'lesson_id' => $l2->id,
                'question' => 'Why do astronauts have puffy cheeks and red faces in space?',
                'options' => ['They are shy', 'Blood and fluids float upward without gravity', 'They eat too much ice cream', 'It is very cold'],
                'correct_option_index' => 1,
                'explanation' => 'Without gravity pulling down, fluids spread evenly up towards the head and face!',
                'sort_order' => 1,
            ]);
        }

        // Mini Games
        if (AcademyMiniGame::count() === 0) {
            AcademyMiniGame::create([
                'title' => 'Zero-G Organ Puzzle',
                'slug' => 'zero-g-organ-puzzle',
                'game_type' => 'drag_drop_anatomy',
                'target_audience' => 'kids',
                'description' => 'Place the heart, lungs, liver, brain, and kidneys in the correct spots inside the astronaut suit!',
                'xp_reward' => 25,
                'is_active' => true,
            ]);

            AcademyMiniGame::create([
                'title' => 'Heart Rhythm Hero (BPM Stabilizer)',
                'slug' => 'heart-rhythm-hero',
                'game_type' => 'rhythm_tap',
                'target_audience' => 'kids',
                'description' => 'Tap along with the ECG rhythm to keep the astronaut’s heart rate in the safe green zone!',
                'xp_reward' => 30,
                'is_active' => true,
            ]);
        }

        // Badges
        if (Badge::count() === 0) {
            $b1 = Badge::create([
                'slug' => 'first-orbit',
                'name' => 'First Orbit Cadet',
                'description' => 'Completed your very first space medicine lesson.',
                'xp_required' => 50,
                'category' => 'Progression',
            ]);

            $b2 = Badge::create([
                'slug' => 'bio-medic',
                'name' => 'Flight Surgeon Intern',
                'description' => 'Demonstrated mastery over zero-g cardiovascular physiology.',
                'xp_required' => 250,
                'category' => 'Clinical',
            ]);

            Badge::create([
                'slug' => 'deep-space-guardian',
                'name' => 'Deep Space Guardian',
                'description' => 'Accumulated 1,000+ XP in space health crisis intervention.',
                'xp_required' => 1000,
                'category' => 'Mastery',
            ]);

            if ($cadet) {
                UserXpRecord::create([
                    'user_id' => $cadet->id,
                    'source_type' => 'lesson',
                    'source_id' => 1,
                    'xp_earned' => 120,
                    'earned_at' => now(),
                    'created_at' => now(),
                ]);

                UserBadge::create([
                    'user_id' => $cadet->id,
                    'badge_id' => $b1->id,
                    'earned_at' => now(),
                ]);
            }
        }

        // 5. Articles (Kids & Adults)
        if (Article::count() === 0) {
            $tagCardio = ArticleTag::firstOrCreate(['slug' => 'cardiology'], ['name' => 'Cardiology']);
            $tagKids = ArticleTag::firstOrCreate(['slug' => 'kids-science'], ['name' => 'Kids Science']);
            $tagBio = ArticleTag::firstOrCreate(['slug' => 'bioastronautics'], ['name' => 'Bioastronautics']);

            $artAdult = Article::create([
                'uuid' => (string) Str::uuid(),
                'author_id' => $surgeon->id,
                'title' => 'Neuro-Ocular Syndrome (SANS) in Long-Duration Lunar & Martian Missions',
                'slug' => 'neuro-ocular-syndrome-sans-long-duration-missions',
                'excerpt' => 'A comprehensive clinical examination of cephalad optic disc edema, globe flattening, and hyperopic shifts in microgravity environments.',
                'content' => "Spaceflight-Associated Neuro-Ocular Syndrome (SANS) affects a significant percentage of astronauts on long-duration orbital missions. In the absence of terrestrial gravity, the constant upward redistribution of venous blood and cerebrospinal fluid increases intracranial venous pressure. This prolonged elevation is transmitted to the optic nerve sheath, generating papilledema, choroidal folds, and optical refractive changes.\n\nFlight Surgeons monitor intraocular pressure (IOP) and optical coherence tomography (OCT) imagery bi-weekly. Countermeasures currently under clinical trial include Lower Body Negative Pressure (LBNP) sleeping chambers and strict nutritional sodium restriction.",
                'target_audience' => 'adults',
                'category' => 'Space Ophthalmology',
                'reading_time_minutes' => 8,
                'is_published' => true,
                'published_at' => now()->subDays(2),
                'views_count' => 184,
            ]);
            $artAdult->tags()->sync([$tagCardio->id, $tagBio->id]);

            $artKid = Article::create([
                'uuid' => (string) Str::uuid(),
                'author_id' => $surgeon->id,
                'title' => 'How Do Astronauts Sleep When There is No Up or Down?',
                'slug' => 'how-do-astronauts-sleep-in-space',
                'excerpt' => 'Imagine going to bed strapped into a sleeping bag stuck to the wall so you do not bump your head while floating in your dreams!',
                'content' => "Have you ever wondered what it feels like to fall asleep while floating like a superhero? In space, because there is no gravity pulling you down onto a mattress, astronauts do not need beds or fluffy pillows!\n\nInstead, each astronaut has a tiny bedroom the size of a phone booth with a cozy sleeping bag strapped securely to the wall. Why strapped to the wall? Because if you let go, you might gently float right out of the room and bump into a control switch or your crewmate's nose while having a dream!\n\nAstronauts also wear special eye masks and earplugs because the International Space Station has fans humming all night to circulate fresh air.",
                'target_audience' => 'kids',
                'category' => 'Daily Life in Space',
                'reading_time_minutes' => 4,
                'is_published' => true,
                'published_at' => now()->subDay(),
                'views_count' => 312,
            ]);
            $artKid->tags()->sync([$tagKids->id]);
        }

        // 6. Genesis Cryptographic Audit Trail
        if (AuditLog::count() === 0) {
            AuditLog::record(
                'system_genesis',
                'AuraMedPlatform',
                1,
                'AuraMed Tier 4 Bio-Astronautics Platform initialized with SHA-256 cryptographic non-repudiation chain.'
            );
        }
    }
}
