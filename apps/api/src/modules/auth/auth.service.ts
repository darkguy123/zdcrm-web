import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  login(payload: LoginDto) {
    return {
      success: true,
      message: 'Auth contract scaffolded',
      data: {
        accessToken: 'replace-with-signed-jwt',
        refreshToken: 'replace-with-signed-refresh-token',
        user: {
          id: 'stub-user-id',
          email: payload.email,
          role: 'admin',
        },
      },
    };
  }

  refresh() {
    return {
      success: true,
      message: 'Refresh contract scaffolded',
    };
  }

  me() {
    return {
      success: true,
      message: 'Current user contract scaffolded',
      data: null,
    };
  }
}
