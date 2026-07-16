import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, campaignId } = await request.json();

    // Save user message
    await db.aiChatMessage.create({
      data: { role: 'user', content: message },
    });

    // Build context from campaign data
    let campaignContext = '';
    if (campaignId) {
      const campaign = await db.campaign.findUnique({
        where: { id: campaignId },
        include: {
          product: true,
          ads: true,
          _count: { select: { clicks: true, conversions: true } },
        },
      });
      if (campaign) {
        const revResult = await db.conversion.aggregate({
          where: { campaignId: campaign.id, status: 'approved' },
          _sum: { revenue: true },
        });
        const revenue = revResult._sum.revenue || 0;
        campaignContext = `
Campaign: ${campaign.name}
Product: ${campaign.product.name} ($${campaign.product.commission}/conversion)
Status: ${campaign.status}
Budget: $${campaign.budget} | Spent: $${campaign.spent}
Clicks: ${campaign._count.clicks} | Conversions: ${campaign._count.conversions}
Revenue: $${revenue.toFixed(2)}
Active Ads: ${campaign.ads.filter(a => a.status === 'active').length}`;
      }
    }

    // Get recent performance context
    const recentClicks = await db.click.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });
    const recentConversions = await db.conversion.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });

    // Use z-ai-web-dev-sdk for AI generation
    const { createLLMChatCompletion } = await import('z-ai-web-dev-sdk');

    const systemPrompt = `You are an expert AI Ad Agent specializing in affiliate marketing. You help users create, optimize, and manage their affiliate ad campaigns. 

You can:
- Generate compelling ad copy (headlines, body text, CTAs)
- Suggest campaign optimization strategies
- Analyze performance data and provide actionable recommendations
- Create A/B test variations for ads
- Recommend targeting and bidding strategies

${campaignContext ? `Current campaign context:\n${campaignContext}` : ''}

Recent platform stats (last 7 days):
- Total clicks: ${recentClicks}
- Total conversions: ${recentConversions}

Be specific, actionable, and data-driven in your responses. When generating ad copy, format it clearly with labeled sections.`;

    const response = await createLLMChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.8,
      maxTokens: 1500,
    });

    const aiMessage = response.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    // Save AI response
    await db.aiChatMessage.create({
      data: { role: 'assistant', content: aiMessage },
    });

    // Get chat history
    const history = await db.aiChatMessage.findMany({
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({
      message: aiMessage,
      history: history.map((h) => ({
        id: h.id,
        role: h.role,
        content: h.content,
      })),
    });
  } catch (error) {
    console.error('AI Agent error:', error);
    return NextResponse.json(
      { message: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}