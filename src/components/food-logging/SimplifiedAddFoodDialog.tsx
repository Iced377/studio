
'use client';

import { useState, useEffect, useRef } from 'react';
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
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Sprout, Loader2, Edit, Info, Camera, Upload, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import BannerAdPlaceholder from '@/components/ads/BannerAdPlaceholder';
import { identifyFoodFromImage, type IdentifyFoodFromImageOutput } from '@/ai/flows/identify-food-from-image-flow';
import Image from 'next/image';


const simplifiedFoodLogSchema = z.object({
  mealDescription: z.string().min(10, { message: 'Please describe your meal in more detail (at least 10 characters).' }),
  calories: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Calories must be positive").optional()
  ),
  protein: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Protein must be positive").optional()
  ),
  carbs: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Carbs must be positive").optional()
  ),
  fat: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || Number.isNaN(parseFloat(String(val))) ? undefined : parseFloat(String(val))),
    z.number().min(0, "Fat must be positive").optional()
  ),
});

export type SimplifiedFoodLogFormValues = z.infer<typeof simplifiedFoodLogSchema>;

interface SimplifiedAddFoodDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmitLog: (data: SimplifiedFoodLogFormValues, userDidOverrideMacros: boolean) => Promise<void>;
  isGuestView?: boolean;
  isEditing?: boolean;
  initialValues?: Partial<SimplifiedFoodLogFormValues>;
  initialMacrosOverridden?: boolean;
}

export default function SimplifiedAddFoodDialog({
  isOpen,
  onOpenChange,
  onSubmitLog,
  isGuestView = false,
  isEditing = false,
  initialValues,
  initialMacrosOverridden = false,
}: SimplifiedAddFoodDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isIdentifyingPhoto, setIsIdentifyingPhoto] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPhotoSourceAlertOpen, setIsPhotoSourceAlertOpen] = useState(false);
  const { toast } = useToast();
  const [userWantsToOverrideMacros, setUserWantsToOverrideMacros] = useState(initialMacrosOverridden);
  const { isDarkMode } = useTheme();

  const adSenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-8897507841347789";
  const adSenseSlotIdSimplifiedBanner = "YOUR_SIMPLIFIED_LOG_BANNER_AD_ID_HERE";

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SimplifiedFoodLogFormValues>({
    resolver: zodResolver(simplifiedFoodLogSchema),
    defaultValues: {
      mealDescription: '',
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      ...(initialValues || {}),
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialValues) {
        form.reset({
          mealDescription: initialValues.mealDescription || '',
          calories: initialValues.calories,
          protein: initialValues.protein,
          carbs: initialValues.carbs,
          fat: initialValues.fat,
        });
        setUserWantsToOverrideMacros(initialMacrosOverridden);
      } else if (!isEditing) {
        form.reset({ mealDescription: '', calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
        setUserWantsToOverrideMacros(false);
      }
      setImagePreview(null);
      setPhotoError(null);
      setIsIdentifyingPhoto(false);
    }
  }, [isOpen, isEditing, initialValues, initialMacrosOverridden, form]);


  const handleSubmit = async (data: SimplifiedFoodLogFormValues) => {
    setIsLoading(true);
    try {
      await onSubmitLog(data, userWantsToOverrideMacros);
      if (!isEditing) {
        form.reset();
        setUserWantsToOverrideMacros(false);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error processing/updating meal description:", error);
      toast({
        title: `Error ${isEditing ? 'Updating' : 'Processing'} Meal`,
        description: error.message || `Could not ${isEditing ? 'update' : 'process'} your meal description with AI.`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImagePreview(null);
    setPhotoError(null);
    setIsIdentifyingPhoto(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageDataUri = reader.result as string;
      setImagePreview(imageDataUri);
      try {
        const result = await identifyFoodFromImage({ imageDataUri });
        
        let descriptionText = "";
        const trimmedFoodName = result.identifiedFoodName?.trim();
        const trimmedOcrText = result.ocrText?.trim();
        const hasFoodName = !!trimmedFoodName;
        const hasOcrText = !!trimmedOcrText;

        if (result.recognitionSuccess) {
          if (hasFoodName) {
            descriptionText = `Identified: ${trimmedFoodName}.`;
            if (result.identifiedIngredients) {
              descriptionText += ` Ingredients: ${result.identifiedIngredients.trim()}.`;
            }
            if (result.estimatedPortionSize && result.estimatedPortionUnit) {
              descriptionText += ` Portion: ${result.estimatedPortionSize.trim()} ${result.estimatedPortionUnit.trim()}.`;
            }
            if (hasOcrText) {
              descriptionText += ` Text from image (first 100 chars): ${trimmedOcrText.substring(0, 100)}${trimmedOcrText.length > 100 ? '...' : ''}`;
            }
            form.setValue('mealDescription', descriptionText, { shouldValidate: true, shouldDirty: true });
            form.trigger('mealDescription');
            toast({ title: "Food Identified!", description: "Review and confirm the description." });
          } else if (hasOcrText) {
            descriptionText = `Text from image: ${trimmedOcrText}`;
            form.setValue('mealDescription', descriptionText, { shouldValidate: true, shouldDirty: true });
            form.trigger('mealDescription');
            toast({ title: "Text Extracted", description: "OCR text populated. Please complete the meal description." });
          } else {
            setPhotoError(result.errorMessage || "AI could not extract useful information. Please describe manually.");
            toast({ title: "Partial Identification", description: result.errorMessage || "Please complete the meal description.", variant: "default" });
          }
        } else {
          setPhotoError(result.errorMessage || "Couldn’t recognize this food. Please enter it manually.");
          toast({ title: "Identification Failed", description: result.errorMessage || "Please try another image or enter manually.", variant: "destructive" });
        }

      } catch (err) {
        console.error("Error identifying food from image:", err);
        setPhotoError("An error occurred during image analysis. Please try again.");
        toast({ title: "Analysis Error", description: "Could not analyze image.", variant: "destructive" });
      } finally {
        setIsIdentifyingPhoto(false);
        if (event.target) event.target.value = ''; 
      }
    };
    reader.readAsDataURL(file);
  };


  const dialogContentClasses = cn("sm:max-w-lg", "bg-card text-card-foreground border-border");
  const titleClasses = cn("font-headline text-xl flex items-center", "text-foreground");
  const descriptionClasses = cn("text-muted-foreground");
  const sproutIconClasses = cn("mr-2 h-6 w-6", "text-gray-400");
  const sproutSubmitIconClasses = cn("mr-2 h-5 w-5");
  const textAreaClasses = cn("mt-1 text-base min-h-[100px]", "bg-input text-foreground placeholder:text-muted-foreground border-input focus:ring-ring focus:border-ring");
  const inputClasses = cn("mt-1", "bg-input text-foreground placeholder:text-muted-foreground");

  const currentCancelButtonClasses = (isGuestView || !isDarkMode)
  ? "bg-red-200 border-red-300 text-red-700 hover:bg-red-300 hover:border-red-400"
  : "border-accent text-accent-foreground hover:bg-accent/20";

  const submitButtonClasses = cn("bg-primary text-primary-foreground hover:bg-primary/80");
  const labelClasses = cn("text-sm font-medium", "text-foreground");
  const checkboxErrorClasses = cn("text-xs mt-1", "text-destructive");

  const dialogTitleText = isGuestView
    ? "What did you eat?"
    : (isEditing ? "Edit Meal Details" : "Log Food with AI");

  const submitButtonText = isLoading
    ? (isEditing ? 'Updating...' : 'Analyzing...')
    : (isGuestView ? 'Check Meal' : (isEditing ? 'Update Meal' : 'Analyze Meal'));


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClasses}>
        <DialogHeader>
          <DialogTitle className={titleClasses}>
            <Sprout className={sproutIconClasses} /> {dialogTitleText}
          </DialogTitle>
          <DialogDescription className={descriptionClasses}>
            {isGuestView
              ? "Tell us what you ate, including ingredients and their approximate portion sizes."
              : (isEditing
                  ? "Update the description. You can also manually adjust nutritional info below."
                  : "Describe your meal in natural language, or use a photo. Our AI will estimate nutritional info.")
            }
          </DialogDescription>
        </DialogHeader>

        {!isGuestView && (
          <div className="my-4">
            <BannerAdPlaceholder
              adClientId={adSenseClientId}
              adSlotId={adSenseSlotIdSimplifiedBanner}
            />
          </div>
        )}

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2 max-h-[calc(60vh-50px)] overflow-y-auto pr-2">
         {!isEditing && !isGuestView && (
            <div className="my-3 space-y-2">
                <AlertDialog open={isPhotoSourceAlertOpen} onOpenChange={setIsPhotoSourceAlertOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10" disabled={isIdentifyingPhoto}>
                    {isIdentifyingPhoto ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Camera className="mr-2 h-5 w-5" />}
                    {isIdentifyingPhoto ? 'Analyzing Image...' : 'Identify via Photo'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Identify Food via Photo</AlertDialogTitle>
                    <AlertDialogDescription>
                        Choose how you want to provide the image of your food.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => cameraInputRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Camera className="mr-2 h-4 w-4" /> Take Photo
                    </AlertDialogAction>
                    <AlertDialogAction onClick={() => uploadInputRef.current?.click()} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        <Upload className="mr-2 h-4 w-4" /> Upload Image
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>

                <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleImageFileChange}
                className="hidden"
                disabled={isIdentifyingPhoto}
                />
                <input
                type="file"
                accept="image/*"
                ref={uploadInputRef}
                onChange={handleImageFileChange}
                className="hidden"
                disabled={isIdentifyingPhoto}
                />

                {imagePreview && (
                <div className="mt-3 border border-input rounded-md p-2 flex justify-center max-h-48 overflow-hidden">
                    <Image src={imagePreview} alt="Food preview" width={180} height={180} style={{ objectFit: 'contain' }} className="rounded-md" />
                </div>
                )}
                {photoError && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-md flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {photoError}
                </div>
                )}
                {isIdentifyingPhoto && !imagePreview && (
                <div className="mt-2 text-center text-muted-foreground">
                    <Loader2 className="animate-spin h-5 w-5 inline mr-2" /> Processing...
                </div>
                )}
                <p className="text-center text-sm text-muted-foreground my-2">OR</p>
            </div>
          )}
          <div>
            <Label htmlFor="mealDescription" className={labelClasses}>Meal Description</Label>
            <Textarea
              id="mealDescription"
              {...form.register('mealDescription')}
              placeholder={isGuestView ? 'e.g., "A small glass of low-fat milk with 50g of Weetabix, and a handful of blueberries"' : 'e.g., "Large bowl of spaghetti bolognese with garlic bread and a side salad."'}
              className={textAreaClasses}
              rows={isEditing ? 3 : 4}
            />
            {form.formState.errors.mealDescription && (
              <p className={checkboxErrorClasses}>{form.formState.errors.mealDescription.message}</p>
            )}
          </div>

          {isEditing && !isGuestView && (
            <div className="space-y-3 pt-3 border-t border-border/50 mt-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manualOverrideMacros"
                  checked={userWantsToOverrideMacros}
                  onCheckedChange={(checked) => setUserWantsToOverrideMacros(Boolean(checked))}
                  className={cn("border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground")}
                />
                <Label htmlFor="manualOverrideMacros" className={cn(labelClasses, "flex items-center cursor-pointer")}>
                  <Edit className="w-4 h-4 mr-2 text-muted-foreground" />
                  Manually set macronutrients
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label htmlFor="calories" className={cn(labelClasses, "text-xs", !userWantsToOverrideMacros && "text-muted-foreground/70")}>Calories (kcal)</Label>
                  <Input id="calories" type="number" step="any" {...form.register('calories')} placeholder="e.g., 500" className={cn(inputClasses, "h-9 text-sm")} disabled={!userWantsToOverrideMacros} />
                  {form.formState.errors.calories && <p className={cn("text-xs text-destructive mt-1")}>{form.formState.errors.calories.message}</p>}
                </div>
                <div>
                  <Label htmlFor="protein" className={cn(labelClasses, "text-xs", !userWantsToOverrideMacros && "text-muted-foreground/70")}>Protein (g)</Label>
                  <Input id="protein" type="number" step="any" {...form.register('protein')} placeholder="e.g., 30" className={cn(inputClasses, "h-9 text-sm")} disabled={!userWantsToOverrideMacros} />
                  {form.formState.errors.protein && <p className={cn("text-xs text-destructive mt-1")}>{form.formState.errors.protein.message}</p>}
                </div>
                <div>
                  <Label htmlFor="carbs" className={cn(labelClasses, "text-xs", !userWantsToOverrideMacros && "text-muted-foreground/70")}>Carbs (g)</Label>
                  <Input id="carbs" type="number" step="any" {...form.register('carbs')} placeholder="e.g., 50" className={cn(inputClasses, "h-9 text-sm")} disabled={!userWantsToOverrideMacros} />
                  {form.formState.errors.carbs && <p className={cn("text-xs text-destructive mt-1")}>{form.formState.errors.carbs.message}</p>}
                </div>
                <div>
                  <Label htmlFor="fat" className={cn(labelClasses, "text-xs", !userWantsToOverrideMacros && "text-muted-foreground/70")}>Fat (g)</Label>
                  <Input id="fat" type="number" step="any" {...form.register('fat')} placeholder="e.g., 20" className={cn(inputClasses, "h-9 text-sm")} disabled={!userWantsToOverrideMacros} />
                  {form.formState.errors.fat && <p className={cn("text-xs text-destructive mt-1")}>{form.formState.errors.fat.message}</p>}
                </div>
              </div>
               <p className={cn("text-xs mt-1 flex items-start gap-1.5", "text-muted-foreground")}>
                  <Info className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>If checked, values entered here will override AI estimates. If unchecked, AI will recalculate macros on update.</span>
                </p>
            </div>
          )}

          <DialogFooter className="pt-4 sticky bottom-0 bg-inherit">
            <DialogClose asChild>
              <Button type="button" variant="outline" className={currentCancelButtonClasses} disabled={isLoading || isIdentifyingPhoto}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className={submitButtonClasses} disabled={isLoading || isIdentifyingPhoto || (form.formState.isSubmitting || !form.formState.isValid && form.formState.isSubmitted) }>
              {isLoading ? <Loader2 className={cn("animate-spin h-5 w-5 mr-2", isGuestView ? "text-primary" : "text-primary-foreground" )} /> : <Sprout className={sproutSubmitIconClasses} />}
              {submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

