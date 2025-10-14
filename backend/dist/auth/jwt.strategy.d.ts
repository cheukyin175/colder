import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { Request } from 'express';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    private supabaseService;
    constructor(prisma: PrismaService, supabaseService: SupabaseService);
    validate(req: Request, payload: any): Promise<{
        userId: string;
        email: string;
    }>;
}
export {};
