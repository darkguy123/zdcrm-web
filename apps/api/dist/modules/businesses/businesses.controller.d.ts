import { BusinessesService } from './businesses.service';
export declare class BusinessesController {
    private readonly businessesService;
    constructor(businessesService: BusinessesService);
    list(): {
        success: boolean;
        data: never[];
        message: string;
    };
}
