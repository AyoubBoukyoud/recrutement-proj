import Link from "next/link";
import { Button } from "./Button";
import type { JobApplication } from "@/lib/candidateMarketplace";

export function CandidateApplicationCard({
  application,
  statusLabel,
  withdrawLabel,
  onWithdraw,
  withdrawing = false,
  locale,
}: {
  application: JobApplication;
  statusLabel: string;
  withdrawLabel?: string;
  onWithdraw?: () => void;
  withdrawing?: boolean;
  locale?: string;
}) {
  const terminal = ["accepted", "rejected", "withdrawn"].includes(
    application.status,
  );

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
        <span className="h-fit rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold">
          {statusLabel}
        </span>
      </div>
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
