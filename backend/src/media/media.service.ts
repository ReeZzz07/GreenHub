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
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4'];
const ALLOWED_CERTIFICATE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const CERTIFICATE_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};
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
  async uploadListingImage(file: { buffer: Buffer; mimetype: string }): Promise<string> {
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

    const processedBuffer = await this.applyWatermark(file.buffer);
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

  // Короткое видео объявления (TZ.md 4.3): sharp с видео не работает, поэтому без вотермарка и
  // пересжатия — кладём оригинал в публичный бакет как есть. Длительность (≤15 сек) проверяется на клиенте.
  async uploadListingVideo(file: { buffer: Buffer; mimetype: string }): Promise<string> {
    if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Допустимый формат видео: MP4');
    }

    const key = `listing-videos/${randomUUID()}.mp4`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.processedBucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${this.publicUrl}/${this.processedBucket}/${key}`;
  }

  // Фитосанитарный сертификат (TZ.md 5.1/5.2): PDF или фото документа, кладём как есть —
  // это официальный документ для ручной проверки модератором, а не карточка товара под вотермарк.
  async uploadListingCertificate(file: { buffer: Buffer; mimetype: string }): Promise<string> {
    if (!ALLOWED_CERTIFICATE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Допустимые форматы сертификата: PDF, JPG, PNG');
    }

    const ext = CERTIFICATE_EXTENSIONS[file.mimetype];
    const key = `listing-certificates/${randomUUID()}.${ext}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.processedBucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${this.publicUrl}/${this.processedBucket}/${key}`;
  }

  // Аватар пользователя: без вотермарка (это личное фото, а не карточка товара),
  // квадратный кроп 512×512 в публичный бакет.
  async uploadAvatar(file: { buffer: Buffer; mimetype: string }, userId: string): Promise<string> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Допустимые форматы изображений: JPG, PNG');
    }

    const processed = await sharp(file.buffer)
      .rotate()
      .resize({ width: 512, height: 512, fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer();

    const key = `avatars/${userId}-${randomUUID()}.webp`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.processedBucket,
        Key: key,
        Body: processed,
        ContentType: 'image/webp',
      }),
    );

    return `${this.publicUrl}/${this.processedBucket}/${key}`;
  }

  // Мелкая иконка (категория, особенность на главной и т.п.): маленький квадрат без вотермарка —
  // рендерится мелко, как emoji в чипе фильтра или в цветном кружке карточки.
  async uploadSmallIcon(file: { buffer: Buffer; mimetype: string }, folder: string): Promise<string> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Допустимые форматы изображений: JPG, PNG');
    }

    const processed = await sharp(file.buffer)
      .rotate()
      .resize({ width: 128, height: 128, fit: 'cover' })
      .webp({ quality: 90 })
      .toBuffer();

    const key = `${folder}/${randomUUID()}.webp`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.processedBucket,
        Key: key,
        Body: processed,
        ContentType: 'image/webp',
      }),
    );

    return `${this.publicUrl}/${this.processedBucket}/${key}`;
  }

  private async applyWatermark(buffer: Buffer): Promise<Buffer> {
    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();
    const sourceWidth = metadata.width ?? MAX_DIMENSION;
    const sourceHeight = metadata.height ?? MAX_DIMENSION;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
    const targetWidth = Math.round(sourceWidth * scale);

    const { data: resized, info } = await image
      .resize({ width: targetWidth, withoutEnlargement: true })
      .toBuffer({ resolveWithObject: true });

    const margin = Math.round(info.width * 0.03);
    const fontSize = Math.max(16, Math.round(info.width * 0.045));
    const svgWidth = Math.round(fontSize * 5.2) + margin;
    const svgHeight = Math.round(fontSize * 1.8);

    const svg = `
      <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <text x="${svgWidth - margin}" y="${svgHeight / 2}" font-family="sans-serif" font-size="${fontSize}"
              font-weight="700" fill="white" fill-opacity="0.5" text-anchor="end" dominant-baseline="middle">GreenHub</text>
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
