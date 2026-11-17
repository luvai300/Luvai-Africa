"use client";
import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
type InstallEvent = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: string }>;
};
export default function PwaInstall() {
  const [installed, setInstalled] = useState(true),
    [prompt, setPrompt] = useState<InstallEvent | null>(null),
    [busy, setBusy] = useState(false),
    [ios, setIos] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const mode = window.matchMedia("(display-mode: standalone)");
    const standalone = () =>
      mode.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone());
    setIos(
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
    const before = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
      dialog.current?.close();
    };
    const change = () => {
      setInstalled(standalone());
      if (standalone()) dialog.current?.close();
    };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    mode.addEventListener("change", change);
    const register = () => {
      if ("serviceWorker" in navigator && window.isSecureContext)
        navigator.serviceWorker
          .register("/sw.js", { scope: "/", updateViaCache: "none" })
          .catch(() => {});
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", done);
      mode.removeEventListener("change", change);
      window.removeEventListener("load", register);
    };
  }, []);
  if (installed) return null;
  async function install() {
    if (busy) return;
    if (!prompt) {
      dialog.current?.showModal();
      return;
    }
    setBusy(true);
    const event = prompt;
    setPrompt(null);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      dialog.current?.showModal();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="install-app"
        type="button"
        aria-label="Install Luvai Africa"
        title="Install Luvai Africa"
        disabled={busy}
        onClick={install}
      >
        <Download size={17} />
        <span>Install app</span>
      </button>
      <dialog
        className="pwa-dialog"
        ref={dialog}
        aria-labelledby="install-title"
      >
        <button
          className="pwa-close"
          onClick={() => dialog.current?.close()}
          aria-label="Close installation help"
        >
          <X size={20} />
        </button>
        <img src="/logo-mark.svg" alt="" width="64" height="64" />
        <h2 id="install-title">Install Luvai Africa.</h2>
        <p>Add Luvai Africa to your home screen and open it like an app.</p>
        <ol>
          {(ios
            ? [
                "Open this website in Safari.",
                "Tap Share, then Add to Home Screen.",
                "If shown, enable Open as Web App, then tap Add.",
              ]
            : [
                "Open this website in Chrome or Edge.",
                "Open the browser menu and choose Install app or Add to Home screen.",
                "Confirm to add the Luvai Africa icon.",
              ]
          ).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <small>
          An internet connection is needed for accounts, listings and photos.
        </small>
        <button
          className="button primary full"
          onClick={() => dialog.current?.close()}
        >
          Got it
        </button>
      </dialog>
    </>
  );
}
