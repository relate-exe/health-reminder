const express = require('express');
const { body, param, query } = require('express-validator');
const Reminder = require('../models/Reminder');
const { CATEGORIES, REPEATS } = Reminder;
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { isRealDate, nextOccurrence } = require('../utils/dates');

const router = express.Router();
router.use(auth); // every reminder route is private to the logged-in user

const dateRule = (chain) => chain.custom(isRealDate).withMessage('Date must be a real date (YYYY-MM-DD)');

const reminderRules = [
  body('title').trim().isLength({ min: 2, max: 100 }).withMessage('Title must be 2-100 characters'),
  dateRule(body('date')),
  body('time').optional({ values: 'falsy' }).matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be HH:MM'),
  body('category').optional().isIn(CATEGORIES).withMessage('Unknown category'),
  body('notes').optional().isString().withMessage('Notes must be text').trim().isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
  body('repeat').optional().isIn(REPEATS).withMessage('Unknown repeat option'),
];

const idRule = param('id').isMongoId().withMessage('Invalid reminder id');

// Whitelist fields so clients can never set user, completed, etc. directly
const pick = (b) => {
  const out = { title: b.title, date: b.date, time: b.time || '', category: b.category, notes: b.notes, repeat: b.repeat };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
};

// GET /api/reminders?status=pending|completed|all&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get(
  '/',
  validate([
    query('status').optional().isIn(['pending', 'completed', 'all']).withMessage('Invalid status filter'),
    dateRule(query('from').optional()),
    dateRule(query('to').optional()),
  ]),
  asyncHandler(async (req, res) => {
    const { status = 'all', from, to } = req.query;
    const filter = { user: req.user._id };
    if (status === 'pending') filter.completed = false;
    if (status === 'completed') filter.completed = true;
    if (from || to) filter.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
    const reminders = await Reminder.find(filter).sort({ date: 1, time: 1 });
    res.json({ success: true, count: reminders.length, reminders });
  })
);

router.post(
  '/',
  validate(reminderRules),
  asyncHandler(async (req, res) => {
    const reminder = await Reminder.create({ ...pick(req.body), user: req.user._id });
    res.status(201).json({ success: true, reminder });
  })
);

router.put(
  '/:id',
  validate([idRule, ...reminderRules]),
  asyncHandler(async (req, res) => {
    const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, pick(req.body), {
      new: true,
      runValidators: true,
    });
    if (!reminder) throw new AppError('Reminder not found', 404);
    res.json({ success: true, reminder });
  })
);

// Toggle completion. Completing a repeating reminder schedules the next date.
router.patch(
  '/:id/complete',
  validate([idRule, body('completed').optional().isBoolean().withMessage('completed must be true or false')]),
  asyncHandler(async (req, res) => {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) throw new AppError('Reminder not found', 404);

    const wasCompleted = reminder.completed;
    const completed = req.body.completed === undefined ? !wasCompleted : req.body.completed === true || req.body.completed === 'true';
    reminder.completed = completed;
    reminder.completedAt = completed ? new Date() : null;
    await reminder.save();

    let next = null;
    if (completed && !wasCompleted && reminder.repeat !== 'none') {
      const nextDate = nextOccurrence(reminder.date, reminder.repeat);
      const exists = await Reminder.exists({ user: req.user._id, title: reminder.title, date: nextDate });
      if (nextDate && !exists) {
        next = await Reminder.create({
          user: req.user._id,
          title: reminder.title,
          date: nextDate,
          time: reminder.time,
          category: reminder.category,
          notes: reminder.notes,
          repeat: reminder.repeat,
        });
      }
    }
    res.json({ success: true, reminder, next });
  })
);

router.delete(
  '/:id',
  validate([idRule]),
  asyncHandler(async (req, res) => {
    const deleted = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) throw new AppError('Reminder not found', 404);
    res.json({ success: true, message: 'Reminder deleted' });
  })
);

module.exports = router;
