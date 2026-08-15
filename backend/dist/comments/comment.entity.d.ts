import { User } from '../users/user.entity';
export declare class Comment {
    id: number;
    movieId: number;
    content: string;
    rating: number;
    user: User;
}
