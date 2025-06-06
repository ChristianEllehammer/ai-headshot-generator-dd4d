
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from '@/components/ImageUpload';
import { StyleSelector } from '@/components/StyleSelector';
import { GenerationHistory } from '@/components/GenerationHistory';
import { HeadshotGallery } from '@/components/HeadshotGallery';
import { UserSetup } from '@/components/UserSetup';
import { trpc } from '@/utils/trpc';
import type { User, StyleOption, GenerationJob, GeneratedHeadshot } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [styleOptions, setStyleOptions] = useState<StyleOption[]>([]);
  const [userJobs, setUserJobs] = useState<GenerationJob[]>([]);
  const [selectedHeadshots, setSelectedHeadshots] = useState<GeneratedHeadshot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  // Load style options on component mount
  const loadStyleOptions = useCallback(async () => {
    try {
      const options = await trpc.getStyleOptions.query();
      setStyleOptions(options);
    } catch (error) {
      console.error('Failed to load style options:', error);
    }
  }, []);

  // Load user jobs
  const loadUserJobs = useCallback(async (userId: number) => {
    try {
      const jobs = await trpc.getUserJobs.query({ user_id: userId });
      setUserJobs(jobs);
    } catch (error) {
      console.error('Failed to load user jobs:', error);
    }
  }, []);

  // Load selected headshots
  const loadSelectedHeadshots = useCallback(async (userId: number) => {
    try {
      const headshots = await trpc.getUserSelectedHeadshots.query({ userId });
      setSelectedHeadshots(headshots);
    } catch (error) {
      console.error('Failed to load selected headshots:', error);
    }
  }, []);

  useEffect(() => {
    loadStyleOptions();
  }, [loadStyleOptions]);

  useEffect(() => {
    if (currentUser) {
      loadUserJobs(currentUser.id);
      loadSelectedHeadshots(currentUser.id);
    }
  }, [currentUser, loadUserJobs, loadSelectedHeadshots]);

  const handleUserCreated = (user: User) => {
    setCurrentUser(user);
    setActiveTab('upload');
  };

  const handleImageUploaded = (imageId: number) => {
    setUploadedImageId(imageId);
    setActiveTab('styles');
  };

  const handleStylesSelected = (styleIds: number[]) => {
    setSelectedStyles(styleIds);
  };

  const handleGenerateHeadshots = async () => {
    if (!currentUser || !uploadedImageId || selectedStyles.length === 0) return;

    setIsGenerating(true);
    try {
      await trpc.createGenerationJob.mutate({
        user_id: currentUser.id,
        image_upload_id: uploadedImageId,
        style_option_ids: selectedStyles
      });
      
      // Refresh user jobs after creating new generation job
      await loadUserJobs(currentUser.id);
      setActiveTab('history');
    } catch (error) {
      console.error('Failed to create generation job:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHeadshotSelected = async (headshotId: number) => {
    if (!currentUser) return;
    
    try {
      await trpc.selectHeadshot.mutate({
        user_id: currentUser.id,
        headshot_id: headshotId
      });
      
      // Refresh selected headshots
      await loadSelectedHeadshots(currentUser.id);
    } catch (error) {
      console.error('Failed to select headshot:', error);
    }
  };

  const canGenerate = currentUser && uploadedImageId && selectedStyles.length > 0;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ✨ AI Headshot Generator
            </h1>
            <p className="text-lg text-gray-600">
              Create professional, hyper-realistic headshots with AI
            </p>
          </div>
          <UserSetup onUserCreated={handleUserCreated} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ✨ AI Headshot Generator
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Welcome back, {currentUser.name}! Create professional headshots with AI
          </p>
          <div className="flex justify-center items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              📸 {selectedHeadshots.length} Selected Headshots
            </Badge>
            <Badge variant="outline" className="text-sm">
              🎯 {userJobs.length} Generation Jobs
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              📤 Upload
            </TabsTrigger>
            <TabsTrigger value="styles" className="flex items-center gap-2">
              🎨 Styles
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              📋 History
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              🖼️ Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📤 Upload Your Photo
                </CardTitle>
                <CardDescription>
                  Upload a clear photo of your face (JPG or PNG format). 
                  Make sure your face is well-lit and clearly visible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload 
                  userId={currentUser.id} 
                  onImageUploaded={handleImageUploaded}
                />
                {uploadedImageId && (
                  <Alert className="mt-4 border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      ✅ Image uploaded successfully! You can now select styles.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="styles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎨 Choose Your Styles
                </CardTitle>
                <CardDescription>
                  Select up to 10 different background styles for your headshots.
                  Each style will generate a unique professional headshot.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!uploadedImageId ? (
                  <Alert>
                    <AlertDescription>
                      Please upload an image first before selecting styles.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <StyleSelector
                      styleOptions={styleOptions}
                      selectedStyles={selectedStyles}
                      onStylesChange={handleStylesSelected}
                    />
                    <Separator className="my-6" />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">
                          {selectedStyles.length} style{selectedStyles.length !== 1 ? 's' : ''} selected
                        </p>
                        {selectedStyles.length > 0 && (
                          <Progress value={(selectedStyles.length / 10) * 100} className="w-48 mt-2" />
                        )}
                      </div>
                      <Button
                        onClick={handleGenerateHeadshots}
                        disabled={!canGenerate || isGenerating}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {isGenerating ? (
                          <>🔄 Generating...</>
                        ) : (
                          <>✨ Generate Headshots</>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Generation History
                </CardTitle>
                <CardDescription>
                  View all your headshot generation jobs and their results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GenerationHistory
                  jobs={userJobs}
                  onHeadshotSelected={handleHeadshotSelected}
                  onRefresh={() => loadUserJobs(currentUser.id)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🖼️ Selected Headshots
                </CardTitle>
                <CardDescription>
                  Your collection of selected professional headshots.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HeadshotGallery headshots={selectedHeadshots} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
