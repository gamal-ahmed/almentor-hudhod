
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CloudStorageAccount, CloudStorageProvider } from '@/types/cloudStorage';
import { FileIcon, Cloud, ExternalLink, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

interface CloudStorageAccountCardProps {
  account: CloudStorageAccount;
  onDisconnect: (accountId: string) => void;
  onSelect: (account: CloudStorageAccount) => void;
}

const CloudStorageAccountCard: React.FC<CloudStorageAccountCardProps> = ({ 
  account, 
  onDisconnect,
  onSelect
}) => {
  const getProviderIcon = (provider: CloudStorageProvider) => {
    switch (provider) {
      case 'google-drive':
        return <FileIcon className="h-5 w-5 text-red-500" />;
      case 'dropbox':
        return <Cloud className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getProviderName = (provider: CloudStorageProvider) => {
    switch (provider) {
      case 'google-drive':
        return 'Google Drive';
      case 'dropbox':
        return 'Dropbox';
      default:
        return 'Unknown';
    }
  };

  const handleDisconnect = () => {
    onDisconnect(account.id);
  };

  const handleSelect = () => {
    onSelect(account);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {getProviderIcon(account.provider)}
          <CardTitle className="text-base">{getProviderName(account.provider)}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1 text-sm">
          <div className="font-medium">{account.name}</div>
          <div className="text-muted-foreground text-xs">{account.email}</div>
          {account.lastUsed && (
            <div className="text-xs text-muted-foreground">
              Last used {formatDistanceToNow(new Date(account.lastUsed), { addSuffix: true })}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full flex gap-1 items-center"
          onClick={handleSelect}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Browse Files
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disconnect your {getProviderName(account.provider)} account?
                This will revoke VoiceScribe's access to your files.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDisconnect}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default CloudStorageAccountCard;
