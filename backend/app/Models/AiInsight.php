<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiInsight extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'confidence_score' => 'decimal:4',
        'raw_output' => 'array',
        'analyzed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function job()
    {
        return $this->belongsTo(AiAnalysisJob::class, 'job_id');
    }

    public function astronaut()
    {
        return $this->belongsTo(Astronaut::class);
    }

    public function review()
    {
        return $this->hasOne(ClinicalReview::class, 'insight_id');
    }
}
