<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VitalReading extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'heart_rate_bpm' => 'integer',
        'spo2_percent' => 'decimal:2',
        'systolic_bp' => 'integer',
        'diastolic_bp' => 'integer',
        'core_temp_celsius' => 'decimal:2',
        'respiratory_rate_bpm' => 'decimal:2',
        'hrv_rmssd_ms' => 'decimal:3',
        'stress_index' => 'decimal:2',
        'sleep_quality_score' => 'decimal:2',
        'mood_score' => 'integer',
        'blood_glucose_mgdl' => 'decimal:2',
        'raw_payload' => 'array',
        'measured_at' => 'datetime',
        'received_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function astronaut()
    {
        return $this->belongsTo(Astronaut::class);
    }

    public function getHeartRateAttribute()
    {
        return $this->heart_rate_bpm;
    }

    public function getSpo2Attribute()
    {
        return $this->spo2_percent;
    }

    public function getCoreTemperatureAttribute()
    {
        return $this->core_temp_celsius;
    }

    public function getRespirationRateAttribute()
    {
        return $this->respiratory_rate_bpm;
    }
}
