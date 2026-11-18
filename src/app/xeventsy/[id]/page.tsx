"use client";

import { use } from "react";
import { EditorShell } from "../editor/EditorShell";
import { parseTemplate } from "../templates";

export default function AdminEventModalEditorPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ template?: string | string[] }>;
}) {
  const { id } = use(params);
  const { template } = use(searchParams);
  return <EditorShell id={id} template={parseTemplate(template)} />;
}
