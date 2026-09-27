import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_URL = "https://webhooks.us-1.keragon.com/v1/workflows/224c75bb-cd6b-4bda-aa69-b3dbe6ee46e2/trigger/signal";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let parsedResponse: unknown = null;

    if (text) {
      try {
        parsedResponse = JSON.parse(text);
      } catch {
        parsedResponse = text;
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: text || `Webhook request failed with status ${response.status}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission accepted by the webhook.",
      response: parsedResponse,
    });
  } catch (error) {
    console.error("Server-side intake submission failed:", error);

    return NextResponse.json(
      {
        error: "There was a problem submitting the intake. Please try again.",
      },
      { status: 500 }
    );
  }
}
