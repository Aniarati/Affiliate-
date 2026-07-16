import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const campaigns = await db.campaign.findMany({
      include: {
        product: true,
        ads: {
          select: {
            id: true,
            headline: true,
            body: true,
            cta: true,
            status: true,
            impressions: true,
          },
        },
        _count: { select: { clicks: true, conversions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(
      campaigns.map(async (c) => {
        const revResult = await db.conversion.aggregate({
          where: { campaignId: c.id, status: 'approved' },
          _sum: { revenue: true },
        });
        const revenue = revResult._sum.revenue || 0;
        return {
          ...c,
          revenue,
          ctr: c.ads.reduce((s, a) => s + a.impressions, 0) > 0
            ? (c._count.clicks / c.ads.reduce((s, a) => s + a.impressions, 0)) * 100
            : 0,
          convRate: c._count.clicks > 0
            ? (c._count.conversions / c._count.clicks) * 100
            : 0,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Campaigns error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, productId, budget, description } = body;

    const campaign = await db.campaign.create({
      data: {
        name,
        description: description || '',
        status: 'active',
        budget: budget || 0,
        spent: 0,
        productId,
      },
      include: { product: true, _count: { select: { clicks: true, conversions: true } } },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const campaign = await db.campaign.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}