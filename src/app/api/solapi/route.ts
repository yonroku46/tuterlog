import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function getSolapiAuth() {
  const apiKey = process.env.SOLAPI_API_KEY || "";
  const apiSecret = process.env.SOLAPI_API_SECRET || "";
  const date = new Date().toISOString();
  // Generate a random salt (UUID without dashes)
  const salt = crypto.randomUUID().replace(/-/g, '');

  const hmac = crypto.createHmac('sha256', apiSecret);
  hmac.update(date + salt);
  const signature = hmac.digest('hex');

  return {
    header: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    date
  };
}

export async function POST(req: NextRequest) {
  try {
    const { phone, nickname } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const auth = getSolapiAuth();
    
    const payload = {
      message: {
        to: phone,
        kakaoOptions: {
          pfId: process.env.SOLAPI_PF_ID || "KA01PF260324074256784JUpuS0yZdkY",
          templateId: process.env.SOLAPI_TEMPLATE_ID || "KA01TP260410021922395bDiczSDGM2l",
          variables: {
            "#{name}": nickname || ""
          }
        }
      }
    };

    const response = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": auth.header,
        "Date": auth.date
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Solapi error response:", result);
      return NextResponse.json({ error: 'Failed to send Solapi', details: result }, { status: response.status });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Solapi API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
