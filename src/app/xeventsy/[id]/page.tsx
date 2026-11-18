"use client";

import { use } from "react";
import { EditorShell } from "../editor/EditorShell";

export default function AdminEventModalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditorShell id={id} />;
}
