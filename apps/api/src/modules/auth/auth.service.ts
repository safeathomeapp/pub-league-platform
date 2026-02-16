import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../db/prisma.service';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private passwords: PasswordService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    const hash = await this.passwords.hash(password);
    const user = await this.prisma.user.create({ data: { email, password: hash } });

    return { user: { id: user.id, email: user.email }, accessToken: await this.sign(user.id, user.email) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await this.passwords.verify(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return { user: { id: user.id, email: user.email }, accessToken: await this.sign(user.id, user.email) };
  }

  private async sign(userId: string, email: string) {
    const ttl = process.env.JWT_ACCESS_TTL_SECONDS ? parseInt(process.env.JWT_ACCESS_TTL_SECONDS, 10) : 3600;
    return this.jwt.signAsync({ sub: userId, email }, { expiresIn: ttl });
  }
}
