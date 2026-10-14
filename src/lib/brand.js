import { Database, Globe, HardDrive, Network, Send, Server, Triangle, Zap } from "lucide-react";

const mono = "bg-stone-100 text-stone-600 ring-stone-200";

export const BRAND = {
  "cloudflare-full": { Icon: Zap, chip: mono },
  "cloudflare-dns": { Icon: Globe, chip: mono },
  "cloudflare-r2": { Icon: HardDrive, chip: mono },
  godaddy: { Icon: Globe, chip: mono },
  "godaddy-dns": { Icon: Globe, chip: mono },
  bridge: { Icon: Network, chip: mono },
  resend: { Icon: Send, chip: mono },
  vercel: { Icon: Triangle, chip: mono },
  sanity: { Icon: Database, chip: mono },
  "custom-stdio": { Icon: Server, chip: mono },
  "custom-remote": { Icon: Globe, chip: mono },
};

export const brandFor = (id) => BRAND[id] || { Icon: Server, chip: mono };
