import type { DocView } from "./docView";

/**
 * A fixed Albania · 1 day · 1 traveller plan (the app's TripPlanSampleDocument,
 * English copy), drawn by the same TripPlanDocument that renders real plans.
 */
export const SAMPLE_CAPTION = "Sample: Albania · 1 day · 1 traveller";

export const SAMPLE_DOC_VIEW: DocView = {
  title: "Tirana in a day",
  coverLines: [
    "A walking day in Albania's capital  •  Sat 14 Jun  •  1 day",
    "Hotel near Skanderbeg Square  |  1 traveller",
    "On foot · food & history · relaxed pace"
  ],
  glance: [{ day: "Sat · 14 Jun", theme: "Old Tirana & Blloku", highlight: "Dajti Ekspres at sunset" }],
  logistics: "Arrival: Tirana Airport (TIA), ~30 min by airport bus   |   Base: Skanderbeg Square",
  transit: "Skanderbeg Square bus stops, 2 min on foot",
  tips: [
    "Walk the centre: every stop before 18:00 is within 20 minutes on foot.",
    "Take a Bolt or taxi to the Dajti Ekspres cable car (~20 min) and back into town for dinner."
  ],
  days: [
    {
      heading: "Day 1 · Saturday · 14 Jun",
      title: "Old Tirana, Blloku and the mountain view",
      accent: false,
      blocks: [
        { time: "08:30", place: "Breakfast at Mulliri i Vjetër", details: "Espresso and a warm byrek on the square. ~30 min.", highlight: false },
        { time: "09:30", place: "Skanderbeg Square & Et'hem Bey Mosque", details: "Free. Cover shoulders and knees for the mosque, then see the clock tower next door.", highlight: false },
        { time: "11:00", place: "Bunk'Art 2", details: "Cold War bunker museum, 5 min on foot. Allow about 1 hour.", highlight: false },
        { time: "13:00", place: "Lunch at Oda", details: "Traditional Albanian home cooking. Try tavë kosi and fërgesë.", highlight: false },
        { time: "15:00", place: "Pyramid of Tirana & Blloku", details: "Climb the pyramid for the view, then coffee in the former party quarter.", highlight: false },
        { time: "18:00", place: "Dajti Ekspres cable car", details: "Sunset over the city from 1,000 m. ~20 min by taxi; check the time of the last car down.", highlight: true },
        { time: "20:30", place: "Dinner at Mullixhiu", details: "Farm-to-table Albanian menu by the Grand Park. Book ahead.", highlight: false }
      ]
    }
  ],
  notes: [
    { label: "Money", text: "Cards work in the centre; keep some lek for taxis, cafés and markets." },
    { label: "Data", text: "An eSIM keeps maps and Bolt working all day without roaming fees." }
  ],
  locked: false
};
