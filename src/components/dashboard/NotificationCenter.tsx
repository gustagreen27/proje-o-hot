import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Square, Image as ImageIcon, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  hapticImpact,
  isNative,
  sendSaleNotificationSequence,
  stopSaleSequence,
} from "@/lib/NotificationService";
import { useBranding, type Branding } from "@/lib/branding";
import { generateTransactionId } from "@/lib/transactionId";

export function NotificationCenter() {
  const [branding, setBranding] = useBranding();

  const [saleValue, setSaleValue] = useState<string>("360.24");
  const [notificationCount, setNotificationCount] = useState<number>(1);
  const [notificationInterval, setNotificationInterval] = useState<number>(3);
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  // Local draft for branding inputs
  const [draftName, setDraftName] = useState(branding.platformName);
  const [draftLogo, setDraftLogo] = useState<string | null>(branding.platformLogo);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const previewTx = `HP${Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)}`;

  const onPickFile = (file: File) => {
    if (file.size > 1.2 * 1024 * 1024) {
      toast.error("Logo deve ter até 1.2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraftLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSaveBranding = async () => {
    await hapticImpact("light");
    const next: Branding = {
      platformName: draftName.trim() || "Gucmart",
      platformLogo: draftLogo,
    };
    setBranding(next);
    toast.success("Personalização salva");
  };

  const onSend = async () => {
    if (isSending) return;
    setIsSending(true);
    setSentCount(0);
    await hapticImpact("medium");
    const r = await sendSaleNotificationSequence({
      amount: saleValue || "0.00",
      count: notificationCount,
      interval: notificationInterval,
      platformName: branding.platformName,
      onProgress: (sent) => setSentCount(sent),
      onDone: () => setIsSending(false),
    });
    if (r.ok) {
      toast.success(`${r.scheduled} notificação(ões) agendada(s)`);
    } else if (r.reason === "not-native") {
      toast.message("Pré-visualização web · funciona real no app iOS (.ipa)");
    } else if (r.reason === "denied") {
      setIsSending(false);
      toast.error("Permissão negada nos Ajustes do iPhone");
    }
  };

  const onStop = async () => {
    await hapticImpact("light");
    stopSaleSequence();
    setIsSending(false);
    toast.message("Sequência interrompida");
  };

  const progress = notificationCount > 0 ? (sentCount / notificationCount) * 100 : 0;

  return (
    <section className="mx-5 mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold tracking-wide text-white/80">
          Central de Notificações
        </h3>
        <span className="text-[11px] text-white/40">
          {isNative() ? "iOS nativo" : "preview web"}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-3xl glass-strong p-5">
        <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-indigo-500/25 blur-3xl" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor da venda (US$)">
            <input
              inputMode="decimal"
              value={saleValue}
              onChange={(e) => setSaleValue(e.target.value.replace(",", "."))}
              className="ios-input"
              placeholder="360.24"
            />
          </Field>
          <Field label="Quantidade">
            <input
              inputMode="numeric"
              type="number"
              min={1}
              max={100}
              value={notificationCount}
              onChange={(e) => setNotificationCount(Math.max(1, Number(e.target.value) || 1))}
              className="ios-input"
            />
          </Field>
          <Field label="Intervalo (segundos)">
            <input
              inputMode="numeric"
              type="number"
              min={0}
              max={3600}
              value={notificationInterval}
              onChange={(e) =>
                setNotificationInterval(Math.max(0, Number(e.target.value) || 0))
              }
              className="ios-input"
            />
          </Field>
          <Field label="Plataforma">
            <div className="flex h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-[13px] text-white/80">
              <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-md bg-white/10">
                {branding.platformLogo ? (
                  <img src={branding.platformLogo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold">
                    {branding.platformName.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="truncate">{branding.platformName}</span>
            </div>
          </Field>
        </div>

        {/* Progress */}
        <AnimatePresence>
          {(isSending || sentCount > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="mb-1 flex items-center justify-between text-[11px] text-white/60">
                <span>{isSending ? "Enviando…" : "Concluído"}</span>
                <span>
                  {sentCount}/{notificationCount}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full gradient-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onSend}
            disabled={isSending}
            className="pressable flex h-11 items-center justify-center gap-2 rounded-2xl gradient-primary text-[13px] font-semibold text-white shadow-lg disabled:opacity-60"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Enviar Notificações
          </button>
          <button
            onClick={onStop}
            disabled={!isSending}
            className="pressable flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/10 text-[13px] font-semibold text-white/90 disabled:opacity-40"
          >
            <Square className="h-4 w-4" /> Parar Sequência
          </button>
        </div>

        {/* Live preview of next notification */}
        <div className="mt-4 rounded-2xl bg-black/40 p-3 ring-1 ring-white/10">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white/10">
              {branding.platformLogo ? (
                <img src={branding.platformLogo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Sparkles className="h-4 w-4 text-white/80" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12px] font-semibold text-white">
                  Venda realizada com Cartão de Crédito
                </p>
                <span className="text-[10px] text-white/50">agora</span>
              </div>
              <p className="text-[11px] text-white/60">{branding.platformName}</p>
              <p className="mt-0.5 text-[12px] text-white/80">
                Você recebeu: US$ {saleValue || "0.00"} - {previewTx}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personalização da Plataforma */}
      <div className="mt-5">
        <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-white/80">
          Personalização da Plataforma
        </h3>
        <div className="rounded-3xl glass-strong p-5">
          <div className="grid grid-cols-[88px_1fr] gap-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="pressable group relative grid h-22 w-22 place-items-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15"
              style={{ height: 88, width: 88 }}
              aria-label="Escolher logo"
            >
              {draftLogo ? (
                <img src={draftLogo} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-white/60" />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[10px] text-white/80 opacity-0 transition group-hover:opacity-100">
                Trocar
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickFile(f);
                  e.target.value = "";
                }}
              />
            </button>

            <div className="flex flex-col gap-2">
              <Field label="Nome da plataforma">
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="ios-input"
                  placeholder="Gucmart"
                  maxLength={32}
                />
              </Field>
              <div className="flex items-center gap-2">
                <button
                  onClick={onSaveBranding}
                  className="pressable inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-xl gradient-success text-[12px] font-semibold text-white shadow"
                >
                  <Save className="h-4 w-4" /> Salvar Personalização
                </button>
                {draftLogo && (
                  <button
                    onClick={() => setDraftLogo(null)}
                    className="pressable h-9 rounded-xl bg-white/10 px-3 text-[12px] text-white/80"
                  >
                    Remover logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-black/40 p-3 ring-1 ring-white/10">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-white/40">
              Pré-visualização
            </p>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl gradient-primary text-sm font-bold text-white">
                {draftLogo ? (
                  <img src={draftLogo} alt="" className="h-full w-full object-cover" />
                ) : (
                  (draftName || "G").slice(0, 1).toUpperCase()
                )}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-white">
                  {draftName || "Gucmart"}
                </p>
                <p className="text-[11px] text-white/60">
                  Você recebeu: US$ {saleValue || "0.00"} - {previewTx}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-white/50">{label}</span>
      {children}
    </label>
  );
}
