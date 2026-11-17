<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VitalReading extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'heart_rate' => 'integer',
        'spo2' => 'integer',
        'systolic_bp' => 'integer',
        'diastolic_bp' => 'integer',
        'core_temperature' => 'decimal:2',
        'respiration_rate' => 'integer',
        'radiation_dose_rate' => 'decimal:4',
        'ambient_o2_percent' => 'decimal:2',
        'ambient_co2_mmhg' => 'decimal:2',
        'ambient_temp_c' => 'decimal:2',
        'raw_payload' => 'array',
        'measured_at' => 'datetime',
        'received_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function astronaut()
    {
        return $this->belongsTo(Astronaut::class);
    }
}
