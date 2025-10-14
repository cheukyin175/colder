import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    upsertUser(userId: string, email: string, name?: string): Promise<User>;
    findById(userId: string): Promise<User | null>;
}
