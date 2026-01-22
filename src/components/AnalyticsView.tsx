
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    Bug,
    Target,
    Clock,
    Award,
    BarChart3,
    PieChartIcon,
    Calendar,
    Percent,
    Trophy,
    Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BugData {
    id: string;
    title: string;
    severity: string;
    status: string;
    bounty_amount: number | null;
    created_at: string;
    submission_date: string | null;
    resolution_date: string | null;
    program_id: string | null;
    programs?: {
        target_name: string;
        company: string;
        platforms?: {
            name: string;
        };
    };
}

interface AnalyticsStats {
    totalBugs: number;
    totalEarnings: number;
    acceptedBugs: number;
    rejectedBugs: number;
    pendingBugs: number;
    successRate: number;
    avgBounty: number;
    avgTimeToResolution: number;
    thisMonthEarnings: number;
    lastMonthEarnings: number;
    thisYearEarnings: number;
    lastYearEarnings: number;
}

interface MonthlyData {
    month: string;
    earnings: number;
    submissions: number;
    accepted: number;
}

interface SeverityData {
    name: string;
    value: number;
    color: string;
}

interface StatusData {
    name: string;
    value: number;
    color: string;
}

interface PlatformData {
    name: string;
    bugs: number;
    earnings: number;
    successRate: number;
}

interface ProgramData {
    name: string;
    company: string;
    bugs: number;
    earnings: number;
    successRate: number;
}

const SEVERITY_COLORS: Record<string, string> = {
    'Critical': '#ef4444',
    'High': '#f97316',
    'Medium': '#eab308',
    'Low': '#22c55e',
    'Informational': '#3b82f6'
};

const STATUS_COLORS: Record<string, string> = {
    'Draft': '#6b7280',
    'Submitted': '#eab308',
    'Triaged': '#3b82f6',
    'Accepted': '#22c55e',
    'Duplicate': '#a855f7',
    'Not Applicable': '#ef4444',
    'Resolved': '#10b981',
    'Bounty Awarded': '#14b8a6'
};

export function AnalyticsView() {
    const [bugs, setBugs] = useState<BugData[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'all' | 'year' | 'month' | '6months'>('all');
    const [stats, setStats] = useState<AnalyticsStats>({
        totalBugs: 0,
        totalEarnings: 0,
        acceptedBugs: 0,
        rejectedBugs: 0,
        pendingBugs: 0,
        successRate: 0,
        avgBounty: 0,
        avgTimeToResolution: 0,
        thisMonthEarnings: 0,
        lastMonthEarnings: 0,
        thisYearEarnings: 0,
        lastYearEarnings: 0
    });
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [severityData, setSeverityData] = useState<SeverityData[]>([]);
    const [statusData, setStatusData] = useState<StatusData[]>([]);
    const [platformData, setPlatformData] = useState<PlatformData[]>([]);
    const [topPrograms, setTopPrograms] = useState<ProgramData[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: bugsData, error } = await supabase
                .from('bugs')
                .select(`
          *,
          programs (
            target_name,
            company,
            platforms (
              name
            )
          )
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching bugs:', error);
                toast({
                    title: "Error",
                    description: "Failed to fetch analytics data",
                    variant: "destructive"
                });
                return;
            }

            const allBugs = bugsData || [];
            setBugs(allBugs);

            // Filter bugs based on time range
            const filteredBugs = filterBugsByTimeRange(allBugs, timeRange);

            // Calculate all analytics
            calculateStats(filteredBugs, allBugs);
            calculateMonthlyData(filteredBugs);
            calculateSeverityData(filteredBugs);
            calculateStatusData(filteredBugs);
            calculatePlatformData(filteredBugs);
            calculateTopPrograms(filteredBugs);

        } catch (error) {
            console.error('Error:', error);
            toast({
                title: "Error",
                description: "Failed to fetch analytics data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const filterBugsByTimeRange = (bugs: BugData[], range: string): BugData[] => {
        const now = new Date();
        let startDate: Date;

        switch (range) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case '6months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return bugs;
        }

        return bugs.filter(bug => new Date(bug.created_at) >= startDate);
    };

    const calculateStats = (filteredBugs: BugData[], allBugs: BugData[]) => {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const thisYearStart = new Date(now.getFullYear(), 0, 1);
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

        const totalEarnings = filteredBugs.reduce((sum, bug) => sum + (bug.bounty_amount || 0), 0);

        const acceptedStatuses = ['Accepted', 'Resolved', 'Bounty Awarded'];
        const rejectedStatuses = ['Duplicate', 'Not Applicable'];
        const pendingStatuses = ['Draft', 'Submitted', 'Triaged'];

        const acceptedBugs = filteredBugs.filter(bug => acceptedStatuses.includes(bug.status)).length;
        const rejectedBugs = filteredBugs.filter(bug => rejectedStatuses.includes(bug.status)).length;
        const pendingBugs = filteredBugs.filter(bug => pendingStatuses.includes(bug.status)).length;

        const resolvedBugs = filteredBugs.filter(bug =>
            acceptedStatuses.includes(bug.status) || rejectedStatuses.includes(bug.status)
        );
        const successRate = resolvedBugs.length > 0
            ? (acceptedBugs / resolvedBugs.length) * 100
            : 0;

        const bugsWithBounty = filteredBugs.filter(bug => bug.bounty_amount && bug.bounty_amount > 0);
        const avgBounty = bugsWithBounty.length > 0
            ? totalEarnings / bugsWithBounty.length
            : 0;

        // Calculate average time to resolution
        const bugsWithResolution = filteredBugs.filter(bug =>
            bug.submission_date && bug.resolution_date
        );
        let avgTimeToResolution = 0;
        if (bugsWithResolution.length > 0) {
            const totalDays = bugsWithResolution.reduce((sum, bug) => {
                const submissionDate = new Date(bug.submission_date!);
                const resolutionDate = new Date(bug.resolution_date!);
                const days = Math.ceil((resolutionDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
            }, 0);
            avgTimeToResolution = totalDays / bugsWithResolution.length;
        }

        // Time-based earnings
        const thisMonthEarnings = allBugs
            .filter(bug => new Date(bug.created_at) >= thisMonthStart)
            .reduce((sum, bug) => sum + (bug.bounty_amount || 0), 0);

        const lastMonthEarnings = allBugs
            .filter(bug => {
                const date = new Date(bug.created_at);
                return date >= lastMonthStart && date <= lastMonthEnd;
            })
            .reduce((sum, bug) => sum + (bug.bounty_amount || 0), 0);

        const thisYearEarnings = allBugs
            .filter(bug => new Date(bug.created_at) >= thisYearStart)
            .reduce((sum, bug) => sum + (bug.bounty_amount || 0), 0);

        const lastYearEarnings = allBugs
            .filter(bug => {
                const date = new Date(bug.created_at);
                return date >= lastYearStart && date <= lastYearEnd;
            })
            .reduce((sum, bug) => sum + (bug.bounty_amount || 0), 0);

        setStats({
            totalBugs: filteredBugs.length,
            totalEarnings,
            acceptedBugs,
            rejectedBugs,
            pendingBugs,
            successRate,
            avgBounty,
            avgTimeToResolution,
            thisMonthEarnings,
            lastMonthEarnings,
            thisYearEarnings,
            lastYearEarnings
        });
    };

    const calculateMonthlyData = (bugs: BugData[]) => {
        const monthlyMap: Record<string, MonthlyData> = {};
        const now = new Date();

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            monthlyMap[key] = { month: key, earnings: 0, submissions: 0, accepted: 0 };
        }

        const acceptedStatuses = ['Accepted', 'Resolved', 'Bounty Awarded'];

        bugs.forEach(bug => {
            const date = new Date(bug.created_at);
            const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

            if (monthlyMap[key]) {
                monthlyMap[key].submissions += 1;
                monthlyMap[key].earnings += bug.bounty_amount || 0;
                if (acceptedStatuses.includes(bug.status)) {
                    monthlyMap[key].accepted += 1;
                }
            }
        });

        setMonthlyData(Object.values(monthlyMap));
    };

    const calculateSeverityData = (bugs: BugData[]) => {
        const severityCounts: Record<string, number> = {};

        bugs.forEach(bug => {
            severityCounts[bug.severity] = (severityCounts[bug.severity] || 0) + 1;
        });

        const data: SeverityData[] = Object.entries(severityCounts).map(([name, value]) => ({
            name,
            value,
            color: SEVERITY_COLORS[name] || '#6b7280'
        }));

        setSeverityData(data);
    };

    const calculateStatusData = (bugs: BugData[]) => {
        const statusCounts: Record<string, number> = {};

        bugs.forEach(bug => {
            statusCounts[bug.status] = (statusCounts[bug.status] || 0) + 1;
        });

        const data: StatusData[] = Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value,
            color: STATUS_COLORS[name] || '#6b7280'
        }));

        setStatusData(data);
    };

    const calculatePlatformData = (bugs: BugData[]) => {
        const platformMap: Record<string, { bugs: number; earnings: number; accepted: number; total: number }> = {};
        const acceptedStatuses = ['Accepted', 'Resolved', 'Bounty Awarded'];
        const resolvedStatuses = [...acceptedStatuses, 'Duplicate', 'Not Applicable'];

        bugs.forEach(bug => {
            const platformName = bug.programs?.platforms?.name || 'Unknown';

            if (!platformMap[platformName]) {
                platformMap[platformName] = { bugs: 0, earnings: 0, accepted: 0, total: 0 };
            }

            platformMap[platformName].bugs += 1;
            platformMap[platformName].earnings += bug.bounty_amount || 0;

            if (resolvedStatuses.includes(bug.status)) {
                platformMap[platformName].total += 1;
                if (acceptedStatuses.includes(bug.status)) {
                    platformMap[platformName].accepted += 1;
                }
            }
        });

        const data: PlatformData[] = Object.entries(platformMap)
            .map(([name, data]) => ({
                name,
                bugs: data.bugs,
                earnings: data.earnings,
                successRate: data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0
            }))
            .sort((a, b) => b.earnings - a.earnings);

        setPlatformData(data);
    };

    const calculateTopPrograms = (bugs: BugData[]) => {
        const programMap: Record<string, { company: string; bugs: number; earnings: number; accepted: number; total: number }> = {};
        const acceptedStatuses = ['Accepted', 'Resolved', 'Bounty Awarded'];
        const resolvedStatuses = [...acceptedStatuses, 'Duplicate', 'Not Applicable'];

        bugs.forEach(bug => {
            const programName = bug.programs?.target_name || 'Unknown';
            const company = bug.programs?.company || 'Unknown';

            if (!programMap[programName]) {
                programMap[programName] = { company, bugs: 0, earnings: 0, accepted: 0, total: 0 };
            }

            programMap[programName].bugs += 1;
            programMap[programName].earnings += bug.bounty_amount || 0;

            if (resolvedStatuses.includes(bug.status)) {
                programMap[programName].total += 1;
                if (acceptedStatuses.includes(bug.status)) {
                    programMap[programName].accepted += 1;
                }
            }
        });

        const data: ProgramData[] = Object.entries(programMap)
            .map(([name, data]) => ({
                name,
                company: data.company,
                bugs: data.bugs,
                earnings: data.earnings,
                successRate: data.total > 0 ? Math.round((data.accepted / data.total) * 100) : 0
            }))
            .sort((a, b) => b.earnings - a.earnings)
            .slice(0, 5);

        setTopPrograms(data);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getPercentageChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-cyan-400" />
                        Analytics & Reporting
                    </h1>
                    <p className="text-gray-400 mt-1">Track your bug bounty performance and earnings</p>
                </div>
                <Select value={timeRange} onValueChange={(value: 'all' | 'year' | 'month' | '6months') => setTimeRange(value)}>
                    <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="6months">Last 6 Months</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-200">Total Earnings</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalEarnings)}</p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-300 mr-1" />
                                    <span className="text-xs text-green-300">
                                        {getPercentageChange(stats.thisMonthEarnings, stats.lastMonthEarnings)}% vs last month
                                    </span>
                                </div>
                            </div>
                            <DollarSign className="h-10 w-10 text-green-400 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-200">Total Bugs</p>
                                <p className="text-2xl font-bold text-white">{stats.totalBugs}</p>
                                <div className="flex items-center mt-1 gap-2">
                                    <Badge className="bg-green-600 text-xs">{stats.acceptedBugs} accepted</Badge>
                                    <Badge className="bg-yellow-600 text-xs">{stats.pendingBugs} pending</Badge>
                                </div>
                            </div>
                            <Bug className="h-10 w-10 text-blue-400 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-200">Success Rate</p>
                                <p className="text-2xl font-bold text-white">{stats.successRate.toFixed(1)}%</p>
                                <div className="flex items-center mt-1">
                                    <Target className="h-3 w-3 text-purple-300 mr-1" />
                                    <span className="text-xs text-purple-300">
                                        {stats.acceptedBugs} of {stats.acceptedBugs + stats.rejectedBugs} resolved
                                    </span>
                                </div>
                            </div>
                            <Percent className="h-10 w-10 text-purple-400 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-900 to-orange-800 border-orange-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-orange-200">Avg Bounty</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(stats.avgBounty)}</p>
                                <div className="flex items-center mt-1">
                                    <Clock className="h-3 w-3 text-orange-300 mr-1" />
                                    <span className="text-xs text-orange-300">
                                        ~{Math.round(stats.avgTimeToResolution)} days to resolve
                                    </span>
                                </div>
                            </div>
                            <Award className="h-10 w-10 text-orange-400 opacity-80" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Time Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">This Month</p>
                                <p className="text-xl font-bold text-white">{formatCurrency(stats.thisMonthEarnings)}</p>
                            </div>
                            <Badge className={stats.thisMonthEarnings >= stats.lastMonthEarnings ? "bg-green-600" : "bg-red-600"}>
                                {getPercentageChange(stats.thisMonthEarnings, stats.lastMonthEarnings)}%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Last Month</p>
                                <p className="text-xl font-bold text-white">{formatCurrency(stats.lastMonthEarnings)}</p>
                            </div>
                            <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">This Year</p>
                                <p className="text-xl font-bold text-white">{formatCurrency(stats.thisYearEarnings)}</p>
                            </div>
                            <Badge className={stats.thisYearEarnings >= stats.lastYearEarnings ? "bg-green-600" : "bg-red-600"}>
                                {getPercentageChange(stats.thisYearEarnings, stats.lastYearEarnings)}%
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">Last Year</p>
                                <p className="text-xl font-bold text-white">{formatCurrency(stats.lastYearEarnings)}</p>
                            </div>
                            <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Earnings Chart */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-400" />
                            Monthly Earnings & Submissions
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Track your earnings and submissions over time
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="earnings"
                                    stroke="#22c55e"
                                    fill="#22c55e"
                                    fillOpacity={0.3}
                                    name="Earnings ($)"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="submissions"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6' }}
                                    name="Submissions"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Platform Performance Chart */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-400" />
                            Platform Performance
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Compare your performance across platforms
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={platformData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #374151',
                                        borderRadius: '8px'
                                    }}
                                    labelStyle={{ color: '#fff' }}
                                    formatter={(value: number, name: string) => {
                                        if (name === 'earnings') return [formatCurrency(value), 'Earnings'];
                                        return [value, name];
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="bugs" fill="#3b82f6" name="Bugs" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="earnings" fill="#22c55e" name="Earnings" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Severity Distribution */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-red-400" />
                            Severity Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {severityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={severityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {severityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[250px] text-gray-400">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Breakdown */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-blue-400" />
                            Status Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[250px] text-gray-400">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Programs */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-400" />
                            Top Programs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topPrograms.length > 0 ? (
                            <div className="space-y-3">
                                {topPrograms.map((program, index) => (
                                    <div key={program.name} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                    index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                                                } text-black`}>
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="text-white text-sm font-medium">{program.name}</p>
                                                <p className="text-gray-400 text-xs">{program.company}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-400 font-medium">{formatCurrency(program.earnings)}</p>
                                            <p className="text-gray-400 text-xs">{program.bugs} bugs • {program.successRate}% success</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[250px] text-gray-400">
                                No programs yet
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Severity Earnings Breakdown */}
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        Average Bounty by Severity
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        See how severity impacts your bounty amounts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {['Critical', 'High', 'Medium', 'Low', 'Informational'].map(severity => {
                            const severityBugs = bugs.filter(b => b.severity === severity && b.bounty_amount && b.bounty_amount > 0);
                            const avgAmount = severityBugs.length > 0
                                ? severityBugs.reduce((sum, b) => sum + (b.bounty_amount || 0), 0) / severityBugs.length
                                : 0;
                            const count = bugs.filter(b => b.severity === severity).length;

                            return (
                                <div
                                    key={severity}
                                    className="p-4 rounded-lg text-center"
                                    style={{ backgroundColor: `${SEVERITY_COLORS[severity]}20`, borderColor: SEVERITY_COLORS[severity], borderWidth: 1 }}
                                >
                                    <Badge style={{ backgroundColor: SEVERITY_COLORS[severity] }} className="mb-2">
                                        {severity}
                                    </Badge>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(avgAmount)}</p>
                                    <p className="text-sm text-gray-400">{count} bugs</p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
