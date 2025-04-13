
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface SessionStatusStatesProps {
  session: string;
}

const SessionStatusStates = ({ session }: SessionStatusStatesProps) => {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Session ID: {session}</span>
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3" />
            <span>Status: Active</span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionStatusStates;
