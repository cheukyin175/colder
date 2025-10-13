import { GenerateService } from './generate.service';
import { GenerateMessageDto } from './dto/generate-message.dto';
export declare class GenerateController {
    private readonly generateService;
    constructor(generateService: GenerateService);
    generateMessage(req: any, generateMessageDto: GenerateMessageDto): Promise<import("../models").MessageDraft>;
}
