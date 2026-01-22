
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
    Search,
    Edit,
    Trash2,
    ExternalLink,
    Star,
    StarOff,
    BookOpen,
    Lightbulb,
    Link as LinkIcon,
    FileText,
    Code,
    Filter,
    X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeEntry {
    id: string;
    title: string;
    content: string | null;
    url: string | null;
    entry_type: string;
    category: string | null;
    tags: string[] | null;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}

const ENTRY_TYPES = [
    { value: 'note', label: 'Note', icon: FileText, color: 'text-purple-400' },
    { value: 'tip', label: 'Tip', icon: Lightbulb, color: 'text-yellow-400' },
    { value: 'link', label: 'Link', icon: LinkIcon, color: 'text-blue-400' },
    { value: 'payload', label: 'Payload', icon: Code, color: 'text-red-400' },
    { value: 'writeup', label: 'Writeup', icon: BookOpen, color: 'text-green-400' },
    { value: 'reference', label: 'Reference', icon: BookOpen, color: 'text-cyan-400' },
];

export function KnowledgeBaseView() {
    const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        url: '',
        entry_type: 'note',
        category: '',
        tags: ''
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('knowledge_base')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setEntries(data || []);
        } catch (error: any) {
            console.error('Error fetching entries:', error);
            toast({
                title: "Error",
                description: "Failed to fetch knowledge base entries",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const entryData = {
                user_id: user.id,
                title: formData.title,
                content: formData.content || null,
                url: formData.url || null,
                entry_type: formData.entry_type,
                category: formData.category || null,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : null
            };

            if (editingEntry) {
                const { error } = await supabase
                    .from('knowledge_base')
                    .update(entryData)
                    .eq('id', editingEntry.id);

                if (error) throw error;
                toast({ title: "Success", description: "Entry updated successfully" });
            } else {
                const { error } = await supabase
                    .from('knowledge_base')
                    .insert(entryData);

                if (error) throw error;
                toast({ title: "Success", description: "Entry created successfully" });
            }

            resetForm();
            fetchEntries();
        } catch (error: any) {
            console.error('Error saving entry:', error);
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
                .from('knowledge_base')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Success", description: "Entry deleted successfully" });
            fetchEntries();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const toggleFavorite = async (entry: KnowledgeEntry) => {
        try {
            const { error } = await supabase
                .from('knowledge_base')
                .update({ is_favorite: !entry.is_favorite })
                .eq('id', entry.id);

            if (error) throw error;
            fetchEntries();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleEdit = (entry: KnowledgeEntry) => {
        setEditingEntry(entry);
        setFormData({
            title: entry.title,
            content: entry.content || '',
            url: entry.url || '',
            entry_type: entry.entry_type,
            category: entry.category || '',
            tags: entry.tags?.join(', ') || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            url: '',
            entry_type: 'note',
            category: '',
            tags: ''
        });
        setEditingEntry(null);
        setShowModal(false);
    };

    const getTypeConfig = (type: string) => {
        return ENTRY_TYPES.find(t => t.value === type) || ENTRY_TYPES[0];
    };

    const getCategories = () => {
        const cats = new Set(entries.map(e => e.category).filter(Boolean));
        return Array.from(cats) as string[];
    };

    const filteredEntries = entries.filter(entry => {
        const matchesSearch =
            entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || entry.entry_type === filterType;
        const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
        const matchesFavorite = !showFavoritesOnly || entry.is_favorite;
        return matchesSearch && matchesType && matchesCategory && matchesFavorite;
    });

    const stats = {
        total: entries.length,
        notes: entries.filter(e => e.entry_type === 'note').length,
        tips: entries.filter(e => e.entry_type === 'tip').length,
        links: entries.filter(e => e.entry_type === 'link').length,
        favorites: entries.filter(e => e.is_favorite).length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white">Loading knowledge base...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-purple-400" />
                        Knowledge Base
                    </h1>
                    <p className="text-gray-400 mt-1">Your notes, tips, links, and payloads in one place</p>
                </div>
                <Button
                    onClick={() => setShowModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                        <p className="text-sm text-gray-400">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-purple-400">{stats.notes}</p>
                        <p className="text-sm text-gray-400">Notes</p>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-400">{stats.tips}</p>
                        <p className="text-sm text-gray-400">Tips</p>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{stats.links}</p>
                        <p className="text-sm text-gray-400">Links</p>
                    </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-orange-400">{stats.favorites}</p>
                        <p className="text-sm text-gray-400">Favorites</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search entries..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="all">All Types</SelectItem>
                                {ENTRY_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="all">All Categories</SelectItem>
                                {getCategories().map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant={showFavoritesOnly ? "default" : "outline"}
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={showFavoritesOnly ? "bg-orange-600 hover:bg-orange-700" : "border-gray-500 text-white bg-gray-700 hover:bg-gray-600"}
                        >
                            <Star className="h-4 w-4 mr-2" />
                            Favorites Only
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Entries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEntries.map(entry => {
                    const typeConfig = getTypeConfig(entry.entry_type);
                    const TypeIcon = typeConfig.icon;

                    return (
                        <Card key={entry.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <TypeIcon className={`h-5 w-5 ${typeConfig.color} flex-shrink-0`} />
                                        <CardTitle className="text-white text-base truncate">{entry.title}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => toggleFavorite(entry)}
                                            className={entry.is_favorite ? "text-orange-400 hover:text-orange-300" : "text-gray-400 hover:text-white"}
                                        >
                                            {entry.is_favorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit(entry)}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(entry.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <Badge className={`${typeConfig.color} bg-gray-700 mb-2`}>
                                    {typeConfig.label}
                                </Badge>
                                {entry.category && (
                                    <Badge variant="outline" className="ml-2 border-gray-600 text-gray-300">
                                        {entry.category}
                                    </Badge>
                                )}

                                {entry.content && (
                                    <p className="text-gray-400 text-sm mt-2 line-clamp-3">{entry.content}</p>
                                )}

                                {entry.url && (
                                    <a
                                        href={entry.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 mt-2"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Open Link
                                    </a>
                                )}

                                {entry.tags && entry.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {entry.tags.slice(0, 3).map(tag => (
                                            <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400">
                                                #{tag}
                                            </Badge>
                                        ))}
                                        {entry.tags.length > 3 && (
                                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                                                +{entry.tags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredEntries.length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-lg text-gray-400">No entries found</p>
                        <p className="text-sm text-gray-500 mt-2">Add your first note, tip, or link</p>
                        <Button
                            onClick={() => setShowModal(true)}
                            className="mt-4 bg-purple-600 hover:bg-purple-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Entry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={showModal} onOpenChange={resetForm}>
                <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEntry ? 'Edit Entry' : 'Add New Entry'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-gray-700 border-gray-600"
                                    required
                                />
                            </div>
                            <div>
                                <Label>Type</Label>
                                <Select value={formData.entry_type} onValueChange={(value) => setFormData({ ...formData, entry_type: value })}>
                                    <SelectTrigger className="bg-gray-700 border-gray-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-700 border-gray-600">
                                        {ENTRY_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Category</Label>
                            <Input
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="bg-gray-700 border-gray-600"
                                placeholder="e.g., XSS, SQLi, Recon"
                            />
                        </div>

                        {(formData.entry_type === 'link' || formData.entry_type === 'writeup') && (
                            <div>
                                <Label>URL</Label>
                                <Input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="bg-gray-700 border-gray-600"
                                    placeholder="https://..."
                                />
                            </div>
                        )}

                        <div>
                            <Label>Content</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="bg-gray-700 border-gray-600 font-mono text-sm"
                                rows={6}
                                placeholder={formData.entry_type === 'payload' ? 'Enter your payload here...' : 'Enter your notes here...'}
                            />
                        </div>

                        <div>
                            <Label>Tags (comma separated)</Label>
                            <Input
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="bg-gray-700 border-gray-600"
                                placeholder="xss, bypass, waf"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={resetForm} className="border-gray-500 text-white bg-gray-700 hover:bg-gray-600">
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                {editingEntry ? 'Update' : 'Add Entry'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
