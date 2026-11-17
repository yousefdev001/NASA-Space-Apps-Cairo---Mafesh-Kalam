<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 255)->index();
            $table->string('slug', 255)->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->enum('target_audience', ['kids', 'adults'])->index();
            $table->string('category', 100)->nullable()->index();
            $table->string('thumbnail_path', 500)->nullable();
            $table->unsignedTinyInteger('reading_time_minutes')->nullable();
            $table->boolean('is_published')->default(false)->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->unsignedInteger('views_count')->default(0);
            $table->timestamps();

            $table->index(['target_audience', 'is_published', 'published_at']);
        });

        Schema::create('article_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('slug', 100)->unique();
            $table->timestamps();
        });

        Schema::create('article_tag_pivot', function (Blueprint $table) {
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained('article_tags')->cascadeOnDelete();

            $table->primary(['article_id', 'tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_tag_pivot');
        Schema::dropIfExists('article_tags');
        Schema::dropIfExists('articles');
    }
};
