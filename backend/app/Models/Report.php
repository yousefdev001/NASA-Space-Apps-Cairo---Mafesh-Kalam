<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'period_start' => 'datetime',
        'period_end' => 'datetime',
        'approved_at' => 'datetime',
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

    public function author()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function forensicEvents()
    {
        return $this->hasMany(ReportForensicEvent::class)->orderBy('event_time', 'asc');
    }
}
