import { BranchesService } from './branches.service';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    list(): {
        success: boolean;
        data: never[];
        message: string;
    };
}
