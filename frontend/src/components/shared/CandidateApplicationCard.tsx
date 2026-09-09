import Link from "next/link";
import { Button } from "./Button";
import { Badge } from "@/components/ui";
import type { JobApplication } from "@/lib/candidateMarketplace";

const STATUS_BADGE_TONE: Record<JobApplication["status"], "done" | "pending" | "error" | "neutral"> = {
  submitted: "pending",
  viewed: "pending",
  interview: "pending",
  accepted: "done",
  rejected: "error",
  withdrawn: "neutral",
};

export function CandidateApplicationCard({
  application,
  statusLabel,
  withdrawLabel,
  onWithdraw,
  withdrawing = false,
  locale,
  decisionMessage,
}: {
  application: JobApplication;
  statusLabel: string;
  withdrawLabel?: string;
  onWithdraw?: () => void;
  withdrawing?: boolean;
  locale?: string;
  /** Shown under the header for `accepted`/`rejected` — the moment a status badge alone reads as too quiet. */
  decisionMessage?: string;
}) {
  const terminal = ["accepted", "rejected", "withdrawn"].includes(
    application.status,
  );
  const decided = application.status === "accepted" || application.status === "rejected";

  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle">
      <div className="flex justify-between gap-3">
        <div>
          <Link
            href={`/offres/${application.offer.id}`}
            className="font-bold text-primary hover:underline"
          >
            {application.offer.title}
          </Link>
          <p className="mt-1 text-sm text-onSurface-variant">
            {application.offer.city} ·{" "}
            {new Date(application.applied_at).toLocaleDateString(locale)}
          </p>
        </div>
        <Badge tone={STATUS_BADGE_TONE[application.status]}>{statusLabel}</Badge>
      </div>
      {decided && decisionMessage && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            application.status === "accepted"
              ? "bg-primary-light text-primary-dark"
              : "bg-surface-container text-onSurface-variant"
          }`}
        >
          {decisionMessage}
        </p>
      )}
      {!terminal && withdrawLabel && onWithdraw && (
        <Button
          variant="destructive-ghost"
          size="sm"
          className="mt-4"
          disabled={withdrawing}
          onClick={onWithdraw}
        >
          {withdrawLabel}
        </Button>
      )}
    </article>
  );
}
