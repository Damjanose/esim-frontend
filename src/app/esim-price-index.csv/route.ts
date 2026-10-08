import { getPriceIndex } from "@/lib/destinationPricing";
import { priceIndexCsv } from "@/lib/price-index";
import { siteUrl } from "@/lib/seo";

// Same refresh window as the /esim-price-index page it mirrors.
export const revalidate = 3600;

export async function GET() {
  const { rows, updatedAt } = await getPriceIndex();

  return new Response(priceIndexCsv(rows, siteUrl, updatedAt), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="esim2you-price-index.csv"'
    }
  });
}
