<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticleTag extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function articles()
    {
        return $this->belongsToMany(Article::class, 'article_tag_pivot', 'tag_id', 'article_id');
    }
}
