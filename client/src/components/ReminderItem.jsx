import { formatDate, formatTime, relativeLabel } from '../dateUtils.js';

const LABELS = { checkup: 'Check-up', 'follow-up': 'Follow-up visit', dental: 'Dental', eye: 'Eye', vaccination: 'Vaccination', lab: 'Lab appointment', other: 'Other' };

export default function ReminderItem({ reminder: r, today, onToggle, onEdit, onDelete }) {
  const overdue = !r.completed && r.date < today;
  return (
    <li className={`reminder ${r.completed ? 'done' : ''} ${overdue ? 'overdue' : ''}`}>
      <input
        type="checkbox"
        checked={r.completed}
        onChange={() => onToggle(r)}
        aria-label={`Mark "${r.title}" as ${r.completed ? 'not done' : 'done'}`}
      />
      <div className="reminder-body">
        <p className="reminder-title">{r.title}</p>
        <p className="reminder-meta">
          {formatDate(r.date)}{r.time && `, ${formatTime(r.time)}`} · {LABELS[r.category]}
          {r.repeat !== 'none' && ` · repeats ${r.repeat.replace(/-/g, ' ')}`}
        </p>
        {r.notes && <p className="reminder-notes">{r.notes}</p>}
      </div>
      <div className="reminder-side">
        <span className="when">{r.completed ? 'Done' : overdue ? `Past due: ${relativeLabel(r.date, today)}` : relativeLabel(r.date, today)}</span>
        <span className="item-actions">
          <button className="link" onClick={() => onEdit(r)}>Edit</button>
          <button className="link danger" onClick={() => onDelete(r)}>Delete</button>
        </span>
      </div>
    </li>
  );
}
