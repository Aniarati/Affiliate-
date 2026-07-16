import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const totalClicks = await db.click.count();
    const totalConversions = await db.conversion.count();
    const conversions = await db.conversion.findMany({
      where: { status: 'approved' },
      select: { revenue: true },
    });
    const totalRevenue = conversions.reduce((sum, c) => sum + c.revenue, 0);
    const activeCampaigns = await db.campaign.count({ where: { status: 'active' } });
    const totalCampaigns = await db.campaign.count();
    const epc = totalClicks > 0 ? totalRevenue / totalClicks : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Daily stats for the last 14 days
    const dailyStats = [];
    for (let i = 13; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const dayClicks = await db.click.count({
        where: { createdAt: { gte: start, lte: end } },
      });
      const dayConversions = await db.conversion.count({
        where: { createdAt: { gte: start, lte: end } },
      });
      const dayRevenueResult = await db.conversion.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: 'approved' },
        _sum: { revenue: true },
      });

      dailyStats.push({
        date: start.toISOString().split('T')[0],
        label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: dayClicks,
        conversions: dayConversions,
        revenue: dayRevenueResult._sum.revenue || 0,
      });
    }

    // Top campaigns
    const topCampaigns = await db.campaign.findMany({
      include: {
        product: true,
        _count: { select: { clicks: true, conversions: true } },
        ads: { select: { impressions: true } },
      },
      orderBy: { spent: 'desc' },
    });

    const campaignStats = await Promise.all(
      topCampaigns.map(async (campaign) => {
        const revResult = await db.conversion.aggregate({
          where: { campaignId: campaign.id, status: 'approved' },
          _sum: { revenue: true },
        });
        const revenue = revResult._sum.revenue || 0;
        return {
          id: campaign.id,
          name: campaign.name,
          productName: campaign.product.name,
          status: campaign.status,
          budget: campaign.budget,
          spent: campaign.spent,
          clicks: campaign._count.clicks,
          conversions: campaign._count.conversions,
          revenue,
          roi: campaign.spent > 0 ? ((revenue - campaign.spent) / campaign.spent) * 100 : 0,
          impressions: campaign.ads.reduce((sum, ad) => sum + ad.impressions, 0),
        };
      })
    );

    // Device breakdown
    const desktopClicks = await db.click.count({ where: { device: 'Desktop' } });
    const mobileClicks = await db.click.count({ where: { device: 'Mobile' } });
    const tabletClicks = await db.click.count({ where: { device: 'Tablet' } });

    // Country breakdown
    const countryClicks = await db.click.groupBy({
      by: ['country'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    });

    return NextResponse.json({
      overview: {
        totalClicks,
        totalConversions,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        epc: Math.round(epc * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        activeCampaigns,
        totalCampaigns,
      },
      dailyStats,
      campaigns: campaignStats,
      devices: [
        { name: 'Desktop', value: desktopClicks },
        { name: 'Mobile', value: mobileClicks },
        { name: 'Tablet', value: tabletClicks },
      ],
      countries: countryClicks.map((c) => ({
        name: c.country,
        value: c._count.id,
      })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}