import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import sharp from 'sharp';
import { SettingsService } from '../settings/settings.service';

const API_URL = 'https://api.plant.id/v3/identification?details=common_names,taxonomy';

// Plant.id ограничивает изображение 25 000 000 пикселей (см. ошибку API). Фото с современных
// телефонов часто превышают лимит (например, 5712×4408 ≈ 25,2 млн) — пережимаем перед отправкой.
// Для распознавания вида растения такого разрешения более чем достаточно.
const MAX_DIMENSION = 2000;

export interface PlantIdSuggestion {
  name: string;
  probability: number;
  commonNames: string[];
}

interface PlantIdResponse {
  result?: {
    classification?: {
      suggestions?: {
        name: string;
        probability: number;
        details?: { common_names?: string[] };
      }[];
    };
  };
}

// Клиент Plant.id API v3 (https://plant.id/).
@Injectable()
export class PlantIdService {
  constructor(private readonly settings: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    return (await this.settings.get('PLANT_ID_API_KEY')) !== null;
  }

  async identify(imageBuffer: Buffer): Promise<PlantIdSuggestion | null> {
    const apiKey = await this.settings.get('PLANT_ID_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI-распознавание растений не настроено — обратитесь к администратору',
      );
    }

    const resized = await sharp(imageBuffer)
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    const dataUrl = `data:image/jpeg;base64,${resized.toString('base64')}`;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      // Plant.id v3 принимает similar_images только как true (модификатор-флаг) — просто не
      // передаём его, если похожие изображения не нужны; явный false отклоняется API.
      body: JSON.stringify({ images: [dataUrl] }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(`Ошибка Plant.id (${res.status}): ${body}`);
    }

    const data = (await res.json()) as PlantIdResponse;
    const suggestion = data.result?.classification?.suggestions?.[0];
    if (!suggestion) return null;

    return {
      name: suggestion.name,
      probability: suggestion.probability,
      commonNames: suggestion.details?.common_names ?? [],
    };
  }
}
