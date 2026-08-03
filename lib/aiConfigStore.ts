import fs from 'fs';
import path from 'path';

export interface AIConfig {
  providerType: 'openai-compatible' | 'gemini' | 'anthropic';
  baseUrl: string;
  apiKey: string;
  modelName: string;
  enabled: boolean;
  maxTokens: number;
  temperature: number;
  updatedAt: string;
}

const CONFIG_PATH = path.join(process.cwd(), '.cache_cookierundb', 'aiConfig.json');

const DEFAULT_CONFIG: AIConfig = {
  providerType: 'openai-compatible',
  baseUrl: 'https://maxplus-ai.cc/v1',
  apiKey: process.env.MAXPLUS_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || '',
  modelName: 'deepseek-chat',
  enabled: true,
  maxTokens: 4096,
  temperature: 0.2,
  updatedAt: new Date().toISOString()
};

export function getAIConfig(): AIConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        // Override empty API key with environment variable if available
        apiKey: parsed.apiKey || process.env.MAXPLUS_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || ''
      };
    }
  } catch (err) {
    console.error('Error loading AI config, using default:', err);
  }
  return DEFAULT_CONFIG;
}

export function saveAIConfig(newConfig: Partial<AIConfig>): AIConfig {
  const current = getAIConfig();
  const updated: AIConfig = {
    ...current,
    ...newConfig,
    updatedAt: new Date().toISOString()
  };

  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving AI config to file:', err);
  }

  return updated;
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
