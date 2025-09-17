import { BadRequestException, Injectable } from '@nestjs/common';
import { Users } from 'generated/prisma';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { SaveTotpDto } from './dto/save-totp.dto';
import { PrismaService } from 'src/modules/modules-system/prisma/prisma.service';
import { DisableTotpDto } from './dto/disable-totp.dto';
import { VerifyTotpDto } from './dto/verify-totp.dto';

/*
ALTER TABLE `Users`
ADD totpSecret VARCHAR(255);
*/
@Injectable()
export class TotpService {
  constructor(private readonly prisma: PrismaService) {}
  // Bước 1 không save secrect
  async generate(user: Users) {
    // Nếu mà người dùng đã bật Totp rồi thì không cần phải tạo nữa
    if (user.totpSecret) {
      throw new BadRequestException('User has already generated 2fa');
    }

    // Tạo secret
    const secret = authenticator.generateSecret();

    const url = authenticator.keyuri(user.email, 'CYBER COMMUNITY', secret);
    // tạo qr từ secret
    const qrCode = await toDataURL(url);

    return {
      secret,
      qrCode,
    };
  }
  // Bước 2 save secrect
  async save(saveTotpDto: SaveTotpDto, user: Users) {
    // nếu người dùng đã bật Totp thì không save nữa
    if (user.totpSecret) {
      throw new BadRequestException('User has not generated 2fa');
    }
    const { secret, token } = saveTotpDto;
    const isCheck = authenticator.check(token, secret);
    if (!isCheck) {
      throw new BadRequestException('Token invalid ');
    }

    await this.prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        totpSecret: secret,
      },
    });
    return true;
  }
  // Tắt Totp: chỉ áp dụng cho người đã bật
  async disable(disableTotpDto: DisableTotpDto, user: Users) {
    if (!user.totpSecret) {
      throw new BadRequestException('User has not generated 2fa');
    }
    const { token } = disableTotpDto;
    const isCheck = authenticator.check(token, user.totpSecret);
    if (!isCheck) {
      throw new BadRequestException('Token invalid ');
    }
    await this.prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        totpSecret: null,
      },
    });
    return true;
  }
  // Xác minh token: chỉ áp dụng cho người đã bật
  async verify(verifyTotpDto: VerifyTotpDto, user: Users) {
    if (!user.totpSecret) {
      throw new BadRequestException('User does not have totpSecret');
    }

    const { token } = verifyTotpDto;

    const isCheck = authenticator.check(token, user.totpSecret);
    if (!isCheck) {
      throw new BadRequestException('Token is not valid');
    }

    return true;
  }
}
