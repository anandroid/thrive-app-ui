import { NextRequest, NextResponse } from 'next/server';
import { getExpertConsultationConfig } from '@/src/config/features';
import { addMessageToThread } from '@/src/utils/chatStorage';
import * as crypto from 'crypto';

// Verify webhook signature
function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');
    
    return hash === signature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

// Format consultation summary for chat display
interface ConsultationSummaryData {
  consultationId: string;
  expertName?: string;
  duration?: number;
  summary: string;
  recommendations?: string[];
  nextSteps?: string[];
  followUpDate?: string;
}

function formatConsultationSummary(data: ConsultationSummaryData) {
  return {
    type: 'consultation_summary',
    greeting: `Your consultation with ${data.expertName} has been completed! Here's your personalized wellness plan:`,
    sections: [
      {
        title: '📋 Consultation Summary',
        content: data.summary
      },
      {
        title: '🎯 Personalized Recommendations',
        items: data.recommendations
      },
      {
        title: '📌 Next Steps',
        items: data.nextSteps
      }
    ],
    followUp: data.followUpDate ? {
      date: data.followUpDate,
      message: `Your follow-up consultation is scheduled for ${new Date(data.followUpDate).toLocaleDateString()}.`
    } : null,
    consultationDetails: {
      id: data.consultationId,
      duration: `${data.duration} minutes`,
      expertName: data.expertName,
      completedAt: new Date().toISOString()
    }
  };
}

export async function POST(request: NextRequest) {
  const config = getExpertConsultationConfig();
  
  if (!config.enabled) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  try {
    // Read the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-shopify-hmac-sha256');
    
    // Verify webhook authenticity
    const isValid = verifyWebhookSignature(rawBody, signature, config.webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the body
    const body = JSON.parse(rawBody);
    const { 
      consultationId,
      bookingId,
      threadId,
      expertName,
      duration,
      summary,
      recommendations,
      nextSteps,
      followUpDate,
      videoRecordingUrl
    } = body;

    // Validate required fields
    if (!consultationId || !threadId || !summary) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        required: ['consultationId', 'threadId', 'summary'] 
      }, { status: 400 });
    }

    // Create a formatted message for the chat thread
    const consultationMessage = {
      role: 'assistant' as const,
      content: JSON.stringify(formatConsultationSummary({
        consultationId,
        expertName: expertName || 'your wellness expert',
        duration: duration || 45,
        summary,
        recommendations: recommendations || [],
        nextSteps: nextSteps || [],
        followUpDate
      }))
    };

    // Add message to the original thread
    try {
      await addMessageToThread(threadId, consultationMessage);
    } catch (error) {
      console.error('Error adding message to thread:', error);
      // Don't fail the webhook if we can't update the thread
      // The consultation data is still valuable
    }

    // Store consultation record in localStorage (in a real app, this would be a database)
    if (typeof window !== 'undefined') {
      const consultations = JSON.parse(localStorage.getItem('thrive_consultations') || '[]');
      consultations.push({
        consultationId,
        bookingId,
        threadId,
        expertName,
        summary,
        recommendations,
        nextSteps,
        followUpDate,
        videoRecordingUrl,
        completedAt: new Date().toISOString()
      });
      localStorage.setItem('thrive_consultations', JSON.stringify(consultations));
    }

    return NextResponse.json({ 
      success: true,
      message: 'Consultation summary received and processed',
      consultationId 
    });
  } catch (error) {
    console.error('Consultation summary error:', error);
    return NextResponse.json({ 
      error: 'Internal error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}