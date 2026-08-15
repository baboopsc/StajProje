import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment])], // Comment tablosunu bağladık
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}