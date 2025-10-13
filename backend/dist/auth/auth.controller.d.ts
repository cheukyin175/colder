import { AuthService } from './auth.service';
import { GoogleSignInDto } from './dto/google-sign-in.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signInWithGoogle(googleSignInDto: GoogleSignInDto): Promise<{
        accessToken: string;
    }>;
}
