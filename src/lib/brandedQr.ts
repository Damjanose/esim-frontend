import QRCode from "qrcode";

/** Served from public/images; transparent round astronaut badge. */
export const QR_BADGE_SRC = "/images/qr-astronaut.png";

/**
 * Share of the QR width the badge covers. Level H error correction survives ~30%
 * damage; a 22%-wide centre badge hides under 5% of the modules.
 */
export const QR_BADGE_RATIO = 0.22;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * QR code as a PNG data URL with the eSIM2you astronaut in the middle. Always
 * level H. If the badge can't be drawn (no canvas, image fails to load) it
 * falls back to the plain level-H QR, which scans the same.
 *
 * Only for codes we generate ourselves. Never for eSIM install (LPA) QRs.
 */
export async function brandedQrDataUrl(value: string, width: number): Promise<string> {
  const plain = await QRCode.toDataURL(value, { margin: 1, width, errorCorrectionLevel: "H" });
  try {
    const [qr, badge] = await Promise.all([loadImage(plain), loadImage(QR_BADGE_SRC)]);
    const canvas = document.createElement("canvas");
    canvas.width = qr.width;
    canvas.height = qr.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return plain;
    ctx.drawImage(qr, 0, 0);
    const size = Math.round(canvas.width * QR_BADGE_RATIO);
    const centre = canvas.width / 2;
    // White disc a little larger than the badge so its edge never touches modules.
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centre, centre, size / 2 + size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(badge, centre - size / 2, centre - size / 2, size, size);
    return canvas.toDataURL("image/png");
  } catch {
    return plain;
  }
}
