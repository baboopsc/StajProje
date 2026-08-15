import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users') // API uzantımız: localhost:3000/users olacak
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Yeni kullanıcı oluşturma: POST /users
  @Post()
  async createUser(@Body() body: { username: string; email: string }) {
    return await this.usersService.create(body.username, body.email);
  }

  // Tüm kullanıcıları listeleme: GET /users
  @Get()
  async getAllUsers() {
    return await this.usersService.findAll();
  }
}