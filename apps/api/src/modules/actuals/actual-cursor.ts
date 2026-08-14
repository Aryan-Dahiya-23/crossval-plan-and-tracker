import { Types } from 'mongoose';

export interface DecodedActualCursor {
  monthKey: number;
  createdAt: Date;
  id: Types.ObjectId;
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Encodes the actual-entry sorting tuple (monthKey, createdAt, id) into a URL-safe Base64 cursor string.
 */
export function encodeActualCursor(
  monthKey: number,
  createdAt: Date,
  id: Types.ObjectId | string,
): string {
  const payload = [monthKey, createdAt.toISOString(), id.toString()];
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
}

/**
 * Decodes a URL-safe Base64 cursor string into the sorting tuple (monthKey, createdAt, id).
 * Returns null if the cursor is malformed, invalid JSON, or contains invalid data types.
 */
export function decodeActualCursor(cursorStr: string): DecodedActualCursor | null {
  if (typeof cursorStr !== 'string' || cursorStr.trim() === '') {
    return null;
  }

  try {
    const json = Buffer.from(cursorStr, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json) as unknown;

    if (!Array.isArray(parsed) || parsed.length !== 3) {
      return null;
    }

    const [monthKey, createdAtStr, idStr] = parsed as [unknown, unknown, unknown];

    if (typeof monthKey !== 'number' || !Number.isInteger(monthKey)) {
      return null;
    }

    if (typeof createdAtStr !== 'string') {
      return null;
    }

    const createdAt = new Date(createdAtStr);
    if (isNaN(createdAt.getTime())) {
      return null;
    }

    if (typeof idStr !== 'string' || !OBJECT_ID_REGEX.test(idStr)) {
      return null;
    }

    return {
      monthKey,
      createdAt,
      id: new Types.ObjectId(idStr),
    };
  } catch {
    return null;
  }
}
