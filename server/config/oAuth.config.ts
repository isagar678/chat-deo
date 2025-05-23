import { registerAs } from '@nestjs/config';

export default registerAs('oauth', () => ({
    clientId: process.env.OAUTH_CLIENT_ID || 'your-client-id',
    clientSecret: process.env.OAUTH_CLIENT_SECRET || 'your-client-secret',
}));