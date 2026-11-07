import { useState } from 'react';
import { monthGrid, todayKey } from '../dateUtils.js';
import ReminderItem from './ReminderItem.jsx';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ reminders, actions }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayKey());
  const today = todayKey();

  const byDate = reminders.reduce((acc, r) => ((acc[r.date] = acc[r.date] || []).push(r), acc), {});
  const cells = monthGrid(cursor.y, cursor.m);
  const title = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const shift = (n) => setCursor(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const dayItems = byDate[selected] || [];

  return (
    <div className="calendar-wrap">
      <div className="card calendar">
        <div className="cal-head">
          <button className="btn small" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <h2 aria-live="polite">{title}</h2>
          <button className="btn small" onClick={() => shift(1)} aria-label="Next month">›</button>
        </div>
        <div className="cal-grid" role="grid" aria-label={title}>
          {DOW.map((d) => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
          {cells.map((key, i) => {
            if (!key) return <div key={i} className="cal-cell empty" />;
            const items = byDate[key] || [];
            const pending = items.filter((r) => !r.completed).length;
            return (
              <button
                key={key}
                className={`cal-cell ${key === today ? 'today' : ''} ${key === selected ? 'selected' : ''}`}
                onClick={() => setSelected(key)}
                aria-label={`${key}, ${items.length} reminder${items.length === 1 ? '' : 's'}`}
              >
                <span>{Number(key.slice(8))}</span>
                {items.length > 0 && <i className={`dot ${pending ? '' : 'dot-done'}`} />}
              </button>
            );
          })}
        </div>
      </div>

      <section className="day-panel" aria-live="polite">
        <h3>{selected === today ? 'Today' : selected}</h3>
        {dayItems.length === 0 ? (
          <p className="muted">No reminders on this date.</p>
        ) : (
          <ul className="reminder-list">
            {dayItems.map((r) => <ReminderItem key={r._id} reminder={r} today={today} {...actions} />)}
          </ul>
        )}
      </section>
    </div>
  );
}
