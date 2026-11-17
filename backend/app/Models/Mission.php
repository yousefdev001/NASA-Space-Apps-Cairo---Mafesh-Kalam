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
        'expected_return_date' => 'datetime',
        'actual_return_date' => 'datetime',
        'is_primary' => 'boolean',
        'mission_elapsed_seconds' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function crew()
    {
        return $this->belongsToMany(Astronaut::class, 'mission_crew_assignments')
            ->withPivot(['crew_role', 'assigned_at', 'is_primary_crew'])
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

    public function getCodeAttribute(): string
    {
        return $this->mission_code;
    }
}
