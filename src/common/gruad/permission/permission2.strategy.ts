import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/modules-system/prisma/prisma.service';
import { Request } from 'express';
import { Users } from 'generated/prisma';

@Injectable()
export class PermissionStrategy2 extends PassportStrategy(
  Strategy,
  'permission',
) {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async validate(req: Request & { user: Users }) {
    // Đảm bảo đã có user trong req
    const user = req?.user;
    if (!user) {
      console.log('User not found in protect middleware');
      throw new BadRequestException('User not found');
    }
    // role admin thì cho qua
    if (user.roleId === 1) {
      return user;
    }

    // method
    const method = req.method;
    // endpoint
    // /api/auth
    const endpoint = req.baseUrl + req.route?.path;

    const rolePermission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: user.roleId,
        Permissions: {
          method: method,
          endpoint: endpoint,
        },
        isActive: true,
      },
    });
    if (!rolePermission) {
      throw new BadRequestException("You don't have permission");
    }
    // console.log({ user, method, endpoint, rolePermission });

    return user;
  }
}
