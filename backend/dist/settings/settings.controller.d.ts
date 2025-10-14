import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(req: any): Promise<{
        userName: string | null;
        userRole: string | null;
        userCompany: string | null;
        userBackground: string | null;
        userValueProposition: string | null;
    }>;
    updateSettings(req: any, updateSettingsDto: UpdateSettingsDto): Promise<{
        userName: string | null;
        userRole: string | null;
        userCompany: string | null;
        userBackground: string | null;
        userValueProposition: string | null;
    }>;
}
