import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    const token = this.signToken(user['_id'].toString(), user.email);
    return { user: { id: user['_id'], name: user.name, email: user.email, role: user.role }, token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(user._id.toString(), user.email);
    return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token };
  }

  private signToken(sub: string, email: string) {
    return this.jwtService.sign({ sub, email });
  }
}