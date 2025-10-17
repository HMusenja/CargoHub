import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CopyRefButton({ refCode, size = "sm",className }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(refCode);
      setOk(true);
      setTimeout(() => setOk(false), 1200);
    } catch {}
  }
   return (
    <Button
      size={size}
      variant="secondary"
      className={className}
      onClick={copy}
      title="Copy reference"
    >
      {ok ? "Copied" : "Copy"}
    </Button>
  );
}