
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ErrorState: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex-1 container py-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center mb-4"
          onClick={() => navigate('/app/history')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Button>
      </div>
      
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <h3 className="font-medium text-lg">Transcription not found</h3>
            <p className="text-muted-foreground mt-1">
              The transcription job you're looking for doesn't exist or was deleted
            </p>
            <Button className="mt-4" onClick={() => navigate('/app/history')}>
              Return to History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorState;
