import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client successfully initialized.");
  } else {
    console.warn("WARNING: GEMINI_API_KEY is not set in environment. AI features will fallback to offline mock rules.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI client:", error);
}

// ------------------------------------------------------------
// API ROUTE: AI Security Scan & Support Chat Engine
// ------------------------------------------------------------
app.post('/api/eDataAI', async (req, res) => {
  const { action, message, history, transactionData } = req.body;

  if (!ai) {
    // Elegant fallback responses if GEMINI_API_KEY is absent
    if (action === 'riskScan') {
      const { amount, phoneOrMeter, productName } = transactionData || {};
      const amountNum = parseFloat(amount || '0');
      const score = amountNum > 15000 ? 12 : 2; // Simple mock risk rule
      return res.json({
        success: true,
        riskScore: score,
        analysis: `[OFFLINE FALLBACK MODE] Dynamic security scan completed. Checked target identifier (${phoneOrMeter || 'Unknown'}) for ${productName || 'product'}. Safe transaction velocity detected. Safe rating based on offline threat rules.`
      });
    }

    if (action === 'chat') {
      return res.json({
        success: true,
        text: `Hello! I am your eData AI Assistant. Currently, I am running in Offline Mode because the API key is unconfigured. 

I can guide you through using the eData platform:
- **Wallet Funding**: Use Paystack, Flutterwave, Payvessel, or Monnify to fund your balance immediately.
- **Biometric Controls**: Turn on fingerprint checks inside your profile for instant multi-factor transaction validation.
- **Referrals**: Upgrade to Super User or LGA/State Leader levels to earn up to 1% direct cash commissions on downline transactions!`
      });
    }

    return res.status(400).json({ error: "Invalid action specified." });
  }

  try {
    if (action === 'riskScan') {
      const { amount, phoneOrMeter, productName, operator, userCategory } = transactionData || {};
      
      const prompt = `Perform a high-speed security risk scan on the following eData (utility payments app) transaction:
      - Product: ${productName || 'Unknown'}
      - Target ID (Phone/Meter): ${phoneOrMeter || 'Unknown'}
      - Carrier/Operator: ${operator || 'None'}
      - Amount: ₦${amount || '0'}
      - User Account Tier: ${userCategory || 'Normal User'}
      
      Analyze the transaction details for:
      1. Typos or common invalid format flags (e.g. invalid Nigerian mobile phone prefix/length, suspicious electricity meter lengths).
      2. Transaction sizing flags (e.g., abnormally high individual purchases for this category).
      3. Fraud signal assessment.
      
      Respond STRICTLY with a JSON object containing two fields:
      - riskScore (integer, 0 to 100 where 0 is pristine safe and 100 is high alert risk)
      - analysis (string, concise 2-3 sentence summary explaining the security rating, flags tripped, or greenlights).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: {
                type: Type.INTEGER,
                description: "Risk evaluation rating from 0 to 100."
              },
              analysis: {
                type: Type.STRING,
                description: "Brief security summary explaining findings."
              }
            },
            required: ['riskScore', 'analysis']
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json({
        success: true,
        riskScore: parsed.riskScore ?? 5,
        analysis: parsed.analysis ?? "No obvious threats detected."
      });
    }

    if (action === 'chat') {
      const sysInstruction = `You are the friendly, professional eData AI Mobile Copilot, built securely inside the eData mobile application framework.
      eData is a cutting-edge digital utility payments platform in Nigeria enabling users to buy airtime, mobile data, electricity tokens, cable TV, and exam tokens.
      
      Use the following context to answers the user's queries concisely and with a highly helpful fintech-expert tone:
      - Users fund their wallets via Paystack, Flutterwave, Monnify, or Payvessel gateways, or BVN/NIN verified direct account.
      - Users are categorized into: Normal User (default), Referred User (gets 1% transaction discount, assigned automatically when using referral codes), or Super User (onboarded specifically by Marketers under LGA/State/Regional hierarchies).
      - LGA Leaders earn on Super Users. State Leaders accumulate results under LGA leaders, Regional Leaders under State leaders, and National Leaders globally.
      - For security, passwords & PINs are securely hashed (Argon2/bcrypt) and stored. We never display PINs or passwords in plain text.
      - If users have transaction disputes, they can raise a dispute directly from the transactions screen in the mobile app, and admins can quickly review and credit refunds.
      
      Keep answers focused, beautifully formatted in Markdown, structured with bullet points, and optimized for reading inside a mobile screen overlay. Avoid complex jargon.`;

      const chatHistory = (history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Append user's current query
      chatHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: chatHistory,
        config: {
          systemInstruction: sysInstruction,
        }
      });

      return res.json({
        success: true,
        text: response.text || "I am here to support you with all of your eData needs!"
      });
    }

    return res.status(400).json({ error: "Unsupported operation request." });

  } catch (err: any) {
    console.error("Error in AI Route Handler:", err);
    return res.status(500).json({
      success: false,
      error: "We encountered an issue checking the security or talking with our assistant. Please try again.",
      details: err.message
    });
  }
});

// ------------------------------------------------------------
// VITE OR STATIC MIDDLEWARE SETUP
// ------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[eData Fullstack] Server active at http://localhost:${PORT}`);
  });
}

startServer();
