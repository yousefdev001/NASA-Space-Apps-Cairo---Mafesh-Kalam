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
        'dob' => 'date',
        'is_active' => 'boolean',
        'emergency_contact' => 'array',
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
            ->withPivot(['role_in_mission', 'assigned_at', 'eva_certified'])
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
}
