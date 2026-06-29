import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDb, hashPassword } from '../config/db';
import crypto from 'crypto';

export async function getSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const db = await getDb();

    // Create settings table dynamically if not exists (safer)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Fetch company name
    let companyNameRow = await db.get("SELECT value FROM system_settings WHERE key = 'company_name'");
    if (!companyNameRow) {
      await db.run("INSERT INTO system_settings (key, value) VALUES ('company_name', 'NexaHR Enterprise')");
      companyNameRow = { value: 'NexaHR Enterprise' };
    }

    res.json({
      companyName: companyNameRow.value,
    });
  } catch (err: any) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Internal server error fetching settings.' });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'Admin') {
      res.status(403).json({ error: 'Only admins can modify system settings.' });
      return;
    }

    const { companyName } = req.body;
    if (!companyName) {
      res.status(400).json({ error: 'Company name is required.' });
      return;
    }

    const db = await getDb();
    await db.run(
      "INSERT OR REPLACE INTO system_settings (key, value) VALUES ('company_name', ?)",
      [companyName]
    );

    res.json({ success: true, message: 'Settings updated successfully.', companyName });
  } catch (err: any) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Internal server error updating settings.' });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: 'Old password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user?.id]);

    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const sha256Hash = crypto.createHash('sha256').update(oldPassword).digest('hex');
    const isOldMatch = (user.password_hash === oldPassword) || 
                       (user.password_hash === hashPassword(oldPassword)) || 
                       (user.password_hash === sha256Hash);

    if (!isOldMatch) {
      res.status(400).json({ error: 'The old password you entered is incorrect.' });
      return;
    }

    const hashedNew = hashPassword(newPassword);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNew, req.user?.id]);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error updating password.' });
  }
}
