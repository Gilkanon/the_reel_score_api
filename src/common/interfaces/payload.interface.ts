import { Role } from '@prisma/client';

export interface Payload {
  username: string;
  role: Role;
}
