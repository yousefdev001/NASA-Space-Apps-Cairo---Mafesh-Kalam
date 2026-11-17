<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganTelemetry extends Model
{
    use HasFactory;

    protected $table = 'organ_telemetry';
    protected $guarded = ['id'];

    protected $casts = [
        'health_score' => 'decimal:2',
        'is_nominal' => 'boolean',
        'metrics_snapshot' => 'array',
        'measured_at' => 'datetime',
        'received_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function astronaut()
    {
        return $this->belongsTo(Astronaut::class);
    }

    public function organSystem()
    {
        return $this->belongsTo(OrganSystem::class);
    }
}
