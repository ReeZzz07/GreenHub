import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const MAX_DIMENSION = 1600;

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger(MediaService.name);
  private readonly s3: S3Client;
  private readonly originalsBucket: string;
  private readonly processedBucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.originalsBucket = this.config.getOrThrow<string>('S3_BUCKET_ORIGINALS');
    this.processedBucket = this.config.getOrThrow<string>('S3_BUCKET_PROCESSED');
    this.publicUrl = this.config.getOrThrow<string>('S3_PUBLIC_URL');

    this.s3 = new S3Client({
      endpoint: this.config.getOrThrow<string>('S3_ENDPOINT'),
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_KEY'),
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucket(this.originalsBucket, false);
      await this.ensureBucket(this.processedBucket, true);
    } catch (error) {
      this.logger.error('Не удалось инициализировать S3-бакеты. Загрузка медиа будет недоступна.', error);
    }
  }

  // Загружает оригинал (приватно, для модерации/пересборки) и вотермарк-версию (публично)
  async uploadListingImage(
    file: { buffer: Buffer; mimetype: string },
    sellerId: string,
  ): Promise<string> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Допустимые форматы изображений: JPG, PNG');
    }

    const id = randomUUID();
    const originalExt = file.mimetype === 'image/png' ? 'png' : 'jpg';

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.originalsBucket,
        Key: `${id}.${originalExt}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const processedBuffer = await this.applyWatermark(file.buffer, sellerId);
    const processedKey = `${id}.webp`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.processedBucket,
        Key: processedKey,
        Body: processedBuffer,
        ContentType: 'image/webp',
      }),
    );

    return `${this.publicUrl}/${this.processedBucket}/${processedKey}`;
  }

  private async applyWatermark(buffer: Buffer, sellerId: string): Promise<Buffer> {
    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();
    const sourceWidth = metadata.width ?? MAX_DIMENSION;
    const sourceHeight = metadata.height ?? MAX_DIMENSION;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
    const targetWidth = Math.round(sourceWidth * scale);

    const { data: resized, info } = await image
      .resize({ width: targetWidth, withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });

    const badgeWidth = Math.max(140, Math.round(info.width * 0.32));
    const badgeHeight = Math.round(badgeWidth * 0.22);
    const titleSize = Math.round(badgeHeight * 0.4);
    const subtitleSize = Math.round(titleSize * 0.68);
    const sellerTag = sellerId.slice(0, 8);

    const svg = `
      <svg width="${badgeWidth}" height="${badgeHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight / 6}" fill="black" fill-opacity="0.45"/>
        <text x="${badgeWidth / 2}" y="${badgeHeight * 0.42}" font-family="sans-serif" font-size="${titleSize}"
              font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">GreenHub</text>
        <text x="${badgeWidth / 2}" y="${badgeHeight * 0.78}" font-family="sans-serif" font-size="${subtitleSize}"
              fill="white" fill-opacity="0.85" text-anchor="middle" dominant-baseline="middle">#${sellerTag}</text>
      </svg>
    `;

    return sharp(resized)
      .composite([{ input: Buffer.from(svg), gravity: 'southeast' }])
      .webp({ quality: 82 })
      .toBuffer();
  }

  private async ensureBucket(bucket: string, publicRead: boolean) {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
    }

    if (publicRead) {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      };
      await this.s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }));
    }
  }
}
