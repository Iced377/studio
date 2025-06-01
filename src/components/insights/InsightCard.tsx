'use client';

import type { SymptomCorrelationOutput } from '@/ai/flows/symptom-correlation-flow';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle, AlertTriangle, Info, Brain } from 'lucide-react';

type Insight = SymptomCorrelationOutput['insights'][0];

interface InsightCardProps {
  insight: Insight;
}

const InsightIcon = ({ type }: { type: Insight['type']}) => {
  if (type === 'potential_trigger') return <AlertTriangle className="h-5 w-5 text-[#F44336]" />; // Red
  if (type === 'potential_safe') return <CheckCircle className="h-5 w-5 text-[#4CAF50]" />; // Green
  if (type === 'observation') return <Info className="h-5 w-5 text-gray-400" />; // Muted gray
  if (type === 'no_clear_pattern') return <Brain className="h-5 w-5 text-muted-foreground" />;
  return <Lightbulb className="h-5 w-5 text-[#FFEB3B]" />; // Yellow
};

const ConfidenceBadge = ({ confidence }: { confidence?: Insight['confidence']}) => {
    if (!confidence) return null;
    
    let badgeStyle = "border-gray-500 text-gray-300"; // Default for low or undefined
    if (confidence === 'high') badgeStyle = "border-green-500 text-green-300 bg-green-500/10";
    if (confidence === 'medium') badgeStyle = "border-yellow-500 text-yellow-300 bg-yellow-500/10";

    return <Badge variant="outline" className={`capitalize text-xs ${badgeStyle}`}>{confidence} Confidence</Badge>;
};


export default function InsightCard({ insight }: InsightCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full bg-card border-border">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-md font-semibold font-headline flex items-center text-foreground">
            <InsightIcon type={insight.type} />
            <span className="ml-2">{insight.title}</span>
            </CardTitle>
            <ConfidenceBadge confidence={insight.confidence} />
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-grow px-4 pb-3">
        <p>{insight.description}</p>
        {insight.relatedFoodNames && insight.relatedFoodNames.length > 0 && (
          <div className="mt-2">
            <span className="font-medium text-gray-400 text-xs">Related Foods: </span>
            <span className="text-gray-300 text-xs">{insight.relatedFoodNames.join(', ')}</span>
          </div>
        )}
        {insight.relatedSymptoms && insight.relatedSymptoms.length > 0 && (
          <div className="mt-1">
            <span className="font-medium text-gray-400 text-xs">Related Symptoms: </span>
            <span className="text-gray-300 text-xs">{insight.relatedSymptoms.join(', ')}</span>
          </div>
        )}
      </CardContent>
      {insight.suggestionToUser && (
        <CardFooter className="pt-2 pb-3 px-4">
            <p className="text-xs text-accent-foreground bg-accent/30 p-2 rounded-md w-full">{insight.suggestionToUser}</p>
        </CardFooter>
      )}
    </Card>
  );
}
