<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('astronaut_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('mission_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('source_type', ['vital_reading', 'organ_telemetry', 'ai_insight', 'manual', 'environment'])->index();
            $table->unsignedBigInteger('source_id')->nullable()->index();
            $table->string('alert_code', 50)->index();
            $table->string('title', 255);
            $table->text('description');
            $table->enum('severity', ['info', 'low', 'medium', 'high', 'critical'])->index();
            $table->enum('status', ['triggered', 'acknowledged', 'escalated', 'resolved', 'dismissed'])->default('triggered')->index();
            $table->timestamp('triggered_at')->index();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->boolean('is_duplicate')->default(false)->index();
            $table->string('dedup_hash', 64)->nullable()->index();
            $table->timestamps();

            $table->index(['status', 'severity', 'triggered_at']);
            $table->index(['astronaut_id', 'status']);
        });

        Schema::create('alert_acknowledgements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_id')->constrained('alerts')->cascadeOnDelete();
            $table->foreignId('acknowledged_by')->constrained('users')->cascadeOnDelete();
            $table->text('action_taken')->nullable();
            $table->timestamp('acknowledged_at')->index();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('alert_escalations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_id')->constrained('alerts')->cascadeOnDelete();
            $table->foreignId('escalated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('escalated_to_role', 50)->index();
            $table->text('reason')->nullable();
            $table->timestamp('escalated_at')->index();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('alert_notification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_id')->constrained('alerts')->cascadeOnDelete();
            $table->foreignId('notified_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('channel', ['in_app', 'email', 'sms']);
            $table->timestamp('sent_at')->index();
            $table->boolean('delivered')->default(false)->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_notification_logs');
        Schema::dropIfExists('alert_escalations');
        Schema::dropIfExists('alert_acknowledgements');
        Schema::dropIfExists('alerts');
    }
};
