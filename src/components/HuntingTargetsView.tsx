
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Plus,
    ExternalLink,
    Edit,
    Trash2,
    Target,
    Bug,
    Search,
    Globe,
    FileText,
    Upload,
    Eye,
    Clock,
    CheckCircle,
    AlertTriangle,
    XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HuntingTarget {
    id: string;
    target_name: string;
    company: string;
    scope: string;
    program_url: string | null;
    platform_id: string | null;
    min_bounty: number | null;
    max_bounty: number | null;
    program_type: string | null;
    is_active: boolean;
    created_at: string;
    platforms?: {
        name: string;
    };
    bugs?: BugSummary[];
}

interface BugSummary {
    id: string;
    title: string;
    severity: string;
    status: string;
    bounty_amount: number | null;
    created_at: string;
}

interface Platform {
    id: string;
    name: string;
}

const BUG_STATUSES = [
    'Draft',
    'Submitted',
    'New',
    'Triaged',
    'Need More Info',
    'Accepted',
    'Duplicate',
    'Informative',
    'Not Applicable',
    'Resolved',
    'Bounty Awarded'
];

export function HuntingTargetsView() {
    const [targets, setTargets] = useState<HuntingTarget[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingTarget, setEditingTarget] = useState<HuntingTarget | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<HuntingTarget | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlatform, setFilterPlatform] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        scope: '',
        program_url: '',
        platform_id: '',
        min_bounty: 0,
        max_bounty: 0,
        program_type: 'Public Bug Bounty Programs'
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch platforms
            const { data: platformsData } = await supabase
                .from('platforms')
                .select('id, name')
                .order('name');

            setPlatforms(platformsData || []);

            // Fetch programs with their bugs
            const { data: programsData, error } = await supabase
                .from('programs')
                .select(`
          *,
          platforms (name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch bugs for each program
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: bugsData } = await supabase
                .from('bugs')
                .select('id, title, severity, status, bounty_amount, created_at, program_id')
                .eq('user_id', user.id);

            // Map bugs to programs
            const targetsWithBugs = programsData?.map(program => ({
                ...program,
                bugs: bugsData?.filter(bug => bug.program_id === program.id) || []
            })) || [];

            setTargets(targetsWithBugs);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error",
                description: "Failed to fetch hunting targets",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { name, ...rest } = formData;
            const programData = {
                ...rest,
                target_name: name,
                platform_id: formData.platform_id || null,
                is_active: true
            };

            if (editingTarget) {
                const { error } = await supabase
                    .from('programs')
                    .update(programData)
                    .eq('id', editingTarget.id);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Hunting target updated successfully"
                });
            } else {
                const { error } = await supabase
                    .from('programs')
                    .insert(programData);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Hunting target added successfully"
                });
            }

            resetForm();
            fetchData();
        } catch (error: any) {
            console.error('Error saving target:', error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('programs')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Hunting target deleted successfully"
            });

            fetchData();
        } catch (error: any) {
            console.error('Error deleting target:', error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleEdit = (target: HuntingTarget) => {
        setEditingTarget(target);
        setFormData({
            name: target.target_name,
            company: target.company,
            scope: target.scope,
            program_url: target.program_url || '',
            platform_id: target.platform_id || '',
            min_bounty: target.min_bounty || 0,
            max_bounty: target.max_bounty || 0,
            program_type: target.program_type || 'Public Bug Bounty Programs'
        });
        setShowModal(true);
    };

    const handleViewDetails = (target: HuntingTarget) => {
        setSelectedTarget(target);
        setShowDetailModal(true);
    };

    const handleScopeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                setFormData(prev => ({ ...prev, scope: content }));
            };
            reader.readAsText(file);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            company: '',
            scope: '',
            program_url: '',
            platform_id: '',
            min_bounty: 0,
            max_bounty: 0,
            program_type: 'Public Bug Bounty Programs'
        });
        setEditingTarget(null);
        setShowModal(false);
    };

    const filteredTargets = targets.filter(target => {
        const matchesSearch =
            target.target_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            target.company.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlatform = filterPlatform === 'all' || target.platform_id === filterPlatform;
        return matchesSearch && matchesPlatform;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Accepted':
            case 'Resolved':
            case 'Bounty Awarded':
                return <CheckCircle className="h-4 w-4 text-green-400" />;
            case 'Triaged':
            case 'New':
                return <Clock className="h-4 w-4 text-yellow-400" />;
            case 'Need More Info':
                return <AlertTriangle className="h-4 w-4 text-orange-400" />;
            case 'Duplicate':
            case 'Not Applicable':
            case 'Informative':
                return <XCircle className="h-4 w-4 text-red-400" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Accepted':
            case 'Resolved':
            case 'Bounty Awarded':
                return 'bg-green-600';
            case 'Triaged':
                return 'bg-blue-600';
            case 'New':
            case 'Submitted':
                return 'bg-yellow-600';
            case 'Need More Info':
                return 'bg-orange-600';
            case 'Duplicate':
                return 'bg-purple-600';
            case 'Informative':
                return 'bg-cyan-600';
            case 'Not Applicable':
                return 'bg-red-600';
            case 'Draft':
                return 'bg-gray-600';
            default:
                return 'bg-gray-600';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical': return 'bg-red-600';
            case 'High': return 'bg-orange-600';
            case 'Medium': return 'bg-yellow-600';
            case 'Low': return 'bg-green-600';
            case 'Informational': return 'bg-blue-600';
            default: return 'bg-gray-600';
        }
    };

    const getBugStats = (bugs: BugSummary[]) => {
        const total = bugs.length;
        const accepted = bugs.filter(b => ['Accepted', 'Resolved', 'Bounty Awarded'].includes(b.status)).length;
        const pending = bugs.filter(b => ['Submitted', 'New', 'Triaged'].includes(b.status)).length;
        const totalBounty = bugs.reduce((sum, b) => sum + (b.bounty_amount || 0), 0);
        return { total, accepted, pending, totalBounty };
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white">Loading hunting targets...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Target className="h-8 w-8 text-cyan-400" />
                        My Hunting Targets
                    </h1>
                    <p className="text-gray-400 mt-1">Track programs you're hunting and their submitted bugs</p>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="bg-cyan-600 hover:bg-cyan-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Target
                </Button>
            </div>

            {/* Filters */}
            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search targets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                            <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue placeholder="All Platforms" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="all">All Platforms</SelectItem>
                                {platforms.map(platform => (
                                    <SelectItem key={platform.id} value={platform.id}>
                                        {platform.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="text-gray-400 flex items-center">
                            <span>{filteredTargets.length} targets found</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Targets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTargets.map(target => {
                    const bugStats = getBugStats(target.bugs || []);

                    return (
                        <Card key={target.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <Globe className="h-5 w-5 text-blue-400" />
                                            {target.target_name}
                                        </CardTitle>
                                        <CardDescription className="text-gray-400 mt-1">
                                            {target.company}
                                            {target.platforms?.name && (
                                                <Badge variant="outline" className="ml-2 border-gray-600 text-gray-300">
                                                    {target.platforms.name}
                                                </Badge>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        {target.program_url && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => window.open(target.program_url!, '_blank')}
                                                className="text-gray-400 hover:text-white"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleViewDetails(target)}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit(target)}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(target.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Bug Stats */}
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                                        <p className="text-2xl font-bold text-white">{bugStats.total}</p>
                                        <p className="text-xs text-gray-400">Submitted</p>
                                    </div>
                                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                                        <p className="text-2xl font-bold text-green-400">{bugStats.accepted}</p>
                                        <p className="text-xs text-gray-400">Accepted</p>
                                    </div>
                                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                                        <p className="text-2xl font-bold text-yellow-400">{bugStats.pending}</p>
                                        <p className="text-xs text-gray-400">Pending</p>
                                    </div>
                                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                                        <p className="text-lg font-bold text-green-400">{formatCurrency(bugStats.totalBounty)}</p>
                                        <p className="text-xs text-gray-400">Earned</p>
                                    </div>
                                </div>

                                {/* Bounty Range */}
                                {(target.min_bounty || target.max_bounty) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-400">Bounty Range:</span>
                                        <span className="text-green-400 font-medium">
                                            {target.min_bounty ? formatCurrency(target.min_bounty) : '$0'} - {target.max_bounty ? formatCurrency(target.max_bounty) : 'N/A'}
                                        </span>
                                    </div>
                                )}

                                {/* Recent Bugs */}
                                {target.bugs && target.bugs.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-400 font-medium">Recent Submissions:</p>
                                        {target.bugs.slice(0, 3).map(bug => (
                                            <div key={bug.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {getStatusIcon(bug.status)}
                                                    <span className="text-white text-sm truncate">{bug.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`${getSeverityColor(bug.severity)} text-xs`}>
                                                        {bug.severity}
                                                    </Badge>
                                                    <Badge className={`${getStatusColor(bug.status)} text-xs`}>
                                                        {bug.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                        {target.bugs.length > 3 && (
                                            <p className="text-xs text-gray-500">+{target.bugs.length - 3} more bugs...</p>
                                        )}
                                    </div>
                                )}

                                {(!target.bugs || target.bugs.length === 0) && (
                                    <div className="text-center py-4 text-gray-500">
                                        <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No bugs submitted yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredTargets.length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                        <Target className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-lg text-gray-400">No hunting targets found</p>
                        <p className="text-sm text-gray-500 mt-2">Add your first target to start tracking</p>
                        <Button
                            onClick={() => setShowModal(true)}
                            className="mt-4 bg-cyan-600 hover:bg-cyan-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Target
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Add/Edit Target Modal */}
            <Dialog open={showModal} onOpenChange={resetForm}>
                <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTarget ? 'Edit Hunting Target' : 'Add New Hunting Target'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Program / Target Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value, company: e.target.value })}
                                className="bg-gray-700 border-gray-600"
                                placeholder="e.g., Tesla Bug Bounty, Google VRP, Client XYZ"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Platform</Label>
                                <Select value={formData.platform_id} onValueChange={(value) => setFormData({ ...formData, platform_id: value })}>
                                    <SelectTrigger className="bg-gray-700 border-gray-600">
                                        <SelectValue placeholder="Select platform (optional)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-700 border-gray-600">
                                        {platforms.map(platform => (
                                            <SelectItem key={platform.id} value={platform.id}>
                                                {platform.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Program Type</Label>
                                <Select value={formData.program_type} onValueChange={(value) => setFormData({ ...formData, program_type: value })}>
                                    <SelectTrigger className="bg-gray-700 border-gray-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-700 border-gray-600">
                                        <SelectItem value="Public Bug Bounty Programs">Public Bug Bounty</SelectItem>
                                        <SelectItem value="Private">Private Program</SelectItem>
                                        <SelectItem value="VDP">VDP (No Bounty)</SelectItem>
                                        <SelectItem value="Pentest">Pentest / External</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Program URL</Label>
                            <Input
                                type="url"
                                value={formData.program_url}
                                onChange={(e) => setFormData({ ...formData, program_url: e.target.value })}
                                className="bg-gray-700 border-gray-600"
                                placeholder="https://hackerone.com/company"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Scope</Label>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="scope-file" className="cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                                        <Upload className="h-4 w-4" />
                                        Import from file
                                    </Label>
                                    <input
                                        id="scope-file"
                                        type="file"
                                        accept=".txt,.md"
                                        onChange={handleScopeFileUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                            <Textarea
                                value={formData.scope}
                                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                className="bg-gray-700 border-gray-600 font-mono text-sm"
                                rows={6}
                                placeholder="*.example.com&#10;api.example.com&#10;app.example.com"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Enter scope domains/assets, one per line</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Min Bounty ($)</Label>
                                <Input
                                    type="number"
                                    value={formData.min_bounty}
                                    onChange={(e) => setFormData({ ...formData, min_bounty: parseFloat(e.target.value) || 0 })}
                                    className="bg-gray-700 border-gray-600"
                                />
                            </div>
                            <div>
                                <Label>Max Bounty ($)</Label>
                                <Input
                                    type="number"
                                    value={formData.max_bounty}
                                    onChange={(e) => setFormData({ ...formData, max_bounty: parseFloat(e.target.value) || 0 })}
                                    className="bg-gray-700 border-gray-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={resetForm} className="border-gray-500 text-white bg-gray-700 hover:bg-gray-600">
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                                {editingTarget ? 'Update Target' : 'Add Target'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Target Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={() => setShowDetailModal(false)}>
                <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-cyan-400" />
                            {selectedTarget?.target_name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedTarget && (
                        <Tabs defaultValue="scope" className="w-full">
                            <TabsList className="bg-gray-700">
                                <TabsTrigger value="scope">Scope</TabsTrigger>
                                <TabsTrigger value="bugs">Bugs ({selectedTarget.bugs?.length || 0})</TabsTrigger>
                                <TabsTrigger value="info">Info</TabsTrigger>
                            </TabsList>

                            <TabsContent value="scope" className="mt-4">
                                <Card className="bg-gray-700 border-gray-600">
                                    <CardHeader>
                                        <CardTitle className="text-white text-sm flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Program Scope
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono">
                                            {selectedTarget.scope || 'No scope defined'}
                                        </pre>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="bugs" className="mt-4 space-y-3">
                                {selectedTarget.bugs && selectedTarget.bugs.length > 0 ? (
                                    selectedTarget.bugs.map(bug => (
                                        <Card key={bug.id} className="bg-gray-700 border-gray-600">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {getStatusIcon(bug.status)}
                                                        <div>
                                                            <p className="text-white font-medium">{bug.title}</p>
                                                            <p className="text-gray-400 text-sm">
                                                                {new Date(bug.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={getSeverityColor(bug.severity)}>
                                                            {bug.severity}
                                                        </Badge>
                                                        <Badge className={getStatusColor(bug.status)}>
                                                            {bug.status}
                                                        </Badge>
                                                        {bug.bounty_amount && bug.bounty_amount > 0 && (
                                                            <span className="text-green-400 font-medium">
                                                                {formatCurrency(bug.bounty_amount)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No bugs submitted for this target yet</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="info" className="mt-4">
                                <Card className="bg-gray-700 border-gray-600">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-gray-400 text-sm">Company</p>
                                                <p className="text-white">{selectedTarget.company}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm">Platform</p>
                                                <p className="text-white">{selectedTarget.platforms?.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm">Program Type</p>
                                                <p className="text-white">{selectedTarget.program_type || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm">Bounty Range</p>
                                                <p className="text-green-400">
                                                    {selectedTarget.min_bounty ? formatCurrency(selectedTarget.min_bounty) : '$0'} - {selectedTarget.max_bounty ? formatCurrency(selectedTarget.max_bounty) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedTarget.program_url && (
                                            <div>
                                                <p className="text-gray-400 text-sm">Program URL</p>
                                                <a
                                                    href={selectedTarget.program_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                                >
                                                    {selectedTarget.program_url}
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
