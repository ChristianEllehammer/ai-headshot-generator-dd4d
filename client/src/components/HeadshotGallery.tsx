
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GeneratedHeadshot } from '../../../server/src/schema';

interface HeadshotGalleryProps {
  headshots: GeneratedHeadshot[];
}

export function HeadshotGallery({ headshots }: HeadshotGalleryProps) {
  const handleDownload = (headshot: GeneratedHeadshot) => {
    // In a real implementation, this would trigger a download
    console.log('Downloading headshot:', headshot.id);
  };

  const handleShare = (headshot: GeneratedHeadshot) => {
    // In a real implementation, this would open a share dialog
    console.log('Sharing headshot:', headshot.id);
  };

  const sortedHeadshots = [...headshots].sort((a: GeneratedHeadshot, b: GeneratedHeadshot) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Selected Headshots</h3>
        <Badge variant="secondary">
          {headshots.length} headshot{headshots.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {sortedHeadshots.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🖼️</div>
          <h3 className="text-xl font-semibold mb-2">No Selected Headshots</h3>
          <p className="text-gray-600 mb-4">
            Generate some headshots and select your favorites to see them here.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>1. Upload your photo</p>
            <p>2. Choose styles</p>
            <p>3. Generate headshots</p>
            <p>4. Select your favorites</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedHeadshots.map((headshot: GeneratedHeadshot) => (
            <Card key={headshot.id} className="hover:shadow-lg transition-shadow group">
              <CardContent className="p-4">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center text-gray-500">
                    <div className="text-3xl mb-2">📸</div>
                    <p className="text-sm font-medium">Professional Headshot</p>
                    <p className="text-xs opacity-75">
                      {(headshot.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  
                  {/* Overlay with actions - shown on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(headshot)}
                        className="text-xs"
                      >
                        📥 Download
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleShare(headshot)}
                        className="text-xs"
                      >
                        🔗 Share
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="default" className="text-xs">
                      ✅ Selected
                    </Badge>
                    {headshot.quality_score && (
                      <Badge variant="outline" className="text-xs">
                        ⭐ {headshot.quality_score.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <p>Created: {headshot.created_at.toLocaleDateString()}</p>
                    <p>Style ID: #{headshot.style_option_id}</p>
                  </div>

                  <div className="flex gap-1 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(headshot)}
                      className="flex-1 text-xs"
                    >
                      📥 Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(headshot)}
                      className="flex-1 text-xs"
                    >
                      🔗 Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
