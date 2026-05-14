import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    list(): {
        success: boolean;
        data: never[];
        message: string;
    };
}
