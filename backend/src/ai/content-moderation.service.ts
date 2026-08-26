import { Injectable } from '@nestjs/common';

// Базовый фильтр AI-сгенерированного текста перед показом продавцу (TZ.md, раздел 4.4):
// спам/контакты ловим регулярками (точно и без ложных срабатываний), нецензурную лексику —
// небольшим списком корней слов. Это не замена ручной модерации объявления, а первый фильтр.
const CONTACT_PATTERNS: RegExp[] = [
  // \b перед "+" не сработает (не-словесный символ), поэтому без него — на нежелательные
  // совпадения внутри других чисел не рассчитываем, это грубый эвристический фильтр
  /(?:\+7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, // email
  /https?:\/\/\S+/i, // ссылки
  /\b(?:telegram|whatsapp|viber|вотсап|телеграм|вайбер)\b/i,
];

const PROFANITY_ROOTS = ['хуй', 'хуе', 'пизд', 'ебан', 'ебат', 'бляд', 'сука', 'мудак', 'долбо'];

export interface ModerationResult {
  clean: boolean;
  reasons: string[];
}

@Injectable()
export class ContentModerationService {
  check(text: string): ModerationResult {
    const reasons: string[] = [];
    const lower = text.toLowerCase();

    if (CONTACT_PATTERNS.some((re) => re.test(text))) {
      reasons.push('обнаружены контактные данные (телефон/email/ссылка)');
    }
    if (PROFANITY_ROOTS.some((root) => lower.includes(root))) {
      reasons.push('обнаружена нецензурная лексика');
    }

    return { clean: reasons.length === 0, reasons };
  }
}
