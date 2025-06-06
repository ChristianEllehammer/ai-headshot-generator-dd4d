
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { StyleOption } from '../../../server/src/schema';

interface StyleSelectorProps {
  styleOptions: StyleOption[];
  selectedStyles: number[];
  onStylesChange: (styleIds: number[]) => void;
}

export function StyleSelector({ styleOptions, selectedStyles, onStylesChange }: StyleSelectorProps) {
  const handleStyleToggle = (styleId: number, checked: boolean) => {
    if (checked && selectedStyles.length >= 10) {
      return; // Don't allow more than 10 selections
    }

    const newSelection = checked
      ? [...selectedStyles, styleId]
      : selectedStyles.filter((id: number) => id !== styleId);
    
    onStylesChange(newSelection);
  };

  const getBackgroundTypeIcon = (type: string) => {
    switch (type) {
      case 'solid_color': return '🎨';
      case 'blurred_office': return '🏢';
      case 'gradient': return '🌈';
      case 'studio': return '📸';
      default: return '✨';
    }
  };

  const getBackgroundTypeLabel = (type: string) => {
    return type.split('_').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Available Styles</h3>
        <Badge variant={selectedStyles.length >= 10 ? "destructive" : "secondary"}>
          {selectedStyles.length}/10 selected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {styleOptions
          .filter((style: StyleOption) => style.is_active)
          .map((style: StyleOption) => {
            const isSelected = selectedStyles.includes(style.id);
            const isDisabled = !isSelected && selectedStyles.length >= 10;

            return (
              <Card 
                key={style.id}
                className={`cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                    : isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-md'
                }`}
                onClick={() => !isDisabled && handleStyleToggle(style.id, !isSelected)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getBackgroundTypeIcon(style.background_type)}
                      {style.name}
                    </CardTitle>
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={(checked: boolean) => 
                        !isDisabled && handleStyleToggle(style.id, checked)
                      }
                    />
                  </div>
                  <Badge variant="outline" className="w-fit">
                    {getBackgroundTypeLabel(style.background_type)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {style.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {styleOptions.filter((style: StyleOption) => style.is_active).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎨</div>
          <p>No style options available at the moment.</p>
        </div>
      )}
    </div>
  );
}
