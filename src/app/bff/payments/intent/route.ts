import { errorJson } from "@/lib/route-response";
import { WEB_PURCHASES_DISABLED_MESSAGE } from "@/lib/web-purchases";

/** Web purchases are disabled: buying (and topping up) happens only in the mobile app. */
export async function POST() {
  return errorJson(WEB_PURCHASES_DISABLED_MESSAGE, 403);
}
