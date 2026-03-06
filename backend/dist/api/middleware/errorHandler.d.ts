import type { Request, Response, NextFunction } from "express";
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
export declare function requestLogger(req: Request, _res: Response, next: NextFunction): void;
