<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telemetry_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mission_id')->nullable()->constrained()->nullOnDelete();
            $table->string('device_id', 100)->nullable()->index();
            $table->enum('session_type', ['realtime', 'sync', 'manual'])->index();
            $table->enum('connection_quality', ['excellent', 'good', 'fair', 'poor', 'offline'])->nullable();
            $table->timestamp('started_at')->index();
            $table->timestamp('ended_at')->nullable();
            $table->timestamp('received_at')->index();
            $table->unsignedInteger('packet_count')->default(0);
            $table->boolean('is_complete')->default(false)->index();
            $table->timestamps();

            $table->index(['astronaut_id', 'started_at']);
            $table->index(['mission_id', 'started_at']);
        });

        Schema::create('vital_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('telemetry_sessions')->cascadeOnDelete();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->timestamp('measured_at', 3)->index();
            $table->timestamp('received_at');
            $table->unsignedSmallInteger('heart_rate_bpm')->nullable();
            $table->decimal('spo2_percent', 5, 2)->nullable();
            $table->decimal('core_temp_celsius', 5, 2)->nullable();
            $table->decimal('respiratory_rate_bpm', 5, 2)->nullable();
            $table->unsignedSmallInteger('systolic_bp')->nullable();
            $table->unsignedSmallInteger('diastolic_bp')->nullable();
            $table->decimal('hrv_rmssd_ms', 8, 3)->nullable();
            $table->decimal('stress_index', 5, 2)->nullable();
            $table->decimal('sleep_quality_score', 5, 2)->nullable();
            $table->tinyInteger('mood_score')->nullable();
            $table->decimal('blood_glucose_mgdl', 6, 2)->nullable();
            $table->enum('status', ['nominal', 'warning', 'critical'])->default('nominal')->index();
            $table->json('raw_payload')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['astronaut_id', 'measured_at']);
            $table->index(['session_id', 'measured_at']);
            $table->index(['status', 'measured_at']);
        });

        Schema::create('organ_telemetry_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('telemetry_sessions')->cascadeOnDelete();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->timestamp('measured_at')->index();
            $table->foreignId('organ_system_id')->constrained()->cascadeOnDelete();
            $table->decimal('health_score_percent', 5, 2)->index();
            $table->string('primary_metric_value', 100);
            $table->string('primary_metric_unit', 50)->nullable();
            $table->enum('status', ['nominal', 'warning', 'critical'])->default('nominal')->index();
            $table->json('raw_data')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['astronaut_id', 'organ_system_id', 'measured_at']);
        });

        Schema::create('ecg_recordings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('telemetry_sessions')->cascadeOnDelete();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->timestamp('measured_at')->index();
            $table->unsignedSmallInteger('duration_seconds');
            $table->unsignedSmallInteger('sample_rate_hz')->default(500);
            $table->longText('waveform_data')->nullable(); // JSON or serialized samples
            $table->string('file_path', 500)->nullable();
            $table->text('interpretation')->nullable();
            $table->string('rhythm', 100)->nullable();
            $table->boolean('is_flagged')->default(false)->index();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('eeg_recordings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('telemetry_sessions')->cascadeOnDelete();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->timestamp('measured_at')->index();
            $table->decimal('alpha_hz', 6, 3)->nullable();
            $table->decimal('beta_hz', 6, 3)->nullable();
            $table->decimal('theta_hz', 6, 3)->nullable();
            $table->decimal('delta_hz', 6, 3)->nullable();
            $table->decimal('cognitive_load_index', 5, 2)->nullable();
            $table->boolean('is_flagged')->default(false)->index();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('radiation_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('telemetry_sessions')->cascadeOnDelete();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->timestamp('measured_at')->index();
            $table->decimal('dose_rate_msv_hr', 10, 6);
            $table->decimal('cumulative_dose_msv', 12, 6);
            $table->string('particle_type', 50)->nullable();
            $table->json('energy_spectra')->nullable();
            $table->boolean('shelter_recommended')->default(false)->index();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('suit_telemetry', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('telemetry_sessions')->cascadeOnDelete();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->timestamp('measured_at')->index();
            $table->decimal('suit_pressure_kpa', 8, 3)->nullable();
            $table->decimal('o2_partial_pressure_kpa', 8, 3)->nullable();
            $table->decimal('co2_scrubber_efficiency', 5, 2)->nullable();
            $table->decimal('suit_temp_inner_celsius', 5, 2)->nullable();
            $table->decimal('battery_percent', 5, 2)->nullable();
            $table->unsignedSmallInteger('eva_duration_minutes')->nullable();
            $table->enum('status', ['nominal', 'warning', 'critical'])->default('nominal')->index();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('environment_telemetry', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->timestamp('measured_at')->index();
            $table->decimal('cabin_pressure_kpa', 8, 3)->nullable();
            $table->decimal('o2_percent', 5, 2)->nullable();
            $table->decimal('co2_ppm', 8, 2)->nullable();
            $table->decimal('humidity_percent', 5, 2)->nullable();
            $table->decimal('temperature_celsius', 5, 2)->nullable();
            $table->decimal('noise_db', 5, 2)->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('telemetry_thresholds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('astronaut_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('metric_name', 100)->index();
            $table->decimal('warning_min', 12, 4)->nullable();
            $table->decimal('warning_max', 12, 4)->nullable();
            $table->decimal('critical_min', 12, 4)->nullable();
            $table->decimal('critical_max', 12, 4)->nullable();
            $table->string('unit', 30)->nullable();
            $table->boolean('is_global')->default(false)->index();
            $table->foreignId('set_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['astronaut_id', 'metric_name']);
        });

        Schema::create('telemetry_aggregates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->enum('period_type', ['hourly', 'daily', 'weekly'])->index();
            $table->timestamp('period_start')->index();
            $table->string('metric_name', 100)->index();
            $table->decimal('avg_value', 12, 4)->nullable();
            $table->decimal('min_value', 12, 4)->nullable();
            $table->decimal('max_value', 12, 4)->nullable();
            $table->unsignedInteger('reading_count')->default(0);
            $table->timestamps();

            $table->unique(['astronaut_id', 'period_type', 'period_start', 'metric_name'], 'uniq_astro_period_metric');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telemetry_aggregates');
        Schema::dropIfExists('telemetry_thresholds');
        Schema::dropIfExists('environment_telemetry');
        Schema::dropIfExists('suit_telemetry');
        Schema::dropIfExists('radiation_readings');
        Schema::dropIfExists('eeg_recordings');
        Schema::dropIfExists('ecg_recordings');
        Schema::dropIfExists('organ_telemetry_readings');
        Schema::dropIfExists('vital_readings');
        Schema::dropIfExists('telemetry_sessions');
    }
};
