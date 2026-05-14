import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHealth(): {
        success: boolean;
        message: string;
        timestamp: string;
    };
}
