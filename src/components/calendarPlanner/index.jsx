import { useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiPlus, FiTrash2 } from "react-icons/fi";
import styles from "./styles.module.css";
const key = "calendar-planner-events";
const dateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const today = new Date();
const seedDate = new Date(today.getFullYear(), today.getMonth(), Math.min(8, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()));
const seed = [{ id: "e1", date: dateKey(seedDate), time: "09:30", title: "Weekly planning", color: "blue" }, { id: "e2", date: dateKey(new Date(today.getFullYear(), today.getMonth(), Math.min(12, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()))), time: "13:00", title: "Project review", color: "coral" }];
const loadEvents = () => { try { const data = JSON.parse(localStorage.getItem(key)); return Array.isArray(data) ? data : seed; } catch { return seed; } };
const CalendarPlanner = () => {
    const [events, setEvents] = useState(loadEvents);
    const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selected, setSelected] = useState(dateKey(today));
    const [title, setTitle] = useState("");
    const [time, setTime] = useState("09:00");
    const [removing, setRemoving] = useState(null);
    const cancelRef = useRef(null);
    useEffect(() => localStorage.setItem(key, JSON.stringify(events)), [events]);
    useEffect(() => {
        if (!removing) return undefined;
        cancelRef.current?.focus();
        const onKey = (event) => { if (event.key === "Escape") setRemoving(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [removing]);
    const calendarDays = useMemo(() => {
        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const start = new Date(first);
        start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
        return Array.from({ length: 42 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); return day; });
    }, [month]);
    const monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(month);
    const selectedEvents = events.filter((event) => event.date === selected).sort((a, b) => a.time.localeCompare(b.time));
    const addEvent = (event) => { event.preventDefault(); if (!title.trim()) return; setEvents((items) => [...items, { id: crypto.randomUUID(), date: selected, title: title.trim(), time, color: "blue" }]); setTitle(""); };
    const shiftMonth = (amount) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));

    return <section className={styles.calendarPage} id="month">
        <div className={styles.heading}><div><p className={styles.label}>Make room for what matters</p><h1>A month, in view.</h1><p>Plan ahead and keep each day easy to read.</p></div><div className={styles.monthPicker}><button onClick={() => shiftMonth(-1)} aria-label="Previous month"><FiChevronLeft /></button><strong>{monthName}</strong><button onClick={() => shiftMonth(1)} aria-label="Next month"><FiChevronRight /></button></div></div>
        <div className={styles.content}>
            <section className={styles.monthCard} aria-label={monthName + " calendar"}>
                <div className={styles.weekdays}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
                <div className={styles.days}>{calendarDays.map((day) => { const keyForDay = dateKey(day); const dayEvents = events.filter((event) => event.date === keyForDay); return <button key={keyForDay} className={[styles.day, day.getMonth() !== month.getMonth() ? styles.outside : "", keyForDay === selected ? styles.chosen : "", keyForDay === dateKey(today) ? styles.today : ""].join(" ")} onClick={() => { setSelected(keyForDay); if (day.getMonth() !== month.getMonth()) setMonth(new Date(day.getFullYear(), day.getMonth(), 1)); }}><span>{day.getDate()}</span>{dayEvents.slice(0, 2).map((event) => <small className={event.color === "coral" ? styles.coralEvent : ""} key={event.id}>{event.title}</small>)}{dayEvents.length > 2 && <small className={styles.more}>+{dayEvents.length - 2} more</small>}</button>; })}</div>
            </section>
            <aside className={styles.dayPanel} id="plans">
                <div className={styles.panelHeading}><span><FiCalendar /></span><div><p>Selected day</p><h2>{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date(selected + "T12:00:00"))}</h2></div></div>
                <div className={styles.agendaHeading}><strong>Agenda</strong><small>{selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}</small></div>
                {selectedEvents.length ? <div className={styles.agenda}>{selectedEvents.map((event) => <article className={styles.event} key={event.id}><time>{event.time}</time><div><strong>{event.title}</strong><small>{event.color === "coral" ? "Personal" : "On your calendar"}</small></div><button onClick={() => setRemoving(event)} aria-label={"Remove " + event.title}><FiTrash2 /></button></article>)}</div> : <p className={styles.empty}>Nothing planned for this day.</p>}
                <form className={styles.addForm} onSubmit={addEvent}><label>New event<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name this event" required /></label><div><label>Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><button type="submit" aria-label="Add event"><FiPlus /> Add</button></div></form>
                <p className={styles.localNote}>Your calendar stays in this browser.</p>
            </aside>
        </div>
        {removing && <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setRemoving(null); }}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-copy"><FiTrash2 /><h2 id="delete-title">Remove this event?</h2><p id="delete-copy"><strong>{removing.title}</strong> will be removed from your calendar.</p><div><button ref={cancelRef} onClick={() => setRemoving(null)}>Keep event</button><button onClick={() => { setEvents((items) => items.filter((item) => item.id !== removing.id)); setRemoving(null); }}>Remove event</button></div></section></div>}
    </section>;
};
export default CalendarPlanner;
