import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamically import GoogleGenAI to avoid build issues
let ai: any = null;

async function getAI() {
  if (ai) return ai;
  try {
    if (process.env.GEMINI_API_KEY) {
      const { GoogleGenAI } = await import('@google/genai');
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
    }
  } catch (e) {
    console.error('Failed to initialize Gemini:', e);
  }
  return ai;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, message, history, transactionData } = req.body || {};
  const client = await getAI();

  if (!client) {
    // Offline fallback when no API key
    if (action === 'riskScan') {
      const { amount, phoneOrMeter, productName } = transactionData || {};
      const amountNum = parseFloat(amount || '0');
      const score = amountNum > 15000 ? 12 : 2;
      return res.json({
        success: true,
        riskScore: score,
        analysis: `[DEMO MODE] Security scan completed for ${phoneOrMeter || 'Unknown'} — ${productName || 'product'}. Safe transaction velocity detected.`
      });
    }

    if (action === 'chat') {
      return res.json({
        success: true,
        text: `Hello! I am your eData AI Assistant running in **Demo Mode**.\n\nI can guide you through the eData platform:\n- **Wallet Funding**: Use Paystack, Flutterwave, Payvessel, or Monnify\n- **Services**: Buy Airtime, Data, Cable TV, Electricity, Exam Tokens\n- **Referrals**: Earn up to ₦2,500 per referral\n- **Security**: Biometric authentication & transaction PIN protection\n\n*To enable full AI, add your GEMINI_API_KEY in Vercel environment variables.*`
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    const { Type } = await import('@google/genai');

    if (action === 'riskScan') {
      const { amount, phoneOrMeter, productName, operator, userCategory } = transactionData || {};

      const prompt = `Perform a high-speed security risk scan on the following eData transaction:
      - Product: ${productName || 'Unknown'}
      - Target ID (Phone/Meter): ${phoneOrMeter || 'Unknown'}
      - Carrier/Operator: ${operator || 'None'}
      - Amount: ₦${amount || '0'}
      - User Account Tier: ${userCategory || 'Normal User'}
      
      Analyze for:
      1. Invalid format flags (phone prefix/length, meter lengths).
      2. Transaction sizing flags.
      3. Fraud signal assessment.
      
      Respond STRICTLY with JSON: { riskScore (0-100), analysis (2-3 sentences) }`;

      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.INTEGER, description: 'Risk rating 0-100' },
              analysis: { type: Type.STRING, description: 'Brief security summary' }
            },
            required: ['riskScore', 'analysis']
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json({
        success: true,
        riskScore: parsed.riskScore ?? 5,
        analysis: parsed.analysis ?? 'No obvious threats detected.'
      });
    }

    if (action === 'chat') {
      const sysInstruction = `You are the eData AI Mobile Copilot. eData is a Nigerian digital utility payments platform for airtime, data, electricity, cable TV, and exam tokens. Users fund wallets via Paystack/Flutterwave/Monnify. Tiers: Normal, Referred (1% discount), Premium. Keep answers concise, markdown-formatted, mobile-optimized.`;

      const chatHistory = (history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      chatHistory.push({ role: 'user', parts: [{ text: message }] });

      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: chatHistory,
        config: { systemInstruction: sysInstruction }
      });

      return res.json({
        success: true,
        text: response.text || 'I am here to help with your eData needs!'
      });
    }

    return res.status(400).json({ error: 'Unsupported action' });

  } catch (err: any) {
    console.error('AI Route Error:', err);
    return res.status(500).json({
      success: false,
      error: 'AI service temporarily unavailable. Please try again.',
      details: err.message
    });
  }
}
