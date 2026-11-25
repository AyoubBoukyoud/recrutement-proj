<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/** A recorded student payment. Cancelled payments are soft-deleted for traceability. */
#[Fillable(['center_id', 'student_id', 'period', 'amount', 'paid_on', 'method', 'reference', 'note', 'recorded_by', 'deleted_by'])]
class TrainingPayment extends Model
{
    use SoftDeletes;

    public const METHODS = ['cash', 'transfer', 'check', 'card'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'paid_on' => 'date:Y-m-d'];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(TrainingStudent::class, 'student_id');
    }

    public function toApi(): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'period' => $this->period,
            'amount' => (float) $this->amount,
            'paid_on' => $this->paid_on?->format('Y-m-d'),
            'method' => $this->method,
            'reference' => $this->reference,
            'note' => $this->note,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
