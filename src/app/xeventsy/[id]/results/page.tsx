"use client";

import { use } from "react";
import { ResultsShell } from "../../editor/ResultsShell";

export default function AdminEventModalResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ResultsShell id={id} />;
}
