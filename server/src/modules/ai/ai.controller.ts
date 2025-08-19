import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

type ChatMessage = { role: 'user' | 'model'; content: string };

@Controller('ai')
export class AiController {
  constructor(private readonly configService: ConfigService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Chat with Gemini' })
  async chat(@Body() body: { prompt?: string; messages?: ChatMessage[] }) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Build contents from either a single prompt or a messages array
    const contents = body?.messages?.length
      ? body.messages.map((m) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content ?? '' }] }))
      : [
          {
            role: 'user',
            parts: [{ text: (body?.prompt || '').toString() }],
          },
        ];

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${err}`);
    }

    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { text };
  }
}


