import { Suspense } from "react";
import OtpClient from "./OtpClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Carregando...</main>}>
      <OtpClient />
    </Suspense>
  );
}
