'use client';

import type { SymptomLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ListChecks, Trash2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelineSymptomCardProps {
  item: SymptomLog;
  onRemoveItem: (itemId: string) => void;
}

export default function TimelineSymptomCard({ item, onRemoveItem }: TimelineSymptomCardProps) {
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  const severityMap: {[key: number]: string} = {
    1: 'Mild',
    2: 'Slight',
    3: 'Moderate',
    4: 'Severe',
    5: 'Very Severe',
  }

  return (
    <Card className="mb-4 shadow-md bg-destructive/5 dark:bg-destructive/10 border-destructive/20">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold font-headline flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-destructive" /> Symptoms Logged
            </CardTitle>
            <Badge variant="destructive" className="text-xs">Severity: {item.severity ? `${item.severity}/5 (${severityMap[item.severity]})` : 'N/A'}</Badge>
        </div>
        <p className="text-xs text-muted-foreground pt-1">Logged: {timeAgo}</p>
      </CardHeader>
      <CardContent className="px-4 pb-2 pt-1">
        <div className="mb-2">
            <p className="text-sm font-medium">Reported Symptoms:</p>
            <div className="flex flex-wrap gap-1 mt-1">
            {item.symptoms.map(symptom => (
                <Badge key={symptom.id} variant="secondary" className="bg-destructive/20 text-destructive-foreground">
                {symptom.name}
                </Badge>
            ))}
            </div>
        </div>
        {item.notes && (
          <div>
            <p className="text-sm font-medium">Notes:</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
         {item.linkedFoodItemIds && item.linkedFoodItemIds.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">Potentially linked to {item.linkedFoodItemIds.length} food item(s).</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end items-center px-4 pb-4 pt-2">
        <Button variant="ghost" size="sm" onClick={() => onRemoveItem(item.id)} className="text-destructive hover:bg-destructive/10">
          <Trash2 className="mr-2 h-4 w-4" /> Remove Log
        </Button>
      </CardFooter>
    </Card>
  );
}
