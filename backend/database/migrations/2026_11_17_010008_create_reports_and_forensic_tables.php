<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('report_code', 20)->index();
            $table->string('title', 255);
            $table->enum('report_type', [
                'crew_health_summary',
                'equipment_performance',
                'mission_analysis',
                'forensic_timeline',
                'ai_validation',
                'alert_summary',
                'medication_log',
                'eva_debrief',
                'post_mission',
            ])->index();
            $table->foreignId('astronaut_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('mission_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('period_start')->nullable()->index();
            $table->timestamp('period_end')->nullable();
            $table->enum('status', ['draft', 'pending_review', 'approved', 'published', 'archived'])->default('draft')->index();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->string('file_path_pdf', 500)->nullable();
            $table->string('file_path_csv', 500)->nullable();
            $table->text('summary')->nullable();
            $table->timestamps();

            $table->index(['report_type', 'status', 'created_at']);
        });

        Schema::create('report_forensic_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->cascadeOnDelete();
            $table->timestamp('event_time')->index();
            $table->string('event_type', 100)->index();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('related_metric', 100)->nullable();
            $table->string('metric_value', 100)->nullable();
            $table->enum('severity', ['info', 'low', 'medium', 'high', 'critical'])->nullable()->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_forensic_events');
        Schema::dropIfExists('reports');
    }
};
