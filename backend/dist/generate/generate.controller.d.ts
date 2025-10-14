import { GenerateService } from './generate.service';
import { GenerateMessageDto } from './dto/generate-message.dto';
import { PolishMessageDto } from './dto/polish-message.dto';
export declare class GenerateController {
    private readonly generateService;
    constructor(generateService: GenerateService);
    generateMessage(req: any, generateMessageDto: GenerateMessageDto): Promise<import("../models").MessageDraft>;
    regenerateMessage(req: any, generateMessageDto: GenerateMessageDto): Promise<import("../models").MessageDraft>;
    polishMessage(req: any, polishMessageDto: PolishMessageDto): Promise<{
        body: string;
        wordCount: number;
        changes: string[];
    }>;
}
