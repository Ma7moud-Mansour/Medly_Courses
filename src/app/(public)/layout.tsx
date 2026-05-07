import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { WhatsappFloating } from "@/components/layout/whatsapp-floating";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="medly-public-main flex-1">{children}</main>
      <Footer />
      <WhatsappFloating />
    </div>
  );
}
