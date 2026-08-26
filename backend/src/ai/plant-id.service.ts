import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

const API_URL = 'https://api.plant.id/v3/identification?details=common_names,taxonomy';

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

// Клиент Plant.id API v3 (https://plant.id/). Не протестирован против боевого API — ключей нет;
// повторяет документированный контракт, проверить нужно будет с реальным ключом администратора.
@Injectable()
export class PlantIdService {
  constructor(private readonly settings: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    return (await this.settings.get('PLANT_ID_API_KEY')) !== null;
  }

  async identify(imageBase64DataUrl: string): Promise<PlantIdSuggestion | null> {
    const apiKey = await this.settings.get('PLANT_ID_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI-распознавание растений не настроено — обратитесь к администратору',
      );
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ images: [imageBase64DataUrl], similar_images: false }),
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
