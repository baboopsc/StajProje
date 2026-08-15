import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(body: {
        username: string;
        email: string;
    }): Promise<import("./user.entity").User>;
    getAllUsers(): Promise<import("./user.entity").User[]>;
}
