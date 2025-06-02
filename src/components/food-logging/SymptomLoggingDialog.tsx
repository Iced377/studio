
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Symptom } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ListChecks } from 'lucide-react';
import { Input } from '@/components/ui/input'; // Added import for Input

const symptomLogSchema = z.object({
  selectedSymptoms: z.array(z.string()).min(1, { message: 'Please select at least one symptom.' }),
  customSymptom: z.string().optional(),
  severity: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

type SymptomLogFormValues = z.infer<typeof symptomLogSchema>;

interface SymptomLoggingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogSymptoms: (symptoms: Symptom[], notes?: string, severity?: number, linkedFoodItemIds?: string[]) => void;
  allSymptoms: Symptom[];
  context?: { foodItemIds?: string[] };
}

export default function SymptomLoggingDialog({
  isOpen,
  onOpenChange,
  onLogSymptoms,
  allSymptoms,
  context,
}: SymptomLoggingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomSymptom, setShowCustomSymptom] = useState(false);

  const form = useForm<SymptomLogFormValues>({
    resolver: zodResolver(symptomLogSchema),
    defaultValues: {
      selectedSymptoms: [],
      customSymptom: '',
      severity: 3,
      notes: '',
    },
  });

 useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'selectedSymptoms') {
        if (value.selectedSymptoms?.includes('other')) {
          setShowCustomSymptom(true);
        } else {
          setShowCustomSymptom(false);
          form.setValue('customSymptom', ''); 
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  const handleSubmit = async (data: SymptomLogFormValues) => {
    setIsLoading(true);
    const finalSymptoms: Symptom[] = data.selectedSymptoms
      .map(symptomId => allSymptoms.find(s => s.id === symptomId))
      .filter((s): s is Symptom => !!s);

    if (data.selectedSymptoms.includes('other') && data.customSymptom && data.customSymptom.trim() !== '') {
      finalSymptoms.push({ id: `custom-${Date.now()}`, name: data.customSymptom.trim() });
    }
    
    if (finalSymptoms.length === 0) {
        form.setError("selectedSymptoms", { type: "manual", message: "Please select or add at least one symptom."});
        setIsLoading(false);
        return;
    }

    onLogSymptoms(finalSymptoms, data.notes, data.severity, context?.foodItemIds);
    form.reset();
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl flex items-center text-foreground">
            <ListChecks className="mr-2 h-6 w-6 text-gray-400"/> Log Your Symptoms
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select symptoms, severity, and any notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-2">
          <div>
            <Label className="text-sm font-medium text-foreground">Symptoms Experienced</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-input rounded-md">
              {allSymptoms.map((symptom) => (
                <Controller
                  key={symptom.id}
                  name="selectedSymptoms"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                      <Checkbox
                        id={`symptom-${symptom.id}`}
                        checked={field.value?.includes(symptom.id)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value || []), symptom.id]
                            : (field.value || []).filter((id) => id !== symptom.id);
                          field.onChange(newValue);
                        }}
                        className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <Label htmlFor={`symptom-${symptom.id}`} className="text-sm font-normal cursor-pointer text-foreground">
                        {symptom.name}
                      </Label>
                    </div>
                  )}
                />
              ))}
            </div>
            {form.formState.errors.selectedSymptoms && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.selectedSymptoms.message}</p>
            )}
          </div>

          {showCustomSymptom && (
            <div>
              <Label htmlFor="customSymptom" className="text-sm font-medium text-foreground">Other Symptom</Label>
              <Input
                id="customSymptom"
                {...form.register('customSymptom')}
                placeholder="Describe other symptom"
                className="mt-1 bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          <div>
            <Label htmlFor="severity" className="text-sm font-medium text-foreground">Severity (1: Mild - 5: Severe)</Label>
            <Controller
                name="severity"
                control={form.control}
                defaultValue={3}
                render={({ field: { onChange, value } }) => (
                    <div className="flex items-center gap-4 mt-2">
                        <Slider
                            id="severity"
                            min={1}
                            max={5}
                            step={1}
                            value={[value || 3]}
                            onValueChange={(vals) => onChange(vals[0])}
                            className="w-full [&>span>span]:bg-primary [&>span>span]:border-primary [&>span]:bg-input"
                        />
                        <Badge variant="outline" className="w-10 h-8 flex items-center justify-center text-base border-accent text-accent-foreground">{value || 3}</Badge>
                    </div>
                )}
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-foreground">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="e.g., Started 1 hour after lunch..."
              className="mt-1 bg-input text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="border-accent text-accent-foreground hover:bg-accent/20" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80" disabled={isLoading}>
              {isLoading ? 'Logging...' : 'Log Symptoms'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
