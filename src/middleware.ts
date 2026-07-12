import { NextRequest, NextResponse } from "next/server";

const canonicalHost = "esim.uplisoft.com";
const wwwHost = `www.${canonicalHost}`;

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const requestHost = request.headers.get("host")?.split(":")[0].toLowerCase();
  let shouldRedirect = false;

  if (requestHost === wwwHost || url.hostname === wwwHost) {
    url.hostname = canonicalHost;
    url.port = "";
    shouldRedirect = true;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isCanonicalHost = requestHost === canonicalHost || url.hostname === canonicalHost;
  if ((isCanonicalHost || requestHost === wwwHost) && forwardedProto === "http") {
    url.protocol = "https:";
    url.hostname = canonicalHost;
    url.port = "";
    shouldRedirect = true;
  }

  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    shouldRedirect = true;
  }

  if (!shouldRedirect) return NextResponse.next();

  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|og/).*)"]
};
