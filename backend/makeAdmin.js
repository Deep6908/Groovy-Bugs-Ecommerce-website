import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // prioritize backend env if available

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.connection.collection('users');
        const res = await User.updateOne(
            { clerkId: 'user_2yauIpfQrOdNwqbYdh1UQUZsab2' },
            { $set: { role: 'admin' } }
        );
        console.log('Update result:', res);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
};
run();
