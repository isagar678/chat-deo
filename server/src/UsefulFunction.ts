import { UnauthorizedException } from "@nestjs/common";

export function handleTokenErrors(error: Error){
    if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired.');
    } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token.');
    } 
}