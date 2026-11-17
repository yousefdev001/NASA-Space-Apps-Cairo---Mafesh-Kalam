<?php

namespace Database\Seeders;

use App\Models\AcademyCourse;
use App\Models\AcademyLesson;
use App\Models\AcademyMiniGame;
use App\Models\AcademyQuiz;
use App\Models\Badge;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserXpRecord;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AcademyCurriculumSeeder extends Seeder
{
    /**
     * Run the database seeds for Space Academy curriculum, mini-games, badges, and leaderboard.
     */
    public function run(): void
    {
        $admin = User::where('email', 'system_administrator@auramed.nasa.gov')->first()
            ?? User::first();

        // ==========================================
        // 1. BADGES (Seed Complete Badges)
        // ==========================================
        $badgesData = [
            [
                'slug' => 'first-orbit-cadet',
                'name' => 'First Orbit Cadet',
                'description' => 'Completed your very first space medicine mission lesson.',
                'icon_path' => '/assets/badges/first-orbit.svg',
                'xp_required' => 50,
                'category' => 'Progression',
            ],
            [
                'slug' => 'heart-guardian',
                'name' => 'Heart Guardian',
                'description' => 'Mastered zero-g cardiovascular hemodynamics and arrhythmia stabilization.',
                'icon_path' => '/assets/badges/heart-guardian.svg',
                'xp_required' => 150,
                'category' => 'Cardiology',
            ],
            [
                'slug' => 'eva-medic-specialist',
                'name' => 'EVA Medic Specialist',
                'description' => 'Successfully triaged airlock pre-breathe decompression and EVA suit emergencies.',
                'icon_path' => '/assets/badges/eva-medic.svg',
                'xp_required' => 300,
                'category' => 'Emergency',
            ],
            [
                'slug' => 'sans-diagnostician',
                'name' => 'SANS Diagnostician',
                'description' => 'Demonstrated clinical mastery in diagnosing and mitigating Spaceflight-Associated Neuro-Ocular Syndrome.',
                'icon_path' => '/assets/badges/sans-specialist.svg',
                'xp_required' => 500,
                'category' => 'Clinical',
            ],
            [
                'slug' => 'deep-space-commander',
                'name' => 'Deep Space Commander',
                'description' => 'Achieved elite status in bio-astronautics, closed-loop life support triage, and cosmic radiation defense.',
                'icon_path' => '/assets/badges/commander.svg',
                'xp_required' => 1000,
                'category' => 'Mastery',
            ],
        ];

        foreach ($badgesData as $bData) {
            Badge::updateOrCreate(
                ['slug' => $bData['slug']],
                $bData
            );
        }

        // ==========================================
        // 2. MINI-GAMES (4 Interactive Simulators)
        // ==========================================
        $miniGamesData = [
            [
                'title' => 'Zero-G Organ Placement Puzzle',
                'slug' => 'zero-g-organ-puzzle',
                'game_type' => 'drag_drop_anatomy',
                'target_audience' => 'kids',
                'description' => 'Drag and place the human heart, lungs, brain, liver, and bones into an astronaut silhouette while compensating for zero-g fluid shifts!',
                'xp_reward' => 50,
                'is_active' => true,
            ],
            [
                'title' => 'Cardiac Rhythm Simulator',
                'slug' => 'cardiac-rhythm-simulator',
                'game_type' => 'rhythm_tap',
                'target_audience' => 'all',
                'description' => 'Tap in sync with the ECG QRS rhythm to stabilize an astronaut\'s heart rate during high-stress EVA spacewalk reentry.',
                'xp_reward' => 60,
                'is_active' => true,
            ],
            [
                'title' => 'Deep-Space SpO2 Breath Control',
                'slug' => 'deep-space-spo2-breath-control',
                'game_type' => 'breath_timing',
                'target_audience' => 'all',
                'description' => 'Master the rhythmic 4-4-4-4 box breathing technique used by Artemis astronauts to preserve oxygen and stabilize blood SpO2 above 98%.',
                'xp_reward' => 45,
                'is_active' => true,
            ],
            [
                'title' => 'EVA Airlock Pre-Breathe Checklist',
                'slug' => 'eva-airlock-pre-breathe',
                'game_type' => 'checklist_procedure',
                'target_audience' => 'all',
                'description' => 'Execute the 100% pure oxygen nitrogen washout protocol to prevent decompression sickness (the bends) before spacewalk hatch opening.',
                'xp_reward' => 75,
                'is_active' => true,
            ],
        ];

        foreach ($miniGamesData as $mgData) {
            AcademyMiniGame::updateOrCreate(
                ['slug' => $mgData['slug']],
                $mgData
            );
        }

        // ==========================================
        // 3. COURSES, LESSONS & QUIZZES (Topics A-F)
        // ==========================================

        // TOPIC A: Cardiovascular Remodeling in Microgravity (Adults)
        $courseA = AcademyCourse::updateOrCreate(
            ['slug' => 'cardiovascular-remodeling-in-microgravity'],
            [
                'uuid' => (string) Str::uuid(),
                'title' => 'Cardiovascular Remodeling in Microgravity',
                'target_audience' => 'adults',
                'category' => 'Cardiology',
                'difficulty' => 'advanced',
                'description' => 'Advanced clinical examination of microgravity-induced cephalad fluid redistribution, autonomic baroreflex resetting, stroke volume reduction, and re-entry orthostatic intolerance countermeasures.',
                'xp_reward' => 300,
                'is_published' => true,
                'sort_order' => 1,
                'created_by' => $admin?->id,
            ]
        );

        $lA1 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseA->id, 'sort_order' => 1],
            [
                'title' => 'Fluid Cephalad Shift & Jugular Venous Engorgement',
                'content' => "Microgravity removes the 2-meter hydrostatic pressure column experienced on Earth. Within hours of orbital insertion, approximately 1,500 to 2,000 mL of intravascular and interstitial fluid shifts from the lower extremities toward the head and thoracic cavity.\n\nThis creates immediate central venous hypervolemia, engorging the internal jugular veins and leading to facial edema ('puffy face') alongside hypovolemia of the calves ('bird legs'). Flight surgeons monitor jugular venous blood flow via Doppler ultrasound to detect venous stasis or retrograde flow, which poses an elevated risk of internal jugular vein thrombosis during long-duration orbital missions.",
                'lesson_type' => 'text',
                'xp_reward' => 60,
                'duration_minutes' => 15,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lA1->id, 'sort_order' => 1],
            [
                'question' => 'What approximate volume of blood and interstitial fluid relocates from the lower body to the thoracic/head cavity upon entering microgravity?',
                'options' => ['150 - 300 mL', '500 - 800 mL', '1,500 - 2,000 mL', '3,500 - 4,000 mL'],
                'correct_option_index' => 2,
                'explanation' => 'Without gravitational hydrostatic gradients, ~1.5 to 2.0 liters of venous and interstitial fluid shifts headward, causing thoracic engorgement and bird-leg syndrome.',
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lA1->id, 'sort_order' => 2],
            [
                'question' => 'Which vascular pathology has been documented via ultrasound in astronauts due to cephalad venous stasis in the internal jugular vein?',
                'options' => ['Carotid artery dissection', 'Internal jugular vein thrombosis and stagnant flow', 'Aortic aneurysm', 'Subclavian steal syndrome'],
                'correct_option_index' => 1,
                'explanation' => 'NASA clinical evaluations confirmed sluggish or retrograde internal jugular venous flow in long-duration crew, leading to localized venous thrombosis requiring orbital anticoagulation therapy.',
            ]
        );

        $lA2 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseA->id, 'sort_order' => 2],
            [
                'title' => 'Baroreceptor Adaptation & Autonomic Dysregulation',
                'content' => "With prolonged central hypervolemia, the high-pressure baroreceptors located in the carotid sinus and aortic arch experience sustained stretch. The central nervous system interprets this as persistent whole-body hypervolemia.\n\nThrough the Gauer-Henry reflex, the hypothalamus suppresses antidiuretic hormone (ADH/vasopressin) and down-regulates the renin-angiotensin-aldosterone system (RAAS), resulting in significant diuresis and a 10% to 15% reduction in total plasma volume within 48 to 72 hours. Simultaneously, carotid-cardiac baroreflex sensitivity declines, blunting the sympathetic vasoconstrictive reflex required to compensate for sudden pressure drops.",
                'lesson_type' => 'text',
                'xp_reward' => 70,
                'duration_minutes' => 18,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lA2->id, 'sort_order' => 1],
            [
                'question' => 'How does the endocrine system respond to sustained microgravity central hypervolemia via the Gauer-Henry reflex?',
                'options' => [
                    'Hyper-secretion of aldosterone causing sodium retention',
                    'Suppression of ADH (vasopressin) and RAAS, inducing plasma volume contraction',
                    'Massive release of epinephrine elevating basal blood pressure',
                    'Complete cessation of erythropoietin production',
                ],
                'correct_option_index' => 1,
                'explanation' => 'The Gauer-Henry reflex detects increased central venous pressure and suppresses ADH and aldosterone, prompting aquaresis/diuresis that contracts total plasma volume by 10-15%.',
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lA2->id, 'sort_order' => 2],
            [
                'question' => 'What is the primary alteration observed in the arterial baroreflex after several weeks in microgravity?',
                'options' => [
                    'Hyperactive sympathetic tachycardia upon standing',
                    'Blunted baroreflex sensitivity with impaired peripheral vasoconstriction',
                    'Permanent vagal nerve paralysis',
                    'Irreversible baroreceptor hypertrophy',
                ],
                'correct_option_index' => 1,
                'explanation' => 'Continuous central engorgement down-regulates baroreceptor sensitivity, leaving the astronaut unable to trigger prompt arteriolar vasoconstriction when gravitational stress returns.',
            ]
        );

        $lA3 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseA->id, 'sort_order' => 3],
            [
                'title' => 'Orthostatic Intolerance & Re-Entry Countermeasures',
                'content' => "Upon re-entering Earth's or Mars's gravitational field, blood instantly rushes back toward the lower extremities and splanchnic circulation. Because the astronaut's plasma volume is contracted and arterial baroreflex vasoconstriction is blunted, cardiac stroke volume plummets, causing profound cerebral hypoperfusion and orthostatic intolerance (pre-syncope or syncope) in up to 80% of returning long-duration spacefarers.\n\nNASA flight surgeons deploy multi-tier countermeasures: oral fluid and salt replenishment (1 liter of isotonic saline or sodium chloride bouillon tablets 2 hours before de-orbit burn), gradient compression garments (G-suits providing 40-60 mmHg lower body counter-pressure), and pre-landing LBNP conditioning protocols.",
                'lesson_type' => 'text',
                'xp_reward' => 80,
                'duration_minutes' => 20,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lA3->id, 'sort_order' => 1],
            [
                'question' => 'Which clinical countermeasure protocol is administered immediately prior to de-orbit burn to mitigate re-entry orthostatic intolerance?',
                'options' => [
                    'Intravenous high-dose furosemide',
                    'Oral isotonic saline loading (1L water with sodium chloride tablets) and lower body anti-G suit',
                    'Complete bed rest with head elevated 30 degrees',
                    'Immediate hyperbaric chamber pressurization',
                ],
                'correct_option_index' => 1,
                'explanation' => 'Consuming ~1 liter of isotonic saline expands intravascular plasma volume temporarily, while the anti-G suit mechanically prevents venous blood pooling in the splanchnic and lower limb vascular beds.',
            ]
        );

        // TOPIC B: Spaceflight-Associated Neuro-Ocular Syndrome (SANS) (Adults)
        $courseB = AcademyCourse::updateOrCreate(
            ['slug' => 'spaceflight-associated-neuro-ocular-syndrome-sans'],
            [
                'uuid' => (string) Str::uuid(),
                'title' => 'Spaceflight-Associated Neuro-Ocular Syndrome (SANS)',
                'target_audience' => 'adults',
                'category' => 'Neuro-Ophthalmology',
                'difficulty' => 'advanced',
                'description' => 'Pathophysiology, optical coherence tomography (OCT) diagnostics, optic disc edema, posterior globe flattening, and countermeasure development for SANS on deep-space exploration crews.',
                'xp_reward' => 350,
                'is_published' => true,
                'sort_order' => 2,
                'created_by' => $admin?->id,
            ]
        );

        $lB1 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseB->id, 'sort_order' => 1],
            [
                'title' => 'Intracranial Venous Hypertension & Optic Disc Edema',
                'content' => "Spaceflight-Associated Neuro-Ocular Syndrome (SANS) manifests in up to 70% of astronauts participating in long-duration missions aboard the ISS. In 1G terrestrial conditions, standing upright produces negative hydrostatic pressures within the dural venous sinuses and internal jugular veins.\n\nIn weightlessness, internal jugular venous pressure remains elevated at +15 to +20 mmHg continuously. This impedes venous drainage from the cerebral circulation and ophthalmic veins, transmitting chronic hydrostatic pressure into the retrobulbar subarachnoid space surrounding the optic nerve sheath. The elevated perineural pressure leads to bilateral optic disc edema (papilledema), documented on orbit using fundoscopy and high-resolution optical coherence tomography (OCT).",
                'lesson_type' => 'text',
                'xp_reward' => 70,
                'duration_minutes' => 16,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lB1->id, 'sort_order' => 1],
            [
                'question' => 'What is the primary hemodynamic driver believed to cause optic nerve sheath dilation and papilledema in SANS?',
                'options' => [
                    'Extreme systemic arterial hypotension',
                    'Loss of negative dural venous sinus pressures due to constant microgravity cephalad fluid stasis',
                    'Hypercalcemia from bone demineralization',
                    'Bacterial conjunctivitis contracted from cabin surfaces',
                ],
                'correct_option_index' => 1,
                'explanation' => 'Absence of terrestrial gravitational drainage keeps dural venous sinus pressure chronically elevated, transmitting venous hypertension to the optic nerve sheath and optic disc.',
            ]
        );

        $lB2 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseB->id, 'sort_order' => 2],
            [
                'title' => 'Posterior Globe Flattening & Hyperopic Shifts',
                'content' => "Elevated cerebrospinal fluid (CSF) pressure trapped within the optic nerve sheath exerts direct forward mechanical force onto the posterior pole of the eyeball. Over months, this continuous biomechanical stress causes physical flattening of the posterior sclera and shortening of the eye's anterior-posterior axial length.\n\nOptically, this axial shortening produces a hyperopic (farsighted) refractive shift of +0.50 to +1.75 diopters, forcing astronauts to require adjustable 'Space Anticipation Glasses'. Fundus examinations simultaneously reveal choroidal folds, cotton-wool spots indicative of axoplasmic flow stasis and focal retinal ischemia, and irreversible retinal nerve fiber layer (RNFL) thickening.",
                'lesson_type' => 'text',
                'xp_reward' => 75,
                'duration_minutes' => 18,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lB2->id, 'sort_order' => 1],
            [
                'question' => 'What visual refractive error typically occurs in astronauts who develop posterior globe flattening from SANS?',
                'options' => [
                    'Myopic shift (nearsightedness)',
                    'Hyperopic shift (farsightedness)',
                    'Complete color blindness',
                    'Total bilateral aphakia',
                ],
                'correct_option_index' => 1,
                'explanation' => 'Posterior globe flattening shortens the eye\'s axial length, causing light rays to focus behind the retina and producing a progressive hyperopic (farsighted) refractive shift.',
            ]
        );

        $lB3 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseB->id, 'sort_order' => 3],
            [
                'title' => 'Clinical SANS Surveillance & Countermeasure Devices',
                'content' => "To diagnose and quantify SANS progression in real time, mission flight surgeons conduct bi-weekly on-orbit protocols including Spectral-Domain OCT, B-scan ocular ultrasound (measuring optic nerve sheath diameter; values exceeding 5.8 mm signify critical distension), and visual acuity testing.\n\nCurrent experimental countermeasures include Lower Body Negative Pressure (LBNP) sleeping enclosures that draw ~25-30 mmHg of negative pressure around the lower body for 8 hours each night, artificially restoring terrestrial venous gradients and relieving cephalad intracranial congestion. Dietary protocols also mandate strict restriction of sodium intake (< 2,300 mg/day) and optimal 1-carbon metabolic pathway supplementation (B-vitamins).",
                'lesson_type' => 'text',
                'xp_reward' => 80,
                'duration_minutes' => 20,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lB3->id, 'sort_order' => 1],
            [
                'question' => 'Which diagnostic metric measured on orbital B-scan ultrasound indicates abnormal optic nerve sheath distension in suspected SANS?',
                'options' => [
                    'Optic nerve sheath diameter (ONSD) > 5.8 mm',
                    'Retinal artery peak systolic velocity < 10 cm/s',
                    'Corneal thickness < 200 microns',
                    'Lens thickness > 12 mm',
                ],
                'correct_option_index' => 0,
                'explanation' => 'An ONSD measurement exceeding 5.8 mm measured 3 mm behind the globe indicates abnormal perineural fluid accumulation and elevated intracranial pressure.',
            ]
        );

        // TOPIC C: Space Radiation Dosimetry & SPE Mitigation (Adults)
        $courseC = AcademyCourse::updateOrCreate(
            ['slug' => 'space-radiation-dosimetry-spe-mitigation'],
            [
                'uuid' => (string) Str::uuid(),
                'title' => 'Space Radiation Dosimetry & SPE Mitigation',
                'target_audience' => 'adults',
                'category' => 'Radiation Health',
                'difficulty' => 'advanced',
                'description' => 'Deep-space ionizing radiation physics: isotropic Galactic Cosmic Rays (GCR), Solar Particle Events (SPE), HZE ions, linear energy transfer, biodosimetry, and storm shelter lock-in procedures.',
                'xp_reward' => 400,
                'is_published' => true,
                'sort_order' => 3,
                'created_by' => $admin?->id,
            ]
        );

        $lC1 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseC->id, 'sort_order' => 1],
            [
                'title' => 'Galactic Cosmic Radiation (GCR) vs Solar Particle Events (SPE)',
                'content' => "The interplanetary radiation environment beyond Low Earth Orbit (LEO) comprises two distinct hazards: Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE). GCR originates outside our solar system from supernova remnants and consists of 85% high-energy protons, 14% alpha particles (helium nuclei), and 1% High-Z and High-Energy (HZE) ions such as iron (56Fe).\n\nHZE ions possess dense Linear Energy Transfer (LET), slicing through cell nuclei and producing complex, clustered double-strand DNA breaks that overwhelm enzymatic repair mechanisms. The baseline GCR dose rate in interplanetary space is ~1.5 to 2.0 mSv/day (~500-600 mSv on a Mars transit). In contrast, SPEs are episodic, transient ejections of relativistic solar protons associated with coronal mass ejections (CMEs) that can deliver lethal doses (> 2 to 5 Gray) within hours if astronauts are unshielded.",
                'lesson_type' => 'text',
                'xp_reward' => 75,
                'duration_minutes' => 20,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lC1->id, 'sort_order' => 1],
            [
                'question' => 'Why are High-Z and High-Energy (HZE) ions like Iron-56 exceptionally hazardous compared to terrestrial gamma radiation?',
                'options' => [
                    'They cannot penetrate thin aluminum spacecraft skin',
                    'They possess dense Linear Energy Transfer (LET) producing complex clustered DNA breaks that resist cellular repair',
                    'They emit harmless visible photons upon cellular collision',
                    'They only affect outer epidermal layers without penetrating internal organs',
                ],
                'correct_option_index' => 1,
                'explanation' => 'HZE particles generate dense ionization tracks along their trajectory, causing clustered double-strand DNA damage with high Relative Biological Effectiveness (RBE) and high carcinogenic risk.',
            ]
        );

        $lC2 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseC->id, 'sort_order' => 2],
            [
                'title' => 'Acute Radiation Sickness (ARS) & Hematological Triage',
                'content' => "If a solar storm strikes during an extravehicular activity (EVA) or before crew can reach shelter, acute whole-body doses exceeding 0.7 Gray can induce Acute Radiation Sickness (ARS). ARS progresses through prodromal, latent, and manifest illness phases.\n\nThe prodromal phase presents within 1 to 6 hours with intractable nausea, vomiting, fatigue, and diarrhea. The hematopoietic syndrome is the most immediate life-threatening danger: ionizing radiation destroys rapidly dividing bone marrow stem cells, leading to profound absolute lymphocyte depletion within 24 to 48 hours, followed by neutropenia and severe thrombocytopenia 2 to 3 weeks later. Flight surgeons utilize the Andrews Lymphocyte Depletion Curve to estimate whole-body absorbed dose and initiate supportive therapy with Granulocyte Colony-Stimulating Factor (G-CSF / Filgrastim) and prophylactic broad-spectrum antibiotics.",
                'lesson_type' => 'text',
                'xp_reward' => 80,
                'duration_minutes' => 22,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lC2->id, 'sort_order' => 1],
            [
                'question' => 'Which clinical laboratory biomarker provides the most reliable early biological estimate of absorbed dose within 24-48 hours of an acute radiation exposure?',
                'options' => [
                    'Serum potassium concentration',
                    'Absolute peripheral lymphocyte depletion rate',
                    'Urinary sodium excretion',
                    'Resting heart rate variability',
                ],
                'correct_option_index' => 1,
                'explanation' => 'The rate of decline in absolute peripheral blood lymphocyte count (Andrews Lymphocyte Depletion curve) correlates directly with whole-body absorbed radiation dose.',
            ]
        );

        $lC3 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseC->id, 'sort_order' => 3],
            [
                'title' => 'Storm Shelter Shielding & Pharmacological Radioprotectants',
                'content' => "Passive shielding in deep space requires materials with high hydrogen density to minimize secondary Bremsstrahlung and neutron spallation radiation. Lead and heavy metals are contraindicated because heavy atomic nuclei undergo extensive nuclear fragmentation when struck by relativistic HZE ions, generating dangerous secondary neutron showers.\n\nInstead, NASA spacecraft design incorporates polyethylene ((C2H4)n), water wall reservoirs, and food supplies arranged around the storm shelter module to create an effective areal density of > 20 g/cm². Pharmacological protocols under evaluation include amifostine and nitroxide radioprotectants to scavenge free radicals, coupled with automated dosimeter alarms triggering immediate crew shelter lock-in.",
                'lesson_type' => 'text',
                'xp_reward' => 85,
                'duration_minutes' => 18,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lC3->id, 'sort_order' => 1],
            [
                'question' => 'Why are lead and heavy metals avoided for deep-space spacecraft radiation shielding against GCR?',
                'options' => [
                    'Lead melts at deep-space temperatures',
                    'Heavy atomic nuclei produce catastrophic secondary neutron spallation and Bremsstrahlung radiation when struck by HZE ions',
                    'Lead is too magnetic and interferes with navigation instruments',
                    'Heavy metals absorb all oxygen from the cabin atmosphere',
                ],
                'correct_option_index' => 1,
                'explanation' => 'High-Z materials cause relativistic heavy cosmic rays to fragment, creating hazardous secondary neutrons. Low-Z, hydrogen-rich materials like polyethylene and water provide superior stopping power without excessive fragmentation.',
            ]
        );

        // TOPIC D: Closed-Loop ECLSS & Hypoxia Emergency Triage (Adults)
        $courseD = AcademyCourse::updateOrCreate(
            ['slug' => 'closed-loop-eclss-hypoxia-emergency-triage'],
            [
                'uuid' => (string) Str::uuid(),
                'title' => 'Closed-Loop ECLSS & Hypoxia Emergency Triage',
                'target_audience' => 'adults',
                'category' => 'Life Support & Emergency',
                'difficulty' => 'intermediate',
                'description' => 'Environmental Control and Life Support System (ECLSS) architecture: Sabatier CO2 scrubbing, water electrolysis, cabin depressurization, explosive decompression, and acute hypoxia emergency resuscitation.',
                'xp_reward' => 380,
                'is_published' => true,
                'sort_order' => 4,
                'created_by' => $admin?->id,
            ]
        );

        $lD1 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseD->id, 'sort_order' => 1],
            [
                'title' => 'ECLSS Architecture: Sabatier Reactor & CO2 Scrubbing',
                'content' => "Human survival in deep space requires closed-loop atmospheric regeneration. The Oxygen Generation System (OGS) electrolyzes recycled water (2H2O -> 2H2 + O2) to supply breathable oxygen. Simultaneously, crew respiration generates approximately 1.0 kg of CO2 per person per day.\n\nThe Carbon Dioxide Removal Assembly (CDRA) utilizes regenerable synthetic zeolite molecular sieve beds to scrub CO2 from cabin air. The concentrated CO2 is fed into the Sabatier reactor, where it reacts with hydrogen byproduct at 400°C over a ruthenium catalyst: CO2 + 4H2 -> CH4 + 2H2O. The recovered water is purified and fed back into electrolysis. Flight surgeons closely track cabin partial pressure of CO2 (ppCO2): levels above 3.0 mmHg provoke headaches, lethargy, cognitive degradation, and vascular cerebral vasodilation in astronauts.",
                'lesson_type' => 'text',
                'xp_reward' => 65,
                'duration_minutes' => 17,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lD1->id, 'sort_order' => 1],
            [
                'question' => 'What is the primary chemical reaction carried out in the ECLSS Sabatier catalytic reactor?',
                'options' => [
                    'Electrolysis of liquid water into oxygen and hydrogen gas',
                    'Catalytic conversion of carbon dioxide and hydrogen into methane and water',
                    'Oxidation of toxic carbon monoxide into carbon dioxide',
                    'Direct photochemical synthesis of glucose from cabin air',
                ],
                'correct_option_index' => 1,
                'explanation' => 'The Sabatier reaction (CO2 + 4H2 -> CH4 + 2H2O) recovers water from exhaled CO2, closing the life support loop.',
            ]
        );

        $lD2 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseD->id, 'sort_order' => 2],
            [
                'title' => 'Cabin Decompression & Time of Useful Consciousness (TUC)',
                'content' => "Cabin depressurization caused by micrometeoroid puncture or structural seal compromise represents the most urgent orbital emergency. At terrestrial atmospheric pressure (14.7 psi / 101.3 kPa), alveolar pO2 is approximately 100 mmHg. When cabin pressure drops rapidly, the alveolar partial pressure of oxygen plummets below venous pO2, causing oxygen to diffuse backwards from pulmonary capillary blood into the alveoli.\n\nThe Time of Useful Consciousness (TUC)—the window of time an astronaut has to secure emergency oxygen before cognitive collapse—drops precipitously: at 35,000 ft (3.5 psi), TUC is 30 to 60 seconds; at 50,000 ft (1.7 psi), TUC is only 9 to 12 seconds. Below the Armstrong Limit (63,000 ft / 0.92 psi / 47 mmHg), body fluids (saliva, tears, and interstitial moisture) boil at normal body temperature (37°C), producing instantaneous tissue ebullism.",
                'lesson_type' => 'text',
                'xp_reward' => 75,
                'duration_minutes' => 19,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lD2->id, 'sort_order' => 1],
            [
                'question' => 'What is the Time of Useful Consciousness (TUC) for an astronaut exposed to rapid cabin decompression at 50,000 feet equivalent altitude?',
                'options' => [
                    '3 to 5 minutes',
                    '90 to 120 seconds',
                    '9 to 12 seconds',
                    'More than 10 minutes',
                ],
                'correct_option_index' => 2,
                'explanation' => 'At 50,000 ft, oxygen rapidly diffuses out of the blood into the decompressed lungs; cerebral desaturation causes loss of useful consciousness within 9 to 12 seconds.',
            ]
        );

        $lD3 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseD->id, 'sort_order' => 3],
            [
                'title' => 'Hypoxic Emergency Triage & Hyperbaric Treatment Protocols',
                'content' => "Following rapid repressurization after a hypoxia event, flight surgeons initiate immediate clinical triage. The primary assessment checks airway patency, pulse oximetry (SpO2), and neurological pupillary reflexes. Astronauts with SpO2 < 85% or altered mental status are placed on 100% FiO2 via high-flow non-rebreather mask or portable emergency breathing apparatus (PEBA).\n\nIf decompression sickness (DCS) occurs due to nitrogen bubble nucleation in tissues (the bends, chokes, or neurological DCS), the astronaut is transferred to the airlock or Hyperbaric Treatment Facility (HTF) for hyperbaric oxygen therapy (HBOT) at 2.8 atmospheres absolute (ATA), accelerating nitrogen bubble re-absorption and restoring microvascular perfusion.",
                'lesson_type' => 'text',
                'xp_reward' => 80,
                'duration_minutes' => 21,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lD3->id, 'sort_order' => 1],
            [
                'question' => 'What is the definitive medical treatment for an astronaut exhibiting severe neurological decompression sickness (the bends) after an EVA emergency?',
                'options' => [
                    'Immediate oral administration of aspirin and bed rest',
                    'Hyperbaric Oxygen Therapy (HBOT) at elevated atmospheric pressures (e.g. 2.8 ATA)',
                    'Subcutaneous injection of low molecular weight heparin only',
                    'Rapid lowering of cabin oxygen concentration to 15%',
                ],
                'correct_option_index' => 1,
                'explanation' => 'Hyperbaric oxygen therapy mechanically shrinks intravascular nitrogen gas bubbles and supersaturates ischemic brain and spinal tissues with dissolved oxygen.',
            ]
        );

        // TOPIC E: Junior Space Medic: Zero-G Organs Adventure (Kids)
        $courseE = AcademyCourse::updateOrCreate(
            ['slug' => 'junior-space-medic-zero-g-organs-adventure'],
            [
                'uuid' => (string) Str::uuid(),
                'title' => 'Junior Space Medic: Zero-G Organs Adventure',
                'target_audience' => 'kids',
                'category' => 'Space Anatomy',
                'difficulty' => 'beginner',
                'description' => 'Join AuraBot on an exciting voyage inside the astronaut body! Discover why blood floats into your cheeks, how space lungs breathe recycled bubble air, and how your inner ear learns to do zero-g flips!',
                'xp_reward' => 180,
                'is_published' => true,
                'sort_order' => 5,
                'created_by' => $admin?->id,
            ]
        );

        $lE1 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseE->id, 'sort_order' => 1],
            [
                'title' => 'The Floating Heart & The Puffy Face Mystery',
                'content' => "Have you ever noticed what happens when you do a cartwheel or handstand on your bed? All the blood rushes to your head and your face gets warm and red!\n\nIn outer space, there is zero gravity pulling your blood down toward your toes! So your heart keeps pumping, but all that blood and water floats up into your chest, neck, and cheeks! That is why space doctors say astronauts have a 'puffy face' and 'bird legs'—because their legs get skinny while their smiles get super puffy and bright!",
                'lesson_type' => 'text',
                'xp_reward' => 35,
                'duration_minutes' => 8,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lE1->id, 'sort_order' => 1],
            [
                'question' => 'Why do astronauts have rosy, puffy cheeks when they float inside the International Space Station?',
                'options' => [
                    'They are embarrassed by their space suits',
                    'There is no gravity pulling blood down, so liquids float up to the face and chest',
                    'They eat too much galactic strawberry ice cream',
                    'The space station has freezing cold air',
                ],
                'correct_option_index' => 1,
                'explanation' => 'Without gravity pulling body liquids down toward your feet, blood floats upward into your face and cheeks!',
            ]
        );

        $lE2 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseE->id, 'sort_order' => 2],
            [
                'title' => 'Space Lungs & The Giant Fan Mystery',
                'content' => "When you breathe on Earth, you breathe in fresh oxygen and breathe out carbon dioxide! On Earth, warm air floats away naturally.\n\nBut in zero gravity, warm air does not rise! If an astronaut falls asleep without giant fans running, the carbon dioxide they breathe out can form an invisible bubble right around their face, making them feel dizzy! That is why spaceships have quiet, giant electric fans humming day and night to blow fresh oxygen bubbles across every astronaut sleeping bag!",
                'lesson_type' => 'text',
                'xp_reward' => 40,
                'duration_minutes' => 9,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lE2->id, 'sort_order' => 1],
            [
                'question' => 'Why do spaceships need special fans running while astronauts are sleeping?',
                'options' => [
                    'To keep bedtime monsters away',
                    'To keep fresh oxygen moving so exhaled carbon dioxide doesn\'t trap around their nose',
                    'To blow space blankets when it gets too hot',
                    'To play soft lullabies through the air vents',
                ],
                'correct_option_index' => 1,
                'explanation' => 'In zero-G, exhaled air doesn\'t rise away by itself! Fans must blow fresh air so astronauts don\'t breathe in their own carbon dioxide bubble!',
            ]
        );

        $lE3 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseE->id, 'sort_order' => 3],
            [
                'title' => 'Bouncing Brains & The Space Rollercoaster Ear',
                'content' => "Inside your ears, you have tiny chambers filled with liquid and tiny sensory hairs that tell your brain which way is UP and which way is DOWN. But in space, the liquid floats in all directions!\n\nFor the first couple of days, your brain gets confused and wonders: 'Are we falling? Are we doing a backflip? Are we upside down?' This is called Space Adaptation! After a few days, your amazing brain learns a new superpower: it decides that wherever your feet are pointing is DOWN!",
                'lesson_type' => 'text',
                'xp_reward' => 45,
                'duration_minutes' => 10,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lE3->id, 'sort_order' => 1],
            [
                'question' => 'What part of your body tells your brain which way is UP and DOWN, and gets a little dizzy in zero gravity?',
                'options' => [
                    'Your fingernails',
                    'The tiny liquid canals inside your inner ear',
                    'Your elbow bones',
                    'Your space boots',
                ],
                'correct_option_index' => 1,
                'explanation' => 'Your inner ear has fluid-filled canals that balance you! In zero gravity, the fluid floats, so astronauts feel like they\'re on a loop-de-loop rollercoaster until their brain adapts!',
            ]
        );

        // TOPIC F: Astronaut Food & Bone Strength (Kids)
        $courseF = AcademyCourse::updateOrCreate(
            ['slug' => 'astronaut-food-bone-strength'],
            [
                'uuid' => (string) Str::uuid(),
                'title' => 'Astronaut Food & Bone Strength',
                'target_audience' => 'kids',
                'category' => 'Space Nutrition',
                'difficulty' => 'beginner',
                'description' => 'Learn why astronauts can\'t eat crumbly cookies, why tortillas are space magic, and how working out on the giant ARED machine keeps astronaut bones as hard as superhero armor!',
                'xp_reward' => 180,
                'is_published' => true,
                'sort_order' => 6,
                'created_by' => $admin?->id,
            ]
        );

        $lF1 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseF->id, 'sort_order' => 1],
            [
                'title' => 'Why Space Bones Need Super Workouts!',
                'content' => "On Earth, every step you take pushes against gravity, making your leg bones and spine super strong like steel pillars. But in space, astronauts float like balloons!\n\nBecause their bones aren't carrying weight, the body says: 'Hey, we don't need all this heavy calcium!' and bones start losing their strength! To stay healthy and strong, astronauts must exercise for 2.5 hours EVERY SINGLE DAY using the ARED (Advanced Resistive Exercise Device)—a giant machine that uses vacuum cylinders to feel like heavy Earth weights!",
                'lesson_type' => 'text',
                'xp_reward' => 40,
                'duration_minutes' => 8,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lF1->id, 'sort_order' => 1],
            [
                'question' => 'Why must astronauts exercise for 2.5 hours every single day in orbit?',
                'options' => [
                    'To win the orbital soccer cup',
                    'To prevent their bones and muscles from getting weak without gravity',
                    'Because the spaceship only moves when someone pedals',
                    'To practice dancing for alien visitors',
                ],
                'correct_option_index' => 1,
                'explanation' => 'Without gravity pushing on bones and muscles, the body loses calcium and muscle mass unless astronauts do heavy daily workouts on ARED!',
            ]
        );

        $lF2 = AcademyLesson::updateOrCreate(
            ['course_id' => $courseF->id, 'sort_order' => 2],
            [
                'title' => 'Cosmic Meals: The No-Crumbs Tortilla Rule!',
                'content' => "What is the number one food rule on a spaceship? NO CRUMBLY BREAD!\n\nIf an astronaut took a bite of crunchy bread or crackers, thousands of tiny crumbs would float into the air, fly into crew members' eyes, or get sucked into sensitive spaceship computers and cause short circuits! Instead, astronauts eat delicious soft tortillas! They also eat freeze-dried fruits, warm macaroni and cheese injected with hot water pouches, and lots of spicy hot sauce because your tongue's taste buds become less sensitive in space!",
                'lesson_type' => 'text',
                'xp_reward' => 40,
                'duration_minutes' => 9,
                'is_published' => true,
            ]
        );

        AcademyQuiz::updateOrCreate(
            ['lesson_id' => $lF2->id, 'sort_order' => 1],
            [
                'question' => 'Why do astronauts eat soft tortillas instead of normal sliced sandwich bread?',
                'options' => [
                    'Tortillas taste like sweet honey',
                    'Bread makes dangerous floating crumbs that get stuck in astronaut eyes and spaceship fans',
                    'Bread does not fit into the rocket launch doors',
                    'Tortillas can be used as emergency mini-helmets',
                ],
                'correct_option_index' => 1,
                'explanation' => 'Bread creates loose floating crumbs that pose hazard risks to astronaut eyes and spaceship computer air vents, whereas tortillas make zero crumbs!',
            ]
        );

        // ==========================================
        // 4. LEADERBOARD CADETS & SAMPLE XP
        // ==========================================
        $leaderboardUsers = [
            ['name' => 'Dr. Henrik Lindqvist', 'email' => 'flight_surgeon@auramed.nasa.gov', 'xp' => 1450],
            ['name' => 'Elena Vance (CDR-01)', 'email' => 'astronaut_crew@auramed.nasa.gov', 'xp' => 1120],
            ['name' => 'Dr. Sarah Connor', 'email' => 'medical_officer@auramed.nasa.gov', 'xp' => 950],
            ['name' => 'Cadet Leo Armstrong', 'email' => 'cadet_student@auramed.nasa.gov', 'xp' => 780],
            ['name' => 'Director Gene Kranz', 'email' => 'mission_director@auramed.nasa.gov', 'xp' => 620],
            ['name' => 'Cadet Maya Lin', 'email' => 'cadet_maya@auramed.nasa.gov', 'xp' => 490],
            ['name' => 'Cadet Alex Mercer', 'email' => 'cadet_alex@auramed.nasa.gov', 'xp' => 380],
            ['name' => 'Cadet Zara Chen', 'email' => 'cadet_zara@auramed.nasa.gov', 'xp' => 260],
            ['name' => 'Cadet Noah Patel', 'email' => 'cadet_noah@auramed.nasa.gov', 'xp' => 180],
            ['name' => 'Cadet Sofia Rossi', 'email' => 'cadet_sofia@auramed.nasa.gov', 'xp' => 110],
        ];

        $defaultPassword = Hash::make('Houston@2026!');

        foreach ($leaderboardUsers as $uData) {
            $user = User::firstOrCreate(
                ['email' => $uData['email']],
                [
                    'uuid' => (string) Str::uuid(),
                    'name' => $uData['name'],
                    'password' => $defaultPassword,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            // Clear old seeded XP for deterministic sample
            UserXpRecord::where('user_id', $user->id)->delete();

            // Insert single or split XP record
            UserXpRecord::create([
                'user_id' => $user->id,
                'source_type' => 'lesson',
                'source_id' => $lA1->id,
                'xp_earned' => $uData['xp'],
                'earned_at' => now()->subHours(rand(1, 48)),
                'created_at' => now()->subHours(rand(1, 48)),
            ]);

            // Assign unlocked badges based on total XP
            $eligibleBadges = Badge::where('xp_required', '<=', $uData['xp'])->get();
            foreach ($eligibleBadges as $badge) {
                UserBadge::firstOrCreate(
                    ['user_id' => $user->id, 'badge_id' => $badge->id],
                    ['earned_at' => now()->subHours(rand(1, 72))]
                );
            }
        }
    }
}
