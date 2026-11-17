<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('astronauts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('callsign', 20)->unique();
            $table->string('full_name', 255)->index();
            $table->string('nationality', 100)->index();
            $table->date('date_of_birth');
            $table->enum('blood_type', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
            $table->enum('gender', ['male', 'female', 'other']);
            $table->string('rank', 100)->nullable();
            $table->string('specialization', 200)->nullable();
            $table->string('photo_path', 500)->nullable();
            $table->text('bio')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('eva_certified')->default(false)->index();
            $table->decimal('total_eva_hours', 8, 2)->default(0);
            $table->unsignedInteger('total_space_days')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'eva_certified']);
        });

        Schema::create('astronaut_medical_baselines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->timestamp('measured_at')->index();
            $table->unsignedSmallInteger('heart_rate_bpm');
            $table->decimal('spo2_percent', 5, 2);
            $table->decimal('core_temp_celsius', 5, 2);
            $table->unsignedSmallInteger('systolic_bp')->nullable();
            $table->unsignedSmallInteger('diastolic_bp')->nullable();
            $table->unsignedSmallInteger('respiratory_rate')->nullable();
            $table->decimal('weight_kg', 6, 2)->nullable();
            $table->decimal('height_cm', 6, 2)->nullable();
            $table->decimal('vo2_max', 6, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['astronaut_id', 'measured_at']);
        });

        Schema::create('astronaut_medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->enum('record_type', ['pre_flight', 'in_flight', 'post_flight', 'annual'])->index();
            $table->string('title', 255);
            $table->text('encrypted_notes'); // Encrypted at application layer
            $table->string('file_path', 500)->nullable();
            $table->boolean('is_confidential')->default(true)->index();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('recorded_at')->index();
            $table->timestamps();

            $table->index(['astronaut_id', 'record_type', 'recorded_at']);
        });

        Schema::create('astronaut_certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->string('certification_name', 255);
            $table->date('issued_at');
            $table->date('expires_at')->nullable()->index();
            $table->string('issuing_body', 255);
            $table->boolean('is_valid')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('astronaut_certifications');
        Schema::dropIfExists('astronaut_medical_records');
        Schema::dropIfExists('astronaut_medical_baselines');
        Schema::dropIfExists('astronauts');
    }
};
