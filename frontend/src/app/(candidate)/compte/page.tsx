"use client";

// Candidate account security, accessibility and CNDP controls.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/shared/Button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { accountApi } from "@/lib/candidateAccount";
import { getProfilePreview } from "@/lib/candidateProfile";
import { candidateCompteContentFor } from "@/lib/candidateCompteContent";

export default function AccountPage() {
  const { token, logout } = useAuth();
  const { language } = useLanguage();
  const { textSize, setTextSize } = useSettings();
  const content = candidateCompteContentFor(language);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [notice, setNotice] = useState<string | null>(null);
  const status = useQuery({
    queryKey: ["candidate-account"],
    queryFn: () => accountApi.status(token as string),
    enabled: Boolean(token),
  });
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: () => accountApi.sessions(token as string),
    enabled: Boolean(token) && status.data?.deletion_pending === false,
  });
  const refreshSessions = () =>
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
  const revoke = useMutation({
    mutationFn: (id: number) => accountApi.revoke(id, token as string),
    onSuccess: refreshSessions,
  });
  const revokeOthers = useMutation({
    mutationFn: () => accountApi.revokeOthers(token as string),
    onSuccess: refreshSessions,
  });
  const requestPhone = useMutation({
    mutationFn: () => accountApi.requestPhone(phone, token as string),
    onSuccess: () => setStage("code"),
  });
  const confirmPhone = useMutation({
    mutationFn: () => accountApi.confirmPhone(phone, code, token as string),
    onSuccess: () => {
      setStage("phone");
      setPhone("");
      setCode("");
      refreshSessions();
    },
  });
  const cancelDeletion = useMutation({
    mutationFn: () => accountApi.cancelDeletion(token as string),
    onSuccess: async () => {
      setNotice(content.deletion.cancelled);
      await queryClient.invalidateQueries({ queryKey: ["candidate-account"] });
      await queryClient.invalidateQueries({ queryKey: ["candidate-profile"] });
      router.replace("/dashboard");
    },
  });

  const download = async () => {
    const data = await accountApi.exportData(token as string);
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mes-donnees-amud.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printProfile = async () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const preview = await getProfilePreview(token as string);
    printWindow.document.title = content.data.print;
    const style = printWindow.document.createElement("style");
    style.textContent =
      "body{font-family:Arial,sans-serif;margin:40px;color:#172b2b}pre{white-space:pre-wrap;line-height:1.5}";
    const title = printWindow.document.createElement("h1");
    title.textContent = content.data.print;
    const dossier = printWindow.document.createElement("pre");
    dossier.textContent = JSON.stringify(preview.profile, null, 2);
    printWindow.document.head.appendChild(style);
    printWindow.document.body.append(title, dossier);
    printWindow.print();
  };

  const remove = async () => {
    if (!window.confirm(content.data.confirm)) return;
    await accountApi.deleteAccount(token as string);
    logout();
    router.replace("/auth-phone");
  };

  if (status.data?.deletion_pending) {
    const deletionDate = status.data.deletion_requested_at
      ? new Date(status.data.deletion_requested_at).toLocaleDateString(language)
      : "—";
    return (
      <div className="min-h-screen bg-surface p-6">
        <main className="mx-auto mt-12 max-w-xl rounded-2xl border border-error/30 bg-surface-container-lowest p-6 shadow-subtle">
          <span className="material-symbols-outlined text-4xl text-error">
            event_busy
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-error">
            {content.deletion.title}
          </h1>
          <p className="mt-2 text-onSurface-variant">
            {content.deletion.body.replace("{date}", deletionDate)}
          </p>
          <Button
            className="mt-6"
            disabled={cancelDeletion.isPending}
            onClick={() => cancelDeletion.mutate()}
          >
            {content.deletion.cancel}
          </Button>
          {notice && (
            <p role="status" className="mt-3 text-sm text-primary">
              {notice}
            </p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="flex h-16 items-center gap-3 border-b border-outline-variant px-4">
        <Link href="/profil" aria-label={content.backAria}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-bold text-primary">{content.title}</h1>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <section className="rounded-xl border border-outline-variant p-5">
          <h2 className="font-bold">{content.sessions.title}</h2>
          {sessions.isLoading && <p>{content.loading}</p>}
          {sessions.data?.sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between gap-3 border-b border-outline-variant py-3"
            >
              <div>
                <p className="font-semibold">{session.device_name}</p>
                <p className="text-xs text-onSurface-variant">
                  {session.current
                    ? content.sessions.current
                    : session.last_used_at
                      ? content.sessions.lastUsed.replace(
                          "{date}",
                          new Date(session.last_used_at).toLocaleString(
                            language,
                          ),
                        )
                      : content.sessions.never}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="destructive-ghost"
                  size="sm"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(session.id)}
                >
                  {content.sessions.disconnect}
                </Button>
              )}
            </div>
          ))}
          {(sessions.data?.sessions.filter((session) => !session.current)
            .length ?? 0) > 0 && (
            <Button
              variant="outline"
              className="mt-4"
              disabled={revokeOthers.isPending}
              onClick={() => revokeOthers.mutate()}
            >
              {content.sessions.disconnectOthers}
            </Button>
          )}
        </section>

        <section className="rounded-xl border border-outline-variant p-5">
          <h2 className="font-bold">{content.phone.title}</h2>
          <p className="mt-1 text-sm text-onSurface-variant">
            {content.phone.hint}
          </p>
          {stage === "phone" ? (
            <input
              aria-label={content.phone.phoneFieldLabel}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={content.phone.phonePlaceholder}
              className="mt-4 min-h-11 w-full rounded-lg border border-outline p-3"
            />
          ) : (
            <input
              aria-label={content.phone.codeFieldLabel}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={content.phone.codePlaceholder}
              maxLength={6}
              inputMode="numeric"
              className="mt-4 min-h-11 w-full rounded-lg border border-outline p-3"
            />
          )}
          <Button
            className="mt-3"
            disabled={stage === "phone" ? !phone : code.length !== 6}
            onClick={() =>
              stage === "phone" ? requestPhone.mutate() : confirmPhone.mutate()
            }
          >
            {stage === "phone" ? content.phone.send : content.phone.confirm}
          </Button>
          {(requestPhone.isError || confirmPhone.isError) && (
            <p role="alert" className="mt-2 text-sm text-error">
              {content.phone.error}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-outline-variant p-5">
          <h2 className="font-bold">{content.accessibility.title}</h2>
          <p className="mt-1 text-sm text-onSurface-variant">
            {content.accessibility.textSize}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["small", "medium", "large"] as const).map((size) => (
              <Button
                key={size}
                size="sm"
                variant={textSize === size ? "primary" : "outline"}
                aria-pressed={textSize === size}
                onClick={() => setTextSize(size)}
              >
                {content.accessibility[size]}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant p-5">
          <h2 className="font-bold">{content.data.title}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" onClick={download}>
              {content.data.export}
            </Button>
            <Button variant="outline" onClick={printProfile}>
              {content.data.print}
            </Button>
            <Button variant="destructive" onClick={remove}>
              {content.data.delete}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
