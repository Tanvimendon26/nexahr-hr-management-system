import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../config/db';

export async function getUpcomingHoliday(req: AuthenticatedRequest, res: Response) {
  try {
    const db = await getDb();
    const todayStr = new Date().toLocaleDateString('en-CA');
    const holiday = await db.get(
      'SELECT * FROM holidays WHERE holiday_date >= ? ORDER BY holiday_date ASC LIMIT 1',
      [todayStr]
    );

    res.json({ holiday: holiday || null });
  } catch (err: any) {
    console.error('Get upcoming holiday error:', err);
    res.status(500).json({ error: 'Internal server error retrieving holiday.' });
  }
}
