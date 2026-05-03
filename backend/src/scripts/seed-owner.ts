import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const UserSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['admin', 'user'], default: 'user' }, // only 'admin' used for host seed
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI not set in environment');
    process.exit(1);
  }

  const name     = process.env.OWNER_NAME ;
  const email    = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!name || !email || !password) {
    console.error('❌  OWNER_NAME, OWNER_EMAIL, and OWNER_PASSWORD must all be set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB');

  const UserModel = mongoose.models.User ?? mongoose.model('User', UserSchema);

  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.log(`ℹ️   Owner account already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await UserModel.create({ name, email, password: hashed, role: 'admin' });

  console.log(`✅  Owner account created:`);
  console.log(`    Name:  ${name}`);
  console.log(`    Email: ${email}`);
  console.log(`    Role:  admin`);
  console.log(`\n⚠️   Change the default password immediately if using defaults.`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});