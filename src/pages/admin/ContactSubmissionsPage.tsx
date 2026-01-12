import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Building2, MessageSquare, Eye, Archive, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabaseAuth } from '@/hooks/useAuth-local';
import { useNavigate } from 'react-router-dom';

interface ContactSubmission {
  id: string;
  full_name: string;
  company_name: string;
  business_email: string;
  phone_number: string;
  message: string;
  status: 'new' | 'read' | 'in-progress' | 'resolved' | 'archived';
  created_at: string;
  read_at?: string;
}

const ContactSubmissionsPage = () => {
  const { isAdmin, loading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, authLoading, navigate]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('perPage', '20');

      const response = await fetch(`${API_URL}/api/admin/contact-submissions?${params}`, {
        credentials: 'include',
      });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { success: false, error: await response.text() };

      if (data.success) {
        setSubmissions(data.data.data);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, searchQuery, page]);

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/contact-submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSubmissions(submissions.map(s =>
          s.id === submissionId ? { ...s, status: newStatus as any } : s
        ));
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission({ ...selectedSubmission, status: newStatus as any });
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/contact-submissions/${submissionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSubmissions(submissions.filter(s => s.id !== submissionId));
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete submission:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
      case 'read':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100';
      case 'in-progress':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'archived':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">B2B Partnership Inquiries</h1>
        <p className="text-muted-foreground">Manage contact form submissions from potential distribution partners</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold text-primary">{total}</div>
          <p className="text-sm text-muted-foreground mt-1">Total Submissions</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold text-blue-600">{submissions.filter(s => s.status === 'new').length}</div>
          <p className="text-sm text-muted-foreground mt-1">New Inquiries</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold text-green-600">{submissions.filter(s => s.status === 'resolved').length}</div>
          <p className="text-sm text-muted-foreground mt-1">Resolved</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold text-gray-600">{submissions.filter(s => s.status === 'archived').length}</div>
          <p className="text-sm text-muted-foreground mt-1">Archived</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Submissions List */}
        <div className="lg:col-span-2">
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No submissions found</div>
            ) : (
              <div className="divide-y divide-border">
                {submissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedSubmission(submission)}
                    className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                      selectedSubmission?.id === submission.id ? 'bg-accent/50 border-l-4 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{submission.full_name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{submission.company_name}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{submission.business_email}</p>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{submission.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(submission.created_at).toLocaleDateString()} {new Date(submission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!submission.read_at && submission.status === 'new' && (
                        <Eye className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {total > 20 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / 20)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / 20)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-1">
          {selectedSubmission ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="border border-border rounded-lg bg-card p-6 space-y-6 sticky top-4"
            >
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">{selectedSubmission.full_name}</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">{selectedSubmission.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedSubmission.business_email}`} className="text-sm hover:text-primary">
                      {selectedSubmission.business_email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selectedSubmission.phone_number}`} className="text-sm hover:text-primary">
                      {selectedSubmission.phone_number}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Message</h3>
                <div className="p-3 bg-secondary/30 rounded text-sm text-muted-foreground leading-relaxed">
                  {selectedSubmission.message}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Status</h3>
                <div className="space-y-2">
                  {['new', 'read', 'in-progress', 'resolved', 'archived'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedSubmission.id, status)}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all ${
                        selectedSubmission.status === status
                          ? `${getStatusColor(status)} border-2 border-current`
                          : 'border border-border hover:border-primary/50'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(selectedSubmission.id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-4 border-t border-border">
                <p>Submitted: {new Date(selectedSubmission.created_at).toLocaleString()}</p>
                {selectedSubmission.read_at && (
                  <p>Read: {new Date(selectedSubmission.read_at).toLocaleString()}</p>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="border border-border rounded-lg bg-card p-6 text-center text-muted-foreground sticky top-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a submission to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSubmissionsPage;
