import { Inject, Injectable } from '@nestjs/common';
import { v2 as cloudinaryV2, type UploadApiErrorResponse, type UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

type ImageType = 'main' | 'gallery';

@Injectable()
export class UploadService {
  constructor(@Inject('CLOUDINARY') private cloudinaryClient: typeof cloudinaryV2) {}

  async uploadImage(file: Express.Multer.File, type: ImageType = 'gallery'): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinaryClient.uploader.upload_stream(
        {
          folder: `airbnb-booking/${type}`,
          transformation:
            type === 'main'
              ? [{ width: 1200, height: 800, crop: 'fill', quality: 'auto' }]
              : [{ width: 900, height: 600, crop: 'fill', quality: 'auto' }],
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) return reject(error);
          if (!result?.secure_url) return reject(new Error('Cloudinary did not return a secure image URL'));
          resolve(result.secure_url);
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async uploadMultipleImages(files: Express.Multer.File[], type: ImageType = 'gallery'): Promise<string[]> {
    return Promise.all(files.map((file) => this.uploadImage(file, type)));
  }

  async deleteImage(imageUrl: string): Promise<void> {
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1]?.split('.')[0];
    const folder = urlParts[urlParts.length - 2];

    if (!filename || !folder) {
      return;
    }

    const publicId = `airbnb-booking/${folder}/${filename}`;
    await this.cloudinaryClient.uploader.destroy(publicId);
  }

  async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    await Promise.all(imageUrls.map((url) => this.deleteImage(url)));
  }
}