import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    login(payload: LoginDto): {
        success: boolean;
        message: string;
        data: {
            accessToken: string;
            refreshToken: string;
            user: {
                id: string;
                email: string;
                role: string;
            };
        };
    };
    refresh(): {
        success: boolean;
        message: string;
    };
    me(): {
        success: boolean;
        message: string;
        data: null;
    };
}
