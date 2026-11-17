<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\Article;
use App\Models\ArticleTag;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ArticleController extends Controller
{
    /**
     * Public listing of educational space medicine articles.
     */
    public function publicArticles(Request $request)
    {
        $query = Article::with('tags:id,name,slug', 'author:id,name')
            ->where('is_published', true)
            ->orderBy('published_at', 'desc');

        if ($request->has('audience') && in_array($request->query('audience'), ['kids', 'adults'])) {
            $query->where('target_audience', $request->query('audience'));
        }

        if ($request->has('category')) {
            $query->where('category', $request->query('category'));
        }

        $articles = $query->paginate($request->query('per_page', 9));

        return ApiResponse::paginated($articles, 'Educational articles retrieved.');
    }

    /**
     * Public detail view of a single article by its unique slug.
     */
    public function publicArticleDetail($slug)
    {
        $article = Article::with('tags:id,name,slug', 'author:id,name')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        // Increment view count atomically
        $article->increment('views_count');

        // Fetch 3 related articles from same audience
        $related = Article::where('target_audience', $article->target_audience)
            ->where('id', '!=', $article->id)
            ->where('is_published', true)
            ->limit(3)
            ->get(['id', 'slug', 'title', 'excerpt', 'target_audience', 'thumbnail_path', 'reading_time_minutes']);

        return ApiResponse::success([
            'article' => $article,
            'related' => $related,
        ], 'Article retrieved.');
    }

    /**
     * Internal author/editor index.
     */
    public function index(Request $request)
    {
        $query = Article::with('tags', 'author')->orderBy('created_at', 'desc');

        if ($request->has('audience')) {
            $query->where('target_audience', $request->query('audience'));
        }

        $articles = $query->paginate(20);

        return ApiResponse::paginated($articles, 'Articles list retrieved.');
    }

    /**
     * Create article.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'target_audience' => 'required|in:kids,adults',
            'category' => 'nullable|string',
            'reading_time_minutes' => 'nullable|integer|min:1',
            'tags' => 'nullable|array',
            'is_published' => 'nullable|boolean',
        ]);

        $slug = Str::slug($data['title']).'-'.Str::lower(Str::random(6));

        $article = Article::create([
            'uuid' => (string) Str::uuid(),
            'author_id' => auth()->id() ?? 1,
            'title' => $data['title'],
            'slug' => $slug,
            'excerpt' => $data['excerpt'] ?? Str::limit(strip_tags($data['content']), 150),
            'content' => $data['content'],
            'target_audience' => $data['target_audience'],
            'category' => $data['category'] ?? 'General Bio-Astronautics',
            'reading_time_minutes' => $data['reading_time_minutes'] ?? 5,
            'is_published' => $data['is_published'] ?? false,
            'published_at' => ($data['is_published'] ?? false) ? now() : null,
        ]);

        if (! empty($data['tags'])) {
            $tagIds = [];
            foreach ($data['tags'] as $tagName) {
                $tag = ArticleTag::firstOrCreate(
                    ['slug' => Str::slug($tagName)],
                    ['name' => $tagName]
                );
                $tagIds[] = $tag->id;
            }
            $article->tags()->sync($tagIds);
        }

        AuditLog::record(
            'article_created',
            'Article',
            $article->id,
            "Educational article [{$article->title}] authored for {$article->target_audience} audience."
        );

        return ApiResponse::created($article->load('tags'), 'Article created successfully.');
    }

    /**
     * Publish article.
     */
    public function publish(Request $request, $id)
    {
        $article = Article::findOrFail($id);

        $article->update([
            'is_published' => true,
            'published_at' => now(),
        ]);

        AuditLog::record(
            'article_published',
            'Article',
            $article->id,
            "Article [{$article->title}] published."
        );

        return ApiResponse::success($article, 'Article published.');
    }

    /**
     * Delete article.
     */
    public function destroy($id)
    {
        $article = Article::findOrFail($id);
        $title = $article->title;
        $article->delete();

        AuditLog::record(
            'article_deleted',
            'Article',
            $id,
            "Article [{$title}] deleted."
        );

        return ApiResponse::success(null, 'Article deleted.');
    }
}
