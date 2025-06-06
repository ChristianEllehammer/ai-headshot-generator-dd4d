
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { GenerationJob, GeneratedHeadshot } from '../../../server/src/schema';

interface GenerationHistoryProps {
  jobs: GenerationJob[];
  onHeadshotSelected: (headshotId: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function GenerationHistory({ jobs, onHeadshotSelected, onRefresh }: GenerationHistoryProps) {
  const [selectedJob, setSelectedJob] = useState<GenerationJob | null>(null);
  const [jobHeadshots, setJobHeadshots] = useState<GeneratedHeadshot[]>([]);
  const [isLoadingHeadshots, setIsLoadingHeadshots] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadJobHeadshots = useCallback(async (jobId: number) => {
    setIsLoadingHeadshots(true);
    try {
      const headshots = await trpc.getJobHeadshots.query({ jobId });
      setJobHeadshots(headshots);
    } catch (error) {
      console.error('Failed to load job headshots:', error);
    } finally {
      setIsLoadingHeadshots(false);
    }
  }, []);

  const handleViewJob = async (job: GenerationJob) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
    await loadJobHeadshots(job.id);
  };

  const handleSelectHeadshot = async (headshotId: number) => {
    await onHeadshotSelected(headshotId);
    setIsDialogOpen(false);
    await onRefresh();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string): 'secondary' | 'default' | 'destructive' => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const sortedJobs = [...jobs].sort((a: GenerationJob, b: GenerationJob) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Generation Jobs</h3>
        <Button onClick={onRefresh} variant="outline" size="sm">
          🔄 Refresh
        </Button>
      </div>

      {sortedJobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p>No generation jobs yet.</p>
          <p className="text-sm">Upload an image and select styles to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedJobs.map((job: GenerationJob) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      Generation Job #{job.id}
                    </CardTitle>
                    <CardDescription>
                      Created: {job.created_at.toLocaleDateString()} at {job.created_at.toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p>🎨 {job.style_option_ids.length} style{job.style_option_ids.length !== 1 ? 's' : ''} selected</p>
                    {job.completed_at && (
                      <p>✅ Completed: {job.completed_at.toLocaleDateString()}</p>
                    )}
                    {job.error_message && (
                      <p className="text-red-600">❌ Error: {job.error_message}</p>
                    )}
                  </div>
                  {job.status === 'completed' && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewJob(job)}
                        >
                          👁️ View Results
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Generation Job #{selectedJob?.id} Results</DialogTitle>
                          <DialogDescription>
                            Choose your favorite headshots from this generation job
                          </DialogDescription>
                        </DialogHeader>
                        <Separator />
                        {isLoadingHeadshots ? (
                          <div className="flex justify-center py-8">
                            <div className="text-center">
                              <div className="text-2xl mb-2">🔄</div>
                              <p>Loading headshots...</p>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {jobHeadshots.map((headshot: GeneratedHeadshot) => (
                              <Card key={headshot.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                      <div className="text-2xl mb-1">📸</div>
                                      <p className="text-xs">Headshot Preview</p>
                                      <p className="text-xs">({headshot.file_size} bytes)</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Badge 
                                        variant={headshot.generation_status === 'completed' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {headshot.generation_status}
                                      </Badge>
                                      {headshot.quality_score && (
                                        <Badge variant="outline" className="text-xs">
                                          ⭐ {headshot.quality_score.toFixed(1)}
                                        </Badge>
                                      )}
                                    </div>
                                    {headshot.is_selected && (
                                      <Badge variant="default" className="w-full justify-center">
                                        ✅ Selected
                                      </Badge>
                                    )}
                                    <Button
                                      size="sm"
                                      className="w-full"
                                      onClick={() => handleSelectHeadshot(headshot.id)}
                                      disabled={headshot.generation_status !== 'completed'}
                                    >
                                      {headshot.is_selected ? '✅ Selected' : '⭐ Select This'}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
