<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserAcademyProgress extends Model
{
    use HasFactory;

    protected $table = 'user_academy_progress';

    protected $guarded = ['id'];

    protected $casts = [
        'completed_at' => 'datetime',
        'score_percent' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(AcademyCourse::class, 'course_id');
    }

    public function lesson()
    {
        return $this->belongsTo(AcademyLesson::class, 'lesson_id');
    }
}
