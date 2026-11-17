<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganSystem extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_critical' => 'boolean',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function telemetry()
    {
        return $this->hasMany(OrganTelemetry::class);
    }
}
