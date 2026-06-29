import Anthropic from '@anthropic-ai/sdk';
import { OracleMessage } from '../types';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT = `You are the Oracle within Quantified Mysticism — a personal pattern-recognition companion.
Your role is to help users discover meaningful patterns between their inner world and their lived experiences.

Tone: Reflective, wise, curious, and grounded. Never predictive or absolute.
Style: Speak in the second person. Ask thoughtful questions. Draw connections without declaring certainty.
Scope: Only reference patterns from the user's own data provided to you. Do not make up data.
Language: Avoid fear-based language. Avoid deterministic statements. Focus on awareness and reflection.`;

export async function sendOracleMessage(
  messages: OracleMessage[],
  userContext: string
): Promise<string> {
  const contextualSystem = `${SYSTEM_PROMPT}\n\nUser's current data context:\n${userContext}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: contextualSystem,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}
