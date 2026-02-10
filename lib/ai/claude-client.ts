import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
// dangerouslyAllowBrowser: true is OK for MVP. Move to backend for production.
export const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

// Basic function to call Claude API
export async function callClaude(
  userMessage: string,
  systemPrompt: string = 'You are a helpful legal AI assistant for LexCoworkAI.'
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text from response
    if (message.content[0].type === 'text') {
      return message.content[0].text;
    }

    return '';
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
}

// Function to call Claude with conversation history
export async function callClaudeWithHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string = 'You are a helpful legal AI assistant for LexCoworkAI.'
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Extract text from response
    if (response.content[0].type === 'text') {
      return response.content[0].text;
    }

    return '';
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
}
