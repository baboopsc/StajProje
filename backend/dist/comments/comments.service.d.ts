import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
export declare class CommentsService {
    private commentsRepository;
    constructor(commentsRepository: Repository<Comment>);
    create(movieId: number, content: string, rating: number, userId: number): Promise<Comment>;
    findByMovieId(movieId: number): Promise<Comment[]>;
}
