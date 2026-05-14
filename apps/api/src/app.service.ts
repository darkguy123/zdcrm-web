import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      success: true,
      message: 'ZDCRM API is healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
