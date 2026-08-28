import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

const ICON_TYPES = ['EMOJI', 'PRESET', 'UPLOAD'] as const;

// У баннера каталога бейдж динамический ("N объявлений · M категорий", считается на сервере) — редактируемого описания у него нет
class HeroBannerDto {
  @IsString()
  title: string;

  @IsString()
  ctaText: string;
}

class RecognizeBannerDto {
  @IsString()
  badgeText: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  ctaText: string;
}

// Иконка карточки: emoji-текст, id встроенного пресета, или URL загруженной картинки — см. HomeIcon на фронте
class FeatureItemDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsIn(ICON_TYPES)
  iconType?: (typeof ICON_TYPES)[number];
}

// У шагов "как это работает" иконок нет — там просто номер 1/2/3
class StepItemDto {
  @IsString()
  title: string;

  @IsString()
  description: string;
}

class ClosingCtaDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  buttonText: string;
}

export class UpdateHomeContentDto {
  @ValidateNested()
  @Type(() => HeroBannerDto)
  heroBanner: HeroBannerDto;

  @ValidateNested()
  @Type(() => RecognizeBannerDto)
  recognizeBanner: RecognizeBannerDto;

  @IsString()
  featuresTitle: string;

  @ValidateNested({ each: true })
  @Type(() => FeatureItemDto)
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  features: FeatureItemDto[];

  @IsString()
  howItWorksTitle: string;

  @ValidateNested({ each: true })
  @Type(() => StepItemDto)
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  steps: StepItemDto[];

  @IsString()
  newArrivalsTitle: string;

  @ValidateNested()
  @Type(() => ClosingCtaDto)
  closingCta: ClosingCtaDto;
}
