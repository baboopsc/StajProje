import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Yeni kullanıcı kaydetme
  async create(username: string, email: string): Promise<User> {
    const newUser = this.usersRepository.create({ username, email });
    return await this.usersRepository.save(newUser);
  }

  // Tüm kullanıcıları getirme
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }
}