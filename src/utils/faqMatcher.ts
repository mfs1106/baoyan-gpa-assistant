import { faqData, FAQItem } from '@/data/faqData';

export interface MatchResult {
  item: FAQItem;
  score: number;
  matchedKeywords: string[];
}

const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/[\s,，。！？!?、；;:：'"''（）()【】\[\]]/g, '');
};

const calculateSimilarity = (userInput: string, item: FAQItem): MatchResult | null => {
  const normalizedInput = normalizeText(userInput);
  if (!normalizedInput) return null;

  let score = 0;
  const matchedKeywords: string[] = [];

  for (const keyword of item.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) continue;

    if (normalizedInput.includes(normalizedKeyword)) {
      score += 10;
      matchedKeywords.push(keyword);
    } else {
      let matchChars = 0;
      for (const char of normalizedKeyword) {
        if (normalizedInput.includes(char)) {
          matchChars++;
        }
      }
      if (matchChars >= normalizedKeyword.length * 0.6) {
        score += 3;
        matchedKeywords.push(keyword);
      }
    }
  }

  const normalizedQuestion = normalizeText(item.question);
  if (normalizedInput.includes(normalizedQuestion)) {
    score += 20;
    matchedKeywords.push('完整问题匹配');
  } else {
    let questionMatchChars = 0;
    for (const char of normalizedQuestion) {
      if (normalizedInput.includes(char)) {
        questionMatchChars++;
      }
    }
    if (questionMatchChars >= normalizedQuestion.length * 0.5) {
      score += 5;
    }
  }

  const normalizedAnswer = normalizeText(item.answer);
  let answerMatchChars = 0;
  for (const char of normalizedInput) {
    if (normalizedAnswer.includes(char)) {
      answerMatchChars++;
    }
  }
  if (answerMatchChars >= normalizedInput.length * 0.4) {
    score += 2;
  }

  if (score > 0) {
    return { item, score, matchedKeywords };
  }

  return null;
};

export const findBestMatch = (userInput: string): MatchResult | null => {
  const results: MatchResult[] = [];

  for (const item of faqData) {
    const result = calculateSimilarity(userInput, item);
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) return null;

  results.sort((a, b) => b.score - a.score);
  return results[0];
};

export const findTopMatches = (userInput: string, limit: number = 3): MatchResult[] => {
  const results: MatchResult[] = [];

  for (const item of faqData) {
    const result = calculateSimilarity(userInput, item);
    if (result) {
      results.push(result);
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
};

export const getSuggestionQuestions = (category?: string): string[] => {
  const pool = category ? faqData.filter((f) => f.category === category) : faqData;
  return pool.map((item) => item.question);
};
