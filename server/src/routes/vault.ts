import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { documentsRepo, memoriesRepo } from '../db/database';
import { broadcastToFamily } from '../websocket';
import {
  s3Service,
  sagemakerService,
  cloudwatchService,
  eventbridgeService,
} from '../aws';

const router = Router();
router.use(authMiddleware);

// -------------------------------------------------------------
// DOCUMENTS & BILLS
// -------------------------------------------------------------
router.post('/documents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { title, type, amount, currency, dueDate, provider, status, assignedToMemberId, fields, suggestedActions, notes, rawImage, image } = req.body || {};

    if (!title) {
      return res.status(400).json({ success: false, error: 'Document title is required.' });
    }

    const docId = `doc_${Date.now()}`;

    // AWS S3: Upload encrypted document / receipt scan
    let s3Url: string | undefined;
    if (rawImage || image) {
      try {
        const uploadRes = await s3Service.uploadAsset({
          familyId,
          category: 'documents',
          fileKey: `${docId}.jpg`,
          base64Data: rawImage || image,
        });
        s3Url = uploadRes.url;
      } catch (err: any) {
        console.warn('S3 document upload err:', err?.message || err);
      }
    }

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
      notes: notes ? (s3Url ? `${notes}\n[S3 Vault: ${s3Url}]` : notes) : (s3Url ? `[S3 Vault: ${s3Url}]` : null),
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
      s3Url,
    };

    broadcastToFamily(familyId, {
      type: 'DOCUMENT_CREATED',
      docId,
      document: newDoc,
    });

    // AWS CloudWatch: Metric for document processing
    cloudwatchService.putMetric('DocumentScannedCount', 1, { FamilyId: familyId, Type: type || 'receipt' })
      .catch(e => console.warn('CloudWatch doc metric err:', e.message));

    // AWS EventBridge: Publish document uploaded domain event
    eventbridgeService.publishEvent('KinlyDocumentUploaded', {
      familyId,
      docId,
      title,
      type: type || 'receipt',
      amount,
      s3Url,
    }).catch(e => console.warn('EventBridge doc event err:', e.message));

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
// POST /api/vault/scan and /api/vault/documents/analyze
// Amazon SageMaker AI Vision & OCR Extraction
// -------------------------------------------------------------
const handleAnalyzeDoc = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, rawImage, image, filename } = req.body || {};

    // 1. Invoke AWS SageMaker AI / Bedrock Vision OCR Service
    const analysis = await sagemakerService.analyzeDocument(filename || text, rawImage || image);

    return res.json({
      success: true,
      extracted: {
        title: analysis.title,
        type: analysis.type,
        amount: analysis.amount,
        currency: analysis.currency,
        dueDate: analysis.dueDate,
        provider: analysis.provider,
        status: 'pending',
        summary: analysis.summary,
        fields: analysis.fields,
        suggestedActions: analysis.suggestedActions.map((label, idx) => ({
          id: `act_${Date.now()}_${idx}`,
          label,
          actionType: label.toLowerCase().includes('reminder') ? 'add_reminder' : 'assign_task',
        })),
      },
      data: { analysis },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Document analysis failed.' });
  }
};

router.post('/scan', handleAnalyzeDoc);
router.post('/documents/analyze', handleAnalyzeDoc);

// -------------------------------------------------------------
// PHYSICAL MEMORIES (Amazon S3 Media Backing)
// -------------------------------------------------------------
router.post('/memories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const familyId = req.familyId!;
    const { title, category, savedLocation, notes, tags, relatedMemberIds, emoji, photo, image } = req.body || {};

    if (!title || !savedLocation) {
      return res.status(400).json({ success: false, error: 'Memory title and saved physical location are required.' });
    }

    const memoryId = `mem_${Date.now()}`;

    // AWS S3: Upload memory photo/token if provided
    let s3PhotoUrl: string | undefined;
    if (photo || image) {
      try {
        const uploadRes = await s3Service.uploadAsset({
          familyId,
          category: 'memories',
          fileKey: `${memoryId}.jpg`,
          base64Data: photo || image,
        });
        s3PhotoUrl = uploadRes.url;
      } catch (err: any) {
        console.warn('S3 memory upload warning:', err?.message || err);
      }
    }

    memoriesRepo.create({
      id: memoryId,
      family_id: familyId,
      title: title.trim(),
      category: category || 'household',
      saved_location: savedLocation.trim(),
      last_verified: 'Today',
      notes: notes ? (s3PhotoUrl ? `${notes}\n[Photo: ${s3PhotoUrl}]` : notes) : (s3PhotoUrl ? `[Photo: ${s3PhotoUrl}]` : ''),
      tags_json: JSON.stringify(tags || []),
      related_member_ids_json: JSON.stringify(relatedMemberIds || []),
      emoji: emoji || '📘',
    });

    broadcastToFamily(familyId, {
      type: 'MEMORY_SAVED',
      memoryId,
      title,
      s3PhotoUrl,
    });

    return res.status(201).json({ success: true, memoryId, s3PhotoUrl });
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
