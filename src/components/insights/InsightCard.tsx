'use client';

import type { SymptomCorrelationOutput } from '@/ai/flows/symptom-correlation-flow';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle, AlertTriangle, Info, Brain } from 'lucide-react';

type Insight = SymptomCorrelationOutput['insights'][0];

interface InsightCardProps {
  insight: Insight;
}

const InsightIcon = ({ type, confidence }: { type: Insight['type'], confidence?: Insight['confidence']}) => {
  if (type === 'potential_trigger') return <AlertTriangle className="h-5 w-5 text-red-500" />;
  if (type === 'potential_safe') return <CheckCircle className="h-5 w-5 text-green-500" />;
  if (type === 'observation') return <Info className="h-5 w-5 text-blue-500" />;
  if (type === 'no_clear_pattern') return <Brain className="h-5 w-5 text-muted-foreground" />;
  return <Lightbulb className="h-5 w-5 text-yellow-500" />;
};

const ConfidenceBadge = ({ confidence }: { confidence?: Insight['confidence']}) => {
    if (!confidence) return null;
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    if (confidence === 'high') variant = 'default'; // Assuming default is a positive color or primary
    if (confidence === 'medium') variant = 'secondary';
    if (confidence === 'low') variant = 'outline'; // Or a more muted/warning color

    return <Badge variant={variant} className="capitalize text-xs">{confidence} Confidence</Badge>;
};


export default function InsightCard({ insight }: InsightCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow flex flex-col h-full bg-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-md font-semibold font-headline flex items-center">
            <InsightIcon type={insight.type} confidence={insight.confidence} />
            <span className="ml-2">{insight.title}</span>
            </CardTitle>
            <ConfidenceBadge confidence={insight.confidence} />
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-grow">
        <p>{insight.description}</p>
        {insight.relatedFoodNames && insight.relatedFoodNames.length > 0 && (
          <div className="mt-2">
            <span className="font-medium text-foreground text-xs">Related Foods: </span>
            {insight.relatedFoodNames.join(', ')}
          </div>
        )}
        {insight.relatedSymptoms && insight.relatedSymptoms.length > 0 && (
          <div className="mt-1">
            <span className="font-medium text-foreground text-xs">Related Symptoms: </span>
            {insight.relatedSymptoms.join(', ')}
          </div>
        )}
      </CardContent>
      {insight.suggestionToUser && (
        <CardFooter className="pt-2 pb-3">
            <p className="text-xs text-accent-foreground/80 bg-accent/30 p-2 rounded-md">{insight.suggestionToUser}</p>
        </CardFooter>
      )}
    </Card>
  );
}
