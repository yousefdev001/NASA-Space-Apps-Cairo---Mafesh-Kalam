<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organ_systems', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 50)->unique();
            $table->string('name', 100);
            $table->string('category', 100);
            $table->string('primary_metric', 100);
            $table->string('primary_unit', 50)->nullable();
            $table->string('icon_name', 50)->nullable();
            $table->text('description')->nullable();
            $table->decimal('nominal_range_min', 10, 4)->nullable();
            $table->decimal('nominal_range_max', 10, 4)->nullable();
            $table->decimal('warning_range_min', 10, 4)->nullable();
            $table->decimal('warning_range_max', 10, 4)->nullable();
            $table->timestamps();
        });

        Schema::create('organ_system_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organ_system_id')->constrained()->cascadeOnDelete();
            $table->foreignId('astronaut_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->text('note');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organ_system_notes');
        Schema::dropIfExists('organ_systems');
    }
};
