<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Alert extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'is_duplicate' => 'boolean',
        'triggered_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function astronaut()
    {
        return $this->belongsTo(Astronaut::class);
    }

    public function mission()
    {
        return $this->belongsTo(Mission::class);
    }

    public function acknowledgements()
    {
        return $this->hasMany(AlertAcknowledgement::class);
    }

    public function escalations()
    {
        return $this->hasMany(AlertEscalation::class);
    }
}
