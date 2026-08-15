import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  // Filme yeni yorum ekleme
  async create(movieId: number, content: string, rating: number, userId: number): Promise<Comment> {
    const newComment = this.commentsRepository.create({
      movieId,
      content,
      rating,
      user: { id: userId }, // İlişkili kullanıcıyı ekliyoruz
    });
    return await this.commentsRepository.save(newComment);
  }

  // Belirli bir filmin tüm yorumlarını getirme (Kullanıcı bilgisiyle beraber)
  async findByMovieId(movieId: number): Promise<Comment[]> {
    return await this.commentsRepository.find({
      where: { movieId },
      relations: ['user'], // Yorumu yapan kullanıcının bilgilerini de çekiyoruz
    });
  }
}