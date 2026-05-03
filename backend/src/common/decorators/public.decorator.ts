import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skips JWT auth when used with JwtAuthGuard (e.g. public availability checks). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
