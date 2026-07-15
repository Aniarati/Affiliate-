'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, DollarSign, MousePointerClick,
  Bot, Target, Zap, ArrowUpRight, ArrowDownRight,
  Send, Plus, Globe, Smartphone, Monitor, Tablet,
  ChevronRight, Sparkles, Loader2, X, Minimize2, Maximize2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

// Types
interface Overview {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  epc: number;
  conversionRate: number;
  activeCampaigns: number;
  totalCampaigns: number;
}

interface DailyStat {
  date: string;
  label: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface CampaignStat {
  id: string;
  name: string;
  productName: string;
  status: string;
  budget: number;
  spent: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
  impressions: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Chart colors - warm marketing palette (no blue/indigo)
const COLORS = ['#e94560', '#0f3460', '#533483', '#f97316', '#eab308', '#22c55e'];
const CHART_BG = '#0f0f23';
const CHART_GRID = 'rgba(255,255,255,0.06)';

// Stat card component
function StatCard({ title, value, change, icon: Icon, prefix = '', suffix = '' }: {
  title: string; value: string | number; change?: number; icon: React.ElementType; prefix?: string; suffix?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#2a2a4a] hover:border-[#e94560]/40 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-400 font-medium">{title}</span>
            <div className="w-9 h-9 rounded-lg bg-[#e94560]/15 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-[#e94560]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </div>
          {change !== undefined && (
            <div className={`flex items-center text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {Math.abs(change).toFixed(1)}% from last period
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Chat panel component
function AiAgentPanel({ campaigns }: { campaigns: CampaignStat[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your AI Ad Agent. I can help you create ad copy, optimize campaigns, and boost your affiliate revenue. What would you like to work on today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, campaignId: campaigns[0]?.id }),
      });
      const data = await res.json();
      if (data.history) {
        setMessages(data.history);
      } else if (data.message) {
        setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: data.message }]);
      }
    } catch {
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, campaigns]);

  const quickPrompts = [
    'Generate 3 new ad headlines for my top campaign',
    'How can I improve my conversion rate?',
    'Suggest A/B test variations for my ads',
    'Which campaign should I invest more budget in?',
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#2a2a4a] rounded-2xl flex flex-col overflow-hidden ${isExpanded ? 'fixed inset-4 z-50' : 'h-[600px]'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e94560] to-[#533483] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Ad Agent</h3>
              <p className="text-xs text-zinc-400">Powered by AI</p>
            </div>
            <Badge variant="outline" className="ml-2 border-[#e94560]/40 text-[#e94560] text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" /> GPT
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hover:bg-[#2a2a4a]"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#e94560] text-white rounded-br-md'
                  : 'bg-[#0f0f23] text-zinc-200 rounded-bl-md border border-[#2a2a4a]'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#0f0f23] rounded-2xl rounded-bl-md px-4 py-3 border border-[#2a2a4a]">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Agent is thinking...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        {messages.length <= 2 && !loading && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); }}
                className="text-xs px-3 py-1.5 rounded-full border border-[#2a2a4a] text-zinc-400 hover:text-white hover:border-[#e94560]/40 hover:bg-[#e94560]/10 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-[#2a2a4a]">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask the AI Agent anything about your ads..."
              className="bg-[#0f0f23] border-[#2a2a4a] text-white placeholder:text-zinc-500 focus:border-[#e94560]/50 rounded-xl"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-[#e94560] hover:bg-[#e94560]/80 text-white rounded-xl px-4"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Campaign card component
function CampaignCard({ campaign }: { campaign: CampaignStat }) {
  const [currentStatus, setCurrentStatus] = useState(campaign.status);

  const toggleStatus = async () => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaign.id, status: newStatus }),
      });
      setCurrentStatus(newStatus);
    } catch {
      // Handle error silently
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#2a2a4a] hover:border-[#e94560]/30 transition-all hover:shadow-lg hover:shadow-[#e94560]/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">{campaign.name}</h3>
            <p className="text-xs text-zinc-400">{campaign.productName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={currentStatus === 'active' ? 'default' : 'secondary'}
              className={`text-[10px] ${currentStatus === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30'}`}
            >
              {currentStatus}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#0f0f23] rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Revenue</p>
            <p className="text-lg font-bold text-emerald-400">${campaign.revenue.toFixed(2)}</p>
          </div>
          <div className="bg-[#0f0f23] rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Clicks</p>
            <p className="text-lg font-bold text-white">{campaign.clicks.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Budget Used</span>
            <span className="text-zinc-300">${campaign.spent.toFixed(0)} / ${campaign.budget.toFixed(0)}</span>
          </div>
          <Progress value={(campaign.spent / campaign.budget) * 100} className="h-1.5 bg-[#0f0f23]" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs">
            <span className="text-zinc-400">
              <span className="text-white font-medium">{campaign.conversions}</span> conversions
            </span>
            <span className="text-zinc-400">
              ROI: <span className={`font-medium ${campaign.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{campaign.roi.toFixed(1)}%</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleStatus}
            className="text-xs h-7 text-zinc-400 hover:text-white"
          >
            {currentStatus === 'active' ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main page component
export default function Home() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignStat[]>([]);
  const [devices, setDevices] = useState<{ name: string; value: number }[]>([]);
  const [countries, setCountries] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics');
        const data = await res.json();
        setOverview(data.overview);
        setDailyStats(data.dailyStats);
        setCampaigns(data.campaigns);
        setDevices(data.devices);
        setCountries(data.countries);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#e94560] animate-spin" />
          <p className="text-zinc-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a3e] bg-[#0a0a1a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e94560] to-[#533483] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              Affiliate<span className="text-[#e94560]">Pilot</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] hidden sm:flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </Badge>
            <Button variant="outline" className="border-[#2a2a4a] text-zinc-300 hover:bg-[#1a1a2e] hover:text-white text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Campaign
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Stats overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Revenue"
            value={`$${(overview?.totalRevenue || 0).toFixed(2)}`}
            change={12.5}
            icon={DollarSign}
          />
          <StatCard
            title="Total Clicks"
            value={overview?.totalClicks || 0}
            change={8.3}
            icon={MousePointerClick}
          />
          <StatCard
            title="Conversions"
            value={overview?.totalConversions || 0}
            change={15.2}
            icon={Target}
          />
          <StatCard
            title="EPC (Earnings/Click)"
            value={`$${(overview?.epc || 0).toFixed(2)}`}
            change={-2.1}
            icon={TrendingUp}
          />
        </div>

        {/* Main grid: Charts + AI Agent */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: Charts & Campaigns */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-[#1a1a2e] border border-[#2a2a4a]">
                <TabsTrigger value="overview" className="text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-[#0f0f23]">
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-[#0f0f23]">
                  <Target className="w-3.5 h-3.5 mr-1.5" /> Campaigns
                </TabsTrigger>
                <TabsTrigger value="audience" className="text-zinc-400 data-[state=active]:text-white data-[state=active]:bg-[#0f0f23]">
                  <Globe className="w-3.5 h-3.5 mr-1.5" /> Audience
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-6">
                {/* Revenue & Clicks Chart */}
                <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#2a2a4a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-white">Revenue & Performance</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">Last 14 days overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyStats} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#e94560" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#e94560" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                          <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                            labelStyle={{ color: '#a1a1aa' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#e94560" fill="url(#revenueGrad)" strokeWidth={2} name="Revenue ($)" />
                          <Area type="monotone" dataKey="clicks" stroke="#f97316" fill="url(#clicksGrad)" strokeWidth={2} name="Clicks" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversions bar chart */}
                <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#2a2a4a]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-white">Daily Conversions</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">Conversion volume over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyStats} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                          <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                          />
                          <Bar dataKey="conversions" fill="#533483" radius={[4, 4, 0, 0]} name="Conversions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="campaigns" className="mt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {campaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="audience" className="mt-4">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Device breakdown */}
                  <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#2a2a4a]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-white">Device Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={devices}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {devices.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-6 mt-2">
                        {devices.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                            {d.name} ({d.value})
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Country breakdown */}
                  <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#2a2a4a]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-white">Top Countries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mt-2">
                        {countries.map((c, i) => {
                          const maxVal = countries[0]?.value || 1;
                          return (
                            <div key={c.name} className="flex items-center gap-3">
                              <span className="text-xs text-zinc-500 w-6">{c.name}</span>
                              <div className="flex-1 h-6 bg-[#0f0f23] rounded-md overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(c.value / maxVal) * 100}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  className="h-full rounded-md"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                              </div>
                              <span className="text-xs text-zinc-300 w-12 text-right">{c.value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: AI Agent Panel */}
          <div className="space-y-6">
            <AiAgentPanel campaigns={campaigns} />

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border-[#2a2a4a]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white">Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Active Campaigns</span>
                  <span className="text-sm font-semibold text-white">{overview?.activeCampaigns} / {overview?.totalCampaigns}</span>
                </div>
                <Progress value={((overview?.activeCampaigns || 0) / (overview?.totalCampaigns || 1)) * 100} className="h-1.5 bg-[#0f0f23]" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Conversion Rate</span>
                  <span className="text-sm font-semibold text-emerald-400">{overview?.conversionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Avg EPC</span>
                  <span className="text-sm font-semibold text-[#e94560]">${overview?.epc}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a3e] mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-zinc-500">
          <span>AffiliatePilot - AI-Powered Affiliate Marketing</span>
          <span>Real-time analytics</span>
        </div>
      </footer>
    </div>
  );
}