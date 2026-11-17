<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'launch_date' => 'datetime',
        'scheduled_end_date' => 'datetime',
        'actual_end_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function crew()
    {
        return $this->belongsToMany(Astronaut::class, 'mission_crew_assignments')
            ->withPivot(['role_in_mission', 'assigned_at', 'eva_certified'])
            ->withTimestamps();
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
