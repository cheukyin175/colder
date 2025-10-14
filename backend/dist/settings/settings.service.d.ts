import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(userId: string): Promise<{
        userName: string | null;
        userRole: string | null;
        userCompany: string | null;
        userBackground: string | null;
        userValueProposition: string | null;
    }>;
    updateSettings(userId: string, data: UpdateSettingsDto): Promise<{
        userName: string | null;
        userRole: string | null;
        userCompany: string | null;
        userBackground: string | null;
        userValueProposition: string | null;
    }>;
}
