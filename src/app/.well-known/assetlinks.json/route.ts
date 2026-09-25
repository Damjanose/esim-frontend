import { androidAssetLinks, jsonFileResponse } from "@/lib/app-links";

export const dynamic = "force-static";

export function GET() {
  return jsonFileResponse(androidAssetLinks());
}
