import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments') // API uzantımız: localhost:3000/comments olacak
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Filme yeni yorum atma: POST /comments
  @Post()
  async createComment(
    @Body() body: { movieId: number; content: string; rating: number; userId: number },
  ) {
    return await this.commentsService.create(
      body.movieId,
      body.content,
      body.rating,
      body.userId,
    );
  }

  // Filmin yorumlarını getirme: GET /comments/:movieId
  @Get(':movieId')
  async getCommentsByMovie(@Param('movieId') movieId: string) {
    // Parametreden gelen ID string olduğu için Number'a çeviriyoruz
    return await this.commentsService.findByMovieId(Number(movieId));
  }
}