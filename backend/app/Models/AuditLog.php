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
     * Helper to create a cryptographically chained audit log entry.
     */
    public static function record(string $eventType, string $auditableType, ?int $auditableId, string $description, ?array $oldValues = null, ?array $newValues = null, ?int $userId = null): self
    {
        $lastLog = self::orderBy('id', 'desc')->first();
        $previousHash = $lastLog ? $lastLog->current_hash : str_repeat('0', 64);
        $timestamp = now()->toIso8601String();

        $payloadToHash = json_encode([
            'prev' => $previousHash,
            'event' => $eventType,
            'type' => $auditableType,
            'id' => $auditableId,
            'user' => $userId,
            'time' => $timestamp,
            'old' => $oldValues,
            'new' => $newValues,
        ]);

        $currentHash = hash('sha256', $payloadToHash);

        return self::create([
            'user_id' => $userId ?? (auth()->check() ? auth()->id() : null),
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
