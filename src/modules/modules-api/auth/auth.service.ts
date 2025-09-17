import { PrismaService } from './../../modules-system/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { TokenService } from 'src/modules/modules-system/token/token.service';
import { Users } from 'generated/prisma';
import { RegisterDto } from './dto/register.dto';
import { TotpService } from '../totp/totp.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly totpService: TotpService,
  ) {}
  async login(loginDto: LoginDto) {
    const { email, password, token } = loginDto;
    console.log({ email, password });
    const userExist = await this.prisma.users.findUnique({
      where: { email: email },
    });
    if (!userExist)
      throw new BadRequestException('Email không tồn tại, vui lòng đăng ký!');

    // Nếu tài khoản của người dùng có bật 2FA thì mới xử lý
    if (userExist.totpSecret) {
      if (!token) {
        // Bước 1: ko gửi token
        // trả về isTotp là true để cho FE chuyển sang giao diện nhập token
        return { isTotp: true };
      } else {
        // Bước 2: phải gửi token
        this.totpService.verify({ token }, userExist);
      }
      // token;
      // return { isTotp: true };
    }

    //Nếu code chạy đc tới đây => Đảm bảo có userExist

    // do tài khoản đăng nhập bằng gmail hoặc facebook
    // lúc này tài khoản sẽ không có mật khẩu
    // nên nếu người dùng cố tình đăng nhập bằng email thì sẽ không có mật khẩu để kiểm tra
    // nên phải bắt người dùng đăng nhập bằng email vào setting để cập nhật lại mật khẩu mới
    if (!userExist.password) {
      throw new BadRequestException(
        'Vui lòng đăng nhập bằng mạng xã hội (gmail, facebook), để cập nhật lại mật khẩu mới trong setting',
      );
    }

    const isPassword = bcrypt.compareSync(password, userExist.password);
    if (!isPassword) throw new BadRequestException('Mật Khẩu không chính xác!');
    //Nếu code chạy đc tới đây => Đảm bảo có password chính xác

    const tokens = this.tokenService.createTokens(userExist.id);
    // console.log({ tokens });

    // sendMail(userExist.email);
    return tokens;
  }

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;
    const userExist = await this.prisma.users.findUnique({
      where: { email: email },
    });
    if (userExist) {
      throw new BadRequestException('Email đã tồn tại!');
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const { password: _, ...userNew } = await this.prisma.users.create({
      data: {
        email: email,
        password: passwordHash,
        fullName: fullName,
      },
    });
    console.log({ email, password, fullName, userExist, userNew });

    console.log({ userNew });

    // delete userNew.password;

    return userNew;
  }

  getInfo(user: Users) {
    return { ...user, isTotp: !!user.totpSecret };
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
