<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_type', 100)->index();
            $table->string('auditable_type', 100)->index();
            $table->unsignedBigInteger('auditable_id')->nullable()->index();
            $table->text('description');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable()->index();
            $table->string('user_agent', 500)->nullable();
            $table->char('previous_hash', 64)->nullable();
            $table->char('current_hash', 64)->index();
            $table->timestamp('created_at')->index();

            $table->index(['event_type', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('login_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('ip_address', 45)->index();
            $table->string('user_agent', 500)->nullable();
            $table->enum('status', ['success', 'failed', 'blocked'])->index();
            $table->timestamp('logged_at')->index();

            $table->index(['user_id', 'logged_at']);
        });

        Schema::create('encryption_keys', function (Blueprint $table) {
            $table->id();
            $table->string('key_identifier', 100)->unique();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('activated_at');
            $table->timestamp('retired_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encryption_keys');
        Schema::dropIfExists('login_history');
        Schema::dropIfExists('audit_logs');
    }
};
