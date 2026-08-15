import { Comment } from '../comments/comment.entity';
export declare class User {
    id: number;
    username: string;
    email: string;
    comments: Comment[];
}
