export interface JWTPayload {
    sub: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export declare function signAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string;
export declare function signRefreshToken(userId: string): string;
export declare function verifyAccessToken(token: string): JWTPayload;
export declare function verifyRefreshToken(token: string): {
    sub: string;
};
