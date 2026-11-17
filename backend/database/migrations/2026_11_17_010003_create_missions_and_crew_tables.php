<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('mission_code', 50)->unique();
            $table->string('name', 255)->index();
            $table->text('description')->nullable();
            $table->enum('mission_type', ['ISS', 'LUNAR', 'MARS', 'DEEP_SPACE', 'SUBORBITAL'])->index();
            $table->enum('status', ['planned', 'active', 'completed', 'aborted'])->index();
            $table->dateTime('launch_date')->nullable()->index();
            $table->dateTime('expected_return_date')->nullable();
            $table->dateTime('actual_return_date')->nullable();
            $table->string('vehicle_name', 100)->nullable();
            $table->string('destination', 255)->nullable();
            $table->unsignedBigInteger('mission_elapsed_seconds')->default(0);
            $table->boolean('is_primary')->default(false)->index();
            $table->string('thumbnail_path', 500)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'mission_type']);
            $table->index(['status', 'launch_date']);
        });

        Schema::create('mission_crew_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->string('crew_role', 100);
            $table->timestamp('assigned_at')->index();
            $table->timestamp('removed_at')->nullable();
            $table->boolean('is_primary_crew')->default(true)->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['mission_id', 'astronaut_id']);
            $table->index(['mission_id', 'is_primary_crew']);
        });

        Schema::create('mission_phases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->string('phase_name', 100);
            $table->unsignedTinyInteger('phase_order');
            $table->enum('status', ['pending', 'active', 'completed', 'skipped'])->default('pending')->index();
            $table->timestamp('started_at')->nullable()->index();
            $table->timestamp('completed_at')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['mission_id', 'phase_order']);
        });

        Schema::create('mission_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->enum('media_type', ['photo', 'video', 'document'])->index();
            $table->string('title', 255)->nullable();
            $table->string('file_path', 500);
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->timestamp('taken_at')->nullable()->index();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('mission_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->boolean('is_flagged')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('mission_elapsed_time_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 100);
            $table->text('event_description')->nullable();
            $table->unsignedBigInteger('met_seconds')->index();
            $table->timestamp('logged_at')->index();
            $table->foreignId('logged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mission_elapsed_time_logs');
        Schema::dropIfExists('mission_notes');
        Schema::dropIfExists('mission_media');
        Schema::dropIfExists('mission_phases');
        Schema::dropIfExists('mission_crew_assignments');
        Schema::dropIfExists('missions');
    }
};
