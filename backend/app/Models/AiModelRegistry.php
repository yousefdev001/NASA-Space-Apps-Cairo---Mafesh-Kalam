<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiModelRegistry extends Model
{
    use HasFactory;

    protected $table = 'ai_model_registry';

    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'accuracy_score' => 'decimal:4',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
