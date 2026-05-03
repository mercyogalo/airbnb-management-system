import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { UploadService } from './upload.service';

const fileSizeLimit = 5 * 1024 * 1024;

const imageFileFilter = (_: unknown, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/i)) {
    return cb(new BadRequestException('Only jpg, jpeg, png, and webp files are allowed') as unknown as Error, false);
  }
  cb(null, true);
};

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: fileSizeLimit },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const url = await this.uploadService.uploadImage(file, 'main');
    return { url };
  }

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      limits: { fileSize: fileSizeLimit },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const urls = await this.uploadService.uploadMultipleImages(files, 'gallery');
    return { urls };
  }

  @Post('property-images')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'mainImage', maxCount: 1 },
        { name: 'galleryImages' },
      ],
      {
        limits: { fileSize: fileSizeLimit },
        fileFilter: imageFileFilter,
      },
    ),
  )
  async uploadPropertyImages(
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      galleryImages?: Express.Multer.File[];
    },
  ) {
    if (!files.mainImage || files.mainImage.length === 0) {
      throw new BadRequestException('Main image is required');
    }

    const mainImageUrl = await this.uploadService.uploadImage(files.mainImage[0], 'main');
    const galleryUrls = files.galleryImages
      ? await this.uploadService.uploadMultipleImages(files.galleryImages, 'gallery')
      : [];

    return {
      mainImage: mainImageUrl,
      galleryImages: galleryUrls,
      allImages: [mainImageUrl, ...galleryUrls],
    };
  }
}