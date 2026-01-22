
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Bug, Edit, Trash2, Eye } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { BugReportModal } from './BugReportModal';
import { BugDetailsModal } from './BugDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BugReport {
  id: string;
  title: string;
  platform?: string;
  program?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  status: 'Draft' | 'Submitted' | 'Triaged' | 'Duplicate' | 'Informative' | 'Not Applicable' | 'Resolved';
  created_at: string;
  bounty_amount?: number;
  program_id?: string;
  vulnerability_type?: string;
  description?: string;
  poc_steps?: string;
  impact_description?: string;
  remediation_suggestion?: string;
  submission_date?: string;
  collaborators?: { name: string; percentage: number }[];
  programs?: {
    target_name: string;
    company: string;
    platforms?: {
      name: string;
    };
  };
}

export function BugReportsView() {
  const { theme } = useTheme();
  const isHackerTheme = theme === 'hacker';
  const { toast } = useToast();

  const [reports, setReports] = useState<BugReport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<BugReport | null>(null);
  const [viewingReport, setViewingReport] = useState<BugReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBugReports();
  }, []);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: bugs, error } = await supabase
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
        console.error('Error fetching bug reports:', error);
        toast({
          title: "Error",
          description: "Failed to fetch bug reports",
          variant: "destructive"
        });
        return;
      }

      const formattedReports: BugReport[] = bugs?.map(bug => ({
        id: bug.id,
        title: bug.title,
        platform: bug.programs?.platforms?.name || 'Unknown',
        program: bug.programs ? `${bug.programs.company || bug.programs.target_name} - ${bug.programs.target_name}` : 'Unknown',
        severity: bug.severity,
        status: bug.status,
        created_at: bug.created_at,
        bounty_amount: bug.bounty_amount,
        program_id: bug.program_id,
        vulnerability_type: bug.vulnerability_type,
        description: bug.description,
        poc_steps: bug.poc_steps,
        impact_description: bug.impact_description,
        remediation_suggestion: bug.remediation_suggestion,
        submission_date: bug.submission_date,
        collaborators: bug.collaborators || [],
        programs: bug.programs
      })) || [];

      setReports(formattedReports);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bug reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // HackerOne-style severity colors
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return isHackerTheme ? 'bg-red-800 text-red-200' : 'bg-red-700 text-white';
      case 'High': return isHackerTheme ? 'bg-orange-800 text-orange-200' : 'bg-orange-600 text-white';
      case 'Medium': return isHackerTheme ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-600 text-black';
      case 'Low': return isHackerTheme ? 'bg-green-800 text-green-200' : 'bg-green-600 text-white';
      case 'Informational': return isHackerTheme ? 'bg-blue-800 text-blue-200' : 'bg-blue-500 text-white';
      default: return isHackerTheme ? 'bg-gray-800 text-gray-200' : 'bg-gray-500 text-white';
    }
  };

  // HackerOne-style status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return isHackerTheme ? 'bg-green-700 text-green-100' : 'bg-green-600 text-white';
      case 'Triaged': return isHackerTheme ? 'bg-orange-700 text-orange-100' : 'bg-orange-500 text-white';
      case 'Submitted': return isHackerTheme ? 'bg-purple-700 text-purple-100' : 'bg-purple-600 text-white';
      case 'Draft': return isHackerTheme ? 'bg-gray-700 text-gray-200' : 'bg-gray-600 text-white';
      case 'Duplicate': return isHackerTheme ? 'bg-amber-800 text-amber-200' : 'bg-amber-700 text-white';
      case 'Informative': return isHackerTheme ? 'bg-slate-600 text-slate-200' : 'bg-slate-500 text-white';
      case 'Not Applicable': return isHackerTheme ? 'bg-red-800 text-red-200' : 'bg-red-700 text-white';
      default: return isHackerTheme ? 'bg-gray-700 text-gray-200' : 'bg-gray-600 text-white';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.program && report.program.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProgram = !filterProgram || filterProgram === 'all' || (report.program && report.program === filterProgram);
    const matchesStatus = !filterStatus || filterStatus === 'all' || report.status === filterStatus;

    return matchesSearch && matchesProgram && matchesStatus;
  });

  const uniquePrograms = [...new Set(reports.map(r => r.program).filter(Boolean))];

  const handleSaveReport = () => {
    fetchBugReports(); // Refresh the data after saving
    setIsModalOpen(false);
    setEditingReport(null);
  };

  const handleViewReport = (report: BugReport) => {
    setViewingReport(report);
    setIsDetailsModalOpen(true);
  };

  const handleEditReport = (report: BugReport) => {
    setEditingReport(report);
    setIsModalOpen(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('bugs')
        .delete()
        .eq('id', reportId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete bug report",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Bug report deleted successfully"
      });

      fetchBugReports();
    } catch (error) {
      console.error('Error deleting bug report:', error);
      toast({
        title: "Error",
        description: "Failed to delete bug report",
        variant: "destructive"
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReport(null);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setViewingReport(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className={`text-3xl font-bold ${isHackerTheme ? "text-green-400 font-mono" : "text-white"}`}>
          My Bug Reports
        </h1>
        <div className={`text-center py-8 ${isHackerTheme ? "text-green-400 font-mono" : "text-gray-400"}`}>
          Loading bug reports...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${isHackerTheme ? "text-green-400 font-mono" : "text-white"}`}>
          My Bug Reports
        </h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className={isHackerTheme ? "bg-green-600 hover:bg-green-700 text-black font-mono" : "bg-blue-600 hover:bg-blue-700"}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Filters */}
      <Card className={isHackerTheme ? "bg-black border-green-600" : "bg-gray-800 border-gray-700"}>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className={`absolute left-3 top-3 h-4 w-4 ${isHackerTheme ? "text-green-400" : "text-gray-400"}`} />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isHackerTheme ? "bg-green-950 border-green-600 text-green-400 font-mono placeholder:text-green-600" : "bg-gray-700 border-gray-600 text-white"}`}
              />
            </div>
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className={isHackerTheme ? "bg-green-950 border-green-600 text-green-400 font-mono" : "bg-gray-700 border-gray-600"}>
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent className={isHackerTheme ? "bg-black border-green-600 text-green-400 font-mono" : "bg-gray-700 border-gray-600"}>
                <SelectItem value="all">All Programs</SelectItem>
                {uniquePrograms.map(program => (
                  <SelectItem key={program} value={program || ''}>{program}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className={isHackerTheme ? "bg-green-950 border-green-600 text-green-400 font-mono" : "bg-gray-700 border-gray-600"}>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className={isHackerTheme ? "bg-black border-green-600 text-green-400 font-mono" : "bg-gray-700 border-gray-600"}>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Triaged">Triaged</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Duplicate">Duplicate</SelectItem>
                <SelectItem value="Informative">Informative</SelectItem>
                <SelectItem value="Not Applicable">Not Applicable</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterProgram('');
                setFilterStatus('');
              }}
              className={isHackerTheme ? "border-green-600 text-green-400 hover:bg-green-950 font-mono" : "border-gray-500 text-white bg-gray-700 hover:bg-gray-600"}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className={isHackerTheme ? "bg-black border-green-600" : "bg-gray-800 border-gray-700"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bug className={`h-4 w-4 ${isHackerTheme ? "text-green-400" : "text-blue-400"}`} />
                    <h3 className={`font-medium ${isHackerTheme ? "text-green-400 font-mono" : "text-white"}`}>
                      {report.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={isHackerTheme ? "text-green-300 font-mono" : "text-gray-300"}>
                      {report.platform} • {report.program}
                    </span>
                    <span className={isHackerTheme ? "text-green-500 font-mono" : "text-gray-400"}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    {report.bounty_amount && (
                      <span className={`font-medium ${isHackerTheme ? "text-green-400 font-mono" : "text-green-400"}`}>
                        ${report.bounty_amount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSeverityColor(report.severity)}>
                    {report.severity}
                  </Badge>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewReport(report)}
                      className={isHackerTheme ? "border-green-600 text-green-400 hover:bg-green-950" : "border-gray-500 text-white bg-gray-700 hover:bg-gray-600"}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditReport(report)}
                      className={isHackerTheme ? "border-green-600 text-green-400 hover:bg-green-950" : "border-gray-500 text-white bg-gray-700 hover:bg-gray-600"}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteReport(report.id)}
                      className={isHackerTheme ? "border-red-600 text-red-400 hover:bg-red-950" : "border-red-600 text-red-400 hover:bg-red-700"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && !loading && (
        <Card className={isHackerTheme ? "bg-black border-green-600" : "bg-gray-800 border-gray-700"}>
          <CardContent className="p-8 text-center">
            <Bug className={`h-12 w-12 mx-auto mb-4 ${isHackerTheme ? "text-green-600" : "text-gray-400"}`} />
            <p className={`text-lg ${isHackerTheme ? "text-green-400 font-mono" : "text-gray-400"}`}>
              No bug reports found
            </p>
            <p className={`text-sm mt-2 ${isHackerTheme ? "text-green-600 font-mono" : "text-gray-500"}`}>
              Create your first bug report to get started
            </p>
          </CardContent>
        </Card>
      )}

      <BugReportModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveReport}
        editingReport={editingReport}
      />

      <BugDetailsModal
        bug={viewingReport}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
}
