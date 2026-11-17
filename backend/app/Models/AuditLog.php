<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Deterministic SHA-256 payload computation for non-repudiation.
     */
    public static function computeHash(
        string $previousHash,
        ?int $userId,
        string $eventType,
        string $auditableType,
        ?int $auditableId,
        string $description,
        ?array $oldValues,
        ?array $newValues
    ): string {
        return hash('sha256', json_encode([
            'prev' => $previousHash,
            'user' => $userId,
            'event' => $eventType,
            'type' => $auditableType,
            'id' => $auditableId,
            'desc' => $description,
            'old' => $oldValues,
            'new' => $newValues,
        ]));
    }

    /**
     * Helper to create a cryptographically chained audit log entry.
     */
    public static function record(string $eventType, string $auditableType, ?int $auditableId, string $description, ?array $oldValues = null, ?array $newValues = null, ?int $userId = null): self
    {
        $lastLog = self::orderBy('id', 'desc')->first();
        $previousHash = $lastLog ? $lastLog->current_hash : str_repeat('0', 64);
        $resolvedUserId = $userId ?? (auth()->check() ? auth()->id() : null);

        $currentHash = self::computeHash(
            $previousHash,
            $resolvedUserId,
            $eventType,
            $auditableType,
            $auditableId,
            $description,
            $oldValues,
            $newValues
        );

        return self::create([
            'user_id' => $resolvedUserId,
            'event_type' => $eventType,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'AuraMed System',
            'previous_hash' => $previousHash,
            'current_hash' => $currentHash,
            'created_at' => now(),
        ]);
    }
}
