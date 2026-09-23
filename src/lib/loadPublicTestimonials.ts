import { backendFetch } from "@/lib/backend";
import { visibleTestimonials, type PublicTestimonial } from "@/lib/testimonials";

export async function loadPublicTestimonials(): Promise<PublicTestimonial[]> {
  const result = await backendFetch<{ testimonials?: unknown }>("/testimonials", {
    next: { revalidate: 60 }
  });
  if (!result.ok) return [];
  return visibleTestimonials(result.data.testimonials);
}
