"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTokenErrors = handleTokenErrors;
const common_1 = require("@nestjs/common");
function handleTokenErrors(error) {
    if (error.name === 'TokenExpiredError') {
        throw new common_1.UnauthorizedException('Refresh token has expired.');
    }
    else if (error.name === 'JsonWebTokenError') {
        throw new common_1.UnauthorizedException('Invalid refresh token.');
    }
}
//# sourceMappingURL=UsefulFunction.js.map