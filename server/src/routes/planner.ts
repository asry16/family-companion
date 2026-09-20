import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { tasksRepo, eventsRepo, remindersRepo } from '../db/database';
import { broadcastToFamily } from '../websocket';

const router = Router();
router.use(authMiddleware);

// -------------------------------------------------------------
// TASKS
// -------------------------------------------------------------
router.post('/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { id, title, category, assignedToMemberId, dueDate, dueTime, priority, note } = req.body || {};

    if (!title) {
      return res.status(400).json({ success: false, error: 'Task title is required.' });
    }

    const taskId = id || `task_${Date.now()}`;
    tasksRepo.create({
      id: taskId,
      family_id: familyId,
      title: title.trim(),
      category: category || 'general',
      assigned_to_member_id: assignedToMemberId || null,
      created_by_member_id: req.user!.memberId || req.user!.id,
      due_date: dueDate || 'Today',
      due_time: dueTime || '10:00 AM',
      priority: priority || 'important',
      is_completed: 0,
      note: note || null,
    });

    const newTask = {
      id: taskId,
      title: title.trim(),
      category: category || 'general',
      assignedToMemberId: assignedToMemberId || null,
      createdByMemberId: req.user!.memberId || req.user!.id,
      dueDate: dueDate || 'Today',
      dueTime: dueTime || '10:00 AM',
      priority: priority || 'important',
      isCompleted: false,
      note: note || null,
    };

    broadcastToFamily(familyId, {
      type: 'TASK_CREATED',
      taskId,
      task: newTask,
    });

    return res.status(201).json({
      success: true,
      taskId,
      task: newTask,
      data: { task: newTask },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create task.' });
  }
});

router.put('/tasks/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    const updates = req.body || {};

    tasksRepo.update(taskId, updates);

    broadcastToFamily(req.familyId!, {
      type: 'TASK_UPDATED',
      taskId,
      updates,
    });

    return res.json({ success: true, message: 'Task updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update task.' });
  }
});

router.delete('/tasks/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const taskId = req.params.id;
    tasksRepo.delete(taskId);

    broadcastToFamily(req.familyId!, {
      type: 'TASK_DELETED',
      taskId,
    });

    return res.json({ success: true, message: 'Task deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete task.' });
  }
});

// -------------------------------------------------------------
// EVENTS
// -------------------------------------------------------------
router.post('/events', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { id, title, date, time, durationMinutes, location, category, notes, attendeeMemberIds } = req.body || {};

    if (!title || !date || !time) {
      return res.status(400).json({ success: false, error: 'Title, date, and time are required.' });
    }

    const eventId = id || `event_${Date.now()}`;
    eventsRepo.create({
      id: eventId,
      family_id: familyId,
      title: title.trim(),
      date,
      time,
      duration_minutes: durationMinutes || 60,
      location: location || 'Home',
      category: category || 'family',
      notes: notes || null,
      attendee_ids_json: JSON.stringify(attendeeMemberIds || []),
    });

    broadcastToFamily(familyId, {
      type: 'EVENT_CREATED',
      eventId,
      title,
    });

    return res.status(201).json({ success: true, eventId });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create event.' });
  }
});

router.delete('/events/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    eventsRepo.delete(eventId);

    broadcastToFamily(req.familyId!, {
      type: 'EVENT_DELETED',
      eventId,
    });

    return res.json({ success: true, message: 'Event deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete event.' });
  }
});

// -------------------------------------------------------------
// REMINDERS
// -------------------------------------------------------------
router.post('/reminders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { id, title, targetMemberId, time, dueDate, category, urgency, repeat } = req.body || {};

    if (!title || !time) {
      return res.status(400).json({ success: false, error: 'Title and time are required.' });
    }

    const reminderId = id || `rem_${Date.now()}`;
    remindersRepo.create({
      id: reminderId,
      family_id: familyId,
      title: title.trim(),
      target_member_id: targetMemberId || null,
      time,
      due_date: dueDate || 'Today',
      category: category || 'general',
      urgency: urgency || 'important',
      is_done: 0,
      repeat: repeat || 'none',
    });

    broadcastToFamily(familyId, {
      type: 'REMINDER_CREATED',
      reminderId,
      title,
    });

    return res.status(201).json({ success: true, reminderId });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create reminder.' });
  }
});

router.put('/reminders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reminderId = req.params.id;
    const updates = req.body || {};

    remindersRepo.update(reminderId, updates);

    broadcastToFamily(req.familyId!, {
      type: 'REMINDER_UPDATED',
      reminderId,
      updates,
    });

    return res.json({ success: true, message: 'Reminder updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update reminder.' });
  }
});

router.delete('/reminders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reminderId = req.params.id;
    remindersRepo.delete(reminderId);

    broadcastToFamily(req.familyId!, {
      type: 'REMINDER_DELETED',
      reminderId,
    });

    return res.json({ success: true, message: 'Reminder deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete reminder.' });
  }
});

export default router;
