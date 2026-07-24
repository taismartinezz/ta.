"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@/app/icons";

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/trip/${slug}/join`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, non-secure context); the
      // link text is still visible above for manual copying.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-2 flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs"
    >
      {copied && <CheckCircleIcon size={14} className="text-accent" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
