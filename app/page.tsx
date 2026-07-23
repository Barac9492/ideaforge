"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import Home from "@/components/Home";
import Step1Inventory from "@/components/Step1Inventory";
import Step2Ideas from "@/components/Step2Ideas";
import Step3Pressure from "@/components/Step3Pressure";
import Step4Reality from "@/components/Step4Reality";

export type View = "home" | "step1" | "step2" | "step3" | "step4";

export default function Page() {
  const [view, setView] = useState<View>("home");

  function go(v: View) {
    setView(v);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  return (
    <Shell onHome={() => go("home")}>
      {view === "home" && <Home go={go} />}
      {view === "step1" && <Step1Inventory go={go} />}
      {view === "step2" && <Step2Ideas go={go} />}
      {view === "step3" && <Step3Pressure go={go} />}
      {view === "step4" && <Step4Reality go={go} />}
    </Shell>
  );
}
