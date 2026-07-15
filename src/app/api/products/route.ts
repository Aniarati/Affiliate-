import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const products = await db.product.findMany({
      include: {
        _count: { select: { campaigns: true } },
        campaigns: {
          select: {
            id: true,
            status: true,
            _count: { select: { clicks: true, conversions: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = products.map((p) => {
      const totalClicks = p.campaigns.reduce((s, c) => s + c._count.clicks, 0);
      const totalConversions = p.campaigns.reduce((s, c) => s + c._count.conversions, 0);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        commission: p.commission,
        affiliateUrl: p.affiliateUrl,
        status: p.status,
        totalClicks,
        totalConversions,
        activeCampaigns: p.campaigns.filter((c) => c.status === 'active').length,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}