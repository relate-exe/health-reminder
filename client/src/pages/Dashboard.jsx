import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { todayKey } from '../dateUtils.js';
import ReminderForm from '../components/ReminderForm.jsx';
import ReminderItem from '../components/ReminderItem.jsx';
import CalendarView from '../components/CalendarView.jsx';

const TABS = [['upcoming', 'Upcoming'], ['calendar', 'Calendar'], ['done', 'Done']];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [editing, setEditing] = useState(null); // null | {} (new) | reminder
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const today = todayKey();

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setError('');
    try {
      const d = await api.listReminders();
      setReminders(d.reminders);
    } catch (e) {
      if (e.status === 401) return logout();
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => { load(); }, [load]);

  async function save(data) {
    if (editing?._id) {
      await api.updateReminder(editing._id, data);
      flash('Reminder updated');
    } else {
      await api.createReminder(data);
      flash('Reminder added');
    }
    setEditing(null);
    load();
  }

  const actions = {
    onEdit: (r) => setEditing(r),
    onToggle: async (r) => {
      try {
        const d = await api.toggleReminder(r._id);
        flash(d.next ? `Done. Next one added for ${d.next.date}` : r.completed ? 'Marked as not done' : 'Marked as done');
        load();
      } catch (e) { setError(e.message); }
    },
    onDelete: async (r) => {
      if (!window.confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
      try {
        await api.deleteReminder(r._id);
        flash('Reminder deleted');
        load();
      } catch (e) { setError(e.message); }
    },
  };

  const { overdue, upcoming, done } = useMemo(() => ({
    overdue: reminders.filter((r) => !r.completed && r.date < today),
    upcoming: reminders.filter((r) => !r.completed && r.date >= today),
    done: reminders.filter((r) => r.completed).reverse(),
  }), [reminders, today]);

  const renderList = (items, empty) =>
    items.length ? (
      <ul className="reminder-list">{items.map((r) => <ReminderItem key={r._id} reminder={r} today={today} {...actions} />)}</ul>
    ) : (
      <p className="muted empty-note">{empty}</p>
    );

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>HealthRecord Reminder</h1>
          <p className="muted small">Signed in as {user.name}</p>
        </div>
        <button className="btn" onClick={logout}>Log out</button>
      </header>

      <main>
        <div className="toolbar">
          <nav className="tabs" aria-label="Views">
            {TABS.map(([k, l]) => (
              <button key={k} className={tab === k ? 'active' : ''} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>
            ))}
          </nav>
          <button className="btn primary" onClick={() => setEditing({})}>Add reminder</button>
        </div>

        {error && <div className="alert" role="alert">{error} <button className="link" onClick={load}>Retry</button></div>}

        {editing && (
          <ReminderForm initial={editing._id ? editing : null} onSave={save} onCancel={() => setEditing(null)} />
        )}

        {loading ? (
          <p className="center-note" role="status">Loading your reminders…</p>
        ) : tab === 'upcoming' ? (
          <>
            {overdue.length > 0 && (
              <section>
                <h2 className="section-title">Past due</h2>
                {renderList(overdue)}
              </section>
            )}
            <section>
              <h2 className="section-title">Coming up</h2>
              {renderList(upcoming, 'Nothing scheduled. Add the date of your next appointment to see it here.')}
            </section>
          </>
        ) : tab === 'calendar' ? (
          <CalendarView reminders={reminders} actions={actions} />
        ) : (
          <section>
            <h2 className="section-title">Done</h2>
            {renderList(done, 'Reminders you mark as done will appear here.')}
          </section>
        )}
      </main>

      <footer className="disclaimer">
        Reminders show only the dates and notes you enter. This app does not interpret your records or give medical advice. Your reminders are visible only to your account.
      </footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
