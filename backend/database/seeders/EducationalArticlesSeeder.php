<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\ArticleTag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EducationalArticlesSeeder extends Seeder
{
    public function run(): void
    {
        $surgeon = User::where('email', 'flight_surgeon@auramed.nasa.gov')->first() ?? User::first();
        $educator = User::where('email', 'educator_content_creator@auramed.nasa.gov')->first() ?? $surgeon;
        $medicalOfficer = User::where('email', 'medical_officer@auramed.nasa.gov')->first() ?? $surgeon;

        $tags = [
            'cardiology' => ArticleTag::firstOrCreate(['slug' => 'cardiology'], ['name' => 'Cardiology']),
            'kids_science' => ArticleTag::firstOrCreate(['slug' => 'kids-science'], ['name' => 'Junior Science']),
            'bioastronautics' => ArticleTag::firstOrCreate(['slug' => 'bioastronautics'], ['name' => 'Bioastronautics']),
            'space_life' => ArticleTag::firstOrCreate(['slug' => 'space-life'], ['name' => 'Space Life']),
            'botany' => ArticleTag::firstOrCreate(['slug' => 'space-botany'], ['name' => 'Space Botany']),
            'neuro' => ArticleTag::firstOrCreate(['slug' => 'neuro-ophthalmology'], ['name' => 'Neuro-Ophthalmology']),
            'radiation' => ArticleTag::firstOrCreate(['slug' => 'radiation-oncology'], ['name' => 'Radiation Oncology']),
            'musculoskeletal' => ArticleTag::firstOrCreate(['slug' => 'musculoskeletal'], ['name' => 'Musculoskeletal']),
            'immunology' => ArticleTag::firstOrCreate(['slug' => 'immunology'], ['name' => 'Immunology']),
        ];

        $articles = [
            // KIDS ARTICLES
            [
                'title' => 'How Do Astronauts Sleep When There is No Up or Down? 🚀',
                'slug' => 'how-do-astronauts-sleep-in-space',
                'author_id' => $educator->id,
                'target_audience' => 'kids',
                'category' => 'Daily Life in Space',
                'reading_time_minutes' => 4,
                'views_count' => 342,
                'published_at' => now()->subDays(6),
                'excerpt' => 'Imagine going to bed strapped into a sleeping bag stuck to the wall so you do not bump your head while floating in your dreams!',
                'tags' => ['kids_science', 'space_life'],
                'content' => "### Sleeping Floating in Mid-Air! 🛌✨\n\nHave you ever wondered what it feels like to fall asleep while floating like a superhero? In space, because there is no gravity pulling you down onto a mattress, astronauts do not need beds, springs, or fluffy pillows!\n\n#### Why Are Sleeping Bags Strapped to the Wall?\nInstead, each astronaut has a cozy personal sleep station the size of a telephone booth. Inside, they zip themselves into a padded sleeping bag that is tied securely to the wall with velcro straps.\n\n> 💡 **Fun Fact**: If an astronaut fell asleep without strapping in, the gentle air currents from the ventilation fans would blow them across the cabin until they bumped their nose on a computer screen!\n\n#### What Do Astronauts Hear and See?\n- 🎧 **Earplugs**: The Space Station has fans, water pumps, and air recyclers humming 24/7, just like a busy spaceship engine room.\n- 🕶️ **Eye Masks**: The International Space Station orbits Earth every 90 minutes, meaning astronauts experience 16 sunrises and sunsets every single day!\n- 😴 **Zero-Gravity Float**: Astronauts report that sleep in zero-G feels totally weightless—no pressure on your back, neck, or knees!\n\n#### Astronaut Sleep Checklist:\n1. Clip sleeping bag to the bulkhead wall.\n2. Put on soft eye mask.\n3. Turn off station cabin lights.\n4. Close eyes and drift away amongst the stars! 🌌",
            ],
            [
                'title' => 'Why Does Your Heart Float Inside Your Chest in Zero-G? ❤️',
                'slug' => 'why-does-your-heart-float-in-space',
                'author_id' => $surgeon->id,
                'target_audience' => 'kids',
                'category' => 'Space Physiology',
                'reading_time_minutes' => 5,
                'views_count' => 421,
                'published_at' => now()->subDays(5),
                'excerpt' => 'On Earth, gravity pulls your blood down into your feet. In outer space, your blood floats upward into your head, giving you the famous "Puffy Face Bird Legs" look!',
                'tags' => ['kids_science', 'cardiology'],
                'content' => "### The Great Blood Rush to the Head! 🎈\n\nWhen you stand up on Earth, gravity pulls your blood down toward your feet. Your heart has to pump extra hard against gravity to push blood all the way up to your brain.\n\nBut the second an astronaut enters orbit... **ZOOM!** Gravity vanishes!\n\n#### The \"Puffy Face, Bird Legs\" Phenomenon 🦩\nWithout gravity pulling blood down:\n- Nearly **2 liters of fluid** rushes upwards from the legs into the chest and face.\n- Astronauts wake up on their first day in orbit with rosy, rounded cheeks (Puffy Face)!\n- Their calves and thighs get skinny because less fluid stays in their lower limbs (Bird Legs)!\n\n#### How Does the Body Adapt?\n> 🩺 **Junior Doctor Mission Briefing**:\n> The brain thinks: *\"Wow, we have way too much blood in our head!\"* So the body signals the kidneys to filter out extra water. Astronauts actually shrink their total fluid volume within 48 hours to balance things out.\n\n#### Staying Strong Like an Olympic Champion 🏋️\nBecause floating is so easy, the heart does not have to work as hard to pump blood. To keep their heart muscle strong, astronauts ride stationary exercise bikes and run on treadmills with bungee cords for **2 hours every single day**!",
            ],
            [
                'title' => 'Can Astronauts Grow Strawberries & Crunchy Lettuce on Mars? 🌱',
                'slug' => 'growing-vegetables-on-mars-and-iss',
                'author_id' => $educator->id,
                'target_audience' => 'kids',
                'category' => 'Space Botany',
                'reading_time_minutes' => 4,
                'views_count' => 289,
                'published_at' => now()->subDays(4),
                'excerpt' => 'Can plants grow without sunshine and rain? Meet the space gardeners who grow space salads using pink LED lights and pillows of water!',
                'tags' => ['kids_science', 'botany'],
                'content' => "### Space Salad: Farming in Zero Gravity! 🥗🚀\n\nWhen humans travel to Mars on a three-year voyage, they cannot just stop at a grocery store for fresh apples and carrots. Astronauts need to grow their own fresh food right inside their spaceship!\n\n#### How Do Plants Know Which Way Is Up?\nOn Earth, plants use gravity to know that roots grow *down* into the dirt and stems grow *up* towards the sun. In space:\n- **Pink & Purple LED Lights**: Space greenhouses use special magenta LED lights. The stems grow towards the glowing lights!\n- **Water \"Pillows\"**: Instead of dirt that could float around and clog air vents, roots grow inside ceramic clay pillows soaked in nutrient water.\n\n#### Delicious Space Crops Grown on the ISS:\n- 🥬 **Outredgeous Red Romaine Lettuce** (first space salad eaten in 2015!)\n- 🌶️ **Española Chile Peppers** (astronauts used them to make space tacos!)\n- 🍓 **Dwarf Strawberries** (testing for future Artemis moon bases!)\n\n> 🌱 **Science Secret**: Fresh green plants also produce oxygen for the crew to breathe and make astronauts feel happy and calm, reminding them of home planet Earth!",
            ],
            [
                'title' => 'What Happens When You Cry in Space? Tears Form Liquid Spheres! 💧',
                'slug' => 'what-happens-when-you-cry-in-space',
                'author_id' => $educator->id,
                'target_audience' => 'kids',
                'category' => 'Zero-G Physics',
                'reading_time_minutes' => 3,
                'views_count' => 512,
                'published_at' => now()->subDays(3),
                'excerpt' => 'Tears cannot roll down your cheeks without gravity. Instead, they form a giant wobbling liquid bubble right over your eyes!',
                'tags' => ['kids_science', 'space_life'],
                'content' => "### The Bizarre Mystery of Space Tears 💧👀\n\nWhat happens if an astronaut gets soap in their eyes or watches an emotional movie while orbiting Earth at 17,500 miles per hour?\n\n#### Water Sticks Together!\nOn Earth, gravity pulls tears down your cheeks in droplets. But in weightlessness, a property of water called **surface tension** takes over:\n- The tears do not roll down.\n- Instead, they stay stuck together and pool around your eyeball.\n- As you cry more, the water bubble grows bigger and bigger, like a wobbling gelatin dome!\n\n#### How Astronauts Dry Their Eyes:\nAstronaut Chris Hadfield demonstrated this on the Space Station:\n> *\"If you keep crying, the tear ball just gets larger until it spreads across your nose bridge and into your other eye! You have to wipe it off with a towel.\"*\n\n#### Drinking Recycled Space Water 🚰\nDid you know? The ISS water recovery system captures astronaut tears, sweat, and breath humidity, cleans it with high-tech filters, and turns it back into purest drinking water! As astronauts say: *\"Yesterday's coffee is tomorrow's coffee!\"*",
            ],

            // ADULT ARTICLES (CLINICAL FLIGHT SURGEONS & BIO-ASTRONAUTICS)
            [
                'title' => 'Neuro-Ocular Syndrome (SANS) in Long-Duration Lunar & Martian Missions',
                'slug' => 'neuro-ocular-syndrome-sans-long-duration-missions',
                'author_id' => $surgeon->id,
                'target_audience' => 'adults',
                'category' => 'Neuro-Ophthalmology',
                'reading_time_minutes' => 9,
                'views_count' => 614,
                'published_at' => now()->subDays(7),
                'excerpt' => 'A comprehensive clinical examination of cephalad optic disc edema, globe flattening, and hyperopic shifts in microgravity environments.',
                'tags' => ['neuro', 'bioastronautics'],
                'content' => "## Pathophysiology of SANS in Microgravity\n\nSpaceflight-Associated Neuro-Ocular Syndrome (**SANS**) represents one of the paramount physiological challenges confronting long-duration human space exploration. Approximately 70% of long-duration orbital crewmembers exhibit one or more clinical manifestations of this spectrum upon missions exceeding 180 days.\n\n### Primary Clinical Manifestations:\n- **Papilledema & Optic Disc Edema**: Frisén Grade 1–3 swelling visualized via optical coherence tomography (OCT).\n- **Posterior Globe Flattening**: Measurable alteration in axial globe length inducing significant hyperopic refraction shifts.\n- **Choroidal and Retinal Folds**: Mechanical distortion of neurosensory retina secondary to peripapillary biomechanical strain.\n- **Cotton Wool Spots**: Localized nerve fiber layer axoplasmic flow stasis indicating micro-infarction.\n\n```\nCephalad Fluid Shift ──> Venous Engorgement ──> Reduced CSF Resorption ──> Elevated Sheath Pressure ──> Optic Edema\n```\n\n### Hemodynamic Etiology & CSF Hydrodynamics\nIn terrestrial 1G, upright posture induces hydrostatic gradients that drain cranial venous blood through jugular pathways. Microgravity eliminates this diurnal hydrostatic gradient, generating persistent central venous hypertension and impaired glymphatic outflow.\n\n### Validated Countermeasures in AuraMed Protocol:\n1. **Lower Body Negative Pressure (LBNP)**: Sustained application of -25 to -40 mmHg during nocturnal rest to re-establish physiological caudal hydrostatic gradients.\n2. **Resistive Exercise Preloading**: ARED high-load eccentric intervals maintaining vascular tone.\n3. **Dietary Sodium & Fluid Modulation**: Strict control of 1-carbon metabolic cofactors (folate, B12) to mitigate homocysteine-mediated endothelial vulnerability.\n\n*References: Mader et al., Ophthalmology 2011; Patel et al., JAMA Ophthalmol 2020; AuraMed Clinical Protocol Guide v4.2.*",
            ],
            [
                'title' => 'Cardiovascular Deconditioning & Orthostatic Intolerance: Countermeasure Protocols',
                'slug' => 'cardiovascular-deconditioning-orthostatic-intolerance',
                'author_id' => $surgeon->id,
                'target_audience' => 'adults',
                'category' => 'Cardiovascular Medicine',
                'reading_time_minutes' => 8,
                'views_count' => 482,
                'published_at' => now()->subDays(5),
                'excerpt' => 'Mechanistic review of plasma volume contraction, arterial baroreflex resetting, and post-flight syncope mitigation strategies for Martian landing crews.',
                'tags' => ['cardiology', 'bioastronautics'],
                'content' => "## Cardiovascular Remodeling in Zero-G\n\nExposure to microgravity induces immediate and progressive structural and autonomic adaptations in the human cardiovascular tree. Upon orbital insertion, the removal of hydrostatic columns causes cephalic fluid redistribution of approximately 1.5 to 2.0 liters.\n\n### Pathophysiological Cascade:\n1. **Gauer-Henry Reflex Activation**: Central hypervolemia stimulates atrial stretch receptors, inhibiting ADH (vasopressin) and triggering acute diuresis, reducing plasma volume by 15–20% within 48 hours.\n2. **Left Ventricular Mass Atrophy**: Echocardiographic data demonstrates a 8–10% reduction in myocardial mass after 6 months due to decreased volumetric workload.\n3. **Baroreceptor Desensitization**: Carotid and aortic baroreflex sensitivity declines markedly, impairing rapid vasoconstrictive compensation upon re-exposure to gravity.\n\n### Post-Flight & Martian Re-entry Risks:\nUpon landing in a planetary gravity well (Mars 0.38G or Earth 1.0G), crewmembers experience acute **orthostatic intolerance**, marked by profound postural tachycardia, cerebral hypoperfusion, and pre-syncopal episodes.\n\n### Clinical Management Protocol:\n- **Fluid Loading Countermeasure**: Ingestion of 1.0 L isotonic saline solution (8.0 g NaCl dissolved in electrolyte matrix) 2 hours prior to de-orbit burn.\n- **Graduated Compression Garments**: Pneumatic anti-G suits exerting 30–50 mmHg abdominal and lower extremity counterpressure.\n- **Pharmacological Interventions**: Midodrine hydrochloride (selective alpha-1 adrenergic agonist) reserved for high-risk profiles exhibiting severe autonomic impairment.",
            ],
            [
                'title' => 'Galactic Cosmic Radiation & SPE Induced DNA Double-Strand Breaks',
                'slug' => 'galactic-cosmic-radiation-dna-double-strand-breaks',
                'author_id' => $medicalOfficer->id,
                'target_audience' => 'adults',
                'category' => 'Radiation Oncology',
                'reading_time_minutes' => 11,
                'views_count' => 530,
                'published_at' => now()->subDays(3),
                'excerpt' => 'High-Z high-energy (HZE) particle dosimetry, deterministic tissue reactions, and pharmacological radioprotectant candidates for interplanetary transit.',
                'tags' => ['radiation', 'bioastronautics'],
                'content' => "## Space Radiation Oncology & Radiobiology\n\nDeep space interplanetary transit beyond Low Earth Orbit exposes astronauts to a complex, unshielded radiation environment composed of two distinct components:\n1. **Galactic Cosmic Rays (GCR)**: Isotropic background of highly energetic protons, alpha particles, and high-charge/energy (HZE) heavy ions (such as Fe-56).\n2. **Solar Particle Events (SPE)**: Sporadic, intense flux of relativistic coronal mass ejection protons with energies exceeding 100 MeV.\n\n### Molecular Damage & Complex Clustered Lesions\nUnlike terrestrial gamma or X-ray low-LET radiation, HZE ions produce dense ionization tracks resulting in **clustered DNA double-strand breaks (DSBs)**. These complex lesions exceed endogenous non-homologous end joining (NHEJ) and homologous recombination (HR) enzymatic repair fidelity.\n\n### Dose Equivalent Metrics for Mars Mission (1000 Days):\n- Projected Cumulative Dose: **1.0 to 1.2 Sieverts (Sv)**\n- Estimated Excess Lifetime Risk of Radiation-Induced Cancer Death (REID): **3.0% – 5.5%**\n- Microvascular Central Nervous System Damage: Neuro-inflammation, hippocampal synaptic degradation, and accelerated cortical cognitive decline.\n\n### Engineering & Pharmacological Shields:\n- **Hydrogen-Rich Shielding**: Polyethylene and water-wall shielding optimized for heavy ion fragmentation minimization.\n- **Free-Radical Scavengers & Nitroxides**: Tempol and oral nitroxides administered prior to predicted SPE peak dosimetric spikes.\n- **AuraMed Automated Shelter Warning Protocol**: Real-time integration with Deep Space Climate Observatory (DSCOVR) coronal mass ejection telemetry providing 45-minute advance crew shelter lock-in.",
            ],
            [
                'title' => 'Bone Mineral Density Resorption: Bisphosphonates vs High-Resistance Countermeasures',
                'slug' => 'bone-mineral-density-resorption-microgravity',
                'author_id' => $surgeon->id,
                'target_audience' => 'adults',
                'category' => 'Musculoskeletal Medicine',
                'reading_time_minutes' => 7,
                'views_count' => 376,
                'published_at' => now()->subDays(2),
                'excerpt' => 'Analysis of trabecular osteolysis, hypercalciuria nephrolithiasis risks, and comparative efficacy of zoledronic acid infusions combined with ARED mechanical loading.',
                'tags' => ['musculoskeletal', 'bioastronautics'],
                'content' => "## Skeletal Homeostasis in the Absence of Gravitational Strain\n\nIn terrestrial conditions, mechanotransduction through osteocytes regulates balanced remodeling between osteoblasts and osteoclasts. Microgravity removes mechanical axial loading, triggering rapid uncoupling of skeletal homeostasis.\n\n### Rate of Bone Demineralization:\n- Monthly bone mineral density (BMD) loss of **1.0% to 1.5%** in weight-bearing trabecular compartments (lumbar spine, femoral neck, calcaneus).\n- Comparable to the bone loss experienced by post-menopausal terrestrial patients across an entire calendar year.\n\n### Secondary Complication: Renal Calculi (Kidney Stones)\nRapid bone osteolysis dumps excess calcium into the circulatory system, leading to profound **hypercalciuria**. In combination with mild chronic dehydration in space habitat environments, calcium oxalate and calcium phosphate supersaturate urine, generating elevated nephrolithiasis risks during mission transit.\n\n### Clinical Management Protocol:\n- **Advanced Resistive Exercise Device (ARED)**: Mandatory daily eccentric loads up to 600 lbs targeting deadlifts, squats, and heel raises.\n- **Bisphosphonate Therapy**: Pre-flight prophylactic intravenous zoledronic acid (4 mg) infusion, successfully suppressing osteoclastic resorption markers (urinary NTx) by over 60%.\n- **Nutritional Support**: 800–1000 IU Vitamin D3 supplementation coupled with strict hydration monitoring to preserve urinary specific gravity below 1.015.",
            ],
        ];

        foreach ($articles as $art) {
            $tagKeys = $art['tags'];
            unset($art['tags']);

            $article = Article::updateOrCreate(
                ['slug' => $art['slug']],
                array_merge($art, [
                    'uuid' => (string) Str::uuid(),
                    'is_published' => true,
                ])
            );

            $tagIds = [];
            foreach ($tagKeys as $key) {
                if (isset($tags[$key])) {
                    $tagIds[] = $tags[$key]->id;
                }
            }
            $article->tags()->sync($tagIds);
        }
    }
}
