<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller; use App\Services\CandidateProfileResolver; use App\Services\ProfileCompleteness; use Illuminate\Http\JsonResponse; use Illuminate\Http\Request;
class CandidateVisibilityController extends Controller {
 public function show(Request $r): JsonResponse { return $this->respond($r); }
 public function pause(Request $r): JsonResponse { CandidateProfileResolver::resolve($r->user())->update(['visibility_paused_at'=>now()]); return $this->respond($r); }
 public function resume(Request $r): JsonResponse { $p=CandidateProfileResolver::resolve($r->user()); abort_if($p->cndp_withdrawn_at,409,'CNDP consent must be granted again before resuming visibility.'); $p->update(['visibility_paused_at'=>null]); return $this->respond($r); }
 public function withdraw(Request $r): JsonResponse { CandidateProfileResolver::resolve($r->user())->update(['cndp_withdrawn_at'=>now(),'visibility_paused_at'=>now()]); return $this->respond($r); }
 public function grant(Request $r): JsonResponse { CandidateProfileResolver::resolve($r->user())->update(['cndp_consent_at'=>now(),'cndp_withdrawn_at'=>null,'visibility_paused_at'=>null]); return $this->respond($r); }
 private function respond(Request $r): JsonResponse { $p=CandidateProfileResolver::resolve($r->user())->fresh(); return response()->json(['visible'=>(bool)($p->terms_consent_at&&$p->cndp_consent_at&&!$p->cndp_withdrawn_at&&!$p->visibility_paused_at),'paused'=>(bool)$p->visibility_paused_at,'withdrawn'=>(bool)$p->cndp_withdrawn_at,'completeness'=>ProfileCompleteness::for($p)]); }
}
