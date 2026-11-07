import { useEffect, useRef, useState } from 'react';
import { todayKey } from '../dateUtils.js';

const CATEGORIES = [
  ['checkup', 'Check-up'],
  ['follow-up', 'Follow-up visit'],
  ['dental', 'Dental'],
  ['eye', 'Eye'],
  ['vaccination', 'Vaccination'],
  ['lab', 'Lab appointment'],
  ['other', 'Other'],
];
const REPEATS = [
  ['none', 'Does not repeat'],
  ['monthly', 'Every month'],
  ['every-3-months', 'Every 3 months'],
  ['every-6-months', 'Every 6 months'],
  ['yearly', 'Every year'],
];

const empty = () => ({ title: '', date: todayKey(), time: '', category: 'checkup', repeat: 'none', notes: '' });

export default function ReminderForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...empty(), ...initial } : empty());
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => titleRef.current?.focus(), []);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e = {};
    if (form.title.trim().length < 2) e.title = 'Give the reminder a title (at least 2 characters).';
    if (form.title.length > 100) e.title = 'Keep the title under 100 characters.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) e.date = 'Choose a date.';
    if (form.notes.length > 500) e.notes = 'Notes can be up to 500 characters.';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    setFormError('');
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await onSave({ ...form, title: form.title.trim(), notes: form.notes.trim() });
    } catch (err) {
      const fe = {};
      (err.fields || []).forEach((f) => (fe[f.field] = f.message));
      setErrors(fe);
      setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card reminder-form" onSubmit={submit} noValidate>
      <h2>{initial?._id ? 'Edit reminder' : 'New reminder'}</h2>
      {formError && <div className="alert" role="alert">{formError}</div>}

      <label>
        What is it for?
        <input ref={titleRef} value={form.title} onChange={set('title')} placeholder="e.g. Annual check-up at City Clinic" maxLength={100} aria-invalid={!!errors.title} />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </label>

      <div className="row">
        <label>
          Date
          <input type="date" value={form.date} onChange={set('date')} aria-invalid={!!errors.date} />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </label>
        <label>
          Time (optional)
          <input type="time" value={form.time} onChange={set('time')} />
        </label>
      </div>

      <div className="row">
        <label>
          Type
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>
          Repeat
          <select value={form.repeat} onChange={set('repeat')}>
            {REPEATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      <label>
        Your notes (optional)
        <textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Anything you want to remember, such as the clinic name or documents to bring." aria-invalid={!!errors.notes} />
        <span className="muted small">{form.notes.length}/500</span>
        {errors.notes && <span className="field-error">{errors.notes}</span>}
      </label>

      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save reminder'}</button>
      </div>
    </form>
  );
}
