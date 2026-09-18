import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { usersRepo, membersRepo } from '../db/database';

export const JWT_SECRET = process.env.JWT_SECRET || 'kinly-secret-family-token-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    familyId?: string;
    memberId?: string;
  };
  familyId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      familyId?: string;
    };

    const user = usersRepo.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User session invalid. Please log in again.' });
    }

    // Resolve member & family ID
    const member = membersRepo.findByUserId(user.id);
    const familyId = decoded.familyId || member?.family_id;

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      familyId,
      memberId: member?.id,
    };
    req.familyId = familyId;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token expired or invalid.' });
  }
}
