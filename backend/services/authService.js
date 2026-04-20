import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const ensureAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin';

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is missing. Admin login will not be available.');
    return;
  }

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    });
    console.log('Admin user created from environment credentials.');
    return;
  }

  if (existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin';
  }

  const passwordMatches = await bcrypt.compare(adminPassword, existingAdmin.passwordHash);
  if (!passwordMatches) {
    existingAdmin.passwordHash = await bcrypt.hash(adminPassword, 10);
  }

  existingAdmin.name = adminName;
  await existingAdmin.save();
};