
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CloudStorageAccount } from '@/types/cloudStorage';
import { cloudStorageService } from '@/lib/api/cloudStorageService';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { FileQuestion, Loader2 } from 'lucide-react';
import CloudStorageConnect from './CloudStorageConnect';
import CloudStorageAccountCard from './CloudStorageAccountCard';
import CloudStorageFileBrowser from './CloudStorageFileBrowser';

interface CloudStorageImporterProps {
  onFilesSelected?: (files: File[]) => void;
  isProcessing?: boolean;
}

const CloudStorageImporter: React.FC<CloudStorageImporterProps> = ({ 
  onFilesSelected = () => {},
  isProcessing = false
}) => {
  const { isAuthenticated } = useAuth();
  const [accounts, setAccounts] = useState<CloudStorageAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<CloudStorageAccount | null>(null);

  const fetchAccounts = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const accountsList = await cloudStorageService.getConnectedAccounts();
      setAccounts(accountsList);
    } catch (error) {
      console.error('Error fetching cloud storage accounts:', error);
      toast.error('Failed to load connected accounts', {
        description: (error as Error).message || 'Please try refreshing the page.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [isAuthenticated]);

  const handleDisconnect = async (accountId: string) => {
    try {
      await cloudStorageService.disconnectAccount(accountId);
      setAccounts(accounts.filter(account => account.id !== accountId));
      toast.success('Account disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error('Failed to disconnect account', {
        description: (error as Error).message || 'Please try again.',
      });
    }
  };

  const handleFileSelect = (file: File) => {
    onFilesSelected([file]);
    setSelectedAccount(null);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-3">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Authentication Required</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Please sign in to connect your cloud storage accounts and import files.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium">Loading your connected accounts...</p>
        </div>
      </div>
    );
  }

  if (selectedAccount) {
    return (
      <CloudStorageFileBrowser 
        account={selectedAccount}
        onBack={() => setSelectedAccount(null)}
        onFileSelect={handleFileSelect}
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <div className="space-y-6">
      {accounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Connected Accounts</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {accounts.map(account => (
              <CloudStorageAccountCard
                key={account.id}
                account={account}
                onDisconnect={handleDisconnect}
                onSelect={() => setSelectedAccount(account)}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Connect New Account</h3>
        <CloudStorageConnect onConnected={fetchAccounts} />
      </div>
    </div>
  );
};

export default CloudStorageImporter;
