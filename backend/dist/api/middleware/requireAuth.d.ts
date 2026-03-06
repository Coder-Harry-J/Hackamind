import { Request, Response, NextFunction } from "express";
import { JWTPayload } from "../../services/auth/jwt";
export interface AuthRequest extends Request {
    user?: JWTPayload;
}
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void;
