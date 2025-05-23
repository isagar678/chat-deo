"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('oauth', () => ({
    clientId: process.env.OAUTH_CLIENT_ID || 'your-client-id',
    clientSecret: process.env.OAUTH_CLIENT_SECRET || 'your-client-secret',
}));
//# sourceMappingURL=oAuth.config.js.map