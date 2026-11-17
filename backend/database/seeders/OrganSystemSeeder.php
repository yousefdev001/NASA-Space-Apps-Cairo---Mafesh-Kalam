<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrganSystemSeeder extends Seeder
{
    public function run(): void
    {
        $organs = [
            [
                'slug' => 'heart',
                'name' => 'Heart',
                'category' => 'Cardiovascular',
                'primary_metric' => 'Heart Rate',
                'primary_unit' => 'BPM',
                'icon_name' => 'Heart',
                'description' => 'Cardiovascular telemetry monitoring continuous 500Hz Lead II ECG, resting heart rate, and HRV RMSSD drift.',
                'nominal_range_min' => 50.0,
                'nominal_range_max' => 90.0,
                'warning_range_min' => 91.0,
                'warning_range_max' => 120.0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'lungs',
                'name' => 'Lungs',
                'category' => 'Respiratory',
                'primary_metric' => 'Pulse Oximetry',
                'primary_unit' => '% SpO2',
                'icon_name' => 'Wind',
                'description' => 'Peripheral capillary oxygen saturation and respiratory minute volume under microgravity gas exchange.',
                'nominal_range_min' => 96.0,
                'nominal_range_max' => 100.0,
                'warning_range_min' => 92.0,
                'warning_range_max' => 95.9,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'brain',
                'name' => 'Brain',
                'category' => 'Central Nervous',
                'primary_metric' => 'Alpha Wave Frequency',
                'primary_unit' => 'Hz Alpha',
                'icon_name' => 'Brain',
                'description' => 'Continuous neurological EEG band monitoring cognitive load index, circadian rhythm, and SANS risk factors.',
                'nominal_range_min' => 8.0,
                'nominal_range_max' => 12.0,
                'warning_range_min' => 6.0,
                'warning_range_max' => 7.9,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'liver',
                'name' => 'Liver',
                'category' => 'Hepatic / Metabolic',
                'primary_metric' => 'Enzyme Status',
                'primary_unit' => 'ALT/AST Nominal',
                'icon_name' => 'Activity',
                'description' => 'Transcutaneous metabolic biomarker and enzymatic clearance tracking hepatic adaptation to deep space pharmaceuticals.',
                'nominal_range_min' => 10.0,
                'nominal_range_max' => 45.0,
                'warning_range_min' => 46.0,
                'warning_range_max' => 80.0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'kidneys',
                'name' => 'Kidneys',
                'category' => 'Renal System',
                'primary_metric' => 'Hydration Index',
                'primary_unit' => 'Hydration %',
                'icon_name' => 'Droplets',
                'description' => 'Bio-impedance renal filtration status, urinary electrolyte balance, and microgravity nephrolithiasis risk index.',
                'nominal_range_min' => 85.0,
                'nominal_range_max' => 100.0,
                'warning_range_min' => 70.0,
                'warning_range_max' => 84.9,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'whole_body',
                'name' => 'Whole Body',
                'category' => 'Systemic Bio-Scan',
                'primary_metric' => 'Core Temperature',
                'primary_unit' => '°C',
                'icon_name' => 'User',
                'description' => 'Systemic core body temperature, circadian thermoregulation, and metabolic exertion score across 14 organs.',
                'nominal_range_min' => 36.3,
                'nominal_range_max' => 37.3,
                'warning_range_min' => 37.4,
                'warning_range_max' => 38.2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($organs as $organ) {
            DB::table('organ_systems')->updateOrInsert(['slug' => $organ['slug']], $organ);
        }
    }
}
