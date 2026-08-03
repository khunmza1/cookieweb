import { NextResponse } from 'next/server';
import { getAIConfig, saveAIConfig, maskApiKey, AIConfig } from '@/lib/aiConfigStore';

// GET /api/admin/ai-config
export async function GET() {
  const config = getAIConfig();
  return NextResponse.json({
    config: {
      ...config,
      maskedApiKey: maskApiKey(config.apiKey)
    }
  });
}

// PUT /api/admin/ai-config (Save Configuration)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { providerType, baseUrl, apiKey, modelName, enabled, maxTokens, temperature } = body;

    const current = getAIConfig();
    const finalApiKey = apiKey === undefined || apiKey === '' 
      ? current.apiKey 
      : apiKey;

    const updated = saveAIConfig({
      providerType: providerType || current.providerType,
      baseUrl: (baseUrl || current.baseUrl).trim().replace(/\/+$/, ''), // strip trailing slashes
      apiKey: finalApiKey,
      modelName: (modelName || current.modelName).trim(),
      enabled: typeof enabled === 'boolean' ? enabled : current.enabled,
      maxTokens: Number(maxTokens) || 4096,
      temperature: Number(temperature) || 0.2
    });

    return NextResponse.json({
      success: true,
      message: 'AI API credentials & provider settings updated successfully!',
      config: {
        ...updated,
        maskedApiKey: maskApiKey(updated.apiKey)
      }
    });
  } catch (err: any) {
    console.error('Failed to update AI config:', err);
    return NextResponse.json({ error: err.message || 'Failed to update AI config' }, { status: 500 });
  }
}

// POST /api/admin/ai-config (Test API Connection OR Fetch Available Live Models)
export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const body = await request.json().catch(() => ({}));
    const current = getAIConfig();

    const action = body.action || 'test'; // 'test' | 'fetch-models'
    const providerType = body.providerType || current.providerType;
    let baseUrl = (body.baseUrl || current.baseUrl).trim().replace(/\/+$/, '');
    const apiKey = body.apiKey || current.apiKey;
    const modelName = (body.modelName || current.modelName).trim();

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key is missing. Please enter your API key to proceed.'
      }, { status: 400 });
    }

    // ACTION: FETCH LIVE MODELS FROM PROVIDER (GET https://maxplus-ai.cc/v1/models)
    if (action === 'fetch-models') {
      let cleanBase = baseUrl.replace(/\/chat\/completions\/?$/, '');
      const modelsEndpoint = cleanBase.endsWith('/models') ? cleanBase : `${cleanBase}/models`;

      try {
        const response = await fetch(modelsEndpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const resJson = await response.json().catch(() => ({}));
          const rawList = Array.isArray(resJson.data) 
            ? resJson.data 
            : Array.isArray(resJson.models) 
              ? resJson.models 
              : Array.isArray(resJson) 
                ? resJson 
                : [];

          const modelIds: string[] = rawList
            .map((m: any) => typeof m === 'string' ? m : (m.id || m.name || m.model))
            .filter(Boolean);

          return NextResponse.json({
            success: true,
            provider: 'MaxPlus AI Provider',
            endpoint: modelsEndpoint,
            count: modelIds.length,
            models: Array.from(new Set(modelIds)).sort()
          });
        } else {
          const errJson = await response.json().catch(() => ({}));
          const errMsg = errJson.error?.message || errJson.message || response.statusText;
          return NextResponse.json({
            success: false,
            error: `Failed to fetch models from ${modelsEndpoint} (${response.status}): ${errMsg}`
          }, { status: 400 });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Network Error fetching models from ${modelsEndpoint}: ${err.message}`
        }, { status: 500 });
      }
    }

    // ACTION: TEST API CONNECTION (https://maxplus-ai.cc/v1/chat/completions)
    if (providerType === 'openai-compatible' || baseUrl.includes('maxplus-ai') || baseUrl.includes('v1')) {
      const endpoint = baseUrl.endsWith('/chat/completions') 
        ? baseUrl 
        : `${baseUrl}/chat/completions`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName || 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an AI assistant for Cookie Run Classic.' },
            { role: 'user', content: 'Respond with a JSON object: {"status": "ok", "message": "MaxPlus AI Connection Successful!"}' }
          ],
          temperature: 0.1,
          max_tokens: 150
        })
      });

      const latencyMs = Date.now() - startTime;
      const resJson = await response.json().catch(() => ({}));

      if (response.ok) {
        const reply = resJson.choices?.[0]?.message?.content || 'Success (No output content)';
        return NextResponse.json({
          success: true,
          provider: 'MaxPlus / OpenAI-Compatible API',
          endpoint,
          model: modelName,
          reply,
          latencyMs,
          rawResponse: resJson
        });
      } else {
        const errMsg = resJson.error?.message || resJson.message || response.statusText;
        return NextResponse.json({
          success: false,
          error: `Provider API Error (${response.status}): ${errMsg}`,
          latencyMs
        }, { status: 400 });
      }
    }

    // Google Gemini Protocol
    if (providerType === 'gemini') {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-3.6-flash'}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with: "Gemini API Connection OK"' }] }]
        })
      });

      const latencyMs = Date.now() - startTime;
      const resJson = await response.json().catch(() => ({}));

      if (response.ok) {
        const reply = resJson.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini Connected';
        return NextResponse.json({
          success: true,
          provider: 'Google Gemini API',
          endpoint: 'generativelanguage.googleapis.com',
          model: modelName,
          reply,
          latencyMs
        });
      } else {
        return NextResponse.json({
          success: false,
          error: resJson.error?.message || response.statusText,
          latencyMs
        }, { status: 400 });
      }
    }

    // Anthropic Claude Protocol
    if (providerType === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName || 'claude-3-5-sonnet-20241022',
          max_tokens: 100,
          messages: [{ role: 'user', content: 'Ping' }]
        })
      });

      const latencyMs = Date.now() - startTime;
      const resJson = await response.json().catch(() => ({}));

      if (response.ok) {
        return NextResponse.json({
          success: true,
          provider: 'Anthropic Claude API',
          model: modelName,
          reply: resJson.content?.[0]?.text || 'Claude Connected',
          latencyMs
        });
      } else {
        return NextResponse.json({
          success: false,
          error: resJson.error?.message || response.statusText,
          latencyMs
        }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, error: 'Unsupported provider type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: `Network Connection Error: ${err.message}`,
      latencyMs: Date.now() - startTime
    }, { status: 500 });
  }
}
