import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  movieId: number; // TMDB API'den gelen film ID'si buraya kaydolacak

  @Column('text')
  content: string;

  @Column({ type: 'numeric', nullable: true })
  rating: number; // Filme verilen yıldız puanı

  // Bir yorumun tek bir kullanıcısı olur
  @ManyToOne(() => User, (user) => user.comments)
  user: User;
}