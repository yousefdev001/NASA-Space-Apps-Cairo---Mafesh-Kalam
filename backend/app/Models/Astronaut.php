<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Astronaut extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'date_of_birth' => 'date',
        'is_active' => 'boolean',
        'eva_certified' => 'boolean',
        'total_eva_hours' => 'decimal:2',
        'total_space_days' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function missions()
    {
        return $this->belongsToMany(Mission::class, 'mission_crew_assignments')
            ->withPivot(['crew_role', 'assigned_at', 'is_primary_crew'])
            ->withTimestamps();
    }

    public function vitalReadings()
    {
        return $this->hasMany(VitalReading::class);
    }

    public function organTelemetries()
    {
        return $this->hasMany(OrganTelemetry::class);
    }

    public function aiInsights()
    {
        return $this->hasMany(AiInsight::class);
    }

    public function alerts()
    {
        return $this->hasMany(Alert::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function getFirstNameAttribute(): string
    {
        $parts = explode(' ', $this->full_name);

        return $parts[0] ?? $this->full_name;
    }

    public function getLastNameAttribute(): string
    {
        $parts = explode(' ', $this->full_name);

        return count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
    }
}
