<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganTelemetry extends Model
{
    use HasFactory;

    protected $table = 'organ_telemetry_readings';

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'health_score_percent' => 'decimal:2',
        'raw_data' => 'array',
        'measured_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function astronaut()
    {
        return $this->belongsTo(Astronaut::class);
    }

    public function organSystem()
    {
        return $this->belongsTo(OrganSystem::class);
    }

    public function getHealthScoreAttribute()
    {
        return $this->health_score_percent;
    }

    public function getMetricsSnapshotAttribute()
    {
        return $this->raw_data;
    }

    public function getIsNominalAttribute(): bool
    {
        return $this->status === 'nominal';
    }
}
