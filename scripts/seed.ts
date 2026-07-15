import { db } from '@/lib/db';

async function seed() {
  const products = await Promise.all([
    db.product.create({ data: { name: 'Premium SEO Toolkit', description: 'All-in-one SEO optimization suite for digital marketers', category: 'Software', commission: 45.0, affiliateUrl: 'https://example.com/seo-toolkit', status: 'active' } }),
    db.product.create({ data: { name: 'Email Marketing Pro', description: 'Advanced email automation and campaign management', category: 'Software', commission: 35.0, affiliateUrl: 'https://example.com/email-pro', status: 'active' } }),
    db.product.create({ data: { name: 'Social Media Scheduler', description: 'Schedule and manage all social media accounts', category: 'SaaS', commission: 25.0, affiliateUrl: 'https://example.com/social-sched', status: 'active' } }),
    db.product.create({ data: { name: 'Conversion Analytics', description: 'Deep analytics for tracking user behavior', category: 'Analytics', commission: 55.0, affiliateUrl: 'https://example.com/analytics', status: 'active' } }),
    db.product.create({ data: { name: 'Content Writing AI', description: 'AI-powered content generation tool', category: 'AI Tools', commission: 30.0, affiliateUrl: 'https://example.com/content-ai', status: 'active' } }),
  ]);

  const campaigns = [];
  for (let i = 0; i < products.length; i++) {
    const campaign = await db.campaign.create({
      data: {
        name: `${products[i].name} - Q3 Campaign`,
        status: i < 3 ? 'active' : 'paused',
        budget: [5000, 3000, 8000, 2000, 6000][i],
        spent: [3200, 1800, 5400, 800, 3900][i],
        productId: products[i].id,
      },
    });
    campaigns.push(campaign);
  }

  const adData = [
    { headline: 'Boost Your Traffic by 300%', body: 'Discover the SEO secret top marketers use.', cta: 'Start Free Trial', campaignIdx: 0 },
    { headline: 'Skyrocket Your Open Rates', body: 'Send emails that get clicked.', cta: 'Get Started', campaignIdx: 1 },
    { headline: 'Schedule Once, Post Everywhere', body: 'Manage all social accounts from one dashboard.', cta: 'Try It Free', campaignIdx: 2 },
    { headline: 'Know Exactly What Converts', body: 'Real-time user behavior and optimization.', cta: 'See Demo', campaignIdx: 3 },
    { headline: 'Write 10x Faster with AI', body: 'Generate content in seconds.', cta: 'Start Writing', campaignIdx: 4 },
    { headline: 'Rank #1 on Google', body: '10,000+ sites reached page one.', cta: 'Try Free', campaignIdx: 0 },
    { headline: 'Double Your Email Revenue', body: 'Advanced segmentation that works.', cta: 'Learn More', campaignIdx: 1 },
    { headline: 'Never Miss a Post Again', body: 'AI-optimized posting times.', cta: 'Schedule Now', campaignIdx: 2 },
    { headline: 'Stop Guessing, Start Knowing', body: 'Data-driven decisions for your funnels.', cta: 'Get Insights', campaignIdx: 3 },
    { headline: 'AI Content That Converts', body: 'Blog posts, ad copy, and more.', cta: 'Create Now', campaignIdx: 4 },
  ];

  const ads = [];
  for (const ad of adData) {
    const created = await db.ad.create({
      data: {
        headline: ad.headline,
        body: ad.body,
        cta: ad.cta,
        targetUrl: products[ad.campaignIdx].affiliateUrl,
        status: 'active',
        impressions: Math.floor(Math.random() * 50000) + 5000,
        campaignId: campaigns[ad.campaignIdx].id,
      },
    });
    ads.push({ ad: created, campaignIndex: ad.campaignIdx });
  }

  const countries = ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX'];
  const devices = ['Desktop', 'Mobile', 'Tablet'];

  // Generate data for last 14 days only to be faster
  for (let day = 13; day >= 0; day--) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - day);
    baseDate.setHours(0, 0, 0, 0);

    for (const { ad, campaignIndex } of ads) {
      const numClicks = Math.floor(Math.random() * 8) + 1;
      const clickCreates = [];
      const conversionCreates = [];

      for (let c = 0; c < numClicks; c++) {
        const clickDate = new Date(baseDate.getTime() + Math.random() * 86400000);
        const hasConversion = Math.random() > 0.7;
        const clickId = `clk_${day}_${c}_${Math.random().toString(36).slice(2, 10)}`;

        clickCreates.push({
          id: clickId,
          country: countries[Math.floor(Math.random() * countries.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          adId: ad.id,
          campaignId: campaigns[campaignIndex].id,
          createdAt: clickDate,
        });

        if (hasConversion) {
          conversionCreates.push({
            revenue: products[campaignIndex].commission * (0.8 + Math.random() * 0.4),
            status: Math.random() > 0.1 ? 'approved' : 'pending',
            clickId: clickId,
            campaignId: campaigns[campaignIndex].id,
            createdAt: clickDate,
          });
        }
      }

      if (clickCreates.length > 0) await db.click.createMany({ data: clickCreates });
      if (conversionCreates.length > 0) await db.conversion.createMany({ data: conversionCreates });
    }
  }

  console.log(`Seeded: ${products.length} products, ${campaigns.length} campaigns, ${ads.length} ads`);
}

seed().catch(console.error).finally(() => db.$disconnect());