<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_model_registry', function (Blueprint $table) {
            $table->id();
            $table->string('model_name', 100)->unique();
            $table->string('version', 50);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->decimal('accuracy_score', 5, 4)->nullable();
            $table->timestamps();
        });

        Schema::create('ai_analysis_jobs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('telemetry_sessions')->nullOnDelete();
            $table->string('model_name', 100)->index();
            $table->string('model_version', 50)->nullable();
            $table->enum('analysis_type', ['rhythm', 'stress', 'hypoxia', 'inflammation', 'cognitive', 'metabolic', 'comprehensive'])->index();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending')->index();
            $table->string('input_data_hash', 64)->nullable();
            $table->timestamp('received_at')->index();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['astronaut_id', 'analysis_type', 'received_at']);
        });

        Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('ai_analysis_jobs')->cascadeOnDelete();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->string('insight_type', 100)->index();
            $table->string('title', 255);
            $table->text('description');
            $table->decimal('confidence_score', 5, 4)->index();
            $table->enum('severity', ['info', 'low', 'medium', 'high', 'critical'])->index();
            $table->text('recommended_action')->nullable();
            $table->json('raw_output')->nullable();
            $table->timestamp('analyzed_at')->index();
            $table->enum('review_status', ['pending_review', 'approved', 'rejected', 'modified'])->default('pending_review')->index();
            $table->timestamps();

            $table->index(['astronaut_id', 'severity', 'review_status']);
            $table->index(['review_status', 'analyzed_at']);
        });

        Schema::create('clinical_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('insight_id')->unique()->constrained('ai_insights')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->enum('decision', ['approved', 'rejected', 'modified'])->index();
            $table->text('modified_description')->nullable();
            $table->text('reviewer_notes')->nullable();
            $table->timestamp('reviewed_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinical_reviews');
        Schema::dropIfExists('ai_insights');
        Schema::dropIfExists('ai_analysis_jobs');
        Schema::dropIfExists('ai_model_registry');
    }
};
