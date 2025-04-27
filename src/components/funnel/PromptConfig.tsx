import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { arabicDialects } from '@/lib/constants/arabicDialects';

export interface PromptConfiguration {
  languages: string[];
  segmentDuration: number;
  noiseHandling: 'ignore' | 'transcribe';
  customInstructions: string | null;
}

interface PromptConfigProps {
  config: PromptConfiguration;
  onChange: (config: PromptConfiguration) => void;
}

const PromptConfig: React.FC<PromptConfigProps> = ({ config, onChange }) => {
  const handleLanguageChange = (value: string) => {
    if (value === 'both') {
      const currentArabicDialect = config.languages.find(lang => lang.startsWith('ar-')) || 'ar-EG';
      onChange({
        ...config,
        languages: ['en-US', currentArabicDialect]
      });
    } else if (value === 'en-US') {
      onChange({
        ...config,
        languages: ['en-US']
      });
    } else if (value.startsWith('ar-')) {
      onChange({
        ...config,
        languages: [value]
      });
    }
  };

  const handleArabicDialectChange = (dialect: string) => {
    if (config.languages.includes('en-US')) {
      onChange({
        ...config,
        languages: ['en-US', dialect]
      });
    } else {
      onChange({
        ...config,
        languages: [dialect]
      });
    }
  };

  const handleSegmentDurationChange = (value: string) => {
    onChange({
      ...config,
      segmentDuration: parseInt(value, 10)
    });
  };

  const handleNoiseHandlingChange = (checked: boolean) => {
    onChange({
      ...config,
      noiseHandling: checked ? 'transcribe' : 'ignore'
    });
  };

  const handleCustomInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...config,
      customInstructions: e.target.value || null
    });
  };

  const isBothLanguages = config.languages.includes('en-US') && config.languages.length > 1;
  
  const getCurrentArabicDialect = () => {
    return config.languages.find(lang => lang.startsWith('ar-')) || 'ar-eg';
  };

  return (
    <Card className="w-full shadow-md border-primary/10">
      <CardHeader>
        <CardTitle className="text-lg">Transcription Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language">Language Selection</Label>
          <Select 
            onValueChange={handleLanguageChange}
            value={config.languages.includes('en-US') && config.languages.length > 1 ? 'both' : config.languages[0]}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Arabic and English (Both)</SelectItem>
              <SelectItem value="en-US">English Only</SelectItem>
              <SelectItem value="ar-EG">Arabic Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(config.languages.includes('en-US') ? config.languages.length > 1 : config.languages[0]?.startsWith('ar-')) && (
          <div className="space-y-2">
            <Label htmlFor="arabicDialect">Arabic Dialect</Label>
            <Select
              onValueChange={handleArabicDialectChange}
              value={config.languages.find(lang => lang.startsWith('ar-')) || 'ar-EG'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Arabic dialect" />
              </SelectTrigger>
              <SelectContent>
                {arabicDialects.map(dialect => (
                  <SelectItem key={dialect.value} value={dialect.value}>
                    {dialect.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="segmentDuration">Segment Duration (seconds)</Label>
          <Select 
            onValueChange={handleSegmentDurationChange}
            value={config.segmentDuration.toString()}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 seconds</SelectItem>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch 
            id="noiseHandling"
            checked={config.noiseHandling === 'transcribe'}
            onCheckedChange={handleNoiseHandlingChange}
          />
          <Label htmlFor="noiseHandling">Include background sounds and music</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
          <Textarea
            id="customInstructions"
            placeholder="Add any specific instructions for the transcription..."
            value={config.customInstructions || ''}
            onChange={handleCustomInstructionsChange}
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptConfig;
