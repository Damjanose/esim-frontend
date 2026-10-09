"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import {
  addDays,
  addMonths,
  calendarWeeks,
  monthOf,
  pickCalendarDate,
  type DateField
} from "@/lib/flightPickers";
import type { FlightForm } from "@/lib/flightSearch";

type Props = {
  form: Pick<FlightForm, "tripType" | "departDate" | "returnDate">;
  /** YYYY-MM-DD, "" until the client has mounted. */
  today: string;
  onDates: (dates: { departDate: string; returnDate: string }) => void;
  onTripType: (tripType: FlightForm["tripType"]) => void;
};

const LOCALE = "en-US";
const dayFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: "short", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: "short", timeZone: "UTC" });
const fullFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});
const titleFmt = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" });
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

/**
 * Departure and return side by side (big day number over weekday + month), opening one
 * calendar that picks the range. The return half doubles as the trip-type toggle:
 * "Add return" on one-way, a clear button on round trip.
 */
export function DatePicker({ form, today, onDates, onTripType }: Props) {
  const [field, setField] = useState<DateField | null>(null);
  const roundTrip = form.tripType === "round-trip";
  const triggers = useRef<Record<DateField, HTMLButtonElement | null>>({ depart: null, return: null });

  const close = (focus: DateField | null = field) => {
    setField(null);
    if (focus) triggers.current[focus]?.focus();
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-2 rounded-[18px] bg-brandBlue/[0.045]">
        <DateHalf
          date={form.departDate}
          label="Depart"
          shape="rounded-l-[18px]"
          onClick={() => setField("depart")}
          open={field === "depart"}
          refFn={(el) => (triggers.current.depart = el)}
        />
        <div className="relative border-l border-brandBlue/15">
          {roundTrip ? (
            <>
              <DateHalf
                date={form.returnDate}
                label="Return"
                shape="rounded-r-[18px]"
                onClick={() => setField("return")}
                open={field === "return"}
                refFn={(el) => (triggers.current.return = el)}
              />
              <button
                aria-label="Remove return, fly one way"
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-onSurfaceVariant transition hover:bg-brandBlue/[0.08] hover:text-brandInk"
                onClick={() => {
                  onTripType("one-way");
                  onDates({ departDate: form.departDate, returnDate: "" });
                }}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </>
          ) : (
            <button
              className="flex h-full min-h-[118px] w-full items-center justify-center gap-1.5 rounded-r-[18px] text-title-sm text-brandBlue outline-none transition hover:bg-brandBlue/[0.04] focus-visible:ring-4 focus-visible:ring-brandBlue/20"
              onClick={() => {
                onTripType("round-trip");
                setField("return");
              }}
              ref={(el) => {
                triggers.current.return = el;
              }}
              type="button"
            >
              <Plus aria-hidden="true" size={18} />
              Add return
            </button>
          )}
        </div>
      </div>

      {field ? (
        <Calendar
          field={field}
          form={form}
          onClose={() => close()}
          onPick={(date) => {
            const next = pickCalendarDate(form, field, date);
            onDates({ departDate: next.departDate, returnDate: next.returnDate });
            if (next.next) setField(next.next);
            else close(field);
          }}
          onField={setField}
          today={today}
        />
      ) : null}
    </div>
  );
}

function DateHalf({
  label,
  date,
  open,
  shape,
  onClick,
  refFn
}: {
  label: string;
  date: string;
  open: boolean;
  /** Which corners follow the pair's rounded outline. */
  shape: string;
  onClick: () => void;
  refFn: (el: HTMLButtonElement | null) => void;
}) {
  const thisYear = new Date().getUTCFullYear();
  const d = date ? utc(date) : null;
  const rest = d
    ? `${weekdayFmt.format(d)}, ${monthFmt.format(d)}${d.getUTCFullYear() !== thisYear ? ` ${d.getUTCFullYear()}` : ""}`
    : "";
  return (
    <button
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={d ? `${label}: ${fullFmt.format(d)}` : `${label}: choose date`}
      className={`group block min-h-[118px] w-full px-5 py-4 text-left outline-none transition ${shape} hover:bg-brandBlue/[0.04] focus-visible:ring-4 focus-visible:ring-brandBlue/20 ${
        open ? "bg-brandBlue/[0.06]" : ""
      }`}
      onClick={onClick}
      ref={refFn}
      type="button"
    >
      <span className="block text-body-sm text-onSurfaceVariant">{label}</span>
      {d ? (
        <>
          <span className="mt-1 block font-display text-[40px] font-bold leading-[46px] text-brandInk">
            {dayFmt.format(d)}
          </span>
          <span className="block text-body-md text-onSurfaceVariant">{rest}</span>
        </>
      ) : (
        <span className="mt-2 block font-display text-headline-md text-onSurfaceVariant/70 group-hover:text-brandBlue">
          Choose date
        </span>
      )}
    </button>
  );
}

function Calendar({
  field,
  form,
  today,
  onPick,
  onField,
  onClose
}: {
  field: DateField;
  form: Pick<FlightForm, "tripType" | "departDate" | "returnDate">;
  today: string;
  onPick: (date: string) => void;
  onField: (field: DateField) => void;
  onClose: () => void;
}) {
  const roundTrip = form.tripType === "round-trip";
  const selected = (field === "return" ? form.returnDate : form.departDate) || form.departDate;
  const start = selected && (!today || selected >= today) ? selected : today;
  const [focus, setFocus] = useState(start);
  const [view, setView] = useState(() => (start ? monthOf(start) : null));
  const [hover, setHover] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  // Focus the chosen day on open, and follow arrow-key moves after that.
  const moved = useRef(true);

  // `today` arrives after mount; anchor the month once it does.
  useEffect(() => {
    if (!view && start) {
      setView(monthOf(start));
      setFocus(start);
    }
  }, [view, start]);

  useEffect(() => {
    if (moved.current) gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus();
  }, [focus, view]);

  const weeks = useMemo(() => (view ? calendarWeeks(view.year, view.month) : []), [view]);
  if (!view) return null;

  // One day is tabbable: the focused one, or the first open day after paging months.
  const days = weeks.flat().filter((date): date is string => Boolean(date));
  const tabbable = days.includes(focus) ? focus : days.find((date) => !today || date >= today);

  const minView = today ? monthOf(today) : null;
  const atMin = minView ? view.year * 12 + view.month <= minView.year * 12 + minView.month : false;

  // Range shown: the saved range, or a hover preview while choosing the return.
  const rangeEnd =
    roundTrip && field === "return" && form.departDate && hover && hover > form.departDate ? hover : form.returnDate;
  const rangeStart = roundTrip ? form.departDate : "";

  const move = (days: number) => {
    let next = addDays(focus, days);
    if (today && next < today) next = today;
    moved.current = true;
    setFocus(next);
    const m = monthOf(next);
    if (m.year !== view.year || m.month !== view.month) setView(m);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in steps) {
      event.preventDefault();
      move(steps[event.key]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-40 bg-brandInk/30 sm:bg-transparent" onClick={onClose} />
      <div
        aria-label={field === "depart" ? "Choose departure date" : "Choose return date"}
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[20px] border border-outline/70 bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-brandCard sm:absolute sm:pb-5 sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] sm:rounded-[16px]"
        onKeyDown={onKeyDown}
        role="dialog"
      >
        {roundTrip ? (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-brandBlue/[0.06] p-1" role="group" aria-label="Date to choose">
            <FieldTab active={field === "depart"} onClick={() => onField("depart")}>
              Depart
            </FieldTab>
            <FieldTab active={field === "return"} onClick={() => onField("return")}>
              Return
            </FieldTab>
          </div>
        ) : null}

        <div className="mb-3 flex items-center justify-between">
          <button
            aria-label="Previous month"
            className="grid h-9 w-9 place-items-center rounded-full text-brandInk transition hover:bg-brandBlue/[0.08] disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={atMin}
            onClick={() => {
              moved.current = false;
              setView(addMonths(view, -1));
            }}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <p aria-live="polite" className="text-title-sm text-brandInk">
            {titleFmt.format(utc(`${view.year}-${String(view.month + 1).padStart(2, "0")}-01`))}
          </p>
          <button
            aria-label="Next month"
            className="grid h-9 w-9 place-items-center rounded-full text-brandInk transition hover:bg-brandBlue/[0.08]"
            onClick={() => {
              moved.current = false;
              setView(addMonths(view, 1));
            }}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-body-sm text-onSurfaceVariant" aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <span className="py-1" key={day}>
              {day}
            </span>
          ))}
        </div>

        <div className="mt-1 grid gap-y-1" onMouseLeave={() => setHover("")} ref={gridRef} role="group">
          {weeks.map((week, row) => (
            <div className="grid grid-cols-7" key={row}>
              {week.map((date, col) => {
                if (!date) return <span key={col} />;
                const disabled = Boolean(today) && date < today;
                const isStart = date === rangeStart || (!roundTrip && date === form.departDate);
                const isEnd = Boolean(rangeEnd) && date === rangeEnd;
                const inRange = Boolean(rangeStart && rangeEnd) && date > rangeStart && date < rangeEnd;
                const edge = isStart || isEnd;
                const band =
                  rangeStart && rangeEnd && rangeStart !== rangeEnd && (inRange || edge)
                    ? `bg-brandBlue/[0.08] ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""}`
                    : "";
                return (
                  <span className={`flex justify-center ${band}`} key={date}>
                    <button
                      aria-label={fullFmt.format(utc(date))}
                      aria-pressed={edge}
                      className={`h-10 w-10 rounded-full text-body-md tabular-nums outline-none transition focus-visible:ring-4 focus-visible:ring-brandBlue/25 disabled:cursor-not-allowed disabled:text-onSurfaceVariant/35 ${
                        edge
                          ? "bg-brandBlue font-semibold text-white"
                          : `text-brandInk enabled:hover:bg-brandBlue/[0.1] ${date === today ? "font-semibold underline decoration-brandBlue/50 underline-offset-4" : ""}`
                      }`}
                      data-date={date}
                      disabled={disabled}
                      onClick={() => onPick(date)}
                      onFocus={() => setFocus(date)}
                      onMouseEnter={() => setHover(date)}
                      tabIndex={date === tabbable ? 0 : -1}
                      type="button"
                    >
                      {Number(date.slice(8))}
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function FieldTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      aria-pressed={active}
      className={`h-9 rounded-full text-body-md font-semibold transition ${
        active ? "bg-surface text-brandInk shadow-sm" : "text-onSurfaceVariant hover:text-brandInk"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
