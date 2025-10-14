"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const supabase_service_1 = require("../supabase/supabase.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    supabaseService;
    constructor(prisma, supabaseService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long',
            passReqToCallback: true,
        });
        this.prisma = prisma;
        this.supabaseService = supabaseService;
    }
    async validate(req, payload) {
        try {
            const token = passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()(req);
            if (!token) {
                throw new common_1.UnauthorizedException('No token provided');
            }
            const supabaseUser = await this.supabaseService.getUserFromToken(token);
            if (!supabaseUser) {
                throw new common_1.UnauthorizedException('Invalid token');
            }
            const userId = supabaseUser.id;
            const email = supabaseUser.email || '';
            const user = await this.prisma.user.upsert({
                where: { id: userId },
                update: {
                    email,
                },
                create: {
                    id: userId,
                    email,
                    name: email?.split('@')[0] || 'User',
                },
            });
            return { userId: user.id, email: user.email };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        supabase_service_1.SupabaseService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map