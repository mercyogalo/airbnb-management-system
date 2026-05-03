import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Public registration — always creates a customer (USER) account
  // Admin account is created via seed script only
  async register(dto: CreateUserDto) {
    // Strip any role override — guests can only register as USER
    const safeDto: CreateUserDto = { ...dto, role: UserRole.USER };
    const user  = await this.usersService.create(safeDto);
    const token = this.signToken(user['_id'].toString(), user.email);
    return {
      user: { id: user['_id'], name: user.name, email: user.email, role: user.role },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const token = this.signToken(user._id.toString(), user.email);
    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    };
  }

  private signToken(sub: string, email: string) {
    return this.jwtService.sign({ sub, email });
  }
}