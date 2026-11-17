<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('employee_id', 50)->nullable()->unique();
            $table->string('department', 100)->nullable()->index();
            $table->string('title', 150)->nullable();
            $table->string('phone', 30)->nullable();
            $table->text('bio')->nullable();
            $table->string('timezone', 50)->default('UTC');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
