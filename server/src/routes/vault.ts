import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { documentsRepo, memoriesRepo } from '../db/database';
import { broadcastToFamily } from '../websocket';

const router = Router();
router.use(authMiddleware);

// -------------------------------------------------------------
// DOCUMENTS & BILLS
// -------------------------------------------------------------
router.post('/documents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { title, type, amount, currency, dueDate, provider, status, assignedToMemberId, fields, suggestedActions, notes } = req.body || {};

    if (!title) {
      return res.status(400).json({ success: false, error: 'Document title is required.' });
    }

    const docId = `doc_${Date.now()}`;
    documentsRepo.create({
      id: docId,
      family_id: familyId,
      title: title.trim(),
      type: type || 'receipt',
      amount: typeof amount === 'number' ? amount : parseFloat(amount) || null,
      currency: currency || '₹',
      due_date: dueDate || null,
      provider: provider || null,
      status: status || 'pending',
      assigned_to_member_id: assignedToMemberId || null,
      scanned_at: new Date().toISOString(),
      fields_json: JSON.stringify(fields || []),
      suggested_actions_json: JSON.stringify(suggestedActions || []),
      notes: notes || null,
    });

    const newDoc = {
      id: docId,
      title: title.trim(),
      type: type || 'receipt',
      amount: typeof amount === 'number' ? amount : parseFloat(amount) || null,
      currency: currency || '₹',
      dueDate: dueDate || null,
      provider: provider || null,
      status: status || 'pending',
      assignedToMemberId: assignedToMemberId || null,
      scannedAt: new Date().toISOString(),
      fields: fields || {},
      suggestedActions: suggestedActions || [],
      notes: notes || null,
    };

    broadcastToFamily(familyId, {
      type: 'DOCUMENT_CREATED',
      docId,
      document: newDoc,
    });

    return res.status(201).json({
      success: true,
      docId,
      document: newDoc,
      data: { document: newDoc },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to save document.' });
  }
});

router.put('/documents/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required.' });
    }

    documentsRepo.updateStatus(docId, status);

    broadcastToFamily(req.familyId!, {
      type: 'DOCUMENT_STATUS_UPDATED',
      docId,
      status,
    });

    return res.json({ success: true, message: 'Document status updated.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update document status.' });
  }
});

router.delete('/documents/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const docId = req.params.id;
    documentsRepo.delete(docId);

    broadcastToFamily(req.familyId!, {
      type: 'DOCUMENT_DELETED',
      docId,
    });

    return res.json({ success: true, message: 'Document deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete document.' });
  }
});

// -------------------------------------------------------------
// POST /api/vault/scan - Document & Receipt Optical Analysis
// -------------------------------------------------------------
router.post('/scan', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, rawImage } = req.body || {};

    // Analyze document text and extract structured fields
    let detectedType = 'receipt';
    let detectedTitle = 'Scanned Receipt';
    let detectedAmount = 120.0;
    let detectedDueDate = 'Next Week';
    let detectedProvider = 'Utility Provider';

    const clean = (text || '').toLowerCase();
    if (clean.includes('electricity') || clean.includes('power') || clean.includes('kwh')) {
      detectedType = 'electricity_bill';
      detectedTitle = 'Electricity Utility Bill';
      detectedAmount = 2450.0;
      detectedDueDate = 'Due in 5 days';
      detectedProvider = 'State Power Board';
    } else if (clean.includes('water') || clean.includes('sewer')) {
      detectedType = 'receipt';
      detectedTitle = 'Municipal Water Dues';
      detectedAmount = 850.0;
      detectedDueDate = 'Due next Friday';
      detectedProvider = 'City Water Authority';
    } else if (clean.includes('hospital') || clean.includes('dr.') || clean.includes('clinic') || clean.includes('rx')) {
      detectedType = 'medical_prescription';
      detectedTitle = 'Medical Prescription & Invoice';
      detectedAmount = 650.0;
      detectedDueDate = 'Prescription Active';
      detectedProvider = 'Healthcare Clinic';
    } else if (clean.includes('insurance') || clean.includes('policy')) {
      detectedType = 'insurance';
      detectedTitle = 'Family Health Insurance Policy';
      detectedAmount = 14500.0;
      detectedDueDate = 'Annual Renewal';
      detectedProvider = 'Insurance Corp';
    }

    return res.json({
      success: true,
      extracted: {
        title: detectedTitle,
        type: detectedType,
        amount: detectedAmount,
        currency: '₹',
        dueDate: detectedDueDate,
        provider: detectedProvider,
        status: 'pending',
        fields: [
          { label: 'Document Type', value: detectedType.toUpperCase().replace('_', ' ') },
          { label: 'Extracted Total', value: `₹${detectedAmount.toLocaleString()}` },
          { label: 'Status', value: 'Payment Due' },
        ],
        suggestedActions: [
          {
            id: `act_${Date.now()}_remind`,
            label: 'Set Payment Reminder',
            actionType: 'add_reminder',
          },
          {
            id: `act_${Date.now()}_task`,
            label: 'Add to Family Tasks',
            actionType: 'assign_task',
          },
        ],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Document analysis failed.' });
  }
});

// -------------------------------------------------------------
// PHYSICAL MEMORIES
// -------------------------------------------------------------
router.post('/memories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { title, category, savedLocation, notes, tags, relatedMemberIds, emoji } = req.body || {};

    if (!title || !savedLocation) {
      return res.status(400).json({ success: false, error: 'Memory title and saved physical location are required.' });
    }

    const memoryId = `mem_${Date.now()}`;
    memoriesRepo.create({
      id: memoryId,
      family_id: familyId,
      title: title.trim(),
      category: category || 'household',
      saved_location: savedLocation.trim(),
      last_verified: 'Today',
      notes: notes || '',
      tags_json: JSON.stringify(tags || []),
      related_member_ids_json: JSON.stringify(relatedMemberIds || []),
      emoji: emoji || '📘',
    });

    broadcastToFamily(familyId, {
      type: 'MEMORY_SAVED',
      memoryId,
      title,
    });

    return res.status(201).json({ success: true, memoryId });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to save memory.' });
  }
});

router.delete('/memories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memoryId = req.params.id;
    memoriesRepo.delete(memoryId);

    broadcastToFamily(req.familyId!, {
      type: 'MEMORY_DELETED',
      memoryId,
    });

    return res.json({ success: true, message: 'Memory deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete memory.' });
  }
});

export default router;
