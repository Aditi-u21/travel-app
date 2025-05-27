import express from 'express';
import { createClient } from 'redis';

const app = express();
app.use(express.json());

// Configure Redis client
const redisClient = createClient({
    url: 'redis://localhost:6379' // Adjust if using a hosted Redis instance
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
await redisClient.connect();

// POST /api/store-otp
app.post('/api/store-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        await redisClient.setEx(`otp_${email}`, 300, otp); // 300s = 5min
        res.status(200).send('OTP stored');
    } catch (error) {
        console.error('Error storing OTP:', error);
        res.status(500).send('Server error');
    }
});

// POST /api/validate-otp
app.post('/api/validate-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const storedOtp = await redisClient.get(`otp_${email}`);
        if (storedOtp && storedOtp === otp) {
            await redisClient.del(`otp_${email}`);
            res.status(200).send('OTP valid');
        } else {
            res.status(400).send('Invalid or expired OTP');
        }
    } catch (error) {
        console.error('Error validating OTP:', error);
        res.status(500).send('Server error');
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));