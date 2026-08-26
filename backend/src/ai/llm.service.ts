import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

const DEFAULT_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DEFAULT_MODEL = 'qwen-plus';

export interface DescriptionInput {
  title: string;
  categoryName: string;
  lightRequirements?: string;
  waterRequirements?: string;
  careInstructions?: string[];
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

// Клиент LLM через OpenAI-совместимый chat/completions эндпоинт (Qwen предоставляет такой режим
// в DashScope). Не протестирован против боевого API — ключей нет; повторяет стандартный
// OpenAI-совместимый контракт, который Qwen и большинство аналогов поддерживают.
@Injectable()
export class LlmService {
  constructor(private readonly settings: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    return (await this.settings.get('LLM_API_KEY')) !== null;
  }

  async generateDescription(input: DescriptionInput): Promise<string> {
    const apiKey = await this.settings.get('LLM_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Генерация описаний не настроена — обратитесь к администратору',
      );
    }
    const apiUrl = (await this.settings.get('LLM_API_URL')) ?? DEFAULT_API_URL;
    const model = (await this.settings.get('LLM_MODEL')) ?? DEFAULT_MODEL;

    const prompt = this.buildPrompt(input);

    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Ты копирайтер маркетплейса растений GreenHub. Пишешь короткие продающие описания на русском языке.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new ServiceUnavailableException(`Ошибка LLM (${res.status}): ${body}`);
    }

    const data = (await res.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new ServiceUnavailableException('LLM вернул пустой ответ');
    }
    return content.trim();
  }

  private buildPrompt(input: DescriptionInput): string {
    const lines = [
      `Составь продающее описание для объявления о продаже растения на маркетплейсе.`,
      `Название: ${input.title}`,
      `Категория: ${input.categoryName}`,
    ];
    if (input.lightRequirements) lines.push(`Освещение: ${input.lightRequirements}`);
    if (input.waterRequirements) lines.push(`Полив: ${input.waterRequirements}`);
    if (input.careInstructions?.length) lines.push(`Уход: ${input.careInstructions.join(', ')}`);
    lines.push(
      '',
      'Структура текста: короткий продающий абзац, затем блоки "Особенности ухода", "Освещение", "Полив".',
      'Не упоминай цену, контакты, ссылки. Объём — 3-5 предложений плюс блоки.',
    );
    return lines.join('\n');
  }
}
