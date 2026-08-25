<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
#[Fillable(['user_id','title','description','sector','city','country','required_cefr_level','salary_min','salary_max','currency','contract_type','status','published_at'])]
class JobOffer extends Model { protected function casts(): array{return ['published_at'=>'datetime'];} public function employer(): BelongsTo{return $this->belongsTo(User::class,'user_id');} public function applications(): HasMany{return $this->hasMany(JobApplication::class);} }
