const mongoose = require('mongoose');

/*
 * PRIVACY / NO-INFERENCE DESIGN
 * A reminder stores ONLY what the user typed: a title, a date, optional time,
 * optional free-text note and a user-chosen label. There is deliberately no
 * diagnosis, condition, medication or "recommended action" field, and the API
 * never derives health conclusions from the data. Dates are stored as plain
 * "YYYY-MM-DD" strings so there are no timezone shifts.
 */
const CATEGORIES = ['checkup', 'follow-up', 'dental', 'eye', 'vaccination', 'lab', 'other'];
const REPEATS = ['none', 'monthly', 'every-3-months', 'every-6-months', 'yearly'];

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    time: { type: String, default: '', match: /^(([01]\d|2[0-3]):[0-5]\d)?$/ },
    category: { type: String, enum: CATEGORIES, default: 'checkup' },
    notes: { type: String, default: '', trim: true, maxlength: 500 },
    repeat: { type: String, enum: REPEATS, default: 'none' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reminderSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.REPEATS = REPEATS;
