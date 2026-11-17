<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademyLesson extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'sort_order' => 'integer',
        'xp_reward' => 'integer',
        'duration_minutes' => 'integer',
        'is_published' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function course()
    {
        return $this->belongsTo(AcademyCourse::class, 'course_id');
    }

    public function quizzes()
    {
        return $this->hasMany(AcademyQuiz::class, 'lesson_id')->orderBy('sort_order', 'asc');
    }
}
