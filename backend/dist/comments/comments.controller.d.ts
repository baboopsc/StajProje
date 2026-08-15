import { CommentsService } from './comments.service';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
    createComment(body: {
        movieId: number;
        content: string;
        rating: number;
        userId: number;
    }): Promise<import("./comment.entity").Comment>;
    getCommentsByMovie(movieId: string): Promise<import("./comment.entity").Comment[]>;
}
