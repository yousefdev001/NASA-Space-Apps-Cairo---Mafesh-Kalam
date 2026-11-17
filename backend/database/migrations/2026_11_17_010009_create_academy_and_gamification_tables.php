<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academy_courses', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('title', 255)->index();
            $table->string('slug', 255)->unique();
            $table->enum('target_audience', ['kids', 'adults', 'both'])->index();
            $table->string('category', 100)->index();
            $table->enum('difficulty', ['beginner', 'intermediate', 'advanced'])->index();
            $table->text('description')->nullable();
            $table->string('thumbnail_path', 500)->nullable();
            $table->unsignedSmallInteger('xp_reward')->default(0);
            $table->boolean('is_published')->default(false)->index();
            $table->unsignedSmallInteger('sort_order')->default(0)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('academy_lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('academy_courses')->cascadeOnDelete();
            $table->string('title', 255);
            $table->longText('content');
            $table->enum('lesson_type', ['text', 'video', 'quiz', 'game'])->index();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->unsignedSmallInteger('xp_reward')->default(0);
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->boolean('is_published')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('academy_quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained('academy_lessons')->cascadeOnDelete();
            $table->text('question');
            $table->json('options');
            $table->unsignedTinyInteger('correct_option_index');
            $table->text('explanation')->nullable();
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('academy_mini_games', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 100)->unique();
            $table->string('game_type', 100);
            $table->enum('target_audience', ['kids', 'all'])->default('kids')->index();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('xp_reward')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('user_academy_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('academy_courses')->cascadeOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained('academy_lessons')->nullOnDelete();
            $table->enum('status', ['not_started', 'in_progress', 'completed'])->default('not_started')->index();
            $table->timestamp('completed_at')->nullable()->index();
            $table->decimal('score_percent', 5, 2)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id', 'lesson_id']);
        });

        Schema::create('user_xp_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('source_type', ['lesson', 'quiz', 'game', 'badge', 'report'])->index();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->unsignedSmallInteger('xp_earned');
            $table->timestamp('earned_at')->index();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('badges', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('icon_path', 500)->nullable();
            $table->unsignedInteger('xp_required')->default(0)->index();
            $table->string('category', 100)->nullable()->index();
            $table->timestamps();
        });

        Schema::create('user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained()->cascadeOnDelete();
            $table->timestamp('earned_at')->index();

            $table->unique(['user_id', 'badge_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');
        Schema::dropIfExists('user_xp_records');
        Schema::dropIfExists('user_academy_progress');
        Schema::dropIfExists('academy_mini_games');
        Schema::dropIfExists('academy_quizzes');
        Schema::dropIfExists('academy_lessons');
        Schema::dropIfExists('academy_courses');
    }
};
