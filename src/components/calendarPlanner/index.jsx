import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiPlus, FiTrash2 } from "react-icons/fi";
import styles from "./styles.module.css";

const storageKey = "calendar-planner-events";
const dateLabelFormatter = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
});

const dateKey = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
].join("-");

const isValidDateKey = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    return !Number.isNaN(date.getTime()) && dateKey(date) === value;
};

const createDemoEvents = (referenceDate = new Date()) => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    return [
        { id: "demo-weekly-planning", date: dateKey(new Date(year, month, Math.min(8, lastDay))), time: "09:30", title: "Weekly planning", color: "blue" },
        { id: "demo-project-review", date: dateKey(new Date(year, month, Math.min(12, lastDay))), time: "13:00", title: "Project review", color: "coral" },
    ];
};

const loadEvents = () => {
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored === null) return createDemoEvents();

        const data = JSON.parse(stored);
        if (!Array.isArray(data)) return createDemoEvents();

        return data
            .filter((event) => (
                event &&
                typeof event.id === "string" &&
                typeof event.title === "string" &&
                event.title.trim() &&
                isValidDateKey(event.date) &&
                typeof event.time === "string" &&
                /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(event.time)
            ))
            .map((event) => ({
                id: event.id,
                date: event.date,
                time: event.time,
                title: event.title.trim(),
                color: event.color === "coral" ? "coral" : "blue",
            }));
    } catch {
        return createDemoEvents();
    }
};

const CalendarPlanner = () => {
    const [events, setEvents] = useState(loadEvents);
    const [storageAvailable, setStorageAvailable] = useState(() => {
        try {
            localStorage.getItem(storageKey);
            return true;
        } catch {
            return false;
        }
    });
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selected, setSelected] = useState(() => dateKey(new Date()));
    const [title, setTitle] = useState("");
    const [time, setTime] = useState("09:00");
    const [removing, setRemoving] = useState(null);
    const cancelRef = useRef(null);
    const removeTriggerRef = useRef(null);
    const agendaHeadingRef = useRef(null);

    const saveEvents = (nextEvents) => {
        setEvents(nextEvents);
        try {
            localStorage.setItem(storageKey, JSON.stringify(nextEvents));
            setStorageAvailable(true);
        } catch {
            setStorageAvailable(false);
        }
    };

    const closeDialog = useCallback(() => {
        setRemoving(null);
        window.requestAnimationFrame(() => {
            if (removeTriggerRef.current?.isConnected) {
                removeTriggerRef.current.focus();
            } else {
                agendaHeadingRef.current?.focus();
            }
        });
    }, []);

    useEffect(() => {
        if (!removing) return undefined;
        cancelRef.current?.focus();
        const onKeyDown = (event) => {
            if (event.key === "Escape") closeDialog();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [closeDialog, removing]);

    const calendarDays = useMemo(() => {
        const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
        const gridStart = new Date(firstDay);
        gridStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

        return Array.from({ length: 42 }, (_, index) => {
            const day = new Date(gridStart);
            day.setDate(gridStart.getDate() + index);
            return day;
        });
    }, [month]);

    const eventsByDate = useMemo(() => events.reduce((groups, event) => {
        groups[event.date] = groups[event.date] || [];
        groups[event.date].push(event);
        return groups;
    }, {}), [events]);

    const monthName = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(month);
    const selectedEvents = [...(eventsByDate[selected] || [])].sort((a, b) => a.time.localeCompare(b.time));

    const shiftMonth = (amount) => {
        const nextMonth = new Date(month.getFullYear(), month.getMonth() + amount, 1);
        const currentSelected = new Date(`${selected}T12:00:00`);
        const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        const nextSelected = new Date(
            nextMonth.getFullYear(),
            nextMonth.getMonth(),
            Math.min(currentSelected.getDate(), lastDay),
        );

        setMonth(nextMonth);
        setSelected(dateKey(nextSelected));
    };

    const addEvent = (event) => {
        event.preventDefault();
        const cleanTitle = title.trim();
        if (!cleanTitle) return;

        saveEvents([...events, {
            id: crypto.randomUUID(),
            date: selected,
            title: cleanTitle,
            time,
            color: "blue",
        }]);
        setTitle("");
    };

    const openRemoveDialog = (event, trigger) => {
        removeTriggerRef.current = trigger;
        setRemoving(event);
    };

    const confirmRemove = () => {
        saveEvents(events.filter((item) => item.id !== removing.id));
        closeDialog();
    };

    return (
        <section className={styles.calendarPage} id="month">
            <div className={styles.heading}>
                <div>
                    <p className={styles.label}>Make room for what matters</p>
                    <h1>A month, in view.</h1>
                    <p>Plan ahead and keep each day easy to read.</p>
                </div>
                <div className={styles.monthPicker} aria-label="Change calendar month">
                    <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                        <FiChevronLeft aria-hidden="true" />
                    </button>
                    <strong aria-live="polite">{monthName}</strong>
                    <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
                        <FiChevronRight aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                <section className={styles.monthCard} aria-label={`${monthName} calendar`}>
                    <div className={styles.weekdays} aria-hidden="true">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
                    </div>
                    <div className={styles.days}>
                        {calendarDays.map((day) => {
                            const keyForDay = dateKey(day);
                            const dayEvents = eventsByDate[keyForDay] || [];
                            const isToday = keyForDay === dateKey(new Date());
                            const dateLabel = dateLabelFormatter.format(day);
                            const eventSummary = dayEvents.length
                                ? `, ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}: ${dayEvents.map((item) => item.title).join(", ")}`
                                : "";

                            return (
                                <button
                                    key={keyForDay}
                                    type="button"
                                    className={[
                                        styles.day,
                                        day.getMonth() !== month.getMonth() ? styles.outside : "",
                                        keyForDay === selected ? styles.chosen : "",
                                        isToday ? styles.today : "",
                                    ].join(" ")}
                                    aria-label={`${dateLabel}${eventSummary}`}
                                    aria-pressed={keyForDay === selected}
                                    aria-current={isToday ? "date" : undefined}
                                    onClick={() => {
                                        setSelected(keyForDay);
                                        if (day.getMonth() !== month.getMonth()) {
                                            setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                                        }
                                    }}
                                >
                                    <span>{day.getDate()}</span>
                                    {dayEvents.slice(0, 2).map((event) => (
                                        <small className={event.color === "coral" ? styles.coralEvent : ""} key={event.id}>
                                            {event.title}
                                        </small>
                                    ))}
                                    {dayEvents.length > 2 && <small className={styles.more}>+{dayEvents.length - 2} more</small>}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <aside className={styles.dayPanel} id="plans">
                    <div className={styles.panelHeading}>
                        <span><FiCalendar aria-hidden="true" /></span>
                        <div>
                            <p>Selected day</p>
                            <h2>{dateLabelFormatter.format(new Date(`${selected}T12:00:00`))}</h2>
                        </div>
                    </div>
                    <div className={styles.agendaHeading}>
                        <strong ref={agendaHeadingRef} tabIndex={-1}>Agenda</strong>
                        <small>{selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}</small>
                    </div>
                    {selectedEvents.length ? (
                        <div className={styles.agenda}>
                            {selectedEvents.map((event) => (
                                <article className={styles.event} key={event.id}>
                                    <time dateTime={event.time}>{event.time}</time>
                                    <div>
                                        <strong>{event.title}</strong>
                                        <small>{event.color === "coral" ? "Personal" : "On your calendar"}</small>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(clickEvent) => openRemoveDialog(event, clickEvent.currentTarget)}
                                        aria-label={`Remove ${event.title}`}
                                    >
                                        <FiTrash2 aria-hidden="true" />
                                    </button>
                                </article>
                            ))}
                        </div>
                    ) : <p className={styles.empty}>Nothing planned for this day.</p>}

                    <form className={styles.addForm} onSubmit={addEvent}>
                        <label>
                            New event
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Name this event"
                                required
                            />
                        </label>
                        <div>
                            <label>
                                Time
                                <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
                            </label>
                            <button type="submit" aria-label="Add event">
                                <FiPlus aria-hidden="true" /> Add
                            </button>
                        </div>
                    </form>
                    <p className={styles.localNote} role="status">
                        {storageAvailable
                            ? "Your calendar stays in this browser."
                            : "Browser storage is unavailable; events will not persist after you leave."}
                    </p>
                </aside>
            </div>

            {removing && (
                <div
                    className={styles.backdrop}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeDialog();
                    }}
                >
                    <section
                        className={styles.dialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-title"
                        aria-describedby="delete-copy"
                    >
                        <FiTrash2 aria-hidden="true" />
                        <h2 id="delete-title">Remove this event?</h2>
                        <p id="delete-copy"><strong>{removing.title}</strong> will be removed from your calendar.</p>
                        <div>
                            <button type="button" ref={cancelRef} onClick={closeDialog}>Keep event</button>
                            <button type="button" onClick={confirmRemove}>Remove event</button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
};

export default CalendarPlanner;
